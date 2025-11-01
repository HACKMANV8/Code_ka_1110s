import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Question {
  id: number;
  type: 'mcq' | 'text' | 'multiple_select' | 'true_false';
  prompt: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  explanation?: string;
  topic?: string;
  difficulty?: string;
  marks?: number;
}

/**
 * POST /api/exam/explain-question
 * Get AI explanation for a specific exam question (from JSONB format)
 */
export async function POST(request: NextRequest) {
  try {
    const { question_id, session_id, include_context } = await request.json();

    if (!question_id || !session_id) {
      return NextResponse.json(
        { error: 'Missing question_id or session_id' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify student has access to this question
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('student_id, exam_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== session.student_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch exam with JSONB questions
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, name, questions')
      .eq('id', session.exam_id)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Find the question in the JSONB array
    const questions = exam.questions as Question[];
    const question = questions.find((q) => q.id === question_id);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Get student's answer if exists
    const { data: studentAnswer } = await supabase
      .from('student_answers')
      .select('*')
      .eq('session_id', session_id)
      .eq('question_id', question_id)
      .single();

    // Prepare prompt for AI
    const prompt = buildExplanationPrompt(question, studentAnswer);

    // Call Azure OpenAI for explanation
    const explanation = await getAzureExplanation(prompt);

    // Save to review history
    await supabase
      .from('exam_review_history')
      .insert({
        session_id,
        student_id: user.id,
        question_id: question_id,
        requested_ai_explanation: true,
        ai_explanation_text: explanation.text,
        ai_explanation_tokens: explanation.tokens,
      });

    return NextResponse.json({
      success: true,
      explanation: explanation.text,
      tokens_used: explanation.tokens,
      question: {
        text: question.prompt,
        type: question.type,
        topic: question.topic,
        difficulty: question.difficulty,
      },
      student_answer: studentAnswer,
    });

  } catch (error) {
    console.error('Explain question API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}

function buildExplanationPrompt(question: Question, studentAnswer: any): string {
  let prompt = `You are an expert educator providing detailed explanations for exam questions. 

Question Type: ${question.type}
${question.topic ? `Topic: ${question.topic}` : ''}
${question.difficulty ? `Difficulty: ${question.difficulty}` : ''}

Question: ${question.prompt}
`;

  // Add options for MCQ
  if ((question.type === 'mcq' || question.type === 'multiple_select' || question.type === 'true_false') && question.options) {
    prompt += `\nOptions:\n`;
    question.options.forEach((opt, idx) => {
      const letter = String.fromCharCode(65 + idx); // A, B, C, D...
      prompt += `${letter}. ${opt.text}${opt.isCorrect ? ' [CORRECT ANSWER]' : ''}\n`;
    });
  }

  // Add student's answer if provided
  if (studentAnswer) {
    prompt += `\n\nStudent's Answer: `;
    if (studentAnswer.text_answer) {
      prompt += studentAnswer.text_answer;
    } else if (studentAnswer.selected_options && studentAnswer.selected_options.length > 0) {
      prompt += studentAnswer.selected_options.join(', ');
    } else {
      prompt += 'Not answered';
    }
    
    prompt += `\nResult: ${studentAnswer.is_correct ? 'Correct ✓' : 'Incorrect ✗'}`;
    prompt += `\nMarks Obtained: ${studentAnswer.marks_obtained || 0}`;
  }

  // Add pre-written explanation if available
  if (question.explanation) {
    prompt += `\n\nInstructor's Notes: ${question.explanation}`;
  }

  prompt += `\n\nPlease provide a comprehensive explanation that:
1. Explains the correct answer and WHY it is correct
2. Identifies common misconceptions or mistakes${studentAnswer && !studentAnswer.is_correct ? ' (including why the student\'s answer was incorrect)' : ''}
3. Provides additional context or tips to understand this concept better
4. Uses simple, clear language suitable for students

Keep the explanation concise but thorough (200-300 words).`;

  return prompt;
}

async function getAzureExplanation(prompt: string): Promise<{ text: string; tokens: number }> {
  const apiKey =
    process.env.AZURE_OPENAI_CHAT_API_KEY ??
    process.env.AZURE_OPENAI_API_KEY;
  const endpoint =
    process.env.AZURE_OPENAI_CHAT_ENDPOINT ??
    process.env.AZURE_OPENAI_ENDPOINT;
  const deployment =
    process.env.AZURE_OPENAI_CHAT_DEPLOYMENT ??
    process.env.AZURE_OPENAI_DEPLOYMENT ??
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME ??
    process.env.AZURE_LLM_DEPLOYMENT;
  const apiVersion =
    process.env.AZURE_OPENAI_CHAT_API_VERSION ??
    process.env.AZURE_OPENAI_API_VERSION ??
    '2024-02-15-preview';
  
  if (!apiKey || !endpoint || !deployment) {
    throw new Error(
      'Azure OpenAI chat configuration is missing. Please set AZURE_OPENAI_CHAT_API_KEY, AZURE_OPENAI_CHAT_ENDPOINT, and AZURE_OPENAI_CHAT_DEPLOYMENT (or the legacy AZURE_OPENAI_* equivalents).'
    );
  }
  
  const normalizedEndpoint = endpoint.replace(/\/$/, '');
  const url = `${normalizedEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator providing detailed explanations for exam questions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      if (response.status === 401) {
        throw new Error('Azure OpenAI authentication failed. Check your API key.');
      } else if (response.status === 404) {
        throw new Error('Azure OpenAI deployment not found. Verify your deployment name.');
      } else if (response.status === 429) {
        throw new Error('Azure OpenAI rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Azure OpenAI API failed: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();

    const textContent = data.choices?.[0]?.message?.content?.trim() || 'No explanation generated';
    const tokens = data.usage?.total_tokens || 0;

    return {
      text: textContent,
      tokens,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Azure OpenAI request failed: ${String(error)}`);
  }
}

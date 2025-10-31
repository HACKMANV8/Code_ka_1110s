import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .eq('question_id', String(question_id))
      .single();

    // Prepare prompt for Azure OpenAI
    const prompt = buildExplanationPrompt(question, studentAnswer);

    // Call Azure OpenAI
    const explanation = await getAzureOpenAIExplanation(prompt);

    // Save to review history
    await supabase
      .from('exam_review_history')
      .insert({
        session_id,
        student_id: user.id,
        question_id: String(question_id),
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

async function getAzureOpenAIExplanation(prompt: string): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;

  // If Azure credentials are not available, fall back to Gemini
  if (!apiKey || !endpoint) {
    console.log('Azure OpenAI not configured, using Gemini instead');
    return getGeminiExplanation(prompt);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator who provides clear, concise, and helpful explanations for exam questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Azure OpenAI API error:', error);
    throw new Error('Failed to get explanation from Azure OpenAI');
  }

  const data = await response.json();
  
  return {
    text: data.choices[0].message.content,
    tokens: data.usage?.total_tokens || 0,
  };
}

async function getGeminiExplanation(prompt: string): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
  }

  // Use v1 endpoint with latest model (v1beta is deprecated)
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      
      if (response.status === 401) {
        throw new Error('Gemini API authentication failed. Check your API key.');
      } else if (response.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Gemini API failed: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected Gemini API response format:', data);
      throw new Error('Invalid response from Gemini API');
    }
    
    const textContent = data.candidates[0].content.parts[0]?.text || 'No explanation generated';
    const tokens = data.usageMetadata?.totalTokenCount || 0;
    
    return {
      text: textContent,
      tokens: tokens,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Gemini API request failed: ${String(error)}`);
  }
}

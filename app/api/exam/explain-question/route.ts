import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/exam/explain-question
 * Get AI explanation for a specific exam question
 */
export async function POST(request: NextRequest) {
  try {
    const { question_id, session_id, student_answer, include_context } = await request.json();

    if (!question_id || !session_id) {
      return NextResponse.json(
        { error: 'Missing question_id or session_id' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify student has access to this question
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('student_id, exam_id')
      .eq('id', session_id)
      .single();

    if (!session) {
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

    // Fetch question details with options
    const { data: question, error: questionError } = await supabase
      .from('exam_questions')
      .select(`
        *,
        options:question_options(*)
      `)
      .eq('id', question_id)
      .eq('exam_id', session.exam_id)
      .single();

    if (questionError || !question) {
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

    // Prepare prompt for Azure OpenAI
    const prompt = buildExplanationPrompt(question, studentAnswer, include_context);

    // Call Azure OpenAI
    const explanation = await getAzureOpenAIExplanation(prompt);

    // Save to review history
    await supabase
      .from('exam_review_history')
      .insert({
        session_id,
        student_id: user.id,
        question_id,
        requested_ai_explanation: true,
        ai_explanation_text: explanation.text,
        ai_explanation_tokens: explanation.tokens,
      });

    return NextResponse.json({
      success: true,
      explanation: explanation.text,
      tokens_used: explanation.tokens,
      question: {
        text: question.question_text,
        type: question.question_type,
        topic: question.topic,
        difficulty: question.difficulty_level,
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

function buildExplanationPrompt(question: any, studentAnswer: any, includeContext: boolean): string {
  let prompt = `You are an expert educator providing detailed explanations for exam questions. 

Question Type: ${question.question_type}
${question.topic ? `Topic: ${question.topic}` : ''}
${question.difficulty_level ? `Difficulty: ${question.difficulty_level}` : ''}

Question: ${question.question_text}
`;

  // Add options for MCQ
  if (question.question_type === 'mcq' || question.question_type === 'multiple_select') {
    prompt += `\nOptions:\n`;
    question.options?.forEach((opt: any) => {
      prompt += `${opt.option_label}. ${opt.option_text}${opt.is_correct ? ' [CORRECT]' : ''}\n`;
    });
  }

  // Add student's answer if provided
  if (studentAnswer) {
    prompt += `\n\nStudent's Answer: `;
    if (studentAnswer.selected_options && studentAnswer.selected_options.length > 0) {
      const selectedLabels = question.options
        ?.filter((opt: any) => studentAnswer.selected_options.includes(opt.id))
        .map((opt: any) => opt.option_label)
        .join(', ');
      prompt += `${selectedLabels}`;
      prompt += `\nResult: ${studentAnswer.is_correct ? 'Correct ✓' : 'Incorrect ✗'}`;
      prompt += `\nMarks: ${studentAnswer.marks_obtained}/${question.marks}`;
    } else if (studentAnswer.text_answer) {
      prompt += studentAnswer.text_answer;
    } else {
      prompt += 'Not answered';
    }
  }

  // Add pre-written explanation if available
  if (question.explanation) {
    prompt += `\n\nInstructor's Explanation: ${question.explanation}`;
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

  if (!apiKey || !endpoint) {
    throw new Error('Azure OpenAI credentials not configured');
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

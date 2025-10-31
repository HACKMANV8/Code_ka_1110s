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
 * POST /api/exam/ai-review
 * Get comprehensive AI review for the entire exam
 */
export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify student has access
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('student_id, exam_id, status')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if exam is submitted
    if (session.status === 'in_progress') {
      return NextResponse.json(
        { error: 'Cannot review exam that is still in progress' },
        { status: 400 }
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

    // Fetch exam with questions
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

    // Get exam results
    const { data: result } = await supabase
      .from('exam_results')
      .select('*')
      .eq('session_id', session_id)
      .single();

    // Get all student answers
    const { data: answers } = await supabase
      .from('student_answers')
      .select('*')
      .eq('session_id', session_id);

    const questions = exam.questions as Question[];
    
    // Build comprehensive prompt
    const prompt = buildComprehensiveReviewPrompt(
      exam.name,
      questions,
      answers || [],
      result
    );

    // Call Azure OpenAI
    const review = await getAzureOpenAIReview(prompt);

    // Save to review history
    await supabase
      .from('exam_review_history')
      .insert({
        session_id,
        student_id: user.id,
        question_id: null, // NULL for full exam review
        requested_ai_explanation: true,
        ai_explanation_text: review.text,
        ai_explanation_tokens: review.tokens,
      });

    return NextResponse.json({
      success: true,
      review: review.text,
      tokens_used: review.tokens,
      exam_name: exam.name,
      result_summary: result ? {
        percentage: result.percentage,
        grade: result.grade,
        correct_answers: result.correct_answers,
        total_questions: result.total_questions,
        focus_score: result.focus_score,
      } : null,
    });

  } catch (error) {
    console.error('AI Review API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI review' },
      { status: 500 }
    );
  }
}

function buildComprehensiveReviewPrompt(
  examName: string,
  questions: Question[],
  answers: any[],
  result: any
): string {
  let prompt = `You are an expert educator providing a comprehensive review of a student's exam performance.

Exam: ${examName}
`;

  if (result) {
    prompt += `
Performance Summary:
- Score: ${result.percentage}% (${result.marks_obtained}/${result.total_marks} marks)
- Grade: ${result.grade}
- Correct Answers: ${result.correct_answers}/${result.total_questions}
- Wrong Answers: ${result.wrong_answers}
- Focus Score: ${result.focus_score}%
- Status: ${result.pass_status ? 'PASSED' : 'FAILED'}
`;
  }

  prompt += `\n\nQuestion-by-Question Analysis:\n\n`;

  questions.forEach((question, index) => {
    const answer = answers.find(a => String(a.question_id) === String(question.id));
    
    prompt += `Question ${index + 1}: ${question.prompt}\n`;
    prompt += `Type: ${question.type}\n`;
    
    if (question.topic) prompt += `Topic: ${question.topic}\n`;
    if (question.difficulty) prompt += `Difficulty: ${question.difficulty}\n`;
    
    if (question.options) {
      prompt += `Options:\n`;
      question.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        prompt += `  ${letter}. ${opt.text}${opt.isCorrect ? ' ✓ [CORRECT]' : ''}\n`;
      });
    }
    
    if (answer) {
      prompt += `Student's Answer: `;
      if (answer.selected_options && answer.selected_options.length > 0) {
        prompt += `${answer.selected_options.join(', ')}\n`;
      } else if (answer.text_answer) {
        prompt += `${answer.text_answer}\n`;
      } else {
        prompt += `Not answered\n`;
      }
      prompt += `Result: ${answer.is_correct ? '✓ CORRECT' : '✗ INCORRECT'}\n`;
    } else {
      prompt += `Student's Answer: Not answered\n`;
    }
    
    prompt += `\n`;
  });

  prompt += `\nPlease provide:
1. Overall Performance Analysis - Strengths and areas for improvement
2. Question-by-Question Insights - For each incorrect answer, explain:
   - Why the student's answer was wrong
   - Why the correct answer is right
   - Key concepts the student should review
3. Study Recommendations - Specific topics and areas to focus on
4. Encouragement and Next Steps - Motivational advice and action items

Format your response in clear sections with markdown formatting.`;

  return prompt;
}

async function getAzureOpenAIReview(prompt: string): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';

  if (!apiKey || !endpoint) {
    throw new Error('Azure OpenAI credentials not configured');
  }

  const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;

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
          content: 'You are an expert educator providing comprehensive, encouraging, and insightful exam reviews to help students learn and improve.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Azure OpenAI API error:', errorText);
    throw new Error(`Azure OpenAI API failed: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    text: data.choices[0]?.message?.content || 'No review generated',
    tokens: data.usage?.total_tokens || 0,
  };
}

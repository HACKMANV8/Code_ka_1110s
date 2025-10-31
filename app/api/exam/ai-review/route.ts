import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const ragApiUrl = process.env.RAG_API_URL || 'http://localhost:8002';

    console.log('Generating AI review via Azure RAG service...');
    const ragReview = await getRAGReview(
      exam.name,
      questions,
      answers || [],
      result,
      ragApiUrl
    );

    // Persist review metadata (fire-and-forget)
    supabase
      .from('exam_review_history')
      .insert({
        session_id,
        student_id: user.id,
        question_id: null,
        requested_ai_explanation: true,
        ai_explanation_text: ragReview.text,
        ai_explanation_tokens: null,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Failed to save review history:', error);
        }
      });

    return NextResponse.json({
      review: ragReview.text,
      method: 'rag',
      sources: ragReview.sources || [],
    });

  } catch (error) {
    console.error('AI Review API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI review';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function getRAGReview(
  examName: string,
  questions: Question[],
  answers: any[],
  result: any,
  ragApiUrl: string
): Promise<{ text: string; sources?: any[] }> {
  try {
    const response = await fetch(`${ragApiUrl}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exam_name: examName,
        questions: questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          topic: question.topic,
          difficulty: question.difficulty,
          options: question.options?.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        })),
        answers: (answers || []).map((answer: any) => ({
          question_id: answer.question_id,
          selected_options: answer.selected_options,
          text_answer: answer.text_answer,
          is_correct: answer.is_correct,
        })),
        result,
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`RAG API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.answer) {
      throw new Error('RAG API returned an empty response');
    }

    return {
      text: data.answer,
      sources: data.sources
    };
  } catch (error: any) {
    console.error('RAG system error:', error);
    throw new Error(`RAG system unavailable: ${error.message}`);
  }
}


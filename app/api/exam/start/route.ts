import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/exam/start
 * Creates an exam session when student starts the exam
 */
export async function POST(request: NextRequest) {
  try {
    const { exam_id, student_id } = await request.json();

    if (!exam_id || !student_id) {
      return NextResponse.json(
        { error: 'Missing exam_id or student_id' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('exam_sessions')
      .select('id, status')
      .eq('exam_id', exam_id)
      .eq('student_id', student_id)
      .single();

    if (existingSession) {
      // Resume existing session if in_progress
      if (existingSession.status === 'in_progress') {
        return NextResponse.json({
          success: true,
          session_id: existingSession.id,
          resumed: true,
        });
      }
      
      // If already submitted, don't allow restart
      return NextResponse.json(
        { error: 'Exam already submitted' },
        { status: 400 }
      );
    }

    // Create new exam session
    const { data: newSession, error } = await supabase
      .from('exam_sessions')
      .insert({
        exam_id,
        student_id,
        status: 'in_progress',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Session creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create exam session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session_id: newSession.id,
      resumed: false,
    });

  } catch (error) {
    console.error('Start exam API error:', error);
    return NextResponse.json(
      { error: 'Failed to start exam' },
      { status: 500 }
    );
  }
}

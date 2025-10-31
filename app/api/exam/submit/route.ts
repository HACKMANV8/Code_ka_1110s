import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/exam/submit
 * Submits the exam and calculates final cheat score and exam results
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

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('exam_id, student_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get exam details with questions
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('questions')
      .eq('id', session.exam_id)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Get student answers
    const { data: answers, error: answersError } = await supabase
      .from('student_answers')
      .select('*')
      .eq('session_id', session_id);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
    }

    // Calculate exam results
    const questions = exam.questions || [];
    const totalQuestions = questions.length;
    const attemptedQuestions = answers?.length || 0;
    
    let correctAnswers = 0;
    let totalMarks = 0;
    let marksObtained = 0;

    // Calculate correct answers and marks
    questions.forEach((question: any, index: number) => {
      const questionId = question.id || (index + 1);
      const marks = question.marks || 1;
      totalMarks += marks;

      const answer = answers?.find(a => String(a.question_id) === String(questionId));
      
      if (answer) {
        // Check if answer is correct based on question type
        let isCorrect = false;
        
        if (question.type === 'mcq' && question.options && answer.selected_options) {
          const correctOptions = question.options
            .filter((opt: any) => opt.isCorrect)
            .map((opt: any) => opt.text);
          
          isCorrect = answer.selected_options.length === correctOptions.length &&
            answer.selected_options.every((selected: string) => correctOptions.includes(selected));
        } else if (question.type === 'true_false' && question.options && answer.selected_options) {
          const correctOption = question.options.find((opt: any) => opt.isCorrect);
          isCorrect = answer.selected_options.length === 1 && 
            answer.selected_options[0] === correctOption?.text;
        }
        
        if (isCorrect) {
          correctAnswers++;
          marksObtained += marks;
          
          // Update answer record with correct status
          supabase
            .from('student_answers')
            .update({ is_correct: true, marks_obtained: marks })
            .eq('id', answer.id)
            .then();
        } else {
          supabase
            .from('student_answers')
            .update({ is_correct: false, marks_obtained: 0 })
            .eq('id', answer.id)
            .then();
        }
      }
    });

    const wrongAnswers = attemptedQuestions - correctAnswers;
    const percentage = totalQuestions > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;

    // Determine grade
    let grade = 'F';
    let passStatus = false;
    if (percentage >= 90) {
      grade = 'A+';
      passStatus = true;
    } else if (percentage >= 85) {
      grade = 'A';
      passStatus = true;
    } else if (percentage >= 80) {
      grade = 'B+';
      passStatus = true;
    } else if (percentage >= 70) {
      grade = 'B';
      passStatus = true;
    } else if (percentage >= 60) {
      grade = 'C';
      passStatus = true;
    } else if (percentage >= 50) {
      grade = 'D';
      passStatus = true;
    }

    // Calculate average cheat score from all recorded scores
    const { data: scores, error: scoresError } = await supabase
      .from('cheat_scores')
      .select('score, confidence')
      .eq('session_id', session_id);

    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
    }

    // Calculate weighted average (higher confidence = more weight)
    let totalScore = 0;
    let totalWeight = 0;
    
    if (scores && scores.length > 0) {
      scores.forEach(({ score, confidence }) => {
        const weight = confidence || 50;
        totalScore += score * weight;
        totalWeight += weight;
      });
    }

    const finalCheatScore = totalWeight > 0 ? totalScore / totalWeight : 100;
    const focusScore = Math.round(finalCheatScore);
    
    // Determine proctoring status
    let proctoringStatus: 'clean' | 'suspicious' | 'flagged' = 'clean';
    if (focusScore < 60) {
      proctoringStatus = 'flagged';
    } else if (focusScore < 80) {
      proctoringStatus = 'suspicious';
    }

    // Update exam session
    const { error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        final_cheat_score: focusScore,
        status: proctoringStatus === 'flagged' ? 'flagged' : 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    // Create or update exam result
    const { error: resultError } = await supabase
      .from('exam_results')
      .upsert({
        session_id: session_id,
        student_id: session.student_id,
        exam_id: session.exam_id,
        total_questions: totalQuestions,
        attempted_questions: attemptedQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        total_marks: totalMarks,
        marks_obtained: marksObtained,
        percentage: percentage,
        grade: grade,
        pass_status: passStatus,
        cheat_score: 100 - focusScore, // Invert for cheat score
        focus_score: focusScore,
        proctoring_status: proctoringStatus,
        submitted_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id'
      });

    if (resultError) {
      console.error('Error creating result:', resultError);
    }

    return NextResponse.json({
      success: true,
      final_cheat_score: focusScore,
      focus_score: focusScore,
      status: proctoringStatus === 'flagged' ? 'flagged' : 'submitted',
      message: 'Exam submitted successfully',
      results: {
        total_questions: totalQuestions,
        attempted_questions: attemptedQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        total_marks: totalMarks,
        marks_obtained: marksObtained,
        percentage: percentage,
        grade: grade,
        pass_status: passStatus,
      }
    });

  } catch (error) {
    console.error('Submit exam API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit exam' },
      { status: 500 }
    );
  }
}

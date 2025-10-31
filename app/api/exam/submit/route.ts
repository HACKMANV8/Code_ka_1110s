import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/exam/submit
 * Submits the exam and calculates final cheat score and exam results
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { session_id, force_cheat_score, force_status } = payload;

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
        
        if (question.type === 'mcq') {
          // MCQ: Compare with correct option(s)
          if (question.options && answer.selected_options && answer.selected_options.length > 0) {
            const correctOptions = question.options
              .filter((opt: any) => opt && opt.isCorrect === true)
              .map((opt: any) => opt.text);
            
            // Check if student selected exactly the correct option(s)
            const selectedOptions = answer.selected_options.filter((opt: any) => opt);
            
            if (selectedOptions.length === correctOptions.length) {
              isCorrect = selectedOptions.every((selected: string) => 
                correctOptions.includes(selected)
              );
            }
          }
        } else if (question.type === 'true_false') {
          // True/False: Compare exact match
          if (question.options && answer.selected_options && answer.selected_options.length === 1) {
            const correctOption = question.options.find((opt: any) => opt && opt.isCorrect === true);
            isCorrect = correctOption && answer.selected_options[0] === correctOption.text;
          }
        } else if (question.type === 'text') {
          // Text questions: Mark as answered (not auto-graded)
          if (answer.text_answer && answer.text_answer.trim().length > 0) {
            isCorrect = true; // Assume correct since text needs manual review
          }
        }
        
        // Update answer record with correct status
        const updateData = {
          is_correct: isCorrect,
          marks_obtained: isCorrect ? marks : 0
        };
        
        // Fire and forget - don't block submission
        supabase
          .from('student_answers')
          .update(updateData)
          .eq('id', answer.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating answer:', error);
            }
          });
        
        // Update local counters
        if (isCorrect) {
          correctAnswers++;
          marksObtained += marks;
        }
      } else {
        // Question not answered: mark as incorrect with 0 marks
        // This is handled by not incrementing correctAnswers
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
        
        if (question.type === 'mcq') {
          // MCQ: Compare with correct option(s)
          if (question.options && answer.selected_options && answer.selected_options.length > 0) {
            const correctOptions = question.options
              .filter((opt: any) => opt && opt.isCorrect === true)
              .map((opt: any) => opt.text);
            
            // Check if student selected exactly the correct option(s)
            const selectedOptions = answer.selected_options.filter((opt: any) => opt);
            
            if (selectedOptions.length === correctOptions.length) {
              isCorrect = selectedOptions.every((selected: string) => 
                correctOptions.includes(selected)
              );
            }
          }
        } else if (question.type === 'true_false') {
          // True/False: Compare exact match
          if (question.options && answer.selected_options && answer.selected_options.length === 1) {
            const correctOption = question.options.find((opt: any) => opt && opt.isCorrect === true);
            isCorrect = correctOption && answer.selected_options[0] === correctOption.text;
          }
        } else if (question.type === 'text') {
          // Text questions: Mark as answered (not auto-graded)
          if (answer.text_answer && answer.text_answer.trim().length > 0) {
            isCorrect = true; // Assume correct since text needs manual review
          }
        }
        
        // Update answer record with correct status
        const updateData = {
          is_correct: isCorrect,
          marks_obtained: isCorrect ? marks : 0
        };
        
        // Fire and forget - don't block submission
        supabase
          .from('student_answers')
          .update(updateData)
          .eq('id', answer.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating answer:', error);
            }
          });
        
        // Update local counters
        if (isCorrect) {
          correctAnswers++;
          marksObtained += marks;
        }
      } else {
        // Question not answered: mark as incorrect with 0 marks
        // This is handled by not incrementing correctAnswers
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

    let finalCheatScore = 0;
    let finalStatus: 'submitted' | 'flagged' = 'submitted';

    if (typeof force_cheat_score === 'number') {
      finalCheatScore = Math.max(0, Math.min(100, Math.round(force_cheat_score)));
      if (force_status === 'submitted' || force_status === 'flagged') {
        finalStatus = force_status;
      } else {
        finalStatus = finalCheatScore > 60 ? 'flagged' : 'submitted';
      }
    } else {
      // Calculate average cheat score from all recorded scores
      const { data: scores, error: scoresError } = await supabase
        .from('cheat_scores')
        .select('score, confidence')
        .eq('session_id', session_id);

      if (scoresError) {
        console.error('Error fetching scores:', scoresError);
        return NextResponse.json(
          { error: 'Failed to calculate cheat score' },
          { status: 500 }
        );
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

    // IMPORTANT: cheat_scores table contains CHEAT_SCORE (0-100, where 0=good, 100=bad)
    // But exam_results.focus_score should be inverted (0=bad, 100=good)
    // So: focus_score = 100 - cheat_score
    const cheatScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const focusScore = Math.round(100 - cheatScore);
    
    // If no scores were recorded during exam, assume clean exam (100 focus)
    const finalFocusScore = scores && scores.length > 0 ? focusScore : 100;
    
    // Determine proctoring status (updated thresholds)
    let proctoringStatus: 'clean' | 'suspicious' | 'flagged' = 'clean';
    if (finalFocusScore < 45) {
      // Flagged: score < 45 (critical suspicious activity)
      proctoringStatus = 'flagged';
    } else if (finalFocusScore < 70) {
      // Suspicious: score 45-69 (moderate suspicious activity)
      proctoringStatus = 'suspicious';
    }
    // Clean: score >= 70 (normal behavior)

    // Update exam session
    const { error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        final_cheat_score: finalFocusScore,
        status: proctoringStatus === 'flagged' ? 'flagged' : 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // Create exam result (insert only, don't use upsert)
    // NOTE: 'percentage' is a GENERATED ALWAYS column, so do not include it in insert/update
    const resultData = {
      session_id: session_id,
      student_id: session.student_id,
      exam_id: session.exam_id,
      total_questions: totalQuestions,
      attempted_questions: attemptedQuestions,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      total_marks: totalMarks,
      marks_obtained: marksObtained,
      // percentage is auto-calculated: GENERATED ALWAYS AS (marks_obtained / total_marks * 100)
      grade: grade,
      pass_status: passStatus,
      cheat_score: Math.round(cheatScore),  // Store original cheat score (0-100, 0=good, 100=bad)
      focus_score: finalFocusScore,  // Store inverted focus score (0-100, 100=good)
      proctoring_status: proctoringStatus,
      submitted_at: new Date().toISOString(),
    };

    // Try to insert, if it exists update it
    const { data: existingResult } = await supabase
      .from('exam_results')
      .select('id')
      .eq('session_id', session_id)
      .single();

    let resultError = null;
    if (existingResult) {
      // Update existing
      const { error: updateResultError } = await supabase
        .from('exam_results')
        .update(resultData)
        .eq('session_id', session_id);
      resultError = updateResultError;
    } else {
      // Insert new
      const { error: insertResultError } = await supabase
        .from('exam_results')
        .insert(resultData);
      resultError = insertResultError;
    }

    if (resultError) {
      console.error('Error saving exam results:', resultError);
      return NextResponse.json(
        { error: 'Failed to save exam results: ' + resultError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      final_cheat_score: finalFocusScore,  // This is the focus score to display
      focus_score: finalFocusScore,
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

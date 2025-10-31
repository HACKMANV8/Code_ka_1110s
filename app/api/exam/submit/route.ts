import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/exam/submit
 * Submits the exam and calculates final cheat score
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
        const weight = confidence || 50; // Default confidence
        totalScore += score * weight;
        totalWeight += weight;
      });
    }

    const finalCheatScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Update exam session
    const { error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        final_cheat_score: Math.round(finalCheatScore),
        status: finalCheatScore > 60 ? 'flagged' : 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json(
        { error: 'Failed to submit exam' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      final_cheat_score: Math.round(finalCheatScore),
      status: finalCheatScore > 60 ? 'flagged' : 'submitted',
      message: 'Exam submitted successfully',
    });

  } catch (error) {
    console.error('Submit exam API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit exam' },
      { status: 500 }
    );
  }
}

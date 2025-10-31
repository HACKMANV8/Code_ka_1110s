import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/exam/analyze-batch
 * Saves batch of cheat scores to database (called periodically from client)
 * This reduces database writes while maintaining real-time WebSocket analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, student_id, scores } = body;

    if (!session_id || !student_id || !scores || !Array.isArray(scores)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save batch of cheat scores to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Prepare batch insert data
    const cheatScoresData = scores.map((score: any) => ({
      session_id,
      score: 100 - score.focus_score, // Invert: 0 = focused, 100 = cheating
      confidence: score.raw_frame_score || score.focus_score,
      detected_behavior: score.alerts || [],
    }));

    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/cheat_scores`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(cheatScoresData),
      }
    );

    if (!dbResponse.ok) {
      console.error('Failed to save cheat scores:', await dbResponse.text());
      return NextResponse.json(
        { error: 'Failed to save scores' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${scores.length} cheat scores`,
    });

  } catch (error) {
    console.error('Analyze batch API error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { scores, sessionId } = await request.json()

    console.log('[Analyze Batch] Received:', { sessionId, scoreCount: scores?.length })

    if (!scores || !Array.isArray(scores) || !sessionId) {
      console.error('[Analyze Batch] Invalid payload:', { hasScores: !!scores, isArray: Array.isArray(scores), hasSessionId: !!sessionId })
      return NextResponse.json(
        { error: 'Missing scores or sessionId' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify session belongs to user
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('student_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    // Insert batch scores
    const cheatScores = scores.map((score: any) => ({
      session_id: sessionId,
      score: score.focus_score || 0,
      confidence: score.confidence || 0,
      detected_behavior: score.alerts || [],
      timestamp: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('cheat_scores')
      .insert(cheatScores)

    if (error) {
      console.error('Error saving scores:', error)
      return NextResponse.json(
        { error: 'Failed to save scores' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in analyze-batch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/snapshots
 * Fetch suspicious snapshots filtered by student ID
 * 
 * Query params:
 * - studentId: UUID of the student
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing studentId parameter' },
        { status: 400 }
      );
    }

    // Step 1: Get all exam sessions for this student
    const { data: sessions, error: sessionsError } = await supabase
      .from('exam_sessions')
      .select('id, exam_id, started_at, submitted_at, status')
      .eq('student_id', studentId)
      .order('started_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch exam sessions' },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        snapshots: [],
        message: 'No exam sessions found for this student'
      });
    }

    const sessionIds = sessions.map(s => s.id);

    // Step 2: Get snapshots for all these sessions
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('suspicious_snapshots')
      .select('*')
      .in('session_id', sessionIds)
      .order('captured_at', { ascending: false });

    if (snapshotsError) {
      console.error('Error fetching snapshots:', snapshotsError);
      return NextResponse.json(
        { error: 'Failed to fetch snapshots' },
        { status: 500 }
      );
    }

    if (!snapshots || snapshots.length === 0) {
      return NextResponse.json({
        snapshots: [],
        message: `Found ${sessions.length} exam session(s) but no suspicious snapshots were captured`
      });
    }

    // Step 3: Get student info
    const { data: student } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', studentId)
      .single();

    // Step 4: Get exam info for each session
    const sessionMap = new Map(sessions.map(s => [s.id, s]));
    const examIds = [...new Set(sessions.map(s => s.exam_id))];
    
    const { data: exams } = await supabase
      .from('exams')
      .select('id, name, start_time, end_time')
      .in('id', examIds);

    const examMap = new Map(exams?.map(e => [e.id, e]) || []);

    // Step 5: Generate signed URLs for each snapshot
    const enrichedSnapshots = await Promise.all(
      snapshots.map(async (snapshot) => {
        const session = sessionMap.get(snapshot.session_id);
        const exam = session ? examMap.get(session.exam_id) : null;

        // Generate signed URL for the image
        let imageUrl = null;
        if (snapshot.storage_path) {
          const { data: signedUrlData } = await supabase.storage
            .from('exam-snapshots')
            .createSignedUrl(snapshot.storage_path, 3600); // 1 hour expiry

          if (signedUrlData) {
            imageUrl = signedUrlData.signedUrl;
          }
        }

        return {
          id: snapshot.id,
          session_id: snapshot.session_id,
          storage_path: snapshot.storage_path,
          captured_at: snapshot.captured_at,
          created_at: snapshot.created_at,
          image_url: imageUrl,
          student: {
            id: studentId,
            name: student?.full_name || 'Unknown Student'
          },
          exam: exam ? {
            id: exam.id,
            name: exam.name,
            start_time: exam.start_time,
            end_time: exam.end_time
          } : null,
          session_status: session?.status || 'unknown',
          submitted_at: session?.submitted_at || null
        };
      })
    );

    return NextResponse.json({
      snapshots: enrichedSnapshots,
      total: enrichedSnapshots.length,
      sessions: sessions.length
    });

  } catch (error: any) {
    console.error('Error in snapshots API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

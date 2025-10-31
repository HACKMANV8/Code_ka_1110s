import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get search parameters
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')
    const sessionId = searchParams.get('sessionId')
    const examId = searchParams.get('examId')
    const studentEmail = searchParams.get('studentEmail')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('suspicious_snapshots')
      .select(`
        id,
        session_id,
        storage_path,
        captured_at,
        created_at,
        exam_sessions!inner (
          id,
          exam_id,
          student_id,
          status,
          submitted_at,
          profiles!exam_sessions_student_id_fkey (
            id,
            full_name,
            email:id
          ),
          exams (
            id,
            title,
            start_time,
            end_time
          )
        )
      `)
      .order('captured_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    if (studentId) {
      query = query.eq('exam_sessions.student_id', studentId)
    }

    if (examId) {
      query = query.eq('exam_sessions.exam_id', examId)
    }

    const { data: snapshots, error } = await query

    if (error) {
      console.error('Error fetching snapshots:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter by email if provided (since we can't filter on email directly in Supabase query)
    let filteredSnapshots = snapshots
    if (studentEmail) {
      // We need to fetch user emails separately
      const studentIds = [...new Set(snapshots?.map((s: any) => s.exam_sessions.student_id))]
      const { data: users } = await supabase.auth.admin.listUsers()
      
      const emailToIdMap = new Map(
        users.users
          .filter(u => u.email?.toLowerCase().includes(studentEmail.toLowerCase()))
          .map(u => [u.id, u.email])
      )

      filteredSnapshots = snapshots?.filter((s: any) => 
        emailToIdMap.has(s.exam_sessions.student_id)
      )
    }

    // Get signed URLs for snapshots
    const snapshotsWithUrls = await Promise.all(
      (filteredSnapshots || []).map(async (snapshot: any) => {
        let imageUrl = null
        
        // Try to get signed URL from storage
        try {
          console.log(`Creating signed URL for: ${snapshot.storage_path}`)
          const { data: urlData, error: storageError } = await supabase.storage
            .from('exam-snapshots')
            .createSignedUrl(snapshot.storage_path, 3600) // 1 hour expiry
          
          if (storageError) {
            console.error(`Storage error for ${snapshot.storage_path}:`, storageError)
            
            // Fallback: Try public URL since bucket is public
            const { data: publicUrlData } = supabase.storage
              .from('exam-snapshots')
              .getPublicUrl(snapshot.storage_path)
            
            if (publicUrlData?.publicUrl) {
              imageUrl = publicUrlData.publicUrl
              console.log(`✅ Using public URL for ${snapshot.storage_path}`)
            }
          } else if (urlData?.signedUrl) {
            imageUrl = urlData.signedUrl
            console.log(`✅ Created signed URL for ${snapshot.storage_path}`)
          } else {
            console.warn(`⚠️ No signed URL returned for ${snapshot.storage_path}`)
            
            // Fallback: Try public URL
            const { data: publicUrlData } = supabase.storage
              .from('exam-snapshots')
              .getPublicUrl(snapshot.storage_path)
            
            if (publicUrlData?.publicUrl) {
              imageUrl = publicUrlData.publicUrl
              console.log(`✅ Using public URL fallback for ${snapshot.storage_path}`)
            }
          }
        } catch (error) {
          console.error(`Error creating signed URL for ${snapshot.storage_path}:`, error)
          
          // Final fallback: Try public URL
          try {
            const { data: publicUrlData } = supabase.storage
              .from('exam-snapshots')
              .getPublicUrl(snapshot.storage_path)
            
            if (publicUrlData?.publicUrl) {
              imageUrl = publicUrlData.publicUrl
              console.log(`✅ Using public URL as final fallback for ${snapshot.storage_path}`)
            }
          } catch (fallbackError) {
            console.error(`All URL generation methods failed for ${snapshot.storage_path}`)
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
            id: snapshot.exam_sessions.student_id,
            name: snapshot.exam_sessions.profiles?.full_name || 'Unknown',
          },
          exam: {
            id: snapshot.exam_sessions.exams?.id,
            title: snapshot.exam_sessions.exams?.title || 'Unknown Exam',
            start_time: snapshot.exam_sessions.exams?.start_time,
            end_time: snapshot.exam_sessions.exams?.end_time,
          },
          session_status: snapshot.exam_sessions.status,
          submitted_at: snapshot.exam_sessions.submitted_at,
        }
      })
    )

    console.log(`Found ${snapshotsWithUrls.length} snapshots`)
    console.log(`Snapshots with images: ${snapshotsWithUrls.filter(s => s.image_url).length}`)

    return NextResponse.json({
      snapshots: snapshotsWithUrls,
      total: snapshotsWithUrls.length,
      message: snapshotsWithUrls.length === 0 
        ? 'No snapshots found. Snapshots are captured during exams when suspicious activity is detected.' 
        : undefined
    })

  } catch (error: any) {
    console.error('Error in snapshots route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

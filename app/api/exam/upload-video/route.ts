import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/exam/upload-video
 * Uploads video clip to Supabase Storage when cheating is detected
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoBlob = formData.get('video') as Blob;
    const session_id = formData.get('session_id') as string;
    const student_id = formData.get('student_id') as string;
    const timestamp = formData.get('timestamp') as string;

    if (!videoBlob || !session_id || !student_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate unique filename
    const filename = `${student_id}/${session_id}/${timestamp}.webm`;
    const storagePath = `exam-videos/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('exam-recordings')
      .upload(storagePath, videoBlob, {
        contentType: 'video/webm',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload video' },
        { status: 500 }
      );
    }

    // Get video size
    const videoSize = videoBlob.size;

    // Save video metadata to database
    const { error: dbError } = await supabase
      .from('video_metadata')
      .insert({
        session_id,
        storage_path: storagePath,
        file_size_bytes: videoSize,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue even if DB insert fails - video is already uploaded
    }

    return NextResponse.json({
      success: true,
      storage_path: storagePath,
      message: 'Video uploaded successfully',
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

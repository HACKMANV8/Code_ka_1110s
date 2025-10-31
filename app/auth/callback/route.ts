import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      
      // If no profile exists, create one (for OAuth users)
      if (!profile) {
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
            role: 'student'
          })
      }
      
      const role = profile?.role || 'student'
      const redirectPath = role === 'admin' ? '/admin' : '/dashboard'
      return NextResponse.redirect(${origin}${redirectPath})
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(${origin}/login?error=authentication_failed)
}
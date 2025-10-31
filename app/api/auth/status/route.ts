import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No user found' 
      })
    }

    // Check if profiles table exists and get user profile
    let profile = null
    let profileError = null
    
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      profile = profileData
      profileError = error
    } catch (err) {
      profileError = err
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile,
      profileError: profileError ? String(profileError) : null,
      hasProfile: !!profile,
      isAdmin: profile?.role === 'admin'
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    )
  }
}
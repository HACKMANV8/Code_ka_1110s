import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user role from profiles table
  let userRole = 'student'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    userRole = profile?.role || 'student'
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect dashboard routes (require authentication)
  if (
    (request.nextUrl.pathname.startsWith('/dashboard') || 
     request.nextUrl.pathname.startsWith('/admin')) && 
    !user
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
    const redirectPath = userRole === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return response
}
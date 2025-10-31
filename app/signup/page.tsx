'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isDark, setIsDark] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setIsDark(false)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student', // All users are students by default
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Show email verification message
    if (data.user) {
      setUserEmail(email)
      setShowVerificationMessage(true)
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // If verification message should be shown, display it
  if (showVerificationMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#19191C] p-4">
        <div className="max-w-xl w-full space-y-5 bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-[#FD366E]/20 to-[#FF6B9D]/20 mb-4">
              <svg className="h-8 w-8 text-[#FD366E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Check Your Email
            </h2>
            <p className="text-sm text-white/70 mb-4">
              We&apos;ve sent a verification email to:
            </p>
            <p className="text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] mb-6">
              {userEmail}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-base text-white flex items-center gap-2">
              <span className="text-lg"> </span> Next Steps
            </h3>
            <ol className="space-y-2.5 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-[#FD366E] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Open your email inbox (check spam/junk folder if needed)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-[#FD366E] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Click the verification link to confirm your account</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-[#FD366E] to-[#FF6B9D] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Come back and sign in to access your dashboard</span>
              </li>
            </ol>
          </div>

          <div className="bg-[#FD366E]/10 border border-[#FD366E]/30 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">⚠</span>
              <div className="text-xs text-white/80">
                <p className="font-semibold mb-1">Important:</p>
                <p>You must verify your email before signing in. The link expires in 24 hours.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/login"
              className="w-full flex justify-center py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] text-white hover:shadow-lg hover:shadow-pink-500/30 transition-all font-semibold text-sm"
            >
              Go to Sign In
            </Link>
            <button
              onClick={() => setShowVerificationMessage(false)}
              className="text-xs text-white/60 hover:text-white/90 underline"
            >
              Didn&apos;t receive the email? Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-300 bg-[#19191C] p-4">
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>
      <div className="max-w-md w-full space-y-6 bg-white/5 border-white/10 border p-8 rounded-2xl backdrop-blur-sm">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FD366E] to-[#FF6B9D] rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/20">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-xl text-white">ExamProctor</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Create your account
          </h2>
          <p className="text-sm text-white/60">
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-[#FD366E] hover:text-[#FF6B9D] transition-colors"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleEmailSignup}>
          {error && (
            <div className="rounded-lg bg-red-500/10 border-red-500/30 border p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-white/80 mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full px-4 py-2.5 bg-white/5 border-white/10 text-white placeholder-white/40 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FD366E] focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-2.5 bg-white/5 border-white/10 text-white placeholder-white/40 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FD366E] focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-2.5 bg-white/5 border-white/10 text-white placeholder-white/40 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FD366E] focus:border-transparent transition-all"
                placeholder="Create a password (min. 6 characters)"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] hover:shadow-lg hover:shadow-pink-500/30 focus:outline-none focus:ring-2 focus:ring-[#FD366E] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#19191C] text-white/60">Or continue with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#FD366E] disabled:opacity-50 disabled:cursor-not-allowed border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>
          </div>
        </form>

        <p className="text-xs text-center text-white/50">
          <span>All new users are registered as students by default</span>
        </p>
      </div>
    </div>
  )
}


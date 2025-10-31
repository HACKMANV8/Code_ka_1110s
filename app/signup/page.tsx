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



  // If verification message should be shown, display it
  if (showVerificationMessage) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className={`max-w-xl w-full space-y-5 border p-8 rounded-2xl ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-xl mb-4 ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
              <svg className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Check Your Email
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              We&apos;ve sent a verification email to:
            </p>
            <p className={`text-base font-semibold mb-6 text-transparent bg-clip-text ${isDark ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
              {userEmail}
            </p>
          </div>

          <div className={`border p-5 space-y-3 rounded-xl ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
            <h3 className={`font-semibold text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-lg">✓</span> Next Steps
            </h3>
            <ol className={`space-y-2.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-start gap-2.5">
                <span className={`flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold`}>1</span>
                <span>Open your email inbox (check spam/junk folder if needed)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className={`flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold`}>2</span>
                <span>Click the verification link to confirm your account</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className={`flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold`}>3</span>
                <span>Come back and sign in to access your dashboard</span>
              </li>
            </ol>
          </div>

          <div className={`border p-4 rounded-xl ${isDark ? 'bg-amber-600/10 border-amber-600/30' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-start gap-2.5">
              <span className="text-lg">⚠</span>
              <div className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                <p className="font-semibold mb-1">Important:</p>
                <p>You must verify your email before signing in. The link expires in 24 hours.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/login"
              className="w-full flex justify-center py-2.5 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-semibold text-sm"
            >
              Go to Sign In
            </Link>
            <button
              onClick={() => setShowVerificationMessage(false)}
              className={`text-xs underline ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Didn&apos;t receive the email? Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 p-4 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          aria-label="Toggle theme"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
      <div className={`max-w-md w-full space-y-6 border p-8 rounded-2xl ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-400/20">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Drishti</span>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Create your account
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleEmailSignup}>
          {error && (
            <div className={`rounded-lg border p-3 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`block w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${isDark ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
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
                className={`block w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${isDark ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
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
                className={`block w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${isDark ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                placeholder="Create a password (min. 6 characters)"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>

        <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>All new users are registered as students by default</span>
        </p>
      </div>
    </div>
  )
}


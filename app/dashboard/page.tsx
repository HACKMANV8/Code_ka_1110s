'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Exam } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const [isDark, setIsDark] = useState(true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem('theme')
      setIsDark(theme !== 'light')
    }
  }, [])
  const toggleTheme = () => {
    setIsDark((prev) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', prev ? 'light' : 'dark')
      }
      return !prev
    })
  }
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [completedExams, setCompletedExams] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      if (activeTab === 'available') {
        fetchExams()
      } else {
        fetchCompletedExams()
      }
    }
  }, [user, activeTab])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // Check user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Redirect admins to admin dashboard
    if (profile?.role === 'admin') {
      router.push('/admin')
      return
    }

    setUser(user)
    setLoading(false)
  }

  const fetchExams = async () => {
    if (!user) return
    
    const now = new Date().toISOString()
    
    // First, get completed exam IDs for this user
    const { data: completedSessions } = await supabase
      .from('exam_sessions')
      .select('exam_id')
      .eq('student_id', user.id)
      .not('submitted_at', 'is', null)
    
    const completedExamIds = completedSessions?.map(s => s.exam_id) || []
    
    // Fetch exams that are not yet completed by this user
    let query = supabase
      .from('exams')
      .select('*')
      .gte('end_time', now)
      .order('start_time', { ascending: true })
    
    // Filter out completed exams if there are any
    if (completedExamIds.length > 0) {
      query = query.not('id', 'in', `(${completedExamIds.join(',')})`)
    }
    
    const { data } = await query
    
    setExams(data || [])
  }

  const fetchCompletedExams = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('exam_sessions')
      .select(`
        id,
        session_id,
        final_cheat_score,
        status,
        submitted_at,
        exam_id,
        exams (
          id,
          title,
          description,
          duration_minutes
        )
      `)
      .eq('student_id', user.id)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching completed exams:', error)
    }

    console.log('Completed exams data:', data)
    setCompletedExams(data || [])
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExamActive = (exam: Exam) => {
    const now = new Date()
    const start = new Date(exam.start_time)
    const end = new Date(exam.end_time)
    return now >= start && now <= end
  }

  const isExamUpcoming = (exam: Exam) => {
    const now = new Date()
    const start = new Date(exam.start_time)
    return now < start
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}> 
        <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading...</div>
      </div>
    )
  }

  return (
  <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-white'}`}> 
      {/* Navigation */}
      <nav className={`border-b backdrop-blur-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300'}`}>STUDENT</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{user?.user_metadata?.full_name || user?.email}</span>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                aria-label="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <button onClick={handleSignOut} className={`text-sm font-medium transition-colors ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>Sign out</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome, {user?.user_metadata?.full_name || 'Student'}!</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>View and take your scheduled exams</p>
        </div>

        {/* Tabs */}
        <div className={`mb-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'available' ? `border-blue-600 ${isDark ? 'text-blue-400' : 'text-blue-600'}` : isDark ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Available Exams
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'completed' ? `border-blue-600 ${isDark ? 'text-blue-400' : 'text-blue-600'}` : isDark ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Completed Exams
            </button>
          </nav>
        </div>

        {/* Exams List */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {exams.length === 0 ? (
              <div className={`border rounded-lg shadow p-12 text-center ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <svg className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Available Exams</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Check back later for scheduled exams</p>
              </div>
            ) : (
              exams.map((exam) => (
                <div
                  key={exam.id}
                  className={`border rounded-lg shadow hover:shadow-lg transition-all p-6 ${isDark ? 'bg-slate-800/30 border-slate-700 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-400'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{exam.title}</h3>
                        {isExamActive(exam) && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 border ${isDark ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-green-100 text-green-700 border-green-300'}`}> 
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            LIVE
                          </span>
                        )}
                        {isExamUpcoming(exam) && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300'}`}>UPCOMING</span>
                        )}
                      </div>
                      {exam.description && (
                        <p className={isDark ? 'text-gray-400 mb-4' : 'text-gray-600 mb-4'}>{exam.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Start Time</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(exam.start_time)}</p>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duration</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{exam.duration_minutes} minutes</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      {isExamActive(exam) ? (
                        <button 
                          onClick={() => router.push(`/exam/${exam.id}`)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                        >
                          Start Exam
                        </button>
                      ) : isExamUpcoming(exam) ? (
                        <button disabled className={`px-6 py-3 rounded-lg font-medium border cursor-not-allowed ${isDark ? 'bg-slate-700/50 text-gray-500 border-slate-600' : 'bg-gray-100 text-gray-400 border-gray-300'}`}>Not Started</button>
                      ) : (
                        <button disabled className={`px-6 py-3 rounded-lg font-medium border cursor-not-allowed ${isDark ? 'bg-slate-700/50 text-gray-500 border-slate-600' : 'bg-gray-100 text-gray-400 border-gray-300'}`}>Ended</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedExams.length === 0 ? (
              <div className={`border rounded-lg shadow p-12 text-center ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <svg className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Completed Exams</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Your completed exams will appear here</p>
              </div>
            ) : (
              completedExams.map((session: any) => (
                <div
                  key={session.id}
                  className={`border rounded-lg shadow hover:shadow-lg transition-all p-6 ${isDark ? 'bg-slate-800/30 border-slate-700 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-400'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{session.exams?.title || 'Exam'}</h3>
                        {session.status === 'flagged' ? (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 border ${isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-700 border-red-300'}`}>
                            <span>⚠️</span>
                            FLAGGED
                          </span>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 border ${isDark ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-green-100 text-green-700 border-green-300'}`}>
                            <span>✓</span>
                            SUBMITTED
                          </span>
                        )}
                      </div>
                      {session.exams?.description && (
                        <p className={isDark ? 'text-gray-400 mb-4' : 'text-gray-600 mb-4'}>{session.exams.description}</p>
                      )}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Submitted</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(session.submitted_at)}</p>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cheat Score</p>
                          <p className={`text-sm font-medium ${
                            session.final_cheat_score >= 30 
                              ? 'text-red-400' 
                              : session.final_cheat_score >= 15 
                              ? 'text-yellow-400' 
                              : 'text-green-400'
                          }`}>
                            {session.final_cheat_score}%
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duration</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{session.exams?.duration_minutes || 'N/A'} min</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <button 
                        onClick={() => router.push(`/exam/${session.exams?.id}/results?score=${session.final_cheat_score}&status=${session.status}&sessionId=${session.session_id}`)}
                        className={`px-6 py-3 rounded-lg transition-all font-medium border ${isDark ? 'bg-slate-700/50 text-white border-slate-600 hover:bg-slate-700' : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'}`}
                      >
                        View Results
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}

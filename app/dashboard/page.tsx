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
  const [activeTab, setActiveTab] = useState<'exams' | 'analysis'>('exams')
  const [examResults, setExamResults] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>({
    totalExams: 0,
    averageScore: 0,
    totalTime: 0,
    flaggedSessions: 0
  })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      if (activeTab === 'exams') {
        fetchExams()
      } else if (activeTab === 'analysis') {
        fetchAnalytics()
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
          name,
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

  const fetchAnalytics = async () => {
    if (!user) return

    try {
      // Fetch exam sessions for analytics
      const { data: sessions, error } = await supabase
        .from('exam_sessions')
        .select(`
          id,
          final_cheat_score,
          status,
          submitted_at,
          started_at,
          exam_id,
          exams (
            id,
            name,
            duration_minutes
          )
        `)
        .eq('student_id', user.id)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error fetching analytics:', error)
        return
      }

      const examSessions = sessions || []
      
      // Calculate analytics
      const totalExams = examSessions.length
      const averageScore = totalExams > 0 
        ? examSessions.reduce((sum, session) => sum + (100 - (session.final_cheat_score || 0)), 0) / totalExams
        : 0
      
      const flaggedSessions = examSessions.filter(session => session.status === 'flagged').length
      
      // Calculate total time spent
      const totalTime = examSessions.reduce((sum, session) => {
        if (session.started_at && session.submitted_at) {
          const startTime = new Date(session.started_at).getTime()
          const endTime = new Date(session.submitted_at).getTime()
          return sum + Math.round((endTime - startTime) / (1000 * 60)) // minutes
        }
        return sum
      }, 0)

      setAnalytics({
        totalExams,
        averageScore: Math.round(averageScore),
        totalTime,
        flaggedSessions
      })

      setExamResults(examSessions)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
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
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Take scheduled exams and view your performance analytics</p>
        </div>

        {/* Tabs */}
        <div className={`mb-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('exams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'exams' ? `border-blue-600 ${isDark ? 'text-blue-400' : 'text-blue-600'}` : isDark ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Available Exams
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'analysis' ? `border-blue-600 ${isDark ? 'text-blue-400' : 'text-blue-600'}` : isDark ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analysis Dashboard
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'exams' && (
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
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{exam.name}</h3>
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

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <svg className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Exams</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{analytics.totalExams}</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                    <svg className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Average Score</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{analytics.averageScore}%</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <svg className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Time</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{analytics.totalTime}m</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${analytics.flaggedSessions > 0 ? isDark ? 'bg-red-500/20' : 'bg-red-100' : isDark ? 'bg-gray-500/20' : 'bg-gray-100'}`}>
                    <svg className={`w-6 h-6 ${analytics.flaggedSessions > 0 ? isDark ? 'text-red-400' : 'text-red-600' : isDark ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Flagged</p>
                    <p className={`text-2xl font-bold ${analytics.flaggedSessions > 0 ? isDark ? 'text-red-400' : 'text-red-600' : isDark ? 'text-white' : 'text-gray-900'}`}>{analytics.flaggedSessions}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam History */}
            <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Exam History</h3>
              
              {examResults.length === 0 ? (
                <div className="text-center py-8">
                  <svg className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No exam data available yet</p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Complete some exams to see your performance analytics</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {examResults.slice(0, 5).map((session: any) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          session.status === 'flagged' 
                            ? 'bg-red-500' 
                            : session.final_cheat_score >= 30
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}></div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{session.exams?.name || 'Unknown Exam'}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {formatDate(session.submitted_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Focus Score</p>
                          <p className={`font-semibold ${
                            session.final_cheat_score <= 10 
                              ? 'text-green-500' 
                              : session.final_cheat_score <= 25 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                          }`}>
                            {100 - session.final_cheat_score}%
                          </p>
                        </div>
                        <button 
                          onClick={() => router.push(`/exam/${session.exams?.id}/results?score=${session.final_cheat_score}&status=${session.status}&sessionId=${session.session_id}`)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

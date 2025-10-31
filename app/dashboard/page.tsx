'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Exam } from '@/lib/types/database'

export default function DashboardPage() {
  const [isDark, setIsDark] = useState(true)
  useEffect(() => {
    const theme = localStorage.getItem('theme')
    setIsDark(theme !== 'light')
  }, [])
  const toggleTheme = () => {
    setIsDark((prev) => {
      localStorage.setItem('theme', prev ? 'light' : 'dark')
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
      <div className={`min-h-screen flex items-center justify-center bg-[#19191C]`}> 
        <div className={isDark ? 'text-white/60' : 'text-gray-600'}>Loading...</div>
      </div>
    )
  }

  return (
  <div className={`min-h-screen transition-colors duration-300 bg-[#19191C]`}> 
      {/* Navigation */}
      <nav className={`bg-white/5 border-white/10 backdrop-blur-md shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <h1 className={`text-xl font-bold text-white`}>Student Dashboard</h1>
              <span className="px-3 py-1 bg-gradient-to-r from-[#FD366E]/20 to-[#FF6B9D]/20 text-[#FD366E] text-xs font-semibold rounded-full border border-[#FD366E]/30">STUDENT</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm text-white/70`}>{user?.user_metadata?.full_name || user?.email}</span>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20`}
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
              <button onClick={handleSignOut} className={`text-sm font-medium text-red-400 hover:text-red-300`}>Sign out</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className={`text-3xl font-bold mb-2 text-white`}>Welcome, {user?.user_metadata?.full_name || 'Student'}!</h2>
          <p className={isDark ? 'text-white/60' : 'text-gray-600'}>View and take your scheduled exams</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-white/10">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'available' ? 'border-[#FD366E] text-[#FD366E]' : isDark ? 'border-transparent text-white/60 hover:text-white/80' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Available Exams
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'completed' ? 'border-[#FD366E] text-[#FD366E]' : isDark ? 'border-transparent text-white/60 hover:text-white/80' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Completed Exams
            </button>
          </nav>
        </div>

        {/* Exams List */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {exams.length === 0 ? (
              <div className={`bg-white/5 border-white/10 border rounded-lg shadow p-12 text-center backdrop-blur-sm`}>
                <svg className={`w-16 h-16 mx-auto mb-4 text-white/40`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className={`text-lg font-medium mb-2 text-white`}>No Available Exams</h3>
                <p className={isDark ? 'text-white/60' : 'text-gray-600'}>Check back later for scheduled exams</p>
              </div>
            ) : (
              exams.map((exam) => (
                <div
                  key={exam.id}
                  className={`bg-white/5 border-white/10 border rounded-lg shadow hover:shadow-lg hover:border-[#FD366E]/30 transition-all p-6 backdrop-blur-sm`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-xl font-bold text-white`}>{exam.title}</h3>
                        {isExamActive(exam) && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full flex items-center gap-1 border border-green-500/30"> 
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            LIVE
                          </span>
                        )}
                        {isExamUpcoming(exam) && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">UPCOMING</span>
                        )}
                      </div>
                      {exam.description && (
                        <p className={isDark ? 'text-white/60 mb-4' : 'text-gray-600 mb-4'}>{exam.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className={isDark ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Start Time</p>
                          <p className={`text-sm font-medium text-white`}>{formatDate(exam.start_time)}</p>
                        </div>
                        <div>
                          <p className={isDark ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Duration</p>
                          <p className={`text-sm font-medium text-white`}>{exam.duration_minutes} minutes</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      {isExamActive(exam) ? (
                        <button 
                          onClick={() => router.push(`/exam/${exam.id}`)}
                          className="px-6 py-3 bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] text-white rounded-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all font-medium"
                        >
                          Start Exam
                        </button>
                      ) : isExamUpcoming(exam) ? (
                        <button disabled className={`bg-white/5 text-white/40 border-white/10 px-6 py-3 rounded-lg cursor-not-allowed font-medium border`}>Not Started</button>
                      ) : (
                        <button disabled className={`bg-white/5 text-white/40 border-white/10 px-6 py-3 rounded-lg cursor-not-allowed font-medium border`}>Ended</button>
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
              <div className={`bg-white/5 border-white/10 border rounded-lg shadow p-12 text-center backdrop-blur-sm`}>
                <svg className={`w-16 h-16 mx-auto mb-4 text-white/40`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className={`text-lg font-medium mb-2 text-white`}>No Completed Exams</h3>
                <p className={isDark ? 'text-white/60' : 'text-gray-600'}>Your completed exams will appear here</p>
              </div>
            ) : (
              completedExams.map((session: any) => (
                <div
                  key={session.id}
                  className={`bg-white/5 border-white/10 border rounded-lg shadow hover:shadow-lg hover:border-[#FD366E]/30 transition-all p-6 backdrop-blur-sm`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-xl font-bold text-white`}>{session.exams?.title || 'Exam'}</h3>
                        {session.status === 'flagged' ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full flex items-center gap-1 border border-red-500/30">
                            <span>⚠️</span>
                            FLAGGED
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full flex items-center gap-1 border border-green-500/30">
                            <span>✓</span>
                            SUBMITTED
                          </span>
                        )}
                      </div>
                      {session.exams?.description && (
                        <p className={isDark ? 'text-white/60 mb-4' : 'text-gray-600 mb-4'}>{session.exams.description}</p>
                      )}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className={isDark ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Submitted</p>
                          <p className={`text-sm font-medium text-white`}>{formatDate(session.submitted_at)}</p>
                        </div>
                        <div>
                          <p className={isDark ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Cheat Score</p>
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
                          <p className={isDark ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Duration</p>
                          <p className={`text-sm font-medium text-white`}>{session.exams?.duration_minutes || 'N/A'} min</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <button 
                        onClick={() => router.push(`/exam/${session.exams?.id}/results?score=${session.final_cheat_score}&status=${session.status}&sessionId=${session.session_id}`)}
                        className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-medium border border-white/20"
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

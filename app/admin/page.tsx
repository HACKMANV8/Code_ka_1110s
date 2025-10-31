'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Leaderboard from '@/components/admin/Leaderboard'
import LiveVideoViewer from '@/components/admin/LiveVideoViewer'
import SnapshotViewer from '@/components/admin/SnapshotViewer'

export default function AdminPage() {
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
  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: string
    sessionId: string
    studentName: string
  } | null>(null)
  const [activeExam, setActiveExam] = useState<string | undefined>()
  const [exams, setExams] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'live' | 'snapshots'>('live')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchExams()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    // Check role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setUser(user)
    setLoading(false)
  }

  const fetchExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    setExams(data || [])
  }

  const handleSelectStudent = async (studentId: string, sessionId: string) => {
    // Fetch student name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', studentId)
      .single()

    setSelectedStudent({
      studentId,
      sessionId,
      studentName: profile?.full_name || 'Unknown Student'
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
              <h1 className={`text-xl font-bold text-white`}>Admin Dashboard</h1>
              <span className="px-3 py-1 bg-gradient-to-r from-[#FD366E]/20 to-[#FF6B9D]/20 text-[#FD366E] text-xs font-semibold rounded-full border border-[#FD366E]/30">ADMIN</span>
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
        {/* Header */}
        <div className="mb-8">
          <h2 className={`text-3xl font-bold mb-2 text-white`}>
            {activeTab === 'live' ? 'Live Exam Monitoring' : 'Student Snapshots Archive'}
          </h2>
          <p className={isDark ? 'text-white/60' : 'text-gray-600'}>
            {activeTab === 'live' 
              ? 'Real-time average cheat score tracking'
              : 'Review and download captured suspicious activity snapshots'
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'live'
                ? 'text-[#FD366E] border-b-2 border-[#FD366E]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Live Monitoring
          </button>
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'snapshots'
                ? 'text-[#FD366E] border-b-2 border-[#FD366E]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Snapshots Archive
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'live' ? (
          <>
            {/* Filter by Exam */}
            <div className="mb-6 flex items-center gap-4">
              <label className={`text-sm font-medium text-white/70`}>Filter by Exam:</label>
              <select
                value={activeExam || ''}
                onChange={(e) => setActiveExam(e.target.value || undefined)}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FD366E] focus:border-[#FD366E] backdrop-blur-sm border-white/10 bg-white/5 text-white [&>option]:bg-gray-800 [&>option]:text-white`}
              >
                <option value="">All Active Exams</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>{exam.title}</option>
                ))}
              </select>
            </div>

            {/* Leaderboard */}
            <div className={`border rounded-lg shadow-lg p-6 backdrop-blur-sm bg-white/5 border-white/10`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-xl font-bold text-white`}>Active Students (Sorted by Risk)</h3>
                  <p className={`text-sm mt-1 text-white/60`}>Updates every 3 seconds - Average cheat score</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className={`text-sm font-medium text-white/70`}>Live</span>
                </div>
              </div>

              <Leaderboard examId={activeExam} onSelectStudent={handleSelectStudent} isDark={isDark} />
            </div>
          </>
        ) : (
          <SnapshotViewer isDark={isDark} />
        )}
      </main>

      {/* Live Video Viewer Modal */}
      {selectedStudent && (
        <LiveVideoViewer
          student={selectedStudent}
          roomId={`exam-${selectedStudent.sessionId}`}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  )
}

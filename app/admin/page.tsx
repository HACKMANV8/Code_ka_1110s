'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Leaderboard from '@/components/admin/Leaderboard'
import LiveVideoViewer from '@/components/admin/LiveVideoViewer'
import SnapshotViewer from '@/components/admin/SnapshotViewer'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
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
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Admin Dashboard</h1>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300'}`}>ADMIN</span>
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
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {activeTab === 'live' ? 'Live Exam Monitoring' : 'Student Snapshots Archive'}
            </h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {activeTab === 'live' 
                ? 'Real-time average cheat score tracking'
                : 'Review and download captured suspicious activity snapshots'
              }
            </p>
          </div>
          <Link
            href="/admin/create-exam"
            className={`inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${
              isDark
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            + Create Exam
          </Link>
        </div>

        {/* Tabs */}
        <div className={`mb-6 flex gap-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'live'
                ? `text-blue-600 border-b-2 border-blue-600 ${isDark ? 'text-blue-400' : 'text-blue-600'}`
                : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Live Monitoring
          </button>
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'snapshots'
                ? `text-blue-600 border-b-2 border-blue-600 ${isDark ? 'text-blue-400' : 'text-blue-600'}`
                : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
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
              <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Filter by Exam:</label>
              <select
                value={activeExam || ''}
                onChange={(e) => setActiveExam(e.target.value || undefined)}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all ${isDark ? 'bg-slate-700/50 border-slate-600 text-white [&>option]:bg-slate-800 [&>option]:text-white' : 'bg-white border-gray-300 text-gray-900 [&>option]:bg-white [&>option]:text-gray-900'}`}
              >
                <option value="">All Active Exams</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>{exam.name}</option>
                ))}
              </select>
            </div>

            {/* Leaderboard */}
            <div className={`border rounded-lg shadow-lg p-6 ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Active Students (Sorted by Risk)</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Updates every 3 seconds - Average cheat score</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Live</span>
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

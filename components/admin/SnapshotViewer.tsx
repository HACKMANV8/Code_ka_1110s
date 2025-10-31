'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Snapshot {
  id: string
  session_id: string
  storage_path: string
  captured_at: string
  created_at: string
  image_url: string | null
  student: {
    id: string
    name: string
  }
  exam: {
    id: string
    title: string
    start_time: string
    end_time: string
  }
  session_status: string
  submitted_at: string | null
}

interface SnapshotViewerProps {
  isDark?: boolean
}

export default function SnapshotViewer({ isDark = true }: SnapshotViewerProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState<'studentId' | 'sessionId' | 'examId' | 'email'>('sessionId')
  const [searchValue, setSearchValue] = useState('')
  const [exams, setExams] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchExams()
    fetchStudents()
  }, [])

  const fetchExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('id, title')
      .order('created_at', { ascending: false })
    
    setExams(data || [])
  }

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'student')
      .order('full_name')
    
    setStudents(data || [])
  }

  const fetchSnapshots = async () => {
    if (!searchValue && searchType !== 'examId') {
      alert('Please enter a search value')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (searchType === 'studentId') {
        params.append('studentId', searchValue)
      } else if (searchType === 'sessionId') {
        params.append('sessionId', searchValue)
      } else if (searchType === 'examId') {
        params.append('examId', searchValue)
      } else if (searchType === 'email') {
        params.append('studentEmail', searchValue)
      }

      const response = await fetch(`/api/admin/snapshots?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setSnapshots(data.snapshots)
        console.log('Snapshots loaded:', data.snapshots.length)
        console.log('Snapshots with images:', data.snapshots.filter((s: any) => s.image_url).length)
        
        if (data.message) {
          console.log('Message:', data.message)
        }
      } else {
        console.error('Error:', data.error)
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error)
      alert('Failed to fetch snapshots')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const downloadSnapshot = async (snapshot: Snapshot) => {
    if (!snapshot.image_url) return
    
    try {
      const response = await fetch(snapshot.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `snapshot_${snapshot.student.name}_${snapshot.captured_at}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading snapshot:', error)
      alert('Failed to download snapshot')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className={`rounded-lg p-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
        <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Search Student Snapshots
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
              Search By
            </label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#FD366E] focus:border-[#FD366E] ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white [&>option]:bg-gray-800 [&>option]:text-white' 
                  : 'bg-white border-gray-300 text-gray-900 [&>option]:bg-white [&>option]:text-gray-900'
              }`}
            >
              <option value="sessionId">Session ID</option>
              <option value="studentId">Student ID</option>
              <option value="examId">Exam</option>
              <option value="email">Student Email</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
              Search Value
            </label>
            
            {searchType === 'examId' ? (
              <select
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#FD366E] focus:border-[#FD366E] ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white [&>option]:bg-gray-800 [&>option]:text-white' 
                    : 'bg-white border-gray-300 text-gray-900 [&>option]:bg-white [&>option]:text-gray-900'
                }`}
              >
                <option value="">Select an exam...</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            ) : searchType === 'studentId' ? (
              <select
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#FD366E] focus:border-[#FD366E] ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white [&>option]:bg-gray-800 [&>option]:text-white' 
                    : 'bg-white border-gray-300 text-gray-900 [&>option]:bg-white [&>option]:text-gray-900'
                }`}
              >
                <option value="">Select a student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name || 'Unnamed Student'}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  searchType === 'sessionId' 
                    ? 'Enter session ID...' 
                    : 'Enter student email...'
                }
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#FD366E] focus:border-[#FD366E] ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/40' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            )}
          </div>
        </div>

        <button
          onClick={fetchSnapshots}
          disabled={loading}
          className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search Snapshots'}
        </button>
      </div>

      {/* Results Section */}
      {snapshots.length > 0 && (
        <div className={`rounded-lg p-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Found {snapshots.length} Snapshot{snapshots.length !== 1 ? 's' : ''}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className={`rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                  isDark 
                    ? 'bg-white/5 border border-white/10 hover:border-[#FD366E]' 
                    : 'bg-gray-50 border border-gray-200 hover:border-[#FD366E]'
                }`}
                onClick={() => setSelectedSnapshot(snapshot)}
              >
                {snapshot.image_url ? (
                  <div className="relative w-full h-64 bg-black">
                    <Image
                      src={snapshot.image_url}
                      alt={`Snapshot from ${snapshot.student.name}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-800 gap-2">
                    <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white/50 text-sm">Image file not found</span>
                    <span className="text-white/30 text-xs px-4 text-center">Snapshot was recorded but the image file is missing from storage</span>
                  </div>
                )}
                
                <div className="p-4 space-y-2">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {snapshot.student.name}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                      {snapshot.exam.title}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                      {formatDate(snapshot.captured_at)}
                    </span>
                    
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      snapshot.session_status === 'submitted' 
                        ? 'bg-green-500/20 text-green-400'
                        : snapshot.session_status === 'flagged'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {snapshot.session_status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && snapshots.length === 0 && searchValue && (
        <div className={`rounded-lg p-12 text-center ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
          <p className={isDark ? 'text-white/60' : 'text-gray-600'}>
            No snapshots found for this search
          </p>
        </div>
      )}

      {/* Modal for full-size image */}
      {selectedSnapshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div
            className={`max-w-4xl w-full rounded-lg overflow-hidden ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[60vh] bg-gray-900">
              {selectedSnapshot.image_url && (
                <Image
                  src={selectedSnapshot.image_url}
                  alt="Snapshot full view"
                  fill
                  className="object-contain"
                  unoptimized
                />
              )}
            </div>
            
            <div className={`p-6 space-y-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium opacity-60">Student</p>
                  <p className="text-lg font-bold">{selectedSnapshot.student.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium opacity-60">Exam</p>
                  <p className="text-lg font-bold">{selectedSnapshot.exam.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium opacity-60">Captured At</p>
                  <p>{formatDate(selectedSnapshot.captured_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium opacity-60">Session Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
                    selectedSnapshot.session_status === 'submitted' 
                      ? 'bg-green-500/20 text-green-400'
                      : selectedSnapshot.session_status === 'flagged'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {selectedSnapshot.session_status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium opacity-60">Session ID</p>
                  <p className="text-xs font-mono">{selectedSnapshot.session_id}</p>
                </div>
                {selectedSnapshot.submitted_at && (
                  <div>
                    <p className="text-sm font-medium opacity-60">Submitted At</p>
                    <p>{formatDate(selectedSnapshot.submitted_at)}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => downloadSnapshot(selectedSnapshot)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  Download Snapshot
                </button>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className={`flex-1 px-4 py-2 font-medium rounded-lg transition-all ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/20 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

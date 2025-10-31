'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StudentLeaderboardItem } from '@/lib/types/database'

interface LeaderboardProps {
  examId?: string
  onSelectStudent: (studentId: string, sessionId: string) => void
  isDark?: boolean
}

export default function Leaderboard({ examId, onSelectStudent, isDark = true }: LeaderboardProps) {
  const [students, setStudents] = useState<StudentLeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchLeaderboard()
    
    // Refresh every 3 seconds for probability updates
    const interval = setInterval(() => {
      fetchLeaderboard()
    }, 3000)

    // Subscribe to real-time updates
    const channel = supabase
      .channel('cheat_scores_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cheat_scores',
        },
        () => {
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [examId])

  const fetchLeaderboard = async () => {
    try {
      // First fetch exam_sessions with limited relations
      let query = supabase
        .from('exam_sessions')
        .select(`
          id,
          student_id,
          exam_id,
          status,
          exams (
            id,
            title
          ),
          profiles (
            id,
            full_name
          )
        `)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })

      if (examId) {
        query = query.eq('exam_id', examId)
      }

      const { data: sessions, error: sessionsError } = await query

      if (sessionsError) {
        console.error('Sessions error:', sessionsError)
        throw sessionsError
      }

      if (!sessions || sessions.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      // Then fetch cheat_scores separately
      const sessionIds = sessions.map(s => s.id)
      const { data: allScores, error: scoresError } = await supabase
        .from('cheat_scores')
        .select('session_id, score, detected_behavior')
        .in('session_id', sessionIds)

      if (scoresError) {
        console.error('Scores error:', scoresError)
        throw scoresError
      }

      // Group scores by session
      const scoresBySession = new Map<string, any[]>()
      allScores?.forEach((score: any) => {
        if (!scoresBySession.has(score.session_id)) {
          scoresBySession.set(score.session_id, [])
        }
        scoresBySession.get(score.session_id)!.push(score)
      })

      // Process and aggregate data - calculate cheat probability
      const leaderboardData: StudentLeaderboardItem[] = sessions.map((session: any) => {
        const scores = scoresBySession.get(session.id) || []
        
        // Calculate cheat probability based on average score
        const avgScore = scores.length > 0 
          ? scores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / scores.length 
          : 0
        
        // Collect all unique alerts from detected_behavior
        const allAlerts = new Set<string>()
        scores.forEach((score: any) => {
          if (score.detected_behavior && Array.isArray(score.detected_behavior)) {
            score.detected_behavior.forEach((alert: string) => allAlerts.add(alert))
          }
        })
        
        return {
          student_id: session.student_id,
          student_name: session.profiles?.full_name || 'Unknown Student',
          session_id: session.id,
          exam_title: session.exams?.title || 'Unknown Exam',
          cheat_score: avgScore,
          confidence: 0,
          status: session.status,
          detected_behaviors: Array.from(allAlerts),
          last_updated: new Date().toISOString(),
        }
      })

      // Sort by cheat probability (highest first)
      leaderboardData.sort((a, b) => b.cheat_score - a.cheat_score)

      setStudents(leaderboardData)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCheatProbabilityLabel = (score: number) => {
    if (score >= 80) return 'CRITICAL'
    if (score >= 60) return 'HIGH'
    if (score >= 40) return 'MEDIUM'
    return 'LOW'
  }

  const getCheatProbabilityColor = (score: number) => {
    if (score >= 80) return isDark ? 'text-red-400 bg-red-500/20' : 'text-red-600 bg-red-50'
    if (score >= 60) return isDark ? 'text-orange-400 bg-orange-500/20' : 'text-orange-600 bg-orange-50'
    if (score >= 40) return isDark ? 'text-yellow-400 bg-yellow-500/20' : 'text-yellow-600 bg-yellow-50'
    return isDark ? 'text-green-400 bg-green-500/20' : 'text-green-600 bg-green-50'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className={isDark ? 'text-white/60' : 'text-gray-500'}>Loading active sessions...</div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="text-center p-8">
        <p className={isDark ? 'text-white/60' : 'text-gray-600'}>No active exam sessions</p>
        <p className={`text-sm mt-2 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
          Students taking exams will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {students.map((student, index) => {
        const probability = student.cheat_score
        const label = getCheatProbabilityLabel(probability)
        const colorClass = getCheatProbabilityColor(probability)
        const borderColor = 
          probability >= 80 ? '#dc2626' :
          probability >= 60 ? '#ea580c' :
          probability >= 40 ? '#ca8a04' : '#16a34a'
        
        return (
          <div
            key={student.session_id}
            onClick={() => onSelectStudent(student.student_id, student.session_id)}
            className={`rounded-lg p-4 shadow hover:shadow-md transition-all cursor-pointer border-l-4 ${
              isDark 
                ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                : 'bg-white border-gray-200 hover:shadow-lg'
            }`}
            style={{ borderLeftColor: borderColor }}
          >
            <div className="space-y-3">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`text-xl font-bold w-8 flex-shrink-0 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                    #{index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {student.student_name}
                    </h3>
                    <p className={`text-sm truncate ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                      {student.exam_title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {/* Cheat Probability */}
                  <div className="text-center">
                    <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${colorClass}`}>
                      {probability.toFixed(0)}%
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                      Probability
                    </div>
                  </div>

                  {/* Risk Level Badge */}
                  <div className="text-center">
                    <span className={`font-bold text-sm px-3 py-1 rounded-full ${colorClass.includes('red-400') ? isDark ? 'bg-red-500/20' : 'bg-red-50' : colorClass.includes('orange') ? isDark ? 'bg-orange-500/20' : 'bg-orange-50' : colorClass.includes('yellow') ? isDark ? 'bg-yellow-500/20' : 'bg-yellow-50' : isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                      {label}
                    </span>
                  </div>

                  {/* View Button */}
                  <button className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex-shrink-0 ${
                    isDark
                      ? 'bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] text-white hover:shadow-lg hover:shadow-pink-500/30'
                      : 'bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] text-white hover:shadow-lg'
                  }`}>
                    View
                  </button>
                </div>
              </div>

              {/* Alerts Row */}
              {student.detected_behaviors && student.detected_behaviors.length > 0 && (
                <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'} pt-3`}>
                  <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                    🚨 Active Alerts:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {student.detected_behaviors.map((alert, idx) => (
                      <span
                        key={idx}
                        className={`inline-block text-xs px-2.5 py-1 rounded-md font-medium ${
                          isDark
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {alert.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

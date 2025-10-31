'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic'

interface ExamResult {
  total_questions: number;
  attempted_questions: number;
  correct_answers: number;
  wrong_answers: number;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  grade: string;
  pass_status: boolean;
  focus_score: number;
  proctoring_status: string;
}

export default function ExamResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id as string;
  
  const [examTitle, setExamTitle] = useState('');
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [focusScore, setFocusScore] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const loadResults = async () => {
      try {
        const sessionIdParam = searchParams.get('sessionId');
        
        // Enhanced logging for debugging
        console.log('Results page - URL params:', {
          sessionId: sessionIdParam,
          score: searchParams.get('score'),
          status: searchParams.get('status'),
          allParams: Object.fromEntries(searchParams.entries())
        });
        
        if (!sessionIdParam || sessionIdParam === 'undefined' || sessionIdParam.trim() === '') {
          console.error('Invalid session ID from URL:', sessionIdParam);
          setLoading(false);
          return;
        }

        // Store sessionId in both state AND sessionStorage for persistence
        setSessionId(sessionIdParam);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('examSessionId', sessionIdParam);
          console.log('Stored sessionId in sessionStorage:', sessionIdParam);
        }

        // Fetch exam details
        const { data: exam, error: examError } = await supabase
          .from('exams')
          .select('name')
          .eq('id', examId)
          .single();

        if (examError) {
          console.error('Error fetching exam:', examError);
        }

        if (exam) {
          setExamTitle(exam.name);
        }

        // Fetch exam results from database
        const { data: result, error: resultError } = await supabase
          .from('exam_results')
          .select('*')
          .eq('session_id', sessionIdParam)
          .single();

        if (resultError) {
          console.error('Error fetching results:', resultError);
        }

        if (result) {
          console.log('Exam result loaded from DB:', {
            focus_score: result.focus_score,
            percentage: result.percentage,
            grade: result.grade,
            correct_answers: result.correct_answers,
            total_questions: result.total_questions
          });
          setExamResult(result);
          setFocusScore(result.focus_score || 0);
          setStatus(result.proctoring_status || 'submitted');
        } else {
          // Fallback to URL params if no result in DB yet
          // Convert cheat score to focus score: focus_score = 100 - cheat_score
          const scoreParam = searchParams.get('score');
          const statusParam = searchParams.get('status');
          console.log('No DB result, using URL params:', { scoreParam, statusParam });
          if (scoreParam) {
            const cheatScore = parseInt(scoreParam);
            const focusScore = 100 - cheatScore;
            setFocusScore(focusScore);
          }
          if (statusParam) setStatus(statusParam);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading results:', error);
        setLoading(false);
      }
    };

    loadResults();
  }, [examId, searchParams, supabase]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const handleGetAiReview = async () => {
    // Try multiple sources for sessionId
    let finalSessionId = sessionId;
    
    // If sessionId not in state, try sessionStorage or URL
    if (!finalSessionId || finalSessionId === 'undefined' || finalSessionId.trim() === '') {
      if (typeof window !== 'undefined') {
        finalSessionId = sessionStorage.getItem('examSessionId') || '';
      }
      if (!finalSessionId) {
        finalSessionId = searchParams.get('sessionId') || '';
      }
    }
    
    console.log('handleGetAiReview - Final sessionId:', {
      stateSessionId: sessionId,
      finalSessionId: finalSessionId,
      isValid: finalSessionId && finalSessionId !== 'undefined' && finalSessionId.trim() !== ''
    });
    
    if (!finalSessionId || finalSessionId === 'undefined' || finalSessionId.trim() === '') {
      console.error('Invalid session ID - cannot fetch AI review:', {
        sessionId,
        storageValue: typeof window !== 'undefined' ? sessionStorage.getItem('examSessionId') : 'N/A',
        urlValue: searchParams.get('sessionId'),
      });
      alert('Session ID not available. Please try again.');
      return;
    }

    try {
      setReviewLoading(true);
      const response = await fetch('/api/exam/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: finalSessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('AI Review Error:', errorData);
        alert(`Error: ${errorData.error || 'Failed to generate AI review'}`);
        return;
      }

      const data = await response.json();
      console.log('AI Review received successfully');
      setAiReview(data.review);
      setShowReview(true);
    } catch (error) {
      console.error('Error fetching AI review:', error);
      alert('Failed to generate AI review. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (status === 'flagged') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
          <span className="text-red-400 font-semibold">⚠️ Flagged for Review</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
        <span className="text-green-400 font-semibold">✓ Submitted Successfully</span>
      </div>
    );
  };

  const getPerformanceMessage = () => {
    if (focusScore >= 90) {
      return {
        title: "Excellent Performance! 🎉",
        message: "Your focus and attention during the exam were outstanding. Keep up the great work!",
        icon: "🏆"
      };
    }
    if (focusScore >= 75) {
      return {
        title: "Good Performance 👍",
        message: "You maintained good focus throughout most of the exam. Well done!",
        icon: "✨"
      };
    }
    if (focusScore >= 60) {
      return {
        title: "Fair Performance",
        message: "Some distractions were detected during the exam. Try to maintain better focus next time.",
        icon: "📊"
      };
    }
    return {
      title: "Needs Improvement",
      message: "Multiple instances of suspicious behavior were detected. Please ensure you follow exam guidelines strictly.",
      icon: "⚠️"
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#19191C]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FD366E]/30 border-t-[#FD366E] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading results...</p>
        </div>
      </div>
    );
  }

  const performance = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-[#19191C] py-12 px-4">
      {/* AI Review Modal */}
      {showReview && aiReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#19191C] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#19191C] border-b border-white/10 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span>🤖</span> AI Exam Review
              </h2>
              <button
                onClick={() => setShowReview(false)}
                className="text-white/60 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="prose prose-invert max-w-none">
                <div className="text-white/90 leading-relaxed whitespace-pre-wrap">
                  {aiReview}
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 p-6 bg-white/5">
              <button
                onClick={() => setShowReview(false)}
                className="w-full bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#FD366E] to-[#FF6B9D] mb-6 shadow-lg shadow-pink-500/30">
            <span className="text-4xl">{performance.icon}</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Exam Submitted!</h1>
          <p className="text-white/60 text-lg">{examTitle}</p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-8">
          {getStatusBadge()}
        </div>

        {/* Results Summary Grid */}
        {examResult && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(examResult.percentage)}`}>
                {examResult.percentage}%
              </p>
              <p className="text-white/40 text-xs mt-1">
                {examResult.marks_obtained}/{examResult.total_marks} marks
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Grade</p>
              <p className="text-2xl font-bold text-[#FD366E]">
                {examResult.grade}
              </p>
              <p className="text-white/40 text-xs mt-1">
                {examResult.pass_status ? 'Passed ✓' : 'Failed'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Correct</p>
              <p className="text-2xl font-bold text-green-400">
                {examResult.correct_answers}
              </p>
              <p className="text-white/40 text-xs mt-1">
                of {examResult.total_questions}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Focus</p>
              <p className={`text-2xl font-bold ${getScoreColor(focusScore)}`}>
                {focusScore}%
              </p>
              <p className="text-white/40 text-xs mt-1">
                {examResult.proctoring_status}
              </p>
            </div>
          </div>
        )}

        {/* Focus Score Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
          <div className="text-center">
            <p className="text-white/60 text-sm uppercase tracking-wider mb-3">Focus Score</p>
            <div className={`text-7xl font-bold ${getScoreColor(focusScore)} mb-4`}>
              {focusScore}%
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-6">
              <div
                className={`h-full transition-all ${
                  focusScore >= 85
                    ? 'bg-green-500'
                    : focusScore >= 70
                    ? 'bg-yellow-500'
                    : focusScore >= 50
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${focusScore}%` }}
              />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{performance.title}</h3>
            <p className="text-white/70 leading-relaxed">{performance.message}</p>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="text-white font-semibold">Review Your Answers</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              View your answers, correct solutions, and get AI-powered explanations for each question.
            </p>
            {sessionId && sessionId !== 'undefined' && (
              <Link
                href={`/exam/review/${sessionId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all"
              >
                <span>📝</span> Review Answers
              </Link>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <h3 className="text-white font-semibold">Get AI Review</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Get comprehensive AI-powered feedback with strengths, areas for improvement, and study recommendations.
            </p>
            <button
              onClick={handleGetAiReview}
              disabled={reviewLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{reviewLoading ? '⏳' : '✨'}</span> 
              {reviewLoading ? 'Generating...' : 'Get Review'}
            </button>
          </div>
        </div>

        {/* Important Notice */}
        {status === 'flagged' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
              <div>
                <h3 className="text-red-400 font-bold text-lg mb-2">Flagged for Review</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-3">
                  Your exam has been flagged due to detected suspicious activities during the session. This may include:
                </p>
                <ul className="text-white/70 text-sm space-y-1 ml-4">
                  <li>• Multiple instances of looking away from the screen</li>
                  <li>• Detected additional devices or persons in frame</li>
                  <li>• Tab switching or leaving fullscreen mode</li>
                  <li>• Extended periods of inactivity</li>
                </ul>
                <p className="text-white/80 text-sm mt-3">
                  Your instructor will review the recording and may contact you for clarification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="flex-1 bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] hover:shadow-lg hover:shadow-pink-500/30 text-white font-semibold py-4 px-6 rounded-xl transition-all text-center"
          >
            Return to Dashboard
          </Link>
        </div>

        {/* Session Info */}
        {sessionId && (
          <div className="mt-6 text-center">
            <p className="text-white/40 text-xs">
              Session ID: <span className="font-mono">{sessionId}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

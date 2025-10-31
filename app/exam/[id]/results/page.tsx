'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ExamResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id as string;
  
  const [examTitle, setExamTitle] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const loadResults = async () => {
      try {
        const scoreParam = searchParams.get('score');
        const statusParam = searchParams.get('status');
        const sessionIdParam = searchParams.get('sessionId');

        if (scoreParam && statusParam) {
          setFinalScore(parseInt(scoreParam));
          setStatus(statusParam);
          if (sessionIdParam) setSessionId(sessionIdParam);
        }

        // Fetch exam details
        const { data: exam } = await supabase
          .from('exams')
          .select('title')
          .eq('id', examId)
          .single();

        if (exam) {
          setExamTitle(exam.title);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading results:', error);
        setLoading(false);
      }
    };

    loadResults();
  }, [examId, searchParams, supabase]);

  const getScoreColor = () => {
    if (finalScore >= 85) return 'text-green-400';
    if (finalScore >= 70) return 'text-yellow-400';
    if (finalScore >= 50) return 'text-orange-400';
    return 'text-red-400';
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
    if (finalScore >= 90) {
      return {
        title: "Excellent Performance! 🎉",
        message: "Your focus and attention during the exam were outstanding. Keep up the great work!",
        icon: "🏆"
      };
    }
    if (finalScore >= 75) {
      return {
        title: "Good Performance 👍",
        message: "You maintained good focus throughout most of the exam. Well done!",
        icon: "✨"
      };
    }
    if (finalScore >= 60) {
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
        <div className="text-white/60">Loading results...</div>
      </div>
    );
  }

  const performance = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-[#19191C] py-12 px-4">
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

        {/* Score Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
          <div className="text-center">
            <p className="text-white/60 text-sm uppercase tracking-wider mb-3">Focus Score</p>
            <div className={`text-7xl font-bold ${getScoreColor()} mb-4`}>
              {finalScore}%
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-6">
              <div
                className={`h-full transition-all ${
                  finalScore >= 85
                    ? 'bg-green-500'
                    : finalScore >= 70
                    ? 'bg-yellow-500'
                    : finalScore >= 50
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${finalScore}%` }}
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
              <h3 className="text-white font-semibold">What Happens Next?</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Your exam has been submitted for review. Results and grades will be posted by your instructor within 24-48 hours.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
              <h3 className="text-white font-semibold">Recording Saved</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Your exam session has been securely recorded and will be available for instructor review if needed.
            </p>
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

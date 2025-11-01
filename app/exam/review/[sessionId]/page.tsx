'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import QuestionReviewCard from '@/components/student/QuestionReviewCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Question {
  id: number;
  type: 'mcq' | 'text' | 'multiple_select' | 'true_false';
  prompt: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  explanation?: string;
  topic?: string;
  difficulty?: string;
  marks?: number;
}

interface StudentAnswer {
  id?: string;
  session_id: string;
  question_id: string | number;
  selected_options?: string[];
  text_answer?: string;
  is_correct?: boolean;
  marks_obtained?: number;
  time_spent_seconds?: number;
  answered_at?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ExamReviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [examName, setExamName] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Map<string | number, StudentAnswer>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadExamReview();
  }, [sessionId]);

  const loadExamReview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('exam_sessions')
        .select('id, student_id, exam_id, status, submitted_at')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Exam session not found');
      }

      // Verify user owns this session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== session.student_id) {
        router.push('/dashboard');
        return;
      }

      // Check if exam is submitted
      if (session.status === 'in_progress') {
        setError('This exam is still in progress. Please complete it first.');
        return;
      }

      // Get exam details with JSONB questions
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('id, name, description, questions')
        .eq('id', session.exam_id)
        .single();

      if (examError || !exam) {
        throw new Error('Exam not found');
      }

      setExamName(exam.name);
      setQuestions(exam.questions || []);

      // Get exam results
      const { data: resultData } = await supabase
        .from('exam_results')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      setResult(resultData);

      // Get all student answers
      const { data: answersData, error: answersError } = await supabase
        .from('student_answers')
        .select('*')
        .eq('session_id', sessionId);

      if (answersError) {
        throw answersError;
      }

      // Create a map of question_id -> answer
      const answersMap = new Map<string | number, StudentAnswer>();
      answersData?.forEach((answer) => {
        answersMap.set(answer.question_id, answer);
      });
      setAnswers(answersMap);

    } catch (err: any) {
      console.error('Error loading exam review:', err);
      setError(err.message || 'Failed to load exam review');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#19191C]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FD366E]/30 border-t-[#FD366E] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading exam review...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#19191C] p-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-[#19191C] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h1 className="text-3xl font-bold text-white mb-2">{examName}</h1>
            
            {/* Results Summary */}
            {result && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(result.percentage)}`}>
                    {result.percentage}%
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {result.marks_obtained}/{result.total_marks} marks
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Grade</p>
                  <p className="text-2xl font-bold text-[#FD366E]">
                    {result.grade || 'N/A'}
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {result.pass_status ? 'Passed' : 'Failed'}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Correct</p>
                  <p className="text-2xl font-bold text-green-400">
                    {result.correct_answers}
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    of {result.total_questions}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white/60 text-xs mb-1">Focus Score</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {result.focus_score || 'N/A'}
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {result.proctoring_status || 'clean'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#FD366E] to-[#FF6B9D] flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">AI-Powered Question Reviews</p>
              <p className="text-white/70 text-sm">
                Click "Get AI Explanation" on any question below to receive personalized feedback based on uploaded study materials
              </p>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Question-by-Question Review</h2>
          
          {questions.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
              <p className="text-white/60">No questions found for this exam.</p>
            </div>
          ) : (
            questions.map((question, index) => (
              <QuestionReviewCard
                key={question.id}
                question={question}
                studentAnswer={answers.get(question.id)}
                sessionId={sessionId}
                questionNumber={index + 1}
              />
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-medium hover:bg-white/10 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

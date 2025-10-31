'use client';

import { useState } from 'react';
import { ExamQuestion, QuestionOption, StudentAnswer } from '@/lib/types/database';

interface QuestionReviewCardProps {
  question: ExamQuestion & { options?: QuestionOption[] };
  studentAnswer?: StudentAnswer;
  sessionId: string;
  questionNumber: number;
}

export default function QuestionReviewCard({
  question,
  studentAnswer,
  sessionId,
  questionNumber,
}: QuestionReviewCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCorrect = studentAnswer?.is_correct ?? null;
  const isAnswered = studentAnswer && (studentAnswer.selected_options?.length || studentAnswer.text_answer);

  const handleGetExplanation = async () => {
    if (aiExplanation) {
      setShowExplanation(!showExplanation);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/exam/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          session_id: sessionId,
          include_context: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get explanation');
      }

      const data = await response.json();
      setAiExplanation(data.explanation);
      setShowExplanation(true);
    } catch (err) {
      console.error('Error getting explanation:', err);
      setError('Failed to load AI explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!isAnswered) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
          Not Answered
        </span>
      );
    }
    if (isCorrect) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
          ✓ Correct
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
        ✗ Incorrect
      </span>
    );
  };

  const getSelectedOptionIds = () => {
    return studentAnswer?.selected_options || [];
  };

  const isOptionSelected = (optionId: string) => {
    return getSelectedOptionIds().includes(optionId);
  };

  const getOptionClassName = (option: QuestionOption) => {
    const selected = isOptionSelected(option.id);
    const correct = option.is_correct;

    if (selected && correct) {
      return 'bg-green-500/10 border-green-500/50 text-green-300';
    }
    if (selected && !correct) {
      return 'bg-red-500/10 border-red-500/50 text-red-300';
    }
    if (!selected && correct) {
      return 'bg-green-500/5 border-green-500/30 text-green-400';
    }
    return 'bg-white/5 border-white/10 text-white/70';
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FD366E]/10 border border-[#FD366E]/30 flex items-center justify-center">
            <span className="text-[#FD366E] font-bold text-sm">{questionNumber}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge()}
              {question.topic && (
                <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {question.topic}
                </span>
              )}
              {question.difficulty_level && (
                <span className="px-2 py-1 rounded text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  {question.difficulty_level}
                </span>
              )}
            </div>
            <p className="text-white text-base leading-relaxed">{question.question_text}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
              <span>Type: {question.question_type}</span>
              <span>•</span>
              <span>Marks: {studentAnswer?.marks_obtained || 0}/{question.marks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Options (for MCQ) */}
      {(question.question_type === 'mcq' || question.question_type === 'multiple_select') && question.options && (
        <div className="space-y-2 mb-4">
          {question.options
            .sort((a, b) => a.order_index - b.order_index)
            .map((option) => (
              <div
                key={option.id}
                className={`p-3 rounded-lg border transition-all ${getOptionClassName(option)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold">{option.option_label}.</span>
                  <span className="flex-1">{option.option_text}</span>
                  {option.is_correct && (
                    <span className="text-green-400 text-sm">✓ Correct</span>
                  )}
                  {isOptionSelected(option.id) && !option.is_correct && (
                    <span className="text-red-400 text-sm">Your answer</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Text Answer */}
      {(question.question_type === 'short_answer' || question.question_type === 'long_answer') && studentAnswer?.text_answer && (
        <div className="mb-4">
          <p className="text-white/60 text-sm mb-2">Your Answer:</p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-white/80">{studentAnswer.text_answer}</p>
          </div>
        </div>
      )}

      {/* Pre-written Explanation */}
      {question.explanation && (
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-sm font-semibold mb-2">📝 Instructor's Explanation:</p>
          <p className="text-white/80 text-sm leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {/* AI Explanation Section */}
      <div className="border-t border-white/10 pt-4">
        <button
          onClick={handleGetExplanation}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#FD366E] to-[#FF6B9D] text-white font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Getting AI Explanation...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>{aiExplanation ? (showExplanation ? 'Hide' : 'Show') : 'Get AI'} Explanation</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {showExplanation && aiExplanation && (
          <div className="mt-4 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FD366E] to-[#FF6B9D] flex items-center justify-center">
                <span className="text-white text-lg">🤖</span>
              </div>
              <p className="text-white font-semibold">AI Explanation</p>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{aiExplanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

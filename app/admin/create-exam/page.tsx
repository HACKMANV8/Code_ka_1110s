'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type QuestionType = 'text' | 'mcq'

interface QuestionOptionForm {
  id: string
  text: string
  isCorrect: boolean
}

interface QuestionForm {
  id: string
  prompt: string
  type: QuestionType
  options: QuestionOptionForm[]
  touched: boolean
  error: string | null
}

const MAX_QUESTIONS = 50

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

const createOption = (): QuestionOptionForm => ({
  id: createId(),
  text: '',
  isCorrect: false,
})

const createQuestion = (): QuestionForm => ({
  id: createId(),
  prompt: '',
  type: 'text',
  options: [],
  touched: false,
  error: null,
})

const computeQuestionErrorMessage = (question: QuestionForm): string | null => {
  const prompt = question.prompt.trim()
  if (!prompt) {
    return 'Add a prompt for this question.'
  }

  if (question.type === 'mcq') {
    if (question.options.length < 2) {
      return 'Add at least two answer options.'
    }

    const missingIndex = question.options.findIndex(
      (option) => option.text.trim().length === 0,
    )
    if (missingIndex !== -1) {
      return `Option ${missingIndex + 1} needs an answer label.`
    }

    const filledCount = question.options.filter(
      (option) => option.text.trim().length > 0,
    ).length
    if (filledCount < 2) {
      return 'Provide at least two answer options with text.'
    }

    const hasCorrect = question.options.some((option) => option.isCorrect)
    if (!hasCorrect) {
      return 'Select at least one correct answer.'
    }
  }

  return null
}

const applyQuestionValidation = (
  question: QuestionForm,
  touchedOverride?: boolean,
  shouldValidate = false,
): QuestionForm => {
  const touched =
    typeof touchedOverride === 'boolean' ? touchedOverride : question.touched
  const normalized: QuestionForm = {
    ...question,
    touched,
  }
  const error =
    shouldValidate && normalized.touched
      ? computeQuestionErrorMessage(normalized)
      : null
  return {
    ...normalized,
    error,
  }
}

export default function CreateExamPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(60)
  const [startTime, setStartTime] = useState('')
  const [questions, setQuestions] = useState<QuestionForm[]>([createQuestion()])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const theme = localStorage.getItem('theme')
      setIsDark(theme !== 'light')
    }
  }, [])

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', next ? 'dark' : 'light')
      }
      return next
    })
  }

  const mutedTextClass = isDark ? 'text-white/60' : 'text-gray-600'
  const labelTextClass = isDark ? 'text-white/80' : 'text-gray-700'
  const linkButtonClass = isDark
    ? 'inline-flex items-center rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
    : 'inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
  const inputBaseClass = isDark
    ? 'border-slate-700 bg-slate-800/50 text-white placeholder:text-white/40 focus:border-blue-500 focus:ring-blue-500/40'
    : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:ring-blue-600/20'
  const readOnlyInputClass = isDark
    ? 'border-slate-700 bg-slate-800/40 text-white/80 focus:border-blue-500 focus:ring-blue-500/40'
    : 'border-gray-200 bg-gray-50 text-gray-600 focus:border-blue-600 focus:ring-blue-600/20'
  const containerCardClass = isDark
    ? 'border border-slate-700 bg-slate-800/40 shadow-xl shadow-slate-900/30'
    : 'border border-gray-200 bg-white shadow-xl shadow-gray-200/60'
  const questionCardBaseClass = isDark
    ? 'border border-slate-700 bg-slate-800/30'
    : 'border border-gray-200 bg-white'
  const questionCardErrorClass = isDark
    ? 'border-red-500/40 bg-red-500/5'
    : 'border-red-300 bg-red-50'
  const optionContainerBase = isDark
    ? 'border border-white/10 bg-white/5'
    : 'border border-gray-200 bg-gray-50'
  const optionContainerError = isDark
    ? 'border-red-400 bg-red-500/10'
    : 'border-red-300 bg-red-100/70'
  const secondaryButtonClass = isDark
    ? 'rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70'
    : 'rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60'
  const addElementButtonClass = isDark
    ? 'rounded-lg border border-white/20 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
    : 'rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
  const globalErrorClass = isDark
    ? 'rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200'
    : 'rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700'
  const globalSuccessClass = isDark
    ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200'
    : 'rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'

  const canAddQuestion = questions.length < MAX_QUESTIONS

  const handleAddQuestion = () => {
    if (!canAddQuestion) return
    setQuestions((prev) => [...prev, createQuestion()])
  }

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id))
  }

  const updateQuestion = (
    id: string,
    updater: (question: QuestionForm) => QuestionForm,
    options: { forceTouch?: boolean } = {},
  ) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== id) return question
        const draft = updater(question)
        const touched =
          options.forceTouch
            ? true
            : typeof draft.touched === 'boolean'
            ? draft.touched
            : question.touched
        return applyQuestionValidation({ ...draft, touched }, touched, hasSubmitted)
      }),
    )
  }

  const addOption = (questionId: string) => {
    updateQuestion(
      questionId,
      (question) => ({
        ...question,
        touched: true,
        options: [...question.options, createOption()],
      }),
      { forceTouch: true },
    )
  }

  const removeOption = (questionId: string, optionId: string) => {
    updateQuestion(
      questionId,
      (question) => ({
        ...question,
        touched: true,
        options: question.options.filter((option) => option.id !== optionId),
      }),
      { forceTouch: true },
    )
  }

  const updateOption = (
    questionId: string,
    optionId: string,
    updater: (option: QuestionOptionForm) => QuestionOptionForm,
  ) => {
    updateQuestion(
      questionId,
      (question) => ({
        ...question,
        touched: true,
        options: question.options.map((option) =>
          option.id === optionId ? updater(option) : option,
        ),
      }),
      { forceTouch: true },
    )
  }

  const resetState = () => {
    setName('')
    setDescription('')
    setDurationMinutes(60)
    setStartTime('')
    setQuestions([createQuestion()])
    setHasSubmitted(false)
  }

  const normalisedStartTime = useMemo(() => {
    if (!startTime) return null
    const parsed = new Date(startTime)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }, [startTime])

  const derivedEndDate = useMemo(() => {
    if (!normalisedStartTime) return null
    if (durationMinutes === '' || Number(durationMinutes) <= 0) return null
    const start = new Date(normalisedStartTime)
    const end = new Date(start.getTime() + Number(durationMinutes) * 60_000)
    return end
  }, [normalisedStartTime, durationMinutes])

  const derivedEndLocal = useMemo(() => {
    if (!derivedEndDate) return ''
    const pad = (value: number) => value.toString().padStart(2, '0')
    const year = derivedEndDate.getFullYear()
    const month = pad(derivedEndDate.getMonth() + 1)
    const day = pad(derivedEndDate.getDate())
    const hours = pad(derivedEndDate.getHours())
    const minutes = pad(derivedEndDate.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }, [derivedEndDate])

  const normalisedEndTime = useMemo(() => {
    if (!derivedEndDate) return null
    return derivedEndDate.toISOString()
  }, [derivedEndDate])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!normalisedStartTime || !normalisedEndTime) {
      setError('Please provide a valid start time and duration to schedule the exam.')
      return
    }

    if (durationMinutes === '' || Number.isNaN(durationMinutes) || durationMinutes <= 0) {
      setError('Duration must be a positive number of minutes.')
      return
    }

    setHasSubmitted(true)
    const validatedQuestions = questions.map((question) =>
      applyQuestionValidation(question, true, true),
    )
    setQuestions(validatedQuestions)

    if (validatedQuestions.some((question) => question.error)) {
      setError('Please fix the highlighted questions before creating the exam.')
      return
    }

    const resolvedDuration =
      typeof durationMinutes === 'number' ? durationMinutes : Number(durationMinutes)

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      durationMinutes: resolvedDuration,
      startTime: normalisedStartTime,
      endTime: normalisedEndTime,
      questions: validatedQuestions.map((question, index) => ({
        id: index + 1,
        prompt: question.prompt.trim(),
        type: question.type,
        options:
          question.type === 'mcq'
            ? question.options.map((option) => ({
                text: option.text.trim(),
                isCorrect: option.isCorrect,
              }))
            : undefined,
      })),
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to create exam.'
        setError(message)
        return
      }

      setSuccess('Exam created successfully.')
      resetState()

      setTimeout(() => {
        router.push('/admin')
      }, 1200)
    } catch (submitError) {
      console.error('Failed to create exam', submitError)
      setError('Unexpected error while creating exam.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create New Exam</h1>
            <p className={`text-sm ${mutedTextClass}`}>
              Design the exam, configure timing, and add up to {MAX_QUESTIONS} questions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={
                isDark
                  ? 'rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
                  : 'rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
              }
              aria-label="Toggle theme"
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <Link href="/admin" className={linkButtonClass}>
              ← Back to Admin
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`space-y-8 rounded-2xl p-6 ${containerCardClass}`}
        >
          <section className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${labelTextClass}`}>Exam name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className={`mt-2 w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${inputBaseClass}`}
                placeholder="e.g. Introduction to AI — Midterm"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelTextClass}`}>Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className={`mt-2 w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${inputBaseClass}`}
                placeholder="Optional details for admins and students."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className={`block text-sm font-medium ${labelTextClass}`}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(event.target.value === '' ? '' : Number(event.target.value))
                  }
                  className={`mt-2 w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${inputBaseClass}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${labelTextClass}`}>Start time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                  className={`mt-2 w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${inputBaseClass}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${labelTextClass}`}>End time</label>
                <input
                  type="datetime-local"
                  value={derivedEndLocal}
                  readOnly
                  className={`mt-2 w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${readOnlyInputClass}`}
                  placeholder="Select start time and duration"
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Questions</h2>
                <p className={`text-sm ${mutedTextClass}`}>
                  Currently supporting text and multiple-choice questions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                disabled={!canAddQuestion}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-500 disabled:bg-white/20 disabled:text-white/60'
                    : 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300/60 disabled:text-blue-100'
                }`}
              >
                + Add question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => {
                const questionHasError = Boolean(question.error)
                const promptError =
                  questionHasError && question.error?.toLowerCase().includes('prompt')
                const optionError =
                  questionHasError && question.error?.toLowerCase().includes('option')
                const correctError =
                  questionHasError && question.error?.toLowerCase().includes('correct')

                const questionContainerClass = questionHasError
                  ? `space-y-4 rounded-xl p-5 ${questionCardErrorClass}`
                  : `space-y-4 rounded-xl p-5 ${questionCardBaseClass}`

                return (
                  <div key={question.id} className={questionContainerClass}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={`text-sm font-semibold uppercase tracking-wide ${
                            isDark ? 'text-white/50' : 'text-gray-400'
                          }`}
                        >
                          Question {index + 1}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                          Type: {question.type === 'mcq' ? 'Multiple choice' : 'Text response'}
                        </p>
                      </div>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(question.id)}
                          className={`text-sm transition ${
                            isDark ? 'text-red-300 hover:text-red-200' : 'text-red-600 hover:text-red-500'
                          }`}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                      <div>
                        <label className={`block text-sm font-medium ${labelTextClass}`}>
                          Prompt
                        </label>
                        <textarea
                          value={question.prompt}
                          onChange={(event) =>
                            updateQuestion(
                              question.id,
                              (prev) => ({
                                ...prev,
                                prompt: event.target.value,
                                touched: true,
                              }),
                              { forceTouch: true },
                            )
                          }
                          rows={3}
                          required
                          className={`mt-2 w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 ${
                            promptError
                              ? isDark
                                ? 'border-red-400 bg-red-500/10 focus:border-red-400 focus:ring-red-400/60 text-white placeholder:text-white/40'
                                : 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200 text-gray-900 placeholder:text-gray-400'
                              : `${inputBaseClass}`
                          }`}
                          placeholder="Describe the concept of machine learning."
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${labelTextClass}`}>
                          Question type
                        </label>
                        <select
                          value={question.type}
                          onChange={(event) => {
                            const nextType = event.target.value as QuestionType
                            updateQuestion(
                              question.id,
                              (prev) => ({
                                ...prev,
                                type: nextType,
                                touched: true,
                                options:
                                  nextType === 'mcq'
                                    ? prev.options.length
                                      ? prev.options
                                      : [createOption(), createOption()]
                                    : [],
                              }),
                              { forceTouch: true },
                            )
                          }}
                          className={`mt-2 w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${inputBaseClass}`}
                        >
                          <option value="text">Text</option>
                          <option value="mcq">Multiple choice</option>
                        </select>
                      </div>
                    </div>

                    {question.type === 'mcq' && (
                      <div className="space-y-3">
                        <p
                          className={`text-sm font-medium ${
                            optionError || correctError
                              ? isDark
                                ? 'text-red-200'
                                : 'text-red-600'
                              : isDark
                              ? 'text-white/80'
                              : 'text-gray-700'
                          }`}
                        >
                          Answer options
                        </p>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => {
                            const optionSpecificError = question.error?.includes(
                              `Option ${optionIndex + 1}`,
                            )
                            const highlightOption = optionSpecificError || optionError

                            return (
                              <div
                                key={option.id}
                                className={`flex flex-col gap-2 rounded-lg p-4 md:flex-row md:items-center ${
                                  highlightOption ? optionContainerError : optionContainerBase
                                }`}
                              >
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(event) =>
                                    updateOption(question.id, option.id, (prev) => ({
                                      ...prev,
                                      text: event.target.value,
                                    }))
                                  }
                                  className={`flex-1 rounded-lg border bg-transparent px-3 py-2 focus:outline-none focus:ring-2 ${
                                    highlightOption
                                      ? isDark
                                        ? 'border-red-400 text-white placeholder:text-white/40 focus:border-red-400 focus:ring-red-400/60'
                                        : 'border-red-300 text-gray-900 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-200'
                                      : `${inputBaseClass}`
                                  }`}
                                  placeholder="Option text"
                                />
                                <div className="flex items-center gap-3">
                                  <label
                                    className={`flex items-center gap-2 text-sm ${
                                      correctError
                                        ? isDark
                                          ? 'text-red-200'
                                          : 'text-red-600'
                                        : isDark
                                        ? 'text-white/80'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={option.isCorrect}
                                      onChange={(event) =>
                                        updateOption(question.id, option.id, (prev) => ({
                                          ...prev,
                                          isCorrect: event.target.checked,
                                        }))
                                      }
                                      className={`h-4 w-4 rounded focus:ring-blue-500/60 ${
                                        correctError ? 'ring-1 ring-red-400/60' : ''
                                      } ${
                                        isDark
                                          ? 'border-white/20 bg-transparent text-blue-500'
                                          : 'border-gray-300 bg-white text-blue-600'
                                      }`}
                                    />
                                    Correct answer
                                  </label>
                                  {question.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(question.id, option.id)}
                                      className={`text-sm transition ${
                                        isDark
                                          ? 'text-red-300 hover:text-red-200'
                                          : 'text-red-600 hover:text-red-500'
                                      }`}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => addOption(question.id)}
                          className={addElementButtonClass}
                        >
                          + Add option
                        </button>
                      </div>
                    )}

                    {question.error && (
                      <div
                        className={
                          isDark
                            ? 'rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200'
                            : 'rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700'
                        }
                      >
                        {question.error}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {error && (
            <div className={globalErrorClass}>{error}</div>
          )}

          {success && (
            <div className={globalSuccessClass}>{success}</div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetState}
              className={secondaryButtonClass}
              disabled={isSubmitting}
            >
              Reset form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center rounded-lg px-5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-500 disabled:bg-white/20 disabled:text-white/60'
                  : 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300/60 disabled:text-blue-100'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ExamQuestion } from '@/lib/types/database'

const MAX_QUESTIONS = 50
const SUPPORTED_QUESTION_TYPES = ['text', 'mcq'] as const

type SupportedQuestionType = (typeof SUPPORTED_QUESTION_TYPES)[number]

interface QuestionPayload {
  prompt?: unknown
  type?: unknown
  options?: unknown
}

interface ExamPayload {
  name?: unknown
  description?: unknown
  durationMinutes?: unknown
  duration_minutes?: unknown
  startTime?: unknown
  start_time?: unknown
  endTime?: unknown
  end_time?: unknown
  questions?: unknown
}

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const parsePositiveInteger = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }
  return null
}

const sanitizeQuestions = (rawQuestions: unknown): ExamQuestion[] | null => {
  if (!rawQuestions) return []
  if (!Array.isArray(rawQuestions)) return null

  if (rawQuestions.length > MAX_QUESTIONS) {
    return null
  }

  const normalized: ExamQuestion[] = []

  for (const item of rawQuestions) {
    const question = item as QuestionPayload
    const promptCandidate =
      typeof question.prompt === 'string'
        ? question.prompt
        : typeof (question as Record<string, unknown>).question === 'string'
        ? (question as Record<string, unknown>).question as string
        : null

    const prompt = promptCandidate?.trim()
    if (!prompt) {
      return null
    }

    const typeCandidate =
      typeof question.type === 'string' ? question.type.toLowerCase() : 'text'
    const type = SUPPORTED_QUESTION_TYPES.includes(
      typeCandidate as SupportedQuestionType,
    )
      ? (typeCandidate as SupportedQuestionType)
      : null

    if (!type) {
      return null
    }

    if (type === 'mcq') {
      if (!Array.isArray(question.options) || question.options.length < 2) {
        return null
      }

      const options = question.options
        .map((rawOption) => {
          if (typeof rawOption === 'string') {
            const optionText = rawOption.trim()
            return optionText
              ? { text: optionText, isCorrect: false }
              : null
          }

          if (rawOption && typeof rawOption === 'object') {
            const option = rawOption as Record<string, unknown>
            const textCandidate =
              typeof option.text === 'string'
                ? option.text
                : typeof option.option_text === 'string'
                ? option.option_text
                : null

            const text = textCandidate?.trim()
            if (!text) return null

            const isCorrectValue = option.isCorrect ?? option.is_correct
            const isCorrect =
              typeof isCorrectValue === 'boolean' ? isCorrectValue : false

            return { text, isCorrect }
          }

          return null
        })
        .filter(
          (entry): entry is { text: string; isCorrect: boolean } => entry !== null,
        )

      if (options.length < 2 || !options.some((option) => option.isCorrect)) {
        return null
      }

      normalized.push({
        id: normalized.length + 1,
        prompt,
        type: 'mcq',
        options,
      })
    } else {
      normalized.push({
        id: normalized.length + 1,
        prompt,
        type: 'text',
      })
    }
  }

  return normalized
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile lookup error:', profileError)
      return NextResponse.json({ 
        error: 'Unable to verify user permissions. Please ensure your account is properly set up.' 
      }, { status: 403 })
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin privileges required to create exams.' 
      }, { status: 403 })
    }

    const payload = (await request.json()) as ExamPayload

    const name =
      typeof payload.name === 'string' ? payload.name.trim() : null

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 },
      )
    }

    const duration =
      parsePositiveInteger(payload.durationMinutes) ??
      parsePositiveInteger(payload.duration_minutes)

    if (!duration) {
      return NextResponse.json(
        { error: 'durationMinutes must be a positive integer' },
        { status: 400 },
      )
    }

    const start =
      parseDate(payload.startTime) ?? parseDate(payload.start_time)
    const end = parseDate(payload.endTime) ?? parseDate(payload.end_time)

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Valid startTime and endTime are required' },
        { status: 400 },
      )
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'endTime must be after startTime' },
        { status: 400 },
      )
    }

    const questions = sanitizeQuestions(payload.questions)

    if (questions === null) {
      return NextResponse.json(
        {
          error:
            'Questions must be an array with up to 50 entries. MCQ questions require at least two options and one correct answer.',
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('exams')
      .insert({
        name,
        description:
          typeof payload.description === 'string'
            ? payload.description.trim()
            : null,
        duration_minutes: duration,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        created_by: user.id,
        questions,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create exam', error)
      return NextResponse.json(
        { error: 'Failed to create exam' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        examId: data.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating exam', error)
    return NextResponse.json(
      { error: 'Unexpected error while creating exam' },
      { status: 500 },
    )
  }
}

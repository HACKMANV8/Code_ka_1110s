import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

/**
 * POST /api/exam/ai-review
 * Get comprehensive AI review for the entire exam
 */
export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify student has access
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('student_id, exam_id, status')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if exam is submitted
    if (session.status === 'in_progress') {
      return NextResponse.json(
        { error: 'Cannot review exam that is still in progress' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== session.student_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch exam with questions
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, name, questions')
      .eq('id', session.exam_id)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Get exam results
    const { data: result } = await supabase
      .from('exam_results')
      .select('*')
      .eq('session_id', session_id)
      .single();

    // Get all student answers
    const { data: answers } = await supabase
      .from('student_answers')
      .select('*')
      .eq('session_id', session_id);

    const questions = exam.questions as Question[];
    
    // Try RAG system first, fallback to Gemini if it fails
    const useRAG = process.env.RAG_API_URL && process.env.RAG_API_URL !== '';
    
    if (useRAG) {
      try {
        console.log('Using RAG system for AI review...');
        const ragReview = await getRAGReview(
          exam.name,
          questions,
          answers || [],
          result
        );
        
        return NextResponse.json({
          review: ragReview.text,
          method: 'rag',
          sources: ragReview.sources || []
        });
      } catch (ragError) {
        console.error('RAG system failed, falling back to Gemini:', ragError);
        // Continue to Gemini fallback below
      }
    }
    
    // Build comprehensive prompt for Gemini
    const prompt = buildComprehensiveReviewPrompt(
      exam.name,
      questions,
      answers || [],
      result
    );

    // Call Gemini AI
    const review = await getGeminiReview(prompt);

    // Save to review history (don't block if this fails)
    supabase
      .from('exam_review_history')
      .insert({
        session_id,
        student_id: user.id,
        question_id: null, // NULL for full exam review
        requested_ai_explanation: true,
        ai_explanation_text: review.text,
        ai_explanation_tokens: review.tokens,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Failed to save review history:', error);
        }
      });

    return NextResponse.json({
      success: true,
      review: review.text,
      tokens_used: review.tokens,
      exam_name: exam.name,
      result_summary: result ? {
        percentage: result.percentage,
        grade: result.grade,
        correct_answers: result.correct_answers,
        total_questions: result.total_questions,
        focus_score: result.focus_score,
      } : null,
    });

  } catch (error) {
    console.error('AI Review API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI review';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function buildComprehensiveReviewPrompt(
  examName: string,
  questions: Question[],
  answers: any[],
  result: any
): string {
  let prompt = `You are an expert educator providing a comprehensive review of a student's exam performance.

Exam: ${examName}
`;

  if (result) {
    prompt += `
Performance Summary:
- Score: ${result.percentage}% (${result.marks_obtained}/${result.total_marks} marks)
- Grade: ${result.grade}
- Correct Answers: ${result.correct_answers}/${result.total_questions}
- Wrong Answers: ${result.wrong_answers}
- Focus Score: ${result.focus_score}%
- Status: ${result.pass_status ? 'PASSED' : 'FAILED'}
`;
  }

  prompt += `\n\nQuestion-by-Question Analysis:\n\n`;

  questions.forEach((question, index) => {
    const answer = answers.find(a => String(a.question_id) === String(question.id));
    
    prompt += `Question ${index + 1}: ${question.prompt}\n`;
    prompt += `Type: ${question.type}\n`;
    
    if (question.topic) prompt += `Topic: ${question.topic}\n`;
    if (question.difficulty) prompt += `Difficulty: ${question.difficulty}\n`;
    
    if (question.options) {
      prompt += `Options:\n`;
      question.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        prompt += `  ${letter}. ${opt.text}${opt.isCorrect ? ' ✓ [CORRECT]' : ''}\n`;
      });
    }
    
    if (answer) {
      prompt += `Student's Answer: `;
      if (answer.selected_options && answer.selected_options.length > 0) {
        prompt += `${answer.selected_options.join(', ')}\n`;
      } else if (answer.text_answer) {
        prompt += `${answer.text_answer}\n`;
      } else {
        prompt += `Not answered\n`;
      }
      prompt += `Result: ${answer.is_correct ? '✓ CORRECT' : '✗ INCORRECT'}\n`;
    } else {
      prompt += `Student's Answer: Not answered\n`;
    }
    
    prompt += `\n`;
  });

  prompt += `\nPlease provide:
1. Overall Performance Analysis - Strengths and areas for improvement
2. Question-by-Question Insights - For each incorrect answer, explain:
   - Why the student's answer was wrong
   - Why the correct answer is right
   - Key concepts the student should review
3. Study Recommendations - Specific topics and areas to focus on
4. Encouragement and Next Steps - Motivational advice and action items

Format your response in clear sections with markdown formatting.`;

  return prompt;
}

/**
 * Get AI review using RAG system
 */
async function getRAGReview(
  examName: string,
  questions: Question[],
  answers: any[],
  result: any
): Promise<{ text: string; sources?: any[] }> {
  const ragApiUrl = process.env.RAG_API_URL || 'http://localhost:8001';
  
  // Build context about the student's performance
  const performanceSummary = `
Exam: ${examName}
Total Questions: ${questions.length}
Correct Answers: ${result?.correct_answers || 0}
Wrong Answers: ${result?.wrong_answers || 0}
Score: ${result?.marks_obtained || 0}/${result?.total_marks || 0} (${result?.percentage || 0}%)
Grade: ${result?.grade || 'N/A'}

Incorrectly Answered Questions:
${questions.map((q, idx) => {
  const answer = answers?.find(a => String(a.question_id) === String(q.id || idx + 1));
  if (answer && !answer.is_correct) {
    return `- Question ${idx + 1}: ${q.prompt}\n  Student's Answer: ${answer.selected_options?.join(', ') || answer.text_answer || 'Not answered'}`;
  }
  return null;
}).filter(Boolean).join('\n')}

Please provide a comprehensive review focusing on:
1. Overall performance analysis
2. Detailed explanation of concepts from incorrectly answered questions
3. Study recommendations based on the exam material
4. Encouragement and next steps
`;

  try {
    const response = await fetch(`${ragApiUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: performanceSummary,
        session_id: result?.session_id || 'review'
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`RAG API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    return {
      text: data.answer,
      sources: data.sources
    };
  } catch (error: any) {
    console.error('RAG system error:', error);
    throw new Error(`RAG system unavailable: ${error.message}`);
  }
}

async function getGeminiReview(prompt: string): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Missing Gemini API key');
    throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
  }

  // Use v1 endpoint with latest model
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  console.log('Calling Gemini API with URL:', url.replace(apiKey, '***'));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        url: url.replace(apiKey, '***'),
        error: errorText,
      });
      
      if (response.status === 401) {
        throw new Error('Gemini API authentication failed. Invalid or expired API key.');
      } else if (response.status === 404) {
        throw new Error('Gemini API endpoint not found. The model or endpoint may have changed.');
      } else if (response.status === 429) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Gemini API failed: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected Gemini API response format:', data);
      throw new Error('Invalid response from Gemini API');
    }
    
    const textContent = data.candidates[0].content.parts[0]?.text || 'No review generated';
    const tokens = data.usageMetadata?.totalTokenCount || 0;
    
    return {
      text: textContent,
      tokens: tokens,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Gemini API request failed: ${String(error)}`);
  }
}

async function getAzureOpenAIReview(prompt: string): Promise<{ text: string; tokens: number }> {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';

  if (!apiKey || !endpoint) {
    console.error('Missing Azure OpenAI credentials', {
      hasKey: !!apiKey,
      hasEndpoint: !!endpoint,
      deploymentName
    });
    throw new Error('Azure OpenAI credentials not configured. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT environment variables.');
  }

  // Ensure endpoint doesn't have trailing slash
  const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
  const url = `${cleanEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator providing comprehensive, encouraging, and insightful exam reviews to help students learn and improve.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url.replace(apiKey, '***'),
      });
      
      if (response.status === 401) {
        throw new Error('Azure OpenAI API authentication failed. Check your API key.');
      } else if (response.status === 404) {
        throw new Error('Azure OpenAI deployment not found. Check your endpoint and deployment name.');
      } else {
        throw new Error(`Azure OpenAI API failed: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      console.error('Unexpected Azure OpenAI response format:', data);
      throw new Error('Invalid response from Azure OpenAI API');
    }
    
    return {
      text: data.choices[0].message?.content || 'No review generated',
      tokens: data.usage?.total_tokens || 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Azure OpenAI API request failed: ${String(error)}`);
  }
}

import React from 'react';
import { 
  Sparkles, 
  Database, 
  Layers, 
  Zap, 
  FileText, 
  Search,
  Brain,
  CheckCircle
} from 'lucide-react';

export function RAGSystemTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      <h2 className="text-slate-900 mb-6">RAG-Powered Question Analysis System</h2>
      
      <div className="space-y-6">
        {/* Overview */}
        <Section
          title="Retrieval-Augmented Generation (RAG) Architecture"
          icon={<Sparkles className="w-5 h-5" />}
          color="purple"
        >
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <h4 className="text-purple-900 mb-2">Purpose & Design</h4>
            <p className="text-sm text-purple-700 mb-3">
              Intelligent question analysis system that combines vector search with LLM generation to provide 
              contextually relevant, exam-specific assistance. Analyzes student answers in real-time and 
              generates tailored feedback, hints, or grading assistance based on the specific question context.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="text-purple-800 mb-1">Key Components</h5>
                <ul className="space-y-1 text-purple-700">
                  <li>• Vector database (embeddings)</li>
                  <li>• Embedding model (OpenAI/local)</li>
                  <li>• LLM (GPT-4, Claude, Llama)</li>
                  <li>• Question corpus indexing</li>
                </ul>
              </div>
              <div>
                <h5 className="text-purple-800 mb-1">Use Cases</h5>
                <ul className="space-y-1 text-purple-700">
                  <li>• Contextual hint generation</li>
                  <li>• Answer quality assessment</li>
                  <li>• Automated grading assistance</li>
                  <li>• Plagiarism detection</li>
                </ul>
              </div>
              <div>
                <h5 className="text-purple-800 mb-1">Benefits</h5>
                <ul className="space-y-1 text-purple-700">
                  <li>• Question-specific responses</li>
                  <li>• Reduces hallucination</li>
                  <li>• Consistent grading criteria</li>
                  <li>• Scalable to large exams</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComponentCard
              title="Traditional LLM Approach"
              subtitle="Without RAG"
              details={[
                'Generic responses not tailored to exam',
                'May hallucinate grading criteria',
                'Inconsistent across similar questions',
                'No access to exam-specific context',
                'Limited by model training cutoff',
                '❌ Not ideal for exam grading'
              ]}
              color="slate"
            />
            <ComponentCard
              title="RAG-Enhanced Approach"
              subtitle="With Context Retrieval"
              details={[
                'Retrieves relevant question context',
                'Uses actual grading rubrics',
                'Consistent with exam guidelines',
                'Grounded in specific exam materials',
                'Adapts to custom question types',
                '✅ Optimal for exam scenarios'
              ]}
              color="emerald"
            />
          </div>
        </Section>

        {/* RAG Pipeline */}
        <Section
          title="RAG Pipeline Architecture"
          icon={<Layers className="w-5 h-5" />}
          color="blue"
          highlight
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-900 mb-3">End-to-End Pipeline Flow</h4>
              <div className="space-y-3">
                {[
                  {
                    step: 1,
                    title: 'Indexing Phase (Offline)',
                    description: 'Build vector database from exam questions and materials',
                    details: [
                      'Load question text, rubrics, sample answers',
                      'Generate embeddings using embedding model',
                      'Store in vector DB (Pinecone, Weaviate, Chroma)',
                      'Create metadata mappings (exam_id, question_id)'
                    ]
                  },
                  {
                    step: 2,
                    title: 'Query Phase (Real-time)',
                    description: 'Student submits answer or requests hint',
                    details: [
                      'Receive student query or answer text',
                      'Generate query embedding',
                      'Vector similarity search in database',
                      'Retrieve top-k relevant documents'
                    ]
                  },
                  {
                    step: 3,
                    title: 'Augmentation Phase',
                    description: 'Prepare context for LLM',
                    details: [
                      'Combine retrieved documents',
                      'Format as context block',
                      'Construct prompt with question + context',
                      'Add system instructions (grading, hints, etc.)'
                    ]
                  },
                  {
                    step: 4,
                    title: 'Generation Phase',
                    description: 'LLM generates tailored response',
                    details: [
                      'Send augmented prompt to LLM',
                      'LLM generates context-aware response',
                      'Post-process output (formatting, safety)',
                      'Return to student or store for grading'
                    ]
                  }
                ].map((phase) => (
                  <PipelinePhase key={phase.step} {...phase} />
                ))}
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm">
              <h5 className="text-slate-300 mb-2">RAG Pipeline Code Example</h5>
              <pre>{`// 1. Generate embedding for student answer
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: studentAnswer
});

// 2. Vector similarity search
const results = await vectorDB.query({
  vector: embedding.data[0].embedding,
  filter: { exam_id: currentExamId },
  topK: 3
});

// 3. Build context from retrieved docs
const context = results.matches.map(match => 
  \`Question: \${match.metadata.question_text}
   Grading Rubric: \${match.metadata.rubric}
   Sample Answer: \${match.metadata.sample_answer}\`
).join('\\n\\n');

// 4. Generate LLM response
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "You are grading an exam answer. Use the provided rubric."
    },
    {
      role: "user",
      content: \`Context:\\n\${context}\\n\\nStudent Answer:\\n\${studentAnswer}\\n\\nProvide grading feedback.\`
    }
  ]
});

return completion.choices[0].message.content;`}</pre>
            </div>
          </div>
        </Section>

        {/* Vector Database */}
        <Section
          title="Vector Database & Embeddings"
          icon={<Database className="w-5 h-5" />}
          color="emerald"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VectorDBCard
                name="Pinecone"
                description="Fully managed vector database"
                pros={[
                  'Fully managed, no infrastructure',
                  'Fast similarity search (<100ms)',
                  'Scales automatically',
                  'Built-in metadata filtering'
                ]}
                cons={[
                  'Paid service (costs add up)',
                  'Vendor lock-in',
                  'Rate limits on free tier'
                ]}
                usage="Production-ready, low maintenance"
              />

              <VectorDBCard
                name="Chroma"
                description="Open-source embedding database"
                pros={[
                  'Free and open source',
                  'Easy local development',
                  'Lightweight, embeddings in-memory',
                  'Great for prototyping'
                ]}
                cons={[
                  'Limited scalability',
                  'Self-hosted complexity',
                  'Fewer production features'
                ]}
                usage="Development, small-scale deployments"
              />

              <VectorDBCard
                name="Weaviate"
                description="Open-source vector search engine"
                pros={[
                  'Hybrid search (vector + keyword)',
                  'GraphQL API',
                  'Self-hosted or cloud',
                  'Multi-tenancy support'
                ]}
                cons={[
                  'More complex setup',
                  'Resource intensive',
                  'Steeper learning curve'
                ]}
                usage="Enterprise, complex search needs"
              />

              <VectorDBCard
                name="Supabase pgvector"
                description="Postgres extension for vectors"
                pros={[
                  'Already using Supabase!',
                  'No additional service',
                  'SQL-based queries',
                  'Cost-effective'
                ]}
                cons={[
                  'Slower than specialized DBs',
                  'Limited to ~1M vectors',
                  'Manual optimization needed'
                ]}
                usage="Small-medium scale, cost-conscious"
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="text-emerald-900 mb-3">Embedding Models Comparison</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded p-3 border border-emerald-200">
                  <h5 className="text-emerald-800 mb-2">OpenAI text-embedding-3-small</h5>
                  <ul className="space-y-1 text-emerald-700 text-xs">
                    <li>• Dimensions: 1536</li>
                    <li>• Cost: $0.02 / 1M tokens</li>
                    <li>• Performance: Excellent</li>
                    <li>• Latency: ~100-200ms</li>
                    <li>• Best for: Production use</li>
                  </ul>
                </div>
                <div className="bg-white rounded p-3 border border-emerald-200">
                  <h5 className="text-emerald-800 mb-2">Sentence Transformers (Local)</h5>
                  <ul className="space-y-1 text-emerald-700 text-xs">
                    <li>• Dimensions: 384-768</li>
                    <li>• Cost: Free (self-hosted)</li>
                    <li>• Performance: Good</li>
                    <li>• Latency: ~50-100ms (GPU)</li>
                    <li>• Best for: Privacy, cost savings</li>
                  </ul>
                </div>
                <div className="bg-white rounded p-3 border border-emerald-200">
                  <h5 className="text-emerald-800 mb-2">Cohere Embed v3</h5>
                  <ul className="space-y-1 text-emerald-700 text-xs">
                    <li>• Dimensions: 1024</li>
                    <li>• Cost: $0.10 / 1M tokens</li>
                    <li>• Performance: Excellent</li>
                    <li>• Latency: ~100ms</li>
                    <li>• Best for: Multilingual</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Document Indexing */}
        <Section
          title="Document Indexing Strategy"
          icon={<FileText className="w-5 h-5" />}
          color="indigo"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IndexingStrategy
                title="Question-Level Indexing"
                description="Each question is a separate document"
                structure={{
                  'Document ID': 'question_{question_id}',
                  'Text': 'Full question text',
                  'Metadata': {
                    exam_id: 'uuid',
                    question_id: 'uuid',
                    question_type: 'mcq | essay | code',
                    points: 'integer',
                    difficulty: 'easy | medium | hard'
                  }
                }}
                example={`{
  "id": "question_abc123",
  "text": "Explain the difference between REST and GraphQL...",
  "metadata": {
    "exam_id": "exam_xyz",
    "question_type": "essay",
    "points": 10,
    "topic": "API Design"
  }
}`}
              />

              <IndexingStrategy
                title="Rubric-Enhanced Indexing"
                description="Include grading rubric in the document"
                structure={{
                  'Document ID': 'rubric_{question_id}',
                  'Text': 'Question + Grading criteria combined',
                  'Metadata': {
                    exam_id: 'uuid',
                    question_id: 'uuid',
                    rubric_points: 'array',
                    sample_answer: 'text'
                  }
                }}
                example={`{
  "id": "rubric_abc123",
  "text": "Question: Explain REST vs GraphQL\\n\\nRubric:\\n- Mentions statelessness (3pts)\\n- Explains query language (4pts)\\n- Compares use cases (3pts)",
  "metadata": {
    "sample_answer": "REST is stateless..."
  }
}`}
              />
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="text-indigo-900 mb-3">Chunking Strategies for Long Content</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h5 className="text-indigo-800 mb-2">Fixed-Size Chunking</h5>
                  <ul className="space-y-1 text-indigo-700">
                    <li>• Split by token count (512-1024)</li>
                    <li>• Overlap chunks by 10-20%</li>
                    <li>• Simple, works for most cases</li>
                    <li>• May break semantic units</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-indigo-800 mb-2">Semantic Chunking</h5>
                  <ul className="space-y-1 text-indigo-700">
                    <li>• Split by paragraphs/sections</li>
                    <li>• Preserve logical boundaries</li>
                    <li>• Better context preservation</li>
                    <li>• Requires parsing logic</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-indigo-800 mb-2">Hybrid Approach</h5>
                  <ul className="space-y-1 text-indigo-700">
                    <li>• Semantic splits first</li>
                    <li>• Then fixed-size if too large</li>
                    <li>• Best of both worlds</li>
                    <li>• Recommended for exams</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs">
              <h5 className="text-slate-300 mb-2">Indexing Pipeline Code</h5>
              <pre>{`// Build vector index for all exam questions
async function indexExamQuestions(examId) {
  // 1. Fetch all questions from Supabase
  const { data: questions } = await supabase
    .from('exam_questions')
    .select('*, grading_rubrics(*)')
    .eq('exam_id', examId);

  // 2. Prepare documents for indexing
  const documents = questions.map(q => ({
    id: \`question_\${q.id}\`,
    text: \`Question: \${q.question_text}\\n\\nRubric: \${q.grading_rubrics?.criteria}\\n\\nSample Answer: \${q.grading_rubrics?.sample_answer || 'N/A'}\`,
    metadata: {
      exam_id: examId,
      question_id: q.id,
      question_type: q.question_type,
      points: q.points,
      topic: q.topic
    }
  }));

  // 3. Generate embeddings in batch
  const embeddings = await generateEmbeddingsBatch(
    documents.map(d => d.text)
  );

  // 4. Upsert to vector database
  await vectorDB.upsert({
    vectors: embeddings.map((emb, i) => ({
      id: documents[i].id,
      values: emb,
      metadata: documents[i].metadata
    }))
  });

  console.log(\`Indexed \${documents.length} questions for exam \${examId}\`);
}`}</pre>
            </div>
          </div>
        </Section>

        {/* LLM Integration */}
        <Section
          title="LLM Integration & Prompt Engineering"
          icon={<Brain className="w-5 h-5" />}
          color="amber"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UseCase
                title="Answer Grading"
                prompt={`System: You are an exam grader. Use the provided rubric to grade the student's answer objectively.

Context:
{retrieved_rubric_and_samples}

Student Answer:
{student_answer}

Provide:
1. Score (out of {total_points})
2. Justification for each rubric point
3. What was done well
4. What could be improved`}
                output="Structured grading with score and detailed feedback"
              />

              <UseCase
                title="Hint Generation"
                prompt={`System: You are helping a student during an exam. Provide a subtle hint without giving away the answer.

Question:
{question_text}

Student's current attempt:
{student_partial_answer}

Provide a helpful hint that:
- Guides thinking without solving
- References relevant concepts
- Encourages critical thinking
- Is fair for exam conditions`}
                output="Pedagogical hint that maintains exam integrity"
              />

              <UseCase
                title="Plagiarism Detection"
                prompt={`System: Analyze if this answer shows signs of plagiarism or use of unauthorized AI assistance.

Question:
{question_text}

Student Answer:
{student_answer}

Sample Answers from Database:
{retrieved_similar_answers}

Analyze for:
1. Unusual similarity to samples
2. Inconsistent writing style
3. Unexpectedly advanced vocabulary
4. Generic AI-generated patterns

Return: risk_level (low/medium/high) and reasoning`}
                output="Plagiarism risk assessment with evidence"
              />

              <UseCase
                title="Concept Extraction"
                prompt={`System: Extract key concepts from this exam question for categorization and search.

Question:
{question_text}

Extract:
1. Main topic (e.g., "Database Normalization")
2. Subtopics (e.g., ["3NF", "BCNF", "Functional Dependencies"])
3. Difficulty level
4. Prerequisites
5. Related concepts

Return as structured JSON.`}
                output="Structured metadata for better retrieval"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-amber-900 mb-3">Prompt Engineering Best Practices</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="text-amber-800 mb-2">Do's</h5>
                  <ul className="space-y-1 text-amber-700">
                    <li>✓ Clearly define the role (grader, tutor, etc.)</li>
                    <li>✓ Provide explicit rubric and scoring criteria</li>
                    <li>✓ Use structured output formats (JSON, markdown)</li>
                    <li>✓ Include few-shot examples when helpful</li>
                    <li>✓ Specify constraints (fairness, no answer giveaways)</li>
                    <li>✓ Chain-of-thought for complex grading</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-amber-800 mb-2">Don'ts</h5>
                  <ul className="space-y-1 text-amber-700">
                    <li>✗ Assume LLM knows your grading standards</li>
                    <li>✗ Use vague instructions ("be fair")</li>
                    <li>✗ Overload context (keep under 4k tokens)</li>
                    <li>✗ Trust LLM for final grades (human review!)</li>
                    <li>✗ Ignore bias and hallucination risks</li>
                    <li>✗ Skip output validation and sanitization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Implementation Flow */}
        <Section
          title="End-to-End Implementation Flow"
          icon={<Zap className="w-5 h-5" />}
          color="cyan"
        >
          <div className="space-y-4">
            <FlowDiagram
              title="Student Answer Submission → AI Grading"
              steps={[
                {
                  label: 'Student submits answer',
                  tech: 'POST /api/exam/submit-answer',
                  detail: 'Frontend sends answer text + question_id'
                },
                {
                  label: 'Generate query embedding',
                  tech: 'OpenAI Embeddings API',
                  detail: 'Convert answer to vector representation'
                },
                {
                  label: 'Vector similarity search',
                  tech: 'Pinecone/Chroma query',
                  detail: 'Retrieve top-3 relevant rubrics/samples'
                },
                {
                  label: 'Build augmented prompt',
                  tech: 'Template engine',
                  detail: 'Combine question + rubric + answer'
                },
                {
                  label: 'LLM generates grading',
                  tech: 'OpenAI GPT-4 API',
                  detail: 'Structured output: score + feedback'
                },
                {
                  label: 'Validate & store result',
                  tech: 'Supabase insert',
                  detail: 'Save to answer_grades table'
                },
                {
                  label: 'Return to student (optional)',
                  tech: 'API response',
                  detail: 'Show feedback or await admin review'
                }
              ]}
            />

            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <h5 className="text-slate-300 mb-2">Complete API Route Example</h5>
              <pre>{`// /api/exam/grade-answer/route.ts
export async function POST(req: Request) {
  const { question_id, student_answer } = await req.json();

  // 1. Fetch question context
  const { data: question } = await supabase
    .from('exam_questions')
    .select('*, grading_rubrics(*)')
    .eq('id', question_id)
    .single();

  // 2. Generate embedding
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: student_answer
  });

  // 3. Vector search for similar answers
  const searchResults = await vectorDB.query({
    vector: embedding.data[0].embedding,
    filter: { question_id },
    topK: 3
  });

  // 4. Build context
  const context = \`Question: \${question.question_text}
Rubric: \${question.grading_rubrics.criteria}
Sample Answer: \${question.grading_rubrics.sample_answer}

Similar Student Answers:
\${searchResults.matches.map(m => m.metadata.answer_text).join('\\n')}\`;

  // 5. LLM grading
  const grading = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Grade this exam answer using the rubric." },
      { role: "user", content: \`\${context}\\n\\nStudent Answer: \${student_answer}\` }
    ],
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(grading.choices[0].message.content);

  // 6. Store grading
  await supabase.from('answer_grades').insert({
    question_id,
    student_answer,
    ai_score: result.score,
    ai_feedback: result.feedback,
    needs_review: result.score < question.points * 0.6
  });

  return Response.json(result);
}`}</pre>
            </div>
          </div>
        </Section>

        {/* Performance & Costs */}
        <Section
          title="Performance & Cost Considerations"
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricsCard
              title="Performance Benchmarks"
              metrics={[
                { label: 'Embedding generation', value: '~100ms', note: 'per request' },
                { label: 'Vector search (Pinecone)', value: '~50ms', note: '1M vectors' },
                { label: 'LLM generation (GPT-4)', value: '2-5s', note: 'typical answer' },
                { label: 'Total latency', value: '3-6s', note: 'end-to-end' },
                { label: 'Throughput', value: '10-20/min', note: 'with caching' }
              ]}
            />

            <MetricsCard
              title="Cost Estimates (per 1000 answers)"
              metrics={[
                { label: 'Embeddings (OpenAI)', value: '$0.02', note: 'text-embedding-3-small' },
                { label: 'Vector DB (Pinecone)', value: '$0.10', note: 'standard tier' },
                { label: 'LLM (GPT-4)', value: '$3-10', note: 'depends on length' },
                { label: 'Total cost', value: '$3-10', note: 'per 1K answers' },
                { label: 'Alternative (local)', value: '$0.50', note: 'self-hosted LLM' }
              ]}
            />
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-green-900 mb-3">Optimization Strategies</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="text-green-800 mb-2">Caching</h5>
                <ul className="space-y-1 text-green-700">
                  <li>• Cache embeddings for questions</li>
                  <li>• Cache common hint requests</li>
                  <li>• Deduplicate similar answers</li>
                  <li>• Save 30-50% on API calls</li>
                </ul>
              </div>
              <div>
                <h5 className="text-green-800 mb-2">Batching</h5>
                <ul className="space-y-1 text-green-700">
                  <li>• Batch embedding generation</li>
                  <li>• Queue LLM requests</li>
                  <li>• Process in background jobs</li>
                  <li>• Reduce API overhead</li>
                </ul>
              </div>
              <div>
                <h5 className="text-green-800 mb-2">Hybrid Approach</h5>
                <ul className="space-y-1 text-green-700">
                  <li>• Use smaller models for hints</li>
                  <li>• GPT-4 only for final grading</li>
                  <li>• Local models for embeddings</li>
                  <li>• Balance cost and quality</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Summary */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-slate-900 mb-4">RAG System Integration Summary</h3>
        <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-lg p-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Context-Aware AI</div>
                <div className="text-slate-600">RAG ensures LLM responses are grounded in exam-specific materials</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Database className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Vector Search</div>
                <div className="text-slate-600">Semantic similarity retrieves most relevant rubrics and examples</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Brain className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Intelligent Grading</div>
                <div className="text-slate-600">Consistent, rubric-based assessment with detailed feedback</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900">Scalable</div>
                <div className="text-slate-600">Handles thousands of answers with optimized caching and batching</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ 
  title, 
  icon, 
  color, 
  children,
  highlight = false
}: { 
  title: string; 
  icon: React.ReactNode; 
  color: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-50 border-purple-300',
    blue: 'bg-blue-50 border-blue-300',
    emerald: 'bg-emerald-50 border-emerald-300',
    indigo: 'bg-indigo-50 border-indigo-300',
    amber: 'bg-amber-50 border-amber-300',
    cyan: 'bg-cyan-50 border-cyan-300',
    green: 'bg-green-50 border-green-300',
  };

  const highlightClass = highlight ? 'ring-2 ring-blue-400 ring-offset-2' : '';

  return (
    <div className={`border-2 rounded-lg p-6 ${colorClasses[color]} ${highlightClass}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ComponentCard({ title, subtitle, details, color }: {
  title: string;
  subtitle: string;
  details: string[];
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-300',
    emerald: 'bg-emerald-50 border-emerald-300',
  };

  return (
    <div className={`rounded-lg p-4 border-2 ${colorClasses[color]}`}>
      <h4 className="text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 mb-3">{subtitle}</p>
      <ul className="space-y-1.5">
        {details.map((detail, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-slate-400 mt-0.5">•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PipelinePhase({ step, title, description, details }: {
  step: number;
  title: string;
  description: string;
  details: string[];
}) {
  return (
    <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
          {step}
        </div>
        <div>
          <h4 className="text-slate-900">{title}</h4>
          <p className="text-xs text-slate-600">{description}</p>
        </div>
      </div>
      <ul className="ml-8 space-y-1">
        {details.map((detail, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-blue-500 mt-0.5 text-xs">→</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VectorDBCard({ name, description, pros, cons, usage }: {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  usage: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-1">{name}</h4>
      <p className="text-xs text-slate-600 mb-3">{description}</p>
      <div className="mb-3">
        <h5 className="text-sm text-emerald-700 mb-1">Pros:</h5>
        <ul className="space-y-0.5">
          {pros.map((pro, i) => (
            <li key={i} className="text-xs text-slate-600">✓ {pro}</li>
          ))}
        </ul>
      </div>
      <div className="mb-3">
        <h5 className="text-sm text-red-700 mb-1">Cons:</h5>
        <ul className="space-y-0.5">
          {cons.map((con, i) => (
            <li key={i} className="text-xs text-slate-600">✗ {con}</li>
          ))}
        </ul>
      </div>
      <div className="pt-3 border-t border-slate-200 text-xs text-slate-500">
        <strong>Best for:</strong> {usage}
      </div>
    </div>
  );
}

function IndexingStrategy({ title, description, structure, example }: {
  title: string;
  description: string;
  structure: Record<string, any>;
  example: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-600 mb-3">{description}</p>
      <div className="mb-3">
        <h5 className="text-xs text-slate-700 mb-1">Structure:</h5>
        <div className="bg-slate-50 rounded p-2 font-mono text-xs">
          <pre>{JSON.stringify(structure, null, 2)}</pre>
        </div>
      </div>
      <div>
        <h5 className="text-xs text-slate-700 mb-1">Example:</h5>
        <div className="bg-slate-900 text-slate-100 rounded p-2 font-mono text-xs overflow-x-auto">
          <pre>{example}</pre>
        </div>
      </div>
    </div>
  );
}

function UseCase({ title, prompt, output }: {
  title: string;
  prompt: string;
  output: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <div className="mb-3">
        <h5 className="text-xs text-slate-700 mb-1">Prompt Template:</h5>
        <div className="bg-slate-900 text-slate-100 rounded p-3 font-mono text-xs overflow-x-auto">
          <pre>{prompt}</pre>
        </div>
      </div>
      <div className="text-xs text-slate-600">
        <strong>Expected Output:</strong> {output}
      </div>
    </div>
  );
}

function FlowDiagram({ title, steps }: {
  title: string;
  steps: { label: string; tech: string; detail: string }[];
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-4">{title}</h4>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-900">{step.label}</div>
              <div className="text-xs text-cyan-700 font-mono">{step.tech}</div>
              <div className="text-xs text-slate-500">{step.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricsCard({ title, metrics }: {
  title: string;
  metrics: { label: string; value: string; note: string }[];
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {metrics.map((metric, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{metric.label}</span>
            <div className="text-right">
              <div className="font-mono text-green-700">{metric.value}</div>
              <div className="text-xs text-slate-500">{metric.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

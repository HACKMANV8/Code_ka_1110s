import React from 'react';
import { Database, HardDrive, Table, FolderOpen, Zap } from 'lucide-react';

export function DataStorageTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      <h2 className="text-slate-900 mb-6">Data & Storage Architecture</h2>
      
      <div className="space-y-6">
        {/* Supabase Overview */}
        <Section
          title="Supabase Backend Services"
          icon={<Database className="w-5 h-5" />}
          color="emerald"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ServiceCard
              title="Authentication"
              details={[
                'Email/password auth',
                'Session management',
                'JWT tokens',
                'Row-level security'
              ]}
            />
            <ServiceCard
              title="Postgres Database"
              details={[
                'Relational tables',
                'Foreign key constraints',
                'Indexes for performance',
                'Real-time subscriptions'
              ]}
            />
            <ServiceCard
              title="Storage Buckets"
              details={[
                'Object storage',
                'Signed URLs',
                'Access policies',
                'CDN delivery'
              ]}
            />
            <ServiceCard
              title="Realtime Channels"
              details={[
                'WebSocket connections',
                'postgres_changes',
                'broadcast messages',
                'presence tracking'
              ]}
            />
          </div>
        </Section>

        {/* Database Tables */}
        <Section
          title="Postgres Database Schema"
          icon={<Table className="w-5 h-5" />}
          color="blue"
        >
          <div className="space-y-4">
            {/* Core Tables */}
            <div>
              <h4 className="text-slate-900 mb-3">Core Tables</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TableSchema
                  name="profiles"
                  description="User profiles with role tagging"
                  columns={[
                    { name: 'id', type: 'uuid', desc: 'Primary key, linked to auth.users' },
                    { name: 'email', type: 'text', desc: 'User email' },
                    { name: 'role', type: 'text', desc: 'student | admin' },
                    { name: 'full_name', type: 'text', desc: 'Display name' },
                    { name: 'created_at', type: 'timestamp', desc: 'Account creation' }
                  ]}
                />
                
                <TableSchema
                  name="exams"
                  description="Exam definitions and metadata"
                  columns={[
                    { name: 'id', type: 'uuid', desc: 'Primary key' },
                    { name: 'title', type: 'text', desc: 'Exam name' },
                    { name: 'description', type: 'text', desc: 'Instructions' },
                    { name: 'duration_minutes', type: 'integer', desc: 'Time limit' },
                    { name: 'passing_score', type: 'integer', desc: 'Threshold' },
                    { name: 'status', type: 'text', desc: 'active | archived' },
                    { name: 'created_by', type: 'uuid', desc: 'Admin user ID' }
                  ]}
                />
              </div>
            </div>

            {/* Session Tables */}
            <div>
              <h4 className="text-slate-900 mb-3">Session & Tracking Tables</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TableSchema
                  name="exam_sessions"
                  description="Active and completed exam attempts"
                  columns={[
                    { name: 'id', type: 'uuid', desc: 'Primary key' },
                    { name: 'exam_id', type: 'uuid', desc: 'FK to exams' },
                    { name: 'student_id', type: 'uuid', desc: 'FK to profiles' },
                    { name: 'status', type: 'text', desc: 'in_progress | completed | flagged' },
                    { name: 'started_at', type: 'timestamp', desc: 'Session start' },
                    { name: 'ended_at', type: 'timestamp', desc: 'Session end' },
                    { name: 'score', type: 'integer', desc: 'Final score' }
                  ]}
                />
                
                <TableSchema
                  name="cheat_scores"
                  description="Rolling proctoring analytics"
                  columns={[
                    { name: 'id', type: 'uuid', desc: 'Primary key' },
                    { name: 'session_id', type: 'uuid', desc: 'FK to exam_sessions' },
                    { name: 'focus_score', type: 'float', desc: 'Inverted focus (0-1)' },
                    { name: 'alerts', type: 'jsonb', desc: 'Array of alert types' },
                    { name: 'timestamp', type: 'timestamp', desc: 'Record time' },
                    { name: 'metadata', type: 'jsonb', desc: 'Extra context' }
                  ]}
                />
              </div>
            </div>

            {/* Media Tables */}
            <div>
              <h4 className="text-slate-900 mb-3">Media & Evidence Tables</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TableSchema
                  name="suspicious_snapshots"
                  description="Captured images from flagged events"
                  columns={[
                    { name: 'id', type: 'uuid', desc: 'Primary key' },
                    { name: 'session_id', type: 'uuid', desc: 'FK to exam_sessions' },
                    { name: 'image_url', type: 'text', desc: 'Storage bucket path' },
                    { name: 'alert_type', type: 'text', desc: 'Trigger reason' },
                    { name: 'captured_at', type: 'timestamp', desc: 'Snapshot time' },
                    { name: 'ml_confidence', type: 'float', desc: 'Detection confidence' }
                  ]}
                />
                
                <TableSchema
                  name="video_metadata"
                  description="Recorded video clips metadata"
                  columns={[
                    { name: 'id', type: 'uuid', desc: 'Primary key' },
                    { name: 'session_id', type: 'uuid', desc: 'FK to exam_sessions' },
                    { name: 'video_url', type: 'text', desc: 'Storage bucket path' },
                    { name: 'duration_seconds', type: 'integer', desc: 'Clip length' },
                    { name: 'uploaded_at', type: 'timestamp', desc: 'Upload time' },
                    { name: 'event_type', type: 'text', desc: 'Critical event label' }
                  ]}
                />
              </div>
            </div>

            {/* Question & Results Tables */}
            <div>
              <h4 className="text-slate-900 mb-3">Question & Results Tables</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TableSchema
                  name="exam_questions"
                  description="Questions belonging to exams"
                  columns={[
                    { name: 'id', type: 'uuid', desc: 'Primary key' },
                    { name: 'exam_id', type: 'uuid', desc: 'FK to exams' },
                    { name: 'question_text', type: 'text', desc: 'Question content' },
                    { name: 'question_type', type: 'text', desc: 'mcq | essay | code' },
                    { name: 'points', type: 'integer', desc: 'Point value' },
                    { name: 'answer_key', type: 'jsonb', desc: 'Correct answer(s)' }
                  ]}
                />
                
                <TableSchema
                  name="exam_results"
                  description="Performance analytics (future)"
                  columns={[
                    { name: 'id', type: 'uuid', desc: 'Primary key' },
                    { name: 'session_id', type: 'uuid', desc: 'FK to exam_sessions' },
                    { name: 'total_score', type: 'integer', desc: 'Points earned' },
                    { name: 'percentage', type: 'float', desc: 'Score percentage' },
                    { name: 'time_taken', type: 'integer', desc: 'Minutes used' },
                    { name: 'question_breakdown', type: 'jsonb', desc: 'Per-question results' }
                  ]}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Storage Buckets */}
        <Section
          title="Supabase Storage Buckets"
          icon={<HardDrive className="w-5 h-5" />}
          color="purple"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BucketCard
              name="exam-snapshots"
              description="Suspicious frame captures"
              details={[
                'Format: JPEG, PNG',
                'Naming: {session_id}/{timestamp}.jpg',
                'Access: Admin-only via signed URLs',
                'Retention: 90 days (configurable)',
                'CDN-enabled for fast delivery',
                'Automatic thumbnail generation'
              ]}
              usage="~50-200 KB per snapshot, ~10-50 snapshots per session"
            />
            
            <BucketCard
              name="exam-recordings"
              description="Critical event video clips"
              details={[
                'Format: WebM, MP4',
                'Naming: {session_id}/{event_type}_{timestamp}.webm',
                'Access: Admin-only via signed URLs',
                'Retention: 30 days (configurable)',
                'Chunked upload for large files',
                'Optional: Full session recordings'
              ]}
              usage="~1-5 MB per minute, ~5-20 MB per session"
            />
          </div>

          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-purple-900 mb-2 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Bucket Policies
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="text-purple-800 mb-1">Upload Policy</h5>
                <ul className="space-y-1 text-purple-700">
                  <li>• Authenticated users only</li>
                  <li>• Session ownership check</li>
                  <li>• File size limits (10 MB)</li>
                  <li>• MIME type validation</li>
                </ul>
              </div>
              <div>
                <h5 className="text-purple-800 mb-1">Access Policy</h5>
                <ul className="space-y-1 text-purple-700">
                  <li>• No public access</li>
                  <li>• Admin role required</li>
                  <li>• Signed URLs (60 min expiry)</li>
                  <li>• Rate limiting enabled</li>
                </ul>
              </div>
              <div>
                <h5 className="text-purple-800 mb-1">Lifecycle Policy</h5>
                <ul className="space-y-1 text-purple-700">
                  <li>• Auto-delete old files</li>
                  <li>• Archive to cold storage</li>
                  <li>• Compliance retention</li>
                  <li>• Manual purge option</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* Realtime Channels */}
        <Section
          title="Realtime Channels & Subscriptions"
          icon={<Zap className="w-5 h-5" />}
          color="amber"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ChannelCard
                name="postgres_changes"
                description="Database change notifications"
                events={[
                  'cheat_scores INSERT',
                  'exam_sessions UPDATE',
                  'suspicious_snapshots INSERT'
                ]}
                use="Real-time leaderboard updates"
              />
              
              <ChannelCard
                name="webrtc:{roomId}"
                description="WebRTC signaling channel"
                events={[
                  'offer (student → admin)',
                  'answer (admin → student)',
                  'ice_candidate (bidirectional)'
                ]}
                use="Peer connection negotiation"
              />
              
              <ChannelCard
                name="exam:{examId}"
                description="Exam-specific broadcasts"
                events={[
                  'student_joined',
                  'student_left',
                  'critical_alert',
                  'exam_ended'
                ]}
                use="Admin notification system"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-amber-900 mb-3">Realtime Architecture</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="text-amber-800 mb-2">Client Subscription</h5>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Initialize Supabase client</li>
                    <li>• Call .channel(name)</li>
                    <li>• Register event listeners</li>
                    <li>• Subscribe to activate</li>
                    <li>• Unsubscribe on unmount</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-amber-800 mb-2">Server Broadcasting</h5>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Postgres triggers → Realtime</li>
                    <li>• Server-side .send() calls</li>
                    <li>• Row-level security respected</li>
                    <li>• Filtered by channel topic</li>
                    <li>• Low latency (~50-200ms)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Data Flow Patterns */}
        <Section
          title="Common Data Flow Patterns"
          icon={<Database className="w-5 h-5" />}
          color="indigo"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FlowPattern
              title="Score Batch Processing"
              steps={[
                'Client buffers ML results (30s)',
                'POST to /api/exam/analyze',
                'Next.js validates session ownership',
                'Batch INSERT into cheat_scores',
                'Postgres trigger fires',
                'Realtime broadcasts INSERT event',
                'Admin leaderboard auto-updates'
              ]}
            />
            
            <FlowPattern
              title="Snapshot Capture & Review"
              steps={[
                'ML alert triggers snapshot',
                'Client uploads to exam-snapshots',
                'INSERT suspicious_snapshots row',
                'Store bucket path + metadata',
                'Admin queries by session_id',
                'Generate signed URL for access',
                'Display in SnapshotViewer component'
              ]}
            />
            
            <FlowPattern
              title="WebRTC Connection Setup"
              steps={[
                'Student joins exam session',
                'Create RTCPeerConnection',
                'Generate SDP offer',
                'Broadcast to webrtc:{roomId}',
                'Admin listener receives offer',
                'Create answer SDP',
                'Broadcast answer back',
                'ICE candidates exchanged',
                'Direct P2P stream established'
              ]}
            />
            
            <FlowPattern
              title="Exam Lifecycle"
              steps={[
                'Admin creates exam (exams table)',
                'Student starts (/api/exam/start)',
                'INSERT exam_sessions row',
                'Status: in_progress',
                'Proctoring data flows continuously',
                'Student submits exam',
                'UPDATE status: completed',
                'Calculate final metrics',
                'INSERT exam_results (future)'
              ]}
            />
          </div>
        </Section>
      </div>

      {/* Performance & Scaling */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-slate-900 mb-4">Performance & Scaling Considerations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScalingCard
            title="Database Optimization"
            points={[
              'Indexes on foreign keys',
              'Composite index on (session_id, timestamp)',
              'Partitioning for large tables',
              'Connection pooling (PgBouncer)',
              'Read replicas for analytics'
            ]}
          />
          <ScalingCard
            title="Storage Optimization"
            points={[
              'Image compression (80% quality)',
              'Lazy loading thumbnails',
              'CDN edge caching',
              'Progressive JPEG encoding',
              'Automatic cleanup jobs'
            ]}
          />
          <ScalingCard
            title="Realtime Scaling"
            points={[
              'Channel sharding by exam',
              'Presence tracking limits',
              'Message rate limiting',
              'Fallback to polling',
              'WebSocket pool management'
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function Section({ 
  title, 
  icon, 
  color, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  color: string;
  children: React.ReactNode;
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-300',
    blue: 'bg-blue-50 border-blue-300',
    purple: 'bg-purple-50 border-purple-300',
    amber: 'bg-amber-50 border-amber-300',
    indigo: 'bg-indigo-50 border-indigo-300',
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ServiceCard({ title, details }: { title: string; details: string[] }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-slate-200">
      <h4 className="text-sm text-slate-900 mb-2">{title}</h4>
      <ul className="space-y-1">
        {details.map((detail, i) => (
          <li key={i} className="text-xs text-slate-600">• {detail}</li>
        ))}
      </ul>
    </div>
  );
}

function TableSchema({ name, description, columns }: {
  name: string;
  description: string;
  columns: { name: string; type: string; desc: string }[];
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <div className="mb-3">
        <h4 className="text-slate-900">{name}</h4>
        <p className="text-xs text-slate-600">{description}</p>
      </div>
      <div className="space-y-1.5">
        {columns.map((col, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <code className="text-blue-600 font-mono whitespace-nowrap">{col.name}</code>
            <code className="text-purple-600 font-mono text-[10px] mt-0.5">{col.type}</code>
            <span className="text-slate-500 text-[11px] mt-0.5">– {col.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BucketCard({ name, description, details, usage }: {
  name: string;
  description: string;
  details: string[];
  usage: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-1">{name}</h4>
      <p className="text-xs text-slate-600 mb-3">{description}</p>
      <ul className="space-y-1.5 mb-3">
        {details.map((detail, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-purple-500 mt-0.5">•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
      <div className="pt-3 border-t border-slate-200 text-xs text-slate-500">
        <strong>Typical usage:</strong> {usage}
      </div>
    </div>
  );
}

function ChannelCard({ name, description, events, use }: {
  name: string;
  description: string;
  events: string[];
  use: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-1">{name}</h4>
      <p className="text-xs text-slate-600 mb-3">{description}</p>
      <div className="mb-3">
        <h5 className="text-xs text-slate-700 mb-1">Events:</h5>
        <div className="space-y-1">
          {events.map((event, i) => (
            <code key={i} className="block text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
              {event}
            </code>
          ))}
        </div>
      </div>
      <div className="pt-3 border-t border-slate-200 text-xs text-slate-500">
        <strong>Use case:</strong> {use}
      </div>
    </div>
  );
}

function FlowPattern({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
              {i + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScalingCard({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <ul className="space-y-1.5">
        {points.map((point, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

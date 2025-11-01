import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Eye, 
  Camera, 
  Image, 
  BarChart3,
  Users,
  FileText,
  Play
} from 'lucide-react';

export function AdminFlowTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      <h2 className="text-slate-900 mb-6">Admin Workflow</h2>
      
      <div className="space-y-6">
        {/* Admin Dashboard */}
        <Section
          title="Admin Dashboard"
          icon={<LayoutDashboard className="w-5 h-5" />}
          color="orange"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              title="Dashboard Overview"
              route="/admin"
              details={[
                'Role-guarded access (admin only)',
                'Theme toggle (dark/light mode)',
                'Quick navigation tiles',
                'Link to create new exams',
                'System status indicators',
                'Active session count'
              ]}
            />
            <FeatureCard
              title="Navigation Tabs"
              details={[
                'Live Monitoring - Real-time proctoring',
                'Snapshots - Review captured images',
                'Analytics - Historical data',
                'Exam Management - Create/edit exams',
                'User Management - View students',
                'Settings - System configuration'
              ]}
            />
          </div>
        </Section>

        {/* Live Monitoring */}
        <Section
          title="Live Monitoring Tab"
          icon={<Eye className="w-5 h-5" />}
          color="red"
          highlight
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-red-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Real-Time Leaderboard
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm text-red-800 mb-2">Data Polling</h5>
                  <ul className="space-y-1 text-sm text-red-700">
                    <li>• Poll every 3 seconds</li>
                    <li>• Query cheat_scores table</li>
                    <li>• Calculate per-session metrics</li>
                    <li>• Aggregate focus scores</li>
                    <li>• Count alert frequencies</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm text-red-800 mb-2">Real-Time Updates</h5>
                  <ul className="space-y-1 text-sm text-red-700">
                    <li>• Listen to postgres_changes</li>
                    <li>• Subscribe to cheat_scores inserts</li>
                    <li>• Immediate UI refresh</li>
                    <li>• WebSocket-based (Supabase Realtime)</li>
                    <li>• No manual refresh needed</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard
                title="Student Risk Scoring"
                details={[
                  'Cheat probability calculation',
                  'Weighted alert scoring',
                  'Time-based decay factors',
                  'Risk badges: Low / Medium / High / Critical',
                  'Color-coded indicators',
                  'Sortable by risk level'
                ]}
              />
              <FeatureCard
                title="Leaderboard Display"
                details={[
                  'Student name & ID',
                  'Exam title',
                  'Session duration',
                  'Current focus score',
                  'Alert count by type',
                  'Click to view live stream'
                ]}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-900 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                LiveVideoViewer Component
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h5 className="text-sm text-blue-800 mb-2">WebRTC Setup</h5>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Create RTCPeerConnection</li>
                    <li>• Configure STUN servers</li>
                    <li>• Join webrtc:{'{roomId}'} channel</li>
                    <li>• Listen for student offer</li>
                    <li>• Exchange SDP via Supabase</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm text-blue-800 mb-2">Signaling Flow</h5>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Student broadcasts offer</li>
                    <li>• Admin receives via channel</li>
                    <li>• Create answer SDP</li>
                    <li>• Broadcast answer back</li>
                    <li>• ICE candidate exchange</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm text-blue-800 mb-2">Stream Display</h5>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Receive MediaStream</li>
                    <li>• Attach to {'<video>'} element</li>
                    <li>• Live audio/video playback</li>
                    <li>• Controls: mute, fullscreen</li>
                    <li>• Connection quality indicator</li>
                  </ul>
                </div>
              </div>
            </div>

            <FeatureCard
              title="Snapshot Review Panel"
              details={[
                'Fetch latest suspicious_snapshots',
                'Filter by current student session',
                'Display thumbnails in grid',
                'Click to enlarge image',
                'Show alert type that triggered capture',
                'Timestamp with duration marker',
                'Download snapshot capability',
                'Signed URLs from Supabase Storage'
              ]}
            />
          </div>
        </Section>

        {/* Snapshots Tab */}
        <Section
          title="Snapshots Tab"
          icon={<Image className="w-5 h-5" />}
          color="purple"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              title="SnapshotViewer Component"
              details={[
                'Browse all stored snapshots',
                'Query suspicious_snapshots table',
                'Sorted by captured_at timestamp',
                'Filter by exam, student, or alert type',
                'Pagination for large datasets',
                'Grid or list view toggle'
              ]}
            />
            <FeatureCard
              title="Snapshot Details"
              details={[
                'Full-size image preview',
                'Student name & exam title',
                'Alert type badge',
                'Timestamp (relative & absolute)',
                'Download from Supabase signed URL',
                'Link to full session review',
                'Annotate/flag capability (future)',
                'Export to PDF report (future)'
              ]}
            />
          </div>
        </Section>

        {/* Exam Creation */}
        <Section
          title="Exam Creation & Management"
          icon={<FileText className="w-5 h-5" />}
          color="emerald"
        >
          <div className="space-y-4">
            <FeatureCard
              title="Create Exam Flow"
              route="/admin/create-exam"
              details={[
                'Form for exam metadata (title, duration, instructions)',
                'Question builder interface',
                'Multiple question types (MCQ, essay, code)',
                'Set passing threshold',
                'Configure proctoring strictness',
                'Schedule exam availability window',
                'Assign to student groups',
                'Write to exams & exam_questions tables'
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MiniFeature
                title="Exam Configuration"
                items={[
                  'Proctoring level: Strict / Standard / Relaxed',
                  'ML alert thresholds',
                  'Auto-fail rules (e.g., device detected)',
                  'Snapshot frequency',
                  'Max tab switches allowed',
                  'Fullscreen requirement'
                ]}
              />
              <MiniFeature
                title="Question Management"
                items={[
                  'Add/edit/delete questions',
                  'Set point values',
                  'Question randomization',
                  'Answer key configuration',
                  'Import from question bank',
                  'Preview exam before publish'
                ]}
              />
            </div>
          </div>
        </Section>

        {/* Analytics */}
        <Section
          title="Analytics & Reporting"
          icon={<BarChart3 className="w-5 h-5" />}
          color="indigo"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              title="Exam Statistics"
              details={[
                'Average scores',
                'Pass/fail distribution',
                'Alert frequency charts',
                'Time-to-complete metrics',
                'Comparison across exams',
                'Trend analysis'
              ]}
            />
            <FeatureCard
              title="Student Analytics"
              details={[
                'Individual performance history',
                'Risk score trends',
                'Alert patterns',
                'Focus score over time',
                'Session replay timeline',
                'Behavior flagging'
              ]}
            />
            <FeatureCard
              title="System Insights"
              details={[
                'ML model accuracy',
                'False positive rates',
                'System uptime',
                'Storage usage',
                'API response times',
                'WebRTC connection quality'
              ]}
            />
          </div>
        </Section>
      </div>

      {/* Admin Tools Summary */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-slate-900 mb-4">Admin Capabilities Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CapabilityBadge
            icon={<Play className="w-5 h-5" />}
            title="Live Monitoring"
            description="Real-time video streams and leaderboard"
          />
          <CapabilityBadge
            icon={<Image className="w-5 h-5" />}
            title="Snapshot Review"
            description="Browse and analyze captured images"
          />
          <CapabilityBadge
            icon={<FileText className="w-5 h-5" />}
            title="Exam Management"
            description="Create, edit, and configure exams"
          />
          <CapabilityBadge
            icon={<BarChart3 className="w-5 h-5" />}
            title="Analytics"
            description="Historical data and performance insights"
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
    orange: 'bg-orange-50 border-orange-300',
    red: 'bg-red-50 border-red-300',
    purple: 'bg-purple-50 border-purple-300',
    emerald: 'bg-emerald-50 border-emerald-300',
    indigo: 'bg-indigo-50 border-indigo-300',
  };

  const highlightClass = highlight ? 'ring-2 ring-red-400 ring-offset-2' : '';

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

function FeatureCard({ title, route, details }: {
  title: string;
  route?: string;
  details: string[];
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-1">{title}</h4>
      {route && <code className="text-xs text-slate-500">{route}</code>}
      <ul className="mt-3 space-y-1.5">
        {details.map((detail, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-orange-500 mt-0.5">•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniFeature({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-slate-200">
      <h5 className="text-sm text-slate-900 mb-2">{title}</h5>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
            <span className="text-emerald-500 mt-0.5 text-xs">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CapabilityBadge({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
      <div className="text-orange-600 mb-2">{icon}</div>
      <h4 className="text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  );
}

import React from 'react';
import { 
  LogIn, 
  LayoutDashboard, 
  PlayCircle, 
  Camera, 
  AlertTriangle, 
  Send, 
  FileCheck,
  ArrowDown 
} from 'lucide-react';

export function StudentFlowTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      <h2 className="text-slate-900 mb-6">Student Workflow</h2>
      
      {/* Phase by Phase Flow */}
      <div className="space-y-6">
        {/* Phase 1: Authentication */}
        <PhaseSection
          phase={1}
          title="Authentication & Authorization"
          icon={<LogIn className="w-5 h-5" />}
          color="blue"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StepCard
              title="Sign Up / Login"
              route="/signup, /login"
              details={[
                'User creates account or signs in',
                'Supabase Auth handles credentials',
                'Email/password authentication',
                'Session token generated'
              ]}
            />
            <StepCard
              title="Role-Based Redirect"
              details={[
                'Profile fetched from Supabase',
                'Role tagged in profiles table',
                'Students → /dashboard',
                'Admins → /admin',
                'Access control enforced'
              ]}
            />
          </div>
        </PhaseSection>

        <ArrowDown className="w-6 h-6 text-slate-300 mx-auto" />

        {/* Phase 2: Dashboard */}
        <PhaseSection
          phase={2}
          title="Student Dashboard"
          icon={<LayoutDashboard className="w-5 h-5" />}
          color="blue"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StepCard
              title="View Available Exams"
              route="/dashboard"
              details={[
                'Fetch active exams from Supabase',
                'Block admin users from taking exams',
                'Display exam cards with details',
                'Show tabs: Available / Completed',
                'Filter by exam status'
              ]}
            />
            <StepCard
              title="Exam Selection"
              details={[
                'Click on exam card',
                'View exam requirements',
                'Check camera permissions',
                'Review proctoring rules',
                'Navigate to /exam/[id]'
              ]}
            />
          </div>
        </PhaseSection>

        <ArrowDown className="w-6 h-6 text-slate-300 mx-auto" />

        {/* Phase 3: Starting Exam */}
        <PhaseSection
          phase={3}
          title="Exam Initialization"
          icon={<PlayCircle className="w-5 h-5" />}
          color="emerald"
        >
          <div className="grid grid-cols-1 gap-4">
            <StepCard
              title="Session Setup"
              route="/exam/[id]"
              details={[
                'Call /api/exam/start endpoint',
                'Create exam_sessions row in Supabase',
                'Record start timestamp',
                'Set session status to "in_progress"',
                'Initialize tracking variables'
              ]}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MiniCard
                title="Fullscreen Mode"
                items={[
                  'Enforce fullscreen',
                  'Disable F11, Esc',
                  'Prevent exit',
                  'Track violations'
                ]}
              />
              <MiniCard
                title="Tab Tracking"
                items={[
                  'Listen to visibilitychange',
                  'Count tab switches',
                  'Log timestamps',
                  'Alert on threshold'
                ]}
              />
              <MiniCard
                title="WebRTC Setup"
                items={[
                  'Create RTCPeerConnection',
                  'Join Supabase channel',
                  'Enable camera/mic',
                  'Prepare for admin viewing'
                ]}
              />
            </div>
          </div>
        </PhaseSection>

        <ArrowDown className="w-6 h-6 text-slate-300 mx-auto" />

        {/* Phase 4: During Exam */}
        <PhaseSection
          phase={4}
          title="Live Proctoring (Main Loop)"
          icon={<Camera className="w-5 h-5" />}
          color="purple"
          highlight
        >
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-purple-900 mb-3">Camera Stream Processing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm text-purple-800 mb-2">Frame Capture</h5>
                  <ul className="space-y-1 text-sm text-purple-700">
                    <li>• Acquire camera via getUserMedia()</li>
                    <li>• Display local preview in {'<video>'}</li>
                    <li>• Canvas-based frame extraction</li>
                    <li>• Capture at ~30 FPS</li>
                    <li>• Convert to JPEG base64</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm text-purple-800 mb-2">ML Analysis</h5>
                  <ul className="space-y-1 text-sm text-purple-700">
                    <li>• POST frames to ML server</li>
                    <li>• URL: NEXT_PUBLIC_ML_SERVER_URL</li>
                    <li>• Fallback to /api/ml-proxy</li>
                    <li>• Receive focus score + alerts</li>
                    <li>• Update UI in real-time</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StepCard
                title="Client-Side Alerts"
                details={[
                  'Tab switch detection',
                  'Inactivity timer (no mouse/keyboard)',
                  'Fullscreen exit attempts',
                  'Right-click/copy-paste blocks',
                  'Merge with ML alerts'
                ]}
              />
              <StepCard
                title="ML-Based Alerts"
                details={[
                  'Head pose (yaw/pitch out of range)',
                  'Gaze deviation (looking away)',
                  'Multi-face detection',
                  'No face detected',
                  'Device detected (phone, tablet)',
                  'Looping video (hash clustering)'
                ]}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-amber-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Suspicious Event Handling
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h5 className="text-amber-800 mb-2">Trigger Conditions</h5>
                  <ul className="space-y-1 text-amber-700">
                    <li>• device_detected alert</li>
                    <li>• looping_video alert</li>
                    <li>• multi_face alert</li>
                    <li>• Focus score {'<'} threshold</li>
                    <li>• Repeated violations</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-amber-800 mb-2">Snapshot Capture</h5>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Capture current frame</li>
                    <li>• Convert to blob</li>
                    <li>• Upload to exam-snapshots</li>
                    <li>• Store Supabase Storage</li>
                    <li>• Get public URL</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-amber-800 mb-2">Metadata Storage</h5>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Insert suspicious_snapshots</li>
                    <li>• Link to session_id</li>
                    <li>• Record alert type</li>
                    <li>• Store timestamp</li>
                    <li>• Available for admin review</li>
                  </ul>
                </div>
              </div>
            </div>

            <StepCard
              title="Score Batching"
              details={[
                'Buffer focus scores locally',
                'Invert to cheat probability (1 - focus)',
                'Batch every N seconds or M samples',
                'POST to /api/exam/analyze',
                'Store in cheat_scores table',
                'Include alert arrays for context',
                'Powers real-time leaderboard'
              ]}
            />
          </div>
        </PhaseSection>

        <ArrowDown className="w-6 h-6 text-slate-300 mx-auto" />

        {/* Phase 5: Submission */}
        <PhaseSection
          phase={5}
          title="Exam Submission"
          icon={<Send className="w-5 h-5" />}
          color="emerald"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StepCard
              title="Submit Action"
              route="/api/exam/submit"
              details={[
                'Student clicks submit button',
                'Final score batch sent',
                'Stop camera stream',
                'Close WebRTC connection',
                'Leave Supabase channels'
              ]}
            />
            <StepCard
              title="Backend Processing"
              details={[
                'Update exam_sessions status',
                'Record end timestamp',
                'Calculate final metrics',
                'Store video_metadata if captured',
                'Generate result summary'
              ]}
            />
          </div>
        </PhaseSection>

        <ArrowDown className="w-6 h-6 text-slate-300 mx-auto" />

        {/* Phase 6: Results */}
        <PhaseSection
          phase={6}
          title="Results & Review"
          icon={<FileCheck className="w-5 h-5" />}
          color="blue"
        >
          <StepCard
            title="Results Page"
            route="/exam/[id]/results"
            details={[
              'Display final score',
              'Show status badge (pass/fail/flagged)',
              'Risk level indicator',
              'Summary of alerts triggered',
              'Pulled from exams table + query params',
              'Future: Detailed analytics breakdown',
              'Option to review timeline'
            ]}
          />
        </PhaseSection>
      </div>

      {/* Technical Details */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-slate-900 mb-4">Technical Implementation Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TechDetail
            title="Security Measures"
            items={[
              'Fullscreen enforcement',
              'Keyboard shortcut blocking',
              'Right-click prevention',
              'Copy-paste disabled',
              'Tab switch detection',
              'Browser DevTools detection'
            ]}
          />
          <TechDetail
            title="Performance Optimization"
            items={[
              '30 FPS frame capture',
              'Client-side batching',
              'Async ML requests',
              'Exponential smoothing',
              'Debounced uploads',
              'Local caching'
            ]}
          />
          <TechDetail
            title="Error Handling"
            items={[
              'Camera permission fallback',
              'ML server timeout handling',
              'Network retry logic',
              'Graceful degradation',
              'User error messaging',
              'Session recovery'
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function PhaseSection({ 
  phase, 
  title, 
  icon, 
  color, 
  children,
  highlight = false
}: { 
  phase: number; 
  title: string; 
  icon: React.ReactNode; 
  color: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-300 text-blue-900',
    emerald: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    purple: 'bg-purple-50 border-purple-300 text-purple-900',
  };

  const highlightClass = highlight ? 'ring-2 ring-purple-400 ring-offset-2' : '';

  return (
    <div className={`border-2 rounded-lg p-6 ${colorClasses[color]} ${highlightClass}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-full ${color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-purple-600'} text-white flex items-center justify-center`}>
          {phase}
        </div>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  );
}

function StepCard({ title, route, details }: {
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
            <span className="text-blue-500 mt-0.5">•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-slate-200">
      <h5 className="text-sm text-slate-900 mb-2">{title}</h5>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-600">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TechDetail({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

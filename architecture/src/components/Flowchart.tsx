import React from 'react';
import { ArrowRight, ArrowDown, Database, Video, Brain, Eye, Shield, Users, FileText, Camera, AlertTriangle, CheckCircle } from 'lucide-react';

export function Flowchart() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Swim Lane Headers */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="col-span-1 flex items-center gap-2 text-blue-600 pb-3 border-b-2 border-blue-600">
            <Users className="w-5 h-5" />
            <span>Student Flow</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 text-purple-600 pb-3 border-b-2 border-purple-600">
            <Database className="w-5 h-5" />
            <span>Backend System</span>
          </div>
          <div className="col-span-1 flex items-center gap-2 text-emerald-600 pb-3 border-b-2 border-emerald-600">
            <Brain className="w-5 h-5" />
            <span>ML Service</span>
          </div>
          <div className="col-span-1 flex items-center gap-2 text-orange-600 pb-3 border-b-2 border-orange-600">
            <Shield className="w-5 h-5" />
            <span>Admin Flow</span>
          </div>
        </div>

        {/* Phase 1: Authentication */}
        <div className="mb-8">
          <div className="text-xs text-slate-500 mb-3">Phase 1: Authentication</div>
          <div className="grid grid-cols-5 gap-4 items-start">
            <FlowBox color="blue" icon={<Users className="w-4 h-4" />}>
              <div>Sign up / Login</div>
              <div className="text-xs text-slate-500 mt-1">/signup, /login</div>
            </FlowBox>
            
            <div className="col-span-2 flex flex-col items-center justify-center h-full">
              <FlowBox color="purple" icon={<Database className="w-4 h-4" />}>
                <div>Supabase Auth</div>
                <div className="text-xs text-slate-500 mt-1">Role-based profiles</div>
              </FlowBox>
            </div>

            <div className="flex items-center justify-center h-full">
              <ArrowRight className="w-6 h-6 text-slate-300" />
            </div>

            <FlowBox color="orange" icon={<Shield className="w-4 h-4" />}>
              <div>Admin Dashboard</div>
              <div className="text-xs text-slate-500 mt-1">/admin</div>
            </FlowBox>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-start mb-8">
          <div className="ml-[10%]">
            <ArrowDown className="w-6 h-6 text-slate-300" />
          </div>
        </div>

        {/* Phase 2: Exam Setup */}
        <div className="mb-8">
          <div className="text-xs text-slate-500 mb-3">Phase 2: Exam Setup</div>
          <div className="grid grid-cols-5 gap-4 items-start">
            <FlowBox color="blue" icon={<FileText className="w-4 h-4" />}>
              <div>Select Exam</div>
              <div className="text-xs text-slate-500 mt-1">/dashboard</div>
              <div className="text-xs text-slate-500">Start exam session</div>
            </FlowBox>
            
            <div className="col-span-2 flex flex-col gap-3">
              <FlowBox color="purple" icon={<Database className="w-4 h-4" />} size="sm">
                <div>Next.js API</div>
                <div className="text-xs text-slate-500">/api/exam/start</div>
              </FlowBox>
              <FlowBox color="purple" icon={<Database className="w-4 h-4" />} size="sm">
                <div>Supabase DB</div>
                <div className="text-xs text-slate-500">exam_sessions table</div>
              </FlowBox>
              <FlowBox color="purple" icon={<Video className="w-4 h-4" />} size="sm">
                <div>WebRTC Setup</div>
                <div className="text-xs text-slate-500">Realtime channels</div>
              </FlowBox>
            </div>

            <div className="flex items-center justify-center h-full">
              <div className="text-xs text-slate-400 text-center">Admin creates<br/>exams here</div>
            </div>

            <FlowBox color="orange" icon={<FileText className="w-4 h-4" />}>
              <div>Create Exam</div>
              <div className="text-xs text-slate-500 mt-1">/admin/create-exam</div>
              <div className="text-xs text-slate-500">exams, exam_questions</div>
            </FlowBox>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-start mb-8">
          <div className="ml-[10%]">
            <ArrowDown className="w-6 h-6 text-slate-300" />
          </div>
        </div>

        {/* Phase 3: During Exam (Main Flow) */}
        <div className="mb-8 bg-slate-50 rounded-lg p-4">
          <div className="text-xs text-slate-500 mb-3">Phase 3: During Exam (Core Loop)</div>
          <div className="grid grid-cols-5 gap-4 items-start">
            <FlowBox color="blue" icon={<Camera className="w-4 h-4" />}>
              <div>Live Monitoring</div>
              <div className="text-xs text-slate-500 mt-1">/exam/[id]</div>
              <div className="text-xs mt-2">
                • Camera stream<br/>
                • Frame capture (30 FPS)<br/>
                • Base64 encode<br/>
                • Track tab switches
              </div>
            </FlowBox>
            
            <div className="col-span-2 flex flex-col gap-2">
              <FlowBox color="purple" icon={<Database className="w-4 h-4" />} size="sm">
                <div>ML Proxy</div>
                <div className="text-xs text-slate-500">/api/ml-proxy</div>
              </FlowBox>
              
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-purple-400" />
                  <div className="text-xs text-slate-500">Frames</div>
                  <ArrowRight className="w-4 h-4 text-purple-400" />
                </div>
              </div>

              <FlowBox color="purple" icon={<Database className="w-4 h-4" />} size="sm">
                <div>Batch Writer</div>
                <div className="text-xs text-slate-500">/api/exam/analyze</div>
              </FlowBox>

              <FlowBox color="purple" icon={<Database className="w-4 h-4" />} size="sm">
                <div>Storage & DB</div>
                <div className="text-xs text-slate-500">cheat_scores, snapshots</div>
              </FlowBox>
            </div>

            <FlowBox color="emerald" icon={<Brain className="w-4 h-4" />}>
              <div>FastAPI ML</div>
              <div className="text-xs text-slate-500 mt-1">/analyze endpoint</div>
              <div className="text-xs mt-2">
                • dHash loop detection<br/>
                • YOLOv8 device detect<br/>
                • MediaPipe FaceMesh<br/>
                • Gaze & pose analysis<br/>
                • Multi-face detection<br/>
                • Focus score calc
              </div>
            </FlowBox>

            <FlowBox color="orange" icon={<Eye className="w-4 h-4" />}>
              <div>Live Monitoring</div>
              <div className="text-xs text-slate-500 mt-1">/admin (Monitor tab)</div>
              <div className="text-xs mt-2">
                • WebRTC stream view<br/>
                • Real-time leaderboard<br/>
                • Risk badges<br/>
                • Snapshot review
              </div>
            </FlowBox>
          </div>

          {/* Sub-flow for alerts */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-5 gap-4">
              <div className="flex items-center justify-center">
                <div className="text-xs text-slate-500 text-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  Suspicious events
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-center">
                <FlowBox color="purple" icon={<Camera className="w-4 h-4" />} size="sm">
                  <div>Snapshot Upload</div>
                  <div className="text-xs text-slate-500">exam-snapshots bucket</div>
                  <div className="text-xs text-slate-500">suspicious_snapshots table</div>
                </FlowBox>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-xs text-slate-400 text-center">
                  Alerts:<br/>
                  device_detected,<br/>
                  looping_video,<br/>
                  multi-face, etc.
                </div>
              </div>
              <div className="flex items-center justify-center">
                <FlowBox color="orange" icon={<Eye className="w-4 h-4" />} size="sm">
                  <div>Snapshots Tab</div>
                  <div className="text-xs text-slate-500">Review images</div>
                </FlowBox>
              </div>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-start mb-8">
          <div className="ml-[10%]">
            <ArrowDown className="w-6 h-6 text-slate-300" />
          </div>
        </div>

        {/* Phase 4: Submission & Results */}
        <div className="mb-8">
          <div className="text-xs text-slate-500 mb-3">Phase 4: Submission & Results</div>
          <div className="grid grid-cols-5 gap-4 items-start">
            <FlowBox color="blue" icon={<CheckCircle className="w-4 h-4" />}>
              <div>Submit Exam</div>
              <div className="text-xs text-slate-500 mt-1">/api/exam/submit</div>
            </FlowBox>
            
            <div className="col-span-2 flex flex-col gap-3">
              <FlowBox color="purple" icon={<Database className="w-4 h-4" />} size="sm">
                <div>Supabase DB</div>
                <div className="text-xs text-slate-500">Update exam_sessions</div>
                <div className="text-xs text-slate-500">Store video_metadata</div>
              </FlowBox>
              <FlowBox color="purple" icon={<FileText className="w-4 h-4" />} size="sm">
                <div>Results Query</div>
                <div className="text-xs text-slate-500">exams + cheat_scores</div>
              </FlowBox>
            </div>

            <div className="flex items-center justify-center h-full">
              <ArrowRight className="w-6 h-6 text-slate-300" />
            </div>

            <FlowBox color="orange" icon={<FileText className="w-4 h-4" />}>
              <div>Analytics</div>
              <div className="text-xs text-slate-500 mt-1">Historical reports</div>
              <div className="text-xs text-slate-500">Performance metrics</div>
            </FlowBox>
          </div>
        </div>

        {/* Final Results */}
        <div className="flex justify-start">
          <div className="ml-[10%]">
            <ArrowDown className="w-6 h-6 text-slate-300" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mt-8">
          <FlowBox color="blue" icon={<CheckCircle className="w-4 h-4" />}>
            <div>Results Page</div>
            <div className="text-xs text-slate-500 mt-1">/exam/[id]/results</div>
            <div className="text-xs text-slate-500">Score, status, risk level</div>
          </FlowBox>
        </div>

        {/* Legend */}
        <div className="mt-12 pt-6 border-t border-slate-200">
          <div className="text-xs text-slate-500 mb-3">System Components</div>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
              <span className="text-xs text-slate-600">Next.js App Router + API</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
              <span className="text-xs text-slate-600">Supabase (Auth, DB, Storage, Realtime)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></div>
              <span className="text-xs text-slate-600">FastAPI ML Service</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-xs text-slate-600">WebRTC Mesh (Supabase Realtime)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FlowBoxProps {
  children: React.ReactNode;
  color: 'blue' | 'purple' | 'emerald' | 'orange';
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

function FlowBox({ children, color, icon, size = 'md' }: FlowBoxProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
  };

  const sizeClasses = {
    sm: 'p-3 text-xs',
    md: 'p-4 text-sm',
  };

  return (
    <div className={`rounded-lg border-2 ${colorClasses[color]} ${sizeClasses[size]}`}>
      {icon && (
        <div className="mb-2 opacity-70">
          {icon}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

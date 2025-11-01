import React from 'react';
import { ArrowRight, Server, Database, Brain, Globe } from 'lucide-react';

export function OverviewTab() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      <h2 className="text-slate-900 mb-6">System Architecture Overview</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Architecture Diagram */}
        <div className="col-span-full">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <ArchComponent 
                icon={<Globe className="w-6 h-6" />}
                title="Next.js App Router"
                color="blue"
                details={['Student UI', 'Admin UI', 'Server Actions', 'API Routes']}
              />
              
              <ArrowRight className="w-8 h-8 text-slate-400 flex-shrink-0" />
              
              <ArchComponent 
                icon={<Database className="w-6 h-6" />}
                title="Supabase"
                color="emerald"
                details={['Auth & Profiles', 'Postgres DB', 'Storage Buckets', 'Realtime Channels']}
              />
              
              <ArrowRight className="w-8 h-8 text-slate-400 flex-shrink-0" />
              
              <ArchComponent 
                icon={<Brain className="w-6 h-6" />}
                title="FastAPI ML"
                color="purple"
                details={['Frame Analysis', 'Face Detection', 'Device Detection', 'Loop Detection']}
              />
            </div>
          </div>
        </div>

        {/* Key Components */}
        <div>
          <h3 className="text-slate-900 mb-4">Frontend Layer</h3>
          <div className="space-y-3">
            <ComponentCard
              title="Next.js App Router"
              path="app/"
              description="Handles student/admin UIs, authentication, and server actions"
              items={[
                'Route-based UI organization',
                'Server-side rendering',
                'API route handlers',
                'Role-based access control'
              ]}
            />
          </div>
        </div>

        <div>
          <h3 className="text-slate-900 mb-4">Backend Services</h3>
          <div className="space-y-3">
            <ComponentCard
              title="Supabase Backend"
              description="Complete backend-as-a-service platform"
              items={[
                'Authentication with role profiles',
                'Postgres database tables',
                'Storage buckets for media',
                'Realtime WebSocket channels'
              ]}
            />
          </div>
        </div>

        <div>
          <h3 className="text-slate-900 mb-4">ML Service</h3>
          <div className="space-y-3">
            <ComponentCard
              title="FastAPI Service"
              path="model_prediction/api.py"
              description="Real-time video frame analysis with multiple ML models"
              items={[
                'WebSocket & HTTP endpoints',
                'MediaPipe FaceMesh integration',
                'YOLOv8 device detection',
                'Perceptual hash loop detector'
              ]}
            />
          </div>
        </div>

        <div>
          <h3 className="text-slate-900 mb-4">Integration Layer</h3>
          <div className="space-y-3">
            <ComponentCard
              title="Next.js API Routes"
              path="app/api/**"
              description="Glue layer connecting frontend to backend services"
              items={[
                'Session management endpoints',
                'Batch score processing',
                'Video upload handler',
                'ML server proxy (/api/ml-proxy)'
              ]}
            />
          </div>
        </div>
      </div>

      {/* Data Flow */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-slate-900 mb-4">Primary Data Flows</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataFlow
            title="Video Processing Pipeline"
            steps={[
              'Student camera → 30 FPS capture',
              'Base64 encoding → POST to ML server',
              'ML analysis → Focus score + alerts',
              'Batch storage → cheat_scores table',
              'Real-time display → Admin dashboard'
            ]}
          />
          
          <DataFlow
            title="WebRTC Live Streaming"
            steps={[
              'Student WebRTC peer → Local stream',
              'SDP/ICE exchange → Supabase Realtime',
              'Mesh connection → Direct P2P',
              'Admin viewer → Live video feed',
              'No server relay (STUN only)'
            ]}
          />
          
          <DataFlow
            title="Snapshot Capture"
            steps={[
              'ML alert trigger → Suspicious event',
              'Frame capture → Base64 to blob',
              'Upload → exam-snapshots bucket',
              'Metadata insert → suspicious_snapshots',
              'Admin review → Signed URL access'
            ]}
          />
          
          <DataFlow
            title="Score Aggregation"
            steps={[
              'Continuous ML analysis → Focus scores',
              'Client-side buffering → Batch formation',
              'POST to /api/exam/analyze',
              'Inverted focus ratio → cheat_scores',
              'Real-time polling → Leaderboard update'
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function ArchComponent({ icon, title, color, details }: { 
  icon: React.ReactNode; 
  title: string; 
  color: string;
  details: string[];
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300',
  };

  return (
    <div className={`rounded-lg border-2 p-4 flex-1 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <div className="space-y-1">
        {details.map((detail, i) => (
          <div key={i} className="text-xs opacity-80">• {detail}</div>
        ))}
      </div>
    </div>
  );
}

function ComponentCard({ title, path, description, items }: {
  title: string;
  path?: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="mb-2">
        <h4 className="text-slate-900">{title}</h4>
        {path && <code className="text-xs text-slate-500">{path}</code>}
      </div>
      <p className="text-sm text-slate-600 mb-3">{description}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataFlow({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
      <h4 className="text-slate-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
              {i + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

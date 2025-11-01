import { WorkflowTabs } from './components/WorkflowTabs';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-slate-900 mb-2">Exam Proctoring System Architecture</h1>
          <p className="text-slate-600">Next.js + Supabase + FastAPI ML Pipeline</p>
        </div>
        <WorkflowTabs />
      </div>
    </div>
  );
}

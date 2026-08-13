import { DashboardView } from '@/components/app/dashboard-view';
import Link from 'next/link';

export const metadata = {
  title: 'Call Analytics Dashboard | FinAssist Voice Agent',
  description:
    'Monitor voice agent performance metrics, call success rates, and outcome logs in real time.',
};

export default function DashboardPage() {
  return (
    <div>
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Call Analytics Dashboard</span>
        </div>
        <Link
          href="/"
          className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          ← Return to Voice Assistant App
        </Link>
      </div>
      <DashboardView />
    </div>
  );
}

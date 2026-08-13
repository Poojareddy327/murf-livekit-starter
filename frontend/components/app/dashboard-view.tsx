'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  PhoneCall,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  Search,
  Filter,
  ArrowLeft,
  Award,
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export interface CallRecord {
  id: string;
  room_name: string;
  caller_id: string;
  caller_name: string;
  track: string;
  status: 'success' | 'failed';
  outcome_reason: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
}

export interface AnalyticsData {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  success_rate: number;
  avg_duration: number;
  track: string;
  calls: CallRecord[];
}

interface DashboardViewProps {
  onBackToApp?: () => void;
}

export function DashboardView({ onBackToApp }: DashboardViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchAnalytics = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh metrics every 10 seconds
    const interval = setInterval(() => fetchAnalytics(), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateCall = async (targetStatus?: 'success' | 'failed') => {
    setSimulating(true);
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      await fetchAnalytics(true);
    } catch (err) {
      console.error('Failed to simulate call:', err);
    } finally {
      setSimulating(false);
    }
  };

  const filteredCalls = useMemo(() => {
    if (!data?.calls) return [];
    return data.calls.filter((call) => {
      const matchesStatus =
        statusFilter === 'all' || call.status === statusFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        call.caller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.outcome_reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [data?.calls, statusFilter, searchQuery]);

  // Chart data configurations
  const doughnutData = {
    labels: ['Successful Calls', 'Failed Calls'],
    datasets: [
      {
        data: [data?.successful_calls || 0, data?.failed_calls || 0],
        backgroundColor: ['#10B981', '#EF4444'],
        borderColor: ['#047857', '#B91C1C'],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#E2E8F0',
          font: { family: 'Inter', size: 12 },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    cutout: '72%',
  };

  const barData = {
    labels: ['Success Criteria Met', 'Unresolved / Early Disconnect'],
    datasets: [
      {
        label: 'Calls Count',
        data: [data?.successful_calls || 0, data?.failed_calls || 0],
        backgroundColor: ['rgba(16, 185, 129, 0.75)', 'rgba(239, 68, 68, 0.75)'],
        borderColor: ['#10B981', '#EF4444'],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
      },
    },
    scales: {
      x: {
        ticks: { color: '#94A3B8' },
        grid: { color: '#334155' },
      },
      y: {
        ticks: { color: '#94A3B8', stepSize: 1 },
        grid: { color: '#334155' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all text-slate-300 hover:text-white"
                title="Back to Voice Agent"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                  Call Analytics Dashboard
                </h1>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Day 8 Task
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Real-time performance metrics for <span className="text-cyan-300 font-medium">FinAssist Voice Agent</span> powered by Murf Falcon TTS & SQLite
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              Refresh Data
            </button>
            <button
              onClick={() => handleSimulateCall()}
              disabled={simulating}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
            >
              <PlusCircle className={`w-4 h-4 ${simulating ? 'animate-bounce' : ''}`} />
              Simulate Test Call
            </button>
          </div>
        </header>

        {/* Track Success Definition Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span>Track Definition: Financial Services</span>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded bg-slate-800 text-emerald-400 border border-slate-700">
                    Step 1 Verified
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  <strong className="text-emerald-400">Successful Call Condition:</strong> The caller completes a scheme eligibility check (e.g. PM Awas Yojana, Sukanya Samriddhi), receives a document checklist/guidance, or creates a human escalation request.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                onClick={() => handleSimulateCall('success')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
              >
                + Simulate Success
              </button>
              <button
                onClick={() => handleSimulateCall('failed')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
              >
                + Simulate Failure
              </button>
            </div>
          </div>
        </div>

        {/* 3 Main Required Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Calls */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Calls
              </span>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                <PhoneCall className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {loading ? '...' : data?.total_calls ?? 0}
              </span>
              <span className="text-xs text-slate-400 font-medium">Logged in SQLite</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
              All agent call attempts
            </div>
          </motion.div>

          {/* 2. Successful Calls */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Successful Calls
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">
                {loading ? '...' : data?.successful_calls ?? 0}
              </span>
              <span className="text-xs text-emerald-500/80 font-medium font-mono">
                {data?.success_rate}% Success
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
              Objective fulfilled
            </div>
          </motion.div>

          {/* 3. Failed Calls */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Failed Calls
              </span>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold text-rose-400 tracking-tight">
                {loading ? '...' : data?.failed_calls ?? 0}
              </span>
              <span className="text-xs text-rose-500/80 font-medium">Early disconnect / Unresolved</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
              Did not reach condition
            </div>
          </motion.div>

          {/* 4. Success Rate % */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Success Rate
              </span>
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold text-sky-300 tracking-tight">
                {loading ? '...' : `${data?.success_rate ?? 0}%`}
              </span>
              <span className="text-xs text-sky-400/80 font-medium">Target &gt; 70%</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
              Performance ratio
            </div>
          </motion.div>

          {/* 5. Avg Call Duration */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Avg Duration
              </span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-300 tracking-tight">
                {loading ? '...' : `${data?.avg_duration ?? 0}s`}
              </span>
              <span className="text-xs text-amber-500/80 font-medium">Per Session</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
              Average voice interaction
            </div>
          </motion.div>
        </div>

        {/* Chart Visualizations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart: Outcome Ratio */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Call Outcome Distribution</span>
                </h3>
                <span className="text-xs text-slate-400">Chart.js Donut</span>
              </div>
              <p className="text-xs text-slate-400">
                Ratio of successful calls fulfilling eligibility/escalations vs failed attempts.
              </p>
            </div>
            <div className="h-64 mt-4 relative">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>

          {/* Bar Chart: Outcome Breakdown */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Objective Breakdown</span>
                </h3>
                <span className="text-xs text-slate-400">Chart.js Bar</span>
              </div>
              <p className="text-xs text-slate-400">
                Comparison of calls achieving defined success criteria vs early disconnects.
              </p>
            </div>
            <div className="h-64 mt-4">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* Detailed Call Log Table */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-cyan-400" />
                <span>Call Logs & Outcomes</span>
              </h3>
              <p className="text-xs text-slate-400">
                Recorded automatically in SQLite database <code className="text-cyan-300">callers.db</code>
              </p>
            </div>

            {/* Filters & Search */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors w-40 sm:w-52"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === 'all'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({data?.calls.length || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('success')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === 'success'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Success ({data?.successful_calls || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('failed')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === 'failed'
                      ? 'bg-rose-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Failed ({data?.failed_calls || 0})
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3 sm:p-4">Status</th>
                  <th className="p-3 sm:p-4">Caller</th>
                  <th className="p-3 sm:p-4">Outcome Summary</th>
                  <th className="p-3 sm:p-4">Duration</th>
                  <th className="p-3 sm:p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                {filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No call records matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call) => (
                    <tr
                      key={call.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Status */}
                      <td className="p-3 sm:p-4 whitespace-nowrap">
                        {call.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Successful
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            Failed
                          </span>
                        )}
                      </td>

                      {/* Caller Identity */}
                      <td className="p-3 sm:p-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">
                          {call.caller_name || 'Anonymous'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {call.caller_id}
                        </div>
                      </td>

                      {/* Outcome Reason */}
                      <td className="p-3 sm:p-4 max-w-md">
                        <div className="text-slate-300 font-medium leading-snug">
                          {call.outcome_reason}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="text-cyan-400/90">{call.track}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">{call.id}</span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="p-3 sm:p-4 whitespace-nowrap font-mono text-slate-300">
                        {call.duration_seconds}s
                      </td>

                      {/* Timestamp */}
                      <td className="p-3 sm:p-4 whitespace-nowrap text-slate-400 text-xs">
                        {new Date(call.started_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

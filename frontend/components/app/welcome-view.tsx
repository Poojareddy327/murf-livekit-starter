'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Cpu,
  FileCheck,
  Gauge,
  Globe,
  Headphones,
  Layers,
  Lock,
  Mic,
  Radio,
  Shield,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'finassist_user_name';
const LANG_STORAGE_KEY = 'finassist_user_lang';

function WelcomeHeroGraphics() {
  return (
    <div className="relative mb-6 flex items-center justify-center">
      {/* Dynamic Animated Ambient Glow Circles */}
      <div className="absolute h-56 w-56 animate-pulse rounded-full bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-2xl" />
      <div className="absolute h-40 w-40 animate-ping rounded-full bg-cyan-400/10 blur-xl duration-1000" />

      {/* Main SVG Hero Graphic with Neon Glowing Shield & Soundwaves */}
      <svg
        width="140"
        height="140"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-float relative z-10 drop-shadow-[0_0_35px_rgba(6,182,212,0.45)]"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#38bdf8', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Shield Outline */}
        <path
          d="M60 8L90 22V48C90 70 77 89 60 102C43 89 30 70 30 48V22L60 8Z"
          fill="url(#shieldGrad)"
          opacity="0.18"
        />
        <path
          d="M60 8L90 22V48C90 70 77 89 60 102C43 89 30 70 30 48V22L60 8Z"
          stroke="url(#shieldGrad)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        {/* Pulsing Audio Soundbars */}
        <circle cx="60" cy="55" r="10" fill="url(#shieldGrad)" />
        <rect x="46" y="42" width="3" height="26" rx="1.5" fill="url(#waveGrad)" opacity="0.9" />
        <rect x="71" y="42" width="3" height="26" rx="1.5" fill="url(#waveGrad)" opacity="0.9" />
        <rect x="39" y="47" width="3" height="16" rx="1.5" fill="url(#waveGrad)" opacity="0.6" />
        <rect x="78" y="47" width="3" height="16" rx="1.5" fill="url(#waveGrad)" opacity="0.6" />
        <rect x="32" y="51" width="3" height="8" rx="1.5" fill="url(#waveGrad)" opacity="0.3" />
        <rect x="85" y="51" width="3" height="8" rx="1.5" fill="url(#waveGrad)" opacity="0.3" />
      </svg>
    </div>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  useEffect(() => {
    try {
      const storedName = localStorage.getItem(STORAGE_KEY);
      if (storedName) setSavedName(storedName);
      const storedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (storedLang) setSelectedLanguage(storedLang);
    } catch (e) {
      console.error('localStorage error:', e);
    }
  }, []);

  const handleSaveName = () => {
    if (name.trim()) {
      try {
        localStorage.setItem(STORAGE_KEY, name.trim());
        setSavedName(name.trim());
        setName('');
        setIsNameFocused(false);
      } catch (e) {
        console.error('Failed to save name:', e);
      }
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) {
      console.error('Failed to save language:', e);
    }
  };

  const isConnecting = startButtonText.toLowerCase().includes('connecting');

  const scenarioCards = [
    {
      title: 'Check Scheme Eligibility',
      category: 'Normal Path',
      prompt: 'What banking schemes am I eligible for as a 28-year-old middle-income earner?',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      gradient: 'from-cyan-950/40 via-slate-900/60 to-slate-950/40 hover:border-cyan-500/50',
      icon: Sparkles,
      iconColor: 'text-cyan-400',
    },
    {
      title: 'Report Fraud / Stolen Card',
      category: 'Human Escalation',
      prompt: 'Someone made an unauthorized transaction of 15,000 rupees on my stolen debit card!',
      badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse',
      gradient: 'from-rose-950/40 via-slate-900/60 to-slate-950/40 hover:border-rose-500/50',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
    },
    {
      title: 'Digital Banking Support',
      category: 'General Guidance',
      prompt: 'How do I reset my mobile banking password securely?',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      gradient: 'from-purple-950/40 via-slate-900/60 to-slate-950/40 hover:border-purple-500/50',
      icon: Headphones,
      iconColor: 'text-purple-400',
    },
  ];

  const pipelineStatus = [
    {
      name: 'Murf Falcon TTS',
      status: 'Optimal',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      name: 'Deepgram Nova-3',
      status: 'Ready',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    {
      name: 'Gemini 2.0 LLM',
      status: 'Connected',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      name: 'Escalation Engine',
      status: 'Active',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    },
  ];

  return (
    <div
      ref={ref}
      className="relative flex min-h-screen flex-col overflow-y-auto bg-[#07090E] font-sans text-slate-100 selection:bg-cyan-500 selection:text-white"
    >
      {/* Premium Multi-layered Mesh Background Light Flares */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] h-[600px] w-[600px] animate-pulse rounded-full bg-gradient-to-br from-cyan-600/15 via-blue-600/10 to-transparent blur-3xl duration-1000" />
        <div className="absolute bottom-[-15%] left-[-10%] h-[700px] w-[700px] animate-pulse rounded-full bg-gradient-to-tr from-purple-600/15 via-indigo-600/10 to-transparent blur-3xl delay-1000" />
        <div className="absolute top-1/3 left-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      {/* Top Banner Ribbon */}
      <div className="relative z-30 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/90 via-indigo-950/90 to-purple-950/90 px-4 py-2 text-center backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-cyan-300">
          <Sparkles className="h-3.5 w-3.5 animate-spin text-cyan-400" />
          <span>#VoiceForBharat Challenge • Powered by Murf Falcon TTS & LiveKit Agents</span>
          <span className="hidden rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-cyan-200 sm:inline-block">
            Day 7 Live
          </span>
        </div>
      </div>

      {/* Header Navbar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/70 px-4 py-4 backdrop-blur-2xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="group flex cursor-pointer items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 shadow-lg shadow-cyan-500/25 transition-transform duration-300 group-hover:scale-105">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">FinAssist</h1>
                <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  Voice AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Financial Services & Human Escalations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector Pills */}
            <div className="hidden items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1 md:flex">
              {[
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'Hindi (हिंदी)' },
                { code: 'hinglish', label: 'Hinglish' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    selectedLanguage === lang.code
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/60 px-3.5 py-2 text-xs font-bold text-cyan-300 shadow-lg shadow-cyan-950/50 backdrop-blur-md transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-900/80 hover:text-white"
            >
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>Call Analytics Dashboard</span>
            </Link>

            <Link
              href="/escalations"
              className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/60 px-3.5 py-2 text-xs font-bold text-rose-300 shadow-lg shadow-rose-950/50 backdrop-blur-md transition-all duration-300 hover:border-rose-400 hover:bg-rose-900/80 hover:text-white"
            >
              <ShieldAlert className="h-4 w-4 animate-pulse text-rose-400" />
              <span>Human Escalations</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-start px-4 py-8 md:py-12">
        {/* Live Pipeline Readiness Status Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-2 text-xs shadow-xl backdrop-blur-xl">
          <span className="flex items-center gap-1.5 border-r border-slate-800 pr-2 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
            <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
            Engine Status
          </span>
          {pipelineStatus.map((item, idx) => (
            <span
              key={idx}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${item.color}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {item.name}: {item.status}
            </span>
          ))}
        </div>

        {/* Animated Hero Icon Graphic */}
        <div className="animate-fade-in-down">
          <WelcomeHeroGraphics />
        </div>

        {/* Main Headline */}
        <h2 className="animate-fade-in-up mb-3 max-w-3xl text-center text-4xl leading-tight font-black tracking-tight text-white md:text-5xl lg:text-6xl">
          Conversational Banking with{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
            Human Escalation Intelligence
          </span>
        </h2>

        {/* Subtitle */}
        <p className="animate-fade-in-up mb-6 max-w-2xl text-center text-base text-slate-300 delay-100 md:text-lg">
          Ask questions about banking, schemes, and payments. When complex fraud or disputes occur,
          FinAssist asks for permission and seamlessly creates a human support ticket.
        </p>

        {/* Saved User Greeting or Input */}
        {!savedName ? (
          <div className="animate-fade-in-up mb-8 w-full max-w-md delay-200">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/70 p-2 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter your name to personalize..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                  maxLength={100}
                  disabled={isConnecting}
                  className="w-full rounded-xl bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
                {name.trim() && (
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={isConnecting}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-xs font-bold text-slate-950 shadow-md hover:from-cyan-400 hover:to-blue-400"
                  >
                    Save
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-bounce-in mb-8 flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-5 py-2 shadow-lg backdrop-blur-md">
            <UserCheck className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-300">
              Welcome back, <strong className="text-cyan-300">{savedName}</strong>! 👋
            </span>
          </div>
        )}

        {/* Main Voice Start CTA Button */}
        <div className="animate-fade-in-up mb-10 w-full max-w-sm delay-300">
          <Button
            size="lg"
            onClick={onStartCall}
            disabled={isConnecting}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-7 text-lg font-bold text-white shadow-2xl shadow-cyan-500/30 transition-all duration-300 hover:scale-102 hover:shadow-cyan-500/50 active:scale-98 disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isConnecting ? (
                <>
                  <span className="h-3 w-3 animate-ping rounded-full bg-white" />
                  <span>Connecting to LiveKit...</span>
                </>
              ) : (
                <>
                  <Mic className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                  <span>Start Voice Assistant</span>
                </>
              )}
            </span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          </Button>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Activity className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
            <span>
              {isConnecting
                ? '🔄 Connecting securely to Murf Falcon & LiveKit...'
                : '🎤 Tap button and speak clearly into microphone'}
            </span>
          </div>
        </div>

        {/* Performance Metrics Strip */}
        <div className="animate-fade-in-up mb-10 grid w-full max-w-4xl grid-cols-2 gap-3 delay-350 sm:grid-cols-4">
          {[
            { metric: '< 0.4s', label: 'Speech Latency', icon: Gauge, color: 'text-cyan-400' },
            { metric: '100%', label: 'PII Redacted', icon: Shield, color: 'text-emerald-400' },
            {
              metric: '24/7',
              label: 'Escalation Ready',
              icon: ShieldAlert,
              color: 'text-rose-400',
            },
            { metric: '50+', label: 'Murf Voices', icon: Headphones, color: 'text-purple-400' },
          ].map((m, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 text-center backdrop-blur-xl transition hover:border-slate-700"
            >
              <m.icon className={`mx-auto mb-1.5 h-5 w-5 ${m.color}`} />
              <div className="text-xl font-black text-white">{m.metric}</div>
              <div className="text-[11px] font-semibold text-slate-400">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Interactive Scenario Prompt Cards */}
        <div className="animate-fade-in-up w-full max-w-4xl delay-400">
          <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-slate-400 uppercase">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Interactive Day 7 Test Scenarios
            </div>
            <span className="text-[11px] text-slate-500">Click card to copy prompt</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {scenarioCards.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  navigator.clipboard.writeText(item.prompt);
                  setCopiedPromptIndex(idx);
                  setTimeout(() => setCopiedPromptIndex(null), 2500);
                }}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${item.gradient}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${item.badgeColor}`}
                  >
                    {item.category}
                  </span>
                  <item.icon
                    className={`h-4 w-4 ${item.iconColor} transition-transform group-hover:scale-110`}
                  />
                </div>

                <h4 className="mb-1.5 text-sm font-bold text-white transition-colors group-hover:text-cyan-300">
                  {item.title}
                </h4>
                <p className="line-clamp-3 rounded-xl border border-slate-800/60 bg-slate-950/50 p-2.5 font-mono text-xs leading-relaxed text-slate-300">
                  "{item.prompt}"
                </p>

                <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-slate-400 transition-colors group-hover:text-slate-200">
                  <span className="flex items-center gap-1">
                    {copiedPromptIndex === idx ? (
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Copied!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 group-hover:text-cyan-300">
                        <Copy className="h-3 w-3" /> Click to copy
                      </span>
                    )}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice AI Capability Comparison Matrix */}
        <div className="animate-fade-in-up mt-12 w-full max-w-4xl delay-450">
          <h3 className="mb-4 flex items-center gap-2 px-2 text-xs font-extrabold tracking-wider text-slate-400 uppercase">
            <Layers className="h-4 w-4 text-purple-400" />
            FinAssist Voice Agent vs Traditional IVR Systems
          </h3>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 shadow-2xl backdrop-blur-xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 font-extrabold tracking-wider text-slate-400 uppercase">
                <tr>
                  <th className="p-4">Feature</th>
                  <th className="p-4 text-cyan-300">FinAssist AI (Murf Falcon)</th>
                  <th className="p-4 text-slate-500">Traditional IVR Phone Menu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="p-4 font-bold text-white">Turn Latency</td>
                  <td className="flex items-center gap-1.5 p-4 font-bold text-emerald-400">
                    <Check className="h-4 w-4 text-emerald-400" /> Sub-second (&lt;0.4s streaming)
                  </td>
                  <td className="flex items-center gap-1.5 p-4 text-slate-500">
                    <X className="h-4 w-4 text-slate-600" /> Slow 5-15s keypress delays
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">Human Escalation</td>
                  <td className="flex items-center gap-1.5 p-4 font-bold text-emerald-400">
                    <Check className="h-4 w-4 text-emerald-400" /> Asks consent &amp; generates Ref
                    ID
                  </td>
                  <td className="flex items-center gap-1.5 p-4 text-slate-500">
                    <X className="h-4 w-4 text-slate-600" /> Endlessly loops or drops calls
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-white">PII Protection</td>
                  <td className="flex items-center gap-1.5 p-4 font-bold text-emerald-400">
                    <Check className="h-4 w-4 text-emerald-400" /> Auto-sanitizes card numbers &amp;
                    OTPs
                  </td>
                  <td className="flex items-center gap-1.5 p-4 text-slate-500">
                    <X className="h-4 w-4 text-slate-600" /> Stores raw audio logs unsecured
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Neat Guidelines Accordion Card */}
        <div className="animate-fade-in-up mt-10 w-full max-w-4xl delay-500">
          <button
            onClick={() => setShowFaq(!showFaq)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-800/90 bg-slate-900/40 p-4 text-xs font-bold text-slate-300 backdrop-blur-xl transition hover:border-slate-700 hover:bg-slate-900/70"
          >
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-cyan-400" />
              <span>Day 7 Human Escalation & Privacy Safeguards Protocol</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${showFaq ? 'rotate-180 text-cyan-400' : 'text-slate-500'}`}
            />
          </button>

          {showFaq && (
            <div className="animate-fade-in-down mt-2 space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-5 text-xs leading-relaxed text-slate-400 backdrop-blur-2xl">
              <div className="flex items-start gap-2">
                <span className="font-bold text-cyan-400">1. Consent Required:</span>
                <span>
                  The agent must ask for explicit caller permission before invoking{' '}
                  <code className="text-cyan-300">create_escalation</code>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-cyan-400">2. PII Sanitization:</span>
                <span>
                  Passcodes, OTPs, PINs, CVV, and 16-digit card/account numbers are automatically
                  redacted before saving.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-cyan-400">3. Deduplication:</span>
                <span>
                  Subsequent calls regarding open tickets update existing records rather than
                  creating duplicates.
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-slate-950/80 px-4 py-6 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <div>
            FinAssist • Financial Voice AI Agent built for <strong>10 Days of Voice Agents</strong>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link
              href="/escalations"
              className="flex items-center gap-1 transition-colors hover:text-cyan-400"
            >
              <span>Human Dashboard</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            <span>•</span>
            <span className="text-slate-500">Murf Falcon TTS</span>
          </div>
        </div>
      </footer>

      {/* Custom Keyframe Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-fade-in-down { animation: fade-in-down 0.6s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; opacity: 0; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-350 { animation-delay: 0.35s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-450 { animation-delay: 0.45s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>
    </div>
  );
};

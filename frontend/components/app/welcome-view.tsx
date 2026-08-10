'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Shield, Zap } from 'lucide-react';

const STORAGE_KEY = 'finassist_user_9name';

function WelcomeImage() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mb-8 animate-float"
    >
      {/* Modern shield with sound waves */}
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      <path
        d="M60 10L85 22V45C85 65 75 82 60 95C45 82 35 65 35 45V22L60 10Z"
        fill="url(#shieldGrad)"
        opacity="0.15"
      />
      <path
        d="M60 10L85 22V45C85 65 75 82 60 95C45 82 35 65 35 45V22L60 10Z"
        stroke="#06b6d4"
        strokeWidth="2.5"
        fill="none"
      />
      
      {/* Sound waves */}
      <circle cx="60" cy="50" r="8" fill="#06b6d4" />
      <path d="M50 50C50 50 48 40 48 30" stroke="#0ea5e9" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
      <path d="M70 50C70 50 72 40 72 30" stroke="#0ea5e9" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
      <path d="M44 50C44 50 42 35 42 20" stroke="#06b6d4" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <path d="M76 50C76 50 78 35 78 20" stroke="#06b6d4" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
    </svg>
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
  const [isNameFocused, setIsNameFocused] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedName(stored);
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
        console.error('Failed to save:', e);
      }
    }
  };

  const isConnecting = startButtonText.toLowerCase().includes('connecting');

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-y-auto">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md px-4 py-4 md:py-6 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white">FinAssist</h1>
              <p className="text-xs text-cyan-400/80">Your Financial Voice Assistant</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-full hover:border-green-500/50 transition-all">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-300 font-medium">AI Powered</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="relative flex-1 flex flex-col items-center justify-start px-4 py-8 md:py-16 z-20 overflow-y-auto">
        {/* Hero Icon with animation */}
        <div className="animate-fade-in-down mt-8 md:mt-16">
          <WelcomeImage />
        </div>

        {/* Main Headline with staggered animation */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-3xl text-center leading-tight animate-fade-in-up">
          Your finances, just a <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">conversation away</span>
        </h2>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-300 mb-3 max-w-xl text-center animate-fade-in-up delay-100">
          Ask questions about banking, cards, payments, loans, and digital banking
        </p>

        {/* Quote with elegant styling */}
        <div className="text-sm md:text-base text-cyan-400/70 italic mb-12 animate-fade-in-up delay-200 relative">
          <p>Smart conversations. Simpler banking.</p>
        </div>

        {/* Name Input Section with improved UX */}
        {!savedName && (
          <div className="mb-10 w-full max-w-sm animate-fade-in-up delay-300">
            <div className="relative group">
              <input
                type="text"
                placeholder="What's your name?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                maxLength={100}
                disabled={isConnecting}
                className="w-full px-5 py-3.5 rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isNameFocused && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 pointer-events-none" />
              )}
            </div>
            {name && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveName}
                disabled={isConnecting}
                className="mt-3 w-full rounded-lg border-slate-700 hover:border-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all"
              >
                Save Name
              </Button>
            )}
          </div>
        )}

        {/* Saved Name Display with celebration animation */}
        {savedName && (
          <p className="text-cyan-400 mb-10 text-lg font-medium animate-bounce-in">
            Welcome back, <span className="font-bold text-cyan-300">{savedName}</span>! 👋
          </p>
        )}

        {/* CTA Button with enhanced interactions */}
        <Button
          size="lg"
          onClick={onStartCall}
          disabled={isConnecting}
          className="w-full max-w-sm rounded-xl px-8 py-7 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/20 hover:shadow-2xl hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 animate-fade-in-up delay-300"
        >
          <span className="flex items-center justify-center gap-2">
            {isConnecting ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                {startButtonText}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {startButtonText}
              </>
            )}
          </span>
        </Button>

        <p className="text-slate-400 mt-5 max-w-md text-xs md:text-sm text-center animate-fade-in-up delay-400">
          {isConnecting ? '🔄 Connecting securely to LiveKit...' : '🎤 Tap the button to start your voice conversation'}
        </p>

        {/* Trust Section with hover effects */}
        <div className="mt-20 mb-12 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl animate-fade-in-up delay-500">
          {[
            { icon: Lock, label: 'Privacy First', desc: 'Your data is protected', color: 'cyan' },
            { icon: Shield, label: 'Secure Conversations', desc: 'Banking-grade security', color: 'green' },
            { icon: Zap, label: 'AI Assistant', desc: 'Natural voice answers', color: 'blue' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-slate-800/20 border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/80 hover:bg-slate-800/40 transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 text-${item.color}-400 group-hover:scale-110 transition-transform`}
                />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-md px-4 py-5 md:py-7 z-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs text-slate-500 hover:text-slate-400 transition-colors">
            FinAssist • AI-powered financial voice assistant
          </p>
          <p className="text-center text-xs text-slate-600 mt-2 leading-relaxed">
            For account-specific queries, contact your bank's support. Never share OTP, PIN, password, or CVV.
          </p>
        </div>
      </footer>

      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-in {
          0%, 100% { transform: scale(0.8); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.5);
            transform: scale(1.02);
          }
        }
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-700 { animation-delay: 0.7s; }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
};

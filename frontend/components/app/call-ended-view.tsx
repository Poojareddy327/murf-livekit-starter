import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CallEndedIcon() {
  return (
    <div className="mb-6">
      <div className="animate-scale-pulse flex h-20 w-20 items-center justify-center rounded-full border border-green-500/30 bg-gradient-to-br from-green-900/40 to-emerald-900/40">
        <CheckCircle2 className="animate-bounce-rotate h-10 w-10 text-green-400" />
      </div>
    </div>
  );
}

interface CallEndedViewProps {
  onStartAgain: () => void;
}

export const CallEndedView = ({
  onStartAgain,
  ref,
}: React.ComponentProps<'div'> & CallEndedViewProps) => {
  return (
    <div
      ref={ref}
      className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4"
    >
      {/* Animated confetti-style background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="animate-float-slow absolute top-1/4 right-1/4 h-2 w-2 rounded-full bg-green-400/40"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="animate-float-slow absolute top-1/3 left-1/4 h-2 w-2 rounded-full bg-cyan-400/30"
          style={{ animationDelay: '0.5s' }}
        />
        <div
          className="animate-float-slow absolute right-1/3 bottom-1/3 h-2 w-2 rounded-full bg-blue-400/30"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="relative z-10 max-w-md text-center">
        <div className="animate-fade-in-down">
          <CallEndedIcon />
        </div>

        <h2 className="animate-fade-in-up mb-3 text-3xl font-bold text-white md:text-4xl">
          Conversation Ended
        </h2>

        <p className="animate-fade-in-up mb-8 leading-relaxed text-slate-300 delay-100">
          Thank you for chatting with FinAssist. Your conversation has been completed successfully.
        </p>

        <div className="animate-fade-in-up mb-8 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 transition-colors delay-200 hover:border-green-500/30">
          <p className="text-sm text-slate-400">
            ✓ Session ended securely • Your data is protected
          </p>
        </div>

        <Button
          size="lg"
          onClick={onStartAgain}
          className="animate-fade-in-up w-full transform rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-6 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all delay-300 duration-200 hover:scale-105 hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl hover:shadow-cyan-500/30 active:scale-95"
        >
          Start Conversation Again
        </Button>

        <p className="animate-fade-in-up mt-6 text-sm text-slate-500 delay-400">
          Need help? Contact your bank's customer support
        </p>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes scale-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
          }
          50% { 
            transform: scale(1.1);
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.5);
          }
        }
        @keyframes bounce-rotate {
          0%, 100% { 
            transform: rotate(0deg) scale(1);
          }
          50% { 
            transform: rotate(10deg) scale(1.05);
          }
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
        @keyframes float-slow {
          0%, 100% { 
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          50% { 
            transform: translateY(-30px) translateX(20px);
            opacity: 1;
          }
          100% {
            transform: translateY(-60px) translateX(0px);
            opacity: 0;
          }
        }
        .animate-scale-pulse {
          animation: scale-pulse 2s ease-in-out infinite;
        }
        .animate-bounce-rotate {
          animation: bounce-rotate 0.6s ease-in-out infinite;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-float-slow {
          animation: float-slow 3s ease-in infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
};

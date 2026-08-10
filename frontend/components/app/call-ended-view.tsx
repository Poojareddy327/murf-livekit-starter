import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

function CallEndedIcon() {
  return (
    <div className="mb-6">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30 flex items-center justify-center animate-scale-pulse">
        <CheckCircle2 className="w-10 h-10 text-green-400 animate-bounce-rotate" />
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
    <div ref={ref} className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Animated confetti-style background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-green-400/40 animate-float-slow" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-cyan-400/30 animate-float-slow" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-2 h-2 rounded-full bg-blue-400/30 animate-float-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-md text-center relative z-10">
        <div className="animate-fade-in-down">
          <CallEndedIcon />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 animate-fade-in-up">
          Conversation Ended
        </h2>

        <p className="text-slate-300 mb-8 leading-relaxed animate-fade-in-up delay-100">
          Thank you for chatting with FinAssist. Your conversation has been completed successfully.
        </p>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 mb-8 animate-fade-in-up delay-200 hover:border-green-500/30 transition-colors">
          <p className="text-sm text-slate-400">
            ✓ Session ended securely  •  Your data is protected
          </p>
        </div>

        <Button
          size="lg"
          onClick={onStartAgain}
          className="w-full rounded-xl px-8 py-6 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-200 transform hover:scale-105 active:scale-95 animate-fade-in-up delay-300"
        >
          Start Conversation Again
        </Button>

        <p className="text-slate-500 mt-6 text-sm animate-fade-in-up delay-400">
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

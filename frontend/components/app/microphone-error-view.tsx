import { AlertCircle, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MicrophoneErrorViewProps {
  errorMessage: string;
  onRetry: () => void;
}

export const MicrophoneErrorView = ({
  errorMessage,
  onRetry,
  ref,
}: React.ComponentProps<'div'> & MicrophoneErrorViewProps) => {
  return (
    <div
      ref={ref}
      className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4"
    >
      {/* Animated warning indicator background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-red-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md text-center">
        <div className="animate-fade-in-down mb-6">
          <div className="animate-pulse-alert flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-gradient-to-br from-red-900/40 to-rose-900/40">
            <Mic className="h-10 w-10 text-red-400" />
          </div>
        </div>

        <h2 className="animate-fade-in-up mb-3 text-3xl font-bold text-white md:text-4xl">
          Microphone Access Needed
        </h2>

        <p className="animate-fade-in-up mb-6 leading-relaxed text-slate-300 delay-100">
          {errorMessage}
        </p>

        {/* Instructions Card with staggered animation */}
        <div className="animate-fade-in-up mb-8 rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-800/30 p-5 text-left transition-colors delay-200 hover:border-blue-500/30">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <AlertCircle className="animate-bounce-small h-4 w-4 text-blue-400" />
            How to fix this:
          </p>
          <ol className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-3 transition-transform hover:translate-x-1">
              <span className="flex-shrink-0 font-bold text-cyan-400">1.</span>
              <span>Look for the microphone icon in your browser's address bar</span>
            </li>
            <li className="flex gap-3 transition-transform hover:translate-x-1">
              <span className="flex-shrink-0 font-bold text-cyan-400">2.</span>
              <span>Click it and select "Allow" to enable microphone access</span>
            </li>
            <li className="flex gap-3 transition-transform hover:translate-x-1">
              <span className="flex-shrink-0 font-bold text-cyan-400">3.</span>
              <span>Click the Retry button below</span>
            </li>
          </ol>
        </div>

        <Button
          size="lg"
          onClick={onRetry}
          className="animate-fade-in-up w-full transform rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-6 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all delay-300 duration-200 hover:scale-105 hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl hover:shadow-cyan-500/30 active:scale-95"
        >
          Retry
        </Button>

        <p className="animate-fade-in-up mt-6 text-xs text-slate-500 delay-400">
          Your microphone access is essential for voice conversations with FinAssist
        </p>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes pulse-alert {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
          }
          50% { 
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
          }
        }
        @keyframes bounce-small {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
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
        .animate-pulse-alert {
          animation: pulse-alert 2s ease-in-out infinite;
        }
        .animate-bounce-small {
          animation: bounce-small 1.5s ease-in-out infinite;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
};

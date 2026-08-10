import { Button } from '@/components/ui/button';
import { AlertCircle, Mic } from 'lucide-react';

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
    <div ref={ref} className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Animated warning indicator background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-md text-center relative z-10">
        <div className="mb-6 animate-fade-in-down">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-900/40 to-rose-900/40 border border-red-500/30 flex items-center justify-center animate-pulse-alert">
            <Mic className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 animate-fade-in-up">
          Microphone Access Needed
        </h2>

        <p className="text-slate-300 mb-6 leading-relaxed animate-fade-in-up delay-100">
          {errorMessage}
        </p>

        {/* Instructions Card with staggered animation */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-lg p-5 mb-8 text-left animate-fade-in-up delay-200 hover:border-blue-500/30 transition-colors">
          <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 animate-bounce-small" />
            How to fix this:
          </p>
          <ol className="text-sm text-slate-300 space-y-2">
            <li className="flex gap-3 hover:translate-x-1 transition-transform">
              <span className="flex-shrink-0 font-bold text-cyan-400">1.</span>
              <span>Look for the microphone icon in your browser's address bar</span>
            </li>
            <li className="flex gap-3 hover:translate-x-1 transition-transform">
              <span className="flex-shrink-0 font-bold text-cyan-400">2.</span>
              <span>Click it and select "Allow" to enable microphone access</span>
            </li>
            <li className="flex gap-3 hover:translate-x-1 transition-transform">
              <span className="flex-shrink-0 font-bold text-cyan-400">3.</span>
              <span>Click the Retry button below</span>
            </li>
          </ol>
        </div>

        <Button
          size="lg"
          onClick={onRetry}
          className="w-full rounded-xl px-8 py-6 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-200 transform hover:scale-105 active:scale-95 animate-fade-in-up delay-300"
        >
          Retry
        </Button>

        <p className="text-slate-500 mt-6 text-xs animate-fade-in-up delay-400">
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

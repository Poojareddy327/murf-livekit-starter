import { Button } from '@/components/ui/button';

function MicrophoneErrorIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-destructive mb-4 size-16"
    >
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      <path
        d="M32 14C28.6863 14 26 16.6863 26 20V32C26 35.3137 28.6863 38 32 38C35.3137 38 38 35.3137 38 32V20C38 16.6863 35.3137 14 32 14Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M44 32C44 38.6274 38.6274 44 32 44C25.3726 44 20 38.6274 20 32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 44V50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 50H38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 14L50 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

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
    <div ref={ref}>
      <section className="bg-background flex flex-col items-center justify-center px-4 text-center">
        <MicrophoneErrorIcon />

        <h2 className="text-foreground mb-2 text-2xl font-bold md:text-3xl">
          Microphone Access Required
        </h2>

        <p className="text-muted-foreground mb-4 max-w-md text-sm leading-6 md:text-base">
          {errorMessage}
        </p>

        <div className="bg-muted/50 border-border mb-8 max-w-md rounded-lg border p-4">
          <p className="text-muted-foreground text-left text-xs md:text-sm">
            <strong>How to fix:</strong>
            <br />
            1. Click the microphone icon in your browser&apos;s address bar
            <br />
            2. Allow microphone access for this site
            <br />
            3. Click Retry below
          </p>
        </div>

        <Button
          size="lg"
          onClick={onRetry}
          className="mt-2 w-full max-w-xs rounded-full px-8 py-6 text-base font-semibold shadow-lg transition-all hover:shadow-xl"
        >
          Retry
        </Button>
      </section>
    </div>
  );
};

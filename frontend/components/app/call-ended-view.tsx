import { Button } from '@/components/ui/button';

function CallEndedIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground mb-4 size-16"
    >
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path
        d="M20 28L28 36L44 20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    <div ref={ref}>
      <section className="bg-background flex flex-col items-center justify-center px-4 text-center">
        <CallEndedIcon />

        <h2 className="text-foreground mb-2 text-2xl font-bold md:text-3xl">Call Ended</h2>

        <p className="text-muted-foreground mb-8 max-w-md text-sm leading-6 md:text-base">
          Your conversation with FinAssist has ended. Ready to talk again?
        </p>

        <Button
          size="lg"
          onClick={onStartAgain}
          className="mt-2 w-full max-w-xs rounded-full px-8 py-6 text-base font-semibold shadow-lg transition-all hover:shadow-xl"
        >
          Start Again
        </Button>
      </section>
    </div>
  );
};

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'finassist_user_name';

function WelcomeImage() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-accent mb-6 size-20"
    >
      {/* Banking icon - shield with dollar sign */}
      <rect x="10" y="15" width="60" height="50" rx="6" fill="currentColor" opacity="0.1" />
      <path
        d="M40 10L65 20V38C65 50 57.5 60 40 70C22.5 60 15 50 15 38V20L40 10Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M36 34C36 34 37 28 42 28C47 28 48 32 48 34C48 36 46 37 44 38L42 39V42M42 48V48.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      } catch (e) {
        console.error('Failed to save:', e);
      }
    }
  };

  const isConnecting = startButtonText.toLowerCase().includes('connecting');

  return (
    <div ref={ref}>
      <section className="bg-background flex flex-col items-center justify-center px-4 text-center">
        <WelcomeImage />

        <h1 className="text-foreground mb-2 text-3xl font-bold md:text-4xl">FinAssist</h1>

        <p className="text-muted-foreground mb-8 max-w-prose text-base leading-relaxed md:text-lg">
          Your Financial Services Voice Assistant
        </p>

        <p className="text-foreground mb-8 max-w-md text-sm leading-6 md:text-base">
          Get instant help with banking information, digital services, card support, UPI guidance,
          and security tips.
        </p>

        {!savedName && (
          <div className="mb-6 w-full max-w-xs">
            <input
              type="text"
              placeholder="What's your name?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              maxLength={100}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground"
              disabled={isConnecting}
            />
            {name && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveName}
                disabled={isConnecting}
                className="mt-2 rounded-full"
              >
                Save Name
              </Button>
            )}
          </div>
        )}

        {savedName && (
          <p className="text-accent mb-4 text-sm font-medium">Hi, {savedName}! 👋</p>
        )}

        <Button
          size="lg"
          onClick={onStartCall}
          disabled={isConnecting}
          className="mt-2 w-full max-w-xs rounded-full px-8 py-6 text-base font-semibold shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {startButtonText}
        </Button>

        <p className="text-muted-foreground mt-4 max-w-md text-xs">
          {isConnecting ? 'Please wait...' : 'Tap the button above to begin your conversation'}
        </p>
      </section>

      <div className="fixed bottom-5 left-0 flex w-full items-center justify-center px-4">
        <p className="text-muted-foreground max-w-prose text-center text-xs leading-5 font-normal text-pretty md:text-sm">
          For account-specific queries, please contact your bank&apos;s official customer support.
          Never share OTP, PIN, password, or CVV.
        </p>
      </div>
    </div>
  );
};

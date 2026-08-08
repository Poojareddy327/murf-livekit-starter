'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { ConnectionState } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { CallEndedView } from '@/components/app/call-ended-view';
import { MicrophoneErrorView } from '@/components/app/microphone-error-view';
import { WelcomeView } from '@/components/app/welcome-view';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);
const MotionCallEndedView = motion.create(CallEndedView);
const MotionMicrophoneErrorView = motion.create(MicrophoneErrorView);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { isConnected, start, end, connectionState } = useSessionContext();
  const { resolvedTheme } = useTheme();
  const [hasEnded, setHasEnded] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Reset states when connection is successful
    if (isConnected) {
      setHasEnded(false);
      setMicrophoneError(null);
      setIsConnecting(false);
    }
  }, [isConnected]);

  useEffect(() => {
    // Detect disconnection and show call ended view
    if (
      !isConnected &&
      connectionState === ConnectionState.Disconnected &&
      !microphoneError &&
      !hasEnded &&
      isConnecting
    ) {
      setHasEnded(true);
      setIsConnecting(false);
    }
  }, [isConnected, connectionState, microphoneError, hasEnded, isConnecting]);

  const handleStartCall = async () => {
    setMicrophoneError(null);
    setHasEnded(false);
    setIsConnecting(true);

    try {
      await start();
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);

      // Check if it's a microphone permission error
      if (error instanceof Error) {
        if (
          error.message.includes('Permission denied') ||
          error.message.includes('NotAllowedError') ||
          error.message.includes('microphone')
        ) {
          setMicrophoneError(
            'Microphone access is blocked. Please allow microphone access in your browser settings and try again.'
          );
        } else if (error.message.includes('NotFoundError')) {
          setMicrophoneError('No microphone found. Please connect a microphone and try again.');
        } else {
          setMicrophoneError(
            'Failed to start the conversation. Please check your connection and try again.'
          );
        }
      } else {
        setMicrophoneError('Failed to start the conversation. Please try again.');
      }
    }
  };

  const handleRestartCall = () => {
    setHasEnded(false);
    setMicrophoneError(null);
    setIsConnecting(false);
  };

  return (
    <AnimatePresence mode="wait">
      {/* Microphone Error view */}
      {microphoneError && (
        <MotionMicrophoneErrorView
          key="microphone-error"
          {...VIEW_MOTION_PROPS}
          errorMessage={microphoneError}
          onRetry={handleStartCall}
        />
      )}

      {/* Call Ended view */}
      {!microphoneError && hasEnded && (
        <MotionCallEndedView
          key="call-ended"
          {...VIEW_MOTION_PROPS}
          onStartAgain={handleRestartCall}
        />
      )}

      {/* Welcome view */}
      {!microphoneError && !hasEnded && !isConnected && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={isConnecting ? 'Connecting...' : appConfig.startButtonText}
          onStartCall={handleStartCall}
        />
      )}

      {/* Session view */}
      {!microphoneError && !hasEnded && isConnected && (
        <MotionSessionView
          key="session-view"
          {...VIEW_MOTION_PROPS}
          supportsChatInput={appConfig.supportsChatInput}
          supportsVideoInput={appConfig.supportsVideoInput}
          supportsScreenShare={appConfig.supportsScreenShare}
          isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
          audioVisualizerType={appConfig.audioVisualizerType}
          audioVisualizerColor={
            resolvedTheme === 'dark'
              ? appConfig.audioVisualizerColorDark
              : appConfig.audioVisualizerColor
          }
          audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
          audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
          audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
          audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
          audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
          audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
          audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
          onCallEnd={() => {
            end();
            setHasEnded(true);
          }}
          className="fixed inset-0"
        />
      )}
    </AnimatePresence>
  );
}

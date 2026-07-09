/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Brain, CheckCircle, Volume2, ShieldAlert, Mic } from 'lucide-react';
import { 
  BoyClimbingIllustration, 
  WavingCatIllustration, 
  NotebookCalendarIllustration 
} from './illustrations';

interface OnboardingProps {
  onComplete: () => void;
  onGoToLogin: () => void;
}

export default function Onboarding({ onComplete, onGoToLogin }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [permissions, setPermissions] = useState({
    microphone: false,
    notifications: false,
    speech: false,
  });
  const [permError, setPermError] = useState<string | null>(null);

  const onboardingSteps = [
    {
      title: "Welcome to Daynest",
      subtitle: "Ideas. Plan. Execution.",
      description: "Speak your mind, structure your ideas, and track daily goals in a warm, cozy, cat-friendly digital sanctuary.",
      icon: <BoyClimbingIllustration />,
    },
    {
      title: "Talk Mindfully",
      subtitle: "Friendly & Calm Core Workspace",
      description: "Our built-in voice journal and real-time audio oscilloscopes register acoustic streams and extract growth metrics for you.",
      icon: <WavingCatIllustration />,
    },
    {
      title: "Daily Goal Trackers",
      subtitle: "Aesthetic Notebook Calendars",
      description: "Sync custom French learning checkmarks, morning code sprint goals, and exercise milestones with physical checklists.",
      icon: <NotebookCalendarIllustration />,
    },
  ];

  const requestMicrophone = async () => {
    try {
      setPermError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, microphone: true }));
    } catch (err: any) {
      console.error(err);
      setPermError("Microphone permission was denied. Please unlock mic access to enjoy acoustic journaling.");
    }
  };

  const grantAll = () => {
    setPermissions({
      microphone: true,
      notifications: true,
      speech: true,
    });
    onComplete();
  };

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      setStep(3); // Go to Permissions step
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between bg-cozy-bg text-cozy-text-dark p-6 relative overflow-hidden" id="onboarding_screen">
      
      {/* Whimsical clouds/sun background ambiance */}
      <div className="absolute top-[-10%] left-[-10%] w-60 h-60 rounded-full bg-cozy-yellow/20 blur-[60px]" />
      <div className="absolute bottom-[20%] right-[-10%] w-48 h-48 rounded-full bg-cozy-orange/15 blur-[50px]" />

      {/* Top Header */}
      <div className="flex justify-between items-center z-10 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cozy-orange flex items-center justify-center border-2 border-cozy-text-dark text-white font-extrabold text-sm shadow-sm">
            D
          </div>
          <span className="font-extrabold tracking-tight text-lg text-cozy-text-dark font-sans">Daynest</span>
        </div>
        {step < 3 && (
          <button 
            onClick={onGoToLogin} 
            className="text-xs font-bold text-cozy-text-muted hover:text-cozy-text-dark transition duration-200"
            id="skip_button"
          >
            Skip to Login
          </button>
        )}
      </div>

      {/* Carousel Core Container */}
      <div className="flex-1 flex flex-col justify-center items-center py-4 z-10">
        <AnimatePresence mode="wait">
          {step < 3 ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center space-y-4 w-full"
            >
              {/* Illustration */}
              <div className="w-full flex items-center justify-center">
                {onboardingSteps[step].icon}
              </div>

              {/* Subtitle Accent */}
              <span className="text-[10px] font-black tracking-widest text-white uppercase px-3 py-1 bg-cozy-orange rounded-full border-2 border-cozy-text-dark shadow-sm">
                {onboardingSteps[step].subtitle}
              </span>

              {/* Main Headline */}
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight px-1 text-cozy-text-dark">
                {onboardingSteps[step].title}
              </h2>

              {/* Detailed Explanation */}
              <p className="text-xs md:text-sm text-cozy-text-muted leading-relaxed max-w-xs font-semibold">
                {onboardingSteps[step].description}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="permissions"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center space-y-5"
            >
              <div className="w-16 h-16 rounded-full bg-cozy-yellow border-3 border-cozy-text-dark flex items-center justify-center text-cozy-text-dark shadow-sm">
                <Mic size={28} />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-extrabold text-cozy-text-dark">Let's nesting up!</h2>
                <p className="text-xs text-cozy-text-muted mt-2 max-w-xs mx-auto font-semibold">
                  To provide transcription overlays and cozy daily breathing reminders, we'd love some access:
                </p>
              </div>

              <div className="w-full space-y-3 pt-2">
                {/* Microphone Permission Item */}
                <div className="flex items-center justify-between p-3.5 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl cozy-shadow-sm">
                  <div className="flex items-center gap-3">
                    <Mic className={`w-5 h-5 ${permissions.microphone ? 'text-cozy-green' : 'text-cozy-text-muted'}`} strokeWidth={2.5} />
                    <div className="text-left">
                      <p className="text-xs font-extrabold text-cozy-text-dark">Microphone Stream</p>
                      <p className="text-[10px] text-cozy-text-muted font-semibold">Required to dictate diaries</p>
                    </div>
                  </div>
                  <button
                    onClick={requestMicrophone}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-cozy-text-dark transition tactile-btn-retro ${
                      permissions.microphone 
                        ? 'bg-cozy-green/10 text-cozy-green border-cozy-green pointer-events-none' 
                        : 'bg-cozy-orange text-white'
                    }`}
                  >
                    {permissions.microphone ? 'Granted' : 'Enable'}
                  </button>
                </div>

                {/* Notifications Permission Item */}
                <div className="flex items-center justify-between p-3.5 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl cozy-shadow-sm">
                  <div className="flex items-center gap-3">
                    <Volume2 className={`w-5 h-5 ${permissions.notifications ? 'text-cozy-green' : 'text-cozy-text-muted'}`} strokeWidth={2.5} />
                    <div className="text-left">
                      <p className="text-xs font-extrabold text-cozy-text-dark">Cozy Reminders</p>
                      <p className="text-[10px] text-cozy-text-muted font-semibold">Checks in morning and night</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPermissions(p => ({ ...p, notifications: true }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-cozy-text-dark transition tactile-btn-retro ${
                      permissions.notifications 
                        ? 'bg-cozy-green/10 text-cozy-green border-cozy-green pointer-events-none' 
                        : 'bg-cozy-yellow text-cozy-text-dark'
                    }`}
                  >
                    {permissions.notifications ? 'Granted' : 'Enable'}
                  </button>
                </div>

                {/* AI Consent Item */}
                <div className="flex items-center justify-between p-3.5 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl cozy-shadow-sm">
                  <div className="flex items-center gap-3">
                    <Brain className={`w-5 h-5 ${permissions.speech ? 'text-cozy-green' : 'text-cozy-text-muted'}`} strokeWidth={2.5} />
                    <div className="text-left">
                      <p className="text-xs font-extrabold text-cozy-text-dark">AI Cozy Analytics</p>
                      <p className="text-[10px] text-cozy-text-muted font-semibold">Unlocks emotion & advice insights</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPermissions(p => ({ ...p, speech: true }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-cozy-text-dark transition tactile-btn-retro ${
                      permissions.speech 
                        ? 'bg-cozy-green/10 text-cozy-green border-cozy-green pointer-events-none' 
                        : 'bg-cozy-yellow text-cozy-text-dark'
                    }`}
                  >
                    {permissions.speech ? 'Granted' : 'Enable'}
                  </button>
                </div>
              </div>

              {permError && (
                <div className="p-3 bg-cozy-orange/10 border-2 border-cozy-orange rounded-xl flex gap-2 text-left z-10">
                  <ShieldAlert className="text-cozy-orange shrink-0 w-4 h-4 mt-0.5" />
                  <p className="text-[11px] text-cozy-text-dark leading-normal font-semibold">{permError}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer controls */}
      <div className="z-10 py-4 flex flex-col space-y-4">
        {step < 3 ? (
          <div className="flex justify-between items-center">
            {/* Dots */}
            <div className="flex gap-2">
              {onboardingSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2.5 rounded-full transition-all duration-300 border border-cozy-text-dark ${
                    idx === step ? 'w-8 bg-cozy-orange' : 'w-2.5 bg-cozy-card'
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-cozy-orange text-white px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest border-2 border-cozy-text-dark shadow-xs transition-all tactile-btn-retro"
              id="next_button"
            >
              <span>Next</span>
              <ArrowRight size={13} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={grantAll}
              className="w-full py-3.5 bg-cozy-orange text-white font-black text-xs uppercase tracking-widest border-3 border-cozy-text-dark rounded-2xl cozy-shadow tactile-btn-retro"
              id="continue_app_button"
            >
              Start Nested Life
            </button>
            <button
              onClick={onComplete}
              className="w-full py-2.5 bg-transparent text-cozy-text-muted hover:text-cozy-text-dark font-bold text-xs rounded-xl transition"
            >
              I'll complete this later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

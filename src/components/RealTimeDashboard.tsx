/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Mic, 
  Sparkles, 
  FileText,
  ChevronRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { WavingCatIllustration } from './illustrations';

interface RealTimeDashboardProps {
  userName: string;
  isWritingMode: boolean;
  setIsWritingMode: (val: boolean) => void;
  onStartRecording: () => void;
  entriesCount: number;
  goalsCount: number;
  currentGoalTitle: string;
  currentGoalProgress: number;
  onNavigateTab: (tab: 'home' | 'timeline' | 'analytics' | 'goals' | 'coach' | 'profile') => void;
}

export default function RealTimeDashboard({
  userName,
  isWritingMode,
  setIsWritingMode,
  onStartRecording,
  entriesCount,
  goalsCount,
  currentGoalTitle,
  currentGoalProgress,
  onNavigateTab
}: RealTimeDashboardProps) {
  // 1. Clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 5) return 'Good night';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  const getGreetingMessage = () => {
    const hour = currentTime.getHours();
    if (hour < 5) return 'Seeking tranquility in the nest. Recording quiet thoughts is therapeutic.';
    if (hour < 12) return 'Rise with warmth. Check out your tasks and align your plans!';
    if (hour < 17) return 'Checking in mid-day. Take a cozy deep breath to refresh your energy.';
    if (hour < 21) return 'Unwinding from a full day. Record your highlights or type a quiet diary entry.';
    return 'Reflecting before rest prepares your mind for tomorrow. Nestle up nicely!';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 md:p-8 flex flex-col space-y-6 max-w-4xl mx-auto" id="realtime_dashboard">
      
      {/* 1. Header Bento Section: Dynamic Welcome & Cozy System Clock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Dynamic Welcome Card */}
        <div className="md:col-span-2 bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px] cozy-shadow">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cozy-yellow/20 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-cozy-accent uppercase tracking-widest mb-1">
              <Sparkles size={12} className="animate-pulse text-cozy-orange" />
              <span>Cozy Nest Core</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-cozy-text-dark capitalize">
              {getGreeting()}, {userName.split(' ')[0]}! ✨
            </h1>
            <p className="text-xs font-semibold text-cozy-text-muted leading-relaxed mt-2 pr-4">
              {getGreetingMessage()}
            </p>
          </div>

          <div className="text-[11px] font-bold text-cozy-green mt-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cozy-green border-2 border-cozy-text-dark shrink-0 animate-pulse" />
            <span>Active Reflection Core ready for inputs</span>
          </div>
        </div>

        {/* Cozy Clock Card */}
        <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 flex flex-col justify-between min-h-[140px] relative overflow-hidden cozy-shadow">
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-cozy-orange/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-cozy-text-muted uppercase tracking-wider">
              <Clock size={12} className="text-cozy-orange" />
              <span>Local System Time</span>
            </div>
            <span className="text-[9px] font-black bg-cozy-yellow text-cozy-text-dark px-2.5 py-0.5 rounded-full border-2 border-cozy-text-dark">
              Ticker
            </span>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black tracking-tight text-cozy-text-dark flex items-baseline gap-1">
              {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
              <span className="text-sm text-cozy-orange font-bold select-none animate-pulse">:</span>
              <span className="text-lg text-cozy-text-muted font-bold">
                {currentTime.toLocaleTimeString('en-US', { hour12: false, second: '2-digit' }).split(':')[2]}
              </span>
            </div>
            <div className="text-xs text-cozy-text-muted font-bold mt-0.5">
              {formatDate(currentTime)}
            </div>
          </div>

          <div className="text-[9px] font-black text-cozy-text-muted flex items-center justify-between">
            <span>GMT {currentTime.toTimeString().split('GMT')[1]?.split(' ')[0]}</span>
            <span>STATUS: NESTING</span>
          </div>
        </div>

      </div>



      {/* 3. Main Launch Center: Cozy spoken toggle and launch button */}
      <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 justify-between cozy-shadow">
        <div className="flex-1 text-center md:text-left space-y-1">
          <h2 className="text-lg font-black text-cozy-text-dark">Create Daily Reflection Entry</h2>
          <p className="text-xs font-semibold text-cozy-text-muted">
            Record a cozy voice acoustic stream to align your daily ideas, plans, and execution!
          </p>

          <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
            <span className="bg-cozy-yellow text-cozy-text-dark text-[10px] font-black border-2 border-cozy-text-dark px-2.5 py-0.5 rounded-full shadow-sm">
              ✨ Free AI Digest
            </span>
            <span className="bg-cozy-green text-white text-[10px] font-black border-2 border-cozy-text-dark px-2.5 py-0.5 rounded-full shadow-sm">
              🐾 Cat Friendly
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center shrink-0 space-y-4 w-full md:w-auto">
          {/* Mode Selector */}
          <div className="bg-cozy-bg p-1 rounded-2xl flex border-2 border-cozy-text-dark w-full md:w-[240px] shadow-sm">
            <button
              onClick={() => setIsWritingMode(false)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border-2 ${
                !isWritingMode 
                  ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                  : 'text-cozy-text-muted border-transparent hover:text-cozy-text-dark'
              }`}
            >
              <Mic size={12} strokeWidth={2.5} />
              <span>Voice</span>
            </button>
            <button
              onClick={() => setIsWritingMode(true)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border-2 ${
                isWritingMode 
                  ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                  : 'text-cozy-text-muted border-transparent hover:text-cozy-text-dark'
              }`}
            >
              <FileText size={12} strokeWidth={2.5} />
              <span>Text</span>
            </button>
          </div>

          <button 
            onClick={onStartRecording}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-cozy-orange hover:bg-cozy-accent text-white font-black text-xs uppercase tracking-widest border-3 border-cozy-text-dark rounded-2xl cozy-shadow hover:translate-y-0.5 active:translate-y-1 transition-all"
            id="tap_to_record_trigger_dashboard"
          >
            {isWritingMode ? (
              <>
                <FileText size={14} strokeWidth={3} />
                <span>Start Typing Entry</span>
              </>
            ) : (
              <>
                <Mic size={14} strokeWidth={3} />
                <span>Start Voice Recording</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Bento Grid Glance: Redesigned identical to Middle Panel of mockup with Waving Cat! */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Dynamic Insights & Quick stats */}
        <div 
          onClick={() => onNavigateTab('analytics')}
          className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 hover:border-cozy-orange cursor-pointer transition flex flex-col justify-between min-h-[140px] cozy-shadow relative group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-cozy-green/15 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cozy-green">
              <TrendingUp size={16} strokeWidth={2.5} />
              <span className="text-xs font-black uppercase tracking-wider">Dynamic Insights</span>
            </div>
            <ChevronRight size={14} className="text-cozy-text-muted group-hover:translate-x-1 transition" />
          </div>
          
          <p className="text-xs text-cozy-text-muted leading-relaxed font-bold pr-4 mt-3">
            "Your mood cycles spike with morning tasks! Completing planning and code sprints brings high energy levels."
          </p>

          <div className="flex items-center justify-between text-[10px] text-cozy-text-muted font-bold uppercase mt-4">
            <span>Total logs: {entriesCount}</span>
            <span className="text-cozy-orange font-black">View Analytics →</span>
          </div>
        </div>

        {/* Goals Tracker mockup card featuring the adorable striped waving cat from Screen 2! */}
        <div 
          onClick={() => onNavigateTab('goals')}
          className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 hover:border-cozy-orange cursor-pointer transition flex flex-col justify-between min-h-[140px] cozy-shadow relative group overflow-hidden"
        >
          {/* Adorable little waving cat head peaking from the side */}
          <div className="absolute bottom-[-10px] right-[-15px] w-24 h-24 opacity-80 pointer-events-none transform rotate-12 transition group-hover:scale-105 group-hover:rotate-6">
            <WavingCatIllustration />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 text-cozy-accent">
              <Target size={16} strokeWidth={2.5} />
              <span className="text-xs font-black uppercase tracking-wider">Active Goal Focus</span>
            </div>
            <ChevronRight size={14} className="text-cozy-text-muted group-hover:translate-x-1 transition" />
          </div>

          <div className="mt-3 relative z-10 max-w-[70%]">
            <div className="flex items-center justify-between text-[11px] font-extrabold mb-1.5">
              <span className="text-cozy-text-dark truncate">{currentGoalTitle}</span>
              <span className="text-cozy-accent font-black">{currentGoalProgress}%</span>
            </div>
            <div className="w-full bg-cozy-bg border-2 border-cozy-text-dark h-3 rounded-full overflow-hidden">
              <div 
                className="bg-cozy-orange h-full rounded-full transition-all duration-500" 
                style={{ width: `${currentGoalProgress}%` }}
              />
            </div>
          </div>

          <div className="text-[10px] text-cozy-text-muted font-bold uppercase mt-4 relative z-10">
            <span>Active Habits: {goalsCount} Set</span>
          </div>
        </div>

      </div>

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Calendar, 
  TrendingUp, 
  Brain, 
  User, 
  Sparkles, 
  Plus, 
  LogOut, 
  Heart, 
  ShieldAlert, 
  Volume2, 
  Lock, 
  Crown,
  Activity,
  Award,
  ChevronRight,
  MessageSquare,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

import { JournalEntry, Goal, Habit, Badge } from './types';
import Onboarding from './components/Onboarding';
import Auth from './components/Auth';
import RecordingScreen from './components/RecordingScreen';
import JournalTimeline from './components/JournalTimeline';
import MoodAnalytics from './components/MoodAnalytics';
import AiCoach from './components/AiCoach';
import ProfilePage from './components/ProfilePage';
import RealTimeDashboard from './components/RealTimeDashboard';

// Realistic Seed Data to make the application alive and beautiful on start
const SEED_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    duration: 54,
    transcript: "I woke up early today and dedicated an hour to morning meditation and coding my startup app. It felt incredibly satisfying to see the visual changes coming to life. Work went smoothly afterward, although I've been feeling slightly tired in the evening due to the weather.",
    summary: "Woke up early with positive meditation and coding energy. Experienced some evening physical fatigue but maintained great mental focus.",
    mood: "Happy",
    moodEmoji: "😊",
    topics: ["Learning", "Work", "Fitness"],
    tags: ["#meditation", "#coding", "#focus"],
    emotions: ["Satisfaction", "Productivity", "Mild Fatigue"],
    takeaways: [
      "Keep dedicating the first hour of your morning to distraction-free work.",
      "Consider a short 10-minute power nap when evening fatigue hits.",
      "Spread code components across small modular files for easier updates."
    ]
  },
  {
    id: 'entry-2',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    duration: 112,
    transcript: "I hit a new gym speed record today on the treadmill, completing 5 kilometers in under 22 minutes! My confidence levels are through the roof. I feel physically charged and highly motivated for my upcoming pitch. Also read a chapter of my French novel.",
    summary: "Achieved a personal tread speed record. Feeling physically charged, highly motivated, and mentally sharp.",
    mood: "Excited",
    moodEmoji: "😍",
    topics: ["Fitness", "Health", "Reading"],
    tags: ["#gym", "#speed", "#confidence"],
    emotions: ["Elation", "Gratitude", "Confidence"],
    takeaways: [
      "Track physical gym milestones closely, as they heavily boost your confidence.",
      "French reading right after gym helps retain vocabulary beautifully.",
      "Stay hydrated after intense cardiovascular exercises."
    ]
  },
  {
    id: 'entry-3',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    duration: 88,
    transcript: "I had some serious anxiety and stress today preparing for the upcoming startup exam and investor reviews. There are so many moving components, and I felt quite overwhelmed. I sat down and forced myself to plan everything out in sub-tasks.",
    summary: "Felt significant pressure and anxiety preparing for startup and exam reviews. Resolved it by structuring action steps.",
    mood: "Stressed",
    moodEmoji: "🤯",
    topics: ["Work", "Mental Health"],
    tags: ["#planning", "#startup", "#stress"],
    emotions: ["Anxiety", "Overwhelm", "Determination"],
    takeaways: [
      "When anxiety hits, immediately structure your task list into 3 atomic steps.",
      "Limit screen exposure in the hour leading up to bedtime.",
      "Rest is a critical resource for high-stress sprints."
    ]
  }
];

const SEED_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: "Learn French vocabulary",
    category: "Reading",
    progress: 65,
    deadline: "2026-08-15",
    actions: [
      "Read 5 pages of French fiction daily",
      "Log 10 new words in notebook",
      "Speak a 1-minute audio log in French"
    ]
  },
  {
    id: 'goal-2',
    title: "Build startup launch pitch deck",
    category: "Career",
    progress: 80,
    deadline: "2026-07-20",
    actions: [
      "Refine value proposition slides",
      "Do a practice run with 2 mentors",
      "Add 3 customer quote screenshots"
    ]
  },
  {
    id: 'goal-3',
    title: "Treadmill 5K under 20 mins",
    category: "Fitness",
    progress: 40,
    deadline: "2026-09-01",
    actions: [
      "Incorporate high-intensity sprints twice a week",
      "Focus on dynamic leg stretching pre-workout",
      "Track pacing metrics on smartwatch"
    ]
  }
];

const SEED_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: "Morning Meditation",
    streak: 5,
    history: {
      "2026-06-24": true,
      "2026-06-23": true,
      "2026-06-22": true,
      "2026-06-21": true,
      "2026-06-20": true
    }
  },
  {
    id: 'habit-2',
    name: "Read 10 Pages",
    streak: 3,
    history: {
      "2026-06-24": false,
      "2026-06-23": true,
      "2026-06-22": true,
      "2026-06-21": true
    }
  },
  {
    id: 'habit-3',
    name: "Code 1 Hour",
    streak: 27,
    history: {
      "2026-06-24": true,
      "2026-06-23": true,
      "2026-06-22": true,
      "2026-06-21": true
    }
  }
];

const SEED_BADGES: Badge[] = [
  {
    id: 'badge-1',
    title: "First Voice",
    description: "Recorded your first spoken reflection.",
    icon: "🎙️",
    unlocked: true,
    unlockedAt: "2026-06-20"
  },
  {
    id: 'badge-2',
    title: "7-Day Spark",
    description: "Kept a 7-day journal entry streak.",
    icon: "🔥",
    unlocked: true,
    unlockedAt: "2026-06-23"
  },
  {
    id: 'badge-3',
    title: "Goal Catalyst",
    description: "Achieved over 75% progress on any goal.",
    icon: "🎯",
    unlocked: true,
    unlockedAt: "2026-06-24"
  },
  {
    id: 'badge-4',
    title: "Zen Architect",
    description: "Maintained a 5-day meditation streak.",
    icon: "🧘",
    unlocked: true,
    unlockedAt: "2026-06-24"
  },
  {
    id: 'badge-5',
    title: "AI Coachee",
    description: "Had a personalized discussion with the coach.",
    icon: "🧠",
    unlocked: false
  }
];

export default function App() {
  // Navigation states
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('voice_journal_onboarded') === 'true';
  });
  const [user, setUser] = useState<{
    name: string;
    email: string;
    streak: number;
    isPremium: boolean;
  } | null>(() => {
    const savedUser = localStorage.getItem('voice_journal_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [currentTab, setCurrentTab] = useState<'home' | 'timeline' | 'analytics' | 'coach' | 'profile'>('home');
  const [isRecordingOverlayActive, setIsRecordingOverlayActive] = useState(false);
  const [isWritingMode, setIsWritingMode] = useState(false); // voice vs typing toggle
  const [autoSelectEntryId, setAutoSelectEntryId] = useState<string | null>(null);

  // Application Data States
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('voice_journal_entries');
    return saved ? JSON.parse(saved) : SEED_ENTRIES;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('voice_journal_goals');
    return saved ? JSON.parse(saved) : SEED_GOALS;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('voice_journal_habits');
    return saved ? JSON.parse(saved) : SEED_HABITS;
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    const saved = localStorage.getItem('voice_journal_badges');
    return saved ? JSON.parse(saved) : SEED_BADGES;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('voice_journal_onboarded', String(isOnboarded));
  }, [isOnboarded]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('voice_journal_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('voice_journal_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('voice_journal_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('voice_journal_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('voice_journal_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('voice_journal_badges', JSON.stringify(badges));
  }, [badges]);

  // Handle entry creation
  const handleSaveEntry = (newEntry: JournalEntry) => {
    setEntries(prev => [newEntry, ...prev]);
    setIsRecordingOverlayActive(false);
    setCurrentTab('timeline'); // route directly to timeline to see the result!
    
    // Increment streak
    if (user) {
      setUser(prev => prev ? { ...prev, streak: prev.streak + 1 } : null);
    }

    // Trigger badge unlock check
    setBadges(prevBadges => {
      return prevBadges.map(b => {
        if (b.id === 'badge-5' && !b.unlocked) { // Coach discussions, etc.
          return { ...b, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        return b;
      });
    });
  };

  // Create a blank Notion-like journal page
  const handleCreateJournalPage = () => {
    const newId = `entry-${Date.now()}`;
    const newPage: JournalEntry = {
      id: newId,
      date: new Date().toISOString(),
      duration: 0,
      transcript: '',
      summary: '',
      mood: 'Calm',
      moodEmoji: '😊',
      topics: [],
      tags: ['Reflections'],
      emotions: [],
      takeaways: [],
      ...({
        blocks: [
          { id: 'b-title', type: 'h1', content: '' },
          { id: `b-p-${Date.now()}`, type: 'paragraph', content: '' }
        ]
      })
    } as any;
    setEntries(prev => [newPage, ...prev]);
    setAutoSelectEntryId(newId);
    setCurrentTab('timeline');
  };

  // Profile actions
  const handleTogglePremium = () => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, isPremium: !prev.isPremium };
    });
  };

  const handleLogout = () => {
    setUser(null);
    setIsOnboarded(false);
    localStorage.removeItem('voice_journal_onboarded');
    localStorage.removeItem('voice_journal_user');
  };

  // Goals actions
  const handleAddGoal = (newGoal: Goal) => {
    setGoals(prev => [newGoal, ...prev]);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Habits actions
  const handleToggleHabit = (habitId: string, dateStr: string) => {
    setHabits(prevHabits => {
      return prevHabits.map(h => {
        if (h.id === habitId) {
          const wasChecked = !!h.history[dateStr];
          const newHistory = { ...h.history, [dateStr]: !wasChecked };
          const newStreak = !wasChecked ? h.streak + 1 : Math.max(0, h.streak - 1);
          return {
            ...h,
            streak: newStreak,
            history: newHistory
          };
        }
        return h;
      });
    });
  };

  const handleAddHabit = (name: string) => {
    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      streak: 0,
      history: {}
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const handleUpdateEntry = (updatedEntry: JournalEntry) => {
    setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  // Navigation router
  if (!isOnboarded) {
    return (
      <Onboarding 
        onComplete={() => setIsOnboarded(true)} 
        onGoToLogin={() => {
          setIsOnboarded(true);
        }}
      />
    );
  }

  if (!user) {
    return (
      <Auth 
        onSuccess={(name, email) => {
          setUser({
            name,
            email,
            streak: 27,
            isPremium: true // give high-fidelity default premium access
          });
          setCurrentTab('home');
        }}
        onBackToOnboarding={() => setIsOnboarded(false)}
      />
    );
  }

  return (
    <div className="bg-cozy-bg min-h-screen w-full flex flex-col font-sans overflow-x-hidden text-cozy-text-dark relative">
      
      {/* Top Cozy Nav Bar */}
      <nav className="h-16 px-6 md:px-8 flex items-center justify-between border-b-3 border-cozy-text-dark bg-cozy-card sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cozy-orange rounded-xl flex items-center justify-center border-2 border-cozy-text-dark shadow-sm">
            <svg className="w-5.5 h-5.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-cozy-text-dark">
            Daynest
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 bg-cozy-yellow px-3.5 py-1.5 rounded-full border-2 border-cozy-text-dark shadow-sm">
            <span className="text-sm select-none">🔥</span>
            <span className="text-xs font-black text-cozy-text-dark">{user.streak} Day Streak</span>
          </div>
          
          {/* Circular avatar bubble */}
          <div 
            onClick={() => setCurrentTab('profile')} 
            className="w-10 h-10 rounded-xl bg-cozy-orange border-2 border-cozy-text-dark cursor-pointer flex items-center justify-center text-xs font-black text-white select-none shadow-sm hover:scale-105 transition"
            title="View Profile Settings"
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      {/* Main Content Layout Container */}
      <div className="flex-1 flex w-full relative">
        
        {/* DESKTOP SIDEBAR (visible on large screen) */}
        <aside className="hidden lg:flex w-72 border-r-3 border-cozy-text-dark p-6 flex-col gap-6 shrink-0 bg-cozy-bg">
          
          {/* Greeting Box */}
          <div className="bg-cozy-card rounded-2xl p-5 border-2 border-cozy-text-dark shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cozy-yellow/10 rounded-full blur-xl" />
            <h3 className="text-cozy-text-muted text-[10px] font-black uppercase tracking-wider mb-2">
              Good Day, {user.name.split(' ')[0]} 👋
            </h3>
            <p className="text-xs text-cozy-text-dark italic leading-relaxed font-semibold">
              "Every thought you speak is an elegant piece of your personal growth story."
            </p>
          </div>

          {/* Quick Tab Menu Options */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-black text-cozy-text-muted uppercase tracking-wider">Workspace</span>
              <button
                onClick={handleCreateJournalPage}
                className="p-1 hover:bg-cozy-card rounded border border-transparent hover:border-cozy-text-dark text-cozy-text-muted hover:text-cozy-text-dark transition flex items-center justify-center cursor-pointer"
                title="Create blank Notion journal page"
              >
                <Plus size={11} strokeWidth={3} />
              </button>
            </div>
            
            <button
              onClick={() => {
                setCurrentTab('home');
                setIsRecordingOverlayActive(false);
              }}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all border-2 ${
                currentTab === 'home' 
                  ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                  : 'text-cozy-text-muted border-transparent hover:bg-cozy-card hover:text-cozy-text-dark'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mic size={16} />
                <span>Daily Reflection</span>
              </div>
              <ChevronRight size={13} className="opacity-60" />
            </button>

            <button
              onClick={() => setCurrentTab('timeline')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all border-2 ${
                currentTab === 'timeline' 
                  ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                  : 'text-cozy-text-muted border-transparent hover:bg-cozy-card hover:text-cozy-text-dark'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar size={16} />
                <span>Diary Timeline</span>
              </div>
              <span className="text-[10px] font-black bg-cozy-yellow text-cozy-text-dark px-2.5 py-0.5 rounded-full border-2 border-cozy-text-dark shadow-sm">
                {entries.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('analytics')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all border-2 ${
                currentTab === 'analytics' 
                  ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                  : 'text-cozy-text-muted border-transparent hover:bg-cozy-card hover:text-cozy-text-dark'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp size={16} />
                <span>Emotional Analytics</span>
              </div>
              <ChevronRight size={13} className="opacity-60" />
            </button>

            <button
              onClick={() => setCurrentTab('coach')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all border-2 ${
                currentTab === 'coach' 
                  ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                  : 'text-cozy-text-muted border-transparent hover:bg-cozy-card hover:text-cozy-text-dark'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Brain size={16} />
                <span>AI Life Coach</span>
              </div>
              <ChevronRight size={13} className="opacity-60" />
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-cozy-text-muted uppercase tracking-wider px-2">Quick Stats</span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-cozy-card p-3.5 rounded-xl border-2 border-cozy-text-dark shadow-sm">
                <p className="text-[9px] text-cozy-text-muted font-bold uppercase tracking-wider">Total Logs</p>
                <p className="text-xl font-black text-cozy-text-dark mt-1">{entries.length}</p>
              </div>
              <div className="bg-cozy-card p-3.5 rounded-xl border-2 border-cozy-text-dark shadow-sm">
                <p className="text-[9px] text-cozy-text-muted font-bold uppercase tracking-wider">Daily Streak</p>
                <p className="text-xl font-black text-cozy-text-dark mt-1">{user?.streak || 0}d 🔥</p>
              </div>
            </div>
          </div>

          {/* Active Premium Member widget */}
          <div className="mt-auto bg-cozy-yellow/30 border-2 border-cozy-text-dark rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-cozy-accent uppercase tracking-wider mb-1">
              <Crown size={12} fill="currentColor" />
              <span>Premium Member</span>
            </div>
            <p className="text-[11px] text-cozy-text-dark font-semibold leading-normal">
              Cloud backups & AI speech synthesizing are active.
            </p>
          </div>

        </aside>

        {/* ACTIVE WORKSPACE AREA */}
        <main className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] max-w-full lg:max-w-[calc(100vw-18rem)] xl:max-w-[calc(100vw-18rem-20rem)] bg-cozy-bg relative overflow-y-auto">
          
          <AnimatePresence mode="wait">
            {isRecordingOverlayActive ? (
              <motion.div
                key="active-recording"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1"
              >
                <RecordingScreen 
                  onSave={handleSaveEntry}
                  onCancel={() => setIsRecordingOverlayActive(false)}
                  isWritingMode={isWritingMode}
                  setIsWritingMode={setIsWritingMode}
                />
              </motion.div>
            ) : (
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex-1"
              >
                {currentTab === 'home' && (
                  <RealTimeDashboard
                    userName={user.name}
                    isWritingMode={isWritingMode}
                    setIsWritingMode={setIsWritingMode}
                    onStartRecording={() => {
                      if (isWritingMode) {
                        handleCreateJournalPage();
                      } else {
                        setIsRecordingOverlayActive(true);
                      }
                    }}
                    entriesCount={entries.length}
                    goalsCount={goals.length}
                    currentGoalTitle={goals[0]?.title || "Active Goal"}
                    currentGoalProgress={goals[0]?.progress || 0}
                    onNavigateTab={(tab) => setCurrentTab(tab)}
                  />
                )}

                {currentTab === 'timeline' && (
                  <JournalTimeline 
                    entries={entries}
                    onDeleteEntry={handleDeleteEntry}
                    onUpdateEntry={handleUpdateEntry}
                    autoSelectEntryId={autoSelectEntryId}
                    onClearAutoSelect={() => setAutoSelectEntryId(null)}
                  />
                )}

                {currentTab === 'analytics' && (
                  <MoodAnalytics 
                    entries={entries}
                  />
                )}

                {currentTab === 'coach' && (
                  <AiCoach 
                    entries={entries}
                  />
                )}

                {currentTab === 'profile' && (
                  <ProfilePage 
                    userName={user.name}
                    userEmail={user.email}
                    isPremium={user.isPremium}
                    onTogglePremium={handleTogglePremium}
                    entries={entries}
                    badges={badges}
                    onLogout={handleLogout}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </main>

        {/* DESKTOP RIGHT-SIDE GLANCE (visible on lg screens) */}
        <aside className="hidden xl:flex w-80 border-l-3 border-cozy-text-dark p-6 flex-col gap-6 bg-cozy-bg shrink-0">
          
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-cozy-text-muted uppercase tracking-widest">Personal Analytics</h3>
            <span className="text-[10px] font-black text-cozy-green bg-emerald-50 px-2 py-0.5 rounded-full border-2 border-cozy-green">
              +4% week
            </span>
          </div>

          <div className="space-y-5">
            {/* Health Mini Bar Chart Card */}
            <div className="bg-cozy-card p-5 rounded-2xl border-2 border-cozy-text-dark shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-[9px] text-cozy-text-muted mb-1 font-black uppercase tracking-wider">Emotional Health</div>
                  <div className="text-2xl font-black text-cozy-text-dark">88%</div>
                </div>
              </div>
              
              {/* Sleek bar-charts mockup */}
              <div className="flex items-end gap-2.5 h-12 pt-1">
                <div className="flex-1 bg-cozy-bg border border-cozy-text-dark h-[40%] rounded-md hover:bg-cozy-orange/20 transition cursor-help" title="Mon: 40%" />
                <div className="flex-1 bg-cozy-bg border border-cozy-text-dark h-[60%] rounded-md hover:bg-cozy-orange/20 transition cursor-help" title="Tue: 60%" />
                <div className="flex-1 bg-cozy-bg border border-cozy-text-dark h-[55%] rounded-md hover:bg-cozy-orange/20 transition cursor-help" title="Wed: 55%" />
                <div className="flex-1 bg-cozy-orange border-2 border-cozy-text-dark h-[85%] rounded-md" title="Thu: 85%" />
                <div className="flex-1 bg-cozy-yellow border-2 border-cozy-text-dark h-[75%] rounded-md" title="Fri: 75%" />
                <div className="flex-1 bg-cozy-orange border-2 border-cozy-text-dark h-[95%] rounded-md animate-pulse" title="Sat: 95% (Peak!)" />
                <div className="flex-1 bg-cozy-orange border-2 border-cozy-text-dark h-[88%] rounded-md" title="Sun: 88%" />
              </div>
            </div>

            {/* Recent Observations */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-cozy-text-muted uppercase tracking-widest px-1">Recent Observations</h4>
              
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-cozy-orange mt-1.5 shrink-0 border border-cozy-text-dark" />
                  <p className="text-xs text-cozy-text-dark leading-relaxed font-semibold">
                    You mention <span className="text-cozy-accent font-black">books</span> and <span className="text-cozy-accent font-black">novels</span> frequently this month.
                  </p>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-cozy-yellow mt-1.5 shrink-0 border border-cozy-text-dark" />
                  <p className="text-xs text-cozy-text-dark leading-relaxed font-semibold">
                    Stress levels peak during <span className="text-cozy-accent font-black">startup reviews</span> or exams.
                  </p>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-cozy-green mt-1.5 shrink-0 border border-cozy-text-dark" />
                  <p className="text-xs text-cozy-text-dark leading-relaxed font-semibold">
                    Happiness correlates with <span className="text-cozy-accent font-black">morning meditation</span> and outdoor gym runs.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-auto">
            <button
              onClick={() => setCurrentTab('analytics')}
              className="w-full py-3.5 bg-cozy-orange hover:bg-cozy-accent text-white rounded-xl font-black text-xs border-2 border-cozy-text-dark shadow-sm uppercase tracking-wider transition"
            >
              View Full Report
            </button>
          </div>

        </aside>

      </div>

      {/* MOBILE / GENERAL FLOATING FOOTER NAVIGATION (Sticky bottom) */}
      <footer className="h-20 bg-cozy-card border-t-3 border-cozy-text-dark px-6 flex items-center justify-around sticky bottom-0 z-40 lg:hidden">
        
        {/* Tab 1: Home */}
        <button
          onClick={() => {
            setCurrentTab('home');
            setIsRecordingOverlayActive(false);
          }}
          className={`flex flex-col items-center gap-1 transition ${
            currentTab === 'home' ? 'text-cozy-orange' : 'text-cozy-text-muted hover:text-cozy-text-dark'
          }`}
        >
          <Mic size={20} className={currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[9px] font-black uppercase tracking-tight">Home</span>
        </button>

        {/* Tab 2: Timeline */}
        <button
          onClick={() => {
            setCurrentTab('timeline');
            setIsRecordingOverlayActive(false);
          }}
          className={`flex flex-col items-center gap-1 transition relative ${
            currentTab === 'timeline' ? 'text-cozy-orange' : 'text-cozy-text-muted hover:text-cozy-text-dark'
          }`}
        >
          <Calendar size={20} className={currentTab === 'timeline' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[9px] font-black uppercase tracking-tight">Journal</span>
          {entries.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-cozy-orange text-[8px] font-black px-1.5 py-0.5 rounded-full text-white border border-cozy-text-dark shadow-sm animate-bounce">
              {entries.length}
            </span>
          )}
        </button>

        {/* Tab 3: Insights */}
        <button
          onClick={() => {
            setCurrentTab('analytics');
            setIsRecordingOverlayActive(false);
          }}
          className={`flex flex-col items-center gap-1 transition ${
            currentTab === 'analytics' ? 'text-cozy-orange' : 'text-cozy-text-muted hover:text-cozy-text-dark'
          }`}
        >
          <TrendingUp size={20} className={currentTab === 'analytics' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[9px] font-black uppercase tracking-tight">Insights</span>
        </button>

        {/* Tab 5: AI Coach */}
        <button
          onClick={() => {
            setCurrentTab('coach');
            setIsRecordingOverlayActive(false);
          }}
          className={`flex flex-col items-center gap-1 transition ${
            currentTab === 'coach' ? 'text-cozy-orange' : 'text-cozy-text-muted hover:text-cozy-text-dark'
          }`}
        >
          <Brain size={20} className={currentTab === 'coach' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[9px] font-black uppercase tracking-tight">Coach</span>
        </button>

        {/* Tab 6: Profile */}
        <button
          onClick={() => {
            setCurrentTab('profile');
            setIsRecordingOverlayActive(false);
          }}
          className={`flex flex-col items-center gap-1 transition ${
            currentTab === 'profile' ? 'text-cozy-orange' : 'text-cozy-text-muted hover:text-cozy-text-dark'
          }`}
        >
          <User size={20} className={currentTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[9px] font-black uppercase tracking-tight">Profile</span>
        </button>

      </footer>

      <Analytics />
    </div>
  );
}

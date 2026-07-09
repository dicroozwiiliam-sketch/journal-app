/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  MessageSquare,
  FileText,
  AlertCircle,
  Target,
  Bell,
  Menu,
  Settings
} from 'lucide-react';

import { SpeedInsights } from '@vercel/speed-insights/react';

import { JournalEntry, Goal, Habit, Badge } from './types';
import Onboarding from './components/Onboarding';
import Auth from './components/Auth';
import RecordingScreen from './components/RecordingScreen';
import JournalTimeline from './components/JournalTimeline';
import MoodAnalytics from './components/MoodAnalytics';
import AiCoach from './components/AiCoach';
import ProfilePage from './components/ProfilePage';
import RealTimeDashboard from './components/RealTimeDashboard';
import JournalToolsPanel from './components/JournalToolsPanel';
import { DopamineNotificationProvider, useDopamine } from './context/DopamineNotificationContext';
import { DopamineToastsStack, DopamineLogPanel } from './components/AddictiveNotificationSystem';

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

function AppContent() {
  const { addNotification, unreadCount, triggerConfetti } = useDopamine();
  const [isDopamineOpen, setIsDopamineOpen] = useState(false);

  // Navigation states
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('voice_journal_onboarded') === 'true';
    } catch (_) {
      return false;
    }
  });
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    streak: number;
    isPremium: boolean;
    subscriptionPlan?: string;
    subscriptionPeriodEnd?: string;
    subscriptionCancelAtPeriodEnd?: number;
    subscriptionTrialEnd?: string;
    avatarEmoji?: string;
    bio?: string;
    avatarBg?: string;
  } | null>(() => {
    try {
      const savedUser = localStorage.getItem('voice_journal_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (_) {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState<'home' | 'timeline' | 'analytics' | 'coach' | 'profile'>('home');
  const [isRecordingOverlayActive, setIsRecordingOverlayActive] = useState(false);
  const [isWritingMode, setIsWritingMode] = useState(false); // voice vs typing toggle
  const [autoSelectEntryId, setAutoSelectEntryId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const timelineControlsRef = useRef<any>(null);
  const setTimelineControls = (val: any) => {
    timelineControlsRef.current = val;
  };
  const [calendarTargetDate, setCalendarTargetDate] = useState<Date | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  const isJournalTab = currentTab === 'timeline';

  useEffect(() => {
    if (currentTab !== 'timeline') {
      setSelectedEntry(null);
      setTimelineControls(null);
    }
  }, [currentTab]);

  useEffect(() => {
    if (currentTab !== 'analytics') {
      setCalendarTargetDate(null);
    }
  }, [currentTab]);

  // Global Escape key listener to dismiss overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRecordingOverlayActive) {
          setIsRecordingOverlayActive(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecordingOverlayActive]);

  // Application Data States
  const [entries, setEntries] = useState<JournalEntry[]>(SEED_ENTRIES);
  const [goals, setGoals] = useState<Goal[]>(SEED_GOALS);
  const [habits, setHabits] = useState<Habit[]>(SEED_HABITS);
  const [badges, setBadges] = useState<Badge[]>(SEED_BADGES);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Sync from Database Helper
  const syncFromDatabase = async () => {
    try {
      const [entriesRes, goalsRes, habitsRes, badgesRes] = await Promise.all([
        fetch("/api/journals"),
        fetch("/api/goals"),
        fetch("/api/habits"),
        fetch("/api/badges")
      ]);

      if (entriesRes.ok) {
        const dbEntries = await entriesRes.json();
        if (dbEntries && dbEntries.length > 0) {
          setEntries(dbEntries);
        }
      }
      if (goalsRes.ok) {
        const dbGoals = await goalsRes.json();
        if (dbGoals && dbGoals.length > 0) {
          setGoals(dbGoals);
        }
      }
      if (habitsRes.ok) {
        const dbHabits = await habitsRes.json();
        if (dbHabits && dbHabits.length > 0) {
          setHabits(dbHabits);
        }
      }
      if (badgesRes.ok) {
        const dbBadges = await badgesRes.json();
        if (dbBadges && dbBadges.length > 0) {
          setBadges(dbBadges);
        }
      }
    } catch (err) {
      console.error("Failed to sync client data structures with secure database:", err);
    }
  };

  // Perform persistent session identification check
  const identifySecureSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            streak: 27,
            isPremium: data.user.subscription_status === "premium",
            subscriptionPlan: data.user.subscription_plan,
            subscriptionPeriodEnd: data.user.subscription_period_end,
            subscriptionCancelAtPeriodEnd: data.user.subscription_cancel_at_period_end,
            subscriptionTrialEnd: data.user.subscription_trial_end,
            avatarEmoji: data.user.avatarEmoji,
            bio: data.user.bio,
            avatarBg: data.user.avatarBg,
          });
          // Proceed to download secure user records
          await syncFromDatabase();
        }
      }
    } catch (err) {
      console.error("Secure session verification failed on boot:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // Run session check on boot
  useEffect(() => {
    identifySecureSession();
  }, []);

  // Handle Stripe callback redirects to refresh and verify subscription state securely from backend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get("stripe_status");
    const portalStatus = params.get("portal_status");
    const mockPlan = params.get("mock_plan") as "monthly" | "yearly" | null;

    if (stripeStatus || portalStatus || mockPlan) {
      const processCallback = async () => {
        // Clear query parameters from address bar to keep it pristine
        const cleanUrl = window.location.pathname + (window.location.hash || "");
        window.history.replaceState({}, document.title, cleanUrl);

        if (mockPlan) {
          try {
            const res = await fetch("/api/stripe/mock-upgrade", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan: mockPlan })
            });
            if (res.ok) {
              addNotification("PREMIUM ACTIVE 👑", `Activated mock ${mockPlan} plan simulation (7-day trial).`, "👑", "levelup", 50);
              triggerConfetti("wild");
            }
          } catch (err) {
            console.error("Mock upgrade callback processing error:", err);
          }
        } else if (stripeStatus === "success") {
          addNotification("PREMIUM NEST UNLOCKED 👑", "Congratulations! All premium backup vaults and AI Coach paths are active.", "👑", "levelup", 50);
          triggerConfetti("wild");
        } else if (stripeStatus === "cancelled") {
          addNotification("Nest Checkout 🛡️", "Stripe checkout session was closed. Your standard free plan is active.", "🌱", "pop", 5);
        } else if (portalStatus === "returned") {
          addNotification("Billing Updated 💳", "Returned securely from Stripe Customer Billing Portal.", "💳", "pop", 10);
        } else if (portalStatus === "returned_mock") {
          addNotification("Mock Billing Portal 💳", "Billing updates processed successfully in mock portal simulation.", "💳", "pop", 10);
        }

        // Refresh user session state directly from backend to sync newly updated values
        await identifySecureSession();
      };

      processCallback();
    }
  }, []);

  // Sync Onboarding to local preference
  useEffect(() => {
    localStorage.setItem('voice_journal_onboarded', String(isOnboarded));
  }, [isOnboarded]);

  // Real-time Badge Synchronization
  useEffect(() => {
    if (!user) return;

    setBadges(prevBadges => {
      let changed = false;
      const updated = prevBadges.map(b => {
        if (b.unlocked) return b;

        let shouldUnlock = false;
        if (b.id === 'badge-1') {
          shouldUnlock = entries.length >= 1;
        } else if (b.id === 'badge-2') {
          shouldUnlock = user.streak >= 7;
        } else if (b.id === 'badge-3') {
          shouldUnlock = goals.some(g => g.progress >= 75);
        } else if (b.id === 'badge-4') {
          const medHabit = habits.find(h => h.name.toLowerCase().includes('meditation') || h.name.toLowerCase().includes('zen'));
          shouldUnlock = medHabit ? medHabit.streak >= 5 : false;
        } else if (b.id === 'badge-5') {
          shouldUnlock = entries.length > 0 || goals.length > 3;
        }

        if (shouldUnlock) {
          changed = true;
          // Sync unlock call to backend server
          fetch("/api/badges/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: b.id })
          }).catch(err => console.error("Badge unlock sync error:", err));

          return {
            ...b,
            unlocked: true,
            unlockedAt: new Date().toISOString().split('T')[0]
          };
        }
        return b;
      });

      return changed ? updated : prevBadges;
    });
  }, [entries.length, goals, habits, user?.streak]);

  // Handle entry creation
  const handleSaveEntry = async (newEntry: JournalEntry) => {
    try {
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry)
      });
      if (res.ok) {
        const savedEntry = await res.json();
        setEntries(prev => [savedEntry, ...prev]);
      } else {
        setEntries(prev => [newEntry, ...prev]);
      }
    } catch (err) {
      console.error("Save entry backend failure. Defaulting to state save:", err);
      setEntries(prev => [newEntry, ...prev]);
    }

    setIsRecordingOverlayActive(false);
    setCurrentTab('timeline'); // route directly to timeline to see the result!
    
    // Increment streak
    if (user) {
      setUser(prev => prev ? { ...prev, streak: prev.streak + 1 } : null);
    }

    addNotification("Mind Refined! 🌅", "Spoke your soul's reflection! Streak incremented, level boosted.", "🎙️", "levelup", 45);
    triggerConfetti("mild");
  };

  // Create a blank Notion-like journal page
  const handleCreateJournalPage = async (customDate?: Date, initialTitle?: string, initialText?: string) => {
    const isActualDate = customDate instanceof Date && !isNaN(customDate.getTime());
    const newId = `entry-${Date.now()}`;
    const entryDate = isActualDate ? customDate.toISOString() : new Date().toISOString();
    const formattedLabel = isActualDate ? customDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    
    const pageTitle = initialTitle || (isActualDate ? `Journal Entry - ${formattedLabel}` : 'My Reflections 🌅');
    const pageContent = initialText || (isActualDate ? `Reflections and daily planning on ${formattedLabel}... ☕` : 'Today was a peaceful day. I want to reflect on...');

    const newPage: JournalEntry = {
      id: newId,
      date: entryDate,
      duration: 0,
      transcript: '',
      summary: pageTitle,
      mood: 'Calm',
      moodEmoji: '😊',
      topics: [],
      tags: ['Reflections'],
      emotions: [],
      takeaways: [],
      ...({
        blocks: [
          { id: 'b-title', type: 'h1', content: pageTitle },
          { id: `b-p-${Date.now()}`, type: 'paragraph', content: pageContent }
        ]
      })
    } as any;

    try {
      const res = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPage)
      });
      if (res.ok) {
        const saved = await res.json();
        setEntries(prev => [saved, ...prev]);
        setAutoSelectEntryId(saved.id);
      } else {
        setEntries(prev => [newPage, ...prev]);
        setAutoSelectEntryId(newId);
      }
    } catch (err) {
      setEntries(prev => [newPage, ...prev]);
      setAutoSelectEntryId(newId);
    }

    setCurrentTab('timeline');
    addNotification("Reflective Quill 🌌", "Blank entry page initialized. Write down your path!", "🖋️", "coin", 15);
  };

  // Profile actions (Handles secure Stripe subscription checkout sessions)
  const handleTogglePremium = async (plan: "monthly" | "yearly" = "monthly") => {
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      if (!res.ok) throw new Error("Stripe checkout creation failed");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Stripe Checkout Redirect Error. Activating local mock mode fallback:", err);
      // Fallback: make a secure mock-upgrade call directly on the server to maintain database synchronization
      try {
        const mockRes = await fetch("/api/stripe/mock-upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan })
        });
        if (mockRes.ok) {
          addNotification("MOCK PREMIUM ACTIVATED 👑", `High-fidelity offline mode activated for ${plan} plan! (7-day trial active)`, "👑", "levelup", 50);
          triggerConfetti("wild");
          await identifySecureSession();
        }
      } catch (mockErr) {
        console.error("Mock upgrade fallback failed:", mockErr);
      }
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Portal session creation failed.");
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Billing Portal launch error:", err);
      addNotification("Billing Management 💳", err.message || "Customer Portal is only available with active Stripe subscriptions.", "💳", "pop", 5);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    setUser(null);
    setIsOnboarded(false);
    localStorage.removeItem('voice_journal_onboarded');
  };

  const handleLogoutAllDevices = async () => {
    try {
      await fetch("/api/auth/logout-all", { method: "POST" });
    } catch (err) {
      console.error("Logout all devices request failed:", err);
    }
    setUser(null);
    setIsOnboarded(false);
    localStorage.removeItem('voice_journal_onboarded');
  };

  // Goals actions
  const handleAddGoal = async (newGoal: Goal) => {
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGoal)
      });
    } catch (err) {
      console.error("Failed to sync new goal with backend:", err);
    }
    setGoals(prev => [newGoal, ...prev]);
    addNotification("Vision Crystalized 🎯", `New Goal set: "${newGoal.title}"! Focus is the precursor to mastery.`, "🏆", "badge", 25);
    triggerConfetti("mild");
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete goal from backend:", err);
    }
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Habits actions
  const handleToggleHabit = async (habitId: string, dateStr: string) => {
    const targetHabit = habits.find(h => h.id === habitId);
    if (targetHabit) {
      const wasChecked = !!targetHabit.history[dateStr];
      if (!wasChecked) {
        addNotification("Habit Smashed! 🔥", `Crushed your session of "${targetHabit.name}"! Keeping the streak alive!`, "⚡", "streak", 20);
        triggerConfetti("mild");
      } else {
        addNotification("Habit Unticked ↩️", `Removed tick for "${targetHabit.name}". You can always tackle it again!`, "↩️", "pop", 0);
      }
    }

    setHabits(prevHabits => {
      const updated = prevHabits.map(h => {
        if (h.id === habitId) {
          const wasChecked = !!h.history[dateStr];
          const newHistory = { ...h.history, [dateStr]: !wasChecked };
          const newStreak = !wasChecked ? h.streak + 1 : Math.max(0, h.streak - 1);
          
          const updatedHabit = {
            ...h,
            streak: newStreak,
            history: newHistory
          };

          // Sync updated habit record to server database
          fetch("/api/habits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedHabit)
          }).catch(err => console.error("Sync habit status failure:", err));

          return updatedHabit;
        }
        return h;
      });
      return updated;
    });
  };

  const handleAddHabit = async (name: string) => {
    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      streak: 0,
      history: {}
    };

    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHabit)
      });
    } catch (err) {
      console.error("Failed to sync added habit:", err);
    }

    setHabits(prev => [...prev, newHabit]);
    addNotification("New Path Set! 🧭", `Cultivating habit: "${name}". Big journeys start with tiny steps.`, "🌱", "pop", 10);
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await fetch(`/api/journals/${entryId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete entry on server:", err);
    }
    setEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const handleUpdateEntry = async (updatedEntry: JournalEntry) => {
    try {
      await fetch(`/api/journals/${updatedEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEntry)
      });
    } catch (err) {
      console.error("Failed to update entry on server:", err);
    }
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

  // If verifying session on startup, display a comforting loading screen
  if (loadingData) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center bg-cozy-bg">
        <Sparkles size={32} className="text-cozy-accent animate-spin mb-3" />
        <p className="text-cozy-text-dark font-black text-sm">Synchronizing your Daynest...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Auth 
        onSuccess={(name, email, role, subscription_status) => {
          setUser({
            id: '',
            name,
            email,
            streak: 27,
            isPremium: subscription_status === 'premium'
          });
          syncFromDatabase();
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
          <div className="w-12 h-12 bg-[#FAF5EC] rounded-2xl flex items-center justify-center border-2 border-cozy-text-dark shadow-sm overflow-hidden p-0.5">
            <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Sunset background glow */}
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="30%">
                  <stop offset="0%" stopColor="#FFF8E0" />
                  <stop offset="45%" stopColor="#FFBA82" />
                  <stop offset="100%" stopColor="#D57E56" />
                </radialGradient>
                
                {/* Realistic gradients for the three cozy birds */}
                <linearGradient id="blueBirdGrad" x1="30%" y1="0%" x2="70%" y2="100%">
                  <stop offset="0%" stopColor="#A8C8E0" />
                  <stop offset="50%" stopColor="#6C96B0" />
                  <stop offset="100%" stopColor="#4F7188" />
                </linearGradient>
                <linearGradient id="greenBirdGrad" x1="30%" y1="0%" x2="70%" y2="100%">
                  <stop offset="0%" stopColor="#C2D2A9" />
                  <stop offset="50%" stopColor="#92A177" />
                  <stop offset="100%" stopColor="#697651" />
                </linearGradient>
                <linearGradient id="coralBirdGrad" x1="30%" y1="0%" x2="70%" y2="100%">
                  <stop offset="0%" stopColor="#FFA680" />
                  <stop offset="50%" stopColor="#D57E56" />
                  <stop offset="100%" stopColor="#A35431" />
                </linearGradient>

                {/* Parchment paper page shading */}
                <linearGradient id="pageLeftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E9E5D9" />
                  <stop offset="75%" stopColor="#FCFAF6" />
                  <stop offset="100%" stopColor="#EDE8DC" />
                </linearGradient>
                <linearGradient id="pageRightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#DDD7C9" />
                  <stop offset="25%" stopColor="#FCFAF6" />
                  <stop offset="100%" stopColor="#F5F1E6" />
                </linearGradient>

                {/* Leaf organic gradient */}
                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B6C99D" />
                  <stop offset="100%" stopColor="#7B8D61" />
                </linearGradient>

                {/* Twig realistic shading */}
                <linearGradient id="twigGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#725B4C" />
                  <stop offset="100%" stopColor="#4F3F35" />
                </linearGradient>
              </defs>

              {/* Warm Radiating Sunset Dome */}
              <circle cx="60" cy="48" r="19" fill="url(#sunGlow)" />
              
              {/* Radiant Sun Rays */}
              <g stroke="#D57E56" strokeWidth="2.2" strokeLinecap="round" opacity="0.95">
                <line x1="60" y1="24" x2="60" y2="17" />
                <line x1="47" y1="28" x2="42" y2="21" />
                <line x1="73" y1="28" x2="78" y2="21" />
                <line x1="37" y1="37" x2="30" y2="33" />
                <line x1="83" y1="37" x2="90" y2="33" />
                <line x1="35" y1="48" x2="27" y2="48" />
                <line x1="85" y1="48" x2="93" y2="48" />
              </g>

              {/* Leafy branch frame wrapping on the left */}
              <path d="M34,76 C27,65 20,51 23,28" stroke="url(#twigGrad)" strokeWidth="2" strokeLinecap="round" fill="none" />
              
              {/* Detailed Leaf 1 */}
              <path d="M23,28 C18,23 19,14 25,14 C28,19 27,25 23,28 Z" fill="url(#leafGrad)" stroke="#4F3F35" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="23.5" y1="24" x2="25.5" y2="18" stroke="#4F3F35" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
              
              {/* Detailed Leaf 2 */}
              <path d="M23,37 C16,33 15,25 21,24 C24,28 25,33 23,37 Z" fill="url(#leafGrad)" stroke="#4F3F35" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="21.5" y1="33" x2="20.5" y2="28" stroke="#4F3F35" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

              {/* Detailed Leaf 3 */}
              <path d="M24,46 C17,42 16,34 22,33 C25,36 26,42 24,46 Z" fill="url(#leafGrad)" stroke="#4F3F35" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="23" y1="42" x2="20.5" y2="37" stroke="#4F3F35" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

              {/* Detailed Leaf 4 */}
              <path d="M26,55 C20,51 19,44 25,42 C28,45 29,51 26,55 Z" fill="url(#leafGrad)" stroke="#4F3F35" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="26.5" y1="51" x2="24.5" y2="46" stroke="#4F3F35" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

              {/* Detailed Leaf 5 */}
              <path d="M29,64 C23,60 22,53 28,51 C31,54 32,60 29,64 Z" fill="url(#leafGrad)" stroke="#4F3F35" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="29" y1="60" x2="27" y2="55" stroke="#4F3F35" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

              {/* Open Book backing with layered page thickness shadow */}
              <path d="M60,49.5 C68.5,43 80.5,43 89.5,45.5 L89.5,74.5 C80.5,72 68.5,73 60,79.5 C51.5,73 39.5,72 30.5,74.5 L30.5,45.5 C39.5,43 51.5,43 60,49.5 Z" fill="#4F3F35" />
              
              {/* Realistic multiple page margins underneath */}
              <path d="M60,51 C68,45 79,45 88,47.5 L88,75.5 C79,73 68,74 60,80 Z" fill="#DDD7C9" opacity="0.5" />
              
              {/* Left Page (shaded creamy white parchment) */}
              <path d="M60,48 C51.5,43.5 40.5,44 32.5,46 L32.5,73 C40.5,71 51.5,71.5 60,77.5 Z" fill="url(#pageLeftGrad)" />
              
              {/* Right Page (shaded creamy white parchment) */}
              <path d="M60,48 C68.5,43.5 79.5,44 87.5,46 L87.5,73 C79.5,71 68.5,71.5 60,77.5 Z" fill="url(#pageRightGrad)" />
              
              {/* Book center spine stitching line */}
              <path d="M60,48 L60,77.5" stroke="#4F3F35" strokeWidth="1.8" />
              
              {/* Gentle placeholder lines on right page representing memory journaling */}
              <line x1="64" y1="54" x2="77" y2="52" stroke="#725B4C" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
              <line x1="64" y1="59" x2="75" y2="57" stroke="#725B4C" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
              <line x1="64" y1="64" x2="73" y2="62" stroke="#725B4C" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />

              {/* Golden Tail Ribbon / Bookmark Hanging Down */}
              <path d="M71,74 C71,83 67,88 67,91 C71,91 74,86 74,74 Z" fill="#D57E56" stroke="#4F3F35" strokeWidth="1.8" strokeLinejoin="round" />

              {/* Nesting Birds sitting coziy inside */}
              {/* Left Blue Bird */}
              <g id="blue-bird">
                {/* Hair Crests */}
                <path d="M31,59 C29,56 31,54 33,54 C33,56 32,58 31,59 Z" fill="#6C96B0" stroke="#4F3F35" strokeWidth="1.2" />
                <path d="M34,58 C33,55 35,53 37,53 C37,55 35,57 34,58 Z" fill="#6C96B0" stroke="#4F3F35" strokeWidth="1.2" />
                {/* Main Body */}
                <path d="M28,73 C27,62 36,54 44,61 C47,64 45,73 40,75 C34,77 29,77 28,73 Z" fill="url(#blueBirdGrad)" stroke="#4F3F35" strokeWidth="1.8" strokeLinejoin="round" />
                {/* Wing feather detail */}
                <path d="M29,71 C30,66 35,63 38,67 C36,70 32,73 29,71 Z" fill="#4E7088" stroke="#4F3F35" strokeWidth="1.2" opacity="0.8" />
                {/* Rosy Cheek */}
                <circle cx="32" cy="65" r="2" fill="#E05B3A" opacity="0.25" />
                {/* Sparkle Eye with white highlight */}
                <circle cx="35" cy="62.5" r="1.6" fill="#4F3F35" />
                <circle cx="34.6" cy="62" r="0.6" fill="#FFFFFF" />
                {/* Golden Beak */}
                <polygon points="41.5,63.5 46.5,65 41.5,67" fill="#EAA74B" stroke="#4F3F35" strokeWidth="1.2" strokeLinejoin="round" />
              </g>

              {/* Middle Olive/Sage Bird */}
              <g id="green-bird">
                {/* Hair Crest */}
                <path d="M48,62 C47,59 49,57 51,57 C51,59 49,61 48,62 Z" fill="#92A177" stroke="#4F3F35" strokeWidth="1.2" />
                {/* Body */}
                <path d="M44,77 C42,67 51,61 58,66 C60,69 58,77 53,79 C48,81 45,80 44,77 Z" fill="url(#greenBirdGrad)" stroke="#4F3F35" strokeWidth="1.8" strokeLinejoin="round" />
                {/* Wing */}
                <path d="M45,74 C47,70 51,68 53,71 C51,74 48,76 45,74 Z" fill="#64744C" stroke="#4F3F35" strokeWidth="1.2" opacity="0.8" />
                {/* Rosy Cheek */}
                <circle cx="47" cy="70" r="2" fill="#E05B3A" opacity="0.25" />
                {/* Eye */}
                <circle cx="50" cy="67.5" r="1.6" fill="#4F3F35" />
                <circle cx="49.6" cy="67" r="0.6" fill="#FFFFFF" />
                {/* Beak */}
                <polygon points="55.5,68.5 60.5,70 55.5,72" fill="#EAA74B" stroke="#4F3F35" strokeWidth="1.2" strokeLinejoin="round" />
              </g>

              {/* Right Coral Bird */}
              <g id="coral-bird">
                {/* Hair Crest */}
                <path d="M68,60 C69,57 67,55 65,55 C65,57 67,59 68,60 Z" fill="#D57E56" stroke="#4F3F35" strokeWidth="1.2" />
                <path d="M65,61 C64,58 62,56 60,56 C60,58 62,60 65,61 Z" fill="#D57E56" stroke="#4F3F35" strokeWidth="1.2" />
                {/* Body */}
                <path d="M74,75 C76,65 67,59 60,65 C58,68 59,76 64,78 C68,80 72,79 74,75 Z" fill="url(#coralBirdGrad)" stroke="#4F3F35" strokeWidth="1.8" strokeLinejoin="round" />
                {/* Wing */}
                <path d="M71,72 C71,67 67,65 65,68 C66,71 69,73 71,72 Z" fill="#A35431" stroke="#4F3F35" strokeWidth="1.2" opacity="0.8" />
                {/* Rosy Cheek */}
                <circle cx="68.5" cy="67.5" r="2" fill="#E05B3A" opacity="0.25" />
                {/* Eye */}
                <circle cx="66.5" cy="65.5" r="1.6" fill="#4F3F35" />
                <circle cx="66.1" cy="65" r="0.6" fill="#FFFFFF" />
                {/* Beak */}
                <polygon points="61,64.5 56,66 61,67.5" fill="#EAA74B" stroke="#4F3F35" strokeWidth="1.2" strokeLinejoin="round" />
              </g>

              {/* Nest Twigs with rich overlapping weave pattern */}
              <path d="M18,62 C23,71 31,77 40,79" stroke="url(#twigGrad)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M102,62 C97,71 89,77 80,79" stroke="url(#twigGrad)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M21,68 C35,95 85,95 99,68" stroke="url(#twigGrad)" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <path d="M25,74 C38,92 82,92 95,74" stroke="url(#twigGrad)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M31,80 C40,97 80,97 89,80" stroke="url(#twigGrad)" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Extra twig details for depth */}
              <path d="M20,68 C24,75 32,80 38,81" stroke="url(#twigGrad)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M100,69 C96,75 88,80 82,81" stroke="url(#twigGrad)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M38,89 Q60,97 82,89" stroke="url(#twigGrad)" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Warm cozy golden sparkle stars */}
              <g fill="#F5D17E" stroke="#4F3F35" strokeWidth="1">
                {/* Sparkle 1 */}
                <path d="M85,25 L86.5,28 L89.5,28.5 L87,30.5 L88,33.5 L85,32 L82,33.5 L83,30.5 L80.5,28.5 L83.5,28 Z" transform="scale(0.6) translate(60, 10)" />
                {/* Sparkle 2 */}
                <path d="M85,25 L86.5,28 L89.5,28.5 L87,30.5 L88,33.5 L85,32 L82,33.5 L83,30.5 L80.5,28.5 L83.5,28 Z" transform="scale(0.45) translate(40, 52)" />
              </g>
            </svg>
          </div>
          <div className="flex flex-col justify-center select-none" id="daynest-logo-text">
            <span className="text-xl md:text-[22px] font-bold tracking-tight text-[#4F3F35] font-serif leading-tight">
              DayNest
            </span>
            <span className="text-[9px] md:text-[10px] font-bold tracking-[0.25em] text-[#D77D59] uppercase flex items-center gap-1 leading-none mt-0.5">
              <span className="text-[#92A177] font-sans">—</span>Journal<span className="text-[#92A177] font-sans">—</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Dopamine Ringing Bell */}
          <button 
            onClick={() => setIsDopamineOpen(true)}
            className="w-10 h-10 bg-white hover:bg-[#FAF6EB] rounded-xl border-2 border-cozy-text-dark cursor-pointer flex items-center justify-center relative shadow-sm hover:scale-105 active:scale-95 transition"
            title="Dopamine Hub"
          >
            <Bell size={18} strokeWidth={3} className={`text-cozy-text-dark ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-cozy-orange text-white text-[9px] font-black w-5.5 h-5.5 rounded-full border-2 border-cozy-text-dark flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Three-lined menu button with settings, notifications, and navigation shortcuts */}
          <div className="relative">
            <button 
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className="w-10 h-10 bg-white hover:bg-[#FAF6EB] rounded-xl border-2 border-cozy-text-dark cursor-pointer flex items-center justify-center relative shadow-sm hover:scale-105 active:scale-95 transition"
              title="Menu & Settings"
            >
              <Menu size={18} strokeWidth={3} className="text-cozy-text-dark" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-cozy-orange text-white text-[9px] font-black w-5.5 h-5.5 rounded-full border-2 border-cozy-text-dark flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Floating Dropdown Menu */}
            <AnimatePresence>
              {isHeaderMenuOpen && (
                <>
                  {/* Backdrop to close dropdown when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsHeaderMenuOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-60 bg-white border-2 border-cozy-text-dark rounded-2xl shadow-lg z-50 p-3 flex flex-col gap-1.5"
                  >
                    <div className="px-2.5 py-1.5 border-b border-cozy-text-dark/10 flex items-center gap-2.5 mb-1">
                      <div className={`w-8 h-8 rounded-lg ${user.avatarBg || "bg-cozy-orange"} border-2 border-cozy-text-dark flex items-center justify-center text-xs font-black text-white`}>
                        {user.avatarEmoji || user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-cozy-text-dark truncate leading-tight">{user.name}</span>
                        <span className="text-[9px] text-cozy-text-muted font-bold truncate leading-tight">Cozy Companion</span>
                      </div>
                    </div>

                    {/* Settings Page Button */}
                    <button
                      onClick={() => {
                        setCurrentTab('profile');
                        setIsHeaderMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-2.5 py-2 hover:bg-[#FFFCEB] rounded-xl text-left cursor-pointer transition text-xs font-black text-cozy-text-dark"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cozy-yellow/20 border border-cozy-text-dark/10 flex items-center justify-center text-cozy-accent">
                        <Settings size={14} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <p className="leading-tight">Settings Page</p>
                        <p className="text-[8px] text-cozy-text-muted font-bold leading-none mt-0.5">Customize profile & billing</p>
                      </div>
                    </button>

                    {/* Notifications Button */}
                    <button
                      onClick={() => {
                        setIsDopamineOpen(true);
                        setIsHeaderMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-2.5 py-2 hover:bg-[#FFFCEB] rounded-xl text-left cursor-pointer transition text-xs font-black text-cozy-text-dark"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cozy-orange/20 border border-cozy-text-dark/10 flex items-center justify-center text-cozy-orange">
                        <Bell size={14} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-1">
                        <div>
                          <p className="leading-tight">Notifications</p>
                          <p className="text-[8px] text-cozy-text-muted font-bold leading-none mt-0.5">Dopamine Hub & Alerts</p>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-cozy-orange text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-cozy-text-dark shadow-sm shrink-0">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="h-[1px] bg-cozy-text-dark/10 my-1" />

                    {/* Quick Shortcuts Grid */}
                    <div className="grid grid-cols-2 gap-1 px-1">
                      <button
                        onClick={() => {
                          setCurrentTab('home');
                          setIsHeaderMenuOpen(false);
                        }}
                        className={`py-1.5 rounded-lg border text-[10px] font-black text-center cursor-pointer transition ${
                          currentTab === 'home'
                            ? 'bg-cozy-orange text-white border-cozy-text-dark'
                            : 'bg-[#FAF6EB]/40 border-cozy-text-dark/10 text-cozy-text-dark hover:bg-[#FAF6EB]'
                        }`}
                      >
                        Reflection
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('timeline');
                          setIsHeaderMenuOpen(false);
                        }}
                        className={`py-1.5 rounded-lg border text-[10px] font-black text-center cursor-pointer transition ${
                          currentTab === 'timeline'
                            ? 'bg-cozy-orange text-white border-cozy-text-dark'
                            : 'bg-[#FAF6EB]/40 border-cozy-text-dark/10 text-cozy-text-dark hover:bg-[#FAF6EB]'
                        }`}
                      >
                        Timeline
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('analytics');
                          setIsHeaderMenuOpen(false);
                        }}
                        className={`py-1.5 rounded-lg border text-[10px] font-black text-center cursor-pointer transition ${
                          currentTab === 'analytics'
                            ? 'bg-cozy-orange text-white border-cozy-text-dark'
                            : 'bg-[#FAF6EB]/40 border-cozy-text-dark/10 text-cozy-text-dark hover:bg-[#FAF6EB]'
                        }`}
                      >
                        Calendar
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('coach');
                          setIsHeaderMenuOpen(false);
                        }}
                        className={`py-1.5 rounded-lg border text-[10px] font-black text-center cursor-pointer transition ${
                          currentTab === 'coach'
                            ? 'bg-cozy-orange text-white border-cozy-text-dark'
                            : 'bg-[#FAF6EB]/40 border-cozy-text-dark/10 text-cozy-text-dark hover:bg-[#FAF6EB]'
                        }`}
                      >
                        Goals
                      </button>
                    </div>

                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Floating Addictive Toast Stack */}
      <DopamineToastsStack />

      {/* Slide-out Dopamine Log Panel */}
      <DopamineLogPanel 
        isOpen={isDopamineOpen} 
        onClose={() => setIsDopamineOpen(false)} 
      />

      {/* Main Content Layout Container */}
      <div className="flex-1 flex w-full relative">
        
        {/* DESKTOP SIDEBAR (visible on large screen) */}
        <aside 
          className={`hidden lg:flex border-r-3 border-cozy-text-dark flex-col shrink-0 bg-cozy-bg transition-all duration-300 relative ${
            isSidebarCollapsed ? 'w-20 p-4 gap-4' : 'w-72 p-6 gap-6'
          }`}
        >
            
            {/* Collapse/Expand Toggle Row */}
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} w-full border-b border-cozy-text-dark/10 pb-3`}>
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-black text-cozy-text-dark uppercase tracking-widest">
                  Menu Navigation
                </span>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 hover:bg-cozy-card text-cozy-text-dark border-2 border-cozy-text-dark rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center bg-white"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <ChevronRight size={13} strokeWidth={3} /> : <ChevronLeft size={13} strokeWidth={3} />}
              </button>
            </div>

            {/* Greeting Box */}
            {!isSidebarCollapsed && (
              <div className="bg-cozy-card rounded-2xl p-5 border-2 border-cozy-text-dark shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cozy-yellow/10 rounded-full blur-xl" />
                <h3 className="text-cozy-text-muted text-[10px] font-black uppercase tracking-wider mb-2">
                  Good Day, {user.name.split(' ')[0]} 👋
                </h3>
                <p className="text-xs text-cozy-text-dark italic leading-relaxed font-semibold">
                  "Every thought you speak is an elegant piece of your personal growth story."
                </p>
              </div>
            )}

            {/* Quick Tab Menu Options */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-2 mb-1">
                {!isSidebarCollapsed ? (
                  <span className="text-[10px] font-black text-cozy-text-muted uppercase tracking-wider">Workspace</span>
                ) : (
                  <div className="h-[1px] bg-cozy-text-dark/10 w-full my-1" />
                )}
                {!isSidebarCollapsed && (
                  <button
                    onClick={handleCreateJournalPage}
                    className="p-1 hover:bg-cozy-card rounded border border-transparent hover:border-cozy-text-dark text-cozy-text-muted hover:text-cozy-text-dark transition flex items-center justify-center cursor-pointer"
                    title="Create blank Notion journal page"
                  >
                    <Plus size={11} strokeWidth={3} />
                  </button>
                )}
              </div>
              
              <button
                onClick={() => {
                  setCurrentTab('home');
                  setIsRecordingOverlayActive(false);
                }}
                title="Daily Reflection"
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold tracking-wide transition-all border-2 ${
                  currentTab === 'home' 
                    ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                    : 'text-cozy-text-muted border-transparent hover:bg-cozy-card hover:text-cozy-text-dark'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mic size={16} />
                  {!isSidebarCollapsed && <span>Daily Reflection</span>}
                </div>
                {!isSidebarCollapsed && <ChevronRight size={13} className="opacity-60" />}
              </button>

              <button
                onClick={() => setCurrentTab('timeline')}
                title="Diary Timeline"
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold tracking-wide transition-all border-2 ${
                  currentTab === 'timeline' 
                    ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                    : 'text-cozy-text-muted border-transparent hover:bg-cozy-card hover:text-cozy-text-dark'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={16} />
                  {!isSidebarCollapsed && <span>Diary Timeline</span>}
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-[10px] font-black bg-cozy-yellow text-cozy-text-dark px-2.5 py-0.5 rounded-full border-2 border-cozy-text-dark shadow-sm">
                    {entries.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('analytics')}
                title="Calendar"
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold tracking-wide transition-all border-2 ${
                  currentTab === 'analytics' 
                    ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                    : 'text-cozy-text-muted border-transparent hover:bg-cozy-card hover:text-cozy-text-dark'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} />
                  {!isSidebarCollapsed && <span>Calendar</span>}
                </div>
                {!isSidebarCollapsed && <ChevronRight size={13} className="opacity-60" />}
              </button>

              <button
                onClick={() => setCurrentTab('coach')}
                title="Goals & Habits"
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'} rounded-xl text-xs font-bold tracking-wide transition-all border-2 ${
                  currentTab === 'coach' 
                    ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                    : 'text-cozy-text-muted border-transparent hover:bg-cozy-card hover:text-cozy-text-dark'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Target size={16} />
                  {!isSidebarCollapsed && <span>Goals & Habits</span>}
                </div>
                {!isSidebarCollapsed && <ChevronRight size={13} className="opacity-60" />}
              </button>
            </div>

            {/* Quick Stats Grid */}
            {!isSidebarCollapsed ? (
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
            ) : (
              <div className="flex flex-col items-center gap-2 bg-cozy-card border-2 border-cozy-text-dark rounded-xl p-2 shadow-sm" title="Quick Stats">
                <span className="text-xs">🔥</span>
                <span className="text-[10px] font-black">{user?.streak || 0}d</span>
              </div>
            )}

            {/* Active Premium Member widget */}
            {!isSidebarCollapsed ? (
              <div className="mt-auto bg-cozy-yellow/30 border-2 border-cozy-text-dark rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-cozy-accent uppercase tracking-wider mb-1">
                  <Crown size={12} fill="currentColor" />
                  <span>Premium Member</span>
                </div>
                <p className="text-[11px] text-cozy-text-dark font-semibold leading-normal">
                  Cloud backups & AI speech synthesizing are active.
                </p>
              </div>
            ) : (
              <div className="mt-auto bg-cozy-yellow/30 border-2 border-cozy-text-dark rounded-xl p-2.5 flex items-center justify-center cursor-help" title="Premium Member Active">
                <Crown size={14} fill="currentColor" className="text-cozy-accent animate-pulse" />
              </div>
            )}

          </aside>

        {/* ACTIVE WORKSPACE AREA */}
        <main className={`flex-1 flex flex-col min-h-[calc(100vh-4rem)] max-w-full transition-all duration-300 ${
          isSidebarCollapsed 
            ? 'lg:max-w-[calc(100vw-5rem)]' 
            : 'lg:max-w-[calc(100vw-18rem)]'
        } bg-cozy-bg relative overflow-y-auto`}>
          
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
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
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
                    onCreateEntry={handleCreateJournalPage}
                    selectedEntry={selectedEntry}
                    onSelectEntry={setSelectedEntry}
                    onUpdateControls={setTimelineControls}
                    onViewOnCalendar={(date) => {
                      setCalendarTargetDate(date);
                      setCurrentTab('analytics');
                    }}
                  />
                )}

                {currentTab === 'analytics' && (
                  <MoodAnalytics 
                    entries={entries}
                    habits={habits}
                    goals={goals}
                    setGoals={setGoals}
                    setEntries={setEntries}
                    initialSelectedDate={calendarTargetDate}
                    onNavigateToEntry={(id) => {
                      const matched = entries.find(e => e.id === id);
                      if (matched) {
                        setSelectedEntry(matched);
                        setAutoSelectEntryId(id);
                        setCurrentTab('timeline');
                      }
                    }}
                    onCreatePageForDate={(date) => {
                      handleCreateJournalPage(date);
                    }}
                    onSaveConvertedEntry={(newPage) => {
                      setEntries(prev => [newPage, ...prev]);
                      setSelectedEntry(newPage);
                      setAutoSelectEntryId(newPage.id);
                      setCurrentTab('timeline');
                    }}
                  />
                )}

                {currentTab === 'coach' && (
                  <AiCoach 
                    entries={entries}
                    goals={goals}
                    setGoals={setGoals}
                    habits={habits}
                    setHabits={setHabits}
                    onNavigateToEntry={(id) => {
                      const matched = entries.find(e => e.id === id);
                      if (matched) {
                        setSelectedEntry(matched);
                        setAutoSelectEntryId(id);
                        setCurrentTab('timeline');
                      }
                    }}
                    onCreatePageForDate={(date) => {
                      handleCreateJournalPage(date);
                    }}
                  />
                )}

                 {currentTab === 'profile' && (
                  <ProfilePage 
                    userName={user.name}
                    userEmail={user.email}
                    userAvatar={user.avatarEmoji}
                    userBio={user.bio}
                    userAvatarBg={user.avatarBg}
                    isPremium={user.isPremium}
                    subscriptionPlan={user.subscriptionPlan}
                    subscriptionPeriodEnd={user.subscriptionPeriodEnd}
                    subscriptionCancelAtPeriodEnd={user.subscriptionCancelAtPeriodEnd}
                    subscriptionTrialEnd={user.subscriptionTrialEnd}
                    onTogglePremium={handleTogglePremium}
                    onManageBilling={handleManageBilling}
                    onUpdateProfile={(updates) => {
                      setUser(prev => prev ? { ...prev, ...updates } : null);
                    }}
                    entries={entries}
                    badges={badges}
                    goals={goals}
                    habits={habits}
                    onLogout={handleLogout}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </main>



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
          <FileText size={20} className={currentTab === 'timeline' ? 'stroke-[2.5]' : 'stroke-2'} />
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
          <Calendar size={20} className={currentTab === 'analytics' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[9px] font-black uppercase tracking-tight">Calendar</span>
        </button>

        {/* Tab 5: Goals & Habits */}
        <button
          onClick={() => {
            setCurrentTab('coach');
            setIsRecordingOverlayActive(false);
          }}
          className={`flex flex-col items-center gap-1 transition ${
            currentTab === 'coach' ? 'text-cozy-orange' : 'text-cozy-text-muted hover:text-cozy-text-dark'
          }`}
        >
          <Target size={20} className={currentTab === 'coach' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[9px] font-black uppercase tracking-tight">Goals</span>
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

      <SpeedInsights />
    </div>
  );
}

export default function App() {
  return (
    <DopamineNotificationProvider>
      <AppContent />
    </DopamineNotificationProvider>
  );
}

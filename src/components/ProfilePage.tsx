/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Shield, Key, Download, Trash2, Heart, Award, Sparkles, 
  Moon, Bell, CheckCircle2, Crown, Globe, Edit2, Check, X, Camera, 
  ChevronDown, Flame, BookOpen, AlertTriangle, HelpCircle, Lock, Info,
  Share2, Save, Leaf
} from 'lucide-react';
import { Badge, JournalEntry, Goal } from '../types';
import confetti from 'canvas-confetti';

interface ProfilePageProps {
  userName: string;
  userEmail: string;
  userAvatar?: string;
  userBio?: string;
  userAvatarBg?: string;
  isPremium: boolean;
  subscriptionPlan?: string;
  subscriptionPeriodEnd?: string;
  subscriptionCancelAtPeriodEnd?: number;
  subscriptionTrialEnd?: string;
  onTogglePremium: (plan: "monthly" | "yearly") => void;
  onManageBilling?: () => void;
  onUpdateProfile?: (updates: { name?: string; email?: string; avatarEmoji?: string; bio?: string; avatarBg?: string }) => void;
  entries: JournalEntry[];
  badges: Badge[];
  goals?: Goal[];
  habits?: any[];
  onLogout: () => void;
}

const AVATAR_EMOJIS = ["🐦", "🦉", "🐥", "🐧", "🦅", "🦆", "🦢", "🦜", "🦚", "🦩", "🐣", "🌸", "🌱", "🍂", "🐝"];

const AVATAR_BGS = [
  { value: 'bg-cozy-orange', label: 'Terracotta' },
  { value: 'bg-cozy-accent', label: 'Sunset' },
  { value: 'bg-cozy-green', label: 'Sage' },
  { value: 'bg-cozy-yellow', label: 'Honey' },
  { value: 'bg-[#5C6E58]', label: 'Pine Forest' },
  { value: 'bg-indigo-500', label: 'Twilight' },
  { value: 'bg-amber-700', label: 'Oak' },
];

export default function ProfilePage({
  userName,
  userEmail,
  userAvatar = "🐦",
  userBio = "Feathering my reflective nest, one day at a time.",
  userAvatarBg = "bg-cozy-green",
  isPremium,
  subscriptionPlan = "free",
  subscriptionPeriodEnd,
  subscriptionCancelAtPeriodEnd = 0,
  subscriptionTrialEnd,
  onTogglePremium,
  onManageBilling,
  onUpdateProfile,
  entries,
  badges,
  goals = [],
  habits = [],
  onLogout,
}: ProfilePageProps) {
  // Local States
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userName);
  const [editedEmail, setEditedEmail] = useState(userEmail);
  const [editedBio, setEditedBio] = useState(userBio);
  const [selectedEmoji, setSelectedEmoji] = useState(userAvatar);
  const [selectedBg, setSelectedBg] = useState(userAvatarBg);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('cozy_dark_theme') === 'true';
  });
  const [notifications, setNotifications] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Time Picker for Reminders
  const [reminderTime, setReminderTime] = useState("21:00");
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Security States (PIN code lock)
  const [securityEnabled, setSecurityEnabled] = useState(() => {
    return localStorage.getItem('cozy_pin_enabled') === 'true';
  });
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinStage, setPinStage] = useState<'verify_off' | 'set_step1' | 'set_step2'>('set_step1');
  const [tempPin, setTempPin] = useState("");

  // Language States
  const [selectedLanguage, setSelectedLanguage] = useState("English (IN)");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Toast System
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Synchronize internal states if props change
  useEffect(() => {
    setEditedName(userName);
    setEditedEmail(userEmail);
    setEditedBio(userBio);
    setSelectedEmoji(userAvatar);
    setSelectedBg(userAvatarBg);
  }, [userName, userEmail, userBio, userAvatar, userAvatarBg]);

  // Streak calculations (consecutive writing days)
  const getStreakCount = (): number => {
    if (entries.length === 0) return 0;
    const activeDates = new Set<string>();
    entries.forEach(e => {
      const d = new Date(e.date);
      activeDates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    });
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const getFormattedKey = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    let checkDate = new Date(today);
    // If today hasn't been written yet, verify yesterday
    if (!activeDates.has(getFormattedKey(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (activeDates.has(getFormattedKey(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return currentStreak || (entries.length > 0 ? 1 : 0);
  };

  const currentStreakVal = getStreakCount();

  // Badge Progress Calculation Helpers
  const getBadgeProgress = (badgeId: string): { completed: number; total: number; label: string } => {
    switch (badgeId) {
      case 'badge-1': // First Voice
        return {
          completed: Math.min(entries.length, 1),
          total: 1,
          label: entries.length >= 1 ? "Complete" : "Record 1 journal entry"
        };
      case 'badge-2': // 7-Day Spark
        return {
          completed: Math.min(currentStreakVal, 7),
          total: 7,
          label: `${currentStreakVal}/7 days streak`
        };
      case 'badge-3': // Goal Catalyst
        const maxProgress = goals.length > 0 ? Math.max(...goals.map(g => g.progress)) : 0;
        return {
          completed: Math.min(maxProgress, 75),
          total: 75,
          label: `Max goal progress: ${maxProgress}% / 75%`
        };
      case 'badge-4': // Zen Architect
        const medHabit = habits.find(h => h.name.toLowerCase().includes('meditation') || h.name.toLowerCase().includes('zen'));
        const medStreak = medHabit ? medHabit.streak : 0;
        return {
          completed: Math.min(medStreak, 5),
          total: 5,
          label: `Meditation streak: ${medStreak}/5 days`
        };
      case 'badge-5': // AI Coachee
        const hasCoachMessage = entries.length > 0; // if they have entries analyzed
        return {
          completed: hasCoachMessage ? 1 : 0,
          total: 1,
          label: hasCoachMessage ? "Complete" : "Engage with the AI Coach"
        };
      default:
        return { completed: 0, total: 1, label: "Unknown status" };
    }
  };

  const exportData = (format: 'txt' | 'md' | 'csv') => {
    let fileContent = '';
    let mimeType = 'text/plain';
    let fileExtension = format;

    if (format === 'txt') {
      fileContent = `DAYNEST JOURNAL - COMPLETE SECURE EXPORT
===========================================
User: ${userName} (${userEmail})
Backup Date: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Streak Level: ${currentStreakVal} Days
Total Journal Pages: ${entries.length}

` + entries.map((entry, idx) => `
ENTRY #${entries.length - idx}
Date: ${new Date(entry.date).toLocaleString()}
Mood: ${entry.moodEmoji} ${entry.mood}
-------------------------------------------
Transcript: 
"${entry.transcript || "(No voice transcription)"}"

AI Synthesized Summary:
"${entry.summary || "(No summary generated)"}"

Action Items / Takeaways:
${entry.takeaways.map(t => `- ${t}`).join('\n') || "(No key takeaways)"}
===========================================
`).join('\n');
    } else if (format === 'md') {
      mimeType = 'text/markdown';
      fileContent = `# Daynest Archive Export - ${userName}
Exported securely on ${new Date().toLocaleDateString()}
Total Spoken Reflections: **${entries.length}** | Current Streak: **${currentStreakVal} Days**

${entries.map((entry, idx) => `
## Entry - ${new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- **Mood Rating:** ${entry.moodEmoji} *${entry.mood}*
- **Spoken Recording Length:** ${entry.duration} seconds

### 🎙️ Audio Transcript
> ${entry.transcript || "*No transcript recorded.*"}

### 🧠 Cozy Coach Summary & Insights
${entry.summary || "*No insights generated yet.*"}

### 📋 Suggested Action Items
${entry.takeaways.map(t => `- [ ] ${t}`).join('\n') || "*No items extracted.*"}

---
`).join('\n')}`;
    } else if (format === 'csv') {
      mimeType = 'text/csv';
      const headers = 'ID,Date,DurationSeconds,Mood,MoodEmoji,Transcript,Summary,Takeaways\n';
      const rows = entries.map(entry => {
        const cleanTranscript = (entry.transcript || '').replace(/"/g, '""');
        const cleanSummary = (entry.summary || '').replace(/"/g, '""');
        const cleanTakeaways = (entry.takeaways || []).join(' | ').replace(/"/g, '""');
        return `"${entry.id}","${entry.date}",${entry.duration},"${entry.mood}","${entry.moodEmoji}","${cleanTranscript}","${cleanSummary}","${cleanTakeaways}"`;
      }).join('\n');
      fileContent = headers + rows;
    }

    try {
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daynest_journal_backup_${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast(`Backup successfully saved in ${format.toUpperCase()} format! 💾`, 'success');
    } catch (err) {
      triggerToast('Failed to export data file.', 'error');
    }
  };

  // Profile Save Action
  const handleSaveProfile = () => {
    if (!editedName.trim()) {
      triggerToast("Display name cannot be empty!", "error");
      return;
    }
    onUpdateProfile?.({
      name: editedName.trim(),
      email: editedEmail.trim(),
      bio: editedBio.trim(),
      avatarEmoji: selectedEmoji,
      avatarBg: selectedBg
    });
    setIsEditing(false);
    triggerToast("Your profile updates have been saved! 🌸", "success");
  };

  // Premium Toggle Celebrations
  const handlePremiumAction = (plan: "monthly" | "yearly" = "monthly") => {
    if (!isPremium) {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#E08E6D', '#FFD700', '#F7D6C8', '#4A3D30']
      });
      onTogglePremium(plan);
      triggerToast("Welcome to Daynest Premium! ✨ Cloud Sync & AI coaching activated.", "success");
    } else {
      onTogglePremium(plan);
      triggerToast("Premium subscription cancelled. Returning to Standard Tier.", "info");
    }
  };

  // Time Picker Helper
  const handleSaveReminderTime = (time: string) => {
    setReminderTime(time);
    setShowTimePicker(false);
    triggerToast(`Daily reflection alerts set for ${time}! 🔔`, 'success');
  };

  // Secure PIN Dialog Handlers
  const openPinSetup = () => {
    if (securityEnabled) {
      setPinStage('verify_off');
      setPinInput("");
      setPinError("");
      setShowPinModal(true);
    } else {
      setPinStage('set_step1');
      setPinInput("");
      setPinError("");
      setShowPinModal(true);
    }
  };

  const handlePinNumClick = (num: string) => {
    if (pinInput.length < 4) {
      setPinInput(prev => prev + num);
    }
  };

  const handlePinBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handlePinSubmit = () => {
    if (pinInput.length !== 4) {
      setPinError("Please enter a 4-digit PIN.");
      return;
    }

    if (pinStage === 'verify_off') {
      const savedPin = localStorage.getItem('cozy_security_pin');
      if (pinInput === savedPin) {
        localStorage.removeItem('cozy_security_pin');
        localStorage.setItem('cozy_pin_enabled', 'false');
        setSecurityEnabled(false);
        setShowPinModal(false);
        triggerToast("Passcode security disabled.", "info");
      } else {
        setPinError("Incorrect PIN. Please try again.");
        setPinInput("");
      }
    } else if (pinStage === 'set_step1') {
      setTempPin(pinInput);
      setPinInput("");
      setPinStage('set_step2');
      setPinError("");
    } else if (pinStage === 'set_step2') {
      if (pinInput === tempPin) {
        localStorage.setItem('cozy_security_pin', pinInput);
        localStorage.setItem('cozy_pin_enabled', 'true');
        setSecurityEnabled(true);
        setShowPinModal(false);
        triggerToast("Cozy PIN Lock securely enabled! 🔒", "success");
      } else {
        setPinError("PINs do not match. Start over.");
        setPinInput("");
        setPinStage('set_step1');
      }
    }
  };

  // Bird & Nest Helper functions to determine user species and nest quality
  const getBirdClass = () => {
    if (isPremium) return "Celestial Starling 🌟";
    const count = entries.length;
    if (count < 3) return "Fledgling Sparrow 🐣";
    if (count < 8) return "Singing Bluejay 🐦";
    if (count < 15) return "Cozy Robin 🪶";
    if (count < 30) return "Wise Forest Owl 🦉";
    return "Golden Phoenix 🔥";
  };

  const getNestState = () => {
    const streak = currentStreakVal;
    if (streak <= 2) return "Starting Nest (Twigs & Leaves) 🍂";
    if (streak <= 6) return "Cozy Moss Nest (Soft & Insulated) 🪹";
    if (streak <= 14) return "Safe Feathered Nest (Warm & Protective) 🪺";
    return "Luxurious Sanctuary (Daynest Masterpiece) ✨🪺";
  };

  // Dark Calming Theme Toggle with real persistence
  const handleDarkModeToggle = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem('cozy_dark_theme', String(nextVal));
    
    // Toggle class on document body or let global system know
    if (nextVal) {
      document.documentElement.classList.add('dark');
      triggerToast("Calming Dark Theme activated! 🌙", "success");
    } else {
      document.documentElement.classList.remove('dark');
      triggerToast("Gentle Sunlit Theme activated! ☀️", "success");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-6 md:p-8 pb-24" id="profile_tab">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border-2 border-cozy-text-dark bg-[#FFFDF9] shadow-md flex items-center gap-2 text-xs font-mono font-black uppercase text-cozy-text-dark tracking-wide"
          >
            <span className="text-sm">
              {toast.type === 'success' ? '✨' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Row */}
      <div className="mb-6 flex justify-between items-start">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cozy-orange/10 text-cozy-orange border border-cozy-orange/20">
            <User size={11} strokeWidth={2.5} />
            <span>User Identity</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-cozy-text-dark">Your Profile</h2>
          <p className="text-xs text-cozy-text-muted font-bold">Customize your reflective nest, badges & data backup</p>
        </div>
        
        {/* Simple signout for header safety */}
        <button
          onClick={onLogout}
          className="px-3 py-1.5 bg-[#FCF8F2] text-cozy-text-dark border-2 border-cozy-text-dark rounded-xl text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer shadow-xs tactile-btn-retro"
        >
          Sign Out
        </button>
      </div>

      {/* Profile Bio Card with full Edit support */}
      <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-amber-900 group/card">
        {/* Decorative Nest branches and foliage patterns */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-800/5 to-amber-800/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-24 h-24 bg-gradient-to-tr from-[#94A87C]/10 to-transparent rounded-full blur-lg pointer-events-none" />
        
        {/* Tiny leaves decoration overlay */}
        <div className="absolute top-3 right-4 flex gap-1 text-emerald-800/15 pointer-events-none select-none">
          <Leaf size={14} className="rotate-45" />
          <Leaf size={10} className="-rotate-12" />
        </div>

        {!isEditing ? (
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 md:gap-6 relative z-10">
            {/* Avatar Bubble with Edit Trigger (Selector 1) */}
            <div className="relative group shrink-0 flex flex-col items-center">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-600/25 to-[#8F744B]/20 blur-sm group-hover:blur-md transition-all duration-300 pointer-events-none" />
              <div className={`w-20 h-20 rounded-full ${selectedBg} text-white border-4 border-double border-amber-800/80 bg-[#EAD8C0] flex items-center justify-center text-4xl font-black select-none shadow-md transition-all duration-300 group-hover:scale-105 relative`}>
                <span className="relative z-10 inline-block hover:animate-bounce cursor-help" title="Meet the Nestling!">
                  {selectedEmoji}
                </span>
                <div className="absolute inset-0.5 rounded-full border border-dashed border-[#FAF6EB]/40 pointer-events-none" />
              </div>
              {/* Twig Nest Platform perched under the avatar */}
              <div className="absolute -bottom-2.5 z-20 text-xl pointer-events-none select-none drop-shadow-sm filter transition-transform duration-300 group-hover:translate-y-0.5" title="Cozy Nest Bowl">
                🪹
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="absolute bottom-2 -right-1 bg-white p-1.5 rounded-xl text-cozy-text-dark shadow-sm border-2 border-cozy-text-dark hover:scale-110 transition cursor-pointer z-30"
                title="Edit Avatar & Bio"
              >
                <Edit2 size={10} strokeWidth={3} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                <h3 className="text-base font-black text-cozy-text-dark">{userName}</h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  {isPremium ? (
                    <span className="inline-flex items-center gap-1 text-[8px] font-black text-amber-950 bg-[#FCF9EC] border-2 border-amber-800/30 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                      <Crown size={9} fill="currentColor" className="text-amber-600" />
                      <span>Celestial Starling</span>
                    </span>
                  ) : (
                    <span className="inline-block text-[8px] font-black text-cozy-text-muted bg-[#FAF6EB] border border-cozy-text-dark/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Free Flight Standard
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-black text-emerald-900 bg-[#E2ECE0] border-2 border-[#5C6E58]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    🍃 {currentStreakVal} Day Nest Warmth
                  </span>
                </div>
              </div>

              {/* Bird Species & Nest State Badges */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-950 bg-amber-50 border border-amber-800/20 px-2 py-1 rounded-lg shadow-3xs" title="Determined by total journal entries">
                  🐤 Bird Class: <strong className="text-[#8F5B34]">{getBirdClass()}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-950 bg-emerald-50/50 border border-emerald-800/15 px-2 py-1 rounded-lg shadow-3xs" title="Determined by day streak status">
                  🪺 Nest Build: <strong className="text-emerald-800">{getNestState()}</strong>
                </span>
              </div>
              
              <p className="text-[10.5px] font-semibold text-[#7A6956] italic leading-relaxed max-w-lg mt-1">
                "{editedBio}"
              </p>
              
              <p className="text-[10px] text-cozy-text-muted font-bold font-mono">{userEmail}</p>

              {/* Real Metrics Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 pt-2 text-[10px] text-cozy-text-muted font-bold border-t border-dashed border-[#4A3D30]/10">
                <div className="flex items-center gap-1">
                  <span className="text-sm">📖</span>
                  <span><strong className="text-cozy-text-dark text-xs">{entries.length}</strong> Spoken Twigs (logs)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm">🏆</span>
                  <span><strong className="text-cozy-text-dark text-xs">{badges.filter(b => b.unlocked).length}</strong> / {badges.length} Shiny Pebbles (badges)</span>
                </div>
              </div>
            </div>

            {/* Visual Nest & Bird Perch Mini-Widget */}
            <div className="hidden md:flex flex-col items-center justify-center bg-[#FCFAF5] border-2 border-dashed border-[#8F744B]/20 rounded-2xl p-3.5 text-center shrink-0 w-32 relative overflow-hidden group/nest select-none shadow-3xs hover:border-[#8F744B]/40 transition-all duration-300">
              <div className="absolute top-0 right-0 w-12 h-12 bg-[#94A87C]/5 rounded-full blur-lg pointer-events-none" />
              <span className="text-xs font-black uppercase text-[#8F744B] tracking-wider text-[8px] font-mono mb-1">Nest Warmth</span>
              <div className="text-2xl mb-1 select-none">
                {currentStreakVal > 6 ? "🪺" : "🪹"}
              </div>
              <div className="text-xs font-bold text-cozy-text-dark flex items-center gap-0.5 font-mono mb-1">
                🔥 {currentStreakVal * 10 + 10}%
              </div>
              <div className="w-full bg-[#EAD8C0]/30 h-1.5 rounded-full overflow-hidden border border-[#4A3D30]/10">
                <div 
                  className="bg-cozy-orange h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(((currentStreakVal * 10 + 10) / 100) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[7px] font-mono font-black uppercase text-cozy-text-muted mt-1 tracking-tight">
                {currentStreakVal > 14 ? "Cosy Hollow!" : "Keep Spoken Twigs!"}
              </span>
            </div>

            {/* Edit Profile button */}
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 text-cozy-text-muted hover:text-cozy-orange hover:scale-105 transition hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase cursor-pointer"
            >
              <Edit2 size={11} strokeWidth={2.5} />
              <span>Mend Nest</span>
            </button>
          </div>
        ) : (
          /* Profile Edit Fields Inside the Card */
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#4A3D30]/10">
              <span className="text-xs font-black uppercase font-mono text-[#7A6956] tracking-wider">Customize Your Profile Nest</span>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-1 text-cozy-text-muted hover:text-rose-600 transition"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Avatar Customization */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-3.5 bg-white/50 rounded-2xl border-2 border-dashed border-[#4A3D30]/15 text-center">
                <div className={`w-18 h-18 rounded-full ${selectedBg} text-white border-4 border-double border-amber-800 bg-[#EAD8C0] flex items-center justify-center text-3.5xl font-black mb-3 shadow-xs animate-bounce relative`} style={{ animationDuration: '4s' }}>
                  <span className="relative z-10">{selectedEmoji}</span>
                  <div className="absolute -inset-0.5 rounded-full border border-dashed border-[#FAF6EB]/40 pointer-events-none" />
                  <span className="absolute -bottom-2 text-md z-20 pointer-events-none select-none">🪹</span>
                </div>
                <span className="text-[9px] font-bold text-cozy-text-muted uppercase tracking-wider mb-2">Pick an Icon & Backing</span>
                
                {/* Horizontal Emoji Selection list */}
                <div className="flex gap-1 overflow-x-auto w-full max-w-[200px] pb-1.5 scrollbar-thin scrollbar-thumb-amber-800/10 justify-start sm:justify-center">
                  {AVATAR_EMOJIS.map(em => (
                    <button
                      key={em}
                      onClick={() => setSelectedEmoji(em)}
                      className={`text-lg p-1 hover:scale-115 active:scale-95 transition cursor-pointer shrink-0 rounded-md ${selectedEmoji === em ? 'bg-[#FFFDF9] ring-2 ring-cozy-orange/40 scale-110' : ''}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                {/* Background color chips */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-1.5">
                  {AVATAR_BGS.map(bg => (
                    <button
                      key={bg.value}
                      onClick={() => setSelectedBg(bg.value)}
                      className={`w-4 h-4 rounded-full border border-cozy-text-dark/40 cursor-pointer transition ${bg.value} ${selectedBg === bg.value ? 'ring-2 ring-cozy-orange scale-115' : 'hover:scale-105'}`}
                      title={bg.label}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column: Name & Bio inputs */}
              <div className="md:col-span-8 space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#7A6956] font-mono block mb-1">Your Name</label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value.slice(0, 24))}
                      placeholder="Enter display name"
                      className="w-full px-3 py-1.5 text-xs font-bold text-cozy-text-dark bg-white border-2 border-cozy-text-dark rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cozy-orange/20"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#7A6956] font-mono block mb-1">Bio / Daily Intention</label>
                    <textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value.slice(0, 90))}
                      placeholder="What is your mindful goal?"
                      rows={2}
                      className="w-full px-3 py-1.5 text-[11px] font-semibold text-cozy-text-dark bg-white border-2 border-cozy-text-dark rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cozy-orange/20 resize-none leading-relaxed"
                    />
                    <div className="text-right text-[8px] font-mono text-cozy-text-muted mt-0.5">
                      {editedBio.length}/90 characters
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider bg-white text-cozy-text-dark border-2 border-cozy-text-dark rounded-xl cursor-pointer tactile-btn-retro"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider bg-[#94A87C] text-white border-2 border-cozy-text-dark rounded-xl flex items-center gap-1 cursor-pointer shadow-xs tactile-btn-retro"
                  >
                    <Save size={10} strokeWidth={2.5} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Subscription Card */}
      <div className="border-3 border-cozy-text-dark rounded-3xl mb-5 shadow-sm overflow-hidden relative">
        <div className={`p-5 transition-all ${isPremium ? 'bg-gradient-to-b from-[#FCF9EC] to-[#FDFBF2] text-amber-950' : 'bg-cozy-card text-cozy-text-dark'}`}>
          <div className="flex justify-between items-start mb-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-cozy-orange uppercase tracking-widest font-mono">
              <Crown size={15} fill="currentColor" className={isPremium ? 'text-amber-600' : 'text-cozy-orange'} />
              <span>Premium Nest Membership</span>
            </div>
            {isPremium ? (
              <span className="text-[10px] font-black text-amber-800 font-mono uppercase bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-900/10">
                Active {subscriptionPlan === "yearly" ? "Annual" : "Monthly"}
              </span>
            ) : (
              <span className="text-[10px] font-black text-cozy-orange font-mono uppercase bg-amber-50 px-2 py-0.5 rounded-md border border-cozy-orange/20">
                7-Day Free Trial Included
              </span>
            )}
          </div>

          <p className="text-[11px] leading-relaxed mb-4 font-semibold text-cozy-text-dark/90">
            {isPremium 
              ? "Wonderful! You've unlocked unlimited spoken reflections, private cloud security backings, emotional forecast metrics, and personalized advice conversations with the AI Coach."
              : "Expand your mindful garden. Unlock limitless logs, secure cloud backups, emotional forecast parameter trends, and personalized dialogue pathways with your AI Life Coach."}
          </p>

          {/* Premium Features Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-4 text-[10px] font-bold text-cozy-text-dark/80">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Unlimited Voice & Text Journaling</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Cozy AI Life Coach Chats & Guidance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Interactive Calendar Garden Forecasts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Secure Encrypted Cloud Backups</span>
            </div>
          </div>

          {isPremium ? (
            /* ACTIVE SUBSCRIBER DETAILS */
            <div className="border-2 border-dashed border-[#7A6956]/20 bg-[#FAF7EB]/80 rounded-2xl p-4 mb-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-[#7A6956] font-mono uppercase tracking-wider">Current Plan:</span>
                <span className="font-extrabold capitalize text-amber-900">{subscriptionPlan} Membership</span>
              </div>
              
              {subscriptionTrialEnd && new Date(subscriptionTrialEnd).getTime() > Date.now() && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-[#7A6956] font-mono uppercase tracking-wider">Trial Period Ends:</span>
                  <span className="font-extrabold text-amber-900">
                    {new Date(subscriptionTrialEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}

              {subscriptionPeriodEnd && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-[#7A6956] font-mono uppercase tracking-wider">
                    {subscriptionCancelAtPeriodEnd ? "Subscription Expires On:" : "Next Renewal Date:"}
                  </span>
                  <span className="font-extrabold text-amber-900">
                    {new Date(subscriptionPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-[#7A6956] font-mono uppercase tracking-wider">Auto-Renewal:</span>
                <span className={`font-extrabold px-1.5 py-0.5 rounded-md text-[10px] ${subscriptionCancelAtPeriodEnd ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                  {subscriptionCancelAtPeriodEnd ? "Disabled (Cancelling)" : "Enabled"}
                </span>
              </div>

              {onManageBilling && (
                <div className="pt-2">
                  <button
                    onClick={onManageBilling}
                    className="w-full py-2 bg-white text-cozy-text-dark border-2 border-[#4A3D30] rounded-xl text-[11px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-amber-50 cursor-pointer tactile-btn-retro shadow-xs"
                  >
                    <Info size={12} />
                    <span>Manage Billing & Customer Portal</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* PLAN SELECTION SCREEN */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Monthly Subscription Option */}
                <button
                  onClick={() => {
                    confetti({
                      particleCount: 80,
                      spread: 60,
                      colors: ['#E08E6D', '#94A87C']
                    });
                    onTogglePremium("monthly");
                  }}
                  className="p-3.5 bg-white border-2 border-cozy-text-dark hover:border-cozy-orange rounded-2xl text-left transition relative cursor-pointer group tactile-btn-retro flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#7A6956] block mb-0.5">Flexible Plan</span>
                    <h4 className="text-xs font-extrabold text-cozy-text-dark group-hover:text-cozy-orange transition">Monthly Nest</h4>
                    <p className="text-[10px] text-cozy-text-muted mt-1 leading-normal font-semibold">Includes 7-day trial, then billed monthly. Cancel anytime.</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#4A3D30]/10 flex justify-between items-baseline">
                    <span className="text-xs font-mono font-extrabold text-cozy-text-dark">$9.99<span className="text-[9px] text-cozy-text-muted">/mo</span></span>
                    <span className="text-[9px] font-mono bg-[#FAF7EB] px-1.5 py-0.5 border border-[#4A3D30]/10 rounded-md font-bold text-cozy-orange group-hover:bg-amber-50">7 Days Free</span>
                  </div>
                </button>

                {/* Yearly Subscription Option */}
                <button
                  onClick={() => {
                    confetti({
                      particleCount: 120,
                      spread: 80,
                      colors: ['#FFD700', '#94A87C', '#E08E6D']
                    });
                    onTogglePremium("yearly");
                  }}
                  className="p-3.5 bg-gradient-to-br from-[#FFFDF5] to-[#FCFAF0] border-2 border-cozy-orange rounded-2xl text-left transition relative cursor-pointer group tactile-btn-retro flex flex-col justify-between shadow-xs"
                >
                  <div className="absolute -top-2 right-3 bg-cozy-orange text-white text-[8px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-cozy-text-dark">
                    Best Value - Save 33%
                  </div>
                  <div className="mt-1">
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-cozy-orange block mb-0.5">Annual Nest</span>
                    <h4 className="text-xs font-extrabold text-cozy-text-dark group-hover:text-cozy-orange transition">Yearly Nest</h4>
                    <p className="text-[10px] text-cozy-text-muted mt-1 leading-normal font-semibold">Includes 7-day trial, then billed annually. Best savings!</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-cozy-orange/20 flex justify-between items-baseline">
                    <span className="text-xs font-mono font-extrabold text-cozy-text-dark">$79.99<span className="text-[9px] text-cozy-text-muted">/yr</span></span>
                    <span className="text-[9px] font-mono bg-cozy-orange/10 px-1.5 py-0.5 rounded-md font-extrabold text-cozy-orange">7 Days Free</span>
                  </div>
                </button>
              </div>

              <div className="text-[10px] text-center text-cozy-text-muted font-bold font-mono pt-1">
                🔒 Secured with Stripe Checkout. Real-time sync. Cancel in 1 click.
              </div>
            </div>
          )}
        </div>
      </div>



    </div>
  );
}

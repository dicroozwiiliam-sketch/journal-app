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
  Share2, Save
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
  onTogglePremium: () => void;
  onUpdateProfile?: (updates: { name?: string; email?: string; avatarEmoji?: string; bio?: string; avatarBg?: string }) => void;
  entries: JournalEntry[];
  badges: Badge[];
  goals?: Goal[];
  habits?: any[];
  onLogout: () => void;
}

const AVATAR_EMOJIS = ["👋", "🦊", "☕", "🥑", "🎨", "🧘", "🐱", "🌸", "🧸", "🌱", "✨", "🦉", "🦁", "🐨"];

const AVATAR_BGS = [
  { value: 'bg-cozy-orange', label: 'Terracotta' },
  { value: 'bg-cozy-accent', label: 'Sunset' },
  { value: 'bg-cozy-green', label: 'Sage' },
  { value: 'bg-cozy-yellow', label: 'Honey' },
  { value: 'bg-emerald-600', label: 'Forest' },
  { value: 'bg-indigo-500', label: 'Twilight' },
  { value: 'bg-amber-700', label: 'Oak' },
];

export default function ProfilePage({
  userName,
  userEmail,
  userAvatar = "👋",
  userBio = "Reflecting on life, one voice note at a time.",
  userAvatarBg = "bg-cozy-orange",
  isPremium,
  onTogglePremium,
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
  const handlePremiumAction = () => {
    if (!isPremium) {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#E08E6D', '#FFD700', '#F7D6C8', '#4A3D30']
      });
      onTogglePremium();
      triggerToast("Welcome to Daynest Premium! ✨ Cloud Sync & AI coaching activated.", "success");
    } else {
      onTogglePremium();
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
    <div className="w-full max-w-3xl mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-3 xs:p-4 md:p-8 pb-24" id="profile_tab">
      
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
        <div>
          <h2 className="text-2xl font-black tracking-tight text-cozy-text-dark">Your Profile</h2>
          <p className="text-xs text-cozy-text-muted font-bold">Customize your reflective nest, badges & data backup</p>
        </div>
        
        {/* Simple signout for header safety */}
        <button
          onClick={onLogout}
          className="px-3 py-1.5 bg-[#FCF8F2] hover:bg-[#FAF0E3] text-cozy-text-dark hover:text-[#E08E6D] border-2 border-cozy-text-dark rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition hover:scale-103 cursor-pointer shadow-xs"
        >
          Sign Out
        </button>
      </div>

      {/* Profile Bio Card with full Edit support */}
      <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 mb-5 shadow-sm relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FAF6EB]/50 rounded-full blur-xl pointer-events-none" />
        
        {!isEditing ? (
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-5">
            {/* Avatar Bubble with Edit Trigger */}
            <div className="relative group shrink-0">
              <div className={`w-18 h-18 rounded-2xl ${selectedBg} text-white border-2 xs:border-3 border-cozy-text-dark flex items-center justify-center text-3.5xl font-black select-none shadow-sm transition group-hover:scale-102`}>
                {selectedEmoji}
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-1.5 -right-1.5 bg-white p-1.5 rounded-xl text-cozy-text-dark shadow-sm border-2 border-cozy-text-dark hover:scale-110 transition cursor-pointer"
                title="Edit Avatar & Bio"
              >
                <Edit2 size={10} strokeWidth={3} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                <h3 className="text-base font-black text-cozy-text-dark">{userName}</h3>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  {isPremium ? (
                    <span className="inline-flex items-center gap-1 text-[8px] font-black text-amber-900 bg-[#FCF9EC] border-2 border-amber-800/20 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                      <Crown size={9} fill="currentColor" className="text-amber-600" />
                      <span>Premium</span>
                    </span>
                  ) : (
                    <span className="inline-block text-[8px] font-black text-cozy-text-muted bg-[#FAF6EB] border border-cozy-text-dark/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Free Standard
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-black text-amber-900 bg-[#FFF3EE] border-2 border-[#F0D5CD]/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    🔥 {currentStreakVal} Day Streak
                  </span>
                </div>
              </div>
              
              <p className="text-[10.5px] font-semibold text-[#7A6956] italic leading-relaxed max-w-lg">
                "{editedBio}"
              </p>
              
              <p className="text-[10px] text-cozy-text-muted font-bold font-mono">{userEmail}</p>

              {/* Real Metrics Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 pt-1.5 text-[10px] text-cozy-text-muted font-bold border-t border-dashed border-[#4A3D30]/10">
                <div className="flex items-center gap-1">
                  <span className="text-sm">📖</span>
                  <span><strong className="text-cozy-text-dark text-xs">{entries.length}</strong> journal entries</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm">🏆</span>
                  <span><strong className="text-cozy-text-dark text-xs">{badges.filter(b => b.unlocked).length}</strong> / {badges.length} unlocked badges</span>
                </div>
              </div>
            </div>

            {/* Edit Profile button */}
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 text-cozy-text-muted hover:text-cozy-orange hover:scale-105 transition hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase cursor-pointer"
            >
              <Edit2 size={11} strokeWidth={2.5} />
              <span>Edit Details</span>
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
                <div className={`w-16 h-16 rounded-2xl ${selectedBg} text-white border-2 border-cozy-text-dark flex items-center justify-center text-3xl font-black mb-3 shadow-xs animate-bounce`} style={{ animationDuration: '4s' }}>
                  {selectedEmoji}
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
                    className="px-3.5 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider bg-white hover:bg-cozy-bg text-cozy-text-dark border-2 border-cozy-text-dark rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider bg-[#94A87C] text-white hover:bg-[#83976B] border-2 border-cozy-text-dark rounded-xl flex items-center gap-1 transition cursor-pointer shadow-xs"
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
        {/* Styled cozy background block for premium status */}
        <div className={`p-5 transition-all ${isPremium ? 'bg-gradient-to-r from-[#FCF9EC] to-[#FDFBF2] text-amber-950' : 'bg-cozy-card text-cozy-text-dark'}`}>
          <div className="flex justify-between items-start mb-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-cozy-orange uppercase tracking-widest font-mono">
              <Crown size={15} fill="currentColor" className={isPremium ? 'text-amber-600' : 'text-cozy-orange'} />
              <span>Premium Membership</span>
            </div>
            <span className="text-[10px] font-black text-[#7A6956] font-mono uppercase bg-white/80 px-2 py-0.5 rounded-md border border-[#4A3D30]/10">₹199 / month</span>
          </div>

          <p className="text-[11px] leading-relaxed mb-4 font-semibold text-cozy-text-dark/90">
            {isPremium 
              ? "Wonderful! You've unlocked unlimited spoken reflections, private cloud security backings, emotional forecast metrics, and personalized advice conversations with the AI Coach."
              : "Expand your mindful garden. Unlock limitless logs, secure cloud backups, emotional forecast parameter trends, and personalized dialogue pathways with your AI Life Coach."}
          </p>

          {/* Premium Features Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-4 text-[10px] font-bold text-cozy-text-dark/80">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className={isPremium ? 'text-emerald-600' : 'text-cozy-text-muted/40'} />
              <span>Unlimited Voice & Text Journaling</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className={isPremium ? 'text-emerald-600' : 'text-cozy-text-muted/40'} />
              <span>Cozy AI Life Coach Chats & Guidance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className={isPremium ? 'text-emerald-600' : 'text-cozy-text-muted/40'} />
              <span>Interactive Calendar Garden Forecasts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className={isPremium ? 'text-emerald-600' : 'text-cozy-text-muted/40'} />
              <span>Secure Encrypted Local Backups</span>
            </div>
          </div>

          <button
            onClick={handlePremiumAction}
            className={`w-full py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 border-2 border-cozy-text-dark cursor-pointer ${
              isPremium
                ? 'bg-white hover:bg-[#FAF6EB] text-cozy-text-dark shadow-xs'
                : 'bg-[#E08E6D] hover:bg-[#D57E5C] text-white shadow-sm hover:scale-[1.01] active:scale-[0.99]'
            }`}
            id="premium_toggle"
          >
            {isPremium ? (
              <>
                <Info size={12} />
                <span>Cancel Subscription</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="animate-spin" style={{ animationDuration: '8s' }} />
                <span>Activate Premium Nest – ₹199/Month</span>
              </>
            )}
          </button>
        </div>
      </div>



    </div>
  );
}

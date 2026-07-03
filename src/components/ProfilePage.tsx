/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Shield, Key, Download, Trash2, Heart, Award, Sparkles, Moon, Bell, CheckCircle2, Crown, Globe } from 'lucide-react';
import { Badge, JournalEntry, Goal } from '../types';

interface ProfilePageProps {
  userName: string;
  userEmail: string;
  isPremium: boolean;
  onTogglePremium: () => void;
  entries: JournalEntry[];
  badges: Badge[];
  onLogout: () => void;
}

export default function ProfilePage({
  userName,
  userEmail,
  isPremium,
  onTogglePremium,
  entries,
  badges,
  onLogout,
}: ProfilePageProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const exportData = (format: 'txt' | 'md' | 'csv') => {
    let fileContent = '';
    let mimeType = 'text/plain';
    let fileExtension = format;

    if (format === 'txt') {
      fileContent = `VOICE JOURNAL AI - COMPLETE EXPORT
=====================================
User: ${userName} (${userEmail})
Backup Date: ${new Date().toLocaleDateString()}

TOTAL ENTRIES: ${entries.length}

` + entries.map((entry, idx) => `
ENTRY #${idx + 1}
Date: ${entry.date}
Mood: ${entry.moodEmoji} ${entry.mood}
Transcript: "${entry.transcript}"
AI Summary: "${entry.summary}"
Takeaways: ${entry.takeaways.join(' | ')}
-------------------------------------
`).join('\n');
    } else if (format === 'md') {
      mimeType = 'text/markdown';
      fileContent = `# Voice Journal AI - Backup for ${userName}
Exported on ${new Date().toLocaleDateString()}

${entries.map((entry, idx) => `
## Entry ${idx + 1} - ${new Date(entry.date).toLocaleDateString()}
* **Mood:** ${entry.moodEmoji} ${entry.mood}
* **Duration:** ${entry.duration}s

### Transcript
> ${entry.transcript}

### AI Summary
${entry.summary}

### Key Takeaways
${entry.takeaways.map(t => `* ${t}`).join('\n')}

---
`).join('\n')}`;
    } else if (format === 'csv') {
      mimeType = 'text/csv';
      const headers = 'ID,Date,Duration,Mood,MoodEmoji,Transcript,Summary\n';
      const rows = entries.map(entry => {
        const cleanTranscript = entry.transcript.replace(/"/g, '""');
        const cleanSummary = entry.summary.replace(/"/g, '""');
        return `"${entry.id}","${entry.date}",${entry.duration},"${entry.mood}","${entry.moodEmoji}","${cleanTranscript}","${cleanSummary}"`;
      }).join('\n');
      fileContent = headers + rows;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_journal_backup.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-3xl mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-4 md:p-8 pb-20" id="profile_tab">
      
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-black tracking-tight text-cozy-text-dark">Your Profile</h2>
        <p className="text-xs text-cozy-text-muted font-bold">Manage account, subscription & settings</p>
      </div>
 
      {/* Profile Bio Card */}
      <div className="p-4 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl flex items-center gap-4 mb-5 shadow-sm">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-cozy-orange text-white border-2 border-cozy-text-dark flex items-center justify-center text-2xl font-black select-none shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          {isPremium && (
            <div className="absolute -top-1 -right-1 bg-cozy-yellow p-1 rounded-full text-cozy-text-dark shadow-sm border-2 border-cozy-text-dark">
              <Crown size={12} fill="currentColor" />
            </div>
          )}
        </div>
 
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-black text-cozy-text-dark">{userName}</h3>
            {isPremium && (
              <span className="text-[8px] font-black text-cozy-text-dark bg-cozy-yellow border border-cozy-text-dark px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                Premium
              </span>
            )}
          </div>
          <p className="text-[10px] text-cozy-text-muted font-bold">{userEmail}</p>
 
          <div className="flex gap-4 mt-2 text-[10px] text-cozy-text-muted font-bold">
            <div>
              <span className="font-black text-cozy-text-dark">{entries.length}</span> entries
            </div>
            <div>
              <span className="font-black text-cozy-text-dark">{badges.filter(b => b.unlocked).length}</span> badges
            </div>
          </div>
        </div>
      </div>
 
      {/* Premium Subscription Panel ₹199/month */}
      <div className="p-4 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl mb-6 relative overflow-hidden shadow-sm">
        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-black text-cozy-orange uppercase tracking-wider">
            <Crown size={14} fill="currentColor" />
            <span>Premium Membership</span>
          </div>
          <span className="text-[10px] font-black text-cozy-text-muted">₹199 / month</span>
        </div>
 
        <p className="text-[11px] text-cozy-text-dark leading-relaxed mb-4 relative z-10 font-semibold">
          Unlock unlimited journals, secure cloud backups, emotional trends forecasting, personalized goal insights, and your AI Life Coach.
        </p>
 
        <button
          onClick={onTogglePremium}
          className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 relative z-10 border-2 border-cozy-text-dark ${
            isPremium
              ? 'bg-cozy-bg hover:bg-cozy-card text-cozy-text-dark'
              : 'bg-cozy-orange hover:bg-cozy-accent text-white shadow-sm'
          }`}
          id="premium_toggle"
        >
          {isPremium ? (
            <>
              <span>Cancel Premium Subscription</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Unlock Premium – ₹199/Mo</span>
            </>
          )}
        </button>
      </div>
 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Gamified Achievements / Badges Section */}
        <div className="p-4 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-cozy-text-dark mb-3 flex items-center gap-1.5">
              <Award size={14} className="text-cozy-orange" />
              <span>Badges & Gamification</span>
            </h4>
  
            <div className="grid grid-cols-5 gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center p-1.5 rounded-xl text-center border-2 transition ${
                    badge.unlocked 
                      ? 'bg-cozy-yellow/30 border-cozy-text-dark text-cozy-text-dark shadow-sm font-black' 
                      : 'bg-cozy-bg border-cozy-text-dark/10 opacity-30'
                  }`}
                  title={`${badge.title}: ${badge.description}`}
                >
                  <div className="text-lg mb-1">{badge.icon}</div>
                  <p className="text-[8px] font-black truncate w-full">{badge.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
  
        {/* Data Export Options */}
        <div className="p-4 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-cozy-text-dark mb-3 flex items-center gap-1.5">
              <Download size={14} className="text-cozy-green" />
              <span>Export Your Data</span>
            </h4>
            <p className="text-[11px] font-semibold text-cozy-text-muted leading-relaxed mb-4">
              Backup your full audio transcripts and emotional parameters to use in spreadsheet or document tools.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => exportData('txt')}
              className="py-2 bg-cozy-bg hover:bg-white border-2 border-cozy-text-dark rounded-xl text-[10px] font-black text-cozy-text-dark uppercase tracking-wider transition shadow-sm"
            >
              TXT Format
            </button>
            <button
              onClick={() => exportData('md')}
              className="py-2 bg-cozy-bg hover:bg-white border-2 border-cozy-text-dark rounded-xl text-[10px] font-black text-cozy-text-dark uppercase tracking-wider transition shadow-sm"
            >
              Markdown
            </button>
            <button
              onClick={() => exportData('csv')}
              className="py-2 bg-cozy-bg hover:bg-white border-2 border-cozy-text-dark rounded-xl text-[10px] font-black text-cozy-text-dark uppercase tracking-wider transition shadow-sm"
            >
              CSV Sheets
            </button>
          </div>
        </div>
      </div>
 
      {/* Quick Settings Panel */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-black text-cozy-text-muted uppercase tracking-wider px-1">Settings</h4>
        
        <div className="bg-cozy-card border-2 border-cozy-text-dark rounded-2xl overflow-hidden divide-y-2 divide-cozy-text-dark/10 shadow-sm">
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <Moon size={16} className="text-cozy-orange" />
              <span className="text-xs font-bold text-cozy-text-dark">Dark Calming Theme</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-10 h-6 rounded-full p-0.5 border-2 border-cozy-text-dark transition-colors ${darkMode ? 'bg-cozy-orange' : 'bg-cozy-bg'}`}
            >
              <div className={`w-4 h-4 bg-white border-2 border-cozy-text-dark rounded-full shadow-sm transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
 
          {/* Notifications */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-cozy-accent" />
              <span className="text-xs font-bold text-cozy-text-dark">Daily Journal Reminders</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-10 h-6 rounded-full p-0.5 border-2 border-cozy-text-dark transition-colors ${notifications ? 'bg-cozy-orange' : 'bg-cozy-bg'}`}
            >
              <div className={`w-4 h-4 bg-white border-2 border-cozy-text-dark rounded-full shadow-sm transition-transform ${notifications ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
 
          {/* Privacy lock */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-cozy-green" />
              <span className="text-xs font-bold text-cozy-text-dark">Biometric PIN Security</span>
            </div>
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`w-10 h-6 rounded-full p-0.5 border-2 border-cozy-text-dark transition-colors ${privacyMode ? 'bg-cozy-orange' : 'bg-cozy-bg'}`}
            >
              <div className={`w-4 h-4 bg-white border-2 border-cozy-text-dark rounded-full shadow-sm transition-transform ${privacyMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
 
          {/* Language selection */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <Globe size={16} className="text-cozy-yellow" />
              <span className="text-xs font-bold text-cozy-text-dark">Journal Language</span>
            </div>
            <span className="text-[10px] font-black text-cozy-text-muted">English (IN)</span>
          </div>
        </div>
 
        {/* Logout and Delete */}
        <div className="flex gap-3 pt-3">
          <button
            onClick={onLogout}
            className="flex-1 py-2.5 bg-cozy-card border-2 border-cozy-text-dark hover:bg-cozy-bg text-cozy-text-dark text-xs font-black rounded-xl transition shadow-sm cursor-pointer"
          >
            Sign Out
          </button>
          {showDeleteConfirm ? (
            <button
              onClick={() => {
                localStorage.clear();
                onLogout();
              }}
              className="flex-1 py-2.5 bg-rose-600 border-2 border-rose-700 text-white hover:bg-rose-700 text-xs font-black rounded-xl transition shadow-sm animate-pulse cursor-pointer"
            >
              Confirm Wipe?
            </button>
          ) : (
            <button
              onClick={() => {
                setShowDeleteConfirm(true);
                setTimeout(() => setShowDeleteConfirm(false), 5000); // reset after 5s
              }}
              className="flex-1 py-2.5 bg-rose-50 border-2 border-rose-300 text-rose-600 hover:bg-rose-100 text-xs font-black rounded-xl transition shadow-sm cursor-pointer"
            >
              Delete Account
            </button>
          )}
        </div>
      </div>
 
    </div>
  );
}

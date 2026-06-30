/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, Clock, Smile, Trash2, Edit3, Volume2, Share2, FileText, ChevronLeft, ArrowLeftRight, Sparkles, AlertCircle } from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalTimelineProps {
  entries: JournalEntry[];
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
}

export default function JournalTimeline({ entries, onDeleteEntry, onUpdateEntry }: JournalTimelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Today' | 'Week' | 'Month' | 'Year'>('All');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Edit details state
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  // Filtering function
  const filteredEntries = entries.filter(entry => {
    // Search filter
    const matchesSearch = 
      entry.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.mood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Time filter
    if (filterType === 'All') return true;

    const entryDate = new Date(entry.date);
    const now = new Date();
    
    // reset clocks
    const diffTime = Math.abs(now.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (filterType === 'Today') {
      return entryDate.toDateString() === now.toDateString();
    }
    if (filterType === 'Week') {
      return diffDays <= 7;
    }
    if (filterType === 'Month') {
      return diffDays <= 30;
    }
    if (filterType === 'Year') {
      return diffDays <= 365;
    }

    return true;
  });

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (secs: number) => {
    if (secs === 0) return 'Written';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Convert Text to Speech with real /api/tts endpoint
  const speakText = async (entry: JournalEntry) => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    setIsSpeaking(true);
    setPlayingEntryId(entry.id);

    const playLocalSpeechFallback = () => {
      console.log("Using browser SpeechSynthesis fallback");
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(entry.summary);
        utterance.rate = 1.05;
        utterance.onend = () => {
          setIsSpeaking(false);
          setPlayingEntryId(null);
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          setPlayingEntryId(null);
        };
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Local speech synthesis failed:", err);
        setIsSpeaking(false);
        setPlayingEntryId(null);
      }
    };

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entry.summary }),
      });

      if (!response.ok) throw new Error("TTS request failed");
      const data = await response.json();

      if (data.audio && !data.fallback) {
        // Play base64 audio returned by gemini-3.1-flash-tts-preview
        const audioSrc = `data:audio/mp3;base64,${data.audio}`;
        let player = audioRef.current;
        if (!player) {
          player = new Audio();
          audioRef.current = player;
        }

        player.onerror = (e) => {
          console.warn("Audio element encountered source error, falling back to speech synthesis:", e);
          playLocalSpeechFallback();
        };

        player.onended = () => {
          setIsSpeaking(false);
          setPlayingEntryId(null);
        };

        player.src = audioSrc;
        player.play().catch((playError) => {
          console.warn("Audio playback promise rejected or aborted, falling back to speech synthesis:", playError);
          playLocalSpeechFallback();
        });
      } else {
        playLocalSpeechFallback();
      }
    } catch (err) {
      console.warn("TTS fetch or initialize failed, falling back to speech synthesis:", err);
      playLocalSpeechFallback();
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setPlayingEntryId(null);
  };

  const handleUpdate = () => {
    if (!selectedEntry) return;
    const updated = { ...selectedEntry, transcript: editedText };
    onUpdateEntry(updated);
    setSelectedEntry(updated);
    setIsEditing(false);
  };

  const handleShare = (entry: JournalEntry) => {
    // Simulate share workflow
    alert(`Entry shared! Link copied: https://voicejournal.ai/share/${entry.id}`);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-6" id="journal_tab">
      
      <AnimatePresence mode="wait">
        {!selectedEntry ? (
          // TIMELINE MAIN VIEW
          <motion.div
            key="timeline-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col space-y-5 pb-20"
          >
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black tracking-tight text-cozy-text-dark">Your Diary</h2>
              <p className="text-xs text-cozy-text-muted font-bold">Review your personal history & reflections</p>
            </div>
 
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-cozy-text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Search transcripts, moods, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs text-cozy-text-dark placeholder-cozy-text-muted/70 font-semibold transition shadow-sm"
                id="journal_search"
              />
            </div>
 
            {/* Date Filters Row */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['All', 'Today', 'Week', 'Month', 'Year'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 transition shrink-0 ${
                    filterType === type 
                      ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                      : 'bg-cozy-card text-cozy-text-muted border-cozy-text-dark hover:text-cozy-text-dark'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
 
            {/* Timeline Cards */}
            <div className="flex-1 space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 space-y-3 bg-cozy-card/60 rounded-2xl border-2 border-dashed border-cozy-text-dark/40">
                  <AlertCircle className="text-cozy-text-muted w-8 h-8" />
                  <p className="text-xs text-cozy-text-muted max-w-xs leading-relaxed font-bold">
                    No matching diary entries found. Speak your mind or type a note to seed your journal.
                  </p>
                </div>
              ) : (
                <div className="relative pl-4 border-l-2 border-cozy-text-dark space-y-6">
                  {filteredEntries.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => {
                        setSelectedEntry(entry);
                        setEditedText(entry.transcript);
                      }}
                      className="group relative bg-cozy-card hover:bg-white border-2 border-cozy-text-dark p-4 rounded-xl cursor-pointer shadow-sm transition duration-200"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-[23px] top-4 w-3.5 h-3.5 rounded-full bg-cozy-orange border-2 border-cozy-text-dark group-hover:scale-125 transition" />
 
                      {/* Header row */}
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-cozy-text-muted">
                          <Calendar size={11} />
                          <span>{formatDate(entry.date)}</span>
                          <span className="text-cozy-text-muted/40">•</span>
                          <Clock size={11} />
                          <span>{formatTime(entry.duration)}</span>
                        </div>
                        <span className="text-sm">{entry.moodEmoji}</span>
                      </div>
 
                      {/* Summary Text */}
                      <h4 className="text-xs font-bold text-cozy-text-dark leading-relaxed mb-3 line-clamp-2">
                        "{entry.summary}"
                      </h4>
 
                      {/* Footer Row */}
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider text-white px-2.5 py-0.5 bg-cozy-orange rounded-full border-2 border-cozy-text-dark shadow-sm">
                          {entry.mood}
                        </span>
                        
                        <div className="flex gap-1.5">
                          {entry.topics.slice(0, 2).map((topic, i) => (
                            <span key={i} className="text-[10px] text-cozy-text-muted font-bold">
                              #{topic.toLowerCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          // ENTRY DETAILS SCREEN OVERLAY
          <motion.div
            key="entry-details"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col space-y-5 pb-20"
          >
            {/* Back Button and Header */}
            <div className="flex items-center justify-between border-b-2 border-cozy-text-dark pb-3 mb-2">
              <button
                onClick={() => {
                  stopSpeaking();
                  setSelectedEntry(null);
                  setIsEditing(false);
                }}
                className="flex items-center gap-1.5 text-xs font-black text-cozy-accent hover:text-cozy-orange transition"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
                <span>Timeline</span>
              </button>
 
              <div className="flex gap-2">
                {/* Speaker TTS button */}
                <button
                  onClick={() => speakText(selectedEntry)}
                  className={`p-1.5 rounded-lg border-2 border-cozy-text-dark transition ${
                    isSpeaking && playingEntryId === selectedEntry.id
                      ? 'bg-cozy-orange text-white animate-pulse'
                      : 'bg-cozy-card text-cozy-text-dark hover:bg-cozy-orange hover:text-white'
                  }`}
                  title="Speak AI Summary"
                >
                  <Volume2 size={16} />
                </button>
                <button
                  onClick={() => handleShare(selectedEntry)}
                  className="p-1.5 bg-cozy-card border-2 border-cozy-text-dark text-cozy-text-dark hover:bg-cozy-yellow rounded-lg transition"
                >
                  <Share2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this diary reflection? This cannot be undone.")) {
                      stopSpeaking();
                      onDeleteEntry(selectedEntry.id);
                      setSelectedEntry(null);
                    }
                  }}
                  className="p-1.5 bg-rose-50 border-2 border-rose-300 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
 
            {/* Date Indicator Card */}
            <div className="p-4 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-extrabold text-cozy-text-dark">{formatDate(selectedEntry.date)}</p>
                <p className="text-[10px] text-cozy-text-muted mt-0.5 font-bold">Recording Length: {formatTime(selectedEntry.duration)}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-cozy-yellow border-2 border-cozy-text-dark rounded-full shadow-sm">
                <span className="text-sm">{selectedEntry.moodEmoji}</span>
                <span className="text-xs font-black text-cozy-text-dark">{selectedEntry.mood}</span>
              </div>
            </div>
 
            {/* Summary Block */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-cozy-text-muted block">AI Generated Summary</span>
              <div className="p-4 bg-cozy-yellow/20 border-2 border-cozy-text-dark rounded-xl text-xs text-cozy-text-dark leading-relaxed italic font-semibold shadow-sm">
                "{selectedEntry.summary}"
              </div>
            </div>
 
            {/* Full Transcript Block */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-cozy-text-muted block">Full Transcript</span>
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleUpdate();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="text-[11px] font-black text-cozy-accent hover:text-cozy-orange transition"
                >
                  {isEditing ? 'Save Changes' : 'Edit Transcript'}
                </button>
              </div>
 
              {isEditing ? (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full flex-1 min-h-[160px] p-4 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs leading-relaxed text-cozy-text-dark font-semibold resize-none"
                />
              ) : (
                <div className="p-4 bg-cozy-card border-2 border-cozy-text-dark rounded-xl text-xs leading-relaxed text-cozy-text-dark font-semibold max-h-[220px] overflow-y-auto">
                  {selectedEntry.transcript}
                </div>
              )}
            </div>
 
            {/* Secondary Emotions detected */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-cozy-text-muted block">Emotions Detected</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedEntry.emotions?.map((em, i) => (
                  <span key={i} className="px-2.5 py-1 bg-cozy-card border-2 border-cozy-text-dark text-cozy-text-dark rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                    {em}
                  </span>
                ))}
              </div>
            </div>
 
            {/* Key takeaways */}
            <div className="space-y-2">
              <span className="text-xs font-black text-cozy-text-muted block">Actionable Key Takeaways</span>
              <div className="space-y-2">
                {selectedEntry.takeaways?.map((takeaway, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start p-3 bg-cozy-card border-2 border-cozy-text-dark rounded-xl shadow-sm">
                    <Sparkles size={12} className="text-cozy-orange shrink-0 mt-0.5" />
                    <p className="text-[11px] text-cozy-text-dark leading-normal font-semibold">{takeaway}</p>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Display Tags */}
            <div className="flex gap-1.5 flex-wrap pt-2 border-t-2 border-cozy-text-dark/20">
              {selectedEntry.tags?.map((tag, i) => (
                <span key={i} className="text-xs font-black text-cozy-accent">
                  {tag}
                </span>
              ))}
            </div>
 
          </motion.div>
        )}
      </AnimatePresence>
 
    </div>
  );
}

// Simple ref setup
import { useRef } from 'react';

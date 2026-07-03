/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, Clock, Smile, Trash2, Edit3, Volume2, Share2, FileText, ChevronLeft, ArrowLeftRight, Sparkles, AlertCircle, List, CheckSquare, Mic, Image, Play, Square, Edit, Edit2, Plus, ChevronUp, ChevronDown, Compass, BookOpen, Copy, Check, X } from 'lucide-react';
import { JournalEntry } from '../types';
import NotionBlockEditor from './NotionBlockEditor';
import FloatingCanvas, { FloatingObject } from './FloatingCanvas';

export interface JournalBlock {
  id: string;
  type: 
    | 'paragraph' 
    | 'h1' 
    | 'h2' 
    | 'h3'
    | 'quote'
    | 'divider'
    | 'bullet' 
    | 'number' 
    | 'todo' 
    | 'toggle'
    | 'image'
    | 'gallery' 
    | 'voice' 
    | 'audio'
    | 'video'
    | 'table'
    | 'sketch'; // 'sketch' from template fallback
  content: string;
  completed?: boolean;
  indent?: number;
  collapsed?: boolean;
  meta?: any;
}

interface JournalTimelineProps {
  entries: JournalEntry[];
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
  autoSelectEntryId?: string | null;
  onClearAutoSelect?: () => void;
}

export default function JournalTimeline({ 
  entries, 
  onDeleteEntry, 
  onUpdateEntry,
  autoSelectEntryId,
  onClearAutoSelect
}: JournalTimelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Today' | 'Week' | 'Month' | 'Year'>('All');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Auto-select newly created pages
  useEffect(() => {
    if (autoSelectEntryId) {
      const entryToSelect = entries.find(e => e.id === autoSelectEntryId);
      if (entryToSelect) {
        setSelectedEntry(entryToSelect);
      }
      onClearAutoSelect?.();
    }
  }, [autoSelectEntryId, entries, onClearAutoSelect]);
  
  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingEntryId, setPlayingEntryId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Edit details state
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  // Notion Block Editor states
  const [blocks, setBlocks] = useState<JournalBlock[]>([]);
  const [floatingObjects, setFloatingObjects] = useState<FloatingObject[]>([]);
  const lastLoadedEntryIdRef = useRef<string | null>(null);
  const [slashCommandBlockId, setSlashCommandBlockId] = useState<string | null>(null);
  const [slashQuery, setSlashQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Floating Navigator States
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to append a new block to the end of the document
  const handleAppendBlock = (type: string) => {
    let meta = {};
    if (type === 'gallery') {
      meta = { urls: [] };
    } else if (type === 'table') {
      meta = {
        rows: [
          ['Header 1', 'Header 2', 'Header 3'],
          ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
          ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
        ]
      };
    } else if (type === 'todo') {
      meta = {};
    } else if (type === 'sticky') {
      meta = {};
    } else if (type === 'drawing' || type === 'sketch') {
      meta = {};
    }

    const newId = `b-custom-${Date.now()}`;
    const newBlock: JournalBlock = {
      id: newId,
      type: type as any,
      content: type === 'gallery' ? 'Captured moments & warm reflections ✨' : '',
      meta
    };

    const updated = [...blocks, newBlock];
    setBlocks(updated);
    handleUpdateBlocks(updated);
    showToast(`Added a new ${type === 'drawing' ? 'sketch' : type} block! ✨`);

    // Scroll to the newly added block smoothly
    setTimeout(() => {
      const el = document.getElementById(`block-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  // Helper to compile all text in the editor and calculate stats
  const getWritingStats = () => {
    let wordCount = 0;
    let charCount = 0;
    
    blocks.forEach(b => {
      if (b.content) {
        const text = b.content.replace(/<[^>]*>/g, ' ').trim(); // Strip HTML tags
        if (text) {
          wordCount += text.split(/\s+/).filter(Boolean).length;
          charCount += text.length;
        }
      }
    });

    const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 WPM
    return { wordCount, charCount, readingTime, blockCount: blocks.length };
  };

  // Copy full page contents to clipboard
  const handleCopyFullText = () => {
    const textToCopy = blocks
      .map(b => {
        const text = b.content.replace(/<[^>]*>/g, '').trim();
        if (b.type === 'h1') return `# ${text}`;
        if (b.type === 'h2') return `## ${text}`;
        if (b.type === 'h3') return `### ${text}`;
        if (b.type === 'bullet') return `• ${text}`;
        if (b.type === 'number') return `1. ${text}`;
        if (b.type === 'todo') return `[${b.completed ? 'x' : ' '}] ${text}`;
        if (b.type === 'quote') return `> ${text}`;
        return text;
      })
      .filter(Boolean)
      .join('\n\n');

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    showToast("Full page copied to clipboard! 📋");
    setTimeout(() => setCopiedText(false), 2000);
  };

  const initBlocksForEntry = (entry: JournalEntry): JournalBlock[] => {
    if ((entry as any).blocks && (entry as any).blocks.length > 0) {
      return (entry as any).blocks;
    }

    const result: JournalBlock[] = [];
    
    // Title/Summary is heading 1
    result.push({
      id: 'b-title',
      type: 'h1',
      content: entry.summary || 'A thoughtful reflection'
    });

    // Split transcript into paragraph blocks
    const paragraphs = entry.transcript ? entry.transcript.split(/\n\s*\n/) : [''];
    paragraphs.forEach((p, idx) => {
      if (p.trim()) {
        result.push({
          id: `b-transcript-${idx}`,
          type: 'paragraph',
          content: p.trim()
        });
      }
    });

    // Gratitude heading
    result.push({
      id: 'b-grateful-header',
      type: 'h2',
      content: "Today I'm grateful for"
    });

    if (entry.takeaways && entry.takeaways.length > 0) {
      entry.takeaways.forEach((tk, idx) => {
        result.push({
          id: `b-grateful-item-${idx}`,
          type: 'bullet',
          content: tk
        });
      });
    } else {
      result.push({ id: 'b-grateful-item-1', type: 'bullet', content: 'Good health & warm coffee' });
      result.push({ id: 'b-grateful-item-2', type: 'bullet', content: 'Supportive friends to share ideas' });
      result.push({ id: 'b-grateful-item-3', type: 'bullet', content: 'The time to reflect and self-actualize' });
    }

    // Plans heading
    result.push({
      id: 'b-todo-header',
      type: 'h2',
      content: 'Daily Action Plans'
    });

    result.push({
      id: 'b-todo-1',
      type: 'todo',
      content: 'Finish current work module',
      completed: true
    });
    result.push({
      id: 'b-todo-2',
      type: 'todo',
      content: 'Reflect on emotional pattern trends',
      completed: false
    });
    result.push({
      id: 'b-todo-3',
      type: 'todo',
      content: 'Evening recovery walk & fresh air',
      completed: false
    });

    // Quote block from default
    result.push({
      id: 'b-sticky',
      type: 'quote',
      content: 'Focus on progress, not perfection. ❤️'
    });

    // Voice
    result.push({
      id: 'b-voice',
      type: 'voice',
      content: ''
    });

    // Gallery (starts empty so user can add custom photos)
    result.push({
      id: 'b-gallery',
      type: 'gallery',
      content: 'Captured moments & warm reflections ✨',
      meta: { urls: [] }
    });

    // Sketch
    result.push({
      id: 'b-sketch',
      type: 'sketch',
      content: ''
    });

    return result;
  };

  useEffect(() => {
    if (selectedEntry) {
      if (lastLoadedEntryIdRef.current !== selectedEntry.id) {
        lastLoadedEntryIdRef.current = selectedEntry.id;
        const entryBlocks = initBlocksForEntry(selectedEntry);
        setBlocks(entryBlocks);
        
        // Load custom floating/decorations if present
        const entryFloatingObjects = (selectedEntry as any).floatingObjects || [];
        setFloatingObjects(entryFloatingObjects);
        
        const isNewEmptyEntry = entryBlocks.length === 1 && entryBlocks[0].id === 'b-title' && entryBlocks[0].content === '';
        const hasEmptyTitle = entryBlocks.find(b => b.id === 'b-title')?.content === '';
        if (isNewEmptyEntry || hasEmptyTitle) {
          setTimeout(() => {
            const titleEl = document.getElementById('input-b-title');
            if (titleEl) {
              titleEl.focus();
            }
          }, 150);
        }
      }
    } else {
      lastLoadedEntryIdRef.current = null;
      setBlocks([]);
      setFloatingObjects([]);
    }
  }, [selectedEntry]);

  const handleUpdateFloatingObjects = (updatedObjects: FloatingObject[]) => {
    if (!selectedEntry) return;

    const updatedEntry: JournalEntry = {
      ...selectedEntry,
      floatingObjects: updatedObjects
    } as any;

    setFloatingObjects(updatedObjects);
    setSelectedEntry(updatedEntry);
    onUpdateEntry(updatedEntry);
  };

  const handleUpdateBlocks = (updatedBlocks: JournalBlock[]) => {
    if (!selectedEntry) return;

    // Backward sync to original properties
    const textBlocks = updatedBlocks
      .filter(b => b.type === 'paragraph' || b.type === 'bullet' || b.type === 'h1' || b.type === 'h2')
      .map(b => b.content)
      .join('\n\n');

    const bulletTakeaways = updatedBlocks
      .filter(b => b.type === 'bullet')
      .map(b => b.content);

    const firstH1 = updatedBlocks.find(b => b.type === 'h1')?.content || selectedEntry.summary;

    const updatedEntry: JournalEntry = {
      ...selectedEntry,
      transcript: textBlocks || selectedEntry.transcript,
      summary: firstH1,
      takeaways: bulletTakeaways.length > 0 ? bulletTakeaways : selectedEntry.takeaways,
      blocks: updatedBlocks,
      floatingObjects: (selectedEntry as any).floatingObjects || []
    } as any;

    setBlocks(updatedBlocks);
    setSelectedEntry(updatedEntry);
    onUpdateEntry(updatedEntry);
  };

  const updateBlockContent = (blockId: string, content: string) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, content } : b);
    setBlocks(updated);
    handleUpdateBlocks(updated);
  };

  const toggleTodo = (blockId: string) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, completed: !b.completed } : b);
    setBlocks(updated);
    handleUpdateBlocks(updated);
  };

  const deleteBlock = (blockId: string) => {
    if (blockId === 'b-title') return; // Cannot delete the title block
    const updated = blocks.filter(b => b.id !== blockId);
    setBlocks(updated);
    handleUpdateBlocks(updated);
    showToast("Block deleted");
  };

  const moveBlockUp = (index: number) => {
    if (index <= 1) return; // Cannot move title or above title
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setBlocks(updated);
    handleUpdateBlocks(updated);
    showToast("Block moved up");
  };

  const moveBlockDown = (index: number) => {
    if (index === 0 || index >= blocks.length - 1) return; // Cannot move title or below end
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setBlocks(updated);
    handleUpdateBlocks(updated);
    showToast("Block moved down");
  };

  const insertBlockBelow = (index: number) => {
    const newBlock: JournalBlock = {
      id: `b-new-${Date.now()}`,
      type: 'paragraph',
      content: '',
      indent: blocks[index]?.indent || 0
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, newBlock);
    setBlocks(updated);
    handleUpdateBlocks(updated);
    
    setTimeout(() => {
      const el = document.getElementById(`input-${newBlock.id}`);
      if (el) el.focus();
    }, 50);
  };

  const executeSlashCommand = (blockId: string, type: JournalBlock['type']) => {
    const updated = blocks.map(block => {
      if (block.id === blockId) {
        let newContent = block.content.replace(/\/[a-zA-Z0-9]*$/, '').trim();
        return {
          ...block,
          type,
          content: newContent,
          completed: type === 'todo' ? false : undefined
        };
      }
      return block;
    });
    
    setBlocks(updated);
    handleUpdateBlocks(updated);
    setSlashCommandBlockId(null);
    showToast(`Converted to ${type}`);

    setTimeout(() => {
      const el = document.getElementById(`input-${blockId}`);
      if (el) el.focus();
    }, 50);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const bodyBlocks = blocks.filter(b => b.id !== 'b-title');
      if (bodyBlocks.length === 0) {
        const newBlock: JournalBlock = {
          id: `b-new-${Date.now()}`,
          type: 'paragraph',
          content: '',
          indent: 0
        };
        const updated = [...blocks, newBlock];
        setBlocks(updated);
        handleUpdateBlocks(updated);
        
        setTimeout(() => {
          const el = document.getElementById(`input-${newBlock.id}`);
          if (el) el.focus();
        }, 50);
      } else {
        const firstBodyBlock = bodyBlocks[0];
        setTimeout(() => {
          const el = document.getElementById(`input-${firstBodyBlock.id}`);
          if (el) el.focus();
        }, 50);
      }
    }
  };

  const handleBlockKeyDown = (blockId: string, e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Preserve list types (todo/bullet) when hitting Enter
      const currentBlock = blocks[index];
      const nextType = (currentBlock.type === 'todo' || currentBlock.type === 'bullet') 
        ? currentBlock.type 
        : 'paragraph';

      const newBlock: JournalBlock = {
        id: `b-new-${Date.now()}`,
        type: nextType,
        content: '',
        completed: nextType === 'todo' ? false : undefined,
        indent: currentBlock.indent || 0
      };
      
      const updated = [...blocks];
      updated.splice(index + 1, 0, newBlock);
      setBlocks(updated);
      handleUpdateBlocks(updated);
      
      setTimeout(() => {
        const el = document.getElementById(`input-${newBlock.id}`);
        if (el) el.focus();
      }, 50);
    } else if (e.key === 'Backspace' && blocks[index].content === '') {
      e.preventDefault();
      
      const currentBlock = blocks[index];
      
      // Indentation Backspace logic: decrease indent if nested
      if (currentBlock.indent && currentBlock.indent > 0) {
        const updated = blocks.map((b, i) => i === index ? { ...b, indent: (b.indent || 0) - 1 } : b);
        setBlocks(updated);
        handleUpdateBlocks(updated);
        return;
      }

      // Deletion Backspace logic
      if (blocks.length > 1 && blockId !== 'b-title') {
        const updated = blocks.filter(b => b.id !== blockId);
        setBlocks(updated);
        handleUpdateBlocks(updated);
        
        if (index > 0) {
          setTimeout(() => {
            const prevBlock = blocks[index - 1];
            const el = document.getElementById(`input-${prevBlock.id}`);
            if (el) el.focus();
          }, 50);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const currentBlock = blocks[index];
      const currentIndent = currentBlock.indent || 0;
      const nextIndent = e.shiftKey ? Math.max(0, currentIndent - 1) : Math.min(3, currentIndent + 1);
      
      const updated = blocks.map((b, i) => i === index ? { ...b, indent: nextIndent } : b);
      setBlocks(updated);
      handleUpdateBlocks(updated);
    }
  };

  const handleKeyUp = (blockId: string, e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = (e.target as any).value || '';
    const match = value.match(/\/([a-zA-Z0-9]*)$/);
    if (match) {
      setSlashCommandBlockId(blockId);
      setSlashQuery(match[1]);
    } else {
      setSlashCommandBlockId(null);
    }
  };

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
    navigator.clipboard.writeText(`https://voicejournal.ai/share/${entry.id}`);
    showToast("Share link copied to clipboard! ✨");
  };

  return (
    <div className="w-full max-w-3xl mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-4 md:p-8" id="journal_tab">
      
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
          // ENTRY DETAILS SCREEN OVERLAY (NOTION-LIKE PAGES)
          <motion.div
            key="entry-details"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col space-y-6 pb-24 text-cozy-text-dark font-sans relative"
          >
            {/* Custom Notification Toast */}
            {toastMessage && (
              <div className="fixed bottom-6 right-6 bg-cozy-text-dark text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold z-50 animate-bounce">
                <Sparkles size={14} className="text-cozy-orange animate-spin" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white border-2 border-cozy-text-dark rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
                  <div className="w-12 h-12 rounded-full bg-rose-50 border-2 border-rose-200 text-rose-500 flex items-center justify-center mx-auto mb-4 text-xl">
                    ⚠️
                  </div>
                  <h3 className="text-base font-black text-cozy-text-dark mb-1">Delete Entry?</h3>
                  <p className="text-xs text-cozy-text-muted leading-relaxed mb-6 font-bold">
                    Are you sure you want to permanently delete this Notion journal page? This action cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-cozy-bg border border-[#E2D1C3] hover:bg-[#FDF8F1] text-cozy-text-dark text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        stopSpeaking();
                        onDeleteEntry(selectedEntry!.id);
                        setSelectedEntry(null);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Minimalist Floating Back Button (outside document flow) */}
            <div className="absolute top-4 left-4 md:-left-14 lg:-left-20 z-30">
              <button
                onClick={() => {
                  stopSpeaking();
                  setSelectedEntry(null);
                  setIsEditing(false);
                }}
                className="p-2 bg-white hover:bg-[#FDF8F1] border-2 border-cozy-text-dark rounded-xl flex items-center justify-center text-cozy-text-dark shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer"
                title="Back to Timeline"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
            </div>



            <div className="max-w-2xl mx-auto w-full space-y-8 pt-14 md:pt-0 relative">
              {/* Floating Craft decorations overlay canvas */}
              <FloatingCanvas 
                floatingObjects={floatingObjects}
                onChange={handleUpdateFloatingObjects}
                showToast={showToast}
              />

              {/* INTERACTIVE NOTION BLOCK CANVAS */}
              <div className="space-y-4">
                <NotionBlockEditor 
                  blocks={blocks} 
                  onChange={handleUpdateBlocks} 
                  showToast={showToast} 
                />
              </div>
              

            </div>


          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



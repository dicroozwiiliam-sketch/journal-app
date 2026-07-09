/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, GripVertical, 
  Copy, Check, Undo2, Redo2, CornerDownRight, Play, Square, Volume2,
  Image as ImageIcon, Sparkles, FileText, Link as LinkIcon, 
  Table2, AlertCircle, Smile, HelpCircle, FileDown, ExternalLink, Paperclip,
  ChevronLast, Layers, List, CheckSquare, Mic, Edit, ListOrdered, Edit2, PlusCircle,
  Youtube, Upload, Video, RefreshCw, X, Music, Headphones
} from 'lucide-react';
import { JournalBlock } from './JournalTimeline';
import VoiceBlock from './VoiceBlock';
import TableBlock from './TableBlock';
import GalleryBlock from './GalleryBlock';

// Helper to compile markdown and custom markup to HTML
export function compileMarkdownToHtml(str: string): string {
  if (!str) return '';

  // Replace literal &nbsp; with standard space to avoid escaping it to &amp;nbsp;
  const cleanStr = str.replace(/&nbsp;/g, ' ');

  // If text already contains HTML tags (bold, italic, spans, etc.), render it directly
  const hasHtml = /<[a-z][\s\S]*>/i.test(cleanStr);
  if (hasHtml) {
    return cleanStr;
  }

  // Escape HTML first
  let html = cleanStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, textVal, urlVal) => {
    const safeUrl = urlVal.startsWith('http') || urlVal.startsWith('/') ? urlVal : 'https://' + urlVal;
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-cozy-accent underline hover:text-[#EF9A7A] transition" onclick="event.stopPropagation()">${textVal}</a>`;
  });

  // Color: [text]{color:colorValue}
  html = html.replace(/\[([^\]]+)\]\{color:([^}]+)\}/g, '<span style="color: $2">$1</span>');

  // Background color: [text]{bg:colorValue}
  html = html.replace(/\[([^\]]+)\]\{bg:([^}]+)\}/g, '<span class="px-1 rounded" style="background-color: $2">$1</span>');

  // Highlight: ==text==
  html = html.replace(/==([^=]+)==/g, '<mark class="bg-amber-100 dark:bg-amber-900/30 text-amber-950 dark:text-amber-100 px-1 rounded font-bold">$1</mark>');

  // Code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="font-mono bg-gray-100 text-rose-600 px-1 py-0.5 rounded text-xs">$1</code>');

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Underline: __text__
  html = html.replace(/__([^_]+)__/g, '<u>$1</u>');

  // Strikethrough: ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  // Mentions: @name
  html = html.replace(/@([a-zA-Z0-9_\-]+)/g, '<span class="bg-[#EF9A7A]/10 text-[#EF9A7A] hover:bg-[#EF9A7A]/20 font-bold px-1.5 py-0.5 rounded-lg text-xs cursor-pointer inline-flex items-center gap-0.5">@$1</span>');

  return html;
}

// Helper component to parse and render inline rich formatting safely using parsed HTML tokens
export function FormattedText({ text }: { text: string }) {
  if (!text) return null;
  return <span dangerouslySetInnerHTML={{ __html: compileMarkdownToHtml(text) }} />;
}

// Helper to strip the trailing slash command from the end of the HTML safely without breaking tags
export function removeTrailingSlashCommand(html: string, query: string): string {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find all text nodes recursively
    const textNodes: Text[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text);
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
      }
    };
    walk(tempDiv);
    
    for (let i = textNodes.length - 1; i >= 0; i--) {
      const textNode = textNodes[i];
      const text = textNode.nodeValue || '';
      const pattern = new RegExp('\\/(' + (query || '[a-zA-Z0-9]*') + ')$');
      const match = text.match(pattern);
      if (match) {
        const lastSlash = text.lastIndexOf('/');
        if (lastSlash !== -1) {
          textNode.nodeValue = text.substring(0, lastSlash);
          break;
        }
      }
    }
    return tempDiv.innerHTML;
  } catch (err) {
    return html.replace(/\/([a-zA-Z0-9]*)$/, '');
  }
}

// Custom robust ContentEditable wrapper to avoid cursor jumping and support styling/placeholders
export function BlockContentEditable({
  html,
  onChange,
  onKeyDown,
  onKeyUp,
  onBlur,
  onFocus,
  placeholder,
  className,
  id,
  autoFocus,
  style
}: {
  html: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  autoFocus?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const displayHtml = isFocused ? html : compileMarkdownToHtml(html);
  const lastHtml = useRef(displayHtml);

  const cleanHTMLForComparison = (str: string): string => {
    return (str || '')
      .replace(/&nbsp;/g, ' ')
      .replace(/<br\s*\/?>$/i, '')
      .trim();
  };

  // Keep ref content in sync with external state only if external state changes from the outside
  useEffect(() => {
    if (ref.current) {
      // If the innerHTML is currently empty, but there is content to show, populate it (handles initial mount)
      const isEmptyOnMount = ref.current.innerHTML === "" && displayHtml !== "";
      if (isEmptyOnMount) {
        ref.current.innerHTML = displayHtml;
        lastHtml.current = displayHtml;
        return;
      }

      if (displayHtml === lastHtml.current) {
        return;
      }
      const cleanInput = cleanHTMLForComparison(ref.current.innerHTML);
      const cleanHtml = cleanHTMLForComparison(displayHtml);
      
      if (cleanInput !== cleanHtml) {
        ref.current.innerHTML = displayHtml;
        lastHtml.current = displayHtml;
      }
    }
  }, [displayHtml]);

  useEffect(() => {
    if (autoFocus && ref.current) {
      if (document.activeElement !== ref.current) {
        ref.current.focus();
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }, [autoFocus]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newHtml = e.currentTarget.innerHTML;
    lastHtml.current = newHtml;
    onChange(newHtml);
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div
      ref={ref}
      id={id}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={`${className} relative focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400/60 empty:before:absolute empty:before:pointer-events-none empty:before:italic`}
      style={{ outline: 'none', minWidth: '100%', ...style }}
      data-placeholder={placeholder}
    />
  );
}

function getYouTubeEmbedId(url: string): string {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
}

const localVideoFilesCache: Record<string, string> = {};
const localAudioFilesCache: Record<string, string> = {};

function getMusicEmbedUrl(url: string): { embedUrl: string; provider: 'spotify' | 'apple' | 'soundcloud' | 'direct' | 'unknown' } {
  if (!url) return { embedUrl: '', provider: 'unknown' };
  
  // Spotify
  if (url.includes('spotify.com')) {
    const match = url.match(/spotify\.com\/(embed\/)?(track|playlist|album|artist|show|episode)\/([a-zA-Z0-9]+)/);
    if (match) {
      const type = match[2];
      const id = match[3];
      return {
        embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`,
        provider: 'spotify'
      };
    }
  }
  
  // Apple Music
  if (url.includes('music.apple.com')) {
    let embedUrl = url.replace('music.apple.com', 'embed.music.apple.com');
    // Ensure embed is in url
    if (!embedUrl.includes('embed.')) {
      embedUrl = embedUrl.replace('://music.', '://embed.music.');
    }
    return {
      embedUrl,
      provider: 'apple'
    };
  }
  
  // SoundCloud
  if (url.includes('soundcloud.com')) {
    return {
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
      provider: 'soundcloud'
    };
  }

  // Direct Audio Extensions or simple URL fallback
  if (url.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i)) {
    return {
      embedUrl: url,
      provider: 'direct'
    };
  }

  return {
    embedUrl: url,
    provider: 'unknown'
  };
}

interface NotionBlockEditorProps {
  blocks: JournalBlock[];
  onChange: (updatedBlocks: JournalBlock[]) => void;
  showToast: (msg: string) => void;
  onAddImageToScrapbook?: (url: string) => void;
}

export default function NotionBlockEditor({ 
  blocks, 
  onChange, 
  showToast,
  onAddImageToScrapbook
}: NotionBlockEditorProps) {
  // Undo/Redo Stacks
  const [history, setHistory] = useState<JournalBlock[][]>([]);
  const [redoHistory, setRedoHistory] = useState<JournalBlock[][]>([]);
  
  // Local Clipboard block state
  const [clipboardBlock, setClipboardBlock] = useState<JournalBlock | null>(null);
  
  // Active slash command block identifier
  const [slashCommandBlockId, setSlashCommandBlockId] = useState<string | null>(null);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [activeMenuBlockId, setActiveMenuBlockId] = useState<string | null>(null);

  // Reset selected slash index whenever active command or query changes
  useEffect(() => {
    setSlashSelectedIndex(0);
  }, [slashQuery, slashCommandBlockId]);

  const COMMANDS = [
    { type: 'paragraph', label: 'Plain Text', desc: 'Plain writing text area', icon: <FileText size={13} className="text-gray-500" /> },
    { type: 'h1', label: 'Heading 1', desc: 'Large title style', icon: <span className="font-extrabold text-[10px] text-gray-700">H1</span> },
    { type: 'h2', label: 'Heading 2', desc: 'Medium subsection title', icon: <span className="font-bold text-[10px] text-gray-500">H2</span> },
    { type: 'h3', label: 'Heading 3', desc: 'Small helper subheading', icon: <span className="font-semibold text-[9px] text-gray-400">H3</span> },
    { type: 'bullet', label: 'Bullet list', desc: 'Traditional list points', icon: <List size={13} className="text-gray-500" /> },
    { type: 'number', label: 'Numbered list', desc: 'Self numbering lists', icon: <ListOrdered size={13} className="text-gray-500" /> },
    { type: 'todo', label: 'Checklist task', desc: 'Interactive todos', icon: <CheckSquare size={13} className="text-gray-500" /> },
    { type: 'toggle', label: 'Toggle list', desc: 'Collapsible header point', icon: <ChevronRight size={13} className="text-gray-500" /> },
    { type: 'quote', label: 'Quote block', desc: 'Beautiful indented thoughts', icon: <span className="text-sm font-serif">“</span> },
    { type: 'divider', label: 'Divider line', desc: 'Visual partition break', icon: <span className="text-xs">―</span> },
    { type: 'gallery', label: 'Photo gallery', desc: 'Custom photo grid & frame', icon: <span className="text-xs">🖼️</span> },
    { type: 'voice', label: 'Voice memo', desc: 'Animated recording visual player', icon: <Mic size={13} className="text-cozy-orange" /> },
    { type: 'audio', label: 'Audio sounds', desc: 'Play ambient track lists', icon: <span className="text-xs">♫</span> },
    { type: 'video', label: 'Video player', desc: 'Simulated video progress clip', icon: <span className="text-xs">▶</span> },
    { type: 'table', label: 'Table sheet', desc: 'Editable 2D cell grids', icon: <Table2 size={12} className="text-gray-500" /> },
  ];

  const getFilteredCommands = (query: string) => {
    return COMMANDS.filter(cmd => 
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.type.toLowerCase().includes(query.toLowerCase())
    );
  };
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  // Drag and Drop states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragDropPosition, setDragDropPosition] = useState<'above' | 'below' | 'inside' | 'outside' | null>(null);

  // Audio simulation states
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);

  // Sticker Selector State
  const [activeStickerSelectorId, setActiveStickerSelectorId] = useState<string | null>(null);

  // Emoji Selector State
  const [activeEmojiSelectorId, setActiveEmojiSelectorId] = useState<string | null>(null);

  // Helper: Commit a state to history and notify parent
  const updateBlocksWithHistory = (newBlocks: JournalBlock[]) => {
    setHistory(prev => [...prev.slice(-49), blocks]); // Cap at 50 undo states
    setRedoHistory([]);
    onChange(newBlocks);
  };

  // Undo / Redo triggers
  const handleUndo = () => {
    if (history.length === 0) {
      showToast("Nothing to undo");
      return;
    }
    const previous = history[history.length - 1];
    setRedoHistory(prev => [...prev, blocks]);
    setHistory(prev => prev.slice(0, -1));
    onChange(previous);
    showToast("Undo applied");
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) {
      showToast("Nothing to redo");
      return;
    }
    const next = redoHistory[redoHistory.length - 1];
    setHistory(prev => [...prev, blocks]);
    setRedoHistory(prev => prev.slice(0, -1));
    onChange(next);
    showToast("Redo applied");
  };

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blocks, history, redoHistory]);

  // Block Content Mutator
  const updateBlockContent = (blockId: string, content: string) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, content } : b);
    onChange(updated); // direct update without cluttering undo state during rapid typing
  };

  // General Block Fields Mutator
  const updateBlock = (blockId: string, updatedFields: Partial<JournalBlock>) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, ...updatedFields } : b);
    onChange(updated);
  };

  // Apply rich-text HTML formatting to active text selection
  const applyFormattingToSelection = (
    blockId: string,
    formatType: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'highlight' | 'code' | 'link' | 'mention' | 'color' | 'bg',
    optionValue?: string
  ) => {
    const el = document.getElementById(`input-${blockId}`);
    if (!el) return;

    // Ensure the element is focused
    el.focus();

    switch (formatType) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'strikethrough':
        document.execCommand('strikeThrough', false);
        break;
      case 'highlight':
        document.execCommand('hiliteColor', false, optionValue || '#FFF59D');
        break;
      case 'code':
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const selectedText = range.toString();
          const codeEl = document.createElement('code');
          codeEl.className = 'font-mono bg-gray-100 text-rose-600 px-1 py-0.5 rounded text-xs';
          codeEl.textContent = selectedText || 'code';
          range.deleteContents();
          range.insertNode(codeEl);
        }
        break;
      case 'link':
        const url = optionValue || prompt("Enter Link URL:", "https://");
        if (url) {
          document.execCommand('createLink', false, url);
          const sel = window.getSelection();
          if (sel && sel.anchorNode) {
            let parent = sel.anchorNode.parentElement;
            while (parent && parent.tagName !== 'A' && parent !== el) {
              parent = parent.parentElement;
            }
            if (parent && parent.tagName === 'A') {
              parent.className = 'text-cozy-accent underline hover:text-[#EF9A7A] transition';
              parent.setAttribute('target', '_blank');
              parent.setAttribute('rel', 'noopener noreferrer');
            }
          }
        }
        break;
      case 'mention':
        const name = optionValue || prompt("Enter person or tag name:", "");
        if (name) {
          const cleanName = name.replace(/^@/, '');
          const htmlStr = `<span class="bg-[#EF9A7A]/10 text-[#EF9A7A] hover:bg-[#EF9A7A]/20 font-bold px-1.5 py-0.5 rounded-lg text-xs cursor-pointer inline-flex items-center gap-0.5">@${cleanName}</span>`;
          document.execCommand('insertHTML', false, htmlStr);
        }
        break;
      case 'color':
        const textColor = optionValue || prompt("Enter color (e.g. red, #E11D48):", "red");
        if (textColor) {
          document.execCommand('foreColor', false, textColor);
        }
        break;
      case 'bg':
        const bgColor = optionValue || prompt("Enter background color (e.g. yellow, #FDE68A):", "yellow");
        if (bgColor) {
          document.execCommand('hiliteColor', false, bgColor);
        }
        break;
    }

    // Trigger update on contentEditable div manually to sync with React state
    const updatedHtml = el.innerHTML;
    updateBlockContent(blockId, updatedHtml);
  };

  const renderToolbar = (blockId: string) => {
    return (
      <div 
        className="absolute -top-11 left-0 bg-white border-2 border-cozy-text-dark rounded-xl shadow-lg px-2 py-1 flex items-center gap-1 z-30 animate-in fade-in slide-in-from-bottom-1 duration-150 font-sans text-xs"
        onMouseDown={(e) => e.preventDefault()} // Keeps keyboard focus active
      >
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'bold')}
          className="px-1.5 py-0.5 hover:bg-[#E2D1C3]/30 rounded font-bold text-cozy-text-dark"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'italic')}
          className="px-1.5 py-0.5 hover:bg-[#E2D1C3]/30 rounded italic text-cozy-text-dark"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'underline')}
          className="px-1.5 py-0.5 hover:bg-[#E2D1C3]/30 rounded underline text-cozy-text-dark"
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'strikethrough')}
          className="px-1.5 py-0.5 hover:bg-[#E2D1C3]/30 rounded line-through text-cozy-text-dark"
          title="Strikethrough"
        >
          S
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'highlight')}
          className="p-1 hover:bg-amber-100 rounded text-amber-700 font-semibold"
          title="Highlight (==text==)"
        >
          🖍️
        </button>
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'code')}
          className="p-1 hover:bg-gray-100 rounded text-rose-600 font-mono text-[10px]"
          title="Code"
        >
          &lt;/&gt;
        </button>
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'link')}
          className="p-1 hover:bg-[#E2D1C3]/30 rounded text-cozy-accent"
          title="Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'mention')}
          className="p-1 hover:bg-[#EF9A7A]/10 rounded text-[#EF9A7A]"
          title="Mention User (@)"
        >
          👤
        </button>
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'color', 'red')}
          className="w-3.5 h-3.5 rounded-full bg-red-500 hover:scale-110 transition border border-black/10 cursor-pointer"
          title="Red text"
        />
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'color', '#3B82F6')}
          className="w-3.5 h-3.5 rounded-full bg-blue-500 hover:scale-110 transition border border-black/10 cursor-pointer"
          title="Blue text"
        />
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'color', '#10B981')}
          className="w-3.5 h-3.5 rounded-full bg-emerald-500 hover:scale-110 transition border border-black/10 cursor-pointer"
          title="Green text"
        />
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'bg', '#FFF9C4')}
          className="px-1 hover:bg-yellow-100 rounded text-[9px] border border-gray-300 text-gray-700 font-bold"
          title="Yellow Background"
        >
          bg
        </button>
        <button
          type="button"
          onClick={() => applyFormattingToSelection(blockId, 'bg', '#FEE2E2')}
          className="px-1 hover:bg-red-100 rounded text-[9px] border border-gray-300 text-gray-700 font-bold"
          title="Red Background"
        >
          bg
        </button>
      </div>
    );
  };

  // Save content state to history specifically on text-field blur or Enter
  const commitBlockContentToHistory = () => {
    setHistory(prev => [...prev.slice(-49), blocks]);
    setRedoHistory([]);
  };

  // Checkbox toggle mutator
  const toggleTodo = (blockId: string) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, completed: !b.completed } : b);
    updateBlocksWithHistory(updated);
  };

  // Delete Block with fallback prevention
  const deleteBlock = (blockId: string) => {
    if (blockId === 'b-title') {
      showToast("Cannot delete Title block");
      return;
    }
    const updated = blocks.filter(b => b.id !== blockId);
    updateBlocksWithHistory(updated);
    setActiveMenuBlockId(null);
    showToast("Block deleted");
  };

  // Insert a clean empty writing paragraph below index
  const insertBlockBelow = (index: number) => {
    const newBlock: JournalBlock = {
      id: `b-new-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'paragraph',
      content: '',
      indent: blocks[index]?.indent || 0
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, newBlock);
    updateBlocksWithHistory(updated);
    setActiveMenuBlockId(null);
    
    setTimeout(() => {
      const el = document.getElementById(`input-${newBlock.id}`);
      if (el) el.focus();
    }, 60);
  };

  // Duplicate Block (deep cloned properties)
  const duplicateBlock = (index: number) => {
    const original = blocks[index];
    const newBlock: JournalBlock = {
      ...original,
      id: `b-dup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      meta: original.meta ? JSON.parse(JSON.stringify(original.meta)) : undefined
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, newBlock);
    updateBlocksWithHistory(updated);
    setActiveMenuBlockId(null);
    showToast(`Duplicated ${original.type} block`);
  };

  // Copy Block Content to Local State Clipboard
  const copyBlock = (block: JournalBlock) => {
    setClipboardBlock(JSON.parse(JSON.stringify(block)));
    setActiveMenuBlockId(null);
    showToast(`Copied ${block.type} to clipboard`);
  };

  // Paste Local Clipboard block below index
  const pasteBlockBelow = (index: number) => {
    if (!clipboardBlock) {
      showToast("Clipboard is empty");
      return;
    }
    const newBlock: JournalBlock = {
      ...clipboardBlock,
      id: `b-pasted-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      indent: blocks[index]?.indent || 0
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, newBlock);
    updateBlocksWithHistory(updated);
    setActiveMenuBlockId(null);
    showToast(`Pasted ${newBlock.type}`);
  };

  // Move block up
  const moveBlockUp = (index: number) => {
    if (index <= 1) return;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    updateBlocksWithHistory(updated);
    setActiveMenuBlockId(null);
  };

  // Move block down
  const moveBlockDown = (index: number) => {
    if (index === 0 || index >= blocks.length - 1) return;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    updateBlocksWithHistory(updated);
    setActiveMenuBlockId(null);
  };

  // Nest / Indent (tab key or UI command)
  const nestBlock = (index: number) => {
    if (index === 0) return;
    const updated = blocks.map((b, idx) => {
      if (idx === index) {
        return { ...b, indent: Math.min((b.indent || 0) + 1, 4) };
      }
      return b;
    });
    updateBlocksWithHistory(updated);
    setActiveMenuBlockId(null);
  };

  // Unnest / Outdent (shift+tab or UI command)
  const unnestBlock = (index: number) => {
    if (index === 0) return;
    const updated = blocks.map((b, idx) => {
      if (idx === index) {
        return { ...b, indent: Math.max((b.indent || 0) - 1, 0) };
      }
      return b;
    });
    updateBlocksWithHistory(updated);
    setActiveMenuBlockId(null);
  };

  // Convert block to another type seamlessly
  const convertBlockType = (index: number, newType: JournalBlock['type']) => {
    const updated = blocks.map((b, idx) => {
      if (idx === index) {
        // Initialize appropriate metadata for complex blocks
        let meta = b.meta;
        if (newType === 'table') {
          meta = {
            cols: ['Column 1', 'Column 2', 'Column 3'],
            rows: [
              ['', '', ''],
              ['', '', ''],
            ]
          };
        } else if (newType === 'gallery' || newType === 'image') {
          meta = {
            urls: []
          };
        }

        return {
          ...b,
          type: newType,
          completed: newType === 'todo' ? false : undefined,
          collapsed: newType === 'toggle' ? false : undefined,
          meta
        };
      }
      return b;
    });
    updateBlocksWithHistory(updated);
    setActiveMenuBlockId(null);
    setSlashCommandBlockId(null);
    showToast(`Converted to ${newType}`);
  };

  // Slash Command Trigger Executor
  const executeSlashCommand = (blockId: string, type: JournalBlock['type']) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    // Clear the '/' string and convert
    const originalBlock = blocks[blockIndex];
    let newContent = removeTrailingSlashCommand(originalBlock.content, slashQuery).trim();
    
    const updated = blocks.map((b, idx) => {
      if (idx === blockIndex) {
        let meta = undefined;
        if (type === 'table') {
          meta = {
            cols: ['Column 1', 'Column 2', 'Column 3'],
            rows: [
              ['', '', ''],
              ['', '', ''],
            ]
          };
        } else if (type === 'gallery' || type === 'image') {
          meta = {
            urls: []
          };
        } else if (type === 'quote') {
          newContent = newContent || 'In quietude, the voice finds its nest.';
        }

        return {
          ...b,
          type,
          content: newContent,
          completed: type === 'todo' ? false : undefined,
          collapsed: type === 'toggle' ? false : undefined,
          meta
        };
      }
      return b;
    });

    updateBlocksWithHistory(updated);
    setSlashCommandBlockId(null);
    showToast(`Inserted ${type}`);

    setTimeout(() => {
      const el = document.getElementById(`input-${blockId}`);
      if (el) el.focus();
    }, 60);
  };

  // Title block key listeners
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const bodyBlocks = blocks.filter(b => b.id !== 'b-title');
      if (bodyBlocks.length === 0) {
        insertBlockBelow(0);
      } else {
        const el = document.getElementById(`input-${bodyBlocks[0].id}`);
        if (el) el.focus();
      }
    }
  };

  const isContentEmpty = (content: string) => {
    if (!content) return true;
    const stripped = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return stripped === '';
  };

  const isSelectionAtStart = (): boolean => {
    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      const activeEl = document.activeElement;
      if (!activeEl) return false;
      preCaretRange.selectNodeContents(activeEl);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const textBefore = preCaretRange.toString();
      return textBefore.length === 0;
    } catch (e) {
      return false;
    }
  };

  const isSelectionAtEnd = (): boolean => {
    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      const range = sel.getRangeAt(0);
      const postCaretRange = range.cloneRange();
      const activeEl = document.activeElement;
      if (!activeEl) return false;
      postCaretRange.selectNodeContents(activeEl);
      postCaretRange.setStart(range.endContainer, range.endOffset);
      const textAfter = postCaretRange.toString();
      return textAfter.length === 0;
    } catch (e) {
      return false;
    }
  };

  // General block key down triggers (Enter, Backspace, Tab)
  const handleBlockKeyDown = (
    blockId: string, 
    e: React.KeyboardEvent<any>, 
    index: number
  ) => {
    const currentBlock = blocks[index];

    // Keyboard support for active slash command menu
    if (slashCommandBlockId === blockId) {
      const filtered = getFilteredCommands(slashQuery);
      if (filtered.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSlashSelectedIndex(prev => (prev + 1) % filtered.length);
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSlashSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
          return;
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selectedCmd = filtered[slashSelectedIndex];
          if (selectedCmd) {
            executeSlashCommand(blockId, selectedCmd.type as any);
          }
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setSlashCommandBlockId(null);
          return;
        }
      }
    }

    // Ctrl/Cmd + D for Duplicate Block
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      duplicateBlock(index);
      return;
    }

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter creates a line break inside the current block, letting standard browser behavior take over
        return;
      }
      e.preventDefault();
      commitBlockContentToHistory();
      
      let nextType: JournalBlock['type'] = 'paragraph';
      let nextIndent = currentBlock.indent || 0;
      let insertIndex = index + 1;

      if (currentBlock.type === 'toggle') {
        if (!currentBlock.collapsed) {
          // If expanded, insert a new nested paragraph block inside the toggle
          nextType = 'paragraph';
          nextIndent = Math.min((currentBlock.indent || 0) + 1, 4);
          insertIndex = index + 1;
        } else {
          // If collapsed, insert a new toggle block at the same level, after all of its nested children
          nextType = 'toggle';
          nextIndent = currentBlock.indent || 0;
          
          // Find the last index of nested children
          let lastChildIndex = index;
          for (let i = index + 1; i < blocks.length; i++) {
            if ((blocks[i].indent || 0) > (currentBlock.indent || 0)) {
              lastChildIndex = i;
            } else {
              break;
            }
          }
          insertIndex = lastChildIndex + 1;
        }
      } else {
        // Keep lists rolling if Enter is pressed on an existing bullet, todo, or number
        nextType = (currentBlock.type === 'todo' || currentBlock.type === 'bullet' || currentBlock.type === 'number') 
          ? currentBlock.type 
          : 'paragraph';
        nextIndent = currentBlock.indent || 0;
        insertIndex = index + 1;
      }

      const newBlock: JournalBlock = {
        id: `b-new-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: nextType,
        content: '',
        completed: nextType === 'todo' ? false : undefined,
        collapsed: nextType === 'toggle' ? false : undefined,
        indent: nextIndent
      };

      const updated = [...blocks];
      updated.splice(insertIndex, 0, newBlock);
      onChange(updated); // Update parent

      setTimeout(() => {
        const el = document.getElementById(`input-${newBlock.id}`);
        if (el) el.focus();
      }, 50);

    } else if (e.key === 'Backspace') {
      const isEmpty = isContentEmpty(currentBlock.content);
      const isAtStart = isSelectionAtStart();

      if (isEmpty) {
        e.preventDefault();
        commitBlockContentToHistory();

        // Backspace inside empty nested block outdents it first
        if (currentBlock.indent && currentBlock.indent > 0) {
          unnestBlock(index);
          return;
        }

        // If indent is 0, delete block and focus preceding one
        if (blocks.length > 1 && blockId !== 'b-title') {
          const updated = blocks.filter(b => b.id !== blockId);
          onChange(updated);

          if (index > 0) {
            setTimeout(() => {
              const prevBlock = blocks[index - 1];
              const el = document.getElementById(`input-${prevBlock.id}`);
              if (el) {
                el.focus();
                // Position cursor at end of the previous block
                const sel = window.getSelection();
                if (sel) {
                  const range = document.createRange();
                  range.selectNodeContents(el);
                  range.collapse(false);
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
              }
            }, 50);
          }
        }
      } else if (isAtStart && index > 0) {
        // Merge block with preceding block if cursor is at start and it's not empty
        e.preventDefault();
        commitBlockContentToHistory();

        const prevBlock = blocks[index - 1];
        const TEXT_BLOCK_TYPES = ['paragraph', 'h1', 'h2', 'h3', 'quote', 'bullet', 'number', 'todo', 'toggle'];

        if (TEXT_BLOCK_TYPES.includes(prevBlock.type) && TEXT_BLOCK_TYPES.includes(currentBlock.type)) {
          // Merge current block content into previous block
          const originalPrevContent = prevBlock.content;
          const mergedContent = originalPrevContent + currentBlock.content;

          const updated = blocks.map((b, idx) => {
            if (idx === index - 1) {
              return { ...b, content: mergedContent };
            }
            return b;
          }).filter((_, idx) => idx !== index);

          onChange(updated);

          setTimeout(() => {
            const el = document.getElementById(`input-${prevBlock.id}`);
            if (el) {
              el.focus();
              // Position cursor at the boundary/split of original contents
              const sel = window.getSelection();
              if (sel) {
                const range = document.createRange();
                // To be robust and precise, find the text node or element corresponding to the start of currentBlock's appended content
                // Or simply collapse to end of previous text length
                range.selectNodeContents(el);
                // Simple collapse to end is extremely robust and avoids node split mismatch errors
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }
          }, 50);
        } else {
          // If previous block is a special non-text block (e.g. image, voice, table), just focus it
          const el = document.getElementById(`input-${prevBlock.id}`);
          if (el) el.focus();
        }
      }
    } else if (e.key === 'ArrowUp') {
      if (isSelectionAtStart()) {
        e.preventDefault();
        if (index > 0) {
          const prevBlock = blocks[index - 1];
          const el = document.getElementById(`input-${prevBlock.id}`);
          if (el) {
            el.focus();
            setTimeout(() => {
              const sel = window.getSelection();
              if (sel) {
                const range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }, 10);
          }
        } else {
          // Focus title if at first block
          const titleEl = document.getElementById('input-b-title') || document.querySelector('input[placeholder="Untitled Entry"]');
          if (titleEl) {
            (titleEl as HTMLInputElement).focus();
          }
        }
      }
    } else if (e.key === 'ArrowDown') {
      if (isSelectionAtEnd()) {
        e.preventDefault();
        if (index < blocks.length - 1) {
          const nextBlock = blocks[index + 1];
          const el = document.getElementById(`input-${nextBlock.id}`);
          if (el) {
            el.focus();
            setTimeout(() => {
              const sel = window.getSelection();
              if (sel) {
                const range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }, 10);
          }
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitBlockContentToHistory();
      if (e.shiftKey) {
        unnestBlock(index);
      } else {
        nestBlock(index);
      }
    }
  };

  // Listening for command slash '/' trigger
  const handleKeyUp = (blockId: string, e: React.KeyboardEvent<any>) => {
    let value = e.currentTarget.textContent || (e.target as any).value || '';
    value = value.replace(/\u00a0/g, ' ');
    const match = value.match(/\/([a-zA-Z0-9]*)$/);
    if (match) {
      setSlashCommandBlockId(blockId);
      setSlashQuery(match[1]);
    } else {
      setSlashCommandBlockId(null);
    }
  };

  // Drag-and-Drop handling
  const getDescendantCount = (idx: number, blocksList: JournalBlock[]): number => {
    if (idx < 0 || idx >= blocksList.length) return 0;
    const parentIndent = blocksList[idx].indent || 0;
    let count = 0;
    for (let i = idx + 1; i < blocksList.length; i++) {
      const nextIndent = blocksList[i].indent || 0;
      if (nextIndent > parentIndent) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  const isDescendantOrSelf = (parentIndex: number, targetIndex: number, blocksList: JournalBlock[]): boolean => {
    if (parentIndex === targetIndex) return true;
    if (parentIndex < 0 || parentIndex >= blocksList.length) return false;
    const parentIndent = blocksList[parentIndex].indent || 0;
    for (let i = parentIndex + 1; i < blocksList.length; i++) {
      const nextIndent = blocksList[i].indent || 0;
      if (nextIndent > parentIndent) {
        if (i === targetIndex) return true;
      } else {
        break;
      }
    }
    return false;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (index === 0) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (index === 0) return; // Cannot drag over title
    if (draggedIndex === null) return;
    
    // Ignore if target is inside the dragged block's subtree (including itself)
    if (isDescendantOrSelf(draggedIndex, index, blocks)) {
      setDragOverIndex(null);
      setDragDropPosition(null);
      return;
    }

    setDragOverIndex(index);

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const relativeX = e.clientX - rect.left;
    const height = rect.height;

    const targetBlock = blocks[index];
    const targetIndent = targetBlock.indent || 0;
    const startOfText = targetIndent * 24 + 32;

    let position: 'above' | 'below' | 'inside' | 'outside' = 'below';
    if (relativeY < height * 0.3) {
      position = 'above';
    } else {
      // If dragging far right relative to start of text of target
      if (relativeX > startOfText + 60) {
        position = 'inside';
      } else if (relativeX < startOfText - 10 && targetIndent > 0) {
        position = 'outside';
      } else {
        position = 'below';
      }
    }

    setDragDropPosition(position);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || index === 0) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDragDropPosition(null);
      return;
    }

    // Ignore if target is inside the dragged block's subtree (including itself)
    if (isDescendantOrSelf(draggedIndex, index, blocks)) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDragDropPosition(null);
      return;
    }

    const position = dragDropPosition || 'below';

    const updated = [...blocks];
    const descendantCount = getDescendantCount(draggedIndex, blocks);
    
    // Splice the entire subtree out of the updated list
    const draggedSubtree = updated.splice(draggedIndex, descendantCount + 1);

    // Find the target block in the remaining updated list
    const targetBlock = blocks[index];
    const targetIndexInUpdated = updated.findIndex(b => b.id === targetBlock.id);

    if (targetIndexInUpdated === -1) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDragDropPosition(null);
      return;
    }

    // Adjust the indentation of all dragged blocks by the change in parent indentation
    const oldParentIndent = blocks[draggedIndex].indent || 0;
    const targetIndent = targetBlock.indent || 0;

    let newParentIndent = targetIndent;
    if (position === 'inside') {
      newParentIndent = targetIndent + 1;
    } else if (position === 'outside') {
      newParentIndent = Math.max(0, targetIndent - 1);
    }

    const diff = newParentIndent - oldParentIndent;
    const adjustedSubtree = draggedSubtree.map(block => ({
      ...block,
      indent: Math.max(0, (block.indent || 0) + diff)
    }));

    // Find final insertion index
    let finalInsertionIndex = targetIndexInUpdated;
    if (position === 'above') {
      finalInsertionIndex = targetIndexInUpdated;
    } else {
      // below, inside, outside -> after the target block's subtree
      const targetDescendantCount = getDescendantCount(targetIndexInUpdated, updated);
      finalInsertionIndex = targetIndexInUpdated + targetDescendantCount + 1;
    }

    // Insert the adjusted subtree back into updated array
    updated.splice(finalInsertionIndex, 0, ...adjustedSubtree);

    updateBlocksWithHistory(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragDropPosition(null);
    showToast("Moved block hierarchy");
  };

  // Calculate bullet numbering recursively based on consecutive sibling indents
  const getNumberedListIndex = (index: number) => {
    let position = 1;
    const currentIndent = blocks[index].indent || 0;
    for (let i = index - 1; i >= 0; i--) {
      const b = blocks[i];
      if (b.type === 'number') {
        const precedingIndent = b.indent || 0;
        if (precedingIndent === currentIndent) {
          position++;
        } else if (precedingIndent < currentIndent) {
          break; // Stop climbing if we enter parent nesting
        }
      } else {
        break; // Stop climbing if numbering block chain breaks
      }
    }
    return position;
  };

  // Expand / Collapse hierarchy filtration calculation
  const getHiddenBlockIdsSet = (): Set<string> => {
    const hiddenSet = new Set<string>();
    let collapseCheckIndentLevel: number | null = null;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const currentIndent = b.indent || 0;

      if (collapseCheckIndentLevel !== null) {
        if (currentIndent > collapseCheckIndentLevel) {
          hiddenSet.add(b.id);
          continue;
        } else {
          collapseCheckIndentLevel = null;
        }
      }

      if (b.type === 'toggle' && b.collapsed) {
        collapseCheckIndentLevel = currentIndent;
      }
    }
    return hiddenSet;
  };

  const hiddenBlockIds = getHiddenBlockIdsSet();

  // Simulated audio playback progression for voice/audio blocks
  const handleToggleAudioSimulation = (id: string) => {
    if (isPlayingAudio === id) {
      setIsPlayingAudio(null);
      setAudioProgress(0);
    } else {
      setIsPlayingAudio(id);
      setAudioProgress(5);
      const interval = setInterval(() => {
        setAudioProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setIsPlayingAudio(null);
            return 0;
          }
          return p + 10;
        });
      }, 500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Blocks canvas Loop */}
      <div className="space-y-1">
        {blocks.map((block, index) => {
          // If nested under a collapsed toggle, skip rendering
          if (hiddenBlockIds.has(block.id)) return null;

          const isSlashActive = slashCommandBlockId === block.id;
          const indentLevel = block.indent || 0;
          const isMenuOpen = activeMenuBlockId === block.id;

          return (
            <div 
              key={block.id}
              id={`block-${block.id}`}
              draggable={index > 0}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => {
                setDragOverIndex(null);
                setDragDropPosition(null);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
                setDragDropPosition(null);
              }}
              onDrop={(e) => handleDrop(e, index)}
              className={`group/block relative flex items-start gap-1 py-1 rounded-xl transition duration-150 ${
                dragOverIndex === index ? 'bg-[#D28C5C]/5' : ''
              } ${index === 0 ? 'mt-2' : ''}`}
              style={{ paddingLeft: `${Math.max(4, indentLevel * 24 + 48)}px` }}
            >
              {/* Drop target indicator lines */}
              {dragOverIndex === index && dragDropPosition && (
                <div 
                  className="absolute left-0 right-0 h-[3px] bg-[#D28C5C] rounded-full z-30 pointer-events-none transition-all duration-100"
                  style={{ 
                    top: dragDropPosition === 'above' ? '-1.5px' : 'auto', 
                    bottom: dragDropPosition !== 'above' ? '-1.5px' : 'auto',
                    marginLeft: `${
                      dragDropPosition === 'inside' 
                        ? Math.max(4, (indentLevel + 1) * 24 + 48) 
                        : dragDropPosition === 'outside' 
                          ? Math.max(4, Math.max(0, indentLevel - 1) * 24 + 48) 
                          : Math.max(4, indentLevel * 24 + 48)
                    }px` 
                  }}
                />
              )}
              {/* SIDE GRIP ACTIONS TRIGGERBAR */}
              {index > 0 && (
                <div className="absolute left-0 top-1.5 flex items-center gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
                  <button
                    type="button"
                    onClick={() => insertBlockBelow(index)}
                    className="p-1 hover:bg-[#E2D1C3]/50 rounded text-cozy-text-muted hover:text-cozy-text-dark transition cursor-pointer"
                    title="Add block below"
                  >
                    <Plus size={11} strokeWidth={2.5} />
                  </button>
                  
                  {/* Grip Vertical Menu Indicator */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuBlockId(isMenuOpen ? null : block.id)}
                      className={`p-1 hover:bg-[#E2D1C3]/50 rounded text-cozy-text-muted hover:text-cozy-text-dark transition cursor-pointer ${isMenuOpen ? 'bg-[#E2D1C3]/60 text-cozy-text-dark' : ''}`}
                      title="Block Actions & Transform"
                    >
                      <GripVertical size={11} strokeWidth={2.5} />
                    </button>

                    {/* Rich Action & Transform Dropdown */}
                    <AnimatePresence>
                      {isMenuOpen && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          className="absolute left-0 mt-1 bg-white border-2 border-cozy-text-dark rounded-xl shadow-xl w-48 py-1 z-30 font-sans text-xs text-cozy-text-dark"
                        >
                          <div className="px-3 py-1 bg-[#FDF8F1] border-b border-[#E2D1C3]/40 text-[10px] font-bold text-cozy-text-muted uppercase">
                            Block Actions
                          </div>
                          
                          <button 
                            onClick={() => deleteBlock(block.id)}
                            className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                          >
                            <Trash2 size={12} />
                            <span>Delete Block</span>
                          </button>
                          
                          <button 
                            onClick={() => duplicateBlock(index)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#FDF8F1] flex items-center gap-2"
                          >
                            <Layers size={12} />
                            <span>Duplicate</span>
                          </button>

                          <button 
                            onClick={() => copyBlock(block)}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#FDF8F1] flex items-center gap-2"
                          >
                            <Copy size={12} />
                            <span>Copy Block</span>
                          </button>

                          <button 
                            onClick={() => pasteBlockBelow(index)}
                            disabled={!clipboardBlock}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#FDF8F1] disabled:opacity-40 flex items-center gap-2"
                          >
                            <CornerDownRight size={12} />
                            <span>Paste Below</span>
                          </button>

                          <div className="border-t border-[#E2D1C3]/40 my-1" />

                          <div className="px-3 py-1 text-[10px] font-bold text-cozy-text-muted uppercase">
                            Reorder & Depth
                          </div>

                          <div className="grid grid-cols-2 gap-1 px-2 py-1">
                            <button 
                              disabled={index <= 1}
                              onClick={() => moveBlockUp(index)}
                              className="px-2 py-1 text-center bg-[#FDF8F1] hover:bg-[#E2D1C3]/30 rounded text-[10px] font-bold border border-[#E2D1C3] disabled:opacity-30"
                            >
                              Move Up
                            </button>
                            <button 
                              disabled={index >= blocks.length - 1}
                              onClick={() => moveBlockDown(index)}
                              className="px-2 py-1 text-center bg-[#FDF8F1] hover:bg-[#E2D1C3]/30 rounded text-[10px] font-bold border border-[#E2D1C3] disabled:opacity-30"
                            >
                              Move Down
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-1 px-2 py-1">
                            <button 
                              onClick={() => nestBlock(index)}
                              className="px-2 py-1 text-center bg-[#FDF8F1] hover:bg-[#E2D1C3]/30 rounded text-[10px] font-bold border border-[#E2D1C3]"
                            >
                              Nest (Tab)
                            </button>
                            <button 
                              onClick={() => unnestBlock(index)}
                              className="px-2 py-1 text-center bg-[#FDF8F1] hover:bg-[#E2D1C3]/30 rounded text-[10px] font-bold border border-[#E2D1C3]"
                            >
                              Outdent
                            </button>
                          </div>

                          <div className="border-t border-[#E2D1C3]/40 my-1" />

                          <div className="px-3 py-1 text-[10px] font-bold text-cozy-text-muted uppercase">
                            Transform Into
                          </div>

                          <div className="max-h-28 overflow-y-auto px-1 py-1 space-y-0.5">
                            {(['paragraph', 'h1', 'h2', 'h3', 'quote', 'divider', 'bullet', 'number', 'todo', 'toggle', 'gallery', 'voice', 'audio', 'video', 'table'] as const).map(type => (
                              <button
                                key={type}
                                onClick={() => convertBlockType(index, type)}
                                className={`w-full px-2 py-1 text-left rounded capitalize text-[10px] hover:bg-[#FDF8F1] block ${
                                  block.type === type ? 'font-bold bg-[#EF9A7A]/10 text-cozy-orange' : ''
                                }`}
                              >
                                {type === 'todo' ? 'Checklist' : type === 'number' ? 'Numbered List' : type}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* GENTLE NESTING LINE DECORATOR */}
              {indentLevel > 0 && (
                <div 
                  className="absolute border-l-2 border-[#E2D1C3]/55 h-full top-0 select-none pointer-events-none"
                  style={{ left: `${indentLevel * 24 + 16}px` }}
                />
              )}

              {/* EDITING COMPONENT STAGE */}
              <div className="flex-1 w-full min-w-0 relative">
                
                {/* 1. TITLE / HEADER */}
                {block.type === 'h1' && block.id === 'b-title' && (
                  <div className="relative w-full">
                    <input
                      id="input-b-title"
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      onBlur={commitBlockContentToHistory}
                      onKeyDown={handleTitleKeyDown}
                      className="w-full text-3xl font-black font-sans tracking-tight text-cozy-text-dark bg-transparent border-none focus:outline-none focus:ring-0 py-1 font-sans placeholder-gray-300"
                      placeholder="Untitled Thought Journal..."
                    />
                  </div>
                )}

                {/* 2. HEADING 1 */}
                {block.type === 'h1' && block.id !== 'b-title' && (
                  <div className="relative w-full">
                    <BlockContentEditable
                      id={`input-${block.id}`}
                      html={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onBlur={() => {
                        commitBlockContentToHistory();
                        setTimeout(() => {
                          setFocusedBlockId(prev => prev === block.id ? null : prev);
                        }, 150);
                      }}
                      onFocus={() => setFocusedBlockId(block.id)}
                      onKeyDown={(e) => handleBlockKeyDown(block.id, e, index)}
                      onKeyUp={(e) => handleKeyUp(block.id, e)}
                      className="w-full text-2xl font-extrabold font-sans tracking-tight text-cozy-text-dark bg-transparent border-none py-1 min-h-[36px]"
                      placeholder="Heading 1"
                      autoFocus={focusedBlockId === block.id}
                    />
                    {focusedBlockId === block.id && renderToolbar(block.id)}
                  </div>
                )}

                {/* 3. HEADING 2 */}
                {block.type === 'h2' && (
                  <div className="relative w-full">
                    <BlockContentEditable
                      id={`input-${block.id}`}
                      html={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onBlur={() => {
                        commitBlockContentToHistory();
                        setTimeout(() => {
                          setFocusedBlockId(prev => prev === block.id ? null : prev);
                        }, 150);
                      }}
                      onFocus={() => setFocusedBlockId(block.id)}
                      onKeyDown={(e) => handleBlockKeyDown(block.id, e, index)}
                      onKeyUp={(e) => handleKeyUp(block.id, e)}
                      className="w-full text-xl font-bold font-sans tracking-wide text-cozy-text-dark bg-transparent border-none py-1 min-h-[32px]"
                      placeholder="Heading 2"
                      autoFocus={focusedBlockId === block.id}
                    />
                    {focusedBlockId === block.id && renderToolbar(block.id)}
                  </div>
                )}

                {/* 4. HEADING 3 */}
                {block.type === 'h3' && (
                  <div className="relative w-full">
                    <BlockContentEditable
                      id={`input-${block.id}`}
                      html={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onBlur={() => {
                        commitBlockContentToHistory();
                        setTimeout(() => {
                          setFocusedBlockId(prev => prev === block.id ? null : prev);
                        }, 150);
                      }}
                      onFocus={() => setFocusedBlockId(block.id)}
                      onKeyDown={(e) => handleBlockKeyDown(block.id, e, index)}
                      onKeyUp={(e) => handleKeyUp(block.id, e)}
                      className="w-full text-lg font-semibold font-sans text-cozy-text-dark bg-transparent border-none py-0.5 min-h-[28px]"
                      placeholder="Heading 3"
                      autoFocus={focusedBlockId === block.id}
                    />
                    {focusedBlockId === block.id && renderToolbar(block.id)}
                  </div>
                )}

                {/* 5. PARAGRAPH TEXT */}
                {block.type === 'paragraph' && (
                  <div className="relative w-full">
                    <BlockContentEditable
                      id={`input-${block.id}`}
                      html={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onBlur={() => {
                        commitBlockContentToHistory();
                        setTimeout(() => {
                          setFocusedBlockId(prev => prev === block.id ? null : prev);
                        }, 150);
                      }}
                      onFocus={() => setFocusedBlockId(block.id)}
                      onKeyDown={(e) => handleBlockKeyDown(block.id, e, index)}
                      onKeyUp={(e) => handleKeyUp(block.id, e)}
                      className="w-full text-lg font-handwriting leading-relaxed text-cozy-text-dark bg-transparent border-none py-0.5 min-h-[28px]"
                      placeholder="Type '/' for interactive components..."
                      autoFocus={focusedBlockId === block.id}
                    />
                    {focusedBlockId === block.id && renderToolbar(block.id)}
                  </div>
                )}

                {/* 6. QUOTE */}
                {block.type === 'quote' && (
                  <div className="relative w-full bg-[#FDF8F1]/60 py-2 border-l-4 border-cozy-orange pl-4 pr-3 rounded-r-xl">
                    <BlockContentEditable
                      id={`input-${block.id}`}
                      html={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onBlur={() => {
                        commitBlockContentToHistory();
                        setTimeout(() => {
                          setFocusedBlockId(prev => prev === block.id ? null : prev);
                        }, 150);
                      }}
                      onFocus={() => setFocusedBlockId(block.id)}
                      onKeyDown={(e) => handleBlockKeyDown(block.id, e, index)}
                      onKeyUp={(e) => handleKeyUp(block.id, e)}
                      className="w-full text-base font-handwriting italic text-cozy-text-dark/95 bg-transparent border-none py-0.5 min-h-[24px]"
                      placeholder="Write an elegant quote..."
                      autoFocus={focusedBlockId === block.id}
                    />
                    {focusedBlockId === block.id && renderToolbar(block.id)}
                  </div>
                )}

                {/* 7. DIVIDER */}
                {block.type === 'divider' && (
                  <div className="py-2.5 w-full cursor-default select-none">
                    <hr className="border-t border-[#E2D1C3]/60 w-full" />
                  </div>
                )}

                {/* 8. BULLET LIST */}
                {block.type === 'bullet' && (
                  <div className="relative w-full flex items-start gap-2">
                    <span className="text-cozy-orange text-xl font-sans select-none mt-1.5 leading-none shrink-0">•</span>
                    <BlockContentEditable
                      id={`input-${block.id}`}
                      html={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onBlur={() => {
                        commitBlockContentToHistory();
                        setTimeout(() => {
                          setFocusedBlockId(prev => prev === block.id ? null : prev);
                        }, 150);
                      }}
                      onFocus={() => setFocusedBlockId(block.id)}
                      onKeyDown={(e) => handleBlockKeyDown(block.id, e, index)}
                      onKeyUp={(e) => handleKeyUp(block.id, e)}
                      className="w-full text-lg font-handwriting text-cozy-text-dark bg-transparent border-none py-0.5 min-h-[28px]"
                      placeholder="Bulleted list item"
                      autoFocus={focusedBlockId === block.id}
                    />
                    {focusedBlockId === block.id && renderToolbar(block.id)}
                  </div>
                )}

                {/* 9. NUMBERED LIST */}
                {block.type === 'number' && (
                  <div className="relative w-full flex items-start gap-2">
                    <span className="text-cozy-orange font-bold font-sans text-sm select-none shrink-0 w-5 text-right mt-2 leading-none">
                      {getNumberedListIndex(index)}.
                    </span>
                    <BlockContentEditable
                      id={`input-${block.id}`}
                      html={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onBlur={() => {
                        commitBlockContentToHistory();
                        setTimeout(() => {
                          setFocusedBlockId(prev => prev === block.id ? null : prev);
                        }, 150);
                      }}
                      onFocus={() => setFocusedBlockId(block.id)}
                      onKeyDown={(e) => handleBlockKeyDown(block.id, e, index)}
                      onKeyUp={(e) => handleKeyUp(block.id, e)}
                      className="w-full text-lg font-handwriting text-cozy-text-dark bg-transparent border-none py-0.5 min-h-[28px]"
                      placeholder="List item"
                      autoFocus={focusedBlockId === block.id}
                    />
                    {focusedBlockId === block.id && renderToolbar(block.id)}
                  </div>
                )}

                {/* 10. CHECKLIST (TODO) */}
                {block.type === 'todo' && (
                  <div className="relative w-full flex items-start gap-2.5">
                    <motion.div
                      animate={{ scale: block.completed ? [1, 1.2, 1] : 1, rotate: block.completed ? [0, 10, -10, 0] : 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-1.5 shrink-0"
                    >
                      <input
                        type="checkbox"
                        checked={block.completed || false}
                        onChange={() => toggleTodo(block.id)}
                        className="w-4 h-4 rounded border-[#E2D1C3] text-[#EF9A7A] focus:ring-[#EF9A7A] focus:ring-offset-0 bg-[#FDF8F1] cursor-pointer"
                      />
                    </motion.div>
                    <BlockContentEditable
                      id={`input-${block.id}`}
                      html={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onBlur={() => {
                        commitBlockContentToHistory();
                        setTimeout(() => {
                          setFocusedBlockId(prev => prev === block.id ? null : prev);
                        }, 150);
                      }}
                      onFocus={() => setFocusedBlockId(block.id)}
                      onKeyDown={(e) => handleBlockKeyDown(block.id, e, index)}
                      onKeyUp={(e) => handleKeyUp(block.id, e)}
                      className={`w-full text-lg font-handwriting bg-transparent border-none py-0.5 min-h-[28px] ${
                        block.completed ? 'line-through opacity-50 text-cozy-text-muted' : 'text-cozy-text-dark'
                      }`}
                      placeholder="To-do checklist task..."
                      autoFocus={focusedBlockId === block.id}
                    />
                    {focusedBlockId === block.id && renderToolbar(block.id)}
                  </div>
                )}

                {/* 11. TOGGLE COLLAPSIBLE LIST */}
                {block.type === 'toggle' && (
                  <div className="relative w-full flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = blocks.map((b, i) => i === index ? { ...b, collapsed: !b.collapsed } : b);
                        updateBlocksWithHistory(updated);
                      }}
                      className="p-1.5 hover:bg-[#E2D1C3]/30 rounded-lg text-cozy-text-muted hover:text-cozy-text-dark transition shrink-0 cursor-pointer flex items-center justify-center"
                    >
                      <ChevronRight size={16} className={`transform transition-transform duration-200 ${!block.collapsed ? 'rotate-90' : ''}`} />
                    </button>
                    <BlockContentEditable
                      id={`input-${block.id}`}
                      html={block.content}
                      onChange={(val) => updateBlockContent(block.id, val)}
                      onBlur={() => {
                        commitBlockContentToHistory();
                        setTimeout(() => {
                          setFocusedBlockId(prev => prev === block.id ? null : prev);
                        }, 150);
                      }}
                      onFocus={() => setFocusedBlockId(block.id)}
                      onKeyDown={(e) => handleBlockKeyDown(block.id, e, index)}
                      onKeyUp={(e) => handleKeyUp(block.id, e)}
                      className="w-full text-base font-sans font-bold text-cozy-text-dark bg-transparent border-none py-0.5 min-h-[24px]"
                      placeholder="Toggle list header (Click arrow to expand/collapse)"
                      autoFocus={focusedBlockId === block.id}
                    />
                    {focusedBlockId === block.id && renderToolbar(block.id)}
                  </div>
                )}

                {/* 12. IMAGE / GALLERY BLOCK COMBINED */}
                {(block.type === 'gallery' || block.type === 'image') && (
                  <GalleryBlock
                    block={block}
                    index={index}
                    onUpdate={updateBlock}
                    updateBlockContent={updateBlockContent}
                    onAddImageToScrapbook={onAddImageToScrapbook}
                  />
                )}



                {/* 17. VOICE RECORDING */}
                {block.type === 'voice' && (
                  <VoiceBlock
                    block={block}
                    index={index}
                    onUpdate={updateBlock}
                    onDuplicate={duplicateBlock}
                    onDelete={deleteBlock}
                    showToast={showToast}
                  />
                )}

                {/* 18. AUDIO TRACK */}
                {block.type === 'audio' && (() => {
                  const meta = block.meta || {};
                  const isEditing = meta.isEditing !== false && (!meta.audioSource || meta.isEditing);
                  const audioSource = meta.audioSource || '';

                  return (
                    <div className="w-full bg-[#FAF9F6]/20 border border-[#E2D1C3]/60 rounded-2xl p-2 transition-all duration-300 hover:border-cozy-orange/45">
                      <div className="relative w-full bg-white border border-[#E2D1C3]/40 p-4 rounded-xl shadow-xs space-y-3 font-sans">
                        {isEditing ? (
                        <div className="space-y-4 relative w-full">
                          {meta.audioSource && (
                            <button
                              onClick={() => updateBlock(block.id, { meta: { ...meta, isEditing: false } })}
                              className="absolute top-0 right-0 p-1.5 hover:bg-cozy-text-dark/10 rounded-full text-cozy-text-dark transition cursor-pointer z-10"
                              title="Close Settings"
                            >
                              <X size={14} />
                            </button>
                          )}
                          
                          {/* Main uploader box styled exactly like photo empty state */}
                          <div 
                            onClick={() => {
                              const fileInput = document.getElementById(`audio-file-input-${block.id}`);
                              fileInput?.click();
                            }}
                            className="border border-dashed border-[#E2D1C3] bg-[#FAF8F1]/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#FAF8F1]/80 hover:border-cozy-orange/50 transition-all duration-200 min-h-[140px] space-y-2.5 group/box"
                          >
                            <div className="w-10 h-10 rounded-full bg-amber-50/80 flex items-center justify-center text-cozy-orange border border-amber-100/60 group-hover/box:scale-110 transition-transform duration-200">
                              <Music size={18} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-xs font-black text-cozy-text-dark block uppercase tracking-wide font-mono">Add your music</span>
                              <span className="text-[10px] text-cozy-text-muted block">Click here to upload from device (.mp3, .wav, .m4a)</span>
                            </div>
                          </div>

                          <input
                            type="file"
                            id={`audio-file-input-${block.id}`}
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const objUrl = URL.createObjectURL(file);
                                localAudioFilesCache[block.id] = objUrl;
                                updateBlock(block.id, {
                                  meta: {
                                    ...meta,
                                    audioSource: 'file',
                                    fileName: file.name,
                                    isEditing: false
                                  }
                                });
                                showToast(`Loaded audio file: ${file.name} 🎧`);
                              }
                            }}
                          />

                          {/* Web link input below uploader */}
                          <div className="space-y-2 pt-1">
                            <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block">Or embed from web link</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Paste Spotify, Apple Music, SoundCloud, or direct audio link..."
                                id={`universal-audio-input-${block.id}`}
                                defaultValue={meta.audioUrl || ''}
                                className="flex-1 bg-white border border-[#E2D1C3] focus:border-cozy-orange focus:outline-none rounded-xl px-3 py-1.5 text-xs text-cozy-text-dark shadow-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = e.currentTarget.value.trim();
                                    if (val) {
                                      const parsed = getMusicEmbedUrl(val);
                                      updateBlock(block.id, {
                                        meta: {
                                          ...meta,
                                          audioSource: parsed.provider === 'unknown' ? 'url' : parsed.provider,
                                          audioUrl: val,
                                          embedUrl: parsed.embedUrl,
                                          isEditing: false
                                        }
                                      });
                                      showToast('Audio link embedded successfully! 🎵');
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById(`universal-audio-input-${block.id}`) as HTMLInputElement;
                                  const val = input?.value.trim() || '';
                                  if (val) {
                                    const parsed = getMusicEmbedUrl(val);
                                    updateBlock(block.id, {
                                      meta: {
                                        ...meta,
                                        audioSource: parsed.provider === 'unknown' ? 'url' : parsed.provider,
                                        audioUrl: val,
                                        embedUrl: parsed.embedUrl,
                                        isEditing: false
                                      }
                                    });
                                    showToast('Audio link embedded successfully! 🎵');
                                  } else {
                                    showToast('Please enter a link ⚠️');
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-cozy-orange hover:bg-cozy-orange/90 text-white font-black text-xs rounded-xl border border-cozy-orange shadow-xs cursor-pointer transition duration-150 shrink-0"
                              >
                                Embed Link
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative bg-[#FAF6EB] border border-cozy-text-dark/15 p-4 rounded-2xl group/music-player">
                          {/* Top-right floating edit button */}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10 opacity-0 group-hover/music-player:opacity-100 transition duration-200">
                            <button
                              type="button"
                              onClick={() => {
                                updateBlock(block.id, {
                                  meta: {
                                    ...meta,
                                    isEditing: true
                                  }
                                });
                              }}
                              className="p-1.5 rounded-lg bg-white hover:bg-cozy-orange/10 text-cozy-text-dark hover:text-cozy-orange shadow-md border border-cozy-text-dark/10 transition cursor-pointer"
                              title="Change Audio Source"
                            >
                              <RefreshCw size={11} className="stroke-[2.5]" />
                            </button>
                          </div>

                          {audioSource === 'spotify' && meta.embedUrl ? (
                            <iframe
                              src={meta.embedUrl}
                              className="w-full h-[80px] border-0 rounded-xl"
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="lazy"
                              title="Spotify Player"
                            />
                          ) : (audioSource === 'apple' || audioSource === 'soundcloud') && meta.embedUrl ? (
                            <iframe
                              src={meta.embedUrl}
                              className={`w-full border-0 rounded-xl ${audioSource === 'soundcloud' ? 'h-[120px]' : 'h-[150px]'}`}
                              allow="autoplay"
                              loading="lazy"
                              title={`${audioSource === 'apple' ? 'Apple Music' : 'SoundCloud'} Player`}
                            />
                          ) : audioSource === 'file' ? (
                            localAudioFilesCache[block.id] ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Headphones size={16} />
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <p className="text-[11px] font-bold text-cozy-text-dark truncate">
                                      {meta.fileName || 'Uploaded Audio Track'}
                                    </p>
                                    <p className="text-[9px] text-cozy-text-muted">Local device file</p>
                                  </div>
                                </div>
                                <audio
                                  src={localAudioFilesCache[block.id]}
                                  controls
                                  className="w-full h-8 outline-none mt-1"
                                />
                              </div>
                            ) : (
                              <div className="text-center py-4 bg-white rounded-xl border border-dashed border-cozy-text-dark/20 space-y-2">
                                <Headphones size={24} className="mx-auto text-cozy-orange animate-pulse" />
                                <p className="text-xs font-bold text-cozy-text-dark">Local audio path expired</p>
                                <p className="text-[9px] text-cozy-text-muted max-w-xs mx-auto leading-relaxed">
                                  Browser privacy rules expire memory-allocated URLs on refresh. Please re-load your audio file.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => updateBlock(block.id, { meta: { ...meta, isEditing: true } })}
                                  className="px-3 py-1 bg-cozy-orange text-white text-[9px] font-black rounded-lg border border-cozy-text-dark cursor-pointer hover:bg-opacity-90"
                                >
                                  Re-select File
                                </button>
                              </div>
                            )
                          ) : audioSource === 'url' && meta.audioUrl ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                                  <Music size={16} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <p className="text-[11px] font-bold text-cozy-text-dark truncate">
                                    {meta.audioUrl}
                                  </p>
                                  <p className="text-[9px] text-cozy-text-muted">Direct stream link</p>
                                </div>
                              </div>
                              <audio
                                src={meta.audioUrl}
                                controls
                                className="w-full h-8 outline-none mt-1"
                              />
                            </div>
                          ) : (
                            // Simulation fallback / Initial default cafe track
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-cozy-orange/10 flex items-center justify-center text-cozy-orange text-sm font-black">
                                  ♫
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-cozy-text-dark">Ambient Cafe Reflection Track</div>
                                  <div className="text-[10px] text-cozy-text-muted">Soothing focus sounds</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleAudioSimulation(block.id)}
                                className={`px-3 py-1 text-[10px] rounded-lg font-black tracking-wide border transition ${
                                  isPlayingAudio === block.id 
                                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                                    : 'bg-white text-cozy-text-dark border-cozy-text-dark/15 hover:bg-cozy-orange/10'
                                }`}
                              >
                                {isPlayingAudio === block.id ? 'Stop Sounds' : 'Play sounds'}
                              </button>
                            </div>
                          )}

                          {!audioSource && isPlayingAudio === block.id && (
                            <div className="mt-3 bg-white border border-[#E2D1C3] rounded-lg p-2 flex items-center justify-between gap-3">
                              <div className="flex-1 bg-gray-200 h-1 rounded-full overflow-hidden relative">
                                <div className="bg-cozy-orange h-full" style={{ width: `${audioProgress}%` }} />
                              </div>
                              <span className="text-[9px] font-mono text-cozy-text-muted shrink-0">Progress: {audioProgress}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlockContent(block.id, e.target.value)}
                        className="w-full text-xs text-cozy-text-muted italic bg-transparent border-none focus:outline-none focus:ring-0 text-center"
                        placeholder="Add a music track caption..."
                      />
                    </div>
                    </div>
                  );
                })()}

                {/* 19. VIDEO BLOCK */}
                {block.type === 'video' && (() => {
                  const meta = block.meta || {};
                  const isEditing = meta.isEditing !== false && (!meta.videoSource || meta.isEditing);
                  const videoSource = meta.videoSource || '';

                  return (
                    <div className="w-full bg-[#FAF9F6]/20 border border-[#E2D1C3]/60 rounded-2xl p-2 transition-all duration-300 hover:border-cozy-orange/45">
                      <div className="relative w-full bg-white border border-[#E2D1C3]/40 p-4 rounded-xl shadow-xs space-y-3 font-sans">
                        {isEditing ? (
                        <div className="space-y-4 relative w-full">
                          {meta.videoSource && (
                            <button
                              onClick={() => updateBlock(block.id, { meta: { ...meta, isEditing: false } })}
                              className="absolute top-0 right-0 p-1.5 hover:bg-cozy-text-dark/10 rounded-full text-cozy-text-dark transition cursor-pointer z-10"
                              title="Close Settings"
                            >
                              <X size={14} />
                            </button>
                          )}
                          
                          {/* Main uploader box styled exactly like photo empty state */}
                          <div 
                            onClick={() => {
                              const fileInput = document.getElementById(`video-file-input-${block.id}`);
                              fileInput?.click();
                            }}
                            className="border border-dashed border-[#E2D1C3] bg-[#FAF8F1]/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#FAF8F1]/80 hover:border-cozy-orange/50 transition-all duration-200 min-h-[140px] space-y-2.5 group/box"
                          >
                            <div className="w-10 h-10 rounded-full bg-amber-50/80 flex items-center justify-center text-cozy-orange border border-amber-100/60 group-hover/box:scale-110 transition-transform duration-200">
                              <Video size={18} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-xs font-black text-cozy-text-dark block uppercase tracking-wide font-mono">Add your video</span>
                              <span className="text-[10px] text-cozy-text-muted block">Click here to upload from device (.mp4, .webm)</span>
                            </div>
                          </div>

                          <input
                            type="file"
                            id={`video-file-input-${block.id}`}
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const objUrl = URL.createObjectURL(file);
                                localVideoFilesCache[block.id] = objUrl;
                                updateBlock(block.id, {
                                  meta: {
                                    ...meta,
                                    videoSource: 'file',
                                    fileName: file.name,
                                    isEditing: false
                                  }
                                });
                                showToast(`Loaded device video: ${file.name} 🎬`);
                              }
                            }}
                          />

                          {/* Web link input below uploader */}
                          <div className="space-y-2 pt-1">
                            <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block">Or embed from web link</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Paste YouTube link or direct video (.mp4, .webm) link..."
                                id={`universal-video-input-${block.id}`}
                                defaultValue={meta.videoUrl || ''}
                                className="flex-1 bg-white border border-[#E2D1C3] focus:border-cozy-orange focus:outline-none rounded-xl px-3 py-1.5 text-xs text-cozy-text-dark shadow-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = e.currentTarget.value.trim();
                                    if (val) {
                                      const embedId = getYouTubeEmbedId(val);
                                      if (embedId) {
                                        updateBlock(block.id, {
                                          meta: {
                                            ...meta,
                                            videoSource: 'youtube',
                                            videoUrl: val,
                                            embedId,
                                            isEditing: false
                                          }
                                        });
                                        showToast('YouTube video linked successfully! 📺');
                                      } else {
                                        updateBlock(block.id, {
                                          meta: {
                                            ...meta,
                                            videoSource: 'url',
                                            videoUrl: val,
                                            isEditing: false
                                          }
                                        });
                                        showToast('Direct video URL loaded! 🎬');
                                      }
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById(`universal-video-input-${block.id}`) as HTMLInputElement;
                                  const val = input?.value.trim() || '';
                                  if (val) {
                                    const embedId = getYouTubeEmbedId(val);
                                    if (embedId) {
                                      updateBlock(block.id, {
                                        meta: {
                                          ...meta,
                                          videoSource: 'youtube',
                                          videoUrl: val,
                                          embedId,
                                          isEditing: false
                                        }
                                      });
                                      showToast('YouTube video linked successfully! 📺');
                                    } else {
                                      updateBlock(block.id, {
                                        meta: {
                                          ...meta,
                                          videoSource: 'url',
                                          videoUrl: val,
                                          isEditing: false
                                        }
                                      });
                                      showToast('Direct video URL loaded! 🎬');
                                    }
                                  } else {
                                    showToast('Please enter a link ⚠️');
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-cozy-orange hover:bg-cozy-orange/90 text-white font-black text-xs rounded-xl border border-cozy-orange shadow-xs cursor-pointer transition duration-150 shrink-0"
                              >
                                Embed Link
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group/player rounded-xl overflow-hidden shadow-sm border border-cozy-text-dark/10">
                          {/* Top-right floating edit button overlay */}
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10 opacity-0 group-hover/player:opacity-100 transition duration-200">
                            <button
                              type="button"
                              onClick={() => {
                                updateBlock(block.id, {
                                  meta: {
                                    ...meta,
                                    isEditing: true
                                  }
                                });
                              }}
                              className="p-1.5 rounded-lg bg-white/95 hover:bg-white text-cozy-text-dark hover:text-cozy-orange shadow-md border border-cozy-text-dark/15 transition cursor-pointer"
                              title="Change Video Source"
                            >
                              <RefreshCw size={11} className="stroke-[2.5]" />
                            </button>
                          </div>

                          {/* Player Container */}
                          <div className="aspect-video bg-neutral-900 overflow-hidden relative">
                            {videoSource === 'youtube' && meta.embedId ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${meta.embedId}`}
                                className="absolute inset-0 w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="YouTube Video Player"
                              />
                            ) : videoSource === 'file' ? (
                              localVideoFilesCache[block.id] ? (
                                <video
                                  src={localVideoFilesCache[block.id]}
                                  controls
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center text-center p-4">
                                  <Video size={32} className="text-cozy-orange mb-2 animate-pulse" />
                                  <p className="text-xs font-bold text-white mb-1">Local file session inactive</p>
                                  <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed">
                                    Browser security policies expire memory paths when reloading the app. Please re-select your file.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => updateBlock(block.id, { meta: { ...meta, isEditing: true } })}
                                    className="mt-3 px-3 py-1.5 bg-cozy-orange text-white text-[10px] font-bold rounded-lg border border-cozy-text-dark cursor-pointer hover:bg-opacity-90"
                                  >
                                    Re-select Local File
                                  </button>
                                </div>
                              )
                            ) : (videoSource === 'url' || videoSource === 'sample') && meta.videoUrl ? (
                              <video
                                src={meta.videoUrl}
                                controls
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              // Simulation fallback
                              <div className="absolute inset-0 flex flex-col justify-end p-3 bg-neutral-950">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => updateBlock(block.id, { meta: { ...meta, isEditing: true } })}
                                    className="w-12 h-12 rounded-full bg-[#EF9A7A]/90 hover:bg-[#EF9A7A] text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition cursor-pointer"
                                  >
                                    <Play size={20} fill="currentColor" className="ml-1" />
                                  </button>
                                </div>
                                <div className="w-full bg-white/10 backdrop-blur-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[10px] text-white">
                                  <span>Simulated: Mindful Sunset Walk</span>
                                  <span className="font-mono">03:45</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlockContent(block.id, e.target.value)}
                        className="w-full text-xs text-cozy-text-muted italic bg-transparent border-none focus:outline-none focus:ring-0 text-center"
                        placeholder="Add a video caption..."
                      />
                    </div>
                    </div>
                  );
                })()}

                {/* 22. EDITABLE 2D GRID TABLE */}
                {block.type === 'table' && block.meta?.rows && (
                  <TableBlock
                    block={block}
                    index={index}
                    onUpdate={updateBlock}
                    onDuplicate={duplicateBlock}
                    onDelete={deleteBlock}
                    showToast={showToast}
                  />
                )}





                {/* IMMERSIVE SLASH COMMAND DROPDOWN */}
                {isSlashActive && (() => {
                  const filtered = getFilteredCommands(slashQuery);

                  if (filtered.length === 0) return null;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                      className="absolute left-0 mt-2 bg-white/95 backdrop-blur-md border border-[#E2D1C3] rounded-2xl shadow-[0_12px_36px_-6px_rgba(122,105,86,0.22)] w-72 max-h-64 overflow-hidden z-50 flex flex-col font-sans"
                    >
                      {/* Dropdown Header */}
                      <div className="px-3.5 py-2.5 bg-[#FAF8F1]/60 border-b border-[#E2D1C3]/40 flex items-center justify-between shrink-0">
                        <span className="text-[9.5px] uppercase tracking-widest text-[#8F7C6E] font-extrabold font-mono">
                          Rich Components
                        </span>
                        <span className="text-[8.5px] font-medium text-[#A69586] italic">
                          type to search
                        </span>
                      </div>

                      {/* Dropdown List Items */}
                      <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5 max-h-44 custom-scrollbar">
                        {filtered.map((cmd, cmdIdx) => {
                          const isSelected = slashSelectedIndex === cmdIdx;
                          
                          // Style icons with dynamic color schemes matching the category
                          const getCmdStyles = (type: string) => {
                            switch (type) {
                              case 'h1': case 'h2': case 'h3':
                                return { bg: 'bg-blue-50/90 text-blue-600 border-blue-100', dot: 'bg-blue-500' };
                              case 'bullet': case 'number': case 'todo': case 'toggle':
                                return { bg: 'bg-amber-50/90 text-amber-600 border-amber-100', dot: 'bg-amber-500' };
                              case 'gallery': case 'video':
                                return { bg: 'bg-rose-50/90 text-rose-600 border-rose-100', dot: 'bg-rose-500' };
                              case 'voice': case 'audio':
                                return { bg: 'bg-violet-50/90 text-violet-600 border-violet-100', dot: 'bg-violet-500' };

                              case 'quote': case 'divider':
                                return { bg: 'bg-stone-100/90 text-stone-600 border-stone-200', dot: 'bg-stone-500' };
                              default:
                                return { bg: 'bg-[#FEFAF3] text-cozy-orange border-amber-100/70', dot: 'bg-cozy-orange' };
                            }
                          };

                          const colorStyles = getCmdStyles(cmd.type);

                          return (
                            <button
                              key={cmd.type}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()} // Keeps keyboard focus active
                              onClick={() => executeSlashCommand(block.id, cmd.type as any)}
                              className={`w-[calc(100%-12px)] mx-1.5 px-2.5 py-2 text-left flex items-center gap-3 transition-all duration-150 rounded-xl ${
                                isSelected 
                                  ? 'bg-[#FAF6EB] shadow-xs border border-[#E2D1C3]/60 scale-[1.01]' 
                                  : 'hover:bg-[#FAF8F1]/40 border border-transparent'
                              }`}
                            >
                              {/* Left Icon with color scheme */}
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-200 ${colorStyles.bg} ${
                                isSelected ? 'scale-105 shadow-2xs' : ''
                              }`}>
                                {cmd.icon}
                              </div>

                              {/* Content area */}
                              <div className="flex-1 min-w-0 pr-1">
                                <div className="flex items-center justify-between">
                                  <span className={`text-[11.5px] font-bold tracking-tight transition-colors ${
                                    isSelected ? 'text-cozy-text-dark font-black' : 'text-cozy-text-dark/90'
                                  }`}>
                                    {cmd.label}
                                  </span>
                                  {isSelected && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${colorStyles.dot} animate-pulse shrink-0`} />
                                  )}
                                </div>
                                <div className="text-[9.5px] text-cozy-text-muted leading-snug mt-0.5 line-clamp-1">
                                  {cmd.desc}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Dropdown Footer Navigation Hint */}
                      <div className="bg-[#FAF6EB]/55 border-t border-[#E2D1C3]/30 px-3.5 py-2 text-[8.5px] font-mono text-[#A69586] flex items-center justify-between select-none shrink-0 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1 py-0.5 bg-white border border-[#E2D1C3]/60 rounded-md shadow-3xs font-semibold">↑↓</span>
                          <span>navigate</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-white border border-[#E2D1C3]/60 rounded-md shadow-3xs font-semibold">⏎</span>
                          <span>select</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



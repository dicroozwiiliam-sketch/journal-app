/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Sparkles, Smile, FileText, Mic, Image, Table2, Volume2, 
  Trash2, Copy, Plus, X, Heading1, Heading2, ListTodo, 
  Quote, Split, Palette, Clock, BookOpen, PenTool, CheckSquare,
  Undo, Redo, Bold, Italic, Underline, Strikethrough, Link as LinkIcon,
  Paperclip, User, StickyNote, Square, Circle, Triangle, ArrowRight, Star, Heart, Type,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

interface JournalToolsPanelProps {
  onClose?: () => void;
  // Controls passed from JournalTimeline
  controls: {
    appendBlock?: (type: string) => void;
    addFloatingObject?: (type: any, content: string, color?: string, meta?: any) => void;
    copyFullText?: () => void;
    speak?: () => void;
    isSpeaking?: boolean;
    wordCount?: number;
    charCount?: number;
    readingTime?: number;
    blockCount?: number;
    // Lifted states & actions from FloatingCanvas
    selectedObjectId?: string | null;
    onSelectObject?: (id: string | null) => void;
    activeTab?: 'text' | 'sticky' | 'emoji' | 'image' | 'shape' | 'deco';
    setActiveTab?: (tab: 'text' | 'sticky' | 'emoji' | 'image' | 'shape' | 'deco') => void;
    canvasActions?: {
      spawnObject: (type: any, customFields?: any) => void;
      updateTextMeta: (id: string, key: string, val: any) => void;
      handleUndo: () => void;
      handleRedo: () => void;
      undoStackLength: number;
      redoStackLength: number;
      clearAll: () => void;
    } | null;
    floatingObjects?: any[];
    updateFloatingObjects?: (updated: any[]) => void;
  } | null;
  onDeleteEntry?: () => void;
  isMobile?: boolean;
}

export default function JournalToolsPanel({ 
  onClose, 
  controls, 
  onDeleteEntry,
  isMobile = false 
}: JournalToolsPanelProps) {
  
  if (!controls) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3 bg-cozy-card rounded-2xl border-2 border-dashed border-cozy-text-dark/20">
        <Sparkles className="text-cozy-text-muted w-8 h-8 animate-pulse" />
        <p className="text-xs text-cozy-text-muted font-bold">Select a journal entry to unlock page editing tools & analytics.</p>
      </div>
    );
  }

  const {
    appendBlock,
    addFloatingObject,
    copyFullText,
    speak,
    isSpeaking = false,
    wordCount = 0,
    charCount = 0,
    readingTime = 1,
    blockCount = 0,
    selectedObjectId = null,
    onSelectObject,
    activeTab = 'text',
    setActiveTab,
    canvasActions = null,
    floatingObjects = [],
    updateFloatingObjects
  } = controls;

  // Active Selected Object
  const activeObj = floatingObjects.find(o => o.id === selectedObjectId) || null;

  // Preset nature & cozy images
  const PRESET_IMAGES = [
    { url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&auto=format&fit=crop&q=60', label: 'Sunflowers' },
    { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=60', label: 'Sunset Peak' },
    { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&auto=format&fit=crop&q=60', label: 'Work Space' },
    { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=60', label: 'Cute Pup' },
    { url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300&auto=format&fit=crop&q=60', label: 'Forest Path' },
    { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&auto=format&fit=crop&q=60', label: 'Misty Valley' },
  ];

  return (
    <div className={`flex flex-col h-full gap-4 text-cozy-text-dark font-sans ${isMobile ? 'p-1' : ''}`}>
      
      {/* HEADER: COZY TOOLBOX */}
      <div className="flex justify-between items-center pb-2.5 border-b-2 border-cozy-text-dark/15">
        <div className="flex items-center gap-1.5">
          <Sparkles className="text-cozy-orange animate-pulse w-4 h-4" />
          <h3 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Cozy Toolbox</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={() => canvasActions?.handleUndo()}
            disabled={!canvasActions || canvasActions.undoStackLength === 0}
            className={`p-1.5 hover:bg-cozy-orange/10 rounded-lg text-cozy-text-muted hover:text-cozy-text-dark transition ${
              (!canvasActions || canvasActions.undoStackLength === 0) ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Undo decorative action"
          >
            <Undo size={14} className="stroke-[2.5]" />
          </button>
          
          <button
            onClick={() => canvasActions?.handleRedo()}
            disabled={!canvasActions || canvasActions.redoStackLength === 0}
            className={`p-1.5 hover:bg-cozy-orange/10 rounded-lg text-cozy-text-muted hover:text-cozy-text-dark transition ${
              (!canvasActions || canvasActions.redoStackLength === 0) ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title="Redo decorative action"
          >
            <Redo size={14} className="stroke-[2.5]" />
          </button>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition cursor-pointer"
            >
              <X size={15} className="stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* TOOLBOX NAVIGATION TABS */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-cozy-text-dark/10 scrollbar-none shrink-0">
        {(['text', 'sticky', 'emoji', 'image', 'shape', 'deco'] as const).map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab?.(tab)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-xl border transition cursor-pointer shrink-0 ${
                isActive 
                  ? 'bg-cozy-orange text-white border-2 border-cozy-text-dark shadow-xs' 
                  : 'bg-[#FDF8F1] hover:bg-white text-cozy-text-muted border-cozy-text-dark/15'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* TAB PANES */}
      <div className="flex-1 overflow-y-auto space-y-4 max-h-[58vh] pr-1">
        
        {/* TEXT TAB */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-cozy-text-muted mb-2 uppercase tracking-wider">Add a Floating Text Box</p>
              <button
                onClick={() => canvasActions?.spawnObject('text', {
                  content: 'Happy thoughts go here ✨',
                  color: '#4A3E31',
                  meta: { fontFamily: 'handwriting', fontSize: 'md', alignment: 'center' }
                })}
                className="w-full py-2.5 bg-cozy-orange hover:bg-opacity-95 text-white font-black text-xs border-2 border-cozy-text-dark rounded-xl flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#4A3D30] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#4A3D30] transition-all cursor-pointer"
              >
                <Type size={14} className="stroke-[2.5]" />
                <span>Insert Floating Text Box</span>
              </button>
            </div>

            {activeObj && activeObj.type === 'text' ? (
              <div className="p-3.5 bg-[#FDF8F1] border-2 border-cozy-text-dark rounded-2xl space-y-3.5 shadow-sm">
                <p className="text-[9px] font-black text-cozy-orange uppercase tracking-wider">Format Selected Text Box</p>
                
                {/* ELEGANT FORMATTING TOOLBAR (IMAGE 1 STYLE) */}
                <div className="bg-white border-2 border-cozy-text-dark rounded-xl p-1.5 flex items-center justify-between gap-1 flex-wrap shadow-xs">
                  {/* Bold */}
                  <button
                    onClick={() => canvasActions?.updateTextMeta(activeObj.id, 'isBold', !activeObj.meta?.isBold)}
                    className={`p-1.5 rounded-lg transition hover:bg-cozy-orange/15 font-black text-xs ${
                      activeObj.meta?.isBold ? 'bg-cozy-orange/15 text-cozy-orange' : 'text-cozy-text-dark'
                    }`}
                    title="Bold text"
                  >
                    <Bold size={13} className="stroke-[3px]" />
                  </button>

                  {/* Italic */}
                  <button
                    onClick={() => canvasActions?.updateTextMeta(activeObj.id, 'isItalic', !activeObj.meta?.isItalic)}
                    className={`p-1.5 rounded-lg transition hover:bg-cozy-orange/15 text-xs ${
                      activeObj.meta?.isItalic ? 'bg-cozy-orange/15 text-cozy-orange font-serif italic' : 'text-cozy-text-dark'
                    }`}
                    title="Italic text"
                  >
                    <Italic size={13} className="stroke-[2.5]" />
                  </button>

                  {/* Underline */}
                  <button
                    onClick={() => canvasActions?.updateTextMeta(activeObj.id, 'isUnderline', !activeObj.meta?.isUnderline)}
                    className={`p-1.5 rounded-lg transition hover:bg-cozy-orange/15 text-xs ${
                      activeObj.meta?.isUnderline ? 'bg-cozy-orange/15 text-cozy-orange underline' : 'text-cozy-text-dark'
                    }`}
                    title="Underline text"
                  >
                    <Underline size={13} className="stroke-[2.5]" />
                  </button>

                  {/* Strikethrough */}
                  <button
                    onClick={() => canvasActions?.updateTextMeta(activeObj.id, 'isStrikethrough', !activeObj.meta?.isStrikethrough)}
                    className={`p-1.5 rounded-lg transition hover:bg-cozy-orange/15 text-xs ${
                      activeObj.meta?.isStrikethrough ? 'bg-cozy-orange/15 text-cozy-orange line-through' : 'text-cozy-text-dark'
                    }`}
                    title="Strikethrough text"
                  >
                    <Strikethrough size={13} className="stroke-[2.5]" />
                  </button>

                  {/* Divider */}
                  <div className="h-5 w-[1.5px] bg-cozy-text-dark/15 mx-0.5" />

                  {/* Highlight crayon */}
                  <button
                    onClick={() => {
                      const wasHighlight = activeObj.meta?.isHighlight;
                      canvasActions?.updateTextMeta(activeObj.id, 'isHighlight', !wasHighlight);
                      canvasActions?.updateTextMeta(activeObj.id, 'bgColor', wasHighlight ? 'transparent' : '#FFE082');
                    }}
                    className={`p-1.5 rounded-lg transition hover:bg-cozy-orange/15 text-xs ${
                      activeObj.meta?.isHighlight ? 'bg-cozy-orange/20 text-cozy-orange' : 'text-cozy-text-dark'
                    }`}
                    title="Highlight marker"
                  >
                    <PenTool size={13} className="stroke-[2.5] text-emerald-600 fill-yellow-200" />
                  </button>

                  {/* Code Block / Mono toggle */}
                  <button
                    onClick={() => {
                      const currentFont = activeObj.meta?.fontFamily;
                      canvasActions?.updateTextMeta(activeObj.id, 'fontFamily', currentFont === 'mono' ? 'sans' : 'mono');
                    }}
                    className={`p-1 text-[10px] font-mono font-black rounded transition hover:bg-cozy-orange/15 ${
                      activeObj.meta?.fontFamily === 'mono' ? 'bg-cozy-orange/15 text-cozy-orange' : 'text-cozy-text-dark'
                    }`}
                    title="Monospace font code"
                  >
                    &lt;/&gt;
                  </button>

                  {/* Link icon */}
                  <button
                    onClick={() => {
                      const link = prompt("Enter web URL link for this text box:", activeObj.meta?.linkUrl || "");
                      if (link !== null) {
                        canvasActions?.updateTextMeta(activeObj.id, 'linkUrl', link);
                        if (link) {
                          canvasActions?.updateTextMeta(activeObj.id, 'isUnderline', true);
                          if (!activeObj.color) {
                            const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, color: '#3182CE' } : o);
                            updateFloatingObjects?.(updated);
                          }
                        }
                      }
                    }}
                    className={`p-1.5 rounded-lg transition hover:bg-cozy-orange/15 ${
                      activeObj.meta?.linkUrl ? 'text-blue-500 bg-blue-50' : 'text-cozy-text-dark'
                    }`}
                    title="Hyperlink URL"
                  >
                    <LinkIcon size={13} className="stroke-[2.5]" />
                  </button>

                  {/* Handwriting style (User icon) */}
                  <button
                    onClick={() => {
                      canvasActions?.updateTextMeta(activeObj.id, 'fontFamily', activeObj.meta?.fontFamily === 'handwriting' ? 'sans' : 'handwriting');
                    }}
                    className={`p-1.5 rounded-lg transition hover:bg-cozy-orange/15 ${
                      activeObj.meta?.fontFamily === 'handwriting' ? 'text-purple-600 bg-purple-50' : 'text-cozy-text-dark'
                    }`}
                    title="Handwritten journal style"
                  >
                    <User size={13} className="stroke-[2.5]" />
                  </button>

                  {/* Bullet symbol (Attachment Clip) */}
                  <button
                    onClick={() => {
                      const prefix = "📎 ";
                      if (!activeObj.content.startsWith(prefix)) {
                        const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, content: prefix + o.content } : o);
                        updateFloatingObjects?.(updated);
                      }
                    }}
                    className="p-1.5 rounded-lg transition hover:bg-cozy-orange/15 text-cozy-text-dark"
                    title="Add attachment pin symbol"
                  >
                    <Paperclip size={13} className="stroke-[2.5]" />
                  </button>

                  {/* Divider */}
                  <div className="h-5 w-[1.5px] bg-cozy-text-dark/15 mx-0.5" />

                  {/* COLOR DOTS */}
                  <div className="flex gap-1 items-center">
                    {/* Red */}
                    <button
                      onClick={() => {
                        const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, color: '#E57373' } : o);
                        updateFloatingObjects?.(updated);
                      }}
                      className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-cozy-text-dark cursor-pointer transition hover:scale-110 active:scale-95"
                      title="Rose red"
                    />
                    {/* Blue */}
                    <button
                      onClick={() => {
                        const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, color: '#4FC3F7' } : o);
                        updateFloatingObjects?.(updated);
                      }}
                      className="w-3.5 h-3.5 rounded-full bg-sky-400 border border-cozy-text-dark cursor-pointer transition hover:scale-110 active:scale-95"
                      title="Sky blue"
                    />
                    {/* Green */}
                    <button
                      onClick={() => {
                        const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, color: '#81C784' } : o);
                        updateFloatingObjects?.(updated);
                      }}
                      className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-cozy-text-dark cursor-pointer transition hover:scale-110 active:scale-95"
                      title="Mint green"
                    />

                    {/* bg pill (red border) */}
                    <button
                      onClick={() => canvasActions?.updateTextMeta(activeObj.id, 'bgColor', '#FFEBEE')}
                      className="border border-red-400 text-red-500 rounded px-1 py-0.5 text-[8px] font-black uppercase tracking-wider bg-white hover:bg-red-50 cursor-pointer"
                      title="Rose BG box"
                    >
                      bg
                    </button>

                    {/* bg pill (blue border) */}
                    <button
                      onClick={() => canvasActions?.updateTextMeta(activeObj.id, 'bgColor', '#E3F2FD')}
                      className="border border-blue-400 text-blue-500 rounded px-1 py-0.5 text-[8px] font-black uppercase tracking-wider bg-white hover:bg-blue-50 cursor-pointer"
                      title="Sky BG box"
                    >
                      bg
                    </button>
                  </div>
                </div>

                {/* Additional detailed formatting */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cozy-text-dark/10">
                  <div>
                    <label className="text-[8px] font-black text-cozy-text-muted uppercase tracking-wider">Font Family</label>
                    <select
                      value={activeObj.meta?.fontFamily || 'sans'}
                      onChange={(e) => canvasActions?.updateTextMeta(activeObj.id, 'fontFamily', e.target.value)}
                      className="w-full text-[10px] p-1 border border-cozy-text-dark/25 rounded-md bg-white font-sans outline-none"
                    >
                      <option value="sans">Quicksand (Sans)</option>
                      <option value="serif">Georgia (Serif)</option>
                      <option value="mono">Fira Mono (Tech)</option>
                      <option value="handwriting">Kalam (Handwritten)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-cozy-text-muted uppercase tracking-wider">Font Size</label>
                    <select
                      value={activeObj.meta?.fontSize || 'md'}
                      onChange={(e) => canvasActions?.updateTextMeta(activeObj.id, 'fontSize', e.target.value)}
                      className="w-full text-[10px] p-1 border border-cozy-text-dark/25 rounded-md bg-white outline-none"
                    >
                      <option value="xs">Extra Small</option>
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                      <option value="2xl">Double XL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-cozy-text-muted block mb-1 uppercase tracking-wider">Text Alignment</label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => canvasActions?.updateTextMeta(activeObj.id, 'alignment', align)}
                        className={`flex-1 p-1 border rounded-lg text-[10px] font-bold transition flex justify-center cursor-pointer ${
                          activeObj.meta?.alignment === align ? 'bg-cozy-orange text-white border-cozy-text-dark' : 'bg-white text-cozy-text-dark border-gray-200'
                        }`}
                      >
                        {align === 'left' ? <AlignLeft size={11} /> : align === 'center' ? <AlignCenter size={11} /> : <AlignRight size={11} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#FDF8F1] border border-cozy-text-dark/20 rounded-xl">
                <p className="text-[10px] text-cozy-text-muted italic text-center leading-relaxed font-bold">
                  Tip: Select a floating text box on your page to edit font sizes, families, text colors, and highlights! 📝
                </p>
              </div>
            )}
          </div>
        )}

        {/* STICKY TAB */}
        {activeTab === 'sticky' && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-cozy-text-muted mb-2 uppercase tracking-wider">Add a Decorative Sticky Note</p>
              <button
                onClick={() => canvasActions?.spawnObject('sticky', {
                  content: '',
                  color: '#FFF59D',
                })}
                className="w-full py-2.5 bg-cozy-orange hover:bg-opacity-95 text-white font-black text-xs border-2 border-cozy-text-dark rounded-xl flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#4A3D30] cursor-pointer"
              >
                <StickyNote size={14} className="stroke-[2.5]" />
                <span>Insert Cozy Sticky Note</span>
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-cozy-text-muted uppercase tracking-wider">Sticky Note Color Presets</p>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  { name: 'Yellow', code: '#FFF59D' },
                  { name: 'Orange', code: '#FFCC80' },
                  { name: 'Mint', code: '#C8E6C9' },
                  { name: 'Sky', code: '#B3E5FC' },
                  { name: 'Lavender', code: '#E1BEE7' },
                  { name: 'Pink', code: '#F8BBD0' }
                ].map(colorPreset => {
                  const isCurrentSelected = activeObj && activeObj.type === 'sticky' && activeObj.color === colorPreset.code;
                  return (
                    <button
                      key={colorPreset.code}
                      onClick={() => {
                        if (activeObj && activeObj.type === 'sticky') {
                          const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, color: colorPreset.code } : o);
                          updateFloatingObjects?.(updated);
                        } else {
                          canvasActions?.spawnObject('sticky', {
                            content: '',
                            color: colorPreset.code
                          });
                        }
                      }}
                      className="w-8 h-8 rounded-lg border-2 border-cozy-text-dark shadow-xs hover:scale-110 active:scale-95 transition cursor-pointer flex items-center justify-center relative"
                      style={{ backgroundColor: colorPreset.code }}
                      title={`Use ${colorPreset.name} Sticky`}
                    >
                      {isCurrentSelected && <X size={12} className="text-cozy-text-dark stroke-[3px]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeObj && activeObj.type === 'sticky' ? (
              <div className="p-3 bg-[#FDF8F1] border-2 border-cozy-text-dark rounded-xl space-y-2.5">
                <p className="text-[9px] font-black text-cozy-orange uppercase">Format Selected Sticky Note</p>
                <div className="flex items-center gap-2">
                  <label className="text-[8px] font-bold text-cozy-text-muted shrink-0">Custom Color</label>
                  <input
                    type="color"
                    value={activeObj.color || '#FFF59D'}
                    onChange={(e) => {
                      const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, color: e.target.value } : o);
                      updateFloatingObjects?.(updated);
                    }}
                    className="w-full h-6 rounded border cursor-pointer p-0.5 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#FDF8F1] border border-cozy-text-dark/20 rounded-xl">
                <p className="text-[10px] text-cozy-text-muted italic text-center leading-relaxed font-bold">
                  Tip: Tap or drag your sticky note to write thoughts directly! 📝
                </p>
              </div>
            )}
          </div>
        )}

        {/* EMOJIS TAB */}
        {activeTab === 'emoji' && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-cozy-text-muted uppercase tracking-wider">Tap to Add Floating Emoji</p>
            <div className="grid grid-cols-6 gap-2 bg-[#FDF8F1] p-3 border-2 border-cozy-text-dark rounded-xl max-h-48 overflow-y-auto">
              {['❤️', '✨', '🌸', '🎉', '🌟', '😊', '🐱', '🥐', '☕', '💡', '🔥', '🎨', '✈️', '🍀', '🍕', '📝', '🧸', '🌈', '🌙', '🌊', '🌲', '🏡', '📚', '🌻', '🍓', '🥑', '🎈', '🎵', '☀️', '☁️'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => canvasActions?.spawnObject('emoji', { content: emoji, width: 80, height: 80 })}
                  className="text-2xl p-1 bg-white hover:bg-cozy-orange/10 border border-cozy-text-dark/5 hover:border-cozy-orange hover:scale-115 rounded-lg transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* IMAGES TAB */}
        {activeTab === 'image' && (
          <div className="space-y-3">
            <div className="p-3 bg-cozy-bg/50 border-2 border-dashed border-cozy-text-dark/20 rounded-xl text-center space-y-2">
              <span className="text-xl">📸</span>
              <p className="text-[10px] font-bold text-cozy-text-dark uppercase tracking-wider">Scrapbook Photo Pinning</p>
              <p className="text-[9px] text-cozy-text-muted leading-relaxed">
                Click the image upload button inside any Notion journal block to pin photos directly onto your floating collage canvas!
              </p>
            </div>
          </div>
        )}

        {/* SHAPE TAB */}
        {activeTab === 'shape' && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-cozy-text-muted uppercase tracking-wider">Geometric Vector Shapes</p>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'square', icon: <Square size={16} /> },
                { type: 'circle', icon: <Circle size={16} /> },
                { type: 'triangle', icon: <Triangle size={16} /> },
                { type: 'arrow', icon: <ArrowRight size={16} /> },
                { type: 'star', icon: <Star size={16} /> },
                { type: 'heart', icon: <Heart size={16} /> }
              ].map(shape => (
                <button
                  key={shape.type}
                  onClick={() => canvasActions?.spawnObject('shape', {
                    width: 100,
                    height: 100,
                    color: '#EF9A7A',
                    borderColor: '#4A3E31',
                    meta: { shapeType: shape.type as any }
                  })}
                  className="p-2.5 bg-[#FDF8F1] hover:bg-white border border-cozy-text-dark/15 hover:border-cozy-orange hover:text-cozy-orange rounded-xl text-xs font-black capitalize flex flex-col items-center gap-1.5 transition cursor-pointer"
                >
                  {shape.icon}
                  <span className="text-[9px] font-black">{shape.type}</span>
                </button>
              ))}
            </div>

            {activeObj && activeObj.type === 'shape' ? (
              <div className="p-3 bg-[#FDF8F1] border border-cozy-text-dark/20 rounded-xl space-y-2">
                <p className="text-[9px] font-black text-cozy-orange uppercase">Style Shape Color</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-bold text-cozy-text-muted">Fill Color</label>
                    <input
                      type="color"
                      value={activeObj.color || '#EF9A7A'}
                      onChange={(e) => {
                        const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, color: e.target.value } : o);
                        updateFloatingObjects?.(updated);
                      }}
                      className="w-full h-6 rounded border cursor-pointer p-0.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-cozy-text-muted">Border Line</label>
                    <input
                      type="color"
                      value={activeObj.borderColor || '#4A3E31'}
                      onChange={(e) => {
                        const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, borderColor: e.target.value } : o);
                        updateFloatingObjects?.(updated);
                      }}
                      className="w-full h-6 rounded border cursor-pointer p-0.5 bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* DECO TAB */}
        {activeTab === 'deco' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-cozy-text-muted uppercase tracking-wider font-sans">Washi Tapes & Scene Flourishes</p>
            
            {/* Washi Tapes */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-cozy-orange tracking-widest uppercase block">Washi Tape Ribbons</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { pattern: 'solid', color: '#EF9A7A', label: 'Solid Coral' },
                  { pattern: 'stripes', color: '#96A376', label: 'Olive Stripes' },
                  { pattern: 'dots', color: '#F6D285', label: 'Gold Polka' },
                  { pattern: 'grid', color: '#88C0D0', label: 'Blue Grid' }
                ].map(t => (
                  <button
                    key={t.label}
                    onClick={() => canvasActions?.spawnObject('decorative', {
                      width: 140,
                      height: 32,
                      color: t.color,
                      meta: { decoType: 'washi-tape', washiPattern: t.pattern as any }
                    })}
                    className="p-1.5 bg-[#FDF8F1] border border-cozy-text-dark/15 rounded-lg text-[9px] font-black text-left flex items-center gap-1.5 cursor-pointer hover:border-cozy-text-dark"
                  >
                    <span className="w-4 h-3 rounded-xs border shadow-xs" style={{ backgroundColor: t.color }} />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sparkles */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-cozy-orange tracking-widest uppercase block">Sparkling Clusters</span>
              <button
                onClick={() => canvasActions?.spawnObject('decorative', {
                  width: 100,
                  height: 100,
                  color: '#F6D285',
                  meta: { decoType: 'sparkles' }
                })}
                className="w-full p-2.5 border border-cozy-text-dark/15 rounded-xl text-[9px] font-black flex items-center justify-center gap-1.5 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark text-cozy-text-dark"
              >
                <Sparkles size={11} className="text-cozy-yellow animate-bounce" />
                <span>Magical Sparkles</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER: {n} SCRAP ITEMS & CLEAR ALL */}
      <div className="flex justify-between items-center py-2 px-1 border-y border-cozy-text-dark/10 text-xs shrink-0 bg-cozy-card/45 rounded-lg">
        <span className="text-[10px] font-bold text-cozy-text-muted">{floatingObjects.length} scrap items</span>
        <button
          onClick={() => {
            if (confirm("Are you sure you want to clear all decorations from this page?")) {
              canvasActions?.clearAll();
            }
          }}
          className="text-[10px] font-black text-rose-500 hover:text-rose-600 tracking-wider hover:underline uppercase cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* EXTRA CONTROLS: LIVE WRITING STATS */}
      <div className="p-3 bg-white rounded-xl border border-cozy-text-dark/10 space-y-1">
        <div className="flex justify-between text-[8px] font-black text-cozy-text-muted uppercase tracking-wider">
          <span>Words: {wordCount}</span>
          <span>Chars: {charCount}</span>
          <span>Read: {readingTime}m</span>
          <span>Blocks: {blockCount}</span>
        </div>
      </div>

      {/* FOOTER ACTIONS: AUDIO READ OUT & DOCUMENT ACTIONS */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        <button
          onClick={speak}
          className={`py-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider border-2 border-cozy-text-dark shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
            isSpeaking 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'bg-cozy-yellow/20 hover:bg-cozy-yellow/30 text-cozy-text-dark'
          }`}
        >
          <Volume2 size={12} className={isSpeaking ? 'animate-bounce' : ''} />
          <span>{isSpeaking ? 'Stop TTS' : 'Read Spoken'}</span>
        </button>

        <button
          onClick={copyFullText}
          className="py-2 px-3 bg-white hover:bg-[#FDF8F1] text-cozy-text-dark rounded-xl font-black text-[10px] uppercase tracking-wider border-2 border-cozy-text-dark shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Copy size={12} />
          <span>Copy MD</span>
        </button>
      </div>

      {/* QUICK INSERTERS ACCORDION / GRID */}
      <div className="space-y-1.5 bg-[#FDF8F1]/40 border border-cozy-text-dark/10 p-2.5 rounded-xl">
        <span className="text-[9px] font-black text-cozy-text-muted uppercase tracking-wider block">Insert Notion Block</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => appendBlock?.('paragraph')}
            className="p-1.5 bg-white hover:bg-[#FDF8F1] border border-cozy-text-dark/10 hover:border-cozy-text-dark rounded-lg text-left flex items-center gap-1.5 transition cursor-pointer text-[9px] font-bold"
          >
            <FileText size={11} className="text-cozy-orange" />
            <span>+ Paragraph</span>
          </button>
          
          <button
            onClick={() => appendBlock?.('h2')}
            className="p-1.5 bg-white hover:bg-[#FDF8F1] border border-cozy-text-dark/10 hover:border-cozy-text-dark rounded-lg text-left flex items-center gap-1.5 transition cursor-pointer text-[9px] font-bold"
          >
            <Heading2 size={11} className="text-[#96A376]" />
            <span>+ Heading</span>
          </button>

          <button
            onClick={() => appendBlock?.('todo')}
            className="p-1.5 bg-white hover:bg-[#FDF8F1] border border-cozy-text-dark/10 hover:border-cozy-text-dark rounded-lg text-left flex items-center gap-1.5 transition cursor-pointer text-[9px] font-bold"
          >
            <CheckSquare size={11} className="text-[#88C0D0]" />
            <span>+ Checklist</span>
          </button>

          <button
            onClick={() => appendBlock?.('quote')}
            className="p-1.5 bg-white hover:bg-[#FDF8F1] border border-cozy-text-dark/10 hover:border-cozy-text-dark rounded-lg text-left flex items-center gap-1.5 transition cursor-pointer text-[9px] font-bold"
          >
            <Quote size={11} className="text-cozy-orange" />
            <span>+ Blockquote</span>
          </button>
        </div>
      </div>

      {/* REMOVE ACTION (DELETE CURRENT PAGE) */}
      {onDeleteEntry && (
        <div className="border-t border-[#E2D1C3]/40 pt-2 shrink-0">
          <button
            onClick={onDeleteEntry}
            className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl font-black text-[9px] uppercase tracking-wider border border-rose-300 hover:border-rose-400 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 size={11} />
            <span>Delete Page</span>
          </button>
        </div>
      )}

    </div>
  );
}

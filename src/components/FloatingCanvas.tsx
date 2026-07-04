/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, Smile, Sparkles, StickyNote, Image as ImageIcon, Paintbrush, 
  Square, Circle, Triangle, ArrowRight, Star, Heart, Undo, Redo, 
  Trash2, Copy, Lock, Unlock, ArrowUp, ArrowDown, Scissors, Check, X,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, Type as TypeIcon, Eye, Edit, List, Quote, HelpCircle,
  FileText, FileDown
} from 'lucide-react';

export interface FloatingObject {
  id: string;
  type: 'text' | 'emoji' | 'sticker' | 'sticky' | 'image' | 'draw' | 'shape' | 'decorative' | 'file';
  x: number; // percentage left
  y: number; // percentage top
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0.1 to 1.0
  zIndex: number;
  isLocked: boolean;
  content: string; // text, base64 drawing data, emoji, image URL, etc.
  color?: string; // main fill/text color
  borderColor?: string;
  meta?: {
    fontFamily?: 'sans' | 'serif' | 'mono' | 'handwriting';
    fontSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    alignment?: 'left' | 'center' | 'right';
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
    isStrikethrough?: boolean;
    isHighlight?: boolean;
    bgColor?: string;
    shapeType?: 'square' | 'circle' | 'triangle' | 'arrow' | 'star' | 'heart';
    stickerType?: string;
    decoType?: 'washi-tape' | 'sparkles' | 'polaroid' | 'highlighter';
    highlighterColor?: string;
    washiPattern?: 'dots' | 'stripes' | 'solid' | 'grid';
  };
}

interface FloatingCanvasProps {
  floatingObjects: FloatingObject[];
  onChange: (updated: FloatingObject[]) => void;
  showToast: (msg: string) => void;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
  activeTab?: 'text' | 'sticky' | 'emoji' | 'image' | 'shape' | 'deco';
  setActiveTab?: (tab: 'text' | 'sticky' | 'emoji' | 'image' | 'shape' | 'deco') => void;
  registerActions?: (actions: {
    spawnObject: (type: FloatingObject['type'], customFields?: Partial<FloatingObject>) => void;
    updateTextMeta: (id: string, key: string, val: any) => void;
    handleUndo: () => void;
    handleRedo: () => void;
    undoStackLength: number;
    redoStackLength: number;
    clearAll: () => void;
  }) => void;
}

// Preset Stickers
const PRESET_STICKERS = [
  { id: 'st-vibe', label: 'Good Vibes', emoji: '✨', text: 'GOOD VIBES', color: '#EF9A7A' },
  { id: 'st-care', label: 'Self Care', emoji: '🌿', text: 'SELF CARE', color: '#96A376' },
  { id: 'st-grat', label: 'Gratitude', emoji: '🙏', text: 'GRATEFUL', color: '#F6D285' },
  { id: 'st-done', label: 'Done!', emoji: '✅', text: 'COMPLETED', color: '#88C0D0' },
  { id: 'st-note', label: 'Note', emoji: '📌', text: 'NOTE TO SELF', color: '#E5989B' },
  { id: 'st-magic', label: 'Magic', emoji: '🔮', text: 'TRUST MAGIC', color: '#B48EAD' },
  { id: 'st-grow', label: 'Grow', emoji: '🌱', text: 'KEEP GROWING', color: '#A3BE8C' },
  { id: 'st-smile', label: 'Smile', emoji: '☀️', text: 'CHOOSE JOY', color: '#EBCB8B' },
];

// Preset Images for collage
const PRESET_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300&auto=format&fit=crop&q=60', label: 'Sunflowers' },
  { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=60', label: 'Sunset Peak' },
  { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&auto=format&fit=crop&q=60', label: 'Work Space' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=60', label: 'Cute Pup' },
  { url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300&auto=format&fit=crop&q=60', label: 'Forest Path' },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&auto=format&fit=crop&q=60', label: 'Misty Valley' },
];

export default function FloatingCanvas({
  floatingObjects = [],
  onChange,
  showToast,
  selectedObjectId: propSelectedObjectId,
  onSelectObject: propOnSelectObject,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  registerActions
}: FloatingCanvasProps) {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [localActiveTab, setLocalActiveTab] = useState<'text' | 'sticky' | 'emoji' | 'image' | 'shape' | 'deco'>('text');
  const [localSelectedObjectId, setLocalSelectedObjectId] = useState<string | null>(null);

  const selectedObjectId = propSelectedObjectId !== undefined ? propSelectedObjectId : localSelectedObjectId;
  const setSelectedObjectId = (id: string | null) => {
    if (propOnSelectObject) propOnSelectObject(id);
    else setLocalSelectedObjectId(id);
  };

  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = (tab: 'text' | 'sticky' | 'emoji' | 'image' | 'shape' | 'deco') => {
    if (propSetActiveTab) propSetActiveTab(tab);
    else setLocalActiveTab(tab);
  };
  
  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<FloatingObject[][]>([]);
  const [redoStack, setRedoStack] = useState<FloatingObject[][]>([]);
  
  // Refs for tracking interactions
  const canvasRef = useRef<HTMLDivElement>(null);
  const selectedObjectRef = useRef<FloatingObject | null>(null);
  
  // Active interaction details
  const [interaction, setInteraction] = useState<{
    type: 'move' | 'resize' | 'rotate' | null;
    objId: string | null;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
    centerX: number;
    centerY: number;
    startAngle: number;
  }>({
    type: null,
    objId: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    startWidth: 0,
    startHeight: 0,
    centerX: 0,
    centerY: 0,
    startAngle: 0
  });

  // Keep selectedObjectRef in sync
  const activeObj = floatingObjects.find(o => o.id === selectedObjectId) || null;
  selectedObjectRef.current = activeObj;

  // Save state helper with Undo support
  const saveState = (newState: FloatingObject[], desc = "Action") => {
    setUndoStack(prev => [...prev.slice(-29), floatingObjects]);
    setRedoStack([]);
    onChange(newState);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      showToast("Nothing to undo! ↩️");
      return;
    }
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, floatingObjects]);
    setUndoStack(u => u.slice(0, -1));
    onChange(prev);
    showToast("Undo ↩️");
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      showToast("Nothing to redo! ↪️");
      return;
    }
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, floatingObjects]);
    setRedoStack(r => r.slice(0, -1));
    onChange(next);
    showToast("Redo ↪️");
  };

  // Deselect on clicking outside active elements
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (selectedObjectId) {
        // Check if click was on tools panel or handles
        const target = e.target as HTMLElement;
        if (
          target.closest('.floating-object') || 
          target.closest('.toolbox-panel') || 
          target.closest('.tools-btn') ||
          target.closest('.inline-format-bar')
        ) {
          return;
        }
        setSelectedObjectId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [selectedObjectId]);

  // Spawn New Floating Object
  const spawnObject = (type: FloatingObject['type'], customFields: Partial<FloatingObject> = {}) => {
    const defaultZ = floatingObjects.length > 0 
      ? Math.max(...floatingObjects.map(o => o.zIndex)) + 1 
      : 10;

    const newObj: FloatingObject = {
      id: `float-${type}-${Date.now()}`,
      type,
      x: 30 + Math.random() * 15, // near center
      y: 15 + Math.random() * 15,
      width: type === 'draw' ? 320 : type === 'sticky' ? 180 : type === 'text' ? 220 : 120,
      height: type === 'draw' ? 240 : type === 'sticky' ? 180 : type === 'text' ? 80 : 120,
      rotation: (Math.random() - 0.5) * 15, // slight cute tilt
      opacity: 1.0,
      zIndex: defaultZ,
      isLocked: false,
      content: '',
      ...customFields
    };

    const updated = [...floatingObjects, newObj];
    saveState(updated);
    setSelectedObjectId(newObj.id);
    showToast(`Added decorative ${type}! ✨`);
  };

  // Duplicate Object
  const handleDuplicate = (id: string) => {
    const target = floatingObjects.find(o => o.id === id);
    if (!target) return;

    const maxZ = floatingObjects.length > 0 ? Math.max(...floatingObjects.map(o => o.zIndex)) : 10;
    const clone: FloatingObject = {
      ...JSON.parse(JSON.stringify(target)),
      id: `float-${target.type}-dup-${Date.now()}`,
      x: Math.min(95, target.x + 5),
      y: Math.min(95, target.y + 5),
      zIndex: maxZ + 1,
      rotation: target.rotation + 5
    };

    saveState([...floatingObjects, clone]);
    setSelectedObjectId(clone.id);
    showToast("Duplicated element! 📋");
  };

  // Delete Object
  const handleDelete = (id: string) => {
    const filtered = floatingObjects.filter(o => o.id !== id);
    saveState(filtered);
    setSelectedObjectId(null);
    showToast("Removed element 🗑️");
  };

  // Layering
  const handleLayer = (id: string, direction: 'forward' | 'backward') => {
    const target = floatingObjects.find(o => o.id === id);
    if (!target) return;

    const updated = floatingObjects.map(o => {
      if (o.id === id) {
        const delta = direction === 'forward' ? 1 : -1;
        return { ...o, zIndex: Math.max(1, o.zIndex + delta) };
      }
      return o;
    });
    saveState(updated);
  };

  // Toggle Lock
  const handleToggleLock = (id: string) => {
    const updated = floatingObjects.map(o => {
      if (o.id === id) {
        return { ...o, isLocked: !o.isLocked };
      }
      return o;
    });
    saveState(updated);
    showToast(updated.find(o => o.id === id)?.isLocked ? "Position locked 🔒" : "Position unlocked 🔓");
  };

  // Global mouse move and mouse up handlers for drag / resize / rotate interactions
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!interaction.type || !interaction.objId || !canvasRef.current) return;
      
      const targetObj = selectedObjectRef.current;
      if (!targetObj || targetObj.isLocked) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rect = canvasRef.current.getBoundingClientRect();

      if (interaction.type === 'move') {
        const deltaX = clientX - interaction.startX;
        const deltaY = clientY - interaction.startY;
        
        // Convert pixel delta to percentage
        const deltaXPercent = (deltaX / rect.width) * 100;
        const deltaYPercent = (deltaY / rect.height) * 100;

        let newX = interaction.startLeft + deltaXPercent;
        let newY = interaction.startTop + deltaYPercent;

        // Soft boundaries (-20% to 110%) to allow beautiful bleeding off the edges
        newX = Math.max(-20, Math.min(110, newX));
        newY = Math.max(-5, Math.min(110, newY));

        const updated = floatingObjects.map(o => {
          if (o.id === interaction.objId) {
            return { ...o, x: parseFloat(newX.toFixed(2)), y: parseFloat(newY.toFixed(2)) };
          }
          return o;
        });
        onChange(updated); // Live preview without creating history states instantly
      } 
      else if (interaction.type === 'resize') {
        const deltaX = clientX - interaction.startX;
        const deltaY = clientY - interaction.startY;

        const newWidth = Math.max(50, interaction.startWidth + deltaX);
        const newHeight = Math.max(40, interaction.startHeight + deltaY);

        const updated = floatingObjects.map(o => {
          if (o.id === interaction.objId) {
            return { ...o, width: Math.round(newWidth), height: Math.round(newHeight) };
          }
          return o;
        });
        onChange(updated);
      } 
      else if (interaction.type === 'rotate') {
        // Calculate angle between element center and cursor
        const angleRad = Math.atan2(clientY - interaction.centerY, clientX - interaction.centerX);
        let angleDeg = angleRad * (180 / Math.PI) + 90; // Add 90 offset to align top handle
        
        // Snap to nearest 45 degrees if Shift is pressed
        if ('shiftKey' in e && e.shiftKey) {
          angleDeg = Math.round(angleDeg / 45) * 45;
        }

        const updated = floatingObjects.map(o => {
          if (o.id === interaction.objId) {
            return { ...o, rotation: Math.round(angleDeg) };
          }
          return o;
        });
        onChange(updated);
      }
    };

    const handleGlobalEnd = () => {
      if (interaction.type) {
        // Commit final state to history once drag/resize ends
        saveState(floatingObjects);
        setInteraction({
          type: null,
          objId: null,
          startX: 0,
          startY: 0,
          startLeft: 0,
          startTop: 0,
          startWidth: 0,
          startHeight: 0,
          centerX: 0,
          centerY: 0,
          startAngle: 0
        });
      }
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [interaction, floatingObjects]);

  // Initiate interactions
  const startDrag = (e: React.MouseEvent | React.TouchEvent, obj: FloatingObject) => {
    if (obj.isLocked) return;
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setSelectedObjectId(obj.id);
    setInteraction({
      type: 'move',
      objId: obj.id,
      startX: clientX,
      startY: clientY,
      startLeft: obj.x,
      startTop: obj.y,
      startWidth: obj.width,
      startHeight: obj.height,
      centerX: 0,
      centerY: 0,
      startAngle: 0
    });
  };

  const startResize = (e: React.MouseEvent | React.TouchEvent, obj: FloatingObject) => {
    e.stopPropagation();
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setInteraction({
      type: 'resize',
      objId: obj.id,
      startX: clientX,
      startY: clientY,
      startLeft: obj.x,
      startTop: obj.y,
      startWidth: obj.width,
      startHeight: obj.height,
      centerX: 0,
      centerY: 0,
      startAngle: 0
    });
  };

  const startRotate = (e: React.MouseEvent | React.TouchEvent, obj: FloatingObject) => {
    e.stopPropagation();
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    // Get the element's client bounding box to find the exact center coordinates
    const el = document.getElementById(`float-el-${obj.id}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setInteraction({
      type: 'rotate',
      objId: obj.id,
      startX: clientX,
      startY: clientY,
      startLeft: obj.x,
      startTop: obj.y,
      startWidth: obj.width,
      startHeight: obj.height,
      centerX,
      centerY,
      startAngle: obj.rotation
    });
  };

  // Mini drawing state update inside drawing floating block
  const handleUpdateDrawingData = (id: string, dataUrl: string) => {
    const updated = floatingObjects.map(o => {
      if (o.id === id) {
        return { ...o, content: dataUrl };
      }
      return o;
    });
    saveState(updated);
  };

  // Text attribute edits for floating Text Boxes
  const updateTextMeta = (id: string, key: string, val: any) => {
    const updated = floatingObjects.map(o => {
      if (o.id === id) {
        const meta = o.meta || {};
        return {
          ...o,
          meta: {
            ...meta,
            [key]: val
          }
        };
      }
      return o;
    });
    saveState(updated);
  };

  useEffect(() => {
    if (registerActions) {
      registerActions({
        spawnObject,
        updateTextMeta,
        handleUndo,
        handleRedo,
        undoStackLength: undoStack.length,
        redoStackLength: redoStack.length,
        clearAll: () => {
          saveState([]);
          setSelectedObjectId(null);
          showToast("Cleared all scrap decorations! 🧹");
        }
      });
    }
  }, [floatingObjects, undoStack, redoStack, selectedObjectId, activeTab]);

  return (
    <>
      {/* 1. FLOATING OBJECTS CANVAS LAYER (Rendered inline inside relative paper wrapper) */}
      <div 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30 overflow-visible min-h-full"
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      >
        {floatingObjects.map((obj) => {
          const isSelected = selectedObjectId === obj.id;
          
          return (
            <div
              key={obj.id}
              id={`float-el-${obj.id}`}
              className={`absolute pointer-events-auto floating-object group transition-shadow ${
                isSelected ? 'z-50' : ''
              }`}
              style={{
                left: `${obj.x}%`,
                top: `${obj.y}%`,
                width: `${obj.width}px`,
                height: `${obj.type === 'text' ? 'auto' : `${obj.height}px`}`,
                transform: `rotate(${obj.rotation}deg)`,
                opacity: obj.opacity,
                zIndex: obj.zIndex,
                touchAction: 'none'
              }}
              onMouseDown={(e) => startDrag(e, obj)}
              onTouchStart={(e) => startDrag(e, obj)}
            >
              {/* Active Selection Border */}
              {isSelected && (
                <div className="absolute -inset-2 border-2 border-dashed border-cozy-orange rounded-xl pointer-events-none animate-pulse" />
              )}

              {/* Rotator Handle */}
              {isSelected && !obj.isLocked && (
                <div 
                  className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 bg-cozy-orange border-2 border-cozy-text-dark rounded-full flex items-center justify-center cursor-alias shadow-md hover:scale-110 active:scale-95 transition pointer-events-auto"
                  onMouseDown={(e) => startRotate(e, obj)}
                  onTouchStart={(e) => startRotate(e, obj)}
                  title="Drag to Rotate"
                >
                  <span className="text-[9px] text-white">⟳</span>
                </div>
              )}

              {/* Quick Actions Panel Overlay (visible when selected) */}
              {isSelected && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border-2 border-cozy-text-dark px-2 py-1 rounded-full shadow-lg pointer-events-auto text-cozy-text-dark whitespace-nowrap">
                  <button
                    onClick={() => handleToggleLock(obj.id)}
                    className="p-1 hover:bg-cozy-orange/15 rounded-lg text-cozy-text-dark transition cursor-pointer"
                    title={obj.isLocked ? "Unlock position" : "Lock position"}
                  >
                    {obj.isLocked ? <Lock size={12} className="text-cozy-orange" /> : <Unlock size={12} />}
                  </button>
                  <button
                    onClick={() => handleLayer(obj.id, 'forward')}
                    className="p-1 hover:bg-cozy-orange/15 rounded-lg text-cozy-text-dark transition cursor-pointer"
                    title="Bring Forward"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => handleLayer(obj.id, 'backward')}
                    className="p-1 hover:bg-cozy-orange/15 rounded-lg text-cozy-text-dark transition cursor-pointer"
                    title="Send Backward"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(obj.id)}
                    className="p-1 hover:bg-cozy-orange/15 rounded-lg text-cozy-text-dark transition cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy size={12} />
                  </button>
                  
                  {/* Opacity slider */}
                  <div className="flex items-center gap-1 border-l border-cozy-text-dark/15 pl-1.5 ml-0.5">
                    <span className="text-[8px] font-black uppercase opacity-60">Op</span>
                    <input
                      type="range"
                      min="0.2"
                      max="1"
                      step="0.1"
                      value={obj.opacity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange(floatingObjects.map(o => o.id === obj.id ? { ...o, opacity: val } : o));
                      }}
                      className="w-12 h-1 accent-cozy-orange cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => handleDelete(obj.id)}
                    className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition ml-1 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}

              {/* FLOATING OBJECT CONTENT RENDERING */}
              <div className="w-full h-full select-none">
                {/* 1. TEXT BOX FLOATING OBJECT */}
                {obj.type === 'text' && (
                  <div 
                    className="p-3 rounded-xl border border-transparent hover:border-cozy-text-dark/20 text-cozy-text-dark w-full min-h-[40px]"
                    style={{
                      fontFamily: obj.meta?.fontFamily === 'handwriting' ? 'Kalam' : obj.meta?.fontFamily === 'mono' ? 'monospace' : obj.meta?.fontFamily === 'serif' ? 'Georgia' : 'Quicksand',
                      fontSize: obj.meta?.fontSize === 'xs' ? '12px' : obj.meta?.fontSize === 'sm' ? '14px' : obj.meta?.fontSize === 'lg' ? '18px' : obj.meta?.fontSize === 'xl' ? '22px' : obj.meta?.fontSize === '2xl' ? '26px' : obj.meta?.fontSize === '3xl' ? '32px' : '16px',
                      fontWeight: obj.meta?.isBold ? 'bold' : 'normal',
                      fontStyle: obj.meta?.isItalic ? 'italic' : 'normal',
                      textDecoration: `${obj.meta?.isUnderline ? 'underline' : ''} ${obj.meta?.isStrikethrough ? 'line-through' : ''}`.trim() || 'none',
                      textAlign: obj.meta?.alignment || 'left',
                      color: obj.color || '#4A3E31',
                      backgroundColor: obj.meta?.bgColor || 'transparent',
                    }}
                  >
                    <textarea
                      value={obj.content}
                      disabled={obj.isLocked}
                      onChange={(e) => {
                        const updated = floatingObjects.map(o => o.id === obj.id ? { ...o, content: e.target.value } : o);
                        onChange(updated);
                      }}
                      onBlur={() => saveState(floatingObjects)}
                      className="w-full bg-transparent border-none outline-none resize-none overflow-hidden placeholder-cozy-text-muted/60"
                      placeholder="Type cozy thoughts here..."
                      style={{ height: 'auto', minHeight: '30px' }}
                    />
                  </div>
                )}

                {/* 2. EMOJI OBJECT */}
                {obj.type === 'emoji' && (
                  <div className="w-full h-full flex items-center justify-center text-6xl select-none select-none drop-shadow-md">
                    {obj.content}
                  </div>
                )}

                {/* 3. STICKER BADGES */}
                {obj.type === 'sticker' && (
                  <div 
                    className="w-full h-full rounded-2xl p-2 flex flex-col items-center justify-center border-4 border-[#4A3E31] text-center cozy-shadow-sm rotate-2 font-black tracking-tight"
                    style={{ backgroundColor: obj.color || '#EF9A7A' }}
                  >
                    <span className="text-3xl mb-1">{obj.content}</span>
                    <span className="text-[10px] text-white uppercase font-sans tracking-widest">{obj.meta?.stickerType || 'LOVELY'}</span>
                  </div>
                )}

                {/* 4. STICKY NOTES */}
                {obj.type === 'sticky' && (
                  <div 
                    className="w-full h-full p-4 border-2 border-cozy-text-dark bg-[#FFF59D] cozy-shadow-md flex flex-col relative"
                    style={{ backgroundColor: obj.color || '#FFF59D' }}
                  >
                    {/* Tiny virtual pin */}
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-red-400 border border-black/40 shadow-xs" />
                    
                    <textarea
                      value={obj.content}
                      disabled={obj.isLocked}
                      onChange={(e) => {
                        const updated = floatingObjects.map(o => o.id === obj.id ? { ...o, content: e.target.value } : o);
                        onChange(updated);
                      }}
                      onBlur={() => saveState(floatingObjects)}
                      className="w-full flex-1 bg-transparent border-none outline-none resize-none font-handwriting text-sm text-cozy-text-dark placeholder-cozy-text-muted/70 pt-2 leading-relaxed"
                      placeholder="Write a warm note... 📝"
                    />
                  </div>
                )}

                {/* 5. IMAGE / COLLAGE SQUARES */}
                {obj.type === 'image' && (
                  <div className="w-full h-full bg-white p-2 border-2 border-cozy-text-dark shadow-md flex flex-col rounded-sm">
                    {obj.content ? (
                      <img 
                        src={obj.content} 
                        alt="Scrapbook collage" 
                        className="w-full h-full object-cover rounded-xs border border-cozy-text-dark/10"
                        referrerPolicy="no-referrer"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-cozy-bg/50 border border-dashed border-cozy-text-dark/20 flex flex-col items-center justify-center p-2 text-center text-xs text-cozy-text-muted">
                        <ImageIcon size={18} className="mb-1" />
                        <span className="text-[10px] font-bold">Empty Image</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. DRAWING CANVAS BOARD */}
                {obj.type === 'draw' && (
                  <FloatingDrawBoard 
                    id={obj.id}
                    savedDataUrl={obj.content}
                    width={obj.width}
                    height={obj.height}
                    isLocked={obj.isLocked}
                    onSaveDrawing={(dataUrl) => handleUpdateDrawingData(obj.id, dataUrl)}
                  />
                )}

                {/* 7. GEOMETRIC SHAPES */}
                {obj.type === 'shape' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShapeRenderer 
                      shapeType={obj.meta?.shapeType || 'square'} 
                      color={obj.color || '#EF9A7A'} 
                      borderColor={obj.borderColor || '#4A3E31'}
                    />
                  </div>
                )}

                {/* 8. DECORATIVE ELEMENTS (Washi tape, sparkles, highlighter) */}
                {obj.type === 'decorative' && (
                  <DecorativeRenderer 
                    type={obj.meta?.decoType || 'washi-tape'} 
                    color={obj.color || '#EF9A7A'}
                    pattern={obj.meta?.washiPattern}
                  />
                )}

                {/* 9. FILE ATTACHMENTS */}
                {obj.type === 'file' && (
                  <div className="w-full h-full bg-[#FDFDFD] border-2 border-dashed border-[#E2D1C3] p-3 rounded-2xl flex items-center justify-between gap-2 font-sans shadow-sm select-none">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[10px] font-bold text-cozy-text-dark truncate">{obj.content}</div>
                        <div className="text-[8px] text-cozy-text-muted font-mono uppercase truncate">{obj.color || 'Document'}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast(`Downloading: ${obj.content} 📂`);
                      }}
                      className="p-1.5 hover:bg-[#FDF8F1] rounded-lg text-cozy-text-muted hover:text-cozy-text-dark border border-[#E2D1C3]/60 transition cursor-pointer shrink-0"
                      title="Download"
                    >
                      <FileDown size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Interactive Resize Handle (Bottom-Right) */}
              {isSelected && !obj.isLocked && obj.type !== 'text' && (
                <div 
                  className="absolute bottom-0 right-0 w-4 h-4 bg-white border-2 border-cozy-text-dark cursor-se-resize rounded-full shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition pointer-events-auto"
                  onMouseDown={(e) => startResize(e, obj)}
                  onTouchStart={(e) => startResize(e, obj)}
                  title="Drag to Resize"
                >
                  <span className="text-[8px] text-cozy-text-dark font-black">↘</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. FIXED BOTTOM-RIGHT SCRAPBOOK TOOLS BUTTON AND ACCORDION PANEL */}
      <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end pointer-events-none">
        
        {/* Toggle tools drawer */}
        <div className="flex flex-col items-end pointer-events-auto select-none">
          
          {/* Drawer Panel */}
          <AnimatePresence>
            {isToolsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                className="mb-3 w-80 max-h-[70vh] bg-white border-3 border-cozy-text-dark rounded-2xl shadow-2xl p-4 flex flex-col text-cozy-text-dark toolbox-panel overflow-hidden cozy-shadow-lg"
              >
                {/* Header with Close and Undo/Redo */}
                <div className="flex justify-between items-center pb-2.5 mb-3 border-b-2 border-cozy-text-dark/15">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="text-cozy-orange animate-pulse w-4 h-4" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Cozy Toolbox</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Undo/Redo */}
                    <button
                      onClick={handleUndo}
                      className="p-1 hover:bg-cozy-orange/10 rounded-lg text-cozy-text-muted hover:text-cozy-text-dark transition"
                      title="Undo decorative action"
                    >
                      <Undo size={14} />
                    </button>
                    <button
                      onClick={handleRedo}
                      className="p-1 hover:bg-cozy-orange/10 rounded-lg text-cozy-text-muted hover:text-cozy-text-dark transition"
                      title="Redo decorative action"
                    >
                      <Redo size={14} />
                    </button>
                    <button 
                      onClick={() => setIsToolsOpen(false)}
                      className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Toolbox Navigation Tab Slots */}
                <div className="flex gap-1 overflow-x-auto pb-2 border-b border-cozy-text-dark/10 scrollbar-none mb-3 shrink-0">
                  {(['text', 'sticky', 'emoji', 'image', 'shape', 'deco'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wide rounded-md border border-cozy-text-dark/20 transition cursor-pointer shrink-0 ${
                        activeTab === tab 
                          ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                          : 'bg-[#FDF8F1] hover:bg-white text-cozy-text-muted'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab content area */}
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[50vh] pr-1">
                  
                  {/* TEXT TAB */}
                  {activeTab === 'text' && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-cozy-text-muted mb-2">ADD A FLOATING TEXT BOX</p>
                        <button
                          onClick={() => spawnObject('text', {
                            content: 'Happy thoughts go here ✨',
                            color: '#4A3E31',
                            meta: { fontFamily: 'handwriting', fontSize: 'md', alignment: 'center' }
                          })}
                          className="w-full py-2.5 bg-cozy-orange hover:bg-opacity-90 text-white font-black text-xs border-2 border-cozy-text-dark rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <TypeIcon size={14} />
                          <span>Insert Floating Text Box</span>
                        </button>
                      </div>

                      {activeObj && activeObj.type === 'text' ? (
                        <div className="p-3 bg-cozy-bg/50 border border-cozy-text-dark/20 rounded-xl space-y-2">
                          <p className="text-[9px] font-black text-cozy-orange uppercase tracking-wider">Format Selected Text Box</p>
                          
                          {/* Rich styles */}
                          <div className="flex flex-wrap gap-1">
                            <button
                              onClick={() => updateTextMeta(activeObj.id, 'isBold', !activeObj.meta?.isBold)}
                              className={`p-1.5 border rounded-lg transition ${activeObj.meta?.isBold ? 'bg-cozy-orange/20 border-cozy-orange' : 'bg-white border-gray-200'}`}
                            >
                              <Bold size={12} />
                            </button>
                            <button
                              onClick={() => updateTextMeta(activeObj.id, 'isItalic', !activeObj.meta?.isItalic)}
                              className={`p-1.5 border rounded-lg transition ${activeObj.meta?.isItalic ? 'bg-cozy-orange/20 border-cozy-orange' : 'bg-white border-gray-200'}`}
                            >
                              <Italic size={12} />
                            </button>
                            <button
                              onClick={() => updateTextMeta(activeObj.id, 'isUnderline', !activeObj.meta?.isUnderline)}
                              className={`p-1.5 border rounded-lg transition ${activeObj.meta?.isUnderline ? 'bg-cozy-orange/20 border-cozy-orange' : 'bg-white border-gray-200'}`}
                            >
                              <Underline size={12} />
                            </button>
                            <button
                              onClick={() => updateTextMeta(activeObj.id, 'isStrikethrough', !activeObj.meta?.isStrikethrough)}
                              className={`p-1.5 border rounded-lg transition ${activeObj.meta?.isStrikethrough ? 'bg-cozy-orange/20 border-cozy-orange' : 'bg-white border-gray-200'}`}
                            >
                              <Strikethrough size={12} />
                            </button>
                          </div>

                          {/* Font family */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="text-[8px] font-bold text-cozy-text-muted">Font Family</label>
                              <select
                                value={activeObj.meta?.fontFamily || 'sans'}
                                onChange={(e) => updateTextMeta(activeObj.id, 'fontFamily', e.target.value)}
                                className="w-full text-[10px] p-1 border rounded bg-white font-sans outline-none"
                              >
                                <option value="sans">Quicksand (Sans)</option>
                                <option value="serif">Georgia (Serif)</option>
                                <option value="mono">Fira Mono (Tech)</option>
                                <option value="handwriting">Kalam (Handwritten)</option>
                              </select>
                            </div>

                            {/* Font size */}
                            <div>
                              <label className="text-[8px] font-bold text-cozy-text-muted">Font Size</label>
                              <select
                                value={activeObj.meta?.fontSize || 'md'}
                                onChange={(e) => updateTextMeta(activeObj.id, 'fontSize', e.target.value)}
                                className="w-full text-[10px] p-1 border rounded bg-white outline-none"
                              >
                                <option value="xs">Extra Small</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                                <option value="xl">Extra Large</option>
                                <option value="2xl">Double XL</option>
                                <option value="3xl">Display Headline</option>
                              </select>
                            </div>
                          </div>

                          {/* Text alignments */}
                          <div>
                            <label className="text-[8px] font-bold text-cozy-text-muted block mb-1">Text Alignment</label>
                            <div className="flex gap-1">
                              {(['left', 'center', 'right'] as const).map(align => (
                                <button
                                  key={align}
                                  onClick={() => updateTextMeta(activeObj.id, 'alignment', align)}
                                  className={`flex-1 p-1 border rounded-lg text-[10px] font-bold transition flex justify-center ${activeObj.meta?.alignment === align ? 'bg-cozy-orange text-white' : 'bg-white text-cozy-text-dark'}`}
                                >
                                  {align === 'left' ? <AlignLeft size={11} /> : align === 'center' ? <AlignCenter size={11} /> : <AlignRight size={11} />}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Color Customizer */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[8px] font-bold text-cozy-text-muted">Text Color</label>
                              <input
                                type="color"
                                value={activeObj.color || '#4A3E31'}
                                onChange={(e) => {
                                  const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, color: e.target.value } : o);
                                  onChange(updated);
                                }}
                                className="w-full h-6 rounded cursor-pointer border p-0.5"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-cozy-text-muted">Background Box</label>
                              <input
                                type="color"
                                value={activeObj.meta?.bgColor || '#ffffff'}
                                onChange={(e) => updateTextMeta(activeObj.id, 'bgColor', e.target.value)}
                                className="w-full h-6 rounded cursor-pointer border p-0.5"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-cozy-text-muted italic text-center py-2 bg-cozy-bg/40 rounded-xl border">
                          Tip: Select a floating text box on your page to edit font sizes, families, text colors, and highlights! 📝
                        </p>
                      )}
                    </div>
                  )}

                  {/* EMOJIS TAB */}
                  {activeTab === 'emoji' && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-cozy-text-muted mb-1">TAP TO ADD FLOATING EMOJI</p>
                      <div className="grid grid-cols-6 gap-2 bg-[#FDF8F1] p-2.5 border-2 border-cozy-text-dark/10 rounded-xl max-h-48 overflow-y-auto">
                        {['❤️', '✨', '🌸', '🎉', '🌟', '😊', '🐱', '🥐', '☕', '💡', '🔥', '🎨', '✈️', '🍀', '🍕', '📝', '🧸', '🌈', '🌙', '🌊', '🌲', '🏡', '📚', '🌻', '🍓', '🥑', '🎈', '🎵', '☀️', '☁️'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => spawnObject('emoji', { content: emoji, width: 80, height: 80 })}
                            className="text-2.5xl p-1 bg-white hover:bg-cozy-orange/10 border border-cozy-text-dark/5 hover:border-cozy-orange hover:scale-115 rounded-lg transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STICKY NOTES TAB */}
                  {activeTab === 'sticky' && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-cozy-text-muted mb-2">ADD A DECORATIVE STICKY NOTE</p>
                        <button
                          onClick={() => spawnObject('sticky', {
                            content: '',
                            color: '#FFF59D',
                          })}
                          className="w-full py-2.5 bg-cozy-orange hover:bg-opacity-90 text-white font-black text-xs border-2 border-cozy-text-dark rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <StickyNote size={14} />
                          <span>Insert Cozy Sticky Note</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-cozy-text-muted uppercase">Sticky Note Color Presets</p>
                        <div className="grid grid-cols-6 gap-2">
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
                                    onChange(updated);
                                    showToast(`Changed sticky color to ${colorPreset.name}! 🎨`);
                                  } else {
                                    spawnObject('sticky', {
                                      content: '',
                                      color: colorPreset.code
                                    });
                                  }
                                }}
                                className="w-8 h-8 rounded-lg border-2 border-cozy-text-dark shadow-xs hover:scale-110 active:scale-95 transition cursor-pointer flex items-center justify-center relative"
                                style={{ backgroundColor: colorPreset.code }}
                                title={`Use ${colorPreset.name} Sticky`}
                              >
                                {isCurrentSelected && <Check size={12} className="text-cozy-text-dark stroke-[3px]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {activeObj && activeObj.type === 'sticky' ? (
                        <div className="p-3 bg-cozy-bg/50 border border-cozy-text-dark/20 rounded-xl space-y-2">
                          <p className="text-[9px] font-black text-cozy-orange uppercase tracking-wider">Format Selected Sticky Note</p>
                          <div className="flex items-center gap-2">
                            <label className="text-[8px] font-bold text-cozy-text-muted shrink-0">Custom Color</label>
                            <input
                              type="color"
                              value={activeObj.color || '#FFF59D'}
                              onChange={(e) => {
                                const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, color: e.target.value } : o);
                                onChange(updated);
                              }}
                              className="w-full h-6 rounded cursor-pointer border p-0.5"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-cozy-text-muted italic text-center py-2 bg-cozy-bg/40 rounded-xl border">
                          Tip: Tap or drag your sticky note to write thoughts directly! 📝
                        </p>
                      )}
                    </div>
                  )}

                  {/* IMAGES TAB */}
                  {activeTab === 'image' && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-cozy-text-muted mb-1.5">CUSTOM IMAGE URL</p>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          const url = fd.get('url') as string;
                          if (url) {
                            spawnObject('image', { content: url, width: 180, height: 180 });
                            e.currentTarget.reset();
                          }
                        }} className="flex gap-1.5">
                          <input
                            type="url"
                            name="url"
                            placeholder="Paste image web link (https://...)"
                            className="flex-1 p-1.5 text-xs border rounded-lg bg-cozy-bg outline-none"
                            required
                          />
                          <button
                            type="submit"
                            className="px-3 bg-cozy-orange text-white border-2 border-cozy-text-dark rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-opacity-90"
                          >
                            Add
                          </button>
                        </form>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-cozy-text-muted">PRESET NATURE & COZY PHOTOS</p>
                        <div className="grid grid-cols-3 gap-2">
                          {PRESET_IMAGES.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => spawnObject('image', { content: img.url, width: 160, height: 160 })}
                              className="group relative h-14 rounded-lg overflow-hidden border border-cozy-text-dark/20 cursor-pointer hover:border-cozy-orange transition hover:scale-105"
                            >
                              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <span className="text-[8px] text-white font-black uppercase tracking-wider">{img.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SHAPE TAB */}
                  {activeTab === 'shape' && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-cozy-text-muted">GEOMETRIC VECTOR SHAPES</p>
                      
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
                            onClick={() => spawnObject('shape', {
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
                        <div className="p-3 bg-cozy-bg/50 border border-cozy-text-dark/20 rounded-xl space-y-2">
                          <p className="text-[9px] font-black text-cozy-orange uppercase">Style Shape Color</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[8px] font-bold text-cozy-text-muted">Fill Color</label>
                              <input
                                type="color"
                                value={activeObj.color || '#EF9A7A'}
                                onChange={(e) => {
                                  const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, color: e.target.value } : o);
                                  onChange(updated);
                                }}
                                className="w-full h-6 rounded border cursor-pointer p-0.5"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-cozy-text-muted">Border Line</label>
                              <input
                                type="color"
                                value={activeObj.borderColor || '#4A3E31'}
                                onChange={(e) => {
                                  const updated = floatingObjects.map(o => o.id === activeObj.id ? { ...o, borderColor: e.target.value } : o);
                                  onChange(updated);
                                }}
                                className="w-full h-6 rounded border cursor-pointer p-0.5"
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* DECO TAB */}
                  {activeTab === 'deco' && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-cozy-text-muted">WASHI TAPES & SCENE FLOURISHES</p>
                      
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
                              onClick={() => spawnObject('decorative', {
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

                      {/* Sparkles / Highlights */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-cozy-orange tracking-widest uppercase block">Sparkling Clusters</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => spawnObject('decorative', {
                              width: 100,
                              height: 100,
                              color: '#F6D285',
                              meta: { decoType: 'sparkles' }
                            })}
                            className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                          >
                            <Sparkles size={11} className="text-cozy-yellow animate-bounce" />
                            <span>Magical Sparkles</span>
                          </button>

                          <button
                            onClick={() => spawnObject('decorative', {
                              width: 150,
                              height: 140,
                              content: PRESET_IMAGES[0].url,
                              meta: { decoType: 'polaroid' }
                            })}
                            className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                          >
                            <span>📷 Polaroid Frame</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer status */}
                <div className="pt-2 mt-2 border-t border-cozy-text-dark/10 flex justify-between items-center text-[9px] font-extrabold text-cozy-text-muted">
                  <span>{floatingObjects.length} scrap items</span>
                  <button 
                    onClick={() => {
                      if (confirm("Clear all decorative items from this page?")) {
                        saveState([]);
                        setSelectedObjectId(null);
                        showToast("Cleared scrap decorations! 🧹");
                      }
                    }}
                    className="hover:text-rose-600 transition"
                  >
                    Clear All
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Floating Circle Button (fixed to right center) */}
          <button
            onClick={() => setIsToolsOpen(!isToolsOpen)}
            className={`w-12 h-12 rounded-full border-3 border-cozy-text-dark flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 cursor-pointer pointer-events-auto tools-btn ${
              isToolsOpen ? 'bg-cozy-text-dark' : 'bg-cozy-orange hover:rotate-12 duration-200'
            }`}
            title="Cozy Toolbox"
          >
            {isToolsOpen ? (
              <X size={20} strokeWidth={2.5} />
            ) : (
              <>
                <Scissors size={18} strokeWidth={2.2} />
                <span className="text-[6px] font-black tracking-tighter -mt-0.5">CRAFT</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Interactive Drawing Board Component inside a Floating Box
 */
interface FloatingDrawBoardProps {
  id: string;
  savedDataUrl: string;
  width: number;
  height: number;
  isLocked: boolean;
  onSaveDrawing: (dataUrl: string) => void;
}

function FloatingDrawBoard({
  id,
  savedDataUrl,
  width,
  height,
  isLocked,
  onSaveDrawing
}: FloatingDrawBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushColor, setBrushColor] = useState('#4A3E31');
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number, y: number } | null>(null);

  // Redraw saved image onto canvas when width/height or image changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-dpi / clear sizes
    canvas.width = width;
    canvas.height = height;

    // Setup brush defaults
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (savedDataUrl) {
      const img = new Image();
      img.src = savedDataUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
    } else {
      // Whiteboard clean
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
  }, [width, height, savedDataUrl]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked) return;
    e.stopPropagation(); // prevent dragging item
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    lastPointRef.current = coords;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isLocked) return;
    e.stopPropagation();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!coords || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    
    if (lastPointRef.current) {
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(coords.x, coords.y);
    } else {
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x, coords.y);
    }
    
    ctx.stroke();
    lastPointRef.current = coords;
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;

    // Save state back
    const canvas = canvasRef.current;
    if (canvas) {
      onSaveDrawing(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    onSaveDrawing('');
  };

  return (
    <div className="w-full h-full bg-white rounded-xl border-2 border-cozy-text-dark flex flex-col overflow-hidden pointer-events-auto">
      {/* Mini Color Picker Tool Rack */}
      <div className="bg-cozy-bg px-2 py-1 flex justify-between items-center border-b border-cozy-text-dark/15 select-none shrink-0 text-[10px]">
        <div className="flex items-center gap-1">
          {['#4A3E31', '#EF9A7A', '#96A376', '#F6D285', '#E5989B', '#4C566A'].map(color => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              className="w-3.5 h-3.5 rounded-full border border-black/20 hover:scale-110 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: color,
                boxShadow: brushColor === color ? '0 0 0 1.5px #4A3E31' : 'none'
              }}
            />
          ))}
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-4 h-4 rounded-full border cursor-pointer p-0"
          />
        </div>

        {/* Brush size */}
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min="1"
            max="12"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-12 h-1 accent-cozy-text-dark cursor-pointer"
          />
          <button 
            onClick={clearCanvas}
            className="text-[9px] bg-white border px-1 rounded text-cozy-text-muted hover:text-rose-600 font-extrabold cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main Drawing Area */}
      <canvas
        ref={canvasRef}
        className="w-full flex-1 cursor-crosshair bg-white"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  );
}

/**
 * Geometric Vector Shape Renderer Component
 */
function ShapeRenderer({ 
  shapeType, 
  color, 
  borderColor 
}: { 
  shapeType: string; 
  color: string; 
  borderColor: string; 
}) {
  const commonProps = {
    fill: color,
    stroke: borderColor,
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'drop-shadow-sm'
  };

  switch (shapeType) {
    case 'circle':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="42" {...commonProps} />
        </svg>
      );
    case 'triangle':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,10 90,88 10,88" {...commonProps} />
        </svg>
      );
    case 'arrow':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 10,50 L 90,50 M 65,20 L 90,50 L 65,80" fill="none" stroke={borderColor} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" {...commonProps} />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 12,35 A 22,22 0 0,1 50,22 A 22,22 0 0,1 88,35 Q 88,60 50,88 Q 12,60 12,35 Z" {...commonProps} />
        </svg>
      );
    case 'square':
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="10" y="10" width="80" height="80" rx="8" {...commonProps} />
        </svg>
      );
  }
}

/**
 * Decorative element renderer: Washi Tape patterns, sparkles, polaroid template
 */
function DecorativeRenderer({ 
  type, 
  color,
  pattern 
}: { 
  type: string; 
  color: string;
  pattern?: string;
}) {
  if (type === 'washi-tape') {
    // Get pattern styles
    let backgroundStyle = {};
    if (pattern === 'stripes') {
      backgroundStyle = {
        backgroundImage: `repeating-linear-gradient(45deg, ${color} 0, ${color} 8px, transparent 8px, transparent 16px)`,
        backgroundColor: `${color}40`
      };
    } else if (pattern === 'dots') {
      backgroundStyle = {
        backgroundImage: `radial-gradient(${color} 20%, transparent 20%)`,
        backgroundSize: '10px 10px',
        backgroundColor: `${color}25`
      };
    } else if (pattern === 'grid') {
      backgroundStyle = {
        backgroundImage: `linear-gradient(to right, ${color}30 1px, transparent 1px), linear-gradient(to bottom, ${color}30 1px, transparent 1px)`,
        backgroundSize: '12px 12px',
        backgroundColor: '#FFFFFF',
        border: `1.5px solid ${color}40`
      };
    } else {
      backgroundStyle = {
        backgroundColor: `${color}CD`, // slightly semi-transparent tape
      };
    }

    return (
      <div 
        className="w-full h-full relative cozy-shadow-sm border-x-4 border-dashed border-white/20 select-none overflow-hidden"
        style={{
          ...backgroundStyle,
          // Ripped fiber edges typical of tape
          clipPath: 'polygon(0% 12%, 3% 2%, 6% 15%, 10% 4%, 15% 14%, 20% 3%, 25% 15%, 30% 2%, 35% 12%, 40% 1%, 45% 15%, 50% 3%, 55% 11%, 60% 0%, 65% 14%, 70% 2%, 75% 13%, 80% 1%, 85% 15%, 90% 2%, 95% 12%, 100% 0%, 100% 88%, 97% 98%, 94% 85%, 90% 96%, 85% 86%, 80% 97%, 75% 85%, 70% 98%, 65% 88%, 60% 100%, 55% 85%, 50% 97%, 45% 89%, 40% 99%, 35% 88%, 30% 98%, 25% 85%, 20% 97%, 15% 88%, 10% 99%, 5% 85%, 0% 100%)'
        }}
      />
    );
  }

  if (type === 'sparkles') {
    return (
      <div className="w-full h-full relative flex items-center justify-center text-cozy-yellow">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          {/* Hand drawn sparkles */}
          <path d="M 50,15 Q 50,50 15,50 Q 50,50 50,85 Q 50,50 85,50 Q 50,50 50,15 Z" />
          <path d="M 25,25 Q 25,35 15,35 Q 25,35 25,45 Q 25,35 35,35 Q 25,35 25,25 Z" transform="scale(0.5) translate(30, 20)" />
          <path d="M 25,25 Q 25,35 15,35 Q 25,35 25,45 Q 25,35 35,35 Q 25,35 25,25 Z" transform="scale(0.4) translate(160, 130)" />
        </svg>
      </div>
    );
  }

  if (type === 'polaroid') {
    return (
      <div className="w-full h-full bg-white p-3 border-2 border-cozy-text-dark shadow-xl flex flex-col rounded-sm">
        {/* Empty placeholder photo with lovely colors */}
        <div className="w-full flex-1 bg-gradient-to-tr from-rose-100 to-orange-100 border border-cozy-text-dark/10 flex items-center justify-center rounded-xs overflow-hidden">
          <span className="text-xl">☀️</span>
        </div>
        {/* Caption write lines */}
        <div className="pt-2 flex flex-col gap-1 shrink-0 select-none">
          <div className="h-2 bg-[#FDF8F1] border-b border-dashed border-cozy-text-dark/15 w-4/5 mx-auto" />
          <div className="h-2 bg-[#FDF8F1] border-b border-dashed border-cozy-text-dark/15 w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  return null;
}

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
  FileText, FileDown, Hexagon, Cloud, MessageSquare, Moon, Diamond, Flower, Sun
} from 'lucide-react';

export interface FloatingObject {
  id: string;
  type: 'text' | 'emoji' | 'sticker' | 'sticky' | 'image' | 'draw' | 'shape' | 'decorative';
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
    shapeType?: 'square' | 'circle' | 'triangle' | 'arrow' | 'star' | 'heart' | 'hexagon' | 'cloud' | 'bubble' | 'moon' | 'diamond' | 'flower' | 'sun';
    stickerType?: string;
    decoType?: 'washi-tape' | 'sparkles' | 'polaroid' | 'highlighter' | 'botanical-fern' | 'vintage-stamp' | 'coffee-ring' | 'heart-stamp' | 'photo-corners' | 'cozy-pine' | 'soft-mountains' | 'river-pebbles' | 'monstera-leaf';
    highlighterColor?: string;
    washiPattern?: 'dots' | 'stripes' | 'solid' | 'grid' | 'plaid' | 'vintage' | 'checker' | 'celestial' | 'lace';
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
  galleryImages?: string[];
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
  registerActions,
  galleryImages = []
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
    if (type !== 'text') {
      setSelectedObjectId(newObj.id);
    }
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
      <div className="fixed right-6 bottom-6 z-50 flex items-end justify-end pointer-events-none gap-3 max-sm:right-3 max-sm:bottom-3">
        
        {/* Drawer Panel (placed to the left of the pop-out tools stack) */}
        <AnimatePresence>
          {isToolsOpen && (
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.95 }}
              className="w-80 max-sm:fixed max-sm:bottom-24 max-sm:right-3 max-sm:left-3 max-sm:w-auto max-h-[75vh] max-sm:max-h-[45vh] bg-white border-3 border-cozy-text-dark rounded-2xl shadow-2xl p-4 flex flex-col text-cozy-text-dark toolbox-panel overflow-hidden cozy-shadow-lg pointer-events-auto select-none"
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
                    className="p-1 hover:bg-cozy-orange/10 rounded-lg text-cozy-text-muted hover:text-cozy-text-dark transition cursor-pointer"
                    title="Undo decorative action"
                  >
                    <Undo size={14} />
                  </button>
                  <button
                    onClick={handleRedo}
                    className="p-1 hover:bg-cozy-orange/10 rounded-lg text-cozy-text-muted hover:text-cozy-text-dark transition cursor-pointer"
                    title="Redo decorative action"
                  >
                    <Redo size={14} />
                  </button>
                  <button 
                    onClick={() => setIsToolsOpen(false)}
                    className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
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
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-cozy-text-muted">IMAGES FROM YOUR GALLERY</p>
                      {galleryImages && galleryImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {galleryImages.map((imgUrl, i) => (
                            <button
                              key={i}
                              onClick={() => spawnObject('image', { content: imgUrl, width: 160, height: 160 })}
                              className="group relative h-14 rounded-lg overflow-hidden border border-cozy-text-dark/20 cursor-pointer hover:border-cozy-orange transition hover:scale-105 animate-fade-in"
                            >
                              <img src={imgUrl} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <span className="text-[8px] text-white font-black uppercase tracking-wider">Pin</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[9px] text-cozy-text-muted italic bg-cozy-bg/50 p-2 rounded-lg text-center border font-semibold">
                          No gallery images uploaded yet. Create or upload a photo to this diary page! 📸
                        </p>
                      )}
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
                        { type: 'heart', icon: <Heart size={16} /> },
                        { type: 'hexagon', icon: <Hexagon size={16} /> },
                        { type: 'cloud', icon: <Cloud size={16} /> },
                        { type: 'bubble', icon: <MessageSquare size={16} /> },
                        { type: 'moon', icon: <Moon size={16} /> },
                        { type: 'diamond', icon: <Diamond size={16} /> },
                        { type: 'flower', icon: <Flower size={16} /> },
                        { type: 'sun', icon: <Sun size={16} /> }
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
                          { pattern: 'solid', color: '#C84B31', label: 'Terracotta Red' },
                          { pattern: 'stripes', color: '#4D623F', label: 'Deep Sage Olive' },
                          { pattern: 'dots', color: '#D6952B', label: 'Harvest Gold' },
                          { pattern: 'grid', color: '#1F3A52', label: 'Indigo Grid' },
                          { pattern: 'plaid', color: '#2C4B35', label: 'Forest Plaid' },
                          { pattern: 'vintage', color: '#8E635F', label: 'Dusty Mauve' },
                          { pattern: 'checker', color: '#6E5138', label: 'Retro Checker' },
                          { pattern: 'celestial', color: '#19153B', label: 'Starry Midnight' },
                          { pattern: 'lace', color: '#7D1A2C', label: 'Burgundy Lace' },
                          { pattern: 'solid', color: '#155E63', label: 'Royal Teal' }
                        ].map(t => {
                          const getPreviewStyle = (pat: string, col: string) => {
                            if (pat === 'stripes') {
                              return {
                                backgroundImage: `repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.25) 0, rgba(255, 255, 255, 0.25) 2px, transparent 2px, transparent 4px)`,
                                backgroundColor: col,
                              };
                            }
                            if (pat === 'dots') {
                              return {
                                backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 20%, transparent 20%)`,
                                backgroundSize: '4px 4px',
                                backgroundColor: col,
                              };
                            }
                            if (pat === 'grid') {
                              return {
                                backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.3) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0.5px, transparent 0.5px)`,
                                backgroundSize: '4px 4px',
                                backgroundColor: col,
                              };
                            }
                            if (pat === 'plaid') {
                              return {
                                backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.2) 50%, transparent 50%), linear-gradient(rgba(255, 255, 255, 0.2) 50%, transparent 50%)`,
                                backgroundSize: '6px 6px',
                                backgroundColor: col,
                              };
                            }
                            if (pat === 'vintage') {
                              return {
                                backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 15%, transparent 15%)`,
                                backgroundSize: '4px 4px',
                                backgroundColor: col,
                              };
                            }
                            if (pat === 'checker') {
                              return {
                                backgroundImage: `linear-gradient(45deg, rgba(255, 255, 255, 0.2) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.2) 75%), 
                                                  linear-gradient(45deg, rgba(255, 255, 255, 0.2) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.2) 75%)`,
                                backgroundSize: '6px 6px',
                                backgroundPosition: '0 0, 3px 3px',
                                backgroundColor: col,
                              };
                            }
                            if (pat === 'celestial') {
                              return {
                                backgroundImage: `radial-gradient(circle, #FCF8F2 20%, transparent 20%)`,
                                backgroundSize: '6px 6px',
                                backgroundColor: col,
                              };
                            }
                            if (pat === 'lace') {
                              return {
                                borderTop: '1px dotted rgba(255, 255, 255, 0.6)',
                                borderBottom: '1px dotted rgba(255, 255, 255, 0.6)',
                                backgroundColor: col,
                              };
                            }
                            return {
                              backgroundColor: col,
                            };
                          };

                          return (
                            <button
                              key={t.label}
                              onClick={() => spawnObject('decorative', {
                                width: 140,
                                height: 32,
                                color: t.color,
                                meta: { decoType: 'washi-tape', washiPattern: t.pattern as any }
                              })}
                              className="p-1.5 bg-[#FDF8F1] border border-cozy-text-dark/15 rounded-lg text-[9px] font-black text-left flex items-center gap-1.5 cursor-pointer hover:border-cozy-text-dark transition-all duration-200 hover:translate-y-[-1px] hover:shadow-xs"
                            >
                              <span className="w-5 h-3.5 rounded-xs border border-black/15 shadow-xs overflow-hidden block shrink-0" style={getPreviewStyle(t.pattern, t.color)} />
                              <span className="truncate">{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sparkles & Frames */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-cozy-orange tracking-widest uppercase block">Sparkling Clusters & Frames</span>
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

                        <button
                          onClick={() => spawnObject('decorative', {
                            width: 100,
                            height: 100,
                            meta: { decoType: 'photo-corners' }
                          })}
                          className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                        >
                          <span>📐 Photo Corners</span>
                        </button>
                      </div>
                    </div>

                    {/* Cozy & Botanical Stamps */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-cozy-orange tracking-widest uppercase block">Cozy & Botanical Stamps</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => spawnObject('decorative', {
                            width: 100,
                            height: 100,
                            meta: { decoType: 'botanical-fern' }
                          })}
                          className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1.5 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                        >
                          <span>🌿 Pressed Fern</span>
                        </button>

                        <button
                          onClick={() => spawnObject('decorative', {
                            width: 110,
                            height: 110,
                            meta: { decoType: 'coffee-ring' }
                          })}
                          className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1.5 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                        >
                          <span>☕ Coffee Stain</span>
                        </button>

                        <button
                          onClick={() => spawnObject('decorative', {
                            width: 80,
                            height: 80,
                            meta: { decoType: 'heart-stamp' }
                          })}
                          className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1.5 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                        >
                          <span>❤️ Heart Stamp</span>
                        </button>

                        <button
                          onClick={() => spawnObject('decorative', {
                            width: 95,
                            height: 110,
                            meta: { decoType: 'vintage-stamp' }
                          })}
                          className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1.5 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                        >
                          <span>📬 Vintage Stamp</span>
                        </button>
                      </div>
                    </div>

                    {/* Nature & Landscape Doodles */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black text-cozy-orange tracking-widest uppercase block">Nature & Landscapes</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => spawnObject('decorative', {
                            width: 90,
                            height: 110,
                            meta: { decoType: 'cozy-pine' }
                          })}
                          className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1.5 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                        >
                          <span>🌲 Cozy Pine</span>
                        </button>

                        <button
                          onClick={() => spawnObject('decorative', {
                            width: 120,
                            height: 100,
                            meta: { decoType: 'soft-mountains' }
                          })}
                          className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1.5 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                        >
                          <span>⛰️ Soft Mountains</span>
                        </button>

                        <button
                          onClick={() => spawnObject('decorative', {
                            width: 90,
                            height: 90,
                            meta: { decoType: 'river-pebbles' }
                          })}
                          className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1.5 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                        >
                          <span>🪨 River Pebbles</span>
                        </button>

                        <button
                          onClick={() => spawnObject('decorative', {
                            width: 100,
                            height: 100,
                            meta: { decoType: 'monstera-leaf' }
                          })}
                          className="p-2 border border-cozy-text-dark/15 rounded-lg text-[9px] font-black flex items-center justify-center gap-1.5 cursor-pointer bg-[#FDF8F1] hover:border-cozy-text-dark"
                        >
                          <span>🍃 Monstera Leaf</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Right side vertical column containing popped out tool icons and the CRAFT button */}
        <div className="flex flex-col items-center pointer-events-auto gap-2.5 select-none shrink-0">
          
          {/* Vertical Pop-out Stack */}
          <AnimatePresence>
            {isToolsOpen && (
              <div className="flex flex-col items-center gap-2 mb-1">
                {[
                  { id: 'text', label: 'Text Editor', icon: Type, bgColor: '#FF8A65' },
                  { id: 'sticky', label: 'Sticky Note', icon: StickyNote, bgColor: '#FFF176' },
                  { id: 'emoji', label: 'Emoji Stamp', icon: Smile, bgColor: '#81C784' },
                  { id: 'image', label: 'Insert Image', icon: ImageIcon, bgColor: '#4FC3F7' },
                  { id: 'shape', label: 'Shapes', icon: Square, bgColor: '#BA68C8' },
                  { id: 'deco', label: 'Deco Tapes', icon: Sparkles, bgColor: '#F06292' },
                ].map((tool, index, arr) => {
                  const Icon = tool.icon;
                  const isActive = activeTab === tool.id;
                  
                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        transition: {
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                          delay: (arr.length - 1 - index) * 0.04
                        }
                      }}
                      exit={{ 
                        opacity: 0, 
                        y: 20, 
                        scale: 0.8,
                        transition: {
                          duration: 0.15,
                          delay: index * 0.02
                        }
                      }}
                      className="relative group"
                    >
                      {/* Tool Label Tooltip (Sliding out to the left) */}
                      <span className="absolute right-14 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-cozy-text-dark text-[#FAF6EB] text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md border-2 border-cozy-text-dark opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50">
                        {tool.label}
                      </span>
                      
                      {/* Tool Button */}
                      <button
                        onClick={() => {
                          setActiveTab(tool.id as any);
                          showToast(`Opened ${tool.label}! 🎨`);
                          
                          // Quick immediate editing actions
                          if (tool.id === 'text') {
                            spawnObject('text', {
                              content: 'Happy thoughts go here ✨',
                              color: '#4A3E31',
                              meta: { fontFamily: 'handwriting', fontSize: 'md', alignment: 'center' }
                            });
                          } else if (tool.id === 'sticky') {
                            spawnObject('sticky', {
                              content: '',
                              color: '#FFF59D',
                            });
                          }
                        }}
                        style={{ 
                          backgroundColor: isActive ? 'var(--color-cozy-orange, #FF7F50)' : '#FFFFFF',
                          borderColor: 'var(--color-cozy-text-dark, #4A3E31)'
                        }}
                        className={`w-11 h-11 rounded-full border-3 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer relative ${
                          isActive ? 'text-white scale-105' : 'text-cozy-text-dark hover:bg-[#FDF8F1]'
                        }`}
                        title={tool.label}
                      >
                        <Icon size={18} strokeWidth={isActive ? 2.8 : 2.2} />
                        
                        {/* Active Dot Indicator */}
                        {isActive && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white border-2 border-cozy-text-dark rounded-full animate-ping" />
                        )}
                        {isActive && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cozy-orange border-2 border-cozy-text-dark rounded-full" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          {/* Main Floating Circle Button (fixed to right center / bottom right) */}
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
    case 'hexagon':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,8 88,30 88,70 50,92 12,70 12,30" {...commonProps} />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 25,70 C 18,70 12,64 12,57 C 12,51 16,45 22,44 C 24,30 36,20 50,20 C 62,20 73,28 77,40 C 84,41 90,47 90,55 C 90,63 83,70 75,70 Z" {...commonProps} />
        </svg>
      );
    case 'bubble':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 15,20 H 85 C 90,20 94,24 94,29 V 65 C 94,70 90,74 85,74 H 45 L 25,86 V 74 H 15 C 10,74 6,70 6,65 V 29 C 6,24 10,20 15,20 Z" {...commonProps} />
        </svg>
      );
    case 'moon':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 60,15 A 35,35 0 0,0 60,85 A 45,45 0 0,1 60,15 Z" {...commonProps} />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,8 90,50 50,92 10,50" {...commonProps} />
        </svg>
      );
    case 'flower':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M 50,32 C 55,20 68,25 62,35 C 73,32 75,45 65,47 C 73,55 60,65 53,55 C 47,65 34,55 42,47 C 32,45 34,32 45,35 C 39,25 52,20 50,32 Z" {...commonProps} />
          <circle cx="50" cy="42" r="8" stroke={borderColor} strokeWidth={2} fill="#FCF8F2" />
        </svg>
      );
    case 'sun':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="20" {...commonProps} />
          <path d="M 50,10 L 50,22 M 50,78 L 50,90 M 10,50 L 22,50 M 78,50 L 90,50 M 22,22 L 31,31 M 69,69 L 78,78 M 22,68 L 31,59 M 69,31 L 78,22" stroke={borderColor || color} strokeWidth={5} strokeLinecap="round" />
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
    // Get pattern styles with deeper, richer solid backgrounds and beautiful overlays
    let backgroundStyle = {};
    if (pattern === 'stripes') {
      backgroundStyle = {
        backgroundImage: `repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.18) 0, rgba(255, 255, 255, 0.18) 8px, transparent 8px, transparent 16px)`,
        backgroundColor: color,
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      };
    } else if (pattern === 'dots') {
      backgroundStyle = {
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.35) 25%, transparent 25%)`,
        backgroundSize: '10px 10px',
        backgroundColor: color,
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      };
    } else if (pattern === 'grid') {
      backgroundStyle = {
        backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
        backgroundSize: '12px 12px',
        backgroundColor: color,
        border: `1.5px solid rgba(0, 0, 0, 0.15)`
      };
    } else if (pattern === 'plaid') {
      backgroundStyle = {
        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.15) 50%, transparent 50%), linear-gradient(rgba(255, 255, 255, 0.15) 50%, transparent 50%)`,
        backgroundSize: '16px 16px',
        backgroundColor: color,
        border: `1.5px solid rgba(0, 0, 0, 0.15)`
      };
    } else if (pattern === 'vintage') {
      backgroundStyle = {
        backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.25) 15%, transparent 15%), radial-gradient(circle, rgba(255, 255, 255, 0.25) 15%, transparent 15%)`,
        backgroundPosition: '0 0, 6px 6px',
        backgroundSize: '12px 12px',
        backgroundColor: color,
        border: `1.2px dashed rgba(255, 255, 255, 0.4)`
      };
    } else if (pattern === 'checker') {
      backgroundStyle = {
        backgroundImage: `linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.15) 75%), 
                          linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.15) 75%)`,
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 8px 8px',
        backgroundColor: color,
        border: `1.5px solid rgba(0, 0, 0, 0.15)`
      };
    } else if (pattern === 'celestial') {
      backgroundStyle = {
        backgroundImage: `radial-gradient(circle, #FCF8F2 12%, transparent 12%), radial-gradient(circle, rgba(255, 255, 255, 0.4) 8%, transparent 8%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
        backgroundColor: color,
        border: `1.5px solid rgba(0, 0, 0, 0.15)`
      };
    } else if (pattern === 'lace') {
      backgroundStyle = {
        backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 8px, rgba(255, 255, 255, 0.2) 8px, rgba(255, 255, 255, 0.2) 10px)`,
        backgroundColor: color,
        borderTop: `2px dotted rgba(255, 255, 255, 0.7)`,
        borderBottom: `2px dotted rgba(255, 255, 255, 0.7)`
      };
    } else {
      backgroundStyle = {
        backgroundColor: color, // actual rich deep solid color!
        borderTop: '1.5px solid rgba(255, 255, 255, 0.25)',
        borderBottom: '1.5px solid rgba(0, 0, 0, 0.15)'
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

  if (type === 'photo-corners') {
    return (
      <div className="w-full h-full relative">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[#4A3E31]" stroke="#FCF8F2" strokeWidth="1.5">
          {/* Top-Left Corner */}
          <path d="M 0,0 L 30,0 L 0,30 Z" />
          {/* Top-Right Corner */}
          <path d="M 100,0 L 70,0 L 100,30 Z" />
          {/* Bottom-Left Corner */}
          <path d="M 0,100 L 30,100 L 0,70 Z" />
          {/* Bottom-Right Corner */}
          <path d="M 100,100 L 70,100 L 100,70 Z" />
        </svg>
      </div>
    );
  }

  if (type === 'botanical-fern') {
    return (
      <div className="w-full h-full relative flex items-center justify-center opacity-85 hover:opacity-100 transition">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current text-[#7F8C5E]" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* Main stem */}
          <path d="M 50,90 Q 48,50 50,10" />
          {/* Fern leaves */}
          <path d="M 50,80 Q 25,75 15,65 Q 40,75 50,80" fill="#96A37622" />
          <path d="M 50,80 Q 75,75 85,65 Q 60,75 50,80" fill="#96A37622" />
          
          <path d="M 50,65 Q 20,58 10,45 Q 38,58 50,65" fill="#96A37633" />
          <path d="M 50,65 Q 80,58 90,45 Q 62,58 50,65" fill="#96A37633" />
          
          <path d="M 50,48 Q 22,40 15,25 Q 38,40 50,48" fill="#96A37644" />
          <path d="M 50,48 Q 78,40 85,25 Q 62,40 50,48" fill="#96A37644" />
          
          <path d="M 50,30 Q 25,22 20,10 Q 38,22 50,30" fill="#96A37655" />
          <path d="M 50,30 Q 75,22 80,10 Q 62,22 50,30" fill="#96A37655" />
        </svg>
      </div>
    );
  }

  if (type === 'coffee-ring') {
    return (
      <div className="w-full h-full relative opacity-70 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full stroke-current text-[#8A7968]" fill="none" strokeWidth="2" strokeLinecap="round">
          <path d="M 50,10 A 40,40 0 1,1 49,10" strokeDasharray="30 4 10 5 45 3" />
          <path d="M 50,18 A 32,32 0 1,1 49,18" strokeWidth="0.8" strokeDasharray="20 10 40 5" opacity="0.6" />
          <circle cx="25" cy="20" r="1.5" fill="#8A7968" />
          <circle cx="85" cy="70" r="1" fill="#8A7968" />
          <circle cx="75" cy="30" r="2" fill="#8A7968" />
        </svg>
      </div>
    );
  }

  if (type === 'heart-stamp') {
    return (
      <div className="w-full h-full relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-cozy-orange/85" stroke="currentColor" strokeWidth="1">
          <path d="M 50,30 C 35,10 10,20 10,45 C 10,70 40,85 50,90 C 60,85 90,70 90,45 C 90,20 65,10 50,30 Z" />
          <path d="M 35,40 L 45,50 M 65,40 L 55,50 M 50,60 L 50,75" stroke="#FCF8F2" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  }

  if (type === 'vintage-stamp') {
    return (
      <div className="w-full h-full bg-[#FAF5EC] p-2 border-2 border-cozy-text-dark relative shadow-md flex flex-col rounded-xs overflow-hidden" style={{
        backgroundImage: `radial-gradient(circle, #FCF8F2 3px, transparent 3px)`,
        backgroundSize: '10px 10px',
        backgroundPosition: '-5px -5px'
      }}>
        <div className="w-full flex-1 bg-[#E8DCC4] border border-cozy-text-dark/10 rounded-xs flex flex-col items-center justify-center p-1 text-cozy-text-dark">
          <span className="text-sm mb-0.5 select-none">🍂</span>
          <span className="text-[6px] font-black tracking-widest uppercase font-mono opacity-80 select-none">COZY POST</span>
          <span className="text-[5px] font-bold font-mono opacity-60 select-none">12¢</span>
        </div>
      </div>
    );
  }

  if (type === 'cozy-pine') {
    return (
      <div className="w-full h-full relative flex items-center justify-center opacity-90 hover:opacity-100 transition">
        <svg viewBox="0 0 100 120" className="w-full h-full stroke-[#4D5B43] fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Trunk */}
          <path d="M 50,115 L 50,30" stroke="#8A7052" strokeWidth="4.5" />
          <path d="M 47,115 L 47,80 M 53,115 L 53,90" stroke="#8A7052" strokeWidth="1" opacity="0.6" />
          
          {/* Base Ground */}
          <path d="M 25,115 Q 50,110 75,115" stroke="#8A7052" strokeWidth="2" />
          <path d="M 35,119 Q 50,116 65,119" stroke="#8A7052" strokeWidth="1" opacity="0.5" />

          {/* Bottom Layer */}
          <path d="M 50,65 L 18,100 Q 50,92 82,100 Z" fill="#6E8462" fillOpacity="0.8" />
          {/* Middle Layer */}
          <path d="M 50,40 L 24,75 Q 50,68 76,75 Z" fill="#7E9671" fillOpacity="0.85" />
          {/* Top Layer */}
          <path d="M 50,15 L 30,48 Q 50,42 70,48 Z" fill="#8EA87F" fillOpacity="0.9" />

          {/* Detailed inner pine lines / leaf textures */}
          <path d="M 50,22 L 50,42 M 50,48 L 50,68 M 50,74 L 50,92" stroke="#FCF8F2" strokeWidth="1.5" opacity="0.3" />
          <path d="M 50,25 L 42,35 M 50,30 L 58,38" stroke="#FCF8F2" strokeWidth="1.5" opacity="0.3" />
          <path d="M 50,52 L 40,62 M 50,58 L 60,68" stroke="#FCF8F2" strokeWidth="1.5" opacity="0.3" />
          <path d="M 50,78 L 38,90 M 50,84 L 62,94" stroke="#FCF8F2" strokeWidth="1.5" opacity="0.3" />
        </svg>
      </div>
    );
  }

  if (type === 'soft-mountains') {
    return (
      <div className="w-full h-full relative flex items-center justify-center opacity-85 hover:opacity-100 transition">
        <svg viewBox="0 0 120 100" className="w-full h-full stroke-[#6E5D4F] fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Back Peak */}
          <path d="M 15,90 L 55,30 L 95,90" fill="#EAE0D5" fillOpacity="0.8" />
          {/* Back Snowcap */}
          <path d="M 55,30 L 48,40 Q 55,44 55,41 Q 55,44 62,40 Z" fill="#FCF8F2" stroke="#6E5D4F" strokeWidth="2" />
          
          {/* Cozy peeking sun */}
          <circle cx="85" cy="35" r="12" fill="#F4A261" fillOpacity="0.85" stroke="#6E5D4F" strokeWidth="2" />
          <path d="M 85,15 L 85,19 M 85,51 L 85,55 M 65,35 L 69,35 M 101,35 L 105,35 M 71,21 L 74,24 M 96,46 L 99,49 M 71,49 L 74,46 M 96,21 L 99,24" stroke="#6E5D4F" strokeWidth="2" />

          {/* Mid Peak */}
          <path d="M 45,90 L 80,40 L 115,90" fill="#DDBB99" fillOpacity="0.8" />
          {/* Mid Snowcap */}
          <path d="M 80,40 L 73,50 Q 80,54 80,51 Q 80,54 87,50 Z" fill="#FCF8F2" stroke="#6E5D4F" strokeWidth="2" />

          {/* Front Peak */}
          <path d="M 25,90 L 65,48 L 105,90" fill="#C3A380" fillOpacity="0.9" />
          {/* Front Snowcap */}
          <path d="M 65,48 L 58,58 Q 65,62 65,59 Q 65,62 72,58 Z" fill="#FCF8F2" stroke="#6E5D4F" strokeWidth="2" />

          {/* Bottom Ground & Grass Tufts */}
          <path d="M 10,90 Q 60,88 110,90" stroke="#6E5D4F" strokeWidth="3" />
          <path d="M 30,90 L 30,85 M 34,90 L 32,83 M 85,90 L 85,84 M 88,90 L 89,86" stroke="#6E5D4F" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (type === 'river-pebbles') {
    return (
      <div className="w-full h-full relative flex items-center justify-center opacity-85 hover:opacity-100 transition">
        <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#4E4C4A] fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Bottom Pebble (Large) */}
          <path d="M 25,78 C 15,68 18,48 40,52 C 62,56 58,86 35,82 Z" fill="#B5B2AB" fillOpacity="0.8" />
          <path d="M 30,70 C 25,65 27,56 38,58" stroke="#FCF8F2" strokeWidth="1.5" opacity="0.4" />

          {/* Right Pebble (Medium) */}
          <path d="M 50,82 C 40,68 46,42 70,48 C 94,54 86,88 62,84 Z" fill="#D1CECB" fillOpacity="0.85" />
          <path d="M 58,74 C 52,64 56,52 70,56" stroke="#FCF8F2" strokeWidth="1.5" opacity="0.4" />

          {/* Top Pebble (Small Stacked) */}
          <path d="M 35,50 C 25,36 40,16 60,22 C 80,28 72,62 48,56 Z" fill="#97948F" fillOpacity="0.9" />
          <path d="M 42,42 C 36,32 46,24 58,28" stroke="#FCF8F2" strokeWidth="1.5" opacity="0.4" />

          {/* Sparkly magical zen highlights */}
          <path d="M 80,18 L 83,23 L 88,24 L 83,25 L 80,30 L 77,25 L 72,24 L 77,23 Z" fill="#E9C46A" stroke="#4E4C4A" strokeWidth="1" />
          <circle cx="85" cy="32" r="2" fill="#E9C46A" stroke="none" />
          <circle cx="72" cy="14" r="1.5" fill="#E9C46A" stroke="none" />
        </svg>
      </div>
    );
  }

  if (type === 'monstera-leaf') {
    return (
      <div className="w-full h-full relative flex items-center justify-center opacity-90 hover:opacity-100 transition">
        <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#4D5A3C] fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Elegant organically tilted full leaf body */}
          <path d="M 50,92 
                   C 32,82 12,65 14,42 
                   C 16,18 36,12 50,22 
                   C 64,12 84,18 86,42 
                   C 88,65 68,82 50,92 Z" fill="#8F9E78" fillOpacity="0.8" />
          
          {/* Main center vein / stem */}
          <path d="M 50,92 L 50,22" stroke="#4D5A3C" strokeWidth="3" />
          
          {/* Side Veins */}
          <path d="M 50,32 Q 32,25 20,28 M 50,32 Q 68,25 80,28" stroke="#4D5A3C" strokeWidth="2" />
          <path d="M 50,48 Q 28,44 16,52 M 50,48 Q 72,44 84,52" stroke="#4D5A3C" strokeWidth="2" />
          <path d="M 50,64 Q 24,66 18,78 M 50,64 Q 76,66 82,78" stroke="#4D5A3C" strokeWidth="2" />
          
          {/* Real cutouts (not white slashes, but actual styled cuts in the shape!) */}
          {/* Let's draw organic oval holes inside the leaf filled with paper background color to simulate cuts */}
          <ellipse cx="36" cy="40" rx="3.5" ry="6.5" transform="rotate(-25 36 40)" fill="#FCF8F2" stroke="#4D5A3C" strokeWidth="2" />
          <ellipse cx="64" cy="40" rx="3.5" ry="6.5" transform="rotate(25 64 40)" fill="#FCF8F2" stroke="#4D5A3C" strokeWidth="2" />
          <ellipse cx="34" cy="58" rx="3" ry="5.5" transform="rotate(-15 34 58)" fill="#FCF8F2" stroke="#4D5A3C" strokeWidth="2" />
          <ellipse cx="66" cy="58" rx="3" ry="5.5" transform="rotate(15 66 58)" fill="#FCF8F2" stroke="#4D5A3C" strokeWidth="2" />
          <ellipse cx="40" cy="74" rx="2.5" ry="4.5" transform="rotate(-5 40 74)" fill="#FCF8F2" stroke="#4D5A3C" strokeWidth="1.8" />
          <ellipse cx="60" cy="74" rx="2.5" ry="4.5" transform="rotate(5 60 74)" fill="#FCF8F2" stroke="#4D5A3C" strokeWidth="1.8" />
        </svg>
      </div>
    );
  }

  return null;
}

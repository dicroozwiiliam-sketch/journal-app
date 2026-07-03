import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Globe, 
  Sparkles, 
  Maximize2, 
  X,
  Image as ImageIcon
} from 'lucide-react';
import { JournalBlock } from './JournalTimeline';

interface GalleryBlockProps {
  block: JournalBlock;
  index: number;
  onUpdate: (blockId: string, updatedFields: Partial<JournalBlock>) => void;
  updateBlockContent: (blockId: string, content: string) => void;
}

const PRESET_AESTHETICS = [
  {
    name: 'Cozy Coffee',
    url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600',
    emoji: '☕️'
  },
  {
    name: 'Misty Forest',
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=600',
    emoji: '🌲'
  },
  {
    name: 'Calm Ocean',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=600',
    emoji: '🌊'
  },
  {
    name: 'Golden Hour',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600',
    emoji: '🌅'
  },
  {
    name: 'Fresh Leaves',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=600',
    emoji: '🌿'
  },
  {
    name: 'Quiet Library',
    url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
    emoji: '📚'
  }
];

export default function GalleryBlock({
  block,
  index,
  onUpdate,
  updateBlockContent
}: GalleryBlockProps) {
  const meta = block.meta || {};
  // Graceful fallback for older 'image' blocks with meta.url instead of meta.urls
  const urls: string[] = meta.urls || (meta.url ? [meta.url] : []);
  
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddUrl = (url: string) => {
    const updatedUrls = [...urls, url];
    onUpdate(block.id, {
      meta: {
        ...meta,
        urls: updatedUrls
      }
    });
    setShowAddMenu(false);
  };

  const handlePromptUrl = () => {
    const url = prompt("Enter custom image URL:");
    if (url && url.trim()) {
      handleAddUrl(url.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          handleAddUrl(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveUrl = (idxToRemove: number) => {
    const updatedUrls = urls.filter((_, idx) => idx !== idxToRemove);
    onUpdate(block.id, {
      meta: {
        ...meta,
        urls: updatedUrls
      }
    });
  };

  const triggerFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Determine grid template based on amount of images
  const getGridClass = () => {
    if (urls.length === 1) return 'grid-cols-1';
    if (urls.length === 2) return 'grid-cols-2 gap-3';
    return 'grid-cols-3 gap-2';
  };

  return (
    <div className="relative w-full bg-white border border-[#E2D1C3] p-5 rounded-2xl shadow-sm space-y-4 font-sans select-none">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cozy-orange/10 rounded-lg text-cozy-orange">
            <ImageIcon size={14} />
          </div>
          <div>
            <span className="text-xs font-extrabold text-cozy-text-dark block">Photo Frame & Gallery</span>
            <span className="text-[9px] text-cozy-text-muted block">Display your favorite memories & aesthetic themes</span>
          </div>
        </div>

        {/* Add photo button */}
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-cozy-orange/15 hover:bg-cozy-orange text-cozy-orange hover:text-white px-2.5 py-1.5 rounded-lg transition duration-200 cursor-pointer"
        >
          <Plus size={11} />
          <span>Add Photo</span>
        </button>
      </div>

      {/* Add Photo Expandable Panel */}
      {showAddMenu && (
        <div className="p-3.5 bg-[#FAF5F0] border border-[#E2D1C3]/60 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between text-[10px] font-bold text-cozy-text-dark">
            <span>CHOOSE HOW TO ADD PHOTO:</span>
            <button 
              type="button" 
              onClick={() => setShowAddMenu(false)}
              className="text-cozy-text-muted hover:text-cozy-text-dark cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={triggerFileSelector}
              className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-cozy-bg border border-[#E2D1C3]/40 rounded-lg text-xs font-semibold text-cozy-text-dark transition cursor-pointer"
            >
              <Upload size={12} className="text-cozy-orange" />
              <span>Upload Device Photo</span>
            </button>
            <button
              type="button"
              onClick={handlePromptUrl}
              className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-cozy-bg border border-[#E2D1C3]/40 rounded-lg text-xs font-semibold text-cozy-text-dark transition cursor-pointer"
            >
              <Globe size={12} className="text-[#3B82F6]" />
              <span>Paste Image URL</span>
            </button>
          </div>

          {/* Presets Grid */}
          <div className="space-y-1.5">
            <div className="text-[9px] font-black uppercase text-cozy-text-muted tracking-wider">
              Or Select Warm Cozy Preset Aesthetic:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_AESTHETICS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddUrl(preset.url)}
                  className="flex items-center gap-1 p-1 bg-white hover:bg-amber-50/50 border border-gray-100 rounded-md text-[10px] font-medium text-cozy-text-dark hover:border-[#EF9A7A]/40 transition text-left cursor-pointer"
                >
                  <span className="text-xs">{preset.emoji}</span>
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Layout Stage */}
      {urls.length === 0 ? (
        // Empty State (Exactly as requested!)
        <div className="border border-dashed border-[#E2D1C3] rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 min-h-[160px] space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 animate-pulse">
            <ImageIcon size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-cozy-text-dark">Your Photo Frame is Empty</h4>
            <p className="text-[10px] text-cozy-text-muted max-w-[240px] leading-relaxed">
              Upload personal photos, memories, or choose from our beautiful visual aesthetic templates to inspire your diary reflections!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddMenu(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-cozy-orange hover:underline cursor-pointer"
          >
            <Plus size={12} />
            <span>Add your first photo</span>
          </button>
        </div>
      ) : (
        // Active Gallery Content (Custom single frame or grid!)
        <div className={`grid ${getGridClass()}`}>
          {urls.map((url, idx) => (
            <div 
              key={idx} 
              className={`group/photo relative bg-[#FDF8F1] overflow-hidden border border-[#E2D1C3] p-1.5 shadow-sm hover:shadow-md hover:scale-[1.01] transition duration-200 ${
                urls.length === 1 
                  ? 'rounded-2xl max-h-[300px]' 
                  : urls.length === 2 
                    ? 'rounded-xl aspect-[4/3]' 
                    : 'rounded-lg aspect-square'
              }`}
            >
              {/* Photo Frame Matte Border/Polaroid feel */}
              <div className="w-full h-full relative overflow-hidden rounded-md">
                <img
                  alt={`Gallery photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                  src={url}
                  referrerPolicy="no-referrer"
                />
                
                {/* Action Hover Overlay */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/photo:opacity-100 transition duration-150 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomedImage(url)}
                    className="p-1.5 bg-white/90 hover:bg-white text-cozy-text-dark rounded-lg shadow-sm transition cursor-pointer"
                    title="Zoom Photo"
                  >
                    <Maximize2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveUrl(idx)}
                    className="p-1.5 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg shadow-sm transition cursor-pointer"
                    title="Delete Photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Polaroid bottom lip for single photo */}
              {urls.length === 1 && (
                <div className="text-center pt-2 pb-0.5 text-[8px] font-bold text-cozy-text-muted/65 uppercase tracking-widest">
                  Memory Frame
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Caption Field */}
      <div className="pt-1.5">
        <input
          type="text"
          value={block.content}
          onChange={(e) => updateBlockContent(block.id, e.target.value)}
          className="w-full text-xs text-cozy-text-muted italic bg-transparent border-none focus:outline-none focus:ring-0 text-center py-0.5"
          placeholder="Add gallery frame caption..."
        />
      </div>

      {/* Lightbox / Zoom Dialog */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-55 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-2 border border-white/10 shadow-2xl">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition shadow-md cursor-pointer z-10"
            >
              <X size={16} />
            </button>
            <img 
              src={zoomedImage} 
              alt="Zoomed" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
}

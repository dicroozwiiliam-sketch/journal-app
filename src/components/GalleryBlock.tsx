import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  X,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { JournalBlock } from './JournalTimeline';

interface GalleryBlockProps {
  block: JournalBlock;
  index: number;
  onUpdate: (blockId: string, updatedFields: Partial<JournalBlock>) => void;
  updateBlockContent: (blockId: string, content: string) => void;
  onAddImageToScrapbook?: (url: string) => void;
}

export default function GalleryBlock({
  block,
  index,
  onUpdate,
  updateBlockContent,
  onAddImageToScrapbook
}: GalleryBlockProps) {
  const meta = block.meta || {};
  const urls: string[] = meta.urls || (meta.url ? [meta.url] : []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleAddUrls = (newUrls: string[]) => {
    const updatedUrls = [...urls, ...newUrls];
    onUpdate(block.id, {
      meta: {
        ...meta,
        urls: updatedUrls
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      const loadedUrls: string[] = [];
      let loadedCount = 0;

      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            loadedUrls.push(dataUrl);
          }
          loadedCount++;
          if (loadedCount === filesArray.length) {
            handleAddUrls(loadedUrls);
          }
        };
        reader.readAsDataURL(file as File);
      });
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

  const triggerFileSelector = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="relative w-full group/gallery select-none font-sans">
      {/* Hidden File Input supporting multiple selections */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
        multiple
      />

      {/* Main Container - Small Thin Border */}
      <div className="w-full bg-[#FAF9F6]/20 border border-[#E2D1C3]/60 rounded-2xl p-2 transition-all duration-300 hover:border-cozy-orange/45">
        {urls.length === 0 ? (
          // Empty State - Ultra Simple Upload Box
          <div 
            onClick={() => triggerFileSelector()}
            className="border border-dashed border-[#E2D1C3] bg-[#FAF8F1]/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#FAF8F1]/80 hover:border-cozy-orange/50 transition-all duration-200 min-h-[140px] space-y-2.5 group/box"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50/80 flex items-center justify-center text-cozy-orange border border-amber-100/60 group-hover/box:scale-110 transition-transform duration-200">
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-black text-cozy-text-dark block uppercase tracking-wide font-mono">Add your photo</span>
              <span className="text-[10px] text-cozy-text-muted block">Click here to upload from device (multiple allowed)</span>
            </div>
          </div>
        ) : (
          // Active State - Responsive uncropped layouts depending on photo count
          <div className="relative w-full">
            {/* Hover Floating Plus Button to add more photos */}
            <button
              type="button"
              onClick={(e) => triggerFileSelector(e)}
              className="absolute top-2 right-2 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-cozy-orange text-cozy-text-dark hover:text-white border border-[#E2D1C3]/80 shadow-md flex items-center justify-center transition-all duration-200 opacity-0 group-hover/gallery:opacity-100 scale-90 group-hover/gallery:scale-100 cursor-pointer"
              title="Add another photo"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>

            {urls.length === 1 ? (
              // Single Photo - Perfect Aspect Ratio Preservation (No Crop!)
              <div className="group/photo relative bg-[#FDF8F1] overflow-hidden border border-[#E2D1C3]/45 p-1.5 rounded-xl shadow-xs hover:shadow-sm transition-all duration-200 mx-auto w-full max-w-2xl">
                <img
                  alt="Single memory"
                  className="w-full h-auto max-h-[600px] object-contain rounded-lg cursor-pointer"
                  src={urls[0]}
                  onClick={() => setZoomedImage(urls[0])}
                  referrerPolicy="no-referrer"
                />
                {/* Trash & Pin to Canvas overlay */}
                <div className="absolute top-3.5 right-3.5 opacity-0 group-hover/photo:opacity-100 transition-all duration-150 z-10 flex gap-1.5">
                  {onAddImageToScrapbook && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddImageToScrapbook(urls[0]);
                      }}
                      className="p-1.5 bg-cozy-orange hover:bg-cozy-accent text-white rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 border border-cozy-text-dark"
                      title="Add to Cozy Canvas"
                    >
                      <Sparkles size={12} />
                      <span>Pin to Canvas</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveUrl(0);
                    }}
                    className="p-1.5 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg shadow-sm transition cursor-pointer border border-cozy-text-dark"
                    title="Remove Photo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              // Multiple Photos - Organic Masonry Column Layout to preserve ALL custom ratios uncropped!
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                {urls.map((url, idx) => (
                  <div 
                    key={idx} 
                    className="break-inside-avoid group/photo relative bg-[#FDF8F1] overflow-hidden border border-[#E2D1C3]/40 p-1.5 rounded-xl shadow-xs hover:shadow-sm transition-all duration-200 inline-block w-full"
                  >
                    <img
                      alt={`Memory ${idx + 1}`}
                      className="w-full h-auto object-contain rounded-lg cursor-pointer"
                      src={url}
                      onClick={() => setZoomedImage(url)}
                      referrerPolicy="no-referrer"
                    />
                    {/* Trash & Pin to Canvas overlay */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover/photo:opacity-100 transition-all duration-150 z-10 flex gap-1.5">
                      {onAddImageToScrapbook && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddImageToScrapbook(url);
                          }}
                          className="p-1 bg-cozy-orange hover:bg-cozy-accent text-white rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 border border-cozy-text-dark"
                          title="Add to Cozy Canvas"
                        >
                          <Sparkles size={10} />
                          <span>Pin</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUrl(idx);
                        }}
                        className="p-1.5 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg shadow-sm transition cursor-pointer border border-cozy-text-dark"
                        title="Remove Photo"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Dialog */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-55 flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-zoom-out"
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


import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageData, PixelCrop } from '../types';
import { Maximize2, Minimize2, RotateCw } from 'lucide-react';

interface ImageEditorProps {
  image: ImageData;
  aspectRatio: number | undefined;
  onCropComplete: (crop: PixelCrop) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  image,
  aspectRatio,
  onCropComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<PixelCrop>({ x: 10, y: 10, width: 80, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<PixelCrop>(crop);

  // Reset crop when image changes or aspect ratio changes
  useEffect(() => {
    if (!imageRef.current) return;
    const defaultWidth = 50;
    const defaultHeight = aspectRatio ? defaultWidth / aspectRatio : 50;
    
    setCrop({
      x: 25,
      y: 25,
      width: defaultWidth,
      height: defaultHeight
    });
  }, [image.id, aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    e.preventDefault();
    if (type === 'drag') setIsDragging(true);
    if (type === 'resize') setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop({ ...crop });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    if (isDragging) {
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.width, initialCrop.x + dx)),
        y: Math.max(0, Math.min(100 - prev.height, initialCrop.y + dy))
      }));
    } else if (isResizing) {
      const newWidth = Math.max(5, Math.min(100 - initialCrop.x, initialCrop.width + dx));
      let newHeight = Math.max(5, Math.min(100 - initialCrop.y, initialCrop.height + dy));
      
      if (aspectRatio) {
        newHeight = newWidth / aspectRatio;
        // Clamp again
        if (initialCrop.y + newHeight > 100) {
            // Re-calculate based on height if overflow
            const clampedHeight = 100 - initialCrop.y;
            const clampedWidth = clampedHeight * aspectRatio;
            setCrop(prev => ({ ...prev, width: clampedWidth, height: clampedHeight }));
            return;
        }
      }

      setCrop(prev => ({ ...prev, width: newWidth, height: newHeight }));
    }
  }, [isDragging, isResizing, dragStart, initialCrop, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    onCropComplete(crop);
  }, [crop, onCropComplete]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0c14]">
      {/* Editor Toolbar */}
      <div className="h-10 bg-black/40 border-b border-border/50 flex items-center px-4 justify-between">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Preview Editor
        </span>
        <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-accent transition-colors"><Minimize2 className="w-3.5 h-3.5" /></button>
            <button className="text-gray-500 hover:text-accent transition-colors"><Maximize2 className="w-3.5 h-3.5" /></button>
            <button className="text-gray-500 hover:text-accent transition-colors"><RotateCw className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-8">
        <div 
          ref={containerRef}
          className="relative inline-block max-w-full max-h-full shadow-2xl overflow-hidden select-none"
        >
          <img 
            ref={imageRef}
            src={image.previewUrl} 
            alt="Source" 
            className="max-w-full max-h-[70vh] block pointer-events-none"
          />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>

          {/* Crop Box */}
          <div 
            style={{
              left: `${crop.x}%`,
              top: `${crop.y}%`,
              width: `${crop.width}%`,
              height: `${crop.height}%`,
            }}
            className="absolute border border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0)] overflow-visible group"
          >
            {/* Clear Area */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img 
                    src={image.previewUrl} 
                    alt="Source" 
                    className="absolute pointer-events-none"
                    style={{
                        width: `${100 / crop.width * 100}%`,
                        height: `${100 / crop.height * 100}%`,
                        left: `${-crop.x * (100 / crop.width)}%`,
                        top: `${-crop.y * (100 / crop.height)}%`,
                        maxWidth: 'none',
                        maxHeight: 'none',
                    }}
                />
            </div>

            {/* Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-b border-white/30"></div>
                <div className="border-r border-white/30"></div>
                <div className="border-r border-white/30"></div>
                <div></div>
            </div>

            {/* Handles */}
            <div 
                onMouseDown={(e) => handleMouseDown(e, 'drag')}
                className="absolute inset-0 cursor-move z-10"
            />
            
            <div 
                onMouseDown={(e) => handleMouseDown(e, 'resize')}
                className="absolute bottom-0 right-0 w-4 h-4 bg-accent cursor-nwse-resize z-20 hover:scale-125 transition-transform"
            />

            {/* Coordinates Tooltip */}
            <div className="absolute -top-7 left-0 bg-accent text-[9px] px-1.5 py-0.5 rounded font-mono text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {Math.round(crop.width)}% × {Math.round(crop.height)}% @ {Math.round(crop.x)},{Math.round(crop.y)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Processing Status Bar */}
      {image.status === 'processing' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-background">
          <div 
            className="h-full bg-accent transition-all duration-300" 
            style={{ width: `${image.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

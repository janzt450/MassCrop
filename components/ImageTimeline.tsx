
import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, CheckCircle2, Loader2, AlertCircle, Eye, FileWarning, Download } from 'lucide-react';
import { ImageData } from '../types';

interface ImageTimelineProps {
  images: ImageData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
}

const TimelineItem: React.FC<{
  img: ImageData;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDownload: () => void;
}> = ({ img, isSelected, onSelect, onRemove, onDownload }) => {
  const [hasRenderError, setHasRenderError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(img.previewUrl);
  const [isRetrying, setIsRetrying] = useState(false);

  // Reset state when previewUrl prop changes (e.g. re-upload or process)
  useEffect(() => {
    setImageSrc(img.previewUrl);
    setHasRenderError(false);
    setIsRetrying(false);
  }, [img.previewUrl]);

  const handleError = useCallback(() => {
    // Prevent infinite retry loops
    if (isRetrying || hasRenderError) return;

    // If we have the original file, try to load it via FileReader (Data URL)
    // This bypasses Service Workers and CSP issues with blob: URLs
    if (img.file) {
      setIsRetrying(true);
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageSrc(reader.result);
          // Don't set error yet, let the new src try to load
        } else {
          setHasRenderError(true);
        }
      };
      
      reader.onerror = () => {
        setHasRenderError(true);
      };
      
      reader.readAsDataURL(img.file);
    } else {
      setHasRenderError(true);
    }
  }, [img.file, isRetrying, hasRenderError]);

  return (
    <div 
      onClick={onSelect}
      className={`group flex items-center p-2 rounded-xl border transition-all cursor-pointer ${
        isSelected 
          ? (img.status === 'error' ? 'border-red-500 bg-red-500/10' : 'border-accent bg-accent/10 shadow-lg shadow-accent/5')
          : 'border-border bg-card hover:border-gray-600'
      }`}
    >
      <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-background flex items-center justify-center">
        {img.status === 'error' || hasRenderError ? (
            <FileWarning className="w-6 h-6 text-red-500/50" />
        ) : (
            <img 
                src={imageSrc} 
                alt={img.file.name} 
                className="w-full h-full object-cover"
                onError={handleError}
            />
        )}
        
        {img.status === 'processing' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
            </div>
        )}
        {img.status === 'completed' && (
            <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5 shadow-md">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
            </div>
        )}
        {img.status === 'error' && (
            <div className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 shadow-md">
                <AlertCircle className="w-2.5 h-2.5 text-white" />
            </div>
        )}
      </div>

      <div className="ml-3 flex-1 min-w-0">
        <p className={`text-[11px] font-bold truncate ${img.status === 'error' || hasRenderError ? 'text-red-400' : 'text-gray-200'}`}>
            {img.file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[9px] uppercase tracking-wider font-bold ${
                img.status === 'completed' ? 'text-green-500' :
                img.status === 'processing' ? 'text-accent' :
                img.status === 'error' || hasRenderError ? 'text-red-500' :
                'text-gray-500'
            }`}>
                {hasRenderError ? 'Preview Failed' : (img.errorMessage || img.status)}
            </span>
            {img.status !== 'error' && !hasRenderError && (
              <span className="text-[9px] text-gray-600">{(img.file.size / 1024 / 1024).toFixed(1)}MB</span>
            )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {img.status === 'completed' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-accent/10 text-gray-500 hover:text-accent"
            title="Download Cropped"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className={`p-1.5 rounded-lg transition-colors ${img.status === 'error' ? 'hover:bg-red-500/20 text-red-500' : 'hover:bg-red-500/10 text-gray-500 hover:text-red-500'}`}
          title="Remove from Queue"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const ImageTimeline: React.FC<ImageTimelineProps> = ({
  images,
  selectedId,
  onSelect,
  onRemove,
  onDownload
}) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
      {images.map((img) => (
        <TimelineItem
          key={img.id}
          img={img}
          isSelected={selectedId === img.id}
          onSelect={() => onSelect(img.id)}
          onRemove={() => onRemove(img.id)}
          onDownload={() => onDownload(img.id)}
        />
      ))}

      {images.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
            <Eye className="w-8 h-8 mb-3 text-gray-600" />
            <p className="text-xs font-medium">Empty Queue</p>
        </div>
      )}
    </div>
  );
};

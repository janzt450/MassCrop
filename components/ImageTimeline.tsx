
import React from 'react';
import { Trash2, CheckCircle2, Loader2, AlertCircle, Eye, FileWarning } from 'lucide-react';
import { ImageData } from '../types';

interface ImageTimelineProps {
  images: ImageData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export const ImageTimeline: React.FC<ImageTimelineProps> = ({
  images,
  selectedId,
  onSelect,
  onRemove
}) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
      {images.map((img) => (
        <div 
          key={img.id}
          onClick={() => onSelect(img.id)}
          className={`group flex items-center p-2 rounded-xl border transition-all cursor-pointer ${
            selectedId === img.id 
              ? (img.status === 'error' ? 'border-red-500 bg-red-500/10' : 'border-accent bg-accent/10 shadow-lg shadow-accent/5')
              : 'border-border bg-card hover:border-gray-600'
          }`}
        >
          <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-background flex items-center justify-center">
            {img.status === 'error' ? (
                <FileWarning className="w-6 h-6 text-red-500/50" />
            ) : (
                <img 
                    src={img.previewUrl} 
                    alt={img.file.name} 
                    className="w-full h-full object-cover"
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
            <p className={`text-[11px] font-bold truncate ${img.status === 'error' ? 'text-red-400' : 'text-gray-200'}`}>
                {img.file.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] uppercase tracking-wider font-bold ${
                    img.status === 'completed' ? 'text-green-500' :
                    img.status === 'processing' ? 'text-accent' :
                    img.status === 'error' ? 'text-red-500' :
                    'text-gray-500'
                }`}>
                    {img.errorMessage || img.status}
                </span>
                {img.status !== 'error' && (
                  <span className="text-[9px] text-gray-600">{(img.file.size / 1024 / 1024).toFixed(1)}MB</span>
                )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
              className={`p-1.5 rounded-lg transition-colors ${img.status === 'error' ? 'hover:bg-red-500/20 text-red-500' : 'hover:bg-red-500/10 text-gray-500 hover:text-red-500'}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
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

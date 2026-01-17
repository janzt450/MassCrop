
import React from 'react';
import { 
  Upload, 
  Settings2, 
  Trash2, 
  Play, 
  Download, 
  Columns,
  Image as ImageIcon
} from 'lucide-react';
import { ProcessingSettings } from '../types';

interface SidebarProps {
  imagesCount: number;
  settings: ProcessingSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProcessingSettings>>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onProcess: () => void;
  onDownload: () => void;
  isProcessing: boolean;
  canProcess: boolean;
  canDownload: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  imagesCount,
  settings,
  setSettings,
  onUpload,
  onClear,
  onProcess,
  onDownload,
  isProcessing,
  canProcess,
  canDownload
}) => {
  const aspectRatios = [
    { label: 'Free', value: undefined },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4/3 },
    { label: '16:9', value: 16/9 },
    { label: '3:4', value: 3/4 },
    { label: '9:16', value: 9/16 },
  ];

  return (
    <div className="w-72 bg-sidebar border-r border-border flex flex-col shrink-0 z-20">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg tracking-tight">Controls</h2>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> {imagesCount} images
          </span>
        </div>

        <label className="relative group cursor-pointer block">
          <div className="w-full py-8 border-2 border-dashed border-border rounded-xl group-hover:border-accent group-hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="block font-semibold text-sm">Upload Images</span>
              <span className="text-[10px] text-gray-500">or drag & drop files</span>
            </div>
          </div>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={onUpload} 
            className="hidden" 
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Aspect Ratio */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
            <Columns className="w-3.5 h-3.5" /> Selected Settings
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.label}
                    onClick={() => setSettings(prev => ({ ...prev, aspectRatio: ratio.value }))}
                    className={`py-1.5 px-1 rounded-md text-[10px] font-medium border transition-all ${
                      settings.aspectRatio === ratio.value 
                        ? 'border-accent bg-accent/10 text-accent' 
                        : 'border-border bg-background hover:border-gray-600'
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-gray-400">JPEG Quality</label>
                <span className="text-xs text-accent font-mono">{Math.round(settings.quality * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.05"
                value={settings.quality}
                onChange={(e) => setSettings(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                className="w-full accent-accent h-1.5 bg-background rounded-full appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Output Format</label>
              <div className="flex gap-2">
                {(['jpeg', 'png', 'webp'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setSettings(prev => ({ ...prev, format }))}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      settings.format === format 
                        ? 'border-accent bg-accent/10 text-accent' 
                        : 'border-border bg-background hover:border-gray-600'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Action buttons */}
        <div className="space-y-3 pt-4 border-t border-border">
          <button
            onClick={onProcess}
            disabled={!canProcess || isProcessing}
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg ${
              !canProcess || isProcessing
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-accent text-white hover:bg-blue-600 shadow-accent/20 active:scale-95'
            }`}
          >
            {isProcessing ? (
              <Play className="w-4 h-4 animate-pulse" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isProcessing ? 'Processing...' : 'Run Mass Crop'}
          </button>

          <button
            onClick={onDownload}
            disabled={!canDownload || isProcessing}
            className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
              !canDownload || isProcessing
                ? 'border-border text-gray-600 cursor-not-allowed'
                : 'border-accent text-accent hover:bg-accent/5 active:scale-95'
            }`}
          >
            <Download className="w-4 h-4" /> Download All
          </button>

          <button
            onClick={onClear}
            disabled={imagesCount === 0 || isProcessing}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all disabled:opacity-20"
          >
            <Trash2 className="w-4 h-4" /> Clear Queue
          </button>
        </div>
      </div>

      <div className="p-6 bg-background/30 mt-auto">
        <button className="w-full py-2.5 bg-background border border-border rounded-lg text-xs font-bold text-gray-400 hover:text-gray-200 transition-colors flex items-center justify-center gap-2">
          <Settings2 className="w-3.5 h-3.5" /> ADVANCED CONFIG
        </button>
      </div>
    </div>
  );
};

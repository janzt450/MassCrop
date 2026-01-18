
import React, { useState } from 'react';
import { 
  Upload, 
  Trash2, 
  Play, 
  Download, 
  Columns,
  Image as ImageIcon,
  Copy,
  Lock,
  Unlock,
  Info
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
  onSyncAll: () => void;
  canSync: boolean;
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
  canDownload,
  onSyncAll,
  canSync
}) => {
  const [isQualityLocked, setIsQualityLocked] = useState(true);

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
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg tracking-tight">Controls</h2>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> {imagesCount} images
          </span>
        </div>

        <label className="relative group cursor-pointer block">
          <div className="w-full py-6 border-2 border-dashed border-border rounded-xl group-hover:border-accent group-hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-center">
              <span className="block font-semibold text-xs">Upload Images</span>
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

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Sync Feature */}
        <section>
          <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
             <Copy className="w-3 h-3" /> Batch Tools
          </div>
          <button 
            onClick={onSyncAll}
            disabled={!canSync}
            className="w-full p-3 rounded-xl border border-border bg-background hover:border-accent hover:bg-accent/5 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-gray-300 group-hover:text-accent transition-colors">Apply Current to All</span>
              <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-accent transition-colors" />
            </div>
            <p className="text-[9px] text-gray-500 text-left leading-tight mt-1 group-hover:text-gray-400 transition-colors">
              Broadcast current crop region to all valid images.
            </p>
          </button>
        </section>

        {/* Output Settings */}
        <section>
          <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <Columns className="w-3 h-3" /> Output Settings
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-gray-400 mb-2">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-1.5">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.label}
                    onClick={() => setSettings(prev => ({ ...prev, aspectRatio: ratio.value }))}
                    className={`py-1 rounded-md text-[10px] font-medium border transition-all ${
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
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-medium text-gray-400">Quality</label>
                  <button 
                    onClick={() => setIsQualityLocked(!isQualityLocked)}
                    className={`transition-colors ${isQualityLocked ? 'text-accent' : 'text-gray-600 hover:text-gray-400'}`}
                    title={isQualityLocked ? "Unlock to change quality" : "Lock quality to 100%"}
                  >
                    {isQualityLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
                <span className={`text-[10px] font-mono ${isQualityLocked ? 'text-accent font-bold' : 'text-gray-400'}`}>
                  {Math.round(settings.quality * 100)}%
                </span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.05"
                disabled={isQualityLocked}
                value={settings.quality}
                onChange={(e) => setSettings(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                className={`w-full h-1 rounded-full appearance-none cursor-pointer transition-all ${
                  isQualityLocked 
                    ? 'accent-gray-600 bg-gray-800 cursor-not-allowed opacity-50' 
                    : 'accent-accent bg-background'
                }`}
              />
              {isQualityLocked && (
                <p className="text-[8px] text-gray-600 mt-1 italic leading-none">Locked at Maximum Fidelity</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-400 mb-2">Output Format</label>
              <div className="flex gap-1.5">
                {(['jpeg', 'png', 'webp'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setSettings(prev => ({ ...prev, format }))}
                    className={`flex-1 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all ${
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
        <div className="space-y-2 pt-4 border-t border-border">
          <button
            onClick={onProcess}
            disabled={!canProcess || isProcessing}
            className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all shadow-lg ${
              !canProcess || isProcessing
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-accent text-white hover:bg-blue-600 shadow-accent/20 active:scale-95'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isProcessing ? 'animate-pulse' : ''}`} />
            {isProcessing ? 'Processing...' : 'Run Mass Crop'}
          </button>

          <button
            onClick={onDownload}
            disabled={!canDownload || isProcessing}
            className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
              !canDownload || isProcessing
                ? 'border-border text-gray-600 cursor-not-allowed'
                : 'border-accent text-accent hover:bg-accent/5 active:scale-95'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Download All
          </button>

          <button
            onClick={onClear}
            disabled={imagesCount === 0 || isProcessing}
            className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
              imagesCount === 0 || isProcessing
                ? 'border-border text-gray-700 cursor-not-allowed'
                : 'border-red-500/20 text-red-500/80 hover:text-red-500 hover:bg-red-500/5 active:scale-95'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Queue
          </button>
        </div>
      </div>
    </div>
  );
};

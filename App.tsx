
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, 
  Settings2, 
  Trash2, 
  Download, 
  Image as ImageIcon, 
  CheckCircle2, 
  Loader2, 
  Cpu, 
  Info, 
  Share2, 
  Github, 
  ShieldCheck, 
  LayoutGrid,
  FileWarning,
  Copy,
  ExternalLink,
  Check,
  X,
  Bot,
  Sparkles,
  Shield,
  Eye,
  Crop,
  Lock,
  Zap,
  AlertTriangle,
  Code,
  Heart,
  Globe,
  Monitor,
  Smartphone,
  Code2,
  Map,
  Gamepad2,
  Clock
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ImageEditor } from './components/ImageEditor';
import { ImageTimeline } from './components/ImageTimeline';
import { ImageData, CropArea, ProcessingSettings, PixelCrop } from './types';
import { cropImage } from './services/imageProcessor';
import JSZip from 'jszip';

const DEFAULT_CROP: PixelCrop = { x: 25, y: 25, width: 50, height: 50 };

const App: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [settings, setSettings] = useState<ProcessingSettings>({
    aspectRatio: undefined,
    format: 'png',
    quality: 1.0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // External Link Dialog State
  const [noticeUrl, setNoticeUrl] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Modals State
  const [isTransparencyOpen, setIsTransparencyOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isOSSOpen, setIsOSSOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);

  const selectedImage = images.find(img => img.id === selectedImageId);

  // Close modals on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNoticeUrl(null);
        setIsTransparencyOpen(false);
        setIsAboutOpen(false);
        setIsOSSOpen(false);
        setIsShareOpen(false);
        setIsRoadmapOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const processFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;

    const newImages: ImageData[] = files.map(file => {
      const isSupported = file.type.startsWith('image/');
      const id = Math.random().toString(36).substr(2, 9);
      
      return {
        id,
        file,
        previewUrl: isSupported ? URL.createObjectURL(file) : '',
        status: isSupported ? 'pending' : 'error',
        errorMessage: isSupported ? undefined : 'Unsupported file format',
        progress: 0,
        crop: { ...DEFAULT_CROP }
      };
    });

    setImages(prev => [...prev, ...newImages]);
    
    if (newImages.length > 0 && !selectedImageId) {
      const firstValid = newImages.find(img => img.status !== 'error');
      if (firstValid) setSelectedImageId(firstValid.id);
    }
  }, [selectedImageId]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.relatedTarget === null) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    processFiles(files);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const imgToRemove = prev.find(img => img.id === id);
      if (imgToRemove && imgToRemove.previewUrl) URL.revokeObjectURL(imgToRemove.previewUrl);
      if (imgToRemove?.croppedUrl) URL.revokeObjectURL(imgToRemove.croppedUrl);
      return filtered;
    });
    if (selectedImageId === id) {
      setSelectedImageId(null);
    }
  };

  const clearAll = () => {
    images.forEach(img => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      if (img.croppedUrl) URL.revokeObjectURL(img.croppedUrl);
    });
    setImages([]);
    setSelectedImageId(null);
  };

  const handleCropComplete = useCallback((crop: PixelCrop) => {
    setImages(prev => prev.map(img => {
      // Apply only to selected image to maintain independent crops
      return img.id === selectedImageId ? { ...img, crop } : img;
    }));
  }, [selectedImageId]);

  const syncCurrentCropToAll = useCallback(() => {
    if (!selectedImage || !selectedImage.crop) return;
    const cropToSync = { ...selectedImage.crop };
    setImages(prev => prev.map(img => 
      img.status !== 'error' ? { ...img, crop: cropToSync } : img
    ));
  }, [selectedImage]);

  const processBatch = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    const validImages = images.filter(img => img.status === 'pending' || img.status === 'completed');
    
    for (let i = 0; i < validImages.length; i++) {
      const img = validImages[i];
      setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'processing', progress: 50 } : p));
      
      try {
        const activeCrop = img.crop || DEFAULT_CROP;
        const croppedBlob = await cropImage(img.file, activeCrop, settings);
        const croppedUrl = URL.createObjectURL(croppedBlob);
        
        setImages(prev => prev.map(p => p.id === img.id ? { 
          ...p, 
          status: 'completed', 
          progress: 100,
          croppedUrl 
        } : p));
      } catch (err) {
        console.error("Cropping failed for", img.file.name, err);
        setImages(prev => prev.map(p => p.id === img.id ? { 
          ...p, 
          status: 'error', 
          errorMessage: 'Processing failed',
          progress: 0 
        } : p));
      }
    }
    setIsProcessing(false);
  };

  const downloadItem = (id: string) => {
    const img = images.find(i => i.id === id);
    if (img && img.status === 'completed' && img.croppedUrl) {
      const link = document.createElement('a');
      link.href = img.croppedUrl;
      link.download = `cropped_${img.file.name}`;
      link.click();
    }
  };

  const downloadAll = async () => {
    const processed = images.filter(img => img.status === 'completed' && img.croppedUrl);
    if (processed.length === 0) return;

    if (processed.length === 1) {
      downloadItem(processed[0].id);
      return;
    }

    const zip = new JSZip();
    for (const img of processed) {
      const response = await fetch(img.croppedUrl!);
      const blob = await response.blob();
      zip.file(`cropped_${img.file.name}`, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'mass_cropped_images.zip';
    link.click();
  };

  const handleExternalLink = (url: string) => {
    const hasSeen = localStorage.getItem(`masscrop_notice_${url}`);
    if (hasSeen) {
      window.open(url, '_blank');
    } else {
      setNoticeUrl(url);
    }
  };

  const confirmExternalLink = () => {
    if (!noticeUrl) return;
    localStorage.setItem(`masscrop_notice_${noticeUrl}`, 'true');
    window.open(noticeUrl, '_blank');
    setNoticeUrl(null);
  };

  const copyUrl = () => {
    if (!noticeUrl) return;
    navigator.clipboard.writeText(noticeUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div 
      className="flex h-screen bg-background text-gray-200 overflow-hidden font-sans relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Roadmap Modal */}
      {isRoadmapOpen && (
        <div 
          className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsRoadmapOpen(false)}
        >
          <div 
            className="bg-[#0f111a] border border-[#2a314d] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] max-w-lg w-full overflow-hidden relative p-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsRoadmapOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#1a1f33] text-gray-400 hover:text-white transition-all hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-20 h-20 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center mb-6 shadow-xl shadow-amber-900/20">
                <Map className="w-10 h-10 text-[#f59e0b]" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">Project Roadmap</h2>
              <p className="text-sm text-gray-500 font-medium">Future Visions & Historical Echoes</p>
            </div>

            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-3 text-accent">
                  <Gamepad2 className="w-6 h-6" />
                  <h3 className="font-bold text-xl text-white">Feature Evolution</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  The current "Local Crop" is just the foundation. Future iterations could explore deeper AI upscaling, smart object removal, and more complex batch filters to streamline creative workflows—all while keeping the processing strictly local and offline.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3 text-[#10b981]">
                  <Clock className="w-6 h-6" />
                  <h3 className="font-bold text-xl text-white">A Digital Artifact</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Beyond its utility, this project serves as a point of historical interest. It represents a specific moment in time where open-source philosophy met the capabilities of early 2026 AI. It stands as a single data point in a much larger set of human-driven, AI-assisted creation.
                </p>
              </section>

              <div className="bg-[#161b33] border border-[#2a314d] rounded-2xl p-6">
                 <h4 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">THE PATH FORWARD</h4>
                 <p className="text-sm text-gray-300 font-medium leading-relaxed">
                   This roadmap is not fixed. As an open-source tool, its destiny lies with the community. Fork it, mod it, and make it your own.
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareOpen && (
        <div 
          className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsShareOpen(false)}
        >
          <div 
            className="bg-[#0f111a] border border-[#2a314d] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] max-w-3xl w-full overflow-hidden relative p-8 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsShareOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#1a1f33] text-gray-400 hover:text-white transition-all hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-14 h-14 rounded-2xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center mb-4">
                <Share2 className="w-7 h-7 text-[#3b82f6]" />
              </div>
              <h2 className="text-3xl font-bold text-white">Share MassCrop</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Access this tool on other platforms</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#141828] border border-[#2a314d] rounded-2xl p-6 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-[#4c1d95]/30 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-[#7c3aed]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white leading-tight">Web App</h3>
                    <p className="text-xs text-gray-500">Run in browser</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <button disabled className="w-full py-2.5 bg-[#1a1f33] text-gray-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-[#2a314d]">
                    <ExternalLink className="w-4 h-4" /> Coming Soon
                  </button>
                </div>
              </div>

              <div className="bg-[#141828] border border-[#2a314d] rounded-2xl p-6 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-900/20 flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white leading-tight">Windows</h3>
                    <p className="text-xs text-gray-500">Desktop Installer (.exe)</p>
                  </div>
                </div>
                
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center mb-4">Download Mirrors</p>
                <div className="flex gap-2">
                   <button 
                    onClick={() => handleExternalLink('https://mega.nz/folder/QXtC1J4Z#smzsxanTYSEA0n4DEL1pfQ')}
                    className="flex-1 py-2 bg-red-900/10 border border-red-900/30 text-red-400 rounded-lg text-xs font-bold hover:bg-red-900/20 transition-all"
                   >
                    Mega.nz
                   </button>
                   <button 
                    onClick={() => handleExternalLink('https://drive.google.com/drive/folders/11aIhcK2d-DCOOstiizWfrPkJz4yE2mc_?usp=drive_link')}
                    className="flex-1 py-2 bg-blue-900/10 border border-blue-900/30 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-900/20 transition-all"
                   >
                    Google Drive
                   </button>
                   <button 
                    onClick={() => handleExternalLink('https://www.mediafire.com/folder/cwvvj9k0jpa6k/MassCrop')}
                    className="flex-1 py-2 bg-cyan-900/10 border border-cyan-900/30 text-cyan-400 rounded-lg text-xs font-bold hover:bg-cyan-900/20 transition-all"
                   >
                    MediaFire
                   </button>
                </div>
              </div>

              <div className="bg-[#141828] border border-[#2a314d] rounded-2xl p-6 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-emerald-900/20 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white leading-tight">Android</h3>
                    <p className="text-xs text-gray-500">Mobile App (.apk)</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <button disabled className="w-full py-2.5 bg-[#1a1f33]/50 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                    Coming Soon
                  </button>
                </div>
              </div>

              <div className="bg-[#141828] border border-[#2a314d] rounded-2xl p-6 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
                    <Code2 className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white leading-tight">Source Code</h3>
                    <p className="text-xs text-gray-500">GitHub Repository</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <button 
                    onClick={() => handleExternalLink('https://github.com/janzt450/MassCrop')}
                    className="w-full py-2.5 bg-[#2a314d] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#343b59] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" /> View Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Why Open Source Modal */}
      {isOSSOpen && (
        <div 
          className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsOSSOpen(false)}
        >
          <div 
            className="bg-[#0f111a] border border-[#2a314d] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] max-w-lg w-full overflow-hidden relative p-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOSSOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#1a1f33] text-gray-400 hover:text-white transition-all hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-[#064e3b] border border-[#10b981]/30 flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/20">
                <Shield className="w-8 h-8 text-[#10b981]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Why Open Source?</h2>
              <p className="text-sm text-gray-500 font-medium">Transparency is Trust</p>
            </div>

            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-3 text-accent">
                  <Eye className="w-5 h-5" />
                  <h3 className="font-bold text-lg text-white">Auditability</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  "Open Source" means the code is publicly available. Anyone can inspect it to ensure there are no hidden trackers, spyware, or malicious algorithms designed to sell your habits.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3 text-orange-400">
                  <Lock className="w-5 h-5" />
                  <h3 className="font-bold text-lg text-white">Data Sovereignty</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  MassCrop is "Local Only". Your image data lives on your device, not on some company or independent and unaccountable entities server. This app never attempts to contact outside servers to provide telemetry or marketing data. You own your media journey.
                </p>
              </section>

              <div className="bg-[#161b33] border border-[#2a314d] rounded-2xl p-6">
                 <h4 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">Supported By Principles From:</h4>
                 <ul className="space-y-2">
                   <li className="text-sm font-bold text-gray-200 flex items-center gap-2">Free Software Foundation</li>
                   <li className="text-sm font-bold text-gray-200 flex items-center gap-2">Open Source Initiative</li>
                   <li className="text-sm font-bold text-gray-200 flex items-center gap-2">Electronic Frontier Foundation</li>
                 </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {isAboutOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsAboutOpen(false)}
        >
          <div 
            className="bg-[#0f111a] border border-[#2a314d] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] max-w-lg w-full overflow-hidden relative p-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#1a1f33] text-gray-400 hover:text-white transition-all hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#10b981] flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/20">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">MassCrop</h2>
              <p className="text-sm text-gray-500 font-medium">Open Source Batch Processor</p>
            </div>

            <div className="space-y-6 text-sm text-gray-400 leading-relaxed text-center px-2">
              <p>
                MassCrop was built to empower creators to process their media at scale without compromising their privacy or selling their data.
              </p>
              <p>
                Unlike many web-based tools, this one was designed with the specific intent and belief that your content is private. All processing happens locally on your device. This app does not, has never, and will never upload your original files to a server, use user analytics, tracking pixels, or store your images externally.
              </p>
            </div>

            <div className="mt-8 bg-[#161b33]/40 border border-[#2a314d] rounded-2xl p-6">
               <div className="flex items-center gap-2 mb-4 text-[#10b981]">
                 <ShieldCheck className="w-5 h-5" />
                 <h3 className="font-bold text-white">Privacy Promise</h3>
               </div>
               <ul className="grid grid-cols-2 gap-y-2 text-xs font-medium text-gray-300">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> No Account Required</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Local Processing Only</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> No Ad Tracking</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Open Source Code</li>
               </ul>
            </div>

            <div className="mt-8 bg-[#2d1a1a]/40 border border-red-500/20 rounded-2xl p-4 flex items-start gap-4">
               <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
               <p className="text-xs font-bold text-red-200/80 leading-snug">
                 This app is never intended to be sold, bartered, or traded. Free forever, free for life.
               </p>
            </div>

            <div className="mt-10 text-center">
               <p className="text-[10px] text-gray-600 font-mono tracking-tight uppercase">
                 Version 1.2.0 • Built with React & Tailwind
               </p>
               <p className="text-[10px] text-gray-600 font-mono tracking-tight uppercase mt-1">
                 Made in the USA us
               </p>
            </div>
          </div>
        </div>
      )}

      {/* Transparency Modal */}
      {isTransparencyOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsTransparencyOpen(false)}
        >
          <div 
            className="bg-[#0f111a] border border-[#2a314d] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-lg w-full overflow-hidden relative p-8 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsTransparencyOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#1a1f33] text-gray-400 hover:text-white transition-all hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4c1d95] to-[#7c3aed] flex items-center justify-center mb-6 shadow-xl shadow-purple-900/20">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">AI Transparency Statement</h2>
              <p className="text-sm text-gray-500 font-medium">Created with Human Vision & Machine Intelligence</p>
            </div>

            <div className="space-y-8 text-left">
              <section>
                <div className="flex items-center gap-3 mb-3 text-yellow-500">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold text-lg text-white">A Historical Artifact</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  This app serves as a historical artifact of the 'vibecoding' era—a time when natural language became a programming language. It was generated as an intentional exercise in UX design, bridging the gap between concept and reality through Large Language Models.
                </p>
              </section>

              <div className="bg-[#061c16] border border-[#10b981]/20 rounded-xl p-4 text-center">
                <p className="text-[#10b981] font-bold text-sm tracking-tight">
                  "Originally created with Gemini 3 Pro Preview using Google AI Studio - January 2026"
                </p>
              </div>

              <section>
                <div className="flex items-center gap-3 mb-3 text-purple-400">
                  <Bot className="w-5 h-5" />
                  <h3 className="font-bold text-lg text-white">The Human Element</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Created as a meaningful distraction from nicotine cravings, this project proves that building software can be a pleasant, revolutionary experience. It empowers those with a vision for product design and information systems to build freely, regardless of their coding fluency.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-3 text-blue-400">
                  <Shield className="w-5 h-5" />
                  <h3 className="font-bold text-lg text-white">Our Responsibility</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  With AI now woven into our reality, the responsibility falls on humans to guide it with wisdom. Despite the challenges ahead, there is immense hope. We have the power to use these tools to find truth, uplift one another, and understand the world we live in.
                </p>
              </section>
            </div>

            <div className="mt-10 bg-[#161b33] border border-[#3b82f6]/20 rounded-2xl p-5 text-center">
              <p className="text-sm font-bold tracking-widest text-white/90 uppercase">
                This app was created 100% with AI <span className="text-purple-400">*AND*</span> HUMANS
              </p>
            </div>
          </div>
        </div>
      )}

      {noticeUrl && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setNoticeUrl(null)}
        >
          <div 
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4 text-accent">
              <ExternalLink className="w-6 h-6" />
              <h3 className="text-xl font-bold">External Link Notice</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              You are leaving MassCrop to visit an external website
            </p>
            <div className="bg-background/50 rounded-xl p-4 border border-border flex items-center gap-3 mb-8 group">
              <span className="text-xs font-mono text-gray-300 break-all flex-1">{noticeUrl}</span>
              <button 
                onClick={copyUrl}
                className="shrink-0 p-2 rounded-lg bg-border/50 hover:bg-border text-gray-400 hover:text-white transition-all active:scale-95"
                title="Copy URL"
              >
                {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setNoticeUrl(null)}
                className="flex-1 py-3 bg-border/20 text-gray-300 rounded-xl font-bold text-sm hover:bg-border/40 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmExternalLink}
                className="flex-[2] py-3 bg-accent text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-accent/20"
              >
                Continue to Site
              </button>
            </div>
          </div>
        </div>
      )}

      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-accent/20 backdrop-blur-sm border-4 border-dashed border-accent flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-150">
          <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-white shadow-2xl mb-6">
            <Upload className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-white drop-shadow-md">Drop to Add to Timeline</h2>
          <p className="text-white/80 font-medium">Add images to your batch processing queue</p>
        </div>
      )}

      <Sidebar 
        imagesCount={images.length}
        settings={settings}
        setSettings={setSettings}
        onUpload={handleUpload}
        onClear={clearAll}
        onProcess={processBatch}
        onDownload={downloadAll}
        isProcessing={isProcessing}
        canProcess={images.length > 0 && images.some(i => i.status !== 'error')}
        canDownload={images.some(i => i.status === 'completed')}
        onSyncAll={syncCurrentCropToAll}
        canSync={!!selectedImage && images.length > 1}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-accent/20">
              MC
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">MassCrop</h1>
              <p className="text-xs text-gray-500">Mass image cropper</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Client-Side Only</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Privacy First</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 flex p-6 gap-6 min-h-0">
            <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col relative overflow-hidden shadow-2xl">
              {selectedImage && selectedImage.status !== 'error' ? (
                <ImageEditor 
                  key={selectedImage.id}
                  image={selectedImage}
                  aspectRatio={settings.aspectRatio}
                  initialCropValue={selectedImage.crop || DEFAULT_CROP}
                  onCropComplete={handleCropComplete}
                />
              ) : selectedImage && selectedImage.status === 'error' ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-20 h-20 bg-red-500/10 rounded-3xl border-2 border-red-500/30 flex items-center justify-center mb-6">
                    <FileWarning className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-red-400">File Error</h3>
                  <p className="text-gray-500 max-w-sm">
                    {selectedImage.errorMessage || "This file cannot be processed."}
                  </p>
                  <button 
                    onClick={() => removeImage(selectedImage.id)}
                    className="mt-6 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-all"
                  >
                    Remove from Queue
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-20 h-20 bg-background rounded-3xl border-2 border-dashed border-border flex items-center justify-center mb-6">
                    <ImageIcon className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Images Selected</h3>
                  <p className="text-gray-500 max-sm">
                    Upload or drag & drop images anywhere to start cropping. All processing stays on your device.
                  </p>
                </div>
              )}
            </div>

            <div className="w-80 flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-accent" />
                  Queue ({images.length})
                </h3>
              </div>
              <ImageTimeline 
                images={images}
                selectedId={selectedImageId}
                onSelect={setSelectedImageId}
                onRemove={removeImage}
                onDownload={downloadItem}
              />
            </div>
          </div>
        </main>

        <footer className="h-12 border-t border-border flex items-center px-6 bg-background/50 backdrop-blur-sm">
          <div className="flex-1 flex items-center justify-center gap-6">
            <button 
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Share App
            </button>
            <button 
              onClick={() => handleExternalLink('https://github.com/janzt450/MassCrop')}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors"
            >
              <Github className="w-3.5 h-3.5" /> View Source Code
            </button>
            <button 
              onClick={() => setIsAboutOpen(true)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors"
            >
              <Info className="w-3.5 h-3.5" /> About
            </button>
            <button 
              onClick={() => setIsOSSOpen(true)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors"
            >
              <Code className="w-3.5 h-3.5" /> Why Open Source?
            </button>
            <button 
              onClick={() => setIsTransparencyOpen(true)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> AI Transparency
            </button>
            <button 
              onClick={() => setIsRoadmapOpen(true)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors"
            >
              <Map className="w-3.5 h-3.5" /> Roadmap
            </button>
            <button 
              onClick={() => handleExternalLink('https://outlandproductions.neocities.org/')}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors"
            >
              <Globe className="w-3.5 h-3.5" /> Website
            </button>
          </div>
          <div className="w-80 ml-6 shrink-0 hidden md:block" />
        </footer>
      </div>
    </div>
  );
};

export default App;


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
  FileWarning
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ImageEditor } from './components/ImageEditor';
import { ImageTimeline } from './components/ImageTimeline';
import { ImageData, CropArea, ProcessingSettings, PixelCrop } from './types';
import { cropImage } from './services/imageProcessor';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [currentCrop, setCurrentCrop] = useState<PixelCrop | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [settings, setSettings] = useState<ProcessingSettings>({
    aspectRatio: undefined,
    format: 'jpeg',
    quality: 0.9,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedImage = images.find(img => img.id === selectedImageId);

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
        progress: 0
      };
    });

    setImages(prev => [...prev, ...newImages]);
    
    // Auto-select first valid image if none selected
    setImages(currentImages => {
      const validImages = [...currentImages, ...newImages].filter(img => img.status !== 'error');
      if (validImages.length > 0 && !selectedImageId) {
         setSelectedImageId(validImages[0].id);
      }
      return currentImages;
    });
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
    // Check if we are really leaving the window
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

  const processBatch = async () => {
    if (!currentCrop || images.length === 0) return;
    setIsProcessing(true);

    const validImages = images.filter(img => img.status === 'pending' || img.status === 'completed');
    
    for (let i = 0; i < validImages.length; i++) {
      const img = validImages[i];
      setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'processing', progress: 50 } : p));
      
      try {
        const croppedBlob = await cropImage(img.file, currentCrop, settings);
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

  const downloadAll = async () => {
    const processed = images.filter(img => img.status === 'completed' && img.croppedUrl);
    if (processed.length === 0) return;

    if (processed.length === 1) {
      const link = document.createElement('a');
      link.href = processed[0].croppedUrl!;
      link.download = `cropped_${processed[0].file.name}`;
      link.click();
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

  return (
    <div 
      className="flex h-screen bg-background text-gray-200 overflow-hidden font-sans relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global Drag Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-accent/20 backdrop-blur-sm border-4 border-dashed border-accent flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-150">
          <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-white shadow-2xl mb-6">
            <Upload className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-white drop-shadow-md">Drop to Add to Timeline</h2>
          <p className="text-white/80 font-medium">Add images to your batch processing queue</p>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar 
        imagesCount={images.length}
        settings={settings}
        setSettings={setSettings}
        onUpload={handleUpload}
        onClear={clearAll}
        onProcess={processBatch}
        onDownload={downloadAll}
        isProcessing={isProcessing}
        canProcess={!!currentCrop && images.length > 0 && images.some(i => i.status !== 'error')}
        canDownload={images.some(i => i.status === 'completed')}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-accent/20">
              MC
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">MassCrop</h1>
              <p className="text-xs text-gray-500">Local batch image processing tool</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Client-Side Only</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Privacy First</span>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 flex p-6 gap-6 min-h-0">
            {/* Editor Area */}
            <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col relative overflow-hidden shadow-2xl">
              {selectedImage && selectedImage.status !== 'error' ? (
                <ImageEditor 
                  image={selectedImage}
                  aspectRatio={settings.aspectRatio}
                  onCropComplete={setCurrentCrop}
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
                  <p className="text-gray-500 max-w-sm">
                    Upload or drag & drop images anywhere to start cropping. All processing stays on your device.
                  </p>
                </div>
              )}
            </div>

            {/* Timeline / Queue */}
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
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-12 border-t border-border flex items-center justify-center px-6 gap-8 bg-background/50 backdrop-blur-sm">
          <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Share App
          </button>
          <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors">
            <Github className="w-3.5 h-3.5" /> View Source
          </button>
          <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors">
            <Info className="w-3.5 h-3.5" /> About MassCrop
          </button>
          <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors">
            <Download className="w-3.5 h-3.5" /> Bulk Download
          </button>
        </footer>
      </div>
    </div>
  );
};

export default App;

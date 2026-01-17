
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageData {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  croppedUrl?: string;
  progress: number;
}

export interface ProcessingSettings {
  aspectRatio: number | undefined;
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
}

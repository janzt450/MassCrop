
import { PixelCrop, ProcessingSettings } from '../types';

/**
 * Loads an image from a file and returns an HTMLImageElement
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Crops an image based on provided pixel-based percentages and settings.
 * The percentages are converted to absolute pixels based on natural image dimensions.
 */
export const cropImage = async (
  file: File, 
  crop: PixelCrop, 
  settings: ProcessingSettings
): Promise<Blob> => {
  const image = await loadImage(file);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Convert percentages to absolute pixels
  const x = (crop.x / 100) * image.naturalWidth;
  const y = (crop.y / 100) * image.naturalHeight;
  const width = (crop.width / 100) * image.naturalWidth;
  const height = (crop.height / 100) * image.naturalHeight;

  canvas.width = width;
  canvas.height = height;

  // Smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    x,
    y,
    width,
    height,
    0,
    0,
    width,
    height
  );

  // Clean up original blob URL
  URL.revokeObjectURL(image.src);

  return new Promise((resolve, reject) => {
    const mimeType = `image/${settings.format}`;
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      settings.quality
    );
  });
};

/**
 * Compress image using Canvas API
 */
export const compressImage = (
  file: File, 
  maxWidth: number = 1024, 
  quality: number = 0.7,
  outputType: 'jpeg' | 'png' = 'jpeg'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      // Draw image with smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to specified format
      const mimeType = outputType === 'png' ? 'image/png' : 'image/jpeg';
      const compressedBase64 = canvas.toDataURL(mimeType, quality);
      resolve(compressedBase64);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Get file size from base64 string (approximate)
 */
export const getBase64SizeKB = (base64: string): number => {
  const base64Length = base64.length - (base64.indexOf(',') + 1);
  const sizeBytes = (base64Length * 3) / 4;
  return Math.round(sizeBytes / 1024);
};

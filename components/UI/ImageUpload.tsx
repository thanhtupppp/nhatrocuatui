import React, { useRef, useState, useMemo } from 'react';
import { Camera, X, ZoomIn, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { compressImage, getBase64SizeKB } from '../../utils/imageUtils';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (base64: string) => void;
  onClear: () => void;
  maxSizeKB?: number;       // Target max file size in KB
  maxWidth?: number;        // Max image width
  quality?: number;         // JPEG quality 0-1
  outputType?: 'jpeg' | 'png';  // Output format
  disabled?: boolean;       // Disable upload
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  label, 
  value, 
  onChange, 
  onClear,
  maxSizeKB = 500,
  maxWidth = 1200,
  quality = 0.75,
  outputType = 'jpeg',
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const { showToast } = useToast();

  // Memoized size calculation
  const currentSizeKB = useMemo(
    () => value ? getBase64SizeKB(value) : 0,
    [value]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn đúng định dạng ảnh', 'warning');
      return;
    }

    const originalSizeKB = Math.round(file.size / 1024);
    console.log(`Original size: ${originalSizeKB}KB`);

    setIsCompressing(true);

    try {
      // Progressive compression strategy using the utility function
      let compressed = await compressImage(file, maxWidth, quality, outputType as 'jpeg' | 'png');
      let compressedSizeKB = getBase64SizeKB(compressed);

      // Step 2: Lower quality if still too large
      if (compressedSizeKB > maxSizeKB) {
        compressed = await compressImage(file, maxWidth, 0.5, outputType as 'jpeg' | 'png');
        compressedSizeKB = getBase64SizeKB(compressed);
      }

      // Step 3: Reduce dimensions if still too large
      if (compressedSizeKB > maxSizeKB) {
        compressed = await compressImage(file, 800, 0.5, outputType as 'jpeg' | 'png');
        compressedSizeKB = getBase64SizeKB(compressed);
      }

      // Step 4: Aggressive compression as last resort
      if (compressedSizeKB > maxSizeKB) {
        compressed = await compressImage(file, 600, 0.4, outputType as 'jpeg' | 'png');
        compressedSizeKB = getBase64SizeKB(compressed);
      }

      // Warn if still over limit
      if (compressedSizeKB > maxSizeKB) {
        showToast(
          `Ảnh sau nén vẫn lớn (${compressedSizeKB}KB). Chất lượng có thể bị giảm.`,
          'warning'
        );
      }

      const reduction = Math.round((1 - compressedSizeKB / originalSizeKB) * 100);
      console.log(`Compressed: ${compressedSizeKB}KB (${reduction}% reduction)`);

      onChange(compressed);
    } catch (error) {
      console.error('Compression error:', error);
      showToast('Không thể xử lý ảnh. Vui lòng thử ảnh khác.', 'error');
    } finally {
      setIsCompressing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      
      {value ? (
        <div className="relative group">
          <img 
            src={value} 
            alt={label}
            className="w-full h-32 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => !disabled && setIsPreviewOpen(true)}
          />
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {currentSizeKB}KB
          </span>
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="p-2 bg-white rounded-full text-slate-700 hover:bg-slate-100"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={onClear}
                className="p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isCompressing || disabled}
          className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all
            ${disabled 
              ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600' 
              : isCompressing 
                ? 'border-indigo-400 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' 
                : 'border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
            }`}
        >
          {isCompressing ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span className="text-xs font-medium">Đang nén ảnh...</span>
            </>
          ) : (
            <>
              <Camera size={24} />
              <span className="text-xs font-medium">Nhấn để chọn ảnh</span>
              <span className="text-[10px] opacity-60">Tự động nén ≤{maxSizeKB}KB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Preview Modal */}
      {isPreviewOpen && value && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img 
              src={value} 
              alt={label}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute -top-3 -right-3 p-2 bg-white rounded-full text-slate-600 hover:bg-slate-100 shadow-lg"
            >
              <X size={20} />
            </button>
            <span className="absolute bottom-4 left-4 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full">
              {currentSizeKB}KB
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

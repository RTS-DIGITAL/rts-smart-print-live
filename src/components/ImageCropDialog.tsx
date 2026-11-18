import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw, X, Check, Crop, RefreshCw } from 'lucide-react';

const CROPPER_CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
const CROPPER_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';

interface ImageCropDialogProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
  onDone: (croppedFile: File) => void;
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({ file, isOpen, onClose, onDone }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<any>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [aspectMode, setAspectMode] = useState<string>('id_card'); // 'id_card' | 'free' | 'square'
  const [isExporting, setIsExporting] = useState(false);

  // Load Cropper assets dynamically from cdnjs
  useEffect(() => {
    if (!isOpen) return;
    if (!document.querySelector(`link[href="${CROPPER_CSS_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CROPPER_CSS_URL;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = CROPPER_JS_URL;
    script.async = true;
    script.onload = () => {
      initCropper();
    };
    document.body.appendChild(script);

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, file]);

  const initCropper = () => {
    if (!imageRef.current || !(window as any).Cropper) return;
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    const ratio = aspectMode === 'id_card' ? 1.586 : aspectMode === 'square' ? 1 : NaN;

    cropperRef.current = new (window as any).Cropper(imageRef.current, {
      aspectRatio: ratio,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.95,
      responsive: true,
      restore: false,
      checkOrientation: true,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      ready() {
        // Cropper is fully ready
      }
    });
  };

  const handleAspectRatioChange = (mode: string) => {
    setAspectMode(mode);
    if (!cropperRef.current) return;
    const ratio = mode === 'id_card' ? 1.586 : mode === 'square' ? 1 : NaN;
    cropperRef.current.setAspectRatio(ratio);
  };

  const handleRotate = (deg: number) => {
    if (cropperRef.current) {
      cropperRef.current.rotate(deg);
    }
  };

  const handleReset = () => {
    if (cropperRef.current) {
      cropperRef.current.reset();
    }
  };

  const handleDone = () => {
    if (!cropperRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const canvas = cropperRef.current.getCroppedCanvas({
        maxWidth: 2000,
        maxHeight: 2000,
        fillColor: '#ffffff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      if (!canvas) {
        setIsExporting(false);
        return;
      }

      canvas.toBlob(
        (blob: Blob | null) => {
          if (!blob) {
            setIsExporting(false);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const croppedFile = new File([blob], `${baseName}_crop.jpg`, { type: 'image/jpeg' });
          
          // Free memory
          canvas.width = 0;
          canvas.height = 0;

          setIsExporting(false);
          onDone(croppedFile);
          onClose();
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Crop export failed:', err);
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl text-white my-auto max-h-[96vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
              <Scissors className="w-4 h-4 text-emerald-400" />
              <span>Precise Image Crop Studio</span>
            </h3>
            <p className="text-[11px] text-slate-400">Drag edges or corners like Paint to frame your document</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shape Selector Dropdown */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Crop className="w-4 h-4 text-emerald-400" /> Crop Shape:
          </span>
          <select
            value={aspectMode}
            onChange={(e) => handleAspectRatioChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white font-extrabold text-xs px-3 py-2 rounded-xl outline-none focus:border-emerald-500"
          >
            <option value="id_card">ID card 1.586:1 (Aadhaar / PAN)</option>
            <option value="free">Free (Edge to edge)</option>
            <option value="square">Square 1:1</option>
          </select>
        </div>

        {/* Image Cropper Viewport */}
        <div className="w-full h-[50vh] sm:h-[55vh] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 relative">
          {objectUrl ? (
            <img
              ref={imageRef}
              src={objectUrl}
              alt="Source"
              className="max-h-full max-w-full block"
            />
          ) : (
            <p className="text-xs text-slate-500 animate-pulse">Loading image...</p>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleRotate(-90)}
              className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>-90°</span>
            </button>
            <button
              type="button"
              onClick={() => handleRotate(90)}
              className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition"
            >
              <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>+90°</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
            >
              Reset
            </button>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDone}
            className="flex-1 min-h-[48px] py-3 bg-[#003399] hover:bg-blue-700 disabled:bg-slate-700 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2"
            style={{ backgroundColor: '#003399' }}
          >
            <Check className="w-4 h-4 text-[#78C900]" style={{ color: '#78C900' }} />
            <span>{isExporting ? 'Applying crop...' : 'Use this crop'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

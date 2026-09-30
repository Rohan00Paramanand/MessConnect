import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, RefreshCw, X, Check, AlertCircle, Sparkles, FlipHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

const LiveCameraCapture = ({
  label = '2. Photo of Yourself in the Mess *',
  photoFile = null,
  onPhotoCaptured,
  onPhotoRemoved,
  watermarkTitle = 'MESS AUDIT VERIFICATION',
  messName = '',
  description = 'Live camera snapshot required. File selection from storage/gallery is disabled.',
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for selfie by default, 'environment' for rear
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [capturedAt, setCapturedAt] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Sync preview if photoFile is cleared externally
  useEffect(() => {
    if (!photoFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setCapturedAt(null);
    } else if (!previewUrl) {
      setPreviewUrl(URL.createObjectURL(photoFile));
      setCapturedAt(new Date());
    }
  }, [photoFile]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Connect stream to video element when camera opens or stream updates
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error('Video play error:', err);
      });
    }
  }, [isCameraOpen, stream]);

  const stopCameraStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = async (mode = facingMode) => {
    stopCameraStream();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera API is not supported on this browser or requires HTTPS.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setFacingMode(mode);
      setIsCameraOpen(true);
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('No camera found on your device.');
      } else {
        toast.error('Could not access camera. Please check permissions.');
      }
    }
  };

  const closeCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // If front camera, mirror image back to natural orientation
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    } else {
      ctx.drawImage(video, 0, 0, width, height);
    }

    // Add security timestamp watermark overlay
    const now = new Date();
    const timestampStr = now.toLocaleString();
    const barHeight = Math.max(54, Math.round(height * 0.09));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, height - barHeight, width, barHeight);

    // Accent line
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, height - barHeight, width, 3);

    // Top watermark line
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(barHeight * 0.32)}px sans-serif`;
    const titleText = `${watermarkTitle} ${messName ? `• ${messName.toUpperCase()}` : ''}`;
    ctx.fillText(titleText, 16, height - barHeight + Math.round(barHeight * 0.42));

    // Bottom watermark line
    ctx.fillStyle = '#FCD34D';
    ctx.font = `${Math.round(barHeight * 0.26)}px sans-serif`;
    ctx.fillText(`CAPTURED LIVE: ${timestampStr}`, 16, height - Math.round(barHeight * 0.22));

    canvas.toBlob(
      (blob) => {
        setIsCapturing(false);
        if (!blob) {
          toast.error('Failed to capture photo frame.');
          return;
        }

        const file = new File([blob], `mess_selfie_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        const newPreviewUrl = URL.createObjectURL(blob);
        setPreviewUrl(newPreviewUrl);
        setCapturedAt(now);
        closeCamera();

        if (onPhotoCaptured) {
          onPhotoCaptured(file, newPreviewUrl);
        }

        toast.success('Live photo captured successfully!');
      },
      'image/jpeg',
      0.92
    );
  };

  const removePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedAt(null);
    if (onPhotoRemoved) {
      onPhotoRemoved();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Camera size={14} className="text-amber-600" />
          {label}
        </label>
        {previewUrl && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <Check size={12} className="stroke-[3]" /> Live Photo Verified
          </span>
        )}
      </div>

      {description && !previewUrl && (
        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
          {description}
        </p>
      )}

      {/* Captured Photo Preview Card */}
      {previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400/80 bg-gray-900/5 shadow-md">
          <img
            src={previewUrl}
            alt="Live selfie in mess"
            className="w-full max-h-64 sm:max-h-72 object-cover rounded-xl"
          />

          <div className="p-3 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Check size={16} className="stroke-[3]" />
              </div>
              <div className="text-xs">
                <p className="font-black text-gray-900 leading-tight">Live Photo Ready</p>
                <p className="text-[11px] text-gray-500">
                  {capturedAt ? capturedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Ready for upload'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startCamera('user')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-all border border-amber-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RefreshCw size={12} /> Retake Photo
              </button>
              <button
                type="button"
                onClick={removePhoto}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                title="Remove photo"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: Prompt to Open Camera */
        <button
          type="button"
          onClick={() => startCamera('user')}
          className="w-full p-5 sm:p-6 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/80 transition-all text-center flex flex-col items-center justify-center gap-2.5 group cursor-pointer shadow-2xs hover:shadow-md"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform">
            <Camera size={26} />
          </div>
          <div>
            <p className="text-sm font-black text-gray-900 group-hover:text-amber-900 transition-colors">
              Click to Open Camera & Take Live Selfie / Photo
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Live in-mess camera snapshot is mandatory for audit verification
            </p>
          </div>
        </button>
      )}

      {/* ================= MODAL: Full Screen Live Camera Viewfinder ================= */}
      {isCameraOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-6 animate-in fade-in">
            <div className="relative w-full max-w-md bg-gray-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
              {/* Header Bar */}
              <div className="p-4 bg-gray-900/80 backdrop-blur-md flex items-center justify-between z-10 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Camera • {facingMode === 'user' ? 'Selfie Mode' : 'Rear Camera'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Switch camera"
                  >
                    <FlipHorizontal size={14} />
                    <span className="hidden sm:inline">Flip</span>
                  </button>
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                    title="Close Camera"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Video Viewfinder Container */}
              <div className="relative w-full aspect-[4/5] bg-black overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Subtitle / Overlay Frame Guide */}
                <div className="absolute inset-4 rounded-2xl border-2 border-white/20 pointer-events-none flex flex-col justify-between p-3">
                  <div className="text-[11px] font-bold text-white/70 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg w-fit">
                    📸 Position yourself clearly inside the mess
                  </div>
                  <div className="text-[10px] font-medium text-amber-300 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg w-fit self-end">
                    Automatic timestamp watermark enabled
                  </div>
                </div>
              </div>

              {/* Shutter Bar Controls */}
              <div className="p-5 bg-gray-900/90 backdrop-blur-md flex items-center justify-center gap-6 z-10 border-t border-white/10">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 py-2 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  disabled={isCapturing}
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 border-4 border-amber-500 shadow-xl shadow-white/20 flex items-center justify-center transition-all cursor-pointer active:scale-90 hover:scale-105 disabled:opacity-50"
                  title="Click to capture"
                >
                  <div className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-white">
                    <Camera size={22} />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={switchCamera}
                  className="p-3 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                  title="Flip Camera"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default LiveCameraCapture;

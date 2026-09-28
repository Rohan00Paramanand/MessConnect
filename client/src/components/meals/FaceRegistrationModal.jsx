import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Upload, Sparkles } from 'lucide-react';
import { loadFaceModels, getFaceDescriptorFromElement } from '../../utils/faceMatcher';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const FaceRegistrationModal = ({ isOpen, onClose, onRegistrationSuccess }) => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [loadingModels, setLoadingModels] = useState(true);
  const [mediaStream, setMediaStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [detectionStatus, setDetectionStatus] = useState('Initializing camera...');

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Start webcam
  const startCamera = async () => {
    try {
      setDetectionStatus('Requesting webcam access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      setMediaStream(stream);
      setCameraActive(true);
      setDetectionStatus('Center your face inside the circle & click Capture');
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraActive(false);
      setDetectionStatus('Camera permission denied or camera not found.');
      toast.error('Unable to access webcam. You can also upload a clear face photo below.');
    }
  };

  // Bind mediaStream to videoRef whenever either is ready
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch((e) => console.error('Video play error:', e));
      };
    }
  }, [mediaStream]);

  // Main lifecycle when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPreview(null);
      setCapturedDescriptor(null);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setLoadingModels(true);
        setDetectionStatus('Loading AI Face Recognition models...');
        await loadFaceModels();
        if (isMounted) {
          setLoadingModels(false);
          await startCamera();
        }
      } catch (err) {
        console.error('Model initialization error:', err);
        if (isMounted) {
          setLoadingModels(false);
          setDetectionStatus('Could not load AI models. Please check your internet connection.');
          toast.error('Face recognition engine failed to load.');
        }
      }
    })();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  // Capture face from live webcam video
  const handleSnapAndAnalyze = async () => {
    if (!videoRef.current || capturing) return;

    if (!cameraActive || videoRef.current.videoWidth === 0) {
      toast.error('Camera feed is not ready yet. Please wait a second.');
      return;
    }

    setCapturing(true);
    setDetectionStatus('Analyzing facial landmarks and vector embeddings...');

    try {
      // 1. Analyze directly from the active video element
      const detectionResult = await getFaceDescriptorFromElement(videoRef.current);

      if (!detectionResult || !detectionResult.descriptor) {
        setDetectionStatus('No face detected. Center your face, look directly at the camera with good lighting.');
        toast.error('No clear face detected! Please ensure your face is well-lit and not covered.');
        setCapturing(false);
        return;
      }

      // 2. Capture snapshot frame from canvas (mirrored to match selfie view)
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');

      // Mirror horizontally
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const snapshotUrl = canvas.toDataURL('image/jpeg', 0.88);

      setCapturedPreview(snapshotUrl);
      setCapturedDescriptor(detectionResult.descriptor);
      setDetectionStatus('✓ Face detected successfully! Click Confirm & Save below.');
      stopCamera();
    } catch (err) {
      console.error('Error analyzing face:', err);
      toast.error('Facial analysis failed. Please try again or upload a photo.');
      setDetectionStatus('Error during facial analysis. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  // Upload an image from file system as alternative to webcam
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturing(true);
    setDetectionStatus('Scanning uploaded image for facial features...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const detectionResult = await getFaceDescriptorFromElement(img);
          if (!detectionResult || !detectionResult.descriptor) {
            toast.error('No face detected in the uploaded photo. Please upload a clear passport-style selfie.');
            setDetectionStatus('No face found in photo. Please choose another image.');
            setCapturing(false);
            return;
          }

          setCapturedPreview(event.target.result);
          setCapturedDescriptor(detectionResult.descriptor);
          setDetectionStatus('✓ Face detected in photo! Click Confirm & Save below.');
          stopCamera();
        } catch (err) {
          console.error('File scan error:', err);
          toast.error('Failed to process image.');
        } finally {
          setCapturing(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Retake photo
  const handleRetake = async () => {
    setCapturedPreview(null);
    setCapturedDescriptor(null);
    await startCamera();
  };

  // Submit descriptor to backend
  const handleSaveRegistration = async () => {
    if (!capturedDescriptor || capturedDescriptor.length !== 128) {
      toast.error('Biometric descriptor is missing. Please capture your face first.');
      return;
    }

    setCapturing(true);
    try {
      const response = await api.post('/meals/register-face', {
        faceDescriptor: capturedDescriptor,
        facePhoto: capturedPreview
      });

      toast.success(response.data.message || 'Face registered successfully for biometric attendance!');
      if (onRegistrationSuccess) {
        onRegistrationSuccess({
          isFaceRegistered: true,
          facePhoto: capturedPreview
        });
      }
      onClose();
    } catch (err) {
      console.error('Save face error:', err);
      toast.error(err.response?.data?.message || 'Failed to save face registration');
    } finally {
      setCapturing(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 pb-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Biometric Face Enrollment</h2>
              <p className="text-xs text-teal-100 font-medium">Touchless attendance photo verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video / Camera Viewport */}
        <div className="p-5 sm:p-6 flex flex-col items-center overflow-y-auto">
          <div className="relative w-full aspect-[4/3] max-w-md bg-gray-900 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border-4 border-gray-100">
            {/* Always-mounted Video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${
                capturedPreview ? 'hidden' : 'block'
              }`}
            />

            {/* Face Oval Reticle Overlay (only when live camera is showing) */}
            {!capturedPreview && cameraActive && !loadingModels && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-64 border-2 border-dashed border-teal-400/90 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] animate-pulse"></div>
              </div>
            )}

            {/* Static Captured Snapshot Preview */}
            {capturedPreview && (
              <img
                src={capturedPreview}
                alt="Captured Face"
                className="w-full h-full object-cover"
              />
            )}

            {/* Loading Overlay */}
            {loadingModels && (
              <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center text-center p-6 text-white space-y-3 z-10">
                <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold">Loading AI Biometric Vision...</p>
                <p className="text-xs text-gray-400">Initializing face landmark neural networks</p>
              </div>
            )}

            {/* Status pill inside camera */}
            <div className="absolute bottom-3 left-3 right-3 py-1.5 px-3 bg-black/70 backdrop-blur-md rounded-xl text-center text-xs text-white font-medium z-10 shadow-lg border border-white/10">
              {detectionStatus}
            </div>
          </div>

          {/* Fallback Option: Upload Photo from disk */}
          <div className="mt-3 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-teal-50 transition-colors cursor-pointer"
            >
              <Upload size={13} />
              <span>Or choose image from device</span>
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500 text-center max-w-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Face photos are converted into private numerical feature vectors for attendance matching.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {capturedPreview ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={capturing}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={15} />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveRegistration}
                  disabled={capturing}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {capturing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm & Save</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSnapAndAnalyze}
                disabled={loadingModels || !cameraActive || capturing}
                className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {capturing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing Face...</span>
                  </>
                ) : (
                  <>
                    <Camera size={16} />
                    <span>Capture Face</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FaceRegistrationModal;

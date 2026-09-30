import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  X,
  Users,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  AlertCircle,
  Clock
} from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';
import { loadFaceModels, createStudentFaceMatcher } from '../../utils/faceMatcher';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// Simple Web Audio API sound synthesizer for immediate audio feedback
const playFeedbackSound = (type = 'success') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } else {
      // Alert buzz for zero meals / error
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    }
  } catch {
    // Audio context not allowed or unsupported
  }
};

const FaceAttendanceScanner = ({ isOpen, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const inFlightRef = useRef(false);
  const streamRef = useRef(null);
  const recentDetectionsRef = useRef(new Map()); // studentId -> lastScannedTime
  const faceMatcherRef = useRef(null);
  const enrolledStudentsRef = useRef([]);

  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [latestScanResult, setLatestScanResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Initializing scanner...');
  const resultDismissTimerRef = useRef(null);

  // Helper to show temporary scan status or alert, auto-clearing after 6.5s
  const displayTemporaryResult = useCallback((result) => {
    if (resultDismissTimerRef.current) {
      clearTimeout(resultDismissTimerRef.current);
    }
    setLatestScanResult(result);
    resultDismissTimerRef.current = setTimeout(() => {
      setLatestScanResult(null);
    }, 6500);
  }, []);

  // Stop camera tracks cleanly
  const stopScanner = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (resultDismissTimerRef.current) {
      clearTimeout(resultDismissTimerRef.current);
      resultDismissTimerRef.current = null;
    }
    setLatestScanResult(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, [mediaStream]);

  // Bind mediaStream to videoRef
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current
          .play()
          .then(() => {
            setCameraActive(true);
            setCameraError(null);
          })
          .catch((err) => {
            console.error('Video play error:', err);
          });
      };
    }
  }, [mediaStream]);

  // Fetch enrolled students and their facial descriptors from backend
  const fetchEnrolledStudents = useCallback(async () => {
    try {
      const response = await api.get('/meals/vendor/enrolled-students');
      const students = response.data.data || [];
      console.log('Vendor enrolled students fetched:', students.length);
      setEnrolledStudents(students);
      enrolledStudentsRef.current = students;

      const matcher = createStudentFaceMatcher(students, 0.58);
      console.log('Created FaceMatcher instance:', matcher);
      faceMatcherRef.current = matcher;
      setFaceMatcher(matcher);

      return students;
    } catch (err) {
      console.error('Error fetching enrolled biometrics:', err);
      toast.error('Failed to load registered student biometrics.');
      return [];
    }
  }, []);

  // Start video stream with robust error handling
  const startCamera = async () => {
    setCameraError(null);
    setStatusMessage('Accessing webcam...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      streamRef.current = stream;
      setMediaStream(stream);
      setStatusMessage('Scanner Active. Point camera towards student face.');
      return stream;
    } catch (err) {
      console.error('Camera stream error:', err);
      setCameraError(err.message || 'Camera permission denied or camera already in use');
      setStatusMessage('Webcam inaccessible. Click Retry Camera below.');
      toast.error('Could not access webcam. Please allow camera permissions.');
      return null;
    }
  };

  // Process video frame and match face
  const processFrame = useCallback(async () => {
    if (
      !videoRef.current ||
      inFlightRef.current ||
      videoRef.current.paused ||
      videoRef.current.ended ||
      videoRef.current.videoWidth === 0
    ) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.4
      });

      const detections = await faceapi
        .detectAllFaces(video, options)
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Clear previous canvas drawings
      const dims = faceapi.matchDimensions(canvas, video, true);
      const resizedDetections = faceapi.resizeResults(detections, dims);

      if (detections.length === 0) {
        setStatusMessage(
          enrolledStudents.length === 0
            ? 'Scanning for faces... (0 students enrolled in database)'
            : `Scanning for faces... (${enrolledStudents.length} registered students)`
        );
        return;
      }

      const currentMatcher = faceMatcherRef.current;
      const currentStudents = enrolledStudentsRef.current;

      for (const detection of resizedDetections) {
        const box = detection.detection.box;
        const canvasWidth = canvas.width || video.videoWidth || 640;

        // Mirror box coordinate to align with mirrored camera stream while keeping text normal
        const mirroredBox = new faceapi.Rect(
          canvasWidth - box.x - box.width,
          box.y,
          box.width,
          box.height
        );

        if (!currentMatcher || currentStudents.length === 0) {
          // If no students enrolled in DB yet, still draw bounding box
          const drawBox = new faceapi.draw.DrawBox(mirroredBox, {
            label: 'Face Detected (0 Enrolled in DB)',
            boxColor: '#f59e0b'
          });
          drawBox.draw(canvas);
          setStatusMessage('Face detected! Enroll students from student dashboard first.');
          continue;
        }

        const bestMatch = currentMatcher.findBestMatch(detection.descriptor);
        const isKnown = bestMatch.label !== 'unknown';
        const studentInfo = isKnown
          ? currentStudents.find((s) => s.studentId?.toString() === bestMatch.label?.toString())
          : null;

        // Draw bounding box
        const drawBox = new faceapi.draw.DrawBox(mirroredBox, {
          label: studentInfo
            ? `${studentInfo.name} (${Math.round((1 - bestMatch.distance) * 100)}%)`
            : 'Unknown Face',
          boxColor: studentInfo ? '#10b981' : '#f43f5e'
        });
        drawBox.draw(canvas);

        if (isKnown && studentInfo) {
          const now = Date.now();
          const lastScanned = recentDetectionsRef.current.get(studentInfo.studentId) || 0;

          // Debounce same person scans within 8 seconds locally to prevent spamming
          if (now - lastScanned < 8000) {
            continue;
          }

          recentDetectionsRef.current.set(studentInfo.studentId, now);
          inFlightRef.current = true;
          setStatusMessage(`Identified: ${studentInfo.name}. Verifying meal pass...`);

          try {
            const res = await api.post('/meals/scan-attendance', {
              studentId: studentInfo.studentId
            });

            if (soundEnabled) playFeedbackSound('success');
            toast.success(res.data.message);

            displayTemporaryResult({
              type: 'SUCCESS',
              success: true,
              studentName: studentInfo.name,
              remainingMeals: res.data.data.remainingMeals,
              mealType: res.data.data.mealType,
              photo: studentInfo.facePhoto,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });
          } catch (scanErr) {
            const errResponse = scanErr.response?.data;
            if (soundEnabled) playFeedbackSound('error');

            if (errResponse?.code === 'MEALS_DEPLETED') {
              displayTemporaryResult({
                type: 'NO_MEALS',
                success: false,
                depleted: true,
                studentName: studentInfo.name,
                remainingMeals: 0,
                photo: studentInfo.facePhoto,
                message: `${studentInfo.name} has 0 meals remaining! Recharge required.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              });
              toast.error(`Zero meals left for ${studentInfo.name}! Prompt student to recharge.`);
            } else if (errResponse?.code === 'RECENTLY_CHECKED_IN') {
              displayTemporaryResult({
                type: 'ALREADY_CHECKED_IN',
                success: false,
                studentName: studentInfo.name,
                message: errResponse.message || `${studentInfo.name} already checked in!`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              });
              toast(errResponse.message, { icon: '⚠️' });
            } else {
              displayTemporaryResult({
                type: 'ERROR',
                success: false,
                studentName: studentInfo.name,
                message: errResponse?.message || 'Attendance verification failed',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              });
              toast.error(errResponse?.message || 'Attendance verification failed');
            }
          } finally {
            setTimeout(() => {
              inFlightRef.current = false;
            }, 1200);
          }
        }
      }
    } catch (err) {
      console.error('Frame processing error:', err);
    }
  }, [faceMatcher, enrolledStudents, soundEnabled]);

  // Main lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setStatusMessage('Loading AI models and student biometrics...');

        // 1. Parallel loading of neural models and biometrics
        await Promise.all([
          loadFaceModels(),
          fetchEnrolledStudents()
        ]);

        if (isMounted) {
          // Immediately dismiss full-screen loading spinner
          setLoading(false);

          // 2. Start webcam stream
          await startCamera();

          // 3. Start real-time frame scanning loop
          scanIntervalRef.current = setInterval(() => {
            processFrame();
          }, 250);
        }
      } catch (err) {
        console.error('Scanner init error:', err);
        if (isMounted) {
          setLoading(false);
          setStatusMessage('Could not start scanner. Please refresh and try again.');
        }
      }
    })();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // React Portal to document.body: Completely immune to any parent stacking context or sidebar overlap!
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                Biometric Mess Attendance Scanner
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white uppercase tracking-wider animate-pulse">
                  Live AI
                </span>
              </h2>
              <p className="text-xs text-rose-100">
                {enrolledStudents.length} Students Registered for Biometric Recognition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scanner Body: 2 Columns on Desktop */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-gray-50">
          {/* Left Column: Camera Viewport */}
          <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col justify-between items-center bg-gray-900 relative">
            <div className="relative w-full aspect-[4/3] max-w-lg bg-black rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-800 flex items-center justify-center">
              {/* Video & Drawing Canvas - Always mounted in DOM */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Initial Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center text-center p-6 text-white space-y-3 z-20">
                  <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-semibold">Starting Biometric Vision...</p>
                  <p className="text-xs text-gray-400">Loading neural networks & student biometrics</p>
                </div>
              )}

              {/* Camera Error / Permission Fallback Screen */}
              {!loading && cameraError && (
                <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center text-center p-6 text-white space-y-4 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <AlertCircle size={26} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-rose-200">Camera Not Available</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                      Please ensure camera permissions are allowed in your browser and no other application is using the camera.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} /> Retry Camera
                  </button>
                </div>
              )}

              {/* Status pill inside camera */}
              {!loading && (
                <div className="absolute top-3 left-3 right-3 py-1.5 px-3 bg-black/60 backdrop-blur-md rounded-xl text-center text-xs text-white font-medium flex items-center justify-center gap-2 border border-white/10 z-10 shadow-lg">
                  <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`}></span>
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>

            {/* Quick Status / Guidance */}
            <div className="w-full max-w-lg mt-3 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-rose-400" />
                {enrolledStudents.length} enrolled in database
              </span>
              <button
                type="button"
                onClick={async () => {
                  await fetchEnrolledStudents();
                  toast.success('Refreshed student biometrics cache');
                }}
                className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} /> Sync List
              </button>
            </div>
          </div>

          {/* Right Column: Temporary Scan Result & Live Balance Alert */}
          <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto bg-white border-l border-gray-100">
            <div className="space-y-4">
              {/* Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Scan Verification
                  </p>
                  <p className="text-[11px] text-gray-500 font-semibold">Real-time meal balance & alerts</p>
                </div>
                {latestScanResult && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 animate-pulse">
                    Live
                  </span>
                )}
              </div>

              {/* Dynamic Status / Alert Card */}
              {latestScanResult ? (
                latestScanResult.depleted || latestScanResult.type === 'NO_MEALS' ? (
                  // Alert Box for 0 Meals (Red Banner)
                  <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 shadow-lg space-y-4 animate-in zoom-in-95">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/30">
                        <AlertOctagon size={28} className="animate-bounce" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200 text-rose-800 mb-1">
                          Alert: No Meals Left
                        </span>
                        <h3 className="font-black text-lg text-rose-950 truncate">
                          {latestScanResult.studentName}
                        </h3>
                        <p className="text-[11px] text-rose-700 font-semibold">
                          Scanned at {latestScanResult.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-rose-200 text-center shadow-inner">
                      <p className="text-xs font-bold text-rose-700 uppercase tracking-widest mb-0.5">Meal Balance</p>
                      <p className="text-4xl font-black text-rose-600">0 Meals</p>
                      <p className="text-xs font-bold text-rose-800 mt-1">No meals remaining on this pass!</p>
                    </div>

                    <div className="p-3 bg-rose-100/70 rounded-xl border border-rose-200 text-xs text-rose-900 font-medium text-center leading-relaxed">
                      ⚠️ Student must recharge meal package from their Student Portal.
                    </div>
                  </div>
                ) : latestScanResult.type === 'ALREADY_CHECKED_IN' ? (
                  // Warning Box for Recent Check-in (Amber)
                  <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-md space-y-3 animate-in zoom-in-95">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
                        <Clock size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                          Already Checked In
                        </span>
                        <h4 className="text-base font-black text-gray-900 mt-0.5 truncate">{latestScanResult.studentName}</h4>
                      </div>
                    </div>
                    <p className="text-xs text-amber-900 bg-white/80 p-3 rounded-xl border border-amber-200 font-medium leading-relaxed">
                      {latestScanResult.message}
                    </p>
                  </div>
                ) : (
                  // Success Verification Box (Emerald)
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-2 border-emerald-400 text-emerald-950 shadow-lg space-y-4 animate-in zoom-in-95">
                    <div className="flex items-center gap-3.5">
                      {latestScanResult.photo ? (
                        <img
                          src={latestScanResult.photo}
                          alt="Student"
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shadow-md flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                          <CheckCircle2 size={28} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 mb-1">
                          ✓ Verified & Checked In
                        </span>
                        <h4 className="text-lg font-black text-gray-900 truncate">
                          {latestScanResult.studentName}
                        </h4>
                        <p className="text-xs text-gray-500 font-semibold">
                          Session: <strong className="text-gray-800 capitalize">{latestScanResult.mealType}</strong> • {latestScanResult.timestamp}
                        </p>
                      </div>
                    </div>

                    {/* Prominent Remaining Meals Display */}
                    <div className="p-4 rounded-xl bg-white border border-emerald-200 text-center shadow-xs">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Remaining Balance</p>
                      <div className="flex items-baseline justify-center gap-1.5">
                        <span className="text-4xl font-black text-emerald-600 tracking-tight">
                          {latestScanResult.remainingMeals}
                        </span>
                        <span className="text-sm font-bold text-gray-600">Meals Left</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-xl font-semibold">
                      <span>1 meal deducted successfully</span>
                      <span className="text-[10px] text-gray-400 font-normal">Auto-clearing in 6s</span>
                    </div>
                  </div>
                )
              ) : (
                // Standby Card
                <div className="py-12 px-6 rounded-2xl border-2 border-dashed border-gray-200 text-center space-y-3 bg-gray-50/50">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mx-auto">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800">Ready for Next Student</h4>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 leading-relaxed">
                      Student should look into the camera. Their meal status or low-balance alert will appear here temporarily.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom: Close Button */}
            <div className="pt-4 mt-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Minimize Scanner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FaceAttendanceScanner;

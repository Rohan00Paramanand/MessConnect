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
  History,
  AlertCircle
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
  const [scanHistory, setScanHistory] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Initializing scanner...');

  // Stop camera tracks cleanly
  const stopScanner = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
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

  // Fetch recent vendor attendance logs
  const fetchAttendanceHistory = useCallback(async () => {
    try {
      const response = await api.get('/meals/vendor/recent-attendance');
      setScanHistory(response.data.data || []);
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
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

            const resultData = {
              success: true,
              studentName: studentInfo.name,
              remainingMeals: res.data.data.remainingMeals,
              mealType: res.data.data.mealType,
              photo: studentInfo.facePhoto,
              timestamp: new Date().toLocaleTimeString()
            };

            setLatestScanResult(resultData);
            setScanHistory((prev) => [
              {
                _id: Date.now().toString(),
                student: { name: studentInfo.name, email: studentInfo.email },
                mealType: res.data.data.mealType,
                remainingMealsAfter: res.data.data.remainingMeals,
                createdAt: new Date().toISOString()
              },
              ...prev
            ]);
          } catch (scanErr) {
            const errResponse = scanErr.response?.data;
            if (soundEnabled) playFeedbackSound('error');

            if (errResponse?.code === 'MEALS_DEPLETED') {
              setLatestScanResult({
                success: false,
                depleted: true,
                studentName: studentInfo.name,
                remainingMeals: 0,
                photo: studentInfo.facePhoto,
                message: `${studentInfo.name} has 0 meals left! Recharge required.`,
                timestamp: new Date().toLocaleTimeString()
              });
              toast.error(`Zero meals left for ${studentInfo.name}! Prompt student to recharge.`);
            } else if (errResponse?.code === 'RECENTLY_CHECKED_IN') {
              toast(errResponse.message, { icon: '⚠️' });
            } else {
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

        // 1. Parallel loading of neural models and data
        await Promise.all([
          loadFaceModels(),
          fetchEnrolledStudents(),
          fetchAttendanceHistory()
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

          {/* Right Column: Latest Match Verification & Realtime Log */}
          <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto bg-white border-l border-gray-100 space-y-4">
            {/* Top Widget: Latest Recognized Student */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Last Scanned Student
              </p>

              {latestScanResult ? (
                latestScanResult.depleted ? (
                  // Alert Box for 0 Meals
                  <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 shadow-md animate-in shake">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
                        <AlertOctagon size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-base text-red-950">{latestScanResult.studentName}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 text-red-800">
                            {latestScanResult.timestamp}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-red-700 mt-1">
                          ⚠️ 0 MEALS REMAINING!
                        </p>
                        <p className="text-xs text-red-800/90 mt-1 leading-snug">
                          This student's meal pass has ended. Please instruct them to recharge their meals from their student dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Success Verification Box
                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 shadow-md animate-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                      {latestScanResult.photo ? (
                        <img
                          src={latestScanResult.photo}
                          alt="Student"
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                          <CheckCircle2 size={24} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-base text-emerald-950">{latestScanResult.studentName}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                            {latestScanResult.timestamp}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-emerald-800 mt-0.5">
                          Meal Session: <span className="font-bold">{latestScanResult.mealType}</span>
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl border border-emerald-200 text-xs font-bold text-emerald-700 shadow-sm">
                          <span>Remaining Balance:</span>
                          <span className="text-sm font-black text-emerald-900">{latestScanResult.remainingMeals} Meals</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-6 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400">
                  <Sparkles className="w-8 h-8 mx-auto text-gray-300 mb-1" />
                  <p className="text-xs font-semibold">Waiting for student to face camera...</p>
                </div>
              )}
            </div>

            {/* Bottom Widget: Recent Attendance Log */}
            <div className="flex-1 flex flex-col min-h-[180px]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Live Attendance Feed
                </p>
                <span className="text-[10px] text-gray-500 font-semibold">
                  {scanHistory.length} Recorded
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-56">
                {scanHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No check-ins yet today.</p>
                ) : (
                  scanHistory.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 flex items-center justify-between transition-colors text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{item.student?.name || 'Student'}</p>
                        <p className="text-[10px] text-gray-500">
                          {item.mealType} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-extrabold text-[10px]">
                          {item.remainingMealsAfter} Left
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Minimize Scanner
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FaceAttendanceScanner;

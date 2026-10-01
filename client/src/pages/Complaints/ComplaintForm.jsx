import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { Camera, X, MapPin, Check } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const ComplaintForm = ({ onComplaintAdded }) => {
  const { user } = useAuthStore();
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'food',
    mess: '',
  });
  const [image, setImage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [coords, setCoords] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch active messes dynamically on mount
  React.useEffect(() => {
    if (user?.collegeId) {
      api.get('/messes')
        .then(({ data }) => {
          const list = data.data || [];
          setMesses(list);  
          if (list.length > 0) {
            setFormData(prev => ({ ...prev, mess: list[0]._id }));
          }
        })
        .catch(err => {
          console.error('Failed to load messes', err);
        });
    }
  }, [user]);

  // Lock body scroll when camera is active
  useEffect(() => {
    if (isCameraOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCameraOpen]);

  // Separate effect to handle video stream attachment
  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(s);
      setIsCameraOpen(true);
    } catch (err) {
      toast.error("Camera access denied or not available");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }

    const tId = toast.loading("Capturing location & photo...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = "Location found";
        
        try {
          // Reverse Geocoding using Nominatim
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            address = geoData.display_name || "Location found";
          }
        } catch (geoErr) {
          console.error("Geocoding failed, using coordinates only:", geoErr);
        }

        try {
          setCoords({ latitude, longitude, address });

          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Split address into wrapped lines using the target font
          const words = address.split(' ');
          const lines = [];
          let currentLine = '';
          ctx.font = 'bold 18px sans-serif';
          
          for (let n = 0; n < words.length; n++) {
            let testLine = currentLine + words[n] + ' ';
            if (ctx.measureText(testLine).width > canvas.width - 40 && n > 0) {
              lines.push(currentLine.trim());
              currentLine = words[n] + ' ';
            } else {
              currentLine = testLine;
            }
          }
          lines.push(currentLine.trim());

          // Calculate heights to prevent overlap
          const lineHeight = 24;
          const addressHeight = lines.length * lineHeight;
          const metaHeight = 20;
          const padding = 15;
          const spacing = 10;
          const barHeight = padding + addressHeight + spacing + metaHeight + padding;

          // Draw the translucent background bar
          ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
          ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

          // Draw Address lines (top-down)
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          let startY = canvas.height - barHeight + padding;
          for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], 20, startY + (i * lineHeight));
          }

          // Draw Coordinates and Time below the address lines
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = '14px sans-serif';
          const bottomStr = `LAT: ${latitude.toFixed(6)} | LNG: ${longitude.toFixed(6)} | ${new Date().toLocaleString()}`;
          const metaY = startY + addressHeight + spacing;
          ctx.fillText(bottomStr, 20, metaY);

          canvas.toBlob((blob) => {
            const file = new File([blob], `complaint_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImage(file);
            stopCamera();
            toast.success("Photo captured with area description!", { id: tId });
          }, 'image/jpeg', 0.9);
        } catch (err) {
          console.error("Canvas draw error:", err);
          toast.error("Failed to capture photo.", { id: tId });
          stopCamera();
        }
      },
      () => {
        toast.error("Location access required for geotagging.", { id: tId });
        stopCamera();
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('category', formData.category);
    payload.append('mess', formData.mess);
    if (image) {
      payload.append('image', image);
    }
    if (coords) {
      payload.append('latitude', coords.latitude);
      payload.append('longitude', coords.longitude);
      if (coords.address) {
        payload.append('address', coords.address);
      }
    }

    try {
      const { data } = await api.post('/complaints', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.status === 'success') {
        toast.success('Complaint submitted successfully');
        setFormData({ title: '', description: '', category: 'food', mess: messes[0]?._id || '' });
        setImage(null);
        setCoords(null);
        if (onComplaintAdded) onComplaintAdded(data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const isBanned = user?.bannedUntil && new Date() < new Date(user.bannedUntil);

  if (isBanned) {
    return (
      <div className="bg-red-50/70 border border-red-200 rounded-[1.5rem] p-6 text-center shadow-sm backdrop-blur-xl mb-6">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
          <MapPin size={24} className="stroke-[2.5]" />
        </div>
        <h3 className="text-lg font-bold text-red-950 mb-1">Complaint Submissions Suspended</h3>
        <p className="text-red-700/80 text-sm max-w-md mx-auto leading-relaxed">
          Due to your Trust Score dropping to 0% (following repeated rejections), your privileges to submit complaints are temporarily suspended.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-xl text-xs font-black border border-red-200 uppercase tracking-wide">
          🛡️ Re-enables on: {new Date(user.bannedUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 mb-6">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Submit New Complaint</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            rows="3"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Select
              label="Select Mess"
              required
              value={formData.mess}
              onChange={(e) => setFormData({ ...formData, mess: e.target.value })}
              placeholder={messes.length === 0 ? "No active messes" : "Select Mess"}
              options={
                messes.length === 0
                  ? [{ value: '', label: 'No active messes', disabled: true }]
                  : messes.map((m) => ({ value: m._id, label: m.name }))
              }
            />

            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'food', label: 'Food' },
                { value: 'cleanliness', label: 'Cleanliness' },
                { value: 'timeliness', label: 'Timeliness' },
                { value: 'taste', label: 'Taste' },
                { value: 'staff behaviour', label: 'Staff Behaviour' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Image</label>

            <div className="flex flex-col gap-3">
              {!image ? (
                <div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-md shadow-gray-900/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera size={18} />
                    Take Photo
                  </button>
                </div>
              ) : (
                <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-900/5 flex flex-col items-center justify-center p-2">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt="Preview" 
                    className="w-full max-h-72 sm:max-h-80 object-contain rounded-xl"
                  />
                  <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-gray-100 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                        <Check size={13} className="stroke-[3]" /> Live Photo Captured
                      </span>
                      {coords && (
                        <span className="text-xs font-semibold text-gray-600 inline-flex items-center gap-1">
                          <MapPin size={13} className="text-teal-600" /> Geo-tagged
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition-all border border-teal-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera size={13} /> Retake
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setImage(null); setCoords(null); }}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Remove photo"
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isCameraOpen && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between items-center overflow-hidden select-none">
            {/* Camera Viewport */}
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Top Bar with Status and Close Button */}
              <div className="absolute top-0 inset-x-0 pt-6 pb-12 px-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-30 pointer-events-auto">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Camera
                </span>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 active:scale-90 transition-all cursor-pointer shadow-lg"
                  title="Close Camera"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Bottom Controls Bar */}
              <div className="absolute bottom-0 inset-x-0 pb-10 pt-16 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col items-center justify-center gap-3 z-30 px-6 pointer-events-auto">
                <p className="text-white/80 text-xs font-medium tracking-wide drop-shadow text-center">
                  Hold steady & tap button to capture photo
                </p>
                <div className="flex items-center justify-center gap-8 w-full max-w-sm mt-1">
                  <div className="w-14"></div>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full bg-white p-1.5 shadow-2xl active:scale-90 transition-all flex items-center justify-center border-4 border-white/50 ring-4 ring-black/40 cursor-pointer"
                    title="Take Photo"
                  >
                    <div className="w-full h-full rounded-full border-[3px] border-gray-900 bg-white hover:bg-gray-100 transition-colors"></div>
                  </button>
                  <div className="w-14"></div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        <Button type="submit" disabled={loading} variant="student" className="w-full sm:w-auto">
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </Button>
      </form>
    </div>
  );
};

export default ComplaintForm;

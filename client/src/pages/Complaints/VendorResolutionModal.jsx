import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { Camera, UploadCloud, MapPin, X, Check } from 'lucide-react';

const VendorResolutionModal = ({ complaint, onClose, onSuccess }) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Attach camera stream
  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const fetchCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser.');
        return reject(new Error('Geolocation not supported'));
      }

      setFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let resolvedAddress = 'Location verified';

          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              resolvedAddress = geoData.display_name || 'Location verified';
            }
          } catch (geoErr) {
            console.warn('Reverse geocoding error:', geoErr);
          }

          setCoords({ latitude, longitude });
          setAddress(resolvedAddress);
          setFetchingLocation(false);
          resolve({ latitude, longitude, address: resolvedAddress });
        },
        (error) => {
          setFetchingLocation(false);
          toast.error('Location access denied. Geotagging is required for proof.');
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(s);
      setIsCameraOpen(true);
    } catch (err) {
      toast.error('Camera access denied or unavailable.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const captureCameraPhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const location = await fetchCurrentLocation();
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Watermark with location and timestamp
      const barHeight = 60;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(
        `RESOLVED PROOF | LAT: ${location.latitude.toFixed(5)} | LNG: ${location.longitude.toFixed(5)}`,
        15,
        canvas.height - 35
      );
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(
        `${new Date().toLocaleString()} • ${location.address.slice(0, 75)}...`,
        15,
        canvas.height - 15
      );

      canvas.toBlob((blob) => {
        const file = new File([blob], `resolution_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        stopCamera();
        toast.success('Geotagged proof photo captured!');
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error('Camera capture error:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));

    // Automatically prompt location capture for upload
    try {
      await fetchCurrentLocation();
      toast.success('Photo selected and current location geotagged!');
    } catch {
      // Handled in fetchCurrentLocation
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      return toast.error('A proof photograph is mandatory.');
    }

    if (!coords || !coords.latitude || !coords.longitude) {
      return toast.error('Geotagged location coordinates are mandatory.');
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('resolutionProof', image);
      formData.append('latitude', coords.latitude);
      formData.append('longitude', coords.longitude);
      formData.append('address', address);
      if (remarks) {
        formData.append('remarks', remarks);
      }

      await api.patch(`/complaints/${complaint._id}/vendor-complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Resolution proof submitted! Awaiting committee verification.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit resolution proof.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
    >
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 border border-gray-100 max-h-[92dvh] overflow-y-auto overscroll-contain my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900">Resolve Complaint</h3>
            <p className="text-xs text-gray-500 font-medium truncate max-w-xs sm:max-w-sm">
              {complaint.title || complaint.category} • {complaint.mess?.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Photo Capture / Upload Section */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Resolution Proof Photo *
            </label>

            {/* Live Camera View */}
            {isCameraOpen ? (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-200 aspect-video flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                  <Button
                    type="button"
                    onClick={captureCameraPhoto}
                    disabled={fetchingLocation}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 shadow-lg flex items-center gap-1.5"
                  >
                    <Camera size={14} />
                    {fetchingLocation ? 'Geotagging...' : 'Capture & Geotag'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                    className="bg-white/90 text-gray-800 text-xs py-2 px-3"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : imagePreview ? (
              /* Image Preview with Geotag Stamp */
              <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-gray-50 p-2 space-y-2">
                <div className="relative max-h-56 rounded-xl overflow-hidden flex items-center justify-center bg-black/5">
                  <img src={imagePreview} alt="Resolution Preview" className="max-h-56 w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all"
                    title="Remove Photo"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Location Status */}
                {coords ? (
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                    <MapPin size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        Geotag Verified: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                      </p>
                      <p className="text-[11px] text-emerald-700 line-clamp-2 mt-0.5">{address}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={fetchCurrentLocation}
                    disabled={fetchingLocation}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MapPin size={13} />
                    {fetchingLocation ? 'Detecting Location...' : 'Click to Add Geotag Coordinates *'}
                  </button>
                )}
              </div>
            ) : (
              /* Capture or Choose File Options */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="p-4 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Use Live Camera</span>
                  <span className="text-[10px] text-gray-500 font-medium">Automatic on-site geotag</span>
                </button>

                <label className="p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50/60 hover:bg-gray-100/60 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Upload Photo</span>
                  <span className="text-[10px] text-gray-500 font-medium">From device files</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Action Taken / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Briefly describe what action was taken to fix the issue..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !image || !coords}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Check size={14} />
              {submitting ? 'Submitting Proof...' : 'Submit Resolution Proof'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default VendorResolutionModal;

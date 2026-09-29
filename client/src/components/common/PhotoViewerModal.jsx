import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin } from 'lucide-react';

/**
 * PhotoViewerModal
 * Fullscreen overlay popup centered directly in the user's current viewport.
 * Does not jump the background scroll position on mobile or desktop.
 */
const PhotoViewerModal = ({ photo, onClose }) => {
  useEffect(() => {
    if (!photo) return;

    // Save exact scroll positions to prevent jumping
    const mainEl = document.getElementById('main-content-scroll');
    const savedMainScroll = mainEl ? mainEl.scrollTop : 0;
    const savedWindowScroll = window.scrollY;

    // Prevent background touch scrolling on mobile while modal is open
    const handleTouchMove = (e) => {
      if (!e.target.closest('.photo-modal-card-content')) {
        e.preventDefault();
      }
    };

    // Close on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);

      // Restore scroll positions if browser shifted anything
      if (mainEl && mainEl.scrollTop !== savedMainScroll) {
        mainEl.scrollTop = savedMainScroll;
      }
      if (window.scrollY !== savedWindowScroll) {
        window.scrollTo(0, savedWindowScroll);
      }
    };
  }, [photo, onClose]);

  if (!photo || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md transition-all duration-200"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
      }}
      onClick={onClose}
    >
      {/* Floating Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-2.5 text-white/80 bg-white/10 hover:bg-white/25 hover:text-white rounded-full transition-all duration-200 cursor-pointer z-20 shadow-lg backdrop-blur-sm"
        title="Close (Esc)"
        aria-label="Close photo viewer"
      >
        <X size={24} />
      </button>

      {/* Centered Modal Card */}
      <div
        className="photo-modal-card-content relative w-full max-w-[94vw] sm:max-w-2xl max-h-[88dvh] flex flex-col bg-gray-900 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Display */}
        <div className="flex-1 min-h-0 bg-black/40 flex items-center justify-center overflow-hidden p-1 sm:p-2">
          <img
            src={photo.url}
            alt={photo.title || 'Photo view'}
            className="w-full h-auto max-h-[60dvh] sm:max-h-[66dvh] object-contain rounded-xl"
          />
        </div>

        {/* Caption & Geotag Footer */}
        {(photo.title || photo.description || photo.address) && (
          <div className="p-3.5 sm:p-5 bg-gray-900/95 border-t border-white/10 text-white space-y-2 flex-shrink-0">
            {photo.title && (
              <h4 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                {photo.title}
              </h4>
            )}
            {photo.description && (
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed break-words [overflow-wrap:anywhere] max-h-24 overflow-y-auto pr-1">
                {photo.description}
              </p>
            )}
            {photo.address && (
              <div className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-xl border border-teal-800/60 w-fit max-w-full">
                <MapPin size={13} className="text-teal-400 flex-shrink-0" />
                <span className="truncate">{photo.address}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PhotoViewerModal;

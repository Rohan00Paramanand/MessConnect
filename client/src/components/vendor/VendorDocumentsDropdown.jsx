import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FileText, ChevronDown, Eye, Download, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const DOCUMENT_DEFINITIONS = [
  // Vendor Compliance Documents
  { key: 'udyamCertificate', label: 'Udyam Certificate' },
  { key: 'fssaiLicense', label: 'FSSAI License' },
  { key: 'labourLicense', label: 'Labour License' },
  { key: 'gstCertificate', label: 'GST Certificate' },
  { key: 'panCard', label: 'PAN Card' },
  { key: 'aadhaarCard', label: 'Aadhaar Card' },

  // Staff Verification Documents
  { key: 'identityProof', label: 'Identity Proof (Aadhaar/Voter)' },
  { key: 'policeVerification', label: 'Police Verification' },
  { key: 'medicalReport', label: 'Medical Fitness Certificate' },
];

const VendorDocumentsDropdown = ({ documents, vendorName = 'Vendor', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [coords, setCoords] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    maxHeight: 280,
    openUpward: false,
  });

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Extract all valid document URLs
  const availableDocs = React.useMemo(() => {
    if (!documents || typeof documents !== 'object') return [];
    
    // First map standard known keys
    const knownKeys = new Set(DOCUMENT_DEFINITIONS.map(d => d.key));
    const list = DOCUMENT_DEFINITIONS.filter(
      (def) => typeof documents[def.key] === 'string' && documents[def.key].trim() !== ''
    ).map((def) => ({
      key: def.key,
      label: def.label,
      url: documents[def.key].trim(),
    }));

    // Add any extra custom document keys present on the object
    Object.keys(documents).forEach((key) => {
      if (!knownKeys.has(key) && typeof documents[key] === 'string' && documents[key].trim() !== '') {
        const readableLabel = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        list.push({
          key,
          label: readableLabel,
          url: documents[key].trim(),
        });
      }
    });

    return list;
  }, [documents]);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const margin = 12;
    const menuWidth = Math.min(300, viewportWidth - margin * 2);

    if (rect.bottom < 0 || rect.top > viewportHeight) {
      setIsOpen(false);
      return;
    }

    const spaceBelow = viewportHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;

    const maxAvailableHeight = openUpward
      ? Math.min(280, Math.max(120, spaceAbove - 4))
      : Math.min(280, Math.max(120, spaceBelow - 4));

    let leftPos = rect.left;
    if (leftPos + menuWidth > viewportWidth - margin) {
      leftPos = Math.max(margin, viewportWidth - menuWidth - margin);
    }
    if (leftPos < margin) {
      leftPos = margin;
    }

    setCoords({
      top: Math.round(rect.bottom + 4),
      bottom: Math.round(viewportHeight - rect.top + 4),
      left: Math.round(leftPos),
      width: Math.round(menuWidth),
      maxHeight: Math.round(maxAvailableHeight),
      openUpward,
    });
  }, []);

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScrollOrResize = () => updateCoords();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    }
  }, [isOpen, updateCoords]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleDownload = async (doc, e) => {
    e.stopPropagation();
    try {
      setDownloadingKey(doc.key);
      const toastId = toast.loading(`Downloading ${doc.label}...`);

      const cleanVendor = (vendorName || 'Vendor').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanDoc = doc.label.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Attempt blob download to enforce file save dialog
      const response = await fetch(doc.url);
      if (!response.ok) throw new Error('Fetch failed');

      const blob = await response.blob();
      let extension = '';
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('pdf')) extension = '.pdf';
      else if (contentType?.includes('png')) extension = '.png';
      else if (contentType?.includes('jpeg') || contentType?.includes('jpg')) extension = '.jpg';
      else {
        const urlMatch = doc.url.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
        extension = urlMatch ? `.${urlMatch[1]}` : '.pdf';
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${cleanVendor}_${cleanDoc}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success(`${doc.label} downloaded!`, { id: toastId });
    } catch {
      // Fallback: direct download link click
      try {
        const link = document.createElement('a');
        link.href = doc.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = `${vendorName}_${doc.label}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.dismiss();
      } catch {
        toast.error(`Unable to download ${doc.label}`);
      }
    } finally {
      setDownloadingKey(null);
    }
  };

  if (availableDocs.length === 0) {
    return (
      <span className="text-xs text-gray-400 font-medium italic">
        No documents
      </span>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          isOpen
            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs'
            : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-indigo-700 border-gray-200 hover:border-indigo-200 shadow-2xs'
        }`}
        title="View or download vendor compliance documents"
      >
        <FileText size={13} className="text-indigo-600 shrink-0" />
        <span>Documents</span>
        <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
          {availableDocs.length}
        </span>
        <ChevronDown
          size={12}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}
        />
      </button>

      {/* Dropdown Menu via Portal to prevent any parent overflow clipping */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.openUpward ? 'auto' : `${coords.top}px`,
            bottom: coords.openUpward ? `${coords.bottom}px` : 'auto',
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: `${coords.maxHeight}px`,
            zIndex: 99999,
          }}
          className="bg-white rounded-xl shadow-2xl border border-gray-200/90 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Menu Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-gray-50 via-indigo-50/20 to-white border-b border-gray-100 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck size={12} className="text-indigo-600" />
              Documents ({availableDocs.length})
            </span>
            <span className="text-[10px] text-gray-400 font-medium">View • Download</span>
          </div>

          {/* List of Documents with 2 Options: View & Download */}
          <div className="overflow-y-auto divide-y divide-gray-100 p-1">
            {availableDocs.map((doc) => (
              <div
                key={doc.key}
                className="p-2 hover:bg-gray-50/90 rounded-lg transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate" title={doc.label}>
                    {doc.label}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Option 1: View */}
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 transition-colors border border-indigo-200/60 cursor-pointer"
                    title={`View ${doc.label} in new tab`}
                  >
                    <Eye size={11} />
                    <span>View</span>
                  </a>

                  {/* Option 2: Download */}
                  <button
                    type="button"
                    onClick={(e) => handleDownload(doc, e)}
                    disabled={downloadingKey === doc.key}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 transition-colors border border-emerald-200/60 cursor-pointer disabled:opacity-50"
                    title={`Download ${doc.label}`}
                  >
                    <Download size={11} />
                    <span>{downloadingKey === doc.key ? 'Saving...' : 'Download'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VendorDocumentsDropdown;

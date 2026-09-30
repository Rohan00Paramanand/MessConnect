import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  TrendingUp,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Clock,
  UploadCloud,
  FileText,
  Camera,
  Check,
  X,
  Building2,
  ClipboardList,
  Smile,
  Frown,
  CheckCircle2
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import Button from '../../components/ui/Button';
import LiveCameraCapture from '../../components/common/LiveCameraCapture';

const CommitteeDashboard = () => {
  const { user } = useAuthStore();
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [resolvedComplaints, setResolvedComplaints] = useState([]);

  // Submission modal state
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [messPhotoFile, setMessPhotoFile] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMyVisits = async () => {
    try {
      setLoadingVisits(true);
      const { data } = await api.get('/visits/my-visits');
      setVisits(data.data || []);
    } catch (err) {
      console.warn('Failed to load committee visits:', err.message);
    } finally {
      setLoadingVisits(false);
    }
  };

  const fetchComplaintsWithFeedback = async () => {
    try {
      const { data } = await api.get('/complaints');
      const list = data.data || data || [];
      const resolved = list.filter((c) => c.status === 'resolved');
      setResolvedComplaints(resolved);
    } catch (err) {
      console.warn('Failed to load resolved complaints for dashboard:', err.message);
    }
  };

  useEffect(() => {
    fetchMyVisits();
    fetchComplaintsWithFeedback();
  }, []);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportFile || !messPhotoFile) {
      return toast.error('Both the inspection report (PDF/Image) and your selfie in the mess are required.');
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('report', reportFile);
      formData.append('messPhoto', messPhotoFile);
      if (remarks) {
        formData.append('remarks', remarks);
      }

      const { data } = await api.post(`/visits/submit/${selectedVisit._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(data.message || 'Inspection proof uploaded successfully! Sent to Admin for verification.');
      setSelectedVisit(null);
      setReportFile(null);
      setMessPhotoFile(null);
      setRemarks('');
      fetchMyVisits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit inspection report.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingVisits = visits.filter((v) => v.status === 'SCHEDULED');
  const inReviewVisits = visits.filter((v) => v.status === 'IN_REVIEW');

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-5 sm:p-10 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 text-white shadow-[0_8px_30px_rgba(245,158,11,0.2)] group">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3 border border-white/20">
            <ShieldCheck size={12} /> Committee Portal
          </p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Operations,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-white">{user?.name}</span>
          </h1>
          <p className="text-amber-100 font-medium mt-2 sm:mt-3 max-w-md text-sm sm:text-base">
            Oversee daily operations, manage student feedback, and perform scheduled mess inspection audits.
          </p>
        </div>
      </div>

      {/* PENDING VISITS SECTION: Displays prominently when visits are assigned */}
      {pendingVisits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Pending Inspection Visits ({pendingVisits.length})
              </h2>
            </div>
            <NavLink
              to="/visits"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              All Visits <ArrowRight size={13} />
            </NavLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingVisits.map((visit) => (
              <div
                key={visit._id}
                className="bg-white/80 backdrop-blur-xl border-2 border-amber-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                        <Building2 size={18} />
                      </span>
                      <div>
                        <h3 className="text-base font-black text-gray-900">{visit.messId?.name}</h3>
                        <p className="text-xs text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
                          <Calendar size={12} className="text-amber-600" />
                          Inspection Date: <span className="text-gray-800 font-bold">{new Date(visit.visitDate).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Clock size={11} /> Visit Pending
                    </span>
                  </div>

                  <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/70 text-xs text-gray-800 space-y-1 mb-4 mt-2">
                    <p className="font-bold">
                      Purpose: <span className="font-medium text-gray-700">{visit.purpose}</span>
                    </p>
                    {visit.instructions && (
                      <p className="text-gray-600">
                        <span className="font-bold">Admin Instructions:</span> {visit.instructions}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => setSelectedVisit(visit)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <UploadCloud size={16} /> Upload Inspection Report & Photo
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IN_REVIEW VISITS BANNER: When committee uploaded but awaiting Admin */}
      {inReviewVisits.length > 0 && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <Clock size={20} />
            </span>
            <div>
              <h4 className="text-sm font-bold text-blue-900">
                {inReviewVisits.length} Inspection Submission{inReviewVisits.length > 1 ? 's' : ''} Awaiting Admin Approval
              </h4>
              <p className="text-xs text-blue-700">
                You have uploaded your reports. The College Admin will review them and officially mark the visits done.
              </p>
            </div>
          </div>
          <NavLink
            to="/visits"
            className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-blue-200 whitespace-nowrap"
          >
            View Submissions →
          </NavLink>
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { to: '/visits',     label: 'Audits',   title: 'Mess Visits',Icon: ClipboardList, color: 'text-amber-500', bg: 'from-amber-100 to-orange-50', hover: 'hover:text-amber-500' },
          { to: '/complaints', label: 'Actions',  title: 'Complaints', Icon: AlertTriangle, color: 'text-red-500',   bg: 'from-red-100 to-rose-50',    hover: 'hover:text-red-500' },
          { to: '/feedback',   label: 'Metrics',  title: 'Feedback',   Icon: TrendingUp,   color: 'text-green-500', bg: 'from-green-100 to-emerald-50', hover: 'hover:text-green-500' },
          { to: '/timetable',  label: 'Menu',     title: 'Timetable',  Icon: Calendar,     color: 'text-teal-500',   bg: 'from-teal-100 to-emerald-50', hover: 'hover:text-teal-500' },
        ].map((item) => {
          const { to, label, title, Icon, color, bg, hover } = item;
          return (
            <NavLink
              key={to}
              to={to}
              className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/90 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className={`text-xl font-black text-gray-900 ${hover} transition-colors`}>{title}</h3>
              </div>
              <div
                className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
              >
                <Icon size={22} strokeWidth={2.5} />
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Complaint Resolutions & Student Feedback Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
              <CheckCircle2 size={18} />
            </span>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Resolved Complaints & Student Feedback
            </h2>
          </div>
          <NavLink
            to="/complaints"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            All Complaints <ArrowRight size={13} />
          </NavLink>
        </div>

        {resolvedComplaints.length === 0 ? (
          <div className="p-6 bg-white/60 border border-gray-200/80 rounded-2xl text-center">
            <p className="text-xs text-gray-400 font-medium">No resolved complaints to display yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resolvedComplaints.slice(0, 4).map((c) => (
              <div
                key={c._id}
                className="bg-white/80 backdrop-blur-xl border border-gray-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] font-bold">
                    <span className="uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-extrabold">
                      {c.category}
                    </span>
                    <span className="text-gray-400 font-medium">
                      {new Date(c.resolvedAt || c.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-gray-900 line-clamp-1">{c.title || c.description}</h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{c.mess?.name}</p>
                </div>

                {/* Feedback Display */}
                {c.resolutionFeedback?.rating ? (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      c.resolutionFeedback.rating === 'satisfied'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/80 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        {c.resolutionFeedback.rating === 'satisfied' ? <Smile size={14} className="text-emerald-600" /> : <Frown size={14} className="text-rose-600" />}
                        Student Feedback: <strong className="uppercase">{c.resolutionFeedback.rating}</strong>
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(c.resolutionFeedback.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {c.resolutionFeedback.comment && (
                      <p className="text-gray-700 font-medium text-[11px]">"{c.resolutionFeedback.comment}"</p>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-[11px] text-gray-400 font-medium text-center">
                    Pending student rating
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL: Submit Inspection Proof ================= */}
      {selectedVisit && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
        >
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 border border-gray-100 max-h-[92dvh] overflow-y-auto overscroll-contain my-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-gray-900">Upload Inspection Proof</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {selectedVisit.messId?.name} • Scheduled on {new Date(selectedVisit.visitDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              {/* Inspection Report File Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-amber-600" />
                  1. Inspection Report (PDF or Image) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={(e) => setReportFile(e.target.files[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 border border-gray-200 rounded-xl cursor-pointer"
                />
                {reportFile && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <Check size={12} /> Selected: {reportFile.name} ({(reportFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Mess Selfie / Photo Live Camera Capture */}
              <LiveCameraCapture
                label="2. Photo of Yourself in the Mess *"
                photoFile={messPhotoFile}
                onPhotoCaptured={(file) => setMessPhotoFile(file)}
                onPhotoRemoved={() => setMessPhotoFile(null)}
                watermarkTitle="MESS AUDIT VERIFICATION"
                messName={selectedVisit?.messId?.name || ''}
              />

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Observations / Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize your key observations, food hygiene, tasting notes, etc."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedVisit(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  {submitting ? 'Uploading Proof...' : 'Submit for Admin Review'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CommitteeDashboard;

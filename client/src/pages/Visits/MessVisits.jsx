import React, { useState, useEffect, useCallback } from 'react';
import api, { getImageUrl } from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Camera,
  UploadCloud,
  Eye,
  ExternalLink,
  Plus,
  Building2,
  User,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const MessVisits = () => {
  const { user } = useAuthStore();
  const isCollegeAdmin = user?.role === 'college_admin';
  const isCommitteeMember = user?.role === 'mess_committee';

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  // Modal states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedVisitForReview, setSelectedVisitForReview] = useState(null);
  const [selectedVisitForSubmit, setSelectedVisitForSubmit] = useState(null);

  // Form states for scheduling
  const [messes, setMesses] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [scheduleData, setScheduleData] = useState({
    messId: '',
    assignedTo: '',
    visitDate: '',
    purpose: '',
    instructions: ''
  });
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Form states for Committee submission
  const [reportFile, setReportFile] = useState(null);
  const [messPhotoFile, setMessPhotoFile] = useState(null);
  const [submissionRemarks, setSubmissionRemarks] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Form states for Admin review
  const [adminRemarks, setAdminRemarks] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch visits
  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = isCollegeAdmin ? '/visits' : '/visits/my-visits';
      const { data } = await api.get(endpoint);
      setVisits(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load mess visits.');
    } finally {
      setLoading(false);
    }
  }, [isCollegeAdmin]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Load Messes & Committee members when opening schedule modal
  const openScheduleModal = async () => {
    try {
      setIsScheduleOpen(true);
      const [messesRes, membersRes] = await Promise.all([
        api.get('/messes'),
        api.get('/visits/committee-members')
      ]);
      setMesses(messesRes.data.data || []);
      setCommitteeMembers(membersRes.data.data || []);
    } catch {
      toast.error('Failed to load scheduling prerequisites.');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleData.messId || !scheduleData.assignedTo || !scheduleData.visitDate || !scheduleData.purpose) {
      return toast.error('Please fill in all required fields.');
    }

    try {
      setSubmittingSchedule(true);
      const { data } = await api.post('/visits/schedule', scheduleData);
      toast.success(data.message || 'Inspection visit scheduled successfully!');
      setIsScheduleOpen(false);
      setScheduleData({
        messId: '',
        assignedTo: '',
        visitDate: '',
        purpose: '',
        instructions: ''
      });
      fetchVisits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule visit.');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportFile || !messPhotoFile) {
      return toast.error('Both the inspection report (PDF/Image) and your selfie in the mess are required.');
    }

    try {
      setSubmittingReport(true);
      const formData = new FormData();
      formData.append('report', reportFile);
      formData.append('messPhoto', messPhotoFile);
      if (submissionRemarks) {
        formData.append('remarks', submissionRemarks);
      }

      const { data } = await api.post(`/visits/submit/${selectedVisitForSubmit._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(data.message || 'Inspection report uploaded successfully! Waiting for Admin verification.');
      setSelectedVisitForSubmit(null);
      setReportFile(null);
      setMessPhotoFile(null);
      setSubmissionRemarks('');
      fetchVisits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit inspection report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleMarkDone = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      const { data } = await api.patch(`/visits/mark-done/${selectedVisitForReview._id}`, {
        remarks: adminRemarks
      });
      toast.success(data.message || 'Visit marked as completed successfully!');
      setSelectedVisitForReview(null);
      setAdminRemarks('');
      fetchVisits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete visit.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtered visits
  const filteredVisits = visits.filter((v) => {
    if (activeTab === 'ALL') return true;
    return v.status === activeTab;
  });

  const scheduledCount = visits.filter((v) => v.status === 'SCHEDULED').length;
  const inReviewCount = visits.filter((v) => v.status === 'IN_REVIEW').length;
  const completedCount = visits.filter((v) => v.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-800 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase mb-3 border border-white/20">
              <ClipboardList size={13} /> Mess Audit & Quality Control
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Mess Inspection Visits
            </h1>
            <p className="text-indigo-100 font-medium mt-2 max-w-xl text-sm sm:text-base">
              {isCollegeAdmin
                ? 'Schedule and dispatch visits to committee members, review on-site inspection reports and photos, and officially verify quality standards.'
                : 'View your scheduled inspection assignments, upload proof of visit with on-site selfies and audit documents for college admin review.'}
            </p>
          </div>

          {isCollegeAdmin && (
            <Button
              onClick={openScheduleModal}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 self-start md:self-auto transition-transform hover:scale-105"
            >
              <Plus size={18} /> Schedule New Visit
            </Button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('SCHEDULED')}
          className={`cursor-pointer bg-white/70 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 ${
            activeTab === 'SCHEDULED' ? 'ring-2 ring-amber-500 border-amber-300 shadow-md' : 'border-white/60 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Scheduled / Pending</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </span>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{scheduledCount}</p>
          <p className="text-xs text-amber-600 font-semibold mt-1">Awaiting committee member visit</p>
        </div>

        <div
          onClick={() => setActiveTab('IN_REVIEW')}
          className={`cursor-pointer bg-white/70 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 ${
            activeTab === 'IN_REVIEW' ? 'ring-2 ring-indigo-500 border-indigo-300 shadow-md' : 'border-white/60 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Needs Review</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Eye size={20} />
            </span>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{inReviewCount}</p>
          <p className="text-xs text-indigo-600 font-semibold mt-1">Report & selfie submitted</p>
        </div>

        <div
          onClick={() => setActiveTab('COMPLETED')}
          className={`cursor-pointer bg-white/70 backdrop-blur-xl border rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 ${
            activeTab === 'COMPLETED' ? 'ring-2 ring-emerald-500 border-emerald-300 shadow-md' : 'border-white/60 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Completed & Verified</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </span>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">{completedCount}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Audit marked done by admin</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200/80 pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: `All Visits (${visits.length})` },
          { key: 'SCHEDULED', label: `Pending (${scheduledCount})` },
          { key: 'IN_REVIEW', label: `In Review (${inReviewCount})` },
          { key: 'COMPLETED', label: `Completed (${completedCount})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Visits List */}
      {loading ? (
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-12 text-center text-gray-500 font-medium">
          Loading mess visits...
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No visits found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
            {isCollegeAdmin
              ? 'Click "Schedule New Visit" above to assign an inspection visit to a mess committee member.'
              : 'You do not have any inspection visits assigned for this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVisits.map((visit) => {
            const isScheduled = visit.status === 'SCHEDULED';
            const isInReview = visit.status === 'IN_REVIEW';
            const isCompleted = visit.status === 'COMPLETED';

            return (
              <div
                key={visit._id}
                className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Status header & Mess name */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                          <Building2 size={16} />
                        </span>
                        <h3 className="text-lg font-black text-gray-900">
                          {visit.messId?.name || 'Mess Facility'}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold mt-1">
                        Scheduled for: <span className="text-indigo-600 font-bold">{new Date(visit.visitDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                        isScheduled
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : isInReview
                          ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isScheduled && <Clock size={12} />}
                      {isInReview && <Eye size={12} />}
                      {isCompleted && <CheckCircle2 size={12} />}
                      {isScheduled ? 'Pending Visit' : isInReview ? 'Ready for Review' : 'Verified & Done'}
                    </span>
                  </div>

                  {/* Purpose & Instructions */}
                  <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 text-sm space-y-1 mb-4">
                    <p className="font-bold text-gray-800">
                      Purpose: <span className="font-medium text-gray-700">{visit.purpose}</span>
                    </p>
                    {visit.instructions && (
                      <p className="text-xs text-gray-500 font-medium">
                        <span className="font-bold text-gray-700">Instructions:</span> {visit.instructions}
                      </p>
                    )}
                  </div>

                  {/* People involved */}
                  <div className="text-xs text-gray-600 space-y-1 mb-4">
                    {isCollegeAdmin && visit.assignedTo && (
                      <p className="flex items-center gap-1.5 font-medium">
                        <User size={13} className="text-gray-400" />
                        Assigned To:{' '}
                        <strong className="text-gray-900">{visit.assignedTo.name}</strong> ({visit.assignedTo.email})
                      </p>
                    )}
                    {isCommitteeMember && visit.scheduledBy && (
                      <p className="flex items-center gap-1.5 font-medium">
                        <ShieldCheck size={13} className="text-indigo-500" />
                        Scheduled By:{' '}
                        <strong className="text-gray-900">{visit.scheduledBy.name}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  {/* Committee Member: Submit button if scheduled */}
                  {isCommitteeMember && isScheduled && (
                    <Button
                      onClick={() => setSelectedVisitForSubmit(visit)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2"
                    >
                      <UploadCloud size={16} /> Submit Inspection Report & Photo
                    </Button>
                  )}

                  {/* Committee Member: Already submitted status */}
                  {isCommitteeMember && isInReview && (
                    <div className="w-full text-center text-xs text-blue-700 bg-blue-50 py-2 rounded-xl font-bold border border-blue-200 flex items-center justify-center gap-1.5">
                      <Clock size={14} /> Report Submitted — Awaiting College Admin Approval
                    </div>
                  )}

                  {/* College Admin: Review & Mark Done */}
                  {isCollegeAdmin && isInReview && (
                    <Button
                      onClick={() => setSelectedVisitForReview(visit)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2"
                    >
                      <Eye size={16} /> Review Report & Mark as Done
                    </Button>
                  )}

                  {/* College Admin: Scheduled status */}
                  {isCollegeAdmin && isScheduled && (
                    <span className="text-xs text-gray-500 font-semibold">
                      Waiting for committee member to conduct visit & upload report.
                    </span>
                  )}

                  {/* Completed summary preview for anyone */}
                  {isCompleted && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedVisitForReview(visit)}
                      className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <FileText size={14} /> View Completed Audit Record
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: Schedule Visit (College Admin) ================= */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-gray-900">Schedule Mess Inspection</h3>
                <p className="text-xs text-gray-500 font-medium">Assign a verified committee member and notify via email.</p>
              </div>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Mess Facility *
                </label>
                <select
                  required
                  value={scheduleData.messId}
                  onChange={(e) => setScheduleData({ ...scheduleData, messId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Choose Mess --</option>
                  {messes.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Assign Mess Committee Member *
                </label>
                <select
                  required
                  value={scheduleData.assignedTo}
                  onChange={(e) => setScheduleData({ ...scheduleData, assignedTo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Choose Committee Member --</option>
                  {committeeMembers.map((cm) => (
                    <option key={cm._id} value={cm._id}>
                      {cm.name} ({cm.email}) {cm.messAssigned ? `• Mess: ${cm.messAssigned.name}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  An automated email with meeting details will be floated to this member immediately.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Inspection Visit Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduleData.visitDate}
                  onChange={(e) => setScheduleData({ ...scheduleData, visitDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Purpose of Visit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Food Quality & Hygiene Inspection"
                  value={scheduleData.purpose}
                  onChange={(e) => setScheduleData({ ...scheduleData, purpose: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Special Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Check kitchen grease trap, ration storage expiry dates, staff uniforms."
                  value={scheduleData.instructions}
                  onChange={(e) => setScheduleData({ ...scheduleData, instructions: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsScheduleOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingSchedule}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {submittingSchedule ? 'Scheduling & Emailing...' : 'Schedule & Send Email'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Committee Member Submit Report & Photo ================= */}
      {selectedVisitForSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-gray-900">Submit Inspection Proof</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {selectedVisitForSubmit.messId?.name} • Scheduled on {new Date(selectedVisitForSubmit.visitDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedVisitForSubmit(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle size={14} /> Submission Requirements:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                  <li><strong>Inspection Report:</strong> Uploaded as a PDF document or high-res Image.</li>
                  <li><strong>Selfie / Photograph:</strong> You must upload a photo of yourself taken inside the mess facility.</li>
                </ul>
              </div>

              {/* Inspection Report File Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-600" />
                  1. Inspection Report (PDF or Image) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={(e) => setReportFile(e.target.files[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-gray-200 rounded-xl cursor-pointer"
                />
                {reportFile && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <Check size={12} /> Selected: {reportFile.name} ({(reportFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Mess Selfie / Photo File Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Camera size={14} className="text-amber-600" />
                  2. Photo of Yourself in the Mess *
                </label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => setMessPhotoFile(e.target.files[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 border border-gray-200 rounded-xl cursor-pointer"
                />
                {messPhotoFile && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <Check size={12} /> Selected: {messPhotoFile.name}
                  </p>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Observations / Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize your key observations, food taste rating, kitchen cleanliness status, etc."
                  value={submissionRemarks}
                  onChange={(e) => setSubmissionRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedVisitForSubmit(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingReport}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  {submittingReport ? 'Uploading Files...' : 'Submit Inspection Proof'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: Admin Review & Mark Done ================= */}
      {selectedVisitForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {selectedVisitForReview.status === 'COMPLETED' ? 'Inspection Audit Record' : 'Review Inspection Submission'}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {selectedVisitForReview.messId?.name} • Conducted by {selectedVisitForReview.assignedTo?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedVisitForReview(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Visit Details */}
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl text-xs">
              <div>
                <p className="text-gray-400 font-bold uppercase">Scheduled Date</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5">
                  {new Date(selectedVisitForReview.visitDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase">Submitted On</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5">
                  {selectedVisitForReview.submission?.submittedAt
                    ? new Date(selectedVisitForReview.submission.submittedAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-400 font-bold uppercase">Purpose</p>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedVisitForReview.purpose}</p>
              </div>
              {selectedVisitForReview.submission?.remarks && (
                <div className="col-span-2 bg-white p-3 rounded-xl border border-gray-200/60 mt-1">
                  <p className="text-gray-500 font-bold uppercase text-[10px]">Committee Member Observations:</p>
                  <p className="text-gray-800 text-sm mt-0.5">{selectedVisitForReview.submission.remarks}</p>
                </div>
              )}
            </div>

            {/* Visual Proofs Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-indigo-600" /> Submitted Proofs & Documents
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Report Card */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Inspection Report
                    </span>
                    {selectedVisitForReview.submission?.reportType === 'pdf' ? (
                      <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100">
                        <FileText size={24} className="flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">Inspection Report.pdf</p>
                          <p className="text-[10px] text-red-500">PDF Document</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-gray-200 h-40 bg-gray-100">
                        <img
                          src={getImageUrl(selectedVisitForReview.submission?.reportUrl)}
                          alt="Inspection Report"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {selectedVisitForReview.submission?.reportUrl && (
                    <a
                      href={getImageUrl(selectedVisitForReview.submission.reportUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold shadow-sm"
                    >
                      <ExternalLink size={13} /> Open Full Report
                    </a>
                  )}
                </div>

                {/* 2. Photo Inside Mess Card */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Selfie / Photo Inside Mess
                    </span>
                    <div className="rounded-xl overflow-hidden border border-gray-200 h-40 bg-gray-100">
                      {selectedVisitForReview.submission?.messPhotoUrl ? (
                        <img
                          src={getImageUrl(selectedVisitForReview.submission.messPhotoUrl)}
                          alt="Committee Member in Mess"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-gray-400">
                          No photo uploaded
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedVisitForReview.submission?.messPhotoUrl && (
                    <a
                      href={getImageUrl(selectedVisitForReview.submission.messPhotoUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold shadow-sm"
                    >
                      <ExternalLink size={13} /> View Full Photo
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Verification Action */}
            {isCollegeAdmin && selectedVisitForReview.status === 'IN_REVIEW' && (
              <form onSubmit={handleMarkDone} className="space-y-4 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Admin Approval Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Report verified. Mess cleanliness and quality deemed satisfactory."
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedVisitForReview(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    {submittingReview ? 'Verifying...' : 'Mark Visit as Done'}
                  </Button>
                </div>
              </form>
            )}

            {/* Completed Audit Stamp */}
            {selectedVisitForReview.status === 'COMPLETED' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-800">Verified & Marked Completed</p>
                  <p className="mt-0.5 text-emerald-700">
                    Reviewed on {new Date(selectedVisitForReview.adminReview?.reviewedAt).toLocaleString()}
                    {selectedVisitForReview.adminReview?.remarks ? ` — "${selectedVisitForReview.adminReview.remarks}"` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessVisits;

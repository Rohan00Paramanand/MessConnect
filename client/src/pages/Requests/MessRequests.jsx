import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import PhotoViewerModal from '../../components/common/PhotoViewerModal';
import {
  Wrench,
  Plus,
  X,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Clock3,
  XCircle,
  Building,
  DollarSign,
  User,
  Filter,
  MessageSquare,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'Equipment_Repair', label: 'Equipment Repair' },
  { value: 'Infrastructure_maintenance', label: 'Infrastructure Maintenance' },
  { value: 'Other', label: 'Other Request' }
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'HIGH', label: 'High Priority' },
  { value: 'URGENT', label: 'Urgent' }
];

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Review',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    icon: Clock3
  },
  APPROVED: {
    label: 'Approved',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    icon: CheckCircle2
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    icon: Wrench
  },
  COMPLETED: {
    label: 'Completed',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    icon: CheckCircle2
  },
  REJECTED: {
    label: 'Rejected',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
    icon: XCircle
  }
};

const PRIORITY_BADGES = {
  LOW: 'bg-gray-100 text-gray-600 border-gray-200',
  MEDIUM: 'bg-blue-50 text-blue-600 border-blue-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  URGENT: 'bg-red-50 text-red-700 border-red-200'
};

const MessRequests = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionItem, setActionItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null);

  // Create form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'Equipment_Repair',
    description: '',
    priority: 'MEDIUM',
    estimatedCost: ''
  });
  const [imageFile, setImageFile] = useState(null);

  // Admin action state
  const [actionStatus, setActionStatus] = useState('APPROVED');
  const [adminRemarks, setAdminRemarks] = useState('');

  const isVendor = user?.role === 'vendor';
  const isAdmin = user?.role === 'college_admin' || user?.role === 'super_admin';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mess-requests');
      if (res.data?.data) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load mess requests', err);
      toast.error(err.response?.data?.message || 'Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Freeze background scrolling when any modal is open
  useEffect(() => {
    const isModalOpen = showCreateModal || Boolean(actionItem) || Boolean(viewingRequest);
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !createLoading && !actionLoading) {
        setShowCreateModal(false);
        setActionItem(null);
        setViewingRequest(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCreateModal, actionItem, viewingRequest, createLoading, actionLoading]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return toast.error('Please enter a request title');
    }
    if (!formData.description.trim()) {
      return toast.error('Please enter a detailed description');
    }

    try {
      setCreateLoading(true);
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('category', formData.category);
      submitData.append('description', formData.description.trim());
      submitData.append('priority', formData.priority);
      if (formData.estimatedCost) {
        submitData.append('estimatedCost', formData.estimatedCost);
      }
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      await api.post('/mess-requests', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Maintenance request submitted to College Admin');
      setShowCreateModal(false);
      setFormData({
        title: '',
        category: 'Equipment_Repair',
        description: '',
        priority: 'MEDIUM',
        estimatedCost: ''
      });
      setImageFile(null);
      fetchRequests();
    } catch (err) {
      console.error('Failed to create mess request', err);
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAdminActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionItem) return;

    if (actionStatus === 'REJECTED' && !adminRemarks.trim()) {
      return toast.error('Please provide a reason for rejecting this request');
    }

    try {
      setActionLoading(true);
      await api.patch(`/mess-requests/${actionItem._id}/status`, {
        status: actionStatus,
        adminRemarks: adminRemarks.trim()
      });

      toast.success(`Request marked as ${actionStatus.replace('_', ' ')}`);
      setActionItem(null);
      setAdminRemarks('');
      fetchRequests();
    } catch (err) {
      console.error('Failed to update request', err);
      toast.error(err.response?.data?.message || 'Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pending request?')) return;
    try {
      await api.delete(`/mess-requests/${id}`);
      toast.success('Request deleted');
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete request');
    }
  };

  // Filtered list
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      return true;
    });
  }, [requests, statusFilter, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
      inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
      approved: requests.filter((r) => r.status === 'APPROVED').length,
      completed: requests.filter((r) => r.status === 'COMPLETED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length
    };
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-indigo-600" />
            Mess Maintenance Requests
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            {isVendor
              ? 'Submit operational and repair needs directly to College Administration.'
              : 'Review and act on operational & maintenance needs raised by mess vendors.'}
          </p>
        </div>

        {isVendor && (
          <Button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus size={16} />
            New Maintenance Request
          </Button>
        )}
      </div>

      {/* ─── Metric Pills ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {[
          { key: 'ALL', label: 'All Requests', count: stats.all, color: 'text-gray-900' },
          { key: 'PENDING', label: 'Pending', count: stats.pending, color: 'text-amber-700' },
          { key: 'IN_PROGRESS', label: 'In Progress', count: stats.inProgress, color: 'text-indigo-700' },
          { key: 'APPROVED', label: 'Approved', count: stats.approved, color: 'text-blue-700' },
          { key: 'COMPLETED', label: 'Completed', count: stats.completed, color: 'text-emerald-700' },
          { key: 'REJECTED', label: 'Rejected', count: stats.rejected, color: 'text-rose-700' }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStatusFilter(item.key)}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === item.key
                ? 'bg-white border-indigo-300 shadow-md ring-2 ring-indigo-500/10'
                : 'bg-white/80 hover:bg-white border-gray-200/80 shadow-xs'
            }`}
          >
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{item.label}</p>
            <p className={`text-xl font-black mt-1 ${item.color}`}>{item.count}</p>
          </button>
        ))}
      </div>

      {/* ─── Category Filter & Status Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 p-3 rounded-2xl border border-gray-200/80 backdrop-blur-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Filter size={14} />
          <span>Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-white border border-gray-200 text-gray-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Equipment_Repair">Equipment Repair</option>
            <option value="Infrastructure_maintenance">Infrastructure Maintenance</option>
            <option value="Other">Other Request</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-gray-400">
          Showing {filteredRequests.length} of {requests.length} requests
        </span>
      </div>

      {/* ─── Requests List ─── */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading maintenance requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">No requests found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {requests.length === 0
              ? isVendor
                ? 'You have not submitted any maintenance requests yet. Click the button above to raise one.'
                : 'No maintenance requests have been submitted by vendors yet.'
              : 'No requests match the currently selected filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = statusConfig.icon;
            const priorityBadge = PRIORITY_BADGES[req.priority] || PRIORITY_BADGES.MEDIUM;

            return (
              <div
                key={req._id}
                onClick={() => setViewingRequest(req)}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 overflow-hidden cursor-pointer group"
              >
                <div className="p-4 sm:p-5">
                  {/* Top line: Category, Priority, Date, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                        {req.category.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg border ${priorityBadge}`}>
                        {req.priority}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(req.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${statusConfig.badge}`}
                      >
                        <StatusIcon size={13} className="flex-shrink-0" />
                        <span>{statusConfig.label}</span>
                      </span>

                      {/* Vendor delete if pending */}
                      {isVendor && req.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(req._id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Pending Request"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-gray-900 tracking-tight mb-1.5 group-hover:text-indigo-600 transition-colors">
                    {req.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-3">
                    {req.description}
                  </p>

                  {/* Metadata Row: Mess, Vendor, Estimated Cost, Image */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    {req.mess?.name && (
                      <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <Building size={13} className="text-gray-400" />
                        {req.mess.name}
                      </span>
                    )}

                    {req.vendor?.name && (
                      <span className="flex items-center gap-1.5">
                        <User size={13} className="text-gray-400" />
                        Vendor: <strong className="text-gray-700">{req.vendor.name}</strong>
                      </span>
                    )}

                    {req.estimatedCost != null && req.estimatedCost > 0 && (
                      <span className="flex items-center gap-1 font-bold text-gray-800">
                        <DollarSign size={13} className="text-gray-400" />
                        Est. Cost: ₹{req.estimatedCost.toLocaleString()}
                      </span>
                    )}

                    {req.image && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto({ url: req.image, title: req.title });
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline ml-auto cursor-pointer"
                      >
                        View Photo Attachment
                      </button>
                    )}
                  </div>

                  {/* Admin Remarks Box (if reviewed) */}
                  {req.adminRemarks && (
                    <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-xs text-gray-700">
                      <div className="flex items-center gap-1.5 font-bold text-gray-800 mb-1">
                        <MessageSquare size={13} className="text-indigo-600" />
                        <span>College Admin Remarks:</span>
                        {req.actionTakenBy?.name && (
                          <span className="text-[10px] text-gray-400 font-normal">
                            by {req.actionTakenBy.name} on{' '}
                            {req.actionTakenAt
                              ? new Date(req.actionTakenAt).toLocaleDateString()
                              : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 leading-normal">{req.adminRemarks}</p>
                    </div>
                  )}

                  {/* Action & View details footer */}
                  <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs gap-2">
                    <span className="text-[11px] font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 transition-colors">
                      Click to view full status & remarks <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>

                    {isAdmin && (
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionItem(req);
                          setActionStatus(req.status === 'PENDING' ? 'APPROVED' : req.status);
                          setAdminRemarks(req.adminRemarks || '');
                        }}
                        className="text-xs px-3.5 py-1.5 cursor-pointer shadow-xs hover:shadow-md"
                      >
                        <Wrench size={13} className="flex-shrink-0" />
                        <span>Update Status / Remarks</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Vendor: Create Request Modal ─── */}
      {showCreateModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto overscroll-contain flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !createLoading) {
              setShowCreateModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative my-auto max-h-[90dvh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Wrench size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">New Maintenance Request</h3>
                <p className="text-xs text-gray-500">Submitted directly to College Administration</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Request Title *</label>
                <Input
                  type="text"
                  placeholder="e.g. Exhaust chimney motor failure, Deep freezer cooling leak"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    options={CATEGORY_OPTIONS}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                  <Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    options={PRIORITY_OPTIONS}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Estimated Cost (₹, optional)</label>
                <Input
                  type="number"
                  placeholder="e.g. 3500"
                  min="0"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description *</label>
                <textarea
                  rows={4}
                  placeholder="Detail the issue, location in the kitchen/mess, and any urgent safety impact..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Attach Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={createLoading}>
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── College Admin Action Modal ─── */}
      {actionItem && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto overscroll-contain flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionLoading) {
              setActionItem(null);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative my-auto max-h-[90dvh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActionItem(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-gray-900 tracking-tight mb-1">
              Review Maintenance Request
            </h3>
            <p className="text-xs text-gray-500 mb-4 truncate font-medium">
              "{actionItem.title}" • {actionItem.mess?.name}
            </p>

            <form onSubmit={handleAdminActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Action Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'APPROVED', label: 'Approve', color: 'border-blue-400 bg-blue-50 text-blue-700' },
                    { value: 'IN_PROGRESS', label: 'In Progress', color: 'border-indigo-400 bg-indigo-50 text-indigo-700' },
                    { value: 'COMPLETED', label: 'Mark Completed', color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
                    { value: 'REJECTED', label: 'Reject', color: 'border-rose-400 bg-rose-50 text-rose-700' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActionStatus(opt.value)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        actionStatus === opt.value
                          ? `${opt.color} ring-2 ring-indigo-500/20`
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Administrative Remarks {actionStatus === 'REJECTED' && <span className="text-red-500">* (Reason required)</span>}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    actionStatus === 'REJECTED'
                      ? 'Explain reason for rejection to the vendor...'
                      : 'Provide notes, sanctioned budget, or assigned campus maintenance staff...'
                  }
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:outline-hidden focus:border-indigo-500 font-medium"
                  required={actionStatus === 'REJECTED'}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActionItem(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={actionLoading}>
                  Confirm Update
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Request Details & College Admin Remarks Modal ─── */}
      {viewingRequest && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto overscroll-contain flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingRequest(null);
            }
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-gray-100 relative my-auto max-h-[90dvh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                    {viewingRequest.category.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg border ${PRIORITY_BADGES[viewingRequest.priority] || PRIORITY_BADGES.MEDIUM}`}>
                    {viewingRequest.priority} PRIORITY
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(viewingRequest.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                  {viewingRequest.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setViewingRequest(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status & College Admin Remarks Section (Prominent Highlight) */}
            <div className={`p-4 rounded-2xl border ${
              viewingRequest.status === 'APPROVED'
                ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                : viewingRequest.status === 'IN_PROGRESS'
                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                : viewingRequest.status === 'COMPLETED'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : viewingRequest.status === 'REJECTED'
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-xl bg-white shadow-xs ${
                    viewingRequest.status === 'APPROVED' ? 'text-blue-600' :
                    viewingRequest.status === 'IN_PROGRESS' ? 'text-indigo-600' :
                    viewingRequest.status === 'COMPLETED' ? 'text-emerald-600' :
                    viewingRequest.status === 'REJECTED' ? 'text-rose-600' :
                    'text-amber-600'
                  }`}>
                    {React.createElement(STATUS_CONFIG[viewingRequest.status]?.icon || Clock3, { size: 18 })}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Request Status</p>
                    <p className="text-sm font-black">
                      {STATUS_CONFIG[viewingRequest.status]?.label || viewingRequest.status}
                    </p>
                  </div>
                </div>

                {viewingRequest.actionTakenBy?.name && (
                  <span className="text-[11px] font-medium text-gray-600 bg-white/70 px-2 py-0.5 rounded-lg border border-gray-200/60">
                    Reviewed by {viewingRequest.actionTakenBy.name}
                  </span>
                )}
              </div>

              {/* College Admin Comment Box */}
              <div className="mt-3 p-3.5 rounded-xl bg-white border border-gray-200/80 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-gray-800">
                    <MessageSquare size={14} className="text-indigo-600" />
                    College Admin Feedback / Decision
                  </span>
                  {viewingRequest.actionTakenAt && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(viewingRequest.actionTakenAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </div>

                {viewingRequest.adminRemarks ? (
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-relaxed whitespace-pre-line bg-gray-50/60 p-2.5 rounded-lg border border-gray-100">
                    "{viewingRequest.adminRemarks}"
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic p-2">
                    {viewingRequest.status === 'PENDING'
                      ? 'No comments yet. The college admin will review this request and provide remarks shortly.'
                      : 'No written remarks provided.'}
                  </p>
                )}
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Issue Description
              </h4>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                {viewingRequest.description}
              </p>
            </div>

            {/* Mess Location & Estimated Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Mess Location</span>
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Building size={14} className="text-gray-400" />
                  {viewingRequest.mess?.name || 'Mess'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Estimated Cost</span>
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-gray-400" />
                  {viewingRequest.estimatedCost != null && viewingRequest.estimatedCost > 0
                    ? `₹${viewingRequest.estimatedCost.toLocaleString()}`
                    : 'Not specified'}
                </span>
              </div>
            </div>

            {/* Photo Attachment preview if available */}
            {viewingRequest.image && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Attached Photo</span>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto({ url: viewingRequest.image, title: viewingRequest.title })}
                  className="group relative rounded-2xl overflow-hidden border border-gray-200 block w-full max-h-48 cursor-pointer hover:border-indigo-400 transition-all text-left"
                >
                  <img
                    src={viewingRequest.image}
                    alt={viewingRequest.title}
                    className="w-full h-36 object-cover group-hover:scale-102 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 flex items-center justify-center text-white text-xs font-bold transition-all">
                    Click to View Full Photo
                  </div>
                </button>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
              {isVendor && viewingRequest.status === 'PENDING' ? (
                <button
                  type="button"
                  onClick={() => {
                    const id = viewingRequest._id;
                    setViewingRequest(null);
                    handleDelete(id);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete Request
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    type="button"
                    onClick={() => {
                      const item = viewingRequest;
                      setViewingRequest(null);
                      setActionItem(item);
                      setActionStatus(item.status === 'PENDING' ? 'APPROVED' : item.status);
                      setAdminRemarks(item.adminRemarks || '');
                    }}
                    className="text-xs px-3.5 py-1.5"
                  >
                    <Wrench size={13} className="flex-shrink-0" />
                    <span>Update Status</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewingRequest(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Photo Viewer Modal ─── */}
      {selectedPhoto && (
        <PhotoViewerModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
};

export default MessRequests;

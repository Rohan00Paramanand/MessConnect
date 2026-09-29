import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api, { getImageUrl } from '../../api/axios';
import toast from 'react-hot-toast';
import ComplaintForm from './ComplaintForm';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { AlertCircle, CheckCircle, Clock, XCircle, MessageSquare, RefreshCw, MapPin, ThumbsUp, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

const statusConfig = {
  pending:          { label: 'Pending',          color: 'bg-gray-100 text-gray-700 border-gray-200',    icon: Clock },
  assigned:         { label: 'Assigned',         color: 'bg-blue-100 text-blue-700 border-blue-200',    icon: RefreshCw },
  vendor_completed: { label: 'Completed',        color: 'bg-amber-100 text-amber-700 border-amber-200', icon: CheckCircle },
  resolved:         { label: 'Resolved',         color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  rejected:         { label: 'Rejected',         color: 'bg-red-100 text-red-700 border-red-200',       icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${cfg.color}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
};

const ExpandableDescription = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text && (text.length > 180 || text.split('\n').length > 3);

  if (!text) return null;

  return (
    <div className="mb-4">
      <p
        className={`text-gray-700 font-medium text-base leading-relaxed break-words [overflow-wrap:anywhere] transition-all duration-200 ${
          !isExpanded && isLong ? 'line-clamp-3' : ''
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer select-none"
        >
          <span>{isExpanded ? 'Read less' : 'Read more'}</span>
          {isExpanded ? (
            <ChevronUp size={14} className="stroke-[2.5]" />
          ) : (
            <ChevronDown size={14} className="stroke-[2.5]" />
          )}
        </button>
      )}
    </div>
  );
};

const ComplaintsList = () => {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messFilter, setMessFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const [messes, setMesses] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (user?.collegeId) {
      api.get('/messes')
        .then(({ data }) => {
          setMesses(data.data || []);
        })
        .catch(err => {
          console.error('Failed to load messes', err);
        });
    }
  }, [user]);

  const sortComplaints = (list) => {
    return list.sort((a, b) => {
      const aVotes = a.upvotes?.length || 0;
      const bVotes = b.upvotes?.length || 0;
      if (aVotes !== bVotes) return bVotes - aVotes;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const fetchComplaints = useCallback(async () => {
    try {
      const params = {};
      if (messFilter) params.mess = messFilter;
      const { data } = await api.get('/complaints', { params });
      setComplaints(sortComplaints(data.data || data));
      setCurrentPage(1);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [messFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchComplaints]);

  const filteredComplaints = complaints.filter((c) => {
    // Status filter
    let statusMatch = true;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'pending') statusMatch = c.status === 'pending';
      else if (statusFilter === 'assigned') statusMatch = c.status === 'assigned' || c.status === 'vendor_completed';
      else if (statusFilter === 'resolved') statusMatch = c.status === 'resolved';
      else if (statusFilter === 'rejected') statusMatch = c.status?.startsWith('rejected');
      else statusMatch = c.status === statusFilter;
    }
    if (!statusMatch) return false;

    // Category filter
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE) || 1;
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusUpdate = async (id, value) => {
    let status = value;
    let rejectionReason = null;
    if (value.startsWith('rejected:')) {
      const parts = value.split(':');
      status = parts[0];
      rejectionReason = parts[1];
    }
    try {
      await api.patch(`/complaints/${id}/status`, { status, rejectionReason });
      toast.success('Status updated');
      fetchComplaints();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error updating status');
    }
  };

  const handleUpvote = async (id) => {
    if (user?.role !== 'user' && user?.role !== 'student') return;
    try {
      await api.post(`/complaints/${id}/upvote`);
      toast.success('Me Too! Vote recorded.');
      setComplaints(prev => {
         const newList = prev.map(c => {
             if (c._id === id) {
                 const votes = c.upvotes || [];
                 const hasVoted = votes.includes(user._id);
                 return { ...c, upvotes: hasVoted ? votes.filter(v => v !== user._id) : [...votes, user._id] };
             }
             return c;
         });
         return sortComplaints(newList);
      });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to record vote');
    }
  };

  const handleVendorComplete = async (id) => {
    try {
      await api.patch(`/complaints/${id}/vendor-complete`);
      toast.success('Marked as completed!');
      fetchComplaints();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const roleGradients = {
    user: 'from-blue-600 via-indigo-600 to-violet-600',
    student: 'from-blue-600 via-indigo-600 to-violet-600',
    mess_committee: 'from-amber-600 via-orange-500 to-amber-600',
    vendor: 'from-rose-600 via-pink-600 to-rose-600',
    college_admin: 'from-indigo-600 via-violet-600 to-purple-600',
    admin: 'from-indigo-600 via-violet-600 to-purple-600',
    super_admin: 'from-violet-700 via-purple-600 to-indigo-700',
  };
  const gradient = roleGradients[user?.role] || roleGradients.user;

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Header */}
      <div className={`relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 bg-gradient-to-r ${gradient} text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)]`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <MessageSquare size={18} />
              </div>
              <span className="text-white/70 text-xs sm:text-sm font-bold uppercase tracking-widest">Module</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1">Complaints</h1>
            <p className="text-white/70 text-sm sm:text-base font-medium">
              {(user?.role === 'user' || user?.role === 'student') ? 'Submit and track your mess complaints' : 'Review and manage all incoming complaints'}
            </p>
          </div>
          <div className="text-right bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/30 self-start sm:self-auto">
            <p className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Complaints</p>
            <p className="text-2xl sm:text-3xl font-black">{complaints.length}</p>
          </div>
        </div>
      </div>

      {/* User Complaint Form */}
      {(user?.role === 'user' || user?.role === 'student') && (
        <ComplaintForm onComplaintAdded={(newCmp) => setComplaints(prev => sortComplaints([newCmp, ...prev]))} />
      )}

      {/* Dropdown Filters Bar (Available for EVERY SINGLE ROLE) */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            options={[
              { value: 'ALL', label: `All Statuses (${complaints.length})` },
              { value: 'pending', label: `Pending (${complaints.filter(c => c.status === 'pending').length})` },
              { value: 'assigned', label: `Assigned / In Progress (${complaints.filter(c => c.status === 'assigned' || c.status === 'vendor_completed').length})` },
              { value: 'resolved', label: `Resolved (${complaints.filter(c => c.status === 'resolved').length})` },
              { value: 'rejected', label: `Rejected (${complaints.filter(c => c.status?.startsWith('rejected')).length})` },
            ]}
          />

          <Select
            label="Filter by Category"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            options={[
              { value: 'ALL', label: `All Categories (${complaints.length})` },
              { value: 'food', label: `Food (${complaints.filter(c => c.category === 'food').length})` },
              { value: 'cleanliness', label: `Cleanliness (${complaints.filter(c => c.category === 'cleanliness').length})` },
              { value: 'timeliness', label: `Timeliness (${complaints.filter(c => c.category === 'timeliness').length})` },
              { value: 'taste', label: `Taste (${complaints.filter(c => c.category === 'taste').length})` },
              { value: 'staff behaviour', label: `Staff Behaviour (${complaints.filter(c => c.category === 'staff behaviour').length})` },
              { value: 'other', label: `Other (${complaints.filter(c => c.category === 'other').length})` },
            ]}
          />

          {messes.length > 0 && (
            <Select
              label="Filter by Mess"
              value={messFilter}
              onChange={(e) => { setMessFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { value: '', label: 'All Messes' },
                ...messes.map((m) => ({ value: m._id, label: m.name })),
              ]}
            />
          )}
        </div>

        {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || messFilter) && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 flex-wrap gap-2">
            <span className="text-xs text-gray-500 font-medium">
              Filtered results: <strong className="text-gray-900">{filteredComplaints.length}</strong> complaints
            </span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setMessFilter('');
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading complaints...</p>
          </div>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="text-center p-16 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50">
          <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-gray-400" size={28} />
          </div>
          <h3 className="font-bold text-gray-700 mb-1">No complaints found</h3>
          <p className="text-gray-400 text-sm">
            {statusFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'No complaints found matching the selected filters.'
              : (user?.role === 'user' || user?.role === 'student')
              ? 'Use the form above to submit a complaint'
              : 'No complaints have been submitted yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedComplaints.map(complaint => (
            <div key={complaint._id} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <StatusBadge status={complaint.status} />
                    {complaint.status === 'rejected' && complaint.rejectionReason && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold text-red-600 bg-red-50 rounded-full border border-red-200">
                        Reason: {complaint.rejectionReason.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-full border border-gray-200 capitalize">
                      {complaint.category}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-200">
                      🏛️ {complaint.mess?.name || messes.find(m => m._id === complaint.mess)?.name || 'Mess'}
                    </span>
                    <div className="ml-auto">
                      <button
                        onClick={() => handleUpvote(complaint._id)}
                        disabled={(!['user', 'student'].includes(user?.role)) || complaint.status !== 'pending'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-bold transition-all ${
                          complaint.upvotes?.includes(user?._id)
                            ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-inner hover:bg-amber-50 hover:border-amber-400'
                            : ['user', 'student'].includes(user?.role) && complaint.status === 'pending'
                              ? 'bg-white border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-600'
                              : 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed opacity-80'
                        }`}
                        title={['user', 'student'].includes(user?.role) ? (complaint.upvotes?.includes(user?._id) ? "Click to remove your vote" : "I'm experiencing this too") : `${complaint.upvotes?.length || 0} users experiencing this`}
                      >
                        <ThumbsUp size={14} className={complaint.upvotes?.includes(user?._id) ? "fill-amber-500 text-amber-500" : ""} />
                        {complaint.upvotes?.length || 0}
                      </button>
                    </div>
                  </div>
                  <ExpandableDescription text={complaint.description} />
                  {complaint.image && complaint.image.trim() !== '' && (
                    <div 
                      onClick={() => setSelectedPhoto({
                        url: getImageUrl(complaint.image),
                        title: complaint.category.toUpperCase(),
                        description: complaint.description,
                        address: complaint.location?.address || (complaint.location?.latitude ? `${complaint.location.latitude.toFixed(4)}, ${complaint.location.longitude.toFixed(4)}` : null)
                      })}
                      className="relative max-w-xs h-44 mt-3 group cursor-pointer overflow-hidden rounded-2xl border border-gray-200/80 shadow-sm hover:border-teal-400 hover:shadow-lg transition-all duration-300 bg-gray-900/5 flex items-center justify-center"
                      title="Click to view full image"
                    >
                      <img
                        src={getImageUrl(complaint.image)}
                        alt="Complaint Proof"
                        className="max-h-44 max-w-full object-contain group-hover:scale-105 transition-all duration-300"
                        onError={(e) => {
                          const container = e.target.closest('.group');
                          if (container) container.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end p-2.5">
                        <span className="text-[11px] font-bold text-white flex items-center gap-1">
                          🔍 Click to Enlarge
                        </span>
                      </div>
                      {complaint.location?.latitude && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-lg text-[9px] text-white flex items-center gap-0.5 font-bold border border-white/20">
                          <MapPin size={8} className="text-teal-400" />
                          Geo-tagged
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-gray-100/50">
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-2 flex-wrap">
                      <span>Submitted {new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {complaint.user_id?.name && (
                        <span className="flex items-center gap-1.5">
                          <span>· by {complaint.user_id.name}</span>
                          {['user', 'student'].includes(complaint.user_id.role) && typeof complaint.user_id.trustMeter === 'number' && (
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              complaint.user_id.trustMeter >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                              complaint.user_id.trustMeter >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`} title="User Trust Score">
                              🛡️ {complaint.user_id.trustMeter}% Trust
                            </span>
                          )}
                        </span>
                      )}
                    </p>
                    {complaint.location?.latitude && (
                      <div className="flex items-center gap-1 text-teal-600 bg-teal-50/60 px-2.5 py-1 rounded-xl border border-teal-100/70 w-fit max-w-full">
                        <MapPin size={12} className="flex-shrink-0 text-teal-500" />
                        <span className="text-xs truncate font-medium" title={complaint.location.address}>
                          {complaint.location.address || `${complaint.location.latitude.toFixed(4)}, ${complaint.location.longitude.toFixed(4)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[280px] flex-shrink-0">
                  {/* Committee Actions */}
                  {user?.role === 'mess_committee' && !['resolved', 'rejected'].includes(complaint.status) && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Update Status</label>
                      <Select
                        variant="compact"
                        truncateText={false}
                        value={complaint.status}
                        onChange={(e) => handleStatusUpdate(complaint._id, e.target.value)}
                        options={
                          complaint.status === 'pending'
                            ? [
                                { value: 'pending', label: '⏳ Pending' },
                                { value: 'assigned', label: '🔁 Assign to Vendor' },
                                { isHeader: true, label: '❌ Reject Reason:' },
                                { value: 'rejected:duplicate', label: '❌ Reject (Duplicate - 0)' },
                                { value: 'rejected:wrong_category', label: '❌ Reject (Wrong Category - -2)' },
                                { value: 'rejected:spam', label: '❌ Reject (Spam - -10)' },
                                { value: 'rejected:false_information', label: '❌ Reject (False Info - -15)' },
                                { value: 'rejected:inappropriate', label: '❌ Reject (Inappropriate - -10)' },
                              ]
                            : complaint.status === 'assigned'
                            ? [
                                { value: 'assigned', label: '🔁 Assigned to Vendor' },
                                { isHeader: true, label: '❌ Reject Reason:' },
                                { value: 'rejected:duplicate', label: '❌ Reject (Duplicate - 0)' },
                                { value: 'rejected:wrong_category', label: '❌ Reject (Wrong Category - -2)' },
                                { value: 'rejected:spam', label: '❌ Reject (Spam - -10)' },
                                { value: 'rejected:false_information', label: '❌ Reject (False Info - -15)' },
                                { value: 'rejected:inappropriate', label: '❌ Reject (Inappropriate - -10)' },
                              ]
                            : [
                                { value: 'vendor_completed', label: '🔍 Select Action...', disabled: true },
                                { value: 'assigned', label: '🔁 Re-assign to Vendor' },
                                { value: 'resolved', label: '✅ Resolve' },
                              ]
                        }
                      />
                      {complaint.status === 'vendor_completed' && (
                        <div className="space-y-2 mt-1">
                          <div className="text-[11px] text-center text-amber-700 bg-amber-50 rounded-xl px-2.5 py-1.5 font-bold border border-amber-200">
                            Vendor marked complete — awaiting review
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(complaint._id, 'assigned')}
                              className="flex-1 py-2 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                              title="Send back to vendor for rework"
                            >
                              <RefreshCw size={12} />
                              <span>Re-assign</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(complaint._id, 'resolved')}
                              className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                              title="Approve and mark resolved"
                            >
                              <CheckCircle size={12} />
                              <span>Resolve</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vendor Actions */}
                  {user?.role === 'vendor' && complaint.status === 'assigned' && (
                    <Button variant="vendor" onClick={() => handleVendorComplete(complaint._id)} className="text-xs">
                      Mark Completed
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200/60 flex-wrap">
          <p className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong className="text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredComplaints.length)}</strong> of <strong className="text-gray-900">{filteredComplaints.length}</strong> complaints
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  currentPage === pg
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Photo Viewer Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 p-2 text-white/70 bg-white/10 hover:bg-white/20 hover:text-white rounded-full transition-all duration-200"
            title="Close viewer"
          >
            <XCircle size={32} />
          </button>
          <div 
            className="relative w-full max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.title || "Evidence"} 
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            <div className="p-5 bg-gray-900/90 border-t border-white/10 text-white">
              <h4 className="text-lg font-bold mb-1">{selectedPhoto.title}</h4>
              <p className="text-sm text-gray-400 mb-2 break-words [overflow-wrap:anywhere]">{selectedPhoto.description}</p>
              {selectedPhoto.address && (
                <div className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-950/40 px-3 py-1.5 rounded-xl border border-teal-900/50 w-fit">
                  <MapPin size={12} className="text-teal-400" />
                  <span>{selectedPhoto.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsList;

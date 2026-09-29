import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import PhotoViewerModal from '../../components/common/PhotoViewerModal';
import { Bell, Plus, X, Trash2, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const getDefaultExpiryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
};

const getMinExpiryDate = () => {
  return new Date().toISOString().split('T')[0];
};

const NoticeBoard = () => {
  const { user } = useAuthStore();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [image, setImage] = useState(null);
  const [viewFilter, setViewFilter] = useState('active'); // 'active' or 'all'
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetRole: 'all',
    isActive: true,
    expiresAt: getDefaultExpiryDate()
  });

  const isPrivileged = ['mess_committee', 'college_admin', 'super_admin'].includes(user?.role);

  const filteredNotices = notices.filter(n => {
    if (audienceFilter === 'ALL') return true;
    return n.targetRole === audienceFilter;
  });

  const totalPages = Math.ceil(filteredNotices.length / ITEMS_PER_PAGE) || 1;
  const paginatedNotices = filteredNotices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const fetchNotices = async (filter = viewFilter) => {
    try {
      setLoading(true);
      const params = filter === 'all' && isPrivileged ? { includeExpired: 'true' } : {};
      const { data } = await api.get('/notices', { params });
      setNotices(data.data || data || []);
    } catch {
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices(viewFilter);
  }, [viewFilter]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetRole: 'all',
      isActive: true,
      expiresAt: getDefaultExpiryDate()
    });
    setImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    if (formData.expiresAt) {
      const expDate = new Date(formData.expiresAt);
      expDate.setHours(23, 59, 59, 999);
      if (expDate < new Date()) {
        toast.error('Expiration date cannot be in the past');
        setFormLoading(false);
        return;
      }
    }

    const payload = new FormData();
    payload.append('title', formData.title.trim());
    if (formData.description) payload.append('description', formData.description.trim());
    payload.append('targetRole', formData.targetRole);
    payload.append('isActive', formData.isActive.toString());
    if (formData.expiresAt) payload.append('expiresAt', formData.expiresAt);
    if (image) payload.append('image', image);

    try {
      const { data } = await api.post('/notices', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.status === 'success') {
        toast.success('Notice published successfully!');
        setNotices(prev => [data.data, ...prev]);
        setShowForm(false);
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create notice');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      setNotices(prev => prev.filter(n => n._id !== id));
      toast.success('Notice deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete notice');
    }
  };

  const targetRoleColor = {
    all: 'bg-gray-100 text-gray-700',
    user: 'bg-teal-100 text-teal-700',
    student: 'bg-teal-100 text-teal-700',
    vendor: 'bg-rose-100 text-rose-700',
    mess_committee: 'bg-amber-100 text-amber-700'
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-700 text-white shadow-[0_20px_50px_-12px_rgba(139,92,246,0.3)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Bell size={18} />
              </div>
              <span className="text-white/70 text-xs sm:text-sm font-bold uppercase tracking-widest">Announcements</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1">Notice Board</h1>
            <p className="text-white/70 text-sm sm:text-base font-medium">Stay updated with important institutional announcements</p>
          </div>
          {isPrivileged && (
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) resetForm();
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl sm:rounded-2xl text-white font-bold text-xs sm:text-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 self-start sm:self-auto shadow-sm"
            >
              {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New Notice</>}
            </button>
          )}
        </div>
      </div>



      {/* Create Notice Form */}
      {showForm && isPrivileged && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] animate-fade-in">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-6">New Announcement</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Title"
                required
                placeholder="e.g., Festival Feast Menu & Timings"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              <div>
                <Input
                  label="Expiration Date"
                  type="date"
                  min={getMinExpiryDate()}
                  value={formData.expiresAt}
                  onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                />
                <p className="text-[11px] text-gray-400 mt-1 font-medium flex items-center gap-1">
                  <Clock size={12} /> Notice will remain active until 11:59 PM on this date.
                </p>
              </div>
              <Select
                label="Target Audience"
                value={formData.targetRole}
                onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                options={[
                  { value: 'all', label: 'Everyone' },
                  { value: 'user', label: 'Students & Users' },
                  { value: 'vendor', label: 'Vendors' },
                  { value: 'mess_committee', label: 'Mess Committee' }
                ]}
              />
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Image Attachment (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImage(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea
                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/40"
                rows="4"
                placeholder="Write detailed announcements, schedule changes, or guidelines..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="committee" disabled={formLoading} className="w-full sm:w-auto">
                {formLoading ? 'Publishing...' : '→ Publish Notice'}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dropdown Filters Bar (Every Single Role) */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="w-full sm:w-64">
            <Select
              label="Filter by Target Audience"
              value={audienceFilter}
              onChange={(e) => { setAudienceFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { value: 'ALL', label: `All Audiences (${notices.length})` },
                { value: 'all', label: `General / Everyone (${notices.filter((n) => n.targetRole === 'all').length})` },
                { value: 'user', label: `Students (${notices.filter((n) => n.targetRole === 'user').length})` },
                { value: 'vendor', label: `Vendors (${notices.filter((n) => n.targetRole === 'vendor').length})` },
                { value: 'mess_committee', label: `Mess Committee (${notices.filter((n) => n.targetRole === 'mess_committee').length})` },
              ]}
            />
          </div>

          {isPrivileged && (
            <div className="w-full sm:w-64">
              <Select
                label="Filter by Expiry Status"
                value={viewFilter}
                onChange={(e) => { setViewFilter(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: 'active', label: 'Active Notices Only' },
                  { value: 'all', label: 'All Notices (Including Expired)' },
                ]}
              />
            </div>
          )}
        </div>

        {(audienceFilter !== 'ALL' || (isPrivileged && viewFilter !== 'active')) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">
              Showing <strong>{filteredNotices.length}</strong> of <strong>{notices.length}</strong> announcements
            </span>
            <button
              type="button"
              onClick={() => { setAudienceFilter('ALL'); setViewFilter('active'); setCurrentPage(1); }}
              className="text-xs font-bold text-violet-600 hover:text-violet-800 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="text-center p-16 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50">
          <div className="w-16 h-16 bg-violet-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Bell className="text-violet-400" size={28} />
          </div>
          <h3 className="font-bold text-gray-700 mb-1">No notices found</h3>
          <p className="text-gray-400 text-sm">
            {audienceFilter !== 'ALL'
              ? `No announcements specifically targeted for "${audienceFilter}".`
              : 'Important announcements with future validity will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedNotices.map(notice => {
            const expDate = notice.expiresAt ? new Date(notice.expiresAt) : null;
            const now = new Date();
            const isExpired = expDate ? expDate < now : false;
            const daysLeft = expDate ? Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)) : null;

            return (
              <div
                key={notice._id}
                className={`bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[1.5rem] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 ${
                  isExpired || !notice.isActive ? 'opacity-65' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-0">
                  {notice.image && (
                    <div
                      onClick={() => setSelectedPhoto({
                        url: `/uploads/${notice.image.split('\\').pop().split('/').pop()}`,
                        title: notice.title,
                        description: notice.content
                      })}
                      className="sm:w-48 flex-shrink-0 cursor-pointer group overflow-hidden bg-gray-900/5 relative"
                      title="Click to view full photo"
                    >
                      <img
                        src={`/uploads/${notice.image.split('\\').pop().split('/').pop()}`}
                        alt="Notice"
                        className="w-full h-48 sm:h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-gray-900 break-words [overflow-wrap:anywhere]">{notice.title}</h3>
                        <span
                          className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            targetRoleColor[notice.targetRole] || targetRoleColor.all
                          }`}
                        >
                          {notice.targetRole.toUpperCase()}
                        </span>
                        {!notice.isActive && (
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-500">
                            INACTIVE
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700">
                            EXPIRED
                          </span>
                        )}
                      </div>
                      {isPrivileged && (
                        <button
                          onClick={() => handleDelete(notice._id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                          title="Delete notice"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{notice.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400 font-medium">
                      {notice.createdBy?.name && (
                        <span className="text-gray-500">By <strong className="text-gray-700">{notice.createdBy.name}</strong></span>
                      )}
                      {expDate && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            isExpired
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : daysLeft <= 3
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Calendar size={13} className={isExpired ? 'text-rose-500' : 'text-emerald-500'} />
                          {isExpired
                            ? `Expired on ${expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : `Valid till ${expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${daysLeft}d left)`
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200/60 flex-wrap">
          <p className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong className="text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredNotices.length)}</strong> of <strong className="text-gray-900">{filteredNotices.length}</strong> announcements
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === pg
                    ? 'bg-violet-600 text-white shadow-sm'
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
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Photo Viewer Modal (Centered In-Viewport Popup) */}
      <PhotoViewerModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </div>
  );
};

export default NoticeBoard;

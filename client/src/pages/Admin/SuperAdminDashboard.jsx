import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ShieldCheck, School, UserCheck, CheckCircle, ArrowRight, Mail, Copy, RotateCcw, Trash2, BarChart3, AlertTriangle, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';

const SuperAdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    collegeCount: 0,
    totalAdminCount: 0,
    pendingInvitationCount: 0
  });

  const [colleges, setColleges] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [inviteForm, setInviteForm] = useState({ email: '', collegeId: '' });

  const [loading, setLoading] = useState(true);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [deletingInvitation, setDeletingInvitation] = useState(null);
  const [isDeletingInvitation, setIsDeletingInvitation] = useState(false);

  // Freeze background scrolling while modal is open
  useEffect(() => {
    if (!deletingInvitation) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeletingInvitation) {
        setDeletingInvitation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deletingInvitation, isDeletingInvitation]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch colleges
      const collegesRes = await api.get('/superadmin/colleges');
      const collegesList = collegesRes.data.data || [];
      setColleges(collegesList.filter(c => c.isActive));
      const activeCollegesCount = collegesList.filter(c => c.isActive).length;

      // Fetch all admins
      const allAdminsRes = await api.get('/superadmin/admins');
      const totalAdminsList = allAdminsRes.data.data || [];

      // Fetch invitations
      const invitationsRes = await api.get('/superadmin/admins/invitations');
      const invitationsList = invitationsRes.data.data || [];
      setInvitations(invitationsList);

      const pendingInvitesCount = invitationsList.filter(
        inv => !inv.isAccepted && new Date(inv.expiresAt) > new Date()
      ).length;

      setStats({
        collegeCount: activeCollegesCount,
        totalAdminCount: totalAdminsList.length,
        pendingInvitationCount: pendingInvitesCount
      });
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchDashboardData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, fetchDashboardData]);

  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    const email = inviteForm.email.trim();
    if (!email) {
      toast.error('Please enter an admin email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address (e.g. admin@college.edu)');
      return;
    }

    if (user?.email && email.toLowerCase() === user.email.toLowerCase()) {
      toast.error('You cannot send a college admin invitation to yourself');
      return;
    }

    if (!inviteForm.collegeId) {
      toast.error('Please select a college portal');
      return;
    }

    setSubmittingInvite(true);
    try {
      const { data } = await api.post(`/superadmin/colleges/${inviteForm.collegeId}/assign-admin`, {
        email
      });
      toast.success(data.message || 'Administrator assigned / invited successfully!');
      setInviteForm({ email: '', collegeId: '' });
      await fetchDashboardData();
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = 'Failed to send invitation / assign admin';
      if (typeof errorData?.message === 'string' && errorData.message) {
        errorMsg = errorData.message;
      } else if (Array.isArray(errorData?.errors)) {
        errorMsg = errorData.errors.map(e => e.message || JSON.stringify(e)).join(', ');
      }
      toast.error(errorMsg);
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleResendInvite = async (email, collegeId) => {
    if (user?.email && email?.toLowerCase() === user.email.toLowerCase()) {
      toast.error('You cannot send a college admin invitation to yourself');
      return;
    }
    try {
      await api.post('/superadmin/admins/invite', { email, collegeId });
      toast.success('Invitation resent successfully!');
      await fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleCopyLink = (token) => {
    const inviteLink = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invitation link copied to clipboard!');
  };

  const confirmDeleteInvitation = async () => {
    if (!deletingInvitation) return;
    setIsDeletingInvitation(true);
    try {
      await api.delete(`/superadmin/admins/invitations/${deletingInvitation.id}`);
      toast.success('Invitation revoked successfully');
      setDeletingInvitation(null);
      await fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke invitation');
    } finally {
      setIsDeletingInvitation(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 text-white shadow-[0_8px_30px_rgba(109,40,217,0.25)] group">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Super Administrator,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-100 to-white">{user?.name}</span>
          </h1>
          <p className="text-violet-100 font-medium mt-3 max-w-md text-sm sm:text-base">Configure active colleges, invite new administrators, and monitor portal setups.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <NavLink to="/colleges" className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/90 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Colleges</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-gray-900 group-hover:text-violet-600 transition-colors">{stats.collegeCount}</h3>
              <span className="text-xs text-gray-500 font-medium">registered</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-50 flex items-center justify-center text-violet-500 shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
            <School size={22} strokeWidth={2.5} />
          </div>
        </NavLink>

        <NavLink to="/analytics" className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/90 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Platform Analytics</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors">Cross-Campus</h3>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              View Insights <ArrowRight size={12} />
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
            <BarChart3 size={22} strokeWidth={2.5} />
          </div>
        </NavLink>

        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active College Admins</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-gray-900">{stats.totalAdminCount}</h3>
              <span className="text-sm text-gray-500 font-medium">active</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-50 flex items-center justify-center text-emerald-600 shadow-inner flex-shrink-0">
            <UserCheck size={22} strokeWidth={2.5} />
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Invitations</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-amber-600">{stats.pendingInvitationCount}</h3>
              <span className="text-sm text-gray-500 font-medium">awaiting signup</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center text-amber-500 shadow-inner flex-shrink-0">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Invite College Admin */}
        <div className="lg:col-span-1 glass-panel p-4 sm:p-6 border border-white/40 shadow-xl rounded-2xl h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-violet-100 text-violet-700 rounded-xl">
              <Mail size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Invite College Admin</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6 font-medium">Send a secure, tokenized registration email to invite a new administrator.</p>
          
          <form onSubmit={handleInviteAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Dean/Admin Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all font-medium"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>

            <Select
              label="Select College Portal"
              required
              value={inviteForm.collegeId}
              placeholder="Choose College..."
              onChange={(e) => setInviteForm({ ...inviteForm, collegeId: e.target.value })}
              options={[
                { value: '', label: 'Choose College...' },
                ...colleges.map((c) => ({ value: c._id, label: c.name }))
              ]}
            />

            <Button
              type="submit"
              disabled={submittingInvite || colleges.length === 0}
              className="w-full mt-2 bg-violet-600 hover:bg-violet-700 flex items-center justify-center gap-2"
            >
              {submittingInvite ? 'Sending Invitation...' : 'Send Invitation Link'}
            </Button>
            
            {colleges.length === 0 && (
              <p className="text-xs text-amber-600 font-bold mt-2">
                * Note: Please create or activate a college portal first.
              </p>
            )}
          </form>
        </div>

        {/* Right Column: Sent Invitations Tracker */}
        <div className="lg:col-span-2 glass-panel overflow-hidden border border-white/40 shadow-xl rounded-2xl flex flex-col">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/30">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sent Invitations Tracker</h2>
              <p className="text-xs text-gray-500 font-medium">Verify delivery, copy token links, or resend invitations.</p>
            </div>
            <NavLink to="/colleges" className="text-sm font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
              Manage Colleges <ArrowRight size={14} />
            </NavLink>
          </div>

          <div className="overflow-x-auto flex-grow responsive-table-wrapper">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[40%]">Admin Email</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[25%]">College Portal</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[15%]">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[20%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500 font-medium">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                        Loading invitation records...
                      </div>
                    </td>
                  </tr>
                ) : invitations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-400 font-medium">
                      No invitations generated yet.
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => {
                    const isExpired = new Date(inv.expiresAt) < new Date();
                    let statusBadge = (
                      <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    );
                    if (inv.isAccepted) {
                      statusBadge = (
                        <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-green-50 text-green-700 border border-green-200">
                          Accepted
                        </span>
                      );
                    } else if (isExpired) {
                      statusBadge = (
                        <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
                          Expired
                        </span>
                      );
                    }

                    return (
                      <tr key={inv._id} className="hover:bg-white/40 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-900 text-sm truncate max-w-[220px]" title={inv.email}>
                            {inv.email}
                          </p>
                          <p className="text-xs text-gray-400 font-semibold">
                            Expires: {new Date(inv.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-gray-900 text-sm">{inv.collegeId?.name || 'N/A'}</p>
                        </td>
                        <td className="p-4">
                          {statusBadge}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!inv.isAccepted && (
                              <React.Fragment>
                                <button
                                  onClick={() => handleCopyLink(inv.token)}
                                  title="Copy Invite Link"
                                  className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors border border-transparent hover:border-violet-100"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  onClick={() => handleResendInvite(inv.email, inv.collegeId?._id)}
                                  title="Resend Invite"
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                >
                                  <RotateCcw size={16} />
                                </button>
                              </React.Fragment>
                            )}
                            {inv.isAccepted && (
                              <span className="text-xs text-emerald-600 font-bold inline-flex items-center gap-0.5 pr-2">
                                <CheckCircle size={14} /> Completed
                              </span>
                            )}
                            <button
                              onClick={() => setDeletingInvitation({
                                id: inv._id,
                                email: inv.email,
                                collegeName: inv.collegeId?.name
                              })}
                              title="Revoke Invitation"
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete / Revoke Invitation Confirmation Modal */}
      {deletingInvitation && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
          }}
          onClick={() => {
            if (!isDeletingInvitation) setDeletingInvitation(null);
          }}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border border-rose-100 relative max-h-[90vh] overflow-y-auto animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Revoke Invitation</h3>
                  <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">Confirmation Required</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingInvitation(null)}
                disabled={isDeletingInvitation}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none p-1 rounded-lg hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to revoke the administrator invitation for:
              </p>
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <p className="font-bold text-gray-900 text-sm break-all">{deletingInvitation.email}</p>
                {deletingInvitation.collegeName && (
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    College Portal: <span className="font-semibold text-gray-700">{deletingInvitation.collegeName}</span>
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium">
                The invitation link will immediately become invalid and can no longer be used to register.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeletingInvitation(null)}
                disabled={isDeletingInvitation}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteInvitation}
                disabled={isDeletingInvitation}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                {isDeletingInvitation ? 'Revoking...' : 'Yes, Revoke Invitation'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SuperAdminDashboard;

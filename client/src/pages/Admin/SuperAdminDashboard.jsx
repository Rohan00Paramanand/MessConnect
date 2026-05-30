import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ShieldCheck, School, UserCheck, CheckCircle, ArrowRight, Lock, Mail, Copy, RotateCcw } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import Button from '../../components/ui/Button';

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

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch colleges
      const collegesRes = await api.get('/api/superadmin/colleges');
      const collegesList = collegesRes.data.data || [];
      setColleges(collegesList.filter(c => c.isActive));
      const activeCollegesCount = collegesList.filter(c => c.isActive).length;

      // Fetch all admins
      const allAdminsRes = await api.get('/api/superadmin/admins');
      const totalAdminsList = allAdminsRes.data.data || [];

      // Fetch invitations
      const invitationsRes = await api.get('/api/superadmin/admins/invitations');
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
    if (!inviteForm.email || !inviteForm.collegeId) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmittingInvite(true);
    try {
      await api.post('/api/superadmin/admins/invite', {
        email: inviteForm.email,
        collegeId: inviteForm.collegeId
      });
      toast.success('Invitation sent successfully!');
      setInviteForm({ email: '', collegeId: '' });
      await fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleResendInvite = async (email, collegeId) => {
    try {
      await api.post('/api/superadmin/admins/invite', { email, collegeId });
      toast.success('Invitation resent successfully!');
      await fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleCopyLink = (token) => {
    const inviteLink = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invitation link copied!');
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 text-white shadow-[0_8px_30px_rgba(109,40,217,0.25)] group">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase mb-3 border border-white/20">
            <Lock size={12} /> Root Controller Plane
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Super Administrator,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-100 to-white">{user?.name}</span>
          </h1>
          <p className="text-violet-100 font-medium mt-3 max-w-md text-sm sm:text-base">Configure active colleges, invite new administrators, and monitor portal setups.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NavLink to="/colleges" className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/90 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Colleges</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-gray-900 group-hover:text-violet-600 transition-colors">{stats.collegeCount}</h3>
              <span className="text-sm text-gray-500 font-medium">registered</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-50 flex items-center justify-center text-violet-500 shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
            <School size={22} strokeWidth={2.5} />
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
        <div className="lg:col-span-1 glass-panel p-6 border border-white/40 shadow-xl rounded-2xl h-fit">
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
                placeholder="dean@university.edu"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all font-medium"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Select College Portal</label>
              <select
                required
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all font-medium"
                value={inviteForm.collegeId}
                onChange={(e) => setInviteForm({ ...inviteForm, collegeId: e.target.value })}
              >
                <option value="">Choose College...</option>
                {colleges.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

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
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/30">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sent Invitations Tracker</h2>
              <p className="text-xs text-gray-500 font-medium">Verify delivery, copy token links, or resend invitations.</p>
            </div>
            <NavLink to="/colleges" className="text-sm font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
              Manage Colleges <ArrowRight size={14} />
            </NavLink>
          </div>

          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
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
                          <p className="text-xs text-gray-400 font-semibold">Slug: {inv.collegeId?.slug || 'N/A'}</p>
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
    </div>
  );
};

export default SuperAdminDashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  FileText,
  UserCheck,
  Users,
  User,
  Building2,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  Search,
  Phone,
  Mail,
  DollarSign,
  Store,
  X,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import VendorDocumentsDropdown from '../../components/vendor/VendorDocumentsDropdown';

const UserApprovals = () => {
  // Main Tab: 'pending' | 'approved_users' | 'approved_staff'
  const [mainTab, setMainTab] = useState('pending');
  // Pending Sub-tab: 'accounts' | 'staff'
  const [pendingSubTab, setPendingSubTab] = useState('accounts');

  // Data states
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [approvedStaff, setApprovedStaff] = useState([]);
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [messFilter, setMessFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Pending Deny User Modal
  const [denyingUser, setDenyingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [denying, setDenying] = useState(false);

  // Edit Approved User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    messAssigned: ''
  });
  const [savingUser, setSavingUser] = useState(false);

  // Delete User Danger Modal
  const [deletingUser, setDeletingUser] = useState(null);
  const [deletingUserLoading, setDeletingUserLoading] = useState(false);

  // Edit Approved Staff Modal
  const [editingStaff, setEditingStaff] = useState(null);
  const [editStaffData, setEditStaffData] = useState({
    name: '',
    phoneNumber: '',
    role: 'Cook',
    salary: '',
    mess: ''
  });
  const [savingStaff, setSavingStaff] = useState(false);

  // Delete Staff Danger Modal
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [deletingStaffLoading, setDeletingStaffLoading] = useState(false);

  // Freeze background scrolling when any popup modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(denyingUser || editingUser || deletingUser || editingStaff || deletingStaff);
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (editingUser && !savingUser) setEditingUser(null);
        if (deletingUser && !deletingUserLoading) setDeletingUser(null);
        if (denyingUser && !denying) setDenyingUser(null);
        if (editingStaff && !savingStaff) setEditingStaff(null);
        if (deletingStaff && !deletingStaffLoading) setDeletingStaff(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [denyingUser, editingUser, deletingUser, editingStaff, deletingStaff, savingUser, deletingUserLoading, denying, savingStaff, deletingStaffLoading]);

  // Fetch messes for dropdowns
  useEffect(() => {
    api.get('/messes')
      .then(({ data }) => setMesses(data.data || []))
      .catch(err => console.error('Failed to load messes', err));
  }, []);

  // Fetch all pending requests
  const fetchPending = useCallback(async () => {
    try {
      const [userRes, staffRes] = await Promise.all([
        api.get('/admin/pending-users'),
        api.get('/admin/pending-staff')
      ]);
      setPendingUsers(userRes.data.data || []);
      setPendingStaff(staffRes.data.data || []);
    } catch {
      toast.error('Failed to fetch pending approval requests');
    }
  }, []);

  // Fetch approved vendors, committee, and staff
  const fetchApproved = useCallback(async () => {
    try {
      const [usersRes, staffRes] = await Promise.all([
        api.get('/admin/approved-users'),
        api.get('/admin/approved-staff')
      ]);
      setApprovedUsers(usersRes.data.data || []);
      setApprovedStaff(staffRes.data.data || []);
    } catch {
      console.warn('Failed to fetch approved members');
    }
  }, []);

  // Initial data loading
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPending(), fetchApproved()]);
    setLoading(false);
  }, [fetchPending, fetchApproved]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Approve Pending User
  const handleApproveUser = async (id) => {
    try {
      const { data } = await api.patch(`/admin/approve-user/${id}`);
      toast.success('User approved successfully!');
      setPendingUsers(prev => prev.filter(u => u._id !== id));
      if (data?.data) {
        setApprovedUsers(prev => [data.data, ...prev]);
      } else {
        fetchApproved();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve user');
    }
  };

  // Approve Pending Staff
  const handleApproveStaff = async (id) => {
    try {
      const { data } = await api.patch(`/admin/approve-staff/${id}`);
      toast.success('Staff member approved!');
      setPendingStaff(prev => prev.filter(s => s._id !== id));
      if (data?.data) {
        setApprovedStaff(prev => [data.data, ...prev]);
      } else {
        fetchApproved();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve staff member');
    }
  };

  // Deny Pending Staff
  const handleDenyStaff = async (id) => {
    if (!window.confirm('Reject and remove this staff member request?')) return;
    try {
      await api.delete(`/admin/deny-staff/${id}`);
      toast.success('Staff member request denied and removed');
      setPendingStaff(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deny staff member');
    }
  };

  // Deny Pending User
  const handleDenyUser = async () => {
    if (!denyingUser) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setDenying(true);
    try {
      await api.post(`/admin/deny-user/${denyingUser._id}`, { reason: rejectionReason });
      toast.success('User registration request denied');
      setPendingUsers(prev => prev.filter(u => u._id !== denyingUser._id));
      setDenyingUser(null);
      setRejectionReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deny user');
    } finally {
      setDenying(false);
    }
  };

  // Open Edit User Modal
  const openEditUser = (user) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      companyName: user.companyName || '',
      messAssigned: user.messAssigned?._id || user.messAssigned || ''
    });
  };

  // Save Edit User
  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editUserData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editUserData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setSavingUser(true);
    try {
      const { data } = await api.patch(`/admin/users/${editingUser._id}`, editUserData);
      toast.success('User updated successfully!');
      setApprovedUsers(prev =>
        prev.map(u => (u._id === editingUser._id ? data.data : u))
      );
      setEditingUser(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingUser(false);
    }
  };

  // Confirm Delete User (Cascade)
  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setDeletingUserLoading(true);
    try {
      const { data } = await api.delete(`/admin/users/${deletingUser._id}`);
      toast.success(data.message || 'User and all related data deleted successfully');
      setApprovedUsers(prev => prev.filter(u => u._id !== deletingUser._id));
      // Also refresh approved staff in case vendor's staff was cascaded
      if (deletingUser.role === 'vendor') {
        fetchApproved();
      }
      setDeletingUser(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingUserLoading(false);
    }
  };

  // Open Edit Staff Modal
  const openEditStaff = (member) => {
    setEditingStaff(member);
    setEditStaffData({
      name: member.name || '',
      phoneNumber: member.phoneNumber || '',
      role: member.role || 'Cook',
      salary: member.salary || '',
      mess: member.mess?._id || member.mess || ''
    });
  };

  // Save Edit Staff
  const handleSaveEditStaff = async (e) => {
    e.preventDefault();
    if (!editStaffData.name.trim()) {
      toast.error('Staff name is required');
      return;
    }
    const cleanPhone = editStaffData.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Staff phone number must be 10 digits');
      return;
    }

    setSavingStaff(true);
    try {
      const { data } = await api.patch(`/admin/staff/${editingStaff._id}`, {
        ...editStaffData,
        phoneNumber: cleanPhone
      });
      toast.success('Staff member updated successfully!');
      setApprovedStaff(prev =>
        prev.map(s => (s._id === editingStaff._id ? data.data : s))
      );
      setEditingStaff(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update staff');
    } finally {
      setSavingStaff(false);
    }
  };

  // Confirm Delete Staff
  const handleConfirmDeleteStaff = async () => {
    if (!deletingStaff) return;
    setDeletingStaffLoading(true);
    try {
      const { data } = await api.delete(`/admin/staff/${deletingStaff._id}`);
      toast.success(data.message || 'Staff member deleted successfully');
      setApprovedStaff(prev => prev.filter(s => s._id !== deletingStaff._id));
      setDeletingStaff(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete staff member');
    } finally {
      setDeletingStaffLoading(false);
    }
  };

  // Filtered Approved Users
  const filteredApprovedUsers = approvedUsers.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (messFilter) {
      const mId = u.messAssigned?._id || u.messAssigned;
      if (mId !== messFilter) return false;
    }
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const nameMatch = u.name?.toLowerCase().includes(query);
      const emailMatch = u.email?.toLowerCase().includes(query);
      const phoneMatch = u.phoneNumber?.includes(query);
      const companyMatch = u.companyName?.toLowerCase().includes(query);
      const messMatch = u.messAssigned?.name?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch && !phoneMatch && !companyMatch && !messMatch) {
        return false;
      }
    }
    return true;
  });

  // Filtered Approved Staff
  const filteredApprovedStaff = approvedStaff.filter(s => {
    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
    if (messFilter) {
      const mId = s.mess?._id || s.mess;
      if (mId !== messFilter) return false;
    }
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const nameMatch = s.name?.toLowerCase().includes(query);
      const phoneMatch = s.phoneNumber?.includes(query);
      const vendorMatch = (s.vendor?.companyName || s.vendor?.name)?.toLowerCase().includes(query);
      const messMatch = s.mess?.name?.toLowerCase().includes(query);
      if (!nameMatch && !phoneMatch && !vendorMatch && !messMatch) {
        return false;
      }
    }
    return true;
  });

  // Filtered Pending Staff
  const filteredPendingStaff = pendingStaff.filter(member => {
    if (!messFilter) return true;
    const messId = member.mess?._id || member.mess;
    return messId === messFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200/60 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={13} /> College Admin Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            User & Staff Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Audit verification queues, edit credentials, or delete approved vendors, committee members, and mess staff.
          </p>
        </div>

        <button
          onClick={refreshAllData}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Main Navigation Segment Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80">
        <button
          onClick={() => {
            setMainTab('pending');
            setSearchTerm('');
            setRoleFilter('ALL');
            setMessFilter('');
          }}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === 'pending'
              ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Pending Approvals</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800">
            {pendingUsers.length + pendingStaff.length}
          </span>
        </button>

        <button
          onClick={() => {
            setMainTab('approved_users');
            setSearchTerm('');
            setRoleFilter('ALL');
            setMessFilter('');
          }}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === 'approved_users'
              ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck size={16} />
            <span>Vendors & Committee</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800">
            {approvedUsers.length}
          </span>
        </button>

        <button
          onClick={() => {
            setMainTab('approved_staff');
            setSearchTerm('');
            setRoleFilter('ALL');
            setMessFilter('');
          }}
          className={`flex items-center justify-between sm:justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === 'approved_staff'
              ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>Approved Staff</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-teal-100 text-teal-800">
            {approvedStaff.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PENDING APPROVALS QUEUE                                 */}
      {/* ============================================================== */}
      {mainTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-fit">
              <button
                onClick={() => setPendingSubTab('accounts')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pendingSubTab === 'accounts' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <UserCheck size={14} /> Vendors & Committee ({pendingUsers.length})
              </button>
              <button
                onClick={() => setPendingSubTab('staff')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pendingSubTab === 'staff' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Users size={14} /> Mess Staff Members ({pendingStaff.length})
              </button>
            </div>

            {pendingSubTab === 'staff' && (
              <Select
                variant="compact"
                icon={Building2}
                value={messFilter}
                onChange={(e) => setMessFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Messes' },
                  ...messes.map((m) => ({ value: m._id, label: m.name })),
                ]}
                className="w-full sm:w-auto min-w-[160px]"
              />
            )}
          </div>

          {/* Pending Sub-tab: Accounts */}
          {pendingSubTab === 'accounts' && (
            <div className="glass-panel overflow-hidden border border-white/40 shadow-xl shadow-gray-200/40 rounded-2xl bg-white/70">
              {/* Mobile Card View (block md:hidden) */}
              <div className="block md:hidden divide-y divide-gray-100">
                {loading ? (
                  <div className="p-6 text-center text-gray-500 font-medium">Loading pending requests...</div>
                ) : pendingUsers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 font-medium text-xs">No pending vendor or committee requests. All caught up!</div>
                ) : (
                  pendingUsers.map((user) => (
                    <div key={user._id} className="p-4 space-y-3 hover:bg-white/80 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{user.name}</p>
                          {user.companyName && (
                            <p className="text-xs font-bold text-teal-700 mt-0.5 inline-flex items-center gap-1">
                              <Store size={12} className="shrink-0" /> {user.companyName}
                            </p>
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider shrink-0 ${
                          user.role === 'vendor' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500">
                        <p className="truncate">{user.email} • {user.phoneNumber}</p>
                        {user.role === 'mess_committee' ? (
                          <p className="text-indigo-700 font-semibold inline-flex items-center gap-1">
                            <Building2 size={12} /> All College Messes (Overseer)
                          </p>
                        ) : user.messAssigned?.name ? (
                          <p className="text-gray-700 font-semibold">Mess: {user.messAssigned.name}</p>
                        ) : (
                          <p className="text-gray-400 italic">Mess: Unassigned</p>
                        )}
                      </div>

                      {user.role === 'vendor' && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Documents</p>
                          <VendorDocumentsDropdown documents={user.vendorDocuments} vendorName={user.name} />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                        <Button onClick={() => handleApproveUser(user._id)} variant="primary" className="w-full text-xs py-2 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center">
                          <CheckCircle size={14} className="mr-1 inline" /> Approve
                        </Button>
                        <Button onClick={() => setDenyingUser(user)} variant="danger" className="w-full text-xs py-2 flex items-center justify-center">
                          <XCircle size={14} className="mr-1 inline" /> Deny
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto responsive-table-wrapper">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant Details</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Mess</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Compliance Documents</th>
                      <th className="p-4 pr-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">Loading pending requests...</td></tr>
                    ) : pendingUsers.length === 0 ? (
                      <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">No pending vendor or committee requests. All caught up!</td></tr>
                    ) : (
                      pendingUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-white/80 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email} • {user.phoneNumber}</p>
                            {user.companyName && (
                              <p className="text-xs font-bold text-teal-700 mt-0.5 inline-flex items-center gap-1">
                                <Store size={12} /> {user.companyName}
                              </p>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full uppercase tracking-wider ${
                              user.role === 'vendor' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {user.role.replace('_', ' ')}
                            </span>
                            {user.role === 'mess_committee' ? (
                              <p className="text-xs text-indigo-700 font-bold mt-1 inline-flex items-center gap-1">
                                <Building2 size={11} /> All College Messes
                              </p>
                            ) : user.messAssigned?.name ? (
                              <p className="text-xs text-gray-600 font-semibold mt-1">Mess: {user.messAssigned.name}</p>
                            ) : (
                              <p className="text-xs text-gray-400 italic mt-1">Mess: Unassigned</p>
                            )}
                          </td>
                          <td className="p-4">
                            {user.role === 'vendor' ? (
                              <VendorDocumentsDropdown documents={user.vendorDocuments} vendorName={user.name} />
                            ) : (
                              <span className="text-xs text-gray-400 font-medium italic">N/A</span>
                            )}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex justify-end gap-2">
                              <Button onClick={() => handleApproveUser(user._id)} variant="primary" className="text-xs bg-indigo-600 hover:bg-indigo-700">
                                <CheckCircle size={14} className="mr-1 inline" /> Approve
                              </Button>
                              <Button onClick={() => setDenyingUser(user)} variant="danger" className="text-xs">
                                <XCircle size={14} className="mr-1 inline" /> Deny
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Sub-tab: Staff */}
          {pendingSubTab === 'staff' && (
            <div className="glass-panel overflow-hidden border border-white/40 shadow-xl shadow-gray-200/40 rounded-2xl bg-white/70">
              {/* Mobile Card View (block md:hidden) */}
              <div className="block md:hidden divide-y divide-gray-100">
                {loading ? (
                  <div className="p-6 text-center text-gray-500 font-medium">Loading staff verification queue...</div>
                ) : filteredPendingStaff.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 font-medium text-xs">No pending staff members found for the selected mess.</div>
                ) : (
                  filteredPendingStaff.map((member) => (
                    <div key={member._id} className="p-4 space-y-3 hover:bg-white/80 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.phoneNumber}</p>
                        </div>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-gray-100 text-gray-800 shrink-0">
                          {member.role}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500">
                        <p className="text-gray-800 font-medium">Vendor: <strong>{member.vendor?.companyName || member.vendor?.name}</strong></p>
                        <p className="text-gray-600">Mess: <strong>{member.mess?.name || 'N/A'}</strong></p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase">Documents:</span>
                        <VendorDocumentsDropdown documents={member.documents} vendorName={member.name} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                        <Button onClick={() => handleApproveStaff(member._id)} variant="primary" className="w-full text-xs py-2 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center">
                          <CheckCircle size={14} className="mr-1 inline" /> Approve Staff
                        </Button>
                        <Button onClick={() => handleDenyStaff(member._id)} variant="danger" className="w-full text-xs py-2 flex items-center justify-center">
                          <XCircle size={14} className="mr-1 inline" /> Deny
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto responsive-table-wrapper">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor & Mess</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Verification Documents</th>
                      <th className="p-4 pr-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">Loading staff verification queue...</td></tr>
                    ) : filteredPendingStaff.length === 0 ? (
                      <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">No pending staff members found for the selected mess.</td></tr>
                    ) : (
                      filteredPendingStaff.map((member) => (
                        <tr key={member._id} className="hover:bg-white/80 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.phoneNumber} • Role: <strong className="text-gray-700">{member.role}</strong></p>
                          </td>
                          <td className="p-4">
                            <p className="text-xs font-bold text-gray-900">{member.vendor?.companyName || member.vendor?.name}</p>
                            <p className="text-xs text-gray-500 font-medium">Mess: {member.mess?.name || 'N/A'}</p>
                          </td>
                          <td className="p-4">
                            <VendorDocumentsDropdown documents={member.documents} vendorName={member.name} />
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex justify-end gap-2">
                              <Button onClick={() => handleApproveStaff(member._id)} variant="primary" className="text-xs bg-indigo-600 hover:bg-indigo-700">
                                <CheckCircle size={14} className="mr-1 inline" /> Approve Staff
                              </Button>
                              <Button onClick={() => handleDenyStaff(member._id)} variant="danger" className="text-xs">
                                <XCircle size={14} className="mr-1 inline" /> Deny
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: APPROVED VENDORS & COMMITTEE MEMBERS                    */}
      {/* ============================================================== */}
      {mainTab === 'approved_users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendor name, email, phone, company, or mess..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
              <Select
                variant="compact"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Roles' },
                  { value: 'vendor', label: 'Vendor Only' },
                  { value: 'mess_committee', label: 'Mess Committee Only' },
                ]}
              />

              <Select
                variant="compact"
                value={messFilter}
                onChange={(e) => setMessFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Messes' },
                  ...messes.map(m => ({ value: m._id, label: m.name })),
                ]}
              />
            </div>
          </div>

          {/* Approved Users List */}
          <div className="glass-panel overflow-hidden border border-white/40 shadow-xl shadow-gray-200/40 rounded-2xl bg-white/80">
            {/* Mobile Card View (block md:hidden) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {loading ? (
                <div className="p-6 text-center text-gray-500 font-medium">Loading approved members...</div>
              ) : filteredApprovedUsers.length === 0 ? (
                <div className="p-6 text-center text-gray-500 font-medium text-xs">No approved vendors or committee members found matching criteria.</div>
              ) : (
                filteredApprovedUsers.map((u) => (
                  <div key={u._id} className="p-4 space-y-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{u.name}</p>
                        {u.companyName && (
                          <p className="text-xs font-extrabold text-teal-700 mt-0.5 inline-flex items-center gap-1">
                            <Store size={12} className="shrink-0" /> {u.companyName}
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0 ${
                        u.role === 'vendor' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex flex-col text-xs text-gray-500 space-y-1">
                      <span className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400 shrink-0" /> <span className="truncate">{u.email}</span></span>
                      <span className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400 shrink-0" /> {u.phoneNumber}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {u.role === 'mess_committee' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 truncate">
                            <Building2 size={12} className="text-indigo-500 shrink-0" />
                            All Messes (Overseer)
                          </span>
                        ) : (
                          <>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase">Mess:</span>
                            {u.messAssigned?.name ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 truncate">
                                <Building2 size={12} className="text-gray-500 shrink-0" />
                                {u.messAssigned.name}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium italic">Unassigned</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={12} /> Approved
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                          by <strong className="text-gray-600 font-semibold">{u.approvedBy?.name || 'College Admin'}</strong>
                        </span>
                      </div>
                    </div>

                    {u.role === 'vendor' && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase">Documents:</span>
                        <VendorDocumentsDropdown documents={u.vendorDocuments} vendorName={u.name} />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => openEditUser(u)}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200/60 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Edit user details"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingUser(u)}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200/60 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Delete user & all related data"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto responsive-table-wrapper">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Details</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Authority</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Mess</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Documents</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status & Approver</th>
                    <th className="p-4 pr-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-500 font-medium">Loading approved members...</td></tr>
                  ) : filteredApprovedUsers.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-500 font-medium">No approved vendors or committee members found matching criteria.</td></tr>
                  ) : (
                    filteredApprovedUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                          <div className="flex flex-col text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1.5"><Mail size={11} /> {u.email}</span>
                            <span className="flex items-center gap-1.5"><Phone size={11} /> {u.phoneNumber}</span>
                          </div>
                          {u.companyName && (
                            <p className="text-xs font-extrabold text-teal-700 mt-1 inline-flex items-center gap-1">
                              <Store size={12} /> {u.companyName}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-[11px] font-black rounded-full uppercase tracking-wider ${
                            u.role === 'vendor' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          {u.role === 'mess_committee' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700">
                              <Building2 size={13} className="text-indigo-500" />
                              All Messes (Overseer)
                            </span>
                          ) : u.messAssigned?.name ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-700">
                              <Building2 size={13} className="text-gray-500" />
                              {u.messAssigned.name}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4">
                          {u.role === 'vendor' ? (
                            <VendorDocumentsDropdown documents={u.vendorDocuments} vendorName={u.name} />
                          ) : (
                            <span className="text-xs text-gray-400 font-medium italic">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                          <p className="text-[11px] text-gray-500 font-medium mt-1 leading-tight">
                            by <strong className="text-gray-700 font-semibold">{u.approvedBy?.name || 'College Admin'}</strong>
                          </p>
                          {u.approvedAt && (
                            <p className="text-[10px] text-gray-400 font-medium">
                              {new Date(u.approvedAt).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditUser(u)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200/60 inline-flex items-center gap-1.5 cursor-pointer"
                              title="Edit user details"
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200/60 inline-flex items-center gap-1.5 cursor-pointer"
                              title="Delete user & all related data"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: APPROVED STAFF MEMBERS DIRECTORY                        */}
      {/* ============================================================== */}
      {mainTab === 'approved_staff' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff name, phone number, vendor, or mess..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
              <Select
                variant="compact"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Roles' },
                  { value: 'Cook', label: 'Cook' },
                  { value: 'Cleaner', label: 'Cleaner' },
                  { value: 'Cashier', label: 'Cashier' },
                  { value: 'Manager', label: 'Manager' },
                ]}
              />

              <Select
                variant="compact"
                value={messFilter}
                onChange={(e) => setMessFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Messes' },
                  ...messes.map(m => ({ value: m._id, label: m.name })),
                ]}
              />
            </div>
          </div>

          {/* Approved Staff List */}
          <div className="glass-panel overflow-hidden border border-white/40 shadow-xl shadow-gray-200/40 rounded-2xl bg-white/80">
            {/* Mobile Card View (block md:hidden) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {loading ? (
                <div className="p-6 text-center text-gray-500 font-medium">Loading approved staff...</div>
              ) : filteredApprovedStaff.length === 0 ? (
                <div className="p-6 text-center text-gray-500 font-medium text-xs">No approved staff members found matching criteria.</div>
              ) : (
                filteredApprovedStaff.map((s) => (
                  <div key={s._id} className="p-4 space-y-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-gray-400" /> {s.phoneNumber}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-gray-100 text-gray-800 shrink-0">
                        {s.role}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-1">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase">Mess & Vendor</p>
                        <p className="font-bold text-gray-900 truncate">{s.mess?.name || 'N/A'}</p>
                        <p className="text-[11px] text-gray-500 truncate">{s.vendor?.companyName || s.vendor?.name || 'Assigned'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase">Monthly Salary</p>
                        {s.salary ? (
                          <p className="text-xs text-emerald-700 font-bold">₹{Number(s.salary).toLocaleString('en-IN')}/mo</p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Not set</p>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-1">
                          <CheckCircle2 size={11} /> Approved
                        </span>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                          by <strong className="text-gray-600 font-semibold">{s.approvedBy?.name || 'College Admin'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase">Documents:</span>
                      <VendorDocumentsDropdown documents={s.documents} vendorName={s.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => openEditStaff(s)}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200/60 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Edit staff details"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingStaff(s)}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200/60 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Delete staff member"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto responsive-table-wrapper">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Salary</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mess & Vendor</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Documents</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status & Approver</th>
                    <th className="p-4 pr-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-500 font-medium">Loading approved staff...</td></tr>
                  ) : filteredApprovedStaff.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-500 font-medium">No approved staff members found matching criteria.</td></tr>
                  ) : (
                    filteredApprovedStaff.map((s) => (
                      <tr key={s._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {s.phoneNumber}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-100 text-gray-800">
                            {s.role}
                          </span>
                          {s.salary ? (
                            <p className="text-xs text-emerald-700 font-bold mt-1">₹{Number(s.salary).toLocaleString('en-IN')}/mo</p>
                          ) : (
                            <p className="text-xs text-gray-400 font-medium mt-1">Salary not set</p>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            <Building2 size={12} className="text-gray-400" />
                            {s.mess?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Vendor: <strong className="text-gray-700">{s.vendor?.companyName || s.vendor?.name || 'Assigned'}</strong>
                          </p>
                        </td>
                        <td className="p-4">
                          <VendorDocumentsDropdown documents={s.documents} vendorName={s.name} />
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                          <p className="text-[11px] text-gray-500 font-medium mt-1 leading-tight">
                            by <strong className="text-gray-700 font-semibold">{s.approvedBy?.name || 'College Admin'}</strong>
                          </p>
                          {s.approvedAt && (
                            <p className="text-[10px] text-gray-400 font-medium">
                              {new Date(s.approvedAt).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditStaff(s)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200/60 inline-flex items-center gap-1.5 cursor-pointer"
                              title="Edit staff details"
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingStaff(s)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200/60 inline-flex items-center gap-1.5 cursor-pointer"
                              title="Delete staff member"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: DENY PENDING USER REGISTRATION                        */}
      {/* ============================================================== */}
      {denyingUser && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
          onClick={() => !denying && setDenyingUser(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative flex flex-col transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-b from-rose-50/80 to-white px-6 pt-6 pb-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner border border-rose-200/60 ring-6 ring-rose-50">
                <XCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Deny Registration Request</h3>
              <p className="text-xs text-gray-500 mt-1">
                Provide a reason for rejecting <strong className="text-gray-900">{denyingUser.name}</strong> ({denyingUser.email}).
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reason for Denial
                </label>
                <textarea
                  rows="4"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 bg-gray-50/60 focus:bg-white text-sm transition-all resize-none"
                  placeholder="Enter the official reason for denial (this will be sent via email)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDenyingUser(null);
                    setRejectionReason('');
                  }}
                  disabled={denying}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDenyUser}
                  disabled={denying || !rejectionReason.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {denying ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Denying...</span>
                    </>
                  ) : (
                    <span>Send & Deny</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT APPROVED USER (VENDOR / COMMITTEE)              */}
      {/* ============================================================== */}
      {editingUser && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
          onClick={() => !savingUser && setEditingUser(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden relative max-h-[92vh] flex flex-col transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dynamic Header based on role */}
            <div className={`px-6 py-5 border-b flex items-start justify-between gap-4 shrink-0 ${
              editingUser.role === 'vendor'
                ? 'bg-gradient-to-r from-rose-50/70 via-rose-50/20 to-white border-rose-100/70'
                : 'bg-gradient-to-r from-amber-50/70 via-indigo-50/20 to-white border-amber-100/70'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${
                  editingUser.role === 'vendor'
                    ? 'bg-rose-100/80 text-rose-600 border-rose-200/80'
                    : 'bg-amber-100/80 text-amber-700 border-amber-200/80'
                }`}>
                  {editingUser.role === 'vendor' ? <Store size={22} /> : <Building2 size={22} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      Edit {editingUser.role === 'vendor' ? 'Vendor Account' : 'Committee Member'}
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0 ${
                      editingUser.role === 'vendor' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {editingUser.role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {editingUser.role === 'vendor'
                      ? 'Update catering credentials, mess allocation & details'
                      : 'Update committee credentials and oversight authority'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !savingUser && setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-gray-100/80 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveEditUser} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-gray-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-gray-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  placeholder="e.g. name@example.com"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-gray-400" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={editUserData.phoneNumber}
                  onChange={(e) => setEditUserData({ ...editUserData, phoneNumber: e.target.value })}
                  placeholder="10-digit mobile number"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all"
                />
              </div>

              {/* Vendor-specific fields */}
              {editingUser.role === 'vendor' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Store size={13} className="text-gray-400" />
                      <span>Company / Catering Agency Name</span>
                    </label>
                    <input
                      type="text"
                      value={editUserData.companyName}
                      onChange={(e) => setEditUserData({ ...editUserData, companyName: e.target.value })}
                      placeholder="e.g. Annapurna Caterers Pvt Ltd"
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all"
                    />
                  </div>

                  <div>
                    <Select
                      label="Assigned Mess"
                      value={editUserData.messAssigned}
                      onChange={(e) => setEditUserData({ ...editUserData, messAssigned: e.target.value })}
                      options={[
                        { value: '', label: 'Unassigned' },
                        ...messes.map(m => ({ value: m._id, label: m.name })),
                      ]}
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-gray-700">Compliance Documents</p>
                      <p className="text-[11px] text-gray-500">Government licenses & KYC files</p>
                    </div>
                    <VendorDocumentsDropdown documents={editingUser.vendorDocuments} vendorName={editingUser.name} />
                  </div>
                </>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={savingUser}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                    editingUser.role === 'vendor'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-600/25'
                      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-600/25'
                  }`}
                >
                  {savingUser ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================== */}
      {/* MODAL 3: DELETE USER CONFIRMATION (CRITICAL DATA LOSS WARNING) */}
      {/* ============================================================== */}
      {deletingUser && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
          onClick={() => !deletingUserLoading && setDeletingUser(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden relative flex flex-col transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Banner with Soft Accent */}
            <div className="bg-gradient-to-b from-rose-50/80 to-white px-6 pt-6 pb-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner border border-rose-200/60 ring-6 ring-rose-50">
                <Trash2 size={26} />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 mb-1.5">
                Permanent Deletion
              </span>
              <h3 className="text-lg font-bold text-gray-900">
                Delete {deletingUser.role === 'vendor' ? 'Vendor Account' : 'Committee Member'}?
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                This account and all linked records will be permanently erased.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* User Target Card */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{deletingUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{deletingUser.email}</p>
                  {deletingUser.companyName && (
                    <p className="text-xs font-semibold text-teal-700 mt-0.5 truncate">{deletingUser.companyName}</p>
                  )}
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0 ${
                  deletingUser.role === 'vendor' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {deletingUser.role.replace('_', ' ')}
                </span>
              </div>

              {/* Warning Callout Box */}
              <div className="p-4 bg-rose-50/70 border border-rose-200/70 rounded-2xl text-xs space-y-2">
                <p className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  Cascading Data Consequences
                </p>
                <ul className="list-disc list-inside space-y-1 text-rose-800/90 font-medium text-[11px] pl-1 leading-relaxed">
                  {deletingUser.role === 'vendor' ? (
                    <>
                      <li>All mess staff members registered under this vendor will be removed.</li>
                      <li>All timetable menus and meal tracking logs will be deleted.</li>
                      <li>Assigned complaints and vendor notices will be unlinked.</li>
                    </>
                  ) : (
                    <>
                      <li>All scheduled inspection visits assigned to this member will be unlinked.</li>
                      <li>Committee notices and inspection records will be erased.</li>
                    </>
                  )}
                  <li className="font-bold text-rose-900">This action cannot be undone.</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  disabled={deletingUserLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-50 text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteUser}
                  disabled={deletingUserLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {deletingUserLoading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================== */}
      {/* MODAL 4: EDIT APPROVED STAFF MEMBER                            */}
      {/* ============================================================== */}
      {editingStaff && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
          onClick={() => !savingStaff && setEditingStaff(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden relative max-h-[92vh] flex flex-col transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b bg-gradient-to-r from-teal-50/70 via-indigo-50/20 to-white border-teal-100/70 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0 shadow-xs border border-teal-200/80">
                  <UserCheck size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">Edit Staff Member</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">Update staff credentials, compensation & mess location</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !savingStaff && setEditingStaff(null)}
                className="w-8 h-8 rounded-full bg-gray-100/80 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-gray-400" />
                  <span>Staff Member Name</span>
                </label>
                <input
                  type="text"
                  value={editStaffData.name}
                  onChange={(e) => setEditStaffData({ ...editStaffData, name: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-gray-400" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={editStaffData.phoneNumber}
                  onChange={(e) => setEditStaffData({ ...editStaffData, phoneNumber: e.target.value })}
                  placeholder="10-digit mobile number"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Select
                    label="Staff Role"
                    value={editStaffData.role}
                    onChange={(e) => setEditStaffData({ ...editStaffData, role: e.target.value })}
                    options={[
                      { value: 'Cook', label: 'Cook' },
                      { value: 'Cleaner', label: 'Cleaner' },
                      { value: 'Cashier', label: 'Cashier' },
                      { value: 'Manager', label: 'Manager' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <DollarSign size={13} className="text-gray-400" />
                    <span>Monthly Salary (₹)</span>
                  </label>
                  <input
                    type="number"
                    value={editStaffData.salary}
                    onChange={(e) => setEditStaffData({ ...editStaffData, salary: e.target.value })}
                    placeholder="e.g. 15000"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50/60 hover:bg-white focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-2xs transition-all"
                  />
                </div>
              </div>

              <div>
                <Select
                  label="Assigned Mess"
                  value={editStaffData.mess}
                  onChange={(e) => setEditStaffData({ ...editStaffData, mess: e.target.value })}
                  placeholder="Select Mess"
                  options={[
                    { value: '', label: 'Select Mess' },
                    ...messes.map(m => ({ value: m._id, label: m.name })),
                  ]}
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-gray-700">Verification Documents</p>
                  <p className="text-[11px] text-gray-500">ID proof, police verification & medical report</p>
                </div>
                <VendorDocumentsDropdown documents={editingStaff.documents} vendorName={editingStaff.name} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  disabled={savingStaff}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-md shadow-teal-600/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingStaff ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================== */}
      {/* MODAL 5: DELETE STAFF CONFIRMATION (CRITICAL WARNING)          */}
      {/* ============================================================== */}
      {deletingStaff && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh' }}
          onClick={() => !deletingStaffLoading && setDeletingStaff(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden relative flex flex-col transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-b from-rose-50/80 to-white px-6 pt-6 pb-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-inner border border-rose-200/60 ring-6 ring-rose-50">
                <Trash2 size={26} />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 mb-1.5">
                Permanent Deletion
              </span>
              <h3 className="text-lg font-bold text-gray-900">Remove Staff Member?</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                "{deletingStaff.name}" ({deletingStaff.role})
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50/70 border border-rose-200/70 rounded-2xl text-xs space-y-2">
                <p className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  Consequences of Removal
                </p>
                <ul className="list-disc list-inside space-y-1 text-rose-800/90 font-medium text-[11px] pl-1 leading-relaxed">
                  <li>Staff employment profile and verification history will be permanently deleted.</li>
                  <li>Uploaded compliance documents (police report, medical cert) will be unlinked.</li>
                  <li className="font-bold text-rose-900">This action cannot be undone.</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingStaff(null)}
                  disabled={deletingStaffLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-50 text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteStaff}
                  disabled={deletingStaffLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {deletingStaffLoading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Delete Staff</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserApprovals;

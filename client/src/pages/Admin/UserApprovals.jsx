import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  FileText,
  UserCheck,
  Users,
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
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
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
          className="self-start md:self-auto px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Main Navigation Segment Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80">
        <button
          onClick={() => {
            setMainTab('pending');
            setSearchTerm('');
            setRoleFilter('ALL');
            setMessFilter('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === 'pending'
              ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock size={16} />
          <span>Pending Approvals</span>
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === 'approved_users'
              ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <UserCheck size={16} />
          <span>Vendors & Committee</span>
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === 'approved_staff'
              ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users size={16} />
          <span>Approved Staff</span>
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
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200 w-fit">
              <button
                onClick={() => setPendingSubTab('accounts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pendingSubTab === 'accounts' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <UserCheck size={14} /> Vendors & Committee ({pendingUsers.length})
              </button>
              <button
                onClick={() => setPendingSubTab('staff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className="w-auto min-w-[160px]"
              />
            )}
          </div>

          {/* Pending Sub-tab: Accounts */}
          {pendingSubTab === 'accounts' && (
            <div className="glass-panel overflow-hidden border border-white/40 shadow-xl shadow-gray-200/40 rounded-2xl bg-white/70">
              <div className="overflow-x-auto responsive-table-wrapper">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant Details</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Mess</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Compliance Documents</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
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
                            {user.messAssigned?.name && (
                              <p className="text-xs text-gray-600 font-semibold mt-1">Mess: {user.messAssigned.name}</p>
                            )}
                          </td>
                          <td className="p-4">
                            {user.vendorDocuments ? (
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {user.vendorDocuments.udyamCertificate && (
                                  <a href={user.vendorDocuments.udyamCertificate} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-200 inline-flex items-center gap-1">
                                    <FileText size={10} /> Udyam
                                  </a>
                                )}
                                {user.vendorDocuments.fssaiLicense && (
                                  <a href={user.vendorDocuments.fssaiLicense} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-200 inline-flex items-center gap-1">
                                    <FileText size={10} /> FSSAI
                                  </a>
                                )}
                                {user.vendorDocuments.labourLicense && (
                                  <a href={user.vendorDocuments.labourLicense} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-200 inline-flex items-center gap-1">
                                    <FileText size={10} /> Labour
                                  </a>
                                )}
                                {user.vendorDocuments.gstCertificate && (
                                  <a href={user.vendorDocuments.gstCertificate} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-200 inline-flex items-center gap-1">
                                    <FileText size={10} /> GST
                                  </a>
                                )}
                                {user.vendorDocuments.panCard && (
                                  <a href={user.vendorDocuments.panCard} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-200 inline-flex items-center gap-1">
                                    <FileText size={10} /> PAN
                                  </a>
                                )}
                                {user.vendorDocuments.aadhaarCard && (
                                  <a href={user.vendorDocuments.aadhaarCard} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-200 inline-flex items-center gap-1">
                                    <FileText size={10} /> Aadhaar
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">N/A</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
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
              <div className="overflow-x-auto responsive-table-wrapper">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor & Mess</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Verification Documents</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
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
                            {member.documents ? (
                              <div className="flex flex-wrap gap-1.5">
                                {member.documents.identityProof && (
                                  <a href={member.documents.identityProof} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-200 inline-flex items-center gap-1">
                                    <FileText size={10} /> Identity
                                  </a>
                                )}
                                {member.documents.policeVerification && (
                                  <a href={member.documents.policeVerification} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-200 inline-flex items-center gap-1">
                                    <FileText size={10} /> Police Report
                                  </a>
                                )}
                                {member.documents.medicalReport && (
                                  <a href={member.documents.medicalReport} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded border border-gray-200 inline-flex items-center gap-1">
                                    <FileText size={10} /> Medical
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">No documents</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
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

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="vendor">Vendor Only</option>
                <option value="mess_committee">Mess Committee Only</option>
              </select>

              <select
                value={messFilter}
                onChange={(e) => setMessFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="">All Messes</option>
                {messes.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Approved Users List Table */}
          <div className="glass-panel overflow-hidden border border-white/40 shadow-xl shadow-gray-200/40 rounded-2xl bg-white/80">
            <div className="overflow-x-auto responsive-table-wrapper">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Details</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Authority</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Mess</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">Loading approved members...</td></tr>
                  ) : filteredApprovedUsers.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">No approved vendors or committee members found matching criteria.</td></tr>
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
                          {u.messAssigned?.name ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-700">
                              <Building2 size={13} className="text-gray-500" />
                              {u.messAssigned.name}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                        </td>
                        <td className="p-4 text-right">
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

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="Cook">Cook</option>
                <option value="Cleaner">Cleaner</option>
                <option value="Cashier">Cashier</option>
                <option value="Manager">Manager</option>
              </select>

              <select
                value={messFilter}
                onChange={(e) => setMessFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                <option value="">All Messes</option>
                {messes.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Approved Staff Table */}
          <div className="glass-panel overflow-hidden border border-white/40 shadow-xl shadow-gray-200/40 rounded-2xl bg-white/80">
            <div className="overflow-x-auto responsive-table-wrapper">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Salary</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mess & Vendor</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">Loading approved staff...</td></tr>
                  ) : filteredApprovedStaff.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">No approved staff members found matching criteria.</td></tr>
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                        </td>
                        <td className="p-4 text-right">
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
      {denyingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl border border-white/40 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Deny Registration Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to deny the registration request for <strong className="text-gray-900">{denyingUser.name}</strong> ({denyingUser.email})?
            </p>
            
            <div className="space-y-2 mb-6">
              <label className="block text-sm font-semibold text-gray-700">Reason for Denial</label>
              <textarea
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-gray-50 focus:bg-white text-sm transition-all resize-none"
                placeholder="Enter the reason for denial (this will be emailed)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setDenyingUser(null);
                  setRejectionReason('');
                }}
                disabled={denying}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDenyUser}
                disabled={denying || !rejectionReason.trim()}
              >
                {denying ? 'Denying...' : 'Send & Deny'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT APPROVED USER (VENDOR / COMMITTEE)              */}
      {/* ============================================================== */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Edit {editingUser.role === 'vendor' ? 'Vendor' : 'Mess Committee Member'}
                </h3>
                <p className="text-xs text-gray-500">Update account credentials and mess assignment</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                <Input
                  type="text"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  placeholder="Full Name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                <Input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  placeholder="Email Address"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                <Input
                  type="tel"
                  value={editUserData.phoneNumber}
                  onChange={(e) => setEditUserData({ ...editUserData, phoneNumber: e.target.value })}
                  placeholder="10-digit Phone Number"
                  required
                />
              </div>

              {editingUser.role === 'vendor' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Company / Catering Agency Name</label>
                  <Input
                    type="text"
                    value={editUserData.companyName}
                    onChange={(e) => setEditUserData({ ...editUserData, companyName: e.target.value })}
                    placeholder="e.g. Annapurna Caterers Pvt Ltd"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Assigned Mess</label>
                <select
                  value={editUserData.messAssigned}
                  onChange={(e) => setEditUserData({ ...editUserData, messAssigned: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">Unassigned</option>
                  {messes.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingUser(null)}
                  disabled={savingUser}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={savingUser}
                >
                  {savingUser ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: DELETE USER CONFIRMATION (CRITICAL DATA LOSS WARNING) */}
      {/* ============================================================== */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-300 relative space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertOctagon size={32} className="animate-pulse" />
            </div>

            <div className="text-center space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                Critical Warning: Permanent Deletion
              </span>
              <h3 className="text-lg font-black text-gray-900 mt-1">
                Delete {deletingUser.role === 'vendor' ? 'Vendor' : 'Mess Committee Member'}?
              </h3>
              <p className="text-sm font-bold text-rose-600">
                "{deletingUser.name}" ({deletingUser.role.replace('_', ' ').toUpperCase()})
              </p>
            </div>

            {/* Prominent warning box prompted to the admin */}
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-2 leading-relaxed">
              <p className="font-extrabold text-rose-900 flex items-center gap-1.5 text-sm">
                <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
                Agr delete kiya toh sara data related to them will be permanently deleted!
              </p>
              <ul className="list-disc list-inside space-y-1 text-rose-800 font-medium pl-1 text-[11px]">
                {deletingUser.role === 'vendor' ? (
                  <>
                    <li>All mess staff members registered under this vendor will be removed.</li>
                    <li>All menu timetables and meal records created by this vendor will be erased.</li>
                    <li>Vendor notices and assigned complaints will be unlinked.</li>
                  </>
                ) : (
                  <>
                    <li>All scheduled mess inspection visits assigned to this member will be deleted.</li>
                    <li>Committee notices and inspection records will be erased.</li>
                  </>
                )}
                <li className="font-bold text-rose-900">This action CANNOT be undone!</li>
              </ul>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={deletingUserLoading}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={deletingUserLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deletingUserLoading ? (
                  'Deleting All Data...'
                ) : (
                  <>
                    <Trash2 size={14} /> Yes, Delete User & Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: EDIT APPROVED STAFF MEMBER                            */}
      {/* ============================================================== */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Staff Member</h3>
                <p className="text-xs text-gray-500">Update staff role, salary, and mess location</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Staff Member Name</label>
                <Input
                  type="text"
                  value={editStaffData.name}
                  onChange={(e) => setEditStaffData({ ...editStaffData, name: e.target.value })}
                  placeholder="Full Name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                <Input
                  type="tel"
                  value={editStaffData.phoneNumber}
                  onChange={(e) => setEditStaffData({ ...editStaffData, phoneNumber: e.target.value })}
                  placeholder="10-digit Phone Number"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Staff Role</label>
                  <select
                    value={editStaffData.role}
                    onChange={(e) => setEditStaffData({ ...editStaffData, role: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="Cook">Cook</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Monthly Salary (₹)</label>
                  <Input
                    type="number"
                    value={editStaffData.salary}
                    onChange={(e) => setEditStaffData({ ...editStaffData, salary: e.target.value })}
                    placeholder="e.g. 15000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Assigned Mess</label>
                <select
                  value={editStaffData.mess}
                  onChange={(e) => setEditStaffData({ ...editStaffData, mess: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">Select Mess</option>
                  {messes.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingStaff(null)}
                  disabled={savingStaff}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={savingStaff}
                >
                  {savingStaff ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: DELETE STAFF CONFIRMATION (CRITICAL WARNING)          */}
      {/* ============================================================== */}
      {deletingStaff && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-300 relative space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertOctagon size={32} className="animate-pulse" />
            </div>

            <div className="text-center space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                Critical Warning: Permanent Deletion
              </span>
              <h3 className="text-lg font-black text-gray-900 mt-1">
                Remove Staff Member?
              </h3>
              <p className="text-sm font-bold text-rose-600">
                "{deletingStaff.name}" ({deletingStaff.role})
              </p>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-2 leading-relaxed">
              <p className="font-extrabold text-rose-900 flex items-center gap-1.5 text-sm">
                <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
                Agr delete kiya toh sara data related to them will be deleted!
              </p>
              <ul className="list-disc list-inside space-y-1 text-rose-800 font-medium pl-1 text-[11px]">
                <li>Staff employment profile and verification history will be permanently deleted.</li>
                <li>Uploaded compliance documents (police report, medical cert) will be unlinked.</li>
                <li className="font-bold text-rose-900">This action cannot be undone!</li>
              </ul>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                disabled={deletingStaffLoading}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                disabled={deletingStaffLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deletingStaffLoading ? (
                  'Deleting Staff...'
                ) : (
                  <>
                    <Trash2 size={14} /> Yes, Delete Staff Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApprovals;

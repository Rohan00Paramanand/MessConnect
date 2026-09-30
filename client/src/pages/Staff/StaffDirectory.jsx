import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Users, Plus, X, Trash2, Phone, CalendarDays, DollarSign, FileText, CheckCircle2, Clock, Building2, ChevronLeft, ChevronRight, Edit2, AlertTriangle, AlertOctagon } from 'lucide-react';

const roleColors = { Cook: 'bg-orange-100 text-orange-700', Cleaner: 'bg-blue-100 text-blue-700', Cashier: 'bg-green-100 text-green-700', Manager: 'bg-purple-100 text-purple-700' };

const StaffDirectory = () => {
  const { user } = useAuthStore();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', role: 'Cook', joiningDate: '', salary: '', isActive: true });
  const [staffDocs, setStaffDocs] = useState({ identityProof: null, policeVerification: null, medicalReport: null });
  const [messFilter, setMessFilter] = useState('');
  const [messes, setMesses] = useState([]);

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editStaffData, setEditStaffData] = useState({ name: '', phoneNumber: '', role: 'Cook', salary: '', mess: '' });
  const [savingStaff, setSavingStaff] = useState(false);

  // Delete Staff Modal State (Critical warning)
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [deletingStaffLoading, setDeletingStaffLoading] = useState(false);

  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    if (user?.collegeId && (user.role === 'mess_committee' || user.role === 'college_admin')) {
      api.get('/messes')
        .then(({ data }) => {
          const list = data.data || [];
          setMesses(list);
        })
        .catch(err => {
          console.error('Failed to load messes', err);
        });
    }
  }, [user]);

  const fetchStaff = useCallback(async (filterVal = messFilter) => {
    try {
      setLoading(true);
      const params = {};
      if ((user?.role === 'mess_committee' || user?.role === 'college_admin') && filterVal) {
        params.mess = filterVal;
      }
      const { data } = await api.get('/staff', { params });
      setStaff(data.data || data);
      setCurrentPage(1);
    }
    catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  }, [user, messFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaff(messFilter);
    }, 0);
    return () => clearTimeout(timer);
  }, [messFilter, fetchStaff]);

  const filteredStaff = staff.filter((member) => {
    if (roleFilter !== 'ALL' && member.role !== roleFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE) || 1;
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = formData.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Staff phone number must be exactly 10 digits long.');
      return;
    }

    if (!staffDocs.identityProof || !staffDocs.policeVerification || !staffDocs.medicalReport) {
      toast.error('Please upload all 3 required verification documents for staff');
      return;
    }

    setFormLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('phoneNumber', cleanPhone);
      payload.append('role', formData.role);
      if (formData.joiningDate) payload.append('joiningDate', formData.joiningDate);
      if (formData.salary) payload.append('salary', formData.salary);
      
      payload.append('identityProof', staffDocs.identityProof);
      payload.append('policeVerification', staffDocs.policeVerification);
      payload.append('medicalReport', staffDocs.medicalReport);

      const { data } = await api.post('/staff', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.status === 'success') {
        toast.success('Staff member submitted for College Admin approval!');
        setStaff([data.data, ...staff]);
        setShowForm(false);
        setFormData({ name: '', phoneNumber: '', role: 'Cook', joiningDate: '', salary: '', isActive: true });
        setStaffDocs({ identityProof: null, policeVerification: null, medicalReport: null });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff member');
    } finally {
      setFormLoading(false);
    }
  };

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

  const handleSaveEditStaff = async (e) => {
    e.preventDefault();
    if (!editStaffData.name.trim()) {
      toast.error('Staff name is required');
      return;
    }
    const cleanPhone = editStaffData.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Staff phone number must be exactly 10 digits long');
      return;
    }

    setSavingStaff(true);
    try {
      const { data } = await api.patch(`/staff/${editingStaff._id}`, {
        ...editStaffData,
        phoneNumber: cleanPhone
      });
      toast.success('Staff member updated successfully!');
      setStaff(prev => prev.map(s => (s._id === editingStaff._id ? data.data : s)));
      setEditingStaff(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update staff member');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleConfirmDeleteStaff = async () => {
    if (!deletingStaff) return;
    setDeletingStaffLoading(true);
    try {
      await api.delete(`/staff/${deletingStaff._id}`);
      setStaff(prev => prev.filter(s => s._id !== deletingStaff._id));
      toast.success('Staff member and records permanently deleted');
      setDeletingStaff(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error removing staff');
    } finally {
      setDeletingStaffLoading(false);
    }
  };

  if (user?.role === 'user' || user?.role === 'student') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-12">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 font-medium">You are not authorized to view the staff directory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 bg-gradient-to-r from-slate-800 via-gray-900 to-slate-900 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -left-16 -top-16 w-64 h-64 bg-teal-500/20 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Users size={18} />
              </div>
              <span className="text-white/70 text-xs sm:text-sm font-bold uppercase tracking-widest">Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1">Staff Management</h1>
            <p className="text-white/70 text-sm sm:text-base font-medium">
              {user?.role === 'vendor' ? 'Manage your mess workers and verification compliance' : 'View active mess staff members'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {['mess_committee', 'college_admin'].includes(user?.role) && (
              <Select
                variant="header"
                icon={Building2}
                value={messFilter}
                onChange={(e) => setMessFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Messes' },
                  ...messes.map((m) => ({ value: m._id, label: m.name })),
                ]}
              />
            )}
            {user?.role === 'vendor' && (
              <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl sm:rounded-2xl text-white font-bold text-xs sm:text-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5">
                {showForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> Add Staff</>}
              </button>
            )}
          </div>
        </div>

        <div className="relative z-10 mt-5 sm:mt-6 flex flex-wrap gap-4 sm:gap-6">
          <div>
            <p className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Staff</p>
            <p className="text-2xl sm:text-3xl font-black">{staff.length}</p>
          </div>
          <div>
            <p className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Approved</p>
            <p className="text-2xl sm:text-3xl font-black text-green-400">{staff.filter(s => s.isApprovedByAdmin).length}</p>
          </div>
        </div>
      </div>

      {/* Add Staff Form */}
      {showForm && user?.role === 'vendor' && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] animate-fade-in">
          <h3 className="text-xl font-black text-gray-900 mb-6">Register New Staff Member</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input label="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input label="Phone Number" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
              <Select
                label="Role"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                options={[
                  { value: 'Cook', label: 'Cook' },
                  { value: 'Cleaner', label: 'Cleaner' },
                  { value: 'Cashier', label: 'Cashier' },
                  { value: 'Manager', label: 'Manager' },
                ]}
              />
              <Input label="Joining Date" type="date" required value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
              <Input label="Monthly Salary (₹)" type="number" required value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} />
            </div>

            <div className="p-5 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <FileText size={18} /> Required Identification & Verification Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Identity Proof (Aadhaar / DL) *</label>
                  <input
                    type="file"
                    required
                    accept="image/*,application/pdf"
                    onChange={(e) => setStaffDocs({ ...staffDocs, identityProof: e.target.files[0] })}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-gray-700 shadow-sm cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Police Verification Report *</label>
                  <input
                    type="file"
                    required
                    accept="image/*,application/pdf"
                    onChange={(e) => setStaffDocs({ ...staffDocs, policeVerification: e.target.files[0] })}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-gray-700 shadow-sm cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Medical Report *</label>
                  <input
                    type="file"
                    required
                    accept="image/*,application/pdf"
                    onChange={(e) => setStaffDocs({ ...staffDocs, medicalReport: e.target.files[0] })}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-gray-700 shadow-sm cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={formLoading} className="w-full sm:w-auto">
              {formLoading ? 'Submitting...' : '+ Save & Submit Staff Member'}
            </Button>
          </form>
        </div>
      )}

      {/* Dropdown Filters Bar */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="w-full sm:w-64">
            <Select
              label="Filter by Staff Role"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { value: 'ALL', label: `All Roles (${staff.length})` },
                { value: 'Cook', label: `Cook (${staff.filter((s) => s.role === 'Cook').length})` },
                { value: 'Cleaner', label: `Cleaner (${staff.filter((s) => s.role === 'Cleaner').length})` },
                { value: 'Cashier', label: `Cashier (${staff.filter((s) => s.role === 'Cashier').length})` },
                { value: 'Manager', label: `Manager (${staff.filter((s) => s.role === 'Manager').length})` },
              ]}
            />
          </div>

          {['mess_committee', 'college_admin'].includes(user?.role) && messes.length > 0 && (
            <div className="w-full sm:w-64">
              <Select
                label="Filter by Mess"
                icon={Building2}
                value={messFilter}
                onChange={(e) => { setMessFilter(e.target.value); setCurrentPage(1); }}
                options={[
                  { value: '', label: 'All Messes' },
                  ...messes.map((m) => ({ value: m._id, label: m.name })),
                ]}
              />
            </div>
          )}
        </div>

        {(roleFilter !== 'ALL' || messFilter) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">
              Showing <strong>{filteredStaff.length}</strong> of <strong>{staff.length}</strong> members
            </span>
            <button
              type="button"
              onClick={() => { setRoleFilter('ALL'); setMessFilter(''); setCurrentPage(1); }}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center p-16 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50">
          <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Users className="text-gray-400" size={28} />
          </div>
          <h3 className="font-bold text-gray-700 mb-1">No staff found</h3>
          <p className="text-gray-400 text-sm">
            {roleFilter !== 'ALL'
              ? `No staff members found matching the "${roleFilter}" role.`
              : 'Add staff members to populate the directory.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedStaff.map(member => (
            <div key={member._id} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {member.name.charAt(0)}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-xl ${roleColors[member.role] || 'bg-gray-100 text-gray-700'}`}>
                    {member.role}
                  </span>
                  {user?.role === 'vendor' && (
                    <button onClick={() => handleDelete(member._id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-black text-gray-900 mb-1">{member.name}</h3>
              {member.vendor?.companyName && (
                <p className="text-xs font-bold text-teal-700 mb-3 flex items-center gap-1">
                  <Building2 size={12} /> {member.vendor.companyName} {member.mess?.name ? `(${member.mess.name})` : ''}
                </p>
              )}
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <Phone size={14} className="text-gray-400" />
                  <span>{member.phoneNumber}</span>
                </div>
                {member.joiningDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarDays size={14} className="text-gray-400" />
                    <span>Since {new Date(member.joiningDate).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})}</span>
                  </div>
                )}
                {member.salary && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="font-bold text-gray-700">₹{member.salary.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>

              {/* Documents preview links */}
              {member.documents && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Uploaded Verification Docs</p>
                  <div className="flex flex-wrap gap-2">
                    {member.documents.identityProof && (
                      <a href={member.documents.identityProof} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1">
                        <FileText size={12} /> Identity Proof
                      </a>
                    )}
                    {member.documents.policeVerification && (
                      <a href={member.documents.policeVerification} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1">
                        <FileText size={12} /> Police Verification
                      </a>
                    )}
                    {member.documents.medicalReport && (
                      <a href={member.documents.medicalReport} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1">
                        <FileText size={12} /> Medical Report
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2 text-xs font-bold">
                {member.isApprovedByAdmin ? (
                  <span className="text-emerald-600 inline-flex items-center gap-1">
                    <CheckCircle2 size={14} /> Approved by Admin
                  </span>
                ) : (
                  <span className="text-amber-600 inline-flex items-center gap-1">
                    <Clock size={14} /> Pending Admin Approval
                  </span>
                )}

                {(user?.role === 'college_admin' || user?.role === 'vendor') && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => openEditStaff(member)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-all border border-indigo-200/60 inline-flex items-center gap-1 cursor-pointer"
                      title="Edit staff member"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingStaff(member)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition-all border border-rose-200/60 inline-flex items-center gap-1 cursor-pointer"
                      title="Delete staff member"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-2.5 pt-6 border-t border-gray-200/60 w-full">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
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
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

          <p className="text-xs text-gray-500 font-medium text-center">
            Showing <strong className="text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong className="text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredStaff.length)}</strong> of <strong className="text-gray-900">{filteredStaff.length}</strong> staff
          </p>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Staff Member</h3>
                <p className="text-xs text-gray-500">Update staff role, salary, and mess</p>
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

              {messes.length > 0 && (
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
              )}

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

      {/* Delete Staff Confirmation Modal (With Critical Warning Prompt) */}
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
                    <Trash2 size={14} /> Yes, Delete Staff
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
export default StaffDirectory;

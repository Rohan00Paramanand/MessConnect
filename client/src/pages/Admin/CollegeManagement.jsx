import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { School, Check, X, ShieldAlert, Plus, ToggleLeft, ToggleRight, Mail, Phone, Edit, UserCheck, UserPlus, UserX, Shield, Trash2, AlertTriangle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const CollegeManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Edit College state
  const [editingCollege, setEditingCollege] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    allowedDomains: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [updating, setUpdating] = useState(false);

  // Assign Admin state
  const [assigningCollege, setAssigningCollege] = useState(null);
  const [adminFormData, setAdminFormData] = useState({ email: '', name: '' });
  const [assigning, setAssigning] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Delete College state
  const [deletingCollege, setDeletingCollege] = useState(null);
  const [isDeletingCollege, setIsDeletingCollege] = useState(false);

  // Create College form state
  const [formData, setFormData] = useState({
    name: '',
    allowedDomains: '',
    contactEmail: '',
    contactPhone: ''
  });

  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/superadmin/colleges');
      setColleges(data.data || []);
    } catch {
      toast.error('Failed to load colleges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchColleges();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchColleges]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.allowedDomains) {
      toast.error('Name and allowed domains are required');
      return;
    }

    setSubmitting(true);
    try {
      const domainsArray = formData.allowedDomains
        .split(',')
        .map(d => d.trim().toLowerCase())
        .filter(d => d.length > 0);

      const payload = {
        name: formData.name,
        allowedDomains: domainsArray,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined
      };

      const { data } = await api.post('/superadmin/colleges', payload);
      toast.success('College registered successfully!');
      
      setFormData({
        name: '',
        allowedDomains: '',
        contactEmail: '',
        contactPhone: ''
      });

      // Refetch to ensure all data is in sync
      await fetchColleges();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to register college');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const { data } = await api.patch(`/superadmin/colleges/${id}/status`, { isActive: newStatus });
      toast.success(`College ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      
      setColleges(colleges.map(c => c._id === id ? { ...c, isActive: data.data.isActive } : c));
    } catch {
      toast.error('Failed to update college status');
    }
  };

  const startEdit = (college) => {
    setEditingCollege(college);
    setEditFormData({
      name: college.name,
      allowedDomains: college.allowedDomains.join(', '),
      contactEmail: college.contactEmail || '',
      contactPhone: college.contactPhone || ''
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.allowedDomains) {
      toast.error('Name and allowed domains are required');
      return;
    }

    setUpdating(true);
    try {
      const domainsArray = editFormData.allowedDomains
        .split(',')
        .map(d => d.trim().toLowerCase())
        .filter(d => d.length > 0);

      const payload = {
        name: editFormData.name,
        allowedDomains: domainsArray,
        contactEmail: editFormData.contactEmail || undefined,
        contactPhone: editFormData.contactPhone || undefined
      };

      await api.put(`/superadmin/colleges/${editingCollege._id}`, payload);
      toast.success('College updated successfully!');
      
      await fetchColleges();
      setEditingCollege(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to update college');
    } finally {
      setUpdating(false);
    }
  };

  // Assign Admin handlers
  const openAssignModal = (college) => {
    setAssigningCollege(college);
    setAdminFormData({
      email: college.admin?.email || '',
      name: college.admin?.name || ''
    });
  };

  const handleAssignAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminFormData.email) {
      toast.error('Admin email is required');
      return;
    }

    setAssigning(true);
    try {
      const { data } = await api.post(`/superadmin/colleges/${assigningCollege._id}/assign-admin`, {
        email: adminFormData.email,
        name: adminFormData.name || undefined
      });

      toast.success(data.message || 'Admin assigned successfully!');
      await fetchColleges();
      setAssigningCollege(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign administrator');
    } finally {
      setAssigning(false);
    }
  };

  const handleRevokeAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this administrator from this college?')) {
      return;
    }

    setRevoking(true);
    try {
      const { data } = await api.post(`/superadmin/admins/${userId}/revoke`);
      toast.success(data.message || 'Admin access revoked');
      await fetchColleges();
      setAssigningCollege(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke admin');
    } finally {
      setRevoking(false);
    }
  };
const handleDeleteAdmin = async (userId) => {
  if (!window.confirm(
    'Are you sure you want to permanently delete this college administrator? This action cannot be undone.'
  )) {
    return;
  }

  setDeleting(true);

  try {
    const { data } = await api.delete(`/superadmin/admins/${userId}`);

    toast.success(data.message || 'College admin deleted successfully');
    await fetchColleges();
    setAssigningCollege(null);
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to delete admin');
  } finally {
    setDeleting(false);
  }
};

  const handleDeleteCollege = async () => {
    if (!deletingCollege) return;

    setIsDeletingCollege(true);
    try {
      const { data } = await api.delete(`/superadmin/colleges/${deletingCollege._id}`);
      toast.success(data.message || 'College and all related data deleted successfully');
      setDeletingCollege(null);
      await fetchColleges();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete college');
    } finally {
      setIsDeletingCollege(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">College Management</h1>
            <p className="text-sm font-medium text-gray-500">Configure colleges, email domains, and assign administrators.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Register College Form */}
          <div className="lg:col-span-1 glass-panel p-6 border border-white/60 shadow-xl shadow-gray-200/40 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Plus className="text-violet-600" size={20} />
              <h2 className="text-lg font-bold text-gray-900">Register New College</h2>
            </div>

            <form onSubmit={handleCreateCollege} className="space-y-4">
              <Input
                label="College Name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Allowed Email Domains
                </label>
                <textarea
                  name="allowedDomains"
                  required
                  rows={2}
                  className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium"
                  value={formData.allowedDomains}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple domains with commas.</p>
              </div>

              <Input
                label="Contact Email (Optional)"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
              />

              <Input
                label="Contact Phone (Optional)"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
              />

              <Button type="submit" disabled={submitting} className="w-full bg-violet-600 hover:bg-violet-700">
                {submitting ? 'Registering...' : 'Register College'}
              </Button>
            </form>
          </div>

          {/* Registered Colleges List */}
          <div className="lg:col-span-2 glass-panel border border-white/60 shadow-xl shadow-gray-200/40 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="text-violet-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900">Registered Colleges</h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full">
                {colleges.length} Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">College</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Admin</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email Domains</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading colleges...</td></tr>
                  ) : colleges.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No colleges registered yet. Use the form to add one.</td></tr>
                  ) : (
                    colleges.map((college) => {
                      const admin = college.admin;
                      return (
                        <tr key={college._id} className="hover:bg-white/60 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{college.name}</p>
                          </td>
                          <td className="p-4">
                            {admin ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                                  <Shield size={14} />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 text-xs">{admin.name || 'Admin'}</p>
                                  <p className="text-[11px] text-gray-500">{admin.email}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {college.allowedDomains.map((domain, index) => (
                                <span key={index} className="px-1.5 py-0.5 text-xs font-bold bg-violet-50 text-violet-700 rounded-md border border-violet-100">
                                  @{domain}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(college._id, college.isActive)}
                              title={college.isActive ? 'Deactivate College' : 'Activate College'}
                              className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
                            >
                              {college.isActive ? (
                                <div className="flex flex-col items-center">
                                  <ToggleRight className="text-emerald-500 h-7 w-7" />
                                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <ToggleLeft className="text-gray-300 h-7 w-7" />
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inactive</span>
                                </div>
                              )}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openAssignModal(college)}
                                title={admin ? "Change Admin" : "Assign Admin"}
                                className={`text-xs px-2.5 py-1.5 font-bold rounded-xl flex items-center gap-1 border transition-all ${
                                  admin 
                                    ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {admin ? <UserCheck size={13} /> : <UserPlus size={13} />}
                                {admin ? 'Change Admin' : 'Assign Admin'}
                              </button>
                              <button
                                onClick={() => startEdit(college)}
                                title="Edit College"
                                className="text-xs px-2.5 py-1.5 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1 border border-gray-200 transition-all"
                              >
                                <Edit size={13} /> Edit
                              </button>
                              <button
                                onClick={() => setDeletingCollege(college)}
                                title="Delete College"
                                className="text-xs px-2.5 py-1.5 font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center gap-1 border border-rose-200 transition-all"
                              >
                                <Trash2 size={13} /> Delete
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
      </div>

      {/* Edit College Modal */}
      {editingCollege && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/40 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <School className="text-violet-600" size={22} />
                <h3 className="text-lg font-bold text-gray-900">Edit College Details</h3>
              </div>
              <button
                onClick={() => setEditingCollege(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <Input
                label="College Name"
                name="name"
                required
                value={editFormData.name}
                onChange={handleEditChange}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Allowed Email Domains
                </label>
                <textarea
                  name="allowedDomains"
                  required
                  rows={2}
                  className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium"
                  value={editFormData.allowedDomains}
                  onChange={handleEditChange}
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple domains with commas.</p>
              </div>

              <Input
                label="Contact Email (Optional)"
                name="contactEmail"
                type="email"
                value={editFormData.contactEmail}
                onChange={handleEditChange}
              />

              <Input
                label="Contact Phone (Optional)"
                name="contactPhone"
                value={editFormData.contactPhone}
                onChange={handleEditChange}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingCollege(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign / Change College Admin Modal */}
      {assigningCollege && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/40 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="text-violet-600" size={22} />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {assigningCollege.admin ? 'Change College Admin' : 'Assign College Admin'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">{assigningCollege.name}</p>
                </div>
              </div>
              <button
                onClick={() => setAssigningCollege(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {assigningCollege.admin && (
              <div className="mb-5 p-3.5 bg-violet-50/70 border border-violet-100 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Current Admin</p>
                  <p className="text-sm font-bold text-gray-900">{assigningCollege.admin.name || 'Admin'}</p>
                  <p className="text-xs text-gray-600">{assigningCollege.admin.email}</p>
                </div>
                <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => handleRevokeAdmin(assigningCollege.admin._id)}
    disabled={revoking || deleting}
    className="px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1"
  >
    <UserX size={13} /> {revoking ? 'Revoking...' : 'Revoke'}
  </button>

  <button
    type="button"
    onClick={() => handleDeleteAdmin(assigningCollege.admin._id)}
    disabled={deleting || revoking}
    className="px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center gap-1"
  >
    <X size={13} /> {deleting ? 'Deleting...' : 'Delete'}
  </button>
</div>
              </div>
            )}

            <form onSubmit={handleAssignAdminSubmit} className="space-y-4">
              <Input
                label="Admin Email Address"
                name="email"
                type="email"
                required
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
              />

              <Input
                label="Admin Full Name (Optional)"
                name="name"
                value={adminFormData.name}
                onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
              />

              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                💡 <strong>How this works:</strong> If an account already exists with this email, they will be instantly promoted to College Admin. If they are new, an email invitation will be dispatched automatically.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAssigningCollege(null)}
                  disabled={assigning}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={assigning}
                  className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5"
                >
                  <UserCheck size={15} />
                  {assigning ? 'Assigning...' : (assigningCollege.admin ? 'Update Admin' : 'Assign Admin')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete College Confirmation Modal */}
      {deletingCollege && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-100 relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Delete College</h3>
                  <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">Irreversible Destructive Action</p>
                </div>
              </div>
              <button
                onClick={() => !isDeletingCollege && setDeletingCollege(null)}
                disabled={isDeletingCollege}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-gray-900 font-black">{deletingCollege.name}</strong>?
              </p>

              <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
                  <ShieldAlert size={16} className="text-rose-600 flex-shrink-0" />
                  <span>Consequences of Deleting this College</span>
                </div>
                <p className="text-xs text-rose-900 font-semibold leading-relaxed">
                  Deleting this college will result in the complete and permanent removal of all accounts and data related to this college:
                </p>
                <ul className="text-xs text-rose-800 space-y-1.5 list-disc list-inside font-medium">
                  <li><strong>All User Accounts:</strong> Students, faculty, mess committee members, vendors, and college administrators.</li>
                  <li><strong>All Messes:</strong> Mess configurations, catering facilities, and manager assignments.</li>
                  <li><strong>All Activity Records:</strong> Complaints, upvotes, feedback ratings, and notices.</li>
                  <li><strong>All Operational Data:</strong> Timetables, meal menus, and staff member directories.</li>
                  <li><strong>All Invitations:</strong> Pending and active admin registration tokens.</li>
                </ul>
              </div>

              <p className="text-xs text-gray-500 font-medium">
                This action <strong className="text-gray-900">cannot be undone</strong>. Please confirm if you wish to proceed.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeletingCollege(null)}
                disabled={isDeletingCollege}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleDeleteCollege}
                disabled={isDeletingCollege}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
              >
                <Trash2 size={16} />
                {isDeletingCollege ? 'Deleting College & All Data...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CollegeManagement;

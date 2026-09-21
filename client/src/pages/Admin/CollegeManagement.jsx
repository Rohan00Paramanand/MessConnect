import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { School, Check, X, ShieldAlert, Plus, ToggleLeft, ToggleRight, Mail, Phone, Edit, UserCheck, UserPlus, UserX, Shield } from 'lucide-react';
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
    slug: '',
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
  // Create College form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
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
    if (!formData.name || !formData.slug || !formData.allowedDomains) {
      toast.error('Name, slug, and allowed domains are required');
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
        slug: formData.slug.toLowerCase().trim().replace(/\s+/g, '-'),
        allowedDomains: domainsArray,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined
      };

      const { data } = await api.post('/superadmin/colleges', payload);
      toast.success('College registered successfully!');
      
      setFormData({
        name: '',
        slug: '',
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
      slug: college.slug,
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
    if (!editFormData.name || !editFormData.slug || !editFormData.allowedDomains) {
      toast.error('Name, slug, and allowed domains are required');
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
        slug: editFormData.slug.toLowerCase().trim().replace(/\s+/g, '-'),
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
                placeholder="e.g. DY Patil College"
                required
                value={formData.name}
                onChange={handleChange}
              />

              <Input
                label="Slug (lowercase, hyphens)"
                name="slug"
                placeholder="e.g. dy-patil"
                required
                value={formData.slug}
                onChange={handleChange}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Allowed Email Domains
                </label>
                <textarea
                  name="allowedDomains"
                  placeholder="e.g. dypatil.edu, dypatil.in"
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
                placeholder="e.g. admin@dypatil.edu"
                value={formData.contactEmail}
                onChange={handleChange}
              />

              <Input
                label="Contact Phone (Optional)"
                name="contactPhone"
                placeholder="e.g. 9876543210"
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
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">College / Slug</th>
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
                            <p className="text-xs text-gray-500 font-mono">slug: {college.slug}</p>
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
                placeholder="e.g. DY Patil College"
                required
                value={editFormData.name}
                onChange={handleEditChange}
              />

              <Input
                label="Slug (lowercase, hyphens)"
                name="slug"
                placeholder="e.g. dy-patil"
                required
                value={editFormData.slug}
                onChange={handleEditChange}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Allowed Email Domains
                </label>
                <textarea
                  name="allowedDomains"
                  placeholder="e.g. dypatil.edu, dypatil.in"
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
                placeholder="e.g. admin@dypatil.edu"
                value={editFormData.contactEmail}
                onChange={handleEditChange}
              />

              <Input
                label="Contact Phone (Optional)"
                name="contactPhone"
                placeholder="e.g. 9876543210"
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
                placeholder="e.g. dean@college.edu"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
              />

              <Input
                label="Admin Full Name (Optional)"
                name="name"
                placeholder="e.g. Dr. John Doe"
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
    </>
  );
};

export default CollegeManagement;

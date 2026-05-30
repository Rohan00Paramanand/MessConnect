import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { School, Check, X, ShieldAlert, Plus, ToggleLeft, ToggleRight, Mail, Phone } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const CollegeManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      const { data } = await api.get('/api/superadmin/colleges');
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
      // Split domains by comma, trim whitespace
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

      const { data } = await api.post('/api/superadmin/colleges', payload);
      toast.success('College registered successfully!');
      
      // Reset form
      setFormData({
        name: '',
        slug: '',
        allowedDomains: '',
        contactEmail: '',
        contactPhone: ''
      });

      // Add to list
      setColleges([...colleges, data.data]);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to register college');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const { data } = await api.patch(`/api/superadmin/colleges/${id}/status`, { isActive: newStatus });
      toast.success(`College ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      
      // Update local state
      setColleges(colleges.map(c => c._id === id ? data.data : c));
    } catch {
      toast.error('Failed to update college status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">College Management</h1>
          <p className="text-sm font-medium text-gray-500">Configure colleges and register email routing rules.</p>
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
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <School className="text-violet-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Registered Colleges</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-4 text-sm font-bold text-gray-600 w-2/5">College / Slug</th>
                  <th className="p-4 text-sm font-bold text-gray-600 w-1/4">Email Domains</th>
                  <th className="p-4 text-sm font-bold text-gray-600 w-1/4">Contact</th>
                  <th className="p-4 text-sm font-bold text-gray-600 w-auto text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading colleges...</td></tr>
                ) : colleges.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500">No colleges registered yet. Use the form to add one.</td></tr>
                ) : (
                  colleges.map((college) => (
                    <tr key={college._id} className="hover:bg-white/60 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{college.name}</p>
                        <p className="text-xs text-gray-500 font-mono">slug: {college.slug}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {college.allowedDomains.map((domain, index) => (
                            <span key={index} className="px-1.5 py-0.5 text-xs font-bold bg-violet-50 text-violet-700 rounded-md border border-violet-100">
                              @{domain}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 space-y-0.5 text-xs text-gray-500 font-medium">
                        {college.contactEmail && (
                          <p className="flex items-center gap-1"><Mail size={12} /> {college.contactEmail}</p>
                        )}
                        {college.contactPhone && (
                          <p className="flex items-center gap-1"><Phone size={12} /> {college.contactPhone}</p>
                        )}
                        {!college.contactEmail && !college.contactPhone && (
                          <p className="text-gray-400">N/A</p>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(college._id, college.isActive)}
                          title={college.isActive ? 'Deactivate College' : 'Activate College'}
                          className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
                        >
                          {college.isActive ? (
                            <div className="flex flex-col items-center">
                              <ToggleRight className="text-emerald-500 h-8 w-8" />
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Active</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <ToggleLeft className="text-gray-300 h-8 w-8" />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Inactive</span>
                            </div>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeManagement;

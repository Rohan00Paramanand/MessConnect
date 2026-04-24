import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Users, Plus, X, Trash2, Phone, Briefcase, DollarSign, CalendarDays } from 'lucide-react';

const roleColors = { Cook: 'bg-orange-100 text-orange-700', Cleaner: 'bg-blue-100 text-blue-700', Cashier: 'bg-green-100 text-green-700', Manager: 'bg-purple-100 text-purple-700' };

const StaffDirectory = () => {
  const { user } = useAuthStore();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', role: 'Cook', joiningDate: '', salary: '', isActive: true });

  const fetchStaff = async () => {
    try { const { data } = await api.get('/api/staff'); setStaff(data.data || data); }
    catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchStaff(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    try {
      const payload = { ...formData, salary: Number(formData.salary) };
      const { data } = await api.post('/api/staff', payload);
      if (data.status === 'success') {
        toast.success('Staff member added!'); setStaff([...staff, data.data]);
        setShowForm(false); setFormData({ name: '', phoneNumber: '', role: 'Cook', joiningDate: '', salary: '', isActive: true });
      }
    } catch { toast.error('Failed to add staff'); } finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove staff member?')) return;
    try { await api.delete(`/api/staff/${id}`); setStaff(staff.filter(s => s._id !== id)); toast.success('Removed!'); }
    catch { toast.error('Error removing staff'); }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 bg-gradient-to-r from-slate-800 via-gray-900 to-slate-900 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -left-16 -top-16 w-64 h-64 bg-teal-500/20 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Users size={20} />
              </div>
              <span className="text-white/70 text-sm font-bold uppercase tracking-widest">Directory</span>
            </div>
            <h1 className="text-3xl font-black mb-1">Staff Management</h1>
            <p className="text-white/70 font-medium">
              {user?.role === 'vendor' ? 'Manage your mess workers and their roles' : 'View the active staff directory'}
            </p>
          </div>
          {user?.role === 'vendor' && (
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-2xl text-white font-bold text-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5">
              {showForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> Add Staff</>}
            </button>
          )}
        </div>
        <div className="relative z-10 mt-6 flex gap-6">
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Total Staff</p>
            <p className="text-3xl font-black">{staff.length}</p>
          </div>
          <div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider">Active</p>
            <p className="text-3xl font-black text-green-400">{staff.filter(s => s.isActive).length}</p>
          </div>
        </div>
      </div>

      {/* Add Staff Form */}
      {showForm && user?.role === 'vendor' && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-8 animate-fade-in">
          <h3 className="text-xl font-black text-gray-900 mb-6">New Staff Member</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input label="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input label="Phone Number" required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                <select className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/40" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="Cook">Cook</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <Input label="Joining Date" type="date" required value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
              <Input label="Monthly Salary (₹)" type="number" required value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} />
            </div>
            <Button type="submit" variant="primary" disabled={formLoading}>
              {formLoading ? 'Adding...' : '+ Save Staff Member'}
            </Button>
          </form>
        </div>
      )}

      {/* Staff Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center p-16 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50">
          <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Users className="text-gray-400" size={28} />
          </div>
          <h3 className="font-bold text-gray-700 mb-1">No staff listed</h3>
          <p className="text-gray-400 text-sm">Add staff members to populate the directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staff.map(member => (
            <div key={member._id} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[1.5rem] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {member.name.charAt(0)}
                </div>
                <div className="flex gap-2">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-xl ${roleColors[member.role] || 'bg-gray-100 text-gray-700'}`}>
                    {member.role}
                  </span>
                  {user?.role === 'vendor' && (
                    <button onClick={() => handleDelete(member._id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-black text-gray-900 mb-1">{member.name}</h3>
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone size={14} className="text-gray-400" />
                  <span className="font-medium">{member.phoneNumber}</span>
                </div>
                {member.joiningDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarDays size={14} className="text-gray-400" />
                    <span>Since {new Date(member.joiningDate).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})}</span>
                  </div>
                )}
                {user?.role === 'vendor' && member.salary && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="font-bold text-gray-700">₹{member.salary.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${member.isActive ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-red-400'}`}></span>
                  {member.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default StaffDirectory;

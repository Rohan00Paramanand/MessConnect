import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { School, Plus, ToggleLeft, ToggleRight, Edit2, Check, X, Loader, Calendar } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAuthStore from '../../store/useAuthStore';

const MessManagement = () => {
  const { user, activeCollege } = useAuthStore();
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newName, setNewName] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchMesses = useCallback(async () => {
    if (user?.role === 'super_admin' && !activeCollege) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get('/messes/admin');
      setMesses(data.data || []);
    } catch {
      toast.error('Failed to load messes list');
    } finally {
      setLoading(false);
    }
  }, [user?.role, activeCollege]);

  useEffect(() => {
    fetchMesses();
  }, [fetchMesses]);

  const handleCreateMess = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Mess name is required');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/messes/admin', { name: newName.trim() });
      toast.success('Mess registered successfully!');
      setNewName('');
      setMesses(prev => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register mess');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const { data } = await api.put(`/messes/admin/${id}`, { isActive: newStatus });
      toast.success(`Mess ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      setMesses(prev => prev.map(m => m._id === id ? data.data : m));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleStartEdit = (mess) => {
    setEditingId(mess._id);
    setEditName(mess.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      const { data } = await api.put(`/messes/admin/${id}`, { name: editName.trim() });
      toast.success('Mess name updated!');
      setMesses(prev => prev.map(m => m._id === id ? data.data : m));
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update mess name');
    }
  };

  if (user?.role === 'super_admin' && !activeCollege) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4 shadow-xs">
          <School size={32} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Select a Campus to Manage Messes</h2>
        <p className="text-gray-500 text-sm mt-2 max-w-md">
          As Trust Super Admin, choose any campus from the Trust College Selector in the top navigation bar to create and configure dining halls and mess facilities for that college.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-5 sm:p-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-[0_8px_30px_rgba(79,70,229,0.25)] group">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase mb-3 border border-white/20">
              <School size={12} /> Mess Configurations
            </p>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Manage College Messes
            </h1>
            <p className="text-indigo-100 font-medium mt-3 max-w-md text-sm sm:text-base">
              Register college dining facilities, manage active statuses, and configure portals.
            </p>
          </div>

          <NavLink
            to="/visits"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-700 font-bold shadow-lg hover:bg-indigo-50 hover:shadow-xl hover:scale-105 active:scale-95 transition-all self-start md:self-auto flex-shrink-0"
          >
            <Plus size={18} /> Schedule New Visit
          </NavLink>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Register Mess Form */}
        <div className="lg:col-span-1 glass-panel p-4 sm:p-6 border border-white/60 shadow-xl shadow-gray-200/40 rounded-2xl sm:rounded-3xl space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Plus className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Add New Mess</h2>
          </div>

          <form onSubmit={handleCreateMess} className="space-y-4">
            <Input
              label="Mess Name"
              placeholder="e.g. Adhik Boys Mess"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {submitting ? 'Registering...' : 'Register Mess'}
            </Button>
          </form>
        </div>

        {/* Registered Messes List */}
        <div className="lg:col-span-2 glass-panel border border-white/60 shadow-xl shadow-gray-200/40 rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School className="text-indigo-600" size={20} />
              <h2 className="text-lg font-bold text-gray-900">Registered Messes</h2>
            </div>
            <span className="text-xs text-gray-400 font-semibold">{messes.length} total</span>
          </div>

          <div className="overflow-x-auto responsive-table-wrapper">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-4 text-sm font-bold text-gray-600 w-2/3">Mess Name</th>
                  <th className="p-4 text-sm font-bold text-gray-600 w-1/4 text-center">Status</th>
                  <th className="p-4 text-sm font-bold text-gray-600 w-auto text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-500 font-medium">
                      <div className="flex justify-center items-center gap-2">
                        <Loader className="animate-spin text-indigo-600" size={16} />
                        Loading messes...
                      </div>
                    </td>
                  </tr>
                ) : messes.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-500">
                      No messes registered yet. Use the form to add one.
                    </td>
                  </tr>
                ) : (
                  messes.map((mess) => (
                    <tr key={mess._id} className="hover:bg-white/60 transition-colors">
                      <td className="p-4">
                        {editingId === mess._id ? (
                          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                            <input
                              type="text"
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                            <button
                              onClick={() => handleSaveEdit(mess._id)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900">{mess.name}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(mess._id, mess.isActive)}
                          title={mess.isActive ? 'Deactivate Mess' : 'Activate Mess'}
                          className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
                        >
                          {mess.isActive ? (
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
                      <td className="p-4 text-right">
                        <NavLink
                          to="/visits"
                          title="Schedule inspection visit for this mess"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors mr-2"
                        >
                          <Calendar size={13} /> Visit
                        </NavLink>
                        {editingId !== mess._id && (
                          <button
                            onClick={() => handleStartEdit(mess)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-100"
                            title="Edit Name"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
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

export default MessManagement;

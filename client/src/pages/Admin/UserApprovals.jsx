import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

const UserApprovals = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/api/admin/pending-users');
      setUsers(data.data || []);
    } catch {
      toast.error('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/admin/approve-user/${id}`);
      toast.success('User approved successfully!');
      setUsers(users.filter(u => u._id !== id));
    } catch {
      toast.error('Failed to approve user');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
      </div>

      <div className="glass-panel overflow-hidden border border-white/40 shadow-xl shadow-gray-200/40 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 text-sm font-bold text-gray-600 w-1/3">User Details</th>
                <th className="p-4 text-sm font-bold text-gray-600 w-1/4">Role</th>
                <th className="p-4 text-sm font-bold text-gray-600 w-1/4">Organization / Details</th>
                <th className="p-4 text-sm font-bold text-gray-600 w-auto">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No pending approvals! You are fully caught up.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-white/60 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email} • {user.phoneNumber}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'vendor' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.role === 'vendor' ? user.companyName : `${user.department || 'N/A'} - ${user.branch || 'N/A'}`}
                    </td>
                    <td className="p-4">
                      <Button onClick={() => handleApprove(user._id)} variant="primary" className="text-xs bg-indigo-600 hover:bg-indigo-700">
                        <CheckCircle size={16} className="mr-1 inline" /> Approve
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserApprovals;

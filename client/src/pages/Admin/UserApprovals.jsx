import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

const UserApprovals = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denyingUser, setDenyingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [denying, setDenying] = useState(false);

  const fetchPending = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/pending-users');
      setUsers(data.data || []);
    } catch {
      toast.error('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPending();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPending]);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/admin/approve-user/${id}`);
      toast.success('User approved successfully!');
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleDeny = async () => {
    if (!denyingUser) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setDenying(true);
    try {
      await api.post(`/api/admin/deny-user/${denyingUser._id}`, { reason: rejectionReason });
      toast.success('User registration request denied');
      setUsers(users.filter(u => u._id !== denyingUser._id));
      setDenyingUser(null);
      setRejectionReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deny user');
    } finally {
      setDenying(false);
    }
  };

  return (
    <>
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
                        {user.role === 'vendor' ? user.companyName : 'N/A'}
                      </td>
                      <td className="p-4 flex gap-2">
                        <Button onClick={() => handleApprove(user._id)} variant="primary" className="text-xs bg-indigo-600 hover:bg-indigo-700">
                          <CheckCircle size={16} className="mr-1 inline" /> Approve
                        </Button>
                        <Button onClick={() => setDenyingUser(user)} variant="danger" className="text-xs">
                          <XCircle size={16} className="mr-1 inline" /> Deny
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

      {denyingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/40 relative">
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
                onClick={handleDeny}
                disabled={denying || !rejectionReason.trim()}
              >
                {denying ? 'Denying...' : 'Send & Deny'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserApprovals;

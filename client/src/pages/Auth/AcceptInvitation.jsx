import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const token = searchParams.get('token');

  const [invitationLoading, setInvitationLoading] = useState(true);
  const [invitationError, setInvitationError] = useState('');
  const [loading, setLoading] = useState(false);

  const [invitationData, setInvitationData] = useState({
    email: '',
    collegeName: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token) {
      setInvitationError('No invitation token provided. Please check your link.');
      setInvitationLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const { data } = await api.get(`/api/auth/invitation/${token}`);
        if (data.status === 'success') {
          setInvitationData({
            email: data.data.email,
            collegeName: data.data.collegeName
          });
        } else {
          setInvitationError(data.message || 'Invalid or expired invitation link.');
        }
      } catch (error) {
        setInvitationError(error.response?.data?.message || 'Invalid or expired invitation link.');
      } finally {
        setInvitationLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/accept-invitation', {
        token,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      });

      if (data.status === 'success') {
        toast.success('Registration successful! Logging in...');
        setAuth(data.user, data.token);
        navigate(`/dashboard/${data.user.role}`);
      } else {
        toast.error(data.message || 'Failed to complete registration');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  if (invitationLoading) {
    return (
      <div className="min-h-screen auth-gradient flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          <p className="mt-4 text-sm font-semibold text-violet-700 animate-pulse">Verifying invitation token...</p>
        </div>
      </div>
    );
  }

  if (invitationError) {
    return (
      <div className="min-h-screen auth-gradient flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in">
          <div className="glass-panel py-10 px-6 shadow-2xl shadow-gray-400/20 sm:rounded-3xl sm:px-12 border border-white/60 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Invalid Invitation Link</h3>
            <p className="text-sm text-gray-500 mb-8">{invitationError}</p>
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen auth-gradient flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-indigo-600/20">
            <span className="text-white font-black text-3xl">M</span>
          </div>
        </div>
        <h2 className="mt-2 text-center text-4xl font-black tracking-tight text-gray-900">Complete Admin Setup</h2>
        <p className="mt-3 text-center text-sm font-medium text-gray-500">
          Setup your profile for <span className="font-bold text-violet-600">{invitationData.collegeName}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel py-10 px-6 shadow-2xl shadow-gray-400/20 sm:rounded-3xl sm:px-12 border border-white/60">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  disabled
                  value={invitationData.email}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed"
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned College</label>
                <input
                  type="text"
                  disabled
                  value={invitationData.collegeName}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed"
                />
              </div>

              <Input
                label="Full Name"
                name="name"
                required
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={handleChange}
              />

              <Input
                label="Phone Number"
                name="phoneNumber"
                required
                placeholder="10 digit number"
                value={formData.phoneNumber}
                onChange={handleChange}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-2xl text-xs text-violet-800 space-y-1 font-medium">
              <p className="font-bold text-violet-900">Security Note:</p>
              <p>Your password must contain at least 8 characters, with at least one uppercase letter, one lowercase letter, and one special character.</p>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loading} variant="primary">
              {loading ? 'Completing Registration...' : 'Accept Invitation & Access Dashboard'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;

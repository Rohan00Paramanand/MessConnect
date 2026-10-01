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
      setTimeout(() => {
        setInvitationError('No invitation token provided. Please check your link.');
        setInvitationLoading(false);
      }, 0);
      return;
    }

    const verifyToken = async () => {
      try {
        const { data } = await api.get(`/auth/invitation/${token}`);
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
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      const sanitized = value.replace(/\D/g, '');
      if (sanitized.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: sanitized }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
  const upperCaseRegex = /[A-Z]/;
  const lowerCaseRegex = /[a-z]/;

  const passwordValidations = {
    hasMinLength: formData.password.length >= 8 && formData.password.length <= 50,
    hasUpper: upperCaseRegex.test(formData.password),
    hasLower: lowerCaseRegex.test(formData.password),
    hasSpecial: specialCharRegex.test(formData.password),
    matchesConfirm: formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
  };

  const isPasswordValid = 
    passwordValidations.hasMinLength &&
    passwordValidations.hasUpper &&
    passwordValidations.hasLower &&
    passwordValidations.hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (formData.name.trim().length < 3) {
      toast.error('Full Name must be at least 3 characters long');
      return;
    }

    if (formData.name.trim().length > 50) {
      toast.error('Full Name cannot exceed 50 characters');
      return;
    }

    if (!formData.phoneNumber) {
      toast.error('Please provide a phone number');
      return;
    }

    const cleanedPhone = formData.phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits long');
      return;
    }

    if (!formData.password) {
      toast.error('Please enter a password');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (formData.password.length > 50) {
      toast.error('Password cannot exceed 50 characters');
      return;
    }

    if (!upperCaseRegex.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter (A-Z)');
      return;
    }

    if (!lowerCaseRegex.test(formData.password)) {
      toast.error('Password must contain at least one lowercase letter (a-z)');
      return;
    }

    if (!specialCharRegex.test(formData.password)) {
      toast.error('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/accept-invitation', {
        token,
        name: formData.name.trim(),
        phoneNumber: cleanedPhone,
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
      const errorData = error.response?.data;
      let errorMsg = 'Failed to complete registration';
      if (typeof errorData?.message === 'string' && errorData.message) {
        errorMsg = errorData.message;
      } else if (typeof errorData?.error === 'string' && errorData.error) {
        errorMsg = errorData.error;
      } else if (Array.isArray(errorData?.errors)) {
        errorMsg = errorData.errors.map(e => e.message || JSON.stringify(e)).join(', ');
      } else if (Array.isArray(errorData?.error)) {
        errorMsg = errorData.error.map(e => e.message || JSON.stringify(e)).join(', ');
      }
      toast.error(errorMsg);
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
          <div className="flex justify-center mb-4 sm:mb-6">
            <img
              src="/pcet.png"
              alt="PCET MessConnect Logo"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-xl shadow-gray-900/20 ring-1 ring-gray-200"
            />
          </div>
          <div className="glass-panel py-10 px-6 shadow-2xl shadow-gray-400/20 sm:rounded-3xl sm:px-12 border border-white/60 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-rose-100 text-rose-600 mb-6 ring-8 ring-rose-50">
              <svg className="h-8 w-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Invalid Invitation Link</h3>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed font-medium">{invitationError}</p>
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Return to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen auth-gradient flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden select-none">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

      <div className="w-full max-w-xl relative z-10 my-auto">
        <div className="text-center animate-fade-in mb-6 sm:mb-8">
          <div className="flex justify-center mb-4 sm:mb-6">
            <img
              src="/pcet.png"
              alt="PCET MessConnect Logo"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-xl shadow-gray-900/20 ring-1 ring-gray-200"
            />
          </div>
          <h2 className="mt-2 text-center text-3xl sm:text-4xl font-black tracking-tight text-gray-900">Complete Admin Setup</h2>
          <p className="mt-2 sm:mt-3 text-center text-xs sm:text-sm font-medium text-gray-500">
            Setup your profile for <span className="font-bold text-violet-600">{invitationData.collegeName}</span>
          </p>
        </div>

        <div className="glass-panel py-6 px-4 sm:py-10 sm:px-12 shadow-2xl shadow-gray-400/20 rounded-2xl sm:rounded-3xl border border-white/60 animate-fade-in" style={{ animationDelay: '0.1s' }}>
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

              <div className="space-y-1">
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10 digit number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
                <p className="text-[10px] text-gray-400 font-semibold px-1">Exactly 10 digits</p>
              </div>

              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <p className="text-[10px] text-gray-400 font-semibold px-1">
                  Min 8 chars, 1 uppercase, 1 lowercase, 1 special char
                </p>
              </div>

              <div className="space-y-1">
                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword ? (
                  <p className="text-[10px] text-red-500 font-semibold px-1">
                    Passwords do not match
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400 font-semibold px-1">
                    Re-enter your password
                  </p>
                )}
              </div>

              {/* Real-time Password Compliance Requirements */}
              {formData.password && (
                <div className="w-full md:col-span-2 p-3 bg-violet-50/60 backdrop-blur-sm rounded-xl border border-violet-200/70 text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Password Compliance</span>
                    <span className={`text-[11px] font-semibold ${isPasswordValid ? 'text-violet-700' : 'text-amber-600'}`}>
                      {isPasswordValid ? 'All specifications met' : 'Requirements pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className={`flex items-center gap-1.5 transition-colors ${passwordValidations.hasMinLength ? 'text-violet-800 font-medium' : 'text-gray-500'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordValidations.hasMinLength ? 'bg-violet-200 text-violet-800 font-bold' : 'bg-gray-200 text-gray-400'}`}>
                        {passwordValidations.hasMinLength ? '✓' : '•'}
                      </span>
                      8 to 50 characters
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors ${passwordValidations.hasUpper ? 'text-violet-800 font-medium' : 'text-gray-500'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordValidations.hasUpper ? 'bg-violet-200 text-violet-800 font-bold' : 'bg-gray-200 text-gray-400'}`}>
                        {passwordValidations.hasUpper ? '✓' : '•'}
                      </span>
                      1 uppercase letter (A-Z)
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors ${passwordValidations.hasLower ? 'text-violet-800 font-medium' : 'text-gray-500'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordValidations.hasLower ? 'bg-violet-200 text-violet-800 font-bold' : 'bg-gray-200 text-gray-400'}`}>
                        {passwordValidations.hasLower ? '✓' : '•'}
                      </span>
                      1 lowercase letter (a-z)
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors ${passwordValidations.hasSpecial ? 'text-violet-800 font-medium' : 'text-gray-500'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordValidations.hasSpecial ? 'bg-violet-200 text-violet-800 font-bold' : 'bg-gray-200 text-gray-400'}`}>
                        {passwordValidations.hasSpecial ? '✓' : '•'}
                      </span>
                      1 special char (!@#$...)
                    </div>
                  </div>
                </div>
              )}
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

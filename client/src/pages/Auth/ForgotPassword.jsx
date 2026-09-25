import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import OtpInput from '../../components/ui/OtpInput';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [otpStep, setOtpStep] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // 60-second countdown timer when in OTP verification step
  useEffect(() => {
    let intervalId;
    if (otpStep && resendTimer > 0) {
      intervalId = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [otpStep, resendTimer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Please provide an email address');
      return;
    }

    setSendingOtp(true);
    try {
      const { data } = await api.post('/auth/send-reset-otp', { email: formData.email });
      if (data.status === 'success') {
        toast.success('OTP sent successfully!');
        setOtpStep(true);
        setResendTimer(60);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendingOtp) return;

    setResendingOtp(true);
    try {
      const { data } = await api.post('/auth/send-reset-otp', { email: formData.email });
      if (data.status === 'success') {
        toast.success('New reset OTP sent successfully!');
        setResendTimer(60);
        setFormData((prev) => ({ ...prev, otp: '' }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendingOtp(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      };

      const { data } = await api.post('/auth/reset-password', submitData);

      if (data.status === 'success' || data.message === 'Password reset successfully') {
        toast.success('Password reset successfully! Please login with your new password.');
        navigate('/login');
      }
    } catch (error) {
      if (error.response?.data?.error && Array.isArray(error.response.data.error)) {
        // It's a Zod validation error array
        const firstError = error.response.data.error[0];
        toast.error(firstError.message || 'Invalid password format');
      } else {
        toast.error(error.response?.data?.message || 'Something went wrong while resetting password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-gradient flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden select-none">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-rose-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in">
        <div className="flex justify-center mb-6">
          <img
            src="/pcet.png"
            alt="PCET MessConnect Logo"
            className="w-16 h-16 rounded-2xl object-cover shadow-xl shadow-gray-900/20 ring-1 ring-gray-200"
          />
        </div>
        <h2 className="mt-2 text-center text-4xl font-black tracking-tight text-gray-900">Reset Password</h2>
        <p className="mt-3 text-center text-sm font-medium text-gray-500">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-teal-600 hover:text-teal-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel py-10 px-6 shadow-2xl shadow-gray-400/20 sm:rounded-3xl sm:px-12 border border-white/60">

          {!otpStep ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="flex flex-col gap-5">
                <Input
                  label="Email address"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <Button type="submit" className="w-full mt-4" disabled={sendingOtp} variant="primary">
                {sendingOtp ? 'Sending OTP...' : 'Send Reset OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">OTP Sent!</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Please check your email for the 6-digit code.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center mb-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Enter 6-digit OTP</label>
                <OtpInput
                  value={formData.otp}
                  length={6}
                  onChange={(val) => setFormData((prev) => ({ ...prev, otp: val }))}
                />
              </div>

              {/* 1-Minute Resend Timer / Action */}
              <div className="flex items-center justify-center text-sm mb-4">
                {resendTimer > 0 ? (
                  <p className="text-gray-500 font-medium">
                    Resend OTP in{' '}
                    <span className="font-bold text-teal-600">
                      {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Didn't receive code?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendingOtp}
                      className="font-bold text-teal-600 hover:text-teal-700 underline focus:outline-none transition-colors disabled:opacity-50"
                    >
                      {resendingOtp ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <Button type="submit" disabled={loading} variant="primary" className="w-full">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
                <button type="button" onClick={() => setOtpStep(false)} className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
                  Go back and edit email
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

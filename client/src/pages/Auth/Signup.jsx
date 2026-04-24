import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const Signup = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    phoneNumber: '',
    department: '',
    branch: '',
    year: '',
    messType: 'card',
    companyName: '',
    messAssigned: '',
    otp: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email && !formData.phoneNumber) {
      toast.error('Please provide an email or phone number');
      return;
    }
    
    // Quick frontend validation for password length
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setSendingOtp(true);
    try {
      const { data } = await api.post('/api/auth/send-otp', { email: formData.email, phoneNumber: formData.phoneNumber });
      if (data.status === 'success') {
        toast.success('OTP sent successfully!');
        setOtpStep(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // Send the entire form to standard signup which now requires 'otp'
      // Parse year to number for backend mapping
      const submitData = { ...formData, year: formData.year ? Number(formData.year) : undefined };

      const { data } = await api.post('/api/auth/signup', submitData);
      if (data.user || data.data) { // Depending on the actual response envelope
        const payload = data.data || data;
        setAuth(payload.user || data.user, payload.token || data.token || null);
        toast.success('Account verified and created seamlessly!');
        navigate(`/login`); // Or navigate to dashboard if token exists
      } else {
        toast.success('Account created, please refresh or log in.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong during signup');
    } finally {
      setLoading(false);
    }
  };

  const roleThemes = {
    student: 'bg-teal-500/10 border-teal-200 shadow-teal-500/5',
    vendor: 'bg-coral-500/10 border-coral-200 shadow-rose-500/5',
    mess_committee: 'bg-amber-500/10 border-amber-200 shadow-amber-500/5'
  };

  return (
    <div className="min-h-screen auth-gradient flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in">
         <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-xl shadow-gray-900/20">
            <span className="text-white font-black text-3xl">M</span>
          </div>
        </div>
        <h2 className="mt-2 text-center text-4xl font-black tracking-tight text-gray-900">Get started</h2>
        <p className="mt-3 text-center text-sm font-medium text-gray-500">
          Already a member?{' '}
          <Link to="/login" className="font-bold text-teal-600 hover:text-teal-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 animate-fade-in" style={{animationDelay: '0.1s'}}>
        <div className="glass-panel py-10 px-6 shadow-2xl shadow-gray-400/20 sm:rounded-3xl sm:px-12 border border-white/60">
          
          {!otpStep ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Full Name" name="name" required value={formData.name} onChange={handleChange} />
                <Input label="Email address" type="email" name="email" required value={formData.email} onChange={handleChange} />
                <Input label="Password" type="password" name="password" required value={formData.password} onChange={handleChange} />
                <Input label="Phone Number" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} />
                
                <div className="w-full md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">I am registering as</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['student', 'vendor', 'mess_committee'].map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({...formData, role})}
                        className={`py-2 px-3 text-sm font-bold rounded-xl border transition-all ${formData.role === role ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                      >
                        {role === 'mess_committee' ? 'Committee' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`mt-6 p-6 rounded-2xl border backdrop-blur-sm transition-colors duration-300 ${roleThemes[formData.role]}`}>
                {formData.role === 'student' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <Input label="Department" name="department" required value={formData.department} onChange={handleChange} />
                    <Input label="Branch" name="branch" required value={formData.branch} onChange={handleChange} />
                    <Input label="Year" name="year" type="number" required value={formData.year} onChange={handleChange} />
                    
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mess Type</label>
                      <select
                        name="messType"
                        value={formData.messType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="card">Card Based</option>
                        <option value="per-meal">Per-Meal Based</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.role === 'vendor' && (
                  <div className="space-y-4 animate-fade-in">
                    <Input label="Registered Company Name" name="companyName" required value={formData.companyName} onChange={handleChange} />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Mess</label>
                      <select 
                        name="messAssigned" 
                        required
                        value={formData.messAssigned} 
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500"
                      >
                        <option disabled value="">Select Mess</option>
                        <option value="Adhik boys mess">Adhik boys mess</option>
                        <option value="Samruddhi Girls mess">Samruddhi Girls mess</option>
                        <option value="New girls mess">New girls mess</option>
                      </select>
                    </div>

                    <div className="p-3 bg-white/40 rounded-lg text-sm text-rose-800 font-bold border border-rose-200">
                       Vendor accounts will require administrative review and verification before login is permitted.
                    </div>
                  </div>
                )}

                {formData.role === 'mess_committee' && (
                   <div className="space-y-4 animate-fade-in">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input label="Department" name="department" required value={formData.department} onChange={handleChange} />
                       <Input label="Branch" name="branch" required value={formData.branch} onChange={handleChange} />
                     </div>
                     <div className="p-3 bg-white/40 rounded-lg text-sm text-amber-800 font-bold border border-amber-200">
                       Committee accounts will require administrative review and verification before login is permitted.
                     </div>
                   </div>
                )}
              </div>

              <Button type="submit" className="w-full mt-4" disabled={sendingOtp} variant="primary">
                {sendingOtp ? 'Sending OTP...' : 'Continue to Verification'}
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
                  Please check your email/phone for the 6-digit code.
                </p>
              </div>

              <Input 
                label="Enter 6-digit OTP" 
                name="otp" 
                type="text" 
                maxLength="6"
                required 
                className="text-center tracking-widest text-xl h-12"
                value={formData.otp} 
                onChange={handleChange} 
              />
              
              <div className="flex flex-col gap-3 mt-6">
                <Button type="submit" disabled={loading} variant="primary" className="w-full">
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </Button>
                <button type="button" onClick={() => setOtpStep(false)} className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
                  Go back and edit details
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Signup;

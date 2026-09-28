import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import { MessageSquare, Star, Bell, ArrowRight, TrendingUp, ThumbsUp, Utensils, Camera, CreditCard, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import MealPurchaseModal from '../../components/meals/MealPurchaseModal';
import FaceRegistrationModal from '../../components/meals/FaceRegistrationModal';

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const [trendingComplaints, setTrendingComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Meal Pass and Biometrics state
  const [mealPass, setMealPass] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);

  const fetchMealPass = async () => {
    try {
      const { data } = await api.get('/meals/my-pass');
      setMealPass(data.data?.pass || null);
    } catch {
      console.error('Failed to load meal pass');
    }
  };

  useEffect(() => {
    fetchMealPass();
    const fetchComplaints = async () => {
      try {
        const { data } = await api.get('/complaints');
        const list = data.data || data;
        const activeComplaints = list.filter(c => c.status === 'pending' || c.status === 'assigned');
        const sorted = activeComplaints.sort((a, b) => {
          const aVotes = a.upvotes?.length || 0;
          const bVotes = b.upvotes?.length || 0;
          if (aVotes !== bVotes) return bVotes - aVotes;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setTrendingComplaints(sorted.slice(0, 3)); // Top 3
      } catch {
        console.error('Failed to load recent complaints');
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const handleUpvote = async (id) => {
    try {
      await api.post(`/complaints/${id}/upvote`);
      toast.success('Vote updated.');
      setTrendingComplaints(prev => prev.map(c => {
         if (c._id === id) {
             const votes = c.upvotes || [];
             const hasVoted = votes.includes(user._id);
             return { ...c, upvotes: hasVoted ? votes.filter(v => v !== user._id) : [...votes, user._id] };
         }
         return c;
      }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to record vote');
    }
  };

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-5 sm:p-10 bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-700 text-white shadow-[0_8px_30px_rgba(20,184,166,0.2)] group">
        <div className="absolute -right-12 -top-12 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Welcome,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-100 to-white">{user?.name}</span>
          </h1>
          <p className="text-teal-100 font-medium mt-2 sm:mt-3 max-w-md text-sm sm:text-base">Manage your mess details, provide feedback, or check today's notices.</p>
          <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full sm:max-w-sm">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-teal-50 mb-1.5">
              <span className="flex items-center gap-1">🛡️ Trust Score</span>
              <span>{user?.trustMeter ?? 100}%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  (user?.trustMeter ?? 100) >= 80 ? 'bg-emerald-300' :
                  (user?.trustMeter ?? 100) >= 50 ? 'bg-amber-300' :
                  'bg-red-400'
                }`}
                style={{ width: `${user?.trustMeter ?? 100}%` }}
              ></div>
            </div>
            {user?.bannedUntil && new Date() < new Date(user.bannedUntil) ? (
              <p className="text-[10px] text-red-200 mt-1.5 font-bold">
                Suspended until {new Date(user.bannedUntil).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-[10px] text-teal-100/80 mt-1.5 font-medium">
                {(user?.trustMeter ?? 100) === 100 ? 'Excellent! Thank you for filing genuine reports.' : 'Genuine resolved reports restore your score by +10.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Biometric Meal Pass & Recharge Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Meal Balance */}
          <div className="flex items-start sm:items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
              (mealPass?.remainingMeals || 0) > 0
                ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-teal-500/20'
                : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/20'
            }`}>
              <Utensils size={28} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Biometric Mess Pass
                </span>
                {(mealPass?.remainingMeals || 0) <= 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 flex items-center gap-1">
                    <AlertCircle size={10} /> Meals Ended
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Active Pass
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl sm:text-4xl font-black ${
                  (mealPass?.remainingMeals || 0) > 0 ? 'text-gray-900' : 'text-rose-600'
                }`}>
                  {mealPass?.remainingMeals ?? 0}
                </span>
                <span className="text-sm font-bold text-gray-500">Meals Remaining</span>
              </div>

              {(mealPass?.remainingMeals || 0) <= 0 && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  ⚠️ Your meal credits are depleted! Please recharge below to allow mess facial check-in.
                </p>
              )}
            </div>
          </div>

          {/* Right: Face Biometric Enrollment Status & Quick CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
            {/* Biometric Status Pill */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
              {mealPass?.facePhoto ? (
                <img
                  src={mealPass.facePhoto}
                  alt="Registered Face"
                  className="w-8 h-8 rounded-full object-cover border-2 border-teal-500"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Camera size={16} />
                </div>
              )}
              <div>
                <p className="font-bold text-gray-800">
                  {mealPass?.isFaceRegistered ? 'Biometric Enrolled' : 'Face Not Enrolled'}
                </p>
                <p className="text-[10px] text-gray-500">
                  {mealPass?.isFaceRegistered ? 'Ready for touchless entry' : 'Required for attendance'}
                </p>
              </div>
            </div>

            {/* Face Register Button */}
            <button
              onClick={() => setIsFaceModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 hover:border-teal-500 hover:bg-teal-50 text-gray-700 hover:text-teal-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Camera size={15} />
              <span>{mealPass?.isFaceRegistered ? 'Update Face' : 'Register Face'}</span>
            </button>

            {/* Recharge Meals Button */}
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 transition-all flex items-center gap-2"
            >
              <CreditCard size={15} />
              <span>Recharge Meals</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/complaints', label: 'Status', title: 'Complaints', Icon: MessageSquare, color: 'text-blue-600', bg: 'from-blue-100 to-blue-50', hover: 'hover:text-teal-600' },
          { to: '/feedback',   label: 'Today',  title: 'Feedback',   Icon: Star,           color: 'text-amber-500', bg: 'from-amber-100 to-orange-50', hover: 'hover:text-amber-500' },
          { to: '/notices',    label: 'Updates', title: 'Notices',   Icon: Bell,           color: 'text-purple-600', bg: 'from-purple-100 to-violet-50', hover: 'hover:text-purple-600' },
          { to: '/timetable',  label: 'Menu',   title: 'Timetable', Icon: ArrowRight,     color: 'text-teal-600', bg: 'from-teal-100 to-emerald-50', hover: 'hover:text-teal-500' },
        ].map((item) => {
          const { to, label, title, Icon, color, bg, hover } = item;
          return (
            <NavLink key={to} to={to} className={`bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/90 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200`}>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className={`text-xl font-black text-gray-900 ${hover} transition-colors`}>{title}</h3>
              </div>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
                <Icon size={22} strokeWidth={2.5} />
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Trending Complaints Section */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mt-4 sm:mt-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">Trending Issues</h2>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Top reported active problems in the mess</p>
            </div>
          </div>
          <Link to="/complaints" className="hidden sm:flex text-sm font-bold text-teal-600 hover:text-teal-700 items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-gray-200 border-t-rose-500 rounded-full animate-spin"></div></div>
        ) : trendingComplaints.length === 0 ? (
          <div className="text-center p-6 sm:p-8 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500 font-medium text-sm">No trending issues at the moment. Everything is running smoothly!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {trendingComplaints.map(complaint => (
              <div key={complaint._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 bg-white border border-gray-100 rounded-xl sm:rounded-2xl hover:shadow-md transition-all hover:border-gray-200">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-wider rounded-lg">
                      {complaint.category}
                    </span>
                    {complaint.mess?.name && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase tracking-wider rounded-lg">
                        🏛️ {complaint.mess.name}
                      </span>
                    )}
                    <h3 className="font-bold text-gray-900 text-lg">{complaint.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-1">{complaint.description}</p>
                </div>
                
                <button
                  onClick={() => handleUpvote(complaint._id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all flex-shrink-0 ${
                    complaint.upvotes?.includes(user._id)
                      ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-inner hover:bg-amber-100 hover:border-amber-400'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-600'
                  }`}
                  title={complaint.upvotes?.includes(user._id) ? "Click to remove your vote" : "I'm experiencing this too"}
                >
                  <ThumbsUp size={16} className={complaint.upvotes?.includes(user._id) ? "fill-amber-500 text-amber-500" : ""} />
                  <span className="hidden sm:inline">{complaint.upvotes?.includes(user._id) ? 'Voted' : 'Me Too'}</span>
                  <span>({complaint.upvotes?.length || 0})</span>
                </button>
              </div>
            ))}
          </div>
        )}
        <Link to="/complaints" className="mt-4 sm:hidden flex justify-center w-full py-3 bg-gray-50 text-teal-600 font-bold rounded-xl border border-gray-100 items-center gap-2">
          View All Complaints <ArrowRight size={16} />
        </Link>
      </div>

      {/* Meal Recharge & Face Registration Modals */}
      <MealPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchaseSuccess={(data) => {
          setMealPass((prev) => ({
            ...(prev || {}),
            remainingMeals: data.remainingMeals,
            totalMealsPurchased: data.totalMealsPurchased
          }));
        }}
      />

      <FaceRegistrationModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onRegistrationSuccess={(data) => {
          setMealPass((prev) => ({
            ...(prev || {}),
            isFaceRegistered: true,
            facePhoto: data.facePhoto
          }));
        }}
      />
    </div>
  );
};

export default StudentDashboard;

import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import { ChefHat, ClipboardList, Clock, Users, ArrowRight, Camera, Sparkles, CheckCircle2, History } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import FaceAttendanceScanner from '../../components/meals/FaceAttendanceScanner';
import api from '../../api/axios';

const VendorDashboard = () => {
  const { user } = useAuthStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  const [enrolledCount, setEnrolledCount] = useState(0);

  const fetchQuickStats = async () => {
    try {
      const [logsRes, studentsRes] = await Promise.allSettled([
        api.get('/meals/vendor/recent-attendance'),
        api.get('/meals/vendor/enrolled-students')
      ]);

      if (logsRes.status === 'fulfilled') {
        setRecentLogs(logsRes.value.data?.data || []);
      }
      if (studentsRes.status === 'fulfilled') {
        setEnrolledCount(studentsRes.value.data?.count || 0);
      }
    } catch (err) {
      console.error('Error loading vendor meal stats:', err);
    }
  };

  useEffect(() => {
    fetchQuickStats();
  }, []);

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-5 sm:p-10 bg-gradient-to-br from-rose-500 via-pink-500 to-rose-700 text-white shadow-[0_8px_30px_rgba(225,29,72,0.2)] group">
        <div className="absolute -top-12 -right-12 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3 border border-white/20">
            <ChefHat size={12} /> Management Console
          </p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {user?.companyName || 'Your Mess'},<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-100 to-white">{user?.name}</span>
          </h1>
          <p className="text-rose-100 font-medium mt-2 sm:mt-3 max-w-md text-sm sm:text-base">
            Take touchless attendance with AI face recognition, manage menu timetable, and review feedback.
          </p>
        </div>
      </div>

      {/* Prominent Biometric Attendance Scanner Action Card */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden border border-gray-700/50">
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-300 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
              <span>Smart Biometric Gate</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Facial Recognition Attendance Scanner
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Open the live webcam scanner at the mess entrance. When students show their face, the system automatically verifies their identity, checks their remaining meal balance, and deducts 1 meal atomically.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 size={15} /> {enrolledCount} Enrolled Faces
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-rose-300">
                <History size={15} /> {recentLogs.length} Checked In Today
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Camera size={22} className="animate-pulse" />
              <span>Launch Live Camera Scanner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[
          { to: '/complaints', label: 'Queue',     title: 'Tasks',     Icon: ClipboardList, color: 'text-rose-500',   bg: 'from-rose-100 to-pink-50',    hover: 'hover:text-rose-600' },
          { to: '/timetable',  label: 'Schedule',  title: 'Timetable', Icon: Clock,         color: 'text-teal-500',   bg: 'from-teal-100 to-emerald-50', hover: 'hover:text-teal-600' },
          { to: '/feedback',   label: 'Reviews',   title: 'Feedback',  Icon: ArrowRight,    color: 'text-amber-500',  bg: 'from-amber-100 to-orange-50',  hover: 'hover:text-amber-500' },
        ].map((item) => {
          const { to, label, title, Icon, color, bg, hover } = item;
          return (
            <NavLink key={to} to={to} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/90 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200">
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

      {/* Face Attendance Scanner Modal */}
      <FaceAttendanceScanner
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          fetchQuickStats();
        }}
      />
    </div>
  );
};

export default VendorDashboard;

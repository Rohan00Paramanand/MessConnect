import React from 'react';
import useAuthStore from '../../store/useAuthStore';
import { ChefHat, ClipboardList, Clock, Users, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const VendorDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 bg-gradient-to-br from-rose-500 via-pink-500 to-rose-700 text-white shadow-[0_8px_30px_rgba(225,29,72,0.2)] group">
        <div className="absolute -top-12 -right-12 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase mb-3 border border-white/20">
            <ChefHat size={12} /> Management Console
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {user?.companyName || 'Your Mess'},<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-100 to-white">{user?.name}</span>
          </h1>
          <p className="text-rose-100 font-medium mt-3 max-w-md text-sm sm:text-base">Manage your staff, update the meal timetable, and resolve assigned complaints.</p>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/complaints', label: 'Queue',     title: 'Tasks',     Icon: ClipboardList, color: 'text-rose-500',   bg: 'from-rose-100 to-pink-50',    hover: 'hover:text-rose-600' },
          { to: '/staff',      label: 'Directory', title: 'Staff',     Icon: Users,         color: 'text-indigo-500', bg: 'from-indigo-100 to-blue-50',   hover: 'hover:text-indigo-600' },
          { to: '/timetable',  label: 'Schedule',  title: 'Timetable', Icon: Clock,         color: 'text-teal-500',   bg: 'from-teal-100 to-emerald-50', hover: 'hover:text-teal-600' },
          { to: '/feedback',   label: 'Reviews',   title: 'Feedback',  Icon: ArrowRight,    color: 'text-amber-500',  bg: 'from-amber-100 to-orange-50',  hover: 'hover:text-amber-500' },
        ].map(({ to, label, title, Icon, color, bg, hover }) => (
          <NavLink key={to} to={to} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/90 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
              <h3 className={`text-xl font-black text-gray-900 ${hover} transition-colors`}>{title}</h3>
            </div>
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
              <Icon size={22} strokeWidth={2.5} />
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default VendorDashboard;

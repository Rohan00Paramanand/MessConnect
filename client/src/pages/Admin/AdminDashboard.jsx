import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import { ShieldCheck, Activity, ArrowRight, Server } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ pendingCount: 0 });

  useEffect(() => {
    api.get('/api/admin/pending-users')
      .then(({ data }) => setStats({ pendingCount: data.count || 0 }))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-[0_8px_30px_rgba(79,70,229,0.25)] group">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase mb-3 border border-white/20">
            <Server size={12} /> System Control Plane
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Global Admin,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-white">{user?.name}</span>
          </h1>
          <p className="text-indigo-100 font-medium mt-3 max-w-md text-sm sm:text-base">Monitor metrics, approve vendor applications, and maintain system security.</p>
        </div>
      </div>

      {/* Stats + Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NavLink to="/approvals" className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/90 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Verification Queue</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{stats.pendingCount}</h3>
              <span className="text-sm text-gray-500 font-medium">pending</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center text-indigo-500 shadow-inner group-hover:scale-110 transition-transform flex-shrink-0">
            <ShieldCheck size={22} strokeWidth={2.5} />
          </div>
        </NavLink>

        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">System Status</p>
            <h3 className="text-2xl font-black text-green-600">Operational</h3>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center text-green-500 shadow-inner flex-shrink-0">
            <Activity size={22} strokeWidth={2.5} />
          </div>
        </div>

        <NavLink to="/complaints" className="sm:col-span-2 lg:col-span-1 bg-gray-900 rounded-2xl p-5 flex items-center justify-between group hover:bg-gray-800 hover:-translate-y-0.5 transition-all duration-200 text-white">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Global Audit</p>
            <h3 className="text-xl font-black">View All Complaints →</h3>
          </div>
          <ArrowRight className="text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all flex-shrink-0" size={22} />
        </NavLink>
      </div>
    </div>
  );
};

export default AdminDashboard;

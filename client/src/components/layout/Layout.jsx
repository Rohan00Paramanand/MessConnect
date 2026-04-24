import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuthStore from '../../store/useAuthStore';

const routeTitles = {
  '/complaints': 'Complaints',
  '/feedback':   'Feedback',
  '/notices':    'Notice Board',
  '/staff':      'Staff Directory',
  '/timetable':  'Weekly Timetable',
  '/approvals':  'User Approvals',
};

const Layout = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const isDashboard = location.pathname.startsWith('/dashboard');
  const pageTitle = isDashboard
    ? `${user?.name?.split(' ')[0]}'s Dashboard`
    : (routeTitles[location.pathname] || 'MessConnect');

  return (
    <div className="flex h-screen bg-transparent text-gray-900 overflow-hidden relative">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* ─── Top Header (shows on all screen sizes) ─── */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 lg:px-8 py-4 border-b border-white/40 bg-white/30 backdrop-blur-xl">
          {/* Left: page title (with left margin for mobile hamburger) */}
          <div className="ml-14 lg:ml-0">
            <h2 className="text-lg font-black text-gray-900 tracking-tight truncate">{pageTitle}</h2>
            <p className="text-xs text-gray-400 font-medium hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Right: User avatar pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-gray-900 leading-tight">{user?.name}</span>
              <span className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0">
              {(user?.name || 'U').charAt(0)}
            </div>
          </div>
        </header>

        {/* ─── Page Content ─── */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

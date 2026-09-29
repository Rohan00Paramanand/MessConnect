import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuthStore from '../../store/useAuthStore';
import { Menu } from 'lucide-react';

const routeTitles = {
  '/complaints': 'Complaints',
  '/feedback':   'Feedback',
  '/notices':    'Notice Board',
  '/staff':      'Staff Directory',
  '/timetable':  'Weekly Timetable',
  '/approvals':  'User Approvals',
  '/visits':     'Mess Inspections & Visits',
  '/college-analytics': 'Campus Analytics',
  '/messes':     'Manage Messes',
  '/colleges':   'College Management',
  '/analytics':  'Super Admin Analytics',
};

const Layout = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainScrollRef = useRef(null);

  const isDashboard = location.pathname.startsWith('/dashboard');
  const pageTitle = isDashboard
    ? `${user?.name?.split(' ')[0]}'s Dashboard`
    : (routeTitles[location.pathname] || 'PCET MessConnect');

  // Reset scroll to top on every navigation
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen h-[100dvh] bg-transparent text-gray-900 overflow-hidden relative">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10 w-full min-w-0">
        {/* ─── Top Floating Header / Navbar (Fixed on Mobile, Sticky on Desktop) ─── */}
        <header className="fixed top-0 left-0 right-0 lg:static lg:sticky lg:top-0 z-30 flex-shrink-0 flex items-center gap-3 sm:gap-4 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 border-b border-white/60 bg-white/85 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all">
          {/* Mobile Hamburger Button integrated into navbar */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl bg-white/90 hover:bg-white border border-gray-200/90 shadow-sm flex items-center justify-center text-gray-700 hover:text-gray-900 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Page title and Date */}
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight truncate leading-tight">
              {pageTitle}
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 font-semibold truncate mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </header>

        {/* ─── Page Content (Blurred Glassmorphic Dashboard Background) ─── */}
        <main
          ref={mainScrollRef}
          id="main-content-scroll"
          className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 lg:p-8 pt-[68px] sm:pt-[76px] lg:pt-8 pb-32 sm:pb-36 lg:pb-8 flex flex-col justify-between backdrop-blur-sm overscroll-y-contain"
        >
          <div className="max-w-7xl mx-auto w-full flex-1">
            <Outlet />
          </div>
          {/* Mobile safe area and navigation button clearance spacer */}
          <div className="h-10 sm:h-12 lg:hidden flex-shrink-0" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
};

export default Layout;

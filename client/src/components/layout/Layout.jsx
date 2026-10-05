import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuthStore from '../../store/useAuthStore';
import { Menu, BookOpen } from 'lucide-react';
import VendorGuideModal from '../vendor/VendorGuideModal';

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
  '/vendor-reports': 'Monthly Vendor Report',
};

const Layout = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
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
        {/* ─── Top Navbar (Connected seamlessly to Sidebar) ─── */}
        <header className="fixed top-0 left-0 right-0 lg:static lg:sticky lg:top-0 z-30 h-16 sm:h-20 flex-shrink-0 flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8 border-b border-gray-200/70 bg-white/70 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Mobile Hamburger Button integrated into navbar */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/90 hover:bg-white border border-gray-200/90 shadow-sm flex items-center justify-center text-gray-700 hover:text-gray-900 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={18} className="sm:w-5 sm:h-5" />
            </button>

            {/* Page title and Date */}
            <div className="min-w-0 flex-1 pr-1 sm:pr-2">
              <h2 className="text-sm sm:text-lg font-black text-gray-900 tracking-tight truncate leading-tight">
                {pageTitle}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500 font-semibold truncate mt-0.5">
                <span className="sm:hidden">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="hidden sm:inline">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </p>
            </div>
          </div>

          {/* Top-Right: Vendor User Manual & Guide Button (Responsive sizing) */}
          {user?.role === 'vendor' && (
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold sm:font-black text-[11px] sm:text-sm shadow-md shadow-rose-500/20 hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              title="Open Vendor Guide & User Manual (English / मराठी)"
            >
              <BookOpen size={14} className="sm:w-4 sm:h-4 text-rose-100 flex-shrink-0" />
              <span className="hidden md:inline">Guide / मार्गदर्शक</span>
              <span className="md:hidden">Guide</span>
            </button>
          )}
        </header>

        {/* ─── Page Content ─── */}
        <main
          ref={mainScrollRef}
          id="main-content-scroll"
          className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 pt-[76px] sm:pt-[92px] lg:pt-8 pb-32 sm:pb-36 lg:pb-8 flex flex-col justify-between backdrop-blur-xs overscroll-y-contain"
        >
          <div className="max-w-7xl mx-auto w-full flex-1">
            <Outlet />
          </div>
          {/* Mobile safe area and navigation button clearance spacer */}
          <div className="h-10 sm:h-12 lg:hidden flex-shrink-0" aria-hidden="true" />
        </main>
      </div>

      {/* Vendor Guide Modal */}
      {user?.role === 'vendor' && (
        <VendorGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      )}
    </div>
  );
};

export default Layout;

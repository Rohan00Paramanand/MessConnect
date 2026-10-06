import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import {
  School,
  ChevronDown,
  Check,
  Building2,
  X,
  Search,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CollegeScopeSelector = () => {
  const { user, activeCollege, setActiveCollege } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Only super_admin sees this switcher
  if (user?.role !== 'super_admin') return null;

  useEffect(() => {
    let isMounted = true;
    const fetchColleges = async () => {
      try {
        setLoading(true);
        const res = await api.get('/superadmin/colleges');
        if (isMounted && res.data?.data) {
          setColleges(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load trust colleges for scope selector', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchColleges();
    return () => { isMounted = false; };
  }, []);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (college) => {
    setIsOpen(false);
    setSearchTerm('');

    if (!college) {
      // Switching to Trust Overview (All Colleges)
      setActiveCollege(null);
      toast.success('Switched to Trust Overview (All Colleges)');

      // If currently on a campus-scoped route (like /notices, /complaints, etc.),
      // immediately return to the main super admin dashboard
      const trustRoutes = ['/dashboard/super_admin', '/analytics', '/colleges'];
      const isTrustRoute = trustRoutes.some((route) =>
        location.pathname === route || location.pathname.startsWith(`${route}/`)
      );
      if (!isTrustRoute) {
        navigate('/dashboard/super_admin');
      }
      return;
    }

    setActiveCollege(college);
    toast.success(`Scoped to campus: ${college.name}`);

    // If super admin was on the trust dashboard or trust analytics, automatically open Campus Analytics
    if (location.pathname === '/dashboard/super_admin' || location.pathname === '/analytics') {
      navigate('/college-analytics');
    }
  };

  const filteredColleges = colleges.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button - Perfectly responsive on mobile & laptop */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 cursor-pointer shadow-xs active:scale-98 max-w-[200px] xs:max-w-[240px] sm:max-w-[320px] md:max-w-[380px] ${
          activeCollege
            ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200/80 text-violet-900 hover:border-violet-300 hover:shadow-md'
            : 'bg-white/80 hover:bg-white border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-300'
        }`}
        title={activeCollege ? `Active Campus Scope: ${activeCollege.name}` : 'Trust Level (All Colleges)'}
        aria-label="Switch College Scope"
      >
        {activeCollege ? (
          <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <School size={12} className="sm:w-3.5 sm:h-3.5" />
          </span>
        ) : (
          <span className="w-5 h-5 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
            <Building2 size={12} className="sm:w-3.5 sm:h-3.5" />
          </span>
        )}

        <div className="flex flex-col text-left min-w-0 flex-1">
          <span className="truncate font-bold tracking-tight text-xs text-gray-800">
            {activeCollege ? activeCollege.name : 'All Campuses (Trust)'}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-gray-400 group-hover:text-gray-700 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full left-4 right-4 sm:left-auto sm:right-0 mt-2 sm:w-80 md:w-96 max-h-[85vh] sm:max-h-[480px] bg-white rounded-2xl shadow-xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          {/* Header & Search */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Building2 size={13} className="text-gray-500" />
                Select Campus
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="sm:hidden text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search college by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* List Options */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-gray-50">
            {/* Trust Overview (All Colleges) option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                !activeCollege
                  ? 'bg-violet-50 border border-violet-200 text-violet-900 font-bold'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  !activeCollege ? 'bg-violet-600 text-white shadow-xs' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Building2 size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">All Campuses (Trust Overview)</p>
                  <p className="text-[11px] text-gray-400 font-medium truncate">Aggregate PCET analytics & management</p>
                </div>
              </div>
              {!activeCollege && (
                <Check size={16} className="text-violet-600 flex-shrink-0" />
              )}
            </button>

            {/* Individual Colleges */}
            <div className="pt-1 space-y-1">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Individual Campuses ({colleges.length})
              </p>

              {loading ? (
                <div className="py-6 text-center text-xs text-gray-400">Loading colleges...</div>
              ) : filteredColleges.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">No college found</div>
              ) : (
                filteredColleges.map((c) => {
                  const isSelected = activeCollege?._id === c._id;
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 text-violet-950 font-bold shadow-xs'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                        }`}>
                          <School size={16} />
                        </div>
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-bold truncate leading-tight">{c.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {c.admin ? (
                              <span className="text-[10px] text-indigo-600 font-semibold truncate">
                                Admin: {c.admin.name}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">No admin assigned</span>
                            )}
                            {c.allowedDomains?.[0] && (
                              <span className="text-[9px] bg-gray-100 px-1.5 py-0.2 rounded text-gray-500 font-mono">
                                @{c.allowedDomains[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <Check size={16} className="text-violet-600 flex-shrink-0" />
                      ) : (
                        <Eye size={14} className="text-gray-300 group-hover:text-violet-500 transition-colors flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-500 font-medium">
              Select a campus to view and manage its messes, approvals, staff & grievances.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


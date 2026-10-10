import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { 
  UtensilsCrossed, 
  Sunrise, 
  Sun, 
  Coffee, 
  Moon, 
  Plus, 
  X, 
  Trash2, 
  Pencil, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

const mealTypeConfig = {
  'Breakfast': { icon: Sunrise, gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
  'Lunch':     { icon: Sun,     gradient: 'from-teal-400 to-emerald-500', bg: 'bg-teal-50',  border: 'border-teal-100',  text: 'text-teal-700' },
  'Evening Snack': { icon: Coffee, gradient: 'from-rose-400 to-pink-400', bg: 'bg-rose-50', border: 'border-rose-100',   text: 'text-rose-700' },
  'Dinner':    { icon: Moon,    gradient: 'from-indigo-400 to-violet-500', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700' },
};

const isSameDay = (d1, d2String) => {
  const d2 = new Date(d2String);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const getInitialViewMode = () => {
  if (typeof window === 'undefined') return 'week';
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / (height || 1);
  // Mobile / portrait screen ratio (aspect ratio < 1.1 or width < 768px): fixed to Day View
  // Laptop / desktop widescreen ratio (aspect ratio >= 1.1 and width >= 768px): fixed to Week Table
  return (aspectRatio < 1.1 || width < 768) ? 'day' : 'week';
};

const WeeklyTimetable = () => {
  const { user, activeCollege } = useAuthStore();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCell, setActiveCell] = useState(null);
  const [activeSlotEl, setActiveSlotEl] = useState(null);
  const [popoverStyle, setPopoverStyle] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [itemsInput, setItemsInput] = useState('');
  const [messFilter, setMessFilter] = useState('');
  const [messes, setMesses] = useState([]);
  const [viewMode, setViewMode] = useState(getInitialViewMode);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const todayDate = new Date();
    const day = todayDate.getDay();
    return day === 0 ? 6 : day - 1;
  });
  const popoverRef = useRef(null);
  const dayScrollContainerRef = useRef(null);
  const dayButtonRefs = useRef([]);
  const hasAutoScrolledRef = useRef(false);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  // Calculate position of the active day pill to slide the green highlight box smoothly
  const updateIndicatorPosition = useCallback(() => {
    const activeBtn = dayButtonRefs.current[selectedDayIndex];
    if (!activeBtn) return;
    if (activeBtn.offsetWidth === 0) {
      requestAnimationFrame(updateIndicatorPosition);
      return;
    }
    setIndicatorStyle({
      left: activeBtn.offsetLeft,
      top: activeBtn.offsetTop,
      width: activeBtn.offsetWidth,
      height: activeBtn.offsetHeight,
      ready: true,
    });
  }, [selectedDayIndex]);

  const scrollAnimationRef = useRef(null);

  // Silky-smooth custom cubic easing scroll (eliminates mobile browser scrollBy stutter)
  const smoothScrollTo = useCallback((targetLeft, duration = 300) => {
    const container = dayScrollContainerRef.current;
    if (!container) return;

    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }

    const startLeft = container.scrollLeft;
    const distance = targetLeft - startLeft;
    if (Math.abs(distance) < 1 || duration <= 0) {
      container.scrollLeft = targetLeft;
      return;
    }

    const startTime = performance.now();
    // easeOutCubic curve for a natural, ultra-smooth deceleration
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.scrollLeft = startLeft + distance * easeOutCubic(progress);

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(step);
      } else {
        scrollAnimationRef.current = null;
      }
    };

    scrollAnimationRef.current = requestAnimationFrame(step);
  }, []);

  // Cleanup any running scroll animations on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  // Auto-focus and center the horizontal scrollable bar on the current/selected day
  const centerActiveDayPill = useCallback((index, smooth = true) => {
    const container = dayScrollContainerRef.current;
    const btn = dayButtonRefs.current[index];
    if (!container || !btn) return;

    if (container.clientWidth === 0 || btn.offsetWidth === 0) {
      requestAnimationFrame(() => centerActiveDayPill(index, smooth));
      return;
    }

    const targetScrollLeft = btn.offsetLeft - (container.clientWidth - btn.offsetWidth) / 2;
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const clampedScrollLeft = Math.max(0, Math.min(maxScrollLeft, targetScrollLeft));

    if (smooth) {
      smoothScrollTo(clampedScrollLeft, 300);
    } else {
      container.scrollLeft = clampedScrollLeft;
    }
  }, [smoothScrollTo]);

  // Reset initial auto-scroll flag when loading or switching to Day View
  useEffect(() => {
    if (loading) {
      hasAutoScrolledRef.current = false;
    }
  }, [loading]);

  // Synchronize indicator and centered scroll position whenever selectedDayIndex, viewMode, or loading finishes
  useEffect(() => {
    if (loading || viewMode !== 'day') return;

    const frame = requestAnimationFrame(() => {
      const container = dayScrollContainerRef.current;
      const btn = dayButtonRefs.current[selectedDayIndex];
      if (!container || !btn) return;

      updateIndicatorPosition();

      if (!hasAutoScrolledRef.current) {
        // Initial positioning once data finishes loading: immediately center current day
        centerActiveDayPill(selectedDayIndex, false);
        hasAutoScrolledRef.current = true;
      } else {
        // Subsequent navigation between days: smoothly glide directly to target day
        centerActiveDayPill(selectedDayIndex, true);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedDayIndex, viewMode, loading, centerActiveDayPill, updateIndicatorPosition]);

  // Keep indicator aligned on window resize
  useEffect(() => {
    if (viewMode !== 'day' || loading) return;
    const handleResize = () => {
      updateIndicatorPosition();
      centerActiveDayPill(selectedDayIndex, false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, loading, selectedDayIndex, updateIndicatorPosition, centerActiveDayPill]);

  // Automatically update view mode if window resizes or device orientation changes
  useEffect(() => {
    const handleResize = () => {
      setViewMode(getInitialViewMode());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMessScopedRole = ['user', 'student', 'mess_committee', 'college_admin', 'super_admin'].includes(user?.role);

  useEffect(() => {
    if (user?.collegeId || activeCollege) {
      api.get('/messes')
        .then(({ data }) => {
          const list = data.data || [];
          setMesses(list);
          if (list.length > 0) {
            // Default to user's assigned mess if present, otherwise first available mess
            const defaultMessId = list.find(m => m._id === user?.messAssigned)?._id || list[0]._id;
            setMessFilter(defaultMessId);
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('Failed to load messes', err);
          setLoading(false);
        });
    }
  }, [user, activeCollege]);

  const fetchTimetable = useCallback(async (selectedMessId) => {
    try {
      setLoading(true);
      const params = {};
      if (isMessScopedRole && selectedMessId) {
        params.mess = selectedMessId;
      }
      const { data } = await api.get('/timetable', { params });
      setTimetable(data.data || data);
    } catch {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, [isMessScopedRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === 'vendor') {
        // Vendors are tied to their own assigned mess by the server
        fetchTimetable();
      } else if (messFilter) {
        // College admin, students, committee, and super admin query by the active mess filter
        fetchTimetable(messFilter);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user?.role, messFilter, fetchTimetable]);

  const handleClosePopover = useCallback(() => {
    setActiveCell(null);
    setActiveSlotEl(null);
    setPopoverStyle(null);
    setItemsInput('');
  }, []);

  // Dynamically compute popover coordinates directly beside the clicked slot in viewport space
  const updatePopoverPosition = useCallback((targetEl) => {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popoverWidth = Math.min(360, vw - 32);

    // On mobile screens (< 640px), center the popover as a neat modal
    if (vw < 640) {
      setPopoverStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${popoverWidth}px`,
        isModal: true,
      });
      return;
    }

    const popoverHeight = popoverRef.current ? popoverRef.current.offsetHeight : 310;
    const gap = 12;
    const pad = 16;

    let placement = 'right';
    let left = 0;
    let top = 0;

    // Prefer placing on the right; if it overflows viewport, place on the left
    if (rect.right + gap + popoverWidth <= vw - pad) {
      placement = 'right';
      left = rect.right + gap;
    } else if (rect.left - gap - popoverWidth >= pad) {
      placement = 'left';
      left = rect.left - gap - popoverWidth;
    } else {
      placement = (rect.bottom + gap + popoverHeight <= vh - pad) ? 'bottom' : 'top';
      left = Math.max(pad, Math.min(vw - popoverWidth - pad, rect.left + (rect.width - popoverWidth) / 2));
    }

    if (placement === 'right' || placement === 'left') {
      const targetCenterY = rect.top + rect.height / 2;
      top = targetCenterY - popoverHeight / 2;

      if (top + popoverHeight > vh - pad) {
        top = vh - popoverHeight - pad;
      }
      if (top < pad) {
        top = pad;
      }

      const arrowTop = Math.max(20, Math.min(popoverHeight - 20, targetCenterY - top));
      setPopoverStyle({
        position: 'fixed',
        top: `${Math.round(top)}px`,
        left: `${Math.round(left)}px`,
        width: `${popoverWidth}px`,
        placement,
        arrowTop: `${Math.round(arrowTop)}px`,
        isModal: false,
      });
    } else {
      if (placement === 'bottom') {
        top = rect.bottom + gap;
      } else {
        top = Math.max(pad, rect.top - gap - popoverHeight);
      }
      const targetCenterX = rect.left + rect.width / 2;
      const arrowLeft = Math.max(20, Math.min(popoverWidth - 20, targetCenterX - left));

      setPopoverStyle({
        position: 'fixed',
        top: `${Math.round(top)}px`,
        left: `${Math.round(left)}px`,
        width: `${popoverWidth}px`,
        placement,
        arrowLeft: `${Math.round(arrowLeft)}px`,
        isModal: false,
      });
    }
  }, []);

  // Reposition popover when the window or the table scroll container scrolls
  useEffect(() => {
    if (!activeCell || !activeSlotEl) return;

    const handleScrollOrResize = () => {
      updatePopoverPosition(activeSlotEl);
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [activeCell, activeSlotEl, updatePopoverPosition]);

  // Dismiss on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeCell) {
        handleClosePopover();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, handleClosePopover]);

  const handleSlotClick = (e, date, type) => {
    if (user?.role !== 'vendor') return;

    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    const dateStr = d.toISOString().split('T')[0];

    // Toggle close if clicking already open slot in create mode
    if (activeCell && activeCell.date === dateStr && activeCell.mealType === type && activeCell.mode === 'create') {
      handleClosePopover();
      return;
    }

    const clickedEl = e.currentTarget;
    setActiveSlotEl(clickedEl);
    setActiveCell({ date: dateStr, mealType: type, mode: 'create' });
    setItemsInput('');
    updatePopoverPosition(clickedEl);
  };

  const handleEditMeal = (e, meal, date, type) => {
    if (e) e.stopPropagation();
    if (user?.role !== 'vendor') return;

    const d = new Date(date || meal.date);
    d.setHours(12, 0, 0, 0);
    const dateStr = d.toISOString().split('T')[0];

    // Toggle close if clicking already open edit slot
    if (activeCell && activeCell.mealId === meal._id) {
      handleClosePopover();
      return;
    }

    const clickedEl = e?.currentTarget?.closest('.group\\/meal') || e?.currentTarget;
    setActiveSlotEl(clickedEl);
    setActiveCell({
      date: dateStr,
      mealType: type || meal.mealType,
      mode: 'edit',
      mealId: meal._id,
    });
    setItemsInput(Array.isArray(meal.items) ? meal.items.join(', ') : '');
    updatePopoverPosition(clickedEl);
  };

  const handleRemoveItemTag = (idxToRemove) => {
    const currentItems = itemsInput
      .split(/[,\n]+/)
      .map(i => i.trim())
      .filter(Boolean);
    const updated = currentItems.filter((_, idx) => idx !== idxToRemove);
    setItemsInput(updated.join(', '));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!activeCell) return;

    const parsedItems = itemsInput
      .split(/[,\n]+/)
      .map(i => i.trim())
      .filter(Boolean);

    if (parsedItems.length === 0) {
      toast.error('Please enter at least one menu item');
      return;
    }

    setFormLoading(true);
    try {
      if (activeCell.mode === 'edit' && activeCell.mealId) {
        const { data } = await api.patch(`/timetable/${activeCell.mealId}`, {
          items: parsedItems
        });
        if (data.status === 'success') {
          toast.success('Meal updated successfully!');
          setTimetable(prev => prev.map(m => m._id === activeCell.mealId ? data.data : m));
          handleClosePopover();
        }
      } else {
        const payload = { 
          date: activeCell.date, 
          mealType: activeCell.mealType, 
          items: parsedItems 
        };
        
        const { data } = await api.post('/timetable', payload);
        if (data.status === 'success') {
          toast.success('Meal added!'); 
          setTimetable(prev => [...prev, data.data]);
          handleClosePopover();
        }
      }
    } catch (error) { 
      toast.error(error.response?.data?.message || (activeCell.mode === 'edit' ? 'Failed to update meal' : 'Failed to add meal')); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal?')) return;
    try { 
      await api.delete(`/timetable/${id}`); 
      setTimetable(prev => prev.filter(m => m._id !== id)); 
      if (activeCell?.mealId === id) {
        handleClosePopover();
      }
      toast.success('Meal deleted!'); 
    } catch { 
      toast.error('Failed to delete meal'); 
    }
  };

  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0,0,0,0);
    
    return Array.from({length: 7}).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  };
  const weekDates = getWeekDates();
  const mealTypes = ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner'];

  const currentItemChips = itemsInput
    .split(/[,\n]+/)
    .map(i => i.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-600 text-white shadow-[0_20px_50px_-12px_rgba(15,118,110,0.35)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <UtensilsCrossed size={18} />
              </div>
              <span className="text-white/70 text-xs sm:text-sm font-bold uppercase tracking-widest">Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1">Weekly Mess Timetable</h1>
            <p className="text-white/70 text-sm sm:text-base font-medium">Daily meal plan with food items for each session</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {user?.role === 'vendor' && (
              <div className="text-white/80 font-medium text-xs sm:text-sm self-start sm:self-auto">
                <span className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 font-bold backdrop-blur-sm shadow-sm inline-flex items-center gap-2">
                  <Pencil size={14} className="opacity-70" /> Tap slot to add or edit meal
                </span>
              </div>
            )}
            {isMessScopedRole && (
              <Select
                variant="header"
                value={messFilter}
                onChange={(e) => setMessFilter(e.target.value)}
                options={messes.length > 0 ? messes.map((m) => ({ value: m._id, label: m.name })) : [{ value: '', label: 'No messes available' }]}
                disabled={messes.length === 0}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Meal Popover (rendered into document.body to avoid parent scroll/filter container traps) */}
      {activeCell && user?.role === 'vendor' && popoverStyle && createPortal(
        <>
          {/* Subtle click-outside backdrop overlay */}
          <div 
            className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px] transition-opacity"
            onClick={handleClosePopover}
          />

          {/* Contextual Popover Card */}
          <div 
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: popoverStyle.top,
              left: popoverStyle.left,
              transform: popoverStyle.transform || 'none',
              width: popoverStyle.width,
              maxHeight: 'calc(100vh - 32px)',
            }}
            className="z-50 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] animate-in fade-in zoom-in-95 duration-150 overflow-y-auto"
          >
            {/* Pointer arrow pointing to the clicked slot (only in desktop contextual mode) */}
            {!popoverStyle.isModal && popoverStyle.placement === 'right' && (
              <div 
                className="absolute -left-2 w-4 h-4 bg-white rotate-45 border-l border-b border-gray-200/90 pointer-events-none"
                style={{ top: popoverStyle.arrowTop || '32px' }}
              />
            )}
            {!popoverStyle.isModal && popoverStyle.placement === 'left' && (
              <div 
                className="absolute -right-2 w-4 h-4 bg-white rotate-45 border-r border-t border-gray-200/90 pointer-events-none"
                style={{ top: popoverStyle.arrowTop || '32px' }}
              />
            )}
            {!popoverStyle.isModal && popoverStyle.placement === 'bottom' && (
              <div 
                className="absolute -top-2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200/90 pointer-events-none"
                style={{ left: popoverStyle.arrowLeft || '50%' }}
              />
            )}
            {!popoverStyle.isModal && popoverStyle.placement === 'top' && (
              <div 
                className="absolute -bottom-2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-200/90 pointer-events-none"
                style={{ left: popoverStyle.arrowLeft || '50%' }}
              />
            )}

            {/* Accent colored top bar */}
            <div className={`h-1.5 w-full rounded-full mb-3 bg-gradient-to-r ${mealTypeConfig[activeCell.mealType]?.gradient || 'from-teal-400 to-emerald-500'}`} />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${mealTypeConfig[activeCell.mealType]?.bg || 'bg-teal-50'}`}>
                  {React.createElement(mealTypeConfig[activeCell.mealType]?.icon || UtensilsCrossed, {
                    size: 16,
                    className: mealTypeConfig[activeCell.mealType]?.text || 'text-teal-600'
                  })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900 leading-tight">
                      {activeCell.mode === 'edit' ? `Edit ${activeCell.mealType}` : `Add ${activeCell.mealType}`}
                    </h3>
                    {activeCell.mode === 'edit' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md border border-teal-200/60">
                        Quick Fix
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(activeCell.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'})}
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleClosePopover} 
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Menu Items
                  </label>
                  <span className="text-[11px] text-gray-400 font-medium">comma or line-separated</span>
                </div>
                <textarea 
                  autoFocus
                  required 
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:bg-white transition-all resize-none leading-relaxed" 
                  rows="3" 
                  value={itemsInput} 
                  onChange={e => setItemsInput(e.target.value)}
                  placeholder="e.g. Idli, Sambar, Chutney, Tea"
                />

                {/* Interactive Item Tags preview */}
                {currentItemChips.length > 0 && (
                  <div className="mt-2.5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Items preview ({currentItemChips.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {currentItemChips.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-gray-100/90 text-gray-800 rounded-lg border border-gray-200/70 hover:bg-gray-200/70 transition-colors">
                          <span className="truncate max-w-[150px]">{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemTag(idx)}
                            className="text-gray-400 hover:text-rose-600 rounded-full transition-colors cursor-pointer"
                            title={`Remove ${item}`}
                          >
                            <X size={11} strokeWidth={2.5} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {activeCell.mode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(activeCell.mealId)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200/80 cursor-pointer"
                    title="Delete meal entry"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={handleClosePopover} 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl flex-1 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1 !py-2 text-sm" 
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving...' : activeCell.mode === 'edit' ? 'Update Meal' : 'Save Meal'}
                </Button>
              </div>
            </form>
          </div>
        </>,
        document.body
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
      ) : messes.length === 0 && user?.role !== 'vendor' ? (
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-12 text-center shadow-sm">
          <UtensilsCrossed size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-black text-gray-900 mb-1">No Messes Found</h3>
          <p className="text-sm text-gray-500 font-medium max-w-md mx-auto">
            {user?.role === 'college_admin'
              ? 'No messes have been configured for your college yet. Use Manage Messes to add a campus mess.'
              : 'No messes have been configured for your campus yet.'}
          </p>
        </div>
      ) : viewMode === 'day' ? (
        /* ────────── MOBILE-OPTIMIZED DAY VIEW ────────── */
        <div className="space-y-4">
          {/* Day Pills Bar with Auto-Focus and Smooth Sliding Highlight Box */}
          <div className="relative p-1.5 bg-gray-100/80 backdrop-blur-md rounded-[1.25rem] border border-gray-200/70 shadow-xs">
            <div 
              ref={dayScrollContainerRef}
              className="relative flex items-center gap-1.5 overflow-x-auto scrollbar-none"
            >
              {/* Smooth Sliding Active Highlight Box */}
              {indicatorStyle.ready && (
                <div
                  className="absolute rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 shadow-md shadow-teal-600/30 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    left: `${indicatorStyle.left}px`,
                    top: `${indicatorStyle.top}px`,
                    width: `${indicatorStyle.width}px`,
                    height: `${indicatorStyle.height}px`,
                  }}
                />
              )}

              {weekDates.map((date, idx) => {
                const isSelected = selectedDayIndex === idx;
                const isToday = isSameDay(date, new Date());
                return (
                  <button
                    key={idx}
                    ref={el => { dayButtonRefs.current[idx] = el; }}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className="relative z-10 flex-1 min-w-[72px] sm:min-w-[85px] py-2 px-2 rounded-xl flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer select-none"
                  >
                    <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 ${
                      isSelected ? 'text-teal-100' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className={`text-base sm:text-lg font-black leading-tight mt-0.5 transition-colors duration-200 ${
                      isSelected ? 'text-white' : 'text-gray-700'
                    }`}>
                      {date.getDate()}
                    </span>
                    {isToday && (
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full mt-1 transition-colors duration-200 ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-700'
                      }`}>
                        Today
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Day Header with Navigation Buttons */}
          <div className="flex items-center justify-between gap-2 p-3 sm:p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedDayIndex === 0}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-gray-50 hover:bg-teal-50 text-gray-700 hover:text-teal-700 border border-gray-200/80 hover:border-teal-300 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-bold shadow-xs cursor-pointer"
              title="Previous day"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden font-extrabold">{selectedDayIndex > 0 ? weekDates[selectedDayIndex - 1].toLocaleDateString('en-US', { weekday: 'short' }) : 'Prev'}</span>
            </button>

            <div className="text-center min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-black text-gray-900 leading-tight truncate">
                {weekDates[selectedDayIndex].toLocaleDateString('en-US', { weekday: 'long' })}
              </h2>
              <p className="text-xs text-teal-600 font-bold mt-0.5">
                {weekDates[selectedDayIndex].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayIndex(prev => Math.min(6, prev + 1))}
              disabled={selectedDayIndex === 6}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-gray-50 hover:bg-teal-50 text-gray-700 hover:text-teal-700 border border-gray-200/80 hover:border-teal-300 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-bold shadow-xs cursor-pointer"
              title="Next day"
              aria-label="Next day"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden font-extrabold">{selectedDayIndex < 6 ? weekDates[selectedDayIndex + 1].toLocaleDateString('en-US', { weekday: 'short' }) : 'Next'}</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* All 4 Meal Cards for Selected Day */}
          <div key={selectedDayIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-50 duration-200">
            {mealTypes.map((type) => {
              const cfg = mealTypeConfig[type];
              const Icon = cfg.icon;
              const date = weekDates[selectedDayIndex];
              const meal = timetable.find(m => m.mealType === type && isSameDay(date, m.date));
              const dateMidday = new Date(date);
              dateMidday.setHours(12, 0, 0, 0);
              const dateKey = dateMidday.toISOString().split('T')[0];
              const isActiveCreateSlot = activeCell?.date === dateKey && activeCell?.mealType === type && activeCell?.mode === 'create';
              const isActiveEditSlot = activeCell?.mealId && meal && activeCell?.mealId === meal._id;

              return (
                <div
                  key={type}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${
                    meal ? 'border-gray-200/80 hover:shadow-md' : 'border-dashed border-gray-300 bg-gray-50/40'
                  } ${isActiveEditSlot || isActiveCreateSlot ? 'ring-2 ring-teal-500 shadow-md bg-teal-50/15 border-teal-300' : ''}`}
                >
                  {/* Top Colored Accent line */}
                  <div className={`h-1 w-full -mx-5 -mt-5 mb-4 bg-gradient-to-r ${cfg.gradient}`} />

                  <div>
                    {/* Meal Session Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${cfg.bg} ${cfg.text}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className={`font-black text-sm sm:text-base tracking-wide ${cfg.text}`}>
                            {type}
                          </h3>
                          <span className="text-[11px] text-gray-400 font-medium">Daily session</span>
                        </div>
                      </div>

                      {/* Action buttons for vendor */}
                      {user?.role === 'vendor' && meal && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleEditMeal(e, meal, date, type)}
                            className="p-1.5 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-lg transition-all border border-teal-200 shadow-xs cursor-pointer"
                            title="Edit meal"
                          >
                            <Pencil size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(meal._id);
                            }}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-all border border-rose-200 shadow-xs cursor-pointer"
                            title="Delete meal"
                          >
                            <Trash2 size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Menu items list */}
                    {meal ? (
                      <div
                        className={user?.role === 'vendor' ? 'cursor-pointer group' : ''}
                        onClick={user?.role === 'vendor' ? (e) => handleEditMeal(e, meal, date, type) : undefined}
                      >
                        <ul className="space-y-2 py-1">
                          {meal.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-800 font-medium leading-relaxed">
                              <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${cfg.gradient} flex-shrink-0 mt-1.5 shadow-xs`}></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        {user?.role === 'vendor' && (
                          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-teal-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="flex items-center gap-1">
                              <Pencil size={11} /> Tap to edit items
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 flex flex-col items-center justify-center text-center">
                        {user?.role === 'vendor' ? (
                          <button
                            type="button"
                            onClick={(e) => handleSlotClick(e, date, type)}
                            className="w-full py-3 px-4 rounded-xl border border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Plus size={16} strokeWidth={2.5} />
                            <span>Add {type} Menu</span>
                          </button>
                        ) : (
                          <p className="text-xs text-gray-400 font-semibold italic">
                            No meal scheduled for this session
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Day Navigation Bar */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedDayIndex === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs border border-gray-200/80 shadow-xs disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>{selectedDayIndex > 0 ? `Previous (${weekDates[selectedDayIndex - 1].toLocaleDateString('en-US', { weekday: 'short' })})` : 'Previous Day'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const dNow = new Date();
                const day = dNow.getDay();
                setSelectedDayIndex(day === 0 ? 6 : day - 1);
              }}
              className="py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs border border-teal-200 shadow-xs transition-all cursor-pointer flex-shrink-0"
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setSelectedDayIndex(prev => Math.min(6, prev + 1))}
              disabled={selectedDayIndex === 6}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs border border-gray-200/80 shadow-xs disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <span>{selectedDayIndex < 6 ? `Next (${weekDates[selectedDayIndex + 1].toLocaleDateString('en-US', { weekday: 'short' })})` : 'Next Day'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* ────────── FULL 7-DAY WEEK TABLE VIEW (DESKTOP / WIDESCREEN) ────────── */
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[2rem] p-3 sm:p-8 shadow-sm relative z-0">
          <div className="overflow-x-auto pb-4 custom-scrollbar -mx-1 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[700px] sm:min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-3 sm:p-4 bg-gray-50 rounded-tl-2xl border-b border-r border-gray-200/60 sticky left-0 z-30 w-24 sm:w-32 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest block text-center mt-6">Meals</span>
                  </th>
                  {weekDates.map((date, i) => (
                    <th key={i} className={`p-4 border-b border-gray-200/60 min-w-[170px] sm:min-w-[200px] ${i === 6 ? 'rounded-tr-2xl' : 'border-r'} bg-gray-50/50`}>
                      <div className="font-black text-gray-900 text-base sm:text-lg">{date.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                      <div className="text-xs sm:text-sm text-teal-600 font-bold">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mealTypes.map((type, rowIndex) => {
                  const cfg = mealTypeConfig[type];
                  const Icon = cfg.icon;
                  return (
                    <tr key={type} className="group/row">
                      <td className={`p-3 sm:p-4 border-r border-gray-200/60 sticky left-0 z-20 bg-white shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] ${rowIndex === 3 ? 'rounded-bl-2xl' : 'border-b'}`}>
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className={`p-2.5 sm:p-3 rounded-xl ${cfg.bg} inline-flex mb-2 sm:mb-3 shadow-inner`}>
                            <Icon size={18} className={`sm:w-5 sm:h-5 ${cfg.text}`} />
                          </div>
                          <div className={`font-black text-[11px] sm:text-xs uppercase tracking-wider ${cfg.text}`}>{type}</div>
                        </div>
                      </td>
                      {weekDates.map((date, colIndex) => {
                        const meal = timetable.find(m => m.mealType === type && isSameDay(date, m.date));
                        const dateMidday = new Date(date);
                        dateMidday.setHours(12, 0, 0, 0);
                        const dateKey = dateMidday.toISOString().split('T')[0];
                        const isActiveCreateSlot = activeCell?.date === dateKey && activeCell?.mealType === type && activeCell?.mode === 'create';
                        const isActiveEditSlot = activeCell?.mealId && meal && activeCell?.mealId === meal._id;
                        
                        return (
                          <td key={colIndex} className={`p-3 sm:p-4 align-top hover:bg-gray-50/50 transition-colors ${colIndex === 6 ? '' : 'border-r'} border-gray-200/60 ${rowIndex === 3 ? (colIndex === 6 ? 'rounded-br-2xl' : '') : 'border-b'}`}>
                            {meal ? (
                              <div 
                                className={`relative group/meal h-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 ${
                                  user?.role === 'vendor' ? 'cursor-pointer hover:border-teal-200 hover:ring-1 hover:ring-teal-200' : ''
                                } ${isActiveEditSlot ? 'ring-2 ring-teal-500 shadow-md bg-teal-50/15' : ''}`}
                                onClick={user?.role === 'vendor' ? (e) => handleEditMeal(e, meal, date, type) : undefined}
                              >
                                {user?.role === 'vendor' && (
                                  <div className="absolute -top-2.5 -right-2 flex items-center gap-1 z-10">
                                    <button 
                                      type="button"
                                      onClick={(e) => handleEditMeal(e, meal, date, type)}
                                      className="p-1.5 bg-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white rounded-full sm:opacity-0 sm:group-hover/meal:opacity-100 transition-all shadow-md hover:scale-105 active:scale-95 border border-teal-200 cursor-pointer"
                                      title="Quick edit meal"
                                      aria-label="Quick edit meal"
                                    >
                                      <Pencil size={11} strokeWidth={2.5} />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(meal._id);
                                      }}
                                      className="p-1.5 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white rounded-full sm:opacity-0 sm:group-hover/meal:opacity-100 transition-all shadow-md hover:scale-105 active:scale-95 border border-rose-200 cursor-pointer"
                                      title="Delete meal"
                                      aria-label="Delete meal"
                                    >
                                      <Trash2 size={11} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                )}
                                <ul className="space-y-2">
                                  {meal.items.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 font-medium leading-tight">
                                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${cfg.gradient} flex-shrink-0 mt-1.5 shadow-sm`}></span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                                {user?.role === 'vendor' && (
                                  <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-teal-600 font-bold opacity-0 group-hover/meal:opacity-100 transition-opacity flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                      <Pencil size={10} /> Quick edit
                                    </span>
                                    <span className="text-gray-400 font-normal">Click slot</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div 
                                className={`h-full flex flex-col items-center justify-center p-4 min-h-[120px] rounded-xl transition-all ${
                                  user?.role === 'vendor' ? 'cursor-pointer group' : ''
                                } ${
                                  isActiveCreateSlot
                                    ? 'bg-teal-50 border-2 border-teal-500 shadow-md ring-4 ring-teal-500/15'
                                    : user?.role === 'vendor'
                                      ? 'border border-transparent hover:bg-white hover:shadow-sm hover:border-teal-100'
                                      : ''
                                }`}
                                onClick={(e) => handleSlotClick(e, date, type)}
                              >
                                {user?.role === 'vendor' ? (
                                  isActiveCreateSlot ? (
                                    <>
                                      <div className="w-8 h-8 rounded-full bg-teal-500 text-white font-bold flex items-center justify-center mb-2 shadow-sm animate-pulse">
                                        <Plus size={18} strokeWidth={3} />
                                      </div>
                                      <span className="text-[11px] uppercase tracking-widest text-teal-700 font-black select-none text-center">
                                        Adding Meal...
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-500 font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 mb-2">
                                        <Plus size={18} strokeWidth={3} />
                                      </div>
                                      <span className="text-[11px] uppercase tracking-widest text-gray-300 font-bold select-none text-center group-hover:text-teal-600 transition-colors">
                                        Add Meal
                                      </span>
                                    </>
                                  )
                                ) : (
                                  <span className="text-[11px] uppercase tracking-widest text-gray-300 font-bold select-none text-center bg-gray-50 px-3 py-1.5 rounded-lg border border-dashed border-gray-200">
                                    No Meal
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyTimetable;

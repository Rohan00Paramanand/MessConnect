import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Clock, UtensilsCrossed, Sunrise, Sun, Coffee, Moon, Plus, X, Trash2 } from 'lucide-react';

const mealTypeConfig = {
  'Breakfast': { icon: Sunrise, gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
  'Lunch':     { icon: Sun,     gradient: 'from-teal-400 to-emerald-500', bg: 'bg-teal-50',  border: 'border-teal-100',  text: 'text-teal-700' },
  'Evening Snack': { icon: Coffee, gradient: 'from-rose-400 to-pink-400', bg: 'bg-rose-50', border: 'border-rose-100',   text: 'text-rose-700' },
  'Dinner':    { icon: Moon,    gradient: 'from-indigo-400 to-violet-500', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700' },
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
  const popoverRef = useRef(null);

  useEffect(() => {
    if (user?.collegeId || activeCollege) {
      api.get('/messes')
        .then(({ data }) => {
          const list = data.data || [];
          setMesses(list);
          if (list.length > 0) {
            setMessFilter(list[0]._id);
          }
        })
        .catch(err => {
          console.error('Failed to load messes', err);
        });
    }
  }, [user, activeCollege]);

  const fetchTimetable = useCallback(async (filterVal = messFilter) => {
    try { 
      const params = {};
      if (['user', 'student', 'mess_committee', 'college_admin', 'super_admin'].includes(user?.role) && filterVal) {
        params.mess = filterVal;
      }
      const { data } = await api.get('/timetable', { params }); 
      setTimetable(data.data || data); 
    }
    catch { toast.error('Failed to load timetable'); } finally { setLoading(false); }
  }, [user, messFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTimetable(messFilter);
    }, 0);
    return () => clearTimeout(timer);
  }, [messFilter, fetchTimetable]);

  // Dynamically compute popover coordinates directly beside the clicked slot in viewport space
  const updatePopoverPosition = useCallback((targetEl) => {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popoverWidth = Math.min(340, vw - 32);
    const popoverHeight = popoverRef.current ? popoverRef.current.offsetHeight : 275;
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
      // Mobile fallback: position below or above slot
      placement = (rect.bottom + gap + popoverHeight <= vh - pad) ? 'bottom' : 'top';
      left = Math.max(pad, Math.min(vw - popoverWidth - pad, rect.left + (rect.width - popoverWidth) / 2));
    }

    if (placement === 'right' || placement === 'left') {
      const targetCenterY = rect.top + rect.height / 2;
      // Vertically center the popover next to the slot
      top = targetCenterY - popoverHeight / 2;

      // Clamp vertically so the popover remains fully on-screen
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
  }, [activeCell]);

  const handleClosePopover = () => {
    setActiveCell(null);
    setActiveSlotEl(null);
    setPopoverStyle(null);
    setItemsInput('');
  };

  const handleSlotClick = (e, date, type) => {
    if (user?.role !== 'vendor') return;

    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    const dateStr = d.toISOString().split('T')[0];

    // Toggle close if clicking already open slot
    if (activeCell && activeCell.date === dateStr && activeCell.mealType === type) {
      handleClosePopover();
      return;
    }

    const clickedEl = e.currentTarget;
    setActiveSlotEl(clickedEl);
    setActiveCell({ date: dateStr, mealType: type });
    updatePopoverPosition(clickedEl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!activeCell) return;
    setFormLoading(true);
    try {
      const payload = { 
        date: activeCell.date, 
        mealType: activeCell.mealType, 
        items: itemsInput.split(',').map(i => i.trim()).filter(i => i) 
      };
      
      const { data } = await api.post('/timetable', payload);
      if (data.status === 'success') {
        toast.success('Meal added!'); 
        setTimetable(prev => [...prev, data.data]);
        handleClosePopover();
      }
    } catch (error) { 
      toast.error(error.response?.data?.message || 'Failed to add meal'); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal?')) return;
    try { await api.delete(`/timetable/${id}`); setTimetable(timetable.filter(m => m._id !== id)); toast.success('Deleted!'); }
    catch { toast.error('Failed to delete'); }
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
          {user?.role === 'vendor' && (
            <div className="text-white/80 font-medium text-xs sm:text-sm self-start sm:self-auto">
              <span className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 font-bold backdrop-blur-sm shadow-sm inline-flex items-center gap-2">
                <Plus size={14} className="opacity-70" /> Tap empty slot to add meal
              </span>
            </div>
          )}
          {['user', 'student', 'mess_committee', 'college_admin', 'super_admin'].includes(user?.role) && (
            <Select
              variant="header"
              value={messFilter}
              onChange={(e) => setMessFilter(e.target.value)}
              options={messes.map((m) => ({ value: m._id, label: m.name }))}
            />
          )}
        </div>
      </div>

      {/* Add Meal Popover (rendered into document.body to avoid parent scroll/filter container traps) */}
      {activeCell && user?.role === 'vendor' && popoverStyle && createPortal(
        <>
          {/* Subtle click-outside backdrop overlay */}
          <div 
            className="fixed inset-0 z-50 bg-black/15 backdrop-blur-[1px] transition-opacity"
            onClick={handleClosePopover}
          />

          {/* Contextual Popover Card */}
          <div 
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: popoverStyle.top,
              left: popoverStyle.left,
              width: popoverStyle.width,
            }}
            className="z-50 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Pointer arrow pointing to the clicked slot */}
            {popoverStyle.placement === 'right' && (
              <div 
                className="absolute -left-2 w-4 h-4 bg-white rotate-45 border-l border-b border-gray-200/90 pointer-events-none"
                style={{ top: popoverStyle.arrowTop || '32px' }}
              />
            )}
            {popoverStyle.placement === 'left' && (
              <div 
                className="absolute -right-2 w-4 h-4 bg-white rotate-45 border-r border-t border-gray-200/90 pointer-events-none"
                style={{ top: popoverStyle.arrowTop || '32px' }}
              />
            )}
            {popoverStyle.placement === 'bottom' && (
              <div 
                className="absolute -top-2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200/90 pointer-events-none"
                style={{ left: popoverStyle.arrowLeft || '50%' }}
              />
            )}
            {popoverStyle.placement === 'top' && (
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
                  <h3 className="text-base font-black text-gray-900 leading-tight">Add {activeCell.mealType}</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {new Date(activeCell.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'})}
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleClosePopover} 
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Menu Items <span className="text-gray-400 font-normal">(comma-separated)</span>
                </label>
                <textarea 
                  autoFocus
                  required 
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:bg-white transition-all resize-none leading-relaxed" 
                  rows="3" 
                  value={itemsInput} 
                  onChange={e => setItemsInput(e.target.value)}
                  placeholder="e.g. Idli, Sambar, Chutney, Tea"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button 
                  type="button" 
                  onClick={handleClosePopover} 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl flex-1 transition-colors"
                >
                  Cancel
                </button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1 !py-2 text-sm" 
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving...' : 'Save Meal'}
                </Button>
              </div>
            </form>
          </div>
        </>,
        document.body
      )}

      {/* Timetable */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[2rem] p-3 sm:p-8 shadow-sm relative z-0">
          <div className="overflow-x-auto pb-4 custom-scrollbar -mx-1 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[700px] sm:min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-4 bg-gray-50/80 backdrop-blur-md rounded-tl-2xl border-b border-r border-gray-200/60 sticky left-0 z-20 w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest block text-center mt-6">Meals</span>
                  </th>
                  {weekDates.map((date, i) => (
                    <th key={i} className={`p-4 border-b border-gray-200/60 min-w-[200px] ${i === 6 ? 'rounded-tr-2xl' : 'border-r'} bg-gray-50/50`}>
                      <div className="font-black text-gray-900 text-lg">{date.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                      <div className="text-sm text-teal-600 font-bold">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
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
                      <td className={`p-4 border-r border-gray-200/60 sticky left-0 z-10 backdrop-blur-md bg-white/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${rowIndex === 3 ? 'rounded-bl-2xl' : 'border-b'}`}>
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className={`p-3 rounded-xl ${cfg.bg} inline-flex mb-3 shadow-inner`}>
                            <Icon size={20} className={cfg.text} />
                          </div>
                          <div className={`font-black text-xs uppercase tracking-wider ${cfg.text}`}>{type}</div>
                        </div>
                      </td>
                      {weekDates.map((date, colIndex) => {
                        const isSameDay = (d1, d2String) => {
                          const d2 = new Date(d2String);
                          return d1.getFullYear() === d2.getFullYear() &&
                                 d1.getMonth() === d2.getMonth() &&
                                 d1.getDate() === d2.getDate();
                        };
                        
                        const meal = timetable.find(m => m.mealType === type && isSameDay(date, m.date));
                        const dateMidday = new Date(date);
                        dateMidday.setHours(12, 0, 0, 0);
                        const dateKey = dateMidday.toISOString().split('T')[0];
                        const isActiveSlot = activeCell?.date === dateKey && activeCell?.mealType === type;
                        
                        return (
                          <td key={colIndex} className={`p-4 align-top hover:bg-gray-50/50 transition-colors ${colIndex === 6 ? '' : 'border-r'} border-gray-200/60 ${rowIndex === 3 ? (colIndex === 6 ? 'rounded-br-2xl' : '') : 'border-b'}`}>
                            {meal ? (
                              <div className="relative group/meal h-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                {user?.role === 'vendor' && (
                                  <button onClick={() => handleDelete(meal._id)} className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover/meal:opacity-100 transition-opacity shadow-md hover:bg-red-500 hover:text-white z-10">
                                    <Trash2 size={12} strokeWidth={3} />
                                  </button>
                                )}
                                <ul className="space-y-2">
                                  {meal.items.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 font-medium leading-tight">
                                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${cfg.gradient} flex-shrink-0 mt-1.5 shadow-sm`}></span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div 
                                className={`h-full flex flex-col items-center justify-center p-4 min-h-[120px] rounded-xl transition-all ${
                                  user?.role === 'vendor' ? 'cursor-pointer group' : ''
                                } ${
                                  isActiveSlot
                                    ? 'bg-teal-50 border-2 border-teal-500 shadow-md ring-4 ring-teal-500/15'
                                    : user?.role === 'vendor'
                                      ? 'border border-transparent hover:bg-white hover:shadow-sm hover:border-teal-100'
                                      : ''
                                }`}
                                onClick={(e) => handleSlotClick(e, date, type)}
                              >
                                {user?.role === 'vendor' ? (
                                  isActiveSlot ? (
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
                  )
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

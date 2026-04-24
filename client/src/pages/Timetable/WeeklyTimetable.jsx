import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Clock, UtensilsCrossed, Sunrise, Sun, Coffee, Moon, Plus, X, Trash2 } from 'lucide-react';

const mealTypeConfig = {
  'Breakfast': { icon: Sunrise, gradient: 'from-amber-400 to-orange-400', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
  'Lunch':     { icon: Sun,     gradient: 'from-teal-400 to-emerald-500', bg: 'bg-teal-50',  border: 'border-teal-100',  text: 'text-teal-700' },
  'Evening Snack': { icon: Coffee, gradient: 'from-rose-400 to-pink-400', bg: 'bg-rose-50', border: 'border-rose-100',   text: 'text-rose-700' },
  'Dinner':    { icon: Moon,    gradient: 'from-indigo-400 to-violet-500', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700' },
};

const WeeklyTimetable = () => {
  const { user } = useAuthStore();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCell, setActiveCell] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [itemsInput, setItemsInput] = useState('');

  const fetchTimetable = async () => {
    try { const { data } = await api.get('/api/timetable'); setTimetable(data.data || data); }
    catch { toast.error('Failed to load timetable'); } finally { setLoading(false); }
  };
  useEffect(() => { fetchTimetable(); }, []);

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
      
      const { data } = await api.post('/api/timetable', payload);
      if (data.status === 'success') {
        toast.success('Meal added!'); 
        setTimetable([...timetable, data.data]);
        setActiveCell(null); 
        setItemsInput('');
      }
    } catch (error) { 
      toast.error(error.response?.data?.message || 'Failed to add meal'); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal?')) return;
    try { await api.delete(`/api/timetable/${id}`); setTimetable(timetable.filter(m => m._id !== id)); toast.success('Deleted!'); }
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
      <div className="relative overflow-hidden rounded-[2rem] p-8 bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-600 text-white shadow-[0_20px_50px_-12px_rgba(15,118,110,0.35)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <UtensilsCrossed size={20} />
              </div>
              <span className="text-white/70 text-sm font-bold uppercase tracking-widest">Schedule</span>
            </div>
            <h1 className="text-3xl font-black mb-1">Weekly Mess Timetable</h1>
            <p className="text-white/70 font-medium">Daily meal plan with food items for each session</p>
          </div>
          {user?.role === 'vendor' && (
            <div className="text-white/80 font-medium text-sm hidden md:block">
              <span className="bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 font-bold backdrop-blur-sm shadow-sm inline-flex items-center gap-2">
                <Plus size={14} className="opacity-70" /> Click any empty cell to add a meal
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Add Meal Modal */}
      {activeCell && user?.role === 'vendor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${mealTypeConfig[activeCell.mealType]?.gradient || 'from-teal-400 to-emerald-500'}`}></div>
            
            <button onClick={() => {setActiveCell(null); setItemsInput('');}} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
            
            <h3 className="text-2xl font-black text-gray-900 mb-1">Add Meal</h3>
            <p className="text-gray-500 font-medium mb-6">
              {activeCell.mealType} • {new Date(activeCell.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric'})}
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Menu Items <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <textarea 
                  required 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:bg-white transition-all resize-none" 
                  rows="3" 
                  value={itemsInput} 
                  onChange={e => setItemsInput(e.target.value)}
                  placeholder="e.g. Idli, Sambar, Chutney, Tea"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => {setActiveCell(null); setItemsInput('');}} className="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl flex-1 transition-colors">Cancel</button>
                <Button type="submit" variant="primary" className="flex-1" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Meal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timetable */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-4 sm:p-8 shadow-sm relative z-0">
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
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
                                className={`h-full flex flex-col items-center justify-center p-4 min-h-[120px] rounded-xl transition-all ${user?.role === 'vendor' ? 'cursor-pointer group hover:bg-white hover:shadow-sm border border-transparent hover:border-teal-100' : ''}`}
                                onClick={() => {
                                  if (user?.role === 'vendor') {
                                    // Set midnight local time to avoid timezone offset
                                    const d = new Date(date);
                                    d.setHours(12,0,0,0); // Midday protects against DST/timezone leaps
                                    setActiveCell({ date: d.toISOString().split('T')[0], mealType: type });
                                  }
                                }}
                              >
                                {user?.role === 'vendor' ? (
                                  <>
                                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-500 font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 mb-2">
                                      <Plus size={18} strokeWidth={3} />
                                    </div>
                                    <span className="text-[11px] uppercase tracking-widest text-gray-300 font-bold select-none text-center group-hover:text-teal-600 transition-colors">Add Meal</span>
                                  </>
                                ) : (
                                  <span className="text-[11px] uppercase tracking-widest text-gray-300 font-bold select-none text-center bg-gray-50 px-3 py-1.5 rounded-lg border border-dashed border-gray-200">No Meal</span>
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

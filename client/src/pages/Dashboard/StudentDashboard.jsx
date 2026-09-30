import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import { MessageSquare, Star, Bell, ArrowRight, TrendingUp, ThumbsUp, CheckCircle, Smile, Frown } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const [trendingComplaints, setTrendingComplaints] = useState([]);
  const [resolvedAwaitingFeedback, setResolvedAwaitingFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const { data } = await api.get('/complaints');
        const list = data.data || data;
        const activeComplaints = list.filter(c => c.status === 'pending' || c.status === 'assigned');
        const sorted = activeComplaints.sort((a, b) => {
          const aVotes = a.upvotes?.length || 0;
          const bVotes = b.upvotes?.length || 0;
          if (aVotes !== bVotes) return bVotes - aVotes;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setTrendingComplaints(sorted.slice(0, 3)); // Top 3

        // Find complaints created by this student that are resolved/completed but not yet rated
        const currentUserId = user?._id || user?.id;
        const myResolved = list.filter(
          c => ['resolved', 'vendor_completed'].includes(c.status) &&
               currentUserId &&
               (c.user_id?._id?.toString() === currentUserId.toString() ||
                c.user_id?.toString() === currentUserId.toString()) &&
               !c.resolutionFeedback?.rating
        );
        setResolvedAwaitingFeedback(myResolved);
      } catch {
        console.error('Failed to load recent complaints');
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const handleUpvote = async (id) => {
    try {
      await api.post(`/complaints/${id}/upvote`);
      toast.success('Vote updated.');
      setTrendingComplaints(prev => prev.map(c => {
         if (c._id === id) {
             const votes = c.upvotes || [];
             const hasVoted = votes.includes(user._id);
             return { ...c, upvotes: hasVoted ? votes.filter(v => v !== user._id) : [...votes, user._id] };
         }
         return c;
      }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to record vote');
    }
  };

  const handleQuickFeedback = async (id, rating) => {
    try {
      await api.post(`/complaints/${id}/feedback`, { rating });
      toast.success('Feedback recorded! Thank you for helping improve the mess.');
      setResolvedAwaitingFeedback(prev => prev.filter(c => c._id !== id));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit feedback.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-5 sm:p-10 bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-700 text-white shadow-[0_8px_30px_rgba(20,184,166,0.2)] group">
        <div className="absolute -right-12 -top-12 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Welcome,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-100 to-white">{user?.name}</span>
          </h1>
          <p className="text-teal-100 font-medium mt-2 sm:mt-3 max-w-md text-sm sm:text-base">Manage your mess details, provide feedback, or check today's notices.</p>
          <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full sm:max-w-sm">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-teal-50 mb-1.5">
              <span className="flex items-center gap-1">🛡️ Trust Score</span>
              <span>{user?.trustMeter ?? 100}%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  (user?.trustMeter ?? 100) >= 80 ? 'bg-emerald-300' :
                  (user?.trustMeter ?? 100) >= 50 ? 'bg-amber-300' :
                  'bg-red-400'
                }`}
                style={{ width: `${user?.trustMeter ?? 100}%` }}
              ></div>
            </div>
            {user?.bannedUntil && new Date() < new Date(user.bannedUntil) ? (
              <p className="text-[10px] text-red-200 mt-1.5 font-bold">
                Suspended until {new Date(user.bannedUntil).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-[10px] text-teal-100/80 mt-1.5 font-medium">
                {(user?.trustMeter ?? 100) === 100 ? 'Excellent! Thank you for filing genuine reports.' : 'Genuine resolved reports restore your score by +10.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Resolved Complaints Feedback Banner */}
      {resolvedAwaitingFeedback.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-2 border-emerald-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle size={20} />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900">
                  {resolvedAwaitingFeedback.length} Complaint{resolvedAwaitingFeedback.length > 1 ? 's' : ''} Resolved — Were you satisfied?
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  Your feedback goes directly to the Mess Committee member who resolved your report.
                </p>
              </div>
            </div>
            <NavLink
              to="/complaints"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              All Complaints <ArrowRight size={13} />
            </NavLink>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {resolvedAwaitingFeedback.slice(0, 2).map((c) => (
              <div key={c._id} className="bg-white/95 rounded-2xl p-3.5 border border-emerald-100/90 shadow-sm flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-1">
                    <span className="uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold">{c.category}</span>
                    <span>{new Date(c.resolvedAt || c.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-gray-900 line-clamp-1">{c.title || c.description}</h4>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleQuickFeedback(c._id, 'satisfied')}
                    className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Smile size={14} /> Satisfied
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFeedback(c._id, 'unsatisfied')}
                    className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold border border-rose-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Frown size={14} /> Unsatisfied
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/complaints', label: 'Status', title: 'Complaints', Icon: MessageSquare, color: 'text-blue-600', bg: 'from-blue-100 to-blue-50', hover: 'hover:text-teal-600' },
          { to: '/feedback',   label: 'Today',  title: 'Feedback',   Icon: Star,           color: 'text-amber-500', bg: 'from-amber-100 to-orange-50', hover: 'hover:text-amber-500' },
          { to: '/notices',    label: 'Updates', title: 'Notices',   Icon: Bell,           color: 'text-purple-600', bg: 'from-purple-100 to-violet-50', hover: 'hover:text-purple-600' },
          { to: '/timetable',  label: 'Menu',   title: 'Timetable', Icon: ArrowRight,     color: 'text-teal-600', bg: 'from-teal-100 to-emerald-50', hover: 'hover:text-teal-500' },
        ].map((item) => {
          const { to, label, title, Icon, color, bg, hover } = item;
          return (
            <NavLink key={to} to={to} className={`bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/90 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200`}>
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

      {/* Trending Complaints Section */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mt-4 sm:mt-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">Trending Issues</h2>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Top reported active problems in the mess</p>
            </div>
          </div>
          <Link to="/complaints" className="hidden sm:flex text-sm font-bold text-teal-600 hover:text-teal-700 items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-gray-200 border-t-rose-500 rounded-full animate-spin"></div></div>
        ) : trendingComplaints.length === 0 ? (
          <div className="text-center p-6 sm:p-8 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500 font-medium text-sm">No trending issues at the moment. Everything is running smoothly!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {trendingComplaints.map(complaint => (
              <div key={complaint._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 bg-white border border-gray-100 rounded-xl sm:rounded-2xl hover:shadow-md transition-all hover:border-gray-200 overflow-hidden">
                <div className="flex-1 min-w-0 max-w-full">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-wider rounded-lg">
                      {complaint.category}
                    </span>
                    {complaint.mess?.name && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase tracking-wider rounded-lg truncate max-w-full">
                        🏛️ {complaint.mess.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1 break-all [overflow-wrap:anywhere]">
                    {complaint.title}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 break-all [overflow-wrap:anywhere]">
                    {complaint.description}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleUpvote(complaint._id)}
                  className={`w-fit self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all flex-shrink-0 ${
                    complaint.upvotes?.includes(user._id)
                      ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-inner hover:bg-amber-100 hover:border-amber-400'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-600'
                  }`}
                  title={complaint.upvotes?.includes(user._id) ? "Click to remove your vote" : "I'm experiencing this too"}
                >
                  <ThumbsUp size={16} className={complaint.upvotes?.includes(user._id) ? "fill-amber-500 text-amber-500" : ""} />
                  <span className="hidden sm:inline">{complaint.upvotes?.includes(user._id) ? 'Voted' : 'Me Too'}</span>
                  <span>({complaint.upvotes?.length || 0})</span>
                </button>
              </div>
            ))}
          </div>
        )}
        <Link to="/complaints" className="mt-4 sm:hidden flex justify-center w-full py-3 bg-gray-50 text-teal-600 font-bold rounded-xl border border-gray-100 items-center gap-2">
          View All Complaints <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;

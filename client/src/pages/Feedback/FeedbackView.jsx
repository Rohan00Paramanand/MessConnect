import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Star, TrendingUp, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

const StarRating = ({ rating, setRating, readOnly = false }) => (
  <div className="flex space-x-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-7 w-7 ${readOnly ? '' : 'cursor-pointer hover:scale-110 transition-transform duration-150'} ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'}`}
        onClick={() => !readOnly && setRating(star)}
      />
    ))}
  </div>
);

const categories = ["food", "cleanliness", "timeliness", "taste", "staff behaviour"];
const ITEMS_PER_PAGE = 6;

const FeedbackView = () => {
  const { user, activeCollege } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reliable local date string: YYYY-MM-DD
  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayDateString();
  const isStudent = user?.role === 'user' || user?.role === 'student';

  const [date] = useState(todayStr);
  const [selectedCat, setSelectedCat] = useState("food");
  const [currentRating, setCurrentRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [categoryAverages, setCategoryAverages] = useState({});
  const [avgRating, setAvgRating] = useState('–');
  const [messFilter, setMessFilter] = useState('');
  const [submissionMess, setSubmissionMess] = useState('');
  const [messes, setMesses] = useState([]);

  // Date range filter: draft = what user types, applied = what gets sent to API
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  // Fetch active messes dynamically on mount
  useEffect(() => {
    if (user?.collegeId || user?.role === 'super_admin') {
      api.get('/messes')
        .then(({ data }) => {
          const list = data.data || [];
          setMesses(list);
          if (user?.role === 'vendor') {
            const vendorMessId = user?.messAssigned?._id || user?.messAssigned;
            if (vendorMessId) {
              setMessFilter(vendorMessId);
              setSubmissionMess(vendorMessId);
            }
          } else {
            setMessFilter('');
            if (list.length > 0) {
              setSubmissionMess(list[0]._id);
            }
          }
        })
        .catch(err => {
          console.error('Failed to load messes', err);
        });
    } else if (user?.role === 'vendor') {
      const vendorMessId = user?.messAssigned?._id || user?.messAssigned;
      if (vendorMessId) {
        setMessFilter(vendorMessId);
        setSubmissionMess(vendorMessId);
      }
    }
  }, [user, activeCollege]);

  // Check if current user has already submitted feedback for the selected date and mess
  const existingFeedbackForDate = feedbacks.find((f) => {
    const feedbackUserId = f.user?._id?.toString() || f.user?.toString();
    const currentUserId = user?._id?.toString();
    const feedbackMessId = f.mess?._id?.toString() || f.mess?.toString();
    const isCurrentUser = feedbackUserId && currentUserId ? feedbackUserId === currentUserId : true;
    return isCurrentUser && feedbackMessId === submissionMess && new Date(f.date).toISOString().split('T')[0] === date;
  });
  
  // Check if the selected category has already been rated on this date
  const hasRatedCategory = existingFeedbackForDate?.ratings?.some(
    (r) => r.category === selectedCat
  );
  
  const fetchFeedback = useCallback(async (page = 1, filterVal = messFilter) => {
    setLoading(true);
    try { 
      const params = { page, limit: ITEMS_PER_PAGE };
      if (user?.role === 'vendor') {
        const vendorMessId = user?.messAssigned?._id || user?.messAssigned;
        if (vendorMessId) params.mess = vendorMessId;
      } else if (filterVal) {
        params.mess = filterVal;
      }
      // Only non-students can filter by previous dates (students see daily feedback)
      if (!isStudent) {
        if (appliedStartDate) params.startDate = appliedStartDate;
        if (appliedEndDate) params.endDate = appliedEndDate;
      }

      const { data } = await api.get(`/feedback`, { params }); 

      setFeedbacks(data.data || []);
      setTotalPages(data.totalPages || 0);
      setTotalCount(data.total || 0);
      setCurrentPage(data.page || 1);
      if (data.categoryAverages) setCategoryAverages(data.categoryAverages);
      if (data.avgRating !== undefined) setAvgRating(data.avgRating || '–');
    } catch { 
      toast.error('Failed to load feedback'); 
    } finally { 
      setLoading(false); 
    }
  }, [messFilter, user, isStudent, appliedStartDate, appliedEndDate, activeCollege]);

  useEffect(() => { 
    fetchFeedback(1, messFilter); 
  }, [messFilter, fetchFeedback]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    fetchFeedback(newPage, messFilter);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDateFilter = () => {
    // Commit the draft dates to applied state, which triggers fetchFeedback via useEffect
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (currentRating === 0) {
      toast.error('Please provide a star rating by clicking on the stars.');
      return;
    }
    setSubmitting(true);
    try {
      const ratingsArray = [{ category: selectedCat, rating: currentRating }];
      const { data } = await api.post('/feedback', { date, ratings: ratingsArray, comment, mess: submissionMess });
      if (data.status === 'success') {
        toast.success(`Feedback for ${selectedCat} submitted — thanks!`);
        // Refresh the current page to include the new/updated feedback
        fetchFeedback(currentPage, messFilter);
        setComment('');
        setCurrentRating(0);
      } else { toast.error(data.message || 'Error submitting feedback.'); }
    } catch (error) { toast.error(error.response?.data?.message || 'Error submitting'); }
    finally { setSubmitting(false); }
  };

  // Client-side category filter within the current server page
  const displayedFeedbacks = feedbacks.filter((fb) => {
    if (categoryFilter === 'ALL') return true;
    return fb.ratings?.some((r) => r.category === categoryFilter) || fb.category === categoryFilter;
  });

  const hasDateFilter = startDate || endDate;

  // Build page number buttons with ellipsis for large page counts
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-[0_20px_50px_-12px_rgba(245,158,11,0.3)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-white/10 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Star size={18} fill="white" />
              </div>
              <span className="text-white/70 text-xs sm:text-sm font-bold uppercase tracking-widest">Feedback</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1">Daily Mess Ratings</h1>
            <p className="text-white/70 text-sm sm:text-base font-medium">
              {(user?.role === 'user' || user?.role === 'student') ? "Rate today's meals and see reviews from your peers" : 'View all feedback submitted by users'}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            {user?.role !== 'vendor' ? (
              <Select
                variant="header"
                value={messFilter}
                onChange={(e) => {
                  setMessFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Messes' },
                  ...messes.map((m) => ({ value: m._id, label: m.name }))
                ]}
              />
            ) : (
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/30 text-white font-bold text-sm flex items-center gap-1.5">
                <span>🏛️</span>
                <span>{messes.find(m => m._id === messFilter)?.name || user?.messAssigned?.name || 'Assigned Mess'}</span>
              </div>
            )}
            <div className="text-right bg-white/20 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-2.5 sm:py-4 border border-white/30">
              <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                <TrendingUp size={12} className="text-white/70" />
                <p className="text-white/70 text-[10px] sm:text-xs font-bold uppercase">Avg Rating</p>
              </div>
              <p className="text-2xl sm:text-4xl font-black">{avgRating}<span className="text-sm sm:text-lg text-white/70 font-normal">/5</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Insight Grid (Visible for every single role) */}
      {Object.keys(categoryAverages).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
           {Object.entries(categoryAverages).map(([cat, avg]) => (
               <div key={cat} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[1.5rem] p-3 sm:p-4 text-center hover:shadow-[0_8px_30px_rgba(245,158,11,0.06)] hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">{cat}</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-500">{avg}<span className="text-xs sm:text-sm text-gray-300 font-normal">/5</span></p>
               </div>
           ))}
        </div>
      )}

      {/* Submit Feedback (Student only) */}
      {(user?.role === 'user' || user?.role === 'student') && (
        <div className="bg-white/70 backdrop-blur-xl border border-amber-100 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-[0_8px_30px_rgba(245,158,11,0.08)]">
          <h3 className="text-xl font-black text-gray-900 mb-6">Rate Today's Meals</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input 
                type="text" 
                label="Date" 
                value={new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} 
                disabled 
              />
              
              <Select
                label="Select Mess"
                required
                value={submissionMess}
                onChange={(e) => { setSubmissionMess(e.target.value); setCurrentRating(0); }}
                placeholder={messes.length === 0 ? "No active messes" : "Select Mess"}
                options={
                  messes.length === 0
                    ? [{ value: '', label: 'No active messes', disabled: true }]
                    : messes.map((m) => ({ value: m._id, label: m.name }))
                }
              />
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="block text-sm font-bold text-gray-700">Category to Rate</span>
                  {hasRatedCategory && (
                    <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Already Rated
                    </span>
                  )}
                </div>
                <Select
                  value={selectedCat}
                  onChange={(e) => { setSelectedCat(e.target.value); setCurrentRating(0); }}
                  options={categories.map(cat => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))}
                />
              </div>
            </div>
            
            <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest text-center">Your Rating</label>
              <div className="scale-125 mb-2">
                <StarRating rating={currentRating} setRating={setCurrentRating} />
              </div>
              {currentRating === 0 && <p className="text-xs text-amber-600 mt-2 font-medium">Click stars to rate</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Comments <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className="w-full px-6 py-4 bg-white/50 border border-gray-100 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all duration-300 shadow-inner"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <Button type="submit" variant="user" disabled={submitting || hasRatedCategory} className="w-full sm:w-auto">
              {submitting ? 'Submitting...' : hasRatedCategory ? 'Already Submitted for this Category' : '★ Submit Feedback'}
            </Button>
          </form>
        </div>
      )}

      {/* Filter Section */}
      {isStudent ? (
        totalCount > 0 ? (
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <Select
                label="Filter Reviews by Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: `All Categories (${totalCount})` },
                  ...categories.map((cat) => ({
                    value: cat,
                    label: `${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
                  })),
                ]}
              />
            </div>

            {categoryFilter !== 'ALL' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">
                  Showing <strong>{displayedFeedbacks.length}</strong> of <strong>{feedbacks.length}</strong> on this page
                </span>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        ) : null
      ) : (
        /* Date Filter & Category Filter for Mess Committee, Vendor, and College Admin */
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex items-center gap-1.5 text-gray-500 self-center sm:self-end sm:pb-2.5">
              <Calendar size={16} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filter by Date</span>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">From</label>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || todayStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (endDate && val > endDate) setEndDate(val);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 focus:bg-white shadow-xs hover:border-gray-400 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">To</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  max={todayStr}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 focus:bg-white shadow-xs hover:border-gray-400 transition-all duration-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={handleDateFilter}
                className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-xs transition-all duration-300 active:scale-95 cursor-pointer"
              >
                Apply
              </button>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  className="min-h-[44px] px-3.5 py-2.5 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Category filter + count */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="w-full sm:w-72">
                <Select
                  label="Filter Reviews by Category"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                  }}
                  options={[
                    { value: 'ALL', label: `All Categories (${totalCount})` },
                    ...categories.map((cat) => ({
                      value: cat,
                      label: `${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
                    })),
                  ]}
                />
              </div>

              {categoryFilter !== 'ALL' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">
                    Showing <strong>{displayedFeedbacks.length}</strong> of <strong>{feedbacks.length}</strong> on this page
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('ALL');
                    }}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feedback Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
      ) : displayedFeedbacks.length === 0 ? (
        <div className="text-center p-16 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/50">
          <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Star className="text-amber-400" size={28} />
          </div>
          <h3 className="font-bold text-gray-700 mb-1">No feedback found</h3>
          <p className="text-gray-400 text-sm">
            {hasDateFilter
              ? 'No feedback found for the selected date range.'
              : categoryFilter !== 'ALL'
              ? `No feedback reviews matching category "${categoryFilter}".`
              : (user?.role === 'user' || user?.role === 'student')
              ? "Be the first to rate today's meal!"
              : "No feedback submitted yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedFeedbacks.map(fb => (
            <div key={fb._id} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[1.5rem] p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-bold bg-gray-100 px-3 py-1 rounded-full">
                    {new Date(fb.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    🏛️ {fb.mess?.name || messes.find(m => m._id === fb.mess)?.name || 'Mess'}
                  </span>
                </div>
                {(!fb.ratings || fb.ratings.length === 0) && <StarRating rating={fb.rating} readOnly />}
              </div>

              {fb.ratings && fb.ratings.length > 0 && (
                <div className="grid grid-cols-2 gap-x-2 gap-y-4 mb-5 border-b border-gray-100 pb-5">
                  {fb.ratings.map(r => (
                     <div key={r.category} className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{r.category}</span>
                        <div className="scale-75 origin-left -ml-1"><StarRating rating={r.rating} readOnly /></div>
                     </div>
                  ))}
                </div>
              )}
              {fb.comment && (
                <p className="text-gray-600 text-sm italic leading-relaxed border-l-2 border-amber-300 pl-3 break-words [overflow-wrap:anywhere]">
                  "{fb.comment}"
                </p>
              )}
              {(() => {
                if (user?.role === 'vendor') {
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                          S
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-700 truncate">
                            Student
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            Identity Protected
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                const feedbackUserId = (fb.user?._id || fb.user)?.toString();
                const isCurrentUser = user?._id && feedbackUserId === user._id.toString();
                const studentName = (typeof fb.user === 'object' && fb.user?.name)
                  ? fb.user.name
                  : (isCurrentUser ? (user?.name || 'Student') : 'Student');
                const studentEmail = (typeof fb.user === 'object' && fb.user?.email)
                  ? fb.user.email
                  : (isCurrentUser ? user?.email : null);

                return (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {studentName}
                          </p>
                          {isCurrentUser && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        {studentEmail && (
                          <p className="text-[11px] text-gray-400 truncate">
                            {studentEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls — server-side */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-2.5 pt-6 border-t border-gray-200/60 w-full">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={currentPage === 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {getPageNumbers().map((pg, idx) =>
              pg === '...' ? (
                <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400 font-bold">
                  …
                </span>
              ) : (
                <button
                  key={pg}
                  type="button"
                  disabled={loading}
                  onClick={() => handlePageChange(pg)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pg
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pg}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage === totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

          <p className="text-xs text-gray-500 font-medium text-center">
            Showing <strong className="text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong className="text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</strong> of <strong className="text-gray-900">{totalCount}</strong> reviews
          </p>
        </div>
      )}
    </div>
  );
};
export default FeedbackView;

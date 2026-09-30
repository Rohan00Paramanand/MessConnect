import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Star, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

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

const FeedbackView = () => {
  const { user } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCat, setSelectedCat] = useState("food");
  const [currentRating, setCurrentRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [categoryAverages, setCategoryAverages] = useState({});
  const [avgRating, setAvgRating] = useState('–');
  const [messFilter, setMessFilter] = useState('');
  const [submissionMess, setSubmissionMess] = useState('');
  const [messes, setMesses] = useState([]);

  // Fetch active messes dynamically on mount
  useEffect(() => {
    if (user?.collegeId) {
      api.get('/messes')
        .then(({ data }) => {
          const list = data.data || [];
          setMesses(list);
          if (list.length > 0) {
            setMessFilter(list[0]._id);
            setSubmissionMess(list[0]._id);
          }
        })
        .catch(err => {
          console.error('Failed to load messes', err);
        });
    }
  }, [user]);

  // Check if there is already a feedback submitted for the selected date and mess
  const existingFeedbackForDate = feedbacks.find(
    (f) => new Date(f.date).toISOString().split('T')[0] === date && f.mess === submissionMess
  );
  
  // Check if the selected category has already been rated on this date
  const hasRatedCategory = existingFeedbackForDate?.ratings?.some(
    (r) => r.category === selectedCat
  );
  
  const fetchFeedback = useCallback(async (pageNum = 1, filterVal = messFilter) => {
    setLoading(true);
    try { 
      const params = { page: pageNum, limit: 9 };
      if (filterVal) params.mess = filterVal;
      const { data } = await api.get(`/feedback`, { params }); 

      setFeedbacks(data.data || []);
      setTotalPages(data.totalPages || 1);
      if (data.categoryAverages) setCategoryAverages(data.categoryAverages);
      if (data.avgRating !== undefined) setAvgRating(data.avgRating || '–');
    } catch { 
      toast.error('Failed to load feedback'); 
    } finally { 
      setLoading(false); 
    }
  }, [messFilter]);

  useEffect(() => { 
    setPage(1);
    fetchFeedback(1, messFilter); 
  }, [messFilter, fetchFeedback]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchFeedback(newPage, messFilter);
    window.scrollTo({ top: 300, behavior: 'smooth' });
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
        // If it was an update, replace it in the array, otherwise unshift
        const exists = feedbacks.find(f => f._id === data.data._id);
        if (exists) {
           setFeedbacks(feedbacks.map(f => f._id === data.data._id ? data.data : f));
        } else {
           setFeedbacks([data.data, ...feedbacks]); 
        }
        setComment('');
        setCurrentRating(0);
      } else { toast.error(data.message || 'Error submitting feedback.'); }
    } catch (error) { toast.error(error.response?.data?.message || 'Error submitting'); }
    finally { setSubmitting(false); }
  };



  const displayedFeedbacks = feedbacks.filter((fb) => {
    if (categoryFilter === 'ALL') return true;
    return fb.ratings?.some((r) => r.category === categoryFilter) || fb.category === categoryFilter;
  });

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
              {(user?.role === 'user' || user?.role === 'student') ? "Rate today's meals and share your thoughts" : 'View all feedback submitted by users'}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <Select
              variant="header"
              value={messFilter}
              onChange={(e) => setMessFilter(e.target.value)}
              options={messes.map((m) => ({ value: m._id, label: m.name }))}
            />
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

      {/* Dropdown Filter for Reviews */}
      {feedbacks.length > 0 && (
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <Select
              label="Filter Reviews by Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'ALL', label: `All Categories (${feedbacks.length})` },
                ...categories.map((cat) => ({
                  value: cat,
                  label: `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${
                    feedbacks.filter(
                      (fb) => fb.ratings?.some((r) => r.category === cat) || fb.category === cat
                    ).length
                  })`,
                })),
              ]}
            />
          </div>

          {categoryFilter !== 'ALL' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">
                Showing <strong>{displayedFeedbacks.length}</strong> of <strong>{feedbacks.length}</strong> reviews
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
            {categoryFilter !== 'ALL'
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
                {user?.role !== 'mess_committee' && (!fb.ratings || fb.ratings.length === 0) && <StarRating rating={fb.rating} readOnly />}
              </div>

              {user?.role !== 'mess_committee' && fb.ratings && fb.ratings.length > 0 && (
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
              {(user?.role === 'vendor' || user?.role === 'mess_committee' || user?.role === 'college_admin' || user?.role === 'super_admin') && fb.user && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {(fb.user?.name || 'S').charAt(0)}
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{fb.user?.name || 'Student'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-2.5 pt-6 border-t border-gray-200/60 w-full">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={page === 1 || loading}
              onClick={() => handlePageChange(page - 1)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                disabled={loading}
                onClick={() => handlePageChange(pg)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  page === pg ? 'bg-amber-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPages || loading}
              onClick={() => handlePageChange(page + 1)}
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-500 font-medium text-center">
            Page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{totalPages}</strong>
          </p>
        </div>
      )}
    </div>
  );
};
export default FeedbackView;

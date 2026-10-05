import React, { useEffect, useState, useCallback, useMemo } from 'react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquare,
  Printer,
  RefreshCw,
  ChefHat,
  Award,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Smile,
  Frown,
  Utensils,
  Building,
  Zap,
  CheckCircle,
  FileText
} from 'lucide-react';
import VendorReportDocumentModal from '../../components/vendor/VendorReportDocumentModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line
} from 'recharts';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CATEGORY_ICONS = {
  food: '🍲',
  cleanliness: '✨',
  timeliness: '⏱️',
  taste: '😋',
  'staff behaviour': '🤝',
  other: '📌'
};

const CATEGORY_COLORS = {
  food: '#ef4444',
  cleanliness: '#3b82f6',
  timeliness: '#f59e0b',
  taste: '#8b5cf6',
  'staff behaviour': '#10b981',
  other: '#64748b'
};

export default function VendorMonthlyReport() {
  const { user } = useAuthStore();
  const now = useMemo(() => new Date(), []);

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1 - 12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const fetchReport = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const params = {
        month: selectedMonth,
        year: selectedYear
      };

      const res = await api.get('/vendor/reports/monthly', { params });
      setData(res.data.data);
      if (isSilent) toast.success('Report updated');
    } catch (err) {
      console.error('Failed to load vendor monthly report:', err);
      toast.error(err.response?.data?.message || 'Failed to load monthly report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Prepare chart datasets
  const categoryChartData = useMemo(() => {
    if (!data?.complaintsByCategory) return [];
    return Object.entries(data.complaintsByCategory).map(([cat, count]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      key: cat,
      count,
      icon: CATEGORY_ICONS[cat] || '📌',
      fill: CATEGORY_COLORS[cat] || '#e11d48'
    }));
  }, [data]);

  const speedChartData = useMemo(() => {
    if (!data?.turnaroundSpeed) return [];
    return [
      { label: '< 2 Hours', count: data.turnaroundSpeed.under2Hours, color: '#10b981' },
      { label: '2 - 12 Hours', count: data.turnaroundSpeed.under12Hours, color: '#3b82f6' },
      { label: '12 - 24 Hours', count: data.turnaroundSpeed.under24Hours, color: '#f59e0b' },
      { label: '> 24 Hours', count: data.turnaroundSpeed.over24Hours, color: '#ef4444' }
    ];
  }, [data]);

  const dailyTrendChartData = useMemo(() => {
    if (!data?.feedbackDetails?.dailyTrend) return [];
    return data.feedbackDetails.dailyTrend;
  }, [data]);

  const summary = data?.summary || {};
  const comparison = data?.comparison || {};

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      
      {/* Unified Executive Report Header & Screen Controls */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Identity & Scope */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 text-[11px] font-black uppercase tracking-wider rounded-xl inline-flex items-center gap-1.5">
                <ChefHat size={13} className="text-rose-600" /> Vendor Performance Audit
              </span>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-xl inline-flex items-center gap-1.5">
                <Calendar size={12} className="text-gray-500" />
                <span>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Monthly Vendor Report
            </h1>
            
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Turnaround compliance, resolution SLAs, and dining feedback for <strong className="text-gray-900 font-bold">{data?.mess?.name || 'Your Mess'}</strong>
              {data?.vendor?.name && (
                <span className="hidden sm:inline text-gray-400"> • Managed by <strong className="text-gray-700 font-bold">{data.vendor.name}</strong></span>
              )}.
            </p>
          </div>

          {/* Period Selector & Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
            {/* Month Stepper & Refresh */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-between flex-1 sm:flex-initial bg-gray-100/90 rounded-2xl p-1 border border-gray-200">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-white rounded-xl text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 sm:px-3 text-xs sm:text-sm font-bold text-gray-800 whitespace-nowrap min-w-[110px] sm:min-w-[125px] text-center">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white rounded-xl text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Quick Refresh */}
              <button
                type="button"
                onClick={() => fetchReport(true)}
                disabled={refreshing || loading}
                className="p-2 sm:p-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex-shrink-0"
                title="Refresh Report Data"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin text-rose-600' : ''} />
              </button>
            </div>

            {/* Generate Official Document / Export Button */}
            <button
              type="button"
              onClick={() => setIsDocModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-rose-600/20"
            >
              <FileText size={16} className="flex-shrink-0" />
              <span className="whitespace-nowrap">Generate Official Document</span>
            </button>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-white/60 space-y-4">
          <div className="w-12 h-12 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-bold text-sm">Generating Monthly Audit Report...</p>
        </div>
      ) : !data ? (
        <div className="p-12 text-center bg-white rounded-2xl sm:rounded-3xl border border-gray-200 space-y-3">
          <AlertCircle size={36} className="text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No report data found</h3>
          <p className="text-xs text-gray-500">Could not compile report metrics for the requested period.</p>
        </div>
      ) : (
        <>
          {/* 6 Core KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* KPI 1: Resolution Rate */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-3.5 sm:p-4 rounded-2xl shadow-sm space-y-2 col-span-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Resolution</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={15} />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-600">{summary.resolutionRate}%</p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5 truncate">
                  {summary.resolvedCount} of {summary.totalComplaints} resolved
                </p>
              </div>
            </div>

            {/* KPI 2: Total Complaints */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-3.5 sm:p-4 rounded-2xl shadow-sm space-y-2 col-span-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Complaints</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={15} />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">{summary.totalComplaints}</p>
                <div className="flex items-center gap-1 mt-0.5 text-[10px] sm:text-[11px] font-bold">
                  {comparison.complaintsChangePercent !== null ? (
                    <span className={`inline-flex items-center gap-0.5 ${
                      comparison.complaintsChangePercent <= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {comparison.complaintsChangePercent <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                      {Math.abs(comparison.complaintsChangePercent)}%
                    </span>
                  ) : (
                    <span className="text-gray-400 font-medium">Logged</span>
                  )}
                  <span className="text-gray-400 font-medium truncate">vs prev mo</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Avg Resolution Turnaround */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-3.5 sm:p-4 rounded-2xl shadow-sm space-y-2 col-span-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Turnaround</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Clock size={15} />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
                  {summary.avgResolutionHours !== null ? `${summary.avgResolutionHours}h` : '–'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5 truncate">
                  {summary.avgResolutionHours !== null ? 'Avg speed to resolve' : 'No resolved items'}
                </p>
              </div>
            </div>

            {/* KPI 4: Student Satisfaction */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-3.5 sm:p-4 rounded-2xl shadow-sm space-y-2 col-span-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Satisfaction</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <ThumbsUp size={15} />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-teal-600">
                  {summary.satisfactionRate !== null ? `${summary.satisfactionRate}%` : '–'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5 truncate">
                  {data.resolutionFeedback.satisfied} satisfied ratings
                </p>
              </div>
            </div>

            {/* KPI 5: Monthly Meal Rating */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-3.5 sm:p-4 rounded-2xl shadow-sm space-y-2 col-span-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Meal Rating</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
                  {summary.overallAvgRating !== null ? `${summary.overallAvgRating} ★` : '–'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5 truncate">
                  {summary.totalFeedbacks} reviews logged
                </p>
              </div>
            </div>

            {/* KPI 6: Committee Inspections */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-3.5 sm:p-4 rounded-2xl shadow-sm space-y-2 col-span-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Inspections</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={15} />
                </div>
              </div>
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
                  {summary.completedInspections}
                </p>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5 truncate">
                  {summary.totalInspections} visits logged
                </p>
              </div>
            </div>

          </div>

          {/* Section: Complaints & Resolution Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Category Distribution Chart */}
            <div className="lg:col-span-7 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">Complaints by Category</h3>
                  <p className="text-xs text-gray-500 font-medium">Distribution across food quality, cleanliness, timeliness, etc.</p>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-xl">
                  {summary.totalComplaints} Total
                </span>
              </div>

              {categoryChartData.length > 0 && summary.totalComplaints > 0 ? (
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" height={42} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '0.75rem',
                          border: '1px solid #334155',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                          padding: '8px 12px'
                        }}
                        itemStyle={{ color: '#ffffff', fontWeight: 700, fontSize: '12px' }}
                        labelStyle={{ color: '#cbd5e1', fontWeight: 700, fontSize: '11px', marginBottom: '2px' }}
                        cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                        formatter={(value) => [`${value} complaints`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {categoryChartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-xs font-bold text-gray-500">No complaints logged in this period. Great job!</p>
                </div>
              )}

              {/* Category Mini-Pills with percentage */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 pt-2 border-t border-gray-100">
                {categoryChartData.map((cat) => (
                  <div key={cat.key} className="flex items-center justify-between gap-1 p-2 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
                    <span className="font-bold text-gray-700 flex items-center gap-1 min-w-0">
                      <span className="flex-shrink-0">{cat.icon}</span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-black text-gray-900 bg-white px-2 py-0.5 rounded-lg border border-gray-200 flex-shrink-0 text-[11px]">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Turnaround Speed & Resolution SLA Breakdown */}
            <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base sm:text-lg font-black text-gray-900">Resolution Speed (SLA)</h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    Response Speed
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">Turnaround from student report to vendor resolution with photo proof.</p>
              </div>

              {/* Speed Brackets Progress Meters */}
              <div className="space-y-3 my-auto">
                {speedChartData.map((item) => {
                  const totalCompleted = (data.turnaroundSpeed.under2Hours + data.turnaroundSpeed.under12Hours + data.turnaroundSpeed.under24Hours + data.turnaroundSpeed.over24Hours) || 1;
                  const pct = Math.round((item.count / totalCompleted) * 100) || 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-700">{item.label}</span>
                        <span className="text-gray-900 font-black">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fastest vs Slowest Snapshot */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-gray-100">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Fastest Resolution</span>
                  <span className="text-base sm:text-lg font-black text-emerald-900">
                    {data.turnaroundSpeed.minHours !== null ? `${data.turnaroundSpeed.minHours} hrs` : '–'}
                  </span>
                </div>
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Longest Turnaround</span>
                  <span className="text-base sm:text-lg font-black text-amber-900">
                    {data.turnaroundSpeed.maxHours !== null ? `${data.turnaroundSpeed.maxHours} hrs` : '–'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Section: Student Feedback & Dining Quality Scorecard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Category Scorecard */}
            <div className="lg:col-span-6 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">Dining Quality Scorecard</h3>
                  <p className="text-xs text-gray-500 font-medium">Category averages rated by students (out of 5.0 ★)</p>
                </div>
                <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {summary.overallAvgRating || '–'} / 5.0
                </span>
              </div>

              <div className="space-y-3.5">
                {Object.entries(data.feedbackDetails.categoryAverages).map(([cat, score]) => {
                  const numScore = score || 0;
                  const pct = Math.round((numScore / 5) * 100);
                  const isGood = numScore >= 4.0;
                  const isFair = numScore >= 3.0;

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-800 flex items-center gap-1.5 capitalize">
                          <span>{CATEGORY_ICONS[cat] || '🍽️'}</span>
                          <span>{cat}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          isGood ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          isFair ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {score ? `${score} ★` : 'No ratings'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isGood ? 'bg-emerald-500' : isFair ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Star Rating Distribution */}
              <div className="pt-3 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Star Distribution
                </span>
                <div className="grid grid-cols-5 gap-1 sm:gap-1.5 text-center text-xs">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="p-1.5 sm:p-2 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="font-black text-gray-900 block text-xs sm:text-sm">{stars} ★</span>
                      <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium">
                        {data.feedbackDetails.ratingDistribution[stars] || 0} votes
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Feedback Trend Chart */}
            <div className="lg:col-span-6 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">Daily Rating Trend</h3>
                  <p className="text-xs text-gray-500 font-medium">Track day-to-day student dining satisfaction over the month</p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                  Daily Averages
                </span>
              </div>

              {dailyTrendChartData.length > 0 ? (
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
                      <YAxis domain={[1, 5]} allowDecimals={true} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '0.75rem',
                          border: '1px solid #334155',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                          padding: '8px 12px'
                        }}
                        itemStyle={{ color: '#ffffff', fontWeight: 700, fontSize: '12px' }}
                        labelStyle={{ color: '#cbd5e1', fontWeight: 700, fontSize: '11px', marginBottom: '2px' }}
                        formatter={(val) => [`${val} ★`, 'Rating']}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgRating"
                        stroke="#e11d48"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#e11d48' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-xs font-bold text-gray-500">No daily feedbacks recorded during this month.</p>
                </div>
              )}

              {/* Resolution Feedback Split */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black flex-shrink-0 text-base sm:text-lg">
                    😊
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-bold text-emerald-950 uppercase tracking-wider">Resolution Satisfaction</h4>
                    <p className="text-xs sm:text-sm font-black text-emerald-900">
                      {data.resolutionFeedback.satisfied} Satisfied vs {data.resolutionFeedback.unsatisfied} Unsatisfied
                    </p>
                  </div>
                </div>
                <div className="sm:text-right self-end sm:self-auto">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700">
                    {data.resolutionFeedback.satisfactionRate !== null ? `${data.resolutionFeedback.satisfactionRate}%` : '–'}
                  </span>
                  <span className="block text-[10px] font-bold text-emerald-800">Approval Score</span>
                </div>
              </div>

            </div>

          </div>

          {/* Section: Student Feedback Stream & Inspection Audit Log */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Student Comments on Resolutions */}
            <div className="lg:col-span-6 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Student Resolution Feedback Remarks</span>
                </h3>
                <span className="text-xs text-gray-400 font-bold">Anonymized</span>
              </div>

              {data.resolutionFeedback.recentComments && data.resolutionFeedback.recentComments.length > 0 ? (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {data.resolutionFeedback.recentComments.map((c) => (
                    <div key={c.id} className="p-3 bg-gray-50/80 border border-gray-100 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-gray-800">
                          <span>{c.rating === 'satisfied' ? '😊' : '🙁'}</span>
                          <span className="capitalize">{c.category} Issue</span>
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(c.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium italic break-words">
                        "{c.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">No feedback comments recorded for resolutions this month.</p>
                </div>
              )}
            </div>

            {/* Committee Inspections Log */}
            <div className="lg:col-span-6 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-purple-600" />
                  <span>Committee Inspection Visits Log</span>
                </h3>
                <span className="text-xs text-purple-700 bg-purple-50 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                  {data.inspections?.length || 0} Visits
                </span>
              </div>

              {data.inspections && data.inspections.length > 0 ? (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {data.inspections.map((insp) => (
                    <div key={insp.id} className="p-3 bg-gray-50/80 border border-gray-100 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-900 truncate max-w-xs">{insp.purpose}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                          insp.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {insp.status}
                        </span>
                      </div>
                      {insp.remarks && (
                        <p className="text-xs text-gray-600 font-medium">
                          Notes: {insp.remarks}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400">
                        Date: {new Date(insp.visitDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">No committee inspection visits scheduled for this month.</p>
                </div>
              )}
            </div>

          </div>

          {/* Report Footer & Reference */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center text-xs text-gray-500 font-medium">
            Report generated electronically on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} via PCET MessConnect Vendor Operations Console.
          </div>
        </>
      )}

      {/* Official Document Preview & Export Modal */}
      <VendorReportDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        data={data}
      />

    </div>
  );
}

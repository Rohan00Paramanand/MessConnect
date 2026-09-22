import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  School,
  Users,
  MessageSquare,
  Star,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
  Search,
  ShieldCheck,
  Award,
  CheckCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const COMPLAINT_COLORS = {
  resolved: '#10b981', // emerald-500
  assigned: '#3b82f6', // blue-500
  pending: '#f59e0b',  // amber-500
  rejected: '#ef4444', // red-500
  vendor_completed: '#8b5cf6' // violet-500
};

export default function SuperAdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all'); // all, active, inactive, unassigned, needs_attention

  const fetchAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/superadmin/analytics');
      if (res.data?.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch platform analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Filtered colleges for the health table
  const filteredColleges = useMemo(() => {
    if (!data?.collegeHealth) return [];
    return data.collegeHealth.filter((col) => {
      const matchesSearch = col.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (collegeFilter === 'active') return col.isActive;
      if (collegeFilter === 'inactive') return !col.isActive;
      if (collegeFilter === 'unassigned') return !col.hasAdmin;
      if (collegeFilter === 'needs_attention') return col.healthScore < 60 || col.pendingComplaints > 3;

      return true;
    });
  }, [data?.collegeHealth, searchQuery, collegeFilter]);

  // Complaints donut data
  const complaintChartData = useMemo(() => {
    if (!data?.complaints?.byStatus) return [];
    const statusMap = data.complaints.byStatus;
    return [
      { name: 'Resolved', value: statusMap.resolved || 0, color: COMPLAINT_COLORS.resolved },
      { name: 'Assigned', value: statusMap.assigned || 0, color: COMPLAINT_COLORS.assigned },
      { name: 'Pending', value: statusMap.pending || 0, color: COMPLAINT_COLORS.pending },
      { name: 'Rejected', value: statusMap.rejected || 0, color: COMPLAINT_COLORS.rejected },
    ].filter((item) => item.value > 0);
  }, [data?.complaints?.byStatus]);

  // Complaints category bar chart data
  const categoryBarData = useMemo(() => {
    if (!data?.complaints?.byCategory) return [];
    return Object.entries(data.complaints.byCategory).map(([key, value]) => ({
      category: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
      complaints: value,
    })).sort((a, b) => b.complaints - a.complaints);
  }, [data?.complaints?.byCategory]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium text-sm animate-pulse">Aggregating cross-campus intelligence...</p>
      </div>
    );
  }

  const { summary, complaints, feedback, invitations, healthSignals, userGrowthByMonth } = data || {};

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Control Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <span>Root Administration</span>
            <span>•</span>
            <span>Commercial & Platform Telemetry</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Platform Operations & Commercial Success</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Cross-campus institutional adoption, user growth velocity, student satisfaction benchmarks, and partner onboarding funnel.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <NavLink
            to="/colleges"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-emerald-600/20"
          >
            <School className="w-4 h-4" />
            <span>Manage Colleges</span>
          </NavLink>
        </div>
      </div>

      {/* Health Signals Warning Banner (if alerts present) */}
      {(healthSignals?.pendingApprovals > 0 || healthSignals?.lowTrustUsers > 0 || healthSignals?.bannedUsers > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Operational Signals Requiring Campus Attention</h4>
              <div className="flex items-center gap-4 mt-1 text-xs text-amber-800 flex-wrap">
                {healthSignals.pendingApprovals > 0 && (
                  <span className="font-semibold underline">
                    {healthSignals.pendingApprovals} user{healthSignals.pendingApprovals > 1 ? 's' : ''} awaiting campus admin verification
                  </span>
                )}
                {healthSignals.lowTrustUsers > 0 && (
                  <span>
                    • <strong className="font-semibold">{healthSignals.lowTrustUsers}</strong> user{healthSignals.lowTrustUsers > 1 ? 's' : ''} with low trust scores (&lt;50)
                  </span>
                )}
                {healthSignals.bannedUsers > 0 && (
                  <span>
                    • <strong className="font-semibold">{healthSignals.bannedUsers}</strong> currently active suspension{healthSignals.bannedUsers > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Top Platform KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Colleges */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Colleges</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{summary?.totalColleges || 0}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{summary?.activeColleges || 0} active campus{summary?.activeColleges === 1 ? '' : 'es'}</span>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Users</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{summary?.totalUsers || 0}</div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-2 font-medium truncate">
            <span>{summary?.roleCounts?.student || 0} std</span> •
            <span>{summary?.roleCounts?.vendor || 0} vnd</span> •
            <span>{summary?.roleCounts?.mess_committee || 0} cmt</span>
          </div>
        </div>

        {/* College Admins */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Admins</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{summary?.roleCounts?.college_admin || 0}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-indigo-600">
            <span>Managing {summary?.activeColleges || 0} colleges</span>
          </div>
        </div>

        {/* Messes */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Messes</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{summary?.totalMesses || 0}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-500">
            <span>Across all campuses</span>
          </div>
        </div>

        {/* Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Complaints</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{summary?.totalComplaints || 0}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-rose-600">
            <span>{summary?.pendingComplaints || 0} pending action</span>
          </div>
        </div>

        {/* Platform Rating */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Avg Rating</span>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900">
              {summary?.avgPlatformRating ? summary.avgPlatformRating.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-gray-400 font-bold">/ 5.0</span>
          </div>
          <div className="text-xs text-gray-500 mt-2 font-medium">
            {feedback?.totalReviews || 0} student ratings
          </div>
        </div>
      </div>

      {/* SECTION 2: Growth Charts & Complaints Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Growth Line/Area Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">Cross-Campus User Registration Growth</h3>
              <p className="text-xs text-gray-500">New user accounts onboarded per month across campuses</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Past 6 Months</span>
            </div>
          </div>

          <div className="h-72 w-full">
            {userGrowthByMonth && userGrowthByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="students" name="Students" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStudents)" />
                  <Area type="monotone" dataKey="vendors" name="Vendors" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} />
                  <Area type="monotone" dataKey="committee" name="Committee" stroke="#06b6d4" strokeWidth={2} fillOpacity={0} />
                  <Area type="monotone" dataKey="total" name="Total Added" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No user growth timeline data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Complaint Status Distribution Donut */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">Complaints Resolution Telemetry</h3>
            <p className="text-xs text-gray-500 mb-2">Live breakdown of grievances across states</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {complaintChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {complaintChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 text-sm">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-1" />
                No complaints recorded
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
              <span className="text-gray-600">Resolved ({complaints?.byStatus?.resolved || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
              <span className="text-gray-600">Pending ({complaints?.byStatus?.pending || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
              <span className="text-gray-600">Assigned ({complaints?.byStatus?.assigned || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0"></span>
              <span className="text-gray-600">Rejected ({complaints?.byStatus?.rejected || 0})</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: College Health Matrix (The Core System View) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Institutional Health & Activity Matrix</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live status, student population, admin coverage, and composite operational index per college.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search college by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-56"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
              <button
                onClick={() => setCollegeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  collegeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All ({data?.collegeHealth?.length || 0})
              </button>
              <button
                onClick={() => setCollegeFilter('unassigned')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  collegeFilter === 'unassigned' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                No Admin
              </button>
              <button
                onClick={() => setCollegeFilter('needs_attention')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  collegeFilter === 'needs_attention' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Needs Care
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-3.5">College Campus</th>
                <th className="px-6 py-3.5">Campus Administrator</th>
                <th className="px-6 py-3.5 text-center">User Breakdown</th>
                <th className="px-6 py-3.5 text-center">Active Messes</th>
                <th className="px-6 py-3.5 text-center">Complaints</th>
                <th className="px-6 py-3.5 text-center">Satisfaction</th>
                <th className="px-6 py-3.5 text-right">Health Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredColleges.length > 0 ? (
                filteredColleges.map((col) => {
                  const healthBadgeColor =
                    col.healthScore >= 75
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : col.healthScore >= 50
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={col.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* College Name & Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/60 flex items-center justify-center text-emerald-800 font-black text-xs flex-shrink-0">
                            {col.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 leading-tight">{col.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  col.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}
                              >
                                {col.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Admin Info */}
                      <td className="px-6 py-4">
                        {col.hasAdmin && col.admins?.[0] ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {col.admins[0].name ? col.admins[0].name[0].toUpperCase() : 'A'}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-gray-900 truncate">{col.admins[0].name || 'Administrator'}</div>
                              <div className="text-[11px] text-gray-400 truncate">{col.admins[0].email}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>No Admin Assigned</span>
                          </div>
                        )}
                      </td>

                      {/* User Breakdown */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold">
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100" title="Students">
                            {col.studentCount} std
                          </span>
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100" title="Vendors">
                            {col.vendorCount} vnd
                          </span>
                          <span className="text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100" title="Mess Committee">
                            {col.committeeCount} cmt
                          </span>
                        </div>
                      </td>

                      {/* Active Messes */}
                      <td className="px-6 py-4 text-center font-bold text-gray-800">
                        {col.activeMessCount} / {col.messCount}
                      </td>

                      {/* Complaints (Pending / Resolved) */}
                      <td className="px-6 py-4 text-center">
                        {col.totalComplaints > 0 ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200" title="Pending Complaints">
                              {col.pendingComplaints} pend
                            </span>
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200" title="Resolved Complaints">
                              {col.resolvedComplaints} res
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">None</span>
                        )}
                      </td>

                      {/* Satisfaction */}
                      <td className="px-6 py-4 text-center">
                        {col.avgRating > 0 ? (
                          <div className="inline-flex items-center gap-1 text-xs font-bold text-gray-900">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{col.avgRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No ratings</span>
                        )}
                      </td>

                      {/* Composite Health Score */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                col.healthScore >= 75
                                  ? 'bg-emerald-500'
                                  : col.healthScore >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${col.healthScore}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${healthBadgeColor}`}>
                            {col.healthScore}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400 text-sm">
                    No colleges match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: Complaints by Category & Feedback Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Complaints Category Bar Chart */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">Complaints by Operational Category</h3>
              <p className="text-xs text-gray-500">Distribution of user dissatisfaction triggers across colleges</p>
            </div>
            {complaints?.avgResolutionHours && (
              <div className="text-right">
                <div className="text-xs text-gray-400 font-semibold uppercase">Avg Resolution</div>
                <div className="text-sm font-bold text-emerald-600">
                  {complaints.avgResolutionHours > 24
                    ? `${(complaints.avgResolutionHours / 24).toFixed(1)} days`
                    : `${complaints.avgResolutionHours} hrs`}
                </div>
              </div>
            )}
          </div>

          <div className="h-64 w-full">
            {categoryBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="complaints" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No complaint categories recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Feedback Category Scores */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 tracking-tight">Satisfaction by Category</h3>
                <p className="text-xs text-gray-500">Aggregate ratings scored by students (1.0 - 5.0)</p>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-black text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{feedback?.overallRating ? feedback.overallRating.toFixed(1) : '—'}</span>
              </div>
            </div>

            {/* Category Rating Progress Bars */}
            <div className="space-y-4">
              {feedback?.byCategory && feedback.byCategory.length > 0 ? (
                feedback.byCategory.map((cat) => {
                  const pct = Math.round((cat.avgRating / 5) * 100);
                  const title = cat.category.charAt(0).toUpperCase() + cat.category.slice(1).replace('_', ' ');
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                        <span>{title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-normal">({cat.count} ratings)</span>
                          <span className="font-bold text-gray-900">{cat.avgRating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cat.avgRating >= 4
                              ? 'bg-emerald-500'
                              : cat.avgRating >= 3
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-400 text-sm">
                  No feedback ratings received across campuses yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Overall review volume: <strong>{feedback?.totalReviews || 0}</strong> submissions</span>
            <span className="text-emerald-700 font-semibold">Live System Metric</span>
          </div>
        </div>
      </div>

      {/* SECTION 5: Invitation Pipeline Telemetry */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span>Super Admin Invitation Pipeline</span>
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">College Administrator Invitations</h3>
            <p className="text-xs text-gray-500">Telemetry tracking onboarding invites sent to prospective campus administrators</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-gray-400">Total Sent: </span>
              <strong className="text-gray-900 font-black">{invitations?.total || 0}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
              <span>Accepted: </span>
              <strong className="font-black">{invitations?.accepted || 0}</strong> ({invitations?.acceptanceRate || 0}%)
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
              <span>Pending: </span>
              <strong className="font-black">{invitations?.pending || 0}</strong>
            </div>
          </div>
        </div>

        {/* Recent Invitations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              <tr>
                <th className="px-4 py-3">Recipient Email</th>
                <th className="px-4 py-3">Designated College</th>
                <th className="px-4 py-3">Sent On</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {invitations?.recent && invitations.recent.length > 0 ? (
                invitations.recent.map((inv) => {
                  const isExpired = !inv.isAccepted && new Date(inv.expiresAt) < new Date();
                  return (
                    <tr key={inv._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{inv.email}</td>
                      <td className="px-4 py-3 text-gray-600 font-medium">
                        {inv.collegeId?.name || 'Unassigned Campus'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(inv.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {inv.isAccepted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Accepted
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-bold text-[10px]">
                            <Clock className="w-3 h-3" /> Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            <Clock className="w-3 h-3" /> Pending Acceptance
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-xs">
                    No invitations have been sent out yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

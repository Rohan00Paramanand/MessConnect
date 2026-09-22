import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  School,
  Users,
  UtensilsCrossed,
  MessageSquare,
  Star,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Award,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const COMPLAINT_COLORS = {
  resolved: '#10b981', // emerald-500
  assigned: '#3b82f6', // blue-500
  pending: '#f59e0b',  // amber-500
  rejected: '#ef4444'  // red-500
};

export default function CollegeAdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/admin/analytics');
      if (res.data?.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load campus analytics:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch campus analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Complaints Donut Data
  const complaintStatusData = useMemo(() => {
    if (!data?.complaints?.byStatus) return [];
    const statusMap = data.complaints.byStatus;
    return [
      { name: 'Resolved', value: statusMap.resolved || 0, color: COMPLAINT_COLORS.resolved },
      { name: 'Assigned', value: statusMap.assigned || 0, color: COMPLAINT_COLORS.assigned },
      { name: 'Pending', value: statusMap.pending || 0, color: COMPLAINT_COLORS.pending },
      { name: 'Rejected', value: statusMap.rejected || 0, color: COMPLAINT_COLORS.rejected }
    ].filter((item) => item.value > 0);
  }, [data?.complaints?.byStatus]);

  // Category Bar Chart Data
  const categoryBarData = useMemo(() => {
    if (!data?.complaints?.byCategory) return [];
    return Object.entries(data.complaints.byCategory).map(([cat, count]) => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' '),
      complaints: count
    })).sort((a, b) => b.complaints - a.complaints);
  }, [data?.complaints?.byCategory]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium text-sm animate-pulse">Loading campus operational telemetry...</p>
      </div>
    );
  }

  const { collegeInfo, kpis, messPerformance, complaints, feedback, staff, trustSignals } = data || {};

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Quick Actions Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
            <School className="w-3.5 h-3.5" />
            <span>{collegeInfo?.name || 'Campus'} Operations Plane</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Campus Operational Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time quality intelligence, dining hall benchmarks, grievance resolution, and workforce data.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <NavLink
            to="/approvals"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verifications ({kpis?.pendingUserApprovals || 0})</span>
          </NavLink>

          <NavLink
            to="/messes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Manage Messes</span>
          </NavLink>
        </div>
      </div>

      {/* Campus Warnings (Pending approvals or low-trust flags) */}
      {(kpis?.pendingUserApprovals > 0 || kpis?.pendingStaffApprovals > 0 || trustSignals?.lowTrustUsers > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Immediate Operational Attention Required</h4>
              <div className="flex items-center gap-4 mt-1 text-xs text-amber-800 flex-wrap">
                {kpis.pendingUserApprovals > 0 && (
                  <NavLink to="/approvals" className="font-semibold underline hover:text-amber-950">
                    {kpis.pendingUserApprovals} vendor/committee registration{kpis.pendingUserApprovals > 1 ? 's' : ''} awaiting your approval →
                  </NavLink>
                )}
                {kpis.pendingStaffApprovals > 0 && (
                  <span>
                    • <strong className="font-semibold">{kpis.pendingStaffApprovals}</strong> staff applicant{kpis.pendingStaffApprovals > 1 ? 's' : ''} awaiting verification
                  </span>
                )}
                {trustSignals?.lowTrustUsers > 0 && (
                  <span>
                    • <strong className="font-semibold">{trustSignals.lowTrustUsers}</strong> user{trustSignals.lowTrustUsers > 1 ? 's' : ''} flagged with low trust (&lt;50)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Campus KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Students */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Students</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{kpis?.totalStudents || 0}</div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Registered on campus</p>
        </div>

        {/* Vendors */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Vendors</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{kpis?.totalVendors || 0}</div>
          <p className="text-xs text-blue-600 mt-2 font-semibold">Active catering vendors</p>
        </div>

        {/* Committee Members */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Committee</span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{kpis?.totalCommittee || 0}</div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Student representatives</p>
        </div>

        {/* Mess Halls */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Dining Halls</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{kpis?.totalMesses || 0}</div>
          <p className="text-xs text-indigo-600 mt-2 font-semibold">{kpis?.activeMesses || 0} active halls</p>
        </div>

        {/* Complaints Pending */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Complaints</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">{kpis?.totalComplaints || 0}</div>
          <p className="text-xs text-rose-600 mt-2 font-semibold">{kpis?.pendingComplaints || 0} unresolved</p>
        </div>

        {/* Avg Campus Rating */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Avg Campus Rating</span>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900">{kpis?.avgRating ? kpis.avgRating.toFixed(1) : '—'}</span>
            <span className="text-xs text-gray-400 font-bold">/ 5.0</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">{feedback?.totalReviews || 0} student ratings</p>
        </div>
      </div>

      {/* SECTION 2: Mess Hall Performance Comparison (The Core Campus View) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Campus Dining Halls Performance Comparison</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Side-by-side inspection of catering vendors, satisfaction ratings, and unresolved complaints per mess hall.
            </p>
          </div>
          <NavLink
            to="/messes"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Configure Mess Halls <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-3.5">Dining Hall Name</th>
                <th className="px-6 py-3.5">Operating Vendor</th>
                <th className="px-6 py-3.5 text-center">Student Rating</th>
                <th className="px-6 py-3.5 text-center">Reviews</th>
                <th className="px-6 py-3.5 text-center">Unresolved Grievances</th>
                <th className="px-6 py-3.5 text-center">Resolved Grievances</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {messPerformance && messPerformance.length > 0 ? (
                messPerformance.map((mess) => (
                  <tr key={mess.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs flex-shrink-0">
                          {mess.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{mess.name}</div>
                          <div className="text-[11px] text-gray-400">Campus Facility</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {mess.vendor ? (
                        <div>
                          <div className="font-bold text-gray-900 text-xs">{mess.vendor.companyName || mess.vendor.name}</div>
                          <div className="text-[11px] text-gray-400">{mess.vendor.email}</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 font-medium">
                          No Vendor Assigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {mess.avgRating > 0 ? (
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-gray-900">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{mess.avgRating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No ratings</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center text-xs font-semibold text-gray-600">
                      {mess.reviewCount}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {mess.pendingComplaints > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                          {mess.pendingComplaints} pending
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">0 pending</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center text-xs font-semibold text-gray-700">
                      {mess.resolvedComplaints}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${mess.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                      >
                        {mess.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">
                    No mess facilities registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Complaints Intelligence & Satisfaction by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Complaints Telemetry */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 tracking-tight">Campus Grievances Intelligence</h3>
                <p className="text-xs text-gray-500">Live breakdown across operational categories</p>
              </div>
              {complaints?.avgResolutionHours && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Avg Resolution</span>
                  <div className="text-xs font-bold text-emerald-600">
                    {complaints.avgResolutionHours > 24
                      ? `${(complaints.avgResolutionHours / 24).toFixed(1)} days`
                      : `${complaints.avgResolutionHours} hrs`}
                  </div>
                </div>
              )}
            </div>

            <div className="h-56 w-full">
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
                    <Bar dataKey="complaints" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No complaints logged for this campus.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {complaints?.byStatus?.resolved || 0} Resolved
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {complaints?.byStatus?.pending || 0} Pending
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {complaints?.byStatus?.assigned || 0} Assigned
              </span>
            </div>
            <NavLink to="/complaints" className="font-bold text-indigo-600 hover:text-indigo-800">
              Audit Complaints →
            </NavLink>
          </div>
        </div>

        {/* Student Satisfaction Breakdown */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 tracking-tight">Student Satisfaction Quality Index</h3>
                <p className="text-xs text-gray-500">Aggregated category scores submitted by dining students</p>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-black text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{feedback?.overall ? feedback.overall.toFixed(1) : '—'}</span>
              </div>
            </div>

            <div className="space-y-3.5">
              {feedback?.byCategory && feedback.byCategory.length > 0 ? (
                feedback.byCategory.map((cat) => {
                  const pct = Math.round((cat.avgRating / 5) * 100);
                  const title = cat.category.charAt(0).toUpperCase() + cat.category.slice(1).replace('_', ' ');
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                        <span>{title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-normal">({cat.count} reviews)</span>
                          <span className="font-bold text-gray-900">{cat.avgRating.toFixed(1)} / 5.0</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${cat.avgRating >= 4
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
                  No student feedback collected yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Total student feedback entries: <strong>{feedback?.totalReviews || 0}</strong></span>
            <NavLink to="/feedback" className="font-bold text-indigo-600 hover:text-indigo-800">
              Browse Feedback →
            </NavLink>
          </div>
        </div>
      </div>

      {/* SECTION 4: Staff Deployment & Workforce Telemetry */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">Campus Workforce & Staffing Status</h3>
            <p className="text-xs text-gray-500">Deployment breakdown of cooks, cleaners, cashiers, and mess managers</p>
          </div>
          <NavLink to="/staff" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Staff Directory <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {['Cook', 'Cleaner', 'Cashier', 'Manager'].map((role) => (
            <div key={role} className="bg-gray-50/80 border border-gray-100 p-4 rounded-xl">
              <div className="text-xs text-gray-500 font-semibold">{role}s</div>
              <div className="text-2xl font-black text-gray-900 mt-1">
                {staff?.byRole?.[role] || 0}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Verified on campus</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

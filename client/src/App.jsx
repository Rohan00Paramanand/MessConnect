import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import useAuthStore from './store/useAuthStore'

// Layouts & Protected Routes
import ProtectedRoute from './components/layout/ProtectedRoute'
import Layout from './components/layout/Layout'

// Pages
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import ForgotPassword from './pages/Auth/ForgotPassword'
import AcceptInvitation from './pages/Auth/AcceptInvitation'
import Maintenance from './pages/Maintenance/Maintenance'
import StudentDashboard from './pages/Dashboard/StudentDashboard'
import CommitteeDashboard from './pages/Dashboard/CommitteeDashboard'
import VendorDashboard from './pages/Dashboard/VendorDashboard'
import AdminDashboard from './pages/Admin/AdminDashboard'
import UserApprovals from './pages/Admin/UserApprovals'
import SuperAdminDashboard from './pages/Admin/SuperAdminDashboard'
import CollegeManagement from './pages/Admin/CollegeManagement'
import MessManagement from './pages/Admin/MessManagement'
import SuperAdminAnalytics from './pages/Admin/SuperAdminAnalytics'
import CollegeAdminAnalytics from './pages/Admin/CollegeAdminAnalytics'

// Modules
import ComplaintsList from './pages/Complaints/ComplaintsList'
import FeedbackView from './pages/Feedback/FeedbackView'
import NoticeBoard from './pages/Notices/NoticeBoard'
import StaffDirectory from './pages/Staff/StaffDirectory'
import WeeklyTimetable from './pages/Timetable/WeeklyTimetable'

function App() {
  const { user, checkAuth } = useAuthStore()
  const [isMaintenance, setIsMaintenance] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Listen for global 502/503/server offline events from axios
  useEffect(() => {
    const handleMaintenanceEvent = (event) => {
      setIsMaintenance(Boolean(event.detail))
    }
    window.addEventListener('app:maintenance', handleMaintenanceEvent)
    return () => window.removeEventListener('app:maintenance', handleMaintenanceEvent)
  }, [])

  // If server is recomposing or offline, render full-screen Maintenance view
  if (isMaintenance) {
    return <Maintenance onRestore={() => { setIsMaintenance(false); checkAuth(); }} />
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/accept-invite" element={<AcceptInvitation />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard/user" element={<ProtectedRoute allowedRoles={['user', 'student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/student" element={<Navigate to="/dashboard/user" replace />} />
            <Route path="/dashboard/mess_committee" element={<ProtectedRoute allowedRoles={['mess_committee']}><CommitteeDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/vendor" element={<ProtectedRoute allowedRoles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/college_admin" element={<ProtectedRoute allowedRoles={['college_admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/super_admin" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminAnalytics /></ProtectedRoute>} />
            <Route path="/colleges" element={<ProtectedRoute allowedRoles={['super_admin']}><CollegeManagement /></ProtectedRoute>} />

            <Route
              path="/complaints"
              element={
                <ProtectedRoute allowedRoles={['user', 'student', 'vendor', 'mess_committee', 'college_admin']}>
                  <ComplaintsList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/feedback"
              element={
                <ProtectedRoute allowedRoles={['user', 'student', 'vendor', 'mess_committee', 'college_admin']}>
                  <FeedbackView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notices"
              element={
                <ProtectedRoute allowedRoles={['user', 'student', 'vendor', 'mess_committee', 'college_admin']}>
                  <NoticeBoard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['vendor', 'mess_committee', 'college_admin']}>
                  <StaffDirectory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/timetable"
              element={
                <ProtectedRoute allowedRoles={['user', 'student', 'vendor', 'mess_committee']}>
                  <WeeklyTimetable />
                </ProtectedRoute>
              }
            />
            <Route path="/approvals" element={<ProtectedRoute allowedRoles={['college_admin']}><UserApprovals /></ProtectedRoute>} />
            <Route path="/messes" element={<ProtectedRoute allowedRoles={['college_admin']}><MessManagement /></ProtectedRoute>} />
            <Route path="/college-analytics" element={<ProtectedRoute allowedRoles={['college_admin']}><CollegeAdminAnalytics /></ProtectedRoute>} />

            <Route path="/" element={
              <Navigate to={
                user?.role === 'super_admin' ? '/dashboard/super_admin' :
                user?.role === 'college_admin' ? '/dashboard/college_admin' :
                user?.role === 'user' ? '/dashboard/user' :
                user?.role === 'student' ? '/dashboard/user' :
                user?.role === 'vendor' ? '/dashboard/vendor' :
                user?.role === 'mess_committee' ? '/dashboard/mess_committee' :
                '/login'
              } replace />
            } />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App

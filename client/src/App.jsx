import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import useAuthStore from './store/useAuthStore'

// Layouts & Protected Routes
import ProtectedRoute from './components/layout/ProtectedRoute'
import Layout from './components/layout/Layout'

// Pages
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import ForgotPassword from './pages/Auth/ForgotPassword'
import AcceptInvitation from './pages/Auth/AcceptInvitation'
import StudentDashboard from './pages/Dashboard/StudentDashboard'
import CommitteeDashboard from './pages/Dashboard/CommitteeDashboard'
import VendorDashboard from './pages/Dashboard/VendorDashboard'
import AdminDashboard from './pages/Admin/AdminDashboard'
import UserApprovals from './pages/Admin/UserApprovals'
import SuperAdminDashboard from './pages/Admin/SuperAdminDashboard'
import CollegeManagement from './pages/Admin/CollegeManagement'

// Modules
import ComplaintsList from './pages/Complaints/ComplaintsList'
import FeedbackView from './pages/Feedback/FeedbackView'
import NoticeBoard from './pages/Notices/NoticeBoard'
import StaffDirectory from './pages/Staff/StaffDirectory'
import WeeklyTimetable from './pages/Timetable/WeeklyTimetable'

function App() {
  const { user, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/accept-invite" element={<AcceptInvitation />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/mess_committee" element={<ProtectedRoute allowedRoles={['mess_committee']}><CommitteeDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/vendor" element={<ProtectedRoute allowedRoles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/college_admin" element={<ProtectedRoute allowedRoles={['college_admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/super_admin" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/colleges" element={<ProtectedRoute allowedRoles={['super_admin']}><CollegeManagement /></ProtectedRoute>} />

            <Route path="/complaints" element={<ComplaintsList />} />
            <Route path="/feedback" element={<FeedbackView />} />
            <Route path="/notices" element={<NoticeBoard />} />
            <Route path="/staff" element={<StaffDirectory />} />
            <Route path="/timetable" element={<WeeklyTimetable />} />
            <Route path="/approvals" element={<ProtectedRoute allowedRoles={['college_admin']}><UserApprovals /></ProtectedRoute>} />

            <Route path="/" element={
              <Navigate to={
                user?.role === 'super_admin' ? '/dashboard/super_admin' :
                user?.role === 'college_admin' ? '/dashboard/college_admin' :
                user?.role === 'student' ? '/dashboard/student' :
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

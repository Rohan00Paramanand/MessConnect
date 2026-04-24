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
import StudentDashboard from './pages/Dashboard/StudentDashboard'
import CommitteeDashboard from './pages/Dashboard/CommitteeDashboard'
import VendorDashboard from './pages/Dashboard/VendorDashboard'
import AdminDashboard from './pages/Admin/AdminDashboard'
import UserApprovals from './pages/Admin/UserApprovals'

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

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/dashboard/committee" element={<CommitteeDashboard />} />
            <Route path="/dashboard/mess_committee" element={<CommitteeDashboard />} />
            <Route path="/dashboard/vendor" element={<VendorDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/super_admin" element={<AdminDashboard />} />
            
            <Route path="/complaints" element={<ComplaintsList />} />
            <Route path="/feedback" element={<FeedbackView />} />
            <Route path="/notices" element={<NoticeBoard />} />
            <Route path="/staff" element={<StaffDirectory />} />
            <Route path="/timetable" element={<WeeklyTimetable />} />
            <Route path="/approvals" element={<UserApprovals />} />

            <Route path="/" element={
              <Navigate to={
                (user?.role === 'admin' || user?.role === 'super_admin') ? '/dashboard/admin' :
                user?.role === 'student' ? '/dashboard/student' :
                user?.role === 'vendor' ? '/dashboard/vendor' :
                '/dashboard/committee'
              } replace />
            } />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

/**
 * ProtectedRoute — supports two usage patterns:
 *
 * 1. Route tree wrapper (no children):
 *    <Route element={<ProtectedRoute />}>
 *      <Route path="..." element={<Page />} />
 *    </Route>
 *    → Renders <Outlet /> to pass through to nested routes.
 *
 * 2. Per-route wrapper with allowedRoles (with children):
 *    <Route path="..." element={<ProtectedRoute allowedRoles={['college_admin']}><Page /></ProtectedRoute>} />
 *    → Renders children if role is allowed, otherwise redirects.
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    // Treat legacy 'student' role as 'user'
    const roleToCheck = user?.role === 'student' ? 'user' : user?.role;
    const isAllowed = allowedRoles.includes(user?.role) || allowedRoles.includes(roleToCheck);

    if (!isAllowed) {
      const effectiveRole = user?.role === 'student' ? 'user' : user?.role;
      return <Navigate to={`/dashboard/${effectiveRole}`} replace />;
    }
  }

  // Render children if provided (pattern 2), otherwise fall back to Outlet (pattern 1)
  return children ? children : <Outlet />;
};

export default ProtectedRoute;

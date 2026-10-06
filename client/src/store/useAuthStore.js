import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import api from '../api/axios';
import {
  authUserAtom,
  authTokenAtom,
  authIsAuthenticatedAtom,
  authLoadingAtom,
  activeCollegeAtom,
} from './authAtoms';

/**
 * useAuthStore – drop-in replacement for the former Zustand store.
 * Exposes the same shape: { user, token, isAuthenticated, loading, setAuth, logout, checkAuth, activeCollege, setActiveCollege }
 *
 * All returned functions are wrapped in useCallback so their references are stable
 * across re-renders. Recoil state setters are guaranteed stable by Recoil itself,
 * making the useCallback deps arrays safe and lint-clean.
 */
const useAuthStore = () => {
  const [user, setUser] = useRecoilState(authUserAtom);
  const [token, setToken] = useRecoilState(authTokenAtom);
  const [isAuthenticated, setIsAuthenticated] = useRecoilState(authIsAuthenticatedAtom);
  const [loading, setLoading] = useRecoilState(authLoadingAtom);
  const [activeCollege, setActiveCollegeState] = useRecoilState(activeCollegeAtom);

  const setActiveCollege = useCallback((college) => {
    if (college && college._id) {
      localStorage.setItem('super_admin_active_college_id', college._id);
      localStorage.setItem('super_admin_active_college', JSON.stringify(college));
      setActiveCollegeState(college);
      window.dispatchEvent(new CustomEvent('college:switched', { detail: college }));
    } else {
      localStorage.removeItem('super_admin_active_college_id');
      localStorage.removeItem('super_admin_active_college');
      setActiveCollegeState(null);
      window.dispatchEvent(new CustomEvent('college:switched', { detail: null }));
    }
  }, [setActiveCollegeState]);

  const setAuth = useCallback((newUser, newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    }
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    }
    setUser(newUser);
    setIsAuthenticated(true);
    setLoading(false);
  }, [setToken, setUser, setIsAuthenticated, setLoading]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('super_admin_active_college_id');
      localStorage.removeItem('super_admin_active_college');
      setUser(null);
      setToken(null);
      setActiveCollegeState(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [setUser, setToken, setActiveCollegeState, setIsAuthenticated, setLoading]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/me');
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser, setIsAuthenticated, setToken]);

  return { user, token, isAuthenticated, loading, setAuth, logout, checkAuth, activeCollege, setActiveCollege };
};

export default useAuthStore;

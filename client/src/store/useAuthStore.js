import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import api from '../api/axios';
import {
  authUserAtom,
  authTokenAtom,
  authIsAuthenticatedAtom,
  authLoadingAtom,
} from './authAtoms';

/**
 * useAuthStore – drop-in replacement for the former Zustand store.
 * Exposes the same shape: { user, token, isAuthenticated, loading, setAuth, logout, checkAuth }
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

  const setAuth = useCallback((newUser, newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    }
    setUser(newUser);
    setIsAuthenticated(true);
    setLoading(false);
  }, [setToken, setUser, setIsAuthenticated, setLoading]);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [setUser, setToken, setIsAuthenticated, setLoading]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/auth/me');
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser, setIsAuthenticated, setToken]);

  return { user, token, isAuthenticated, loading, setAuth, logout, checkAuth };
};

export default useAuthStore;

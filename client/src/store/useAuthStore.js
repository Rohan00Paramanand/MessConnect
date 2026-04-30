import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
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
 */
const useAuthStore = () => {
  const [user, setUser] = useRecoilState(authUserAtom);
  const [token, setToken] = useRecoilState(authTokenAtom);
  const [isAuthenticated, setIsAuthenticated] = useRecoilState(authIsAuthenticatedAtom);
  const [loading, setLoading] = useRecoilState(authLoadingAtom);

  const setAuth = (newUser, newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    }
    setUser(newUser);
    setIsAuthenticated(true);
    setLoading(false);
  };

  const logout = async () => {
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
  };

  const checkAuth = async () => {
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
  };

  return { user, token, isAuthenticated, loading, setAuth, logout, checkAuth };
};

export default useAuthStore;

import { atom } from 'recoil';

export const authUserAtom = atom({
  key: 'authUser',
  default: null,
});

export const authTokenAtom = atom({
  key: 'authToken',
  default: localStorage.getItem('token') || null,
});

export const authIsAuthenticatedAtom = atom({
  key: 'authIsAuthenticated',
  default: !!localStorage.getItem('token'),
});

export const authLoadingAtom = atom({
  key: 'authLoading',
  default: true, // start as loading so ProtectedRoute waits
});

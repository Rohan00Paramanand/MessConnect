import { atom } from 'recoil';

let initialUser = null;
try {
  const cached = localStorage.getItem('user');
  if (cached) initialUser = JSON.parse(cached);
} catch {
  initialUser = null;
}

export const authUserAtom = atom({
  key: 'authUser',
  default: initialUser,
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

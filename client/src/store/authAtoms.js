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

let initialActiveCollege = null;
try {
  const cachedCollege = localStorage.getItem('super_admin_active_college');
  if (cachedCollege) initialActiveCollege = JSON.parse(cachedCollege);
} catch {
  initialActiveCollege = null;
}

export const activeCollegeAtom = atom({
  key: 'activeCollege',
  default: initialActiveCollege,
});

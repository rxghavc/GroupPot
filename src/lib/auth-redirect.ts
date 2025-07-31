/**
 * Utility functions for handling authentication redirects
 */

/**
 * Stores the current page URL for redirect after login
 */
export function storeRedirectUrl(url: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('redirectAfterAuth', url);
  }
}

/**
 * Gets and clears the stored redirect URL
 */
export function getAndClearRedirectUrl(): string | null {
  if (typeof window !== 'undefined') {
    const url = sessionStorage.getItem('redirectAfterAuth');
    sessionStorage.removeItem('redirectAfterAuth');
    return url;
  }
  return null;
}

/**
 * Redirects to login with the current page as the next parameter
 */
export function redirectToLogin(currentPath?: string) {
  if (typeof window !== 'undefined') {
    const path = currentPath || window.location.pathname;
    const loginUrl = `/login?next=${encodeURIComponent(path)}`;
    window.location.href = loginUrl;
  }
}

/**
 * Redirects to signup with the current page as the next parameter
 */
export function redirectToSignup(currentPath?: string) {
  if (typeof window !== 'undefined') {
    const path = currentPath || window.location.pathname;
    const signupUrl = `/signup?next=${encodeURIComponent(path)}`;
    window.location.href = signupUrl;
  }
}

/**
 * Check if a path requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/groups',
    '/bets',
    '/settings',
  ];
  
  return protectedRoutes.some(route => path.startsWith(route));
}

/**
 * Check if a path is an auth page (login, signup, etc.)
 */
export function isAuthRoute(path: string): boolean {
  const authRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ];
  
  return authRoutes.some(route => path.startsWith(route));
}

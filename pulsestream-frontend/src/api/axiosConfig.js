import axios from 'axios';

/**
 * Centralized Axios instance for all authenticated Spring Boot API calls.
 *
 * Responsibilities:
 *  - Attach Authorization: Bearer <token> to every request from localStorage
 *  - Handle 401 (session expired) → dispatch event → let App.jsx clean up Redux + redirect
 *  - Handle 403 (forbidden) → keep user authenticated, return rejection for caller to handle
 *  - Normalize backend error message so callers get err.response.data.message consistently
 *
 * What this does NOT do:
 *  - toast.error() — that is the caller's responsibility (avoids duplicate toasts)
 *  - window.location.href hard redirects — React Router handles navigation
 */

const BASE_URL = import.meta.env.VITE_BACK_END_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
});

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────────────────
// Reads token from localStorage and attaches it to every request.
// Components never need to manually set Authorization headers.
api.interceptors.request.use(
    (config) => {
        try {
            const raw = localStorage.getItem('pulse_auth');
            if (raw) {
                const { jwtToken } = JSON.parse(raw);
                if (jwtToken) {
                    config.headers.Authorization = `Bearer ${jwtToken}`;
                }
            }
        } catch {
            // Corrupted localStorage — safe to ignore, request goes out without token
        }
        return config;
    },
    (error) => Promise.reject(error)
);

//  RESPONSE INTERCEPTOR 
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        // Exclude every /auth/* route — these are intentional auth attempts,
        // NOT expired-session scenarios. A 401 from signin/signup/otp/etc.
        // is a wrong-credential error, not a dead session.
        const isAuthRequest   = error.config?.url?.includes('/auth/');
        const isOAuthRoute    = error.config?.url?.includes('/oauth2');

        if (status === 401 && !isAuthRequest && !isOAuthRoute) {
            // Token is expired or invalid. Clear storage immediately so no
            // subsequent requests try to reuse the dead token.
            localStorage.removeItem('pulse_auth');

            // Notify App.jsx to clear Redux and navigate — avoids hard reload.
            // We do NOT call window.location.href here to prevent redirect loops.
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }

        // For 403, do NOT log out. The user IS authenticated but lacks permission.
        // The caller should handle 403 (e.g., show a toast or redirect to a Forbidden page).

        // Normalize the error message from the backend's standard error structure:
        // { timestamp, status, error, message }
        // We expose it as error.userMessage so callers can safely read it.
        if (error.response?.data && typeof error.response.data === 'object') {
            error.userMessage = error.response.data.message || 'An unexpected error occurred.';
        } else {
            error.userMessage = 'Network error. Please check your connection.';
        }

        return Promise.reject(error);
    }
);

export default api;
export { BASE_URL };
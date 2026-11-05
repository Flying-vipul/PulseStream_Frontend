import { createSlice } from '@reduxjs/toolkit';

/**
 * Auth State Shape:
 *
 * token          — raw JWT string or null
 * user           — { id, name, email, role, tier, avatarUrl } or null
 * isAuthenticated — derived convenience flag
 * initialized    — true once we've attempted to rehydrate from localStorage
 *                  PrivateRoute MUST wait for this before making routing decisions
 */

// Decode a JWT and check whether it is expired — no library needed.
// Returns true if expired OR if the token cannot be parsed (treat as unsafe).
const isTokenExpired = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds; Date.now() is in milliseconds
        return Date.now() >= payload.exp * 1000;
    } catch {
        return true; // Unreadable token → treat as expired
    }
};

// Safely attempt to restore auth from localStorage on module load.
// If the stored token is expired, wipe it immediately so the app starts
// in a clean unauthenticated state — prevents the /session-expired redirect loop.
const rehydrate = () => {
    try {
        const raw = localStorage.getItem('pulse_auth');
        if (!raw) return { token: null, user: null };

        const { jwtToken, user } = JSON.parse(raw);
        if (!jwtToken || !user) return { token: null, user: null };

        // ← KEY FIX: don't trust an expired token
        if (isTokenExpired(jwtToken)) {
            localStorage.removeItem('pulse_auth');
            return { token: null, user: null };
        }

        return { token: jwtToken, user };
    } catch {
        // Corrupted data — clear it
        localStorage.removeItem('pulse_auth');
        return { token: null, user: null };
    }
};

const { token, user } = rehydrate();

const initialState = {
    token,
    user,
    isAuthenticated: !!token,
    initialized: true, // We've already attempted rehydration synchronously above
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /**
         * Called after successful login, OTP verification, or OAuth2 callback.
         * Persists auth state to localStorage in the canonical `pulse_auth` format.
         */
        loginSuccess: (state, action) => {
            const { token, user } = action.payload;
            state.token = token;
            state.user = user;
            state.isAuthenticated = true;
            state.initialized = true;

            localStorage.setItem('pulse_auth', JSON.stringify({
                jwtToken: token,
                user,
            }));
        },

        /**
         * Clears all authentication state. Called on explicit logout or session expiry.
         */
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            // initialized stays true — we know the answer: not authenticated
            localStorage.removeItem('pulse_auth');
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;

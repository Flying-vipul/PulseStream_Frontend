import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppToaster from './Components/common/AppToaster';
import PrivateRoute from './Components/layout/PrivateRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import UploadMovie from './pages/admin/UploadMovie';
import UploadSeries from './pages/admin/UploadSeries';
import { logout } from './store/slices/authSlice';
import { fetchWatchlist, clearWatchlist } from './store/slices/watchlistSlice';
import { clearProfileState, fetchProfiles } from './store/slices/profileSlice';
import GlassNavbar from './Components/layout/GlassNavbar';
import Watch from './pages/Watch';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Content from './pages/Content';
import MyWatchlist from './pages/MyWatchlist';
import SessionExpired from './pages/SessionExpired';
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler';
import ProfileSelection from './pages/ProfileSelection';

/**
 * AppContent is extracted so it can use useNavigate (which requires Router context).
 *
 * Responsibilities:
 *  1. Listen for the global 'auth:session-expired' event fired by axiosConfig.js
 *     and cleanly tear down auth state + navigate to session-expired page.
 *  2. Reactively fetch watchlist when auth state changes (login/logout).
 */
const AppContent = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);

    // ── Watchlist sync ────────────────────────────────────────────────────────
    // Only fetch if authenticated. This prevents the 401 cascade on page load
    // when isAuthenticated is true from stale localStorage but token has expired.
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchWatchlist());
            dispatch(fetchProfiles()); // Always populate profiles list on login
        } else {
            dispatch(clearWatchlist());
        }
    }, [isAuthenticated, dispatch]);

    // ── Global session expiry handler ─────────────────────────────────────────
    // axiosConfig.js fires 'auth:session-expired' when any API call returns 401.
    // We listen here and handle cleanup + navigation centrally.
    // We do NOT use window.location.href to avoid full page reloads.
    useEffect(() => {
        const handleSessionExpired = () => {
            dispatch(logout());
            dispatch(clearWatchlist());
            dispatch(clearProfileState());
            navigate('/session-expired', { replace: true });
        };

        window.addEventListener('auth:session-expired', handleSessionExpired);
        return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
    }, [dispatch, navigate]);

    const { activeProfile } = useSelector((state) => state.profile);

    if (isAuthenticated && !activeProfile) {
        return (
            <Routes>
                <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
                <Route path="/session-expired" element={<SessionExpired />} />
                <Route path="*" element={<ProfileSelection />} />
            </Routes>
        );
    }

    return (
        <div className="min-h-screen bg-pulse-dark text-pulse-text font-sans selection:bg-pulse-accent selection:text-white">
            <GlassNavbar />

            <main className="pt-24 pb-12">
                <Routes>
                    {/* OAuth2 callback — must be before other routes */}
                    <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

                    {/* ── Public routes ──────────────────────────────────── */}
                    <Route path="/"               element={<Home />} />
                    <Route path="/auth"            element={<Auth />} />
                    <Route path="/content"         element={<Content />} />
                    <Route path="/session-expired" element={<SessionExpired />} />

                    {/* ── Authenticated user routes ──────────────────────── */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/watch/:id"    element={<Watch />} />
                        <Route path="/profile"      element={<Profile />} />
                        <Route path="/subscription" element={<Subscription />} />
                        <Route path="/watchlist"    element={<MyWatchlist />} />
                    </Route>

                    {/* ── Admin-only routes ──────────────────────────────── */}
                    <Route path="/admin" element={<PrivateRoute adminOnly />}>
                        <Route index                       element={<AdminDashboard />} />
                        <Route path="upload-movie"         element={<UploadMovie />} />
                        <Route path="upload-series"        element={<UploadSeries />} />
                    </Route>
                </Routes>
            </main>
        </div>
    );
};

function App() {
    return (
        <Router>
            <AppToaster />
            <AppContent />
        </Router>
    );
}

export default App;
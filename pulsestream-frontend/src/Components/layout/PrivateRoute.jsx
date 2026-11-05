import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * PrivateRoute — protects routes requiring authentication.
 *
 * Decision tree:
 *   auth not initialized → show loading spinner (prevents flash-to-login)
 *   not authenticated   → redirect to /auth, preserving the attempted URL
 *   adminOnly + not admin → redirect to / (forbidden, but stay authenticated)
 *   authenticated       → render child routes via <Outlet />
 *
 * The `initialized` flag from authSlice ensures we don't make routing
 * decisions before we've rehydrated localStorage.
 */
const PrivateRoute = ({ adminOnly = false }) => {
    const location = useLocation();
    const { isAuthenticated, initialized, user } = useSelector((state) => state.auth);

    // Auth state is still being rehydrated — don't redirect prematurely
    if (!initialized) {
        return (
            <div className="fixed inset-0 bg-[#0b0b0c] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Preserve the location the user was trying to visit
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (adminOnly && user?.role !== 'ROLE_ADMIN') {
        // Authenticated but not admin → send home, not to login
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
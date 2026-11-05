import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';

/**
 * OAuth2RedirectHandler
 *
 * Spring Boot's OAuth2LoginSuccessHandler redirects here after Google login:
 *   /oauth2/redirect?token=<JWT>
 *
 * This component:
 *  1. Reads the token ONCE from the URL
 *  2. Immediately cleans the token from the URL using the History API (no back-button exposure)
 *  3. Fetches the current user profile from the backend using the token (avoids trusting JWT claims)
 *  4. Stores auth in Redux + localStorage
 *  5. Redirects to the home page (or originally intended destination)
 *
 * Security notes:
 *  - We do NOT log the token or user object
 *  - We replace URL history to remove the token from the address bar immediately
 *  - We call /auth/me to get authoritative user data instead of decoding JWT client-side
 */
const OAuth2RedirectHandler = () => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const dispatch  = useDispatch();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');

        // Immediately remove token from URL — prevents it being bookmarked or logged
        if (window.history.replaceState) {
            window.history.replaceState(null, '', '/oauth2/redirect');
        }

        if (!token) {
            navigate('/auth', { replace: true });
            return;
        }

        // Fetch authoritative user data from backend using the token
        // This avoids trusting client-side JWT decoding for user info/role
        const initOAuthSession = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_BACK_END_URL || 'http://localhost:8080'}/api/auth/user`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    // Token invalid or expired — send to auth
                    navigate('/auth', { replace: true });
                    return;
                }

                const data = await response.json();

                dispatch(loginSuccess({
                    token,
                    user: {
                        id:    data.id,
                        name:  data.name,
                        email: data.email,
                        role:  data.role,
                        tier:  data.planTier,
                    },
                }));

                navigate('/', { replace: true });

            } catch {
                // Network error — don't expose details, redirect to auth
                navigate('/auth', { replace: true });
            }
        };

        initOAuthSession();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount only — not when location changes

    return (
        <div className="fixed inset-0 bg-[#0B0B0C] flex flex-col items-center justify-center gap-5">
            <div className="w-16 h-16 rounded-full border-4 border-t-red-500 border-r-yellow-400 border-b-green-500 border-l-blue-500 animate-spin" />
            <p className="text-white text-xl font-bold tracking-wide">Signing you in with Google...</p>
            <p className="text-gray-500 text-sm">Just a moment</p>
        </div>
    );
};

export default OAuth2RedirectHandler;
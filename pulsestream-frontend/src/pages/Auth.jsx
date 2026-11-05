import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BASE_URL } from '../api/axiosConfig';
import {
    loginUserAction,
    registerUserAction,
    verifyOtpAction,
    triggerForgotPasswordAction,
    resetPasswordAction,
} from '../store/actions/authActions';

const Auth = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { isAuthenticated } = useSelector((state) => state.auth);

    const [mode, setMode]             = useState('LOGIN');
    const [step, setStep]             = useState(1);
    const [name, setName]             = useState('');
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [otp, setOtp]               = useState('');
    const [loading, setLoading]       = useState(false);

    // If user is already logged in, redirect them away from /auth
    // Redirect to wherever they came from, or / by default
    const from = location.state?.from?.pathname || '/';
    if (isAuthenticated) {
        return <Navigate to={from} replace />;
    }

    // Ping the server to wake it up (useful for cold-start backends like Render)
    // then redirect to Spring Boot's OAuth2 authorization endpoint
    const handleGoogleLogin = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await fetch(`${BASE_URL}/api/health`);
        } catch {
            // Server might already be awake — proceed anyway
        }
        // Navigate via full page redirect (required for OAuth2 flow)
        window.location.href = `${BASE_URL}/oauth2/authorization/google`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return; // Prevent double-submit

        if (mode === 'LOGIN') {
            dispatch(loginUserAction({ email, password }, toast, navigate, setLoading));
        } else if (mode === 'SIGNUP' && step === 1) {
            dispatch(registerUserAction({ name, email, password }, toast, setStep, setLoading));
        } else if (mode === 'SIGNUP' && step === 2) {
            dispatch(verifyOtpAction({ email, otp }, toast, switchMode, setLoading));
        } else if (mode === 'FORGOT_PASSWORD' && step === 1) {
            dispatch(triggerForgotPasswordAction(email, toast, setStep, setLoading));
        } else if (mode === 'FORGOT_PASSWORD' && step === 2) {
            dispatch(resetPasswordAction({ email, otp, newPassword }, toast, switchMode, setLoading));
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setStep(1);
        setOtp('');
        setPassword('');
        setNewPassword('');
    };

    return (
        <div className="relative w-full h-screen flex items-center justify-center bg-black overflow-hidden">
            <div
                className="absolute inset-0 opacity-40 bg-cover bg-center"
                style={{ backgroundImage: "url('https://image.tmdb.org/t/p/original/1E5baAaEse26fej7uHcjOgEE2t2.jpg')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />

            <div className="relative z-10 w-full max-w-md p-10 bg-black/70 backdrop-blur-md rounded-lg border border-gray-800 shadow-2xl">
                <h1 className="text-3xl font-bold text-white mb-6">
                    {mode === 'LOGIN'          && 'Sign In'}
                    {mode === 'SIGNUP'         && 'Sign Up'}
                    {mode === 'FORGOT_PASSWORD' && 'Reset Password'}
                </h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5" autoComplete="off" noValidate>

                    {/* ── STEP 1: Credentials ── */}
                    {step === 1 && (
                        <>
                            {mode === 'SIGNUP' && (
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    minLength={2}
                                    autoComplete="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-4 bg-gray-900/80 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-pulse-accent transition-colors"
                                />
                            )}

                            <input
                                type="email"
                                placeholder="Email Address"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-gray-900/80 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-pulse-accent transition-colors"
                            />

                            {(mode === 'LOGIN' || mode === 'SIGNUP') && (
                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    minLength={6}
                                    autoComplete={mode === 'SIGNUP' ? 'new-password' : 'current-password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-4 bg-gray-900/80 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-pulse-accent transition-colors"
                                />
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 mt-2 bg-pulse-accent text-white font-bold rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : (
                                    mode === 'LOGIN'          ? 'Sign In' :
                                    mode === 'SIGNUP'         ? 'Register & Send OTP' :
                                    'Send Reset Code'
                                )}
                            </button>
                        </>
                    )}

                    {/* ── STEP 2: OTP + optional new password ── */}
                    {step === 2 && (
                        <>
                            <div className="text-gray-300 text-sm mb-2 text-center">
                                We sent a 6-digit code to <br />
                                <span className="font-bold text-white">{email}</span>
                            </div>

                            <input
                                type="text"
                                placeholder="6-Digit Code"
                                required
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full p-4 bg-gray-900/80 border border-gray-700 rounded text-white text-center tracking-widest text-xl placeholder-gray-500 focus:outline-none focus:border-pulse-accent transition-colors"
                            />

                            {mode === 'FORGOT_PASSWORD' && (
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full p-4 bg-gray-900/80 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-pulse-accent transition-colors"
                                />
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 mt-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : (
                                    mode === 'SIGNUP' ? 'Verify & Enter PulseStream' : 'Save New Password'
                                )}
                            </button>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => setStep(1)}
                                className="text-gray-400 text-sm mt-2 hover:text-white transition-colors disabled:opacity-50"
                            >
                                ← Go back
                            </button>
                        </>
                    )}
                </form>

                {/* ── Google OAuth — only on step 1 for login/signup ── */}
                {step === 1 && mode !== 'FORGOT_PASSWORD' && (
                    <div className="mt-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-gray-600 text-xs font-medium tracking-wider uppercase">or</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-black/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
                        </button>
                    </div>
                )}

                {/* ── Mode switcher links ── */}
                {step === 1 && (
                    <div className="mt-5 text-gray-400 text-sm flex flex-col gap-2">
                        {mode === 'LOGIN' && (
                            <button
                                onClick={() => switchMode('FORGOT_PASSWORD')}
                                className="text-left hover:underline hover:text-white transition-colors"
                            >
                                Forgot password?
                            </button>
                        )}

                        <div>
                            {mode === 'SIGNUP' ? 'Already have an account? ' : 'New to PulseStream? '}
                            <button
                                onClick={() => switchMode(mode === 'SIGNUP' ? 'LOGIN' : 'SIGNUP')}
                                className="text-white hover:underline hover:text-pulse-accent transition-colors font-medium"
                            >
                                {mode === 'SIGNUP' ? 'Sign in.' : 'Sign up now.'}
                            </button>
                        </div>

                        {mode === 'FORGOT_PASSWORD' && (
                            <button
                                onClick={() => switchMode('LOGIN')}
                                className="text-left mt-2 hover:underline hover:text-white transition-colors"
                            >
                                Back to Sign In
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;
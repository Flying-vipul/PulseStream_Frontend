import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { clearWatchlist } from '../store/slices/watchlistSlice';

const SessionExpired = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [countdown, setCountdown] = useState(10);

    // Safety net: ensure auth state is fully cleared the moment this page mounts.
    // This handles any edge cases where the global event handler didn't fire or
    // the Redux store still has stale auth.
    useEffect(() => {
        dispatch(logout());
        dispatch(clearWatchlist());
    }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-redirect countdown
    useEffect(() => {
        if (countdown <= 0) {
            navigate('/auth', { replace: true });
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, navigate]);

    return (
        <div className="fixed inset-0 bg-[#0B0B0C] flex items-center justify-center z-[9999] overflow-hidden">

            {/* ── Animated background orbs ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] animate-float-orb" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/8 rounded-full blur-[100px] animate-float-orb-2" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[160px]" />
            </div>

            {/* ── Subtle grid pattern ── */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            {/* ── Main card ── */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">

                {/* Lock icon with glow ring */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 rounded-full bg-red-600/20 blur-2xl scale-150 animate-pulse-glow" />
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-red-600/30 to-red-900/20 border border-red-500/30 flex items-center justify-center backdrop-blur-sm shadow-[0_0_60px_rgba(229,9,20,0.3)]">
                        {/* Animated lock SVG */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="w-12 h-12 text-red-400"
                            style={{ animation: 'fadeIn 0.6s ease 0.2s both' }}
                        >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1
                    className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight"
                    style={{ animation: 'heroSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}
                >
                    Session{' '}
                    <span className="text-gradient">Expired</span>
                </h1>

                {/* Subtitle */}
                <p
                    className="text-gray-400 text-base sm:text-lg mb-2 leading-relaxed"
                    style={{ animation: 'heroSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both' }}
                >
                    Your session has timed out for security.
                    <br />
                    Please sign in again to continue streaming.
                </p>

                {/* Auto-redirect notice */}
                <p
                    className="text-gray-600 text-sm mb-10"
                    style={{ animation: 'heroSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both' }}
                >
                    Redirecting in{' '}
                    <span className="text-red-500 font-bold tabular-nums">{countdown}s</span>
                    ...
                </p>

                {/* Countdown progress bar */}
                <div
                    className="w-full max-w-xs h-0.5 bg-white/10 rounded-full mb-10 overflow-hidden"
                    style={{ animation: 'heroSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both' }}
                >
                    <div
                        className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(countdown / 10) * 100}%` }}
                    />
                </div>

                {/* CTA buttons */}
                <div
                    className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
                    style={{ animation: 'heroSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s both' }}
                >
                    <button
                        onClick={() => navigate('/auth')}
                        className="flex-1 py-3.5 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-red-900/40 glow-red-sm"
                    >
                        Sign In Now
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 py-3.5 px-6 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
                    >
                        Go Home
                    </button>
                </div>

                {/* PulseStream branding */}
                <p
                    className="mt-10 text-xs text-gray-700 tracking-widest uppercase font-semibold"
                    style={{ animation: 'heroSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both' }}
                >
                    PulseStream · Secure Streaming
                </p>
            </div>
        </div>
    );
};

export default SessionExpired;

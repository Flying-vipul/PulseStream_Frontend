import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchWatchlist, removeFromWatchlist } from '../store/slices/watchlistSlice';
import MovieModal from '../Components/common/MovieModal';
import Footer from '../Components/common/Footer';
import toast from 'react-hot-toast';
import {
    FaBookmark, FaPlay, FaTrash, FaSpinner,
    FaFilm, FaTv, FaLock, FaChevronRight
} from 'react-icons/fa';

const POSTER_FALLBACK =
    "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22750%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22500%22%20height%3D%22750%22%20fill%3D%22%231a1a1a%22%2F%3E%3C%2Fsvg%3E";

/* Skeleton  */
const SkeletonCard = () => (
    <div className="rounded-xl overflow-hidden animate-pulse">
        <div className="skeleton aspect-[2/3] rounded-xl" />
        <div className="mt-2 space-y-1.5 px-0.5">
            <div className="skeleton h-2.5 rounded w-3/4" />
            <div className="skeleton h-2 rounded w-1/3" />
        </div>
    </div>
);

/* ── Individual watchlist card ─────────────────────────────────────────── */
const WatchlistCard = ({ item, onOpen, onRemove, isRemoving }) => {
    const navigate = useNavigate();
    const [imgErr, setImgErr] = useState(false);
    const isSeries = (item.contentType || '').toUpperCase() === 'SERIES';

    return (
        <div className="group relative rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/15 row-card" style={{ zIndex: 1 }}>
            {/* Poster */}
            <div className="relative aspect-[2/3] cursor-pointer" onClick={() => onOpen(item)}>
                <img
                    src={imgErr ? POSTER_FALLBACK : (item.thumbnailUrl || item.posterUrl)}
                    alt={item.title}
                    onError={() => setImgErr(true)}
                    className="w-full h-full object-cover"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250" />

                {/* Type badge */}
                {isSeries ? (
                    <span className="absolute top-2 left-2 bg-blue-600/90 text-[9px] font-black uppercase tracking-wide text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                        Series
                    </span>
                ) : (
                    <span className="absolute top-2 left-2 bg-black/50 text-[9px] font-bold uppercase tracking-wide text-gray-300 px-1.5 py-0.5 rounded backdrop-blur-sm">
                        Movie
                    </span>
                )}

                {/* Hover play */}
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/watch/${item.id}`); }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-250"
                >
                    <span className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/25 transition-colors">
                        <FaPlay className="text-white ml-0.5" size={16} />
                    </span>
                </button>
            </div>

            {/* Info */}
            <div className="p-2.5 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpen(item)}>
                    <p className="text-white text-xs font-bold truncate leading-snug">{item.title}</p>
                    <p className="text-green-400 text-[10px] font-semibold mt-0.5">{item.releaseYear}</p>
                </div>
                <button
                    onClick={() => onRemove(item)}
                    disabled={isRemoving}
                    className={`flex-shrink-0 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/15 transition-all ${isRemoving ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                    {isRemoving ? <FaSpinner size={11} className="animate-spin" /> : <FaTrash size={11} />}
                </button>
            </div>
        </div>
    );
};

/* ── Stat pill ─────────────────────────────────────────────────────────── */
const StatPill = ({ icon: Icon, label, value, color }) => (
    <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={16} className="text-white" />
        </div>
        <div>
            <p className="text-white text-xl font-black leading-none">{value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
        </div>
    </div>
);

/* ── Main Page ─────────────────────────────────────────────────────────── */
const MyWatchlist = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { isAuthenticated, user } = useSelector(s => s.auth);
    const { items, status, pendingIds } = useSelector(s => s.watchlist);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        // App.jsx auto-fetches watchlist when isAuthenticated changes.
        // This local dispatch is only needed if the page is accessed directly
        // and the watchlist hasn't loaded yet (e.g., status is idle).
        if (isAuthenticated && status === 'idle') {
            dispatch(fetchWatchlist());
        }
    }, [isAuthenticated, status, dispatch]);

    const handleRemove = (item) => {
        if (!user?.id) return;
        dispatch(removeFromWatchlist({ contentId: item.id }))
            .unwrap()
            .then(() => toast.success(`Removed "${item.title}"`))
            .catch(() => toast.error('Failed. Try again.'));
    };

    /* ── Guard ─────────────────────────────────────────────────────── */
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0b0b0c] flex flex-col items-center justify-center text-white px-6">
                <div className="glass rounded-3xl p-10 sm:p-14 text-center max-w-md shadow-2xl">
                    <div className="w-20 h-20 rounded-2xl bg-red-900/20 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                        <FaLock className="text-red-500 text-3xl" />
                    </div>
                    <h1 className="text-2xl font-black mb-2">Sign in to see your list</h1>
                    <p className="text-gray-500 text-sm mb-8">Your watchlist is saved to your account and accessible from any device.</p>
                    <button
                        onClick={() => navigate('/auth')}
                        className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 glow-red"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    const isLoading   = status === 'loading';
    const count       = items.length;
    const movieCount  = items.filter(i => (i.contentType || '').toUpperCase() === 'MOVIE').length;
    const seriesCount = items.filter(i => (i.contentType || '').toUpperCase() === 'SERIES').length;

    return (
        <div className="min-h-screen bg-[#0b0b0c] text-white">

            {/*  Hero Header  */}
            <div className="relative overflow-hidden px-5 sm:px-10 md:px-16 py-12 md:py-16">
                {/* Orbs */}
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-red-800/12 rounded-full blur-3xl animate-float-orb pointer-events-none" />
                <div className="absolute right-0 top-0 w-72 h-72 bg-purple-900/8 rounded-full blur-2xl animate-float-orb-3 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-red-600/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                            <FaBookmark className="text-red-400 text-xl" />
                        </div>
                        <div>
                            <p className="text-red-500 text-xs font-black uppercase tracking-widest mb-1">Your Collection</p>
                            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">My Watchlist</h1>
                        </div>
                    </div>

                    {/* Stat pills */}
                    {!isLoading && count > 0 && (
                        <div className="flex flex-wrap gap-3 mt-6">
                            <StatPill icon={FaBookmark} label="Total Saved"  value={count}       color="bg-red-600/30" />
                            <StatPill icon={FaFilm}     label="Movies"       value={movieCount}  color="bg-blue-600/30" />
                            <StatPill icon={FaTv}       label="Series"       value={seriesCount} color="bg-purple-600/30" />
                        </div>
                    )}
                </div>
            </div>

            {/*  Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 pb-12">

                {/* Skeletons */}
                {isLoading && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && count === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 rounded-3xl glass flex items-center justify-center mb-6">
                            <FaFilm className="text-gray-700 text-4xl" />
                        </div>
                        <h2 className="text-xl font-black text-white mb-2">Your list is empty</h2>
                        <p className="text-gray-600 text-sm mb-8 max-w-xs">
                            Browse content and hit the <strong className="text-white">+</strong> button to save titles here.
                        </p>
                        <button
                            onClick={() => navigate('/content')}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 glow-red-sm text-sm"
                        >
                            <FaFilm size={13} /> Browse Content <FaChevronRight size={11} />
                        </button>
                    </div>
                )}

                {/* Grid */}
                {!isLoading && count > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                        {items.map(item => (
                            <WatchlistCard
                                key={item.id}
                                item={item}
                                onOpen={setSelectedItem}
                                onRemove={handleRemove}
                                isRemoving={pendingIds.includes(item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedItem && <MovieModal movie={selectedItem} onClose={() => setSelectedItem(null)} />}
            <Footer />
        </div>
    );
};

export default MyWatchlist;

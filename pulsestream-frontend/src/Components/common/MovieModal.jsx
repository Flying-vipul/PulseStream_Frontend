import React, { useEffect } from 'react';
import { FaPlay, FaPlus, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToWatchlist, removeFromWatchlist } from '../../store/slices/watchlistSlice';
import toast from 'react-hot-toast';

const MovieModal = ({ movie, onClose }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { itemIds, pendingIds }   = useSelector((state) => state.watchlist);

    const isInWatchlist = itemIds.includes(movie?.id);
    const isPending     = pendingIds.includes(movie?.id);

    // Lock scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleBackdropClick = (e) => {
        if (e.target.id === 'modal-backdrop') onClose();
    };

    const formatDuration = (minutes) => {
        if (!minutes) return null;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h > 0 ? h + 'h ' : ''}${m}m`;
    };

    const handleWatchlistToggle = () => {
        if (!isAuthenticated || !user?.id) {
            toast.error('Please sign in to use your watchlist.');
            return;
        }
        if (isPending) return;
        if (isInWatchlist) {
            dispatch(removeFromWatchlist({ userId: user.id, contentId: movie.id }))
                .unwrap()
                .then(() => toast.success(`Removed "${movie.title}" from watchlist`))
                .catch(() => toast.error('Failed to update watchlist'));
        } else {
            dispatch(addToWatchlist({ userId: user.id, contentId: movie.id, contentItem: movie }))
                .unwrap()
                .then(() => toast.success(`Added "${movie.title}" to watchlist ✓`))
                .catch(() => toast.error('Failed to update watchlist'));
        }
    };

    if (!movie) return null;
    const duration = formatDuration(movie.durationMinutes);
    const isSeries = (movie.contentType || movie.type || '').toUpperCase() === 'SERIES';

    return (
        <div
            id="modal-backdrop"
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
        >
            {/*
              Mobile: slides up from bottom (rounded top corners, max 90vh scroll)
              Desktop: centered card (max-w-3xl, rounded all corners)
            */}
            <div
                className="
                    bg-[#181818] w-full relative overflow-y-auto
                    rounded-t-2xl sm:rounded-xl
                    max-h-[90vh] sm:max-h-[85vh]
                    sm:max-w-3xl
                    shadow-2xl
                "
                style={{ animation: 'slideUp 0.25s ease-out' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle — mobile only */}
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-white hover:text-black text-white p-2 rounded-full transition-colors"
                >
                    <FaTimes size={16} />
                </button>

                {/* Banner — shorter on mobile */}
                <div className="relative h-44 sm:h-[40vh] w-full">
                    <img
                        src={movie.bannerUrl || movie.thumbnailUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20400%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22800%22%20height%3D%22400%22%20fill%3D%22%23141414%22%2F%3E%3C%2Fsvg%3E";
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
                    {isSeries && (
                        <span className="absolute top-3 left-3 bg-blue-600/90 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide backdrop-blur-sm">
                            Series
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-2">

                    {/* Title (on mobile show here since banner is small) */}
                    <h2 className="text-xl sm:text-3xl font-bold text-white mb-3 leading-tight pr-8">
                        {movie.title}
                    </h2>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={() => navigate(`/watch/${movie.id}`)}
                            className="flex-1 bg-white text-black py-2.5 sm:py-3 rounded-lg hover:bg-gray-100 transition-colors font-bold flex items-center justify-center gap-2 text-sm sm:text-base shadow"
                        >
                            <FaPlay size={12} /> Watch Now
                        </button>

                        <button
                            onClick={handleWatchlistToggle}
                            disabled={isPending}
                            title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                            className={`p-3 sm:p-4 rounded-lg border transition-all duration-200 flex items-center justify-center min-w-[46px] sm:min-w-[52px]
                                ${isInWatchlist ? 'bg-red-600 border-red-600 text-white hover:bg-red-700' : 'bg-[#2a2a2a] border-gray-600 text-white hover:border-white'}
                                ${isPending ? 'opacity-60 cursor-not-allowed' : ''}
                            `}
                        >
                            {isPending ? <FaSpinner size={16} className="animate-spin" />
                                : isInWatchlist ? <FaCheck size={16} />
                                : <FaPlus size={16} />}
                        </button>
                    </div>

                    {/* Watchlist hint for guests */}
                    {!isAuthenticated && (
                        <p className="text-xs text-gray-500 mb-3">
                            <span className="text-red-400 cursor-pointer hover:underline" onClick={() => { onClose(); navigate('/auth'); }}>Sign in</span>{' '}
                            to save to your watchlist
                        </p>
                    )}
                    {isAuthenticated && isInWatchlist && (
                        <p className="text-xs text-green-400 font-semibold mb-3 flex items-center gap-1">
                            <FaCheck size={9} /> In your watchlist
                        </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-400 mb-3 flex-wrap">
                        <span className="text-green-500">{movie.releaseYear}</span>
                        <span>•</span>
                        <span className="border border-gray-600 px-1.5 rounded text-gray-300 text-[10px] sm:text-xs">U/A 13+</span>
                        {duration && (<><span>•</span><span>{duration}</span></>)}
                        <span>•</span>
                        <span className="bg-gray-800 px-2 rounded text-[10px] sm:text-xs py-0.5">Blockbuster</span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-4 sm:line-clamp-3">
                        {movie.description}
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MovieModal;
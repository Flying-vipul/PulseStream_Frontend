import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchAllMovies } from '../store/slices/contentSlice';
import { addToWatchlist, removeFromWatchlist } from '../store/slices/watchlistSlice';
import MovieModal from '../Components/common/MovieModal';
import Footer from '../Components/common/Footer';
import toast from 'react-hot-toast';
import {
    FaFilm, FaTv, FaThLarge, FaChevronLeft, FaChevronRight,
    FaSearch, FaTimes, FaBookmark, FaPlus, FaCheck, FaSpinner, FaPlay
} from 'react-icons/fa';

const PAGE_SIZE = 18;

const POSTER_FALLBACK =
    "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22750%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22500%22%20height%3D%22750%22%20fill%3D%22%231a1a1a%22%2F%3E%3C%2Fsvg%3E";

const FILTER_TABS = [
    { id: 'ALL',    label: 'All',    icon: FaThLarge },
    { id: 'MOVIE',  label: 'Movies', icon: FaFilm    },
    { id: 'SERIES', label: 'Series', icon: FaTv      },
];

/* ── Skeleton ──────────────────────────────────────────────────────────────── */
const SkeletonCard = () => (
    <div className="rounded-xl overflow-hidden">
        <div className="skeleton aspect-[2/3] rounded-xl" />
        <div className="mt-2 space-y-1.5">
            <div className="skeleton h-2.5 rounded w-3/4" />
            <div className="skeleton h-2 rounded w-1/3" />
        </div>
    </div>
);

/* ── Pagination button ─────────────────────────────────────────────────────── */
const PagBtn = ({ children, onClick, disabled, active }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-bold transition-all duration-200
            ${active   ? 'bg-red-600 text-white shadow-lg shadow-red-900/40 scale-105'
            : disabled ? 'bg-white/5 text-gray-700 cursor-not-allowed'
                       : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/15'}`}
    >
        {children}
    </button>
);

/* ── Content Card ──────────────────────────────────────────────────────────── */
const ContentCard = ({ item, onClick, searchQuery }) => {
    const [imgError, setImgError] = useState(false);
    const { isAuthenticated, user } = useSelector(s => s.auth);
    const { itemIds, pendingIds }   = useSelector(s => s.watchlist);
    const dispatch = useDispatch();

    const isSeries  = (item.contentType || '').toUpperCase() === 'SERIES';
    const inList    = itemIds.includes(item.id);
    const isPending = pendingIds.includes(item.id);

    const handleWatchlist = (e) => {
        e.stopPropagation();
        if (!isAuthenticated || !user?.id) { toast.error('Sign in to use your watchlist'); return; }
        if (isPending) return;
        if (inList) {
            dispatch(removeFromWatchlist({ userId: user.id, contentId: item.id }))
                .unwrap().then(() => toast.success('Removed from watchlist')).catch(() => {});
        } else {
            dispatch(addToWatchlist({ userId: user.id, contentId: item.id, contentItem: item }))
                .unwrap().then(() => toast.success('Added to watchlist ✓')).catch(() => {});
        }
    };

    // Highlight search matches
    const highlight = (text = '') => {
        const q = searchQuery?.trim();
        if (!q) return text;
        const rx = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(rx, '<mark class="bg-red-600/50 text-white rounded-sm not-italic">$1</mark>');
    };

    return (
        <div
            onClick={() => onClick(item)}
            className="group relative cursor-pointer rounded-xl overflow-hidden row-card"
            style={{ zIndex: 1 }}
        >
            {/* Poster */}
            <img
                src={imgError ? POSTER_FALLBACK : (item.thumbnailUrl || item.posterUrl)}
                alt={item.title}
                className="w-full aspect-[2/3] object-cover bg-[#1a1a1a]"
                onError={() => setImgError(true)}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
            />

            {/* Series badge */}
            {isSeries && (
                <span className="absolute top-2 left-2 bg-blue-600/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide backdrop-blur-sm">
                    Series
                </span>
            )}

            {/* Watchlist badge */}
            {inList && (
                <span className="absolute top-2 right-2 bg-red-600/90 text-white p-1 rounded backdrop-blur-sm">
                    <FaBookmark size={9} />
                </span>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex flex-col justify-end p-3">
                <h3
                    className="text-white font-bold text-xs sm:text-sm leading-tight mb-1 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: highlight(item.title) }}
                />
                <div className="flex items-center justify-between gap-1">
                    <span className="text-green-400 text-[10px] font-semibold">{item.releaseYear}</span>
                    <div className="flex gap-1.5">
                        {/* Quick play */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onClick(item); }}
                            className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
                        >
                            <FaPlay size={7} className="text-white ml-0.5" />
                        </button>
                        {/* Watchlist */}
                        <button
                            onClick={handleWatchlist}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${inList ? 'bg-red-600' : 'bg-white/20 hover:bg-white/40'}`}
                        >
                            {isPending ? <FaSpinner size={7} className="animate-spin text-white" />
                                : inList ? <FaCheck size={7} className="text-white" />
                                : <FaPlus size={7} className="text-white" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Main Page ─────────────────────────────────────────────────────────────── */
const Content = () => {
    const dispatch = useDispatch();
    const { movies, totalPages, status } = useSelector(s => s.content);

    const [searchParams, setSearchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') || '';

    const [currentPage,  setCurrentPage]  = useState(0);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [selectedItem, setSelectedItem] = useState(null);
    const [localQuery,   setLocalQuery]   = useState(urlQuery);

    const searchInputRef = useRef(null);

    useEffect(() => {
        setLocalQuery(urlQuery);
        if (urlQuery) setCurrentPage(0);
    }, [urlQuery]);

    const loadPage = useCallback((page) => {
        dispatch(fetchAllMovies({ pageNumber: page, pageSize: PAGE_SIZE }));
    }, [dispatch]);

    useEffect(() => {
        loadPage(currentPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage, loadPage]);

    const filtered = (() => {
        let list = movies;
        if (activeFilter !== 'ALL') list = list.filter(m => (m.contentType || '').toUpperCase() === activeFilter);
        const term = urlQuery.trim().toLowerCase();
        if (term) list = list.filter(m =>
            (m.title || '').toLowerCase().includes(term) ||
            (m.description || '').toLowerCase().includes(term) ||
            (m.genre || '').toLowerCase().includes(term)
        );
        return list;
    })();

    const isLoading    = status === 'loading';
    const isSearchMode = !!urlQuery.trim();

    const buildPageRange = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
        const range = [];
        const left  = Math.max(0, currentPage - 2);
        const right = Math.min(totalPages - 1, currentPage + 2);
        if (left > 0)              { range.push(0); if (left > 1) range.push('…'); }
        for (let i = left; i <= right; i++) range.push(i);
        if (right < totalPages - 1) { if (right < totalPages - 2) range.push('…'); range.push(totalPages - 1); }
        return range;
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const term = localQuery.trim();
        if (term) setSearchParams({ q: term });
        else setSearchParams({});
        setCurrentPage(0);
    };

    const clearSearch = () => { setLocalQuery(''); setSearchParams({}); setCurrentPage(0); };

    return (
        <div className="min-h-screen bg-[#0b0b0c] text-white">

            {/* ── Hero Header ──────────────────────────────────────────── */}
            <div className="relative overflow-hidden px-5 sm:px-10 md:px-16 py-12 md:py-16">
                {/* Orbs */}
                <div className="absolute -left-16 -top-16 w-80 h-80 bg-red-800/15 rounded-full blur-3xl animate-float-orb pointer-events-none" />
                <div className="absolute right-0 bottom-0 w-60 h-60 bg-red-900/10 rounded-full blur-2xl animate-float-orb-2 pointer-events-none" />

                <div className="relative z-10 max-w-3xl">
                    <span className="inline-block text-red-500 text-xs font-black uppercase tracking-widest mb-3 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                        Explore
                    </span>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-3">
                        {isSearchMode ? (
                            <>Results for <span className="text-gradient">&ldquo;{urlQuery}&rdquo;</span></>
                        ) : 'All Content'}
                    </h1>
                    <p className="text-gray-500 text-sm mb-7">Browse our entire library of movies &amp; series</p>

                    {/* Search bar */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center max-w-xl gap-0">
                        <div className={`flex-1 flex items-center glass rounded-l-2xl overflow-hidden transition-all duration-200 focus-within:border-red-500/60 focus-within:shadow-lg focus-within:shadow-red-900/15`}>
                            <FaSearch className="ml-4 text-gray-500 flex-shrink-0" size={13} />
                            <input
                                ref={searchInputRef}
                                id="content-search-input"
                                type="text"
                                value={localQuery}
                                onChange={e => setLocalQuery(e.target.value)}
                                placeholder="Search movies, series, genres…"
                                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 px-3 py-3.5 min-w-0"
                            />
                            {localQuery && (
                                <button type="button" onClick={clearSearch} className="pr-3 text-gray-500 hover:text-white">
                                    <FaTimes size={11} />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white font-black text-sm px-6 py-3.5 rounded-r-2xl flex-shrink-0 transition-colors glow-red-sm"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </div>

            {/* ── Filter Tabs (sticky) ──────────────────────────────────── */}
            <div className="sticky top-14 z-40 bg-[#0b0b0c]/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-5 sm:px-10 md:px-16 flex items-center gap-2 py-3 overflow-x-auto hide-scrollbar">
                    {FILTER_TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveFilter(id)}
                            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap flex-shrink-0
                                ${activeFilter === id
                                    ? 'bg-red-600 text-white shadow-md shadow-red-900/40 scale-[1.03]'
                                    : 'glass text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <Icon size={11} /> {label}
                        </button>
                    ))}

                    <div className="ml-auto flex items-center gap-3 flex-shrink-0">
                        <span className="text-gray-600 text-xs">
                            {isSearchMode ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : `Page ${currentPage + 1} / ${totalPages || 1}`}
                        </span>
                        {isSearchMode && (
                            <button
                                onClick={clearSearch}
                                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950/40 border border-red-900/40 rounded-full px-3 py-1 transition-colors"
                            >
                                <FaTimes size={9} /> Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Grid ─────────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 py-8 md:py-10">

                {/* Empty state */}
                {!isLoading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-28 text-gray-600">
                        <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-5">
                            <FaFilm size={30} className="opacity-30" />
                        </div>
                        <p className="text-lg text-gray-400 font-semibold mb-1">
                            {isSearchMode ? `No results for "${urlQuery}"` : 'No content yet'}
                        </p>
                        <p className="text-sm mb-6">
                            {isSearchMode ? 'Try a different keyword.' : 'Check back soon.'}
                        </p>
                        {isSearchMode && (
                            <button onClick={clearSearch} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors">
                                Clear search
                            </button>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                    {isLoading
                        ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
                        : filtered.map(item => (
                            <ContentCard
                                key={item.id}
                                item={item}
                                searchQuery={urlQuery}
                                onClick={setSelectedItem}
                            />
                        ))
                    }
                </div>

                {/* Pagination */}
                {!isSearchMode && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12 md:mt-16 flex-wrap">
                        <PagBtn onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0 || isLoading}>
                            <FaChevronLeft size={12} className="inline" />
                        </PagBtn>
                        {buildPageRange().map((item, idx) =>
                            item === '…'
                                ? <span key={`e${idx}`} className="text-gray-700 px-1 select-none text-sm">…</span>
                                : <PagBtn key={item} active={item === currentPage} disabled={isLoading} onClick={() => setCurrentPage(item)}>{item + 1}</PagBtn>
                        )}
                        <PagBtn onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1 || isLoading}>
                            <FaChevronRight size={12} className="inline" />
                        </PagBtn>
                    </div>
                )}
            </div>

            {selectedItem && <MovieModal movie={selectedItem} onClose={() => setSelectedItem(null)} />}
            <Footer />
        </div>
    );
};

export default Content;

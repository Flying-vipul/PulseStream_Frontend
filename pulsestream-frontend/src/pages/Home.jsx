import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAllMovies } from '../store/slices/contentSlice';
import { addToWatchlist, removeFromWatchlist } from '../store/slices/watchlistSlice';
import MovieModal from '../Components/common/MovieModal';
import Footer from '../Components/common/Footer';
import toast from 'react-hot-toast';
import api from '../api/axiosConfig';
import { getContinueWatching } from '../api/historyApi';
import {
    FaPlay, FaInfoCircle, FaPlus, FaCheck, FaSpinner,
    FaChevronLeft, FaChevronRight, FaSearch, FaFire,
    FaStar, FaFilm, FaTv, FaHistory
} from 'react-icons/fa';

const BANNER_FALLBACK = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%221920%22%20height%3D%221080%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%221920%22%20height%3D%221080%22%20fill%3D%22%230b0b0c%22%2F%3E%3C%2Fsvg%3E";
const POSTER_FALLBACK = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22750%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22500%22%20height%3D%22750%22%20fill%3D%22%231a1a1a%22%2F%3E%3C%2Fsvg%3E";

const HERO_INTERVAL = 6000;

const SkeletonCard = () => (
    <div className="flex-shrink-0 w-32 sm:w-40 md:w-44 rounded-xl overflow-hidden">
        <div className="skeleton aspect-[2/3] rounded-xl" />
    </div>
);

const RowCard = ({ movie, onClick, rank }) => {
    const [imgErr, setImgErr] = useState(false);
    const { isAuthenticated, user } = useSelector(s => s.auth);
    const { itemIds, pendingIds } = useSelector(s => s.watchlist);
    const dispatch = useDispatch();

    const inList = itemIds.includes(movie.id);
    const pending = pendingIds.includes(movie.id);

    const handleWatchlist = (e) => {
        e.stopPropagation();
        if (!isAuthenticated || !user?.id) { toast.error('Sign in to use your watchlist'); return; }
        if (pending) return;
        if (inList) {
            dispatch(removeFromWatchlist({ contentId: movie.id }))
                .unwrap().then(() => toast.success(`Removed from watchlist`)).catch(() => { });
        } else {
            dispatch(addToWatchlist({ contentId: movie.id, contentItem: movie }))
                .unwrap().then(() => toast.success(`Added to watchlist ✓`)).catch(() => { });
        }
    };

    return (
        <div
            onClick={() => onClick(movie)}
            className="group flex-shrink-0 w-32 sm:w-40 md:w-44 cursor-pointer relative row-card rounded-xl overflow-hidden"
            style={{ zIndex: 1 }}
        >
            {/* Rank number — big translucent digit */}
            {rank && (
                <span className="absolute -left-2 bottom-1 text-[72px] font-black leading-none text-white/10 select-none z-10 pointer-events-none">
                    {rank}
                </span>
            )}

            {/* Poster */}
            <img
                src={imgErr ? POSTER_FALLBACK : (movie.thumbnailUrl || movie.posterUrl)}
                alt={movie.title}
                onError={() => setImgErr(true)}
                className="w-full aspect-[2/3] object-cover bg-[#1a1a1a]"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex flex-col justify-end p-2.5">
                <p className="text-white font-bold text-xs leading-tight line-clamp-2 mb-1">{movie.title}</p>
                {movie.progressPercentage !== undefined && (
                    <div className="w-full bg-gray-700 h-1 mt-1 mb-2 rounded overflow-hidden">
                        <div className="bg-red-600 h-full" style={{ width: `${movie.progressPercentage}%` }} />
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <span className="text-green-400 text-[10px] font-semibold">{movie.releaseYear}</span>
                    <button
                        onClick={handleWatchlist}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${inList ? 'bg-red-600' : 'bg-white/20 hover:bg-white/40'}`}
                    >
                        {pending ? <FaSpinner size={8} className="animate-spin text-white" />
                            : inList ? <FaCheck size={8} className="text-white" />
                                : <FaPlus size={8} className="text-white" />}
                    </button>
                </div>
            </div>

            {/* Series badge */}
            {(movie.contentType || '').toUpperCase() === 'SERIES' && (
                <span className="absolute top-1.5 right-1.5 bg-blue-600/90 text-[9px] font-bold text-white px-1.5 py-0.5 rounded uppercase">
                    S
                </span>
            )}
        </div>
    );
};

const MovieRow = ({ title, icon: Icon, movies, onCardClick, showRanks = false, isLoading }) => {
    const rowRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateArrows = () => {
        const el = rowRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    useEffect(() => {
        const el = rowRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateArrows);
        updateArrows();
        return () => el.removeEventListener('scroll', updateArrows);
    }, [movies]);

    const scroll = (dir) => {
        rowRef.current?.scrollBy({ left: dir * 600, behavior: 'smooth' });
    };

    return (
        <section className="mb-8 md:mb-12 group/row">
            {/* Row header */}
            <div className="flex items-center gap-3 px-4 sm:px-8 md:px-16 mb-3 md:mb-4">
                {Icon && <Icon className="text-red-500 text-base md:text-lg" />}
                <h2 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight">{title}</h2>
                <span className="ml-auto text-xs text-red-400 font-semibold opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer hover:underline"
                    onClick={() => { }}>See all →</span>
            </div>

            {/* Scroll container */}
            <div className="relative">
                {/* Left arrow */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll(-1)}
                        className="absolute left-0 top-0 bottom-0 z-20 w-10 sm:w-14 bg-gradient-to-r from-black/90 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/row:opacity-100 transition-opacity"
                    >
                        <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors">
                            <FaChevronLeft size={12} className="text-white" />
                        </span>
                    </button>
                )}
                {/* Right arrow */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll(1)}
                        className="absolute right-0 top-0 bottom-0 z-20 w-10 sm:w-14 bg-gradient-to-l from-black/90 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/row:opacity-100 transition-opacity"
                    >
                        <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors">
                            <FaChevronRight size={12} className="text-white" />
                        </span>
                    </button>
                )}

                <div
                    ref={rowRef}
                    className="flex gap-2 sm:gap-3 overflow-x-auto hide-scrollbar px-4 sm:px-8 md:px-16 pb-4 pt-1"
                    style={{ overflowX: 'scroll' }}
                >
                    {isLoading
                        ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
                        : movies.map((m, i) => (
                            <RowCard
                                key={m.id}
                                movie={m}
                                onClick={onCardClick}
                                rank={showRanks ? i + 1 : null}
                            />
                        ))
                    }
                </div>
            </div>
        </section>
    );
};


const HeroProgressDot = ({ index, activeIndex, onClick }) => (
    <button
        onClick={() => onClick(index)}
        className={`transition-all duration-500 rounded-full ${index === activeIndex
            ? 'w-6 h-1.5 bg-red-500'
            : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
            }`}
    />
);


const Home = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { movies, status } = useSelector(s => s.content);
    const { isAuthenticated, user } = useSelector(s => s.auth);
    const { itemIds, pendingIds } = useSelector(s => s.watchlist);
    const { activeProfile } = useSelector(s => s.profile);

    const [selectedMovie, setSelectedMovie] = useState(null);
    const [heroIndex, setHeroIndex] = useState(0);
    const [heroPrev, setHeroPrev] = useState(null);
    const [heroKey, setHeroKey] = useState(0);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchFocused, setSearchFocused] = useState(false);
    const searchRef = useRef(null);

    // Continue Watching
    const [continueWatching, setContinueWatching] = useState([]);
    const [continueWatchingStatus, setContinueWatchingStatus] = useState('idle');

    const heroMovies = movies.slice(0, 6);
    const trendingRow = [...movies].slice(0, 18);
    const moviesRow = movies.filter(m => (m.contentType || '').toUpperCase() === 'MOVIE');
    const seriesRow = movies.filter(m => (m.contentType || '').toUpperCase() === 'SERIES');
    const topTenRow = [...movies].slice(0, 10);

    useEffect(() => {
        if (status === 'idle') dispatch(fetchAllMovies({ pageNumber: 0, pageSize: 18 }));
    }, [status, dispatch]);

    useEffect(() => {
        const fetchCW = async () => {
            if (!isAuthenticated || !activeProfile?.id) {
                setContinueWatching([]);
                setContinueWatchingStatus('idle');
                return;
            }
            try {
                setContinueWatchingStatus('loading');
                const history = await getContinueWatching(activeProfile.id);
                // Map WatchHistoryDTO to expected RowCard format if needed
                const mapped = history.map(item => ({
                    id: item.contentId,
                    episodeId: item.episodeId,
                    title: item.episodeId ? `${item.title} - ${item.episodeTitle}` : item.title,
                    thumbnailUrl: item.thumbnailUrl,
                    contentType: item.episodeId ? 'SERIES' : 'MOVIE',
                    releaseYear: 'Recent', // Or fetch from backend
                    progressPercentage: item.progressPercentage,
                }));
                setContinueWatching(mapped);
                setContinueWatchingStatus('succeeded');
            } catch (err) {
                console.error("Failed to fetch continue watching", err);
                setContinueWatchingStatus('failed');
            }
        };
        fetchCW();
    }, [isAuthenticated, activeProfile]);


    useEffect(() => {
        if (heroMovies.length < 2) return;
        const timer = setInterval(() => {
            setHeroPrev(heroIndex);
            setHeroIndex(i => (i + 1) % heroMovies.length);
            setHeroKey(k => k + 1);
        }, HERO_INTERVAL);
        return () => clearInterval(timer);
    }, [heroMovies.length, heroIndex]);

    const changeHero = (idx) => {
        setHeroPrev(heroIndex);
        setHeroIndex(idx);
        setHeroKey(k => k + 1);
    };

    useEffect(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) { setSearchResults([]); return; }
        setSearchResults(
            movies.filter(m =>
                (m.title || '').toLowerCase().includes(term) ||
                (m.genre || '').toLowerCase().includes(term)
            ).slice(0, 6)
        );
    }, [searchQuery, movies]);

    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const hero = heroMovies[heroIndex];
    const heroInList = hero ? itemIds.includes(hero.id) : false;
    const heroPending = hero ? pendingIds.includes(hero.id) : false;

    const handleHeroWatchlist = () => {
        if (!isAuthenticated || !user?.id) { toast.error('Sign in to use your watchlist'); return; }
        if (heroPending || !hero) return;
        if (heroInList) {
            dispatch(removeFromWatchlist({ contentId: hero.id }))
                .unwrap().then(() => toast.success('Removed from watchlist')).catch(() => { });
        } else {
            dispatch(addToWatchlist({ contentId: hero.id, contentItem: hero }))
                .unwrap().then(() => toast.success('Added to watchlist ✓')).catch(() => { });
        }
    };

    const isLoading = status === 'loading';

    return (
        <div className="bg-[#0b0b0c] min-h-screen overflow-x-hidden">

            <div className="relative w-full h-[65vh] sm:h-[75vh] md:h-[95vh] min-h-[480px] overflow-hidden">

                {heroMovies.map((m, i) => (
                    <div
                        key={m.id}
                        className="absolute inset-0 transition-opacity duration-1000"
                        style={{ opacity: i === heroIndex ? 1 : 0, zIndex: i === heroIndex ? 2 : 1 }}
                    >
                        <img
                            src={m.bannerUrl || m.thumbnailUrl || BANNER_FALLBACK}
                            alt={m.title}
                            className="w-full h-full object-cover"
                            style={{ transform: i === heroIndex ? 'scale(1.03)' : 'scale(1)', transition: 'transform 6s ease' }}
                            onError={(e) => { e.target.src = BANNER_FALLBACK; }}
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                ))}

                <div className="absolute inset-0 z-10" style={{
                    background: 'linear-gradient(to top, #0b0b0c 0%, rgba(11,11,12,0.6) 40%, rgba(11,11,12,0.1) 70%, transparent 100%)'
                }} />
                <div className="absolute inset-0 z-10" style={{
                    background: 'linear-gradient(to right, rgba(11,11,12,0.85) 0%, rgba(11,11,12,0.4) 50%, transparent 100%)'
                }} />
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-700/10 rounded-full blur-3xl z-10 animate-float-orb pointer-events-none" />
                <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-purple-700/8 rounded-full blur-3xl z-10 animate-float-orb-2 pointer-events-none" />

                {hero && (
                    <div key={heroKey} className="absolute inset-0 z-20 flex flex-col justify-end pb-[8%] px-5 sm:px-10 md:px-20">

                        {/* Genre pill */}
                        <div className="animate-hero-title mb-2 sm:mb-3">
                            <span className="inline-flex items-center gap-1.5 bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
                                <FaFire size={9} />
                                {(hero.contentType || 'MOVIE').charAt(0) + (hero.contentType || 'MOVIE').slice(1).toLowerCase()}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="animate-hero-title text-4xl sm:text-6xl md:text-[5.5rem] font-black text-white leading-[0.9] tracking-tight mb-3 sm:mb-4 max-w-3xl drop-shadow-2xl uppercase" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}>
                            {hero.title}
                        </h1>

                        {/* Meta row */}
                        <div className="animate-hero-subtitle flex items-center gap-3 mb-3 sm:mb-4">
                            <span className="text-green-400 font-bold text-sm">{hero.releaseYear}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                            <div className="flex items-center gap-1 text-yellow-400">
                                <FaStar size={11} />
                                <span className="text-white text-sm font-semibold">8.4</span>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                            <span className="border border-gray-600 text-gray-300 text-[10px] px-1.5 rounded">HD</span>
                        </div>

                        {/* Description */}
                        <p className="animate-hero-subtitle text-gray-300 text-sm sm:text-base max-w-lg line-clamp-2 sm:line-clamp-3 mb-5 sm:mb-7 leading-relaxed hidden sm:block">
                            {hero.description}
                        </p>

                        {/* CTA Buttons */}
                        <div className="animate-hero-actions flex flex-wrap items-center gap-3 mb-5 sm:mb-6">
                            <button
                                onClick={() => navigate(`/watch/${hero.id}`)}
                                className="flex items-center gap-2.5 bg-white text-black font-black px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl text-sm sm:text-base hover:bg-gray-100 transition-all duration-200 shadow-2xl hover:scale-105 active:scale-95"
                            >
                                <FaPlay size={13} /> Play Now
                            </button>

                            <button
                                onClick={() => setSelectedMovie(hero)}
                                className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl text-sm sm:text-base hover:bg-white/25 transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <FaInfoCircle size={13} /> <span className="hidden sm:inline">More Info</span><span className="sm:hidden">Info</span>
                            </button>

                            <button
                                onClick={handleHeroWatchlist}
                                disabled={heroPending}
                                className={`flex items-center gap-2 font-bold px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-xl text-sm border transition-all duration-200 hover:scale-105 active:scale-95 ${heroInList
                                    ? 'bg-red-600/30 border-red-500/60 text-red-400'
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                    }`}
                            >
                                {heroPending ? <FaSpinner size={13} className="animate-spin" />
                                    : heroInList ? <FaCheck size={13} />
                                        : <FaPlus size={13} />}
                                <span className="hidden sm:inline">{heroInList ? 'In My List' : 'My List'}</span>
                            </button>
                        </div>

                        {/* Progress dots */}
                        {heroMovies.length > 1 && (
                            <div className="animate-hero-search flex items-center gap-2 mb-4 sm:mb-0">
                                {heroMovies.map((_, i) => (
                                    <HeroProgressDot key={i} index={i} activeIndex={heroIndex} onClick={changeHero} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-white/10">
                    <div
                        key={heroKey}
                        className="h-full bg-red-500"
                        style={{ animation: `progressBar ${HERO_INTERVAL}ms linear forwards` }}
                    />
                </div>
            </div>


            <div className="relative z-30 px-4 sm:px-8 md:px-16 -mt-4 sm:-mt-6 mb-10 sm:mb-14">
                <div ref={searchRef} className="relative max-w-2xl mx-auto">
                    <form
                        onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) navigate(`/content?q=${encodeURIComponent(searchQuery.trim())}`); }}
                        className={`flex items-center glass rounded-2xl overflow-hidden transition-all duration-300 ${searchFocused ? 'border-red-500/60 shadow-lg shadow-red-900/20' : ''}`}
                    >
                        <FaSearch className="ml-4 sm:ml-5 text-gray-500 flex-shrink-0" size={15} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            placeholder="Search movies, series, genres…"
                            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 px-3 py-3.5 min-w-0"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')} className="pr-2 text-gray-500 hover:text-white">✕</button>
                        )}
                        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-3.5 flex-shrink-0 transition-colors">
                            Search
                        </button>
                    </form>

                    {searchFocused && searchResults.length > 0 && (
                        <div className="absolute top-full mt-2 left-0 right-0 bg-[#181818]/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 px-4 pt-3 pb-1">Suggestions</p>
                            {searchResults.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setSearchFocused(false); setSearchQuery(''); navigate(`/content?q=${encodeURIComponent(item.title)}`); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                                >
                                    <img src={item.thumbnailUrl || POSTER_FALLBACK} onError={e => e.target.src = POSTER_FALLBACK} className="w-8 h-12 object-cover rounded flex-shrink-0" alt="" />
                                    <div>
                                        <p className="text-white text-sm font-semibold">{item.title}</p>
                                        <p className="text-gray-500 text-xs">{item.releaseYear} · {item.contentType}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isAuthenticated && (continueWatching.length > 0 || continueWatchingStatus === 'loading') && (
                <MovieRow
                    title="Continue Watching"
                    icon={FaHistory}
                    movies={continueWatching}
                    onCardClick={(movie) => {
                        if (movie.episodeId) {
                            navigate(`/watch/${movie.id}?episode=${movie.episodeId}`);
                        } else {
                            navigate(`/watch/${movie.id}`);
                        }
                    }}
                    isLoading={continueWatchingStatus === 'loading'}
                />
            )}

            <MovieRow
                title="Trending Now"
                icon={FaFire}
                movies={trendingRow}
                onCardClick={setSelectedMovie}
                isLoading={isLoading}
            />

            <MovieRow
                title="Top 10 This Week"
                icon={FaStar}
                movies={topTenRow}
                onCardClick={setSelectedMovie}
                showRanks={true}
                isLoading={isLoading}
            />

            {moviesRow.length > 0 && (
                <MovieRow
                    title="Movies"
                    icon={FaFilm}
                    movies={moviesRow}
                    onCardClick={setSelectedMovie}
                    isLoading={isLoading}
                />
            )}

            {seriesRow.length > 0 && (
                <MovieRow
                    title="Series"
                    icon={FaTv}
                    movies={seriesRow}
                    onCardClick={setSelectedMovie}
                    isLoading={isLoading}
                />
            )}

           
            <div className="mx-4 sm:mx-8 md:mx-16 mb-12 md:mb-16 rounded-3xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-[#1a0505] to-[#0b0b0c]" />
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(229,9,20,0.4) 0%, transparent 60%)'
                }} />
                {/* Orbs */}
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-red-600/20 rounded-full blur-3xl animate-float-orb pointer-events-none" />
                <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-orange-600/10 rounded-full blur-2xl animate-float-orb-2 pointer-events-none" />

                <div className="relative z-10 px-8 sm:px-14 py-12 sm:py-16 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-center sm:text-left">
                    <div>
                        <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">Unlimited Entertainment</p>
                        <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2">
                            Explore the Full Catalog
                        </h3>
                        <p className="text-gray-400 text-sm sm:text-base max-w-md">
                            Thousands of movies and series. Updated weekly. Watched wherever, whenever.
                        </p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => navigate('/content')}
                            className="px-8 py-3.5 bg-white text-black font-black rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95 text-sm shadow-2xl"
                        >
                            Browse All
                        </button>
                        {!isAuthenticated && (
                            <button
                                onClick={() => navigate('/auth')}
                                className="px-8 py-3.5 bg-red-600/30 border border-red-500/40 text-white font-bold rounded-xl hover:bg-red-600/40 transition-all duration-200 hover:scale-105 text-sm"
                            >
                                Sign Up Free
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedMovie && (
                <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
            )}

            <Footer />
        </div>
    );
};

export default Home;
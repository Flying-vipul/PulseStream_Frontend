import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaBell, FaTimes, FaBookmark, FaBars, FaChevronDown, FaUserCircle, FaPlus, FaSpinner } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveProfile, setProfiles } from '../../store/slices/profileSlice';
import api from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const POSTER_FALLBACK =
    "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22120%22%20height%3D%22180%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22120%22%20height%3D%22180%22%20fill%3D%22%231c1c1c%22%2F%3E%3C%2Fsvg%3E";

const GlassNavbar = () => {
    const [isScrolled,  setIsScrolled]  = useState(false);
    const [searchOpen,  setSearchOpen]  = useState(false);
    const [menuOpen,    setMenuOpen]    = useState(false);
    const [query,       setQuery]       = useState('');
    const [results,     setResults]     = useState([]);
    const [highlighted, setHighlighted] = useState(-1);
    const [createProfileOpen, setCreateProfileOpen] = useState(false);
    const [newProfileName,    setNewProfileName]    = useState('');
    const [isCreating,        setIsCreating]        = useState(false);
    const [switchingTo,       setSwitchingTo]       = useState(null); // cinematic switch overlay

    const navigate    = useNavigate();
    const location    = useLocation();
    const inputRef    = useRef(null);
    const wrapperRef  = useRef(null);
    const mobileMenuRef = useRef(null);

    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { movies }                = useSelector((state) => state.content);
    const { itemIds }               = useSelector((state) => state.watchlist);
    const { activeProfile, profiles } = useSelector((state) => state.profile);
    const dispatch = useDispatch();

    // Close mobile menu on route change
    useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location.pathname]);

    // Lock body scroll when mobile menu open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    // Scroll listener
    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close search on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) closeSearch();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus input when search opens
    useEffect(() => {
        if (searchOpen && inputRef.current) inputRef.current.focus();
    }, [searchOpen]);

    // Live search
    const runSearch = useCallback((q) => {
        const term = q.trim().toLowerCase();
        if (!term) { setResults([]); return; }
        setResults(
            movies
                .filter((m) =>
                    (m.title || '').toLowerCase().includes(term) ||
                    (m.description || '').toLowerCase().includes(term) ||
                    (m.genre || '').toLowerCase().includes(term)
                )
                .slice(0, 6)
        );
    }, [movies]);

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        setHighlighted(-1);
        runSearch(e.target.value);
    };

    const goToResults = (q = query) => {
        const term = q.trim();
        if (!term) return;
        closeSearch();
        navigate(`/content?q=${encodeURIComponent(term)}`);
    };

    const closeSearch = () => {
        setSearchOpen(false);
        setQuery('');
        setResults([]);
        setHighlighted(-1);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') { closeSearch(); return; }
        if (e.key === 'ArrowDown') { setHighlighted((h) => Math.min(h + 1, results.length - 1)); return; }
        if (e.key === 'ArrowUp')   { setHighlighted((h) => Math.max(h - 1, -1)); return; }
        if (e.key === 'Enter') {
            if (highlighted >= 0 && results[highlighted]) {
                closeSearch();
                navigate(`/content?q=${encodeURIComponent(results[highlighted].title)}`);
            } else {
                goToResults();
            }
        }
    };

    const isSeries = (item) => (item.contentType || item.type || '').toUpperCase() === 'SERIES';

    const isActive = (path) => location.pathname === path;

    // Nav link styling helper
    const navLinkClass = (path) =>
        `text-sm font-medium transition-colors ${isActive(path) ? 'text-white' : 'text-gray-300 hover:text-white'}`;

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        if (!newProfileName.trim()) return;
        try {
            setIsCreating(true);
            await api.post(`/v1/profiles?profileName=${encodeURIComponent(newProfileName.trim())}`);
            const res = await api.get('/v1/profiles');
            const list = res.data.profiles || res.data || [];
            dispatch(setProfiles(list));
            setNewProfileName('');
            setCreateProfileOpen(false);
            toast.success('Profile created!');
        } catch (err) {
            toast.error('Failed to create profile');
        } finally {
            setIsCreating(false);
        }
    };

    // Cinematic profile switch: show overlay → dispatch → fade out
    const handleSwitchProfile = (p) => {
        if (activeProfile?.id === p.id) return;
        setSwitchingTo(p);
        // After the overlay fades in (400ms), switch the profile
        setTimeout(() => {
            dispatch(setActiveProfile(p));
            // Then fade out after another 600ms
            setTimeout(() => setSwitchingTo(null), 600);
        }, 400);
    };

    return (
        <>
            {/* ── MAIN NAV BAR ──────────────────────────────────────────────── */}
            <nav 
                    className={`fixed top-0 w-full transition-all duration-300 ${
                    isScrolled ? 'bg-pulse-dark/95 backdrop-blur-lg shadow-subtle border-b border-pulse-text-muted/10 py-3' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-4 md:py-6'
                }`}
                    style={{ zIndex: 9999 }}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-3">

                    {/* ── Logo ─────────────────────────────────────────────── */}
                    <Link to="/" className="text-xl md:text-3xl font-black tracking-tighter text-white shrink-0">
                        PULSE<span className="text-pulse-accent">STREAM</span>
                    </Link>

                    {/* ── Desktop Nav Links ─────────────────────────────────── */}
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
                        <Link to="/" className={navLinkClass('/')}>Home</Link>
                        <Link to="/content" className={navLinkClass('/content')}>Content</Link>
                        {isAuthenticated && (
                            <Link to="/watchlist" className={`relative flex items-center gap-1.5 ${navLinkClass('/watchlist')}`}>
                                <FaBookmark size={11} className="text-red-400" />
                                My List
                                {itemIds.length > 0 && (
                                    <span className="absolute -top-2.5 -right-3 bg-red-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                                        {itemIds.length > 9 ? '9+' : itemIds.length}
                                    </span>
                                )}
                            </Link>
                        )}
                        {isAuthenticated && user?.role === 'ROLE_ADMIN' && (
                            <Link to="/admin" className="text-pulse-accent font-bold hover:text-red-400 transition-colors bg-red-900/20 px-3 py-1 rounded border border-red-900/50">
                                Admin Portal
                            </Link>
                        )}
                    </div>

                    {/* ── Right side controls ───────────────────────────────── */}
                    <div className="flex items-center gap-2 md:gap-4 text-white">

                        {/* Search */}
                        <div ref={wrapperRef} className="relative flex items-center">
                            <div className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out rounded-full border ${
                                searchOpen
                                    ? 'w-44 sm:w-64 md:w-80 border-white/30 bg-black/70 backdrop-blur-md'
                                    : 'w-8 md:w-9 border-transparent bg-transparent'
                            }`}>
                                <button
                                    id="navbar-search-btn"
                                    onClick={() => {
                                        if (!searchOpen) setSearchOpen(true);
                                        else if (query.trim()) goToResults();
                                        else closeSearch();
                                    }}
                                    className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                                    aria-label="Search"
                                >
                                    <FaSearch size={15} />
                                </button>
                                {searchOpen && (
                                    <input
                                        ref={inputRef}
                                        id="navbar-search-input"
                                        type="text"
                                        value={query}
                                        onChange={handleQueryChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search…"
                                        className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 outline-none pr-1 py-2 min-w-0"
                                    />
                                )}
                                {searchOpen && query && (
                                    <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }} className="flex-shrink-0 pr-2 text-gray-400 hover:text-white">
                                        <FaTimes size={11} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown results */}
                            {searchOpen && results.length > 0 && (
                                <div className="absolute top-11 right-0 w-72 sm:w-80 bg-[#181818]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 px-4 pt-3 pb-1">Results</p>
                                    <ul>
                                        {results.map((item, idx) => (
                                            <li key={item.id}>
                                                <button
                                                    onMouseEnter={() => setHighlighted(idx)}
                                                    onClick={() => { closeSearch(); navigate(`/content?q=${encodeURIComponent(item.title)}`); }}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${highlighted === idx ? 'bg-white/10 text-white' : 'text-gray-200 hover:bg-white/5'}`}
                                                >
                                                    <img src={item.thumbnailUrl || POSTER_FALLBACK} alt={item.title} onError={(e) => { e.target.src = POSTER_FALLBACK; }} className="w-9 h-14 object-cover rounded flex-shrink-0 bg-[#2a2a2a]" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold truncate">{item.title}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-green-400 text-xs">{item.releaseYear}</span>
                                                            {isSeries(item) && <span className="text-[10px] font-bold text-blue-400 bg-blue-900/30 px-1.5 rounded">Series</span>}
                                                        </div>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => goToResults()} className="w-full text-center text-xs text-red-400 hover:text-red-300 py-3 border-t border-white/5 font-semibold">
                                        See all results for &ldquo;{query}&rdquo; →
                                    </button>
                                </div>
                            )}
                            {searchOpen && query.trim() && results.length === 0 && (
                                <div className="absolute top-11 right-0 w-64 bg-[#181818]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl p-5 text-center z-50">
                                    <p className="text-gray-400 text-sm">No results for &ldquo;{query}&rdquo;</p>
                                </div>
                            )}
                        </div>

                        {/* Bell — desktop only */}
                        <FaBell className="cursor-pointer hover:text-pulse-accent transition-colors hidden md:block" size={17} />

                        {/* Profile / Sign In — always visible on desktop */}
                        <div className="hidden md:block">
                            {isAuthenticated && user ? (
                                <div className="relative group/profile cursor-pointer py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-gray-700 to-gray-900 text-white flex items-center justify-center font-bold shadow overflow-hidden">
                                            {activeProfile?.name ? activeProfile.name.charAt(0).toUpperCase() : (user.name?.charAt(0) || 'U').toUpperCase()}
                                        </div>
                                        <FaChevronDown size={10} className="text-gray-400 group-hover/profile:text-white transition-colors" />
                                    </div>

                                    {/* Dropdown menu */}
                                    <div className="absolute top-full right-0 mt-0 w-48 bg-[#181818]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 z-50 py-2">
                                        {/* Current Profile */}
                                        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white text-sm">
                                                {activeProfile?.name ? activeProfile.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-bold truncate max-w-[100px]">{activeProfile?.name || user.name}</p>
                                                <p className="text-gray-500 text-[10px]">Active Profile</p>
                                            </div>
                                        </div>

                                        {/* Switch Profiles */}
                                        <div className="py-2">
                                            <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Profiles</p>
                                            {profiles.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handleSwitchProfile(p)}
                                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-white/10 transition-colors rounded-lg mx-1 ${activeProfile?.id === p.id ? 'text-white font-bold' : 'text-gray-300'}`}
                                                >
                                                    <div className={`w-7 h-7 rounded flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                                                        activeProfile?.id === p.id ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                                                    }`}>
                                                        {(p.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="truncate">{p.name || 'Profile'}</span>
                                                    {activeProfile?.id === p.id && (
                                                        <span className="ml-auto text-[9px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex-shrink-0">Active</span>
                                                    )}
                                                </button>
                                            ))}
                                            {/* Add Profile button */}
                                            <button
                                                onClick={() => setCreateProfileOpen(true)}
                                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-colors"
                                            >
                                                <div className="w-7 h-7 rounded border border-dashed border-red-500/50 flex items-center justify-center flex-shrink-0">
                                                    <FaPlus size={10} />
                                                </div>
                                                Add Profile
                                            </button>
                                        </div>

                                        {/* Manage Account */}
                                        <div className="border-t border-white/10 pt-2 mt-1">
                                            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                                                Account Settings
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => navigate('/auth')} className="px-5 py-2 bg-pulse-accent text-sm font-bold rounded hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(229,9,20,0.4)]">
                                    Sign In
                                </button>
                            )}
                        </div>

                        {/* ── Hamburger — mobile only ───────────────────────── */}
                        <button
                            onClick={() => setMenuOpen((o) => !o)}
                            className="md:hidden flex flex-col items-center justify-center w-8 h-8 gap-1.5 text-white"
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? (
                                <FaTimes size={20} />
                            ) : (
                                <>
                                    <span className="block w-6 h-0.5 bg-white rounded transition-all" />
                                    <span className="block w-6 h-0.5 bg-white rounded transition-all" />
                                    <span className="block w-4 h-0.5 bg-white rounded transition-all" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── MOBILE MENU OVERLAY ───────────────────────────────────────── */}
            {menuOpen && (
                <div className="fixed inset-0 md:hidden" style={{ zIndex: 9998 }}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

                    {/* Slide-in panel */}
                    <div
                        ref={mobileMenuRef}
                        className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-[#0d0d0d] border-l border-white/10 shadow-2xl flex flex-col"
                        style={{ animation: 'slideInRight 0.25s ease-out' }}
                    >
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
                            <span className="text-lg font-black text-white">
                                PULSE<span className="text-pulse-accent">STREAM</span>
                            </span>
                            <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white p-1">
                                <FaTimes size={18} />
                            </button>
                        </div>

                        {/* User info */}
                        {isAuthenticated && user && (
                            <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-pulse-accent text-white flex items-center justify-center font-bold text-lg flex-shrink-0 overflow-hidden">
                                    {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : (user.name?.charAt(0) || 'U').toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm">{user.name || 'User'}</p>
                                    <p className="text-gray-500 text-xs">View Profile</p>
                                </div>
                            </Link>
                        )}

                        {/* Nav links */}
                        <nav className="flex-1 overflow-y-auto py-4">
                            {[
                                { to: '/',         label: 'Home' },
                                { to: '/content',  label: 'Content' },
                                ...(isAuthenticated
                                    ? [{ to: '/watchlist', label: 'My List', badge: itemIds.length > 0 ? (itemIds.length > 9 ? '9+' : String(itemIds.length)) : null }]
                                    : []
                                ),
                            ].map(({ to, label, badge }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center justify-between px-6 py-3.5 text-sm font-medium transition-colors ${
                                        isActive(to)
                                            ? 'text-white bg-white/10 border-r-2 border-red-500'
                                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {label}
                                    {badge && (
                                        <span className="bg-red-600 text-white text-[10px] font-black rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                            {badge}
                                        </span>
                                    )}
                                </Link>
                            ))}

                            {/* Subscription */}
                            <Link to="/subscription" onClick={() => setMenuOpen(false)} className={`flex items-center px-6 py-3.5 text-sm font-medium transition-colors ${isActive('/subscription') ? 'text-white bg-white/10 border-r-2 border-red-500' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                Subscription
                            </Link>

                            {/* Admin portal */}
                            {isAuthenticated && user?.role === 'ROLE_ADMIN' && (
                                <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center px-6 py-3.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-colors">
                                    🔴 Admin Portal
                                </Link>
                            )}
                        </nav>

                        {/* Bottom sign in / out */}
                        <div className="px-6 py-5 border-t border-white/10">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                                    className="w-full py-2.5 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
                                >
                                    My Account
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setMenuOpen(false); navigate('/auth'); }}
                                    className="w-full py-2.5 bg-pulse-accent text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes fadeScaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to   { transform: scale(1);    opacity: 1; }
                }
            `}</style>

            {/* ── CREATE PROFILE MODAL ───────────────────────────────────────── */}
            {createProfileOpen && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                    onClick={(e) => { if (e.target === e.currentTarget) { setCreateProfileOpen(false); setNewProfileName(''); } }}
                >
                    <div
                        className="bg-[#181818] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-8"
                        style={{ animation: 'fadeScaleIn 0.2s ease-out' }}
                    >
                        <h2 className="text-2xl font-black text-white mb-1">New Profile</h2>
                        <p className="text-gray-500 text-sm mb-6">Each profile has its own watch history.</p>
                        <form onSubmit={handleCreateProfile}>
                            <input
                                type="text"
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                placeholder="Profile name (e.g. Kids, Main)" 
                                autoFocus
                                maxLength={30}
                                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors mb-5 text-sm"
                            />
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={!newProfileName.trim() || isCreating}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isCreating ? <FaSpinner className="animate-spin" size={14} /> : <FaPlus size={12} />}
                                    {isCreating ? 'Creating...' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setCreateProfileOpen(false); setNewProfileName(''); }}
                                    className="flex-1 bg-transparent border border-gray-700 text-gray-300 font-bold py-2.5 rounded-xl hover:border-white hover:text-white transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── CINEMATIC PROFILE SWITCH OVERLAY ──────────────────────────── */}
            {switchingTo && (
                <div
                    className="fixed inset-0 z-[99998] flex flex-col items-center justify-center bg-black"
                    style={{ animation: 'profileSwitchFade 1s ease-in-out forwards' }}
                >
                    <div className="flex flex-col items-center gap-5" style={{ animation: 'fadeScaleIn 0.4s ease-out' }}>
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white font-black text-5xl sm:text-6xl shadow-2xl shadow-red-900/50">
                            {(switchingTo.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <p className="text-white font-black text-2xl sm:text-3xl tracking-tight">{switchingTo.name}</p>
                        <div className="flex gap-1.5 mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                    <style>{`
                        @keyframes profileSwitchFade {
                            0%   { opacity: 0; }
                            20%  { opacity: 1; }
                            80%  { opacity: 1; }
                            100% { opacity: 0; }
                        }
                    `}</style>
                </div>
            )}
        </>
    );
};

export default GlassNavbar;

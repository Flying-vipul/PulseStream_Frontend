import React, { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import MovieModal from '../common/MovieModal';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const POSTER_FALLBACK = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22500%22%20height%3D%22750%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22500%22%20height%3D%22750%22%20fill%3D%22%23141414%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23444%22%20font-size%3D%2228%22%20font-family%3D%22sans-serif%22%3ENo%20Poster%3C%2Ftext%3E%3C%2Fsvg%3E";

/**
 * Reusable paginated browse grid.
 * Props:
 *   type      – "MOVIE" | "SERIES"
 *   heading   – page heading string
 */
const BrowsePage = ({ type, heading }) => {
    const [items, setItems]           = useState([]);
    const [page, setPage]             = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading]       = useState(false);
    const [selected, setSelected]     = useState(null);
    const PAGE_SIZE = 18;

    useEffect(() => {
        setLoading(true);
        api.get('/content/public/by-type', {
            params: { type, pageNumber: page, pageSize: PAGE_SIZE, sortBy: 'releaseYear', sortOrder: 'desc' }
        })
            .then(({ data }) => {
                setItems(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalItems(data.totalElements || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [type, page]);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const goToPage = (n) => { setPage(n); scrollToTop(); };

    return (
        <div className="bg-[#141414] min-h-screen pb-20 px-8 md:px-16">

            {/* ── Header  */}
            <div className="pt-6 pb-8 flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">{heading}</h1>
                    {!loading && (
                        <p className="text-gray-500 text-sm mt-1">{totalItems.toLocaleString()} titles</p>
                    )}
                </div>
                {/* Page indicator */}
                {totalPages > 1 && (
                    <span className="text-gray-500 text-sm">
                        Page {page + 1} of {totalPages}
                    </span>
                )}
            </div>

            {/* ── Grid  */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="bg-gray-800 rounded-md w-full aspect-[2/3]" />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                    <div className="text-6xl mb-4">{type === 'MOVIE' ? '🎬' : '📺'}</div>
                    <p className="text-xl font-semibold">No {heading} yet</p>
                    <p className="text-sm mt-2">Check back soon — more content is on the way!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelected(item)}
                            className="relative group cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-20"
                        >
                            <img
                                src={item.thumbnailUrl || POSTER_FALLBACK}
                                alt={item.title}
                                className="rounded-md w-full h-auto shadow-lg border border-transparent hover:border-gray-500 bg-[#181818]"
                                onError={(e) => { e.target.onerror = null; e.target.src = POSTER_FALLBACK; }}
                            />
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md p-3 flex flex-col justify-end">
                                <h3 className="text-white font-bold text-xs mb-0.5 truncate">{item.title}</h3>
                                <p className="text-green-500 text-[10px] font-bold">{item.releaseYear}</p>
                                <p className="text-gray-400 text-[9px] mt-1 line-clamp-2">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Pagination Controls  */}
            {totalPages > 1 && !loading && (
                <div className="flex items-center justify-center gap-3 mt-10">
                    <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700
                                   text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <FaChevronLeft size={12} /> Prev
                    </button>

                    {/* Page number pills */}
                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                            let p;
                            if (totalPages <= 7) p = i;
                            else if (page < 4) p = i;
                            else if (page > totalPages - 5) p = totalPages - 7 + i;
                            else p = page - 3 + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => goToPage(p)}
                                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all
                                        ${p === page
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                        }`}
                                >
                                    {p + 1}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page >= totalPages - 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700
                                   text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Next <FaChevronRight size={12} />
                    </button>
                </div>
            )}

            {/* ── Modal ───────────────────────────────────────────────── */}
            {selected && <MovieModal movie={selected} onClose={() => setSelected(null)} />}
        </div>
    );
};

export default BrowsePage;

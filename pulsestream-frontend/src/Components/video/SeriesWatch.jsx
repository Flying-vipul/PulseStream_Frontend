import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllMovies } from '../store/slices/contentSlice'; 
import PulsePlayer from '../Components/video/PulsePlayer'; // Adjust path if needed
import { FaPlay, FaArrowLeft } from 'react-icons/fa';

const SeriesWatch = () => {
    const { seriesId } = useParams(); 
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // 🛡️ 1. GRAB REAL DATA FROM REDUX
    const { movies, status } = useSelector((state) => state.content);
    
    // Fetch if page is refreshed
    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchAllMovies({ pageNumber: 0, pageSize: 20 }));
        }
    }, [status, dispatch]);

    // Find the specific series
    const series = movies.find((m) => m.id === parseInt(seriesId));

    // 🛡️ 2. THE STATE ENGINE
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [activeEpisode, setActiveEpisode] = useState(null);

    // 🚨 3. INITIALIZE SECURELY (Auto-select Season 1, Episode 1)
    useEffect(() => {
        if (series && series.seasons?.length > 0) {
            const sortedSeasons = [...series.seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
            const firstSeason = sortedSeasons[0];
            
            setSelectedSeason(firstSeason.seasonNumber);
            
            if (firstSeason.episodes?.length > 0) {
                const sortedEpisodes = [...firstSeason.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
                setActiveEpisode(sortedEpisodes[0]);
            }
        }
    }, [series]);

    // 🚀 NEW: Auto-select first episode of the season when changing the season dropdown
    // Prevents playing a mismatching season video string
    useEffect(() => {
        if (series) {
            const targetSeason = series.seasons?.find(s => s.seasonNumber === selectedSeason);
            if (targetSeason && targetSeason.episodes?.length > 0) {
                const sortedEpisodes = [...targetSeason.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
                // Only reset if current active episode doesn't belong to current season selection
                if (activeEpisode && !targetSeason.episodes.some(e => e.id === activeEpisode.id)) {
                    setActiveEpisode(sortedEpisodes[0]);
                }
            }
        }
    }, [selectedSeason, series]);

    // ⏳ LOADING SCREEN
    if (status === 'loading' || !series) {
        return (
            <div className="w-screen h-screen bg-[#0a0a0a] flex flex-col justify-center items-center text-white">
                <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h1 className="text-xl font-bold tracking-widest text-red-500">LOADING PULSESTREAM...</h1>
            </div>
        );
    }

    // Helper to get episodes for the currently selected dropdown season
    const currentSeason = series.seasons?.find(s => s.seasonNumber === selectedSeason);
    const currentSeasonEpisodes = currentSeason?.episodes 
        ? [...currentSeason.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber) 
        : [];

    // Handles clicking a new episode
    const handleEpisodeSelect = (episode) => {
        setActiveEpisode(episode);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 🛡️ The Spring Boot Bridge URL Builder
    const fullVideoUrl = activeEpisode?.videoUrl?.startsWith('http') 
        ? activeEpisode.videoUrl 
        : `${import.meta.env.VITE_BACK_END_URL || 'http://localhost:8080'}${activeEpisode?.videoUrl}`;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden">
            
            {/* 🎬 1. THE PLAYER SECTION */}
            <div className="w-full bg-black pt-4 pb-8 border-b border-white/10 shadow-2xl relative">
                
                {/* Back Button Overlay */}
                <button 
                    onClick={() => navigate(-1)} 
                    className="absolute top-6 left-6 z-50 text-white/70 hover:text-white hover:scale-110 transition-all bg-black/40 p-3 rounded-full backdrop-blur-sm"
                >
                    <FaArrowLeft size={20} />
                </button>

                {activeEpisode && fullVideoUrl ? (
                    <PulsePlayer 
                        videoUrl={fullVideoUrl} 
                        title={`${series.title} - S${selectedSeason} E${activeEpisode.episodeNumber}: ${activeEpisode.title}`} 
                    />
                ) : (
                    <div className="w-full aspect-video flex items-center justify-center border border-gray-800 bg-[#141414]">
                        <p className="text-gray-500 font-bold">No episode selected or video unavailable.</p>
                    </div>
                )}
            </div>

            {/* 📚 2. THE SERIES INFO & EPISODE SELECTOR SECTION */}
            <div className="max-w-6xl mx-auto px-4 py-10 animate-fadeIn">
                
                {/* Series Title & Meta */}
                <div className="mb-10 flex gap-6">
                    <img src={series.thumbnailUrl} alt={series.title} className="w-32 h-48 object-cover rounded-lg shadow-lg hidden md:block" />
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-wide">{series.title}</h1>
                        <div className="flex gap-3 mb-4 text-sm font-bold text-gray-400">
                            <span className="bg-white/10 px-2 py-1 rounded">{series.releaseYear}</span>
                            <span className="bg-white/10 px-2 py-1 rounded">{series.seasons?.length || 0} Seasons</span>
                            <span className="bg-red-600/20 text-red-500 px-2 py-1 rounded border border-red-600/30">HD</span>
                        </div>
                        <p className="text-gray-300 text-lg max-w-3xl leading-relaxed">{series.description}</p>
                    </div>
                </div>

                {/* Season Selector Dropdown */}
                {series.seasons?.length > 0 ? (
                    <>
                        <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                            <h3 className="text-2xl font-bold text-white">Episodes</h3>
                            <select 
                                value={selectedSeason} 
                                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                className="bg-[#1a1a1a] border border-white/20 text-white text-lg font-bold py-2 px-4 rounded-md focus:outline-none focus:border-red-600 transition-colors cursor-pointer shadow-lg"
                            >
                                {series.seasons.map(season => (
                                    <option key={season.id} value={season.seasonNumber}>
                                        Season {season.seasonNumber}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Episode List Grid */}
                        <div className="flex flex-col gap-4">
                            {currentSeasonEpisodes.length > 0 ? (
                                currentSeasonEpisodes.map((episode) => {
                                    const isPlaying = activeEpisode?.id === episode.id;

                                    return (
                                        <div 
                                            key={episode.id}
                                            onClick={() => handleEpisodeSelect(episode)}
                                            className={`group flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                                                isPlaying 
                                                    ? 'bg-red-900/20 border-red-700/50 shadow-[0_0_20px_rgba(255,0,0,0.1)]' 
                                                    : 'bg-transparent border-transparent hover:bg-white/5'
                                            }`}
                                        >
                                            {/* Thumbnail Container */}
                                            <div className="relative w-full sm:w-64 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a] border border-white/5">
                                                <img 
                                                    src={series.bannerUrl || series.thumbnailUrl} 
                                                    alt={episode.title} 
                                                    className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'scale-105 opacity-60' : 'group-hover:scale-105 opacity-80'}`}
                                                />
                                                
                                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                    <FaPlay size={32} className={isPlaying ? 'text-red-500 drop-shadow-lg' : 'text-white'} />
                                                </div>
                                                
                                                {episode.durationMinutes && (
                                                    <div className="absolute bottom-2 right-2 bg-black/90 px-2 py-1 rounded text-xs font-bold text-white tracking-wider">
                                                        {episode.durationMinutes}m
                                                    </div>
                                                )}
                                            </div>

                                            {/* Episode Details */}
                                            <div className="flex-grow w-full">
                                                <div className="flex items-baseline justify-between mb-2">
                                                    <h4 className={`text-xl font-bold transition-colors ${isPlaying ? 'text-red-500' : 'text-white group-hover:text-red-400'}`}>
                                                        {episode.episodeNumber}. {episode.title}
                                                    </h4>
                                                </div>
                                                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl line-clamp-3">
                                                    {episode.description || `Watch episode ${episode.episodeNumber} of ${series.title} season ${selectedSeason}.`}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-gray-500 py-10 text-center text-lg border border-dashed border-gray-800 rounded-xl">
                                    No episodes have been uploaded for this season yet.
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-gray-500 py-20 text-center text-xl font-bold border border-dashed border-gray-800 rounded-xl bg-[#141414]">
                        This series is currently empty. Seasons coming soon!
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeriesWatch;
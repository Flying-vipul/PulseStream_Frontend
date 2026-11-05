import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllMovies } from '../store/slices/contentSlice';
import PulsePlayer from '../Components/video/PulsePlayer';
import { FaList } from 'react-icons/fa';
import { getContinueWatching } from '../api/historyApi';

const Watch = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Grab state from Redux safely
    const { movies = [], status = 'idle' } = useSelector((state) => state.content || {});

    // WEB SERIES STATE
    const [showEpisodesPanel, setShowEpisodesPanel] = useState(false);
    const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
    const [activeEpisode, setActiveEpisode] = useState(null);

    // WATCH HISTORY STATE
    const { activeProfile } = useSelector((state) => state.profile || {});
    const [savedPosition, setSavedPosition] = useState(0);
    const [historyFetched, setHistoryFetched] = useState(false);

    // Fetch the database if the user refreshed the page
    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchAllMovies({ pageNumber: 0, pageSize: 20 }));
        }
    }, [status, dispatch]);

    const content = movies.find((m) => m.id === parseInt(id));

    // Initialize the active episode the moment a Series loads
    const location = useLocation();
    
    useEffect(() => {
        if (content && (content.contentType === 'SERIES' || content.contentType === 'TV_SHOW')) {
            const queryParams = new URLSearchParams(location.search);
            const targetEpisodeId = queryParams.get('episode');

            if (targetEpisodeId) {
                // Find the specific episode and its season index
                let foundEpisode = null;
                let foundSeasonIndex = 0;
                
                content.seasons?.forEach((season, sIdx) => {
                    const ep = season.episodes?.find(e => e.id === parseInt(targetEpisodeId));
                    if (ep) {
                        foundEpisode = ep;
                        foundSeasonIndex = sIdx;
                    }
                });

                if (foundEpisode) {
                    setActiveSeasonIndex(foundSeasonIndex);
                    setActiveEpisode(foundEpisode);
                    return;
                }
            }
            
            // Default to Season 1, Episode 1 if no target or not found
            if (content.seasons?.length > 0 && content.seasons[0].episodes?.length > 0) {
                setActiveSeasonIndex(0);
                setActiveEpisode(content.seasons[0].episodes[0]);
            }
        }
    }, [content, location.search]);

    // Fetch continue-watching to see if we have a saved position
    useEffect(() => {
        const fetchHistory = async () => {
            if (!activeProfile?.id || !content) {
                setHistoryFetched(true);
                return;
            }
            try {
                const history = await getContinueWatching(activeProfile.id);
                
                const currentEpisodeId = activeEpisode ? activeEpisode.id : null;
                const record = history.find(item => 
                    item.contentId === content.id && 
                    (item.episodeId || null) === currentEpisodeId
                );

                if (record && !record.completed) {
                    setSavedPosition(record.currentPositionSeconds);
                } else {
                    setSavedPosition(0);
                }
            } catch (err) {
                console.error("Failed to load playback position", err);
            } finally {
                setHistoryFetched(true);
            }
        };

        setHistoryFetched(false); // Reset when content or episode changes
        fetchHistory();
    }, [activeProfile, content, activeEpisode]);

    // Wait until Redux actually has the movie/series and history is loaded
    if (status === 'loading' || !content || !historyFetched) {
        return (
            <div className="w-screen h-screen bg-black flex flex-col justify-center items-center text-white">
                <div className="w-16 h-16 border-4 border-pulse-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                <h1 className="text-xl">Loading Stream Engine...</h1>
                <button onClick={() => navigate('/')} className="mt-4 text-gray-400 hover:text-white underline">
                    Return Home
                </button>
            </div>
        );
    }

    const isSeries = content.contentType === 'SERIES' || content.contentType === 'TV_SHOW';

    // THE MAGIC ROUTER: Determine which URL and Title to pass to PulsePlayer
    const currentVideoPath = isSeries ? activeEpisode?.videoUrl : content.videoUrl;
    const currentTitle = isSeries && activeEpisode
        ? `${content.title}: S${activeSeasonIndex + 1} E${activeEpisode.episodeNumber} - ${activeEpisode.title}`
        : content.title;

    // The Video URL
    const fullVideoUrl = currentVideoPath 
        ? (currentVideoPath.startsWith('http') ? currentVideoPath : `${import.meta.env.VITE_BACK_END_URL || 'http://localhost:8080'}${currentVideoPath}`) 
        : null;

    return (
        <div className="w-screen h-screen bg-black flex overflow-hidden">

            {/* MAIN PLAYER AREA */}
            <div className={`relative transition-all duration-300 ${showEpisodesPanel ? 'w-3/4' : 'w-full'} h-full`}>

                {/* FLOATING EPISODES BUTTON (Only for Series) */}
                {isSeries && (
                    <button
                        onClick={() => setShowEpisodesPanel(!showEpisodesPanel)}
                        className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-black/60 hover:bg-pulse-accent backdrop-blur border border-white/20 text-white px-4 py-2 rounded-md transition-all shadow-lg"
                    >
                        <FaList /> {showEpisodesPanel ? 'Close Episodes' : 'Episodes'}
                    </button>
                )}

                {/* Render the Player if we have a URL */}
                {fullVideoUrl ? (
                    <PulsePlayer
                        videoUrl={fullVideoUrl}
                        title={currentTitle}
                        contentId={content.id}
                        episodeId={activeEpisode?.id || null}
                        initialTime={savedPosition}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        {isSeries ? "No episodes uploaded yet." : "Video file missing."}
                    </div>
                )}
            </div>

            {/* EPISODES SIDEBAR */}
            {isSeries && showEpisodesPanel && (
                <div className="w-1/4 h-full bg-[#141414] border-l border-gray-800 flex flex-col z-40 shadow-2xl">

                    {/* Sidebar Header: Season Selector */}
                    <div className="p-6 border-b border-gray-800 bg-black/40 pt-10">
                        <h2 className="text-2xl font-bold text-white mb-4">{content.title}</h2>
                        <select
                            className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded-md focus:outline-none focus:border-red-600 font-bold"
                            value={activeSeasonIndex}
                            onChange={(e) => setActiveSeasonIndex(parseInt(e.target.value))}
                        >
                            {content.seasons?.map((season, index) => (
                                <option key={season.id} value={index}>
                                    Season {season.seasonNumber} {season.title && `- ${season.title}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Episodes List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {content.seasons[activeSeasonIndex]?.episodes?.map((episode) => {
                            const isCurrentlyPlaying = activeEpisode?.id === episode.id;
                            return (
                                <div
                                    key={episode.id}
                                    onClick={() => setActiveEpisode(episode)}
                                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${isCurrentlyPlaying ? 'bg-red-900/30 border border-red-700/50' : 'hover:bg-gray-800 border border-transparent'
                                        }`}
                                >
                                    <div className={`text-2xl font-black ${isCurrentlyPlaying ? 'text-red-500' : 'text-gray-600'}`}>
                                        {episode.episodeNumber}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isCurrentlyPlaying ? 'text-white' : 'text-gray-300'}`}>
                                            {episode.title}
                                        </h4>
                                        <p className="text-xs text-gray-500">{episode.durationMinutes} min</p>
                                    </div>
                                </div>
                            );
                        })}

                        {(!content.seasons[activeSeasonIndex]?.episodes || content.seasons[activeSeasonIndex].episodes.length === 0) && (
                            <div className="text-gray-500 text-center mt-10">No episodes available.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Watch;
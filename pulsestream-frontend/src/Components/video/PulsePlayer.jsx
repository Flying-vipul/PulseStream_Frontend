import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FaPlay, FaPause, FaVolumeUp, FaVolumeMute,
    FaExpand, FaArrowLeft, FaForward, FaBackward
} from 'react-icons/fa';
import Hls from 'hls.js';
import api from '../../api/axiosConfig';
import { savePlaybackProgress } from '../../api/historyApi';

// Props: videoUrl, title, contentId, episodeId (optional), initialTime (optional)
const PulsePlayer = ({ videoUrl, title, contentId, episodeId = null, initialTime = 0 }) => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);
    const heartbeatRef = useRef(null);
    const touchStartX = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [showControls, setShowControls] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    let controlsTimeout;

    // Detect mobile on mount
    useEffect(() => {
        setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);
    }, []);

    // ðŸš¨ 1. THE SAFE PLAY WRAPPER
    const safePlay = () => {
        if (!videoRef.current) return;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("SafePlay: Autoplay or rapid click prevented playback.", error.message);
                setPlaying(false);
            });
        }
    };

    // 🚨 1. THE WATCH HISTORY HEARTBEAT INTEGRATION
    const { activeProfile } = useSelector((state) => state.profile);
    const lastHeartbeatPos = useRef(0);

    const sendHeartbeat = useCallback(async (isImmediate = false) => {
        if (!videoRef.current || !activeProfile?.id) return;
        
        const currentPos = Math.floor(videoRef.current.currentTime);
        // Avoid sending duplicate heartbeats if position hasn't changed significantly (unless forced)
        if (!isImmediate && Math.abs(currentPos - lastHeartbeatPos.current) < 5) return;

        try {
            await savePlaybackProgress(activeProfile.id, {
                contentId: contentId,
                episodeId: episodeId || null,
                positionSeconds: currentPos
            });
            lastHeartbeatPos.current = currentPos;
        } catch (error) {
            console.error("Heartbeat failed, but playback continues:", error);
        }
    }, [activeProfile, contentId, episodeId]);

    useEffect(() => {
        if (!playing) return;
        
        // Send heartbeat every 15 seconds while actively playing
        heartbeatRef.current = setInterval(() => {
            sendHeartbeat(false);
        }, 15000);

        return () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }
        };
    }, [playing, sendHeartbeat]);

    // Send heartbeat immediately on unmount
    useEffect(() => {
        return () => {
            if (activeProfile?.id && videoRef.current) {
               sendHeartbeat(true);
            }
        };
    }, [sendHeartbeat, activeProfile]);

    // ðŸš¨ 2. THE SYNCHRONIZED HLS ENGINE
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !videoUrl) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);

        let hls;
        if (Hls.isSupported()) {
            hls = new Hls({ startLevel: -1 });
            hls.loadSource(videoUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                //Resume from saved position
                if (initialTime > 5) {
                    video.currentTime = initialTime;
                }
                safePlay();
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoUrl;
            video.addEventListener('loadedmetadata', () => {
                if (initialTime > 5) video.currentTime = initialTime;
                safePlay();
            });
        }

        return () => {
            if (hls) hls.destroy();
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
        };
    }, [videoUrl, initialTime]);

    // Volume Sync
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = muted;
        }
    }, [volume, muted]);

    // Fullscreen / Orientation Locks
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && screen.orientation?.unlock) {
                screen.orientation.unlock();
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    //On mobile: lock orientation to landscape when video plays
    useEffect(() => {
        if (!isMobile) return;
        if (playing && screen.orientation?.lock) {
            screen.orientation.lock('landscape').catch(() => { }); // Fails silently on desktop/unsupported
        } else if (!playing && screen.orientation?.unlock) {
            screen.orientation.unlock();
        }
    }, [playing, isMobile]);

    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            if (playing) setShowControls(false);
        }, 3000);
    };

    // ðŸ“± Touch: tap = show controls / double-tap = skip
    const lastTapRef = useRef(0);
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;
        const touchEndX = e.changedTouches[0].clientX;
        const swipeDist = Math.abs(touchEndX - touchStartX.current);

        if (swipeDist > 40) return; // It's a swipe, not a tap â€” ignore

        if (timeSinceLastTap < 300) {
            // Double-tap: skip Â±10s based on which half of screen
            const midpoint = window.innerWidth / 2;
            handleSkip(touchEndX < midpoint ? -10 : 10);
        } else {
            // Single tap: toggle controls
            setShowControls(prev => !prev);
            clearTimeout(controlsTimeout);
            controlsTimeout = setTimeout(() => setShowControls(false), 3000);
        }
        lastTapRef.current = now;
    };

    const toggleFullScreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
            } else if (playerContainerRef.current) {
                await playerContainerRef.current.requestFullscreen();
                if (screen.orientation && screen.orientation.lock) {
                    try {
                        await screen.orientation.lock('landscape');
                    } catch (err) {
                        // Fails silently on desktop
                    }
                }
            }
        } catch (error) {
            console.error("Fullscreen error:", error);
        }
    };

    // ðŸš¨ 3. USE DOM STATE, NOT REACT STATE, FOR PLAYBACK LOGIC
    // This prevents React state lag from causing double-clicks
    const togglePlayPause = (e) => {
        if (e) e.stopPropagation();
        if (!videoRef.current) return;

        if (videoRef.current.paused) {
            safePlay();
        } else {
            videoRef.current.pause();
        }
    };

    const handleScreenClick = (e) => {
        if (e.target.closest('.control-bar') || e.target.closest('.top-bar')) return;
        togglePlayPause();
    };

    const handleSkip = (amount) => {
        if (videoRef.current) {
            videoRef.current.currentTime += amount;
        }
    };

    const handleSpeedChange = () => {
        const speeds = [1, 1.25, 1.5, 2];
        const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
        setPlaybackSpeed(nextSpeed);
        if (videoRef.current) {
            videoRef.current.playbackRate = nextSpeed;
        }
    };

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds)) return "00:00";
        const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div
            ref={playerContainerRef}
            className="pulse-player-container relative w-full bg-black flex items-center justify-center overflow-hidden cursor-pointer group"
            style={{ height: '100svh' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => playing && setShowControls(false)}
            onClick={!isMobile ? handleScreenClick : undefined}
            onTouchStart={isMobile ? handleTouchStart : undefined}
            onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
            <video
                key={videoUrl}
                ref={videoRef}
                className="absolute top-0 left-0 w-full h-full object-contain"
                playsInline

                // REMOVED autoPlay: We handle it safely in JavaScript now!

                onPlay={() => setPlaying(true)}
                onPause={() => {
                    setPlaying(false);
                    sendHeartbeat(true);
                }}
                onSeeked={() => sendHeartbeat(true)}
                onEnded={() => {
                    setPlaying(false);
                    sendHeartbeat(true);
                }}
            />

            <div
                className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-500 z-10 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                {/* Top Bar */}
                <div className="top-bar w-full p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-4 pointer-events-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-white hover:text-red-600 transition-colors transform hover:-translate-x-1"
                    >
                        <FaArrowLeft size={24} />
                    </button>
                    <h1 className="text-white text-xl font-bold tracking-wide drop-shadow-md">{title}</h1>
                </div>

                {/* Big Center Play/Pause Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {!playing && (
                        <div className="bg-black/50 backdrop-blur-sm text-white rounded-full p-6 border border-white/20 transition-all">
                            <FaPlay size={48} className="ml-1 opacity-80" />
                        </div>
                    )}
                </div>

                {/* Bottom Control Area */}
                <div className="control-bar w-full px-6 py-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 pointer-events-auto">

                    <div className="w-full flex items-center gap-4 text-white text-sm font-medium">
                        <span>{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => {
                                const newTime = parseFloat(e.target.value);
                                videoRef.current.currentTime = newTime;
                                setCurrentTime(newTime);
                            }}
                            className="flex-grow h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-2 transition-all"
                        />
                        <span>{formatTime(duration)}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-4 sm:gap-6">

                            <button
                                onClick={togglePlayPause}
                                className="text-white hover:text-red-600 transition-colors hover:scale-110 p-1"
                            >
                                {playing ? <FaPause size={isMobile ? 22 : 28} /> : <FaPlay size={isMobile ? 22 : 28} />}
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); handleSkip(-10); }} className="text-white hover:text-red-600 transition-colors p-1">
                                <FaBackward size={isMobile ? 18 : 20} />
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); handleSkip(10); }} className="text-white hover:text-red-600 transition-colors p-1">
                                <FaForward size={isMobile ? 18 : 20} />
                            </button>

                            {/* Volume â€” always visible on mobile, hover on desktop */}
                            <div className="flex items-center gap-2 group/vol">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                                    className="text-white hover:text-red-600 transition-colors p-1"
                                >
                                    {muted || volume === 0 ? <FaVolumeMute size={isMobile ? 18 : 24} /> : <FaVolumeUp size={isMobile ? 18 : 24} />}
                                </button>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={muted ? 0 : volume}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                                    className={`volume-slider accent-red-600 cursor-pointer h-1.5 transition-all duration-300
                                        ${isMobile ? 'w-16 opacity-100' : 'w-0 opacity-0 group-hover/vol:w-24 group-hover/vol:opacity-100'}`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSpeedChange(); }}
                                className="text-white font-bold border-2 border-white/50 rounded-md px-2 py-0.5 hover:bg-white hover:text-black transition-colors"
                            >
                                {playbackSpeed}x
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFullScreen(); }}
                                className="text-white hover:text-red-600 transition-colors hover:scale-110"
                            >
                                <FaExpand size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PulsePlayer;

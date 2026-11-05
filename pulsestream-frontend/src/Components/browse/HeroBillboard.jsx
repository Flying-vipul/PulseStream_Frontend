import React from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const HeroBillboard = () => {

    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);
    // Hardcoded for now. Later, Redux will feed this data dynamically!
    const featuredMovie = {
        title: "AVENGERS: DOOMSDAY",
        description: "When the multiverse shatters, a new threat emerges from the ruins. The ultimate battle for reality begins now.",
        bannerUrl: "https://image.tmdb.org/t/p/original/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg" 
    };

    return (
        <div className="relative w-full h-[85vh] -mt-24">
            {/* 1. The Massive Background Image */}
            <div className="absolute top-0 left-0 w-full h-full">
                <img 
                    src={featuredMovie.bannerUrl} 
                    alt="Featured Movie" 
                    className="w-full h-full object-cover object-top"
                />
                
                {/* 2. The Dark Gradients (Fades into the background color at the bottom) */}
                <div className="absolute inset-0 bg-gradient-to-r from-pulse-dark via-pulse-dark/60 to-transparent w-full lg:w-3/4"></div>
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-pulse-dark via-pulse-dark/80 to-transparent"></div>
            </div>

            {/* 3. The Content Overlay */}
            <div className="relative z-10 flex flex-col justify-end md:justify-center h-full px-6 md:px-16 lg:px-24 w-full md:w-3/4 lg:w-1/2 pb-16 md:pb-0">
                
                <motion.h1 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-pulse-text tracking-tight drop-shadow-lg mb-4"
                >
                    {featuredMovie.title}
                </motion.h1>
                
                <motion.p 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-lg md:text-xl text-gray-300 drop-shadow-md mb-8 max-w-xl line-clamp-3"
                >
                    {featuredMovie.description}
                </motion.p>
                
            

                {/* 4. The Action Buttons */}
                <motion.div 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2"
                >
                    {/* Play button: redirects to auth if not logged in */}
                    <button 
                        onClick={() => {
                            if (isAuthenticated) {
                                navigate(`/watch/${featuredMovie.id}`);
                            } else {
                                navigate('/auth');
                            }
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-black rounded font-bold text-base sm:text-lg hover:bg-gray-200 transition-all shadow-subtle"
                    >
                        <FaPlay size={18} />
                        {isAuthenticated ? 'Play' : 'Watch Now'}
                    </button>
                    
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 sm:px-8 py-2.5 sm:py-3 bg-pulse-elevated/70 text-pulse-text rounded font-bold text-base sm:text-lg backdrop-blur-md hover:bg-pulse-elevated transition-all">
                        <FaInfoCircle size={22} />
                        More Info
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroBillboard;
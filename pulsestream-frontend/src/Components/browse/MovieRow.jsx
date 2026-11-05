import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import axios from '../../api/axiosConfig'; // 🛡️ Import your custom axios instance!
import MovieCard from './MovieCard';

//  1. Notice we changed the prop from 'movies' to 'fetchUrl'
const MovieRow = ({ title, fetchUrl }) => {
    //  2. Create a state to hold the movies once they download from TMDB
    const [movies, setMovies] = useState([]);

    //  3. The Data Fetcher: Reaches out to TMDB the millisecond the row loads
    useEffect(() => {
        const fetchData = async () => {
            try {
                const request = await axios.get(fetchUrl);
                // Grab the results array from TMDB's JSON and save it to state
                setMovies(request.data.results);
            } catch (error) {
                console.error("Error fetching movies: ", error);
            }
        };
        fetchData();
    }, [fetchUrl]); 

    //  4. If the data is still downloading, don't try to map it! Just return null.
    if (!movies || movies.length === 0) return null; 

    return (
        <div className="w-full pl-6 md:pl-16 py-6 relative z-20">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 drop-shadow-md">
                {title}
            </h2>
            
            <Swiper
                modules={[Navigation]}
                navigation
                spaceBetween={15}
                slidesPerView={2.5}
                breakpoints={{
                    640: { slidesPerView: 3.5 },
                    768: { slidesPerView: 4.5 },
                    1024: { slidesPerView: 5.5 },
                    1280: { slidesPerView: 6.5 },
                }}
                className="movie-swiper-container overflow-visible"
            >
                {movies.map((movie) => (
                    //  5. We only render a card if TMDB actually gave us a poster image
                    movie.poster_path && (
                        <SwiperSlide key={movie.id} className="overflow-visible py-4">
                            <MovieCard movie={movie} />
                        </SwiperSlide>
                    )
                ))}
            </Swiper>
        </div>
    );
};

export default MovieRow;
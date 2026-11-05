// Pulls your secret key securely from the .env file
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const requests = {
    fetchTrending: `/trending/all/week?api_key=${API_KEY}&language=en-US`,
    fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
    fetchActionMovies: `/discover/movie?api_key=${API_KEY}&with_genres=28`,
    fetchSciFiMovies: `/discover/movie?api_key=${API_KEY}&with_genres=878`,
    fetchHorrorMovies: `/discover/movie?api_key=${API_KEY}&with_genres=27`,
};

export default requests;
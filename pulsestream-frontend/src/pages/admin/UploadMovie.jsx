import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const UploadMovie = () => {
    const { token } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);

    // 1. State for the JSON Metadata (Must match your ContentDTO)
    const [movieDetails, setMovieDetails] = useState({
        title: '',
        description: '',
        genre: '',
        releaseYear: '',
        maturityRating: 'PG_13' // Default fallback
    });

    // 2. State for the Files
    const [files, setFiles] = useState({
        poster: null,
        banner: null,
        video: null
    });

    const handleInputChange = (e) => {
        setMovieDetails({ ...movieDetails, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!files.video || !files.poster || !movieDetails.title) {
            toast.error("Title, Poster, and Video are required!");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        
        // 🚨 THE CRITICAL STEP: Package JSON into a Blob for Spring Boot
        formData.append("movieDetails", new Blob([JSON.stringify(movieDetails)], { type: "application/json" }));
        
        // Append the raw files
        if (files.poster) formData.append("poster", files.poster);
        if (files.banner) formData.append("banner", files.banner);
        if (files.video) formData.append("video", files.video);

        try {
            // Hit your AdminContentController
            await axios.post(`${import.meta.env.VITE_BACK_END_URL || 'http://localhost:8080'}/api/admin/content/movie`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    // Browser automatically sets the exact multipart boundary, but we enforce the type
                    'Content-Type': 'multipart/form-data' 
                }
            });
            
            toast.success("Movie successfully sent to the FFmpeg engine!");
            
            // Clear the form
            setMovieDetails({ title: '', description: '', genre: '', releaseYear: '', maturityRating: 'PG_13' });
            setFiles({ poster: null, banner: null, video: null });
            
        } catch (error) {
            console.error(error);
            toast.error("Upload failed: " + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 bg-[#141414] text-white rounded-lg shadow-xl mt-10 border border-gray-800">
            <h2 className="text-3xl font-bold mb-6 text-red-600">Upload New Movie</h2>
            
            <form onSubmit={handleUpload} className="space-y-6">
                {/* Metadata Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Movie Title</label>
                        <input type="text" name="title" value={movieDetails.title} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-red-600" placeholder="e.g., Avengers: Doomsday" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Genre</label>
                        <input type="text" name="genre" value={movieDetails.genre} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-red-600" placeholder="e.g., Action, Sci-Fi" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Release Year</label>
                        <input type="number" name="releaseYear" value={movieDetails.releaseYear} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-red-600" placeholder="2026" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Maturity Rating</label>
                        <select name="maturityRating" value={movieDetails.maturityRating} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-red-600">
                            <option value="G">G (General)</option>
                            <option value="PG">PG (Parental Guidance)</option>
                            <option value="PG_13">PG-13</option>
                            <option value="R">R (Restricted)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea name="description" value={movieDetails.description} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-red-600 h-24" placeholder="Plot summary..." required />
                </div>

                {/* File Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Vertical Poster (Thumbnail)</label>
                        <input type="file" name="poster" accept="image/*" onChange={handleFileChange} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer" required />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Horizontal Banner (Hero)</label>
                        <input type="file" name="banner" accept="image/*" onChange={handleFileChange} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Raw Video File (.mp4)</label>
                        <input type="file" name="video" accept="video/mp4,video/x-m4v,video/*" onChange={handleFileChange} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer" required />
                    </div>
                </div>

                <button type="submit" disabled={loading} className={`w-full py-4 rounded font-bold text-lg transition-all ${loading ? 'bg-red-800 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                    {loading ? 'Crunching Video Pipeline...' : 'Upload Movie to PulseStream'}
                </button>
            </form>
        </div>
    );
};

export default UploadMovie;
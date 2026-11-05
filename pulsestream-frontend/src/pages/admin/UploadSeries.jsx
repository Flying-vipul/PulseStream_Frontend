import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const UploadSeries = () => {
    const { token } = useSelector((state) => state.auth);

    //  State Machine: Tracks which step of the upload process we are in
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    //  Separate state for episode upload — FFmpeg takes MINUTES. We lock the
    // button hard so the admin cannot spam clicks and queue multiple transcodes.
    const [episodeUploading, setEpisodeUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    //  Data Storage IDs (Passed from backend after each step)
    const [seriesId, setSeriesId] = useState(null);
    const [seasonId, setSeasonId] = useState(null);

    // --- STEP 1 STATE: SERIES SHELL ---
    const [seriesDetails, setSeriesDetails] = useState({ title: '', description: '', genre: '', releaseYear: '', maturityRating: 'PG_13' });
    const [seriesFiles, setSeriesFiles] = useState({ poster: null, banner: null });

    // --- STEP 2 STATE: SEASON ---
    const [seasonDetails, setSeasonDetails] = useState({ seasonNumber: 1, title: 'Season 1' });

    // --- STEP 3 STATE: EPISODES ---
    const [episodeDetails, setEpisodeDetails] = useState({ episodeNumber: 1, title: '', durationMinutes: '' });
    const [episodeFile, setEpisodeFile] = useState(null);

    const authHeaders = {
        headers: { 'Authorization': `Bearer ${token}` }
    };

    // ==========================================
    //  STEP 1: CREATE SERIES SHELL
    // ==========================================
    const handleCreateSeries = async (e) => {
        e.preventDefault();
        if (!seriesFiles.poster || !seriesDetails.title) return toast.error("Title and Poster required!");

        setLoading(true);
        const formData = new FormData();
        formData.append("seriesDetails", new Blob([JSON.stringify(seriesDetails)], { type: "application/json" }));
        formData.append("poster", seriesFiles.poster);
        if (seriesFiles.banner) formData.append("banner", seriesFiles.banner);

        try {
            const res = await axios.post(`${import.meta.env.VITE_BACK_END_URL || 'http://localhost:8080'}/api/admin/content/series`, formData, authHeaders);
            setSeriesId(res.data.id);
            toast.success("Series created! Now add a Season.");
            setStep(2);
        } catch (error) {
            toast.error("Failed to create Series: " + (error.response?.data || error.message));
        } finally { setLoading(false); }
    };


    //  STEP 2: ADD SEASON

    const handleAddSeason = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACK_END_URL || 'http://localhost:8080'}/api/admin/content/series/${seriesId}/seasons`, null, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { seasonNumber: seasonDetails.seasonNumber, seasonTitle: seasonDetails.title }
            });
            setSeasonId(res.data.id);
            toast.success(`${seasonDetails.title} created! Now upload episodes.`);
            setStep(3);
        } catch (error) {
            toast.error("Failed to add Season: " + (error.response?.data || error.message));
        } finally { setLoading(false); }
    };


    //  STEP 3: UPLOAD EPISODE
    //  Button is HARD LOCKED during upload — FFmpeg can take several minutes

    const handleUploadEpisode = async (e) => {
        e.preventDefault();
        if (!episodeFile || !episodeDetails.title) return toast.error("Episode Title and Video File required!");

        //  Lock the button immediately — prevent any spam
        setEpisodeUploading(true);
        setUploadProgress('Uploading video to server...');

        const formData = new FormData();
        formData.append("episodeDetails", new Blob([JSON.stringify(episodeDetails)], { type: "application/json" }));
        formData.append("video", episodeFile);

        try {
            // Show progress stages so the admin knows it's working
            await new Promise(r => setTimeout(r, 800));
            setUploadProgress('Sending to FFmpeg transcoder...');

            await axios.post(
                `${import.meta.env.VITE_BACK_END_URL || 'http://localhost:8080'}/api/admin/content/seasons/${seasonId}/episodes`,
                formData,
                {
                    ...authHeaders,
                    // Track upload progress for the file transfer phase
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        if (percent < 100) {
                            setUploadProgress(`Uploading: ${percent}%`);
                        } else {
                            setUploadProgress('Processing HLS streams... (this may take 1-3 minutes)');
                        }
                    }
                }
            );

            toast.success(` Episode ${episodeDetails.episodeNumber} processed and ready!`);

            // Auto-increment episode number and clear form for the next one
            setEpisodeDetails({ episodeNumber: parseInt(episodeDetails.episodeNumber) + 1, title: '', durationMinutes: '' });
            setEpisodeFile(null);
            document.getElementById("episodeVideoInput").value = "";
            setUploadProgress('');
        } catch (error) {
            toast.error("Upload failed: " + (error.response?.data || error.message));
            setUploadProgress('');
        } finally {
            //  Unlock the button only after the entire FFmpeg pipeline completes
            setEpisodeUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 bg-[#141414] text-white rounded-lg shadow-xl mt-10 border border-gray-800">
            {/* Header & Progress Indicator */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-purple-500 mb-4">Web Series Pipeline</h2>
                <div className="flex items-center gap-4 text-sm font-bold">
                    <span className={step >= 1 ? "text-purple-500" : "text-gray-600"}>1. Series Info</span>
                    <span className="text-gray-600">→</span>
                    <span className={step >= 2 ? "text-purple-500" : "text-gray-600"}>2. Add Season</span>
                    <span className="text-gray-600">→</span>
                    <span className={step >= 3 ? "text-pulse-accent animate-pulse" : "text-gray-600"}>3. Upload Episodes</span>
                </div>
            </div>

            {/*  STEP 1 UI */}
            {step === 1 && (
                <form onSubmit={handleCreateSeries} className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-6">
                        <input type="text" placeholder="Series Title (e.g., Stranger Things)" onChange={(e) => setSeriesDetails({ ...seriesDetails, title: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-purple-500" required />
                        <input type="text" placeholder="Genre" onChange={(e) => setSeriesDetails({ ...seriesDetails, genre: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-purple-500" required />
                    </div>
                    <textarea placeholder="Series Plot summary..." onChange={(e) => setSeriesDetails({ ...seriesDetails, description: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-purple-500 h-24" required />

                    <div className="grid grid-cols-2 gap-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Vertical Poster</label>
                            <input type="file" accept="image/*" onChange={(e) => setSeriesFiles({ ...seriesFiles, poster: e.target.files[0] })} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-600 file:text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Horizontal Banner</label>
                            <input type="file" accept="image/*" onChange={(e) => setSeriesFiles({ ...seriesFiles, banner: e.target.files[0] })} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 rounded font-bold text-lg bg-purple-600 hover:bg-purple-700 transition-all">{loading ? 'Creating...' : 'Create Series Shell'}</button>
                </form>
            )}

            {/*  STEP 2 UI */}
            {step === 2 && (
                <form onSubmit={handleAddSeason} className="space-y-6 animate-fadeIn">
                    <h3 className="text-xl font-bold border-b border-gray-700 pb-2">Attach Season to "{seriesDetails.title}"</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Season Number</label>
                            <input type="number" value={seasonDetails.seasonNumber} onChange={(e) => setSeasonDetails({ ...seasonDetails, seasonNumber: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white" required min="1" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Season Title (Optional)</label>
                            <input type="text" value={seasonDetails.title} onChange={(e) => setSeasonDetails({ ...seasonDetails, title: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white" required />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 rounded font-bold text-lg bg-purple-600 hover:bg-purple-700 transition-all">{loading ? 'Adding...' : 'Add Season'}</button>
                </form>
            )}

            {/* STEP 3 UI */}
            {step === 3 && (
                <form onSubmit={handleUploadEpisode} className="space-y-6 animate-fadeIn">
                    <div className="bg-green-900/20 border border-green-700/50 p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-green-400">Ready for Episodes!</h3>
                        <p className="text-sm text-green-200 mt-1">Uploading to: {seriesDetails.title} - {seasonDetails.title}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-1">
                            <label className="block text-sm text-gray-400 mb-1">Ep. Number</label>
                            <input
                                type="number"
                                value={episodeDetails.episodeNumber}
                                onChange={(e) => setEpisodeDetails({ ...episodeDetails, episodeNumber: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white"
                                required min="1"
                                disabled={episodeUploading}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Episode Title</label>
                            <input
                                type="text"
                                value={episodeDetails.title}
                                onChange={(e) => setEpisodeDetails({ ...episodeDetails, title: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white"
                                required
                                disabled={episodeUploading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Raw Video File (.mp4)</label>
                        <input
                            id="episodeVideoInput"
                            type="file"
                            accept="video/*"
                            onChange={(e) => setEpisodeFile(e.target.files[0])}
                            className="w-full p-4 bg-gray-900 border border-gray-700 rounded text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white"
                            required
                            disabled={episodeUploading}
                        />
                    </div>

                    {/*  LOCKED UPLOAD BUTTON — Hard disabled during FFmpeg transcoding */}
                    <button
                        type="submit"
                        disabled={episodeUploading}
                        className={`w-full py-4 rounded font-bold text-lg transition-all flex items-center justify-center gap-3
                            ${episodeUploading
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-80 border border-gray-600'
                                : 'bg-pulse-accent hover:bg-red-700 text-white cursor-pointer'
                            }`}
                    >
                        {episodeUploading ? (
                            <>
                                {/* Animated spinner */}
                                <svg className="animate-spin h-5 w-5 text-gray-300" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>{uploadProgress || 'Processing...'}</span>
                            </>
                        ) : (
                            `Upload Episode ${episodeDetails.episodeNumber}`
                        )}
                    </button>

                    {/* Warning shown during upload */}
                    {episodeUploading && (
                        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 text-center">
                            <p className="text-yellow-400 text-sm font-bold">⚠️ FFmpeg is transcoding your video</p>
                            <p className="text-yellow-200 text-xs mt-1">
                                Do not close this tab or refresh. This typically takes 1–3 minutes depending on video length.
                            </p>
                        </div>
                    )}

                    {/* Reset Button to start over */}
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        disabled={episodeUploading}
                        className="w-full py-2 text-gray-500 hover:text-white transition-all text-sm mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Done with this series? Click here to start a new one.
                    </button>
                </form>
            )}
        </div>
    );
};

export default UploadSeries;


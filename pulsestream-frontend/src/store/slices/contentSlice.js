import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig'; // Your custom interceptor

// 1. FETCH ALL CONTENT
export const fetchAllMovies = createAsyncThunk(
    'content/fetchAllMovies',
    async ({ pageNumber = 0, pageSize = 50 } = {}, { rejectWithValue }) => {
        try {
            const response = await api.get('/content/public/all', {
                params: { pageNumber, pageSize }
            }); 
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch movies from server');
        }
    }
);

// 2. UPLOAD STANDALONE MOVIE
export const uploadMovie = createAsyncThunk(
    'content/uploadMovie',
    async ({ movieDetails, poster, banner, video }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('movieDetails', new Blob([JSON.stringify(movieDetails)], { type: 'application/json' }));
            
            if (poster) formData.append('poster', poster);
            if (banner) formData.append('banner', banner);
            if (video) formData.append('video', video);

            const response = await api.post('/admin/content/movie', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to upload movie');
        }
    }
);

// 3. WEB SERIES PIPELINE - STEP 1: CREATE SERIES SHELL
export const createSeries = createAsyncThunk(
    'content/createSeries',
    async ({ seriesDetails, poster, banner }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('seriesDetails', new Blob([JSON.stringify(seriesDetails)], { type: 'application/json' }));
            
            if (poster) formData.append('poster', poster);
            if (banner) formData.append('banner', banner);

            const response = await api.post('/admin/content/series', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to create series');
        }
    }
);

// 3. WEB SERIES PIPELINE - STEP 2: ADD SEASON
export const addSeason = createAsyncThunk(
    'content/addSeason',
    async ({ seriesId, seasonNumber, seasonTitle }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/admin/content/series/${seriesId}/seasons`, null, {
                params: { seasonNumber, seasonTitle } 
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to add season');
        }
    }
);

// 3. WEB SERIES PIPELINE - STEP 3: UPLOAD EPISODE
export const uploadEpisode = createAsyncThunk(
    'content/uploadEpisode',
    async ({ seasonId, episodeDetails, video }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('episodeDetails', new Blob([JSON.stringify(episodeDetails)], { type: 'application/json' }));
            formData.append('video', video);

            const response = await api.post(`/admin/content/seasons/${seasonId}/episodes`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to upload episode');
        }
    }
);

// 🚨 4. SYSTEM MONITORING - FETCH STORAGE STATS
export const fetchSystemStorage = createAsyncThunk(
    'content/fetchSystemStorage',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/admin/system/storage');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch storage stats');
        }
    }
);

// REDUX SLICE CONFIGURATION
const initialState = {
    movies: [],
    pageNumber: 0,
    totalPages: 0,
    
    // Status tracking
    status: 'idle',       
    uploadStatus: 'idle', 
    storageStatus: 'idle', // 🚨 NEW: Status for our hardware monitor
    
    // Data holding
    systemStorage: null,   // 🚨 NEW: Holds the hard drive stats
    
    // Errors
    error: null,
    uploadError: null,
    storageError: null
};

const contentSlice = createSlice({
    name: 'content',
    initialState,
    reducers: {
        resetUploadStatus: (state) => {
            state.uploadStatus = 'idle';
            state.uploadError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All Content
            .addCase(fetchAllMovies.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchAllMovies.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.movies = action.payload.content; 
                state.pageNumber = action.payload.pageNumber;
                state.totalPages = action.payload.totalPages;
                state.lastPage = action.payload.lastPage;
            })
            .addCase(fetchAllMovies.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            
            // Upload Episode
            .addCase(uploadEpisode.pending, (state) => {
                state.uploadStatus = 'loading';
                state.uploadError = null;
            })
            .addCase(uploadEpisode.fulfilled, (state) => {
                state.uploadStatus = 'succeeded';
            })
            .addCase(uploadEpisode.rejected, (state, action) => {
                state.uploadStatus = 'failed';
                state.uploadError = action.payload;
            })

            // 🚨 Fetch System Storage
            .addCase(fetchSystemStorage.pending, (state) => {
                state.storageStatus = 'loading';
                state.storageError = null;
            })
            .addCase(fetchSystemStorage.fulfilled, (state, action) => {
                state.storageStatus = 'succeeded';
                state.systemStorage = action.payload; // Saves the stats to Redux!
            })
            .addCase(fetchSystemStorage.rejected, (state, action) => {
                state.storageStatus = 'failed';
                state.storageError = action.payload;
            });
    }
});

export const { resetUploadStatus } = contentSlice.actions;
export default contentSlice.reducer;
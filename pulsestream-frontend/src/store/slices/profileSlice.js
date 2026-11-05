import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

const loadActiveProfile = () => {
    try {
        const stored = localStorage.getItem('pulse_active_profile');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

// Fetches all profiles for the logged-in user from the backend
export const fetchProfiles = createAsyncThunk(
    'profile/fetchProfiles',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/v1/profiles', {
                validateStatus: (s) => s < 500,
            });
            if (res.status === 200) {
                return res.data.profiles || res.data || [];
            }
            return [];
        } catch (err) {
            return rejectWithValue('Failed to fetch profiles');
        }
    }
);

const initialState = {
    activeProfile: loadActiveProfile(),
    profiles: [],
    status: 'idle',
};

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        setActiveProfile: (state, action) => {
            state.activeProfile = action.payload;
            if (action.payload) {
                localStorage.setItem('pulse_active_profile', JSON.stringify(action.payload));
            } else {
                localStorage.removeItem('pulse_active_profile');
            }
        },
        setProfiles: (state, action) => {
            state.profiles = action.payload;
        },
        clearProfileState: (state) => {
            state.activeProfile = null;
            state.profiles = [];
            state.status = 'idle';
            localStorage.removeItem('pulse_active_profile');
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProfiles.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProfiles.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.profiles = action.payload;
            })
            .addCase(fetchProfiles.rejected, (state) => {
                state.status = 'failed';
            });
    },
});

export const { setActiveProfile, setProfiles, clearProfileState } = profileSlice.actions;
export default profileSlice.reducer;

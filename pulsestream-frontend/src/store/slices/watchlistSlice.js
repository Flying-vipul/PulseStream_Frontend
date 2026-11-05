import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosConfig';

// ── 1. FETCH full watchlist for the logged-in user ───────────────────────────
export const fetchWatchlist = createAsyncThunk(
    'watchlist/fetch',
    async (_, { rejectWithValue }) => {
        try {
            // validateStatus: treat 401/404 as empty data, NOT as a session expiry.
            // Without this, a watchlist 401 (e.g. account not yet verified, or
            // backend secret rotated) would fire auth:session-expired → logout → login
            // → watchlist 401 again → infinite redirect loop.
            // Write operations (add/remove) still go through the default interceptor
            // and WILL fire session-expired if the token is truly dead.
            const res = await api.get('/content/v1/me/watchlist', {
                validateStatus: (status) => status < 500,
            });
            if (res.status === 200) return res.data;
            return []; // 401, 404 → treat as empty watchlist
        } catch (err) {
            // Only reaches here on network errors / 5xx
            return rejectWithValue(err.userMessage || 'Failed to fetch watchlist');
        }
    }
);

// ── 2. ADD a content item 
export const addToWatchlist = createAsyncThunk(
    'watchlist/add',
    async ({ contentId, contentItem }, { rejectWithValue }) => {
        try {
            await api.post(`/content/v1/me/watchlist/${contentId}`);
            return { contentId, contentItem };
        } catch (err) {
            return rejectWithValue(err.userMessage || 'Failed to add to watchlist');
        }
    }
);

// ── 3. REMOVE a content item 
export const removeFromWatchlist = createAsyncThunk(
    'watchlist/remove',
    async ({ contentId }, { rejectWithValue }) => {
        try {
            await api.delete(`/content/v1/me/watchlist/${contentId}`);
            return { contentId };
        } catch (err) {
            return rejectWithValue(err.userMessage || 'Failed to remove from watchlist');
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
const watchlistSlice = createSlice({
    name: 'watchlist',
    initialState: {
        items: [],          // Array of full ContentDTO objects
        itemIds: [],        // Plain array of content IDs (serializable!)
        status: 'idle',     // fetch status
        error: null,
        pendingIds: [],     // IDs currently being toggled (prevents double-click)
    },
    reducers: {
        // Call this on logout to wipe local watchlist
        clearWatchlist: (state) => {
            state.items    = [];
            state.itemIds  = [];
            state.status   = 'idle';
            state.error    = null;
            state.pendingIds = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // ── fetchWatchlist ──────────────────────────────────────────────
            .addCase(fetchWatchlist.pending, (state) => {
                state.status = 'loading';
                state.error  = null;
            })
            .addCase(fetchWatchlist.fulfilled, (state, action) => {
                state.status  = 'succeeded';
                state.items   = action.payload;
                state.itemIds = action.payload.map((i) => i.id);
            })
            .addCase(fetchWatchlist.rejected, (state, action) => {
                state.status = 'failed';
                state.error  = action.payload;
            })

            // ── addToWatchlist ──────────────────────────────────────────────
            .addCase(addToWatchlist.pending, (state, action) => {
                const id = action.meta.arg.contentId;
                if (!state.pendingIds.includes(id)) state.pendingIds.push(id);
            })
            .addCase(addToWatchlist.fulfilled, (state, action) => {
                const { contentId, contentItem } = action.payload;
                // Remove from pending
                state.pendingIds = state.pendingIds.filter((id) => id !== contentId);
                // Add if not already there
                if (!state.itemIds.includes(contentId)) {
                    state.itemIds.push(contentId);
                    if (contentItem) state.items.push(contentItem);
                }
            })
            .addCase(addToWatchlist.rejected, (state, action) => {
                const id = action.meta.arg.contentId;
                state.pendingIds = state.pendingIds.filter((i) => i !== id);
                state.error = action.payload;
            })

            // ── removeFromWatchlist ─────────────────────────────────────────
            .addCase(removeFromWatchlist.pending, (state, action) => {
                const id = action.meta.arg.contentId;
                if (!state.pendingIds.includes(id)) state.pendingIds.push(id);
            })
            .addCase(removeFromWatchlist.fulfilled, (state, action) => {
                const { contentId } = action.payload;
                state.pendingIds = state.pendingIds.filter((id) => id !== contentId);
                state.itemIds    = state.itemIds.filter((id) => id !== contentId);
                state.items      = state.items.filter((i) => i.id !== contentId);
            })
            .addCase(removeFromWatchlist.rejected, (state, action) => {
                const id = action.meta.arg.contentId;
                state.pendingIds = state.pendingIds.filter((i) => i !== id);
                state.error = action.payload;
            });
    },
});

export const { clearWatchlist } = watchlistSlice.actions;
export default watchlistSlice.reducer;


import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import contentReducer from './slices/contentSlice';
import watchlistReducer from './slices/watchlistSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        content: contentReducer,
        watchlist: watchlistReducer,
        profile: profileReducer,
    }
});

import { configureStore } from '@reduxjs/toolkit';
import { sideNavSlice } from './sidebarSlice';

export const store = configureStore({
    reducer: {
        sidebar: sideNavSlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

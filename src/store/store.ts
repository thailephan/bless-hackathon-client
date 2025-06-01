import { configureStore } from '@reduxjs/toolkit';
import wordDetailsReducer from './slices/wordDetailsSlice';

export const store = configureStore({
  reducer: {
    wordDetails: wordDetailsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

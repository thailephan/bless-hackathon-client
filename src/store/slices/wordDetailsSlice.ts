import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface WordDetails {
  definedWord: string;
  type: string;
  meaning: string;
  synonyms: string[];
  antonyms: string[];
  ipaPronunciation?: string;
}

interface WordDetailsState {
  cache: Record<string, WordDetails>;
}

const initialState: WordDetailsState = {
  cache: {},
};

const wordDetailsSlice = createSlice({
  name: 'wordDetails',
  initialState,
  reducers: {
    setWordDetails(
      state,
      action: PayloadAction<{ key: string; details: WordDetails }>
    ) {
      state.cache[action.payload.key] = action.payload.details;
    },
  },
});

export const { setWordDetails } = wordDetailsSlice.actions;
export default wordDetailsSlice.reducer;

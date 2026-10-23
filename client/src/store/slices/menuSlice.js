import { createSlice } from '@reduxjs/toolkit';

const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    items: [],
    selectedCategory: 'All',
    selectedDietary: 'All',
    searchQuery: '',
    isLoading: false,
    error: null
  },
  reducers: {
    setMenuItems: (state, action) => {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSelectedDietary: (state, action) => {
      state.selectedDietary = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setMenuLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setMenuError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  }
});

export const {
  setMenuItems,
  setSelectedCategory,
  setSelectedDietary,
  setSearchQuery,
  setMenuLoading,
  setMenuError
} = menuSlice.actions;

export default menuSlice.reducer;

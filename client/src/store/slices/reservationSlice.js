import { createSlice } from '@reduxjs/toolkit';

const reservationSlice = createSlice({
  name: 'reservations',
  initialState: {
    reservationsList: [],
    recentReservation: null,
    isLoading: false,
    error: null
  },
  reducers: {
    setReservationsList: (state, action) => {
      state.reservationsList = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setRecentReservation: (state, action) => {
      state.recentReservation = action.payload;
      state.isLoading = false;
    },
    updateReservationStatusLocal: (state, action) => {
      const { id, status, tableNumber } = action.payload;
      const res = state.reservationsList.find(r => r._id === id);
      if (res) {
        if (status) res.status = status;
        if (tableNumber) res.tableNumber = tableNumber;
      }
    },
    setReservationLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setReservationError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  }
});

export const {
  setReservationsList,
  setRecentReservation,
  updateReservationStatusLocal,
  setReservationLoading,
  setReservationError
} = reservationSlice.actions;

export default reservationSlice.reducer;

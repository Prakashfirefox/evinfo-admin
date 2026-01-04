import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  timerStatus: 0,
  trainingIdVal: ''
};

export const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    setTimerStatus: (state, action) => {
      state.timerStatus = action.payload;
    },
    setTrainingIdVal: (state, action) => {
      state.trainingIdVal = action.payload;
    }
  },
});

export const { setTimerStatus, setTrainingIdVal } = timerSlice.actions;

export default timerSlice.reducer;

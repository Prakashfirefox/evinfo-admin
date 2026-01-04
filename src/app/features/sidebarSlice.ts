import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  initialName: "",
};

export const sideNavSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    setInitialName: (state, action) => {
      state.initialName = action.payload;
    },
  },
});

export const { setInitialName } = sideNavSlice.actions;

export default sideNavSlice.reducer;
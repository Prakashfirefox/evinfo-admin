import { createSlice } from "@reduxjs/toolkit";

const initialProfileState = {
  userName: "",
};

export const profileSlice = createSlice({
  name: "profile",
  initialState: initialProfileState,
  reducers: {
    setUserName: (state, action) => {
      state.userName = action.payload;
    },
    clearUserName: (state) => {
      state.userName = "";
    },
  },
});

export const { setUserName, clearUserName } = profileSlice.actions;

export default profileSlice.reducer;

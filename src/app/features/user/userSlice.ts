import { createSlice } from "@reduxjs/toolkit";
import { getUser, getProfile } from "./userService";

const initialState = {
  loading: null,
  userData: {},
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.userData = action.payload;
    },
    clearUser: (state: any) => {
      state.userData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUser.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(getUser.fulfilled, (state: any, action) => {
        state.loading = false;
        state.userData = action.payload.data;
      })
      .addCase(getUser.rejected, (state: any, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getProfile.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state: any, action) => {
        state.loading = false;
        state.userData = action.payload.data;
      })
      .addCase(getProfile.rejected, (state: any, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearUser, setUser } = userSlice.actions;

export default userSlice.reducer;

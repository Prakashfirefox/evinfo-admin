import { createSlice } from "@reduxjs/toolkit";
import { authSignUp } from "./authService";

const initialState = {
  data: {},
  error: {},
  loginData: {},
  stationId:[],
  stationRecord: [],
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearData: (state: any) => {
      state.data = {};
      state.error = null;
    },
    setLoginData: (state, data) => {
      state.loginData = data.payload;
    },
    setUserStationList: (state, data) => {
      state.stationId = data.payload;
    },
    setUserStationRec:(state,data)=>{
      state.stationRecord = data.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(authSignUp.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(authSignUp.fulfilled, (state: any, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(authSignUp.rejected, (state: any, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearData, setLoginData,setUserStationList,setUserStationRec } = authSlice.actions;

export default authSlice.reducer;

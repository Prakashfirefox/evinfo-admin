import { createAsyncThunk } from "@reduxjs/toolkit";
import service from "../../../service/service";
import endpoint from "../../../service/constUrl";

export const authSignUp = createAsyncThunk(
  "AUTH/SIGNUP",
  async (initialState, { rejectWithValue }) => {
    try {
      const response = await service.postMultipart(
        `${endpoint.BASE_URL}/signUp`,
        initialState,
        ""
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
 
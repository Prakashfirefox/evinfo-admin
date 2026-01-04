import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import endpoint from "../../../service/constUrl";
import service from "../../../service/service";

export const getUser = createAsyncThunk(
  "USER/GET_USER",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${endpoint.BASE_URL}/login`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(error.response.data);
    }
  }
);

export const getProfile = createAsyncThunk(
  "USER/GET_PROFILE",
  async (initialState, { rejectWithValue }) => {
    try {
      const response = await service.get(`${endpoint.BASE_URL}/login`, {}, {});
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

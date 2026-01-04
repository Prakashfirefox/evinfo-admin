import { createAsyncThunk } from "@reduxjs/toolkit";
import service from "../../../service/service";
import endpoint from "../../../service/constUrl";

export const getAdmin = createAsyncThunk("ADMIN/USERS", async (_, { rejectWithValue }) => {
  try {
    const response = await service.get(`${endpoint.BASE_URL}/admin/users`,{},{});
    return response.data;
  } catch (error : any) {
    return rejectWithValue(error.response.data);
  }
});
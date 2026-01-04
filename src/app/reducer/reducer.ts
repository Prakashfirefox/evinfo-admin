import { combineReducers } from "@reduxjs/toolkit";
import authSlice from "../features/auth/authSlice";
import userSlice from "../features/user/userSlice";
import sidebarSlice from "../features/sidebarSlice";
import profileSlice from "../features/profile/profileSlice";
import timerSlice from "../features/timer/timerSlice";
import networkSlice from '../features/network/networkSlice';


export const rootReducer = combineReducers({
  sideMenu: sidebarSlice,
  auth: authSlice,
  user: userSlice,
  profile: profileSlice,
  timer: timerSlice,
  network: networkSlice
});

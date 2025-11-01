"use client"
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the type for userInfo (adjust this according to your actual user structure)
interface UserInfo {
  name: string;
  email: string;
  token: string;
  access: string;
  // Add other fields as necessary
}

interface AuthState {
  userInfo: UserInfo | null;
}

// Initial state definition
const initialState: AuthState = {
  userInfo: typeof window !== 'undefined' && localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo') as string)
    : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('userInfo', JSON.stringify(action.payload));

        // Setting expiration time for 30 days
        const expirationTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem('expirationTime', expirationTime.toString());
      }
    },
    logout: (state) => {
      state.userInfo = null;
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

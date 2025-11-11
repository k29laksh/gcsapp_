"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: "http://localhost:8000/api/v1/profiles",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.userInfo?.access;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    // get profile
    getUserDetails: builder.query({
      query: (username) => ({
        url: `/${username}`,
      }),
      keepUnusedDataFor: 5,
    }),
  }),
});

export const { useGetUserDetailsQuery } = profileApi;

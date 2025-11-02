"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store"; 

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ['Attendance'],

  endpoints: (builder) => ({
    // Get all attendance records
    getAttendance: builder.query({
      query: (params?: { date?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.date) {
          queryParams.append('date', params.date);
        }
        return `?${queryParams.toString()}`;
      },
      providesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),

    // Get single attendance record
    getSingleAttendance: builder.query({
      query: (id: string) => `/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Attendance', id }],
    }),

    // Create attendance record
    addAttendance: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),

    // Update attendance record
    updateAttendance: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Attendance', id: 'LIST' },
        { type: 'Attendance', id },
      ],
    }),

    // Delete attendance record
    deleteAttendance: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAttendanceQuery,
  useGetSingleAttendanceQuery,
  useAddAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
} = attendanceApi;
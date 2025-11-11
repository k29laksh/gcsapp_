"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const leaveApi = createApi({
  reducerPath: 'leaveApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:8000/leave',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ['Leave'],

  endpoints: (builder) => ({
    // Add leave mutation
    addLeave: builder.mutation({
      query: (data) => ({
        url: `/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Leave', id: 'LIST' }],
    }),

    // Fetch all leaves query
    getLeaves: builder.query({
      query: () => ({
        url: '',
      }),
      providesTags: [{ type: 'Leave', id: 'LIST' }],
      keepUnusedDataFor: 5,
    }),

    // Fetch single leave
    getSingleLeave: builder.query({
      query: (leaveId) => `/${leaveId}/`,
      providesTags: (result, error, leaveId) => [{ type: 'Leave', id: leaveId }],
      keepUnusedDataFor: 5,
    }),

    // Delete leave mutation
    deleteLeave: builder.mutation<void, string>({
      query: (leaveId) => ({
        url: `/${leaveId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Leave', id: 'LIST' }],
    }),

    // Update leave mutation
    updateLeave: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: [{ type: 'Leave', id: 'LIST' }],
    }),

    // Approve leave mutation
    approveLeave: builder.mutation({
      query: (leaveId) => ({
        url: `/${leaveId}/approve/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Leave', id: 'LIST' }],
    }),

    // Reject leave mutation
    rejectLeave: builder.mutation({
      query: (leaveId) => ({
        url: `/${leaveId}/reject/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Leave', id: 'LIST' }],
    }),
  }),
});

// Export hooks for each API call
export const {
  useAddLeaveMutation,
  useGetLeavesQuery,
  useDeleteLeaveMutation,
  useUpdateLeaveMutation,
  useGetSingleLeaveQuery,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
} = leaveApi;
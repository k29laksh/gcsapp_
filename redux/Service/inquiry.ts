"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const inquiryApi = createApi({
  reducerPath: 'inquiryApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:8000/inquiry',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ['Inquiry'],

  endpoints: (builder) => ({
    // Get all inquiries
    getInquiries: builder.query({
      query: () => '/',
      providesTags: ['Inquiry'],
    }),

    // Get single inquiry
    getSingleInquiry: builder.query({
      query: (inquiryId) => `/${inquiryId}/`,
      providesTags: (result, error, inquiryId) => [{ type: 'Inquiry', id: inquiryId }],
    }),

    // Add inquiry
    addInquiry: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Inquiry'],
    }),

    // Update inquiry
    updateInquiry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Inquiry'],
    }),

    // Delete inquiry
    deleteInquiry: builder.mutation({
      query: (inquiryId) => ({
        url: `/${inquiryId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Inquiry'],
    }),
  }),
});

// Export hooks for each API call
export const {
  useGetInquiriesQuery,
  useGetSingleInquiryQuery,
  useAddInquiryMutation,
  useUpdateInquiryMutation,
  useDeleteInquiryMutation,
} = inquiryApi;
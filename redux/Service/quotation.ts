"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const quotationApi = createApi({
  reducerPath: 'quotationApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl:  `${process.env.NEXT_PUBLIC_BACKEND_URL}/quotation`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ['Quotation'],

  endpoints: (builder) => ({
    // Get all quotations
    getQuotations: builder.query({
      query: () => '/',
      providesTags: ['Quotation'],
    }),

    // Get single quotation
    getSingleQuotation: builder.query({
      query: (quotationId) => `/${quotationId}/`,
      providesTags: (result, error, quotationId) => [{ type: 'Quotation', id: quotationId }],
    }),

    // Add quotation
    addQuotation: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Update quotation
    updateQuotation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Delete quotation
    deleteQuotation: builder.mutation({
      query: (quotationId) => ({
        url: `/${quotationId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Approve quotation
    approveQuotation: builder.mutation({
      query: (quotationId) => ({
        url: `/${quotationId}/approve/`,
        method: 'POST',
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Reject quotation
    rejectQuotation: builder.mutation({
      query: (quotationId) => ({
        url: `/${quotationId}/reject/`,
        method: 'POST',
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Send quotation
    sendQuotation: builder.mutation({
      query: (quotationId) => ({
        url: `/${quotationId}/send/`,
        method: 'POST',
      }),
      invalidatesTags: ['Quotation'],
    }),

    // Convert quotation to invoice
    convertToInvoice: builder.mutation({
      query: (quotationId) => ({
        url: `/${quotationId}/convert-to-invoice/`,
        method: 'POST',
      }),
      invalidatesTags: ['Quotation'],
    }),
  }),
});

// Export hooks for each API call
export const {
  useGetQuotationsQuery,
  useGetSingleQuotationQuery,
  useAddQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useApproveQuotationMutation,
  useRejectQuotationMutation,
  useSendQuotationMutation,
  useConvertToInvoiceMutation,
} = quotationApi;
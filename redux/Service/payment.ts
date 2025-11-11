"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const paymentApi = createApi({
  reducerPath: 'paymentApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/payments`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      } 
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ['Payment'],

  endpoints: (builder) => ({
    // Get all payments
    getPayments: builder.query({
      query: () => '/',
      providesTags: ['Payment'],
    }),

    // Get single payment
    getSinglePayment: builder.query({
      query: (id: string) => `/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Payment', id }],
    }),

    // Get payment stats
    getPaymentStats: builder.query({
      query: () => '/stats/',
    }),

    // Create payment
    addPayment: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment'],
    }),

    // Update payment
    updatePayment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Payment', id },
        'Payment'
      ],
    }),

    // Delete payment
    deletePayment: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Payment'],
    }),

    // Download payment receipt
    downloadPaymentReceipt: builder.query({
      query: (id: string) => ({
        url: `/${id}/receipt/`,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetSinglePaymentQuery,
  useGetPaymentStatsQuery,
  useAddPaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
  useLazyDownloadPaymentReceiptQuery,
} = paymentApi;

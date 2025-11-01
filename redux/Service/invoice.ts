"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const invoiceApi = createApi({
  reducerPath: 'invoiceApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://127.0.0.1:8000/invoices',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      } 
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ['Invoice'],

  endpoints: (builder) => ({
    // Get all invoices
    getInvoices: builder.query({
      query: () => '/',
      providesTags: ['Invoice'],
    }),

    // Get single invoice
    getSingleInvoice: builder.query({
      query: (id: string) => `/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),

    // Get invoice stats
    getInvoiceStats: builder.query({
      query: () => '/stats/',
    }),

    // Generate invoice number
    generateInvoiceNumber: builder.query({
      query: () => '/generate-number/',
    }),

    // Create invoice
    addInvoice: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Update invoice
    updateInvoice: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Invoice', id },
        'Invoice'
      ],
    }),
       getPdf: builder.query<Blob, string>({
  query: (id) => ({
    url: `/invoices/${id}/generate-pdf/`,
    method: "GET",
    // important: tell fetch to expect a binary file
    responseHandler: async (response) => await response.blob(),
  }),
}),

    // Delete invoice
    deleteInvoice: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Send invoice
    sendInvoice: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/send/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Invoice', id },
        'Invoice'
      ],
    }),

    // Download PDF
    downloadInvoicePdf: builder.query({
      query: (id: string) => ({
        url: `/${id}/pdf/`,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetSingleInvoiceQuery,
  useGetInvoiceStatsQuery,
  useGenerateInvoiceNumberQuery,
  useAddInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useGetInvoicePdfQuery,
  useSendInvoiceMutation,
  useLazyDownloadInvoicePdfQuery,
} = invoiceApi;
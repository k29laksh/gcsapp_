"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const creditNoteApi = createApi({
  reducerPath: 'creditNoteApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://127.0.0.1:8000/creditnotes',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      } 
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ['CreditNote'],

  endpoints: (builder) => ({
    // Get all credit notes
    getCreditNotes: builder.query({
      query: () => '/',
      providesTags: ['CreditNote'],
    }),

    // Get single credit note
    getSingleCreditNote: builder.query({
      query: (id: string) => `/${id}/`,
      providesTags: (result, error, id) => [{ type: 'CreditNote', id }],
    }),

    // Get credit note stats
    getCreditNoteStats: builder.query({
      query: () => '/stats/',
    }),

    // Generate credit note number
    generateCreditNoteNumber: builder.query({
      query: () => '/generate-number/',
    }),

    // Create credit note
    addCreditNote: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CreditNote'],
    }),

    // Update credit note
    updateCreditNote: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CreditNote', id },
        'CreditNote'
      ],
    }),

    // Delete credit note
    deleteCreditNote: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CreditNote'],
    }),

    // Send credit note
    sendCreditNote: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/send/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'CreditNote', id },
        'CreditNote'
      ],
    }),

    // Download PDF
    downloadCreditNotePdf: builder.query({
      query: (id: string) => ({
        url: `/${id}/pdf/`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Apply credit note to invoice
    applyCreditNote: builder.mutation({
      query: ({ id, invoiceId }) => ({
        url: `/${id}/apply/`,
        method: 'POST',
        body: { invoice_id: invoiceId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CreditNote', id },
        'CreditNote'
      ],
    }),
  }),
});

export const {
  useGetCreditNotesQuery,
  useGetSingleCreditNoteQuery,
  useGetCreditNoteStatsQuery,
  useGenerateCreditNoteNumberQuery,
  useAddCreditNoteMutation,
  useUpdateCreditNoteMutation,
  useDeleteCreditNoteMutation,
  useSendCreditNoteMutation,
  useLazyDownloadCreditNotePdfQuery,
  useApplyCreditNoteMutation,
} = creditNoteApi;
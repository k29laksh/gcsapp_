"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const deliveryChallanApi = createApi({
  reducerPath: 'deliveryChallanApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/deliverychallan`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      } 
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ['DeliveryChallan'],

  endpoints: (builder) => ({
    // Get all delivery challans
    getDeliveryChallans: builder.query({
      query: () => '/',
      providesTags: ['DeliveryChallan'],
    }),

    // Get single delivery challan
    getSingleDeliveryChallan: builder.query({
      query: (id: string) => `/${id}/`,
      providesTags: (result, error, id) => [{ type: 'DeliveryChallan', id }],
    }),

    // Get delivery challan stats
    getDeliveryChallanStats: builder.query({
      query: () => '/stats/',
    }),

    // Generate delivery challan number
    generateDeliveryChallanNumber: builder.query({
      query: () => '/generate-number/',
    }),

    // Create delivery challan
    addDeliveryChallan: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['DeliveryChallan'],
    }),

    // Update delivery challan (details only, excludes items)
    updateDeliveryChallan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'DeliveryChallan', id },
        'DeliveryChallan'
      ],
    }),

    // Update delivery challan items only
    updateDeliveryChallanItems: builder.mutation({
      query: ({ itemId, ...itemData }) => ({
        url: `/items/${itemId}/`,
        method: 'PUT',
        body: itemData,
      }),
      invalidatesTags: ['DeliveryChallan'],
    }),

    // Delete delivery challan
    deleteDeliveryChallan: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DeliveryChallan'],
    }),

    // Send delivery challan
    sendDeliveryChallan: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/send/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'DeliveryChallan', id },
        'DeliveryChallan'
      ],
    }),

    // Download PDF
    downloadDeliveryChallanPdf: builder.query({
      query: (id: string) => ({
        url: `/${id}/pdf/`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Convert to invoice
    convertToInvoice: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/convert-to-invoice/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'DeliveryChallan', id },
        'DeliveryChallan'
      ],
    }),
  }),
});

export const {
  useGetDeliveryChallansQuery,
  useGetSingleDeliveryChallanQuery,
  useGetDeliveryChallanStatsQuery,
  useGenerateDeliveryChallanNumberQuery,
  useAddDeliveryChallanMutation,
  useUpdateDeliveryChallanMutation,
  useUpdateDeliveryChallanItemsMutation,
  useDeleteDeliveryChallanMutation,
  useSendDeliveryChallanMutation,
  useLazyDownloadDeliveryChallanPdfQuery,
  useConvertToInvoiceMutation,
} = deliveryChallanApi;

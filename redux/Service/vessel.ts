"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const vesselApi = createApi({
  reducerPath: 'vesselApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/vessels`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ['Vessel'],

  endpoints: (builder) => ({
    // Get all vessels
    getVessels: builder.query({
      query: () => '/',
      providesTags: [{ type: 'Vessel', id: 'LIST' }],
    }),

    // Get single vessel
    getSingleVessel: builder.query({
      query: (id: string) => `/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Vessel', id }],
    }),

    // Create vessel
    addVessel: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Vessel', id: 'LIST' }],
    }),

    // Update vessel
    updateVessel: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Vessel', id: 'LIST' },
        { type: 'Vessel', id },
      ],
    }),

    // Delete vessel
    deleteVessel: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Vessel', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetVesselsQuery,
  useGetSingleVesselQuery,
  useAddVesselMutation,
  useUpdateVesselMutation,
  useDeleteVesselMutation,
} = vesselApi;
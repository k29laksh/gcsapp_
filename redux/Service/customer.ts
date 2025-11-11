"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store"; 

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/customer`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ['Customer'],

  endpoints: (builder) => ({
    // Get all customers
    getCustomers: builder.query({
      query: () => '/',
      providesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // Get customer stats
    getCustomerStats: builder.query({
      query: () => '/stats/',
    }),

    // Get single customer
   getSingleCustomer: builder.query({
  query: (id: string) => `/${id}/`,
  providesTags: (result, error, id) => [{ type: 'Customer', id }],
}),

    // Create customer
    addCustomer: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // Update customer
    updateCustomer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customer', id: 'LIST' },
        { type: 'Customer', id },
      ],
    }),
  editAddress: builder.mutation({
  query: ({ id, ...data }) => ({
    url: `/address/${id}/`,
    method: 'PUT',
    body: data,
  }),
  // 👇 This ensures the specific customer's data gets refreshed
  invalidatesTags: (result, error, { customer }) => [
    { type: 'Customer', id: customer },
    { type: 'Customer', id: 'LIST' },
  ],
}),

    editContact: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/contact/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Customer', id: 'LIST' },
        { type: 'Customer', id },
      ],
    }),

    // Delete customer
    deleteCustomer: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerStatsQuery,
  useGetSingleCustomerQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useEditAddressMutation,
  useEditContactMutation,
} = customerApi;
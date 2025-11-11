"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store"; 

export const payrollApi = createApi({
  reducerPath: 'payrollApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:8000/payroll',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ['Payroll'],

  endpoints: (builder) => ({
    // Get all payroll records
    getPayroll: builder.query({
      query: (params?: { month?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.month) {
          queryParams.append('month', params.month);
        }
        return `?${queryParams.toString()}`;
      },
      providesTags: [{ type: 'Payroll', id: 'LIST' }],
    }),

    // Get single payroll record
    getSinglePayroll: builder.query({
      query: (id: string) => `/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Payroll', id }],
    }),
   getPdf: builder.query<Blob, string>({
  query: (id) => ({
    url: `/payroll/${id}/generate-pdf/`,
    method: "GET",
    // important: tell fetch to expect a binary file
    responseHandler: async (response) => await response.blob(),
  }),
}),


    // Create payroll record
    addPayroll: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Payroll', id: 'LIST' }],
    }),

    // Update payroll record
    updatePayroll: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Payroll', id: 'LIST' },
        { type: 'Payroll', id },
      ],
    }),

    // Delete payroll record
    deletePayroll: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Payroll', id: 'LIST' }],
    }),

    // Download payslip
    downloadPayslip: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/payslip/`,
        method: 'GET',
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        },
      }),
    }),

    // Generate payroll for all employees
    generatePayroll: builder.mutation({
      query: (data: { month: string }) => ({
        url: '/generate/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Payroll', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPayrollQuery,
  useGetPdfQuery,
  useGetSinglePayrollQuery,
  useAddPayrollMutation,
  useUpdatePayrollMutation,
  useDeletePayrollMutation,
  useDownloadPayslipMutation,
  useGeneratePayrollMutation,
} = payrollApi;
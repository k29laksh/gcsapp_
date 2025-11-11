"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";


export const employeeApi = createApi({
  reducerPath: 'Employee',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:8000/employee',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.userInfo?.access;
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
      },
   }),

  tagTypes: ['Employee'],

  endpoints: (builder) => ({
    // Login mutation
    addEmployee: builder.mutation({
      query: (data) => ({
        url: `/`,
        method: 'POST',
        body: data,
      }),
    }),

    // Fetch all employees query
  
    getEmployee: builder.query({
      query: () => ({
        url: '',
      }),
      providesTags: [{ type: 'Employee', id: 'LIST' }], // Provide tags with 'id'
      keepUnusedDataFor: 5,
    }),

    getSingleEmployee: builder.query({
      query: (userId) => `/${userId}/`,
      providesTags: (result, error, userId) => [{ type: 'Employee', id: userId }], // Provide tag for the specific employee
      keepUnusedDataFor: 5,
    }),


    // Delete an employee mutation
    deleteEmployee: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/${userId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }], // Invalidate the 'Employee' list
    }),

    // Update employee mutation
    updateEmployee: builder.mutation({
      query: (data) => ({
        url: `/${data.userId}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }], // Invalidate the 'Employee' list to refetch employees
    }),
  }),
});

// Export hooks for each API call
export const {
  useAddEmployeeMutation,
  useGetEmployeeQuery,
  useDeleteEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetSingleEmployeeQuery,
} = employeeApi;

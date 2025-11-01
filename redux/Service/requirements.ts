"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const requirementsApi = createApi({
  reducerPath: 'Requirements',
  baseQuery: fetchBaseQuery({ 
    baseUrl:  `${process.env.BACKEND_URL}/requirements`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ['Requirements'],

  endpoints: (builder) => ({
    // Add requirement mutation
    addRequirement: builder.mutation({
      query: (data) => ({
        url: `/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Requirements', id: 'LIST' }],
    }),

    // Fetch all requirements query
    getRequirements: builder.query({
      query: () => ({
        url: '',
      }),
      providesTags: [{ type: 'Requirements', id: 'LIST' }],
      keepUnusedDataFor: 5,
    }),

    // Fetch single requirement query
    getSingleRequirement: builder.query({
      query: (requirementId) => `/${requirementId}/`,
      providesTags: (result, error, requirementId) => [{ type: 'Requirements', id: requirementId }],
      keepUnusedDataFor: 5,
    }),

    // Delete requirement mutation
    deleteRequirement: builder.mutation<void, string>({
      query: (requirementId) => ({
        url: `/${requirementId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Requirements', id: 'LIST' }],
    }),

    // Update requirement mutation
    updateRequirement: builder.mutation({
      query: (data) => ({
        url: `/${data.requirementId}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { requirementId }) => [
        { type: 'Requirements', id: 'LIST' },
        { type: 'Requirements', id: requirementId }
      ],
    }),

    // Partial update requirement mutation (PATCH)
    patchRequirement: builder.mutation({
      query: (data) => ({
        url: `/${data.requirementId}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { requirementId }) => [
        { type: 'Requirements', id: 'LIST' },
        { type: 'Requirements', id: requirementId }
      ],
    }),

    // Get requirements by project
    getRequirementsByProject: builder.query({
      query: (projectId) => `/?project=${projectId}`,
      providesTags: (result, error, projectId) => [
        { type: 'Requirements', id: 'LIST' },
        { type: 'Requirements', id: `PROJECT-${projectId}` }
      ],
      keepUnusedDataFor: 5,
    }),

    // Get requirements by task
    getRequirementsByTask: builder.query({
      query: (taskId) => `/?task=${taskId}`,
      providesTags: (result, error, taskId) => [
        { type: 'Requirements', id: 'LIST' },
        { type: 'Requirements', id: `TASK-${taskId}` }
      ],
      keepUnusedDataFor: 5,
    }),
  }),
});

// Export hooks for each API call
export const {
  useAddRequirementMutation,
  useGetRequirementsQuery,
  useGetSingleRequirementQuery,
  useDeleteRequirementMutation,
  useUpdateRequirementMutation,
  usePatchRequirementMutation,
  useGetRequirementsByProjectQuery,
  useGetRequirementsByTaskQuery,
} = requirementsApi;
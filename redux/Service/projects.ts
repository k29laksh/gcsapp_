"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/projects`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  tagTypes: ['Project'],

  endpoints: (builder) => ({
    // Get all projects
    getProjects: builder.query({
      query: () => '/',
      providesTags: [{ type: 'Project', id: 'LIST' }],
    }),

    // Get single project
    getSingleProject: builder.query({
      query: (id: string) => `/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),

    // Create project
    addProject: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),

    // Update project
    updateProject: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Project', id: 'LIST' },
        { type: 'Project', id },
      ],
    }),

    // Delete project
    deleteProject: builder.mutation({
      query: (id: string) => ({
        url: `/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetSingleProjectQuery,
  useAddProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;
"use client"

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const taskApi = createApi({
  reducerPath: 'Task',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:8000/tasks',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.userInfo?.access;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ['Task'],

  endpoints: (builder) => ({
    // Add task mutation
    addTask: builder.mutation({
      query: (data) => ({
        url: `/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    // Fetch all tasks query
    getTasks: builder.query({
      query: () => ({
        url: '',
      }),
      providesTags: [{ type: 'Task', id: 'LIST' }],
      keepUnusedDataFor: 5,
    }),

    // Fetch single task query
    getSingleTask: builder.query({
      query: (taskId) => `/${taskId}/`,
      providesTags: (result, error, taskId) => [{ type: 'Task', id: taskId }],
      keepUnusedDataFor: 5,
    }),

    // Delete task mutation
    deleteTask: builder.mutation<void, string>({
      query: (taskId) => ({
        url: `/${taskId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),

    // Update task mutation
    updateTask: builder.mutation({
      query: (data) => ({
        url: `/${data.taskId}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: taskId }
      ],
    }),

    // Optional: Partial update task mutation (PATCH)
    patchTask: builder.mutation({
      query: (data) => ({
        url: `/${data.taskId}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: taskId }
      ],
    }),
  }),
});

// Export hooks for each API call
export const {
  useAddTaskMutation,
  useGetTasksQuery,
  useGetSingleTaskQuery,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
  usePatchTaskMutation,
} = taskApi;
"use client";

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { authApi } from './Service/auth';
import authReducer from './features/authFeature';
import { profileApi } from './Service/profile';
import { employeeApi } from './Service/employee';
import { leaveApi } from './Service/leave';
import { payrollApi } from './Service/payroll';
import { attendanceApi } from './Service/attendance';
import { customerApi } from './Service/customer';
import { vesselApi } from './Service/vessel';
import { projectApi } from './Service/projects';
import { invoiceApi } from './Service/invoice';
import { inquiryApi } from './Service/inquiry';
import { quotationApi } from './Service/quotation';
import { creditNoteApi } from './Service/credit-notes';
import { taskApi } from './Service/tasks';
import { requirementsApi } from './Service/requirements';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [leaveApi.reducerPath]: leaveApi.reducer,
    [payrollApi.reducerPath]: payrollApi.reducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [vesselApi.reducerPath]: vesselApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [invoiceApi.reducerPath]: invoiceApi.reducer,
    [quotationApi.reducerPath]: quotationApi.reducer,
    [inquiryApi.reducerPath]: inquiryApi.reducer,
    [creditNoteApi.reducerPath]: creditNoteApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [requirementsApi.reducerPath]: requirementsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      employeeApi.middleware,
      leaveApi.middleware,
      payrollApi.middleware,
      attendanceApi.middleware,
      profileApi.middleware,
      quotationApi.middleware,
      vesselApi.middleware,
      customerApi.middleware,
      inquiryApi.middleware,
      projectApi.middleware,
      taskApi.middleware,
      invoiceApi.middleware,
      creditNoteApi.middleware,
      requirementsApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);
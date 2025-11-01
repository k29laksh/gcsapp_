// components/client-layout.tsx
"use client"

import ProtectedRoute from './protected-route';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
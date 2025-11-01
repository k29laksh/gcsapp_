// components/protected-route.tsx
"use client"

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_ROUTES = ['/login'];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Check if user is authenticated
    const userinfo = window.localStorage.getItem('userInfo');
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    
    if (!userinfo && !isPublicRoute) {
      router.push('/login');
    } else if (userinfo && pathname === '/login') {
      router.push('/');
    }
  }, [pathname, router]);
  
  return <>{children}</>;
}
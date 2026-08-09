'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type ProtectedRouteProps = {
  children: ReactNode;
  type?: string;
  roles?: string[];
};

export function ProtectedRoute({ children, type, roles }: ProtectedRouteProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const roleKey = roles?.join('|');

  useEffect(() => {
    let active = true;

    const validate = async () => {
      try {
        const response = await api.get('/company/validate');
        const userRole = response.data?.data?.user?.role;

        if (roleKey && userRole && !roleKey.split('|').includes(userRole)) {
          throw new Error('Invalid dashboard role');
        }

        if (active) setAuthorized(true);
      } catch {
        router.replace('/company-admin/login');
      }
    };

    void validate();
    return () => {
      active = false;
    };
  }, [roleKey, router, type]);

  if (!authorized) {
    return <main className="min-h-screen bg-slate-950 grid place-items-center text-slate-400">Checking access...</main>;
  }

  return children;
}
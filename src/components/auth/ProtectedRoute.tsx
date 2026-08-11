'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyValidation, type CompanyValidationResponse } from '@/lib/useCompanySettings';

type ProtectedRouteProps = {
  children: ReactNode;
  type?: string;
  roles?: string[];
};

export function ProtectedRoute({ children, type, roles }: ProtectedRouteProps) {
  const router = useRouter();
  const validationQuery = useCompanyValidation();
  const userData = validationQuery.data as CompanyValidationResponse | undefined;
  const roleKey = roles?.join('|');
  const userRole = userData?.user?.role;

  useEffect(() => {
    if (validationQuery.isError) {
      router.replace('/company-admin/login');
      return;
    }

    if (validationQuery.isSuccess && roleKey && userRole && !roleKey.split('|').includes(userRole)) {
      router.replace('/company-admin/login');
    }
  }, [validationQuery.isError, validationQuery.isSuccess, roleKey, router, userRole]);

  if (validationQuery.isLoading) {
    return <main className="min-h-screen bg-slate-950 grid place-items-center text-slate-400">Checking access...</main>;
  }

  return children;
}
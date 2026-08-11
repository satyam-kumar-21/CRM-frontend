'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getRoutePermissionKey } from '@/lib/useCompanySettings';

type EmployeeRouteGuardProps = {
  permissionKey: string;
  routePermissions?: Record<string, boolean>;
  permissionsLoading?: boolean;
  children: ReactNode;
};

export default function EmployeeRouteGuard({ permissionKey, routePermissions, permissionsLoading, children }: EmployeeRouteGuardProps) {
  const router = useRouter();
  const permissionKeyResolved = getRoutePermissionKey(permissionKey);
  const isAllowed = permissionKeyResolved === 'overview' || permissionKeyResolved === 'profile' || routePermissions?.[permissionKeyResolved] !== false;

  if (permissionsLoading) {
    return <div className="h-56 grid place-items-center text-slate-400">Checking access...</div>;
  }

  if (!isAllowed) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-rose-500/20 bg-slate-900/80 p-8 text-slate-100 shadow-2xl shadow-rose-500/5">
          <div className="flex items-center gap-3 text-3xl">🔒<span className="text-xl font-semibold">Access Restricted</span></div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            This section is currently restricted by your administrator. Please contact your administrator if you need access.
          </p>
          <button onClick={() => router.replace('/employee/dashboard')} className="mt-6 inline-flex items-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

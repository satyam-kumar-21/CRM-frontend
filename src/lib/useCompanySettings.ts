'use client';

import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';

export const routePermissionKeyMap: Record<string, string> = {
  'failed-sales': 'sales',
  'upgrade': 'sales',
  'profile': 'overview',
};

export function getRoutePermissionKey(route: string) {
  return routePermissionKeyMap[route] ?? route;
}

export interface CompanySettingsResponse {
  settings?: {
    routePermissions?: Record<string, boolean>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface CompanyValidationResponse {
  user?: {
    role?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export function useCompanySettings(enabled = true) {
  return useQuery<CompanySettingsResponse>({
    queryKey: ['companySettings'],
    queryFn: companyService.getSettings,
    enabled,
    staleTime: 1000 * 60 * 10,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useCompanyValidation() {
  return useQuery<CompanyValidationResponse>({
    queryKey: ['companyValidate'],
    queryFn: async () => {
      const result = await companyService.validateSession();
      if (result?.user?.theme) {
        const { applyTheme } = await import('@/lib/theme');
        applyTheme(result.user.theme);
      }
      return result;
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

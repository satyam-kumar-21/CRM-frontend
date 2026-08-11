'use client';

import { useEffect, useState } from 'react';
import { companyService } from '@/services/companyService';

export function useRoutePermissions() {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await companyService.getSettings();
        const data = res.data || res;
        const s = data.settings || {};
        if (!active) return;
        setPermissions(s.routePermissions || {});
      } catch {
        // ignore
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  return { loading, permissions };
}

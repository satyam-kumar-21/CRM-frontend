'use client';

import React, { useState, type Dispatch, type SetStateAction } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut, Settings, ShieldCheck, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getRoutePermissionKey } from '@/lib/useCompanySettings';
import type { NavSection } from '../types';

export interface CompanyAdminNavItem {
  id: NavSection;
  label: string;
  icon: LucideIcon;
  badge?: string;
  count?: number;
}

type CompanyAdminSidebarProps = {
  companyName?: string;
  userName?: string;
  userRole?: string;
  canOpenSettings?: boolean;
  routePermissions?: Record<string, boolean>;
  navigationMenu: CompanyAdminNavItem[];
  activeSection: NavSection;
  setActiveSection: Dispatch<SetStateAction<NavSection>>;
};

export function CompanyAdminSidebar({
  companyName,
  userName = 'Company Admin',
  userRole = 'Workspace owner',
  canOpenSettings = true,
  routePermissions,
  navigationMenu,
  activeSection,
  setActiveSection,
}: CompanyAdminSidebarProps) {
  const router = useRouter();
  const [showRestricted, setShowRestricted] = useState<{ open: boolean; message?: string }>({ open: false });

  const handleLogout = async () => {
    try {
      await api.post('/company/logout');
    } finally {
      window.localStorage.removeItem('companyAccessToken');
      router.replace('/company-admin/login');
    }
  };

  return (
    <>
    <aside className="flex min-h-0 flex-col border-r border-slate-800/80 bg-slate-900/90 px-4 py-5 backdrop-blur-md">
      <div className="mb-6 shrink-0">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-950/80 p-3.5 border border-slate-800/60 shadow-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="overflow-hidden"><p className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">Company Portal</p><h2 className="truncate text-sm font-bold text-white">{companyName || 'Techno Sky Solutions'}</h2></div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navigationMenu.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          const permissionKey = getRoutePermissionKey(item.id as string);
          const disabled = !canOpenSettings && routePermissions && routePermissions[permissionKey] === false;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (disabled) { setShowRestricted({ open: true, message: 'Admin has restricted access to this section. Please contact Admin to request access.' }); return; }
                setActiveSection(item.id);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all ${
                active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : disabled ? 'text-slate-600 bg-slate-900/40 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{item.label}{disabled && <Lock className="h-3.5 w-3.5 text-rose-400" />}</span>
              {item.badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400'}`}>{item.badge}</span>}
              {item.count !== undefined && <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${active ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-300'}`}>{item.count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-3 rounded-xl bg-slate-950/60 border border-slate-800/60 p-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shrink-0">SK</div>
            <div className="truncate"><p className="text-xs font-bold text-slate-200 truncate">{userName}</p><p className="text-[10px] text-slate-400 truncate">{userRole}</p></div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {canOpenSettings && <button aria-label="Open company settings" onClick={() => setActiveSection('settings')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-slate-300"><Settings className="h-4 w-4" /></button>}
            <button type="button" aria-label="Sign out" title="Sign out" onClick={() => void handleLogout()} className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
    <AccessRestrictedModal open={showRestricted.open} message={showRestricted.message} onClose={() => setShowRestricted({ open: false })} />
    </>
  );
}

function AccessRestrictedModal({ open, message, onClose }: { open: boolean; message?: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
      <div className="bg-slate-900 rounded-xl p-6 max-w-md">
        <h3 className="text-lg font-bold text-white">Access Restricted</h3>
        <p className="mt-3 text-sm text-slate-300">{message}</p>
        <div className="mt-4 text-right"><button onClick={onClose} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">OK</button></div>
      </div>
    </div>
  );
}

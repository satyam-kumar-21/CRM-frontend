'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut, Settings, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
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
  navigationMenu: CompanyAdminNavItem[];
  activeSection: NavSection;
  setActiveSection: Dispatch<SetStateAction<NavSection>>;
};

export function CompanyAdminSidebar({
  companyName,
  userName = 'Company Admin',
  userRole = 'Workspace owner',
  canOpenSettings = true,
  navigationMenu,
  activeSection,
  setActiveSection,
}: CompanyAdminSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post('/company/logout');
    } finally {
      window.localStorage.removeItem('companyAccessToken');
      router.replace('/company-admin/login');
    }
  };

  return (
    <aside className="flex flex-col border-r border-slate-800/80 bg-slate-900/90 px-4 py-5 backdrop-blur-md">
      <div className="mb-6">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-950/80 p-3.5 border border-slate-800/60 shadow-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="overflow-hidden"><p className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">Company Portal</p><h2 className="truncate text-sm font-bold text-white">{companyName || 'Techno Sky Solutions'}</h2></div>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {navigationMenu.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all ${
                active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{item.label}</span>
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
  );
}

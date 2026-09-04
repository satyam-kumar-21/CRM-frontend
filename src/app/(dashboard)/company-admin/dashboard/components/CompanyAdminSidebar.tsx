'use client';

import React, { useState, type Dispatch, type SetStateAction } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut, Settings, ShieldCheck, Lock, Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
  isDesktopCollapsed?: boolean;
  onDesktopCollapsedChange?: (collapsed: boolean) => void;
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
  isDesktopCollapsed: controlledCollapsed,
  onDesktopCollapsedChange,
}: CompanyAdminSidebarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isDesktopCollapsed = controlledCollapsed ?? internalCollapsed;
  const toggleDesktopCollapsed = () => {
    const next = !isDesktopCollapsed;
    setInternalCollapsed(next);
    onDesktopCollapsedChange?.(next);
  };
  const [showRestricted, setShowRestricted] = useState<{ open: boolean; message?: string }>({ open: false });

  const activeNavItem = navigationMenu.find((item) => item.id === activeSection);
  const ActiveIcon = activeNavItem?.icon || ShieldCheck;

  const handleLogout = async () => {
    try {
      await api.post('/company/logout');
    } finally {
      window.localStorage.removeItem('companyAccessToken');
      window.localStorage.removeItem('crm-user-theme');
      window.sessionStorage.clear();
      queryClient.clear();
      window.location.replace('/company-admin/login');
    }
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 backdrop-blur-md lg:hidden shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setIsMobileOpen((cur) => !cur)}
            className="rounded-xl border border-slate-700/80 bg-slate-950/80 p-2 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <ActiveIcon className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-white tracking-wide">{activeNavItem?.label || 'Menu'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[120px]">{companyName || 'Techno Sky'}</span>
          <button
            type="button"
            aria-label="Toggle menu drawer"
            onClick={() => setIsMobileOpen((cur) => !cur)}
            className="rounded-lg bg-indigo-600/20 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all"
          >
            {isMobileOpen ? 'Hide' : 'Show Sidebar'}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Drawer / Desktop Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex min-h-0 flex-col border-r border-slate-800/80 bg-slate-900/95 py-5 backdrop-blur-md transition-all duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0 ${
          isDesktopCollapsed ? 'lg:w-[76px] lg:px-2.5' : 'lg:w-[280px] lg:px-4'
        } w-[280px] px-4 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl shadow-indigo-950/50' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="mb-5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-3 rounded-2xl bg-slate-950/80 p-3 border border-slate-800/60 shadow-md flex-1 overflow-hidden ${isDesktopCollapsed ? 'lg:justify-center lg:p-2.5' : ''}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className={`overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? 'lg:hidden' : 'block'}`}>
                <p className="text-[9px] font-semibold tracking-wider text-indigo-400 uppercase">Company Portal</p>
                <h2 className="truncate text-xs font-bold text-white">{companyName || 'Techno Sky Solutions'}</h2>
              </div>
            </div>

            {/* Desktop Collapse Toggle Button */}
            <button
              type="button"
              aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={toggleDesktopCollapsed}
              className="hidden lg:flex items-center justify-center h-9 w-9 rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all shadow shrink-0"
            >
              {isDesktopCollapsed ? <PanelLeftOpen className="h-4 w-4 text-indigo-400" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              aria-label="Close menu drawer"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-xl border border-slate-700/80 bg-slate-950/80 p-2.5 text-slate-400 hover:bg-rose-600 hover:text-white transition-all lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navigationMenu.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            const permissionKey = getRoutePermissionKey(item.id as string);
            const disabled = !canOpenSettings && routePermissions && routePermissions[permissionKey] === false;
            return (
              <button
                key={item.id}
                type="button"
                title={isDesktopCollapsed ? `${item.label}${disabled ? ' (Restricted)' : ''}` : undefined}
                onClick={() => {
                  if (disabled) {
                    setShowRestricted({ open: true, message: 'Admin has restricted access to this section. Please contact Admin to request access.' });
                    return;
                  }
                  setActiveSection(item.id);
                  setIsMobileOpen(false);
                }}
                className={`group relative flex w-full items-center justify-between rounded-xl py-2.5 text-left text-sm font-medium transition-all ${
                  isDesktopCollapsed ? 'lg:justify-center lg:px-0 px-3.5' : 'px-3.5'
                } ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : disabled
                    ? 'text-slate-600 bg-slate-900/40 cursor-not-allowed'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={`transition-all duration-300 ${isDesktopCollapsed ? 'lg:hidden' : 'inline'}`}>
                    {item.label}
                  </span>
                  {disabled && <Lock className={`h-3.5 w-3.5 text-rose-400 ${isDesktopCollapsed ? 'lg:hidden' : 'inline'}`} />}
                </span>

                {/* Badges / Counts for Expanded Mode */}
                <div className={`flex items-center gap-1.5 ${isDesktopCollapsed ? 'lg:hidden' : 'flex'}`}>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${active ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {item.count}
                    </span>
                  )}
                </div>

                {/* Compact Indicator Dot for Collapsed Mode on Desktop */}
                {isDesktopCollapsed && (item.badge || item.count !== undefined) && (
                  <span className="hidden lg:block absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-400 ring-2 ring-slate-900" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer User Profile */}
        <div className="mt-auto pt-3 border-t border-slate-800/80 shrink-0">
          <div className={`flex items-center gap-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 p-2.5 ${isDesktopCollapsed ? 'lg:justify-center lg:p-2' : ''}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <div className={`truncate transition-all duration-300 ${isDesktopCollapsed ? 'lg:hidden' : 'block'}`}>
                <p className="text-xs font-bold text-slate-200 truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate">{userRole}</p>
              </div>
            </div>
            <div className={`ml-auto items-center gap-1 ${isDesktopCollapsed ? 'lg:hidden flex' : 'flex'}`}>
              {canOpenSettings && (
                <button
                  type="button"
                  aria-label="Open company settings"
                  onClick={() => {
                    setActiveSection('settings');
                    setIsMobileOpen(false);
                  }}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="Sign out"
                title="Sign out"
                onClick={() => void handleLogout()}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
              >
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl p-6 max-w-md border border-slate-800 shadow-2xl">
        <h3 className="text-lg font-bold text-white">Access Restricted</h3>
        <p className="mt-3 text-sm text-slate-300">{message}</p>
        <div className="mt-4 text-right">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors font-semibold text-xs">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

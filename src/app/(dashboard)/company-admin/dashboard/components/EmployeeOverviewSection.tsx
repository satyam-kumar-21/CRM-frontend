'use client';

import { Dispatch, SetStateAction } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  MessageSquare,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  ShieldCheck,
  Layers,
  LifeBuoy,
} from 'lucide-react';
import type { ICompanyDashboard } from '@/services/companyService';
import type { NavSection } from '../types';

export function EmployeeOverviewSection({
  employee,
  stats,
  remoteSupportSummary,
  projectSummary,
  setActiveSection,
}: {
  employee: ICompanyDashboard['employee'];
  stats: {
    totalEmployees?: number;
    activeGroups?: number;
    recentMessages?: number;
    myLeads: number;
    mySales: number;
    myRevenue: number;
    myFailedSales: number;
    myConnectedLeads: number;
    myPendingLeads: number;
    remoteSupportTickets?: number;
    activeProjects?: number;
    completedProjects?: number;
    pendingProjects?: number;
  };
  remoteSupportSummary?: ICompanyDashboard['remoteSupportSummary'];
  projectSummary?: ICompanyDashboard['projectSummary'];
  setActiveSection: Dispatch<SetStateAction<NavSection>>;
}) {
  const isTechSupport = employee.role === 'TECH_SUPPORT';

  // For TECH_SUPPORT: target = remoteTarget, achieved = successful remotes
  const remoteTarget = employee.remoteTarget || 0;
  const remoteSuccessful = remoteSupportSummary?.successful ?? 0;
  const remoteFailed = remoteSupportSummary?.failed ?? 0;
  const remotePending = remoteSupportSummary?.pending ?? 0;
  const remoteTotal = remoteSupportSummary?.total ?? 0;
  const remoteProgress = remoteTarget ? Math.min(100, Math.round((remoteSuccessful / remoteTarget) * 100)) : 0;

  // For Sales / general roles
  const salesTarget = employee.monthlySalesTarget || 0;
  const salesAchieved = employee.monthlySalesAchieved || 0;
  const salesProgress = salesTarget ? Math.min(100, Math.round((salesAchieved / salesTarget) * 100)) : 0;

  const target = isTechSupport ? remoteTarget : (salesTarget || employee.remoteTarget || 0);
  const progress = isTechSupport ? remoteProgress : salesProgress;

  // Calculate stroke offset for the circular progress (radius 28)
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <section className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100 lg:p-8">
      
      {/* HEADER */}
      <header className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 p-8 shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        
        <div className="relative z-10">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Personal workspace
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Welcome back, {employee.name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Your targets, activity, and workday information in one place.
          </p>
          
          <button
            onClick={() => setActiveSection('chat')}
            className="group mt-6 flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-400 hover:shadow-indigo-500/40"
          >
            Open workspace chat
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </header>

      {/* METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {employee.role === 'SALES' ? (
          <>
            <Metric icon={TrendingUp} label="Revenue" value={`$${Number(stats.myRevenue ?? 0).toLocaleString()}`} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
            <Metric icon={Target} label="Target" value={`$${target.toLocaleString()}`} />
            <Metric icon={Users} label="Leads" value={stats.myLeads ?? 0} />
            <Metric icon={UserPlus} label="Sales" value={stats.mySales ?? 0} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
          </>
        ) : employee.role === 'TECH_SUPPORT' ? (
          <>
            <Metric icon={LifeBuoy} label="Total Remotes" value={remoteTotal} />
            <Metric icon={ShieldCheck} label="Successful" value={remoteSuccessful} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
            <Metric icon={Target} label="Failed" value={remoteFailed} iconColor="text-rose-400" iconBg="bg-rose-500/10" />
            <Metric icon={TrendingUp} label="Success Rate" value={`${remoteSupportSummary?.successRate ?? 0}%`} iconColor="text-cyan-400" iconBg="bg-cyan-500/10" />
          </>
        ) : employee.role === 'IT' ? (
          <>
            <Metric icon={Layers} label="Active projects" value={projectSummary?.active ?? 0} />
            <Metric icon={TrendingUp} label="Completed" value={projectSummary?.completed ?? 0} />
            <Metric icon={CalendarCheck} label="Pending" value={projectSummary?.pending ?? 0} />
            <Metric icon={Users} label="Teams" value={stats.totalEmployees ?? 0} />
          </>
        ) : employee.role === 'MANAGER' || employee.role === 'TEAM_LEAD' ? (
          <>
            <Metric icon={Users} label="Team members" value={stats.totalEmployees ?? 0} />
            <Metric icon={TrendingUp} label="Team sales" value={`$${Number(stats.myRevenue ?? 0).toLocaleString()}`} />
            <Metric icon={Layers} label="Active projects" value={projectSummary?.active ?? 0} />
            <Metric icon={UserPlus} label="Leads" value={stats.myLeads ?? 0} />
          </>
        ) : (
          <>
            <Metric icon={TrendingUp} label="Revenue" value={`$${Number(stats.myRevenue ?? 0).toLocaleString()}`} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
            <Metric icon={Users} label="Groups" value={stats.activeGroups ?? 0} />
            <Metric icon={CalendarCheck} label="Attendance" value={stats.totalEmployees ?? 0} />
            <Metric icon={MessageSquare} label="Messages" value={stats.recentMessages ?? 0} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        
        {/* PROGRESS SECTION */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {isTechSupport ? 'Remote target progress' : 'Monthly progress'}
                </p>
                <p className="mt-2 text-4xl font-bold text-white">{progress}%</p>
                {isTechSupport && (
                  <p className="mt-1 text-sm text-slate-400">
                    <span className="font-semibold text-emerald-400">{remoteSuccessful}</span> of <span className="font-semibold text-white">{remoteTarget}</span> target remotes completed
                  </p>
                )}
              </div>
              
              {/* Dynamic SVG Circular Progress */}
              <div className="relative h-16 w-16">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-800" />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="currentColor" strokeWidth="6" fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${isTechSupport ? 'text-cyan-500' : 'text-indigo-500'}`}
                  />
                </svg>
              </div>
            </div>

            {isTechSupport ? (
              /* Tech Support: show remote breakdown bars */
              <div className="mt-6 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="text-emerald-400 font-semibold">✓ Successful</span>
                    <span className="font-semibold text-white">{remoteSuccessful}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: remoteTotal ? `${Math.round((remoteSuccessful/remoteTotal)*100)}%` : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="text-rose-400 font-semibold">✗ Failed</span>
                    <span className="font-semibold text-white">{remoteFailed}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-rose-500 transition-all duration-1000" style={{ width: remoteTotal ? `${Math.round((remoteFailed/remoteTotal)*100)}%` : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="text-amber-400 font-semibold">⏳ Pending / In Progress</span>
                    <span className="font-semibold text-white">{remotePending}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500 transition-all duration-1000" style={{ width: remoteTotal ? `${Math.round((remotePending/remoteTotal)*100)}%` : '0%' }} />
                  </div>
                </div>
                <div className="mt-2 border-t border-slate-800 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Target</span>
                    <span className="font-semibold text-white">{remoteTarget} remotes</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Sales / general: show $ progress bar */
              <div className="mt-8">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>$0</span>
                  <span>${target.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 border-t border-slate-800 pt-4">
            <p className="text-sm font-medium text-slate-300">
              {employee.role}
              <span className="mx-2 text-slate-600">•</span>
              <span className="text-slate-400">{employee.email || 'No email recorded'}</span>
            </p>
          </div>
        </section>

        {/* QUICK ACTIONS SECTION */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick actions
          </p>
          <div className="mt-5 grid gap-3">
            <QuickAction label="Workspace chat" icon={MessageSquare} onClick={() => setActiveSection('chat')} />
            {employee.role === 'SALES' && <QuickAction label="My leads" icon={UserPlus} onClick={() => setActiveSection('leads')} />}
            {(employee.role === 'SALES' || employee.role === 'TECH_SUPPORT') && <QuickAction label="Remote support" icon={LifeBuoy} onClick={() => setActiveSection('remote-support')} />}
            {(employee.role === 'IT' || employee.role === 'MANAGER' || employee.role === 'TEAM_LEAD') && <QuickAction label="Projects" icon={Layers} onClick={() => setActiveSection('projects')} />}
            <QuickAction label="Announcements" icon={CalendarCheck} onClick={() => setActiveSection('announcements')} />
          </div>
        </section>
        
      </div>

      {(employee.role === 'TECH_SUPPORT' || employee.role === 'SALES') && remoteSupportSummary ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <Metric icon={LifeBuoy} label="Support requests" value={remoteSupportSummary.total} />
          <Metric icon={ShieldCheck} label="Success rate" value={`${remoteSupportSummary.successRate}%`} />
          <Metric icon={Target} label="Pending tickets" value={remoteSupportSummary.pending} />
        </section>
      ) : null}

      {(employee.role === 'IT' || employee.role === 'MANAGER' || employee.role === 'TEAM_LEAD') && projectSummary ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <Metric icon={Layers} label="Active projects" value={projectSummary.active} />
          <Metric icon={TrendingUp} label="Completed projects" value={projectSummary.completed} />
          <Metric icon={CalendarCheck} label="Pending projects" value={projectSummary.pending} />
        </section>
      ) : null}
    </section>
  );
}

// --- HELPER COMPONENTS ---

function Metric({
  icon: Icon,
  label,
  value,
  iconColor = "text-indigo-400",
  iconBg = "bg-indigo-500/10"
}: {
  icon: any;
  label: string;
  value: string | number;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition-colors hover:border-slate-700 hover:bg-slate-800/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`rounded-xl ${iconBg} p-2.5 transition-colors`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: any;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-left text-sm font-medium text-slate-300 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-white"
    >
      <div className="rounded-lg bg-slate-800 p-2 transition-colors group-hover:bg-indigo-500/20">
        <Icon className="h-4 w-4 text-indigo-400" />
      </div>
      {label}
      <ArrowRight className="ml-auto h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
    </button>
  );
}
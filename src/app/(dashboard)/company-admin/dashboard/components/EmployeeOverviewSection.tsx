'use client';

import { Dispatch, SetStateAction } from 'react';
import { 
  ArrowRight, 
  CalendarCheck, 
  MessageSquare, 
  Target, 
  TrendingUp, 
  UserPlus, 
  Users 
} from 'lucide-react';
import type { ICompanyDashboard } from '@/services/companyService';
import type { NavSection } from '../types';

export function EmployeeOverviewSection({
  employee,
  setActiveSection,
}: {
  employee: ICompanyDashboard['employee'];
  setActiveSection: Dispatch<SetStateAction<NavSection>>;
}) {
  const target = employee.monthlySalesTarget || employee.remoteTarget || 0;
  const achieved = employee.monthlySalesAchieved || 0;
  const progress = target ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  
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
        <Metric 
          icon={TrendingUp} 
          label="Achieved" 
          value={`$${achieved.toLocaleString()}`} 
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <Metric 
          icon={Target} 
          label="Target" 
          value={`$${target.toLocaleString()}`} 
        />
        <Metric 
          icon={Users} 
          label="Leads assigned" 
          value={employee.leadsAssigned || 0} 
        />
        <Metric 
          icon={UserPlus} 
          label="Converted" 
          value={employee.leadsConverted || 0} 
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        
        {/* PROGRESS SECTION */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Monthly progress
                </p>
                <p className="mt-2 text-4xl font-bold text-white">{progress}%</p>
              </div>
              
              {/* Dynamic SVG Circular Progress */}
              <div className="relative h-16 w-16">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-slate-800"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-indigo-500 transition-all duration-1000 ease-out"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>$0</span>
                <span>${target.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
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
            <QuickAction 
              label="My attendance" 
              icon={CalendarCheck} 
              onClick={() => setActiveSection('attendance')} 
            />
            <QuickAction 
              label="My leads" 
              icon={UserPlus} 
              onClick={() => setActiveSection('leads')} 
            />
            <QuickAction 
              label="Announcements" 
              icon={MessageSquare} 
              onClick={() => setActiveSection('announcements')} 
            />
          </div>
        </section>
        
      </div>
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
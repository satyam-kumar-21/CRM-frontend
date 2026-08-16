'use client';

import { Dispatch, SetStateAction, ElementType } from 'react';
import { MessageSquare, UserPlus, Users, DollarSign, TrendingUp, CalendarCheck, CheckCircle2, Flag } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { IEmployee, NavSection } from '../types';

export function CompanyOverviewSection({
  employees,
  companyName,
  attendanceSummary,
  stats,
  setActiveSection,
  onAddEmployee,
}: {
  employees: IEmployee[];
  companyName?: string;
  attendanceSummary?: { present?: number; absent?: number; holiday?: number; totalEmployees?: number };
  stats: {
    totalLeads: number;
    totalSales: number;
    totalRevenue: number;
    failedSales: number;
    connectedLeads: number;
    pendingLeads: number;
    totalEmployees: number;
    activeGroups: number;
    topSalesEmployees?: Array<{ name: string; totalAmount: number; saleCount: number }>;
    topTechSupportEmployees?: Array<{ name: string; remoteCount: number }>;
  };
  setActiveSection: Dispatch<SetStateAction<NavSection>>;
  onAddEmployee: () => void;
}) {
  const salesEmployees = employees.filter((employee) => employee.role === 'SALES');
  const chartData = [...salesEmployees]
    .sort((left, right) => right.salesTarget.monthlyAchieved - left.salesTarget.monthlyAchieved)
    .map((employee) => ({
      name: employee.name.split(' ')[0],
      achieved: employee.salesTarget.monthlyAchieved,
      target: employee.salesTarget.monthlyTarget,
    }));

  const topSalesItems = stats.topSalesEmployees?.length
    ? stats.topSalesEmployees
    : chartData.slice(0, 3).map((item) => ({
        name: item.name,
        totalAmount: item.achieved,
        saleCount: 0,
      }));

  return (
    <section className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100 lg:p-8">
      {/* HEADER */}
      <header className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 p-8 shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Company workspace
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              {companyName || 'Techno Sky Solutions'} Overview
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Live performance and workforce data from your company.
            </p>
          </div>

          <div className="flex shrink-0 gap-3">
            <button
              onClick={onAddEmployee}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              <UserPlus className="h-4 w-4 text-slate-400" />
              Add Employee
            </button>
            <button
              onClick={() => setActiveSection('chat')}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-400 hover:shadow-indigo-500/40"
            >
              <MessageSquare className="h-4 w-4" />
              Workspace Chat
            </button>
          </div>
        </div>
      </header>

      {/* METRICS */}
      <div className="grid gap-4 md:grid-cols-2">
        <Metric label="Employees" value={stats.totalEmployees ?? 0} icon={Users} />
        <Metric label="Current month sales" value={`$${Number(stats.totalRevenue ?? 0).toLocaleString()}`} icon={DollarSign} />
      </div>

      {attendanceSummary && (
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <Metric label="Present today" value={attendanceSummary.present ?? 0} icon={CalendarCheck} />
          <Metric label="Absent today" value={attendanceSummary.absent ?? 0} icon={Users} />
          <Metric label="Holidays today" value={attendanceSummary.holiday ?? 0} icon={CalendarCheck} />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3 mt-4">
        <Metric label="Total leads" value={stats.totalLeads} icon={UserPlus} />
        <Metric label="Connected leads" value={stats.connectedLeads} icon={CheckCircle2} />
        <Metric label="Failed sales" value={stats.failedSales} icon={Flag} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        
        {/* CHART SECTION */}
        <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sales performance
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">Total sales by employee</h2>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 py-1.5 text-sm font-medium text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span>Sales</span>
            </div>
          </div>
          
          <div className="mt-8 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                  ticks={[5000, 10000, 15000, 20000, 25000]}
                  domain={[0, 25000]}
                />
                <Tooltip
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  itemStyle={{ fontSize: '13px' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Bar dataKey="achieved" fill="#818cf8" radius={[4, 4, 0, 0]} name="Achieved" />
                <Bar dataKey="target" fill="#334155" radius={[4, 4, 0, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1">
            {salesEmployees.slice(0, 10).map((employee) => (
              <div key={employee.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-white">{employee.name}</p>
                  <p className="text-xs text-slate-400">Current month sales</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400">${Number(employee.salesTarget.monthlyAchieved || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* TOP PERFORMERS SECTION */}
        <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Top performance
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">Current month leaders</h2>
            </div>
            <div className="rounded-lg bg-indigo-500/10 p-2">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Top sales employees</p>
                  <h3 className="text-sm font-semibold text-white">Top 3 this month</h3>
                </div>
              </div>
              <div className="space-y-3">
                {topSalesItems.slice(0, 3).map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-slate-800 hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        {item.saleCount !== undefined && <p className="text-xs text-slate-400">{item.saleCount} sales</p>}
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-400">${Number(item.totalAmount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tech support</p>
                  <h3 className="text-sm font-semibold text-white">Top 2 this month</h3>
                </div>
              </div>
              <div className="space-y-3">
                {(stats.topTechSupportEmployees || []).slice(0, 2).map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-slate-800 hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.remoteCount} remotes</p>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-400">{item.remoteCount}</span>
                  </div>
                ))}

                {(!stats.topTechSupportEmployees || stats.topTechSupportEmployees.length === 0) && (
                  <div className="flex h-full items-center justify-center rounded-xl border border-slate-800 p-6 text-sm text-slate-500">
                    No remote support leaders yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: ElementType;
}) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition-colors hover:border-slate-700 hover:bg-slate-800/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        {Icon && (
          <div className="rounded-lg bg-indigo-500/10 p-2.5 transition-colors group-hover:bg-indigo-500/20">
            <Icon className="h-5 w-5 text-indigo-400" />
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { Dispatch, SetStateAction } from 'react';
import { MessageSquare, UserPlus, Users, Target, DollarSign, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { IEmployee, NavSection } from '../types';

export function CompanyOverviewSection({
  employees,
  companyName,
  setActiveSection,
  onAddEmployee,
}: {
  employees: IEmployee[];
  companyName?: string;
  setActiveSection: Dispatch<SetStateAction<NavSection>>;
  onAddEmployee: () => void;
}) {
  const totalTarget = employees.reduce((sum, employee) => sum + employee.salesTarget.monthlyTarget, 0);
  const achieved = employees.reduce((sum, employee) => sum + employee.salesTarget.monthlyAchieved, 0);
  const percent = totalTarget ? Math.round((achieved / totalTarget) * 100) : 0;

  const chartData = [...employees]
    .sort((left, right) => right.salesTarget.monthlyAchieved - left.salesTarget.monthlyAchieved)
    .map((employee) => ({
      name: employee.name.split(' ')[0],
      achieved: employee.salesTarget.monthlyAchieved,
      target: employee.salesTarget.monthlyTarget,
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
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Employees" value={employees.length} icon={Users} />
        <Metric label="Total sales achieved" value={`$${achieved.toLocaleString()}`} icon={DollarSign} />
        <Metric label="Target completion" value={`${percent}%`} icon={Target} />
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
        </section>

        {/* TOP PERFORMERS SECTION */}
        <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Top performance
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">Leading employees</h2>
            </div>
            <div className="rounded-lg bg-indigo-500/10 p-2">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          
          <div className="mt-6 flex flex-col gap-2">
            {chartData.slice(0, 5).map((item, index) => (
              <div
                key={item.name}
                className="group flex items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-slate-800 hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-400">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-white group-hover:text-indigo-100 transition-colors">
                    {item.name}
                  </span>
                </div>
                <span className="font-semibold text-emerald-400">
                  ${item.achieved.toLocaleString()}
                </span>
              </div>
            ))}
            
            {chartData.length === 0 && (
              <div className="flex h-full items-center justify-center py-10 text-sm text-slate-500">
                No performance data available.
              </div>
            )}
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
  icon?: any;
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
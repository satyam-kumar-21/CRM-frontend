'use client';

import { TrendingUp, UserPlus, Target, LifeBuoy, Flag } from 'lucide-react';
import type { ICompanyDashboard } from '@/services/companyService';

type Props = { report?: ICompanyDashboard['stats']['todayReport'] };

export default function ManagerOverviewSection({ report }: Props) {
  const todayReport = report;
  if (!todayReport) {
    return (
      <section className="min-h-full overflow-y-auto bg-slate-950 p-6 text-slate-100 lg:p-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-400">Loading today&apos;s business performance...</div>
      </section>
    );
  }

  const leadsByEmployee = new Map<string, number>();
  const salesByEmployee = new Map<string, { count: number; amount: number }>();
  const failedByEmployee = new Map<string, number>();

  (todayReport.lists?.leads || []).forEach((lead: any) => {
    const owner = lead.connectedBy?.trim() || 'Unassigned';
    leadsByEmployee.set(owner, (leadsByEmployee.get(owner) || 0) + 1);
  });

  (todayReport.lists?.sales || []).forEach((sale: any) => {
    const owner = sale.connectedBy?.trim() || 'Unassigned';
    const previous = salesByEmployee.get(owner) || { count: 0, amount: 0 };
    salesByEmployee.set(owner, { count: previous.count + 1, amount: previous.amount + Number(sale.amount || 0) });
  });

  (todayReport.lists?.failed || []).forEach((sale: any) => {
    const owner = sale.connectedBy?.trim() || 'Unassigned';
    failedByEmployee.set(owner, (failedByEmployee.get(owner) || 0) + 1);
  });

  const salesEmployeeNames = Array.from(new Set([...leadsByEmployee.keys(), ...salesByEmployee.keys(), ...failedByEmployee.keys()])).sort();

  const techSupportByEmployee = new Map<string, { total: number; successful: number; failed: number }>();
  (todayReport.lists?.remote || []).forEach((remote: any) => {
    const owner = remote.techSupportEmployeeName?.trim() || 'Unassigned';
    const existing = techSupportByEmployee.get(owner) || { total: 0, successful: 0, failed: 0 };
    const status = remote.status?.toUpperCase?.() || '';
    techSupportByEmployee.set(owner, {
      total: existing.total + 1,
      successful: existing.successful + (status === 'SUCCESSFUL' ? 1 : 0),
      failed: existing.failed + (status === 'FAILED' ? 1 : 0),
    });
  });

  const techSupportEmployeeNames = Array.from(techSupportByEmployee.keys()).sort();

  const businessDateLabel = todayReport.businessDate?.start ? new Date(todayReport.businessDate.start).toLocaleString() : 'Today';

  return (
    <section className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100 lg:p-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">Manager dashboard</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Today&apos;s business performance</h1>
        <p className="mt-2 text-sm text-slate-400">Business day: <span className="font-semibold text-slate-200">{businessDateLabel}</span></p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Total Leads" value={todayReport.leads} icon={UserPlus} />
        <Metric label="Total Sales" value={todayReport.salesCount} icon={TrendingUp} />
        <Metric label="Sales Amount" value={`₹${Number(todayReport.salesAmount || 0).toLocaleString()}`} icon={Target} />
        <Metric label="Failed Sales" value={todayReport.failedSales} icon={Flag} />
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">Sales team today</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Sales performance by employee</h2>
          </div>
          <div className="rounded-2xl bg-slate-950 px-4 py-2 text-xs text-slate-300">Business day summary</div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[11px]"><tr><th className="p-3">Employee</th><th className="p-3">Today's Leads</th><th className="p-3">Today's Sales</th><th className="p-3">Today's Failed Sales</th></tr></thead>
            <tbody className="divide-y divide-slate-800/60">
              {salesEmployeeNames.length ? salesEmployeeNames.map((name) => (
                <tr key={name} className="hover:bg-slate-950/50">
                  <td className="p-3 font-semibold text-white">{name}</td>
                  <td className="p-3">{leadsByEmployee.get(name) || 0}</td>
                  <td className="p-3">{salesByEmployee.get(name)?.count || 0}</td>
                  <td className="p-3">{failedByEmployee.get(name) || 0}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">No sales team activity found for today.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">Tech support team today</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Remote support performance</h2>
          </div>
          <div className="rounded-2xl bg-slate-950 px-4 py-2 text-xs text-slate-300">Totals include failed remote</div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[11px]"><tr><th className="p-3">Employee</th><th className="p-3">Today's Total Remote</th><th className="p-3">Today's Successful Remote</th><th className="p-3">Today's Failed Remote</th></tr></thead>
            <tbody className="divide-y divide-slate-800/60">
              {techSupportEmployeeNames.length ? techSupportEmployeeNames.map((name) => {
                const row = techSupportByEmployee.get(name)!;
                return (
                  <tr key={name} className="hover:bg-slate-950/50">
                    <td className="p-3 font-semibold text-white">{name}</td>
                    <td className="p-3">{row.total}</td>
                    <td className="p-3">{row.successful}</td>
                    <td className="p-3">{row.failed}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">No remote support activity found for today.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/80 p-3 text-slate-200"><Icon className="h-5 w-5 text-indigo-400" /></div>
      </div>
    </div>
  );
}

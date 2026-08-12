'use client';

import { useMemo } from 'react';
import type { ICompanyDashboard } from '@/services/companyService';
import { DollarSign, Flag, LifeBuoy, UserPlus, TrendingUp } from 'lucide-react';

type Props = {
  report?: ICompanyDashboard['stats']['todayReport'];
  employees: Array<{ _id: string; name: string; role: string }>;
};

export default function ManagerTodaysReportSection({ report, employees }: Props) {
  const todayReport = report;

  const businessDateLabel = useMemo(() => {
    if (!todayReport?.businessDate?.start) return 'Today';
    try {
      return new Date(todayReport.businessDate.start).toLocaleString();
    } catch {
      return todayReport.businessDate.start;
    }
  }, [todayReport?.businessDate]);

  const salesEmployees = employees.filter((employee) => employee.role === 'SALES');
  const techSupportEmployees = employees.filter((employee) => employee.role === 'TECH_SUPPORT');

  const leadsByEmployee = new Map<string, number>();
  const salesByEmployee = new Map<string, { count: number; amount: number }>();
  const failedSalesByEmployee = new Map<string, number>();
  const remoteByEmployee = new Map<string, { total: number; successful: number; failed: number }>();

  (todayReport?.lists?.leads || []).forEach((lead: any) => {
    const owner = lead.connectedBy?.trim() || 'Unassigned';
    leadsByEmployee.set(owner, (leadsByEmployee.get(owner) || 0) + 1);
  });

  (todayReport?.lists?.sales || []).forEach((sale: any) => {
    const owner = sale.connectedBy?.trim() || 'Unassigned';
    const previous = salesByEmployee.get(owner) || { count: 0, amount: 0 };
    salesByEmployee.set(owner, { count: previous.count + 1, amount: previous.amount + Number(sale.amount || 0) });
  });

  (todayReport?.lists?.failed || []).forEach((sale: any) => {
    const owner = sale.connectedBy?.trim() || 'Unassigned';
    failedSalesByEmployee.set(owner, (failedSalesByEmployee.get(owner) || 0) + 1);
  });

  (todayReport?.lists?.remote || []).forEach((remote: any) => {
    const owner = remote.techSupportEmployeeName?.trim() || 'Unassigned';
    const existing = remoteByEmployee.get(owner) || { total: 0, successful: 0, failed: 0 };
    const status = remote.status?.toUpperCase?.() || '';
    remoteByEmployee.set(owner, {
      total: existing.total + 1,
      successful: existing.successful + (status === 'SUCCESSFUL' ? 1 : 0),
      failed: existing.failed + (status === 'FAILED' ? 1 : 0),
    });
  });

  const totalSalesTeamEmployees = salesEmployees.length;
  const totalTechSupportEmployees = techSupportEmployees.length;

  return (
    <section className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100 lg:p-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">Today&apos;s report</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Current business day performance</h1>
        <p className="mt-2 text-sm text-slate-400">Business day: <span className="font-semibold text-slate-200">{businessDateLabel}</span></p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Total Leads" value={todayReport?.leads ?? 0} icon={UserPlus} />
        <Metric label="Total Sales" value={todayReport?.salesCount ?? 0} icon={TrendingUp} />
        <Metric label="Total Failed Sales" value={todayReport?.failedSales ?? 0} icon={Flag} />
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">Sales team</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Employee-wise performance</h2>
          </div>
          <div className="rounded-2xl bg-slate-950 px-4 py-2 text-xs text-slate-300">{totalSalesTeamEmployees} sales employees</div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[11px]"><tr><th className="p-3">Employee</th><th className="p-3">Leads</th><th className="p-3">Sales</th><th className="p-3">Failed Sales</th></tr></thead>
            <tbody className="divide-y divide-slate-800/60">
              {salesEmployees.length ? salesEmployees.map((employee) => (
                <tr key={employee._id} className="hover:bg-slate-950/50">
                  <td className="p-3 font-semibold text-white">{employee.name}</td>
                  <td className="p-3">{leadsByEmployee.get(employee.name) || 0}</td>
                  <td className="p-3">{salesByEmployee.get(employee.name)?.count || 0}</td>
                  <td className="p-3">{failedSalesByEmployee.get(employee.name) || 0}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">No sales employees found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">Tech support</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Employee-wise remote performance</h2>
          </div>
          <div className="rounded-2xl bg-slate-950 px-4 py-2 text-xs text-slate-300">{totalTechSupportEmployees} support employees</div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[11px]"><tr><th className="p-3">Employee</th><th className="p-3">Total Remote</th><th className="p-3">Successful Remote</th><th className="p-3">Failed Remote</th></tr></thead>
            <tbody className="divide-y divide-slate-800/60">
              {techSupportEmployees.length ? techSupportEmployees.map((employee) => {
                const row = remoteByEmployee.get(employee.name) || { total: 0, successful: 0, failed: 0 };
                return (
                  <tr key={employee._id} className="hover:bg-slate-950/50">
                    <td className="p-3 font-semibold text-white">{employee.name}</td>
                    <td className="p-3">{row.total}</td>
                    <td className="p-3">{row.successful}</td>
                    <td className="p-3">{row.failed}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">No tech support employees found.</td></tr>
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/80 p-3 text-slate-200"><Icon className="h-5 w-5 text-indigo-400" /></div>
      </div>
    </div>
  );
}

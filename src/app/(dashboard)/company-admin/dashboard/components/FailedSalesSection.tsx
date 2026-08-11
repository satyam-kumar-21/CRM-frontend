'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Download, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, ICompanySale } from '@/services/companyService';
import { matchesBusinessDateFilters } from '@/lib/businessDate';

const input = 'rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500';

type Filters = { employee: string; customer: string; month: string; from: string; to: string };
const emptyFilters: Filters = { employee: '', customer: '', month: '', from: '', to: '' };

export function FailedSalesSection() {
  const [sales, setSales] = useState<ICompanySale[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  useEffect(() => {
    companyService.getFailedSales().then(setSales).catch(() => toast.error('Unable to load failed sales'));
  }, []);

  const closedByOptions = useMemo(() => Array.from(new Set(sales.map((sale) => sale.connectedBy))).sort(), [sales]);

  const filtered = useMemo(() => sales.filter((sale) => (
    (!filters.employee || sale.connectedBy === filters.employee)
      && (!filters.customer || sale.name.toLowerCase().includes(filters.customer.toLowerCase()))
      && matchesBusinessDateFilters(sale.saleDate, filters)
  )), [sales, filters]);

  const revenue = filtered.reduce((total, sale) => total + sale.amount, 0);

  return (
    <section className="min-h-full space-y-5 overflow-y-auto bg-slate-950 p-6 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><Flag className="h-6 w-6 text-rose-400" /> Failed Sales</h1>
          <p className="text-sm text-slate-400">Review sales that were failed or charged back.</p>
        </div>
        <button onClick={() => downloadCsv(filtered)} className="flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white"><Download className="h-4 w-4" />Export CSV</button>
      </header>
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <label className="text-[11px] text-slate-400">Closed by<select value={filters.employee} onChange={(event) => setFilters({ ...filters, employee: event.target.value })} className={`${input} ml-1`}><option value="">Everyone</option>{closedByOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label className="text-[11px] text-slate-400">Customer<input type="text" value={filters.customer} onChange={(event) => setFilters({ ...filters, customer: event.target.value })} placeholder="Search name" className={`${input} ml-1`} /></label>
        <label className="text-[11px] text-slate-400">Month & year<input type="month" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value, from: '', to: '' })} className={`${input} ml-1`} /></label>
        <label className="text-[11px] text-slate-400">Start date<input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value, month: '' })} className={`${input} ml-1`} /></label>
        <label className="text-[11px] text-slate-400">End date<input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value, month: '' })} className={`${input} ml-1`} /></label>
        <button onClick={() => setFilters(emptyFilters)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white">Clear</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3"><Metric label="Failed revenue" value={`$${revenue.toLocaleString()}`} /><Metric label="Failed deals" value={filtered.length} /><Metric label="Average failed" value={`$${filtered.length ? Math.round(revenue / filtered.length).toLocaleString() : 0}`} /></div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Customer</th><th className="p-3">Amount</th><th className="p-3">Closed By</th><th className="p-3">Sale Date</th><th className="p-3">Failed Reason</th></tr></thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((sale) => (
              <tr key={sale._id}>
                <td className="p-3 font-semibold text-white">{sale.name}<span className="block text-slate-500">{sale.country}</span></td>
                <td className="p-3 text-emerald-400">${sale.amount.toLocaleString()}</td>
                <td className="p-3">{sale.connectedBy}</td>
                <td className="p-3">{sale.saleDate}</td>
                <td className="p-3 text-slate-200">{sale.failedReason || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function downloadCsv(rows: ICompanySale[]) {
  const csv = [['Customer', 'Country', 'System', 'Closed By', 'Date', 'Amount', 'Failed Reason'], ...rows.map((sale) => [sale.name, sale.country, sale.system, sale.connectedBy, sale.saleDate, String(sale.amount), sale.failedReason || 'N/A'])];
  const text = csv.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  link.download = 'failed-sales.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>;
}

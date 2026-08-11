 'use client';

import React, { useMemo, useState } from 'react';
import { DollarSign, Flag, LifeBuoy, UserPlus, Search } from 'lucide-react';
import type { ICompanyDashboard } from '@/services/companyService';

type Props = { report?: ICompanyDashboard['stats']['todayReport'] };

export default function TodaysReportSection({ report }: Props) {
  const r = report || { leads: 0, salesCount: 0, salesAmount: 0, failedSales: 0, remote: { successful: 0, failed: 0, total: 0 }, lists: { leads: [], sales: [], remote: [] }, businessDate: { start: '', end: '' } } as any;
  const [activeTab, setActiveTab] = useState<'leads' | 'sales' | 'remote'>('leads');
  const [search, setSearch] = useState('');

  const businessDateLabel = useMemo(() => {
    if (!r.businessDate?.start) return '';
    try {
      const d = new Date(r.businessDate.start);
      return d.toLocaleString();
    } catch (e) { return r.businessDate.start; }
  }, [r.businessDate]);

  function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
    if (!rows || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map((row) => keys.map((k) => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const filteredLeads = (r.lists?.leads || []).filter((l: any) => !search || `${l.name} ${l.country} ${l.system}`.toLowerCase().includes(search.toLowerCase()));
  const filteredSales = (r.lists?.sales || []).filter((s: any) => !search || `${s.name} ${s.connectedBy}`.toLowerCase().includes(search.toLowerCase()));
  const filteredRemote = (r.lists?.remote || []).filter((m: any) => !search || `${m.customerName} ${m.salesEmployeeName} ${m.techSupportEmployeeName}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">TODAY'S REPORT</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Business day performance</h1>
          <p className="mt-1 text-sm text-slate-400">Business day: <span className="font-semibold text-slate-200">{businessDateLabel}</span></p>
        </div>
        <div className="text-sm text-slate-400">Business day metrics only</div>
      </header>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-5">
        <Card label="Today's Leads" value={r.leads} icon={UserPlus} />
        <Card label="Today's Sales" value={r.salesCount} icon={DollarSign} />
        <Card label="Sales Amount" value={`₹${Number(r.salesAmount || 0).toLocaleString()}`} icon={DollarSign} />
        <Card label="Today's Failed Sales" value={r.failedSales} icon={Flag} />
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mt-2 grid gap-3">
            <OverviewRow label="Successful Remote" value={r.remote?.successful ?? 0} />
            <OverviewRow label="Failed Remote" value={r.remote?.failed ?? 0} />
            <div className="border-t border-slate-800 pt-3"><OverviewRow label="Total Remote" value={r.remote?.total ?? 0} /></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('leads')} className={`px-4 py-2 rounded-lg ${activeTab === 'leads' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Leads</button>
            <button onClick={() => setActiveTab('sales')} className={`px-4 py-2 rounded-lg ${activeTab === 'sales' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Sales</button>
            <button onClick={() => setActiveTab('remote')} className={`px-4 py-2 rounded-lg ${activeTab === 'remote' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>Remote</button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="bg-transparent outline-none text-sm text-slate-200" />
            </div>
            <button onClick={() => downloadCsv('todays-report.csv', activeTab === 'leads' ? filteredLeads : activeTab === 'sales' ? filteredSales : filteredRemote)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Export CSV</button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {activeTab === 'leads' && (
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase"><tr><th className="p-3">Lead</th><th className="p-3">Country</th><th className="p-3">System</th><th className="p-3">Created</th></tr></thead>
              <tbody className="divide-y divide-slate-800/60">{filteredLeads.map((l: any) => (<tr key={l._id} className="hover:bg-slate-950/50"><td className="p-3 font-semibold text-white">{l.name}</td><td className="p-3 text-slate-400">{l.country}</td><td className="p-3">{l.system}</td><td className="p-3 text-slate-400">{new Date(l.createdAt).toLocaleString()}</td></tr>))}</tbody>
            </table>
          )}

          {activeTab === 'sales' && (
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase"><tr><th className="p-3">Sale</th><th className="p-3">Amount</th><th className="p-3">By</th><th className="p-3">Date</th><th className="p-3">Failed</th></tr></thead>
              <tbody className="divide-y divide-slate-800/60">{filteredSales.map((s: any) => (<tr key={s._id} className="hover:bg-slate-950/50"><td className="p-3 font-semibold text-white">{s.name}</td><td className="p-3 text-emerald-400">₹{Number(s.amount).toLocaleString()}</td><td className="p-3 text-slate-400">{s.connectedBy}</td><td className="p-3 text-slate-400">{s.saleDate}</td><td className="p-3">{s.failed ? 'Yes' : 'No'}</td></tr>))}</tbody>
            </table>
          )}

          {activeTab === 'remote' && (
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase"><tr><th className="p-3">Customer</th><th className="p-3">Sales Emp</th><th className="p-3">Tech Emp</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead>
              <tbody className="divide-y divide-slate-800/60">{filteredRemote.map((m: any) => (<tr key={m._id} className="hover:bg-slate-950/50"><td className="p-3 font-semibold text-white">{m.customerName}</td><td className="p-3 text-slate-400">{m.salesEmployeeName}</td><td className="p-3 text-slate-400">{m.techSupportEmployeeName || 'N/A'}</td><td className="p-3">{m.status}</td><td className="p-3 text-slate-400">{new Date(m.dateTime).toLocaleString()}</td></tr>))}</tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}

function Card({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        {Icon && (<div className="rounded-lg bg-indigo-500/10 p-2.5"><Icon className="h-5 w-5 text-indigo-400" /></div>)}
      </div>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
      <span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

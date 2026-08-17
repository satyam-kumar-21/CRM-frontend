'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Download, Pencil, Plus, Trash2, TrendingUp, Flag, X } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, ICompanyEmployee, ICompanySale } from '@/services/companyService';
import { getBusinessDateString, matchesBusinessDateFilters } from '@/lib/businessDate';

const input = 'rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500';
const downloadCsv = (rows: string[][]) => { const text = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); link.download = 'filtered-sales.csv'; link.click(); URL.revokeObjectURL(link.href); };

type Filters = { employee: string; month: string; from: string; to: string };
const emptyFilters: Filters = { employee: '', month: '', from: '', to: '' };

export function AdminSalesSection() {
  const [sales, setSales] = useState<ICompanySale[]>([]);
  const [pendingSales, setPendingSales] = useState<ICompanySale[]>([]);
  const [chargedToday, setChargedToday] = useState<ICompanySale[]>([]);
  const [employees, setEmployees] = useState<ICompanyEmployee[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [editing, setEditing] = useState<ICompanySale | null>(null);
  const [adding, setAdding] = useState(false);
  const [markingFailedSale, setMarkingFailedSale] = useState<ICompanySale | null>(null);
  const [failedReason, setFailedReason] = useState('');
  const [saleStatus, setSaleStatus] = useState<'PENDING' | 'CHARGED' | 'DROPPED'>('CHARGED');
  const [form, setForm] = useState({ name: '', country: '', system: '', connectedBy: '', customerEmail: '', alternateContactNo: '', customerAddress: '', plan: '', paymentMerchant: '', amount: 0, paymentMethod: 'Other' as ICompanySale['paymentMethod'], saleDate: getBusinessDateString(), saleStatus: 'PENDING' as 'PENDING' | 'CHARGED' | 'DROPPED' });
  useEffect(() => {
    companyService.getSales().then(setSales).catch(() => toast.error('Unable to load sales'));
    companyService.getPendingSales().then(setPendingSales).catch(() => toast.error('Unable to load pending sales'));
    companyService.getEmployees().then(setEmployees).catch(() => toast.error('Unable to load employees'));
    // Fetch charged sales for today
    const todayDate = getBusinessDateString();
    companyService.getSales().then((allSales) => {
      const todayCharged = allSales.filter((sale) => sale.saleStatus === 'CHARGED' && sale.businessDate === todayDate);
      setChargedToday(todayCharged);
    }).catch(() => {});
  }, []);
  const filtered = useMemo(() => sales.filter((sale) => {
    return (!filters.employee || sale.connectedBy === filters.employee)
      && matchesBusinessDateFilters(sale.saleDate, filters);
  }), [sales, filters]);
  const openAdd = () => { setEditing(null); setForm({ name: '', country: '', system: '', connectedBy: '', customerEmail: '', alternateContactNo: '', customerAddress: '', plan: '', paymentMerchant: '', amount: 0, paymentMethod: 'Other', saleDate: getBusinessDateString(), saleStatus: 'PENDING' }); setAdding(true); };
  const openEdit = (sale: ICompanySale) => { setEditing(sale); setForm({ name: sale.name, country: sale.country, system: sale.system, connectedBy: sale.connectedBy, customerEmail: sale.customerEmail || '', alternateContactNo: sale.alternateContactNo || '', customerAddress: sale.customerAddress || '', plan: sale.plan || '', paymentMerchant: sale.paymentMerchant || '', amount: sale.amount, paymentMethod: sale.paymentMethod, saleDate: sale.saleDate, saleStatus: sale.saleStatus || 'PENDING' }); setAdding(true); };
  const save = async (event: React.FormEvent) => { event.preventDefault(); if (form.saleStatus === 'DROPPED' && !failedReason.trim()) { toast.error('Dropped sales require a reason.'); return; } try { const payload = { ...form, failedReason: form.saleStatus === 'DROPPED' ? failedReason.trim() : undefined, saleStatus: form.saleStatus }; const result = editing ? await companyService.updateSale(editing._id, payload) : await companyService.createSale(payload); setSales((current) => editing ? current.map((sale) => sale._id === editing._id ? result : sale) : [result, ...current]); setAdding(false); setEditing(null); setFailedReason(''); toast.success(editing ? 'Sale updated' : 'Sale created'); } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to save sale'); } };
  const remove = async (id: string) => { if (!window.confirm('Delete this sale?')) return; try { await companyService.deleteSale(id); setSales((current) => current.filter((sale) => sale._id !== id)); toast.success('Sale deleted'); } catch { toast.error('Unable to delete sale'); } };
  const handleDirectCharge = async (sale: ICompanySale) => {
    try {
      await companyService.markSaleFailed(sale._id, '', 'CHARGED');
      setPendingSales((current) => current.filter((item) => item._id !== sale._id));
      setChargedToday((current) => [sale, ...current]);
      setSales((current) => [sale, ...current.filter((item) => item._id !== sale._id)]);
      toast.success('Sale marked as charged');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to mark sale as charged');
    }
  };
  const openMarkFailed = (sale: ICompanySale, nextStatus: 'CHARGED' | 'DROPPED' = 'DROPPED') => {
    if (nextStatus === 'CHARGED') {
      void handleDirectCharge(sale);
      return;
    }
    setMarkingFailedSale(sale);
    setSaleStatus(nextStatus);
    setFailedReason('');
  };
  const cancelMarkFailed = () => { setMarkingFailedSale(null); setFailedReason(''); setSaleStatus('CHARGED'); };
  const confirmMarkFailed = async () => {
    if (!markingFailedSale) return;
    if (saleStatus === 'DROPPED' && !failedReason.trim()) { toast.error('Dropped sales require a reason'); return; }
    try {
      await companyService.markSaleFailed(markingFailedSale._id, failedReason.trim(), saleStatus);
      setPendingSales((current) => current.filter((sale) => sale._id !== markingFailedSale._id));
      if (saleStatus === 'CHARGED') {
        setChargedToday((current) => [markingFailedSale, ...current]);
        setSales((current) => [markingFailedSale, ...current]);
        toast.success('Sale marked as charged');
      } else {
        setSales((current) => current.filter((sale) => sale._id !== markingFailedSale._id));
        toast.success('Sale marked as dropped');
      }
      setMarkingFailedSale(null);
      setFailedReason('');
      setSaleStatus('CHARGED');
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Unable to mark sale as ${saleStatus.toLowerCase()}`);
    }
  };
  const revenue = filtered.reduce((total, sale) => total + Number(sale.finalAmount ?? sale.amount ?? 0), 0);
  return <section className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100"><header className="flex items-center justify-between border-b border-slate-800 pb-4"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><TrendingUp className="h-6 w-6 text-emerald-400" /> Sales Revenue</h1><p className="text-sm text-slate-400">Manage company sales transactions.</p></div><button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" />Add Sale</button></header>

    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">Today's Work</p>
          <h2 className="mt-1 text-lg font-bold text-white">Pending sales</h2>
        </div>
        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">{pendingSales.length} pending</span>
      </div>
      {pendingSales.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-400">No pending sales today.</div>
      ) : (
        <div className="mt-3 space-y-3">
          {pendingSales.map((sale) => (
            <div key={sale._id} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-bold text-white text-sm">{sale.name}</span>
                    {sale.customerId && <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300">#{sale.customerId}</span>}
                    <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300">{sale.country}</span>
                    <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-200">Pending</span>
                  </div>
                  <div className="grid gap-2 text-[11px] text-slate-400">
                    <div><span className="text-slate-500">Closed by:</span> {sale.connectedBy}</div>
                    <div><span className="text-slate-500">System:</span> {sale.system}</div>
                    <div><span className="text-slate-500">Plan:</span> {sale.plan || 'N/A'}</div>
                    <div><span className="text-slate-500">Email:</span> {sale.customerEmail || 'N/A'}</div>
                    <div><span className="text-slate-500">Amount:</span> <span className="text-emerald-400 font-semibold">${Number(sale.finalAmount ?? sale.amount ?? 0).toLocaleString()}</span></div>
                    <div><span className="text-slate-500">Date:</span> {sale.saleDate}</div>
                    <div><span className="text-slate-500">Payment:</span> {sale.paymentMethod} {sale.paymentMerchant ? `via ${sale.paymentMerchant}` : ''}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openMarkFailed(sale, 'CHARGED')} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-[11px] font-bold text-white">Mark Charged</button>
                  <button type="button" onClick={() => openMarkFailed(sale, 'DROPPED')} className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-2 text-[11px] font-bold text-white">Mark Dropped</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">Today's Work</p>
          <h2 className="mt-1 text-lg font-bold text-white">Charged today</h2>
        </div>
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">{chargedToday.length} charged</span>
      </div>
      {chargedToday.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-400">No charged sales today yet.</div>
      ) : (
        <div className="mt-3 space-y-3">
          {chargedToday.map((sale) => (
            <div key={sale._id} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-bold text-white text-sm">{sale.name}</span>
                    {sale.customerId && <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300">#{sale.customerId}</span>}
                    <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300">{sale.country}</span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">Charged</span>
                  </div>
                  <div className="grid gap-1 text-[10px] text-slate-400">
                    <div><span className="text-slate-500">Closed by:</span> {sale.connectedBy} | <span className="text-slate-500">Amount:</span> <span className="text-emerald-400 font-semibold">${Number(sale.finalAmount ?? sale.amount ?? 0).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3"><label className="text-[11px] text-slate-400">Closed by<select value={filters.employee} onChange={(event) => setFilters({ ...filters, employee: event.target.value })} className={`${input} ml-1`}><option value="">Everyone</option>{employees.map((employee) => <option key={employee._id} value={employee.name}>{employee.name} · {employee.role}</option>)}</select></label><label className="text-[11px] text-slate-400">Month & year<input type="month" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value, from: '', to: '' })} className={`${input} ml-1`} /></label><label className="text-[11px] text-slate-400">Start date<input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value, month: '' })} className={`${input} ml-1`} /></label><label className="text-[11px] text-slate-400">End date<input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value, month: '' })} className={`${input} ml-1`} /></label><button onClick={() => setFilters(emptyFilters)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white">Clear</button><button onClick={() => downloadCsv([['Customer ID', 'Customer', 'Email', 'Alt Phone', 'Address', 'Country', 'System', 'Plan', 'Merchant', 'Closed By', 'Payment', 'Type', 'Date', 'Amount'], ...filtered.map((sale) => [sale.customerId || 'N/A', sale.name, sale.customerEmail || '', sale.alternateContactNo || '', sale.customerAddress || '', sale.country, sale.system, sale.plan || '', sale.paymentMerchant || '', sale.connectedBy, sale.paymentMethod, sale.transactionType || 'SALE', sale.saleDate, String(sale.finalAmount ?? sale.amount ?? 0)])])} className="ml-auto flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Export CSV</button></div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric label="Filtered revenue" value={`$${revenue.toLocaleString()}`} /><Metric label="Closed deals" value={filtered.length} /><Metric label="Average deal" value={`$${filtered.length ? Math.round(revenue / filtered.length).toLocaleString() : 0}`} /></div>
    {markingFailedSale && <div className={`rounded-xl border p-4 ${saleStatus === 'DROPPED' ? 'border-rose-500/40 bg-rose-950/20' : 'border-emerald-500/40 bg-emerald-950/20'}`}>
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-white">{saleStatus === 'DROPPED' ? 'Mark Sale as Dropped' : 'Mark Sale as Charged'}</h2><p className="text-sm text-slate-400">{saleStatus === 'DROPPED' ? 'This sale will be excluded from sales totals and reports.' : 'This sale will move into the regular charged sales list.'}</p></div><button type="button" onClick={cancelMarkFailed} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white"><X className="inline h-4 w-4" /></button></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3"><div><p className="text-xs uppercase text-slate-500">Customer</p><p className="text-white">{markingFailedSale.name}</p></div><div><p className="text-xs uppercase text-slate-500">Closed by</p><p className="text-white">{markingFailedSale.connectedBy}</p></div><div><p className="text-xs uppercase text-slate-500">Sale date</p><p className="text-white">{markingFailedSale.saleDate}</p></div></div>
      {saleStatus === 'DROPPED' && <label className="mt-4 block text-xs text-slate-400"><span>Drop reason</span><input type="text" value={failedReason} onChange={(event) => setFailedReason(event.target.value)} placeholder="Customer returned product, Payment not received, order cancelled..." className={`${input} mt-1 w-full`} required /></label>}
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={confirmMarkFailed} className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${saleStatus === 'DROPPED' ? 'bg-rose-600' : 'bg-emerald-600'}`}>{saleStatus === 'DROPPED' ? 'Confirm dropped sale' : 'Confirm charged sale'}</button><button type="button" onClick={cancelMarkFailed} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white">Cancel</button></div>
    </div>}
    {adding && <form onSubmit={save} className="grid gap-3 rounded-xl border border-indigo-500/30 bg-slate-900 p-4 md:grid-cols-4">
      <label className="space-y-1 text-xs text-slate-400">Customer Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={`${input} block w-full`} /></label>
      <label className="space-y-1 text-xs text-slate-400">Email<input type="email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} className={`${input} block w-full`} /></label>
      <label className="space-y-1 text-xs text-slate-400">Alt Phone<input type="tel" value={form.alternateContactNo} onChange={(event) => setForm({ ...form, alternateContactNo: event.target.value })} className={`${input} block w-full`} /></label>
      <label className="space-y-1 text-xs text-slate-400">Address<input value={form.customerAddress} onChange={(event) => setForm({ ...form, customerAddress: event.target.value })} className={`${input} block w-full`} /></label>
      <label className="space-y-1 text-xs text-slate-400">Country<input required value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className={`${input} block w-full`} /></label>
      <label className="space-y-1 text-xs text-slate-400">System<input required value={form.system} onChange={(event) => setForm({ ...form, system: event.target.value })} className={`${input} block w-full`} /></label>
      <label className="space-y-1 text-xs text-slate-400">Closed by<input required value={form.connectedBy} onChange={(event) => setForm({ ...form, connectedBy: event.target.value })} className={`${input} block w-full`} /></label>
      <label className="space-y-1 text-xs text-slate-400">Plan<input value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })} className={`${input} block w-full`} /></label>
      <label className="space-y-1 text-xs text-slate-400">Payment Merchant<input value={form.paymentMerchant} onChange={(event) => setForm({ ...form, paymentMerchant: event.target.value })} className={`${input} block w-full`} /></label>
      <label className="space-y-1 text-xs text-slate-400">Payment Method<select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as ICompanySale['paymentMethod'] })} className={`${input} block w-full`}>{['Card', 'Check', 'Wire Transfer', 'Cash', 'UPI', 'Bank Transfer', 'Online', 'Other'].map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
      <label className="space-y-1 text-xs text-slate-400">Sale Status<select value={form.saleStatus} onChange={(event) => { const next = event.target.value as 'PENDING' | 'CHARGED' | 'DROPPED'; setForm({ ...form, saleStatus: next }); if (next !== 'DROPPED') setFailedReason(''); }} className={`${input} block w-full`}><option value="PENDING">Pending</option><option value="CHARGED">Charged</option><option value="DROPPED">Dropped</option></select></label>
      <label className="space-y-1 text-xs text-slate-400">Amount ($)<input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} className={`${input} block w-full`} /></label>
      <label className="space-y-1 text-xs text-slate-400">Sale date<input type="date" value={form.saleDate} onChange={(event) => setForm({ ...form, saleDate: event.target.value })} className={`${input} block w-full`} /></label>
      {form.saleStatus === 'DROPPED' && <label className="space-y-1 text-xs text-slate-400 md:col-span-4">Drop reason<input required value={failedReason} onChange={(event) => setFailedReason(event.target.value)} placeholder="Why is this sale dropped?" className={`${input} block w-full`} /></label>}
      <div className="flex items-end gap-2 md:col-span-4"><button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Save</button><button type="button" onClick={() => { setAdding(false); setFailedReason(''); }} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white">Cancel</button></div>
    </form>}
    <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs text-slate-300"><thead className="bg-slate-900 text-slate-400"><tr>{['Customer & ID', 'Contact & Address', 'System & Plan', 'Closed By', 'Merchant & Payment', 'Type', 'Date', 'Amount', 'Actions'].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-800">{filtered.map((sale) => <tr key={sale._id} className="hover:bg-slate-900/40 transition-colors"><td className="p-3"><div className="flex items-center gap-1.5"><b className="font-semibold text-white text-sm">{sale.name}</b>{sale.customerId && <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">#{sale.customerId}</span>}</div><span className="block text-slate-500 text-[11px]">{sale.country}</span></td><td className="p-3 text-[11px]"><div className="text-slate-300">{sale.customerEmail || '—'}</div>{sale.alternateContactNo && <div className="text-emerald-400">Alt: {sale.alternateContactNo}</div>}{sale.customerAddress && <div className="text-slate-500 truncate max-w-xs">{sale.customerAddress}</div>}</td><td className="p-3"><div className="font-medium text-slate-200"><Building2 className="mr-1 inline h-3.5 w-3.5 text-slate-400" />{sale.system}</div>{sale.plan && <div className="text-[11px] text-cyan-400">{sale.plan}</div>}</td><td className="p-3">{sale.connectedBy}</td><td className="p-3"><div><span className="font-medium text-slate-200">{sale.paymentMethod}</span></div>{sale.paymentMerchant && <span className="text-[10px] text-slate-400 block font-mono">Via: {sale.paymentMerchant}</span>}</td><td className="p-3"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${sale.transactionType === 'UPGRADE' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'}`}>{sale.transactionType || 'SALE'}</span></td><td className="p-3 text-slate-400">{sale.saleDate}</td><td className="p-3 text-emerald-400 font-mono font-bold text-sm">${Number(sale.finalAmount ?? sale.amount ?? 0).toLocaleString()}</td><td className="p-3"><button onClick={() => openEdit(sale)} className="mr-2 text-indigo-400" title="Edit sale"><Pencil className="inline h-4 w-4" /></button><button onClick={() => openMarkFailed(sale)} className="mr-2 text-amber-400" title="Mark sale as failed"><Flag className="inline h-4 w-4" /></button><button onClick={() => void remove(sale._id)} className="text-rose-400" title="Delete sale"><Trash2 className="inline h-4 w-4" /></button></td></tr>)}</tbody></table></div>
  </section>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>; }

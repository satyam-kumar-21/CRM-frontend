'use client';

import { useEffect, useState } from 'react';
import { Building2, Check, CheckCircle2, CreditCard, Globe, Pencil, Phone, Plus, Target, Trash2, UserCheck, UserPlus, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, ICompanyEmployee, ICompanyLead, ICompanySale } from '@/services/companyService';

type LeadForm = Omit<ICompanyLead, '_id'>;
type SaleForm = Omit<ICompanySale, '_id'>;

const emptyLead: LeadForm = { name: '', country: '', system: '', contactNo: '', otherDetails: '', connected: 'no', connectedBy: 'Unassigned', isSale: 'no' };
const emptySale: SaleForm = { name: '', country: '', system: '', connectedBy: '', amount: 0, paymentMethod: 'Card', saleDate: new Date().toISOString().slice(0, 10) };
const inputClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';
const selectClass = `${inputClass} cursor-pointer appearance-none bg-[linear-gradient(45deg,transparent_50%,#94a3b8_50%),linear-gradient(135deg,#94a3b8_50%,transparent_50%)] bg-[position:calc(100%-14px)_50%,calc(100%-9px)_50%] bg-[size:5px_5px,5px_5px] bg-no-repeat pr-8`;

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return <label className="block space-y-1 text-xs text-slate-400"><span>{label}</span><input className={inputClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} required /></label>;
}

function EmployeeSelect({ label, value, employees, onChange }: { label: string; value: string; employees: ICompanyEmployee[]; onChange: (value: string) => void }) {
  return <label className="block space-y-1 text-xs text-slate-400"><span>{label}</span><select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)} required><option value="">Select employee</option>{value && !employees.some((employee) => employee.name === value) && <option value={value}>{value}</option>}{employees.map((employee) => <option key={employee._id} value={employee.name}>{employee.name} · {employee.role}</option>)}</select></label>;
}

function LeadEditor({ initial, employees, onSave, onCancel }: { initial: LeadForm; employees: ICompanyEmployee[]; onSave: (data: LeadForm) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof LeadForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <form onSubmit={(event) => { event.preventDefault(); void onSave(form); }} className="grid gap-3 rounded-xl border border-indigo-500/30 bg-slate-900 p-4 md:grid-cols-4">
    <Field label="Lead name" value={form.name} onChange={(value) => set('name', value)} /><Field label="Country" value={form.country} onChange={(value) => set('country', value)} /><Field label="System" value={form.system} onChange={(value) => set('system', value)} /><Field label="Contact" value={form.contactNo} onChange={(value) => set('contactNo', value)} />
    <Field label="Details" value={form.otherDetails} onChange={(value) => set('otherDetails', value)} /><EmployeeSelect label="Connected by" value={form.connectedBy} employees={employees} onChange={(value) => set('connectedBy', value)} />
    <label className="space-y-1 text-xs text-slate-400"><span>Connected</span><select className={selectClass} value={form.connected} onChange={(event) => set('connected', event.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></label>
    <label className="space-y-1 text-xs text-slate-400"><span>Converted sale</span><select className={selectClass} value={form.isSale} onChange={(event) => set('isSale', event.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></label>
    <div className="flex gap-2 md:col-span-4"><button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Check className="mr-1 inline h-3.5 w-3.5" />Save</button><button type="button" onClick={onCancel} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white">Cancel</button></div>
  </form>;
}

export function LeadsSection() {
  const [leads, setLeads] = useState<ICompanyLead[]>([]);
  const [employees, setEmployees] = useState<ICompanyEmployee[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  useEffect(() => { companyService.getLeads().then(setLeads).catch(() => toast.error('Unable to load leads')); companyService.getEmployees().then(setEmployees).catch(() => toast.error('Unable to load employees')); }, []);
  const save = async (data: LeadForm) => { try { const lead = editing ? await companyService.updateLead(editing, data) : await companyService.createLead(data); setLeads((current) => editing ? current.map((item) => item._id === editing ? lead : item) : [lead, ...current]); setEditing(null); setAdding(false); toast.success(editing ? 'Lead updated' : 'Lead created'); } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to save lead'); } };
  const remove = async (id: string) => { if (!window.confirm('Delete this lead?')) return; try { await companyService.deleteLead(id); setLeads((current) => current.filter((lead) => lead._id !== id)); toast.success('Lead deleted'); } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to delete lead'); } };
  const connected = leads.filter((lead) => lead.connected === 'yes').length;
  const converted = leads.filter((lead) => lead.isSale === 'yes').length;
  return <div className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100"><header className="flex items-center justify-between border-b border-slate-800 pb-4"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><UserPlus className="h-6 w-6 text-sky-400" /> Leads Management</h1><p className="text-sm text-slate-400">Create, update, and remove company leads.</p></div><button onClick={() => { setAdding(true); setEditing(null); }} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="mr-1 inline h-4 w-4" />Add Lead</button></header>
    <div className="grid gap-4 sm:grid-cols-3"><Metric icon={UserPlus} label="Total Leads" value={leads.length} color="text-sky-400" /><Metric icon={UserCheck} label="Connected" value={`${connected} / ${leads.length}`} color="text-indigo-400" /><Metric icon={CheckCircle2} label="Converted" value={converted} color="text-emerald-400" /></div>
    {(adding || editing) && <LeadEditor initial={editing ? (leads.find((lead) => lead._id === editing) as LeadForm) : emptyLead} employees={employees} onSave={save} onCancel={() => { setAdding(false); setEditing(null); }} />}
    <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs text-slate-300"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Lead</th><th className="p-3">Country</th><th className="p-3">Contact</th><th className="p-3">Connected</th><th className="p-3">Sale</th><th className="p-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-800">{leads.map((lead) => <tr key={lead._id}><td className="p-3"><b className="text-white">{lead.name}</b><span className="block text-sky-400">{lead.system}</span></td><td className="p-3"><Globe className="mr-1 inline h-3.5 w-3.5" />{lead.country}</td><td className="p-3"><Phone className="mr-1 inline h-3.5 w-3.5" />{lead.contactNo}</td><td className="p-3">{lead.connected}</td><td className="p-3">{lead.isSale}</td><td className="p-3 text-right"><button title="Edit lead" onClick={() => { setEditing(lead._id); setAdding(false); }} className="mr-2 text-indigo-400"><Pencil className="inline h-4 w-4" /></button><button title="Delete lead" onClick={() => void remove(lead._id)} className="text-rose-400"><Trash2 className="inline h-4 w-4" /></button></td></tr>)}</tbody></table></div>
  </div>;
}

function SaleEditor({ initial, leads, employees, onSave, onCancel }: { initial: SaleForm; leads: ICompanyLead[]; employees: ICompanyEmployee[]; onSave: (data: SaleForm) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof SaleForm, value: string) => setForm((current) => ({ ...current, [key]: key === 'amount' ? Number(value) : value }));
  const selectCustomer = (value: string) => {
    const lead = leads.find((item) => item.name === value);
    setForm((current) => lead ? { ...current, leadId: lead._id, name: lead.name, country: lead.country, system: lead.system } : { ...current, name: value });
  };
  return <form onSubmit={(event) => { event.preventDefault(); void onSave(form); }} className="grid gap-3 rounded-xl border border-indigo-500/30 bg-slate-900 p-4 md:grid-cols-4"><label className="block space-y-1 text-xs text-slate-400"><span>Customer from Leads</span><input list="company-lead-customers" className={inputClass} placeholder="Search lead customer..." value={form.name} onChange={(event) => selectCustomer(event.target.value)} required /><datalist id="company-lead-customers">{leads.map((lead) => <option key={lead._id} value={lead.name}>{lead.country} - {lead.system}</option>)}</datalist></label><Field label="Country" value={form.country} onChange={(value) => set('country', value)} /><Field label="System" value={form.system} onChange={(value) => set('system', value)} /><EmployeeSelect label="Closed by" value={form.connectedBy} employees={employees} onChange={(value) => set('connectedBy', value)} /><Field label="Amount" type="number" value={form.amount} onChange={(value) => set('amount', value)} /><Field label="Sale date" type="date" value={form.saleDate} onChange={(value) => set('saleDate', value)} /><label className="space-y-1 text-xs text-slate-400"><span>Payment method</span><select className={selectClass} value={form.paymentMethod} onChange={(event) => set('paymentMethod', event.target.value)}>{['Card', 'Check', 'Wire Transfer', 'Cash', 'Other'].map((method) => <option key={method}>{method}</option>)}</select></label><div className="flex items-end gap-2"><button className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Check className="mr-1 inline h-3.5 w-3.5" />Save</button><button type="button" onClick={onCancel} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white">Cancel</button></div></form>;
}

export function SalesSection() {
  const [sales, setSales] = useState<ICompanySale[]>([]);
  const [leads, setLeads] = useState<ICompanyLead[]>([]);
  const [employees, setEmployees] = useState<ICompanyEmployee[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    companyService.getSales().then(setSales).catch(() => toast.error('Unable to load sales'));
    companyService.getLeads().then(setLeads).catch(() => toast.error('Unable to load lead customers'));
    companyService.getEmployees().then(setEmployees).catch(() => toast.error('Unable to load employees'));
  }, []);
  const save = async (data: SaleForm) => { try { const sale = editing ? await companyService.updateSale(editing, data) : await companyService.createSale(data); setSales((current) => editing ? current.map((item) => item._id === editing ? sale : item) : [sale, ...current]); setEditing(null); setAdding(false); toast.success(editing ? 'Sale updated' : 'Sale created'); } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to save sale'); } };
  const remove = async (id: string) => { if (!window.confirm('Delete this sale?')) return; try { await companyService.deleteSale(id); setSales((current) => current.filter((sale) => sale._id !== id)); toast.success('Sale deleted'); } catch (error: any) { toast.error(error.response?.data?.message || 'Unable to delete sale'); } };
  const revenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  return <div className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100"><header className="flex items-center justify-between border-b border-slate-800 pb-4"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><TrendingUp className="h-6 w-6 text-emerald-400" /> Sales Revenue</h1><p className="text-sm text-slate-400">Manage company sales transactions.</p></div><button onClick={() => { setAdding(true); setEditing(null); }} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="mr-1 inline h-4 w-4" />Add Sale</button></header><div className="grid gap-4 sm:grid-cols-3"><Metric icon={TrendingUp} label="Revenue" value={`$${revenue.toLocaleString()}`} color="text-emerald-400" /><Metric icon={CreditCard} label="Closed Deals" value={sales.length} color="text-indigo-400" /><Metric icon={Target} label="Average Deal" value={`$${sales.length ? Math.round(revenue / sales.length).toLocaleString() : 0}`} color="text-amber-400" /></div>{(adding || editing) && <SaleEditor initial={editing ? (sales.find((sale) => sale._id === editing) as SaleForm) : emptySale} leads={leads} employees={employees} onSave={save} onCancel={() => { setAdding(false); setEditing(null); }} />}<div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs text-slate-300"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Customer</th><th className="p-3">System</th><th className="p-3">Closed by</th><th className="p-3">Payment</th><th className="p-3">Date</th><th className="p-3 text-right">Amount / Actions</th></tr></thead><tbody className="divide-y divide-slate-800">{sales.map((sale) => <tr key={sale._id}><td className="p-3"><b className="text-white">{sale.name}</b><span className="block text-slate-500">{sale.country}</span></td><td className="p-3"><Building2 className="mr-1 inline h-3.5 w-3.5" />{sale.system}</td><td className="p-3">{sale.connectedBy}</td><td className="p-3">{sale.paymentMethod}</td><td className="p-3">{sale.saleDate}</td><td className="p-3 text-right"><span className="mr-3 font-mono font-bold text-emerald-400">${sale.amount.toLocaleString()}</span><button title="Edit sale" onClick={() => { setEditing(sale._id); setAdding(false); }} className="mr-2 text-indigo-400"><Pencil className="inline h-4 w-4" /></button><button title="Delete sale" onClick={() => void remove(sale._id)} className="text-rose-400"><Trash2 className="inline h-4 w-4" /></button></td></tr>)}</tbody></table></div></div>;
}

function Metric({ icon: Icon, label, value, color }: { icon: typeof TrendingUp; label: string; value: string | number; color: string }) { return <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><Icon className={`h-5 w-5 ${color}`} /><p className="mt-3 text-xs uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>; }

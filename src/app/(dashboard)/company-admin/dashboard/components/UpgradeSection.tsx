'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, CreditCard, Download, Search, TrendingUp, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, ICompanyEmployee, ICustomerSearchResult, IUpgradeRecord } from '@/services/companyService';
import { matchesBusinessDateFilters } from '@/lib/businessDate';

const input = 'rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500';
const select = `${input} cursor-pointer appearance-none bg-[linear-gradient(45deg,transparent_50%,#94a3b8_50%),linear-gradient(135deg,#94a3b8_50%,transparent_50%)] bg-[position:calc(100%-14px)_50%,calc(100%-9px)_50%] bg-[size:5px_5px,5px_5px] bg-no-repeat pr-8`;

const emptyFilters = { employee: '', month: '', from: '', to: '' };
type Filters = typeof emptyFilters;

const formatCurrency = (value: number) => `$${Number(value || 0).toLocaleString()}`;

const calculateUpgradeTotals = (draft: any) => {
  const amount = Number(draft.upgradeAmount || 0);
  if (draft.salesTaxType === 'PERCENTAGE') {
    const taxValue = Number(draft.salesTaxValue || 0);
    const salesTaxAmount = (amount * taxValue) / 100;
    return { salesTaxAmount, finalAmount: amount + salesTaxAmount };
  }
  const salesTaxAmount = Number(draft.salesTaxAmount || 0);
  return { salesTaxAmount, finalAmount: amount + salesTaxAmount };
};

export function UpgradeSection() {
  const [upgrades, setUpgrades] = useState<IUpgradeRecord[]>([]);
  const [employees, setEmployees] = useState<ICompanyEmployee[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ICustomerSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [upgradeDraft, setUpgradeDraft] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [upgradeList, employeeList] = await Promise.all([
          companyService.getUpgrades(),
          companyService.getEmployees(),
        ]);
        setUpgrades(upgradeList || []);
        setEmployees(employeeList || []);
      } catch {
        toast.error('Unable to load upgrade reports');
      }
    };
    void load();
  }, []);

  const filteredUpgrades = useMemo(() => {
    return upgrades.filter((upgrade) => {
      const employeeMatch = !filters.employee || upgrade.salesEmployeeName === filters.employee || upgrade.upgradedByName === filters.employee;
      return employeeMatch && matchesBusinessDateFilters(upgrade.createdAt || '', filters);
    });
  }, [upgrades, filters]);

  const totalRevenue = filteredUpgrades.reduce((sum, item) => sum + (Number(item.finalAmount) || 0), 0);

  const handleCustomerSearch = async () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setSearchLoading(true);
    try {
      const results = await companyService.searchCustomers(trimmed);
      setSearchResults(results || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to search customers');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const openUpgradeModal = (customer: ICustomerSearchResult) => {
    const draft = {
      customerId: customer.customerId || customer._id || '',
      customerName: customer.name || '',
      customerEmail: customer.customerEmail || '',
      mobile: customer.mobile || customer.alternateContactNo || customer.contactNo || '',
      country: customer.country || '',
      system: customer.system || '',
      paymentMethod: 'Card',
      upgradeAmount: '',
      salesTaxType: 'PERCENTAGE',
      salesTaxValue: '10',
      salesTaxAmount: '0',
      finalAmount: '',
      salesEmployeeRemark: '',
    };
    const totals = calculateUpgradeTotals(draft);
    setUpgradeDraft({ ...draft, salesTaxAmount: String(totals.salesTaxAmount), finalAmount: String(totals.finalAmount) });
  };

  const handleUpgradeFieldChange = (key: string, value: string) => {
    setUpgradeDraft((current: any) => {
      if (!current) return current;
      const next = { ...current, [key]: value };
      const totals = calculateUpgradeTotals(next);
      return { ...next, salesTaxAmount: String(totals.salesTaxAmount), finalAmount: String(totals.finalAmount) };
    });
  };

  const submitUpgrade = async () => {
    if (!upgradeDraft) return;
    const amount = Number(upgradeDraft.upgradeAmount || 0);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid Upgrade Amount.');
      return;
    }

    try {
      const created = await companyService.createUpgrade({
        customerId: upgradeDraft.customerId,
        customerName: upgradeDraft.customerName,
        customerEmail: upgradeDraft.customerEmail,
        mobile: upgradeDraft.mobile,
        country: upgradeDraft.country,
        system: upgradeDraft.system,
        paymentMethod: upgradeDraft.paymentMethod,
        upgradeAmount: amount,
        salesTaxType: upgradeDraft.salesTaxType,
        salesTaxValue: Number(upgradeDraft.salesTaxValue || 0),
        salesTaxAmount: Number(upgradeDraft.salesTaxAmount || 0),
        finalAmount: Number(upgradeDraft.finalAmount || 0),
        salesEmployeeRemark: upgradeDraft.salesEmployeeRemark,
      });
      setUpgrades((current) => [created, ...current]);
      toast.success(`Upgrade #${created.upgradeNumber || 1} created successfully`);
      setUpgradeDraft(null);
      setSearchTerm('');
      setSearchResults([]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to create upgrade');
    }
  };

  const downloadCsv = () => {
    const rows = [
      ['Upgrade #', 'Customer', 'Customer ID', 'Email', 'Mobile', 'Country', 'System', 'Upgraded By', 'Amount', 'Sales Tax', 'Final Amount', 'Payment', 'Date'],
      ...filteredUpgrades.map((upgrade) => [
        String(upgrade.upgradeNumber || upgrade._id),
        upgrade.customerName || '—',
        upgrade.customerId || '—',
        upgrade.customerName ? '' : '',
        '',
        upgrade.country || '',
        upgrade.system || '',
        upgrade.upgradedByName || upgrade.salesEmployeeName || '—',
        String(upgrade.upgradeAmount || 0),
        String(upgrade.salesTaxAmount || 0),
        String(upgrade.finalAmount || 0),
        upgrade.paymentMethod || '',
        upgrade.createdAt ? new Date(upgrade.createdAt).toLocaleDateString() : '',
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'upgrades.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section className="min-h-full space-y-5 overflow-y-auto bg-slate-950 p-6 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><TrendingUp className="h-6 w-6 text-emerald-400" /> Upgrade</h1>
          <p className="text-sm text-slate-400">Search for existing customers and create an upgrade record without duplicating the customer.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Filtered revenue" value={formatCurrency(totalRevenue)} accent="text-emerald-400" />
        <Metric label="Upgrade records" value={filteredUpgrades.length} accent="text-indigo-400" />
        <Metric label="Average upgrade" value={formatCurrency(filteredUpgrades.length ? totalRevenue / filteredUpgrades.length : 0)} accent="text-amber-400" />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Customer Search & Upgrade</p>
            <p className="text-xs text-slate-400">Search across all employees and existing customer records to open the upgrade form with the customer details already filled.</p>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') void handleCustomerSearch(); }}
              placeholder="Search by customer name, email, mobile, customer ID, sale ID or lead ID"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            />
            <button onClick={() => void handleCustomerSearch()} disabled={searchLoading} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
              <Search className="mr-1 inline h-3.5 w-3.5" />{searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {searchResults.map((customer) => (
              <div key={`${customer.customerId || customer._id}-${customer.name}`} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{customer.name}</p>
                    <p className="text-[11px] text-slate-400">{customer.customerId || customer._id}</p>
                  </div>
                  <button onClick={() => openUpgradeModal(customer)} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white">Open upgrade</button>
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-slate-300">
                  <p><span className="text-slate-500">Email:</span> {customer.customerEmail || customer.email || '—'}</p>
                  <p><span className="text-slate-500">Mobile:</span> {customer.mobile || customer.alternateContactNo || customer.contactNo || '—'}</p>
                  <p><span className="text-slate-500">Country:</span> {customer.country || '—'}</p>
                  <p><span className="text-slate-500">System:</span> {customer.system || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {upgradeDraft && (
        <div className="rounded-xl border border-indigo-500/30 bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Upgrade customer</h2>
              <p className="text-sm text-slate-400">{upgradeDraft.customerName} · {upgradeDraft.customerId || 'Customer record'}</p>
            </div>
            <button type="button" onClick={() => setUpgradeDraft(null)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white"><X className="inline h-4 w-4" /></button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-xs text-slate-400"><span>Customer</span><input value={upgradeDraft.customerName} readOnly className={`${input} block w-full bg-slate-950/80`} /></label>
            <label className="space-y-1 text-xs text-slate-400"><span>Email</span><input value={upgradeDraft.customerEmail} readOnly className={`${input} block w-full bg-slate-950/80`} /></label>
            <label className="space-y-1 text-xs text-slate-400"><span>Mobile</span><input value={upgradeDraft.mobile} readOnly className={`${input} block w-full bg-slate-950/80`} /></label>
            <label className="space-y-1 text-xs text-slate-400"><span>Country</span><input value={upgradeDraft.country} readOnly className={`${input} block w-full bg-slate-950/80`} /></label>
            <label className="space-y-1 text-xs text-slate-400"><span>System</span><input value={upgradeDraft.system} readOnly className={`${input} block w-full bg-slate-950/80`} /></label>
            <label className="space-y-1 text-xs text-slate-400"><span>Payment Method</span><select value={upgradeDraft.paymentMethod} onChange={(event) => handleUpgradeFieldChange('paymentMethod', event.target.value)} className={`${select} block w-full`}>
              {['Card', 'Check', 'Wire Transfer', 'Cash', 'UPI', 'Bank Transfer', 'Online', 'Other'].map((option) => <option key={option} value={option}>{option}</option>)}
            </select></label>
            <label className="space-y-1 text-xs text-slate-400"><span>Tax Type</span><select value={upgradeDraft.salesTaxType} onChange={(event) => handleUpgradeFieldChange('salesTaxType', event.target.value)} className={`${select} block w-full`}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="DIRECT_AMOUNT">Direct Amount</option>
            </select></label>
            <label className="space-y-1 text-xs text-slate-400"><span>Tax Value</span><input type="number" value={upgradeDraft.salesTaxValue} onChange={(event) => handleUpgradeFieldChange('salesTaxValue', event.target.value)} className={`${input} block w-full`} /></label>
            <label className="space-y-1 text-xs text-slate-400"><span>Upgrade Amount</span><input type="number" min="0" value={upgradeDraft.upgradeAmount} onChange={(event) => handleUpgradeFieldChange('upgradeAmount', event.target.value)} className={`${input} block w-full`} /></label>
            <label className="space-y-1 text-xs text-slate-400"><span>Sales Tax Amount</span><input value={upgradeDraft.salesTaxAmount} readOnly className={`${input} block w-full bg-slate-950/80`} /></label>
            <label className="space-y-1 text-xs text-slate-400"><span>Final Amount</span><input value={upgradeDraft.finalAmount} readOnly className={`${input} block w-full bg-slate-950/80`} /></label>
            <label className="space-y-1 text-xs text-slate-400 md:col-span-2"><span>Sales Employee Remark</span><textarea value={upgradeDraft.salesEmployeeRemark} onChange={(event) => handleUpgradeFieldChange('salesEmployeeRemark', event.target.value)} rows={3} className={`${input} block w-full resize-none`} /></label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => void submitUpgrade()} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Save upgrade</button>
            <button type="button" onClick={() => setUpgradeDraft(null)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <label className="text-[11px] text-slate-400">Upgraded by<select value={filters.employee} onChange={(event) => setFilters({ ...filters, employee: event.target.value })} className={`${select} ml-1`}><option value="">Everyone</option>{employees.map((employee) => <option key={employee._id} value={employee.name}>{employee.name} · {employee.role}</option>)}</select></label>
        <label className="text-[11px] text-slate-400">Month & year<input type="month" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value, from: '', to: '' })} className={`${input} ml-1`} /></label>
        <label className="text-[11px] text-slate-400">Start date<input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value, month: '' })} className={`${input} ml-1`} /></label>
        <label className="text-[11px] text-slate-400">End date<input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value, month: '' })} className={`${input} ml-1`} /></label>
        <button onClick={() => setFilters(emptyFilters)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white">Clear</button>
        <button onClick={downloadCsv} className="ml-auto flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Export CSV</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              {['Upgrade #', 'Customer', 'Contact', 'Country / System', 'Upgraded by', 'Tax', 'Final Amount', 'Created'].map((heading) => (
                <th key={heading} className="p-3">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredUpgrades.map((upgrade) => (
              <tr key={upgrade._id} className="hover:bg-slate-900/40 transition-colors">
                <td className="p-3 font-semibold text-white">#{upgrade.upgradeNumber || 1}</td>
                <td className="p-3">
                  <div className="font-medium text-white">{upgrade.customerName}</div>
                  <div className="text-[10px] text-slate-500">{upgrade.customerId || 'Customer record'}</div>
                </td>
                <td className="p-3">
                  <div>{upgrade.customerEmail || '—'}</div>
                  <div className="text-emerald-400">{upgrade.mobile || '—'}</div>
                </td>
                <td className="p-3">
                  <div><Building2 className="mr-1 inline h-3.5 w-3.5 text-slate-400" />{upgrade.country || '—'}</div>
                  <div className="text-cyan-400">{upgrade.system || '—'}</div>
                </td>
                <td className="p-3"><UserRound className="mr-1 inline h-3.5 w-3.5 text-slate-400" />{upgrade.upgradedByName || upgrade.salesEmployeeName || '—'}</td>
                <td className="p-3"><div className="font-medium text-slate-200">{formatCurrency(Number(upgrade.salesTaxAmount || 0))}</div><div className="text-[10px] text-slate-500">{upgrade.salesTaxType || 'PERCENTAGE'}</div></td>
                <td className="p-3 text-emerald-400 font-mono font-bold">{formatCurrency(Number(upgrade.finalAmount || 0))}</td>
                <td className="p-3 text-slate-400">{upgrade.createdAt ? new Date(upgrade.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold text-white ${accent}`}>{value}</p>
    </div>
  );
}

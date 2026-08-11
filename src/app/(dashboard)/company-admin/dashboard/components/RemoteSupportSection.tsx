'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Filter, LifeBuoy, ShieldCheck, Flag, Trash2, Clock3, Pencil, User, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, ICompanyEmployee, IRemoteSupportRecord } from '@/services/companyService';
import { getBusinessDateString, matchesBusinessDateFilters } from '@/lib/businessDate';

const input = 'rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500';

type Filters = { status: string; customer: string; salesEmployee: string; techSupportEmployee: string; month: string; from: string; to: string };
const emptyFilters: Filters = { status: '', customer: '', salesEmployee: '', techSupportEmployee: '', month: '', from: '', to: '' };

type RemoteSupportSectionProps = {
  role?: string;
  isAdmin?: boolean;
};

export function RemoteSupportSection({ role, isAdmin = false }: RemoteSupportSectionProps) {
  const [records, setRecords] = useState<IRemoteSupportRecord[]>([]);
  const [employees, setEmployees] = useState<ICompanyEmployee[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<IRemoteSupportRecord | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<'PENDING' | 'IN_PROGRESS' | 'SUCCESSFUL' | 'FAILED'>('IN_PROGRESS');
  const [assignTechId, setAssignTechId] = useState('');
  const [failedReason, setFailedReason] = useState('');

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In progress' },
    { value: 'SUCCESSFUL', label: 'Successful' },
    { value: 'FAILED', label: 'Failed' },
  ];

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.customer) params.customerName = filters.customer;
      if (filters.salesEmployee) params.salesEmployeeName = filters.salesEmployee;
      if (filters.techSupportEmployee) params.techSupportEmployeeName = filters.techSupportEmployee;
      if (filters.from) params.fromDate = filters.from;
      if (filters.to) params.toDate = filters.to;
      if (filters.month) {
        params.fromDate = `${filters.month}-01`;
        params.toDate = new Date(new Date(`${filters.month}-01`).getFullYear(), new Date(`${filters.month}-01`).getMonth() + 1, 0).toISOString().slice(0, 10);
      }

      const [recordsResponse, employeesResponse] = await Promise.all([
        companyService.getRemoteSupport(params),
        isAdmin ? companyService.getEmployees() : Promise.resolve([]),
      ]);

      setRecords(recordsResponse);
      if (isAdmin) setEmployees(employeesResponse);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load remote support requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, role, isAdmin]);

  const summary = useMemo(() => {
    const total = records.length;
    const successful = records.filter((record) => record.status === 'SUCCESSFUL').length;
    const failed = records.filter((record) => record.status === 'FAILED').length;
    const pending = records.filter((record) => record.status === 'PENDING').length;
    const inProgress = records.filter((record) => record.status === 'IN_PROGRESS').length;
    return { total, successful, failed, pending, inProgress, successRate: total ? Math.round((successful / total) * 100) : 0 };
  }, [records]);

  const handleSelectRecord = (record: IRemoteSupportRecord) => {
    setSelectedRecord(record);
    setStatusUpdate(record.status as any);
    setAssignTechId('');
    setFailedReason((record as any).failedReason || '');
  };

  const handleSaveRecord = async () => {
    if (!selectedRecord) return;
    if (statusUpdate === 'FAILED' && !failedReason.trim()) {
      toast.error('Failed reason is required');
      return;
    }

    try {
      await companyService.updateRemoteSupport(selectedRecord._id, {
        status: statusUpdate,
        techSupportEmployeeName: assignTechId ? employees.find((employee) => employee._id === assignTechId)?.name : undefined,
        failedReason: statusUpdate === 'FAILED' ? failedReason.trim() : undefined,
      });
      setSelectedRecord(null);
      setFailedReason('');
      setAssignTechId('');
      toast.success('Remote support request updated');
      await loadRecords();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to update request');
    }
  };

  const handleDeleteRecord = async (record: IRemoteSupportRecord) => {
    if (!window.confirm('Delete this remote support request?')) return;
    try {
      await companyService.deleteRemoteSupport(record._id);
      toast.success('Remote support request deleted');
      if (selectedRecord?._id === record._id) setSelectedRecord(null);
      await loadRecords();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to delete request');
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'IN_PROGRESS': return 'In progress';
      case 'SUCCESSFUL': return 'Successful';
      case 'FAILED': return 'Failed';
      default: return status;
    }
  };

  const canManage = isAdmin || role === 'TECH_SUPPORT' || role === 'SALES';

  return (
    <section className="min-h-full space-y-5 overflow-y-auto bg-slate-950 p-6 text-slate-100">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white"><LifeBuoy className="h-6 w-6 text-cyan-400" /> Remote Support Requests</h1>
          <p className="text-sm text-slate-400">Track support requests, filter by employee, status, customer, and date range.</p>
        </div>
        <button onClick={() => downloadCsv(records)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"><Download className="h-4 w-4" />Export CSV</button>
      </header>

      <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-[11px] text-slate-400">Status<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className={`${input} w-full`}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select></label>
          <label className="space-y-1 text-[11px] text-slate-400">Customer<input value={filters.customer} onChange={(event) => setFilters({ ...filters, customer: event.target.value })} placeholder="Search customer" className={`${input} w-full`} /></label>
          {isAdmin && <label className="space-y-1 text-[11px] text-slate-400">Sales employee<select value={filters.salesEmployee} onChange={(event) => setFilters({ ...filters, salesEmployee: event.target.value })} className={`${input} w-full`}><option value="">Everyone</option>{employees.map((employee) => <option key={employee._id} value={employee.name}>{employee.name} · {employee.role}</option>)}</select></label>}
          {isAdmin && <label className="space-y-1 text-[11px] text-slate-400">Tech support<select value={filters.techSupportEmployee} onChange={(event) => setFilters({ ...filters, techSupportEmployee: event.target.value })} className={`${input} w-full`}><option value="">Everyone</option>{employees.filter((employee) => employee.role === 'TECH_SUPPORT').map((employee) => <option key={employee._id} value={employee.name}>{employee.name}</option>)}</select></label>}
          <label className="space-y-1 text-[11px] text-slate-400">Month & year<input type="month" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value, from: '', to: '' })} className={`${input} w-full`} /></label>
          <label className="space-y-1 text-[11px] text-slate-400">Start date<input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value, month: '' })} className={`${input} w-full`} /></label>
          <label className="space-y-1 text-[11px] text-slate-400">End date<input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value, month: '' })} className={`${input} w-full`} /></label>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryMetric label="Total requests" value={summary.total} />
            <SummaryMetric label="Success" value={summary.successful} />
            <SummaryMetric label="Failed" value={summary.failed} />
            <SummaryMetric label="Pending / In progress" value={`${summary.pending} / ${summary.inProgress}`} />
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Success rate</p>
            <p className="mt-2 text-3xl font-bold text-white">{summary.successRate}%</p>
          </div>
        </div>
      </div>

      {selectedRecord && (
        <section className="rounded-3xl border border-indigo-500/20 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Manage request</h2>
              <p className="text-sm text-slate-400">Update status, assign tech support, or record a failure reason.</p>
            </div>
            <button onClick={() => setSelectedRecord(null)} className="text-xs uppercase tracking-[0.24em] text-slate-400 hover:text-white">Close</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[11px] text-slate-400">Customer</p>
              <p className="mt-2 text-white">{selectedRecord.customerName}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Issue</p>
              <p className="mt-2 text-white">{selectedRecord.issueReason}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Current status</p>
              <p className="mt-2 text-white">{statusLabel(selectedRecord.status)}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-[11px] text-slate-400">Status<select value={statusUpdate} onChange={(event) => setStatusUpdate(event.target.value as any)} className={`${input} w-full`}>
                {statusOptions.filter((option) => option.value).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select></label>
            <label className="space-y-1 text-[11px] text-slate-400">Assign tech support<select value={assignTechId} onChange={(event) => setAssignTechId(event.target.value)} className={`${input} w-full`}>
                <option value="">Leave unchanged</option>
                {employees.filter((employee) => employee.role === 'TECH_SUPPORT').map((employee) => <option key={employee._id} value={employee._id}>{employee.name}</option>)}
              </select></label>
            {statusUpdate === 'FAILED' && <label className="space-y-1 text-[11px] text-slate-400">Failed reason<textarea value={failedReason} onChange={(event) => setFailedReason(event.target.value)} className={`${input} min-h-[120px] resize-none w-full`} /> </label>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={handleSaveRecord} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">Save changes</button>
            <button onClick={() => { setSelectedRecord(null); setFailedReason(''); }} className="rounded-lg bg-slate-700 px-4 py-2 text-xs text-white">Cancel</button>
          </div>
        </section>
      )}

      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400"><tr>
            <th className="p-3">Customer</th>
            <th className="p-3">Date</th>
            <th className="p-3">Status</th>
            <th className="p-3">Sales rep</th>
            <th className="p-3">Tech support</th>
            <th className="p-3">Issue</th>
            <th className="p-3">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-slate-400">Loading remote support requests...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-slate-400">No remote support requests found.</td></tr>
            ) : records.map((record) => (
              <tr key={record._id} className="hover:bg-slate-950/50">
                <td className="p-3 font-semibold text-white">{record.customerName}<span className="block text-slate-500">{record.customerContact}</span></td>
                <td className="p-3">{new Date(record.dateTime).toLocaleDateString()}</td>
                <td className="p-3"><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${record.status === 'SUCCESSFUL' ? 'bg-emerald-500/10 text-emerald-300' : record.status === 'FAILED' ? 'bg-rose-500/10 text-rose-300' : record.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-300' : 'bg-slate-700 text-slate-200'}`}>{statusLabel(record.status)}</span></td>
                <td className="p-3">{record.salesEmployeeName}</td>
                <td className="p-3">{record.techSupportEmployeeName || 'Unassigned'}</td>
                <td className="p-3 text-slate-300 max-w-xs break-words">{record.issueReason}</td>
                <td className="p-3 space-x-2">
                  {canManage && <button onClick={() => handleSelectRecord(record)} className="rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white">Manage</button>}
                  {canManage && <button onClick={() => void handleDeleteRecord(record)} className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white">Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function downloadCsv(records: IRemoteSupportRecord[]) {
  const rows = [['Customer', 'Contact', 'Sales rep', 'Tech support', 'Status', 'Date', 'Issue']];
  const text = rows.concat(records.map((record) => [record.customerName, record.customerContact, record.salesEmployeeName, record.techSupportEmployeeName || 'Unassigned', record.status, new Date(record.dateTime).toLocaleDateString(), record.issueReason])).map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  link.download = 'remote-support-requests.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

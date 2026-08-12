'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, LifeBuoy, Check, X, CheckCircle2, XCircle, UserCheck, ShieldCheck, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, ICompanyEmployee, IRemoteSupportRecord } from '@/services/companyService';

const inputStyle = 'rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500';

type Filters = { status: string; customer: string; salesEmployee: string; techSupportEmployee: string; month: string; from: string; to: string };
const emptyFilters: Filters = { status: '', customer: '', salesEmployee: '', techSupportEmployee: '', month: '', from: '', to: '' };

// Quick date range helpers
function toDateStr(d: Date) { return d.toISOString().slice(0, 10); }
function quickRange(preset: 'today' | 'yesterday' | 'week' | 'month'): { from: string; to: string } {
  const now = new Date();
  if (preset === 'today') { const s = toDateStr(now); return { from: s, to: s }; }
  if (preset === 'yesterday') { const y = new Date(now); y.setDate(y.getDate() - 1); const s = toDateStr(y); return { from: s, to: s }; }
  if (preset === 'week') { const start = new Date(now); start.setDate(now.getDate() - now.getDay()); return { from: toDateStr(start), to: toDateStr(now) }; }
  // month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toDateStr(start), to: toDateStr(now) };
}

type TabType = 'all' | 'PENDING' | 'IN_PROGRESS' | 'SUCCESSFUL' | 'FAILED' | 'REJECTED';

type RemoteSupportSectionProps = {
  role?: string;
  isAdmin?: boolean;
  records?: IRemoteSupportRecord[];
  loading?: boolean;
};

export function RemoteSupportSection({ role, isAdmin = false }: RemoteSupportSectionProps) {
  const [records, setRecords] = useState<IRemoteSupportRecord[]>([]);
  const [employees, setEmployees] = useState<ICompanyEmployee[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);

  // Modals for actions
  const [rejectingRecord, setRejectingRecord] = useState<IRemoteSupportRecord | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [failingRecord, setFailingRecord] = useState<IRemoteSupportRecord | null>(null);
  const [failureReasonInput, setFailureReasonInput] = useState('');
  const [assigningRecord, setAssigningRecord] = useState<IRemoteSupportRecord | null>(null);
  const [selectedTechId, setSelectedTechId] = useState('');

  const loadData = async () => {
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
        isAdmin || role === 'MANAGER' ? companyService.getEmployees() : Promise.resolve([]),
      ]);

      setRecords(recordsResponse);
      if (employeesResponse.length) setEmployees(employeesResponse);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load remote support requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, role, isAdmin]);

  const summary = useMemo(() => {
    const total = records.length;
    const pending = records.filter((record) => record.status === 'PENDING').length;
    const accepted = records.filter((record) => record.status === 'IN_PROGRESS').length;
    const successful = records.filter((record) => record.status === 'SUCCESSFUL').length;
    const failed = records.filter((record) => record.status === 'FAILED').length;
    const rejected = records.filter((record) => record.status === 'REJECTED').length;
    return { total, pending, accepted, successful, failed, rejected, successRate: total ? Math.round((successful / total) * 100) : 0 };
  }, [records]);

  const filteredByTabRecords = useMemo(() => {
    if (activeTab === 'all') return records;
    return records.filter((record) => record.status === activeTab);
  }, [records, activeTab]);

  // Actions
  const handleAccept = async (record: IRemoteSupportRecord) => {
    try {
      await companyService.acceptRemoteSupport(record._id);
      toast.success(`Support request for ${record.customerName} accepted.`);
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to accept support request');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRecord) return;
    if (!rejectionReasonInput.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    try {
      await companyService.rejectRemoteSupport(rejectingRecord._id, rejectionReasonInput.trim());
      toast.success('Support request rejected.');
      setRejectingRecord(null);
      setRejectionReasonInput('');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to reject support request');
    }
  };

  const handleSuccessful = async (record: IRemoteSupportRecord) => {
    try {
      await companyService.completeRemoteSupport(record._id, { status: 'SUCCESSFUL' });
      toast.success('Remote support marked as SUCCESSFUL!');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to mark support as successful');
    }
  };

  const handleConfirmFailed = async () => {
    if (!failingRecord) return;
    if (!failureReasonInput.trim()) {
      toast.error('Failure reason is required.');
      return;
    }
    try {
      await companyService.completeRemoteSupport(failingRecord._id, { status: 'FAILED', failedReason: failureReasonInput.trim() });
      toast.success('Remote support marked as FAILED.');
      setFailingRecord(null);
      setFailureReasonInput('');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to mark support as failed');
    }
  };

  const handleConfirmAssign = async () => {
    if (!assigningRecord) return;
    if (!selectedTechId) {
      toast.error('Select a Tech Support employee.');
      return;
    }
    try {
      await companyService.assignRemoteSupport(assigningRecord._id, selectedTechId);
      toast.success('Support assigned successfully.');
      setAssigningRecord(null);
      setSelectedTechId('');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to assign support request');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300 border border-amber-500/20">Pending</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-300 border border-indigo-500/20">Accepted / In Progress</span>;
      case 'SUCCESSFUL':
        return <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-500/20">Successful</span>;
      case 'FAILED':
        return <span className="inline-flex rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-300 border border-rose-500/20">Failed</span>;
      case 'REJECTED':
        return <span className="inline-flex rounded-full bg-slate-700/50 px-3 py-1 text-[11px] font-semibold text-slate-300 border border-slate-600/50">Rejected</span>;
      default:
        return <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-300">{status}</span>;
    }
  };

  const isTechSupport = role === 'TECH_SUPPORT';
  const isManager = role === 'MANAGER';
  const isSales = role === 'SALES';
  const canAssign = isAdmin || isManager;

  return (
    <section className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Remote Support Management</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {isTechSupport ? 'Manage and resolve your assigned technical support tickets.' : 'Monitor and manage remote assistance requests across sales and tech teams.'}
          </p>
        </div>
        <button onClick={() => downloadCsv(records)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </header>

      {/* Overview Cards */}
      <div className="grid gap-3 sm:grid-cols-6">
        <MetricCard label="Total Support" value={summary.total} color="border-slate-800 text-white" />
        <MetricCard label="Pending" value={summary.pending} color="border-amber-500/30 text-amber-300" />
        <MetricCard label="Accepted" value={summary.accepted} color="border-indigo-500/30 text-indigo-300" />
        <MetricCard label="Successful" value={summary.successful} color="border-emerald-500/30 text-emerald-300" />
        <MetricCard label="Failed" value={summary.failed} color="border-rose-500/30 text-rose-300" />
        <MetricCard label="Rejected" value={summary.rejected} color="border-slate-700 text-slate-400" />
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        {/* Quick day-range buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">Quick filter:</span>
          {(['today', 'yesterday', 'week', 'month'] as const).map((preset) => {
            const labels: Record<string, string> = { today: 'Today', yesterday: 'Yesterday', week: 'This Week', month: 'This Month' };
            const range = quickRange(preset);
            const active = filters.from === range.from && filters.to === range.to;
            return (
              <button
                key={preset}
                onClick={() => setFilters({ ...filters, month: '', from: range.from, to: range.to })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {labels[preset]}
              </button>
            );
          })}
          {(filters.from || filters.to || filters.month) && (
            <button
              onClick={() => setFilters({ ...filters, from: '', to: '', month: '' })}
              className="rounded-full px-3 py-1 text-xs font-semibold bg-slate-700 text-slate-400 hover:bg-rose-600 hover:text-white transition-colors"
            >
              ✕ Clear dates
            </button>
          )}
        </div>

        {/* Text / Employee filters + From/To date range */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-[11px] text-slate-400">
            <span>Customer Name</span>
            <input value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} placeholder="Search customer" className={`${inputStyle} w-full`} />
          </label>
          {(isAdmin || isManager) && (
            <label className="space-y-1 text-[11px] text-slate-400">
              <span>Sales Employee</span>
              <select value={filters.salesEmployee} onChange={(e) => setFilters({ ...filters, salesEmployee: e.target.value })} className={`${inputStyle} w-full`}>
                <option value="">All Sales Reps</option>
                {employees.filter((emp) => emp.role === 'SALES').map((emp) => (
                  <option key={emp._id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </label>
          )}
          {(isAdmin || isManager) && (
            <label className="space-y-1 text-[11px] text-slate-400">
              <span>Tech Support Employee</span>
              <select value={filters.techSupportEmployee} onChange={(e) => setFilters({ ...filters, techSupportEmployee: e.target.value })} className={`${inputStyle} w-full`}>
                <option value="">All Tech Support</option>
                {employees.filter((emp) => emp.role === 'TECH_SUPPORT').map((emp) => (
                  <option key={emp._id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="space-y-1 text-[11px] text-slate-400">
            <span>Month</span>
            <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value, from: '', to: '' })} className={`${inputStyle} w-full`} />
          </label>
          <label className="space-y-1 text-[11px] text-slate-400">
            <span>From Date</span>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value, month: '' })} className={`${inputStyle} w-full`} />
          </label>
          <label className="space-y-1 text-[11px] text-slate-400">
            <span>To Date</span>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value, month: '' })} className={`${inputStyle} w-full`} />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
        <TabButton label={`Total Support (${summary.total})`} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
        <TabButton label={`Pending (${summary.pending})`} active={activeTab === 'PENDING'} onClick={() => setActiveTab('PENDING')} />
        <TabButton label={`Accepted (${summary.accepted})`} active={activeTab === 'IN_PROGRESS'} onClick={() => setActiveTab('IN_PROGRESS')} />
        <TabButton label={`Successful (${summary.successful})`} active={activeTab === 'SUCCESSFUL'} onClick={() => setActiveTab('SUCCESSFUL')} />
        <TabButton label={`Failed (${summary.failed})`} active={activeTab === 'FAILED'} onClick={() => setActiveTab('FAILED')} />
        <TabButton label={`Rejected (${summary.rejected})`} active={activeTab === 'REJECTED'} onClick={() => setActiveTab('REJECTED')} />
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4 font-semibold">Customer Details</th>
              <th className="p-4 font-semibold">System & Location</th>
              <th className="p-4 font-semibold">Sales Employee</th>
              <th className="p-4 font-semibold">Tech Support</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Created Date</th>
              <th className="p-4 font-semibold">Reason / Details</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-400">Loading remote support requests...</td>
              </tr>
            ) : filteredByTabRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <p className="text-sm font-semibold text-slate-300">No support records found</p>
                  <p className="mt-1 text-xs text-slate-500">No requests match the selected tab or filter criteria.</p>
                </td>
              </tr>
            ) : (
              filteredByTabRecords.map((record) => (
                <tr key={record._id} className="hover:bg-slate-950/60 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-white">{record.customerName}</p>
                    <p className="text-[11px] text-slate-400">{record.customerContact}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-200">{record.system || 'System: N/A'}</p>
                    <p className="text-[11px] text-slate-500">{record.country || 'N/A'}</p>
                  </td>
                  <td className="p-4 font-medium text-slate-200">{record.salesEmployeeName}</td>
                  <td className="p-4 font-medium text-slate-200">{record.techSupportEmployeeName || <span className="text-slate-500 italic">Unassigned</span>}</td>
                  <td className="p-4">{statusBadge(record.status)}</td>
                  <td className="p-4 text-slate-400">{new Date(record.dateTime).toLocaleDateString()} {new Date(record.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-4 max-w-xs break-words">
                    <p className="text-slate-300">{record.issueReason}</p>
                    {record.status === 'FAILED' && record.failedReason && (
                      <p className="mt-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-[11px] text-rose-300">Failed Reason: {record.failedReason}</p>
                    )}
                    {record.status === 'REJECTED' && record.rejectedReason && (
                      <p className="mt-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-1.5 text-[11px] text-amber-300">Rejected Reason: {record.rejectedReason}</p>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {/* Tech Support Actions */}
                    {record.status === 'PENDING' && (isTechSupport || isAdmin) && (
                      <button onClick={() => void handleAccept(record)} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow">
                        <Check className="mr-1 inline h-3.5 w-3.5" /> Accept
                      </button>
                    )}
                    {record.status === 'PENDING' && (isTechSupport || isAdmin) && (
                      <button onClick={() => { setRejectingRecord(record); setRejectionReasonInput(''); }} className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 shadow">
                        <X className="mr-1 inline h-3.5 w-3.5" /> Reject
                      </button>
                    )}
                    {record.status === 'IN_PROGRESS' && (isTechSupport || isAdmin) && (
                      <button onClick={() => void handleSuccessful(record)} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow">
                        <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Successful
                      </button>
                    )}
                    {record.status === 'IN_PROGRESS' && (isTechSupport || isAdmin) && (
                      <button onClick={() => { setFailingRecord(record); setFailureReasonInput(''); }} className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 shadow">
                        <XCircle className="mr-1 inline h-3.5 w-3.5" /> Failed
                      </button>
                    )}

                    {/* Admin/Manager Assign Action */}
                    {record.status === 'PENDING' && canAssign && (
                      <button onClick={() => { setAssigningRecord(record); setSelectedTechId(''); }} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow">
                        <UserCheck className="mr-1 inline h-3.5 w-3.5" /> Assign To
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Reject Support Request</h2>
            <p className="text-xs text-slate-400">Customer: <span className="font-semibold text-white">{rejectingRecord.customerName}</span></p>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>Rejection Reason <span className="text-rose-400">*</span></span>
              <textarea autoFocus value={rejectionReasonInput} onChange={(e) => setRejectionReasonInput(e.target.value)} rows={3} placeholder="State reason for rejecting this support request..." className={`${inputStyle} w-full resize-none`} />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejectingRecord(null)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs text-slate-300">Cancel</button>
              <button onClick={handleConfirmReject} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Failed Modal */}
      {failingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Mark Support as Failed</h2>
            <p className="text-xs text-slate-400">Customer: <span className="font-semibold text-white">{failingRecord.customerName}</span></p>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>Failure Reason <span className="text-rose-400">*</span></span>
              <textarea autoFocus value={failureReasonInput} onChange={(e) => setFailureReasonInput(e.target.value)} rows={3} placeholder="State reason why technical support failed..." className={`${inputStyle} w-full resize-none`} />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setFailingRecord(null)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs text-slate-300">Cancel</button>
              <button onClick={handleConfirmFailed} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white">Submit Failure Reason</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assigningRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Assign Support Request</h2>
            <p className="text-xs text-slate-400">Customer: <span className="font-semibold text-white">{assigningRecord.customerName}</span></p>
            <label className="block space-y-1 text-xs text-slate-300">
              <span>Select Tech Support Employee</span>
              <select value={selectedTechId} onChange={(e) => setSelectedTechId(e.target.value)} className={`${inputStyle} w-full`}>
                <option value="">Select Employee...</option>
                {employees.filter((emp) => emp.role === 'TECH_SUPPORT').map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAssigningRecord(null)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs text-slate-300">Cancel</button>
              <button onClick={handleConfirmAssign} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">Assign Employee</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl border bg-slate-900/70 p-4 ${color}`}>
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      {label}
    </button>
  );
}

function downloadCsv(records: IRemoteSupportRecord[]) {
  const rows = [['Customer', 'Contact', 'System', 'Country', 'Sales Employee', 'Tech Support', 'Status', 'Date', 'Issue Reason', 'Reject/Failed Reason']];
  const text = rows
    .concat(
      records.map((record) => [
        record.customerName,
        record.customerContact,
        record.system || '',
        record.country || '',
        record.salesEmployeeName,
        record.techSupportEmployeeName || 'Unassigned',
        record.status,
        new Date(record.dateTime).toLocaleDateString(),
        record.issueReason,
        record.failedReason || record.rejectedReason || '',
      ])
    )
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  link.download = 'remote-support-requests.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

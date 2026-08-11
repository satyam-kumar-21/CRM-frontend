'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, ILeaveRecord } from '@/services/companyService';
import { getBusinessMonthString } from '@/lib/businessDate';

export function LeaveSection({ readOnly = false }: { readOnly?: boolean }) {
  const [month, setMonth] = useState(getBusinessMonthString());
  const [records, setRecords] = useState<ILeaveRecord[]>([]);
  const [leaveType, setLeaveType] = useState<'CASUAL' | 'SICK' | 'MATERNITY' | 'ANNUAL'>('CASUAL');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const loadRecords = () => {
    companyService.getLeave(month)
      .then((data) => {
        setRecords(data);
        if (readOnly) {
          // update dashboard notification counts / leave counts
          queryClient.invalidateQueries({ queryKey: ['companyDashboard'] });
          queryClient.invalidateQueries({ queryKey: ['employeeDashboard'] });
        }
      })
      .catch(() => toast.error('Unable to load leave'));
  };

  useEffect(() => {
    loadRecords();
  }, [month]);

  const createRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a reason for the leave.');
      return;
    }
    setIsSubmitting(true);
    try {
      await companyService.createLeave({ leaveType, startDate, endDate, reason: reason.trim() });
      setReason('');
      setLeaveType('CASUAL');
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
      toast.success('Leave request submitted successfully');
      loadRecords();
    } catch {
      toast.error('Unable to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = async (record: ILeaveRecord, status: string, rejectReason?: string) => {
    try {
      const item = await companyService.updateLeaveStatus(record._id, status, rejectReason);
      setRecords((current) => current.map((entry) => entry._id === item._id ? item : entry));
    } catch {
      toast.error('Unable to update leave');
    }
  };

  const rejectLeave = async (record: ILeaveRecord) => {
    const reason = window.prompt('Enter reason for rejecting this leave request:');
    if (!reason?.trim()) {
      toast.error('Reject reason is required.');
      return;
    }
    await update(record, 'REJECTED', reason.trim());
  };

  return <section className="min-h-full space-y-5 overflow-y-auto bg-slate-950 p-6 text-slate-100"><header className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><CalendarDays className="h-6 w-6 text-amber-400" /> {readOnly ? 'My Leave' : 'Leave Management'}</h1><p className="text-sm text-slate-400">Leave records for the selected month.</p></div><label className="text-xs text-slate-400">Month & year<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="ml-2 mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white sm:mt-0" /></label></header>{readOnly && <form onSubmit={createRequest} className="grid gap-3 rounded-xl border border-indigo-500/30 bg-slate-900 p-4"><div className="grid gap-3 md:grid-cols-2"><label className="text-xs text-slate-400">Leave type<select value={leaveType} onChange={(event) => setLeaveType(event.target.value as any)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"><option value="CASUAL">CASUAL</option><option value="SICK">SICK</option><option value="MATERNITY">MATERNITY</option><option value="ANNUAL">ANNUAL</option></select></label><label className="text-xs text-slate-400">Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label><label className="text-xs text-slate-400">End date<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label></div><label className="text-xs text-slate-400">Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label><button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700">{isSubmitting ? 'Submitting...' : 'Submit leave request'}</button></form>}<div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs text-slate-300"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Employee</th><th className="p-3">Type</th><th className="p-3">Start</th><th className="p-3">End</th><th className="p-3">Status</th>{!readOnly && <th className="p-3">Action</th>}</tr></thead><tbody className="divide-y divide-slate-800">{records.map((record) => <tr key={record._id}><td className="p-3 text-white">{typeof record.employeeId === 'string' ? record.employeeId : record.employeeId.name}</td><td className="p-3">{record.leaveType}</td><td className="p-3">{new Date(record.startDate).toLocaleDateString()}</td><td className="p-3">{new Date(record.endDate).toLocaleDateString()}</td><td className="p-3"><div className="space-y-1"><span>{record.status}</span>{record.status === 'REJECTED' && record.rejectReason ? <p className="text-[11px] text-rose-300">Reason: {record.rejectReason}</p> : null}</div></td>{!readOnly && <td className="p-3">{record.status === 'PENDING' ? <div className="flex gap-2"><button onClick={() => void update(record, 'APPROVED')} className="rounded-lg bg-emerald-500 px-2 py-1 text-white">Approve</button><button onClick={() => void rejectLeave(record)} className="rounded-lg bg-rose-500 px-2 py-1 text-white">Reject</button></div> : <span className="text-slate-400">No action</span>}</td>}</tr>)}</tbody></table></div></section>;
}

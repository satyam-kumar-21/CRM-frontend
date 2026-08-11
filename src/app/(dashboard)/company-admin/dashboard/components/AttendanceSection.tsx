'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Download } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, IAttendanceRecord } from '@/services/companyService';
import { getBusinessMonthEndString } from '@/lib/businessDate';

type AttendanceSectionProps = { readOnly?: boolean };

const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '-';
const employeeName = (record: IAttendanceRecord) => typeof record.employeeId === 'string' ? record.employeeId : `${record.employeeId.name} (${record.employeeId.employeeId})`;

export function AttendanceSection({ readOnly = false }: AttendanceSectionProps) {
  const [records, setRecords] = useState<IAttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Array<{ _id: string; name: string; employeeId: string; role: string }>>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [month, setMonth] = useState('');

  const load = async () => {
    try {
      setRecords(await companyService.getAttendance({
        employeeId: employeeId || undefined,
        from: month ? `${month}-01` : from || undefined,
        to: month ? getBusinessMonthEndString(month) : to || undefined,
      }));
    } catch {
      toast.error('Unable to load attendance');
    }
  };
  useEffect(() => { void load(); if (!readOnly) companyService.getAttendanceEmployees().then(setEmployees).catch(() => toast.error('Unable to load employees')); }, [readOnly]);

  const download = () => {
    const rows = [['Employee', 'Date', 'Check in', 'Check out', 'Status', 'Work hours'], ...records.map((record) => [employeeName(record), new Date(record.date).toLocaleDateString(), formatTime(record.checkIn), formatTime(record.checkOut), record.status, String(record.workHours || 0)])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'attendance.csv'; link.click(); URL.revokeObjectURL(link.href);
  };
  const totalHours = useMemo(() => records.reduce((sum, record) => sum + (record.workHours || 0), 0), [records]);

  return <div className="min-h-full space-y-5 overflow-y-auto bg-slate-950 p-6 text-slate-100"><header className="flex items-center justify-between border-b border-slate-800 pb-4"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><CalendarCheck className="h-6 w-6 text-emerald-400" /> {readOnly ? 'My Attendance' : 'Attendance'}</h1><p className="text-sm text-slate-400">{readOnly ? 'Your check-in and checkout history.' : 'Review and export attendance records.'}</p></div>{!readOnly && <button onClick={download} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Download className="h-4 w-4" /> Export CSV</button>}</header>
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"><label className="space-y-1 text-xs text-slate-400">Employee{!readOnly && <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"><option value="">All employees</option>{employees.map((item) => <option key={item._id} value={item._id}>{item.name} · {item.role}</option>)}</select>}</label><label className="space-y-1 text-xs text-slate-400">Month<input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setFrom(''); setTo(''); }} className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /></label><label className="space-y-1 text-xs text-slate-400">From<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setMonth(''); }} className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /></label><label className="space-y-1 text-xs text-slate-400">To<input type="date" value={to} onChange={(event) => { setTo(event.target.value); setMonth(''); }} className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /></label><button onClick={() => void load()} className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold text-white">Filter</button><span className="ml-auto text-xs text-slate-400">{records.length} records · {totalHours.toFixed(2)} hours</span></div>
    <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs text-slate-300"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Employee</th><th className="p-3">Date</th><th className="p-3">Check in</th><th className="p-3">Check out</th><th className="p-3">Status</th><th className="p-3">Hours</th></tr></thead><tbody className="divide-y divide-slate-800">{records.map((record) => <tr key={record._id}><td className="p-3 text-white">{employeeName(record)}</td><td className="p-3">{new Date(record.date).toLocaleDateString()}</td><td className="p-3">{formatTime(record.checkIn)}</td><td className="p-3">{formatTime(record.checkOut)}</td><td className="p-3">{record.status}</td><td className="p-3">{(record.workHours || 0).toFixed(2)}</td></tr>)}</tbody></table></div>
  </div>;
}

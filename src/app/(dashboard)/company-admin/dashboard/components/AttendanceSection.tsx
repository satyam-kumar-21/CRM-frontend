'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Download } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, IAttendanceRecord, IAttendanceSummary } from '@/services/companyService';
import { getBusinessDateString, getBusinessMonthEndString } from '@/lib/businessDate';

type AttendanceSectionProps = { readOnly?: boolean };

const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '-';
const employeeName = (record: IAttendanceRecord) => typeof record.employeeId === 'string' ? record.employeeId : `${record.employeeId.name} (${record.employeeId.employeeId})`;

export function AttendanceSection({ readOnly = false }: AttendanceSectionProps) {
  const [records, setRecords] = useState<IAttendanceRecord[]>([]);
  const [summary, setSummary] = useState<IAttendanceSummary | null>(null);
  const [employees, setEmployees] = useState<Array<{ _id: string; name: string; employeeId: string; role: string }>>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [month, setMonth] = useState('');

  const load = async () => {
    try {
      const selectedMonth = month || (from ? from.slice(0, 7) : '');
      const isCurrentMonth = !!selectedMonth && selectedMonth === getBusinessDateString(new Date()).slice(0, 7);
      const attendanceResponse = await companyService.getAttendance({
        employeeId: employeeId || undefined,
        from: month ? `${month}-01` : from || undefined,
        to: month ? (isCurrentMonth ? getBusinessDateString(new Date()) : getBusinessMonthEndString(month)) : to || undefined,
      });
      const nextRecords = Array.isArray(attendanceResponse) ? attendanceResponse : (attendanceResponse.records ?? []);
      setRecords(nextRecords);
      setSummary((attendanceResponse as any)?.summary ?? null);
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
  const employeeSummary = useMemo(() => {
    const map = new Map<string, { name: string; employeeId: string; role: string; workingDays: number; present: number; absent: number; holiday: number }>();

    for (const record of records) {
      const employee = typeof record.employeeId === 'string' ? null : record.employeeId;
      const employeeKey = employee ? (employee._id || employee.employeeId) : record._id.split('-')[0];
      const label = employee ? `${employee.name} (${employee.employeeId || ''})` : employeeKey;
      const item = map.get(employeeKey) || {
        name: label,
        employeeId: employee?.employeeId || employeeKey,
        role: employee?.role || 'EMPLOYEE',
        workingDays: 0,
        present: 0,
        absent: 0,
        holiday: 0,
      };

      if (record.status !== 'HOLIDAY') item.workingDays += 1;
      if (record.status === 'PRESENT') item.present += 1;
      if (record.status === 'ABSENT') item.absent += 1;
      if (record.status === 'HOLIDAY') item.holiday += 1;

      map.set(employeeKey, item);
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  const monthCaption = month ? `${month} (1 to ${new Date().getDate()} working days)` : from || to ? `Current filtered range` : `Current month`;
  const uniqueHolidayDates = new Set(records.filter((record) => record.status === 'HOLIDAY').map((record) => new Date(record.date).toISOString().slice(0, 10)));
  const totalHolidaysThisMonth = summary?.totalHoliday ?? uniqueHolidayDates.size;

  return <div className="min-h-full space-y-5 overflow-y-auto bg-slate-950 p-6 text-slate-100"><header className="flex items-center justify-between border-b border-slate-800 pb-4"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><CalendarCheck className="h-6 w-6 text-emerald-400" /> {readOnly ? 'My Attendance' : 'Attendance'}</h1><p className="text-sm text-slate-400">{readOnly ? 'Your check-in and checkout history.' : 'Review and export attendance records.'}</p></div>{!readOnly && <button onClick={download} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"><Download className="h-4 w-4" /> Export CSV</button>}</header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: 'Working days', value: summary?.totalWorkingDays ?? 0 },
      { label: 'Present', value: summary?.totalPresent ?? 0 },
      { label: 'Absent', value: summary?.totalAbsent ?? 0 },
      { label: 'Holiday', value: summary?.totalHoliday ?? 0 },
    ].map((item) => <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-[10px] uppercase tracking-wide text-slate-400">{item.label}</p><p className="mt-2 text-2xl font-bold text-white">{item.value}</p></div>)}</div>
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h2 className="text-sm font-semibold text-white">Employee monthly summary</h2><p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">Current month working days: {summary?.totalWorkingDays ?? 0} / Today: {new Date().getDate()} {new Date().toLocaleString('en-US', { month: 'short' })}</p></div><div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-400"><span>{monthCaption}</span><span className="rounded-full border border-amber-600/40 bg-amber-500/10 px-2 py-1 text-amber-300">Total holidays: {summary?.totalHoliday ?? totalHolidaysThisMonth}</span></div></div><div className="overflow-x-auto"><table className="w-full text-left text-xs text-slate-300"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Employee</th><th className="p-3">Working days</th><th className="p-3">Present</th><th className="p-3">Absent</th></tr></thead><tbody className="divide-y divide-slate-800">{employeeSummary.length ? employeeSummary.map((item) => <tr key={`${item.employeeId}-${item.name}`}><td className="p-3 text-white">{item.name}</td><td className="p-3">{item.workingDays}</td><td className="p-3 text-emerald-300">{item.present}</td><td className="p-3 text-rose-300">{item.absent}</td></tr>) : <tr><td className="p-3 text-slate-400" colSpan={4}>No attendance data for this range.</td></tr>}</tbody></table></div></div>
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"><label className="space-y-1 text-xs text-slate-400">Employee{!readOnly && <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"><option value="">All employees</option>{employees.map((item) => <option key={item._id} value={item._id}>{item.name} · {item.role}</option>)}</select>}</label><label className="space-y-1 text-xs text-slate-400">Month<input type="month" value={month} onChange={(event) => { setMonth(event.target.value); setFrom(''); setTo(''); }} className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /></label><label className="space-y-1 text-xs text-slate-400">From<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setMonth(''); }} className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /></label><label className="space-y-1 text-xs text-slate-400">To<input type="date" value={to} onChange={(event) => { setTo(event.target.value); setMonth(''); }} className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white" /></label><button onClick={() => void load()} className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold text-white">Filter</button><span className="ml-auto text-xs text-slate-400">{records.length} records · {totalHours.toFixed(2)} hours</span></div>
    <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-left text-xs text-slate-300"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Employee</th><th className="p-3">Date</th><th className="p-3">Check in</th><th className="p-3">Check out</th><th className="p-3">Status</th><th className="p-3">Hours</th></tr></thead><tbody className="divide-y divide-slate-800">{records.map((record) => <tr key={record._id}><td className="p-3 text-white">{employeeName(record)}</td><td className="p-3">{new Date(record.date).toLocaleDateString()}</td><td className="p-3">{formatTime(record.checkIn)}</td><td className="p-3">{formatTime(record.checkOut)}</td><td className="p-3">{record.status}</td><td className="p-3">{(record.workHours || 0).toFixed(2)}</td></tr>)}</tbody></table></div>
  </div>;
}

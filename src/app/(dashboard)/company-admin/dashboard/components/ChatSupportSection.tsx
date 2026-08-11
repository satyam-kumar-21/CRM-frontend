'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, MessageSquare, Search, Users } from 'lucide-react';
import type { ICompanyMessage } from '@/services/companyService';
import type { IEmployee, IGroupChannel } from '../types';

const tabs = [
  { id: 'total', label: 'Total Chats' },
  { id: 'today', label: 'Today' },
  { id: 'date-wise', label: 'Date Wise' },
] as const;

type ChatSupportTab = (typeof tabs)[number]['id'];

type ChatSupportSectionProps = {
  employees: IEmployee[];
  groups: IGroupChannel[];
  recentMessages: ICompanyMessage[];
};

export function ChatSupportSection({ employees, groups, recentMessages }: ChatSupportSectionProps) {
  const [activeTab, setActiveTab] = useState<ChatSupportTab>('total');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const dateFilter = (message: ICompanyMessage) => {
      if (!fromDate && !toDate) return true;
      const created = new Date(message.createdAt).toISOString().slice(0, 10);
      if (fromDate && created < fromDate) return false;
      if (toDate && created > toDate) return false;
      return true;
    };

    return recentMessages.filter((message) => {
      const content = message.content.toLowerCase();
      const title = `${message.senderName || ''}`.toLowerCase();
      return (query === '' || content.includes(query) || title.includes(query)) && dateFilter(message);
    });
  }, [recentMessages, searchQuery, fromDate, toDate]);

  const todayDate = new Date().toISOString().slice(0, 10);
  const todayMessages = filteredMessages.filter((message) => message.createdAt.slice(0, 10) === todayDate);
  const totalChats = filteredMessages.length;
  const activeChatCount = new Set(filteredMessages.map((message) => message.groupId || message.conversationId)).size;
  const employeePerformance = useMemo(() => {
    const countByEmployee = new Map<string, { name: string; role: string; messageCount: number; unreadCount: number; latestChatAt: string | null }>();
    employees.forEach((employee) => {
      countByEmployee.set(employee.id, { name: employee.name, role: employee.role, messageCount: 0, unreadCount: employee.unreadCount, latestChatAt: employee.latestChatAt || null });
    });

    filteredMessages.forEach((message) => {
      const key = message.senderId || message.recipientId || '';
      if (!key || !countByEmployee.has(key)) return;
      const existing = countByEmployee.get(key)!;
      existing.messageCount += 1;
      const createdAt = new Date(message.createdAt).toISOString();
      existing.latestChatAt = existing.latestChatAt ? (createdAt > existing.latestChatAt ? createdAt : existing.latestChatAt) : createdAt;
    });

    return Array.from(countByEmployee.values()).sort((a, b) => (b.messageCount - a.messageCount) || ((b.latestChatAt || '').localeCompare(a.latestChatAt || '')));
  }, [employees, filteredMessages]);

  return (
    <section className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">Chat support center</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Admin chat performance</h1>
          <p className="mt-2 text-sm text-slate-400">Monitor total conversations, today's chat activity, and date-range support performance across employees.</p>
        </div>
      </header>

      <div className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard icon={MessageSquare} label="Active chats" value={activeChatCount} />
          <MetricCard icon={CheckCircle2} label="Messages tracked" value={totalChats} />
          <MetricCard icon={CalendarDays} label="Today" value={todayMessages.length} />
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Current filter</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-100">
            <span className="rounded-full bg-slate-800 px-3 py-1">{activeTab === 'total' ? 'All chats' : activeTab === 'today' ? 'Today only' : 'Date wise'}</span>
            {fromDate && <span className="rounded-full bg-slate-800 px-3 py-1">From: {fromDate}</span>}
            {toDate && <span className="rounded-full bg-slate-800 px-3 py-1">To: {toDate}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_0.75fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <FilterInput label="Search chats" value={searchQuery} onChange={setSearchQuery} placeholder="Search messages or sender" icon={Search} />
            {activeTab === 'date-wise' && <FilterInput label="From" value={fromDate} onChange={setFromDate} placeholder="YYYY-MM-DD" type="date" icon={Clock3} />}
            {activeTab === 'date-wise' && <FilterInput label="To" value={toDate} onChange={setToDate} placeholder="YYYY-MM-DD" type="date" icon={Clock3} />}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Support overview</h2>
          <div className="mt-4 grid gap-3">
            <OverviewRow label="Employees" value={employees.length} />
            <OverviewRow label="Groups" value={groups.length} />
            <OverviewRow label="Recent message senders" value={new Set(filteredMessages.map((message) => message.senderId)).size} />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Employee performance</h2>
            <p className="mt-1 text-sm text-slate-400">View message volume, unread queues, and recent chat activity per employee.</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-slate-400 uppercase">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Role</th>
                <th className="p-3">Messages</th>
                <th className="p-3">Unread</th>
                <th className="p-3">Last chat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {employeePerformance.map((row) => (
                <tr key={row.name} className="hover:bg-slate-950/50">
                  <td className="p-3 font-semibold text-white">{row.name}</td>
                  <td className="p-3 text-slate-400">{row.role}</td>
                  <td className="p-3">{row.messageCount}</td>
                  <td className="p-3">{row.unreadCount}</td>
                  <td className="p-3 text-slate-400">{row.latestChatAt ? new Date(row.latestChatAt).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof MessageSquare }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center gap-3 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function FilterInput({ label, value, onChange, placeholder, type = 'text', icon: Icon }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; icon: typeof Search }) {
  return (
    <label className="space-y-2 text-[11px] text-slate-400">
      <span>{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} className="w-full bg-transparent text-xs text-white outline-none" />
      </div>
    </label>
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

'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, LifeBuoy, CheckCircle2, XCircle, Clock, User, Phone, Monitor, Check } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { companyService, IRemoteSupportRecord } from '@/services/companyService';

export function TechSupportTodaysWorkSection() {
  const [tickets, setTickets] = useState<IRemoteSupportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [failingId, setFailingId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await companyService.getRemoteSupport();
      setTickets(data);
    } catch {
      toast.error('Unable to fetch your support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTickets();
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: window.localStorage.getItem('companyAccessToken') || undefined },
      withCredentials: true,
    });
    socket.on('support:created', () => void fetchTickets());
    socket.on('support:accepted', () => void fetchTickets());
    socket.on('support:completed', () => void fetchTickets());
    socket.on('support:failed', () => void fetchTickets());
    return () => { socket.disconnect(); };
  }, []);

  const handleAccept = async (record: IRemoteSupportRecord) => {
    try {
      await companyService.acceptRemoteSupport(record._id);
      toast.success('Ticket accepted successfully!');
      await fetchTickets();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to accept ticket');
    }
  };

  const handleIssueFixed = async (record: IRemoteSupportRecord) => {
    try {
      await companyService.completeRemoteSupport(record._id, { status: 'SUCCESSFUL' });
      toast.success('Marked as SUCCESSFUL!');
      await fetchTickets();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to mark as successful');
    }
  };

  const handleIssueNotFixed = async () => {
    if (!failingId) return;
    if (!failureReason.trim()) { toast.error('Failure reason is required'); return; }
    try {
      setSubmitting(true);
      await companyService.completeRemoteSupport(failingId, { status: 'FAILED', failedReason: failureReason.trim() });
      toast.error('Marked as FAILED.');
      setFailingId(null);
      setFailureReason('');
      await fetchTickets();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to mark as failed');
    } finally { setSubmitting(false); }
  };

  const pending = tickets.filter((t) => t.status === 'PENDING');
  const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS');
  const completed = tickets.filter((t) => t.status === 'SUCCESSFUL' || t.status === 'FAILED');
  const activeTasks = [...pending, ...inProgress];

  if (loading) return <div className="h-full flex items-center justify-center bg-slate-950 text-slate-400">Loading support tickets...</div>;

  return (
    <div className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white tracking-tight"><CalendarCheck className="h-7 w-7 text-cyan-400" /> Today's Work — Tech Support</h1>
          <p className="mt-1 text-sm text-slate-400">Accept pending tickets, resolve issues, and update their outcome.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs uppercase text-slate-500 font-semibold">All Tickets</p><p className="mt-2 text-2xl font-bold text-white">{tickets.length}</p></div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="text-xs uppercase text-amber-400 font-semibold">Pending</p><p className="mt-2 text-2xl font-bold text-amber-300">{pending.length}</p></div>
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4"><p className="text-xs uppercase text-indigo-400 font-semibold">In Progress</p><p className="mt-2 text-2xl font-bold text-indigo-300">{inProgress.length}</p></div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-xs uppercase text-emerald-400 font-semibold">Resolved</p><p className="mt-2 text-2xl font-bold text-emerald-300">{completed.length}</p></div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-cyan-400" /> Active Tickets</h2>
        {activeTasks.length === 0 ? (
          <div className="text-center py-12 border border-slate-800 rounded-2xl bg-slate-900/40 text-slate-500 text-sm">No active tickets. All caught up!</div>
        ) : activeTasks.map((ticket) => {
          const isPending = ticket.status === 'PENDING';
          const isInProgress = ticket.status === 'IN_PROGRESS';
          return (
            <div key={ticket._id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{ticket.customerName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isInProgress ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>{isPending ? 'PENDING' : 'IN PROGRESS'}</span>
                    {(ticket.otherDetails || '').toLowerCase().includes('upgrade') && (
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-300">Upgrade Customer</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                    {ticket.customerContact && <span className="flex items-center gap-1 text-emerald-400 font-semibold"><Phone className="h-3.5 w-3.5" /> {ticket.customerContact}</span>}
                    {ticket.system && <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5 text-slate-500" /> {ticket.system}</span>}
                    {ticket.salesEmployeeName && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-500" /> Sales: {ticket.salesEmployeeName}</span>}
                  </div>
                  {ticket.otherDetails && (
                    <p className="mt-2 text-xs text-cyan-200 bg-cyan-500/5 rounded-lg p-2.5 border border-cyan-500/20">
                      <span className="font-semibold text-cyan-300">Upgrade / Sales Message: </span>
                      {ticket.otherDetails}
                    </p>
                  )}
                  {ticket.issueReason && <p className="mt-2 text-xs text-slate-400 bg-slate-950/60 rounded-lg p-2.5 border border-slate-800"><span className="font-semibold text-slate-300">Issue: </span>{ticket.issueReason}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  {isPending && <button onClick={() => void handleAccept(ticket)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow"><Check className="h-4 w-4" /> Accept Ticket</button>}
                  {isInProgress && (
                    <div className="flex gap-2">
                      <button onClick={() => void handleIssueFixed(ticket)} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow"><CheckCircle2 className="h-4 w-4" /> Issue Fixed</button>
                      <button onClick={() => { setFailingId(ticket._id); setFailureReason(''); }} className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-500 shadow"><XCircle className="h-4 w-4" /> Not Fixed</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 rounded-md px-2 py-1 font-semibold bg-indigo-500/20 text-indigo-300"><Clock className="h-3 w-3" /> Received</span>
                <span className="text-slate-700">→</span>
                <span className={`rounded-md px-2 py-1 font-semibold ${isInProgress || ticket.status === 'SUCCESSFUL' || ticket.status === 'FAILED' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>Accepted</span>
                <span className="text-slate-700">→</span>
                <span className={`rounded-md px-2 py-1 font-semibold ${ticket.status === 'SUCCESSFUL' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>Resolved</span>
              </div>
            </div>
          );
        })}
      </section>

      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Completed Today ({completed.length})</h2>
          <div className="space-y-2">
            {completed.map((ticket) => (
              <div key={ticket._id} className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">{ticket.customerName}</p>
                  {ticket.status === 'FAILED' && ticket.failedReason && <p className="text-[11px] text-rose-400 mt-0.5">Reason: {ticket.failedReason}</p>}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${ticket.status === 'SUCCESSFUL' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>{ticket.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {failingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><XCircle className="h-5 w-5 text-rose-400" /> Issue Not Fixed</h3>
            <label className="block space-y-1 text-xs text-slate-400">
              <span>Failure Reason <span className="text-rose-400">*</span></span>
              <textarea autoFocus value={failureReason} onChange={(e) => setFailureReason(e.target.value)} placeholder="e.g. Hardware fault, OS incompatibility..." rows={4} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white outline-none focus:border-rose-500 resize-none" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFailingId(null)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700">Cancel</button>
              <button disabled={submitting} onClick={() => void handleIssueNotFixed()} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow disabled:opacity-60">{submitting ? 'Submitting...' : 'Submit — Mark as Failed'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

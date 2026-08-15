'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, ShieldCheck, MessageSquare, CheckCircle, XCircle, Play, DollarSign, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { companyService, ICompanySale } from '@/services/companyService';

type FeedbackRating = 'Positive' | 'Neutral' | 'Negative';

export function VerificationTodaysWorkSection() {
  const [verRecords, setVerRecords] = useState<ICompanySale[]>([]);
  const [fbRecords, setFbRecords] = useState<ICompanySale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'verification' | 'feedback'>('verification');

  // Verification modals
  const [successModalId, setSuccessModalId] = useState<string | null>(null);
  const [verNotes, setVerNotes] = useState('');
  const [failedModalId, setFailedModalId] = useState<string | null>(null);
  const [failedReason, setFailedReason] = useState('');

  // Feedback forms
  const [fbForms, setFbForms] = useState<Record<string, { rating: FeedbackRating; notes: string }>>({});
  const [submittingFbId, setSubmittingFbId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchAll = async () => {
    try {
      const [ver, fb] = await Promise.all([
        companyService.getVerifications(),
        companyService.getFeedbacks(),
      ]);
      setVerRecords(ver);
      setFbRecords(fb);
    } catch {
      toast.error('Unable to fetch today\'s work.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: window.localStorage.getItem('companyAccessToken') || undefined },
      withCredentials: true,
    });
    socket.on('verification:updated', () => void fetchAll());
    socket.on('feedback:updated', () => void fetchAll());
    socket.on('sale:created', () => void fetchAll());
    return () => { socket.disconnect(); };
  }, []);

  const handleStart = async (id: string) => {
    try { await companyService.startVerification(id); toast.success('Verification started!'); await fetchAll(); }
    catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to start'); }
  };

  const handleVerSuccess = async () => {
    if (!successModalId) return;
    try {
      setBusy(true);
      await companyService.completeVerification(successModalId, { status: 'SUCCESSFUL', notes: verNotes });
      toast.success('Verification completed! Lead moved to Feedback stage.');
      setSuccessModalId(null); setVerNotes('');
      await fetchAll();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to complete'); }
    finally { setBusy(false); }
  };

  const handleVerFailed = async () => {
    if (!failedModalId) return;
    if (!failedReason.trim()) { toast.error('Failure reason is required'); return; }
    try {
      setBusy(true);
      await companyService.completeVerification(failedModalId, { status: 'FAILED', failedReason: failedReason.trim() });
      toast.error('Verification marked as failed.');
      setFailedModalId(null); setFailedReason('');
      await fetchAll();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to mark failed'); }
    finally { setBusy(false); }
  };

  const handleFeedbackSubmit = async (id: string) => {
    const form = fbForms[id];
    if (!form?.rating) { toast.error('Please select a feedback rating'); return; }
    try {
      setSubmittingFbId(id);
      await companyService.completeFeedback(id, { rating: form.rating, notes: form.notes || '' });
      toast.success('Feedback submitted!');
      await fetchAll();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Unable to submit feedback'); }
    finally { setSubmittingFbId(null); }
  };

  const verPending = verRecords.filter((r) => r.verificationStatus === 'PENDING' || r.verificationStatus === 'IN_PROGRESS');
  const verDone = verRecords.filter((r) => r.verificationStatus === 'SUCCESSFUL' || r.verificationStatus === 'FAILED');
  const fbPending = fbRecords.filter((r) => r.feedbackStatus !== 'COMPLETED');
  const fbDone = fbRecords.filter((r) => r.feedbackStatus === 'COMPLETED');

  if (loading) return <div className="h-full flex items-center justify-center bg-slate-950 text-slate-400">Loading today's work...</div>;

  return (
    <div className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white tracking-tight">
            <CalendarCheck className="h-7 w-7 text-emerald-400" />
            Today's Verification & Feedback Work
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Assigned daily verification tasks and post-sale customer feedback calls.
          </p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"><p className="text-xs uppercase text-amber-400 font-semibold">Pending Verification</p><p className="mt-2 text-2xl font-bold text-amber-300">{verPending.length}</p></div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"><p className="text-xs uppercase text-emerald-400 font-semibold">Verification Done</p><p className="mt-2 text-2xl font-bold text-emerald-300">{verDone.length}</p></div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4"><p className="text-xs uppercase text-purple-400 font-semibold">Feedback Pending</p><p className="mt-2 text-2xl font-bold text-purple-300">{fbPending.length}</p></div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"><p className="text-xs uppercase text-slate-500 font-semibold">Feedback Completed</p><p className="mt-2 text-2xl font-bold text-white">{fbDone.length}</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('verification')} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${activeTab === 'verification' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
          <ShieldCheck className="inline h-3.5 w-3.5 mr-1" /> Verification ({verPending.length} pending)
        </button>
        <button onClick={() => setActiveTab('feedback')} className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${activeTab === 'feedback' ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
          <MessageSquare className="inline h-3.5 w-3.5 mr-1" /> Feedback ({fbPending.length} pending)
        </button>
      </div>

      {/* Verification Tab */}
      {activeTab === 'verification' && (
        <section className="space-y-3">
          {verPending.length === 0 ? (
            <div className="text-center py-12 border border-slate-800 rounded-2xl bg-slate-900/40 text-slate-500 text-sm">No pending verifications. All caught up!</div>
          ) : verPending.map((rec) => (
            <div key={rec._id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-bold text-white">{rec.name}</p>
                    {rec.customerId && <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">#{rec.customerId}</span>}
                    {rec.customerType === 'UPGRADE' && <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-300 border border-fuchsia-500/30">UPGRADE</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{rec.country} · {rec.system} · Sales by: {rec.salesEmployeeName || rec.connectedBy}</p>
                  {(rec.alternateContactNo || rec.customerEmail) && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {rec.alternateContactNo && (
                        <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {rec.alternateContactNo}
                        </span>
                      )}
                      {rec.customerEmail && <span className="text-slate-400">{rec.customerEmail}</span>}
                    </div>
                  )}
                  {rec.salesEmployeeRemark && (
                    <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/80 p-2 text-xs text-slate-200">
                      <span className="font-semibold text-indigo-400 mr-1">💬 Sales Message:</span>
                      {rec.salesEmployeeRemark}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-emerald-400 mt-1.5"><DollarSign className="inline h-3.5 w-3.5" />${rec.amount?.toLocaleString()} · {rec.paymentMethod}</p>
                </div>
                <div className="flex gap-2">
                  {rec.verificationStatus === 'PENDING' && (
                    <button onClick={() => void handleStart(rec._id)} className="flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500 shadow">
                      <Play className="h-3.5 w-3.5" /> Start
                    </button>
                  )}
                  {(rec.verificationStatus === 'PENDING' || rec.verificationStatus === 'IN_PROGRESS') && (
                    <>
                      <button onClick={() => { setSuccessModalId(rec._id); setVerNotes(''); }} className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow">
                        <CheckCircle className="h-3.5 w-3.5" /> Successful
                      </button>
                      <button onClick={() => { setFailedModalId(rec._id); setFailedReason(''); }} className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow">
                        <XCircle className="h-3.5 w-3.5" /> Failed
                      </button>
                    </>
                  )}
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${rec.verificationStatus === 'IN_PROGRESS' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                {rec.verificationStatus || 'PENDING'}
              </span>
            </div>
          ))}
          {verDone.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Completed ({verDone.length})</p>
              {verDone.map((rec) => (
                <div key={rec._id} className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{rec.name}</p>
                    {rec.verificationFailedReason && <p className="text-[11px] text-rose-400">Reason: {rec.verificationFailedReason}</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${rec.verificationStatus === 'SUCCESSFUL' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>{rec.verificationStatus}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <section className="space-y-3">
          {fbPending.length === 0 ? (
            <div className="text-center py-12 border border-slate-800 rounded-2xl bg-slate-900/40 text-slate-500 text-sm">No feedback tasks pending today.</div>
          ) : fbPending.map((rec) => {
            const form = fbForms[rec._id] || { rating: '' as FeedbackRating, notes: '' };
            return (
              <div key={rec._id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow space-y-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-bold text-white">{rec.name}</p>
                    {rec.customerId && <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">#{rec.customerId}</span>}
                    {rec.customerType === 'UPGRADE' && <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-300 border border-fuchsia-500/30">UPGRADE</span>}
                  </div>
                  <p className="text-xs text-slate-400">{rec.country} · {rec.system} · Sales by: {rec.salesEmployeeName || rec.connectedBy}</p>
                  {(rec.alternateContactNo || rec.customerEmail) && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {rec.alternateContactNo && (
                        <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {rec.alternateContactNo}
                        </span>
                      )}
                      {rec.customerEmail && <span className="text-slate-400">{rec.customerEmail}</span>}
                    </div>
                  )}
                  {rec.salesEmployeeRemark && (
                    <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/80 p-2 text-xs text-slate-200">
                      <span className="font-semibold text-indigo-400 mr-1">💬 Sales Message:</span>
                      {rec.salesEmployeeRemark}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-emerald-400 mt-1.5"><DollarSign className="inline h-3.5 w-3.5" />${rec.amount?.toLocaleString()} · Verified: {rec.verifiedByName || 'Verification Team'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5 font-semibold">Feedback Rating <span className="text-rose-400">*</span></p>
                    <div className="flex gap-2">
                      {(['Positive', 'Neutral', 'Negative'] as FeedbackRating[]).map((r) => (
                        <button key={r} onClick={() => setFbForms((cur) => ({ ...cur, [rec._id]: { ...form, rating: r } }))}
                          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${form.rating === r ? r === 'Positive' ? 'bg-emerald-600 text-white' : r === 'Neutral' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5 font-semibold">Notes (Optional)</p>
                    <input type="text" value={form.notes} onChange={(e) => setFbForms((cur) => ({ ...cur, [rec._id]: { ...form, notes: e.target.value } }))} placeholder="Customer feedback notes..." className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-purple-500" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button disabled={submittingFbId === rec._id || !form.rating} onClick={() => void handleFeedbackSubmit(rec._id)} className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 shadow disabled:opacity-60">
                    <MessageSquare className="h-3.5 w-3.5" /> {submittingFbId === rec._id ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            );
          })}
          {fbDone.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Completed ({fbDone.length})</p>
              {fbDone.map((rec) => (
                <div key={rec._id} className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/30 px-4 py-3">
                  <p className="text-sm font-semibold text-white">{rec.name}</p>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${rec.feedbackRating === 'Positive' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : rec.feedbackRating === 'Negative' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>{rec.feedbackRating}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Verification Success Modal */}
      {successModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-400" /> Complete Verification</h3>
            <label className="block space-y-1 text-xs text-slate-400"><span>Notes / Remarks (Optional)</span>
              <textarea value={verNotes} onChange={(e) => setVerNotes(e.target.value)} placeholder="Enter verification notes..." className="w-full h-20 rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white outline-none focus:border-emerald-500" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSuccessModalId(null)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700">Cancel</button>
              <button disabled={busy} onClick={() => void handleVerSuccess()} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow disabled:opacity-60">{busy ? 'Saving...' : 'Confirm Verification'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Failed Modal */}
      {failedModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><XCircle className="h-5 w-5 text-rose-400" /> Verification Failed</h3>
            <label className="block space-y-1 text-xs text-slate-400"><span>Failure Reason <span className="text-rose-400">*</span></span>
              <textarea required value={failedReason} onChange={(e) => setFailedReason(e.target.value)} placeholder="Enter verification failure reason..." className="w-full h-24 rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white outline-none focus:border-rose-500" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFailedModalId(null)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700">Cancel</button>
              <button disabled={busy} onClick={() => void handleVerFailed()} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow disabled:opacity-60">{busy ? 'Saving...' : 'Submit Failure Reason'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

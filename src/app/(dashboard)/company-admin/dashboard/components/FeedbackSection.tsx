'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, ThumbsUp, Minus, ThumbsDown, CheckCircle, Clock, Search, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { companyService, ICompanySale } from '@/services/companyService';
import { maskSensitiveValue } from '@/lib/utils';

export function FeedbackSection({ employeeView = false }: { employeeView?: boolean }) {
  const [records, setRecords] = useState<ICompanySale[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');
  const [modalId, setModalId] = useState<string | null>(null);
  const [rating, setRating] = useState<'Positive' | 'Neutral' | 'Negative'>('Positive');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const data = await companyService.getFeedbacks();
      setRecords(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to fetch feedback tasks');
    }
  };

  useEffect(() => {
    void fetchRecords();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: window.localStorage.getItem('companyAccessToken') || undefined },
      withCredentials: true,
    });

    socket.on('feedback:updated', () => void fetchRecords());
    socket.on('verification:updated', () => void fetchRecords());

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSubmitFeedback = async (id: string) => {
    try {
      setLoading(true);
      await companyService.completeFeedback(id, { rating, notes });
      toast.success('Feedback submitted successfully! Workflow completed.');
      setModalId(null);
      setNotes('');
      await fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter((rec) => {
    if (activeTab !== 'ALL' && rec.feedbackStatus !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        rec.name.toLowerCase().includes(q) ||
        (rec.connectedBy && rec.connectedBy.toLowerCase().includes(q)) ||
        (rec.system && rec.system.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const counts = {
    total: records.length,
    pending: records.filter((r) => r.feedbackStatus === 'PENDING').length,
    completed: records.filter((r) => r.feedbackStatus === 'COMPLETED').length,
  };

  return (
    <div className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white tracking-tight">
            <MessageSquare className="h-7 w-7 text-purple-400" />
            Today's Feedback
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Contact customers post-sale to gather product & service feedback. Available on scheduled next business day.
          </p>
        </div>
      </header>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-500 font-semibold">Total Feedback Tasks</p>
          <p className="mt-2 text-2xl font-bold text-white">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs uppercase text-amber-400 font-semibold">Pending Feedback</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{counts.pending}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase text-emerald-400 font-semibold">Completed Feedback</p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">{counts.completed}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'PENDING', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by customer, sales employee, or system..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
        />
      </div>

      {/* Feedback Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">Customer & System</th>
              <th className="p-3.5">Sales & Verification</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Feedback Status</th>
              <th className="p-3.5">Rating & Notes</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length ? (
              filtered.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-white text-sm">{rec.name}</p>
                      {rec.customerId && (
                        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">
                          #{rec.customerId}
                        </span>
                      )}
                      {rec.customerType === 'UPGRADE' && (
                        <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-300 border border-fuchsia-500/30">
                          UPGRADE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{rec.country} · {rec.system}</p>
                    {(rec.alternateContactNo || rec.customerEmail) && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px]">
                        {rec.alternateContactNo && (
                          <span className="font-mono text-emerald-400 flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />
                            {employeeView ? maskSensitiveValue(rec.alternateContactNo) : rec.alternateContactNo}
                          </span>
                        )}
                        {rec.customerEmail && (
                          <span className="text-slate-400">
                            {employeeView ? maskSensitiveValue(rec.customerEmail) : rec.customerEmail}
                          </span>
                        )}
                      </div>
                    )}
                    {rec.salesEmployeeRemark && (
                      <div className="mt-1.5 rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-[10px] text-slate-300 max-w-sm">
                        <span className="font-semibold text-indigo-400 block mb-0.5">💬 Sales Message:</span>
                        {rec.salesEmployeeRemark}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-200">Sales: {rec.salesEmployeeName || rec.connectedBy}</p>
                    <p className="text-[11px] text-emerald-400">Verified by: {rec.verifiedByName || 'Verification Team'}</p>
                  </td>
                  <td className="p-3.5">
                    <p className="font-mono font-bold text-emerald-400 text-sm">${rec.amount?.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400">{rec.paymentMethod}</p>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        rec.feedbackStatus === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {rec.feedbackStatus === 'COMPLETED' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {rec.feedbackStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {rec.feedbackRating ? (
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.feedbackRating === 'Positive'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : rec.feedbackRating === 'Negative'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {rec.feedbackRating === 'Positive' && <ThumbsUp className="h-3 w-3" />}
                          {rec.feedbackRating === 'Negative' && <ThumbsDown className="h-3 w-3" />}
                          {rec.feedbackRating === 'Neutral' && <Minus className="h-3 w-3" />}
                          {rec.feedbackRating}
                        </span>
                        {rec.feedbackNotes && (
                          <p className="text-[11px] text-slate-400 mt-1">{rec.feedbackNotes}</p>
                        )}
                        {rec.feedbackByName && (
                          <p className="text-[10px] text-slate-500 mt-0.5">By: {rec.feedbackByName}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Awaiting feedback</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    {rec.feedbackStatus !== 'COMPLETED' ? (
                      <button
                        onClick={() => {
                          setModalId(rec._id);
                          setRating('Positive');
                          setNotes('');
                        }}
                        className="rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 transition-colors shadow"
                      >
                        Submit Feedback
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Completed</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  No feedback tasks ready for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Feedback Submission Modal */}
      {modalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-400" />
              Customer Feedback
            </h3>
            <p className="text-xs text-slate-400">
              Record customer response and notes after calling the customer.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Feedback Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Positive', 'Neutral', 'Negative'] as const).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRating(r)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all border ${
                      rating === r
                        ? r === 'Positive'
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                          : r === 'Negative'
                          ? 'bg-rose-600 border-rose-500 text-white shadow'
                          : 'bg-amber-600 border-amber-500 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'Positive' && <ThumbsUp className="h-3.5 w-3.5" />}
                    {r === 'Neutral' && <Minus className="h-3.5 w-3.5" />}
                    {r === 'Negative' && <ThumbsDown className="h-3.5 w-3.5" />}
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1 text-xs text-slate-400">
              <span>Feedback Message / Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter customer feedback details..."
                className="w-full h-24 rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white outline-none focus:border-purple-500"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setModalId(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={() => void handleSubmitFeedback(modalId)}
                className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 shadow"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

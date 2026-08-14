'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Clock, Play, AlertCircle, Phone, DollarSign, User } from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { companyService, ICompanySale } from '@/services/companyService';

export function VerificationSection() {
  const [records, setRecords] = useState<ICompanySale[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'SUCCESSFUL' | 'FAILED'>('ALL');
  const [search, setSearch] = useState('');
  const [failedModalId, setFailedModalId] = useState<string | null>(null);
  const [failedReason, setFailedReason] = useState('');
  const [successModalId, setSuccessModalId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<ICompanySale> & { saleDate: string; paymentMethod: ICompanySale['paymentMethod']; customerType: ICompanySale['customerType']; }>({
    name: '',
    country: '',
    system: '',
    connectedBy: '',
    amount: 0,
    paymentMethod: 'Card',
    saleDate: new Date().toISOString().slice(0, 10),
    customerType: 'NEW',
  });

  const fetchRecords = async () => {
    try {
      const data = await companyService.getVerifications();
      setRecords(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to fetch verification tasks');
    }
  };

  useEffect(() => {
    void fetchRecords();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: window.localStorage.getItem('companyAccessToken') || undefined },
      withCredentials: true,
    });

    socket.on('verification:updated', () => void fetchRecords());
    socket.on('sale:created', () => void fetchRecords());

    return () => {
      socket.disconnect();
    };
  }, []);

  const resetDraft = () => {
    setDraft({
      name: '',
      country: '',
      system: '',
      connectedBy: '',
      amount: 0,
      paymentMethod: 'Card',
      saleDate: new Date().toISOString().slice(0, 10),
      customerType: 'NEW',
    });
    setEditingId(null);
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (!draft.name || !draft.country || !draft.system || !draft.connectedBy || !draft.saleDate) {
        toast.error('Name, country, system, sales employee, and sale date are required.');
        return;
      }
      if (draft.amount === undefined || Number(draft.amount) <= 0) {
        toast.error('Verification amount must be greater than zero.');
        return;
      }

      if (editingId) {
        await companyService.updateVerification(editingId, {
          ...draft,
          amount: Number(draft.amount),
          mainAmount: Number(draft.mainAmount ?? draft.amount),
          finalAmount: Number(draft.finalAmount ?? draft.amount),
        });
        toast.success('Verification updated.');
      } else {
        await companyService.createVerification({
          name: draft.name || '',
          country: draft.country || '',
          system: draft.system || '',
          connectedBy: draft.connectedBy || '',
          amount: Number(draft.amount || 0),
          mainAmount: Number(draft.mainAmount ?? draft.amount ?? 0),
          finalAmount: Number(draft.finalAmount ?? draft.amount ?? 0),
          paymentMethod: draft.paymentMethod || 'Card',
          customerType: draft.customerType || 'NEW',
          saleDate: draft.saleDate || new Date().toISOString().slice(0, 10),
          customerEmail: draft.customerEmail,
          alternateContactNo: draft.alternateContactNo,
          customerAddress: draft.customerAddress,
          plan: draft.plan,
          paymentMerchant: draft.paymentMerchant,
          issues: draft.issues,
        });
        toast.success('Verification created.');
      }

      setShowCreateModal(false);
      resetDraft();
      await fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save verification record');
    }
  };

  const handleEdit = (rec: ICompanySale) => {
    setEditingId(rec._id);
    setDraft({
      name: rec.name,
      country: rec.country,
      system: rec.system,
      connectedBy: rec.connectedBy,
      amount: rec.amount,
      mainAmount: rec.mainAmount ?? rec.amount,
      finalAmount: rec.finalAmount ?? rec.amount,
      paymentMethod: rec.paymentMethod,
      saleDate: rec.saleDate,
      customerType: rec.customerType || 'NEW',
      customerEmail: rec.customerEmail,
      alternateContactNo: rec.alternateContactNo,
      customerAddress: rec.customerAddress,
      plan: rec.plan,
      paymentMerchant: rec.paymentMerchant,
      issues: rec.issues,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this verification record?')) return;
    try {
      await companyService.deleteVerification(id);
      toast.success('Verification record deleted.');
      await fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to delete verification record');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await companyService.startVerification(id);
      toast.success('Verification started. Status updated to In Progress.');
      await fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to start verification');
    }
  };

  const handleSuccess = async (id: string) => {
    try {
      setLoading(true);
      await companyService.completeVerification(id, { status: 'SUCCESSFUL', notes });
      toast.success('Verification completed successfully! Lead moved to Feedback stage.');
      setSuccessModalId(null);
      setNotes('');
      await fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to complete verification');
    } finally {
      setLoading(false);
    }
  };

  const handleFailed = async (id: string) => {
    if (!failedReason.trim()) {
      toast.error('Failure reason is required');
      return;
    }
    try {
      setLoading(true);
      await companyService.completeVerification(id, { status: 'FAILED', failedReason: failedReason.trim() });
      toast.error('Verification marked as failed.');
      setFailedModalId(null);
      setFailedReason('');
      await fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to mark verification as failed');
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter((rec) => {
    if (activeTab !== 'ALL' && rec.verificationStatus !== activeTab) return false;
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
    pending: records.filter((r) => r.verificationStatus === 'PENDING').length,
    inProgress: records.filter((r) => r.verificationStatus === 'IN_PROGRESS').length,
    successful: records.filter((r) => r.verificationStatus === 'SUCCESSFUL').length,
    failed: records.filter((r) => r.verificationStatus === 'FAILED').length,
  };

  return (
    <div className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white tracking-tight">
            <ShieldCheck className="h-7 w-7 text-emerald-400" />
            Today's Verification
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Verify sales details, contact customers, and approve sales verification.
          </p>
        </div>
        <button
          onClick={() => { resetDraft(); setShowCreateModal(true); }}
          className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          + Create Verification
        </button>
      </header>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-500 font-semibold">Total Verification</p>
          <p className="mt-2 text-2xl font-bold text-white">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs uppercase text-amber-400 font-semibold">Pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{counts.pending}</p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-xs uppercase text-sky-400 font-semibold">In Progress</p>
          <p className="mt-2 text-2xl font-bold text-sky-300">{counts.inProgress}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase text-emerald-400 font-semibold">Successful</p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">{counts.successful}</p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="text-xs uppercase text-rose-400 font-semibold">Failed</p>
          <p className="mt-2 text-2xl font-bold text-rose-300">{counts.failed}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'SUCCESSFUL', 'FAILED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by customer, sales employee, or system..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
        />
      </div>

      {/* Verification Records Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3.5">Customer & System</th>
              <th className="p-3.5">Sales Employee</th>
              <th className="p-3.5">Amount & Payment</th>
              <th className="p-3.5">Tech Support</th>
              <th className="p-3.5">Verification Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length ? (
              filtered.map((rec) => (
                <tr key={rec._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-white text-sm">{rec.name}</p>
                      {rec.customerId && (
                        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-500/30">
                          #{rec.customerId}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{rec.country} · {rec.system}{rec.plan ? ` · ${rec.plan}` : ''}</p>
                    {rec.customerEmail && <p className="text-[10px] text-slate-400">{rec.customerEmail}{rec.alternateContactNo ? ` · Alt: ${rec.alternateContactNo}` : ''}</p>}
                    {rec.customerAddress && <p className="text-[10px] text-slate-500 truncate max-w-xs">{rec.customerAddress}</p>}
                  </td>
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-200">{rec.salesEmployeeName || rec.connectedBy}</p>
                    <p className="text-[11px] text-slate-500">Date: {rec.saleDate}</p>
                  </td>
                  <td className="p-3.5">
                    <p className="font-mono font-bold text-emerald-400 text-sm">${rec.amount?.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400">{rec.paymentMethod}{rec.paymentMerchant ? ` (${rec.paymentMerchant})` : ''}</p>
                  </td>
                  <td className="p-3.5">
                    {rec.techSupportEmployeeName ? (
                      <div>
                        <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/20">
                          SUCCESSFUL
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">{rec.techSupportEmployeeName}</p>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">N/A (No Tech Support)</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        rec.verificationStatus === 'SUCCESSFUL'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : rec.verificationStatus === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : rec.verificationStatus === 'IN_PROGRESS'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {rec.verificationStatus === 'SUCCESSFUL' && <CheckCircle className="h-3 w-3" />}
                      {rec.verificationStatus === 'FAILED' && <XCircle className="h-3 w-3" />}
                      {rec.verificationStatus === 'IN_PROGRESS' && <Clock className="h-3 w-3" />}
                      {rec.verificationStatus || 'PENDING'}
                    </span>
                    {rec.verifiedByName && (
                      <p className="text-[10px] text-slate-400 mt-1">Verified by: {rec.verifiedByName}</p>
                    )}
                    {rec.verificationFailedReason && (
                      <p className="text-[10px] text-rose-400 mt-1">Reason: {rec.verificationFailedReason}</p>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(rec)}
                        className="rounded-lg bg-slate-700 px-2.5 py-1.5 text-[10px] font-semibold text-slate-200 hover:bg-slate-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void handleDelete(rec._id)}
                        className="rounded-lg bg-rose-700 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                    {rec.verificationStatus === 'PENDING' && (
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => void handleStart(rec._id)}
                          className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition-colors shadow"
                        >
                          <Play className="h-3.5 w-3.5" /> Start
                        </button>
                      </div>
                    )}
                    {(rec.verificationStatus === 'PENDING' || rec.verificationStatus === 'IN_PROGRESS') && (
                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          onClick={() => {
                            setSuccessModalId(rec._id);
                            setNotes('');
                          }}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Successful
                        </button>
                        <button
                          onClick={() => {
                            setFailedModalId(rec._id);
                            setFailedReason('');
                          }}
                          className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors shadow"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Failed
                        </button>
                      </div>
                    )}
                    {(rec.verificationStatus === 'SUCCESSFUL' || rec.verificationStatus === 'FAILED') && (
                      <span className="text-xs text-slate-500 italic">Completed</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500">
                  No verification tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">{editingId ? 'Edit Verification Record' : 'Create Verification Record'}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-400">Customer Name<input value={draft.name || ''} onChange={(e) => setDraft((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500" /></label>
              <label className="text-xs text-slate-400">Country<input value={draft.country || ''} onChange={(e) => setDraft((f) => ({ ...f, country: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500" /></label>
              <label className="text-xs text-slate-400">System<input value={draft.system || ''} onChange={(e) => setDraft((f) => ({ ...f, system: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500" /></label>
              <label className="text-xs text-slate-400">Sales Employee<input value={draft.connectedBy || ''} onChange={(e) => setDraft((f) => ({ ...f, connectedBy: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500" /></label>
              <label className="text-xs text-slate-400">Amount<input type="number" min="0" step="0.01" value={draft.amount ?? 0} onChange={(e) => setDraft((f) => ({ ...f, amount: Number(e.target.value), mainAmount: Number(f.mainAmount ?? e.target.value), finalAmount: Number(f.finalAmount ?? e.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500" /></label>
              <label className="text-xs text-slate-400">Customer Type<select value={draft.customerType || 'NEW'} onChange={(e) => setDraft((f) => ({ ...f, customerType: e.target.value as ICompanySale['customerType'] }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500"><option value="NEW">New</option><option value="EXISTING_CUSTOMER">Existing Customer</option><option value="UPGRADE">Upgrade</option></select></label>
              <label className="text-xs text-slate-400">Payment Method<select value={draft.paymentMethod || 'Card'} onChange={(e) => setDraft((f) => ({ ...f, paymentMethod: e.target.value as ICompanySale['paymentMethod'] }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500"><option value="Card">Card</option><option value="Check">Check</option><option value="Wire Transfer">Wire Transfer</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option><option value="Online">Online</option><option value="Other">Other</option></select></label>
              <label className="text-xs text-slate-400">Sale Date<input type="date" value={draft.saleDate || new Date().toISOString().slice(0, 10)} onChange={(e) => setDraft((f) => ({ ...f, saleDate: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500" /></label>
              <label className="text-xs text-slate-400 sm:col-span-2">Customer Email<input value={draft.customerEmail || ''} onChange={(e) => setDraft((f) => ({ ...f, customerEmail: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500" /></label>
              <label className="text-xs text-slate-400">Alt Mobile<input value={draft.alternateContactNo || ''} onChange={(e) => setDraft((f) => ({ ...f, alternateContactNo: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500" /></label>
              <label className="text-xs text-slate-400">Plan<input value={draft.plan || ''} onChange={(e) => setDraft((f) => ({ ...f, plan: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-500" /></label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowCreateModal(false); resetDraft(); }} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300">Cancel</button>
              <button onClick={() => void handleCreateOrUpdate()} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">{editingId ? 'Save Changes' : 'Create Record'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Complete Verification
            </h3>
            <p className="text-xs text-slate-400">
              Confirm that customer details and sale terms have been verified.
            </p>
            <label className="block space-y-1 text-xs text-slate-400">
              <span>Notes / Remarks (Optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter verification notes..."
                className="w-full h-20 rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSuccessModalId(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={() => void handleSuccess(successModalId)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow"
              >
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failed Modal */}
      {failedModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-400" />
              Verification Failed
            </h3>
            <p className="text-xs text-slate-400">
              State the reason why customer verification could not be completed.
            </p>
            <label className="block space-y-1 text-xs text-slate-400">
              <span>Failure Reason <span className="text-rose-400">*</span></span>
              <textarea
                required
                value={failedReason}
                onChange={(e) => setFailedReason(e.target.value)}
                placeholder="Enter verification failure reason..."
                className="w-full h-24 rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white outline-none focus:border-rose-500"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFailedModalId(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={() => void handleFailed(failedModalId)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 shadow"
              >
                Submit Failure Reason
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

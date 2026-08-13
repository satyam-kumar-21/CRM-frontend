'use client';

import { useEffect, useState } from 'react';
import {
  CalendarCheck, Phone, Globe, Monitor, CheckCircle, XCircle,
  Clock, DollarSign, Send, Shield, AlertTriangle, User,
  Banknote, Wrench, Mail, MapPin, FileText, CreditCard,
  Building, Check, X, Sparkles, Smartphone, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { companyService, ICompanyLead } from '@/services/companyService';

type PaymentMethod = 'Card' | 'Check' | 'Wire Transfer' | 'Cash' | 'UPI' | 'Bank Transfer' | 'Online' | 'Other';

interface CloseSaleFormState {
  customerEmail: string;
  alternateContactNo: string;
  customerAddress: string;
  issues: string;
  plan: string;
  paymentMerchant: string;
  salePaymentMethod: PaymentMethod;
  saleAmount: string;
}

/* ─── helpers ─────────────────────────────────────────────── */
const isToday = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const sortLeads = (data: ICompanyLead[]): ICompanyLead[] => {
  const order = (l: ICompanyLead): number => {
    if (l.finalStatus === 'CLOSED' || l.finalStatus === 'PAYMENT_FAILED') return 100;
    if (l.status === 'COMPLETED') return 99;
    if (l.connected === 'yes' && l.isSale === 'yes' && l.saleAmount) return 1;
    if (l.connected === 'yes' && l.isSale === 'yes') return 2;
    if (l.connected === 'yes') return 3;
    if (l.connected === 'no') return 10;
    return 20;
  };
  return [...data].sort((a, b) => order(a) - order(b));
};

/* ─── step indicator ─────────────────────────────────────── */
const getActiveStep = (lead: ICompanyLead): number => {
  if (lead.finalStatus === 'CLOSED' || lead.finalStatus === 'PAYMENT_FAILED') return 6;
  if (lead.status === 'COMPLETED') return 6;
  const ts = lead.techSupportStatus || 'NONE';
  if (lead.saleAmount && lead.isSale === 'yes') {
    if (ts === 'PENDING' || ts === 'ACCEPTED') return 5;
    if (ts === 'SUCCESSFUL' || ts === 'FAILED' || ts === 'NONE') return 5;
    return 4;
  }
  if (lead.isSale === 'yes') return 3;
  if (lead.connected === 'yes') return 2;
  return 1;
};

/* ─── step badge ─────────────────────────────────────────── */
const StepBadge = ({ n, active, done }: { n: number; active: boolean; done: boolean }) => (
  <div
    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${done
        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
        : active
          ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/20'
          : 'bg-slate-800 text-slate-500'
      }`}
  >
    {done ? <CheckCircle className="h-4 w-4" /> : n}
  </div>
);

/* ─── main component ─────────────────────────────────────── */
export function SalesTodaysWorkSection() {
  const [leads, setLeads] = useState<ICompanyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountInputs, setAmountInputs] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Closing Sale Modal / Form state
  const [closingLead, setClosingLead] = useState<ICompanyLead | null>(null);
  const [closingForm, setClosingForm] = useState<CloseSaleFormState>({
    customerEmail: '',
    alternateContactNo: '',
    customerAddress: '',
    issues: '',
    plan: '1 Year Tech Support',
    paymentMerchant: 'Stripe',
    salePaymentMethod: 'Card',
    saleAmount: '',
  });

  const fetchLeads = async () => {
    try {
      const data = await companyService.getLeads();
      setLeads(sortLeads(data.filter((l) => isToday(l.acceptedAt))));
    } catch {
      toast.error('Unable to fetch leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLeads();
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: window.localStorage.getItem('companyAccessToken') || undefined },
      withCredentials: true,
    });
    socket.on('lead:accepted', () => void fetchLeads());
    socket.on('lead:updated', () => void fetchLeads());
    socket.on('support:completed', () => void fetchLeads());
    socket.on('support:failed', () => void fetchLeads());
    return () => { socket.disconnect(); };
  }, []);

  const patch = async (leadId: string, payload: Partial<ICompanyLead>, msg: string) => {
    try {
      setSavingId(leadId);
      const updated = await companyService.updateLead(leadId, payload);
      setLeads((cur) => sortLeads(cur.map((l) => (l._id === leadId ? updated : l))));
      toast.success(msg);
      return updated;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Update failed');
      throw e;
    } finally {
      setSavingId(null);
    }
  };

  const handleRequestTechSupport = async (lead: ICompanyLead) => {
    try {
      setSavingId(lead._id);
      await companyService.createRemoteSupport({
        customerName: lead.name,
        customerContact: lead.contactNo,
        system: lead.system,
        otherDetails: lead.otherDetails,
        issueReason: lead.otherDetails || 'Remote support requested from Today\'s Work',
        leadId: lead._id,
      });
      const updated = await companyService.updateLead(lead._id, { techSupportStatus: 'PENDING' });
      setLeads((cur) => sortLeads(cur.map((l) => (l._id === lead._id ? updated : l))));
      toast.success('Tech Support requested!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Unable to request tech support');
    } finally {
      setSavingId(null);
    }
  };

  // Step 3: Save amount ONLY (no payment method here)
  const handleSaveAmount = async (lead: ICompanyLead) => {
    const rawAmount = amountInputs[lead._id] ?? String(lead.saleAmount || '');
    if (!rawAmount || Number(rawAmount) <= 0) {
      toast.error('Please enter a valid sale amount ($)');
      return;
    }
    await patch(lead._id, { saleAmount: Number(rawAmount) }, 'Agreed sale amount saved!');
  };

  // Step 5: Open Closing Modal / Form
  const openClosingModal = (lead: ICompanyLead) => {
    setClosingLead(lead);
    setClosingForm({
      customerEmail: lead.customerEmail || '',
      alternateContactNo: lead.alternateContactNo || '',
      customerAddress: lead.customerAddress || '',
      issues: lead.issues || lead.otherDetails || '',
      plan: lead.plan || '1 Year Tech Support',
      paymentMerchant: lead.paymentMerchant || 'Stripe',
      salePaymentMethod: lead.salePaymentMethod || 'Card',
      saleAmount: String(lead.saleAmount || ''),
    });
  };

  // Step 5: Submit Final Sale Closure
  const handleConfirmCloseSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingLead) return;

    const amountNum = Number(closingForm.saleAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid sale amount ($)');
      return;
    }

    try {
      setSavingId(closingLead._id);
      await companyService.updateLead(closingLead._id, {
        finalStatus: 'CLOSED',
        saleAmount: amountNum,
        salePaymentMethod: closingForm.salePaymentMethod,
        customerEmail: closingForm.customerEmail.trim(),
        alternateContactNo: closingForm.alternateContactNo.trim(),
        customerAddress: closingForm.customerAddress.trim(),
        issues: closingForm.issues.trim(),
        plan: closingForm.plan.trim(),
        paymentMerchant: closingForm.paymentMerchant.trim(),
      });

      toast.success('🎉 Sale successfully closed! Customer Unique ID generated & deal added to My Sales.');
      setClosingLead(null);
      await fetchLeads();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Unable to complete sale closing');
    } finally {
      setSavingId(null);
    }
  };

  const handlePaymentFailed = (lead: ICompanyLead) => {
    if (window.confirm(`Mark sale as Payment Failed for ${lead.name}? This will complete the lead workflow without recording a sale.`)) {
      void patch(lead._id, { finalStatus: 'PAYMENT_FAILED' }, 'Marked as Payment Failed.');
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-slate-950 text-slate-400">
      Loading Today's Work...
    </div>
  );

  /* ─── stats ─────────────────────────────────────────────── */
  const stats = {
    total: leads.length,
    connected: leads.filter((l) => l.connected === 'yes').length,
    techRequests: leads.filter((l) => l.techSupportStatus && l.techSupportStatus !== 'NONE').length,
    closed: leads.filter((l) => l.finalStatus === 'CLOSED').length,
  };

  return (
    <div className="min-h-full space-y-6 overflow-y-auto bg-slate-950 p-6 text-slate-100 font-sans">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-white tracking-tight">
            <CalendarCheck className="h-7 w-7 text-indigo-400" />
            Today's Work & Performance
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Step-by-step workflow: Connect with customer → Agreement & Amount → Optional Tech Support → Final Customer Details & Payment.
          </p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Leads Today', value: stats.total, sub: 'today only', color: 'border-slate-800 bg-slate-900/60', text: 'text-white', sub2: 'text-slate-600' },
          { label: 'Connected', value: stats.connected, sub: '', color: 'border-indigo-500/20 bg-indigo-500/5', text: 'text-indigo-300', sub2: '' },
          { label: 'Tech Requests', value: stats.techRequests, sub: '', color: 'border-cyan-500/20 bg-cyan-500/5', text: 'text-cyan-300', sub2: '' },
          { label: 'Closed Sales', value: stats.closed, sub: '', color: 'border-emerald-500/20 bg-emerald-500/5', text: 'text-emerald-300', sub2: '' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.color} p-4`}>
            <p className="text-xs uppercase text-slate-500 font-semibold">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.text}`}>{s.value}</p>
            {s.sub && <p className={`text-[10px] mt-1 ${s.sub2}`}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Lead List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          Today's Active Leads
          <span className="text-xs font-normal text-slate-500">— connected first, then next steps</span>
        </h2>

        {leads.length === 0 ? (
          <div className="text-center py-12 border border-slate-800 rounded-2xl bg-slate-900/40 text-slate-500 text-sm">
            No leads accepted today yet. Accept leads from Workspace Chat to manage your work here.
          </div>
        ) : (
          leads.map((lead) => {
            const activeStep = getActiveStep(lead);
            const ts = lead.techSupportStatus || 'NONE';
            const isSaving = savingId === lead._id;
            const isLocked = lead.finalStatus === 'CLOSED' || lead.finalStatus === 'PAYMENT_FAILED';

            // Step status helpers
            const step1Done = lead.connected === 'yes';
            const step2Done = lead.connected === 'yes' && lead.isSale !== undefined && !!lead.isSale;
            const step3Done = !!(lead.saleAmount && lead.saleAmount > 0);
            const step4Done = ts !== 'NONE';
            const techSkipped = step3Done && ts === 'NONE' && (activeStep >= 5 || lead.finalStatus === 'PENDING_PAYMENT');

            const canConfirmPayment = step3Done && (ts === 'SUCCESSFUL' || ts === 'FAILED' || ts === 'NONE') && !isLocked && lead.connected === 'yes' && lead.isSale === 'yes';
            const showTechStep = step3Done && !isLocked && lead.isSale === 'yes';
            const canRequestTech = showTechStep && ts === 'NONE';

            return (
              <div
                key={lead._id}
                className={`rounded-2xl border bg-slate-900/70 shadow-lg transition-all ${isLocked
                    ? lead.finalStatus === 'CLOSED'
                      ? 'border-emerald-500/30 ring-1 ring-emerald-500/20'
                      : 'border-rose-500/30'
                    : 'border-slate-800'
                  }`}
              >
                {/* Lead Header */}
                <div className={`flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3 border-b ${isLocked ? lead.finalStatus === 'CLOSED' ? 'border-emerald-500/20 bg-emerald-950/10' : 'border-rose-500/20' : 'border-slate-800/70'}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white">{lead.name}</h3>
                      {lead.finalStatus === 'CLOSED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> SALE CLOSED & COMPLETED
                        </span>
                      )}
                      {lead.finalStatus === 'PAYMENT_FAILED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> PAYMENT FAILED
                        </span>
                      )}
                      {!lead.finalStatus && lead.status !== 'COMPLETED' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          IN WORKFLOW
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-slate-500" />{lead.country}</span>
                      <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5 text-slate-500" />{lead.system}</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold"><Phone className="h-3.5 w-3.5" />{lead.contactNo}</span>
                      {lead.assignedToName && (
                        <span className="flex items-center gap-1 text-slate-400"><User className="h-3.5 w-3.5" />{lead.assignedToName}</span>
                      )}
                    </div>
                  </div>
                  {lead.otherDetails && (
                    <div className="max-w-xs text-xs text-slate-400 bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
                      <span className="font-semibold text-slate-300">Lead Info:</span> {lead.otherDetails}
                    </div>
                  )}
                </div>

                {/* Steps Container */}
                <div className="px-5 py-4 space-y-0">

                  {/* ── Step 1: Connected ─────────────────────────── */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <StepBadge n={1} active={activeStep === 1} done={step1Done} />
                      <div className="w-px flex-1 bg-slate-800 mt-1" />
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-300 uppercase mb-2">1. Connected to Customer?</p>
                      <div className="flex gap-2 max-w-xs">
                        <button
                          disabled={isLocked || isSaving}
                          onClick={() => void patch(lead._id, { connected: 'yes' }, 'Marked Connected: YES')}
                          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${lead.connected === 'yes' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >YES</button>
                        <button
                          disabled={isLocked || isSaving}
                          onClick={() => void patch(lead._id, { connected: 'no' }, 'Marked Connected: NO')}
                          className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${lead.connected === 'no' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >NO</button>
                      </div>
                    </div>
                  </div>

                  {/* ── Step 2: Is Sale ───────────────────────────── */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <StepBadge n={2} active={activeStep === 2} done={step2Done && lead.isSale === 'yes'} />
                      <div className="w-px flex-1 bg-slate-800 mt-1" />
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <p className={`text-xs font-bold uppercase mb-2 ${lead.connected !== 'yes' ? 'text-slate-600' : 'text-slate-300'}`}>
                        2. Is this a Sale?
                      </p>
                      {lead.connected !== 'yes' ? (
                        <p className="text-xs text-slate-600 italic">Complete step 1 first</p>
                      ) : (
                        <div className="flex gap-2 max-w-xs">
                          <button
                            disabled={isLocked || isSaving}
                            onClick={() => void patch(lead._id, { isSale: 'yes' }, 'Marked as Sale: YES')}
                            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${lead.isSale === 'yes' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                          >YES</button>
                          <button
                            disabled={isLocked || isSaving}
                            onClick={() => void patch(lead._id, { isSale: 'no' }, 'Marked as Sale: NO')}
                            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${lead.isSale === 'no' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                          >NO</button>
                        </div>
                      )}
                      {lead.isSale === 'no' && lead.connected === 'yes' && !isLocked && (
                        <p className="mt-1.5 text-[11px] text-rose-400">Customer not interested in sale.</p>
                      )}
                    </div>
                  </div>

                  {/* ── Step 3: Enter Agreed Amount ONLY (No Mode of Payment here) ── */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <StepBadge n={3} active={activeStep === 3} done={step3Done} />
                      <div className="w-px flex-1 bg-slate-800 mt-1" />
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <p className={`text-xs font-bold uppercase mb-2 ${lead.isSale !== 'yes' ? 'text-slate-600' : 'text-slate-300'}`}>
                        3. Enter Agreed Sale Amount
                      </p>
                      {lead.isSale !== 'yes' ? (
                        <p className="text-xs text-slate-600 italic">Requires Is Sale = YES</p>
                      ) : step3Done && isLocked ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                          <Banknote className="h-4 w-4" />
                          <span className="font-semibold text-sm">${lead.saleAmount?.toLocaleString()}</span>
                        </div>
                      ) : step3Done ? (
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                            <Banknote className="h-4 w-4 text-emerald-400" />
                            <span className="font-bold text-emerald-300 text-sm">${lead.saleAmount?.toLocaleString()}</span>
                            <span className="text-slate-400">(agreed amount)</span>
                          </div>
                          <button
                            disabled={isSaving}
                            onClick={() => setAmountInputs((cur) => ({ ...cur, [lead._id]: String(lead.saleAmount || '') }))}
                            className="text-indigo-400 hover:text-indigo-300 text-xs underline font-medium"
                          >Change</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 max-w-sm">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">$</span>
                            <input
                              type="number"
                              min="1"
                              step="0.01"
                              placeholder="e.g. 250.00"
                              value={amountInputs[lead._id] ?? ''}
                              onChange={(e) => setAmountInputs((cur) => ({ ...cur, [lead._id]: e.target.value }))}
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-7 pr-3 py-2 text-xs text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <button
                            disabled={isSaving}
                            onClick={() => void handleSaveAmount(lead)}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow transition-all shrink-0"
                          >
                            <Send className="h-3.5 w-3.5" /> Save Amount
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Step 4: Tech Support ──────────────────────── */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <StepBadge n={4} active={activeStep === 4 && showTechStep} done={step4Done || techSkipped} />
                      <div className="w-px flex-1 bg-slate-800 mt-1" />
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <p className={`text-xs font-bold uppercase mb-2 ${!showTechStep ? 'text-slate-600' : 'text-slate-300'}`}>
                        4. Tech Support Required?
                      </p>
                      {!showTechStep ? (
                        <p className="text-xs text-slate-600 italic">Requires amount to be saved first</p>
                      ) : canRequestTech ? (
                        <div className="flex gap-2 max-w-xs">
                          <button
                            disabled={isSaving}
                            onClick={() => void handleRequestTechSupport(lead)}
                            className="flex-1 rounded-lg bg-cyan-600 py-2 text-xs font-bold text-white hover:bg-cyan-500 shadow transition-all flex items-center justify-center gap-1"
                          >
                            <Wrench className="h-3.5 w-3.5" /> Request Support
                          </button>
                          <button
                            disabled={isSaving}
                            onClick={() => {
                              void patch(lead._id, { finalStatus: 'PENDING_PAYMENT' }, 'No tech support needed — ready for final closing.');
                            }}
                            className="flex-1 rounded-lg bg-slate-800 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all"
                          >Not Needed</button>
                        </div>
                      ) : ts === 'PENDING' || ts === 'ACCEPTED' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock className="h-3.5 w-3.5" /> Tech Support {ts}
                          </span>
                          {lead.techSupportEmployeeName && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <User className="h-3 w-3" /> Agent: {lead.techSupportEmployeeName}
                            </span>
                          )}
                        </div>
                      ) : ts === 'SUCCESSFUL' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle className="h-3.5 w-3.5" /> Tech Support SUCCESSFUL
                          </span>
                          {lead.techSupportEmployeeName && (
                            <span className="text-xs text-slate-400">Agent: {lead.techSupportEmployeeName}</span>
                          )}
                        </div>
                      ) : ts === 'FAILED' ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <XCircle className="h-3.5 w-3.5" /> Tech Support FAILED
                          </span>
                        </div>
                      ) : techSkipped || lead.finalStatus === 'PENDING_PAYMENT' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700/60 text-slate-400 border border-slate-700">
                          <Shield className="h-3.5 w-3.5" /> Not Required
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* ── Step 5: Payment & Final Details ─────────────── */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <StepBadge n={5} active={canConfirmPayment && !isLocked} done={isLocked} />
                    </div>
                    <div className="pb-2 flex-1 min-w-0">
                      <p className={`text-xs font-bold uppercase mb-2 ${!canConfirmPayment && !isLocked ? 'text-slate-600' : 'text-slate-300'}`}>
                        5. Final Step: Customer Details & Payment
                      </p>

                      {isLocked ? (
                        lead.finalStatus === 'CLOSED' ? (
                          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle className="h-4 w-4" /> Sale Closed Successfully
                              </span>
                              <span className="font-mono font-bold text-emerald-400 text-base">
                                ${lead.saleAmount?.toLocaleString()}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-300">
                              {lead.customerEmail && (
                                <div><span className="text-slate-500 block">Email:</span> {lead.customerEmail}</div>
                              )}
                              {lead.alternateContactNo && (
                                <div><span className="text-slate-500 block">Alt Mobile:</span> {lead.alternateContactNo}</div>
                              )}
                              {lead.paymentMerchant && (
                                <div><span className="text-slate-500 block">Merchant:</span> {lead.paymentMerchant}</div>
                              )}
                              {lead.salePaymentMethod && (
                                <div><span className="text-slate-500 block">Payment Mode:</span> {lead.salePaymentMethod}</div>
                              )}
                              {lead.plan && (
                                <div><span className="text-slate-500 block">Plan:</span> {lead.plan}</div>
                              )}
                              {lead.customerAddress && (
                                <div className="col-span-2"><span className="text-slate-500 block">Address:</span> {lead.customerAddress}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 w-fit">
                            <XCircle className="h-4 w-4" /> Payment Not Received — Sale Failed
                          </span>
                        )
                      ) : canConfirmPayment ? (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400">
                            {ts === 'SUCCESSFUL'
                              ? 'Tech support completed! Collect customer details and payment confirmation to finalize the sale.'
                              : 'Ready to finalize sale. Enter customer details, merchant, and payment mode.'}
                          </p>

                          <div className="flex flex-wrap gap-2.5">
                            <button
                              disabled={isSaving}
                              onClick={() => openClosingModal(lead)}
                              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                            >
                              <Sparkles className="h-4 w-4" /> YES — Fill Details & Close Sale
                            </button>
                            <button
                              disabled={isSaving}
                              onClick={() => handlePaymentFailed(lead)}
                              className="rounded-lg bg-rose-700/80 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-600 shadow transition-all flex items-center gap-1.5"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" /> NO — Payment Failed
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 italic">
                          {!step3Done
                            ? 'Save the agreed sale amount first'
                            : ts === 'PENDING' || ts === 'ACCEPTED'
                              ? 'Waiting for tech support agent to complete the ticket...'
                              : 'Complete previous steps'}
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Modal: Fill Customer Details & Close Sale ─────────── */}
      {closingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Final Sale Closure & Customer Details
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm customer information, merchant, and payment mode. A sequential 6-digit Customer Unique ID will be generated.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClosingLead(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer Summary Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer Overview</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Name:</span>
                  <span className="font-bold text-white">{closingLead.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Primary Contact:</span>
                  <span className="font-semibold text-emerald-400">{closingLead.contactNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Country:</span>
                  <span className="text-slate-200">{closingLead.country}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">System:</span>
                  <span className="text-slate-200">{closingLead.system}</span>
                </div>
              </div>
              {closingLead.techSupportEmployeeName && (
                <div className="pt-2 border-t border-slate-900 text-xs text-slate-400 flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Tech Support Handled by: <b className="text-cyan-300">{closingLead.techSupportEmployeeName}</b> ({closingLead.techSupportStatus})</span>
                </div>
              )}
            </div>

            {/* Closing Form */}
            <form onSubmit={handleConfirmCloseSale} className="space-y-4">
              <div className="grid gap-3.5 sm:grid-cols-2">

                {/* Email Address */}
                <label className="block space-y-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Mail className="h-3.5 w-3.5 text-indigo-400" /> Customer Email Address
                  </span>
                  <input
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={closingForm.customerEmail}
                    onChange={(e) => setClosingForm((f) => ({ ...f, customerEmail: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </label>

                {/* Alternate Mobile */}
                <label className="block space-y-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Smartphone className="h-3.5 w-3.5 text-indigo-400" /> Alternate Mobile No
                  </span>
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0192"
                    value={closingForm.alternateContactNo}
                    onChange={(e) => setClosingForm((f) => ({ ...f, alternateContactNo: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </label>

                {/* Customer Address */}
                <label className="block space-y-1 text-xs text-slate-300 sm:col-span-2">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" /> Customer Full Address
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. 742 Evergreen Terrace, Springfield, OR 97477"
                    value={closingForm.customerAddress}
                    onChange={(e) => setClosingForm((f) => ({ ...f, customerAddress: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </label>

                {/* Issues Description */}
                <label className="block space-y-1 text-xs text-slate-300 sm:col-span-2">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" /> Issues / Problem Description
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Printer offline, driver installation, system speedup"
                    value={closingForm.issues}
                    onChange={(e) => setClosingForm((f) => ({ ...f, issues: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </label>

                {/* Plan */}
                <label className="block space-y-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" /> Plan / Package
                  </span>
                  <input
                    list="plan-options"
                    type="text"
                    placeholder="e.g. 1 Year Tech Support"
                    value={closingForm.plan}
                    onChange={(e) => setClosingForm((f) => ({ ...f, plan: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <datalist id="plan-options">
                    <option value="1 Year Tech Support" />
                    <option value="2 Year Tech Support" />
                    <option value="Lifetime Support" />
                    <option value="Single Incident Fix" />
                    <option value="Antivirus + Support Bundle" />
                    <option value="Premium Protection Plan" />
                  </datalist>
                </label>

                {/* Payment Merchant */}
                <label className="block space-y-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <Building className="h-3.5 w-3.5 text-indigo-400" /> Payment Merchant
                  </span>
                  <input
                    list="merchant-options"
                    type="text"
                    placeholder="e.g. Stripe, PayPal, Square, Authorize.Net"
                    value={closingForm.paymentMerchant}
                    onChange={(e) => setClosingForm((f) => ({ ...f, paymentMerchant: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <datalist id="merchant-options">
                    <option value="Stripe" />
                    <option value="PayPal" />
                    <option value="Square" />
                    <option value="Authorize.Net" />
                    <option value="Razorpay" />
                    <option value="Clover" />
                    <option value="Direct Bank Wire" />
                    <option value="POS Terminal" />
                    <option value="Cash / Other" />
                  </datalist>
                </label>

                {/* Mode of Payment */}
                <label className="block space-y-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <CreditCard className="h-3.5 w-3.5 text-indigo-400" /> Mode of Payment
                  </span>
                  <select
                    value={closingForm.salePaymentMethod}
                    onChange={(e) => setClosingForm((f) => ({ ...f, salePaymentMethod: e.target.value as PaymentMethod }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    {(['Card', 'Check', 'Wire Transfer', 'Cash', 'UPI', 'Bank Transfer', 'Online', 'Other'] as PaymentMethod[]).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>

                {/* Final Sale Amount */}
                <label className="block space-y-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Final Sale Amount ($)
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="e.g. 250.00"
                    value={closingForm.saleAmount}
                    onChange={(e) => setClosingForm((f) => ({ ...f, saleAmount: e.target.value }))}
                    className="w-full rounded-lg border border-emerald-500/50 bg-slate-950 px-3 py-2 text-xs font-bold text-emerald-300 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </label>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setClosingLead(null)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(savingId)}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> {savingId ? 'Closing Sale...' : 'Complete Sale & Generate Customer ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

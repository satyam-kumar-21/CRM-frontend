'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Layers,
  LifeBuoy,
  MessageSquare,
  Percent,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { companyService, type IRemoteSupportRecord } from '@/services/companyService';
import type { IEmployee } from '../types';

type EmployeeDetailsModalProps = {
  employee: IEmployee;
  companyEmployees: IEmployee[];
  onClose: () => void;
  onOpenChat: (employeeId: string) => void;
  onOpenSection: (section: 'chat' | 'remote-support' | 'projects' | 'sales' | 'leads') => void;
};

export function EmployeeDetailsModal({
  employee,
  companyEmployees,
  onClose,
  onOpenChat,
  onOpenSection,
}: EmployeeDetailsModalProps) {
  const [supportRecords, setSupportRecords] = useState<IRemoteSupportRecord[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);

  const role = employee.role;
  const salesTarget = employee.salesTarget?.monthlyTarget || 0;
  const achieved = employee.salesTarget?.monthlyAchieved || 0;
  const progress = salesTarget ? Math.min(100, Math.round((achieved / salesTarget) * 100)) : 0;
  const teamSize = companyEmployees.length;

  useEffect(() => {
    const mode = role === 'SALES' ? 'salesEmployeeName' : role === 'TECH_SUPPORT' ? 'techSupportEmployeeName' : null;
    if (!mode) {
      setSupportRecords([]);
      return;
    }

    let mounted = true;
    setLoadingSupport(true);
    companyService
      .getRemoteSupport({ [mode]: employee.name, t: Date.now() })
      .then((records) => {
        if (!mounted) return;
        setSupportRecords(records);
      })
      .catch(() => {
        if (!mounted) return;
        toast.error('Unable to load support activity for this employee.');
      })
      .finally(() => {
        if (mounted) setLoadingSupport(false);
      });

    return () => {
      mounted = false;
    };
  }, [employee.name, role]);

  const supportSummary = useMemo(() => {
    const total = supportRecords.length;
    const successful = supportRecords.filter((record) => record.status === 'SUCCESSFUL').length;
    const failed = supportRecords.filter((record) => record.status === 'FAILED').length;
    const inProgress = supportRecords.filter((record) => record.status === 'IN_PROGRESS').length;
    const pending = supportRecords.filter((record) => record.status === 'PENDING').length;
    return {
      total,
      successful,
      failed,
      inProgress,
      pending,
      successRate: total ? Math.round((successful / total) * 100) : 0,
    };
  }, [supportRecords]);

  const roleDescription = useMemo(() => {
    switch (role) {
      case 'SALES':
        return 'Revenue driver with client ownership and sales target performance.';
      case 'TECH_SUPPORT':
        return 'Technical support specialist managing remote incidents and customer handovers.';
      case 'IT':
        return 'IT team member overseeing projects, systems, and technical delivery.';
      case 'MANAGER':
      case 'TEAM_LEAD':
        return 'Team lead responsible for operations, performance, and cross-functional delivery.';
      case 'HR':
        return 'HR specialist focused on people operations, hiring, and employee support.';
      default:
        return 'Operational employee supporting day-to-day business workflows and collaboration.';
    }
  }, [role]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-950/80 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">Employee details</p>
            <h2 className="mt-3 text-3xl font-bold text-white">{employee.name}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">{employee.role} · {employee.email}</p>
            <p className="mt-3 text-sm text-slate-500">{roleDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onOpenChat(employee.id)} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              <MessageSquare className="h-4 w-4" /> Open chat
            </button>
            {role === 'SALES' && <button onClick={() => onOpenSection('remote-support')} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"><LifeBuoy className="h-4 w-4" /> Support queue</button>}
            {(role === 'IT' || role === 'MANAGER' || role === 'TEAM_LEAD') && <button onClick={() => onOpenSection('projects')} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"><Layers className="h-4 w-4" /> Projects</button>}
            <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-600"><ArrowRight className="h-4 w-4 rotate-180" /> Close</button>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailCard label="Employee ID" value={employee.employeeId} icon={User} />
                <DetailCard label="Joined" value={employee.joinedDate || 'Unknown'} icon={Clock3} />
                <DetailCard label="Status" value={employee.isSuspended ? 'Blocked' : 'Active'} icon={CheckCircle2} />
                <DetailCard label="Team size" value={`${teamSize}`} icon={Users} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard icon={Target} label="Monthly target" value={salesTarget ? `$${salesTarget.toLocaleString()}` : '—'} />
              <MetricCard icon={Percent} label="Progress" value={`${progress}%`} />
              <MetricCard icon={Sparkles} label="Deals / tickets" value={`${employee.dealsClosed || 0}`} />
              <MetricCard icon={Users} label="Leads assigned" value={`${employee.leadsAssigned || 0}`} />
            </div>

            {role === 'TECH_SUPPORT' && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-white">Remote support performance</h3>
                <p className="mt-2 text-sm text-slate-400">Ticket and severity overview for support handovers.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <SupportBadge label="Total tickets" value={supportSummary.total} />
                  <SupportBadge label="In progress" value={supportSummary.inProgress} />
                  <SupportBadge label="Successful" value={supportSummary.successful} />
                  <SupportBadge label="Failed" value={supportSummary.failed} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                  <span>Success rate</span>
                  <span>{supportSummary.successRate}%</span>
                </div>
              </div>
            )}

            {role === 'SALES' && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-white">Sales efficiency</h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <SupportBadge label="Target achieved" value={`$${achieved.toLocaleString()}`} />
                  <SupportBadge label="Conversion" value={`${employee.conversionRate || 0}%`} />
                </div>
                <div className="mt-4 text-sm text-slate-400">
                  <p><strong>{employee.role}</strong> is driving sales performance against monthly targets.</p>
                </div>
              </div>
            )}

            {(role === 'MANAGER' || role === 'TEAM_LEAD') && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-white">Leadership insights</h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <SupportBadge label="Peer count" value={teamSize} />
                  <SupportBadge label="Team conversion" value={`${employee.conversionRate || 0}%`} />
                </div>
                <p className="mt-4 text-sm text-slate-400">Use the project and remote support sections to explore team-level performance.</p>
              </div>
            )}

            {(role === 'IT' || role === 'HR') && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-white">Role focus</h3>
                <p className="mt-3 text-sm text-slate-400">
                  {role === 'IT'
                    ? 'IT contributors maintain systems, project delivery, and technical operations.'
                    : 'HR contributors manage hiring, employee relations, and internal support workflows.'}
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <SupportBadge label="Assigned tasks" value={`${employee.leadsAssigned || 0}`} />
                  <SupportBadge label="Team impact" value={`${employee.dealsClosed || 0}`} />
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-white">Role snapshot</h3>
              <p className="mt-3 text-sm text-slate-400">{roleDescription}</p>
              <div className="mt-6 grid gap-3">
                <MiniMetric icon={HelpCircle} label="Primary role" value={role.replace('_', ' ')} />
                <MiniMetric icon={Clock3} label="Hours today" value="Tracked in activity logs" />
                <MiniMetric icon={Users} label="Colleagues" value={`${teamSize}`} />
                <MiniMetric icon={Sparkles} label="Most recent engagement" value={supportRecords[0]?.status || 'N/A'} />
              </div>
            </div>

            {(['SALES', 'TECH_SUPPORT'].includes(role) && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Recent activity</h3>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">{loadingSupport ? 'Refreshing' : 'Latest'}</span>
                </div>
                {loadingSupport ? (
                  <div className="mt-6 text-sm text-slate-400">Loading support entries…</div>
                ) : supportRecords.length ? (
                  <div className="mt-6 space-y-3">
                    {supportRecords.slice(0, 3).map((record) => (
                      <div key={record._id} className="rounded-2xl bg-slate-900 p-3 text-sm">
                        <p className="font-semibold text-white">{record.customerName}</p>
                        <p className="mt-1 text-slate-400">{new Date(record.dateTime).toLocaleDateString()} · {record.status.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 text-sm text-slate-400">No recent support activities found.</div>
                )}
              </div>
            ))}

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-white">Quick access</h3>
              <div className="mt-4 grid gap-3">
                <ButtonRow onClick={() => onOpenChat(employee.id)} icon={MessageSquare} label="Start chat" />
                {role === 'SALES' && <ButtonRow onClick={() => onOpenSection('remote-support')} icon={LifeBuoy} label="Open support board" />}
                {(role === 'MANAGER' || role === 'TEAM_LEAD' || role === 'IT') && <ButtonRow onClick={() => onOpenSection('projects')} icon={Layers} label="Open projects" />}
                {role === 'SALES' && <ButtonRow onClick={() => onOpenSection('leads')} icon={Target} label="Review leads" />}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof User }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center gap-3 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Target }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
      <div className="flex items-center gap-3 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SupportBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-sm">
      <p className="text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value }: { icon: typeof HelpCircle; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-300"><Icon className="h-4 w-4" /></div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function ButtonRow({ icon: Icon, label, onClick }: { icon: typeof MessageSquare; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-slate-800">
      <span>{label}</span>
      <Icon className="h-4 w-4 text-slate-400" />
    </button>
  );
}

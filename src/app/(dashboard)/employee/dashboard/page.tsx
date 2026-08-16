'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, CalendarCheck, MessageSquare, TrendingUp, UserCircle, UserPlus, Flag, Layers, LifeBuoy, ShieldCheck } from 'lucide-react';
import { companyService, ICompanyDashboard, ICompanyMessage, IProjectRecord, IRemoteSupportRecord } from '@/services/companyService';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CompanyAdminSidebar, type CompanyAdminNavItem } from '../../company-admin/dashboard/components/CompanyAdminSidebar';
import { ChatSection } from '../../company-admin/dashboard/components/workspaceChat';
import { EmployeeOverviewSection } from '../../company-admin/dashboard/components/EmployeeOverviewSection';
import ManagerOverviewSection from './components/ManagerOverviewSection';
import ManagerTodaysReportSection from './components/ManagerTodaysReportSection';
import { LeadsSection, SalesSection } from '../../company-admin/dashboard/components/SalesLeadsSections';
import { FailedSalesSection } from '../../company-admin/dashboard/components/FailedSalesSection';
import { WorkspaceNotificationWatcher } from '../../company-admin/dashboard/components/WorkspaceNotificationWatcher';
import EmployeeRouteGuard from '@/components/EmployeeRouteGuard';
import { AttendanceSection } from '../../company-admin/dashboard/components/AttendanceSection';
import { AnnouncementsSection } from '../../company-admin/dashboard/components';
import { LeaveSection } from '../../company-admin/dashboard/components/LeaveSection';
import { RemoteSupportSection } from '../../company-admin/dashboard/components/RemoteSupportSection';
import { SalesTodaysWorkSection } from '../../company-admin/dashboard/components/SalesTodaysWorkSection';
import { TechSupportTodaysWorkSection } from '../../company-admin/dashboard/components/TechSupportTodaysWorkSection';
import { VerificationTodaysWorkSection } from '../../company-admin/dashboard/components/VerificationTodaysWorkSection';
import { VerificationSection } from '../../company-admin/dashboard/components/VerificationSection';
import { FeedbackSection } from '../../company-admin/dashboard/components/FeedbackSection';
import { UpgradeSection } from '../../company-admin/dashboard/components/UpgradeSection';
import { useCompanySettings, useCompanyValidation, type CompanySettingsResponse } from '@/lib/useCompanySettings';
import { applyTheme, THEME_OPTIONS, type ThemeName, getStoredTheme } from '@/lib/theme';
import type { ChatFilter, IEmployee, IGroupChannel, NavSection } from '../../company-admin/dashboard/types';

export default function EmployeeDashboardPage() {
  const [activeSection, setActiveSection] = useState<NavSection>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('section') === 'chat' ? 'chat' : 'overview');
  const [activeChatFilter, setActiveChatFilter] = useState<ChatFilter>('all');
  const [selectedChatId, setSelectedChatId] = useState(() => typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('conversation') || '' : '');
  const [messageInput, setMessageInput] = useState('');
  const [chatActivity, setChatActivity] = useState<Record<string, { latestChatAt: string; unreadCount: number }>>({});
  const validationQuery = useCompanyValidation();
  const settingsQuery = useCompanySettings(Boolean(validationQuery.data));
  const dashboardQuery = useQuery<ICompanyDashboard>({ queryKey: ['employeeDashboard'], queryFn: companyService.getDashboard, enabled: Boolean(validationQuery.data), retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false, refetchOnMount: false });
  const employee = dashboardQuery.data?.employee;
  const dashboardStats = dashboardQuery.data?.stats;
  const remoteSupportQuery = useQuery<IRemoteSupportRecord[]>({
    queryKey: ['remoteSupport'],
    queryFn: companyService.getRemoteSupport,
    enabled: Boolean(employee && ['SALES', 'TECH_SUPPORT'].includes(employee.role)),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
  const projectQuery = useQuery<IProjectRecord[]>({
    queryKey: ['projects'],
    queryFn: companyService.getProjects,
    enabled: Boolean(employee && ['IT', 'MANAGER', 'TEAM_LEAD'].includes(employee.role)),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
  const groups: IGroupChannel[] = useMemo(() => (dashboardQuery.data?.groups || []).map((group) => ({ id: group._id, name: group.name, description: group.description, membersCount: group.members?.length || 0, privacy: group.privacy, createdDate: new Date(group.createdAt).toLocaleDateString(), latestChatAt: chatActivity[group._id]?.latestChatAt || group.latestChatAt, unreadCount: chatActivity[group._id]?.unreadCount ?? group.unreadCount ?? 0 })), [dashboardQuery.data?.groups, chatActivity]);
  const employees: IEmployee[] = useMemo(() => (dashboardQuery.data?.chatEmployees || []).filter((item) => item._id !== dashboardQuery.data?.employee?._id).map((item) => ({ id: item._id, employeeId: item.employeeId, name: item.name, email: item.email || '', role: item.role, status: 'active', isSuspended: false, joinedDate: '', avatarBg: 'from-indigo-500 to-cyan-500', salesTarget: { monthlyTarget: 0, monthlyAchieved: 0, yearlyTarget: 0, yearlyAchieved: 0, hourlyAchievedToday: 0 }, dealsClosed: 0, conversionRate: 0, salesHistory: [], latestChatAt: chatActivity[item._id]?.latestChatAt || item.latestChatAt, unreadCount: chatActivity[item._id]?.unreadCount ?? item.unreadCount ?? 0 })), [dashboardQuery.data?.chatEmployees, dashboardQuery.data?.employee?._id, chatActivity]);
  const employeeNavigation = useMemo(() => {
    const baseNavigation: CompanyAdminNavItem[] = [
      { id: 'overview' as NavSection, label: 'Overview', icon: Activity },
      { id: 'chat' as NavSection, label: 'Workspace Chat', icon: MessageSquare, badge: 'Live' },
    ];

    const role = employee?.role;
    if (role === 'SALES') {
      baseNavigation.push(
        { id: 'todays-report' as NavSection, label: "Today's Work", icon: CalendarCheck },
        { id: 'leads' as NavSection, label: 'My Leads', icon: UserPlus },
        { id: 'sales' as NavSection, label: 'My Sales', icon: TrendingUp },
        { id: 'upgrade' as NavSection, label: 'Upgrade', icon: TrendingUp },
        { id: 'failed-sales' as NavSection, label: 'Failed Sales', icon: Flag },
        { id: 'remote-support' as NavSection, label: 'Remote Support', icon: LifeBuoy },
      );
    } else if (role === 'TECH_SUPPORT') {
      baseNavigation.push(
        { id: 'todays-report' as NavSection, label: "Today's Work", icon: CalendarCheck },
        { id: 'remote-support' as NavSection, label: 'Support Tickets', icon: LifeBuoy },
      );
    } else if (role === 'VERIFICATION') {
      baseNavigation.push(
        { id: 'todays-report' as NavSection, label: "Today's Work", icon: CalendarCheck },
        { id: 'verification' as NavSection, label: 'Verifications', icon: ShieldCheck },
        { id: 'feedback' as NavSection, label: 'Feedback', icon: MessageSquare }
      );
    } else if (role === 'IT') {
      baseNavigation.push({ id: 'projects' as NavSection, label: 'IT Projects', icon: Layers });
    }

    if (role === 'MANAGER') {
      baseNavigation.push({ id: 'todays-report' as NavSection, label: "Today's Report", icon: TrendingUp });
    }

    baseNavigation.push(
      { id: 'attendance' as NavSection, label: 'Attendance', icon: CalendarCheck },
      { id: 'announcements' as NavSection, label: 'Announcements', icon: Bell, count: dashboardQuery.data?.announcements?.unread },
      { id: 'leave' as NavSection, label: 'Leave', icon: CalendarCheck, count: dashboardQuery.data?.leave?.myLeaveRequests },
      { id: 'profile' as NavSection, label: 'Profile', icon: UserCircle },
    );

    return baseNavigation;
  }, [employee?.role, dashboardQuery.data?.announcements?.unread, dashboardQuery.data?.leave?.myLeaveRequests]);

  const handleIncomingChatMessage = (message: ICompanyMessage) => {
    const conversationId = message.conversationId || message.groupId;
    if (!conversationId || message.isMine) return;
    const activityAt = message.createdAt || new Date().toISOString();
    const isActiveChat = conversationId === selectedChatId;
    setChatActivity((current) => ({ ...current, [conversationId]: { latestChatAt: activityAt, unreadCount: isActiveChat ? (current[conversationId]?.unreadCount || 0) : (current[conversationId]?.unreadCount || 0) + 1 } }));
  };
  const handleConversationRead = (conversationId: string) => {
    setChatActivity((current) => ({ ...current, [conversationId]: { latestChatAt: current[conversationId]?.latestChatAt || new Date().toISOString(), unreadCount: 0 } }));
  };

  useEffect(() => {
    if (!selectedChatId && (groups[0]?.id || employees[0]?.id)) setSelectedChatId(groups[0]?.id || employees[0].id);
  }, [employees, groups, selectedChatId]);

  const handleSendLead = async (lead: { name: string; country: string; system: string; contactNo: string; otherDetails: string }) => {
    if (!selectedChatId) {
      throw new Error('Select a conversation before sending a lead.');
    }
    return companyService.postConversationMessage(selectedChatId, { content: JSON.stringify({ type: 'lead-workflow', status: 'pending', lead }) });
  };

  const sendMessage = async () => {
    if (!selectedChatId || !messageInput.trim()) return;
    const sentMessage = await companyService.postConversationMessage(selectedChatId, { content: messageInput.trim() });
    setMessageInput('');
    const now = new Date().toISOString();
    setChatActivity((current) => ({ ...current, [selectedChatId]: { latestChatAt: now, unreadCount: current[selectedChatId]?.unreadCount || 0 } }));
    return sentMessage;
  };

  const settingsLoading = settingsQuery.isLoading || validationQuery.isLoading;
  const settingsError = settingsQuery.isError || validationQuery.isError;
  const companySettings = settingsQuery.data as CompanySettingsResponse | undefined;
  const permissions = companySettings?.settings?.routePermissions || {};
  const canSendLeads = employee?.role === 'MANAGER' || employee?.role === 'COMPANY_ADMIN';

  if (settingsLoading || dashboardQuery.isLoading) {
    return <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-100"><p className="text-sm text-slate-400">Loading employee permissions...</p></div>;
  }

  if (settingsError || !validationQuery.data) {
    return <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-100"><p className="text-sm text-rose-400">Unable to validate session. Redirecting...</p></div>;
  }

  return <ProtectedRoute roles={['EMPLOYEE', 'HR', 'MANAGER', 'TEAM_LEAD', 'SALES', 'TECH_SUPPORT', 'VERIFICATION', 'FEEDBACK', 'IT', 'INTERN']}><div className="h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased"><div className="grid h-screen grid-cols-1 lg:grid-cols-[280px_1fr] lg:min-h-0"><CompanyAdminSidebar companyName={dashboardQuery.data?.company.name} userName={employee?.name || 'Employee'} userRole={employee?.role || 'Employee'} canOpenSettings={false} routePermissions={permissions} navigationMenu={employeeNavigation} activeSection={activeSection} setActiveSection={setActiveSection} /><main className="flex min-h-0 flex-col overflow-hidden bg-slate-950">
    <WorkspaceNotificationWatcher dashboardPath="/employee/dashboard" onMessage={handleIncomingChatMessage} />
    {activeSection === 'overview' && employee && dashboardStats && (employee.role === 'MANAGER' ? <ManagerOverviewSection report={dashboardQuery.data?.stats?.todayReport} /> : <EmployeeOverviewSection employee={employee} stats={dashboardStats} remoteSupportSummary={dashboardQuery.data?.remoteSupportSummary} projectSummary={dashboardQuery.data?.projectSummary} setActiveSection={setActiveSection} />)}
    {activeSection === 'chat' && <EmployeeRouteGuard permissionKey="chat" routePermissions={permissions} permissionsLoading={settingsLoading}><ChatSection groups={groups} employees={employees} activeFilter={activeChatFilter} setActiveFilter={setActiveChatFilter} selectedChatId={selectedChatId} setSelectedChatId={setSelectedChatId} messageInput={messageInput} setMessageInput={setMessageInput} onSendMessage={sendMessage} onSendLead={canSendLeads ? handleSendLead : undefined} currentUserId={employee?._id} currentUserName={employee?.name || 'Employee'} currentUserRole={employee?.role} isAdmin={canSendLeads} onConversationRead={handleConversationRead} /></EmployeeRouteGuard>}
    {activeSection === 'todays-report' && (
      employee?.role === 'MANAGER' ? (
        <ManagerTodaysReportSection report={dashboardQuery.data?.stats?.todayReport} employees={dashboardQuery.data?.chatEmployees || []} />
      ) : employee?.role === 'SALES' ? (
        <SalesTodaysWorkSection />
      ) : employee?.role === 'TECH_SUPPORT' ? (
        <TechSupportTodaysWorkSection />
      ) : employee?.role === 'VERIFICATION' ? (
        <VerificationTodaysWorkSection />
      ) : null
    )}
    {activeSection === 'leads' && <EmployeeRouteGuard permissionKey="leads" routePermissions={permissions} permissionsLoading={settingsLoading}><div className="[_&_button]:hidden"><LeadsSection readOnly /></div></EmployeeRouteGuard>}
    {activeSection === 'sales' && <EmployeeRouteGuard permissionKey="sales" routePermissions={permissions} permissionsLoading={settingsLoading}><div className="[_&_button]:hidden"><SalesSection readOnly /></div></EmployeeRouteGuard>}
    {activeSection === 'upgrade' && <EmployeeRouteGuard permissionKey="upgrade" routePermissions={permissions} permissionsLoading={settingsLoading}><UpgradeSection /></EmployeeRouteGuard>}
    {activeSection === 'failed-sales' && <EmployeeRouteGuard permissionKey="failed-sales" routePermissions={permissions} permissionsLoading={settingsLoading}><div className="[_&_button]:hidden"><FailedSalesSection employeeView /></div></EmployeeRouteGuard>}
    {activeSection === 'remote-support' && <EmployeeRouteGuard permissionKey="remote-support" routePermissions={permissions} permissionsLoading={settingsLoading}><RemoteSupportSection role={employee?.role} /></EmployeeRouteGuard>}
    {activeSection === 'verification' && <VerificationSection employeeView />}
    {activeSection === 'feedback' && <FeedbackSection employeeView />}
    {activeSection === 'projects' && <EmployeeRouteGuard permissionKey="projects" routePermissions={permissions} permissionsLoading={settingsLoading}><ProjectSection projects={projectQuery.data || []} loading={projectQuery.isLoading} /></EmployeeRouteGuard>}
    {activeSection === 'attendance' && <EmployeeRouteGuard permissionKey="attendance" routePermissions={permissions} permissionsLoading={settingsLoading}><AttendanceSection readOnly /></EmployeeRouteGuard>}
    {activeSection === 'announcements' && <EmployeeRouteGuard permissionKey="announcements" routePermissions={permissions} permissionsLoading={settingsLoading}><AnnouncementsSection readOnly /></EmployeeRouteGuard>}
    {activeSection === 'leave' && <EmployeeRouteGuard permissionKey="leave" routePermissions={permissions} permissionsLoading={settingsLoading}><LeaveSection readOnly /></EmployeeRouteGuard>}
    {activeSection === 'profile' && employee && <EmployeeProfile employee={employee} remoteSupportSummary={dashboardQuery.data?.remoteSupportSummary} projectSummary={dashboardQuery.data?.projectSummary} />}
  </main></div></div></ProtectedRoute>;
}

function EmployeeProfile({ employee, remoteSupportSummary, projectSummary }: { employee: ICompanyDashboard['employee']; remoteSupportSummary?: ICompanyDashboard['remoteSupportSummary']; projectSummary?: ICompanyDashboard['projectSummary']; }) {
  const isTechSupport = employee.role === 'TECH_SUPPORT';
  const isSales = employee.role === 'SALES';
  const isVerification = employee.role === 'VERIFICATION';
  const [verificationStats, setVerificationStats] = useState({ total: 0, pending: 0, inProgress: 0, successful: 0, failed: 0, successRate: 0, positiveResponse: 0, negativeResponse: 0, neutralResponse: 0 });
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>((employee as any).theme || getStoredTheme());
  const [themeSaving, setThemeSaving] = useState(false);

  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  const handleThemeChange = async (theme: ThemeName) => {
    setSelectedTheme(theme);
    setThemeSaving(true);
    try {
      applyTheme(theme);
      await companyService.updateTheme(theme);
    } catch (error) {
      setSelectedTheme((employee as any).theme || 'blue');
      applyTheme((employee as any).theme || 'blue');
    } finally {
      setThemeSaving(false);
    }
  };

  useEffect(() => {
    if (!isVerification) return;
    let active = true;
    const loadStats = async () => {
      setVerificationLoading(true);
      try {
        const records = await companyService.getVerifications();
        if (!active) return;
        const employeeVerifications = records.filter((rec) => rec.verificationEmployeeId === employee._id);
        const total = employeeVerifications.length;
        const pending = employeeVerifications.filter((rec) => rec.verificationStatus === 'PENDING').length;
        const inProgress = employeeVerifications.filter((rec) => rec.verificationStatus === 'IN_PROGRESS').length;
        const successful = employeeVerifications.filter((rec) => rec.verificationStatus === 'SUCCESSFUL').length;
        const failed = employeeVerifications.filter((rec) => rec.verificationStatus === 'FAILED').length;
        const positiveResponse = employeeVerifications.filter((rec) => rec.feedbackRating === 'Positive').length;
        const negativeResponse = employeeVerifications.filter((rec) => rec.feedbackRating === 'Negative').length;
        const neutralResponse = employeeVerifications.filter((rec) => rec.feedbackRating === 'Neutral').length;
        const successRate = total ? Math.round((successful / total) * 100) : 0;
        setVerificationStats({ total, pending, inProgress, successful, failed, successRate, positiveResponse, negativeResponse, neutralResponse });
      } catch {
        setVerificationStats({ total: 0, pending: 0, inProgress: 0, successful: 0, failed: 0, successRate: 0, positiveResponse: 0, negativeResponse: 0, neutralResponse: 0 });
      } finally {
        if (active) setVerificationLoading(false);
      }
    };
    void loadStats();
    return () => { active = false; };
  }, [isVerification, employee._id]);

  const remoteTarget = employee.remoteTarget || 0;
  const remoteSuccessful = remoteSupportSummary?.successful || 0;
  const remoteProgress = remoteTarget ? Math.min(100, Math.round((remoteSuccessful / remoteTarget) * 100)) : 0;

  const salesTarget = employee.monthlySalesTarget || 0;
  const salesAchieved = employee.monthlySalesAchieved || 0;
  const salesProgress = salesTarget ? Math.min(100, Math.round((salesAchieved / salesTarget) * 100)) : 0;

  const progress = isTechSupport ? remoteProgress : salesProgress;

  if (isVerification) {
    return (
      <div className="p-6 overflow-y-auto space-y-6">
        <header className="pb-4 border-b border-slate-800">
          <p className="text-sm text-emerald-400">Verification employee profile</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{employee.name}</h1>
          <div className="mt-3 grid gap-3 md:grid-cols-4 text-sm text-slate-300">
            <ProfileMetric label="Employee ID" value={employee.employeeId} />
            <ProfileMetric label="Email" value={employee.email || 'Not available'} />
            <ProfileMetric label="Phone" value={employee.phone || 'Not available'} />
            <ProfileMetric label="Department" value={employee.role} />
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ProfileMetric label="Role" value={employee.role} />
          <ProfileMetric label="Status" value={verificationLoading ? 'Loading...' : 'Active'} />
          <ProfileMetric label="Joining Date" value={employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'Not available'} />
          <ProfileMetric label="Success Rate" value={`${verificationStats.successRate}%`} />
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard label="Total Verification" value={String(verificationStats.total)} tone="slate" />
          <MetricCard label="Pending Verification" value={String(verificationStats.pending)} tone="amber" />
          <MetricCard label="In Progress" value={String(verificationStats.inProgress)} tone="sky" />
          <MetricCard label="Successful Verification" value={String(verificationStats.successful)} tone="emerald" />
          <MetricCard label="Failed Verification" value={String(verificationStats.failed)} tone="rose" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Positive Response" value={String(verificationStats.positiveResponse)} tone="emerald" />
          <MetricCard label="Negative Response" value={String(verificationStats.negativeResponse)} tone="rose" />
          <MetricCard label="Neutral Response" value={String(verificationStats.neutralResponse)} tone="amber" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Today's Verification" value={String(verificationStats.pending + verificationStats.inProgress)} tone="slate" />
          <MetricCard label="This Week's Verification" value={String(Math.max(verificationStats.successful, verificationStats.total - verificationStats.failed))} tone="indigo" />
          <MetricCard label="This Month's Verification" value={String(verificationStats.total)} tone="cyan" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto space-y-6">
      <header className="pb-4 border-b border-slate-800">
        <p className="text-sm text-indigo-400">Your profile</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{employee.name}</h1>
        <p className="mt-2 text-sm text-slate-400">{employee.email || 'No email recorded'} · {employee.role}</p>
      </header>

      <div className="grid gap-5 md:grid-cols-4">
        <ProfileMetric label="Employee ID" value={employee.employeeId} />
        <ProfileMetric label="Department / role" value={employee.role} />
        <ProfileMetric label="Joined" value={employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'Not available'} />
        <ProfileMetric label="Target progress" value={`${progress}%`} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Theme</p>
            <h2 className="mt-1 text-base font-semibold text-white">Choose your theme</h2>
          </div>
          {themeSaving && <span className="text-xs text-slate-400">Saving...</span>}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {THEME_OPTIONS.map((themeOption) => {
            const active = selectedTheme === themeOption.value;
            return (
              <button
                key={themeOption.value}
                type="button"
                onClick={() => void handleThemeChange(themeOption.value)}
                style={active ? { borderColor: themeOption.bgColor, backgroundColor: themeOption.bgColor + '20', color: '#fff' } : undefined}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${active ? 'text-white' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600'}`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <span>{themeOption.emoji}</span>
                  {themeOption.label}
                </span>
                <span
                  className="h-3 w-3 rounded-full ring-2 ring-white/40"
                  style={{
                    backgroundColor: themeOption.bgColor,
                    opacity: active ? 1 : 0.4,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {isTechSupport ? (
          <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">Remote Support Performance</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <ProfileMetric label="Remote Target" value={`${remoteTarget} remotes`} />
              <ProfileMetric label="Completed" value={String(remoteSuccessful)} />
              <ProfileMetric label="Remaining" value={String(Math.max(0, remoteTarget - remoteSuccessful))} />
              <ProfileMetric label="Success Rate" value={`${remoteSupportSummary?.successRate || 0}%`} />
            </div>
            <div className="mt-5 h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${progress}%` }} />
            </div>
          </section>
        ) : (
          <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Performance snapshot</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <ProfileMetric label="Target" value={salesTarget ? `$${salesTarget.toLocaleString()}` : 'Not assigned'} />
              <ProfileMetric label="Completed" value={salesAchieved ? `$${salesAchieved.toLocaleString()}` : '0'} />
              <ProfileMetric label="Remaining" value={salesTarget ? `$${Math.max(0, salesTarget - salesAchieved).toLocaleString()}` : 'Not assigned'} />
              <ProfileMetric label="Leads converted" value={String(employee.leadsConverted || 0)} />
            </div>
            <div className="mt-5 h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
            </div>
          </section>
        )}

        {remoteSupportSummary && !isTechSupport && (
          <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Remote support summary</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <ProfileMetric label="Total tickets" value={String(remoteSupportSummary.total)} />
              <ProfileMetric label="Successful" value={String(remoteSupportSummary.successful)} />
              <ProfileMetric label="Failed" value={String(remoteSupportSummary.failed)} />
              <ProfileMetric label="Success rate" value={`${remoteSupportSummary.successRate}%`} />
            </div>
          </section>
        )}

        <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Contact information</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Phone</dt><dd className="text-slate-200">{employee.phone || 'Not available'}</dd></div>
            {isSales && (
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Leads assigned</dt><dd className="text-slate-200">{employee.leadsAssigned || 0}</dd></div>
            )}
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Company</dt><dd className="text-slate-200">Employee workspace</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'slate' | 'amber' | 'sky' | 'emerald' | 'rose' | 'indigo' | 'cyan' }) {
  const toneClasses = {
    slate: 'border-slate-800 bg-slate-900/60 text-white',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-300',
    sky: 'border-sky-500/20 bg-sky-500/5 text-sky-300',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300',
    rose: 'border-rose-500/20 bg-rose-500/5 text-rose-300',
    indigo: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-300',
    cyan: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-300',
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) { return <div><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 font-semibold text-white">{value}</p></div>; }

function ProjectSection({ projects, loading }: { projects: IProjectRecord[]; loading: boolean }) {
  if (loading) {
    return <div className="p-10 text-center text-slate-400">Loading project data...</div>;
  }
  if (!projects.length) {
    return <div className="p-10 text-center text-slate-400">No active projects found for your team yet.</div>;
  }

  return (
    <section className="overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-100 shadow-xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-300">IT projects</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Project assignments</h2>
          <p className="mt-2 text-sm text-slate-400">Track current project status, timelines, and progress across your assignments.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <article key={project._id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{project.name}</p>
                <p className="text-sm text-slate-400">{project.description}</p>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-sm text-slate-400">Timeline: {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</p>
                <p className="text-sm text-slate-400">Progress: <span className="font-medium text-white">{project.progress}%</span></p>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${project.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-300' : project.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-300' : project.status === 'ON_HOLD' ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-700 text-slate-200'}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

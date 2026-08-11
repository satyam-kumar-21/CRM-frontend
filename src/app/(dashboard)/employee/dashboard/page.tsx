'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, CalendarCheck, MessageSquare, TrendingUp, UserCircle, UserPlus, Flag } from 'lucide-react';
import { companyService, ICompanyDashboard, ICompanyMessage } from '@/services/companyService';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CompanyAdminSidebar } from '../../company-admin/dashboard/components/CompanyAdminSidebar';
import { ChatSection } from '../../company-admin/dashboard/components/workspaceChat';
import { EmployeeOverviewSection } from '../../company-admin/dashboard/components/EmployeeOverviewSection';
import { LeadsSection, SalesSection } from '../../company-admin/dashboard/components/SalesLeadsSections';
import { FailedSalesSection } from '../../company-admin/dashboard/components/FailedSalesSection';
import { WorkspaceNotificationWatcher } from '../../company-admin/dashboard/components/WorkspaceNotificationWatcher';
import { AttendanceSection } from '../../company-admin/dashboard/components/AttendanceSection';
import { AnnouncementsSection } from '../../company-admin/dashboard/components/AnnouncementsSection';
import { LeaveSection } from '../../company-admin/dashboard/components/LeaveSection';
import type { ChatFilter, IEmployee, IGroupChannel, NavSection } from '../../company-admin/dashboard/types';

const employeeNavigation = [
  { id: 'overview' as NavSection, label: 'Overview', icon: Activity },
  { id: 'chat' as NavSection, label: 'Workspace Chat', icon: MessageSquare, badge: 'Live' },
  { id: 'leads' as NavSection, label: 'My Leads', icon: UserPlus },
  { id: 'sales' as NavSection, label: 'My Sales', icon: TrendingUp },
  { id: 'failed-sales' as NavSection, label: 'Failed Sales', icon: Flag },
  { id: 'attendance' as NavSection, label: 'My Attendance', icon: CalendarCheck },
  { id: 'announcements' as NavSection, label: 'Announcements', icon: Bell },
  { id: 'leave' as NavSection, label: 'My Leave', icon: CalendarCheck },
  { id: 'profile' as NavSection, label: 'Your Profile', icon: UserCircle },
];

export default function EmployeeDashboardPage() {
  const [activeSection, setActiveSection] = useState<NavSection>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('section') === 'chat' ? 'chat' : 'overview');
  const [activeChatFilter, setActiveChatFilter] = useState<ChatFilter>('all');
  const [selectedChatId, setSelectedChatId] = useState(() => typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('conversation') || '' : '');
  const [messageInput, setMessageInput] = useState('');
  const [chatActivity, setChatActivity] = useState<Record<string, { latestChatAt: string; unreadCount: number }>>({});
  const { data, isLoading } = useQuery<ICompanyDashboard>({ queryKey: ['employeeDashboard'], queryFn: companyService.getDashboard });
  const employee = data?.employee;
  const groups: IGroupChannel[] = useMemo(() => (data?.groups || []).map((group) => ({ id: group._id, name: group.name, description: group.description, membersCount: group.members?.length || 0, privacy: group.privacy, createdDate: new Date(group.createdAt).toLocaleDateString(), latestChatAt: chatActivity[group._id]?.latestChatAt || group.latestChatAt, unreadCount: chatActivity[group._id]?.unreadCount ?? group.unreadCount ?? 0 })), [data?.groups, chatActivity]);
  const employees: IEmployee[] = useMemo(() => (data?.chatEmployees || []).filter((item) => item._id !== data?.employee?._id).map((item) => ({ id: item._id, employeeId: item.employeeId, name: item.name, email: item.email || '', role: item.role, status: 'active', isSuspended: false, joinedDate: '', avatarBg: 'from-indigo-500 to-cyan-500', salesTarget: { monthlyTarget: 0, monthlyAchieved: 0, yearlyTarget: 0, yearlyAchieved: 0, hourlyAchievedToday: 0 }, dealsClosed: 0, conversionRate: 0, salesHistory: [], latestChatAt: chatActivity[item._id]?.latestChatAt || item.latestChatAt, unreadCount: chatActivity[item._id]?.unreadCount ?? item.unreadCount ?? 0 })), [data?.chatEmployees, data?.employee?._id, chatActivity]);
  const employeeNavigation = [
    { id: 'overview' as NavSection, label: 'Overview', icon: Activity },
    { id: 'chat' as NavSection, label: 'Workspace Chat', icon: MessageSquare, badge: 'Live' },
    { id: 'leads' as NavSection, label: 'My Leads', icon: UserPlus },
    { id: 'sales' as NavSection, label: 'My Sales', icon: TrendingUp },
    { id: 'failed-sales' as NavSection, label: 'Failed Sales', icon: Flag },
    { id: 'attendance' as NavSection, label: 'My Attendance', icon: CalendarCheck },
    { id: 'announcements' as NavSection, label: 'Announcements', icon: Bell, count: data?.announcements?.unread },
    { id: 'leave' as NavSection, label: 'My Leave', icon: CalendarCheck, count: data?.leave?.myLeaveRequests },
    { id: 'profile' as NavSection, label: 'Your Profile', icon: UserCircle },
  ];

  const handleIncomingChatMessage = (message: ICompanyMessage) => {
    const conversationId = message.conversationId || message.groupId;
    if (!conversationId || message.isMine || conversationId === selectedChatId) return;
    setChatActivity((current) => ({ ...current, [conversationId]: { latestChatAt: message.createdAt, unreadCount: (current[conversationId]?.unreadCount || 0) + 1 } }));
  };
  const handleConversationRead = (conversationId: string) => {
    setChatActivity((current) => ({ ...current, [conversationId]: { latestChatAt: current[conversationId]?.latestChatAt || new Date().toISOString(), unreadCount: 0 } }));
  };

  useEffect(() => {
    if (!selectedChatId && (groups[0]?.id || employees[0]?.id)) setSelectedChatId(groups[0]?.id || employees[0].id);
  }, [employees, groups, selectedChatId]);

  const sendMessage = async () => {
    if (!selectedChatId || !messageInput.trim()) return;
    const sentMessage = await companyService.postConversationMessage(selectedChatId, { content: messageInput.trim() });
    setMessageInput('');
    return sentMessage;
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-100"><p className="text-sm text-slate-400">Loading Enterprise Dashboard...</p></div>;

  return <ProtectedRoute roles={['EMPLOYEE', 'HR', 'MANAGER', 'TEAM_LEAD', 'SALES', 'TECH_SUPPORT', 'IT', 'INTERN']}><div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased"><div className="grid min-h-screen lg:grid-cols-[280px_1fr]"><CompanyAdminSidebar companyName={data?.company.name} userName={employee?.name || 'Employee'} userRole={employee?.role || 'Employee'} canOpenSettings={false} navigationMenu={employeeNavigation} activeSection={activeSection} setActiveSection={setActiveSection} /><main className="flex flex-col h-screen overflow-hidden bg-slate-950">
    <WorkspaceNotificationWatcher dashboardPath="/employee/dashboard" onMessage={handleIncomingChatMessage} />
    {activeSection === 'overview' && employee && <EmployeeOverviewSection employee={employee} setActiveSection={setActiveSection} />}
    {activeSection === 'chat' && <ChatSection groups={groups} employees={employees} activeFilter={activeChatFilter} setActiveFilter={setActiveChatFilter} selectedChatId={selectedChatId} setSelectedChatId={setSelectedChatId} messageInput={messageInput} setMessageInput={setMessageInput} onSendMessage={sendMessage} currentUserName={employee?.name || 'Employee'} onConversationRead={handleConversationRead} />}
    {activeSection === 'leads' && <div className="[&_button]:hidden"><LeadsSection readOnly /></div>}
    {activeSection === 'sales' && <div className="[&_button]:hidden"><SalesSection readOnly /></div>}
    {activeSection === 'failed-sales' && <div className="[&_button]:hidden"><FailedSalesSection /></div>}
    {activeSection === 'attendance' && <AttendanceSection readOnly />}
    {activeSection === 'announcements' && <AnnouncementsSection readOnly />}
    {activeSection === 'leave' && <LeaveSection readOnly />}
    {activeSection === 'profile' && employee && <EmployeeProfile employee={employee} />}
  </main></div></div></ProtectedRoute>;
}

function EmployeeProfile({ employee }: { employee: ICompanyDashboard['employee'] }) {
  const target = employee.monthlySalesTarget || employee.remoteTarget || 0;
  const achieved = employee.monthlySalesAchieved || 0;
  const progress = target ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  return <div className="p-6 overflow-y-auto space-y-6"><header className="pb-4 border-b border-slate-800"><p className="text-sm text-indigo-400">Your profile</p><h1 className="mt-1 text-2xl font-bold text-white">{employee.name}</h1><p className="mt-2 text-sm text-slate-400">{employee.email || 'No email recorded'} · {employee.role}</p></header><div className="grid gap-5 md:grid-cols-4"><ProfileMetric label="Employee ID" value={employee.employeeId} /><ProfileMetric label="Department / role" value={employee.role} /><ProfileMetric label="Joined" value={employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'Not available'} /><ProfileMetric label="Target progress" value={`${progress}%`} /></div><div className="grid gap-6 lg:grid-cols-2"><section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60"><h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Performance snapshot</h2><div className="mt-5 grid grid-cols-2 gap-4 text-sm"><ProfileMetric label="Target" value={target ? `$${target.toLocaleString()}` : 'Not assigned'} /><ProfileMetric label="Completed" value={achieved ? `$${achieved.toLocaleString()}` : '0'} /><ProfileMetric label="Remaining" value={target ? `$${Math.max(0, target - achieved).toLocaleString()}` : 'Not assigned'} /><ProfileMetric label="Leads converted" value={String(employee.leadsConverted || 0)} /></div><div className="mt-5 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-indigo-500" style={{ width: `${progress}%` }} /></div></section><section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60"><h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Contact information</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Phone</dt><dd className="text-slate-200">{employee.phone || 'Not available'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Leads assigned</dt><dd className="text-slate-200">{employee.leadsAssigned || 0}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Company</dt><dd className="text-slate-200">Employee workspace</dd></div></dl></section></div></div>;
}

function ProfileMetric({ label, value }: { label: string; value: string }) { return <div><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 font-semibold text-white">{value}</p></div>; }

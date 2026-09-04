'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, CalendarCheck, Flag, Hash, MessageSquare, Settings, TrendingUp, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, ICompanyDashboard, ICompanyEmployee, ICompanySale } from '@/services/companyService';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CompanyAdminSidebar, type CompanyAdminNavItem } from './components/CompanyAdminSidebar';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { EmployeeDetailsModal } from './components/EmployeeDetailsModal';
import { SalaryLeaveSection } from './components/SalaryLeaveSection';
import { AnnouncementsSection } from './components';
import { LeaveSection } from './components/LeaveSection';
import { CompanyOverviewSection } from './components/CompanyOverviewSection';
import { MultiChatSection } from './components/MultiChatSection';
import TodaysReportSection from './components/TodaysReportSection';
import { CreateGroupModal } from './components/CreateGroupModal';
import { EmployeesSection } from './components/EmployeesSection';
import { GroupsSection } from './components/GroupsSection';
import { LeadsSection, SalesSection } from './components/SalesLeadsSections';
import { AdminSalesSection } from './components/AdminSalesSection';
import { UpgradeSection } from './components/UpgradeSection';
import { FailedSalesSection } from './components/FailedSalesSection';
import { OverviewSection } from './components/OverviewSection';
import { RemoteSupportSection } from './components/RemoteSupportSection';
import { VerificationSection } from './components/VerificationSection';
import { FeedbackSection } from './components/FeedbackSection';
import { SettingsSection } from './components/SettingsSection';
import { WorkspaceNotificationWatcher } from './components/WorkspaceNotificationWatcher';
import { AttendanceSection } from './components/AttendanceSection';
import { mapCompanyEmployee } from './employeeMapper';
import type { ChatFilter, IEmployee, IGroupChannel, NavSection } from './types';

export default function CompanyAdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<NavSection>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('section') === 'chat' ? 'chat' : 'overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [employeesList, setEmployeesList] = useState<IEmployee[]>([]);
  const [groupsList, setGroupsList] = useState<IGroupChannel[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState('all');
  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState<IEmployee | null>(null);
  const [activeChatFilter, setActiveChatFilter] = useState<ChatFilter>('all');
  const [openChatIds, setOpenChatIds] = useState<string[]>(() => { const id = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('conversation') : ''; return id ? [id] : []; });
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpUsername, setNewEmpUsername] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('EMPLOYEE');
  const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(null);
  
  const [newEmpTarget, setNewEmpTarget] = useState(40000);
  const [newEmpRemoteTarget, setNewEmpRemoteTarget] = useState(0);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'public' | 'private'>('public');
  const [newGroupMemberIds, setNewGroupMemberIds] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<IGroupChannel | null>(null);

  const { data: dashboard, isLoading } = useQuery<ICompanyDashboard>({ queryKey: ['companyDashboard'], queryFn: companyService.getDashboard, retry: false });
  const { data: companyEmployees } = useQuery<ICompanyEmployee[]>({ queryKey: ['companyEmployees'], queryFn: companyService.getEmployees, retry: false });
  const { data: pendingSales } = useQuery<ICompanySale[]>({ queryKey: ['pendingSalesCount'], queryFn: companyService.getPendingSales, retry: false });

  const handleIncomingChatMessage = (message: import('@/services/companyService').ICompanyMessage) => {
    const conversationId = message.conversationId || message.groupId;
    if (!conversationId) return;
    const activityAt = message.createdAt || new Date().toISOString();
    const isOpen = openChatIds.includes(conversationId);
    setEmployeesList((current) => {
      const next = current.map((employee) => {
        if (employee.id === conversationId) {
          const unreadCount = message.isMine ? employee.unreadCount : (isOpen ? 0 : employee.unreadCount + 1);
          return { ...employee, latestChatAt: activityAt, unreadCount };
        }
        return employee;
      });
      return [...next].sort((left, right) => new Date(right.latestChatAt || 0).getTime() - new Date(left.latestChatAt || 0).getTime());
    });
    setGroupsList((current) => {
      const next = current.map((group) => {
        if (group.id === conversationId) {
          const unreadCount = message.isMine ? group.unreadCount : (isOpen ? 0 : group.unreadCount + 1);
          return { ...group, latestChatAt: activityAt, unreadCount };
        }
        return group;
      });
      return [...next].sort((left, right) => new Date(right.latestChatAt || 0).getTime() - new Date(left.latestChatAt || 0).getTime());
    });
  };
  const handleConversationRead = (conversationId: string) => {
    setEmployeesList((current) => current.map((employee) => employee.id === conversationId ? { ...employee, unreadCount: 0 } : employee));
    setGroupsList((current) => current.map((group) => group.id === conversationId ? { ...group, unreadCount: 0 } : group));
  };

  useEffect(() => {
    if (companyEmployees) {
      setEmployeesList((current) => {
        const currentMap = new Map(current.map((emp) => [emp.id, emp]));
        const updated = companyEmployees
          .filter((employee) => employee._id !== dashboard?.employee?._id)
          .map((emp) => {
            const mapped = mapCompanyEmployee(emp);
            const existing = currentMap.get(emp._id);
            if (existing) {
              const latestChatAt = existing.latestChatAt && new Date(existing.latestChatAt) > new Date(mapped.latestChatAt || 0)
                ? existing.latestChatAt
                : mapped.latestChatAt;
              return { ...mapped, latestChatAt, unreadCount: existing.unreadCount ?? mapped.unreadCount };
            }
            return mapped;
          });
        return [...updated].sort((left, right) => new Date(right.latestChatAt || 0).getTime() - new Date(left.latestChatAt || 0).getTime());
      });
    }
  }, [companyEmployees, dashboard?.employee?._id]);

  useEffect(() => {
    if (dashboard?.groups?.length) {
      setGroupsList((current) => {
        const currentMap = new Map(current.map((grp) => [grp.id, grp]));
        const updated = dashboard.groups.map((group) => {
          const existing = currentMap.get(group._id);
          const apiLatest = group.latestChatAt;
          const latestChatAt = existing?.latestChatAt && new Date(existing.latestChatAt) > new Date(apiLatest || 0)
            ? existing.latestChatAt
            : apiLatest;
          return {
            id: group._id,
            name: group.name,
            description: group.description,
            members: group.members,
            membersCount: group.members?.length || 0,
            privacy: group.privacy,
            createdDate: new Date(group.createdAt).toLocaleDateString(),
            latestChatAt,
            unreadCount: existing?.unreadCount ?? group.unreadCount ?? 0,
          };
        });
        return [...updated].sort((left, right) => new Date(right.latestChatAt || 0).getTime() - new Date(left.latestChatAt || 0).getTime());
      });
    }
  }, [dashboard]);
  const filteredEmployees = useMemo(() => employeesList.filter((employee) => {
    const query = searchQuery.toLowerCase();
    return (employee.name.toLowerCase().includes(query) || employee.email.toLowerCase().includes(query)) && (employeeRoleFilter === 'all' || employee.role.toLowerCase() === employeeRoleFilter.toLowerCase());
  }), [employeesList, searchQuery, employeeRoleFilter]);
  const unreadChatCount = employeesList.reduce((total, employee) => total + employee.unreadCount, 0) + groupsList.reduce((total, group) => total + group.unreadCount, 0);

  const navigationMenu: CompanyAdminNavItem[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'chat', label: 'Workspace Chat', icon: MessageSquare, badge: unreadChatCount ? `${unreadChatCount > 99 ? '99+' : unreadChatCount} new` : 'Live' },
    { id: 'employees', label: 'Employees Directory', icon: Users },
    { id: 'groups', label: 'Channels & Groups', icon: Hash },
    { id: 'leads', label: 'Leads', icon: UserPlus, count: dashboard?.stats?.pendingLeads || undefined },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'todays-work', label: "Today's Work", icon: CalendarCheck, count: pendingSales?.length || undefined },
    { id: 'upgrade', label: 'Upgrade', icon: TrendingUp },
    { id: 'failed-sales', label: 'Failed Sales', icon: Flag },
    { id: 'remote-support', label: 'Remote Support', icon: UserPlus, count: dashboard?.stats?.todayReport?.remote ? (dashboard.stats.todayReport.remote.total - dashboard.stats.todayReport.remote.successful - dashboard.stats.todayReport.remote.failed) || undefined : undefined },
    { id: 'verification', label: 'Verification', icon: Flag, count: dashboard?.stats?.todayReport?.verifications?.pending || undefined },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'todays-report', label: "Today's Report", icon: CalendarCheck },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'salary', label: 'Salary', icon: TrendingUp },
    { id: 'leave', label: 'Leave', icon: CalendarCheck, count: dashboard?.leave?.pendingRequests || undefined },
    { id: 'announcements', label: 'Announcements', icon: Bell, count: dashboard?.announcements?.unread || undefined },
    { id: 'settings', label: 'Company Settings', icon: Settings },
  ];

  const handleAddEmployeeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload: any = { name: newEmpName.trim(), email: newEmpEmail.trim() || undefined, phone: newEmpPhone.trim(), role: newEmpRole };
      if (newEmpPassword) payload.password = newEmpPassword;
      if (newEmpRole === 'SALES') payload.monthlySalesTarget = Number(newEmpTarget) || 0;
      if (newEmpRole === 'TECH_SUPPORT') payload.remoteTarget = Number(newEmpRemoteTarget) || 0;

      if (editingEmployee) {
        const updatedEmployee = await companyService.updateEmployee(editingEmployee.id, payload);
        setEmployeesList((current) => current.map((item) => item.id === editingEmployee.id ? {
          ...item,
          ...updatedEmployee,
          name: updatedEmployee.name || item.name,
          email: updatedEmployee.email || item.email,
          phone: updatedEmployee.phone || item.phone,
          role: updatedEmployee.role || item.role,
          employeeId: updatedEmployee.employeeId || item.employeeId,
          salesTarget: {
            ...item.salesTarget,
            monthlyTarget: updatedEmployee.monthlySalesTarget !== undefined ? updatedEmployee.monthlySalesTarget : (updatedEmployee.role === 'SALES' ? item.salesTarget.monthlyTarget : 0),
          },
          remoteTarget: updatedEmployee.remoteTarget !== undefined ? updatedEmployee.remoteTarget : item.remoteTarget,
        } : item));
        toast.success(`${updatedEmployee.name || editingEmployee.name} updated`);
      } else {
        const createdEmployee = await companyService.createEmployee(payload);
        setEmployeesList((current) => [mapCompanyEmployee(createdEmployee), ...current]);
        toast.success(`${createdEmployee.name} created`);
      }

      setShowAddEmployeeModal(false);
      setEditingEmployee(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save employee');
    }
  };

  const handleCreateGroupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingGroup) {
        const updatedGroup = await companyService.updateGroup(editingGroup.id, { name: newGroupName.trim(), description: newGroupDesc.trim(), privacy: newGroupPrivacy, memberIds: newGroupMemberIds });
        setGroupsList((current) => current.map((item) => item.id === editingGroup.id ? { ...item, name: updatedGroup.name, description: updatedGroup.description, privacy: updatedGroup.privacy, members: updatedGroup.members, membersCount: updatedGroup.members?.length || 0 } : item));
        toast.success('Channel updated');
      } else {
        const createdGroup = await companyService.createGroup({ name: newGroupName.trim(), description: newGroupDesc.trim(), privacy: newGroupPrivacy, memberIds: newGroupMemberIds });
        setGroupsList((current) => [{ id: createdGroup._id, name: createdGroup.name, description: createdGroup.description, members: createdGroup.members, membersCount: createdGroup.members?.length || 0, privacy: createdGroup.privacy, createdDate: new Date(createdGroup.createdAt).toLocaleDateString(), unreadCount: 0 }, ...current]);
        toast.success('Channel created');
      }
      setShowCreateGroupModal(false);
      setEditingGroup(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save group');
    }
  };

  const handleEditGroup = (group: IGroupChannel) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupDesc(group.description || '');
    setNewGroupPrivacy(group.privacy);
    setNewGroupMemberIds(group.members || []);
    setShowCreateGroupModal(true);
  };

  const handleDeleteGroup = async (group: IGroupChannel) => {
    if (!window.confirm(`Delete channel #${group.name}?`)) return;
    try {
      await companyService.deleteGroup(group.id);
      setGroupsList((current) => current.filter((item) => item.id !== group.id));
      toast.success('Channel deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to delete channel');
    }
  };

  const handleToggleEmployeeBlock = async (employee: IEmployee) => {
    try {
      const updatedEmployee = await companyService.updateEmployeeStatus(employee.id, !employee.isSuspended);
      setEmployeesList((current) => current.map((item) => item.id === employee.id ? { ...item, isSuspended: updatedEmployee.isSuspended } : item));
      toast.success(`${employee.name} ${updatedEmployee.isSuspended ? 'blocked' : 'unblocked'}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update employee status');
    }
  };

  const handleEditEmployee = (employee: IEmployee) => {
    setEditingEmployee(employee);
    setNewEmpName(employee.name);
    setNewEmpEmail(employee.email || '');
    setNewEmpPassword('');
    setNewEmpPhone(employee.phone || '');
    setNewEmpRole(employee.role);
    setNewEmpTarget(employee.salesTarget.monthlyTarget || 0);
    setNewEmpRemoteTarget(employee.remoteTarget ?? 0);
    setShowAddEmployeeModal(true);
  };

  const handleOpenNewEmployeeModal = () => {
    setEditingEmployee(null);
    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpPassword('');
    setNewEmpPhone('');
    setNewEmpRole('EMPLOYEE');
    setNewEmpTarget(40000);
    setNewEmpRemoteTarget(0);
    setShowAddEmployeeModal(true);
  };

  const handleDeleteEmployee = async (employee: IEmployee) => {
    if (!window.confirm(`Delete ${employee.name}? This action cannot be undone.`)) return;
    try {
      await companyService.deleteEmployee(employee.id);
      setEmployeesList((current) => current.filter((item) => item.id !== employee.id));
      setSelectedEmployeeForDetails((current) => current?.id === employee.id ? null : current);
      toast.success(`${employee.name} deleted`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to delete employee');
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-100"><p className="text-sm text-slate-400">Loading Enterprise Dashboard...</p></div>;

  return <ProtectedRoute roles={['COMPANY_ADMIN']}><div className="h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased"><div className={`flex h-screen flex-col lg:grid lg:min-h-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:grid-cols-[76px_1fr]' : 'lg:grid-cols-[280px_1fr]'}`}><CompanyAdminSidebar companyName={dashboard?.company?.name} navigationMenu={navigationMenu} activeSection={activeSection} setActiveSection={setActiveSection} isDesktopCollapsed={sidebarCollapsed} onDesktopCollapsedChange={setSidebarCollapsed} /><main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950">
    <WorkspaceNotificationWatcher dashboardPath="/company-admin/dashboard" onMessage={handleIncomingChatMessage} />
    {activeSection === 'overview' && dashboard?.stats && <CompanyOverviewSection employees={employeesList} companyName={dashboard?.company?.name} attendanceSummary={dashboard?.attendanceSummary} stats={dashboard.stats} setActiveSection={setActiveSection} onAddEmployee={() => setShowAddEmployeeModal(true)} />}
    {activeSection === 'chat' && <MultiChatSection groups={groupsList} employees={employeesList} openChatIds={openChatIds} setOpenChatIds={setOpenChatIds} currentUserId={dashboard?.employee?._id} currentUserName={dashboard?.employee?.name || 'Admin'} currentUserRole={dashboard?.employee?.role} isAdmin onConversationRead={handleConversationRead} onCreateGroup={() => { setEditingGroup(null); setNewGroupName(''); setNewGroupDesc(''); setNewGroupPrivacy('public'); setNewGroupMemberIds([]); setShowCreateGroupModal(true); }} />}
    {activeSection === 'todays-report' && <TodaysReportSection report={dashboard?.stats?.todayReport} />}
    {activeSection === 'employees' && <EmployeesSection employees={employeesList} filteredEmployees={filteredEmployees} searchQuery={searchQuery} setSearchQuery={setSearchQuery} employeeRoleFilter={employeeRoleFilter} setEmployeeRoleFilter={setEmployeeRoleFilter} onSelectEmployee={setSelectedEmployeeForDetails} onAddEmployee={handleOpenNewEmployeeModal} onEditEmployee={handleEditEmployee} onToggleBlock={handleToggleEmployeeBlock} onDeleteEmployee={handleDeleteEmployee} />}
    {activeSection === 'sales' && <AdminSalesSection />}
    {activeSection === 'todays-work' && <AdminSalesSection />}
    {activeSection === 'upgrade' && <UpgradeSection />}
    {activeSection === 'failed-sales' && <FailedSalesSection />}
    {activeSection === 'remote-support' && <RemoteSupportSection role={dashboard?.employee?.role} isAdmin />}
    {activeSection === 'verification' && <VerificationSection />}
    {activeSection === 'feedback' && <FeedbackSection />}
    {activeSection === 'leads' && <LeadsSection />}
    {activeSection === 'attendance' && <AttendanceSection />}
    {activeSection === 'salary' && <SalaryLeaveSection />}
    {activeSection === 'leave' && <LeaveSection />}
    {activeSection === 'announcements' && <AnnouncementsSection />}
    {activeSection === 'groups' && <GroupsSection groups={groupsList} onCreateGroup={() => { setEditingGroup(null); setNewGroupName(''); setNewGroupDesc(''); setNewGroupPrivacy('public'); setNewGroupMemberIds([]); setShowCreateGroupModal(true); }} onEditGroup={handleEditGroup} onDeleteGroup={handleDeleteGroup} />}
    
    {activeSection === 'settings' && <SettingsSection />}
  </main></div>
  {selectedEmployeeForDetails && <EmployeeDetailsModal employee={selectedEmployeeForDetails} companyEmployees={employeesList} onClose={() => setSelectedEmployeeForDetails(null)} onOpenChat={(employeeId) => { setActiveSection('chat'); setOpenChatIds((current) => current.includes(employeeId) ? current : [...current.slice(-2), employeeId]); }} onOpenSection={(section) => setActiveSection(section)} />}
  {showAddEmployeeModal && <AddEmployeeModal onSubmit={handleAddEmployeeSubmit} onClose={() => { setShowAddEmployeeModal(false); setEditingEmployee(null); }} employeeId={editingEmployee?.employeeId} submitLabel={editingEmployee ? 'Save changes' : 'Confirm & Add'} name={newEmpName} setName={setNewEmpName} email={newEmpEmail} setEmail={setNewEmpEmail} password={newEmpPassword} setPassword={setNewEmpPassword} phone={newEmpPhone} setPhone={setNewEmpPhone} role={newEmpRole} setRole={setNewEmpRole} target={newEmpTarget} setTarget={setNewEmpTarget} remoteTarget={newEmpRemoteTarget} setRemoteTarget={setNewEmpRemoteTarget} />}
  {showCreateGroupModal && <CreateGroupModal onSubmit={handleCreateGroupSubmit} onClose={() => { setShowCreateGroupModal(false); setEditingGroup(null); }} name={newGroupName} setName={setNewGroupName} description={newGroupDesc} setDescription={setNewGroupDesc} privacy={newGroupPrivacy} setPrivacy={setNewGroupPrivacy} employees={companyEmployees || []} selectedMemberIds={newGroupMemberIds} setSelectedMemberIds={setNewGroupMemberIds} editing={Boolean(editingGroup)} />}</div></ProtectedRoute>;
}

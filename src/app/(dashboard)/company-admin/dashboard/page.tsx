'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CreditCard, Hash, Layers, MessageSquare, Settings, TrendingUp, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { companyService, ICompanyDashboard, ICompanyEmployee } from '@/services/companyService';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CompanyAdminSidebar, type CompanyAdminNavItem } from './components/CompanyAdminSidebar';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { BillingSection } from './components/BillingSection';
import { ChatSection } from './components/workspaceChat';
import { CreateGroupModal } from './components/CreateGroupModal';
import { EmployeesSection } from './components/EmployeesSection';
import { GroupsSection } from './components/GroupsSection';
import { LeadsSection, SalesSection } from './components/SalesLeadsSections';
import { OverviewSection } from './components/OverviewSection';
import { SalesAnalyticsModal } from './components/SalesAnalyticsModal';
import { SettingsSection } from './components/SettingsSection';
import { mapCompanyEmployee } from './employeeMapper';
import type { ChatFilter, IEmployee, IGroupChannel, NavSection, TimeframeFilter } from './types';

export default function CompanyAdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<NavSection>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('section') === 'chat' ? 'chat' : 'overview');
  const [employeesList, setEmployeesList] = useState<IEmployee[]>([]);
  const [groupsList, setGroupsList] = useState<IGroupChannel[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState('all');
  const [selectedEmployeeForSales, setSelectedEmployeeForSales] = useState<IEmployee | null>(null);
  const [salesTimeframeFilter, setSalesTimeframeFilter] = useState<TimeframeFilter>('month');
  const [activeChatFilter, setActiveChatFilter] = useState<ChatFilter>('all');
  const [selectedChatId, setSelectedChatId] = useState('');
  const [chatMessageInput, setChatMessageInput] = useState('');
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

  const { data: dashboard, isLoading } = useQuery<ICompanyDashboard>({ queryKey: ['companyDashboard'], queryFn: companyService?.getDashboard ? companyService.getDashboard : async () => ({ company: { name: 'Techno Sky Solutions' } } as any), retry: false });
  const { data: companyEmployees } = useQuery<ICompanyEmployee[]>({ queryKey: ['companyEmployees'], queryFn: companyService.getEmployees, retry: false });

  useEffect(() => {
    if (companyEmployees) {
      const sortedEmployees = [...companyEmployees].sort((left, right) => new Date(right.latestChatAt || 0).getTime() - new Date(left.latestChatAt || 0).getTime());
      setEmployeesList(sortedEmployees.map(mapCompanyEmployee));
    }
  }, [companyEmployees]);
  useEffect(() => {
    if (dashboard?.groups?.length) {
      setGroupsList(dashboard.groups.map((group) => ({ id: group._id, name: group.name, description: group.description, members: group.members, membersCount: group.members?.length || 0, privacy: group.privacy, createdDate: new Date(group.createdAt).toLocaleDateString() })));
    }
  }, [dashboard]);
  useEffect(() => {
    if (!selectedChatId && groupsList[0]?.id) setSelectedChatId(groupsList[0].id);
  }, [groupsList, selectedChatId]);

  const filteredEmployees = useMemo(() => employeesList.filter((employee) => {
    const query = searchQuery.toLowerCase();
    return (employee.name.toLowerCase().includes(query) || employee.email.toLowerCase().includes(query)) && (employeeRoleFilter === 'all' || employee.role.toLowerCase() === employeeRoleFilter.toLowerCase());
  }), [employeesList, searchQuery, employeeRoleFilter]);

  const navigationMenu: CompanyAdminNavItem[] = [
    { id: 'overview', label: 'Overview', icon: Activity }, { id: 'chat', label: 'Workspace Chat', icon: MessageSquare, badge: 'Live' },
    { id: 'employees', label: 'Employees Directory', icon: Users, count: employeesList.length }, { id: 'groups', label: 'Channels & Groups', icon: Hash, count: groupsList.length },
    { id: 'sales', label: 'Sales', icon: TrendingUp }, { id: 'leads', label: 'Leads', icon: UserPlus },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard }, { id: 'settings', label: 'Company Settings', icon: Settings },
  ];

  const handleSendChatMessage = async () => {
    if (!chatMessageInput.trim()) return;
    await companyService.postConversationMessage(selectedChatId, { content: chatMessageInput.trim() });
    setChatMessageInput('');
  };

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
            monthlyAchieved: item.salesTarget.monthlyAchieved,
            yearlyTarget: item.salesTarget.yearlyTarget,
            yearlyAchieved: item.salesTarget.yearlyAchieved,
            hourlyAchievedToday: item.salesTarget.hourlyAchievedToday,
          },
          remoteTarget: updatedEmployee.remoteTarget ?? item.remoteTarget,
        } : item));
        toast.success('Employee updated successfully');
      } else {
        if (!newEmpPassword) {
          toast.error('Password is required for new employees');
          return;
        }
        const createdEmployee = await companyService.createEmployee({ ...payload, password: newEmpPassword });
        setEmployeesList((current) => [mapCompanyEmployee({ ...createdEmployee, _id: createdEmployee.id, employeeId: createdEmployee.employeeId, phone: newEmpPhone, monthlySalesTarget: newEmpRole === 'SALES' ? Number(newEmpTarget) || 0 : 0, monthlySalesAchieved: 0, leadsAssigned: 0, leadsConverted: 0, isSuspended: false, createdAt: new Date().toISOString(), remoteTarget: newEmpRole === 'TECH_SUPPORT' ? Number(newEmpRemoteTarget) || 0 : undefined }), ...current]);
        toast.success('Employee account created');
      }

      setEditingEmployee(null);
      setNewEmpId(''); setNewEmpUsername(''); setNewEmpName(''); setNewEmpEmail(''); setNewEmpPassword(''); setNewEmpPhone(''); setNewEmpRole('EMPLOYEE'); setNewEmpTarget(40000); setNewEmpRemoteTarget(0);
      setShowAddEmployeeModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save employee account');
    }
  };

  const handleCreateGroupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newGroupName.trim()) return;
    if (newGroupPrivacy === 'private' && !newGroupMemberIds.length) {
      toast.error('Select at least one employee for a private group');
      return;
    }
    try {
      const group = editingGroup
        ? await companyService.updateGroup(editingGroup.id, { name: newGroupName.trim(), description: newGroupDesc.trim(), privacy: newGroupPrivacy, memberIds: newGroupMemberIds })
        : await companyService.createGroup({ name: newGroupName.trim(), description: newGroupDesc.trim(), privacy: newGroupPrivacy, memberIds: newGroupMemberIds });
      const mappedGroup = { id: group._id, name: group.name, description: group.description, members: group.members, membersCount: group.members?.length || 0, privacy: group.privacy, createdDate: new Date(group.createdAt).toLocaleDateString() };
      setGroupsList((current) => editingGroup ? current.map((item) => item.id === editingGroup.id ? mappedGroup : item) : [mappedGroup, ...current]);
      setNewGroupName(''); setNewGroupDesc(''); setNewGroupPrivacy('public'); setNewGroupMemberIds([]); setShowCreateGroupModal(false);
      setEditingGroup(null);
      toast.success(editingGroup ? 'Group updated successfully' : 'Group created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to create group');
    }
  };

  const handleEditGroup = (group: IGroupChannel) => {
    setNewGroupName(group.name);
    setNewGroupDesc(group.description);
    setNewGroupPrivacy(group.privacy);
    setNewGroupMemberIds(group.members?.filter((id) => companyEmployees?.some((employee) => employee._id === id)) || []);
    setEditingGroup(group);
    setShowCreateGroupModal(true);
  };

  const handleDeleteGroup = async (group: IGroupChannel) => {
    if (!window.confirm(`Delete ${group.name}? Its messages will also be deleted.`)) return;
    try {
      await companyService.deleteGroup(group.id);
      setGroupsList((current) => current.filter((item) => item.id !== group.id));
      setSelectedChatId((current) => current === group.id ? '' : current);
      toast.success('Group deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to delete group');
    }
  };

  const handleToggleEmployeeBlock = async (employee: IEmployee) => {
    try {
      await companyService.updateEmployeeStatus(employee.id, !employee.isSuspended);
      setEmployeesList((current) => current.map((item) => item.id === employee.id ? { ...item, isSuspended: !employee.isSuspended, status: !employee.isSuspended ? 'offline' : 'active' } : item));
      toast.success(`${employee.name} ${employee.isSuspended ? 'unblocked' : 'blocked'}`);
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
      setSelectedEmployeeForSales((current) => current?.id === employee.id ? null : current);
      toast.success(`${employee.name} deleted`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to delete employee');
    }
  };

  const calculateSalesAnalytics = (employee: IEmployee, timeframe: TimeframeFilter) => {
    let target = employee.salesTarget.monthlyTarget;
    let achieved = employee.salesTarget.monthlyAchieved;
    if (timeframe === 'today') { target = Math.round(employee.salesTarget.monthlyTarget / 20); achieved = employee.salesTarget.hourlyAchievedToday; }
    if (timeframe === 'year') { target = employee.salesTarget.yearlyTarget; achieved = employee.salesTarget.yearlyAchieved; }
    if (timeframe === 'all') { target = employee.salesTarget.yearlyTarget * 2; achieved = employee.salesTarget.yearlyAchieved + 150000; }
    const history = timeframe === 'today' ? employee.salesHistory.filter((sale) => sale.timeframe === 'today') : timeframe === 'month' ? employee.salesHistory.filter((sale) => sale.timeframe === 'today' || sale.timeframe === 'month') : employee.salesHistory;
    return { target, achieved, remaining: Math.max(0, target - achieved), progressPercent: Math.min(100, Math.round((achieved / (target || 1)) * 100)), history };
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-100"><p className="text-sm text-slate-400">Loading Enterprise Dashboard...</p></div>;

  return <ProtectedRoute roles={['COMPANY_ADMIN']}><div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased"><div className="grid min-h-screen lg:grid-cols-[280px_1fr]"><CompanyAdminSidebar companyName={dashboard?.company?.name} navigationMenu={navigationMenu} activeSection={activeSection} setActiveSection={setActiveSection} /><main className="flex flex-col h-screen overflow-hidden bg-slate-950">
    {activeSection === 'overview' && <OverviewSection employees={employeesList} setActiveSection={setActiveSection} onAddEmployee={() => setShowAddEmployeeModal(true)} />}
    {activeSection === 'chat' && <ChatSection groups={groupsList} employees={employeesList} activeFilter={activeChatFilter} setActiveFilter={setActiveChatFilter} selectedChatId={selectedChatId} setSelectedChatId={setSelectedChatId} messageInput={chatMessageInput} setMessageInput={setChatMessageInput} onSendMessage={handleSendChatMessage} onCreateGroup={() => { setEditingGroup(null); setNewGroupName(''); setNewGroupDesc(''); setNewGroupPrivacy('public'); setNewGroupMemberIds([]); setShowCreateGroupModal(true); }} />}
    {activeSection === 'employees' && <EmployeesSection employees={employeesList} filteredEmployees={filteredEmployees} searchQuery={searchQuery} setSearchQuery={setSearchQuery} employeeRoleFilter={employeeRoleFilter} setEmployeeRoleFilter={setEmployeeRoleFilter} onSelectEmployee={setSelectedEmployeeForSales} onAddEmployee={handleOpenNewEmployeeModal} onEditEmployee={handleEditEmployee} onToggleBlock={handleToggleEmployeeBlock} onDeleteEmployee={handleDeleteEmployee} />}
    {activeSection === 'sales' && <SalesSection />}
    {activeSection === 'leads' && <LeadsSection />}
    {activeSection === 'groups' && <GroupsSection groups={groupsList} onCreateGroup={() => { setEditingGroup(null); setNewGroupName(''); setNewGroupDesc(''); setNewGroupPrivacy('public'); setNewGroupMemberIds([]); setShowCreateGroupModal(true); }} onEditGroup={handleEditGroup} onDeleteGroup={handleDeleteGroup} />}
    
    {activeSection === 'billing' && <BillingSection />}
    {activeSection === 'settings' && <SettingsSection />}
  </main></div>
  {selectedEmployeeForSales && <SalesAnalyticsModal employee={selectedEmployeeForSales} timeframe={salesTimeframeFilter} setTimeframe={setSalesTimeframeFilter} onClose={() => setSelectedEmployeeForSales(null)} calculate={calculateSalesAnalytics} />}
  {showAddEmployeeModal && <AddEmployeeModal onSubmit={handleAddEmployeeSubmit} onClose={() => { setShowAddEmployeeModal(false); setEditingEmployee(null); }} employeeId={editingEmployee?.employeeId} submitLabel={editingEmployee ? 'Save changes' : 'Confirm & Add'} name={newEmpName} setName={setNewEmpName} email={newEmpEmail} setEmail={setNewEmpEmail} password={newEmpPassword} setPassword={setNewEmpPassword} phone={newEmpPhone} setPhone={setNewEmpPhone} role={newEmpRole} setRole={setNewEmpRole} target={newEmpTarget} setTarget={setNewEmpTarget} remoteTarget={newEmpRemoteTarget} setRemoteTarget={setNewEmpRemoteTarget} />}
  {showCreateGroupModal && <CreateGroupModal onSubmit={handleCreateGroupSubmit} onClose={() => { setShowCreateGroupModal(false); setEditingGroup(null); }} name={newGroupName} setName={setNewGroupName} description={newGroupDesc} setDescription={setNewGroupDesc} privacy={newGroupPrivacy} setPrivacy={setNewGroupPrivacy} employees={companyEmployees || []} selectedMemberIds={newGroupMemberIds} setSelectedMemberIds={setNewGroupMemberIds} editing={Boolean(editingGroup)} />}</div></ProtectedRoute>;
}

import { api } from '@/lib/api';

export interface ICompanyGroup {
  _id: string;
  name: string;
  description: string;
  privacy: 'public' | 'private';
  members?: string[];
  createdAt: string;
  latestChatAt?: string | null;
  unreadCount?: number;
  salaryAmount?: number;
  salaryMonth?: string;
  salaryCredited?: boolean;
}

export interface ICompanyMessage {
  _id: string;
  groupId?: string;
  senderId: string;
  senderName?: string;
  recipientId?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isMine?: boolean;
  isSeen?: boolean;
  isEdited?: boolean;
  conversationId?: string;
}

export type LeadWorkflow = {
  type: 'lead-workflow';
  status: 'pending' | 'declined' | 'accepted' | 'connected' | 'sale';
  lead: { name: string; country: string; system: string; contactNo: string; otherDetails: string };
  leadId?: string;
  acceptedBy?: string;
  connected?: 'yes' | 'no';
  isSale?: 'yes' | 'no';
  saleAmount?: number;
  paymentMethod?: 'Card' | 'Check' | 'Wire Transfer' | 'Cash' | 'Other';
  closedBy?: string;
};

export interface ICompanyDashboard {
  employee: {
    _id: string;
    employeeId: string;
    name: string;
    email: string;
    role: string;
    monthlySalesTarget: number;
    remoteTarget?: number;
    monthlySalesAchieved: number;
    leadsAssigned: number;
    leadsConverted: number;
    phone?: string;
    createdAt?: string;
  };
  company: {
    id: string;
    name: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'DELETED';
    plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'UNLIMITED';
  };
  stats: {
    totalEmployees: number;
    activeGroups: number;
    recentMessages: number;
    totalLeads: number;
    totalSales: number;
    totalRevenue: number;
    failedSales: number;
    connectedLeads: number;
    pendingLeads: number;
    myLeads: number;
    mySales: number;
    myRevenue: number;
    myFailedSales: number;
    myConnectedLeads: number;
    myPendingLeads: number;
    todayReport?: {
      leads: number;
      salesCount: number;
      salesAmount: number;
      failedSales: number;
      remote: {
        successful: number;
        failed: number;
        total: number;
      };
    };
  };
  groups: ICompanyGroup[];
  chatEmployees?: Array<Pick<ICompanyEmployee, '_id' | 'employeeId' | 'name' | 'email' | 'role'> & { latestChatAt?: string | null; unreadCount?: number }>;
  recentMessages: ICompanyMessage[];
  notifications?: { unread: number };
  announcements?: { unread: number };
  leave?: { pendingRequests: number; myLeaveRequests: number };
  attendanceSummary?: { present?: number; absent?: number; holiday?: number; totalEmployees?: number };
  remoteSupportSummary?: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    inProgress: number;
    successRate: number;
    recent: Array<{
      _id: string;
      customerName: string;
      customerContact: string;
      salesEmployeeName: string;
      techSupportEmployeeName?: string;
      status: string;
      dateTime: string;
      issueReason: string;
    }>;
  };
  projectSummary?: {
    total: number;
    active: number;
    completed: number;
    pending: number;
    projects: Array<{
      _id: string;
      name: string;
      description: string;
      status: string;
      startDate: string;
      endDate: string;
      progress: number;
      assignedEmployees: string[];
    }>;
  };
}

export interface ICompanyEmployee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: 'COMPANY_ADMIN' | 'HR' | 'MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE' | 'INTERN' | 'SALES' | 'TECH_SUPPORT' | 'IT';
  permissions: string[];
  monthlySalesTarget: number;
  remoteTarget?: number;
  monthlySalesAchieved: number;
  leadsAssigned: number;
  leadsConverted: number;
  isSuspended: boolean;
  createdAt: string;
  latestChatAt?: string | null;
  unreadCount?: number;
  salaryAmount?: number;
  salaryMonth?: string;
  salaryCredited?: boolean;
}

export interface IRemoteSupportRecord {
  _id: string;
  customerName: string;
  customerContact: string;
  salesEmployeeName: string;
  techSupportEmployeeName?: string;
  status: string;
  dateTime: string;
  issueReason: string;
  failedReason?: string;
}

export interface IProjectRecord {
  _id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  assignedEmployees: string[];
}

export interface IEmployeeLoginPayload {
  employeeId: string;
  password: string;
}

export interface ICompanyLead {
  _id: string;
  name: string;
  country: string;
  system: string;
  contactNo: string;
  otherDetails: string;
  connected: 'yes' | 'no';
  connectedBy: string;
  isSale: 'yes' | 'no';
  createdAt?: string;
  workflowMessageId?: string;
}

export interface ICompanySale {
  _id: string;
  leadId?: string;
  name: string;
  country: string;
  system: string;
  connectedBy: string;
  amount: number;
  paymentMethod: 'Card' | 'Check' | 'Wire Transfer' | 'Cash' | 'Other';
  saleDate: string;
  failed?: boolean;
  failedReason?: string;
  failedAt?: string | null;
  failedByName?: string;
}

export interface IAttendanceRecord {
  _id: string;
  employeeId: { _id: string; name: string; employeeId: string; role: string } | string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  workHours: number;
}
export interface IAnnouncement { _id: string; title: string; content: string; createdAt: string; targetRoles: string[]; isRead?: boolean; }
export interface INotification { _id: string; title: string; message: string; isRead: boolean; link?: string; createdAt: string; }
export interface ILeaveRecord { _id: string; employeeId: { name: string; employeeId: string; role: string } | string; leaveType: string; startDate: string; endDate: string; reason: string; status: string; approvedByName?: string; rejectedByName?: string; rejectReason?: string; }

export const companyService = {
  login: async (credentials: { employeeId?: string; email?: string; password: string }) => {
    const res = await api.post('/company/login', credentials);
    const accessToken = res.data?.data?.accessToken || res.data?.accessToken;
    if (typeof window !== 'undefined' && accessToken) {
      window.localStorage.setItem('companyAccessToken', accessToken);
    }
    return res.data;
  },

  // Employee Login (use same /company/login endpoint)
  employeeLogin: async (credentials: IEmployeeLoginPayload) => {
    const res = await api.post('/company/login', credentials);
    const accessToken = res.data?.data?.accessToken || res.data?.accessToken;
    if (typeof window !== 'undefined' && accessToken) window.localStorage.setItem('companyAccessToken', accessToken);
    return res.data;
  },

  getEmployees: async (): Promise<ICompanyEmployee[]> => {
    const res = await api.get('/company/employees');
    return res.data.data;
  },

  createEmployee: async (data: { name: string; email?: string; phone: string; role: string; password: string; monthlySalesTarget?: number; remoteTarget?: number }) => {
    const res = await api.post('/company/employees', data);
    return res.data.data;
  },

  updateEmployeeStatus: async (employeeId: string, isSuspended: boolean) => {
    const res = await api.patch(`/company/employees/${employeeId}/status`, { isSuspended });
    return res.data.data;
  },

  deleteEmployee: async (employeeId: string) => {
    const res = await api.delete(`/company/employees/${employeeId}`);
    return res.data;
  },

  updateEmployee: async (employeeId: string, data: { name?: string; email?: string; phone?: string; role?: string; password?: string; monthlySalesTarget?: number; remoteTarget?: number; salaryAmount?: number; salaryMonth?: string; salaryCredited?: boolean }) => {
    const res = await api.patch(`/company/employees/${employeeId}`, data);
    return res.data.data;
  },

  getDashboard: async (): Promise<ICompanyDashboard> => {
    const res = await api.get('/company/dashboard');
    return res.data.data;
  },

  validateSession: async () => {
    const res = await api.get('/company/validate');
    return res.data.data;
  },

  createGroup: async (data: { name: string; description?: string; privacy?: 'public' | 'private'; memberIds?: string[] }) => {
    const res = await api.post('/company/groups', data);
    return res.data.data;
  },
  updateGroup: async (groupId: string, data: { name?: string; description?: string; privacy?: 'public' | 'private'; memberIds?: string[] }) => {
    const res = await api.patch(`/company/groups/${groupId}`, data);
    return res.data.data;
  },
  deleteGroup: async (groupId: string) => {
    const res = await api.delete(`/company/groups/${groupId}`);
    return res.data.data;
  },

  postGroupMessage: async (groupId: string, data: { content: string }) => {
    const res = await api.post(`/company/groups/${groupId}/messages`, data);
    return res.data.data;
  },

  getGroupMessages: async (groupId: string): Promise<ICompanyMessage[]> => {
    const res = await api.get(`/company/groups/${groupId}/messages`);
    return res.data.data;
  },

  getConversationMessages: async (conversationId: string): Promise<ICompanyMessage[]> => (await api.get(`/company/conversations/${conversationId}/messages`)).data.data,
  markConversationRead: async (conversationId: string) => (await api.post(`/company/conversations/${conversationId}/read`)).data.data,
  postConversationMessage: async (conversationId: string, data: { content: string }): Promise<ICompanyMessage> => (await api.post(`/company/conversations/${conversationId}/messages`, data)).data.data,
  updateMessage: async (messageId: string, content: string): Promise<ICompanyMessage> => (await api.patch(`/company/messages/${messageId}`, { content })).data.data,
  deleteMessage: async (messageId: string) => (await api.delete(`/company/messages/${messageId}`)).data.data,

  getLeads: async (): Promise<ICompanyLead[]> => (await api.get('/company/leads')).data.data,
  createLead: async (data: Omit<ICompanyLead, '_id'>): Promise<ICompanyLead> => (await api.post('/company/leads', data)).data.data,
  updateLead: async (id: string, data: Omit<ICompanyLead, '_id'>): Promise<ICompanyLead> => (await api.patch(`/company/leads/${id}`, data)).data.data,
  deleteLead: async (id: string) => (await api.delete(`/company/leads/${id}`)).data.data,
  getSales: async (): Promise<ICompanySale[]> => (await api.get('/company/sales', { params: { failed: false, t: Date.now() }, headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache', Expires: '0' } })).data.data,
  getFailedSales: async (): Promise<ICompanySale[]> => (await api.get('/company/sales', { params: { failed: true, t: Date.now() }, headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache', Expires: '0' } })).data.data,
  getRemoteSupport: async (filters: Record<string, any> = {}): Promise<IRemoteSupportRecord[]> => (await api.get('/company/remote-support', { params: filters })).data.data,
  createRemoteSupport: async (data: Omit<IRemoteSupportRecord, '_id'>) => (await api.post('/company/remote-support', data)).data.data,
  updateRemoteSupport: async (id: string, data: Partial<IRemoteSupportRecord>) => (await api.patch(`/company/remote-support/${id}`, data)).data.data,
  deleteRemoteSupport: async (id: string) => (await api.delete(`/company/remote-support/${id}`)).data.data,
  getProjects: async (): Promise<IProjectRecord[]> => (await api.get('/company/projects')).data.data,
  createProject: async (data: Omit<IProjectRecord, '_id'>) => (await api.post('/company/projects', data)).data.data,
  updateProject: async (id: string, data: Partial<IProjectRecord>) => (await api.patch(`/company/projects/${id}`, data)).data.data,
  createSale: async (data: Omit<ICompanySale, '_id'>): Promise<ICompanySale> => (await api.post('/company/sales', data)).data.data,
  updateSale: async (id: string, data: Omit<ICompanySale, '_id'>): Promise<ICompanySale> => (await api.patch(`/company/sales/${id}`, data)).data.data,
  markSaleFailed: async (id: string, failedReason: string) => (await api.patch(`/company/sales/${id}/failed`, { failed: true, failedReason })).data.data,
  deleteSale: async (id: string) => (await api.delete(`/company/sales/${id}`)).data.data,
  getAttendance: async (filters: { employeeId?: string; from?: string; to?: string } = {}): Promise<IAttendanceRecord[]> => (await api.get('/company/attendance', { params: filters })).data.data,
  getAttendanceEmployees: async (): Promise<Array<{ _id: string; name: string; employeeId: string; role: string }>> => (await api.get('/company/attendance/employees')).data.data,
  getAnnouncements: async (): Promise<IAnnouncement[]> => (await api.get('/company/announcements')).data.data,
  createAnnouncement: async (data: { title: string; content: string; targetRoles?: string[] }): Promise<IAnnouncement> => (await api.post('/company/announcements', data)).data.data,
  deleteAnnouncement: async (id: string) => (await api.delete(`/company/announcements/${id}`)).data.data,
  markAnnouncementRead: async (id: string) => (await api.patch(`/company/announcements/${id}/read`)).data.data,
  getNotifications: async (): Promise<INotification[]> => (await api.get('/company/notifications')).data.data,
  markNotificationRead: async (id: string): Promise<INotification> => (await api.patch(`/company/notifications/${id}/read`)).data.data,
  getLeave: async (month?: string): Promise<ILeaveRecord[]> => (await api.get('/company/leave', { params: { month } })).data.data,
  createLeave: async (data: { leaveType: string; startDate: string; endDate: string; reason: string }): Promise<ILeaveRecord> => (await api.post('/company/leave', data)).data.data,
  updateLeaveStatus: async (id: string, status: string, rejectReason?: string): Promise<ILeaveRecord> => (await api.patch(`/company/leave/${id}/status`, { status, rejectReason })).data.data,
  // Company settings
  getSettings: async () => (await api.get('/company/settings')).data.data,
  updateSettings: async (payload: any) => (await api.patch('/company/settings', payload)).data.data,
  listHolidays: async () => (await api.get('/company/settings/holidays')).data.data,
  addHoliday: async (payload: { name: string; date: string }) => (await api.post('/company/settings/holidays', payload)).data.data,
  updateHoliday: async (hid: string, payload: { name?: string; date?: string }) => (await api.patch(`/company/settings/holidays/${hid}`, payload)).data.data,
  deleteHoliday: async (hid: string) => (await api.delete(`/company/settings/holidays/${hid}`)).data.data,
};
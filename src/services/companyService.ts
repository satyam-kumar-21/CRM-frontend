import { api } from '@/lib/api';
import type { AxiosProgressEvent } from 'axios';

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
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
  fileName?: string;
  mimeType?: string;
  objectKey?: string;
  fileSize?: number;
  duration?: number;
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
  needsTechSupport?: 'yes' | 'no';
  techSupportRequested?: boolean;
  remoteSupportId?: string;
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
      businessDate: { start: string; end: string };
      leads: number;
      salesCount: number;
      salesAmount: number;
      failedSales: number;
      remote: {
        successful: number;
        failed: number;
        total: number;
      };
      verifications?: {
        pending: number;
        successful: number;
        failed: number;
        total: number;
      };
      lists: {
        leads: Array<{ _id: string; name: string; country: string; system: string; createdAt: string }>;
        sales: Array<{ _id: string; name: string; amount: number; connectedBy: string; saleDate: string; failed?: boolean }>;
        failed: Array<{ _id: string; name: string; amount: number; connectedBy: string; saleDate: string; failed?: boolean }>;
        remote: Array<{ _id: string; customerName: string; salesEmployeeName: string; techSupportEmployeeName?: string; status: string; dateTime: string }>;
        verifications?: Array<{ _id: string; name: string; amount: number; verificationEmployeeName?: string; verificationStatus?: string; feedbackRating?: string }>;
      };
    };
    topSalesEmployees?: Array<{ name: string; totalAmount: number; saleCount: number }>;
    topTechSupportEmployees?: Array<{ name: string; remoteCount: number }>;
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

export type ThemeName = 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export interface ICompanyEmployee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: 'COMPANY_ADMIN' | 'HR' | 'MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE' | 'INTERN' | 'SALES' | 'TECH_SUPPORT' | 'VERIFICATION' | 'FEEDBACK' | 'IT';
  theme?: ThemeName;
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
  country?: string;
  system?: string;
  otherDetails?: string;
  salesEmployeeId: string;
  salesEmployeeName: string;
  techSupportEmployeeId?: string;
  techSupportEmployeeName?: string;
  status: string;
  dateTime: string;
  leadId?: string;
  workflowMessageId?: string;
  issueReason: string;
  acceptedAt?: string;
  completedAt?: string;
  failedReason?: string;
  rejectedReason?: string;
  failedByName?: string;
  rejectedByName?: string;
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
  customerEmail?: string;
  alternateContactNo?: string;
  customerAddress?: string;
  issues?: string;
  plan?: string;
  paymentMerchant?: string;
  mainAmount?: number;
  upgradedAmount?: number;
  salesTaxType?: 'PERCENTAGE' | 'DIRECT_AMOUNT';
  salesTaxValue?: number;
  salesTaxAmount?: number;
  finalAmount?: number;
  connected: 'yes' | 'no';
  connectedBy: string;
  assignedTo?: string;
  assignedToName?: string;
  acceptedAt?: string;
  customerType?: 'NEW' | 'EXISTING_CUSTOMER' | 'UPGRADE';
  isSale: 'yes' | 'no';
  saleAmount?: number;
  salePaymentMethod?: 'Card' | 'Check' | 'Wire Transfer' | 'Cash' | 'UPI' | 'Bank Transfer' | 'Online' | 'Other';
  techSupportStatus?: 'NONE' | 'PENDING' | 'ACCEPTED' | 'SUCCESSFUL' | 'FAILED';
  techSupportEmployeeId?: string;
  techSupportEmployeeName?: string;
  techSupportCompletedAt?: string;
  paymentConfirmed?: 'yes' | 'no';
  finalStatus?: 'PENDING_PAYMENT' | 'CLOSED' | 'PAYMENT_FAILED';
  status?: 'OPEN' | 'COMPLETED';
  createdAt?: string;
  workflowMessageId?: string;
}

export interface ICompanySale {
  _id: string;
  leadId?: string;
  customerId?: string;
  name: string;
  customerEmail?: string;
  alternateContactNo?: string;
  customerAddress?: string;
  country: string;
  system: string;
  issues?: string;
  plan?: string;
  paymentMerchant?: string;
  connectedBy: string;
  customerType?: 'NEW' | 'EXISTING_CUSTOMER' | 'UPGRADE';
  salesEmployeeId?: string;
  salesEmployeeName?: string;
  techSupportEmployeeId?: string;
  techSupportEmployeeName?: string;
  techSupportCompletedAt?: string;
  amount: number;
  mainAmount?: number;
  upgradedAmount?: number;
  salesTaxType?: 'PERCENTAGE' | 'DIRECT_AMOUNT';
  salesTaxValue?: number;
  salesTaxAmount?: number;
  finalAmount?: number;
  paymentMethod: 'Card' | 'Check' | 'Wire Transfer' | 'Cash' | 'UPI' | 'Bank Transfer' | 'Online' | 'Other';
  saleDate: string;
  businessDate?: string;
  failed?: boolean;
  failedReason?: string;
  failedAt?: string | null;
  failedByName?: string;
  verificationStatus?: 'PENDING' | 'IN_PROGRESS' | 'SUCCESSFUL' | 'FAILED';
  verificationEmployeeId?: string;
  verificationEmployeeName?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  verificationFailedReason?: string;
  verificationFailedBy?: string;
  verificationFailedByName?: string;
  verificationFailedAt?: string;
  feedbackStatus?: 'PENDING' | 'COMPLETED';
  feedbackRating?: 'Positive' | 'Neutral' | 'Negative';
  feedbackNotes?: string;
  feedbackBy?: string;
  feedbackByName?: string;
  feedbackAt?: string;
  feedbackBusinessDate?: string;
  salesEmployeeRemark?: string;
}

export interface ICustomerSearchResult extends Partial<ICompanySale> {
  _id: string;
  customerId?: string;
  name: string;
  customerEmail?: string;
  alternateContactNo?: string;
  mobile?: string;
  contactNo?: string;
  country?: string;
  system?: string;
  salesEmployeeName?: string;
  amount?: number;
  finalAmount?: number;
  saleDate?: string;
  paymentMethod?: ICompanySale['paymentMethod'];
  customerAddress?: string;
}

export interface IUpgradeRecord {
  _id: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  mobile?: string;
  country?: string;
  system?: string;
  salesEmployeeId?: string;
  salesEmployeeName?: string;
  upgradedBy?: string;
  upgradedByName?: string;
  upgradeNumber?: number;
  upgradeAmount: number;
  salesTaxType?: 'PERCENTAGE' | 'DIRECT_AMOUNT';
  salesTaxValue?: number;
  salesTaxAmount?: number;
  finalAmount: number;
  paymentMethod?: ICompanySale['paymentMethod'];
  salesEmployeeRemark?: string;
  status?: string;
  createdAt?: string;
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
    const theme = res.data?.data?.employee?.theme || res.data?.employee?.theme || 'blue';
    if (typeof window !== 'undefined' && accessToken) {
      window.localStorage.setItem('companyAccessToken', accessToken);
      window.localStorage.setItem('crm-user-theme', theme);
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
  uploadConversationAttachment: async (conversationId: string, formData: FormData, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void): Promise<ICompanyMessage> => (await api.post(`/company/conversations/${conversationId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })).data.data,
  getAttachmentUrl: async (conversationId: string, messageId: string) => (await api.get(`/company/conversations/${conversationId}/messages/${messageId}/attachment`)).data.data.url,
  downloadConversationAttachment: async (conversationId: string, messageId: string) => {
    const response = await api.get(`/company/conversations/${conversationId}/messages/${messageId}/download`, { responseType: 'blob' });
    return response.data;
  },
  updateMessage: async (messageId: string, content: string): Promise<ICompanyMessage> => (await api.patch(`/company/messages/${messageId}`, { content })).data.data,
  deleteMessage: async (messageId: string) => (await api.delete(`/company/messages/${messageId}`)).data.data,

  getLeads: async (): Promise<ICompanyLead[]> => (await api.get('/company/leads')).data.data,
  createLead: async (data: Omit<ICompanyLead, '_id'>): Promise<ICompanyLead> => (await api.post('/company/leads', data)).data.data,
  acceptLead: async (id: string): Promise<ICompanyLead> => (await api.post(`/company/leads/${id}/accept`)).data.data,
  updateLead: async (id: string, data: Partial<ICompanyLead>): Promise<ICompanyLead> => (await api.patch(`/company/leads/${id}`, data)).data.data,
  deleteLead: async (id: string) => (await api.delete(`/company/leads/${id}`)).data.data,
  getSales: async (): Promise<ICompanySale[]> => (await api.get('/company/sales', { params: { failed: false, t: Date.now() }, headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache', Expires: '0' } })).data.data,
  getFailedSales: async (): Promise<ICompanySale[]> => (await api.get('/company/sales', { params: { failed: true, t: Date.now() }, headers: { 'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache', Expires: '0' } })).data.data,
  searchCustomers: async (query: string): Promise<ICustomerSearchResult[]> => (await api.get('/company/sales/customers/search', { params: { q: query } })).data.data,
  createUpgrade: async (payload: Partial<ICustomerSearchResult> & { customerId?: string; customerName?: string; customerEmail?: string; mobile?: string; country?: string; system?: string; upgradeAmount?: number; salesTaxType?: 'PERCENTAGE' | 'DIRECT_AMOUNT'; salesTaxValue?: number; salesTaxAmount?: number; finalAmount?: number; paymentMethod?: ICompanySale['paymentMethod']; salesEmployeeRemark?: string; }): Promise<IUpgradeRecord> => (await api.post('/company/sales/upgrades', payload)).data.data,
  getUpgrades: async (params: { customerId?: string; q?: string; status?: string } = {}): Promise<IUpgradeRecord[]> => (await api.get('/company/sales/upgrades', { params })).data.data,
  getVerifications: async (params: { status?: string } = {}): Promise<ICompanySale[]> => (await api.get('/company/verification', { params })).data.data,
  createVerification: async (payload: Partial<ICompanySale> & { name: string; country: string; system: string; connectedBy: string; amount: number; paymentMethod: ICompanySale['paymentMethod']; }): Promise<ICompanySale> => (await api.post('/company/verification', payload)).data.data,
  updateVerification: async (id: string, payload: Partial<ICompanySale>): Promise<ICompanySale> => (await api.patch(`/company/verification/${id}`, payload)).data.data,
  deleteVerification: async (id: string): Promise<{ id: string }> => (await api.delete(`/company/verification/${id}`)).data.data,
  startVerification: async (id: string): Promise<ICompanySale> => (await api.post(`/company/verification/${id}/start`)).data.data,
  completeVerification: async (id: string, payload: { status: 'SUCCESSFUL' | 'FAILED'; notes?: string; failedReason?: string }): Promise<ICompanySale> => (await api.post(`/company/verification/${id}/complete`, payload)).data.data,
  getFeedbacks: async (params: { status?: string } = {}): Promise<ICompanySale[]> => (await api.get('/company/feedback', { params })).data.data,
  completeFeedback: async (id: string, payload: { rating: 'Positive' | 'Neutral' | 'Negative'; notes?: string }): Promise<ICompanySale> => (await api.post(`/company/feedback/${id}/complete`, payload)).data.data,
  getRemoteSupport: async (filters: Record<string, any> = {}): Promise<IRemoteSupportRecord[]> => (await api.get('/company/remote-support', { params: filters })).data.data,
  createRemoteSupport: async (data: Partial<IRemoteSupportRecord>) => (await api.post('/company/remote-support', data)).data.data,
  acceptRemoteSupport: async (id: string) => (await api.post(`/company/remote-support/${id}/accept`)).data.data,
  rejectRemoteSupport: async (id: string, rejectedReason: string) => (await api.post(`/company/remote-support/${id}/reject`, { rejectedReason })).data.data,
  completeRemoteSupport: async (id: string, payload: { status: 'SUCCESSFUL' | 'FAILED'; failedReason?: string }) => (await api.post(`/company/remote-support/${id}/complete`, payload)).data.data,
  assignRemoteSupport: async (id: string, techSupportEmployeeId: string) => (await api.post(`/company/remote-support/${id}/assign`, { techSupportEmployeeId })).data.data,
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
  updateTheme: async (theme: ThemeName) => {
    const res = await api.patch('/company/theme', { theme });
    if (typeof window !== 'undefined') window.localStorage.setItem('crm-user-theme', theme);
    return res.data.data.theme;
  },
  updateSettings: async (payload: any) => (await api.patch('/company/settings', payload)).data.data,
  listHolidays: async () => (await api.get('/company/settings/holidays')).data.data,
  addHoliday: async (payload: { name: string; date: string }) => (await api.post('/company/settings/holidays', payload)).data.data,
  updateHoliday: async (hid: string, payload: { name?: string; date?: string }) => (await api.patch(`/company/settings/holidays/${hid}`, payload)).data.data,
  deleteHoliday: async (hid: string) => (await api.delete(`/company/settings/holidays/${hid}`)).data.data,
  getTodaysWork: async () => (await api.get('/company/todays-work')).data.data,
};
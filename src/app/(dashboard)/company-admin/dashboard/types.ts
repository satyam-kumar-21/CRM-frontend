export type NavSection = 'overview' | 'chat' | 'employees' | 'groups' | 'sales' | 'leads' | 'billing' | 'settings' | 'profile';
export type TimeframeFilter = 'today' | 'month' | 'year' | 'all';
export type ChatFilter = 'all' | 'groups' | 'employees';

export interface ISaleRecord {
  id: string;
  clientName: string;
  productOrService: string;
  amount: number;
  date: string;
  timeframe: 'today' | 'month' | 'year';
  status: 'closed' | 'in_pipeline' | 'lost';
}

export interface ISalesTarget {
  monthlyTarget: number;
  monthlyAchieved: number;
  yearlyTarget: number;
  yearlyAchieved: number;
  hourlyAchievedToday: number;
}

export interface IEmployee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role: string;
  status: 'active' | 'offline' | 'away';
  isSuspended: boolean;
  joinedDate: string;
  avatarBg: string;
  salesTarget: ISalesTarget;
  remoteTarget?: number;
  dealsClosed: number;
  leadsAssigned?: number;
  conversionRate: number;
  salesHistory: ISaleRecord[];
}

export interface IGroupChannel {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  members?: string[];
  privacy: 'public' | 'private';
  createdDate: string;
}

export interface IDepartment {
  id: string;
  name: string;
  lead: string;
  totalMembers: number;
  budgetAllocated: string;
}

export type ChatMessage = {
  id: string;
  senderName: string;
  senderId?: string;
  content: string;
  time: string;
  isMe: boolean;
};

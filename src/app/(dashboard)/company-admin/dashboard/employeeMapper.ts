import type { ICompanyEmployee } from '@/services/companyService';
import type { IEmployee } from './types';

type CompanyEmployeeWithId = ICompanyEmployee & { id?: string };

export const mapCompanyEmployee = (employee: CompanyEmployeeWithId): IEmployee => ({
  id: employee._id || employee.id || employee.employeeId,
  employeeId: employee.employeeId,
  name: employee.name,
  email: employee.email,
  role: employee.role,
  status: employee.isSuspended ? 'offline' : 'active',
  isSuspended: employee.isSuspended,
  joinedDate: employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'Just Now',
  avatarBg: 'from-indigo-600 to-sky-600',
  salesTarget: {
    monthlyTarget: employee.monthlySalesTarget || employee.remoteTarget || 0,
    monthlyAchieved: employee.monthlySalesAchieved || 0,
    yearlyTarget: (employee.monthlySalesTarget || employee.remoteTarget || 0) * 12,
    yearlyAchieved: (employee.monthlySalesAchieved || 0) * 12,
    hourlyAchievedToday: 0,
  },
  dealsClosed: employee.leadsConverted || 0,
  leadsAssigned: employee.leadsAssigned || 0,
  conversionRate: employee.leadsAssigned ? Math.round((employee.leadsConverted / employee.leadsAssigned) * 100) : 0,
  salesHistory: [],
});

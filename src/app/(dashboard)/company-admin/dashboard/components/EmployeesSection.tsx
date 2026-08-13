"use client";

import { Ban, BarChart3, Search, Trash2, UserPlus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { IEmployee } from "../types";
type EmployeesSectionProps = {
  employees: IEmployee[];
  filteredEmployees: IEmployee[];
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  employeeRoleFilter: string;
  setEmployeeRoleFilter: Dispatch<SetStateAction<string>>;
  onSelectEmployee: (employee: IEmployee) => void;
  onAddEmployee: () => void;
  onEditEmployee: (employee: IEmployee) => void;
  onToggleBlock: (employee: IEmployee) => void;
  onDeleteEmployee: (employee: IEmployee) => void;
};
export function EmployeesSection({
  filteredEmployees,
  searchQuery,
  setSearchQuery,
  employeeRoleFilter,
  setEmployeeRoleFilter,
  onSelectEmployee,
  onAddEmployee,
  onEditEmployee,
  onToggleBlock,
  onDeleteEmployee,
}: EmployeesSectionProps) {
  return (
    <div className="p-6 overflow-y-auto space-y-5">
      <header className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees Directory</h1>
          <p className="text-sm text-slate-400">
            Click on any employee to view their detailed sales revenue, targets,
            achieved goals, and hourly/monthly filters.
          </p>
        </div>
        <button
          onClick={onAddEmployee}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
        >
          <UserPlus className="h-4 w-4" /> Add New Employee
        </button>
      </header>
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={employeeRoleFilter}
            onChange={(e) => setEmployeeRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="SALES">Sales</option>
            <option value="HR">HR</option>
            <option value="MANAGER">Manager</option>
            <option value="TEAM_LEAD">Team Lead</option>
            <option value="TECH_SUPPORT">Tech Support</option>
            <option value="VERIFICATION">Verification</option>
            <option value="IT">IT</option>
          </select>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
            <tr>
              <th className="p-3.5">Employee ID</th>
              <th className="p-3.5">Employee</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Monthly Target</th>
              <th className="p-3.5">Achieved Sales</th>
              <th className="p-3.5">Target Progress</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEmployees.map((emp) => {
              const isSales = emp.role === 'SALES' || emp.role === 'Sales' || emp.role === 'sales';
              const isTech = emp.role === 'TECH_SUPPORT' || emp.role === 'Tech Support' || emp.role === 'TECHNOLOGY_SUPPORT' || emp.role === 'TECH_SUPPORT';
              const monthlyTarget = emp.salesTarget.monthlyTarget || 0;
              const percent = isSales ? Math.round((emp.salesTarget.monthlyAchieved / (monthlyTarget || 1)) * 100) : 0;
              const isTargetMet = isSales && percent >= 100;
              return (
                <tr
                  key={emp.id}
                  onClick={() => onSelectEmployee(emp)}
                  className="hover:bg-indigo-600/10 cursor-pointer transition group"
                >
                  <td className="p-3.5 font-mono text-slate-300">{emp.employeeId}</td>
                  <td className="p-3.5 flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full bg-gradient-to-tr ${emp.avatarBg} flex items-center justify-center text-white font-bold text-xs shadow-md`}
                    >
                      {emp.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-indigo-400 transition">
                        {emp.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{emp.email}</p>
                      {emp.isSuspended && <span className="text-[10px] font-semibold text-amber-400">Blocked from login</span>}
                    </div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-200">
                    {emp.role}
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    {monthlyTarget ? `$${monthlyTarget.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-emerald-400">
                    {isSales ? `$${emp.salesTarget.monthlyAchieved.toLocaleString()}` : '—'}
                  </td>
                  <td className="p-3.5">
                    {isSales ? (
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className={isTargetMet ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{percent}%</span>
                          <span className="text-slate-500">${Math.max(0, monthlyTarget - emp.salesTarget.monthlyAchieved).toLocaleString()} left</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isTargetMet ? 'bg-emerald-500' : percent > 60 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500">—</div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectEmployee(emp); }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <BarChart3 className="h-3.5 w-3.5" /> Analytics
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditEmployee(emp); }}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition"
                        title="Edit employee"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleBlock(emp); }}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        title={emp.isSuspended ? 'Unblock employee' : 'Block employee'}
                      >
                        <Ban className="h-3.5 w-3.5" /> {emp.isSuspended ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteEmployee(emp); }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg transition"
                        title="Delete employee"
                        aria-label={`Delete ${emp.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


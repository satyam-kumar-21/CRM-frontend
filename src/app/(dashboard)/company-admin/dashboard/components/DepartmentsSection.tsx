'use client';

import { Layers } from 'lucide-react';
import type { IDepartment } from '../types';

export const INITIAL_DEPARTMENTS: IDepartment[] = [
	{ id: 'dept-1', name: 'Engineering', lead: 'Satyam Kumar', totalMembers: 18, budgetAllocated: '$45,000 / mo' },
	{ id: 'dept-2', name: 'Product Management', lead: 'Sarah Chen', totalMembers: 6, budgetAllocated: '$22,000 / mo' },
	{ id: 'dept-3', name: 'UI/UX & Brand', lead: 'Priya Sharma', totalMembers: 5, budgetAllocated: '$18,000 / mo' },
	{ id: 'dept-4', name: 'Operations & Sales', lead: 'Alex Rivera', totalMembers: 7, budgetAllocated: '$30,000 / mo' },
];

export function DepartmentsSection({ departments }: { departments: IDepartment[] }) { return <div className="p-6 overflow-y-auto space-y-5"><header className="pb-4 border-b border-slate-800"><h1 className="text-2xl font-bold text-white">Department Overview</h1><p className="text-sm text-slate-400">Manage budget allocations, department leads, and structural teams.</p></header><div className="grid gap-5 md:grid-cols-2">{departments.map((dept) => <div key={dept.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4"><div className="flex justify-between items-center border-b border-slate-800 pb-3"><div><h3 className="text-base font-bold text-white">{dept.name}</h3><p className="text-xs text-slate-400">Lead: <strong className="text-indigo-400">{dept.lead}</strong></p></div><div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400"><Layers className="h-5 w-5" /></div></div><div className="grid grid-cols-2 gap-4 text-xs"><div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60"><p className="text-slate-500 mb-1">Total Workforce</p><p className="text-base font-bold text-white">{dept.totalMembers} Employees</p></div><div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60"><p className="text-slate-500 mb-1">Allocated Budget</p><p className="text-base font-bold text-emerald-400">{dept.budgetAllocated}</p></div></div></div>)}</div></div>; }

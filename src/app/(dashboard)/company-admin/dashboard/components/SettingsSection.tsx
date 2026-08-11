 'use client';

import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';
import { companyService } from '@/services/companyService';

export function SettingsSection() {
	const [loading, setLoading] = useState(true);
	const [settings, setSettings] = useState<any>({});
	const [companyName, setCompanyName] = useState('');
	const [employeeLoginEnabled, setEmployeeLoginEnabled] = useState(true);
	const [routePermissions, setRoutePermissions] = useState<Record<string, boolean>>({});
	const [holidays, setHolidays] = useState<any[]>([]);
	const [newHolidayName, setNewHolidayName] = useState('');
	const [newHolidayDate, setNewHolidayDate] = useState('');

	const load = async () => {
		try {
			setLoading(true);
			const res = await companyService.getSettings();
			const data = res.data || res;
			const s = data.settings || {};
			setSettings(s);
			setCompanyName(s.companyName || data.name || '');
			setEmployeeLoginEnabled(s.employeeLoginEnabled !== false);
			setRoutePermissions(s.routePermissions || {});
			setHolidays(s.holidays || []);
		} catch (err) {
			toast.error('Unable to load settings');
		} finally { setLoading(false); }
	};

	useEffect(() => { void load(); }, []);

	const handleSave = async () => {
		try {
			const payload: any = { companyName, employeeLoginEnabled, routePermissions, holidays };
			await companyService.updateSettings(payload);
			toast.success('Settings saved');
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Unable to save settings');
		}
	};

	// Immediate toggle handlers (optimistic update)
	const toggleEmployeeLogin = async () => {
		const newVal = !employeeLoginEnabled;
		setEmployeeLoginEnabled(newVal);
		try {
			await companyService.updateSettings({ employeeLoginEnabled: newVal });
			toast.success(`Employee login ${newVal ? 'enabled' : 'disabled'}`);
		} catch (err: any) {
			setEmployeeLoginEnabled(!newVal);
			toast.error(err?.response?.data?.message || 'Unable to update employee login');
		}
	};

	const togglePermission = async (key: string) => {
		const prev = routePermissions || {};
		const enabled = prev[key] !== false;
		const updated = { ...(prev || {}), [key]: !enabled };
		setRoutePermissions(updated);
		try {
			await companyService.updateSettings({ routePermissions: updated });
			toast.success(`${key.replace('-', ' ')} ${!enabled ? 'enabled' : 'disabled'}`);
		} catch (err: any) {
			setRoutePermissions(prev);
			toast.error(err?.response?.data?.message || 'Unable to update permission');
		}
	};

	const handleAddHoliday = async () => {
		if (!newHolidayName || !newHolidayDate) return toast.error('Name and date required');
		try {
			const res = await companyService.addHoliday({ name: newHolidayName, date: newHolidayDate });
			setHolidays(res.holidays || res);
			setNewHolidayName(''); setNewHolidayDate('');
			toast.success('Holiday added');
		} catch {
			toast.error('Unable to add holiday');
		}
	};

	const handleDeleteHoliday = async (hid: string) => {
		if (!confirm('Delete this holiday?')) return;
		try {
			const res = await companyService.deleteHoliday(hid);
			setHolidays(res.holidays || res);
			toast.success('Holiday removed');
		} catch {
			toast.error('Unable to delete holiday');
		}
	};

	return (
		<div className="p-6 overflow-y-auto space-y-6">
			<header className="pb-4 border-b border-slate-800">
				<h1 className="text-2xl font-bold text-white">Company & System Settings</h1>
				<p className="text-sm text-slate-400">Configure global parameters and employee access control.</p>
			</header>

			<div className="space-y-6 max-w-3xl">
				<div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
					<h3 className="text-sm font-bold text-white flex items-center gap-2"><Globe className="h-4 w-4 text-indigo-400" /> General Organization Profile</h3>
					<div className="grid gap-4 sm:grid-cols-2 text-xs">
						<div>
							<label className="block text-slate-400 mb-1">Company Name</label>
							<input value={companyName} onChange={(e) => setCompanyName(e.target.value)} type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500" />
						</div>
						<div>
							<label className="block text-slate-400 mb-1">Employee Login</label>
							<div className="flex items-center gap-3">
								<button
									onClick={() => void toggleEmployeeLogin()}
									role="switch"
									aria-checked={employeeLoginEnabled}
									aria-label={employeeLoginEnabled ? 'Employee login enabled' : 'Employee login disabled'}
									className={`relative inline-flex items-center h-6 w-12 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${employeeLoginEnabled ? 'bg-emerald-600' : 'bg-slate-800'}`}>
										<span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${employeeLoginEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
									</button>
								</div>
						</div>
					</div>
				</div>

				<div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
					<h3 className="text-sm font-bold text-white">Employee Navigation Permissions</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
						{['dashboard','leads','sales','failed-sales','attendance','leave','announcements','chat','reports'].map((key) => {
							const enabled = routePermissions?.[key] !== false;
							return (
								<div key={key} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-950/40 border border-slate-800 hover:scale-[1.01] transition-transform duration-150">
									<div className="text-sm text-slate-200 capitalize">{key.replace('-', ' ')}</div>
									<div role="group" aria-label={`${key} permission toggle`}>
												<button
													onClick={() => togglePermission(key)}
											role="switch"
											aria-checked={enabled}
											aria-label={`${enabled ? 'Enabled' : 'Disabled'} ${key} for employees`}
											className={`relative inline-flex items-center h-6 w-12 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${enabled ? 'bg-emerald-600' : 'bg-slate-800'}`}>
												<span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
											</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
					<h3 className="text-sm font-bold text-white">Holiday Management</h3>
					<div className="grid gap-3">
						<div className="flex gap-2">
							<input value={newHolidayName} onChange={(e) => setNewHolidayName(e.target.value)} placeholder="Holiday name" className="w-2/3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
							<input value={newHolidayDate} onChange={(e) => setNewHolidayDate(e.target.value)} type="date" className="w-1/3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
							<button onClick={handleAddHoliday} className="px-3 rounded-xl bg-indigo-600 text-white">Add Holiday</button>
						</div>
						<div className="mt-2 text-sm text-slate-300">
							<ul className="space-y-2">
								{holidays.map((h:any) => (
									<li key={h._id || `${h.name}-${h.date}`} className="flex items-center justify-between">
										<div>{h.name} — {new Date(h.date).toLocaleDateString()}</div>
										<div><button onClick={() => handleDeleteHoliday(h._id)} className="text-rose-400">Delete</button></div>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				<div className="flex justify-end"><button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20">Save Changes</button></div>
			</div>
		</div>
	);
}

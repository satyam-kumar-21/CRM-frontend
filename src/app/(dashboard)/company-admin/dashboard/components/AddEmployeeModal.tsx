'use client';

import { UserPlus, X } from 'lucide-react';
import React, { useEffect } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';

type AddEmployeeModalProps = {
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
  employeeId?: string;
  submitLabel?: string;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  phone: string;
  setPhone: Dispatch<SetStateAction<string>>;
  role: string;
  setRole: Dispatch<SetStateAction<string>>;
  target: number;
  setTarget: Dispatch<SetStateAction<number>>;
  remoteTarget: number;
  setRemoteTarget: Dispatch<SetStateAction<number>>;
};

export function AddEmployeeModal({
  onSubmit,
  onClose,
  employeeId,
  submitLabel,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  phone,
  setPhone,
  role,
  setRole,
  target,
  setTarget,
  remoteTarget,
  setRemoteTarget,
}: AddEmployeeModalProps) {
  const inputStyle =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors';

  const textFields = [
    { label: 'Full Name', value: name, setter: setName, type: 'text', placeholder: 'e.g. Rahul Verma' },
    { label: 'Corporate Email (optional)', value: email, setter: setEmail, type: 'email', placeholder: 'name@company.com' },
    { label: 'Phone Number', value: phone, setter: setPhone, type: 'tel', placeholder: '+91 98765 43210' },
    { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: 'At least 6 characters' },
  ];

  useEffect(() => {
    if (role === 'SALES') {
      setRemoteTarget(0);
      return;
    }
    if (role === 'TECH_SUPPORT') {
      setTarget(0);
      return;
    }
    setTarget(0);
    setRemoteTarget(0);
  }, [role, setTarget, setRemoteTarget]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-400" /> Add Employee Account
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 gap-3">
            {employeeId && (
              <label className="flex flex-col gap-1 text-slate-400">
                <span>Employee ID</span>
                <input
                  type="text"
                  value={employeeId}
                  readOnly
                  className={`${inputStyle} cursor-not-allowed bg-slate-950/80`}
                />
              </label>
            )}
          </div>

          {textFields.map(({ label, value, setter, type, placeholder }) => (
            <label key={label} className="flex flex-col gap-1 text-slate-400">
              <span>{label}</span>
              <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className={inputStyle}
              />
            </label>
          ))}

          <label className="flex flex-col gap-1 text-slate-400">
            <span>Access Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputStyle}
            >
              <option value="EMPLOYEE" className="bg-slate-900 text-white">Employee</option>
              <option value="SALES" className="bg-slate-900 text-white">Sales</option>
              <option value="HR" className="bg-slate-900 text-white">HR</option>
              <option value="MANAGER" className="bg-slate-900 text-white">Manager</option>
              <option value="TEAM_LEAD" className="bg-slate-900 text-white">Team Lead</option>
              <option value="TECH_SUPPORT" className="bg-slate-900 text-white">Tech Support</option>
              <option value="VERIFICATION" className="bg-slate-900 text-white">Verification</option>
              <option value="IT" className="bg-slate-900 text-white">IT</option>
            </select>
          </label>

          {role === 'SALES' && (
            <label className="flex flex-col gap-1 text-slate-400">
              <span>Monthly Sales Target ($)</span>
              <input
                type="number"
                required
                placeholder="e.g. 45000"
                value={target || ''}
                onChange={(e) => setTarget(e.target.value === '' ? 0 : Number(e.target.value))}
                className={`${inputStyle} font-mono`}
              />
            </label>
          )}

          {role === 'TECH_SUPPORT' && (
            <label className="flex flex-col gap-1 text-slate-400">
              <span>Remote Target</span>
              <input
                type="number"
                required
                placeholder="e.g. 20"
                value={remoteTarget || ''}
                onChange={(e) => setRemoteTarget(e.target.value === '' ? 0 : Number(e.target.value))}
                className={`${inputStyle} font-mono`}
              />
            </label>
          )}

          {/* Department removed — Access Role is used instead */}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-colors"
            >
              {submitLabel ?? 'Confirm & Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
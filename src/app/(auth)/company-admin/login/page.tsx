'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Building2, Lock, Mail, ArrowRight, User, ShieldCheck, KeyRound } from 'lucide-react';
import { companyService } from '@/services/companyService';

const adminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const employeeSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type AdminFormValues = z.infer<typeof adminSchema>;
type EmployeeFormValues = z.infer<typeof employeeSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

type OtpStep = {
  otpToken: string;
  maskedEmail: string;
  role: string;
  loginRole: 'admin' | 'employee';
};

export default function WorkspaceLoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [otpStep, setOtpStep] = useState<OtpStep | null>(null);

  const adminForm = useForm<AdminFormValues>({ resolver: zodResolver(adminSchema) });
  const employeeForm = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema) });
  const otpForm = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) });

  const redirectAfterLogin = (loginRole: 'admin' | 'employee') => {
    router.push(loginRole === 'admin' ? '/company-admin/dashboard' : '/employee/dashboard');
  };

  const onAdminSubmit = async (values: AdminFormValues) => {
    try {
      const result = await companyService.login({ email: values.email, password: values.password });
      if (result.otpRequired) {
        setOtpStep({
          otpToken: result.otpToken,
          maskedEmail: result.maskedEmail,
          role: result.role,
          loginRole: 'admin',
        });
        toast.success(`OTP sent to ${result.maskedEmail}`);
        return;
      }
      toast.success('Welcome back to your company workspace');
      redirectAfterLogin('admin');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to authenticate as Admin');
    }
  };

  const onEmployeeSubmit = async (values: EmployeeFormValues) => {
    try {
      const result = await companyService.login({ employeeId: values.employeeId, password: values.password });
      if (result.otpRequired) {
        setOtpStep({
          otpToken: result.otpToken,
          maskedEmail: result.maskedEmail,
          role: result.role,
          loginRole: 'employee',
        });
        toast.success(`OTP sent to ${result.maskedEmail}`);
        return;
      }
      toast.success('Login successful! Welcome to your workspace');
      redirectAfterLogin('employee');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    }
  };

  const onOtpSubmit = async (values: OtpFormValues) => {
    if (!otpStep) return;
    try {
      await companyService.verifyLoginOtp({ otpToken: otpStep.otpToken, otp: values.otp });
      toast.success('OTP verified! Login successful');
      redirectAfterLogin(otpStep.loginRole);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    }
  };

  const resetOtpStep = () => {
    setOtpStep(null);
    otpForm.reset();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl my-6"
      >
        <div className="flex flex-col items-center gap-3 text-center mb-6">
          <div className="h-14 w-14 rounded-3xl bg-gradient-to-br from-indigo-500 via-sky-500 to-teal-400 flex items-center justify-center shadow-lg shadow-slate-950/40">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Company Workspace</h1>
            <p className="text-sm text-slate-400 mt-1">
              {otpStep ? 'Enter the OTP sent to your email' : 'Select your role to log in to your dashboard'}
            </p>
          </div>
        </div>

        {otpStep ? (
          <motion.form
            key="otp-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={otpForm.handleSubmit(onOtpSubmit)}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
              OTP sent to <span className="font-semibold text-white">{otpStep.maskedEmail}</span>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-1.5 font-medium">
                6-Digit OTP
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  {...otpForm.register('otp')}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-100 tracking-[0.4em] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
              {otpForm.formState.errors.otp && (
                <p className="text-xs text-rose-500 mt-1.5">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={otpForm.formState.isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {otpForm.formState.isSubmitting ? 'Verifying...' : 'Verify OTP & Sign In'}
              {!otpForm.formState.isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={resetOtpStep}
              className="w-full text-sm text-slate-400 hover:text-slate-200 transition"
            >
              Back to login
            </button>
          </motion.form>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  role === 'admin'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Company Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('employee')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  role === 'employee'
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="h-4 w-4" />
                Employee
              </button>
            </div>

            <AnimatePresence mode="wait">
              {role === 'admin' ? (
                <motion.form
                  key="admin-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={adminForm.handleSubmit(onAdminSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-1.5 font-medium">
                      Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        {...adminForm.register('email')}
                        type="email"
                        placeholder="admin@company.com"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>
                    {adminForm.formState.errors.email && (
                      <p className="text-xs text-rose-500 mt-1.5">{adminForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-1.5 font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        {...adminForm.register('password')}
                        type="password"
                        placeholder="Enter password"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>
                    {adminForm.formState.errors.password && (
                      <p className="text-xs text-rose-500 mt-1.5">{adminForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">Admin login always requires email OTP verification.</p>

                  <button
                    type="submit"
                    disabled={adminForm.formState.isSubmitting}
                    className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                  >
                    {adminForm.formState.isSubmitting ? 'Signing in...' : 'Sign in as Admin'}
                    {!adminForm.formState.isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="employee-form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={employeeForm.handleSubmit(onEmployeeSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-1.5 font-medium">
                      Employee ID
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        {...employeeForm.register('employeeId')}
                        type="text"
                        placeholder="EMP-1024"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                      />
                    </div>
                    {employeeForm.formState.errors.employeeId && (
                      <p className="text-xs text-rose-500 mt-1.5">{employeeForm.formState.errors.employeeId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-slate-400 mb-1.5 font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        {...employeeForm.register('password')}
                        type="password"
                        placeholder="Enter password"
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                      />
                    </div>
                    {employeeForm.formState.errors.password && (
                      <p className="text-xs text-rose-500 mt-1.5">{employeeForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={employeeForm.formState.isSubmitting}
                    className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                  >
                    {employeeForm.formState.isSubmitting ? 'Signing in...' : 'Sign in as Employee'}
                    {!employeeForm.formState.isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );
}

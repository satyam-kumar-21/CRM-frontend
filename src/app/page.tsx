import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 font-sans dark:bg-zinc-950">
      {/* Main Container */}
      <main className="flex w-full max-w-2xl flex-col items-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-12">
        
        {/* Logo / Brand Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0H9m11 0a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0V3"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Welcome to CRM Portal
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Select your access role to sign in to your dashboard.
          </p>
        </div>

        {/* Action Buttons / Role Selection Cards */}
        <div className="flex w-full flex-col gap-4 sm:flex-row">
          {/* Company Admin Option */}
          <Link
            href="/company-admin/login"
            className="group relative flex flex-1 flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-6 transition-all hover:border-zinc-400 hover:bg-zinc-100/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <div>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0H9m11 0a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0V3"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Company Admin
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Manage team workspace, client records, sales pipelines, and daily tasks.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-medium text-zinc-900 group-hover:translate-x-1 transition-transform dark:text-zinc-100">
              Login as Company Admin &rarr;
            </div>
          </Link>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-xs text-zinc-400 dark:text-zinc-500">
          Need help accessing your account? Contact support.
        </p>
      </main>
    </div>
  );
}
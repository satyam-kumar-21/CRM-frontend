'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  setPage: (page: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize = 30, setPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Build page numbers to show (up to 5 around current)
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-800/80 px-1 pt-3 mt-3">
      <p className="text-[11px] text-slate-500">
        Showing <span className="font-semibold text-slate-300">{from}–{to}</span> of{' '}
        <span className="font-semibold text-slate-300">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-600">…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p as number)}
              className={`flex h-7 min-w-[28px] items-center justify-center rounded-lg border px-2 text-xs font-semibold transition ${
                p === page
                  ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

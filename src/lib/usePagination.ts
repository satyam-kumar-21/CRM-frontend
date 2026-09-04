/**
 * usePagination – simple pagination hook
 * PAGE_SIZE: 30 items per page (latest first)
 */
import { useMemo, useState } from 'react';

export const PAGE_SIZE = 30;

export function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  // Clamp page if items shrink
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [items, safePage],
  );
  return { page: safePage, setPage, totalPages, pageItems, total: items.length };
}

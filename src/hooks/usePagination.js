import { useCallback, useMemo, useState } from "react";

/**
 * usePagination.js — hooks/
 *
 * Logic pagination generik (halaman aktif, total halaman, slice data)
 * yang sebelumnya diduplikasi persis di InvoicePage.jsx, InventoryPage.jsx,
 * dan ReportIssuePage.jsx (cuma beda nama variabel). Ditarik ke sini
 * sekali, dipakai di ketiganya.
 *
 * Nggak nangani search/sort/filter — itu tetap tanggung jawab tiap
 * halaman (field yang difilter/disortir beda-beda), hook ini cuma
 * ambil array yang SUDAH difilter+disortir, lalu potong per halaman.
 *
 * @param {Array} items - Array yang sudah difilter & disortir
 * @param {number} pageSize - Jumlah item per halaman
 * @returns {{
 *   currentPage: number,
 *   totalPages: number,
 *   paginatedItems: Array,
 *   setPage: (page: number) => void,
 *   resetPage: () => void,
 * }}
 *
 * Contoh pakai:
 *   const { currentPage, totalPages, paginatedItems, setPage, resetPage } =
 *     usePagination(sortedInvoices, PAGE_SIZE);
 *
 *   // di handler onChange search/sort:
 *   onChange={(value) => { setSearch(value); resetPage(); }}
 */
export function usePagination(items, pageSize) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  );

  const resetPage = useCallback(() => setPage(1), []);

  return { currentPage, totalPages, paginatedItems, setPage, resetPage };
}

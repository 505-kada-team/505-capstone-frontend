import { useCallback, useEffect, useState } from 'react';

/**
 * useFetch.js — hooks/
 *
 * Pola generik "fetch on mount": loading/error/data state + refetch
 * manual. Ditarik dari InvoicePage.jsx SEBELUM sempat terduplikasi —
 * InventoryPage.jsx & ReportIssuePage.jsx bakal butuh pola persis ini
 * begitu keduanya disambungin ke backend (sekarang masih mock data).
 *
 * Sengaja TIDAK nanganin toast/console.error di sini — pesan error
 * beda-beda tiap halaman, itu tetap keputusan pemanggil lewat `error`
 * yang dikembalikan, bukan tanggung jawab hook ini.
 *
 * @param {() => Promise<any>} fetchFn
 * @param {Array} deps - dependency array, sama kayak useEffect (refetch
 *   otomatis kalau salah satu berubah)
 * @returns {{ data: any, isLoading: boolean, error: Error|null, refetch: () => Promise<any> }}
 */
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error, refetch };
}
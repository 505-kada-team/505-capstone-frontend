import { useState, useCallback } from 'react';

/**
 * Hook kustom untuk memfasilitasi integrasi pengurutan (sorting) data
 * dengan UI. Hook ini menyimpan state dari parameter sort yang dipilih user,
 * dan menyediakan fungsi helper bila pengurutan perlu dilakukan di frontend.
 * 
 * Penggunaan utama dalam arsitektur saat ini adalah sebagai sumber kebenaran (source of truth)
 * untuk parameter `sort` yang akan dilempar ke API / Mock API.
 * 
 * @param {string} initialSortKey - Key urutan default (contoh: 'date_newest', 'name_asc')
 * @returns {object} { sortBy, setSortBy, sortData }
 */
export function useSortable(initialSortKey = 'newest') {
  const [sortBy, setSortBy] = useState(initialSortKey);

  // Jika suatu saat butuh fallback sorting murni di frontend (misal data non-paginated), 
  // fungsi helper ini bisa digunakan secara opsional.
  const sortData = useCallback((dataArray, sortKeyOverride) => {
    const key = sortKeyOverride || sortBy;
    const sorted = [...dataArray];

    sorted.sort((a, b) => {
      switch (key) {
        // Name
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        
        // Stock / Quantity
        case 'stock_high':
          return (b.currentStock || b.quantity || 0) - (a.currentStock || a.quantity || 0);
        case 'stock_low':
          return (a.currentStock || a.quantity || 0) - (b.currentStock || b.quantity || 0);
          
        // Cost / Price
        case 'cost_high':
          return (b.cost || b.price || b.estimatedCost || 0) - (a.cost || a.price || a.estimatedCost || 0);
        case 'cost_low':
          return (a.cost || a.price || a.estimatedCost || 0) - (b.cost || b.price || b.estimatedCost || 0);
          
        // Date / Time
        case 'date_newest':
          return new Date(b.createdAt || b.startDate || b.incidentAt || b.date || b.updatedAt || 0) - new Date(a.createdAt || a.startDate || a.incidentAt || a.date || a.updatedAt || 0);
        case 'date_oldest':
          return new Date(a.createdAt || a.startDate || a.incidentAt || a.date || a.updatedAt || 0) - new Date(b.createdAt || b.startDate || b.incidentAt || b.date || b.updatedAt || 0);
          
        default:
          return 0; // fallback to original order
      }
    });

    return sorted;
  }, [sortBy]);

  return { sortBy, setSortBy, sortData };
}

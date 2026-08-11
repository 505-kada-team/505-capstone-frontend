/**
 * formatDate.js — lib/
 *
 * Format tanggal ISO ke format Indonesia (DD/MM/YYYY). Sebelumnya
 * didefinisikan ulang persis sama di InvoicePage, InventoryPage,
 * ReportIssuePage — ditarik ke sini sekali, dipakai di mana-mana.
 */
export const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
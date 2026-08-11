export const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'Rp 0';
  return 'Rp ' + Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

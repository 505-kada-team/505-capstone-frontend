export const parseLocalDate = (dateString) => {
  if (!dateString) return null;

  const [year, month, day] = dateString
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day);
};

export const getLocalDateTimestamp = (
  dateString,
  endOfDay = false
) => {
  const date = parseLocalDate(dateString);

  if (!date) return null;

  date.setHours(
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );

  return date.getTime();
};

export const formatDateRange = (start, end) => {
  if (!start || !end) return '-';

  const startDate = parseLocalDate(start.split('T')[0]);
  const endDate = parseLocalDate(end.split('T')[0]);

  const formatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
};
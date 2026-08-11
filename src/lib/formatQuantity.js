export function formatQuantity(value, unit) {
  return `${value ?? 0} ${unit ?? ""}`;
}
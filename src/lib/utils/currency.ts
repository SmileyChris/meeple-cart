export function formatCurrency(amountInCents: number, locale: string = 'en-NZ'): string {
  if (!Number.isFinite(amountInCents)) {
    throw new TypeError('Amount must be a finite number');
  }

  const dollars = amountInCents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
  }).format(dollars);
}

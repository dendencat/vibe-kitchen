const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const price = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whole-dollar amount, e.g. `$12,345` / `-$300`. */
export function format_money(value: number): string {
  return money.format(Math.round(value));
}

/** Price with cents, e.g. `$12.99`. */
export function format_price(value: number): string {
  return price.format(value);
}

/** Percentage with fixed decimals, e.g. `16.7%`. */
export function format_percent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** Seconds as `m:ss`. */
export function format_clock(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/** Compact signed delta, e.g. `+$120` or `-$40`. */
export function format_delta(value: number): string {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : '-'}${money.format(Math.abs(rounded))}`;
}

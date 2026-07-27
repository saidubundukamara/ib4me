/**
 * The one money formatter.
 *
 * Every amount in this codebase is stored as an **integer number of minor units**
 * (1 Le = 100 minor units). This module is the only place allowed to turn one into
 * a string, and it always renders exactly two decimal places.
 *
 * Two bug classes this exists to prevent:
 *
 * 1. `minimumFractionDigits: 0` renders "Le 500" and "Le 103.6". Money is always two
 *    decimals. (MONIME-FEE-MODEL.md §8.9)
 * 2. Doing fee arithmetic on major units. `round(100 * 260 / 10000)` is `3` in whole
 *    Leones but `Le 2.60` in minor units, and any fee under half a Leone displays as
 *    zero. `formatMinor` therefore refuses major units by construction — there is no
 *    overload that takes them. (§8.8)
 *
 * We do not use `Intl`'s `style: "currency"`: the symbol it produces depends on the
 * locale's ICU data, and the codebase disagrees with itself about the locale. Under
 * `en-SL` the code SLE renders "Le 96.43"; under `en-GB` — which most of the pre-existing
 * copies passed — the same amount renders "SLE 96.43". SLL never resolves to a symbol in
 * any locale. So we format the number and prefix the symbol ourselves, which is
 * deterministic across Node versions and browsers.
 */

export const MINOR_PER_MAJOR = 100;

/** Currency code -> the symbol we want to show. Unlisted codes fall back to the code. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  SLE: "Le",
  SLL: "Le",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

export const DEFAULT_CURRENCY = "SLE";

function symbolFor(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency.toUpperCase();
}

/**
 * Alphabetic symbols read as words and need a space ("Le 96.43", "SLL 96.43"); glyphs
 * bind directly to the number ("$96.43", "£96.43").
 */
function joinSymbol(symbol: string, body: string): string {
  return /[A-Za-z]$/.test(symbol) ? `${symbol} ${body}` : `${symbol}${body}`;
}

/** Minor units -> major units. Returns a float; for DISPLAY and API edges only. */
export function toMajor(minor: number): number {
  return minor / MINOR_PER_MAJOR;
}

/**
 * Major units -> minor units. `Math.round` because the input is a human-entered
 * decimal ("96.43"), and float representation makes 96.43 * 100 = 9642.999999999999.
 */
export function toMinor(major: number): number {
  return Math.round(major * MINOR_PER_MAJOR);
}

/**
 * The canonical money renderer: minor units in, "Le 96.43" out. Always 2dp.
 */
export function formatMinor(
  minor: number,
  currency: string = DEFAULT_CURRENCY
): string {
  const safe = Number.isFinite(minor) ? minor : 0;
  const negative = safe < 0;
  const body = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(toMajor(safe)));
  return `${negative ? "-" : ""}${joinSymbol(symbolFor(currency), body)}`;
}

/**
 * Same output as `formatMinor`, for the handful of call sites that legitimately hold
 * major units (a value already divided down, or a user-entered decimal).
 *
 * Prefer `formatMinor`. Every amount in the database is minor units, and converting early
 * just to format is how cents get lost — `Math.floor(raisedMinor / 100)` was doing
 * exactly that on a figure that now has cents in it.
 */
export function formatMajor(
  major: number,
  currency: string = DEFAULT_CURRENCY
): string {
  return formatMinor(toMinor(Number.isFinite(major) ? major : 0), currency);
}

/**
 * Compact form for dashboard tiles only — "Le 1.2M". Never use this where the exact
 * figure matters (balances, fee breakdowns, payout quotes, receipts): it rounds, and a
 * rounded balance is the single-netted-number problem all over again (§8.1).
 */
export function formatCompactMinor(
  minor: number,
  currency: string = DEFAULT_CURRENCY
): string {
  const safe = Number.isFinite(minor) ? minor : 0;
  const major = Math.abs(toMajor(safe));
  const sign = safe < 0 ? "-" : "";
  const sym = symbolFor(currency);

  if (major < 10_000) return formatMinor(safe, currency);

  const units: Array<[number, string]> = [
    [1_000_000_000, "B"],
    [1_000_000, "M"],
    [1_000, "K"],
  ];
  for (const [size, suffix] of units) {
    if (major >= size) {
      const scaled = major / size;
      // One decimal below 10 ("1.2M"), none above ("12M") — keeps the width stable.
      const text = scaled >= 10 ? Math.round(scaled).toString() : scaled.toFixed(1);
      return `${sign}${sym} ${text}${suffix}`;
    }
  }
  return formatMinor(safe, currency);
}

/**
 * Basis points -> a percentage string. 260 -> "2.6%".
 *
 * Exists so no UI ever hardcodes a percentage: the server sends the bps it actually
 * charges and the client renders whatever it is told (§8.2).
 */
export function formatBps(bps: number): string {
  const pct = bps / 100;
  // Drop a trailing ".0" so 200 bps reads "2%" rather than "2.0%".
  return `${Number.isInteger(pct) ? pct.toString() : pct.toFixed(1)}%`;
}

/** The bare symbol, for places that lay out the amount themselves (inputs, prefixes). */
export function currencySymbol(currency: string = DEFAULT_CURRENCY): string {
  return symbolFor(currency);
}

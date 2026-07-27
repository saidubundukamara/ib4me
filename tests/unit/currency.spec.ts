import { describe, it, expect } from "vitest";
import {
  formatMinor,
  formatMajor,
  formatBps,
  formatCompactMinor,
  toMinor,
  toMajor,
} from "@/lib/currency";

describe("formatMinor", () => {
  it("always renders two decimal places", () => {
    // The old formatters used `minimumFractionDigits: 0`, so the same payout showed as
    // "SLE 500" in admin and "SLE 500.00" on the owner dashboard (§8.9).
    expect(formatMinor(50000)).toBe("Le 500.00");
    expect(formatMinor(10360)).toBe("Le 103.60");
    expect(formatMinor(0)).toBe("Le 0.00");
  });

  it("does not round sub-Leone amounts away", () => {
    // A Le3.60 fee used to display as "Le 4", and anything under half a Leone as zero.
    expect(formatMinor(360)).toBe("Le 3.60");
    expect(formatMinor(9643)).toBe("Le 96.43");
    expect(formatMinor(1)).toBe("Le 0.01");
  });

  it("groups thousands", () => {
    expect(formatMinor(123456789)).toBe("Le 1,234,567.89");
  });

  it("handles negatives and non-finite input without emitting NaN", () => {
    expect(formatMinor(-9643)).toBe("-Le 96.43");
    expect(formatMinor(NaN)).toBe("Le 0.00");
    expect(formatMinor(Infinity)).toBe("Le 0.00");
  });

  it("spaces alphabetic symbols but binds glyphs to the number", () => {
    expect(formatMinor(9643, "USD")).toBe("$96.43");
    expect(formatMinor(9643, "SLL")).toBe("Le 96.43");
    expect(formatMinor(9643, "XOF")).toBe("XOF 96.43"); // unknown code falls back
  });
});

describe("formatMajor", () => {
  it("agrees with formatMinor for the same amount", () => {
    expect(formatMajor(96.43)).toBe(formatMinor(9643));
    expect(formatMajor(500)).toBe("Le 500.00");
  });
});

describe("toMinor / toMajor", () => {
  it("survives the float representation of decimal input", () => {
    // 96.43 * 100 is 9642.999999999999 in IEEE754 — truncating would lose a cent.
    expect(toMinor(96.43)).toBe(9643);
    expect(toMinor(0.1 + 0.2)).toBe(30);
    expect(toMajor(9643)).toBeCloseTo(96.43, 10);
  });
});

describe("formatBps", () => {
  it("renders rates without trailing zeros", () => {
    expect(formatBps(260)).toBe("2.6%");
    expect(formatBps(200)).toBe("2%");
    expect(formatBps(100)).toBe("1%");
    expect(formatBps(0)).toBe("0%");
  });
});

describe("formatCompactMinor", () => {
  it("stays exact below the compaction threshold", () => {
    expect(formatCompactMinor(9643)).toBe("Le 96.43");
  });

  it("compacts large figures for tiles", () => {
    // One decimal below 10, none above, so the label width stays stable.
    expect(formatCompactMinor(120000000)).toBe("Le 1.2M");
    expect(formatCompactMinor(1500000)).toBe("Le 15K");
    expect(formatCompactMinor(1200000)).toBe("Le 12K");
  });
});

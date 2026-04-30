import { describe, it, expect } from "vitest";
import { invoiceCounterKey, purchaseCodeFromParts } from "./invoice-key";

describe("invoice-key", () => {
  it("invoiceCounterKey formats yyyy-MM", () => {
    const d = new Date(2026, 3, 15, 12, 0, 0);
    expect(invoiceCounterKey(d)).toBe("invoice-2026-04");
  });

  it("purchaseCodeFromParts builds PO code", () => {
    expect(purchaseCodeFromParts(2026, 4, 7)).toBe("PO/2026/04/0007");
  });
});

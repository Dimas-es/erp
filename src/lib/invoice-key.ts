import { format } from "date-fns";

/** Counter document _id for a given month (invoice numbering). */
export function invoiceCounterKey(date: Date): string {
  return `invoice-${format(date, "yyyy-MM")}`;
}

export function purchaseCodeFromParts(year: number, month: number, seq: number): string {
  return `PO/${year}/${String(month).padStart(2, "0")}/${String(seq).padStart(4, "0")}`;
}

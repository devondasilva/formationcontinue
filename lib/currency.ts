import { Currency, ExchangeRates } from "./types";

export function fromFCFA(amountFCFA: number, currency: Currency, rates: ExchangeRates): number {
  if (currency === "FCFA") return amountFCFA;
  const rate = rates.fcfaPerUnit[currency];
  return amountFCFA / rate;
}

export function toFCFA(amount: number, currency: Currency, rates: ExchangeRates): number {
  if (currency === "FCFA") return amount;
  const rate = rates.fcfaPerUnit[currency];
  return amount * rate;
}

export function formatAmount(amount: number, currency: Currency): string {
  if (currency === "FCFA") {
    return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
  }
  const symbol = currency === "EUR" ? "€" : "$";
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}

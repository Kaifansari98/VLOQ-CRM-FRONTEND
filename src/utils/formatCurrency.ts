export const formatCurrencyINR = (amount: number | string): string => {
  if (amount === null || amount === undefined) return "₹0";

  const num = Number(amount);
  if (isNaN(num)) return "₹0";

  // Convert to Indian number system (e.g., 2000000 → 20,00,000)
  return "₹" + num.toLocaleString("en-IN");
};

export const formatCurrencyInputINR = (
  amount: number | string,
  withSymbol: boolean = true
): string => {
  if (amount === null || amount === undefined || amount === "") return withSymbol ? "₹ 0" : "";

  const num = Number(amount);
  if (isNaN(num)) return withSymbol ? "₹ 0" : "";

  const formatted = num.toLocaleString("en-IN");
  return withSymbol ? `₹ ${formatted}` : formatted;
};
export const formatAmount = (amount: number | string): string => {
    if (!amount) return "0";
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(Number(amount));
};
  
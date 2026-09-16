export const today = () => new Date().toISOString().split("T")[0];

export const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86400000).toISOString().split("T")[0];

export const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtNumber = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

export const fmtMoney = (n: number | string | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export const rejectionTone = (rate: number) => {
  if (rate >= 10) return "red";
  if (rate >= 5) return "amber";
  return "green";
};

export const delayTone = (days: number | null) => {
  if (days === null) return "amber";
  if (days > 7) return "red";
  if (days > 0) return "amber";
  return "green";
};

export const toneClass = {
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/25",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-900",
    bar: "bg-emerald-500",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/25",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-900",
    bar: "bg-amber-500",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/25",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-900",
    bar: "bg-red-500",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/25",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-900",
    bar: "bg-blue-500",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/25",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-900",
    bar: "bg-indigo-500",
  },
  slate: {
    bg: "bg-slate-50 dark:bg-slate-950/25",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-900",
    bar: "bg-slate-500",
  },
} as const;
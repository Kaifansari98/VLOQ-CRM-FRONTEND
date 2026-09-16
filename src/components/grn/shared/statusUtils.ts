import { GRNStatus } from "@/api/grn/grn";

export const fmtDate = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const fmtMoney = (n: number | string | null | undefined) => {
  const value = Number(n || 0);
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

export const fmtN = (n: number | string | null | undefined) =>
  Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

export const today = () => new Date().toISOString().split("T")[0];

export const STATUS_META: Record<
  GRNStatus,
  {
    label: string;
    className: string;
    dotClassName: string;
  }
> = {
  Draft: {
    label: "Draft",
    className:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300",
    dotClassName: "bg-slate-400",
  },
  Confirmed: {
    label: "Confirmed",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
  },
  Closed: {
    label: "Closed",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
    dotClassName: "bg-blue-500",
  },
};

export const ITEM_STATUS_META: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  Accepted: {
    label: "Accepted",
    className: "text-emerald-600",
  },
  PartiallyAccepted: {
    label: "Partially Accepted",
    className: "text-amber-600",
  },
  Rejected: {
    label: "Rejected",
    className: "text-red-600",
  },
};

export const inputBase =
  "h-9 w-full rounded-xl border bg-background px-3 text-xs outline-none transition-all placeholder:text-muted-foreground/60 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";

export const inputError =
  "h-9 w-full rounded-xl border border-red-300 bg-red-50 px-3 text-xs outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/10 dark:bg-red-950/20";

export const getItemQualityStatus = (
  acceptedQty: number,
  rejectedQty: number
) => {
  if (rejectedQty <= 0) return "Accepted";
  if (acceptedQty <= 0) return "Rejected";
  return "PartiallyAccepted";
};
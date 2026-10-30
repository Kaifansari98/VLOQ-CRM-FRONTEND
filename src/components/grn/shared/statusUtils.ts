import { GRNStatus } from "@/api/grn/grn";

export const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

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
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    dotClassName: "bg-slate-400",
  },
  Confirmed: {
    label: "Confirmed",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50",
    dotClassName: "bg-emerald-500",
  },
  Closed: {
    label: "Closed",
    className:
      "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50",
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
  "h-9 w-full rounded-lg border bg-background px-3 text-xs outline-none transition-colors hover:bg-muted/20 focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground/60";

export const inputError =
  "h-9 w-full rounded-lg border border-red-300 bg-red-50/50 px-3 text-xs outline-none transition-colors focus:border-red-400 focus:ring-1 focus:ring-red-500/30 dark:bg-red-950/20 placeholder:text-muted-foreground/60";

export const getItemQualityStatus = (
  acceptedQty: number,
  rejectedQty: number
) => {
  if (rejectedQty <= 0) return "Accepted";
  if (acceptedQty <= 0) return "Rejected";
  return "PartiallyAccepted";
};
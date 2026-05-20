import { POStatus } from "@/api/purchaseOrder/purchaseOrder";
import {
  Pencil,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingCart,
  PackageCheck,
} from "lucide-react";

export const toNum = (v: any) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const fmtMoney = (v: any) => {
  const n = toNum(v);

  return n > 0
    ? `₹${n.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";
};

export const fmtQty = (v: any) => {
  const n = toNum(v);

  return n > 0
    ? n.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })
    : "—";
};

export const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const STATUS_CFG: Record<
  POStatus,
  {
    label: string;
    color: string;
    soft: string;
    icon: any;
    next: POStatus[];
  }
> = {
  Draft: {
    label: "Draft",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    soft: "bg-slate-50 text-slate-700",
    icon: Pencil,
    next: ["Approved", "Cancelled"],
  },
  Approved: {
    label: "Approved",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    soft: "bg-indigo-50 text-indigo-700",
    icon: CheckCircle2,
    next: ["Cancelled"],
  },
  PartiallyReceived: {
    label: "Partially Received",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    soft: "bg-amber-50 text-amber-700",
    icon: Clock,
    next: ["Cancelled"],
  },
  Received: {
    label: "Received",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    soft: "bg-emerald-50 text-emerald-700",
    icon: PackageCheck,
    next: [],
  },
  Cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
    soft: "bg-red-50 text-red-700",
    icon: XCircle,
    next: [],
  },
};

export const getReceivedStats = (po: any) => {
  const orderedQty = (po.items ?? []).reduce(
    (s: number, i: any) => s + toNum(i.ordered_qty),
    0
  );

  const confirmedGrnItems = (po.grns ?? [])
    .filter((g: any) => g.status === "Confirmed")
    .flatMap((g: any) => g.items ?? []);

  const acceptedQty = confirmedGrnItems.reduce(
    (s: number, i: any) => s + toNum(i.accepted_qty),
    0
  );

  const rejectedQty = confirmedGrnItems.reduce(
    (s: number, i: any) => s + toNum(i.rejected_qty),
    0
  );

  const receivedQty = confirmedGrnItems.reduce(
    (s: number, i: any) => s + toNum(i.received_qty),
    0
  );

  const pendingQty = Math.max(0, orderedQty - acceptedQty);
  const receivedPct =
    orderedQty > 0 ? Math.min(100, Math.round((acceptedQty / orderedQty) * 100)) : 0;

  return {
    orderedQty,
    receivedQty,
    acceptedQty,
    rejectedQty,
    pendingQty,
    receivedPct,
  };
};

export const getPOFinancials = (po: any) => {
  const itemBase = (po.items ?? []).reduce(
    (s: number, i: any) => s + toNum(i.amount),
    0
  );

  const itemTax = (po.items ?? []).reduce(
    (s: number, i: any) => s + toNum(i.tax_amount),
    0
  );

  const itemTotal = (po.items ?? []).reduce(
    (s: number, i: any) => s + toNum(i.total_amount),
    0
  );

  return {
    amount: toNum(po.amount) || itemBase,
    taxAmount: toNum(po.tax_amount) || itemTax,
    totalAmount: toNum(po.total_amount) || itemTotal,
  };
};

export function StatusBadge({ status }: { status: POStatus }) {
  const cfg = STATUS_CFG[status];
  const Icon = cfg?.icon ?? ShoppingCart;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${cfg?.color}`}
    >
      <Icon size={12} />
      {cfg?.label ?? status}
    </span>
  );
}
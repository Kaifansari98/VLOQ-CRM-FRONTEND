"use client";

import {
  listPurchaseIntents,
  getPurchaseIntentById,
  updatePIStatus,
  deletePurchaseIntent,
  PIStatus,
  PIPriority,
  PISummary,
  PIListResponse,
} from "@/api/inventory/purchaseIntent";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/store";
import {
  Search,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingCart,
  AlertTriangle,
  Filter,
  RefreshCw,
  Loader2,
  Building2,
  Package,
  Calendar,
  User,
  MessageSquare,
  ArrowRight,
  IndianRupee,
  Layers3,
  FileText,
  ReceiptText,
  BadgeIndianRupee,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import ConvertToPOModal from "@/components/purchase-order/ConvertToPOModal";
import { useRouter } from "next/navigation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

type StatusUi = {
  label: string;
  color: string;
  soft: string;
  icon: React.ElementType;
};

const STATUS_CFG: Record<string, StatusUi> = {
  Draft: {
    label: "Draft",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    soft: "bg-slate-50 text-slate-700",
    icon: Pencil,
  },
  PendingApproval: {
    label: "Pending Approval",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    soft: "bg-amber-50 text-amber-700",
    icon: Clock,
  },
  Approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    soft: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  Rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    soft: "bg-red-50 text-red-700",
    icon: XCircle,
  },
  ConvertedToPO: {
    label: "Converted to PO",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    soft: "bg-blue-50 text-blue-700",
    icon: ShoppingCart,
  },
  Cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    soft: "bg-gray-50 text-gray-600",
    icon: X,
  },
};

const PRIORITY_CFG: Record<PIPriority, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-amber-100 text-amber-700",
  Urgent: "bg-red-100 text-red-700",
};

const ALL_STATUSES = Object.keys(STATUS_CFG) as PIStatus[];

const n = (v: any) => {
  const num = Number(v ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const fmtMoney = (v: any) => {
  const num = n(v);

  return num > 0
    ? `₹${num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";
};

const fmt = (iso: string | null | undefined) => {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtDt = (iso: string | null | undefined) => {
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

const getStatusCfg = (status: any): StatusUi => {
  return (
    STATUS_CFG[String(status)] ?? {
      label: String(status ?? "Unknown"),
      color: "bg-muted text-muted-foreground border-border",
      soft: "bg-muted text-muted-foreground",
      icon: Clock,
    }
  );
};

const getVendorMappings = (intent: any) => {
  return (intent?.items ?? []).flatMap((item: any) => item?.vendorMappings ?? []);
};

const getFinancials = (intent: any) => {
  const mappings = getVendorMappings(intent);

  const baseAmount = mappings.reduce((sum: number, vm: any) => sum + n(vm.amount), 0);
  const taxAmount = mappings.reduce((sum: number, vm: any) => sum + n(vm.tax_amount), 0);
  const grandTotal = mappings.reduce((sum: number, vm: any) => sum + n(vm.total_amount), 0);

  return {
    baseAmount,
    taxAmount,
    grandTotal,
    supplierCount: mappings.length,
    productCount: intent?.items?.length ?? intent?._count?.items ?? 0,
  };
};

const getListAmount = (intent: any) => {
  const direct =
    n(intent?.grand_total) ||
    n(intent?.grandTotal) ||
    n(intent?.total_amount) ||
    n(intent?.totalAmount) ||
    n(intent?.amount);

  if (direct > 0) return direct;

  return getFinancials(intent).grandTotal;
};

function StatusBadge({ status }: { status: PIStatus }) {
  const cfg = getStatusCfg(status);
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        cfg.color
      )}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function ApprovalModal({
  action,
  intentNo,
  onConfirm,
  onClose,
  loading,
}: {
  action: "Approved" | "Rejected";
  intentNo: string;
  onConfirm: (remarks: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [remarks, setRemarks] = useState("");
  const isReject = action === "Rejected";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col gap-5 rounded-3xl border bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "rounded-2xl p-3",
              isReject ? "bg-red-100" : "bg-emerald-100"
            )}
          >
            {isReject ? (
              <XCircle size={22} className="text-red-600" />
            ) : (
              <CheckCircle2 size={22} className="text-emerald-600" />
            )}
          </div>

          <div>
            <h3 className="text-base font-black">
              {isReject ? "Reject" : "Approve"} Purchase Intent
            </h3>
            <p className="text-xs text-muted-foreground">{intentNo}</p>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
            {isReject ? "Reason for Rejection *" : "Remarks"}
          </label>

          <textarea
            autoFocus
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={isReject ? "Provide a reason..." : "Add optional remarks..."}
            rows={4}
            className="mt-1 w-full resize-none rounded-2xl border bg-muted/30 px-3 py-2 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button
            size="sm"
            disabled={loading || (isReject && !remarks.trim())}
            onClick={() => onConfirm(remarks)}
            className={cn(
              "gap-1.5",
              isReject
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isReject ? (
              <XCircle size={13} />
            ) : (
              <CheckCircle2 size={13} />
            )}
            {loading ? "Saving..." : isReject ? "Reject" : "Approve"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-muted/30 p-4", className)}>
      <Icon size={17} className="mb-3 text-indigo-500" />
      <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-base font-black">{value}</div>
    </div>
  );
}

function IntentDetailPanel({
  vendorId,
  intentId,
  onClose,
  onStatusChange,
  onConvert,
}: {
  vendorId: number;
  intentId: number;
  onClose: () => void;
  onStatusChange: (id: number, status: PIStatus) => void;
  onConvert: (intent: PISummary) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approval, setApproval] = useState<{ action: "Approved" | "Rejected" } | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);

    getPurchaseIntentById(vendorId, intentId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [vendorId, intentId]);

  const financials = useMemo(() => getFinancials(data), [data]);

  const handleStatusAction = async (status: PIStatus, remarks: string) => {
    setActionLoading(true);

    try {
      await updatePIStatus(vendorId, intentId, status, remarks || undefined);

      toastManager.add({
        title: `Intent ${getStatusCfg(status).label}`,
        type: "success",
      });

      onStatusChange(intentId, status);
      setData((prev: any) => ({ ...prev, status }));
      setApproval(null);
    } catch {
      toastManager.add({
        title: "Failed to update status",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-5xl flex-col bg-zinc-50 shadow-2xl dark:bg-zinc-950">
        <div className="shrink-0 border-b bg-background px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                <ReceiptText size={20} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-black">
                    {data?.intent_no ?? "Loading..."}
                  </p>
                  {data && <StatusBadge status={data.status} />}
                </div>

                {data && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {data.category?.category_name ?? "—"} • Created {fmt(data.created_at)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {data?.status === "Draft" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 rounded-xl text-xs"
                    onClick={() =>
                      router.push(`/dashboard/inventory/purchase-intents/${intentId}/edit`)
                    }
                  >
                    <Pencil size={13} />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    className="h-9 gap-1.5 rounded-xl bg-indigo-600 text-xs hover:bg-indigo-700"
                    onClick={() => {
                      onClose();
                      onConvert(data as unknown as PISummary);
                    }}
                  >
                    <ShoppingCart size={13} />
                    Convert PO
                  </Button>
                </>
              )}

              {data?.status === "PendingApproval" && (
                <>
                  <Button
                    size="sm"
                    className="h-9 gap-1.5 rounded-xl bg-emerald-600 text-xs hover:bg-emerald-700"
                    onClick={() => setApproval({ action: "Approved" })}
                  >
                    <CheckCircle2 size={13} />
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 rounded-xl border-red-200 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => setApproval({ action: "Rejected" })}
                  >
                    <XCircle size={13} />
                    Reject
                  </Button>
                </>
              )}

              {data?.status === "Rejected" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 rounded-xl text-xs"
                  onClick={() => handleStatusAction("Draft" as PIStatus, "Re-opened for revision")}
                >
                  <RefreshCw size={13} />
                  Re-open
                </Button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={19} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5">
              <Skeleton className="mb-5 h-40 rounded-[28px]" />
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-3xl" />
                  ))}
                </div>
                <Skeleton className="h-96 rounded-[28px]" />
              </div>
            </div>
          ) : !data ? (
            <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
              Failed to load intent details.
            </div>
          ) : (
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_340px]">
              <section className="space-y-5">
                <div className="overflow-hidden rounded-[28px] border bg-background shadow-sm">
                  <div className="relative p-5">
                    <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-indigo-500/10" />

                    <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                          <Sparkles size={13} className="text-indigo-500" />
                          Purchase Intent Workspace
                        </div>

                        <h2 className="text-2xl font-black tracking-tight">
                          {data.intent_no}
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {data.category?.category_name ?? "—"} •{" "}
                          {financials.productCount} products •{" "}
                          {financials.supplierCount} supplier quotations
                        </p>
                      </div>

                      <div className="rounded-3xl border bg-indigo-50/70 p-4 text-right dark:bg-indigo-950/30">
                        <p className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">
                          Grand Total
                        </p>
                        <p className="mt-1 text-2xl font-black text-indigo-700 dark:text-indigo-300">
                          {fmtMoney(financials.grandTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <SummaryCard
                        icon={Package}
                        label="Products"
                        value={financials.productCount}
                      />
                      <SummaryCard
                        icon={Building2}
                        label="Suppliers"
                        value={financials.supplierCount}
                      />
                      <SummaryCard icon={AlertTriangle} label="Priority" value={data.priority} />
                      <SummaryCard
                        icon={User}
                        label="Created By"
                        value={data.createdBy?.user_name ?? "—"}
                      />
                    </div>
                  </div>
                </div>

                {data.rejection_reason && (
                  <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">
                    <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase">
                      <XCircle size={14} />
                      Rejection Reason
                    </p>
                    <p className="text-sm">{data.rejection_reason}</p>
                  </div>
                )}

                {data.remarks && (
                  <div className="rounded-3xl border bg-background p-4 shadow-sm">
                    <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                      <MessageSquare size={14} />
                      Overall Remarks
                    </p>
                    <p className="text-sm">{data.remarks}</p>
                  </div>
                )}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black">Products & Supplier Quotations</p>
                      <p className="text-xs text-muted-foreground">
                        Full pricing, tax and delivery details.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(data.items ?? []).map((item: any) => {
                      const mappings = item.vendorMappings ?? [];

                      const itemBase = mappings.reduce(
                        (sum: number, vm: any) => sum + n(vm.amount),
                        0
                      );
                      const itemTax = mappings.reduce(
                        (sum: number, vm: any) => sum + n(vm.tax_amount),
                        0
                      );
                      const itemTotal = mappings.reduce(
                        (sum: number, vm: any) => sum + n(vm.total_amount),
                        0
                      );

                      return (
                        <div
                          key={item.id}
                          className="overflow-hidden rounded-[28px] border bg-background shadow-sm"
                        >
                          <div className="border-b bg-muted/20 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="flex min-w-0 gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                                  <Package size={19} />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black">
                                    {item.product?.product_name ?? "—"}
                                  </p>

                                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                    {item.product?.article_code && (
                                      <span>{item.product.article_code}</span>
                                    )}
                                    {item.uom && (
                                      <span className="rounded-full bg-muted px-2 py-0.5">
                                        UOM: {item.uom}
                                      </span>
                                    )}
                                    {item.product?.hsn_code && (
                                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                                        HSN {item.product.hsn_code}
                                      </span>
                                    )}
                                  </div>

                                  {item.remarks && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      {item.remarks}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-right">
                                <div className="rounded-2xl bg-muted/40 px-3 py-2">
                                  <p className="text-[9px] font-black uppercase text-muted-foreground">
                                    Base
                                  </p>
                                  <p className="text-xs font-bold">{fmtMoney(itemBase)}</p>
                                </div>

                                <div className="rounded-2xl bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-950/30">
                                  <p className="text-[9px] font-black uppercase">
                                    Tax
                                  </p>
                                  <p className="text-xs font-bold">{fmtMoney(itemTax)}</p>
                                </div>

                                <div className="rounded-2xl bg-indigo-50 px-3 py-2 text-indigo-700 dark:bg-indigo-950/30">
                                  <p className="text-[9px] font-black uppercase">
                                    Total
                                  </p>
                                  <p className="text-xs font-black">
                                    {fmtMoney(itemTotal)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {mappings.length > 0 ? (
                            <div className="grid gap-3 p-4">
                              {mappings.map((vm: any) => (
                                <div
                                  key={vm.id}
                                  className="rounded-3xl border bg-muted/20 p-4"
                                >
                                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="flex gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-indigo-600">
                                        <Building2 size={17} />
                                      </div>

                                      <div>
                                        <p className="text-sm font-black">
                                          {vm.companyVendor?.company_name ?? "—"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {vm.companyVendor?.vendor_code ?? "—"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {console.log(vm.paymentTerm)}
                                          {vm.paymentTerm?.term_name ?? "—"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="rounded-2xl bg-indigo-50 px-4 py-2 text-right text-indigo-700 dark:bg-indigo-950/30">
                                      <p className="text-[9px] font-black uppercase">
                                        Supplier Total
                                      </p>
                                      <p className="text-base font-black">
                                        {fmtMoney(vm.total_amount)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                    <InfoBox label="Qty" value={vm.required_qty ?? "—"} />
                                    <InfoBox
                                      label="Required By"
                                      value={fmt(vm.required_by_date)}
                                    />
                                    <InfoBox label="MRP" value={fmtMoney(vm.mrp)} />
                                    <InfoBox
                                      label="Discount"
                                      value={
                                        vm.discount_pct ? `${n(vm.discount_pct)}%` : "—"
                                      }
                                    />
                                    <InfoBox label="Rate" value={fmtMoney(vm.rate)} />
                                    <InfoBox label="Base Amount" value={fmtMoney(vm.amount)} />
                                    <InfoBox label="Tax Amount" value={fmtMoney(vm.tax_amount)} />
                                    <InfoBox
                                      label="GST Split"
                                      value={`GST ${n(vm.tax_pct)}% • CGST ${n(
                                        vm.cgst_pct
                                      )}% • SGST ${n(vm.sgst_pct)}% • IGST ${n(
                                        vm.igst_pct
                                      )}%`}
                                    />
                                  </div>

                                  {vm.remarks && (
                                    <div className="mt-3 rounded-2xl bg-background p-3">
                                      <p className="mb-1 text-[9px] font-black uppercase text-muted-foreground">
                                        Supplier Remarks
                                      </p>
                                      <p className="text-xs">{vm.remarks}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="p-4 text-sm text-muted-foreground">
                              No suppliers assigned.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {data.statusLogs?.length > 0 && (
                  <div className="rounded-[28px] border bg-background p-5 shadow-sm">
                    <p className="mb-4 text-sm font-black">Status Timeline</p>

                    <div className="space-y-4">
                      {data.statusLogs.map((log: any) => {
                        const cfg = getStatusCfg(log.to_status);
                        const Icon = cfg.icon;

                        return (
                          <div key={log.id} className="flex gap-3">
                            <div
                              className={cn(
                                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                                cfg.color
                              )}
                            >
                              <Icon size={13} />
                            </div>

                            <div className="min-w-0 flex-1 border-b pb-4 last:border-b-0 last:pb-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold">{cfg.label}</span>

                                {log.from_status && (
                                  <span className="text-xs text-muted-foreground">
                                    from {getStatusCfg(log.from_status).label}
                                  </span>
                                )}

                                <span className="ml-auto text-xs text-muted-foreground">
                                  {fmtDt(log.created_at)}
                                </span>
                              </div>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                by {log.changedBy?.user_name ?? "—"}
                              </p>

                              {log.remarks && (
                                <p className="mt-2 rounded-2xl bg-muted/40 p-3 text-xs italic text-muted-foreground">
                                  “{log.remarks}”
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              <aside className="lg:sticky lg:top-5 lg:h-fit">
                <div className="overflow-hidden rounded-[28px] border bg-background shadow-sm">
                  <div className="border-b p-5">
                    <p className="text-base font-black">Financial Summary</p>
                    <p className="text-xs text-muted-foreground">
                      Amount calculated from supplier quotations.
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package size={15} />
                        Products
                      </span>
                      <span className="font-bold">{financials.productCount}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 size={15} />
                        Suppliers
                      </span>
                      <span className="font-bold">{financials.supplierCount}</span>
                    </div>

                    <div className="rounded-2xl bg-muted/40 p-3">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">
                        Base Amount
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {fmtMoney(financials.baseAmount)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-950/30">
                      <p className="text-[10px] font-black uppercase">Tax Amount</p>
                      <p className="mt-1 text-lg font-black">
                        {fmtMoney(financials.taxAmount)}
                      </p>
                    </div>

                    <div className="rounded-3xl border bg-indigo-50/70 p-4 text-indigo-700 dark:bg-indigo-950/30">
                      <p className="text-[10px] font-black uppercase">Grand Total</p>
                      <p className="mt-1 text-2xl font-black">
                        {fmtMoney(financials.grandTotal)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-muted/40 p-3">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">
                        Created At
                      </p>
                      <p className="mt-1 text-sm font-semibold">{fmtDt(data.created_at)}</p>
                    </div>

                    {data.approved_at && (
                      <div className="rounded-2xl bg-muted/40 p-3">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">
                          Approved At
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {fmtDt(data.approved_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      {approval && data && (
        <ApprovalModal
          action={approval.action}
          intentNo={data.intent_no}
          onConfirm={(remarks) => handleStatusAction(approval.action as PIStatus, remarks)}
          onClose={() => setApproval(null)}
          loading={actionLoading}
        />
      )}
    </>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-background p-3">
      <p className="text-[9px] font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-xs font-bold">{value}</p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (page >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  })();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{start}–{end}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> intents
      </p>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 rounded-xl p-0"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </Button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`d${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              size="sm"
              variant={p === page ? "default" : "outline"}
              className="h-8 w-8 rounded-xl p-0 text-xs"
              onClick={() => onChange(p as number)}
            >
              {p}
            </Button>
          )
        )}

        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 rounded-xl p-0"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

export default function PurchaseIntentListPage() {
  const vendorId = Number(useAppSelector((state) => state.auth.user?.vendor_id));
  const router = useRouter();

  const [data, setData] = useState<PIListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PIStatus | "">("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PISummary | null>(null);
  const [convertTarget, setConvertTarget] = useState<PISummary | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(() => {
    if (!vendorId) return;

    setLoading(true);

    listPurchaseIntents(vendorId, {
      page,
      search: search || undefined,
      status: statusFilter || undefined,
    })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [vendorId, page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleStatus = (v: PIStatus | "") => {
    setStatusFilter(v);
    setPage(1);
  };

  const handleStatusChange = (id: number, status: PIStatus) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            intents: prev.intents.map((i) => (i.id === id ? { ...i, status } : i)),
          }
        : prev
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);

    try {
      await deletePurchaseIntent(vendorId, deleteTarget.id);

      toastManager.add({
        title: "Purchase Intent deleted",
        type: "success",
      });

      setDeleteTarget(null);
      fetchData();
    } catch {
      toastManager.add({
        title: "Failed to delete",
        type: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const totals = useMemo(() => {
    const intents = data?.intents ?? [];

    return {
      count: data?.total ?? 0,
      draft: intents.filter((i: any) => i.status === "Draft").length,
      converted: intents.filter((i: any) => i.status === "ConvertedToPO").length,
      amount: intents.reduce((sum: number, intent: any) => sum + getListAmount(intent), 0),
    };
  }, [data]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>Purchase Intents</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            onClick={() => router.push("/dashboard/inventory/purchase-intents/new")}
          >
            <Plus size={14} />
            Raise Intent
          </Button>

          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 p-4 dark:bg-zinc-950 md:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <div className="overflow-hidden rounded-[28px] border bg-background shadow-sm">
            <div className="relative p-5 md:p-6">
              <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-indigo-500/10" />

              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                    <ShoppingCart size={22} />
                  </div>

                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                      <Sparkles size={13} className="text-indigo-500" />
                      Procurement Workspace
                    </div>

                    <h1 className="text-2xl font-black tracking-tight">
                      Purchase Intents
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Review purchase requirements, supplier quotations and conversion status.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchData}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard icon={ClipboardList} label="Total Intents" value={totals.count} />
                <SummaryCard icon={Pencil} label="Drafts on Page" value={totals.draft} />
                <SummaryCard
                  icon={ShoppingCart}
                  label="Converted on Page"
                  value={totals.converted}
                />
                <SummaryCard
                  icon={IndianRupee}
                  label="Amount on Page"
                  value={
                    <span className="text-indigo-600">
                      {totals.amount > 0 ? fmtMoney(totals.amount) : "—"}
                    </span>
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border bg-background p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {([["", "All"], ...ALL_STATUSES.map((s) => [s, getStatusCfg(s).label])] as [
                  string,
                  string,
                ][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleStatus(val as PIStatus | "")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
                      statusFilter === val
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-border bg-background text-muted-foreground hover:border-indigo-300 hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-80">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />

                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search intent no..."
                  className="h-10 w-full rounded-xl border bg-muted/30 pl-9 pr-9 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-indigo-300"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border bg-background shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                      Intent
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                      Category
                    </th>
                    <th className="px-5 py-4 text-right text-[10px] font-black uppercase text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                      Items
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                      Priority
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-black uppercase text-muted-foreground">
                      Created
                    </th>
                    <th className="px-5 py-4 text-right text-[10px] font-black uppercase text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <Skeleton className="h-8 w-full rounded-xl" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : !data || data.intents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
                            <ShoppingCart size={30} className="opacity-40" />
                          </div>

                          <p className="text-sm font-semibold">No purchase intents found</p>

                          {(search || statusFilter) && (
                            <p className="text-xs">Try clearing filters.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.intents.map((intent: any) => {
                      const amount = getListAmount(intent);

                      return (
                        <tr
                          key={intent.id}
                          className="group cursor-pointer border-b transition-colors hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                          onClick={() => setSelectedId(intent.id)}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-1 rounded-full bg-indigo-500 opacity-30 transition-opacity group-hover:opacity-100" />

                              <div>
                                <p className="font-mono text-sm font-black text-indigo-600">
                                  {intent.intent_no}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  by {intent.createdBy?.user_name ?? "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold">
                              {intent.category?.category_name ?? "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <p className="text-base font-black text-indigo-600">
                              {fmtMoney(amount)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Grand total
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-2">
                              <Package size={14} className="text-indigo-500" />
                              <div>
                                <p className="text-xs font-black">
                                  {intent._count?.items ?? intent.items?.length ?? 0} Products
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {getFinancials(intent).supplierCount || "—"} Suppliers
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={intent.status} />
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-bold",
                                PRIORITY_CFG[intent.priority as PIPriority]
                              )}
                            >
                              {intent.priority}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold">{fmt(intent.created_at)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {fmtDt(intent.created_at)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                title="View details"
                                onClick={() => setSelectedId(intent.id)}
                                className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-indigo-600"
                              >
                                <Eye size={15} />
                              </button>

                              {intent.status === "Draft" && (
                                <button
                                  title="Edit"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/inventory/purchase-intents/${intent.id}/edit`
                                    )
                                  }
                                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-amber-600"
                                >
                                  <Pencil size={15} />
                                </button>
                              )}

                              {intent.status === "Draft" && (
                                <button
                                  title="Convert to Purchase Order"
                                  onClick={() => {
                                    setSelectedId(null);
                                    setConvertTarget(intent);
                                  }}
                                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-indigo-600"
                                >
                                  <ShoppingCart size={15} />
                                </button>
                              )}

                              {["Draft", "Cancelled", "Rejected"].includes(intent.status) && (
                                <button
                                  title="Delete"
                                  onClick={() => setDeleteTarget(intent)}
                                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}

                              <button
                                title="Open"
                                onClick={() => setSelectedId(intent.id)}
                                className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                <ArrowRight size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {data && data.total_pages > 0 && (
              <Pagination
                page={page}
                totalPages={data.total_pages}
                total={data.total}
                pageSize={data.page_size}
                onChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
          </div>
        </div>
      </main>

      {selectedId && (
        <IntentDetailPanel
          vendorId={vendorId}
          intentId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChange={handleStatusChange}
          onConvert={(intent) => {
            setSelectedId(null);
            setConvertTarget(intent);
          }}
        />
      )}

      {convertTarget && (
        <ConvertToPOModal
          piId={convertTarget.id}
          intentNo={convertTarget.intent_no}
          onClose={() => setConvertTarget(null)}
          onSuccess={(pos) => {
            setConvertTarget(null);
            handleStatusChange(convertTarget.id, "ConvertedToPO" as PIStatus);

            toastManager.add({
              title: `${pos.length} PO${pos.length > 1 ? "s" : ""} created: ${pos
                .map((p) => p.po_no)
                .join(", ")}`,
              type: "success",
            });
          }}
        />
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="flex w-full max-w-sm flex-col gap-5 rounded-3xl border bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-red-100 p-3">
                <Trash2 size={20} className="text-red-600" />
              </div>

              <div>
                <h3 className="text-base font-black">Delete Intent</h3>
                <p className="text-xs text-muted-foreground">
                  {deleteTarget.intent_no}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This will permanently delete the purchase intent. This action cannot be
              undone.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="gap-1.5 bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
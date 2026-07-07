"use client";

import {
  getPurchaseIntentById,
  updatePIStatus,
  PIStatus,
  PISummary,
} from "@/api/inventory/purchaseIntent";
import ConvertToPOModal from "@/components/purchase-order/ConvertToPOModal";
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
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Pencil,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";

type StatusUi = {
  label: string;
  color: string;
  icon: React.ElementType;
};

const STATUS_CFG: Record<string, StatusUi> = {
  Draft: {
    label: "Draft",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Pencil,
  },
  PendingApproval: {
    label: "Pending Approval",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  Approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  Rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  ConvertedToPO: {
    label: "Converted to PO",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: ShoppingCart,
  },
  Cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: X,
  },
};

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
      icon: Clock,
    }
  );
};

const getVendorMappings = (intent: any) => {
  return (intent?.items ?? []).flatMap((item: any) => item?.vendorMappings ?? []);
};

const getFinancials = (intent: any) => {
  const mappings = getVendorMappings(intent);

  return {
    baseAmount: mappings.reduce((sum: number, vm: any) => sum + n(vm.amount), 0),
    taxAmount: mappings.reduce(
      (sum: number, vm: any) => sum + n(vm.tax_amount),
      0
    ),
    grandTotal: mappings.reduce(
      (sum: number, vm: any) => sum + n(vm.total_amount),
      0
    ),
    supplierCount: mappings.length,
    productCount: intent?.items?.length ?? 0,
  };
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
        className="flex w-full max-w-md flex-col gap-5 rounded-2xl border bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-base font-bold">
            {isReject ? "Reject" : "Approve"} Purchase Intent
          </h3>
          <p className="text-xs text-muted-foreground">{intentNo}</p>
        </div>

        <div>
          <label className="text-xs font-semibold">
            {isReject ? "Reason for Rejection *" : "Remarks"}
          </label>

          <textarea
            autoFocus
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={isReject ? "Provide a reason..." : "Add optional remarks..."}
            rows={4}
            className="mt-1 w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
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
              isReject
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {loading ? <Loader2 size={13} className="mr-1 animate-spin" /> : null}
            {isReject ? "Reject" : "Approve"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseIntentDetailPage() {
  const vendorId = Number(useAppSelector((state) => state.auth.user?.vendor_id));
  const { id } = useParams<{ id: string }>();
  const intentId = Number(id);
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approval, setApproval] = useState<{ action: "Approved" | "Rejected" } | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);
  

  const financials = useMemo(() => getFinancials(data), [data]);

  const load = () => {
    if (!vendorId || !intentId) return;

    setLoading(true);

    getPurchaseIntentById(vendorId, intentId)
      .then(setData)
      .catch(() => {
        toastManager.add({
          title: "Failed to load intent details",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [vendorId, intentId]);

  const handleStatusAction = async (status: PIStatus, remarks: string) => {
    setActionLoading(true);

    try {
      await updatePIStatus(vendorId, intentId, status, remarks || undefined);

      toastManager.add({
        title: `Intent ${getStatusCfg(status).label}`,
        type: "success",
      });

      setData((prev: any) => ({ ...prev, status }));
      setApproval(null);
      load();
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
                <BreadcrumbLink href="/dashboard/inventory/purchase-intents">
                  Purchase Intents
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator className="hidden md:block" />

              <BreadcrumbItem>
                <BreadcrumbPage>{data?.intent_no || "View Details"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 p-4 dark:bg-zinc-950 md:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/inventory/purchase-intents")}
                >
                  <ArrowLeft size={14} className="mr-1" />
                  Back
                </Button>

                {data && <StatusBadge status={data.status} />}
              </div>

              <h1 className="text-xl font-bold">
                {loading ? "Loading..." : data?.intent_no || "Purchase Intent"}
              </h1>

              {data && (
                <p className="text-sm text-muted-foreground">
                  Created {fmtDt(data.created_at)} by{" "}
                  {data.createdBy?.user_name ?? "—"}
                </p>
              )}
            </div>

            {data && (
              <div className="flex flex-wrap gap-2">
                {data.status === "Draft" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/dashboard/inventory/purchase-intents/${intentId}/edit`
                        )
                      }
                    >
                      <Pencil size={14} className="mr-1" />
                      Edit
                    </Button>

                   <Button
  type="button"
  onClick={() =>
    router.push(
      `/dashboard/inventory/purchase-intents/${intentId}/convert-to-po`
    )
  }
>
  <ShoppingCart size={14} className="mr-1" />
  Convert PO
</Button>
                  </>
                )}

                {data.status === "PendingApproval" && (
                  <>
                    <Button
                      type="button"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setApproval({ action: "Approved" })}
                    >
                      <CheckCircle2 size={14} className="mr-1" />
                      Approve
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => setApproval({ action: "Rejected" })}
                    >
                      <XCircle size={14} className="mr-1" />
                      Reject
                    </Button>
                  </>
                )}

                {data.status === "Rejected" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      handleStatusAction(
                        "Draft" as PIStatus,
                        "Re-opened for revision"
                      )
                    }
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Re-open
                  </Button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
            </div>
          ) : !data ? (
            <div className="rounded-2xl border bg-background p-10 text-center text-muted-foreground">
              Failed to load intent details.
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <SummaryBox label="Products" value={financials.productCount} />
                <SummaryBox label="Suppliers" value={financials.supplierCount} />
                <SummaryBox label="Base Amount" value={fmtMoney(financials.baseAmount)} />
                <SummaryBox label="Grand Total" value={fmtMoney(financials.grandTotal)} />
              </div>

              {data.rejection_reason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <p className="text-xs font-bold uppercase">Rejection Reason</p>
                  <p className="mt-1 text-sm">{data.rejection_reason}</p>
                </div>
              )}

              {data.remarks && (
                <div className="rounded-2xl border bg-background p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Overall Remarks
                  </p>
                  <p className="mt-1 text-sm">{data.remarks}</p>
                </div>
              )}

              <div className="rounded-2xl border bg-background shadow-sm">
                <div className="border-b px-4 py-3">
                  <p className="font-bold">Products & Supplier Quotations</p>
                  <p className="text-xs text-muted-foreground">
                    Tabular view of pricing, tax and supplier details.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1400px] text-xs">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-3 text-left">Product</th>
                        <th className="px-3 py-3 text-left">Code</th>
                        <th className="px-3 py-3 text-left">UOM</th>
                        <th className="px-3 py-3 text-left">Supplier</th>
                        <th className="px-3 py-3 text-left">Supplier Code</th>
                        <th className="px-3 py-3 text-left">Payment Term</th>
                        <th className="px-3 py-3 text-right">Qty</th>
                        <th className="px-3 py-3 text-left">Required By</th>
                        <th className="px-3 py-3 text-right">MRP</th>
                        <th className="px-3 py-3 text-right">Disc %</th>
                        <th className="px-3 py-3 text-right">Rate</th>
                        <th className="px-3 py-3 text-right">Base</th>
                        <th className="px-3 py-3 text-right">GST %</th>
                        <th className="px-3 py-3 text-right">Tax</th>
                        <th className="px-3 py-3 text-right">Total</th>
                        <th className="px-3 py-3 text-left">Remarks</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(data.items ?? []).flatMap((item: any) => {
                        const mappings = item.vendorMappings ?? [];

                        if (!mappings.length) {
                          return [
                            <tr key={`item-${item.id}`} className="border-t">
                              <td className="px-3 py-3 font-semibold">
                                {item.product?.product_name ?? "—"}
                              </td>
                              <td className="px-3 py-3">
                                {item.product?.article_code ?? "—"}
                              </td>
                              <td className="px-3 py-3">{item.uom ?? "—"}</td>
                              <td
                                className="px-3 py-3 text-muted-foreground"
                                colSpan={13}
                              >
                                No suppliers assigned.
                              </td>
                            </tr>,
                          ];
                        }

                        return mappings.map((vm: any, index: number) => (
                          <tr key={vm.id} className="border-t hover:bg-muted/30">
                            <td className="px-3 py-3 font-semibold">
                              {index === 0 ? item.product?.product_name ?? "—" : ""}
                            </td>
                            <td className="px-3 py-3">
                              {index === 0 ? item.product?.article_code ?? "—" : ""}
                            </td>
                            <td className="px-3 py-3">
                              {index === 0 ? item.uom ?? "—" : ""}
                            </td>
                            <td className="px-3 py-3 font-medium">
                              {vm.companyVendor?.company_name ?? "—"}
                            </td>
                            <td className="px-3 py-3">
                              {vm.companyVendor?.vendor_code ?? "—"}
                            </td>
                            <td className="px-3 py-3">
                              {vm.paymentTerm?.term_name ?? "—"}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {vm.required_qty ?? "—"}
                            </td>
                            <td className="px-3 py-3">
                              {fmt(vm.required_by_date)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fmtMoney(vm.mrp)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {vm.discount_pct ? `${n(vm.discount_pct)}%` : "—"}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fmtMoney(vm.rate)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fmtMoney(vm.amount)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {vm.tax_pct ? `${n(vm.tax_pct)}%` : "—"}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fmtMoney(vm.tax_amount)}
                            </td>
                            <td className="px-3 py-3 text-right font-bold text-indigo-600">
                              {fmtMoney(vm.total_amount)}
                            </td>
                            <td className="px-3 py-3">
                              {vm.remarks || item.remarks || "—"}
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>

                    <tfoot className="border-t bg-muted/50 font-bold">
                      <tr>
                        <td className="px-3 py-3" colSpan={11}>
                          Total
                        </td>
                        <td className="px-3 py-3 text-right">
                          {fmtMoney(financials.baseAmount)}
                        </td>
                        <td className="px-3 py-3" />
                        <td className="px-3 py-3 text-right">
                          {fmtMoney(financials.taxAmount)}
                        </td>
                        <td className="px-3 py-3 text-right text-indigo-600">
                          {fmtMoney(financials.grandTotal)}
                        </td>
                        <td className="px-3 py-3" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {data.statusLogs?.length > 0 && (
                <div className="rounded-2xl border bg-background shadow-sm">
                  <div className="border-b px-4 py-3">
                    <p className="font-bold">Status Timeline</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-3 py-3 text-left">Date</th>
                          <th className="px-3 py-3 text-left">From</th>
                          <th className="px-3 py-3 text-left">To</th>
                          <th className="px-3 py-3 text-left">Changed By</th>
                          <th className="px-3 py-3 text-left">Remarks</th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.statusLogs.map((log: any) => (
                          <tr key={log.id} className="border-t">
                            <td className="px-3 py-3">
                              {fmtDt(log.created_at)}
                            </td>
                            <td className="px-3 py-3">
                              {log.from_status
                                ? getStatusCfg(log.from_status).label
                                : "—"}
                            </td>
                            <td className="px-3 py-3 font-semibold">
                              {getStatusCfg(log.to_status).label}
                            </td>
                            <td className="px-3 py-3">
                              {log.changedBy?.user_name ?? "—"}
                            </td>
                            <td className="px-3 py-3">
                              {log.remarks ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {approval && data && (
        <ApprovalModal
          action={approval.action}
          intentNo={data.intent_no}
          onConfirm={(remarks) => handleStatusAction(approval.action as PIStatus, remarks)}
          onClose={() => setApproval(null)}
          loading={actionLoading}
        />
      )}

      {/* {convertTarget && (
        <ConvertToPOModal
          piId={convertTarget.id}
          intentNo={convertTarget.intent_no}
          onClose={() => setConvertTarget(null)}
          onSuccess={(pos) => {
            setConvertTarget(null);

            toastManager.add({
              title: `${pos.length} PO${pos.length > 1 ? "s" : ""} created: ${pos
                .map((p) => p.po_no)
                .join(", ")}`,
              type: "success",
            });

            load();
          }}
        />
      )} */}
    </>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
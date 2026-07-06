

"use client";

import {
    getPOById,
    PODetail,
    updatePOStatus
} from "@/api/purchaseOrder/purchaseOrder";
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
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAppSelector } from "@/redux/store";
import {
    ArrowLeft,
    Building2,
    ClipboardList,
    IndianRupee,
    Package,
    ReceiptText,
    ShoppingCart,
    Loader2
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const n = (value: any) => {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num : 0;
};

const fmtMoney = (value: any) => {
    const num = n(value);

    return num > 0
        ? `₹${num.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`
        : "—";
};

const fmtQty = (value: any) => {
    const num = n(value);

    return num > 0
        ? num.toLocaleString("en-IN", {
            maximumFractionDigits: 3,
        })
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

function statusClass(status: string) {
    switch (status) {
        case "Draft":
            return "bg-slate-100 text-slate-700 border-slate-200";
        case "Approved":
            return "bg-emerald-100 text-emerald-700 border-emerald-200";
        case "PartiallyReceived":
            return "bg-amber-100 text-amber-700 border-amber-200";
        case "Received":
            return "bg-blue-100 text-blue-700 border-blue-200";
        case "Cancelled":
            return "bg-red-100 text-red-700 border-red-200";
        default:
            return "bg-muted text-muted-foreground border-border";
    }
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                status
            )}`}
        >
            {status}
        </span>
    );
}

export default function PurchaseOrderDetailPage() {
    const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
    const { id } = useParams<{ id: string }>();
    const poId = Number(id);
    const router = useRouter();
    const userId = Number(useAppSelector((s) => s.auth.user?.id));

    const [po, setPo] = useState<PODetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusAction, setStatusAction] = useState<"Approved" | "Cancelled" | null>(
        null
    );
    const [statusRemarks, setStatusRemarks] = useState("");
    const [statusLoading, setStatusLoading] = useState(false);


    const handleStatusUpdate = async () => {
        if (!statusAction) return;

        if (statusAction === "Cancelled" && !statusRemarks.trim()) {
            toastManager.add({
                title: "Cancellation reason is required",
                type: "error",
            });
            return;
        }

        setStatusLoading(true);

        try {
            await updatePOStatus(
                vendorId,
                poId,
                userId,                
                statusAction,
                statusRemarks.trim() || undefined
            );
            

            toastManager.add({
                title:
                    statusAction === "Approved"
                        ? "Purchase Order approved successfully"
                        : "Purchase Order cancelled successfully",
                type: "success",
            });

            setStatusAction(null);
            setStatusRemarks("");
            load();
        } catch (error: any) {
            toastManager.add({
                title:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to update purchase order status",
                type: "error",
            });
        } finally {
            setStatusLoading(false);
        }
    };

    const load = () => {
        if (!vendorId || !poId) return;

        setLoading(true);

        getPOById(vendorId, poId)
            .then(setPo)
            .catch(() => {
                toastManager.add({
                    title: "Failed to fetch purchase order",
                    type: "error",
                });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [vendorId, poId]);

    const totals = useMemo(() => {
        const items = po?.items ?? [];

        const amount = items.reduce((sum, item: any) => {
            return sum + n(item.ordered_qty) * n(item.unit_price);
        }, 0);

        const receivedQty = items.reduce((sum, item: any) => {
            return sum + n(item.received_qty);
        }, 0);

        const orderedQty = items.reduce((sum, item: any) => {
            return sum + n(item.ordered_qty);
        }, 0);

        return {
            itemCount: items.length,
            orderedQty,
            receivedQty,
            amount,
            grnCount: po?.grns?.length ?? 0,
        };
    }, [po]);

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
                                <BreadcrumbLink href="/dashboard/inventory/purchase-orders">
                                    Purchase Orders
                                </BreadcrumbLink>
                            </BreadcrumbItem>

                            <BreadcrumbSeparator className="hidden md:block" />

                            <BreadcrumbItem>
                                <BreadcrumbPage>{po?.po_no || "View Details"}</BreadcrumbPage>
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
                                    onClick={() => router.push("/dashboard/inventory/purchase-orders")}
                                >
                                    <ArrowLeft size={14} className="mr-1" />
                                    Back
                                </Button>

                                {po && <StatusBadge status={po.status} />}
                            </div>

                            <h1 className="text-xl font-bold">
                                {loading ? "Loading..." : po?.po_no || "Purchase Order"}
                            </h1>

                            {po && (
                                <p className="text-sm text-muted-foreground">
                                    Created {fmtDt(po.created_at)} by {po.createdBy?.user_name ?? "—"}
                                </p>
                            )}
                        </div>

                        {po && (
  <div className="flex flex-wrap gap-2">
    {po.status === "Draft" && (
      <>
        <Button
          type="button"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            setStatusAction("Approved");
            setStatusRemarks("");
          }}
        >
          Approve
        </Button>

        <Button
          type="button"
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
          onClick={() => {
            setStatusAction("Cancelled");
            setStatusRemarks("");
          }}
        >
          Cancel PO
        </Button>
      </>
    )}

   

    {po.status === "Approved" && (
  <>
    <Button
      type="button"
      className="bg-indigo-600 hover:bg-indigo-700"
      onClick={() =>
        router.push(`/dashboard/inventory/purchase-orders/${poId}/create-grn`)
      }
    >
      Create GRN
    </Button>

    <Button
      type="button"
      variant="outline"
      className="border-red-200 text-red-600 hover:bg-red-50"
      onClick={() => {
        setStatusAction("Cancelled");
        setStatusRemarks("");
      }}
    >
      Cancel PO
    </Button>
  </>
)}

{po.status === "PartiallyReceived" && (
  <Button
    type="button"
    className="bg-indigo-600 hover:bg-indigo-700"
    onClick={() =>
      router.push(`/dashboard/inventory/purchase-orders/${poId}/create-grn`)
    }
  >
    Create Another GRN
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
                    ) : !po ? (
                        <div className="rounded-2xl border bg-background p-10 text-center text-muted-foreground">
                            Failed to load PO details.
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 md:grid-cols-5">
                                <SummaryBox
                                    icon={ShoppingCart}
                                    label="PO No"
                                    value={po.po_no}
                                />

                                <SummaryBox
                                    icon={Building2}
                                    label="Supplier"
                                    value={po.companyVendor?.company_name ?? "—"}
                                />

                                <SummaryBox
                                    icon={Package}
                                    label="Items"
                                    value={totals.itemCount}
                                />

                                <SummaryBox
                                    icon={ClipboardList}
                                    label="GRNs"
                                    value={totals.grnCount}
                                />

                                <SummaryBox
                                    icon={IndianRupee}
                                    label="Approx. Amount"
                                    value={fmtMoney(totals.amount)}
                                />
                            </div>

                            <div className="rounded-2xl border bg-background shadow-sm">
                                <div className="border-b px-4 py-3">
                                    <p className="font-bold">PO Information</p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <InfoRow label="PO No" value={po.po_no} />
                                            <InfoRow label="Status" value={<StatusBadge status={po.status} />} />
                                            <InfoRow
                                                label="Supplier"
                                                value={`${po.companyVendor?.company_name ?? "—"} ${po.companyVendor?.vendor_code
                                                    ? `(${po.companyVendor.vendor_code})`
                                                    : ""
                                                    }`}
                                            />
                                            <InfoRow
                                                label="Supplier Contact"
                                                value={po.companyVendor?.contact_no ?? "—"}
                                            />
                                            <InfoRow
                                                label="Supplier Email"
                                                value={po.companyVendor?.email ?? "—"}
                                            />
                                            <InfoRow
                                                label="Purchase Intent"
                                                value={po.purchaseIntent?.intent_no ?? "—"}
                                            />
                                            <InfoRow
                                                label="Expected Delivery"
                                                value={fmt(po.expected_delivery_date)}
                                            />
                                            <InfoRow label="Created By" value={po.createdBy?.user_name ?? "—"} />
                                            <InfoRow label="Created At" value={fmtDt(po.created_at)} />
                                            <InfoRow label="Remarks" value={po.remarks || "—"} />
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="rounded-2xl border bg-background shadow-sm">
                                <div className="border-b px-4 py-3">
                                    <p className="font-bold">PO Items</p>
                                    <p className="text-xs text-muted-foreground">
                                        Tabular item, quantity, received quantity and pricing details.
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1050px] text-xs">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="px-3 py-3 text-left">Product</th>
                                                <th className="px-3 py-3 text-left">Code</th>
                                                <th className="px-3 py-3 text-left">UOM</th>
                                                <th className="px-3 py-3 text-right">Ordered Qty</th>
                                                <th className="px-3 py-3 text-right">Received Qty</th>
                                                <th className="px-3 py-3 text-right">Pending Qty</th>
                                                <th className="px-3 py-3 text-right">Unit Price</th>
                                                <th className="px-3 py-3 text-right">Amount</th>
                                                <th className="px-3 py-3 text-left">Expected Delivery</th>
                                                <th className="px-3 py-3 text-left">Remarks</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {po.items.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={10}
                                                        className="px-3 py-8 text-center text-muted-foreground"
                                                    >
                                                        No items found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                po.items.map((item: any) => {
                                                    const orderedQty = n(item.ordered_qty);
                                                    const receivedQty = n(item.received_qty);
                                                    const pendingQty = Math.max(0, orderedQty - receivedQty);
                                                    const amount = orderedQty * n(item.unit_price);

                                                    return (
                                                        <tr key={item.id} className="border-t hover:bg-muted/30">
                                                            <td className="px-3 py-3 font-semibold">
                                                                {item.product?.product_name ?? "—"}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                {item.product?.article_code ?? "—"}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                {item.uom || item.product?.unit_of_measure || "—"}
                                                            </td>
                                                            <td className="px-3 py-3 text-right">
                                                                {fmtQty(item.ordered_qty)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right">
                                                                {fmtQty(item.received_qty)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right font-semibold">
                                                                {fmtQty(pendingQty)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right">
                                                                {fmtMoney(item.unit_price)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right font-bold text-indigo-600">
                                                                {fmtMoney(amount)}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                {fmt(item.expected_delivery_date)}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                {item.remarks || "—"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>

                                        <tfoot className="border-t bg-muted/50 font-bold">
                                            <tr>
                                                <td className="px-3 py-3" colSpan={3}>
                                                    Total
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    {fmtQty(totals.orderedQty)}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    {fmtQty(totals.receivedQty)}
                                                </td>
                                                <td className="px-3 py-3" />
                                                <td className="px-3 py-3" />
                                                <td className="px-3 py-3 text-right text-indigo-600">
                                                    {fmtMoney(totals.amount)}
                                                </td>
                                                <td className="px-3 py-3" colSpan={2} />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="rounded-2xl border bg-background shadow-sm">
                                <div className="border-b px-4 py-3">
                                    <p className="font-bold">GRN Details</p>
                                    <p className="text-xs text-muted-foreground">
                                        Goods receipt notes linked with this PO.
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1100px] text-xs">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="px-3 py-3 text-left">GRN No</th>
                                                <th className="px-3 py-3 text-left">Status</th>
                                                <th className="px-3 py-3 text-left">Received Date</th>
                                                <th className="px-3 py-3 text-left">Invoice No</th>
                                                <th className="px-3 py-3 text-left">Vehicle No</th>
                                                <th className="px-3 py-3 text-left">Gate Entry No</th>
                                                <th className="px-3 py-3 text-left">Created By</th>
                                                <th className="px-3 py-3 text-left">Confirmed By</th>
                                                <th className="px-3 py-3 text-left">Confirmed At</th>
                                                <th className="px-3 py-3 text-right">Items</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {!po.grns?.length ? (
                                                <tr>
                                                    <td
                                                        colSpan={10}
                                                        className="px-3 py-8 text-center text-muted-foreground"
                                                    >
                                                        No GRN created for this PO.
                                                    </td>
                                                </tr>
                                            ) : (
                                                po.grns.map((grn: any) => (
                                                    <tr key={grn.id} className="border-t hover:bg-muted/30">
                                                        <td className="px-3 py-3 font-semibold">
                                                            {grn.grn_no}
                                                        </td>
                                                        <td className="px-3 py-3">{grn.status}</td>
                                                        <td className="px-3 py-3">
                                                            {fmt(grn.received_date)}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {grn.invoice_no || "—"}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {grn.vehicle_no || "—"}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {grn.gate_entry_no || "—"}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {grn.createdBy?.user_name ?? "—"}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {grn.confirmedBy?.user_name ?? "—"}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {fmtDt(grn.confirmed_at)}
                                                        </td>
                                                        <td className="px-3 py-3 text-right">
                                                            {grn.items?.length ?? 0}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {po.grns?.length > 0 && (
                                <div className="rounded-2xl border bg-background shadow-sm">
                                    <div className="border-b px-4 py-3">
                                        <p className="font-bold">GRN Item Details</p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1200px] text-xs">
                                            <thead className="bg-muted/40">
                                                <tr>
                                                    <th className="px-3 py-3 text-left">GRN No</th>
                                                    <th className="px-3 py-3 text-left">Product</th>
                                                    <th className="px-3 py-3 text-left">Code</th>
                                                    <th className="px-3 py-3 text-right">Received</th>
                                                    <th className="px-3 py-3 text-right">Accepted</th>
                                                    <th className="px-3 py-3 text-right">Rejected</th>
                                                    <th className="px-3 py-3 text-right">Unit Price</th>
                                                    <th className="px-3 py-3 text-left">Status</th>
                                                    <th className="px-3 py-3 text-left">Rejection Reason</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {po.grns.flatMap((grn: any) =>
                                                    (grn.items ?? []).map((item: any) => (
                                                        <tr
                                                            key={`${grn.id}-${item.id}`}
                                                            className="border-t hover:bg-muted/30"
                                                        >
                                                            <td className="px-3 py-3 font-semibold">
                                                                {grn.grn_no}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                {item.product?.product_name ?? "—"}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                {item.product?.article_code ?? "—"}
                                                            </td>
                                                            <td className="px-3 py-3 text-right">
                                                                {fmtQty(item.received_qty)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right">
                                                                {fmtQty(item.accepted_qty)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right">
                                                                {fmtQty(item.rejected_qty)}
                                                            </td>
                                                            <td className="px-3 py-3 text-right">
                                                                {fmtMoney(item.unit_price)}
                                                            </td>
                                                            <td className="px-3 py-3">{item.status}</td>
                                                            <td className="px-3 py-3">
                                                                {item.rejection_reason || "—"}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            {statusAction && po && (
  <div
    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onClick={() => {
      if (!statusLoading) {
        setStatusAction(null);
        setStatusRemarks("");
      }
    }}
  >
    <div
      className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4">
        <h3 className="text-base font-bold">
          {statusAction === "Approved" ? "Approve PO" : "Cancel PO"}
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          {po.po_no}
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold">
          {statusAction === "Cancelled"
            ? "Cancellation Reason *"
            : "Remarks"}
        </label>

        <textarea
          autoFocus
          value={statusRemarks}
          onChange={(e) => setStatusRemarks(e.target.value)}
          placeholder={
            statusAction === "Cancelled"
              ? "Enter cancellation reason..."
              : "Optional remarks..."
          }
          rows={4}
          className="mt-1 w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={statusLoading}
          onClick={() => {
            setStatusAction(null);
            setStatusRemarks("");
          }}
        >
          Close
        </Button>

        <Button
          type="button"
          size="sm"
          disabled={
            statusLoading ||
            (statusAction === "Cancelled" && !statusRemarks.trim())
          }
          className={
            statusAction === "Cancelled"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          }
          onClick={handleStatusUpdate}
        >
          {statusLoading ? (
            <Loader2 size={13} className="mr-1 animate-spin" />
          ) : null}

          {statusAction === "Approved" ? "Approve" : "Cancel PO"}
        </Button>
      </div>
    </div>
  </div>
)}
        </>
    );
}

function SummaryBox({
    icon: Icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <Icon size={17} className="mb-3 text-indigo-500" />
            <p className="text-[10px] font-black uppercase text-muted-foreground">
                {label}
            </p>
            <div className="mt-1 text-base font-black">{value}</div>
        </div>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <tr className="border-t first:border-t-0">
            <td className="w-56 bg-muted/30 px-4 py-3 text-xs font-bold uppercase text-muted-foreground">
                {label}
            </td>
            <td className="px-4 py-3 text-sm">{value}</td>
        </tr>
    );
}
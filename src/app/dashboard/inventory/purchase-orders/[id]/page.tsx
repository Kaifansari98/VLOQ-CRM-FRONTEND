

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

function StatusBadge({ status }: { status: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
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
                <div className="w-full space-y-5">
                    <div className="flex flex-col gap-4 rounded-xl border bg-background p-5 shadow-xs md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-md text-xs font-medium px-3"
                                    onClick={() => router.push("/dashboard/inventory/purchase-orders")}
                                >
                                    <ArrowLeft size={14} className="mr-1" />
                                    Back
                                </Button>

                                {po && <StatusBadge status={po.status} />}
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {loading ? "Loading..." : po?.po_no || "Purchase Order"}
                            </h1>

                            {po && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Created {fmtDt(po.created_at)} by {po.createdBy?.user_name ?? "—"}
                                </p>
                            )}
                        </div>

                        {po && (
                            <div className="flex flex-wrap items-center gap-2">
                                {po.status === "Draft" && (
                                    <>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-xs px-4"
                                            onClick={() => {
                                                setStatusAction("Approved");
                                                setStatusRemarks("");
                                            }}
                                        >
                                            Approve
                                        </Button>

                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-9 rounded-md border-border text-foreground hover:bg-muted font-medium text-xs px-4"
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
                                            size="sm"
                                            className="h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-xs px-4"
                                            onClick={() =>
                                                router.push(`/dashboard/inventory/purchase-orders/${poId}/create-grn`)
                                            }
                                        >
                                            Create GRN
                                        </Button>

                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-9 rounded-md border-border text-foreground hover:bg-muted font-medium text-xs px-4"
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
                                        size="sm"
                                        className="h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-xs px-4"
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

                            <div className="rounded-xl border bg-background shadow-xs overflow-hidden">
                                <div className="border-b bg-muted/15 px-4 py-3">
                                    <h2 className="text-sm font-semibold tracking-tight text-foreground">PO Information</h2>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
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
                                                label="Purchase Enquiry"
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

                            <div className="rounded-xl border bg-background shadow-xs overflow-hidden">
                                <div className="flex items-center justify-between border-b bg-muted/15 px-4 py-3">
                                    <div>
                                        <h2 className="text-sm font-semibold tracking-tight text-foreground">PO Items</h2>
                                        <p className="text-xs text-muted-foreground">
                                            Tabular item, quantity, received quantity and pricing details.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                                        {po.items.length} {po.items.length === 1 ? "Item" : "Items"}
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1050px] text-xs">
                                        <thead className="border-b bg-muted/30">
                                            <tr>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Product</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Code</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">UOM</th>
                                                <th className="h-9 px-3.5 py-2 text-right font-semibold text-muted-foreground">Ordered Qty</th>
                                                <th className="h-9 px-3.5 py-2 text-right font-semibold text-muted-foreground">Received Qty</th>
                                                <th className="h-9 px-3.5 py-2 text-right font-semibold text-muted-foreground">Pending Qty</th>
                                                <th className="h-9 px-3.5 py-2 text-right font-semibold text-muted-foreground">Unit Price</th>
                                                <th className="h-9 px-3.5 py-2 text-right font-semibold text-muted-foreground">Amount</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Expected Delivery</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Remarks</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {po.items.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={10}
                                                        className="px-3.5 py-8 text-center text-muted-foreground"
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
                                                        <tr key={item.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/20">
                                                            <td className="px-3.5 py-2.5 font-semibold text-foreground">
                                                                {item.product?.product_name ?? "—"}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-muted-foreground">
                                                                {item.product?.article_code ?? "—"}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-muted-foreground">
                                                                {item.uom || item.product?.unit_of_measure || "—"}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-right font-medium text-foreground">
                                                                {fmtQty(item.ordered_qty)}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-right font-medium text-foreground">
                                                                {fmtQty(item.received_qty)}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-right font-semibold text-foreground">
                                                                {fmtQty(pendingQty)}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-right text-foreground">
                                                                {fmtMoney(item.unit_price)}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-right font-bold text-foreground">
                                                                {fmtMoney(amount)}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-muted-foreground">
                                                                {fmt(item.expected_delivery_date)}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-muted-foreground">
                                                                {item.remarks || "—"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>

                                        <tfoot className="border-t bg-muted/25 text-xs font-semibold">
                                            <tr>
                                                <td className="px-3.5 py-2.5 text-foreground" colSpan={3}>
                                                    Total
                                                </td>
                                                <td className="px-3.5 py-2.5 text-right text-foreground">
                                                    {fmtQty(totals.orderedQty)}
                                                </td>
                                                <td className="px-3.5 py-2.5 text-right text-foreground">
                                                    {fmtQty(totals.receivedQty)}
                                                </td>
                                                <td className="px-3.5 py-2.5" />
                                                <td className="px-3.5 py-2.5" />
                                                <td className="px-3.5 py-2.5 text-right font-bold text-foreground">
                                                    {fmtMoney(totals.amount)}
                                                </td>
                                                <td className="px-3.5 py-2.5" colSpan={2} />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-background shadow-xs overflow-hidden">
                                <div className="flex items-center justify-between border-b bg-muted/15 px-4 py-3">
                                    <div>
                                        <h2 className="text-sm font-semibold tracking-tight text-foreground">GRN Details</h2>
                                        <p className="text-xs text-muted-foreground">
                                            Goods receipt notes linked with this PO.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                                        {po.grns?.length ?? 0} {po.grns?.length === 1 ? "GRN" : "GRNs"}
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1100px] text-xs">
                                        <thead className="border-b bg-muted/30">
                                            <tr>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">GRN No</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Status</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Received Date</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Invoice No</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Vehicle No</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Gate Entry No</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Created By</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Confirmed By</th>
                                                <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Confirmed At</th>
                                                <th className="h-9 px-3.5 py-2 text-right font-semibold text-muted-foreground">Items</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {!po.grns?.length ? (
                                                <tr>
                                                    <td
                                                        colSpan={10}
                                                        className="px-3.5 py-8 text-center text-muted-foreground"
                                                    >
                                                        No GRN created for this PO.
                                                    </td>
                                                </tr>
                                            ) : (
                                                po.grns.map((grn: any) => (
                                                    <tr key={grn.id} className="border-b last:border-b-0 transition-colors hover:bg-muted/20">
                                                        <td className="px-3.5 py-2.5 font-semibold text-foreground">
                                                            {grn.grn_no}
                                                        </td>
                                                        <td className="px-3.5 py-2.5">
                                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
                                                                {grn.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3.5 py-2.5 text-muted-foreground">
                                                            {fmt(grn.received_date)}
                                                        </td>
                                                        <td className="px-3.5 py-2.5 text-foreground">
                                                            {grn.invoice_no || "—"}
                                                        </td>
                                                        <td className="px-3.5 py-2.5 text-muted-foreground">
                                                            {grn.vehicle_no || "—"}
                                                        </td>
                                                        <td className="px-3.5 py-2.5 text-muted-foreground">
                                                            {grn.gate_entry_no || "—"}
                                                        </td>
                                                        <td className="px-3.5 py-2.5 text-foreground">
                                                            {grn.createdBy?.user_name ?? "—"}
                                                        </td>
                                                        <td className="px-3.5 py-2.5 text-foreground">
                                                            {grn.confirmedBy?.user_name ?? "—"}
                                                        </td>
                                                        <td className="px-3.5 py-2.5 text-muted-foreground">
                                                            {fmtDt(grn.confirmed_at)}
                                                        </td>
                                                        <td className="px-3.5 py-2.5 text-right font-medium text-foreground">
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
                                <div className="rounded-xl border bg-background shadow-xs overflow-hidden">
                                    <div className="border-b bg-muted/15 px-4 py-3">
                                        <h2 className="text-sm font-semibold tracking-tight text-foreground">GRN Item Details</h2>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1200px] text-xs">
                                            <thead className="border-b bg-muted/30">
                                                <tr>
                                                    <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">GRN No</th>
                                                    <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Product</th>
                                                    <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Code</th>
                                                    <th className="h-9 px-3.5 py-2 text-right font-semibold text-muted-foreground">Received</th>
                                                    <th className="h-9 px-3.5 py-2 text-right font-semibold text-muted-foreground">Accepted</th>
                                                    <th className="h-9 px-3.5 py-2 text-right font-semibold text-muted-foreground">Rejected</th>
                                                    <th className="h-9 px-3.5 py-2 text-right font-semibold text-muted-foreground">Unit Price</th>
                                                    <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Status</th>
                                                    <th className="h-9 px-3.5 py-2 text-left font-semibold text-muted-foreground">Rejection Reason</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {po.grns.flatMap((grn: any) =>
                                                    (grn.items ?? []).map((item: any) => (
                                                        <tr
                                                            key={`${grn.id}-${item.id}`}
                                                            className="border-b last:border-b-0 transition-colors hover:bg-muted/20"
                                                        >
                                                            <td className="px-3.5 py-2.5 font-semibold text-foreground">
                                                                {grn.grn_no}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 font-medium text-foreground">
                                                                {item.product?.product_name ?? "—"}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-muted-foreground">
                                                                {item.product?.article_code ?? "—"}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-right font-medium text-foreground">
                                                                {fmtQty(item.received_qty)}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-right font-medium text-foreground">
                                                                {fmtQty(item.accepted_qty)}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-right font-medium text-foreground">
                                                                {fmtQty(item.rejected_qty)}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-right text-foreground">
                                                                {fmtMoney(item.unit_price)}
                                                            </td>
                                                            <td className="px-3.5 py-2.5">
                                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-muted-foreground">
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
                        className="w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4">
                            <h3 className="text-base font-bold text-foreground">
                                {statusAction === "Approved" ? "Approve Purchase Order" : "Cancel Purchase Order"}
                            </h3>

                            <p className="mt-1 text-xs text-muted-foreground">
                                PO Number: <span className="font-semibold text-foreground">{po.po_no}</span>
                            </p>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-foreground">
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
                                className="mt-1.5 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
                            />
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={statusLoading}
                                className="h-9 rounded-md border-border text-foreground hover:bg-muted font-medium text-xs px-4"
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
                                className="h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-xs px-4"
                                onClick={handleStatusUpdate}
                            >
                                {statusLoading ? (
                                    <Loader2 size={13} className="mr-1 animate-spin" />
                                ) : null}

                                {statusAction === "Approved" ? "Approve" : "Confirm Cancellation"}
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
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-foreground">
                    <Icon size={15} />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
                    {label}
                </p>
            </div>
            <div className="mt-2 text-lg font-bold tracking-tight text-foreground truncate">
                {value}
            </div>
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
        <tr className="border-b last:border-b-0 transition-colors hover:bg-muted/10">
            <td className="w-52 border-r bg-muted/20 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                {label}
            </td>
            <td className="px-4 py-2.5 text-xs font-medium text-foreground">
                {value}
            </td>
        </tr>
    );
}
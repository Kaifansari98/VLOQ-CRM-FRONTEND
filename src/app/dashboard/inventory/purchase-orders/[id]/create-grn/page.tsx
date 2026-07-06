"use client";

import {
    getPOById,
    PODetail,
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
    Loader2,
    PackageCheck,
    Save,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createGRN } from "@/api/grn/grn";

type GRNItemRow = {
    po_item_id: number;
    product_id: number;
    product_name: string;
    article_code?: string | null;
    uom?: string | null;

    ordered_qty: number;
    received_qty_before: number;
    pending_qty: number;

    received_qty: string;
    accepted_qty: string;
    rejected_qty: string;
    rejection_reason: string;
    remarks: string;
    unit_price: number;
};

const inputClass =
    "h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300";

const n = (value: any) => {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num : 0;
};

const fmtQty = (value: any) => {
    const num = n(value);

    return num > 0
        ? num.toLocaleString("en-IN", {
            maximumFractionDigits: 3,
        })
        : "0";
};

const fmtMoney = (value: any) => {
    const num = n(value);

    return num > 0
        ? `₹${num.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`
        : "₹0.00";
};

const today = () => new Date().toISOString().slice(0, 10);

export default function CreateGRNPage() {
    const vendorId = Number(useAppSelector((s) => s.auth.user?.vendor_id));
    const userId = Number(useAppSelector((s) => s.auth.user?.id));
    const { id } = useParams<{ id: string }>();
    const poId = Number(id);
    const router = useRouter();

    const [po, setPo] = useState<PODetail | null>(null);
    const [rows, setRows] = useState<GRNItemRow[]>([]);

    const [receivedDate, setReceivedDate] = useState(today());
    const [invoiceNo, setInvoiceNo] = useState("");
    const [invoiceDate, setInvoiceDate] = useState("");
    const [vehicleNo, setVehicleNo] = useState("");
    const [gateEntryNo, setGateEntryNo] = useState("");
    const [remarks, setRemarks] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!vendorId || !poId) return;

        setLoading(true);

        getPOById(vendorId, poId)
            .then((data) => {
                setPo(data);

                const itemRows: GRNItemRow[] = (data.items ?? []).map((item: any) => {
                    const orderedQty = n(item.ordered_qty);
                    const receivedBefore = n(item.received_qty);
                    const pendingQty = Math.max(0, orderedQty - receivedBefore);

                    return {
                        po_item_id: item.id,
                        product_id: item.product_id,
                        product_name: item.product?.product_name ?? "—",
                        article_code: item.product?.article_code ?? null,
                        uom: item.uom || item.product?.unit_of_measure || null,

                        ordered_qty: orderedQty,
                        received_qty_before: receivedBefore,
                        pending_qty: pendingQty,

                        received_qty: pendingQty > 0 ? String(pendingQty) : "",
                        accepted_qty: pendingQty > 0 ? String(pendingQty) : "",
                        rejected_qty: "0",
                        rejection_reason: "",
                        remarks: "",
                        unit_price: n(item.unit_price),
                    };
                });

                setRows(itemRows.filter((row) => row.pending_qty > 0));
            })
            .catch(() => {
                toastManager.add({
                    title: "Failed to load PO",
                    type: "error",
                });
            })
            .finally(() => setLoading(false));
    }, [vendorId, poId]);

    const totals = useMemo(() => {
        return rows.reduce(
            (sum, row) => {
                sum.received += n(row.received_qty);
                sum.accepted += n(row.accepted_qty);
                sum.rejected += n(row.rejected_qty);
                sum.amount += n(row.accepted_qty) * n(row.unit_price);
                return sum;
            },
            {
                received: 0,
                accepted: 0,
                rejected: 0,
                amount: 0,
            }
        );
    }, [rows]);

    const updateRow = (
        index: number,
        field: keyof GRNItemRow,
        value: string
    ) => {
        setRows((prev) => {
            const next = [...prev];
            const row = {
                ...next[index],
                [field]: value,
            };

            if (field === "received_qty") {
                const received = n(value);
                const rejected = n(row.rejected_qty);
                row.accepted_qty = String(Math.max(0, received - rejected));
            }

            if (field === "rejected_qty") {
                const received = n(row.received_qty);
                const rejected = n(value);
                row.accepted_qty = String(Math.max(0, received - rejected));
            }

            next[index] = row;
            return next;
        });
    };

    const validate = () => {
        if (!receivedDate) {
            toastManager.add({
                title: "Received date is required",
                type: "error",
            });
            return false;
        }

        const selectedRows = rows.filter((row) => n(row.received_qty) > 0);

        if (!selectedRows.length) {
            toastManager.add({
                title: "Please enter received quantity for at least one item",
                type: "error",
            });
            return false;
        }

        for (const row of selectedRows) {
            const received = n(row.received_qty);
            const accepted = n(row.accepted_qty);
            const rejected = n(row.rejected_qty);

            if (received > row.pending_qty) {
                toastManager.add({
                    title: `${row.product_name}: received qty cannot exceed pending qty`,
                    type: "error",
                });
                return false;
            }

            if (accepted + rejected !== received) {
                toastManager.add({
                    title: `${row.product_name}: accepted + rejected must equal received`,
                    type: "error",
                });
                return false;
            }

            if (rejected > 0 && !row.rejection_reason.trim()) {
                toastManager.add({
                    title: `${row.product_name}: rejection reason is required`,
                    type: "error",
                });
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setSaving(true);

        try {
            const payload = {
                user_id: userId,
                purchase_order_id: poId,
                company_vendor_id: po?.companyVendor?.id,

                received_date: receivedDate,
                invoice_no: invoiceNo || undefined,
                invoice_date: invoiceDate || undefined,
                vehicle_no: vehicleNo || undefined,
                gate_entry_no: gateEntryNo || undefined,
                remarks: remarks || undefined,

                items: rows
                    .filter((row) => n(row.received_qty) > 0)
                    .map((row) => ({
                        purchase_order_item_id: row.po_item_id,
                        po_item_id: row.po_item_id,
                        product_id: row.product_id,

                        received_qty: n(row.received_qty),
                        accepted_qty: n(row.accepted_qty),
                        rejected_qty: n(row.rejected_qty),

                        rejection_reason: row.rejection_reason || undefined,
                        unit_price: row.unit_price || undefined,
                        uom: row.uom || undefined,
                    })),
            };

            const result = await createGRN(vendorId, payload);

            toastManager.add({
                title: result?.grn_no
                    ? `GRN ${result.grn_no} created successfully`
                    : "GRN created successfully",
                type: "success",
            });

            router.push(`/dashboard/inventory/purchase-orders/${poId}`);
        } catch (error: any) {
            toastManager.add({
                title:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to create GRN",
                type: "error",
            });
        } finally {
            setSaving(false);
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
                                <BreadcrumbLink href="/dashboard/inventory/purchase-orders">
                                    Purchase Orders
                                </BreadcrumbLink>
                            </BreadcrumbItem>

                            <BreadcrumbSeparator className="hidden md:block" />

                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink
                                    href={`/dashboard/inventory/purchase-orders/${poId}`}
                                >
                                    {po?.po_no || "PO Details"}
                                </BreadcrumbLink>
                            </BreadcrumbItem>

                            <BreadcrumbSeparator className="hidden md:block" />

                            <BreadcrumbItem>
                                <BreadcrumbPage>Create GRN</BreadcrumbPage>
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
                            <div className="mb-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.push(`/dashboard/inventory/purchase-orders/${poId}`)
                                    }
                                >
                                    <ArrowLeft size={14} className="mr-1" />
                                    Back
                                </Button>
                            </div>

                            <h1 className="text-xl font-bold">
                                Create GRN {po?.po_no ? `- ${po.po_no}` : ""}
                            </h1>

                            <p className="text-sm text-muted-foreground">
                                Receive ordered items and record accepted/rejected quantities.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="rounded-xl border bg-muted/30 px-4 py-2">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                                    Accepted Value
                                </p>
                                <p className="text-lg font-bold text-indigo-600">
                                    {fmtMoney(totals.amount)}
                                </p>
                            </div>

                            <Button
                                type="button"
                                disabled={saving || rows.length === 0}
                                onClick={handleSubmit}
                            >
                                {saving ? (
                                    <Loader2 size={14} className="mr-1 animate-spin" />
                                ) : (
                                    <Save size={14} className="mr-1" />
                                )}
                                Create GRN
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-24 rounded-xl" />
                            <Skeleton className="h-96 rounded-xl" />
                        </div>
                    ) : !po ? (
                        <div className="rounded-2xl border bg-background p-10 text-center text-muted-foreground">
                            Failed to load PO.
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="rounded-2xl border bg-background p-10 text-center text-muted-foreground">
                            All PO items are already received. No pending quantity available.
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl border bg-background p-4 shadow-sm">
                                <div className="grid gap-3 md:grid-cols-5">
                                    <Field label="Received Date *">
                                        <input
                                            type="date"
                                            value={receivedDate}
                                            onChange={(e) => setReceivedDate(e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Invoice No">
                                        <input
                                            value={invoiceNo}
                                            onChange={(e) => setInvoiceNo(e.target.value)}
                                            className={inputClass}
                                            placeholder="Invoice no"
                                        />
                                    </Field>

                                    <Field label="Invoice Date">
                                        <input
                                            type="date"
                                            value={invoiceDate}
                                            onChange={(e) => setInvoiceDate(e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>

                                    <Field label="Vehicle No">
                                        <input
                                            value={vehicleNo}
                                            onChange={(e) => setVehicleNo(e.target.value)}
                                            className={inputClass}
                                            placeholder="Vehicle no"
                                        />
                                    </Field>

                                    <Field label="Gate Entry No">
                                        <input
                                            value={gateEntryNo}
                                            onChange={(e) => setGateEntryNo(e.target.value)}
                                            className={inputClass}
                                            placeholder="Gate entry no"
                                        />
                                    </Field>
                                </div>

                                <div className="mt-3">
                                    <Field label="Remarks">
                                        <input
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            className={inputClass}
                                            placeholder="Optional remarks"
                                        />
                                    </Field>
                                </div>
                            </div>

                            <div className="rounded-2xl border bg-background shadow-sm">
                                <div className="border-b px-4 py-3">
                                    <p className="font-bold">Receive Items</p>
                                    <p className="text-xs text-muted-foreground">
                                        Enter received, accepted and rejected quantities.
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1300px] text-xs">
                                        <thead className="bg-muted/40">
                                            <tr>
                                                <th className="px-3 py-3 text-left">Product</th>
                                                <th className="px-3 py-3 text-left">Code</th>
                                                <th className="px-3 py-3 text-left">UOM</th>
                                                <th className="px-3 py-3 text-right">Ordered</th>
                                                <th className="px-3 py-3 text-right">Already Received</th>
                                                <th className="px-3 py-3 text-right">Pending</th>
                                                <th className="px-3 py-3 text-right">Receive Qty *</th>
                                                <th className="px-3 py-3 text-right">Accepted Qty *</th>
                                                <th className="px-3 py-3 text-right">Rejected Qty</th>
                                                <th className="px-3 py-3 text-right">Unit Price</th>
                                                <th className="px-3 py-3 text-right">Accepted Value</th>
                                                <th className="px-3 py-3 text-left">Rejection Reason</th>
                                                <th className="px-3 py-3 text-left">Remarks</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {rows.map((row, index) => {
                                                const acceptedValue = n(row.accepted_qty) * n(row.unit_price);

                                                return (
                                                    <tr key={row.po_item_id} className="border-t hover:bg-muted/30">
                                                        <td className="px-3 py-3 font-semibold">
                                                            {row.product_name}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {row.article_code || "—"}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            {row.uom || "—"}
                                                        </td>
                                                        <td className="px-3 py-3 text-right">
                                                            {fmtQty(row.ordered_qty)}
                                                        </td>
                                                        <td className="px-3 py-3 text-right">
                                                            {fmtQty(row.received_qty_before)}
                                                        </td>
                                                        <td className="px-3 py-3 text-right font-semibold">
                                                            {fmtQty(row.pending_qty)}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={row.received_qty}
                                                                onChange={(e) =>
                                                                    updateRow(index, "received_qty", e.target.value)
                                                                }
                                                                className={inputClass}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={row.accepted_qty}
                                                                onChange={(e) =>
                                                                    updateRow(index, "accepted_qty", e.target.value)
                                                                }
                                                                className={inputClass}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={row.rejected_qty}
                                                                onChange={(e) =>
                                                                    updateRow(index, "rejected_qty", e.target.value)
                                                                }
                                                                className={inputClass}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3 text-right">
                                                            {fmtMoney(row.unit_price)}
                                                        </td>
                                                        <td className="px-3 py-3 text-right font-bold text-indigo-600">
                                                            {fmtMoney(acceptedValue)}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                value={row.rejection_reason}
                                                                onChange={(e) =>
                                                                    updateRow(index, "rejection_reason", e.target.value)
                                                                }
                                                                className={inputClass}
                                                                placeholder="If rejected"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                value={row.remarks}
                                                                onChange={(e) =>
                                                                    updateRow(index, "remarks", e.target.value)
                                                                }
                                                                className={inputClass}
                                                                placeholder="Remarks"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>

                                        <tfoot className="border-t bg-muted/50 font-bold">
                                            <tr>
                                                <td className="px-3 py-3" colSpan={6}>
                                                    Total
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    {fmtQty(totals.received)}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    {fmtQty(totals.accepted)}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    {fmtQty(totals.rejected)}
                                                </td>
                                                <td />
                                                <td className="px-3 py-3 text-right text-indigo-600">
                                                    {fmtMoney(totals.amount)}
                                                </td>
                                                <td colSpan={2} />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="sticky bottom-4 z-20 rounded-2xl border bg-background p-4 shadow-xl">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-bold">
                                            Receiving {rows.length} item(s)
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Accepted {fmtQty(totals.accepted)} · Rejected{" "}
                                            {fmtQty(totals.rejected)} · Value {fmtMoney(totals.amount)}
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        disabled={saving || rows.length === 0}
                                        onClick={handleSubmit}
                                    >
                                        {saving ? (
                                            <Loader2 size={14} className="mr-1 animate-spin" />
                                        ) : (
                                            <PackageCheck size={14} className="mr-1" />
                                        )}
                                        Create GRN
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">
                {label}
            </label>
            {children}
        </div>
    );
}
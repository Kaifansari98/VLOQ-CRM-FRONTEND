"use client";

import {
    DCNType,
    GRNDetail,
    confirmGRN,
    createDebitCreditNote,
    createRedeliveryRequest,
    getGRNById,
} from "@/api/grn/grn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
    CheckCircle2,
    ClipboardList,
    FileText,
    Loader2,
    Truck,
    X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { GRNStatusBadge } from "../shared/GRNStatusBadge";
import { SectionCard } from "../shared/SectionCard";
import { fmtDate, fmtN, inputBase } from "../shared/statusUtils";
import { GRNFinancialSection } from "./GRNFinancialSection";
import { GRNItemsSection } from "./GRNItemsSection";
import { GRNTimeline } from "./GRNTimeline";

function DCNModal({
    grnId,
    vendorId,
    companyVendorId,
    userId,
    onClose,
    onCreated,
}: {
    grnId: number;
    vendorId: number;
    companyVendorId: number;
    userId: number;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [form, setForm] = useState({
        type: "DebitNote" as DCNType,
        amount: "",
        reason: "",
        remarks: "",
    });

    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!form.amount || !form.reason) {
            toastManager.add({
                title: "Amount and reason are required",
                type: "error",
            });
            return;
        }

        setSaving(true);

        try {
            await createDebitCreditNote(vendorId, {
                user_id: userId,
                grn_id: grnId,
                company_vendor_id: companyVendorId,
                type: form.type,
                amount: Number(form.amount),
                reason: form.reason,
                remarks: form.remarks || undefined,
            });

            toastManager.add({
                title: "Note created successfully",
                type: "success",
            });

            onCreated();
        } catch {
            toastManager.add({
                title: "Failed to create note",
                type: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-black">
                        <FileText size={16} className="text-indigo-600" />
                        Raise Debit / Credit Note
                    </p>

                    <button onClick={onClose}>
                        <X size={17} />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                            Type
                        </label>
                        <select
                            value={form.type}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    type: e.target.value as DCNType,
                                }))
                            }
                            className={`${inputBase} mt-1`}
                        >
                            <option value="DebitNote">Debit Note — refund / reduction</option>
                            <option value="CreditNote">Credit Note — return goods</option>
                        </select>
                    </div>

                    {[
                        {
                            key: "amount",
                            label: "Amount *",
                            type: "number",
                        },
                        {
                            key: "reason",
                            label: "Reason *",
                            type: "text",
                        },
                        {
                            key: "remarks",
                            label: "Remarks",
                            type: "text",
                        },
                    ].map((f) => (
                        <div key={f.key}>
                            <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                                {f.label}
                            </label>
                            <input
                                type={f.type}
                                value={(form as any)[f.key]}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        [f.key]: e.target.value,
                                    }))
                                }
                                className={`${inputBase} mt-1`}
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>

                    <Button
                        size="sm"
                        disabled={saving}
                        onClick={submit}
                        className="gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                    >
                        {saving && <Loader2 size={13} className="animate-spin" />}
                        Create Note
                    </Button>
                </div>
            </div>
        </div>
    );
}

function RedeliveryModal({
    grnItemId,
    rejectedQty,
    vendorId,
    userId,
    companyVendorId,
    onClose,
    onCreated,
}: {
    grnItemId: number;
    rejectedQty: number;
    vendorId: number;
    userId: number;
    companyVendorId: number;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [form, setForm] = useState({
        requested_qty: String(rejectedQty),
        expected_date: "",
        remarks: "",
    });

    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!form.requested_qty || Number(form.requested_qty) <= 0) {
            toastManager.add({
                title: "Enter a valid quantity",
                type: "error",
            });
            return;
        }

        setSaving(true);

        try {
            await createRedeliveryRequest(vendorId, {
                user_id: userId,
                grn_item_id: grnItemId,
                company_vendor_id: companyVendorId,
                requested_qty: Number(form.requested_qty),
                expected_date: form.expected_date || undefined,
                remarks: form.remarks || undefined,
            });

            toastManager.add({
                title: "Redelivery requested",
                type: "success",
            });

            onCreated();
        } catch {
            toastManager.add({
                title: "Failed to create request",
                type: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border bg-background p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-black">
                        <Truck size={16} className="text-indigo-600" />
                        Request Redelivery
                    </p>

                    <button onClick={onClose}>
                        <X size={17} />
                    </button>
                </div>

                <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/20">
                    Rejected Qty: <span className="font-black">{fmtN(rejectedQty)}</span>
                </p>

                <div className="space-y-3">
                    {[
                        {
                            key: "requested_qty",
                            label: "Qty to Redeliver *",
                            type: "number",
                        },
                        {
                            key: "expected_date",
                            label: "Expected Date",
                            type: "date",
                        },
                        {
                            key: "remarks",
                            label: "Remarks",
                            type: "text",
                        },
                    ].map((f) => (
                        <div key={f.key}>
                            <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                                {f.label}
                            </label>
                            <input
                                type={f.type}
                                value={(form as any)[f.key]}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        [f.key]: e.target.value,
                                    }))
                                }
                                className={`${inputBase} mt-1`}
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>

                    <Button
                        size="sm"
                        disabled={saving}
                        onClick={submit}
                        className="gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                    >
                        {saving && <Loader2 size={13} className="animate-spin" />}
                        Request
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function GRNDetailSheet({
    vendorId,
    userId,
    grnId,
    onClose,
    onRefresh,
}: {
    vendorId: number;
    userId: number;
    grnId: number;
    onClose: () => void;
    onRefresh: () => void;
}) {
    const [grn, setGrn] = useState<GRNDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [dcnModal, setDcnModal] = useState(false);
    const [rdItem, setRdItem] = useState<{
        id: number;
        rejected: number;
    } | null>(null);

    const load = useCallback(() => {
        setLoading(true);

        getGRNById(vendorId, grnId)
            .then(setGrn)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [vendorId, grnId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleConfirm = async () => {
        setConfirming(true);

        try {
            await confirmGRN(vendorId, grnId, userId);

            toastManager.add({
                title: "GRN confirmed successfully",
                type: "success",
            });

            load();
            onRefresh();
        } catch {
            toastManager.add({
                title: "Failed to confirm GRN",
                type: "error",
            });
        } finally {
            setConfirming(false);
        }
    };

    const hasRejectedItems = grn?.items.some((i) => Number(i.rejected_qty) > 0);

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/35" onClick={onClose} />

            <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-3xl flex-col border-l bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/40">
                            <ClipboardList size={18} />
                        </div>

                        <div>
                            <p className="text-base font-black">
                                {grn?.grn_no || "Loading GRN..."}
                            </p>

                            {grn && (
                                <div className="mt-1 flex items-center gap-2">
                                    <GRNStatusBadge status={grn.status} size="xs" />
                                    <span className="font-mono text-[11px] text-muted-foreground">
                                        {grn.purchaseOrder.po_no}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {grn?.status === "Draft" && (
                            <Button
                                size="sm"
                                onClick={handleConfirm}
                                disabled={confirming}
                                className="h-8 gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold hover:bg-emerald-700"
                            >
                                {confirming ? (
                                    <Loader2 size={13} className="animate-spin" />
                                ) : (
                                    <CheckCircle2 size={13} />
                                )}
                                Confirm
                            </Button>
                        )}

                        {grn?.status === "Confirmed" && hasRejectedItems && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDcnModal(true)}
                                className="h-8 gap-1.5 rounded-xl border-indigo-200 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                            >
                                <FileText size={13} />
                                Raise Note
                            </Button>
                        )}

                        <button
                            onClick={onClose}
                            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-2xl" />
                            ))}
                        </div>
                    ) : !grn ? null : (
                        <div className="space-y-4">
                            <SectionCard title="GRN Overview">
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        {
                                            label: "Supplier",
                                            value: grn.companyVendor.company_name,
                                        },
                                        {
                                            label: "Received On",
                                            value: fmtDate(grn.received_date),
                                        },
                                        {
                                            label: "Invoice No",
                                            value: grn.invoice_no || "—",
                                        },
                                        {
                                            label: "Vehicle No",
                                            value: grn.vehicle_no || "—",
                                        },
                                        {
                                            label: "Gate Entry",
                                            value: grn.gate_entry_no || "—",
                                        },
                                        {
                                            label: "Confirmed By",
                                            value: grn.confirmedBy?.user_name || "—",
                                        },
                                        {
                                            label: "E-Way Bill No",
                                            value: (grn as any).eway_bill_no || "—",
                                        },
                                        {
                                            label: "Transporter",
                                            value: (grn as any).transporter_name || "—",
                                        },
                                        {
                                            label: "LR No",
                                            value: (grn as any).lr_no || "—",
                                        },
                                        {
                                            label: "LR Date",
                                            value: (grn as any).lr_date
                                                ? fmtDate((grn as any).lr_date)
                                                : "—",
                                        },
                                    ].map((x) => (
                                        <div
                                            key={x.label}
                                            className="rounded-xl border bg-muted/20 p-3"
                                        >
                                            <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                                                {x.label}
                                            </p>
                                            <p className="mt-1 text-sm font-bold">{x.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>

                            <GRNFinancialSection grn={grn} />

                            <SectionCard
                                title={`Received Items (${grn.items.length})`}
                                description="Accepted, rejected and redelivery information."
                            >
                                <GRNItemsSection grn={grn} onRedelivery={setRdItem} />
                            </SectionCard>

                            {grn.debitCreditNotes.length > 0 && (
                                <SectionCard title="Debit / Credit Notes">
                                    <div className="space-y-2">
                                        {grn.debitCreditNotes.map((n) => (
                                            <div
                                                key={n.id}
                                                className="flex items-center justify-between rounded-xl border bg-muted/20 px-3 py-2"
                                            >
                                                <div>
                                                    <p className="font-mono text-xs font-black">
                                                        {n.note_no}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {n.type}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-sm font-black">
                                                        ₹{fmtN(n.amount)}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {n.status}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            )}

                            <SectionCard title="Timeline">
                                <GRNTimeline grn={grn} />
                            </SectionCard>
                        </div>
                    )}
                </div>
            </aside>

            {dcnModal && grn && (
                <DCNModal
                    grnId={grn.id}
                    vendorId={vendorId}
                    companyVendorId={grn.companyVendor.id}
                    userId={userId}
                    onClose={() => setDcnModal(false)}
                    onCreated={() => {
                        setDcnModal(false);
                        load();
                    }}
                />
            )}

            {rdItem && grn && (
                <RedeliveryModal
                    grnItemId={rdItem.id}
                    rejectedQty={rdItem.rejected}
                    vendorId={vendorId}
                    userId={userId}
                    companyVendorId={grn.companyVendor.id}
                    onClose={() => setRdItem(null)}
                    onCreated={() => {
                        setRdItem(null);
                        load();
                    }}
                />
            )}
        </>
    );
}
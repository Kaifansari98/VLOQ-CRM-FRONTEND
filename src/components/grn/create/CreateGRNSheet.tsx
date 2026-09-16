"use client";

import {
  GRNAdditionalAmountForm,
  GRNAdditionalAmountState,
} from "./GRNAdditionalAmountForm";

import {
  CreateGRNItemPayload,
  POPrefill,
  createGRN,
  getPOForGRN,
} from "@/api/grn/grn";
import { listPurchaseOrders } from "@/api/purchaseOrder/purchaseOrder";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Building2,
  ClipboardList,
  Loader2,
  PackageSearch,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SectionCard } from "../shared/SectionCard";
import { fmtN, inputBase, today } from "../shared/statusUtils";
import { GRNFinancialSummary } from "./GRNFinancialSummary";
import { GRNItemsEditor, GRNCreateRow } from "./GRNItemsEditor";
import { GRNMetaForm, GRNMetaState } from "./GRNMetaForm";

export function CreateGRNSheet({
  vendorId,
  userId,
  initialPoId,
  onClose,
  onCreated,
}: {
  vendorId: number;
  userId: number;
  initialPoId?: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [poInput, setPoInput] = useState(
    initialPoId ? String(initialPoId) : "",
  );
  const [poData, setPoData] = useState<POPrefill | null>(null);
  const [poLoading, setPoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [meta, setMeta] = useState<GRNMetaState>({
    received_date: today(),
    vehicle_no: "",
    gate_entry_no: "",
    invoice_no: "",
    invoice_date: "",
    invoice_amount: "",
    remarks: "",
  });

  const [amountInfo, setAmountInfo] = useState<GRNAdditionalAmountState>({
    discount_amount: "",
    packing_amount: "",
    freight_amount: "",
    other_charges_amount: "",
    roundoff_amount: "",
    cess_amount: "",
    eway_bill_no: "",
    transporter_name: "",
    lr_no: "",
    lr_date: "",
  });

  const numOrUndefined = (value: string) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return Number(value);
  };

  const strOrUndefined = (value: string) => {
    if (!value || !value.trim()) return undefined;
    return value.trim();
  };
  const [rows, setRows] = useState<Record<number, GRNCreateRow>>({});

  useEffect(() => {
    if (initialPoId) {
      loadPO();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPO = async () => {
    const raw = poInput.trim();
    if (!raw) return;

    let poId: number;

    setPoLoading(true);

    try {
      if (/^\d+$/.test(raw)) {
        poId = Number(raw);
      } else {
        const res = await listPurchaseOrders(vendorId, {
          search: raw,
          status: "Approved",
        });

        const found = res.purchase_orders.find(
          (p) => p.po_no.toLowerCase() === raw.toLowerCase(),
        );

        if (!found) {
          toastManager.add({
            title: `PO "${raw}" not found or not Approved`,
            type: "error",
          });
          return;
        }

        poId = found.id;
      }

      const data = await getPOForGRN(vendorId, poId);

      if (!["Approved", "PartiallyReceived"].includes(data.status)) {
        toastManager.add({
          title: `PO is ${data.status}. Only Approved or Partially Received POs can have GRNs created.`,
          type: "error",
        });
        return;
      }

      setPoData(data);

      const init: Record<number, GRNCreateRow> = {};

      for (const item of data.items) {
        init[item.id] = {
          received_qty: String(
            item.remaining_qty > 0 ? item.remaining_qty : "",
          ),
          accepted_qty: String(
            item.remaining_qty > 0 ? item.remaining_qty : "",
          ),
          rejected_qty: "0",
          rejection_reason: "",
          unit_price: item.unit_price
            ? String(parseFloat(item.unit_price))
            : "",
        };
      }

      setRows(init);
    } catch {
      toastManager.add({
        title: "PO not found or not available for GRN",
        type: "error",
      });
    } finally {
      setPoLoading(false);
    }
  };

  const updateRow = (id: number, field: keyof GRNCreateRow, value: string) => {
    setRows((p) => ({
      ...p,
      [id]: {
        ...p[id],
        [field]: value,
      },
    }));
  };

  const autoCalc = (
    id: number,
    field: "accepted_qty" | "rejected_qty",
    value: string,
  ) => {
    const received = Number(rows[id]?.received_qty || 0);

    if (field === "accepted_qty") {
      updateRow(id, "accepted_qty", value);
      updateRow(
        id,
        "rejected_qty",
        String(Math.max(0, received - Number(value || 0))),
      );
    } else {
      updateRow(id, "rejected_qty", value);
      updateRow(
        id,
        "accepted_qty",
        String(Math.max(0, received - Number(value || 0))),
      );
    }
  };

  const handleSubmit = async () => {
    if (!poData) return;

    const items: CreateGRNItemPayload[] = poData.items
      .filter((item) => rows[item.id] && Number(rows[item.id].received_qty) > 0)
      .map((item) => ({
        purchase_order_item_id: item.id,
        po_item_id: item.id,
        product_id: item.product.id,
        received_qty: Number(rows[item.id].received_qty),
        accepted_qty: Number(rows[item.id].accepted_qty),
        rejected_qty: Number(rows[item.id].rejected_qty || 0),
        unit_price: rows[item.id].unit_price
          ? Number(rows[item.id].unit_price)
          : undefined,
        uom: item.uom ?? item.product.unit_of_measure ?? undefined,
        rejection_reason: rows[item.id].rejection_reason || undefined,
      }));

    if (!items.length) {
      toastManager.add({
        title: "Enter received qty for at least one item",
        type: "error",
      });
      return;
    }

    for (const item of items) {
      if (
        Math.round((item.accepted_qty + item.rejected_qty) * 1000) !==
        Math.round(item.received_qty * 1000)
      ) {
        toastManager.add({
          title: "Accepted + Rejected must equal Received qty",
          type: "error",
        });
        return;
      }

      if (item.rejected_qty > 0 && !item.rejection_reason) {
        toastManager.add({
          title: "Rejection reason is required for rejected items",
          type: "error",
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      await createGRN(vendorId, {
        user_id: userId,
        purchase_order_id: poData.id,
        company_vendor_id: poData.companyVendor.id,

        received_date: meta.received_date,
        vehicle_no: strOrUndefined(meta.vehicle_no),
        gate_entry_no: strOrUndefined(meta.gate_entry_no),
        invoice_no: strOrUndefined(meta.invoice_no),
        invoice_date: meta.invoice_date || undefined,
        invoice_amount: numOrUndefined(meta.invoice_amount || ""),
        remarks: strOrUndefined(meta.remarks),

        discount_amount: numOrUndefined(amountInfo.discount_amount),
        packing_amount: numOrUndefined(amountInfo.packing_amount),
        freight_amount: numOrUndefined(amountInfo.freight_amount),
        other_charges_amount: numOrUndefined(amountInfo.other_charges_amount),
        roundoff_amount: numOrUndefined(amountInfo.roundoff_amount),
        cess_amount: numOrUndefined(amountInfo.cess_amount),

        eway_bill_no: strOrUndefined(amountInfo.eway_bill_no),
        transporter_name: strOrUndefined(amountInfo.transporter_name),
        lr_no: strOrUndefined(amountInfo.lr_no),
        lr_date: amountInfo.lr_date || undefined,

        items,
      });

      toastManager.add({
        title: "GRN created successfully",
        type: "success",
      });

      onCreated();
    } catch (e: any) {
      toastManager.add({
        title: e?.response?.data?.message ?? "Failed to create GRN",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-5xl flex-col border-l bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/40">
              <ClipboardList size={18} />
            </div>

            <div>
              <p className="text-base font-black">Create Goods Receipt Note</p>
              <p className="text-xs text-muted-foreground">
                Receive material against approved purchase order.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-4">
            <SectionCard
              title="Purchase Order Lookup"
              description="Search by PO ID or PO number."
              icon={<PackageSearch size={16} />}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                    PO ID / PO No *
                  </label>

                  <input
                    value={poInput}
                    onChange={(e) => setPoInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadPO()}
                    placeholder="Example: 12 or PO-000001"
                    className={`${inputBase} mt-1`}
                  />
                </div>

                <Button
                  onClick={loadPO}
                  disabled={poLoading}
                  className="h-9 rounded-xl bg-indigo-600 text-xs font-bold hover:bg-indigo-700"
                >
                  {poLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Load PO"
                  )}
                </Button>
              </div>

              {poData && (
                <div className="mt-4 rounded-2xl border bg-indigo-50/60 p-4 dark:bg-indigo-950/20">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white p-2 text-indigo-600 shadow-sm dark:bg-background">
                      <Building2 size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-black">
                        {poData.companyVendor.company_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {poData.companyVendor.vendor_code} · PO:{" "}
                        <span className="font-mono">{poData.po_no}</span> ·{" "}
                        {poData.items.length} items · Previous GRNs:{" "}
                        {fmtN(poData.grns.length)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {poData && (
              <>
                <SectionCard
                  title="GRN Details"
                  description="Invoice, vehicle, gate entry and receiving information."
                >
                  <GRNMetaForm meta={meta} setMeta={setMeta} />
                </SectionCard>

                <SectionCard
                  title="Item Receiving"
                  description="Enter received, accepted and rejected quantities."
                >
                  <GRNItemsEditor
                    items={poData.items}
                    rows={rows}
                    updateRow={updateRow}
                    autoCalc={autoCalc}
                  />
                </SectionCard>
                <SectionCard
                  title="Additional Amount Information"
                  description="Capture freight, packing, discounts, other charges and transport details."
                >
                  <GRNAdditionalAmountForm
                    amountInfo={amountInfo}
                    setAmountInfo={setAmountInfo}
                  />
                </SectionCard>

                <GRNFinancialSummary
                  poData={poData}
                  rows={rows}
                  amountInfo={amountInfo}
                />
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-background px-5 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl"
          >
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !poData}
            className={cn(
              "rounded-xl bg-indigo-600 font-bold hover:bg-indigo-700",
              "gap-1.5",
            )}
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {submitting ? "Creating..." : "Create GRN"}
          </Button>
        </div>
      </aside>
    </>
  );
}

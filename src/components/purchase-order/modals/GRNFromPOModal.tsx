"use client";

import { createGRN, getPOById } from "@/api/purchaseOrder/purchaseOrder";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { Loader2, PackageCheck, ReceiptText, Truck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  vendorId: number;
  userId: number;
  poId: number;
  onClose: () => void;
  onCreated: () => void;
};

type POItem = {
  id: number;
  ordered_qty: string;
  received_qty?: string | null;
  rate?: string | null;
  unit_price?: string | null;
  total_amount?: string | null;
  product: {
    id: number;
    product_name: string;
    article_code?: string | null;
    unit_of_measure?: string | null;
  };
};

const toNum = (v: any) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const money = (v: number) =>
  `₹${v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const inputClass =
  "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300";

export function GRNFromPOModal({
  vendorId,
  userId,
  poId,
  onClose,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<POItem[]>([]);

  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [transportName, setTransportName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [remarks, setRemarks] = useState("");

  const [rows, setRows] = useState<
    Record<
      number,
      {
        received_qty: string;
        accepted_qty: string;
        rejected_qty: string;
        rejection_reason: string;
      }
    >
  >({});

  useEffect(() => {
    setLoading(true);

    getPOById(vendorId, poId)
      .then((po: any) => {
        const poItems = po.items || [];

        setItems(poItems);

        const initial: any = {};

        poItems.forEach((item: POItem) => {
          const pending = Math.max(
            0,
            toNum(item.ordered_qty) - toNum(item.received_qty)
          );

          initial[item.id] = {
            received_qty: pending ? String(pending) : "",
            accepted_qty: pending ? String(pending) : "",
            rejected_qty: "0",
            rejection_reason: "",
          };
        });

        setRows(initial);
      })
      .catch(() => {
        toastManager.add({
          title: "Failed to load PO items",
          type: "error",
        });
        onClose();
      })
      .finally(() => setLoading(false));
  }, [vendorId, poId, onClose]);

  const updateRow = (
    itemId: number,
    key: string,
    value: string
  ) => {
    setRows((prev) => {
      const next = {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [key]: value,
        },
      };

      const row = next[itemId];

      const received = toNum(row.received_qty);

      if (key === "received_qty") {
        row.accepted_qty = String(received);
        row.rejected_qty = "0";
      }

      if (key === "accepted_qty") {
        const accepted = toNum(value);
        row.rejected_qty = String(Math.max(0, received - accepted));
      }

      if (key === "rejected_qty") {
        const rejected = toNum(value);
        row.accepted_qty = String(Math.max(0, received - rejected));
      }

      return next;
    });
  };

  const summary = useMemo(() => {
    let received = 0;
    let accepted = 0;
    let rejected = 0;
    let total = 0;

    items.forEach((item) => {
      const row = rows[item.id];
      if (!row) return;

      const r = toNum(row.received_qty);
      const a = toNum(row.accepted_qty);
      const rate = toNum(item.rate ?? item.unit_price);

      received += r;
      accepted += a;
      rejected += toNum(row.rejected_qty);
      total += a * rate;
    });

    return {
      received,
      accepted,
      rejected,
      total,
    };
  }, [items, rows]);

  const submit = async () => {
    const validItems = items
      .map((item) => ({
        purchase_order_item_id: item.id,
        product_id: item.product.id,
        received_qty: toNum(rows[item.id]?.received_qty),
        accepted_qty: toNum(rows[item.id]?.accepted_qty),
        rejected_qty: toNum(rows[item.id]?.rejected_qty),
        rejection_reason:
          rows[item.id]?.rejection_reason || undefined,
      }))
      .filter((i) => i.received_qty > 0);

    if (!validItems.length) {
      toastManager.add({
        title: "Enter received qty",
        type: "warning",
      });
      return;
    }

    for (const item of validItems) {
      if (
        item.rejected_qty > 0 &&
        !item.rejection_reason
      ) {
        toastManager.add({
          title: "Rejection reason required",
          type: "warning",
        });
        return;
      }
    }

    setSaving(true);

    try {
      await createGRN(vendorId, {
        user_id: userId,
        purchase_order_id: poId,
        received_date: receivedDate,
        invoice_no: invoiceNo || undefined,
        invoice_date: invoiceDate || undefined,
        transport_name: transportName || undefined,
        vehicle_no: vehicleNo || undefined,
        challan_no: challanNo || undefined,
        remarks: remarks || undefined,
        items: validItems,
      });

      toastManager.add({
        title: "GRN created successfully",
        type: "success",
      });

      onCreated();
    } catch (err: any) {
      toastManager.add({
        title:
          err?.response?.data?.message ||
          "Failed to create GRN",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <PackageCheck size={20} />
            </div>

            <div>
              <p className="text-lg font-black">
                Create GRN
              </p>
              <p className="text-xs text-muted-foreground">
                Record received material against PO
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* top */}
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                <Field label="Received Date *">
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) =>
                      setReceivedDate(e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Invoice No">
                  <input
                    value={invoiceNo}
                    onChange={(e) =>
                      setInvoiceNo(e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Invoice Date">
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) =>
                      setInvoiceDate(e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Transport">
                  <input
                    value={transportName}
                    onChange={(e) =>
                      setTransportName(e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Vehicle No">
                  <input
                    value={vehicleNo}
                    onChange={(e) =>
                      setVehicleNo(e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Challan No">
                  <input
                    value={challanNo}
                    onChange={(e) =>
                      setChallanNo(e.target.value)
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              {/* items */}
              <div className="space-y-4">
                {items.map((item) => {
                  const row = rows[item.id];
                  const rate = toNum(
                    item.rate ?? item.unit_price
                  );
                  const accepted = toNum(
                    row?.accepted_qty
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl border p-5"
                    >
                      <div className="mb-4">
                        <p className="font-black">
                          {item.product.product_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ordered: {item.ordered_qty}{" "}
                          {item.product.unit_of_measure}
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <Field label="Received Qty">
                          <input
                            type="number"
                            value={row?.received_qty || ""}
                            onChange={(e) =>
                              updateRow(
                                item.id,
                                "received_qty",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Accepted Qty">
                          <input
                            type="number"
                            value={row?.accepted_qty || ""}
                            onChange={(e) =>
                              updateRow(
                                item.id,
                                "accepted_qty",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Rejected Qty">
                          <input
                            type="number"
                            value={row?.rejected_qty || ""}
                            onChange={(e) =>
                              updateRow(
                                item.id,
                                "rejected_qty",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Accepted Value">
                          <div className="flex h-10 items-center rounded-xl border bg-muted px-3 font-bold text-emerald-600">
                            {money(accepted * rate)}
                          </div>
                        </Field>
                      </div>

                      {toNum(row?.rejected_qty) > 0 && (
                        <div className="mt-3">
                          <Field label="Rejection Reason *">
                            <textarea
                              rows={2}
                              value={
                                row?.rejection_reason || ""
                              }
                              onChange={(e) =>
                                updateRow(
                                  item.id,
                                  "rejection_reason",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Field label="Remarks">
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) =>
                    setRemarks(e.target.value)
                  }
                  className="w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </Field>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="shrink-0 border-t bg-muted/20 p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <SummaryCard
              label="Received"
              value={summary.received}
            />
            <SummaryCard
              label="Accepted"
              value={summary.accepted}
              green
            />
            <SummaryCard
              label="Rejected"
              value={summary.rejected}
              red
            />
            <SummaryCard
              label="Accepted Value"
              value={money(summary.total)}
              big
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              onClick={submit}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create GRN
            </Button>
          </div>
        </div>
      </div>
    </div>
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
      <label className="mb-1.5 block text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  green,
  red,
  big,
}: any) {
  return (
    <div className="rounded-2xl bg-background p-4">
      <p className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-black ${
          big
            ? "text-xl text-indigo-600"
            : green
            ? "text-emerald-600"
            : red
            ? "text-red-600"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
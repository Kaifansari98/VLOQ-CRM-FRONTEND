"use client";

import CustomeDatePicker from "@/components/date-picker";
import { inputBase } from "../shared/statusUtils";

export type GRNMetaState = {
  received_date: string;
  vehicle_no: string;
  gate_entry_no: string;
  invoice_no: string;
  invoice_date?: string;
  invoice_amount?: string;
  remarks: string;
};

export function GRNMetaForm({
  meta,
  setMeta,
}: {
  meta: GRNMetaState;
  setMeta: React.Dispatch<React.SetStateAction<GRNMetaState>>;
}) {
  const fields = [
    {
      key: "received_date",
      label: "Received Date *",
      type: "date",
    },
    {
      key: "vehicle_no",
      label: "Vehicle No",
      type: "text",
      placeholder: "e.g. MH04 AB 1234",
    },
    {
      key: "gate_entry_no",
      label: "Gate Entry No",
      type: "text",
      placeholder: "e.g. GE-9021",
    },
    {
      key: "invoice_no",
      label: "Invoice No",
      type: "text",
      placeholder: "e.g. INV-2026-001",
    },
    {
      key: "invoice_date",
      label: "Invoice Date",
      type: "date",
    },
    {
      key: "invoice_amount",
      label: "Invoice Amount",
      type: "number",
      placeholder: "0.00",
    },
    {
      key: "remarks",
      label: "Remarks",
      type: "text",
      placeholder: "Optional notes",
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            {f.label}
          </label>

          {f.type === "date" ? (
            <CustomeDatePicker
              value={(meta as any)[f.key] || ""}
              onChange={(val) =>
                setMeta((p) => ({
                  ...p,
                  [f.key]: val || "",
                }))
              }
              dateFormat="dd MMM yyyy"
              placeholder={`Select ${f.label.replace("*", "").trim()}`}
              className="h-9 rounded-lg border bg-background text-xs"
            />
          ) : (
            <input
              type={f.type}
              value={(meta as any)[f.key] || ""}
              onChange={(e) =>
                setMeta((p) => ({
                  ...p,
                  [f.key]: e.target.value,
                }))
              }
              placeholder={f.placeholder}
              className={`${inputBase}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
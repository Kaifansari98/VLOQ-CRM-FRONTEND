"use client";

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
    },
    {
      key: "gate_entry_no",
      label: "Gate Entry No",
      type: "text",
    },
    {
      key: "invoice_no",
      label: "Invoice No",
      type: "text",
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
    },
    {
      key: "remarks",
      label: "Remarks",
      type: "text",
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
            {f.label}
          </label>

          <input
            type={f.type}
            value={(meta as any)[f.key] || ""}
            onChange={(e) =>
              setMeta((p) => ({
                ...p,
                [f.key]: e.target.value,
              }))
            }
            className={`${inputBase} mt-1`}
          />
        </div>
      ))}
    </div>
  );
}
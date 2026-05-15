"use client";

import { inputBase } from "../shared/statusUtils";

export type GRNAdditionalAmountState = {
  discount_amount: string;
  packing_amount: string;
  freight_amount: string;
  other_charges_amount: string;
  roundoff_amount: string;
  cess_amount: string;
  eway_bill_no: string;
  transporter_name: string;
  lr_no: string;
  lr_date: string;
};

export function GRNAdditionalAmountForm({
  amountInfo,
  setAmountInfo,
}: {
  amountInfo: GRNAdditionalAmountState;
  setAmountInfo: React.Dispatch<React.SetStateAction<GRNAdditionalAmountState>>;
}) {
  const amountFields = [
    {
      key: "discount_amount",
      label: "Discount Amount",
      type: "number",
      placeholder: "0.00",
    },
    {
      key: "packing_amount",
      label: "Packing Amount",
      type: "number",
      placeholder: "0.00",
    },
    {
      key: "freight_amount",
      label: "Freight Amount",
      type: "number",
      placeholder: "0.00",
    },
    {
      key: "other_charges_amount",
      label: "Other Charges",
      type: "number",
      placeholder: "0.00",
    },
    {
      key: "cess_amount",
      label: "CESS Amount",
      type: "number",
      placeholder: "0.00",
    },
    {
      key: "roundoff_amount",
      label: "Round Off",
      type: "number",
      placeholder: "0.00",
    },
  ] as const;

  const transportFields = [
    {
      key: "eway_bill_no",
      label: "E-Way Bill No",
      type: "text",
      placeholder: "Enter e-way bill no",
    },
    {
      key: "transporter_name",
      label: "Transporter Name",
      type: "text",
      placeholder: "Enter transporter",
    },
    {
      key: "lr_no",
      label: "LR No",
      type: "text",
      placeholder: "Enter LR no",
    },
    {
      key: "lr_date",
      label: "LR Date",
      type: "date",
      placeholder: "",
    },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-black">Additional Amounts</p>
            <p className="text-xs text-muted-foreground">
              Add discount, freight, packing, cess and round-off values.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {amountFields.map((field) => (
            <div key={field.key}>
              <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                {field.label}
              </label>

              <input
                type={field.type}
                min="0"
                value={amountInfo[field.key]}
                placeholder={field.placeholder}
                onChange={(e) =>
                  setAmountInfo((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className={`${inputBase} mt-1`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-5">
        <div className="mb-3">
          <p className="text-sm font-black">Transport Details</p>
          <p className="text-xs text-muted-foreground">
            Optional dispatch and logistics information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {transportFields.map((field) => (
            <div key={field.key}>
              <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                {field.label}
              </label>

              <input
                type={field.type}
                value={amountInfo[field.key]}
                placeholder={field.placeholder}
                onChange={(e) =>
                  setAmountInfo((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className={`${inputBase} mt-1`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
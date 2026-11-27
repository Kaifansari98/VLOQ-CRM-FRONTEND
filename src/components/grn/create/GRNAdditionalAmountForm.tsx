"use client";

import CustomeDatePicker from "@/components/date-picker";
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
      placeholder: "e.g. 1234 5678 9012",
    },
    {
      key: "transporter_name",
      label: "Transporter Name",
      type: "text",
      placeholder: "e.g. Blue Dart Logistics",
    },
    {
      key: "lr_no",
      label: "LR No",
      type: "text",
      placeholder: "e.g. LR-40912",
    },
    {
      key: "lr_date",
      label: "LR Date",
      type: "date",
      placeholder: "Select LR date",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3">
          <p className="text-sm font-semibold text-foreground">Additional Amounts</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add discount, freight, packing, cess and round-off values.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {amountFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
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
                className={inputBase}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-5">
        <div className="mb-3">
          <p className="text-sm font-semibold text-foreground">Transport Details</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Optional dispatch and logistics information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {transportFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                {field.label}
              </label>

              {field.type === "date" ? (
                <CustomeDatePicker
                  value={amountInfo.lr_date}
                  onChange={(val) =>
                    setAmountInfo((prev) => ({
                      ...prev,
                      lr_date: val || "",
                    }))
                  }
                  dateFormat="dd MMM yyyy"
                  placeholder="Select LR date"
                  className="h-9 rounded-lg border bg-background text-xs"
                />
              ) : (
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
                  className={inputBase}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
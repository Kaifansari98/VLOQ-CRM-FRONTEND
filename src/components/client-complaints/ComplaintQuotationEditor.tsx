"use client";

import { useState, type CSSProperties } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ComplaintQuotationItemInput } from "@/api/client-complaints";
import type { ComplaintDetails } from "@/types/complaint-details";
import { Field, rupees } from "./complaint-action-ui";
import { WorkflowDialog } from "./ComplaintWorkflowDialogs";

// Spec 13.1 particulars. The visiting charge is billed separately, never here.
const CATEGORIES: [string, string][] = [
  ["MATERIAL", "Material"],
  ["HARDWARE", "Hardware"],
  ["LABOUR", "Labour"],
  ["TRANSPORTATION", "Transportation"],
  ["OTHER", "Other"],
];

type Line = {
  category: string;
  description: string;
  quantity: string;
  unit: string;
  unit_rate: string;
  warranty_covered_amount: string;
  chargeable_reason: string;
};
const emptyLine: Line = {
  category: "MATERIAL",
  description: "",
  quantity: "1",
  unit: "",
  unit_rate: "",
  warranty_covered_amount: "0",
  chargeable_reason: "",
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export function ComplaintQuotationEditor({
  complaint: c,
  vendorId,
  brandStyle,
  onClose,
}: {
  complaint: ComplaintDetails;
  vendorId: number;
  brandStyle: CSSProperties;
  onClose: () => void;
}) {
  const perms = c.permissions.quotation!;
  const source = c.quotations.find((q) => q.id === perms.edit_from_id);
  const underWarranty =
    c.warranty_status === "COVERED" ||
    c.warranty_status === "PARTIALLY_COVERED";
  const [lines, setLines] = useState<Line[]>(
    source?.items.length
      ? source.items.map((i) => ({
          category: i.category,
          description: i.description,
          quantity: String(Number(i.quantity)),
          unit: i.unit ?? "",
          unit_rate: String(Number(i.unit_rate)),
          warranty_covered_amount: String(Number(i.warranty_covered_amount)),
          chargeable_reason: i.chargeable_reason ?? "",
        }))
      : [{ ...emptyLine }],
  );
  const [tax, setTax] = useState(
    source ? String(Number(source.tax_amount)) : "0",
  );
  const [submit, setSubmit] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const computed = lines.map((l) => {
    const total = round2(
      (Number(l.quantity) || 0) * (Number(l.unit_rate) || 0),
    );
    const covered = underWarranty ? Number(l.warranty_covered_amount) || 0 : 0;
    return { total, covered, payable: round2(total - covered) };
  });
  const subtotal = round2(computed.reduce((t, l) => t + l.total, 0));
  const covered = round2(computed.reduce((t, l) => t + l.covered, 0));
  const taxValue = Number(tax) || 0;
  const payable = round2(subtotal + taxValue - covered);

  const update = (i: number, key: keyof Line, value: string) =>
    setLines((prev) =>
      prev.map((row, j) => (j === i ? { ...row, [key]: value } : row)),
    );

  const build = () => {
    const next: Record<string, string> = {};
    lines.forEach((l, i) => {
      const { total, covered: cov, payable: pay } = computed[i];
      if (!l.description.trim()) next[`line_${i}`] = "Enter a description.";
      else if (!(Number(l.quantity) > 0))
        next[`line_${i}`] = "Quantity must be above 0.";
      else if (l.unit_rate === "" || Number(l.unit_rate) < 0)
        next[`line_${i}`] = "Enter the rate.";
      else if (cov > total)
        next[`line_${i}`] = "Warranty-covered amount exceeds the line total.";
      else if (underWarranty && pay > 0 && !l.chargeable_reason.trim())
        next[`line_${i}`] =
          "Give the reason this amount is charged to the client.";
    });
    if (taxValue < 0) next.tax = "Taxes cannot be negative.";
    setErrors(next);
    if (Object.keys(next).length) return null;
    const items: ComplaintQuotationItemInput[] = lines.map((l, i) => ({
      category: l.category,
      description: l.description.trim(),
      quantity: Number(l.quantity),
      unit: l.unit.trim() || undefined,
      unit_rate: Number(l.unit_rate),
      warranty_covered_amount: computed[i].covered,
      chargeable_reason: l.chargeable_reason.trim() || undefined,
    }));
    return {
      kind: "saveQuotation" as const,
      version: c.version,
      items,
      tax_amount: taxValue,
      submit,
    };
  };

  return (
    <WorkflowDialog
      title={
        source && source.status !== "DRAFT"
          ? `Revise Quotation Q${source.quotation_number}`
          : "Quotation"
      }
      description="Material and repair charges only. The visiting charge stays separate and is never deducted here."
      brandStyle={brandStyle}
      vendorId={vendorId}
      complaintId={c.id}
      build={build}
      onClose={onClose}
      confirmLabel={submit ? "Submit for Approval" : "Save Draft"}
      wide
    >
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border p-2.5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_2fr_0.6fr_0.6fr_0.9fr_auto]">
              <Select
                value={l.category}
                onValueChange={(v) => update(i, "category", v)}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Description"
                value={l.description}
                onChange={(e) => update(i, "description", e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                placeholder="Qty"
                type="number"
                min={0}
                value={l.quantity}
                onChange={(e) => update(i, "quantity", e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                placeholder="Unit"
                value={l.unit}
                onChange={(e) => update(i, "unit", e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                placeholder="Rate ₹"
                type="number"
                min={0}
                value={l.unit_rate}
                onChange={(e) => update(i, "unit_rate", e.target.value)}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={lines.length === 1}
                onClick={() =>
                  setLines((prev) => prev.filter((_, j) => j !== i))
                }
                title="Remove line"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">
                Line total {rupees(computed[i].total)}
              </span>
              {underWarranty && (
                <>
                  <span className="text-muted-foreground">
                    · Warranty covered ₹
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={l.warranty_covered_amount}
                    onChange={(e) =>
                      update(i, "warranty_covered_amount", e.target.value)
                    }
                    className="h-7 w-24 text-xs"
                  />
                  <span className="text-muted-foreground">
                    · Client pays {rupees(computed[i].payable)}
                  </span>
                  {computed[i].payable > 0 && (
                    <Input
                      placeholder="Reason for charging the client"
                      value={l.chargeable_reason}
                      onChange={(e) =>
                        update(i, "chargeable_reason", e.target.value)
                      }
                      className="h-7 min-w-48 flex-1 text-xs"
                    />
                  )}
                </>
              )}
            </div>
            {errors[`line_${i}`] && (
              <p className="text-[11px] font-medium text-destructive">
                {errors[`line_${i}`]}
              </p>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-[11px]"
          onClick={() => setLines((prev) => [...prev, { ...emptyLine }])}
        >
          <Plus className="size-3" /> Add line
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
        <Field label="Applicable taxes (₹)" error={errors.tax}>
          <Input
            type="number"
            min={0}
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
        <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/30 p-3 text-xs">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-right">{rupees(subtotal)}</span>
          <span className="text-muted-foreground">Taxes</span>
          <span className="text-right">{rupees(taxValue)}</span>
          {underWarranty && (
            <>
              <span className="text-muted-foreground">Warranty covered</span>
              <span className="text-right">− {rupees(covered)}</span>
            </>
          )}
          <span className="font-semibold">Client payable</span>
          <span className="text-right font-semibold">{rupees(payable)}</span>
        </div>
      </div>
      {!underWarranty && (
        <p className="text-[11px] text-muted-foreground">
          Record a warranty decision of covered or partially covered to mark
          items as warranty covered.
        </p>
      )}
      <label className="flex items-center gap-2 text-xs">
        <Checkbox
          checked={submit}
          onCheckedChange={(v) => setSubmit(v === true)}
        />
        Submit for department-head approval now
      </label>
    </WorkflowDialog>
  );
}

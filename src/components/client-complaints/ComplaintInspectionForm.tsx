"use client";

import { useState, type CSSProperties } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomeDatePicker from "@/components/date-picker";
import { cn } from "@/lib/utils";
import type { ComplaintInspectionInput } from "@/api/client-complaints";
import type { ComplaintDetails } from "@/types/complaint-details";
import { Field } from "./complaint-action-ui";
import {
  DOC_ACCEPT,
  FilesField,
  PHOTO_ACCEPT,
  todayLocal,
  VIDEO_ACCEPT,
  WorkflowDialog,
} from "./ComplaintWorkflowDialogs";

// Spec 12 responsibility classification and adjustment / repair options.
const RESPONSIBILITY: [string, string][] = [
  ["MANUFACTURING", "Shambhala Manufacturing"],
  ["INSTALLATION_TEAM", "Installation Team"],
  ["HARDWARE_VENDOR", "Hardware / Vendor"],
  ["MATERIAL_DEFECT", "Material Defect"],
  ["CLIENT_MISUSE", "Client Misuse / Damage"],
  ["CIVIL_SITE_CONDITION", "Civil / Site Condition"],
  ["WATER_MOISTURE_DAMAGE", "Water / Moisture Damage"],
  ["NORMAL_WEAR_AND_TEAR", "Normal Wear & Tear"],
  ["OUT_OF_WARRANTY", "Out of Warranty"],
  ["OTHER", "Other"],
];

const REPAIR_ACTIONS: [string, string][] = [
  ["HARDWARE_REPLACEMENT", "Hardware Replacement"],
  ["SHUTTER_REPLACEMENT", "Shutter Replacement"],
  ["CARCASS_PANEL_REPLACEMENT", "Carcass / Panel Replacement"],
  ["ACCESSORY_REPLACEMENT", "Accessory Replacement"],
  ["NEW_MATERIAL_REQUIRED", "New Material Required"],
  ["REMOTE_RESOLUTION", "Remote Resolution"],
  ["NO_ACTION_REQUIRED", "No Action Required"],
];

type Material = {
  material_name: string;
  quantity: string;
  unit: string;
  specification: string;
  finish_colour: string;
  estimated_cost: string;
};
const emptyMaterial: Material = {
  material_name: "",
  quantity: "1",
  unit: "",
  specification: "",
  finish_colour: "",
  estimated_cost: "",
};

export function ComplaintInspectionForm({
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
  const visit = c.permissions.inspection.report_visit!;
  const [form, setForm] = useState({
    actual_visit_date: visit.completed_at?.slice(0, 10) ?? todayLocal(),
    client_available: true,
    issue_observed: "",
    root_cause: "",
    affected_product: c.product_type ?? "",
    affected_unit_number: "",
    responsibility: "",
    responsibility_remarks: "",
    remarks: "",
    estimated_work_days: "",
    expected_completion_date: "",
    additional_visit_required: false,
    further_approval_required: false,
    material_required: false,
  });
  const [repairActions, setRepairActions] = useState<string[]>([]);
  const [materials, setMaterials] = useState<Material[]>([
    { ...emptyMaterial },
  ]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const build = () => {
    const next: Record<string, string> = {};
    const required: [keyof typeof form, string][] = [
      ["issue_observed", "Describe the issue observed."],
      ["root_cause", "Record the root cause."],
      ["affected_product", "Enter the affected product."],
      ["affected_unit_number", "Enter the affected unit number."],
    ];
    for (const [key, message] of required)
      if (!String(form[key]).trim()) next[key] = message;
    if (!form.actual_visit_date)
      next.actual_visit_date = "Pick the visit date.";
    if (!form.responsibility)
      next.responsibility = "Select who is responsible.";
    if (form.responsibility === "OTHER" && !form.responsibility_remarks.trim())
      next.responsibility_remarks = "Explain the responsibility.";
    if (!repairActions.length) next.repair_actions = "Select at least one.";
    if (form.material_required) {
      materials.forEach((m, i) => {
        if (!m.material_name.trim() || !(Number(m.quantity) > 0))
          next[`material_${i}`] =
            "Enter the material name and a quantity above 0.";
      });
    }
    if (!photos.length) next.photos = "Add at least one damage photograph.";
    setErrors(next);
    if (Object.keys(next).length) return null;

    const optional = (v: string) => v.trim() || undefined;
    const fields: ComplaintInspectionInput = {
      visit_id: visit.id,
      actual_visit_date: form.actual_visit_date,
      client_available: form.client_available,
      issue_observed: form.issue_observed.trim(),
      root_cause: form.root_cause.trim(),
      affected_product: form.affected_product.trim(),
      affected_unit_number: form.affected_unit_number.trim(),
      responsibility: form.responsibility,
      responsibility_remarks: optional(form.responsibility_remarks),
      repair_actions: repairActions,
      material_required: form.material_required,
      materials: form.material_required
        ? materials.map((m) => ({
            material_name: m.material_name.trim(),
            quantity: Number(m.quantity),
            unit: optional(m.unit),
            specification: optional(m.specification),
            finish_colour: optional(m.finish_colour),
            estimated_cost: m.estimated_cost
              ? Number(m.estimated_cost)
              : undefined,
          }))
        : [],
      remarks: optional(form.remarks),
      estimated_work_days: form.estimated_work_days
        ? Number(form.estimated_work_days)
        : undefined,
      expected_completion_date: form.expected_completion_date || undefined,
      additional_visit_required: form.additional_visit_required,
      further_approval_required: form.further_approval_required,
    };
    return {
      kind: "inspection" as const,
      version: c.version,
      fields,
      photos,
      videos,
      documents,
    };
  };

  const textArea = (
    key: "issue_observed" | "root_cause" | "remarks",
    label: string,
  ) => (
    <Field label={label} error={errors[key]}>
      <Textarea
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        rows={2}
        className="text-xs"
      />
    </Field>
  );

  return (
    <WorkflowDialog
      title={`Site Inspection Report · Visit ${visit.visit_number}`}
      description="Submitted before the complaint can move to quotation or resolution."
      brandStyle={brandStyle}
      vendorId={vendorId}
      complaintId={c.id}
      build={build}
      onClose={onClose}
      confirmLabel="Submit Inspection"
      wide
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Actual visit date" error={errors.actual_visit_date}>
          <CustomeDatePicker
            value={form.actual_visit_date}
            onChange={(v) => set("actual_visit_date", v ?? "")}
            restriction="pastOnly"
          />
        </Field>
        <Field label="Affected product" error={errors.affected_product}>
          <Input
            value={form.affected_product}
            onChange={(e) => set("affected_product", e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
        <Field label="Affected unit number" error={errors.affected_unit_number}>
          <Input
            value={form.affected_unit_number}
            onChange={(e) => set("affected_unit_number", e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-xs">
        <Checkbox
          checked={form.client_available}
          onCheckedChange={(v) => set("client_available", v === true)}
        />
        Client was available during the visit
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {textArea("issue_observed", "Issue observed")}
        {textArea("root_cause", "Root cause")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Responsibility" error={errors.responsibility}>
          <Select
            value={form.responsibility}
            onValueChange={(v) => set("responsibility", v)}
          >
            <SelectTrigger className="h-9 w-full text-xs">
              <SelectValue placeholder="Select classification" />
            </SelectTrigger>
            <SelectContent>
              {RESPONSIBILITY.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label={`Responsibility remarks${form.responsibility === "OTHER" ? "" : " (optional)"}`}
          error={errors.responsibility_remarks}
        >
          <Input
            value={form.responsibility_remarks}
            onChange={(e) => set("responsibility_remarks", e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
      </div>
      <Field label="Adjustment / repair" error={errors.repair_actions}>
        <div className="flex flex-wrap gap-2">
          {REPAIR_ACTIONS.map(([value, label]) => {
            const on = repairActions.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setRepairActions((prev) =>
                    on ? prev.filter((a) => a !== value) : [...prev, value],
                  )
                }
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  on
                    ? "border-foreground bg-muted/60"
                    : "text-muted-foreground hover:bg-muted/30",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Field>

      <label className="flex items-center gap-2 text-xs font-medium">
        <Checkbox
          checked={form.material_required}
          onCheckedChange={(v) => set("material_required", v === true)}
        />
        Material required
      </label>
      {form.material_required && (
        <div className="space-y-2 rounded-lg border p-3">
          {materials.map((m, i) => {
            const update = (key: keyof Material, value: string) =>
              setMaterials((prev) =>
                prev.map((row, j) =>
                  j === i ? { ...row, [key]: value } : row,
                ),
              );
            return (
              <div key={i} className="space-y-1">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-[2fr_0.7fr_0.7fr_1.2fr_1fr_0.9fr_auto]">
                  <Input
                    placeholder="Material name"
                    value={m.material_name}
                    onChange={(e) => update("material_name", e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Qty"
                    type="number"
                    min={0}
                    value={m.quantity}
                    onChange={(e) => update("quantity", e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Unit"
                    value={m.unit}
                    onChange={(e) => update("unit", e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Specification"
                    value={m.specification}
                    onChange={(e) => update("specification", e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Finish / colour"
                    value={m.finish_colour}
                    onChange={(e) => update("finish_colour", e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Est. cost ₹"
                    type="number"
                    min={0}
                    value={m.estimated_cost}
                    onChange={(e) => update("estimated_cost", e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={materials.length === 1}
                    onClick={() =>
                      setMaterials((prev) => prev.filter((_, j) => j !== i))
                    }
                    title="Remove line"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                {errors[`material_${i}`] && (
                  <p className="text-[11px] font-medium text-destructive">
                    {errors[`material_${i}`]}
                  </p>
                )}
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-[11px]"
            onClick={() =>
              setMaterials((prev) => [...prev, { ...emptyMaterial }])
            }
          >
            <Plus className="size-3" /> Add material
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Estimated work duration (days, optional)">
          <Input
            type="number"
            min={0}
            value={form.estimated_work_days}
            onChange={(e) => set("estimated_work_days", e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
        <Field label="Expected completion date (optional)">
          <CustomeDatePicker
            value={form.expected_completion_date}
            onChange={(v) => set("expected_completion_date", v ?? "")}
            restriction="futureOnly"
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={form.additional_visit_required}
            onCheckedChange={(v) =>
              set("additional_visit_required", v === true)
            }
          />
          Additional visit required
        </label>
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={form.further_approval_required}
            onCheckedChange={(v) =>
              set("further_approval_required", v === true)
            }
          />
          Further approval required
        </label>
      </div>
      {textArea("remarks", "Remarks (optional)")}

      <div className="grid gap-4 sm:grid-cols-3">
        <FilesField
          label="Damage photographs"
          files={photos}
          onChange={setPhotos}
          accept={PHOTO_ACCEPT}
          max={15}
          error={errors.photos}
        />
        <FilesField
          label="Videos (optional)"
          files={videos}
          onChange={setVideos}
          accept={VIDEO_ACCEPT}
          max={5}
        />
        <FilesField
          label="Documents (optional)"
          files={documents}
          onChange={setDocuments}
          accept={DOC_ACCEPT}
          max={5}
        />
      </div>
    </WorkflowDialog>
  );
}

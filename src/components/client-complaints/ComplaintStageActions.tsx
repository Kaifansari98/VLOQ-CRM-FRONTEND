"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
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
import type { ComplaintWorkflowRequest } from "@/api/client-complaints";
import type {
  ComplaintDetails,
  ComplaintExecutionAction,
} from "@/types/complaint-details";
import {
  complaintDate as date,
  displayText as text,
} from "./complaint-details-format";
import { BRAND_BUTTON, Field, rupees } from "./complaint-action-ui";
import {
  FilesField,
  localNow,
  PHOTO_ACCEPT,
  RecordPaymentDialog,
  todayLocal,
  WorkflowDialog,
} from "./ComplaintWorkflowDialogs";
import { ComplaintInspectionForm } from "./ComplaintInspectionForm";
import { ComplaintQuotationEditor } from "./ComplaintQuotationEditor";

// Inspection → quotation → repair → closure steps (spec 12–16), plus the
// warranty decision and cancellation. The server decides which steps apply.

type SimpleMode =
  | "WARRANTY"
  | "CANCEL"
  | "PROCEED_WITHOUT_QUOTATION"
  | "RESOLVE_WITHOUT_REPAIR"
  | "START_QUOTATION"
  | "REVIEW_QUOTATION"
  | "SHARE_QUOTATION"
  | "CLIENT_RESPONSE"
  | "WAIVE_REPAIR"
  | ComplaintExecutionAction
  | "CLIENT_CONFIRMATION"
  | "NO_RESPONSE"
  | "APPROVE_CLOSURE";

type Mode = "INSPECTION" | "QUOTATION_EDITOR" | "REPAIR_PAYMENT" | SimpleMode;

const EXECUTION_LABELS: Record<ComplaintExecutionAction, string> = {
  MATERIAL_ORDERED: "Material Ordered",
  MATERIAL_RECEIVED: "Material Received",
  MATERIAL_READY: "Material Ready",
  SCHEDULE_REPAIR: "Schedule Repair",
  RESCHEDULE_REPAIR: "Reschedule",
  START_WORK: "Start Work",
  COMPLETE_WORK: "Work Completed",
};
const PRIMARY_EXECUTION: ComplaintExecutionAction[] = [
  "SCHEDULE_REPAIR",
  "START_WORK",
  "COMPLETE_WORK",
];

// True when this viewer has any inspection-to-closure step on the complaint.
export function hasStageWork(c: ComplaintDetails) {
  const { inspection, quotation, execution, closure } = c.permissions;
  return Boolean(
    inspection?.report_visit ||
    inspection?.after_inspection ||
    inspection?.can_set_warranty ||
    (quotation &&
      (quotation.can_edit ||
        quotation.can_review ||
        quotation.can_share ||
        quotation.can_record_client_response ||
        quotation.repair_charge)) ||
    execution?.actions.length ||
    closure?.can_record_client_confirmation ||
    closure?.ho_closure ||
    closure?.can_cancel,
  );
}

function Row({
  label,
  detail,
  children,
}: {
  label: ReactNode;
  detail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 text-xs">
        <span className="font-semibold">{label}</span>
        {detail && <span className="text-muted-foreground"> · {detail}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function ComplaintStageActions({
  complaint: c,
  vendorId,
  brandStyle,
}: {
  complaint: ComplaintDetails;
  vendorId: number;
  brandStyle: CSSProperties;
}) {
  const { inspection, quotation, execution, closure } = c.permissions;
  const [mode, setMode] = useState<Mode | null>(null);
  const latestQuotation = c.quotations.find(
    (q) => q.id === quotation?.latest_id,
  );
  const btn = (
    m: Mode,
    label: string,
    primary?: boolean,
    disabled?: boolean,
  ) => (
    <Button
      key={m}
      size="sm"
      variant={primary ? "default" : "outline"}
      style={primary ? brandStyle : undefined}
      className={cn(
        "h-8 rounded-lg text-xs",
        primary && cn("font-semibold", BRAND_BUTTON),
      )}
      onClick={() => setMode(m)}
      disabled={disabled}
    >
      {label}
    </Button>
  );
  const close = () => setMode(null);
  const common = { complaint: c, vendorId, brandStyle, onClose: close };

  return (
    <>
      {inspection?.report_visit && (
        <Row
          label={`Visit ${inspection.report_visit.visit_number} completed`}
          detail="the site inspection report is due"
        >
          {btn("INSPECTION", "Submit Inspection", true)}
        </Row>
      )}
      {inspection?.after_inspection && (
        <Row
          label="Inspection submitted"
          detail="choose how the complaint proceeds"
        >
          {btn("RESOLVE_WITHOUT_REPAIR", "Resolve Without Repair")}
          {btn("PROCEED_WITHOUT_QUOTATION", "Repair Without Quotation")}
          {btn("START_QUOTATION", "Prepare Quotation", true)}
        </Row>
      )}

      {quotation?.can_edit && (
        <Row
          label="Quotation"
          detail={
            latestQuotation
              ? `Q${latestQuotation.quotation_number} rev ${latestQuotation.revision} · ${text(latestQuotation.status)}`
              : "not prepared yet"
          }
        >
          {btn(
            "QUOTATION_EDITOR",
            latestQuotation?.status === "DRAFT"
              ? "Edit Draft"
              : latestQuotation
                ? "Revise Quotation"
                : "Prepare Quotation",
            true,
          )}
        </Row>
      )}
      {quotation?.can_review && latestQuotation && (
        <Row
          label={`Quotation Q${latestQuotation.quotation_number} rev ${latestQuotation.revision}`}
          detail={`client payable ${rupees(latestQuotation.client_payable_amount)} · awaiting your approval`}
        >
          {btn("REVIEW_QUOTATION", "Review Quotation", true)}
        </Row>
      )}
      {quotation?.can_share && latestQuotation && (
        <Row label="Quotation approved" detail="share it with the client">
          {btn("SHARE_QUOTATION", "Share with Client", true)}
        </Row>
      )}
      {quotation?.can_record_client_response && latestQuotation && (
        <Row
          label="Quotation shared"
          detail={`client payable ${rupees(latestQuotation.client_payable_amount)} · waiting for the client`}
        >
          {btn("CLIENT_RESPONSE", "Record Client Response", true)}
        </Row>
      )}
      {quotation?.repair_charge && (
        <Row
          label={`Repair charge ${rupees(quotation.repair_charge.amount)}`}
          detail={
            quotation.repair_charge.payment_pending_verification
              ? "payment awaiting HO verification"
              : `${rupees(quotation.repair_charge.outstanding)} outstanding`
          }
        >
          {quotation.repair_charge.can_waive &&
            btn("WAIVE_REPAIR", "Waive Charge")}
          {quotation.repair_charge.can_record &&
            btn("REPAIR_PAYMENT", "Record Payment", true)}
        </Row>
      )}

      {execution && execution.actions.length > 0 && (
        <Row
          label="Repair"
          detail={`${text(execution.status)}${execution.scheduled_for ? ` · ${date(execution.scheduled_for, true)}` : ""}`}
        >
          {[...execution.actions]
            .sort(
              (a, b) =>
                Number(PRIMARY_EXECUTION.includes(a)) -
                Number(PRIMARY_EXECUTION.includes(b)),
            )
            .map((a) =>
              btn(a, EXECUTION_LABELS[a], PRIMARY_EXECUTION.includes(a)),
            )}
        </Row>
      )}

      {closure?.can_record_client_confirmation && (
        <Row
          label="Resolution done"
          detail="awaiting the client's confirmation"
        >
          {closure.can_close_without_response &&
            btn("NO_RESPONSE", "Close Without Response")}
          {btn("CLIENT_CONFIRMATION", "Record Client Confirmation", true)}
        </Row>
      )}
      {closure?.ho_closure && (
        <Row
          label="Ready for HO closure"
          detail={
            closure.ho_closure.financial_issues.length
              ? `blocked: ${closure.ho_closure.financial_issues.join("; ")}`
              : "inspection, completion and payments to be reviewed"
          }
        >
          {btn(
            "APPROVE_CLOSURE",
            "Approve Closure",
            true,
            closure.ho_closure.financial_issues.length > 0,
          )}
        </Row>
      )}

      {(inspection?.can_set_warranty || closure?.can_cancel) && (
        <Row label="Warranty" detail={text(c.warranty_status)}>
          {closure?.can_cancel && btn("CANCEL", "Cancel Complaint")}
          {inspection?.can_set_warranty && btn("WARRANTY", "Warranty Decision")}
        </Row>
      )}

      {mode === "INSPECTION" && <ComplaintInspectionForm {...common} />}
      {mode === "QUOTATION_EDITOR" && <ComplaintQuotationEditor {...common} />}
      {mode === "REPAIR_PAYMENT" && quotation?.repair_charge && (
        <RecordPaymentDialog
          title="Record Repair Payment"
          outstanding={quotation.repair_charge.outstanding}
          brandStyle={brandStyle}
          vendorId={vendorId}
          complaintId={c.id}
          toRequest={(fields) => ({
            kind: "chargePayment",
            version: c.version,
            charge_id: quotation.repair_charge!.charge_id,
            ...fields,
          })}
          onClose={close}
        />
      )}
      {mode &&
        !["INSPECTION", "QUOTATION_EDITOR", "REPAIR_PAYMENT"].includes(
          mode,
        ) && <StageDialog key={mode} mode={mode as SimpleMode} {...common} />}
    </>
  );
}

const OUTCOMES: Partial<Record<SimpleMode, [string, string][]>> = {
  WARRANTY: [
    ["COVERED", "Covered"],
    ["PARTIALLY_COVERED", "Partially covered"],
    ["NOT_COVERED", "Not covered"],
  ],
  REVIEW_QUOTATION: [
    ["APPROVE", "Approve quotation"],
    ["SEND_FOR_REVISION", "Send for revision"],
  ],
  CLIENT_RESPONSE: [
    ["CLIENT_ACCEPTED", "Client accepted"],
    ["MODIFICATION_REQUESTED", "Client requested changes"],
    ["CLIENT_REJECTED", "Client rejected (complaint goes on hold)"],
  ],
  CLIENT_CONFIRMATION: [
    ["SATISFIED", "Satisfied: confirm resolution"],
    ["NOT_SATISFIED", "Not satisfied: reopen complaint"],
  ],
};

const TITLES: Record<SimpleMode, [string, string]> = {
  WARRANTY: [
    "Warranty Decision",
    "Records whether the complaint is covered under warranty.",
  ],
  CANCEL: [
    "Cancel Complaint",
    "Open visits and repairs stop and unpaid charges are voided. Paid amounts stay on record.",
  ],
  START_QUOTATION: [
    "Prepare Quotation",
    "Moves the complaint to quotation preparation.",
  ],
  PROCEED_WITHOUT_QUOTATION: [
    "Repair Without Quotation",
    "For work with no client cost, e.g. fully under warranty or a simple adjustment.",
  ],
  RESOLVE_WITHOUT_REPAIR: [
    "Resolve Without Repair",
    "No repair is needed; the client confirms the resolution next.",
  ],
  REVIEW_QUOTATION: [
    "Review Quotation",
    "Approve it for sharing, or send it back for revision.",
  ],
  SHARE_QUOTATION: [
    "Share Quotation",
    "Marks the approved quotation as shared with the client.",
  ],
  CLIENT_RESPONSE: [
    "Client Response",
    "Record the client's answer to the shared quotation.",
  ],
  WAIVE_REPAIR: [
    "Waive Repair Charge",
    "HO exception: the repair proceeds without collecting this charge.",
  ],
  MATERIAL_ORDERED: ["Material Ordered", "Record the order details."],
  MATERIAL_RECEIVED: ["Material Received", "Record when the material arrived."],
  MATERIAL_READY: ["Material Ready", "Material is ready for the repair."],
  SCHEDULE_REPAIR: [
    "Schedule Repair",
    "Creates the repair task for the site supervisor.",
  ],
  RESCHEDULE_REPAIR: [
    "Reschedule Repair",
    "Pick the new date and time and record why it changed.",
  ],
  START_WORK: ["Start Work", "The repair team has started on site."],
  COMPLETE_WORK: [
    "Completion Report",
    "After-repair photos are mandatory. The client confirms next.",
  ],
  CLIENT_CONFIRMATION: [
    "Client Confirmation",
    "Record whether the client is satisfied with the resolution.",
  ],
  NO_RESPONSE: [
    "Close Without Client Response",
    "HO-authorised; it is recorded and never shown as client-confirmed.",
  ],
  APPROVE_CLOSURE: [
    "Approve Closure",
    "Final HO approval. The complaint becomes Closed.",
  ],
};

function StageDialog({
  mode,
  complaint: c,
  vendorId,
  brandStyle,
  onClose,
}: {
  mode: SimpleMode;
  complaint: ComplaintDetails;
  vendorId: number;
  brandStyle: CSSProperties;
  onClose: () => void;
}) {
  const { quotation, execution, inspection } = c.permissions;
  const options = OUTCOMES[mode];
  const [outcome, setOutcome] = useState(options?.[0]?.[0] ?? "");
  const [remarks, setRemarks] = useState("");
  const [clientReference, setClientReference] = useState("");
  const [materialRequired, setMaterialRequired] = useState(
    inspection?.after_inspection?.material_required ?? false,
  );
  const [poRef, setPoRef] = useState("");
  const [expected, setExpected] = useState("");
  const [received, setReceived] = useState(todayLocal());
  const [when, setWhen] = useState("");
  const [team, setTeam] = useState("");
  const [completion, setCompletion] = useState({
    material_used: "",
    replacement_details: "",
    client_remarks: "",
    pending_work: "",
  });
  const [before, setBefore] = useState<File[]>([]);
  const [after, setAfter] = useState<File[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clientMode =
    mode === "CLIENT_RESPONSE" || mode === "CLIENT_CONFIRMATION";
  const remarksRequired =
    [
      "WARRANTY",
      "CANCEL",
      "PROCEED_WITHOUT_QUOTATION",
      "RESOLVE_WITHOUT_REPAIR",
      "REVIEW_QUOTATION",
      "WAIVE_REPAIR",
      "RESCHEDULE_REPAIR",
      "COMPLETE_WORK",
      "NO_RESPONSE",
      "APPROVE_CLOSURE",
    ].includes(mode) ||
    (mode === "CLIENT_RESPONSE" && outcome !== "CLIENT_ACCEPTED") ||
    (mode === "CLIENT_CONFIRMATION" && outcome === "NOT_SATISFIED");
  const remarksLabel =
    mode === "COMPLETE_WORK"
      ? "Work completion remarks"
      : mode === "CANCEL"
        ? "Reason for cancellation"
        : mode === "NO_RESPONSE"
          ? "Reason for closing without client confirmation"
          : mode === "CLIENT_CONFIRMATION" && outcome === "NOT_SATISFIED"
            ? "Reason for reopening"
            : mode === "CLIENT_RESPONSE" && outcome === "MODIFICATION_REQUESTED"
              ? "Requested changes"
              : mode === "CLIENT_RESPONSE" && outcome === "CLIENT_REJECTED"
                ? "Client's reason"
                : mode === "APPROVE_CLOSURE"
                  ? "Closure remarks"
                  : "Remarks";

  const build = (): ComplaintWorkflowRequest | null => {
    const next: Record<string, string> = {};
    if (remarksRequired && !remarks.trim()) next.remarks = "This is required.";
    if (clientMode && !clientReference.trim())
      next.client = "Record how the client confirmed.";
    if ((mode === "SCHEDULE_REPAIR" || mode === "RESCHEDULE_REPAIR") && !when)
      next.when = "Pick the date and time.";
    if (mode === "MATERIAL_RECEIVED" && !received)
      next.received = "Pick the date received.";
    if (mode === "COMPLETE_WORK" && !after.length)
      next.after = "Add at least one after-repair photo.";
    if (mode === "APPROVE_CLOSURE" && !reviewed)
      next.reviewed = "Confirm the review.";
    setErrors(next);
    if (Object.keys(next).length) return null;

    const version = c.version;
    const note = remarks.trim() || undefined;
    const quotationId = quotation?.latest_id ?? 0;
    switch (mode) {
      case "WARRANTY":
        return {
          kind: "warranty",
          version,
          outcome: outcome as "COVERED",
          remarks: note!,
        };
      case "CANCEL":
        return { kind: "cancel", version, remarks: note! };
      case "START_QUOTATION":
      case "PROCEED_WITHOUT_QUOTATION":
      case "RESOLVE_WITHOUT_REPAIR":
        return {
          kind: "inspectionDecision",
          version,
          action: mode,
          remarks: note,
          material_required:
            mode === "PROCEED_WITHOUT_QUOTATION" ? materialRequired : undefined,
        };
      case "REVIEW_QUOTATION":
      case "CLIENT_RESPONSE":
        return {
          kind: "quotationAction",
          version,
          quotation_id: quotationId,
          action: outcome as "APPROVE",
          remarks: note,
          client_reference: clientMode ? clientReference.trim() : undefined,
        };
      case "SHARE_QUOTATION":
        return {
          kind: "quotationAction",
          version,
          quotation_id: quotationId,
          action: "SHARE",
          remarks: note,
        };
      case "WAIVE_REPAIR":
        return {
          kind: "chargeWaiver",
          version,
          charge_id: quotation!.repair_charge!.charge_id,
          remarks: note!,
        };
      case "COMPLETE_WORK":
        return {
          kind: "executionComplete",
          version,
          execution_id: execution!.id,
          completion_remarks: note!,
          material_used: completion.material_used.trim() || undefined,
          replacement_details:
            completion.replacement_details.trim() || undefined,
          client_remarks: completion.client_remarks.trim() || undefined,
          pending_work: completion.pending_work.trim() || undefined,
          before,
          after,
        };
      case "MATERIAL_ORDERED":
      case "MATERIAL_RECEIVED":
      case "MATERIAL_READY":
      case "SCHEDULE_REPAIR":
      case "RESCHEDULE_REPAIR":
      case "START_WORK":
        return {
          kind: "executionAction",
          version,
          execution_id: execution!.id,
          action: mode,
          remarks: note,
          purchase_order_reference:
            mode === "MATERIAL_ORDERED" ? poRef.trim() || undefined : undefined,
          material_expected_date:
            mode === "MATERIAL_ORDERED" ? expected || undefined : undefined,
          material_received_date:
            mode === "MATERIAL_RECEIVED" ? received : undefined,
          scheduled_for: when ? new Date(when).toISOString() : undefined,
          team_details:
            mode === "SCHEDULE_REPAIR" ? team.trim() || undefined : undefined,
        };
      case "CLIENT_CONFIRMATION":
        return {
          kind: "clientConfirmation",
          version,
          outcome: outcome as "SATISFIED",
          client_reference: clientReference.trim(),
          remarks: note,
          photos,
        };
      case "NO_RESPONSE":
        return { kind: "noResponseClosure", version, remarks: note! };
      case "APPROVE_CLOSURE":
        return {
          kind: "approveClosure",
          version,
          remarks: note!,
          reports_reviewed: reviewed,
        };
    }
  };

  const [title, description] = TITLES[mode];
  return (
    <WorkflowDialog
      title={title}
      description={description}
      brandStyle={brandStyle}
      vendorId={vendorId}
      complaintId={c.id}
      build={build}
      onClose={onClose}
      wide={mode === "COMPLETE_WORK"}
    >
      {options && (
        <Field label="Decision">
          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger className="h-9 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      {clientMode && (
        <Field label="How the client confirmed" error={errors.client}>
          <Input
            value={clientReference}
            onChange={(e) => setClientReference(e.target.value)}
            placeholder="e.g. Phone call on 98xxx, 13 Nov 10:30"
            className="h-9 text-xs"
          />
        </Field>
      )}
      {mode === "PROCEED_WITHOUT_QUOTATION" && (
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={materialRequired}
            onCheckedChange={(v) => setMaterialRequired(v === true)}
          />
          Material must be procured first
        </label>
      )}
      {mode === "MATERIAL_ORDERED" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Purchase order reference (optional)">
            <Input
              value={poRef}
              onChange={(e) => setPoRef(e.target.value)}
              className="h-9 text-xs"
            />
          </Field>
          <Field label="Expected date (optional)">
            <CustomeDatePicker
              value={expected}
              onChange={(v) => setExpected(v ?? "")}
              restriction="futureOnly"
            />
          </Field>
        </div>
      )}
      {mode === "MATERIAL_RECEIVED" && (
        <Field label="Material received date" error={errors.received}>
          <CustomeDatePicker
            value={received}
            onChange={(v) => setReceived(v ?? "")}
            restriction="pastOnly"
          />
        </Field>
      )}
      {(mode === "SCHEDULE_REPAIR" || mode === "RESCHEDULE_REPAIR") && (
        <Field label="Repair date and time" error={errors.when}>
          <Input
            type="datetime-local"
            value={when}
            min={localNow()}
            onChange={(e) => setWhen(e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
      )}
      {mode === "SCHEDULE_REPAIR" && (
        <Field label="Installation team (optional)">
          <Input
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
      )}
      {mode === "COMPLETE_WORK" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["material_used", "Material used"],
                ["replacement_details", "Replacement details"],
                ["client_remarks", "Client remarks"],
                ["pending_work", "Pending work, if any"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={`${label} (optional)`}>
                <Textarea
                  value={completion[key]}
                  onChange={(e) =>
                    setCompletion((p) => ({ ...p, [key]: e.target.value }))
                  }
                  rows={2}
                  className="text-xs"
                />
              </Field>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FilesField
              label="Before photographs (optional)"
              files={before}
              onChange={setBefore}
              accept={PHOTO_ACCEPT}
              max={10}
            />
            <FilesField
              label="After photographs"
              files={after}
              onChange={setAfter}
              accept={PHOTO_ACCEPT}
              max={10}
              error={errors.after}
            />
          </div>
        </>
      )}
      {mode === "CLIENT_CONFIRMATION" && (
        <FilesField
          label="Client's photographs (optional)"
          files={photos}
          onChange={setPhotos}
          accept={PHOTO_ACCEPT}
          max={10}
        />
      )}
      {mode === "APPROVE_CLOSURE" && (
        <Field label="Review" error={errors.reviewed}>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={reviewed}
              onCheckedChange={(v) => setReviewed(v === true)}
            />
            I have reviewed the inspection and completion reports and the
            client&apos;s confirmation
          </label>
        </Field>
      )}
      <Field
        label={remarksRequired ? remarksLabel : `${remarksLabel} (optional)`}
        error={errors.remarks}
      >
        <Textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          className="text-xs"
        />
      </Field>
    </WorkflowDialog>
  );
}

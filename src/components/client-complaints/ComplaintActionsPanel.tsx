"use client";

import { useRef, useState } from "react";
import {
  ArrowRightLeft,
  ClipboardCheck,
  Flag,
  Inbox,
  Loader2,
  Paperclip,
  PlayCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useVendorBrandStyle } from "@/hooks/use-vendor-theme-color";
import {
  useComplaintAssigneeOptions,
  useComplaintWorkflow,
  type ComplaintWorkflowRequest,
} from "@/api/client-complaints";
import type {
  ComplaintDetails,
  ComplaintVerificationAction,
  ComplaintVerificationOutcome,
} from "@/types/complaint-details";
import type { ComplaintPriority } from "@/types/client-complaints";
import { PRIORITY_META } from "./complaint-meta";
import { BRAND_BUTTON, Field, workflowError } from "./complaint-action-ui";
import { ComplaintVisitActions } from "./ComplaintVisitActions";
import { ComplaintStageActions, hasStageWork } from "./ComplaintStageActions";

const OUTCOMES: {
  value: ComplaintVerificationOutcome;
  label: string;
  hint: string;
  remarks: string;
}[] = [
  {
    value: "APPROVED_FOR_VISIT",
    label: "Approve for Visit",
    hint: "Site visit is required; the visit stage follows.",
    remarks: "Remarks",
  },
  {
    value: "MORE_INFORMATION_REQUIRED",
    label: "Request More Information",
    hint: "Specify exactly what is missing.",
    remarks: "What information is missing",
  },
  {
    value: "REMOTE_RESOLUTION",
    label: "Remote Resolution",
    hint: "Resolved over call/chat; the client confirms next.",
    remarks: "Remarks",
  },
  {
    value: "REJECTED",
    label: "Reject Complaint",
    hint: "The complaint stays on record but this cycle ends.",
    remarks: "Rejection reason",
  },
  {
    value: "ON_HOLD",
    label: "Put on Hold",
    hint: "Pause verification until it can continue.",
    remarks: "Reason for hold",
  },
];

const STAGE_HINTS: Partial<Record<ComplaintDetails["status"], string>> = {
  NEW: "Awaiting HO verification.",
  REOPENED: "Reopened by the client; HO review needed.",
  UNDER_VERIFICATION:
    "Review client and product details, media, warranty eligibility and possible duplicates, then record a decision.",
  MORE_INFORMATION_REQUIRED:
    "Waiting for the requested information from the client.",
  ON_HOLD: "Verification is on hold.",
  APPROVED_FOR_VISIT: "Approved for a site visit.",
  AWAITING_CLIENT_ACCEPTANCE:
    "Inform the client of the visiting charge and record their response.",
  PAYMENT_PENDING:
    "Collect the visiting charge and record the payment with proof for HO verification.",
  VISIT_SCHEDULED:
    "Visit scheduled. Update the visit once it has happened; the inspection report follows.",
  INSPECTION_SUBMITTED:
    "Inspection submitted. HO decides whether a quotation, a repair or another visit is needed.",
  QUOTATION_PREPARATION:
    "Prepare the repair quotation for department-head approval.",
  DEPARTMENT_HEAD_APPROVAL: "Quotation with the department head for approval.",
  QUOTATION_SHARED: "Quotation shared with the client; record their response.",
  AWAITING_PAYMENT:
    "Collect the repair charge and record the payment with proof.",
  PROCUREMENT_PENDING: "Material is being procured for the repair.",
  MATERIAL_RECEIVED: "Ready for repair: schedule the repair visit.",
  REPAIR_SCHEDULED: "Repair scheduled.",
  WORK_IN_PROGRESS:
    "Repair in progress; submit the completion report when done.",
  AWAITING_CLIENT_CONFIRMATION:
    "Waiting for the client to confirm the resolution.",
  AWAITING_HO_CLOSURE_APPROVAL: "Waiting for HO's final closure approval.",
};

type Mode = ComplaintVerificationAction | null;

export function ComplaintActionsPanel({
  complaint: c,
  vendorId,
}: {
  complaint: ComplaintDetails;
  vendorId: number;
}) {
  const actions = c.permissions.actions ?? [];
  const brandStyle = useVendorBrandStyle();
  const [mode, setMode] = useState<Mode>(null);
  const visits = c.permissions.visits;
  const hasVisitWork =
    !!visits &&
    (visits.can_create_visit ||
      visits.verifiable_payment_ids.length > 0 ||
      Object.values(visits.visit_actions).some(
        (v) => v.actions.length > 0 || v.payment_pending_verification,
      ));
  const stageWork = hasStageWork(c);
  if (actions.length === 0 && !hasVisitWork && !stageWork) return null;

  const has = (a: ComplaintVerificationAction) => actions.includes(a);
  const primary = (
    ["START_REVIEW", "DECIDE", "RESUME", "INFORMATION_RECEIVED"] as const
  ).filter(has);
  const labels: Record<
    ComplaintVerificationAction,
    { text: string; icon: typeof Flag }
  > = {
    START_REVIEW: { text: "Start Verification", icon: PlayCircle },
    DECIDE: { text: "Record Decision", icon: ClipboardCheck },
    RESUME: { text: "Resume Verification", icon: PlayCircle },
    INFORMATION_RECEIVED: { text: "Information Received", icon: Inbox },
    SET_PRIORITY: {
      text: c.priority ? "Revise Priority" : "Set Priority",
      icon: Flag,
    },
    REASSIGN: { text: "Reassign", icon: ArrowRightLeft },
  };

  return (
    <div className="divide-y rounded-xl border bg-card px-4 sm:px-5 [&>*]:py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 text-xs text-muted-foreground">
          {STAGE_HINTS[c.status] ??
            "Ownership and priority can be updated until the complaint is closed."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {(["SET_PRIORITY", "REASSIGN"] as const).filter(has).map((a) => {
            const { text, icon: Icon } = labels[a];
            return (
              <Button
                key={a}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-xs"
                onClick={() => setMode(a)}
              >
                <Icon className="size-3.5" /> {text}
              </Button>
            );
          })}
          {primary.map((a) => {
            const { text, icon: Icon } = labels[a];
            return (
              <Button
                key={a}
                size="sm"
                style={brandStyle}
                className={cn(
                  "h-8 gap-1.5 rounded-lg text-xs font-semibold",
                  BRAND_BUTTON,
                )}
                onClick={() => setMode(a)}
              >
                <Icon className="size-3.5" /> {text}
              </Button>
            );
          })}
        </div>
        {mode && (
          <ActionDialog
            key={mode}
            mode={mode}
            complaint={c}
            vendorId={vendorId}
            brandStyle={brandStyle}
            onClose={() => setMode(null)}
          />
        )}
      </div>
      {hasVisitWork && (
        <ComplaintVisitActions
          complaint={c}
          vendorId={vendorId}
          brandStyle={brandStyle}
        />
      )}
      {stageWork && (
        <ComplaintStageActions
          complaint={c}
          vendorId={vendorId}
          brandStyle={brandStyle}
        />
      )}
    </div>
  );
}

function ActionDialog({
  mode,
  complaint: c,
  vendorId,
  brandStyle,
  onClose,
}: {
  mode: ComplaintVerificationAction;
  complaint: ComplaintDetails;
  vendorId: number;
  brandStyle: React.CSSProperties;
  onClose: () => void;
}) {
  const workflow = useComplaintWorkflow(vendorId, c.id);
  const assignees = useComplaintAssigneeOptions(
    vendorId,
    c.id,
    mode === "REASSIGN",
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<ComplaintVerificationOutcome | "">("");
  const [remarks, setRemarks] = useState("");
  const [remote, setRemote] = useState("");
  const [clientResponse, setClientResponse] = useState("");
  const [duplicateRemarks, setDuplicateRemarks] = useState("");
  const [priority, setPriority] = useState<ComplaintPriority | "">(
    c.priority ?? "",
  );
  const [role, setRole] = useState<"SITE_SUPERVISOR" | "DEPARTMENT_HEAD">(
    "SITE_SUPERVISOR",
  );
  const [userId, setUserId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const needsDuplicateReview = c.possible_duplicate && !c.duplicate_reviewed_at;
  const outcomeMeta = OUTCOMES.find((o) => o.value === outcome);
  const remarksRequired =
    mode === "DECIDE" ||
    mode === "RESUME" ||
    mode === "INFORMATION_RECEIVED" ||
    mode === "REASSIGN" ||
    (mode === "SET_PRIORITY" && !!c.priority);

  const titles: Record<ComplaintVerificationAction, [string, string]> = {
    START_REVIEW: [
      "Start Verification",
      "Moves the complaint into the HO verification queue.",
    ],
    DECIDE: [
      "Verification Decision",
      "Every decision is recorded with your remarks.",
    ],
    RESUME: [
      "Resume Verification",
      "Brings the complaint back into verification.",
    ],
    INFORMATION_RECEIVED: [
      "Information Received",
      "Record what the client provided and return it to HO verification.",
    ],
    SET_PRIORITY: [
      c.priority ? "Revise Priority" : "Set Priority",
      c.priority
        ? "Revising the priority requires a reason."
        : "The site supervisor selects the initial priority.",
    ],
    REASSIGN: [
      "Reassign Owner",
      "The previous owner, new owner, time and reason are kept in history.",
    ],
  };

  const pool =
    role === "SITE_SUPERVISOR"
      ? assignees.data?.site_supervisors
      : assignees.data?.head_site_supervisors;
  const currentOwnerId =
    role === "SITE_SUPERVISOR" ? c.assignedSS?.id : c.assignedHSS?.id;

  const submit = async () => {
    const next: Record<string, string> = {};
    if (remarksRequired && !remarks.trim()) next.remarks = "This is required.";
    if (mode === "DECIDE") {
      if (!outcome) next.outcome = "Choose a decision.";
      if (outcome === "REMOTE_RESOLUTION" && !remote.trim())
        next.remote = "Record the advice given.";
      if (needsDuplicateReview && !duplicateRemarks.trim())
        next.duplicate = "Review the possible duplicate.";
      if (outcome === "APPROVED_FOR_VISIT" && !c.assignedSS)
        next.outcome = "Assign a site supervisor first.";
    }
    if (mode === "SET_PRIORITY" && !priority)
      next.priority = "Select a priority.";
    if (mode === "REASSIGN" && !userId) next.user = "Select the new owner.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const version = c.version;
    const text = remarks.trim();
    const request: ComplaintWorkflowRequest =
      mode === "START_REVIEW"
        ? { kind: "start", version, remarks: text || undefined }
        : mode === "RESUME"
          ? { kind: "resume", version, remarks: text }
          : mode === "INFORMATION_RECEIVED"
            ? { kind: "information", version, remarks: text, files }
            : mode === "SET_PRIORITY"
              ? {
                  kind: "priority",
                  version,
                  priority: priority as ComplaintPriority,
                  remarks: text || undefined,
                }
              : mode === "REASSIGN"
                ? {
                    kind: "reassign",
                    version,
                    role,
                    user_id: Number(userId),
                    reason: text,
                  }
                : {
                    kind: "decision",
                    version,
                    outcome: outcome as ComplaintVerificationOutcome,
                    remarks: text,
                    remote_instructions: remote.trim() || undefined,
                    client_response: clientResponse.trim() || undefined,
                    duplicate_review_remarks:
                      duplicateRemarks.trim() || undefined,
                  };
    setSubmitError(null);
    try {
      await workflow.mutateAsync(request);
      onClose();
    } catch (error) {
      setSubmitError(workflowError(error));
    }
  };

  const [title, description] = titles[mode];
  const baseLabel =
    mode === "DECIDE"
      ? (outcomeMeta?.remarks ?? "Remarks")
      : mode === "REASSIGN"
        ? "Reason for reassignment"
        : mode === "SET_PRIORITY" && c.priority
          ? "Reason for revision"
          : mode === "INFORMATION_RECEIVED"
            ? "Information received"
            : mode === "RESUME"
              ? "Reason for resuming"
              : "Remarks";
  const remarksLabel = remarksRequired ? baseLabel : `${baseLabel} (optional)`;

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !workflow.isPending && onClose()}
    >
      <DialogContent
        className="sm:max-w-lg rounded-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === "DECIDE" && (
            <>
              <Field label="Decision" error={errors.outcome}>
                <div className="grid gap-2">
                  {OUTCOMES.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setOutcome(o.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left transition-colors",
                        outcome === o.value
                          ? "border-foreground bg-muted/50"
                          : "hover:bg-muted/30",
                      )}
                    >
                      <div className="text-xs font-semibold">{o.label}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {o.hint}
                      </div>
                    </button>
                  ))}
                </div>
              </Field>
              {outcome === "REMOTE_RESOLUTION" && (
                <>
                  <Field
                    label="Advice / instructions given"
                    error={errors.remote}
                  >
                    <Textarea
                      value={remote}
                      onChange={(e) => setRemote(e.target.value)}
                      rows={3}
                      className="text-xs"
                    />
                  </Field>
                  <Field label="Client's response (optional)">
                    <Textarea
                      value={clientResponse}
                      onChange={(e) => setClientResponse(e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                  </Field>
                </>
              )}
              {needsDuplicateReview && (
                <Field
                  label="Possible duplicate review"
                  error={errors.duplicate}
                >
                  <Textarea
                    value={duplicateRemarks}
                    onChange={(e) => setDuplicateRemarks(e.target.value)}
                    rows={2}
                    placeholder="This complaint was flagged as a possible duplicate. Record your finding."
                    className="text-xs"
                  />
                </Field>
              )}
            </>
          )}

          {mode === "SET_PRIORITY" && (
            <Field label="Priority" error={errors.priority}>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as ComplaintPriority)}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_META) as ComplaintPriority[]).map(
                    (p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_META[p].label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </Field>
          )}

          {mode === "REASSIGN" && (
            <>
              <Field label="Role">
                <Select
                  value={role}
                  onValueChange={(v) => {
                    setRole(v as typeof role);
                    setUserId("");
                  }}
                >
                  <SelectTrigger className="h-9 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SITE_SUPERVISOR">
                      Site Supervisor ·{" "}
                      {c.assignedSS?.user_name ?? "Unassigned"}
                    </SelectItem>
                    <SelectItem value="DEPARTMENT_HEAD">
                      Head Site Supervisor ·{" "}
                      {c.assignedHSS?.user_name ?? "Unassigned"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="New owner" error={errors.user}>
                <Select
                  value={userId}
                  onValueChange={setUserId}
                  disabled={assignees.isPending}
                >
                  <SelectTrigger className="h-9 w-full text-xs">
                    <SelectValue
                      placeholder={
                        assignees.isPending ? "Loading…" : "Select user"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {pool
                      ?.filter((u) => u.id !== currentOwnerId)
                      .map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.name}
                          {u.in_franchise ? " · this franchise" : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          <Field label={remarksLabel} error={errors.remarks}>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </Field>

          {mode === "INFORMATION_RECEIVED" && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => fileRef.current?.click()}
                disabled={files.length >= 10}
              >
                <Paperclip className="size-3.5" /> Attach photos, videos or PDFs
              </Button>
              <input
                ref={fileRef}
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,video/mp4,video/quicktime,video/webm,application/pdf"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  setFiles((prev) => [...prev, ...picked].slice(0, 10));
                  e.target.value = "";
                }}
              />
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between rounded-md border px-2 py-1 text-[11px]"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-muted-foreground hover:text-foreground"
                    title="Remove file"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-2">
          {submitError && (
            <p className="mr-auto text-xs font-medium text-destructive">
              {submitError}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={onClose}
            disabled={workflow.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            style={brandStyle}
            className={cn("h-9 gap-2 text-xs font-semibold", BRAND_BUTTON)}
            onClick={() => void submit()}
            disabled={workflow.isPending}
          >
            {workflow.isPending && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

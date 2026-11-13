"use client";

import { useState, type CSSProperties } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type ComplaintWorkflowRequest } from "@/api/client-complaints";
import type {
  ComplaintDetails,
  ComplaintVisitAction,
} from "@/types/complaint-details";
import {
  complaintDate as date,
  displayText as text,
} from "./complaint-details-format";
import { BRAND_BUTTON, Field, rupees } from "./complaint-action-ui";
import {
  localNow,
  RecordPaymentDialog,
  WorkflowDialog,
} from "./ComplaintWorkflowDialogs";

const ACTION_META: Record<
  ComplaintVisitAction,
  { label: string; primary?: boolean; description: string }
> = {
  ACCEPT_CHARGE: {
    label: "Client Accepted Charge",
    primary: true,
    description: "Record that the client accepted the visiting charge.",
  },
  DECLINE_CHARGE: {
    label: "Client Declined",
    description:
      "The visit is cancelled and the complaint goes on hold for HO review.",
  },
  WAIVE_CHARGE: {
    label: "Waive Charge",
    description:
      "HO exception: the visit goes ahead without the visiting charge.",
  },
  RECORD_PAYMENT: {
    label: "Record Payment",
    primary: true,
    description:
      "Payments need a transaction reference and proof, and are verified by HO.",
  },
  APPROVE_FREE: {
    label: "Approve Free Visit",
    primary: true,
    description:
      "Confirms this visit continues the same unresolved issue, so no charge applies.",
  },
  DECLINE_FREE: {
    label: "Decline Free Visit",
    description:
      "The visit becomes chargeable and the client must accept the visiting charge.",
  },
  SCHEDULE: {
    label: "Schedule Visit",
    primary: true,
    description: "Creates the site-visit task for the site supervisor.",
  },
  CONFIRM: {
    label: "Confirm",
    description: "The client has confirmed the scheduled visit.",
  },
  RESCHEDULE: {
    label: "Reschedule",
    description: "Pick the new date and time and record why it changed.",
  },
  COMPLETE: {
    label: "Visit Completed",
    primary: true,
    description: "The inspection report is submitted after this.",
  },
  CLIENT_NOT_AVAILABLE: {
    label: "Client Not Available",
    description: "Ends this visit; a new visit will be needed.",
  },
  SITE_NOT_ACCESSIBLE: {
    label: "Site Not Accessible",
    description: "Ends this visit; a new visit will be needed.",
  },
  CANCEL: {
    label: "Cancel Visit",
    description:
      "An unpaid visiting charge is voided; recorded payments stay on file.",
  },
};

const REMARKS_REQUIRED: ComplaintVisitAction[] = [
  "DECLINE_CHARGE",
  "WAIVE_CHARGE",
  "APPROVE_FREE",
  "DECLINE_FREE",
  "RESCHEDULE",
  "CLIENT_NOT_AVAILABLE",
  "SITE_NOT_ACCESSIBLE",
  "CANCEL",
];

type DialogState =
  | { kind: "visit"; visitId: number; action: ComplaintVisitAction }
  | { kind: "create" }
  | { kind: "review"; paymentId: number };

export function ComplaintVisitActions({
  complaint: c,
  vendorId,
  brandStyle,
}: {
  complaint: ComplaintDetails;
  vendorId: number;
  brandStyle: CSSProperties;
}) {
  const perms = c.permissions.visits;
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const openVisits = c.visits
    .filter((v) => perms.visit_actions[String(v.id)])
    .sort((a, b) => a.visit_number - b.visit_number);
  const pendingPayments = c.payments.filter((p) =>
    perms.verifiable_payment_ids.includes(p.id),
  );
  const button = (primary?: boolean) =>
    primary
      ? {
          size: "sm" as const,
          style: brandStyle,
          className: cn("h-8 rounded-lg text-xs font-semibold", BRAND_BUTTON),
        }
      : {
          size: "sm" as const,
          variant: "outline" as const,
          className: "h-8 rounded-lg text-xs",
        };

  return (
    <>
      {openVisits.map((visit) => {
        const state = perms.visit_actions[String(visit.id)];
        const free = visit.charge_mode === "FREE_REPEAT";
        return (
          <div
            key={visit.id}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="min-w-0 text-xs">
              <span className="font-semibold">Visit {visit.visit_number}</span>
              <span className="text-muted-foreground">
                {" "}
                · {text(visit.status)} ·{" "}
                {free
                  ? "Free repeat visit"
                  : `${rupees(state.fee)} visiting charge`}
                {!free &&
                  state.outstanding > 0 &&
                  state.outstanding < state.fee &&
                  ` (${rupees(state.outstanding)} due)`}
                {visit.scheduled_for && ` · ${date(visit.scheduled_for, true)}`}
              </span>
              {state.payment_pending_verification && (
                <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                  Payment awaiting HO verification
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[...state.actions]
                .sort(
                  (a, b) =>
                    Number(!!ACTION_META[a].primary) -
                    Number(!!ACTION_META[b].primary),
                )
                .map((action) => (
                  <Button
                    key={action}
                    {...button(ACTION_META[action].primary)}
                    onClick={() =>
                      setDialog({ kind: "visit", visitId: visit.id, action })
                    }
                  >
                    {ACTION_META[action].label}
                  </Button>
                ))}
            </div>
          </div>
        );
      })}

      {pendingPayments.map((payment) => (
        <div
          key={payment.id}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="min-w-0 text-xs">
            <span className="font-semibold">
              Payment {rupees(payment.amount)}
            </span>
            <span className="text-muted-foreground">
              {" "}
              · {text(payment.method)} · {payment.transaction_reference} ·
              awaiting your verification
            </span>
          </p>
          <Button
            {...button(true)}
            onClick={() => setDialog({ kind: "review", paymentId: payment.id })}
          >
            Review Payment
          </Button>
        </div>
      ))}

      {perms.can_create_visit && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            No visit is open for this complaint.
          </p>
          <Button
            {...button(true)}
            className={cn(button(true).className, "gap-1.5")}
            onClick={() => setDialog({ kind: "create" })}
          >
            <CalendarPlus className="size-3.5" /> New Visit
          </Button>
        </div>
      )}

      {dialog?.kind === "visit" && dialog.action === "RECORD_PAYMENT" ? (
        <RecordPaymentDialog
          title={`Record Payment · Visit ${c.visits.find((v) => v.id === dialog.visitId)?.visit_number}`}
          outstanding={
            perms.visit_actions[String(dialog.visitId)]?.outstanding ?? 0
          }
          brandStyle={brandStyle}
          vendorId={vendorId}
          complaintId={c.id}
          toRequest={(fields) => ({
            kind: "visitPayment",
            version: c.version,
            visit_id: dialog.visitId,
            ...fields,
          })}
          onClose={() => setDialog(null)}
        />
      ) : (
        dialog && (
          <VisitDialog
            key={JSON.stringify(dialog)}
            state={dialog}
            complaint={c}
            vendorId={vendorId}
            brandStyle={brandStyle}
            onClose={() => setDialog(null)}
          />
        )
      )}
    </>
  );
}

function VisitDialog({
  state,
  complaint: c,
  vendorId,
  brandStyle,
  onClose,
}: {
  state: DialogState;
  complaint: ComplaintDetails;
  vendorId: number;
  brandStyle: CSSProperties;
  onClose: () => void;
}) {
  const perms = c.permissions.visits;
  const action = state.kind === "visit" ? state.action : null;
  const visit =
    state.kind === "visit"
      ? c.visits.find((v) => v.id === state.visitId)
      : undefined;
  const payment =
    state.kind === "review"
      ? c.payments.find((p) => p.id === state.paymentId)
      : undefined;
  const proofFile = payment
    ? c.attachments.find((a) => a.id === payment.proof_attachment_id)
    : undefined;

  const [remarks, setRemarks] = useState("");
  const [clientReference, setClientReference] = useState("");
  const [when, setWhen] = useState("");
  const [team, setTeam] = useState(visit?.team_details ?? "");
  const [chargeMode, setChargeMode] = useState<"CHARGEABLE" | "FREE_REPEAT">(
    "CHARGEABLE",
  );
  const [repeatOf, setRepeatOf] = useState(
    perms.repeatable_visits.length
      ? String(perms.repeatable_visits[perms.repeatable_visits.length - 1].id)
      : "",
  );
  const [outcome, setOutcome] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const remarksRequired =
    (action && REMARKS_REQUIRED.includes(action)) ||
    (state.kind === "create" && chargeMode === "FREE_REPEAT") ||
    (state.kind === "review" && outcome === "REJECTED");
  const needsClient = action === "ACCEPT_CHARGE" || action === "DECLINE_CHARGE";
  const needsWhen = action === "SCHEDULE" || action === "RESCHEDULE";

  const title =
    state.kind === "create"
      ? "New Visit"
      : state.kind === "review"
        ? "Review Payment"
        : `${ACTION_META[action!].label} · Visit ${visit?.visit_number}`;
  const description =
    state.kind === "create"
      ? `A new visit carries the ${rupees(perms.visit_fee)} charge unless HO approves it as a free repeat of an unresolved visit.`
      : state.kind === "review"
        ? "Check the proof against the transaction reference before verifying."
        : ACTION_META[action!].description;
  const remarksLabel =
    state.kind === "create" && chargeMode === "FREE_REPEAT"
      ? "Why the issue is still unresolved"
      : state.kind === "review" && outcome === "REJECTED"
        ? "Rejection reason"
        : action === "DECLINE_CHARGE"
          ? "Client's reason"
          : action === "WAIVE_CHARGE"
            ? "Reason for the waiver"
            : action === "RESCHEDULE"
              ? "Reason for rescheduling"
              : "Remarks";

  const build = (): ComplaintWorkflowRequest | null => {
    const next: Record<string, string> = {};
    if (remarksRequired && !remarks.trim()) next.remarks = "This is required.";
    if (needsClient && !clientReference.trim())
      next.client = "Record how the client confirmed.";
    if (needsWhen && !when) next.when = "Pick the date and time.";
    if (state.kind === "create" && chargeMode === "FREE_REPEAT" && !repeatOf)
      next.repeatOf = "Select the earlier visit.";
    setErrors(next);
    if (Object.keys(next).length) return null;

    const version = c.version;
    const note = remarks.trim() || undefined;
    if (state.kind === "create")
      return {
        kind: "createVisit",
        version,
        charge_mode: chargeMode,
        repeat_of_visit_id:
          chargeMode === "FREE_REPEAT" ? Number(repeatOf) : undefined,
        remarks: note,
      };
    if (state.kind === "review")
      return {
        kind: "paymentReview",
        version,
        payment_id: state.paymentId,
        outcome,
        remarks: note,
      };
    return {
      kind: "visitAction",
      version,
      visit_id: state.visitId,
      action: state.action,
      remarks: note,
      client_reference: needsClient ? clientReference.trim() : undefined,
      scheduled_for: needsWhen ? new Date(when).toISOString() : undefined,
      team_details:
        action === "SCHEDULE" ? team.trim() || undefined : undefined,
    };
  };

  return (
    <WorkflowDialog
      title={title}
      description={description}
      brandStyle={brandStyle}
      vendorId={vendorId}
      complaintId={c.id}
      build={build}
      onClose={onClose}
    >
      {state.kind === "create" && (
        <>
          <Field label="Visit type">
            <Select
              value={chargeMode}
              onValueChange={(v) => setChargeMode(v as typeof chargeMode)}
            >
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHARGEABLE">
                  Chargeable visit · {rupees(perms.visit_fee)}
                </SelectItem>
                {perms.repeatable_visits.length > 0 && (
                  <SelectItem value="FREE_REPEAT">
                    Free repeat · same unresolved issue
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </Field>
          {chargeMode === "FREE_REPEAT" && (
            <Field label="Repeat of" error={errors.repeatOf}>
              <Select value={repeatOf} onValueChange={setRepeatOf}>
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Select the earlier visit" />
                </SelectTrigger>
                <SelectContent>
                  {perms.repeatable_visits.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      Visit {v.visit_number} (completed)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </>
      )}

      {(action === "APPROVE_FREE" || action === "DECLINE_FREE") &&
        visit?.repeat_remarks && (
          <p className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
            <span className="font-medium">Supervisor&apos;s reason: </span>
            {visit.repeat_remarks}
          </p>
        )}

      {needsClient && (
        <Field label="How the client confirmed" error={errors.client}>
          <Input
            value={clientReference}
            onChange={(e) => setClientReference(e.target.value)}
            placeholder="e.g. Phone call on 98xxx, 13 Nov 10:30"
            className="h-9 text-xs"
          />
        </Field>
      )}

      {needsWhen && (
        <Field label="Visit date and time" error={errors.when}>
          <Input
            type="datetime-local"
            value={when}
            min={localNow()}
            onChange={(e) => setWhen(e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
      )}
      {action === "SCHEDULE" && (
        <Field label="Team / carpenter (optional)">
          <Input
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
      )}

      {state.kind === "review" && payment && (
        <>
          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">{rupees(payment.amount)}</span>
            <span className="text-muted-foreground">Method</span>
            <span>{text(payment.method)}</span>
            <span className="text-muted-foreground">Reference</span>
            <span className="break-all">{payment.transaction_reference}</span>
            <span className="text-muted-foreground">Paid on</span>
            <span>{date(payment.payment_date)}</span>
            <span className="text-muted-foreground">Proof</span>
            {proofFile?.url ? (
              <a
                href={proofFile.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Open proof
              </a>
            ) : (
              <span>Unavailable</span>
            )}
          </div>
          <Field label="Decision">
            <Select
              value={outcome}
              onValueChange={(v) => setOutcome(v as typeof outcome)}
            >
              <SelectTrigger className="h-9 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VERIFIED">Verify payment</SelectItem>
                <SelectItem value="REJECTED">Reject payment</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </>
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

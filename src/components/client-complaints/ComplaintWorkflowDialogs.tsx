"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomeDatePicker from "@/components/date-picker";
import { cn } from "@/lib/utils";
import {
  useComplaintWorkflow,
  type ComplaintWorkflowRequest,
} from "@/api/client-complaints";
import { displayText as text } from "./complaint-details-format";
import {
  BRAND_BUTTON,
  Field,
  rupees,
  workflowError,
} from "./complaint-action-ui";

// Shell shared by every complaint workflow dialog: title, body, error and a
// brand-coloured confirm button that runs the request.
export function WorkflowDialog({
  title,
  description,
  brandStyle,
  vendorId,
  complaintId,
  build,
  onClose,
  confirmLabel = "Confirm",
  wide,
  children,
}: {
  title: string;
  description?: string;
  brandStyle: CSSProperties;
  vendorId: number;
  complaintId: number;
  // Returns the request, or null after showing validation errors.
  build: () => ComplaintWorkflowRequest | null;
  onClose: () => void;
  confirmLabel?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  const workflow = useComplaintWorkflow(vendorId, complaintId);
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    const request = build();
    if (!request) return;
    setError(null);
    try {
      await workflow.mutateAsync(request);
      onClose();
    } catch (e) {
      setError(workflowError(e));
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !workflow.isPending && onClose()}
    >
      <DialogContent
        className={cn(
          "rounded-2xl max-h-[92vh] flex flex-col gap-0 p-0 overflow-hidden",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {children}
        </div>
        <DialogFooter className="flex-row items-center justify-end gap-2 border-t px-6 py-3">
          {error && (
            <p className="mr-auto text-xs font-medium text-destructive">
              {error}
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
            onClick={() => void confirm()}
            disabled={workflow.isPending}
          >
            {workflow.isPending && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const PHOTO_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";
export const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm";
export const MEDIA_ACCEPT = `${PHOTO_ACCEPT},${VIDEO_ACCEPT}`;
export const DOC_ACCEPT = "application/pdf";

export function FilesField({
  label,
  files,
  onChange,
  accept,
  max,
  error,
}: {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept: string;
  max: number;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Field label={`${label} (${files.length}/${max})`} error={error}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => inputRef.current?.click()}
        disabled={files.length >= max}
      >
        <Paperclip className="size-3.5" /> Add files
      </Button>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={max > 1}
        accept={accept}
        onChange={(e) => {
          onChange(
            [...files, ...Array.from(e.target.files ?? [])].slice(0, max),
          );
          e.target.value = "";
        }}
      />
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center justify-between rounded-md border px-2 py-1 text-[11px]"
            >
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-foreground"
                title="Remove file"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Field>
  );
}

export const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// datetime-local wants local time without a zone.
export const localNow = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

const PAYMENT_METHODS = [
  "UPI",
  "CASH",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
];

export type PaymentFields = {
  amount: number;
  method: string;
  transaction_reference: string;
  payment_date: string;
  proof: File;
};

export type PaymentDraft = {
  amount: string;
  method: string;
  reference: string;
  paidOn: string;
  proof: File[];
};

export const emptyPayment = (method = "UPI", amount = ""): PaymentDraft => ({
  amount,
  method,
  reference: "",
  paidOn: todayLocal(),
  proof: [],
});

// Validates a payment draft. Without `outstanding` the amount is not capped.
export function checkPayment(
  draft: PaymentDraft,
  outstanding?: number,
): { errors: Record<string, string>; fields: PaymentFields | null } {
  const errors: Record<string, string> = {};
  const value = Number(draft.amount);
  if (!value || value <= 0) errors.amount = "Enter the amount received.";
  else if (outstanding !== undefined && value > outstanding)
    errors.amount = `Only ${rupees(outstanding)} is outstanding.`;
  if (!draft.reference.trim())
    errors.reference = "Enter the transaction reference.";
  if (!draft.paidOn) errors.paidOn = "Pick the payment date.";
  if (!draft.proof.length) errors.proof = "Attach the payment proof.";
  if (Object.keys(errors).length) return { errors, fields: null };
  return {
    errors,
    fields: {
      amount: value,
      method: draft.method,
      transaction_reference: draft.reference.trim(),
      payment_date: draft.paidOn,
      proof: draft.proof[0],
    },
  };
}

export function PaymentInputs({
  value,
  onChange,
  errors,
  outstanding,
}: {
  value: PaymentDraft;
  onChange: (next: PaymentDraft) => void;
  errors: Record<string, string>;
  outstanding?: number;
}) {
  const set = <K extends keyof PaymentDraft>(key: K, v: PaymentDraft[K]) =>
    onChange({ ...value, [key]: v });
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={
            outstanding !== undefined
              ? `Amount (outstanding ${rupees(outstanding)})`
              : "Amount received"
          }
          error={errors.amount}
        >
          <Input
            type="number"
            inputMode="decimal"
            min={1}
            max={outstanding}
            value={value.amount}
            onChange={(e) => set("amount", e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
        <Field label="Method">
          <Select value={value.method} onValueChange={(v) => set("method", v)}>
            <SelectTrigger className="h-9 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {text(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Transaction reference" error={errors.reference}>
          <Input
            value={value.reference}
            onChange={(e) => set("reference", e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
        <Field label="Payment date" error={errors.paidOn}>
          <CustomeDatePicker
            value={value.paidOn}
            onChange={(v) => set("paidOn", v ?? "")}
            restriction="pastOnly"
          />
        </Field>
      </div>
      <FilesField
        label="Payment proof"
        files={value.proof}
        onChange={(files) => set("proof", files)}
        accept={`${PHOTO_ACCEPT},${DOC_ACCEPT}`}
        max={1}
        error={errors.proof}
      />
    </>
  );
}

// Records a payment with proof against a charge.
export function RecordPaymentDialog({
  title,
  outstanding,
  brandStyle,
  vendorId,
  complaintId,
  toRequest,
  onClose,
  defaultMethod = "UPI",
  description = "Payments need a transaction reference and proof. HO's payments count as verified; a supervisor's are verified by HO.",
}: {
  title: string;
  // Omit when there is no fixed amount to collect against.
  outstanding?: number;
  brandStyle: CSSProperties;
  vendorId: number;
  complaintId: number;
  toRequest: (fields: PaymentFields) => ComplaintWorkflowRequest;
  onClose: () => void;
  defaultMethod?: string;
  description?: string;
}) {
  const [draft, setDraft] = useState(
    emptyPayment(defaultMethod, outstanding ? String(outstanding) : ""),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const build = () => {
    const { errors: next, fields } = checkPayment(draft, outstanding);
    setErrors(next);
    return fields ? toRequest(fields) : null;
  };

  return (
    <WorkflowDialog
      title={title}
      description={description}
      brandStyle={brandStyle}
      vendorId={vendorId}
      complaintId={complaintId}
      build={build}
      onClose={onClose}
    >
      <PaymentInputs
        value={draft}
        onChange={setDraft}
        errors={errors}
        outstanding={outstanding}
      />
    </WorkflowDialog>
  );
}

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

// Records a payment with proof against any charge; HO verifies it afterwards.
export function RecordPaymentDialog({
  title,
  outstanding,
  brandStyle,
  vendorId,
  complaintId,
  toRequest,
  onClose,
}: {
  title: string;
  outstanding: number;
  brandStyle: CSSProperties;
  vendorId: number;
  complaintId: number;
  toRequest: (fields: PaymentFields) => ComplaintWorkflowRequest;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(outstanding ? String(outstanding) : "");
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");
  const [paidOn, setPaidOn] = useState(todayLocal());
  const [proof, setProof] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const build = () => {
    const next: Record<string, string> = {};
    const value = Number(amount);
    if (!value || value <= 0) next.amount = "Enter the amount received.";
    else if (value > outstanding)
      next.amount = `Only ${rupees(outstanding)} is outstanding.`;
    if (!reference.trim()) next.reference = "Enter the transaction reference.";
    if (!paidOn) next.paidOn = "Pick the payment date.";
    if (!proof.length) next.proof = "Attach the payment proof.";
    setErrors(next);
    if (Object.keys(next).length) return null;
    return toRequest({
      amount: value,
      method,
      transaction_reference: reference.trim(),
      payment_date: paidOn,
      proof: proof[0],
    });
  };

  return (
    <WorkflowDialog
      title={title}
      description="Payments need a transaction reference and proof, and are verified by HO."
      brandStyle={brandStyle}
      vendorId={vendorId}
      complaintId={complaintId}
      build={build}
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={`Amount (outstanding ${rupees(outstanding)})`}
          error={errors.amount}
        >
          <Input
            type="number"
            inputMode="decimal"
            min={1}
            max={outstanding}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
        <Field label="Method">
          <Select value={method} onValueChange={setMethod}>
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
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
        <Field label="Payment date" error={errors.paidOn}>
          <CustomeDatePicker
            value={paidOn}
            onChange={(v) => setPaidOn(v ?? "")}
            restriction="pastOnly"
          />
        </Field>
      </div>
      <FilesField
        label="Payment proof"
        files={proof}
        onChange={setProof}
        accept={`${PHOTO_ACCEPT},${DOC_ACCEPT}`}
        max={1}
        error={errors.proof}
      />
    </WorkflowDialog>
  );
}

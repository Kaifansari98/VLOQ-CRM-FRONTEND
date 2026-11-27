"use client";

import { useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useVendorBrandStyle } from "@/hooks/use-vendor-theme-color";
import { useUpdateComplaintSettings } from "@/api/client-complaints";
import {
  BRAND_BUTTON,
  Field,
  rupees,
  workflowError,
} from "./complaint-action-ui";

// Super-admin control for the vendor's visiting charge and the UPI ID clients
// pay complaint charges to from the client app.
export function ComplaintSettingsButton({
  vendorId,
  visitFee,
  upiId,
  upiName,
}: {
  vendorId: number;
  visitFee: number;
  upiId: string | null;
  upiName: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-10 w-fit gap-2 rounded-xl px-4 text-xs font-semibold"
      >
        <Settings2 className="size-3.5" /> Complaint Settings · Visit{" "}
        {rupees(visitFee)}
      </Button>
      {open && (
        <SettingsDialog
          vendorId={vendorId}
          visitFee={visitFee}
          upiId={upiId}
          upiName={upiName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

const UPI_PATTERN = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-]{1,64}$/;

function SettingsDialog({
  vendorId,
  visitFee,
  upiId,
  upiName,
  onClose,
}: {
  vendorId: number;
  visitFee: number;
  upiId: string | null;
  upiName: string | null;
  onClose: () => void;
}) {
  const brandStyle = useVendorBrandStyle();
  const update = useUpdateComplaintSettings(vendorId);
  const [fee, setFee] = useState(String(visitFee));
  const [upi, setUpi] = useState(upiId ?? "");
  const [payee, setPayee] = useState(upiName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [upiError, setUpiError] = useState<string | null>(null);

  const save = async () => {
    const value = Number(fee);
    const feeBad = fee.trim() === "" || !Number.isFinite(value) || value < 0;
    const upiBad = upi.trim() !== "" && !UPI_PATTERN.test(upi.trim());
    setError(feeBad ? "Enter ₹0 or more." : null);
    setUpiError(upiBad ? "Enter a valid UPI ID, like name@bank." : null);
    if (feeBad || upiBad) return;
    try {
      await update.mutateAsync({
        visit_fee: value,
        upi_id: upi.trim() || null,
        upi_name: payee.trim() || null,
      });
      onClose();
    } catch (e) {
      setError(workflowError(e));
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => !next && !update.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Complaint Settings</DialogTitle>
          <DialogDescription className="text-xs">
            The visiting charge applies to every chargeable complaint site
            visit; visits already created keep their charge. Clients pay
            complaint charges in the client app by UPI to the ID below.
          </DialogDescription>
        </DialogHeader>
        <Field label="Charge per visit (₹)" error={error ?? undefined}>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="h-9 text-xs"
          />
        </Field>
        <Field label="UPI ID for client payments" error={upiError ?? undefined}>
          <Input
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
            placeholder="e.g. yourbusiness@okhdfcbank"
            autoCapitalize="off"
            spellCheck={false}
            className="h-9 text-xs"
          />
        </Field>
        <Field label="Payee name shown to clients (optional)">
          <Input
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder="Defaults to your company name"
            className="h-9 text-xs"
          />
        </Field>
        <p className="text-[11px] text-muted-foreground">
          Clients scan a QR or open their UPI app with the amount prefilled,
          then upload a screenshot. Payments show as Pending verification until
          you verify them on the complaint.
        </p>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={onClose}
            disabled={update.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            style={brandStyle}
            className={cn("h-9 gap-2 text-xs font-semibold", BRAND_BUTTON)}
            onClick={() => void save()}
            disabled={update.isPending}
          >
            {update.isPending && <Loader2 className="size-3.5 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

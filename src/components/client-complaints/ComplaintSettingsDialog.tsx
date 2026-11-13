"use client";

import { useState } from "react";
import { IndianRupee, Loader2 } from "lucide-react";
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

// Super-admin control for the vendor's visiting charge.
export function ComplaintSettingsButton({
  vendorId,
  visitFee,
}: {
  vendorId: number;
  visitFee: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-10 w-fit gap-2 rounded-xl px-4 text-xs font-semibold"
      >
        <IndianRupee className="size-3.5" /> Visiting Charge ·{" "}
        {rupees(visitFee)}
      </Button>
      {open && (
        <SettingsDialog
          vendorId={vendorId}
          visitFee={visitFee}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SettingsDialog({
  vendorId,
  visitFee,
  onClose,
}: {
  vendorId: number;
  visitFee: number;
  onClose: () => void;
}) {
  const brandStyle = useVendorBrandStyle();
  const update = useUpdateComplaintSettings(vendorId);
  const [fee, setFee] = useState(String(visitFee));
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const value = Number(fee);
    if (fee.trim() === "" || !Number.isFinite(value) || value < 0) {
      setError("Enter ₹0 or more.");
      return;
    }
    setError(null);
    try {
      await update.mutateAsync({ visit_fee: value });
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
          <DialogTitle className="text-base">Visiting Charge</DialogTitle>
          <DialogDescription className="text-xs">
            Charged on every chargeable complaint site visit. Visits already
            created keep the charge they were raised with.
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

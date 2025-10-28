"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CustomeDatePicker from "@/components/date-picker";
import { toast } from "react-toastify";
import { useMoveLeadToProductionStage } from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface MoveToProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  accountId: number;
}

export default function MoveToProductionModal({
  open,
  onOpenChange,
  leadId,
  accountId,
}: MoveToProductionModalProps) {
  const router = useRouter();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const { mutateAsync: moveToProduction, isPending } =
    useMoveLeadToProductionStage(vendorId, leadId);

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error("Please select the client’s required delivery date.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("account_id", String(accountId));
      formData.append("user_id", String(userId));
      formData.append(
        "client_required_order_login_complition_date",
        selectedDate
      );

      await moveToProduction(formData);
      toast.success("Lead successfully moved to Production Stage!");
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      router.push(`/dashboard/production/order-login`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to move lead.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move to Production Stage</DialogTitle>
          <DialogDescription className="text-xs">
            Select the client’s required delivery or installation date to move
            this lead to Production Stage.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Client’s Required Delivery / Installation Date
            </label>
            <CustomeDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              restriction="futureOnly"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            {isPending ? "Updating..." : "Confirm & Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

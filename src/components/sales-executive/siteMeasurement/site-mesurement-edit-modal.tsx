import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useAppSelector } from "@/redux/store";
import { useUpdateSiteMeasurementMutation } from "@/hooks/Site-measruement/useUpdateSiteMeasurement";
import { EditPayload } from "@/types/site-measrument-types";

// --------- Props ---------
interface Data {
  accountId: number;
  id: number;
  paymentInfo?: {
    id: number;
    amount: number;
    payment_date: string;
    payment_text: string;
  } | null; // ✅ null allowed
}
interface ViewInitialSiteMeasurmentLeadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Data;
}

const paymentSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_text: z
    .string()
    .min(5, "Description should be at least 5 characters"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const SiteMesurementEditModal: React.FC<ViewInitialSiteMeasurmentLeadProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const updatedby = useAppSelector((state) => state.auth.user?.id);

  const { mutateAsync } = useUpdateSiteMeasurementMutation();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: "",
      payment_text: "",
    },
  });

  useEffect(() => {
    if (data?.paymentInfo) {
      form.reset({
        amount: data.paymentInfo.amount || 0,
        payment_date: data.paymentInfo.payment_date
          ? data.paymentInfo.payment_date.split("T")[0]
          : "",
        payment_text: data.paymentInfo.payment_text || "",
      });
    }
  }, [data, form]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values: PaymentFormValues) => {
    if (!data) return;

    const formData = new FormData();
    formData.append("lead_id", data.id.toString());
    formData.append("vendor_id", vendorId!.toString());
    formData.append("account_id", data.accountId.toString());
    formData.append("updated_by", updatedby!.toString());
    formData.append("amount", values.amount.toString());
    formData.append("payment_text", values.payment_text);
    formData.append("payment_date", values.payment_date);

    try {
      await mutateAsync({
        paymentId: data.paymentInfo?.id || 0,
        formData, // send FormData instead of JSON
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating site measurement:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Update payment details for this site measurement.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-5 py-4 space-y-6"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Payment Date
              </label>
              <input
                type="date"
                {...register("payment_date")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
              />
              {errors.payment_date && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.payment_date.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                rows={3}
                {...register("payment_text")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm resize-none focus:outline-none"
              />
              {errors.payment_text && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.payment_text.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SiteMesurementEditModal;

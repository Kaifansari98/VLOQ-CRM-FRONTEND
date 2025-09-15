"use client";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CustomeDatePicker from "@/components/date-picker";

// --------- Props ---------
interface Data {
  accountId: number;
  id: number;
  paymentInfo?: {
    id: number;
    amount: number;
    payment_date: string;
    payment_text: string;
  } | null;
}

interface SiteMesurementEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Data;
}

// --------- Validation Schema ---------
const paymentSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_text: z
    .string()
    .min(5, "Description should be at least 5 characters"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const SiteMesurementEditModal: React.FC<SiteMesurementEditModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const updatedBy = useAppSelector((state) => state.auth.user?.id);

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

  const onSubmit = async (values: PaymentFormValues) => {
    if (!data) return;

    const formData = new FormData();
    formData.append("lead_id", data.id.toString());
    formData.append("vendor_id", vendorId!.toString());
    formData.append("account_id", data.accountId.toString());
    formData.append("updated_by", updatedBy!.toString());
    formData.append("amount", values.amount.toString());
    formData.append("payment_text", values.payment_text);
    formData.append("payment_date", values.payment_date);

    try {
      await mutateAsync({
        paymentId: data.paymentInfo?.id || 0,
        formData,
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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="px-5 py-4 space-y-6"
            >
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        step="0.01"
                        {...field}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <CustomeDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        restriction="futureOnly"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        rows={3}
                        {...field}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm resize-none focus:outline-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SiteMesurementEditModal;

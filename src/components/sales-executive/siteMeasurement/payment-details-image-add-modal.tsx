import React from "react";
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
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileUploadField } from "@/components/custom/file-upload";
import { useAppSelector } from "@/redux/store";
import { useUpdateSiteMeasurementMutation } from "@/hooks/Site-measruement/useUpdateSiteMeasurement";

// --------- Props ---------
interface Data {
  accountId: number;
  id: number;
  paymentId?: number | null;
}

interface ViewInitialSiteMeasurmentLeadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Data;
}

// --------- Zod schema ---------
const paymentPhotoSchema = z.object({
  payment_details_photos: z
    .array(z.any())
    .min(1, "At least one photo is required"),
});

type PaymentPhotoFormValues = z.infer<typeof paymentPhotoSchema>;

const AddPaymentDetailsPhotos: React.FC<ViewInitialSiteMeasurmentLeadProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const updatedBy = useAppSelector((state) => state.auth.user?.id);
  const { mutateAsync, isPending } = useUpdateSiteMeasurementMutation();

  const form = useForm<PaymentPhotoFormValues>({
    resolver: zodResolver(paymentPhotoSchema),
    defaultValues: {
      payment_details_photos: [],
    },
  });

  const onSubmit = async (values: PaymentPhotoFormValues) => {
    if (!data) return;

    const formData = new FormData();
    formData.append("lead_id", data.id.toString());
    formData.append("vendor_id", vendorId!.toString());
    formData.append("account_id", data.accountId.toString());
    formData.append("updated_by", updatedBy!.toString());
    formData.append("payment_id", (data.paymentId || 0).toString());

    values.payment_details_photos.forEach((file) => {
      formData.append("payment_detail_photos", file);
    });

    try {
      await mutateAsync({
        paymentId: data.paymentId || 0,
        formData,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading payment details photos:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Add Payment Details Photos</DialogTitle>
          <DialogDescription>
            Upload payment-related images or documents
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)] p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="payment_details_photos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Payment Details Photos
                    </FormLabel>
                    <FormControl>
                      <FileUploadField
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Upload photos or documents related to payment details.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentDetailsPhotos;

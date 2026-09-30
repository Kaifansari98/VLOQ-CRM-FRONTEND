import React from "react";

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
import { useUploadMeasurementDocumentsMutation } from "@/hooks/Site-measruement/useUploadMeasurementDocuments";
import BaseModal from "@/components/utils/baseModal";
import { toastManager } from "@/components/ui/toast";

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

// --------- Validation ---------
const formSchema = z.object({
  upload_pdf: z
    .array(z.any())
    .min(1, "At least one document is required"),
});

type FormValues = z.infer<typeof formSchema>;

const AddMeasurementDocuments: React.FC<ViewInitialSiteMeasurmentLeadProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const updatedBy = useAppSelector((state) => state.auth.user?.id);

  const { mutateAsync, isPending } = useUploadMeasurementDocumentsMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      upload_pdf: [],
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!data) return;

    try {
      const formData = new FormData();

      // Append regular fields
      formData.append("lead_id", data.id.toString());
      formData.append("vendor_id", vendorId!.toString());
      formData.append("account_id", data.accountId.toString());
      formData.append("updated_by", updatedBy!.toString());
      formData.append("payment_id", (data.paymentId || 0).toString());

      // Append each file (no [])
      values.upload_pdf.forEach((file) => {
        formData.append("upload_pdf", file);
      });

      await mutateAsync(formData);
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      toastManager.add({
        title: errorMessage,
        type: "error",
      });
      console.error("Error uploading measurement documents:", error);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Measurement Documents"
      description="Upload initial site measurement documents."
      size="smd"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          {/* Measurement Documents */}
          <FormField
            control={form.control}
            name="upload_pdf"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Measurement Documents</FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={field.onChange}
                    accept="application/pdf,image/*"
                  />
                </FormControl>
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
              {isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default AddMeasurementDocuments;

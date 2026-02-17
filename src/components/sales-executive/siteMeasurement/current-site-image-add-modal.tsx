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
import { useUpdateSiteMeasurementMutation } from "@/hooks/Site-measruement/useUpdateSiteMeasurement";
import BaseModal from "@/components/utils/baseModal";

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
  current_site_photos: z
    .array(z.any())
    .min(1, "At least one photo is required"),
});

type FormValues = z.infer<typeof formSchema>;

const AddCurrentSitePhotos: React.FC<ViewInitialSiteMeasurmentLeadProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const updatedBy = useAppSelector((state) => state.auth.user?.id);

  const { mutateAsync, isPending } = useUpdateSiteMeasurementMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_site_photos: [],
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
      values.current_site_photos.forEach((file) => {
        formData.append("current_site_photos", file);
      });

      await mutateAsync({
        paymentId: data.paymentId || 0,
        formData,
      });
      
      

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading current site photos:", error);
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Site Photos"
      description="Upload current site photos or supporting documents."
      size="smd"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
          {/* Current Site Photos */}
          <FormField
            control={form.control}
            name="current_site_photos"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Current Site Photos</FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={field.onChange}
                    accept="image/*,.heic,.heif,.avif,.webp,.bmp,.tif,.tiff,.svg,.jfif"
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
              {isPending ? "uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default AddCurrentSitePhotos;

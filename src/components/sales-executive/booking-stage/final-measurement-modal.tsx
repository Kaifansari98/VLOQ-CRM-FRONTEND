import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import BaseModal from "@/components/utils/baseModal";
import { SinglePdfUploadField } from "@/components/utils/single-pdf-uploader";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
    accountId: number;
  };
}

const formSchema = z.object({
  finalMeasurementDoc: z
    .custom<File>((file) => file instanceof File, {
      message: "Final Measurement Document is required",
    })
    .refine((file) => file.type === "application/pdf", {
      message: "Only PDF file is allowed",
    }),

  currentSitePhotos: z
    .array(z.instanceof(File))
    .nonempty({ message: "At least one site photo is required" })
    .refine(
      (files) =>
        files.every((file) =>
          ["image/jpeg", "image/jpg", "image/png"].includes(file.type)
        ),
      { message: "Only JPG, JPEG, or PNG images are allowed" }
    ),

  criticalDiscussion: z.string().optional(),
});

const FinalMeasurementModal = ({
  open,
  onOpenChange,
  data,
}: LeadViewModalProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      finalMeasurementDoc: undefined,
      currentSitePhotos: [],
      criticalDiscussion: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`View Booking for ${data?.name || "Customer"}`}
      size="lg"
      description="Submit final measurement details with optional notes and attachments."
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 flex flex-col h-full"
          >
            {/* ---- PDF Upload ---- */}
            <FormField
              control={form.control}
              name="finalMeasurementDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Initial Site Measurement Document *
                  </FormLabel>
                  <FormControl>
                    <SinglePdfUploadField
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ---- Site Photos ---- */}
            <FormField
              control={form.control}
              name="currentSitePhotos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Current Site Photos *
                  </FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ---- Notes ---- */}
            <FormField
              control={form.control}
              name="criticalDiscussion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Critical Discussion Notes
                  </FormLabel>
                  <FormControl>
                    <TextAreaInput
                      placeholder="Enter your remarks"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ---- Buttons ---- */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  form.reset({
                    finalMeasurementDoc: undefined,
                    currentSitePhotos: [],
                    criticalDiscussion: "",
                  })
                }
              >
                Reset
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default FinalMeasurementModal;

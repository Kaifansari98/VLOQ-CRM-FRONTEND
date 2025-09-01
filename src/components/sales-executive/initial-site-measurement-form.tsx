import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { FileUploadField } from "../custom/file-upload";
import { PdfUploadField } from "../pdf-upload-input";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import DateInputPicker from "../origin-date-input";
import { useAppSelector } from "@/redux/store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getLeadById, uploadInitialSiteMeasurement } from "@/api/leads";
import { toast } from "react-toastify";

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number | undefined;
}

const formSchema = z.object({
  current_site_photos: z.any().optional(),
  upload_pdf: z
    .array(z.instanceof(File))
    .min(1, "Please upload a PDF")
    .max(1, "Only one PDF allowed"),
  amount: z.number("Amount must be a number").optional(),
  payment_date: z.string().optional(),
  payment_image: z.any().optional(),
  payment_text: z.string().optional(),
});

const InitialSiteMeasuresMent: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  leadId,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_site_photos: [],
      upload_pdf: [],
      payment_image: [],
    },
  });

  const vendorId = useAppSelector((state: any) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state: any) => state.auth.user?.id);

  const { data: accountId } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => getLeadById(leadId!, vendorId, userId),
    select: (res) => res?.data?.lead?.account?.id,
  });

  const mutation = useMutation({
    mutationFn: uploadInitialSiteMeasurement,
    onSuccess: () => {
      toast.success("Initial Site Measurement Upload Successflly!");
      handleReset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Something went wrong");
    },
  });

  let clientId = 1;
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Id's: ", leadId, accountId, vendorId, userId, clientId);
    if (!leadId || !accountId) {
      toast.error("Lead or account data is missing!");
      return;
    }
    const formData = new FormData();

    // Required IDs
    formData.append("lead_id", leadId?.toString() || "");
    formData.append("account_id", accountId?.toString() || "");
    formData.append("vendor_id", vendorId?.toString() || "");
    formData.append("created_by", userId?.toString() || "");
    formData.append("client_id", clientId.toString() || "");

    // Current Site Photos (multiple allowed)
    values.current_site_photos?.forEach((file: File) => {
      formData.append("current_site_photos", file);
    });

    // PDF (only one file allowed as per schema)
    values.upload_pdf?.forEach((file: File) => {
      formData.append("upload_pdf", file);
    });
    // Payable amount
    if (values.amount) {
      formData.append("amount", values.amount.toString());
    }

    // Payment date
    if (values.payment_date) {
      formData.append("payment_date", values.payment_date);
    }

    // Payment details text
    if (values.payment_text) {
      formData.append("payment_text", values.payment_text);
    }
    // Payment details images
    values.payment_image?.forEach((file: File) => {
      formData.append("payment_image", file);
    });

    // ✅ DEBUG: Log all FormData entries
    console.log("==== FORM DATA TO BE SENT ====");
    for (const [key, value] of formData.entries()) {
      // If it's a file, show name and type
      if (value instanceof File) {
        console.log(key, value.name, value.type, value.size + " bytes");
      } else {
        console.log(key, value);
      }
    }
    console.log("==== END FORM DATA ====");

    // ✅ API call via mutation
    mutation.mutate(formData);
  };

  const handleReset = () => {
    form.reset({
      current_site_photos: [],
      upload_pdf: [], // reset empty array
      amount: undefined,
      payment_date: undefined, // ✅ instead of ""
      payment_image: [],
      payment_text: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-3xl p-0 gap-0">
        <DialogHeader className="flex items-start justify-end border-b px-6 py-4 border-b">
          <DialogTitle>Initial Site Measurement Form</DialogTitle>
          <DialogDescription>
            Fill the below fields to send this lead to initial site measurement
            form
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-5 py-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* File Upload Field */}
                <FormField
                  control={form.control}
                  name="current_site_photos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Current Site Photos
                      </FormLabel>
                      <FormControl>
                        <FileUploadField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Upload photos or documents.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="upload_pdf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Initial Site Measurement Document
                      </FormLabel>
                      <FormControl>
                        <PdfUploadField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="text-sm">
                          Initial Site Measurement Payble Amount
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter payable amount"
                            // ✅ agar value undefined ho to empty string dikhayega
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? undefined
                                  : parseFloat(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date Picker field */}
                  <FormField
                    control={form.control}
                    name="payment_date"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="text-sm">
                          Initial Site Measurement Amount Payment Date
                        </FormLabel>
                        <FormControl>
                          <DateInputPicker
                            value={
                              field.value ? new Date(field.value) : undefined
                            }
                            onChange={(date?: Date) => {
                              if (date) {
                                field.onChange(
                                  date.toISOString().split("T")[0]
                                ); // save as string "YYYY-MM-DD"
                              } else {
                                field.onChange(undefined);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="payment_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Payment Details</FormLabel>
                      <FormControl>
                        <FileUploadField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Upload photos or documents.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Payment Details Text
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your text"
                          type="text"
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons inside the form */}
                <div className="py-3 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default InitialSiteMeasuresMent;

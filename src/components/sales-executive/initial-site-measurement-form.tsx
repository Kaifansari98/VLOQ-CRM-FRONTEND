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

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  current_site_photos: z.any().optional(),
  initial_site_measurement_document: z
    .array(z.instanceof(File))
    .min(1, "Please upload a PDF")
    .max(1, "Only one PDF allowed"),
  initial_site_measurement_payble_amount: z
    .number("Amount must be a number")
    .optional(),
  initial_site_measurement_amount_payment_date: z.string().optional(),
  payment_details: z.any().optional(),
  payment_details_text: z.string().optional(),
});


const InitialSiteMeasuresMent: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_site_photos: [],
      initial_site_measurement_document: [],
      payment_details: [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Table format
    console.table(values);

    // Full JSON format
    console.log(JSON.stringify(values, null, 2));
  };

  const handleReset = () => {
    form.reset({
      current_site_photos: [],
      initial_site_measurement_document: [], // reset empty array
      initial_site_measurement_payble_amount: undefined,
      initial_site_measurement_amount_payment_date: undefined, // ✅ instead of ""
      payment_details: [],
      payment_details_text: "",
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
                  name="initial_site_measurement_document"
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
                    name="initial_site_measurement_payble_amount"
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
                    name="initial_site_measurement_amount_payment_date"
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
                  name="payment_details"
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
                  name="payment_details_text"
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
                  <Button type="submit">Submit</Button>
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

"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { file, z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";
import { useAppSelector } from "@/redux/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Enhanced Zod schema with proper file validation
const bookingSchema = z.object({
  final_documents: z
    .array(z.any())
    .min(1, "Final documents are required")
    .max(20, "You can upload up to 20 documents")
    .refine((files) => files.length > 0, {
      message: "At least one document is required",
    }),

  amount_received: z
    .number()
    .positive("Amount must be greater than 0")
    .min(1, "Minimum amount is 1"),

  booking_amount: z
    .number()
    .positive("Booking amount must be greater than 0")
    .min(1, "Minimum booking amount is 1"),

  payment_details_document: z
    .array(z.any())
    .min(1, "Final Documents are required")
    .max(20, "You can upload up to 20 documents")
    .refine((files) => files.length > 0, {
      message: "At least one document is required",
    }),

  payment_text: z.string().min(1, "Payment details are required"),
  assign_to: z.string().min(1, "Please select an assignee"),
});

// ✅ Proper type inference from schema
type BookingFormValues = z.infer<typeof bookingSchema>;

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
  };
}

const BookingModal: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  // ✅ Fixed form initialization with proper typing
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      final_documents: [],
      amount_received: 0,
      booking_amount: 0,
      payment_details_document: [],
      payment_text: "",
      assign_to: "",
    },
    mode: "onChange", // Real-time validation
  });

  const { data: vendorSalesExecutive, isLoading } =
    useVendorSalesExecutiveUsers(vendorId!);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const vendorUser = vendorSalesExecutive?.data.sales_executives;
  console.log(
    "Vendor Sales Executives:",
    vendorSalesExecutive.data.sales_executives
  );

  // ✅ Properly typed submit handler
  const onSubmit: SubmitHandler<BookingFormValues> = (values) => {
    console.log("✅ Booking form submitted successfully:");
    console.log("📄 Final Documents:", values.final_documents);
    console.log("💰 Amount Received:", values.amount_received);
    console.log("🏷️ Booking Amount:", values.booking_amount);
    console.log(
      "📑 Payment Details Document:",
      values.payment_details_document
    );
    console.log("📝 Payment Text:", values.payment_text);

    // 🚀 Success message
    console.log("🎉 Form validation passed - Ready for API integration!");

    // Close modal after successful submission
    onOpenChange(false);

    // Reset form for next use
    form.reset();
  };

  // Handle form errors
  const onError = (errors: any) => {
    console.log("❌ Form validation errors:", errors);
  };

  const handleReset = () => {
    form.reset({
      final_documents: [],
      amount_received: 0,
      booking_amount: 0,
      payment_details_document: [],
      payment_text: "",
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-3xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="flex items-start justify-between px-6 py-4 border-b">
          <DialogTitle className="capitalize">
            Booking for {data?.name || "Customer"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-5 py-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-6"
              >
                {/* File Upload Section */}

                <FormField
                  control={form.control}
                  name="final_documents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Final Documents (Quotations + Design) *
                      </FormLabel>
                      <FormControl>
                        <FileUploadField
                          value={field.value}
                          onChange={field.onChange}
                          accept=".pptx., .ppt, .pdf, .jpg, .jpeg, .png, .pyo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Amount fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <FormField
                      control={form.control}
                      name="amount_received"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Amount Received *
                          </FormLabel>
                          <FormControl>
                            <input
                              type="number"
                              placeholder="Enter received amount"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === "" ? 0 : Number(value)
                                );
                              }}
                              min="1"
                              step="0.01"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="booking_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Total Booking Amount *
                          </FormLabel>
                          <FormControl>
                            <input
                              type="number"
                              placeholder="Enter total booking amount"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm "
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === "" ? 0 : Number(value)
                                );
                              }}
                              min="1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="assign_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Assign To *</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="text-sm w-full">
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendorUser.map((user: any) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.user_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Payment Details fields */}
                <FormField
                  control={form.control}
                  name="payment_details_document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Booking Amount Payment Details Document *
                      </FormLabel>
                      <FormControl>
                        <FileUploadField
                          value={field.value}
                          onChange={field.onChange}
                          accept=".jpg,.jpeg,.png"
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
                      <FormLabel className="text-sm">Payment Details</FormLabel>
                      <FormControl>
                        <TextAreaInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter your payment details"
                        />
                      </FormControl>
                      <FormMessage className="-mt-7" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3 pt-4 ">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="rounded-md"
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-md"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? "Submitting..."
                      : "Submit Booking"}
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

export default BookingModal;

"use client";

import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import TextAreaInput from "@/components/origin-text-area";
import { useAppSelector } from "@/redux/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useEditBooking,
  useSiteSupervisors,
} from "@/hooks/booking-stage/use-booking";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";

// ✅ Zod schema
const bookingSchema = z.object({
  amount_received: z.number().min(1, "Amount must be greater than 0"),
  final_booking_amount: z
    .number()
    .min(1, "Booking amount must be greater than 0"),
  payment_text: z.string().min(1, "Payment details are required"),
  assign_to: z.string().min(1, "Please select an assignee"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface LeadViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
    accountId?: number;
    final_booking_amt?: number;
    siteSupervisor?: string;
    paymentsText: string;
    bookingAmount: number;
    siteSupervisorId: number;
  };
}

const BookingEditModal: React.FC<LeadViewModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const leadId = data?.id;
  const clientId = 1;
  const accountId = data?.accountId;

  const {
    mutate: editBooking,

  } = useEditBooking();

  const { data: siteSupervisors, isLoading } = useSiteSupervisors(vendorId!);
  const vendorUser = siteSupervisors?.data?.site_supervisors || [];
  const queryClient = useQueryClient();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      amount_received: data?.bookingAmount ?? 0,
      final_booking_amount: data?.final_booking_amt ?? 0,
      payment_text: data?.paymentsText ?? "",
      assign_to: data?.siteSupervisorId ? String(data.siteSupervisorId) : "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (data) {
      form.reset({
        amount_received: data.bookingAmount ?? 0,
        final_booking_amount: data.final_booking_amt ?? 0,
        payment_text: data.paymentsText ?? "",
        assign_to: data.siteSupervisorId ? String(data.siteSupervisorId) : "",
      });
    }
  }, [data, form]);

  const handleSubmit = (values: BookingFormValues) => {
    if (!leadId || !vendorId || !userId || !accountId || !clientId) return;
    editBooking(
      {
        lead_id: leadId,
        account_id: accountId,
        vendor_id: vendorId,
        created_by: userId,
        client_id: clientId,
        bookingAmount: values.amount_received,
        finalBookingAmount: values.final_booking_amount,
        siteSupervisorId: Number(values.assign_to),
        bookingAmountPaymentDetailsText: values.payment_text,
      },
      {
        onSuccess: () => {
          toast.success("Booking updated successfully");
          queryClient.invalidateQueries({
            queryKey: ["bookingLeads", vendorId],
          });
          form.reset();
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || "Something went wrong");
          console.log("Error updating booking:", error);
        },
      }
    );

    // console.log(values)
    onOpenChange(false);
  };

  const handleReset = () => {
    form.reset({
      amount_received: 0,
      final_booking_amount: 0,
      payment_text: "",
      assign_to: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-3xl p-0 gap-0">
        <DialogHeader className="flex items-start justify-between px-6 py-4 border-b">
          <DialogTitle className="capitalize">
            Booking for {data?.name || "Customer"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-5 py-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                {/* Amount fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="amount_received"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          Booking Amount Received
                        </FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="final_booking_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                        Total Booking Value *
                        </FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3 pt-4 ">
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                  <Button type="submit">Submit Booking</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BookingEditModal;

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
import { FileUploadField } from "@/components/custom/file-upload";
import TextAreaInput from "@/components/origin-text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/redux/store";
import {
  useBackendUsers,
  useSubmitClientApproval,
} from "@/api/client-approval";
import { toast } from "react-toastify";
import CustomeDatePicker from "@/components/date-picker";

// ✅ Zod schema
// ✅ Zod schema (only two required)
const schema = z.object({
  approvalScreenshots: z
    .array(z.any())
    .min(1, "At least one client approval screenshot is required"),
  amount_paid: z.number().optional(),
  advance_payment_date: z.string().optional(),
  payment_files: z.array(z.any()).max(1).optional(),

  payment_text: z.string().optional(),
  assign_lead_to: z.string().min(1, "Please select a backend user"),
});

type FormValues = z.infer<typeof schema>;

interface ClientApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: number;
    accountId: number;
  };
}

const ClientApprovalModal: React.FC<ClientApprovalModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const clientId = 1;

  const { data: backendUsers, isLoading } = useBackendUsers(vendorId!);
  const { mutate, isPending } = useSubmitClientApproval();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      approvalScreenshots: [],
      amount_paid: 0,
      advance_payment_date: "",
      payment_files: [],
      payment_text: "",
      assign_lead_to: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!vendorId || !userId || !data?.id || !data?.accountId) {
      toast.error("Missing required IDs");
      return;
    }

    const formData = new FormData();
    formData.append("lead_id", String(data.id));
    formData.append("vendor_id", String(vendorId));
    formData.append("account_id", String(data.accountId));
    formData.append("client_id", String(clientId));
    formData.append("created_by", String(userId));
    if (values.advance_payment_date) {
      formData.append("advance_payment_date", values.advance_payment_date);
    }
    formData.append("amount_paid", String(values.amount_paid));
    if (values.payment_text) {
      formData.append("payment_text", values.payment_text);
    }
    formData.append("assign_lead_to", values.assign_lead_to);

    values.approvalScreenshots.forEach((file: any) =>
      formData.append("approvalScreenshots", file)
    );
    values.payment_files?.forEach((file: any) =>
      formData.append("payment_files", file)
    );

    mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] md:max-w-3xl p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="capitalize">Client Approval Form</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)] px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Screenshots (Mandatory) */}
              <FormField
                control={form.control}
                name="approvalScreenshots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Approval Screenshots *</FormLabel>
                    <FormControl>
                      <FileUploadField
                        value={field.value}
                        onChange={field.onChange}
                        accept=".jpg,.jpeg,.png"
                        multiple
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount + Date in one row (Optional now) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount_paid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Amount Paid</FormLabel>
                      <FormControl>
                        <input
                          type="number"
                          className="w-full border px-3 py-2 rounded"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advance_payment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Advance Payment Date
                      </FormLabel>
                      <FormControl>
                        <CustomeDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          restriction="pastMonthOnly"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Proof (Optional) */}
              <FormField
                control={form.control}
                name="payment_files"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Proof (Image only)</FormLabel>
                    <FormControl>
                      <FileUploadField
                        value={field.value ?? []}
                        onChange={field.onChange}
                        accept=".jpg,.jpeg,.png"
                        multiple={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remarks (Optional) */}
              <FormField
                control={form.control}
                name="payment_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID / Remarks</FormLabel>
                    <FormControl>
                      <TextAreaInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter transaction ID or remarks"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assign to backend (Mandatory) */}
              <FormField
                control={form.control}
                name="assign_lead_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Assign Lead To Backend *
                    </FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select Backend User" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {backendUsers?.map((user: any) => (
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

              {/* Submit */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ClientApprovalModal;

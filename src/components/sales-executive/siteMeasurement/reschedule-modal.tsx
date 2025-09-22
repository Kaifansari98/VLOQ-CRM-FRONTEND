"use client";

import React, { useEffect } from "react";
import BaseModal from "@/components/utils/baseModal";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useRescheduleTask } from "@/hooks/Site-measruement/useSiteMeasruementLeadsQueries";
import { useAppSelector } from "@/redux/store";
import { toast } from "react-toastify";
import { ReschedulePayload } from "@/api/measurment-leads";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number; // leadId
    taskId?: number; // taskId
    name: string;
    dueDate?: string;
    remark?: string;
  };
}

const formSchema = z.object({
  date: z
    .string()
    .min(1, "Due Date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  remark: z.string().min(1, "Remark is required"),
});

const RescheduleModal: React.FC<Props> = ({ open, onOpenChange, data }) => {
  const modalTitle = data
    ? `Reschedule lead for ${data.name}`
    : "Reschedule Lead";
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const queryClient = useQueryClient();
  const rescheduleMutation = useRescheduleTask();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: data?.dueDate || "",
      remark: data?.remark || "",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        date: data.dueDate || "",
        remark: data.remark || "",
      });
    }
  }, [data, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!data) return;

    const payload: ReschedulePayload = {
      updated_by: 1,
      closed_at: new Date().toISOString(),
      closed_by: 1,
      due_date: values.date,
      remark: values.remark,
    };

    rescheduleMutation.mutate(
      {
        leadId: data.id,
        taskId: data.taskId || 0,
        payload,
      },
      {
        onSuccess: () => {
          toast.success("Lead rescheduled successfully!");
          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["siteMeasurementLeads", vendorId],
            });
          }

          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.message || "❌ Failed to reschedule lead");
        },
      }
    );
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={modalTitle}
      description="Set a new date and time for this lead follow-up."
      size="md"
    >
      <div className="p-6 flex flex-col gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-sm">Date</FormLabel>
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
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Remark</FormLabel>
                  <FormControl>
                    <TextAreaInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your remark"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="text-sm"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button type="submit" className="text-sm">
                Submit
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default RescheduleModal;

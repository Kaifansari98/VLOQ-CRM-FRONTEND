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
import { useAppSelector } from "@/redux/store";
import { toastManager } from "@/components/ui/toast";
import { toastError } from "@/lib/utils";
import { useRescheduleSelfAssignTask } from "@/hooks/useSelfAssignTaskActions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskType: string;
  data?: {
    id: number;
    taskId?: number;
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

const SelfAssignTaskRescheduleModal: React.FC<Props> = ({
  open,
  onOpenChange,
  taskType,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const rescheduleMutation = useRescheduleSelfAssignTask();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: data?.dueDate || "",
      remark: data?.remark || "",
    },
  });

  useEffect(() => {
    if (!data) return;

    form.reset({
      date: data.dueDate || "",
      remark: data.remark || "",
    });
  }, [data, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!data) return;

    rescheduleMutation.mutate(
      {
        leadId: data.id,
        taskId: data.taskId || 0,
        payload: {
          updated_by: userId || 0,
          due_date: values.date,
          remark: values.remark,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: `${taskType} rescheduled successfully!`,
            type: "success",
          });
          if (vendorId) {
            queryClient.invalidateQueries({
              queryKey: ["vendorUserTasks", vendorId, userId],
            });
            queryClient.invalidateQueries({
              queryKey: ["vendorAllTasks"],
            });
            queryClient.invalidateQueries({ queryKey: ["leadStats"] });
          }
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          toastError(err);
        },
      },
    );
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Reschedule ${taskType}`}
      description={`Set a new due date and remark for this ${taskType.toLowerCase()} task.`}
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
              <Button
                type="submit"
                className="text-sm"
                disabled={rescheduleMutation.isPending}
              >
                {rescheduleMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default SelfAssignTaskRescheduleModal;

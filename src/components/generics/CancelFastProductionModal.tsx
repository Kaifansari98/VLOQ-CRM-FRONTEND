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
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
  loading?: boolean;
}

const formSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required to cancel fast production"),
});

const CancelFastProductionModal: React.FC<Props> = ({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        reason: "",
      });
    }
  }, [form, open]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values.reason);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel Fast Production?"
      description="This action will cancel/revoke the fast production status for this lead, reset the required delivery timelines, and cancel any pending fast production approval tasks."
      size="md"
    >
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground">
                    Reason for Cancellation <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <TextAreaInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Please provide a detailed reason..."
                      className="min-h-[100px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={loading}
              >
                {loading ? "Cancelling..." : "Cancel Fast Production"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default CancelFastProductionModal;

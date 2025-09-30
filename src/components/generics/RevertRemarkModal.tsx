"use client";

import React from "react";
import BaseModal from "@/components/utils/baseModal";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitRemark: (remark: string) => void;
  loading?: boolean;
}

const formSchema = z.object({
  remark: z.string().min(1, "Remark is required"),
});

const RevertRemarkModal: React.FC<Props> = ({
  open,
  onOpenChange,
  onSubmitRemark,
  loading = false,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { remark: "" },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmitRemark(values.remark);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={(v) => {
        if (!loading) onOpenChange(v);
      }}
      title="Revert Lead to OnGoing"
      description="Provide a reason for reverting this lead back to OnGoing."
      size="md"
    >
      <div className="p-6 flex flex-col gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
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
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="text-sm" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default RevertRemarkModal;
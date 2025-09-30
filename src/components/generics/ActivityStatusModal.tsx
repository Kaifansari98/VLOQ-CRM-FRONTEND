"use client";

import React from "react";
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
  statusType: "onHold" | "lostApproval" | "lost"; // which action triggered
  onSubmitRemark: (remark: string) => void; // callback
  loading?: boolean;
}

const formSchema = z.object({
  remark: z.string().min(1, "Remark is required"),
});

const ActivityStatusModal: React.FC<Props> = ({
  open,
  onOpenChange,
  statusType,
  onSubmitRemark,
  loading = false,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      remark: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmitRemark(values.remark);
    form.reset();
    onOpenChange(false);
  };

  const titles: Record<Props["statusType"], string> = {
    onHold: "Mark Lead as On Hold",
    lostApproval: "Mark Lead as Lost (Needs Approval)",
    lost: "Mark Lead as Lost",
  };

  const descriptions: Record<Props["statusType"], string> = {
    onHold: "Provide a reason why this lead is being put on hold.",
    lostApproval:
      "Provide a reason why this lead is being marked as lost (requires approval).",
    lost: "Provide a reason why this lead is being marked as lost.",
  };

  const buttonText: Record<Props["statusType"], string> = {
    onHold: "Confirm On Hold",
    lostApproval: "Send for Lost Approval",
    lost: "Confirm Lost",
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={titles[statusType]}
      description={descriptions[statusType]}
      size="md"
      //showCloseIcon // ✅ to show header X icon
    >
      <div className="p-6 flex flex-col gap-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
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
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="text-sm" disabled={loading}>
                {buttonText[statusType]}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default ActivityStatusModal;

"use client";

import React from "react";
import { useDetails } from "../details-context";
import { useAppSelector } from "@/redux/store";
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
import CustomeDatePicker from "@/components/date-picker";
import { FileUploadField } from "@/components/custom/file-upload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitMeeting } from "@/api/designingStageQueries";
import { toast } from "react-toastify";
import BaseModal from "@/components/utils/baseModal";

export const meetingSchema = z.object({
  date: z.string().min(1, "Meeting date is required"),
  desc: z.string().min(1, "Meeting description is required"),
  files: z.array(z.custom<File>()).optional(),
});

export type MeetingFormValues = z.infer<typeof meetingSchema>;

interface MeetingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddMeetingsModal: React.FC<MeetingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;

  const queryClient = useQueryClient();

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      date: "",
      desc: "",
      files: [],
    },
  });

  const mutation = useMutation({
    mutationFn: (values: MeetingFormValues) =>
      submitMeeting({
        files: values.files ?? [],
        desc: values.desc,
        date: values.date,
        vendorId,
        leadId,
        userId,
      }),
    onSuccess: () => {
      toast.success("Meeting added successfully!");
      form.reset();
      onOpenChange(false);

      queryClient.invalidateQueries({
        queryKey: ["meetings", vendorId, leadId],
      });

      queryClient.invalidateQueries({
        queryKey: ["designingStageCounts", vendorId, leadId],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to add meeting!");
    },
  });

  const onSubmit = (values: MeetingFormValues) => {
    mutation.mutate(values);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Meeting"
      description="Capture meeting details and attach supporting files."
      size="lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 p-5">
          {/* Date Picker */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Meeting Date</FormLabel>
                <FormControl>
                  <CustomeDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    restriction="pastWeekOnly"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="desc"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Meeting Description</FormLabel>
                <FormControl>
                  <TextAreaInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter meeting details"
                    className="min-h-[120px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* File Upload */}
          <FormField
            control={form.control}
            name="files"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  Meeting Files (PDF/Image)
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value ?? []}
                    onChange={field.onChange}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              className="rounded-lg"
            >
              Reset
            </Button>

            <Button
              type="submit"
              className="rounded-lg"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Meeting"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
};

export default AddMeetingsModal;

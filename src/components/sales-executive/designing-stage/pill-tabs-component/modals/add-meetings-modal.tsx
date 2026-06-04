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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
import CustomeDatePicker from "@/components/date-picker";
import CustomTimePicker from "@/components/time-picker";
import { FileUploadField } from "@/components/custom/file-upload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitMeeting } from "@/api/designingStageQueries";
import { toastManager } from "@/components/ui/toast";
import BaseModal from "@/components/utils/baseModal";
import { useGetMeetingTypes } from "@/hooks/designing-stage/use-meeting-types";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createMeetingSchema = (requiresTimeRange: boolean) =>
  z
    .object({
      date: z.string().min(1, "Meeting date is required"),
      meeting_type_id: z.number().optional(),
      meeting_start_time: z.string().optional(),
      meeting_end_time: z.string().optional(),
      desc: z.string().optional(),
      files: z.array(z.custom<File>()).optional(),
    })
    .superRefine((values, ctx) => {
      const startTime = values.meeting_start_time?.trim();
      const endTime = values.meeting_end_time?.trim();

      if (requiresTimeRange) {
        if (!startTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["meeting_start_time"],
            message: "Start time is required",
          });
        }

        if (!endTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["meeting_end_time"],
            message: "End time is required",
          });
        }
      }

      if (startTime && !timePattern.test(startTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["meeting_start_time"],
          message: "Invalid start time",
        });
      }

      if (endTime && !timePattern.test(endTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["meeting_end_time"],
          message: "Invalid end time",
        });
      }

      if (startTime && endTime && timePattern.test(startTime) && timePattern.test(endTime)) {
        if (startTime >= endTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["meeting_end_time"],
            message: "End time must be after start time",
          });
        }
      }
    });

export type MeetingFormValues = z.infer<ReturnType<typeof createMeetingSchema>>;

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
  const showMeetingTimeFields = useAppSelector(
    (s) => s.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only === true,
  );
  const { data: meetingTypes = [] } = useGetMeetingTypes(vendorId);
  const hasMeetingTypes = meetingTypes.length > 0;
  const meetingSchema = React.useMemo(
    () => createMeetingSchema(showMeetingTimeFields),
    [showMeetingTimeFields],
  );

  const queryClient = useQueryClient();

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      date: "",
      meeting_type_id: undefined,
      meeting_start_time: undefined,
      meeting_end_time: undefined,
      desc: "",
      files: [],
    },
  });

  const mutation = useMutation({
    mutationFn: (values: MeetingFormValues) =>
      submitMeeting({
        files: values.files ?? [],
        desc: values.desc?.trim() || "",
        date: values.date,
        vendorId,
        leadId,
        userId,
        meeting_type_id: values.meeting_type_id,
        meeting_start_time: values.meeting_start_time?.trim() || undefined,
        meeting_end_time: values.meeting_end_time?.trim() || undefined,
      }),
    onSuccess: () => {
      toastManager.add({ title: "Meeting added successfully!", type: "success" });
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
      toastManager.add({ title: err?.response?.data?.message || "Failed to add meeting!", type: "error" });
    },
  });

  const onSubmit = (values: MeetingFormValues) => {
    if (hasMeetingTypes && !values.meeting_type_id) {
      form.setError("meeting_type_id", {
        type: "manual",
        message: "Meeting type is required",
      });
      return;
    }

    if (!hasMeetingTypes && !values.desc?.trim()) {
      form.setError("desc", {
        type: "manual",
        message: "Meeting description is required",
      });
      return;
    }

    mutation.mutate(values);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Meeting"
      description="Capture meeting details and attach supporting files."
      size="smd"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 p-5">
          <div className="grid gap-3 md:grid-cols-2">
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

            {hasMeetingTypes ? (
              <FormField
                control={form.control}
                name="meeting_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Meeting Type</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select meeting type" />
                        </SelectTrigger>
                        <SelectContent>
                          {meetingTypes.map((meetingType) => (
                            <SelectItem
                              key={meetingType.id}
                              value={String(meetingType.id)}
                            >
                              {meetingType.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="hidden md:block" />
            )}
          </div>

          {showMeetingTimeFields && (
            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="meeting_start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Start Time</FormLabel>
                    <FormControl>
                      <CustomTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select start time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meeting_end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">End Time</FormLabel>
                    <FormControl>
                      <CustomTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select end time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Description */}
          <FormField
            control={form.control}
            name="desc"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Meeting Description</FormLabel>
                <FormControl>
                  <TextAreaInput
                    value={field.value ?? ""}
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

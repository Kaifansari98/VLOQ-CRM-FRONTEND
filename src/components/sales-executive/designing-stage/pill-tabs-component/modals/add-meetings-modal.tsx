"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {} from "@/components/pdf-upload-input";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitMeeting } from "@/api/designingStageQueries";
import { toast } from "react-toastify";
import { FilesUploader } from "@/components/files-uploader";
import CustomeDatePicker from "@/components/date-picker";
import { FileUploadField } from "@/components/custom/file-upload";

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
  const { leadId, accountId } = useDetails();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id)!;
  const userId = useAppSelector((s) => s.auth.user?.id)!;

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      date: "",
      desc: "",
      files: [],
    },
  });

  const queryClient = useQueryClient(); // ✅ yeh add karo
  const mutation = useMutation({
    mutationFn: (values: MeetingFormValues) =>
      submitMeeting({
        files: values.files ?? [],
        desc: values.desc,
        date: values.date,
        vendorId: vendorId,
        leadId: leadId,
        userId: userId,
        accountId: accountId,
      }),
    onSuccess: () => {
      toast.success("Meeting added successfully!");
      form.reset();
      onOpenChange(false);

      // ✅ Refetch meetings query
      queryClient.invalidateQueries({
        queryKey: ["meetings", vendorId, leadId],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to add meeting!");
    },
  });

  // ✅ Dedicated submit handler
  const onSubmit = (values: MeetingFormValues) => {
    console.log("Form values: ", values);
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] md:max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Add Meeting</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 py-3"
              >
                {/* Date Picker */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-sm">Meeting Date</FormLabel>
                      <FormControl>
                        <CustomeDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          restriction="pastOnly"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Textarea */}
                <FormField
                  control={form.control}
                  name="desc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Meeting Description
                      </FormLabel>
                      <FormControl>
                        <TextAreaInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter meeting details"
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
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Saving..." : "Save Meeting"}
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

export default AddMeetingsModal;

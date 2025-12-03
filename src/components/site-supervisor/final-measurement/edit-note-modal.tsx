"use client";

import BaseModal from "@/components/utils/baseModal";
import React from "react";
import { useAppSelector } from "@/redux/store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateNotes } from "@/hooks/final-measurement/use-final-measurement";
import { toast } from "react-toastify";
import TextAreaInput from "@/components/origin-text-area";

// ✅ schema
const schema = z.object({
  final_desc_note: z.string().min(1, "Note is required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    leadId: number;
    final_desc_note: string;
  };
}

const EditNotesModal = ({ open, onOpenChange, data }: Props) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const queryClient = useQueryClient();
  const mutation = useUpdateNotes();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      final_desc_note: data?.final_desc_note || "",
    },
    values: {
      final_desc_note: data?.final_desc_note || "",
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!vendorId || !data?.leadId) {
      toast.error("Missing identifiers");
      return;
    }

    mutation.mutate(
      {
        vendorId,
        leadId: data.leadId,
        notes: values.final_desc_note,
      },
      {
        onSuccess: () => {
          toast.success("Notes updated successfully");
          queryClient.invalidateQueries({
            queryKey: ["finalMeasurementLead", vendorId, data.leadId],
          });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err?.message || "Failed to update notes");
        },
      }
    );
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Notes"
      size="md"
      description="Update critical discussion notes."
    >
      <div className="px-5 py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control} 
              name="final_desc_note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <TextAreaInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter notes..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"} 
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default EditNotesModal;

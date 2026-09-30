"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import BaseModal from "@/components/utils/baseModal";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { FileUploadField } from "@/components/custom/file-upload";
import MapPicker from "@/components/MapPicker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";
import { createClientVisit } from "@/api/leads";
import { useGetMeetingTypes } from "@/hooks/designing-stage/use-meeting-types";
import { formatBlockedAt, getErrorMessage } from "@/lib/utils";
import { useLeadBlockStatus } from "@/hooks/useLeadsQueries";

const visitSchema = z
  .object({
    visit_type: z.enum(["physical_visit", "follow_up_call"]),
    date: z.string().min(1, "Date is required"),
    meeting_type_id: z.number().min(1, "Meeting type is required"),
    remark: z.string().trim().min(1, "Remark is required").max(2000),
    location: z.string().optional(),
    expense_incurred: z.string().optional(),
    documents: z.array(z.custom<File>()).optional(),
    payment_proof_documents: z.array(z.custom<File>()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.visit_type === "physical_visit") {
      if (!value.location?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["location"],
          message: "Location is required for physical visit",
        });
      }

      if (!value.expense_incurred?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expense_incurred"],
          message: "Expense incurred is required for physical visit",
        });
      }

      if ((value.payment_proof_documents ?? []).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["payment_proof_documents"],
          message: "Payment proof documents are required for physical visit",
        });
      }
    }
  });

type VisitFormValues = z.infer<typeof visitSchema>;

interface AddVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  vendorId: number;
  userId: number;
}

export default function AddVisitModal({
  open,
  onOpenChange,
  leadId,
  vendorId,
  userId,
}: AddVisitModalProps) {
  const queryClient = useQueryClient();
  const { data: meetingTypes = [] } = useGetMeetingTypes(vendorId);
  const { data: leadBlockStatus } = useLeadBlockStatus(leadId, vendorId);



  const isLeadBlocked = leadBlockStatus?.is_blocked;
  const blockedAtTooltip = isLeadBlocked
    ? `This lead has been blocked at ${formatBlockedAt(
      leadBlockStatus?.lead_blocked_at ?? null,
    )}`
    : "";

  const [mapOpen, setMapOpen] = useState(false);
  const [savedMapLocation, setSavedMapLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      visit_type: "physical_visit",
      date: "",
      meeting_type_id: undefined,
      remark: "",
      location: "",
      expense_incurred: "",
      documents: [],
      payment_proof_documents: [],
    },
  });

  const visitType = form.watch("visit_type");
  const isPhysicalVisit = visitType === "physical_visit";

  const mutation = useMutation({
    mutationFn: async (values: VisitFormValues) =>
      createClientVisit({
        leadId,
        created_by: userId,
        visit_type: values.visit_type,
        date: values.date,
        meeting_type_id: values.meeting_type_id,
        remark: values.remark.trim(),
        location: isPhysicalVisit ? values.location?.trim() : undefined,
        expense_incurred:
          isPhysicalVisit && values.expense_incurred?.trim()
            ? Number(values.expense_incurred)
            : undefined,
        documents: values.documents ?? [],
        payment_proof_documents: isPhysicalVisit
          ? values.payment_proof_documents ?? []
          : [],
      }),
    onSuccess: () => {
      toastManager.add({
        title: "Visit added successfully",
        type: "success",
      });
      form.reset();
      setSavedMapLocation(null);
      onOpenChange(false);
      queryClient.invalidateQueries({
        queryKey: ["lead", leadId, vendorId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadLogs", leadId, vendorId],
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: getErrorMessage(error) || "Failed to add visit",
        type: "error",
      });
    },
  });

  const visitTypeOptions = useMemo(
    () => [
      { value: "physical_visit", label: "Physical Visit" },
      { value: "follow_up_call", label: "Follow Up Call" },
    ],
    [],
  );

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen && mutation.isPending) return;
    if (!nextOpen) {
      form.reset();
      setSavedMapLocation(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = (values: VisitFormValues) => {
    mutation.mutate(values);
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={handleClose}
      title="Add Visit"
      description="Capture physical visit or follow up call details for this lead."
      size="lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-5">
          <FormField
            control={form.control}
            name="visit_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Type Of Visit *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select visit type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {visitTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Date *</FormLabel>
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

            <FormField
              control={form.control}
              name="meeting_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Type Of Meeting *</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select meeting type" />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isPhysicalVisit && (
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <div className="flex w-full justify-between">
                    <FormLabel className="text-sm">Location *</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMapOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <MapPin className="h-4 w-4" />
                      {savedMapLocation ? "Update Map" : "Open Map"}
                    </Button>
                  </div>
                  <FormControl>
                    <TextAreaInput
                      value={field.value ?? ""}
                      onChange={(value) => {
                        field.onChange(value);
                        if (savedMapLocation) {
                          setSavedMapLocation((prev) =>
                            prev ? { ...prev, address: value } : prev,
                          );
                        }
                      }}
                      placeholder="Enter location or use map"
                    />
                  </FormControl>
                  <FormMessage />
                  <MapPicker
                    open={mapOpen}
                    onClose={() => setMapOpen(false)}
                    savedLocation={savedMapLocation}
                    onSelect={(address, link) => {
                      field.onChange(address);
                      const coords = link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                      if (coords) {
                        setSavedMapLocation({
                          lat: parseFloat(coords[1]),
                          lng: parseFloat(coords[2]),
                          address,
                        });
                      }
                    }}
                  />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="remark"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Remark *</FormLabel>
                <FormControl>
                  <TextAreaInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter remark"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documents"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Document Upload</FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value ?? []}
                    onChange={field.onChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                    multiple
                    maxFiles={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isPhysicalVisit && (
            <>
              <FormField
                control={form.control}
                name="expense_incurred"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Expense Incurred *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Enter expense amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_proof_documents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Payment Proof Doc Upload *
                    </FormLabel>
                    <FormControl>
                      <FileUploadField
                        value={field.value ?? []}
                        onChange={field.onChange}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                        multiple
                        maxFiles={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setSavedMapLocation(null);
              }}
              disabled={mutation.isPending}
            >
              Reset
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Visit"}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
}

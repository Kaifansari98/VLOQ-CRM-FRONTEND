"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import BaseModal from "../utils/baseModal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadField } from "../custom/file-upload";
import { useUpdateMachine } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { useAppSelector } from "@/redux/store";
import { toast } from "react-toastify";
import { Loader2, Pencil } from "lucide-react";
import type { MachineStatus, MachineScanType, MachineData } from "@/types/track-trace";
import Image from "next/image";

// Zod Schema - Image is optional in edit
const editMachineSchema = z.object({
  machine_name: z.string().min(1, "Machine name is required"),
  machine_code: z.string().min(1, "Machine code is required"),
  machine_type: z.string().min(1, "Machine type is required"),
  status: z
    .enum(["ACTIVE", "MAINTENANCE", "INACTIVE", "RETIRED"])
    .refine((val) => val !== undefined, {
      message: "Status is required",
    }),
  scan_type: z
    .enum(["IN", "OUT", "BOTH", "PASS"])
    .refine((val) => val !== undefined, {
      message: "Scan type is required",
    }),
  description: z.string().min(1, "Description is required"),
  factory_id: z.string().optional(),
  sequence_no: z
    .string()
    .min(1, "Sequence number is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Must be a positive number",
    }),
  target_per_hour: z
    .string()
    .min(1, "Target per hour is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Must be a positive number",
    }),
  machine_image: z.array(z.instanceof(File)).optional(), // Optional in edit
});

type EditMachineFormData = z.infer<typeof editMachineSchema>;

interface EditMachineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: MachineData | null;
}

export function EditMachineModal({
  open,
  onOpenChange,
  machine,
}: EditMachineModalProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const { mutate: updateMachine, isPending } = useUpdateMachine(vendorId!);

  const form = useForm<EditMachineFormData>({
    resolver: zodResolver(editMachineSchema),
    defaultValues: {
      machine_name: "",
      machine_code: "",
      machine_type: "",
      status: undefined,
      scan_type: undefined,
      description: "",
      factory_id: "",
      sequence_no: "",
      target_per_hour: "",
      machine_image: [],
    },
  });

  // Reset form with machine data when modal opens
  React.useEffect(() => {
    if (machine && open) {
      form.reset({
        machine_name: machine.machine_name,
        machine_code: machine.machine_code,
        machine_type: machine.machine_type,
        status: machine.status as any,
        scan_type: machine.scan_type as any,
        description: machine.description,
        factory_id: machine.factory_id ? String(machine.factory_id) : "",
        sequence_no: String(machine.sequence_no),
        target_per_hour: String(machine.target_per_hour),
        machine_image: [],
      });
    }
  }, [machine, open, form]);

  const onSubmit = (data: EditMachineFormData) => {
    if (!vendorId || !userId || !machine) {
      toast.error("Required information not found");
      return;
    }

    if (!data.status) {
      toast.error("Please select a status");
      return;
    }

    if (!data.scan_type) {
      toast.error("Please select a scan type");
      return;
    }

    const payload = {
      machine_name: data.machine_name.trim(),
      machine_code: data.machine_code.trim(),
      machine_type: data.machine_type.trim(),
      status: data.status as MachineStatus,
      scan_type: data.scan_type as MachineScanType,
      description: data.description.trim(),
      factory_id: data.factory_id ? Number(data.factory_id) : null,
      sequence_no: Number(data.sequence_no),
      target_per_hour: Number(data.target_per_hour),
      updated_by: userId,
      machine_image: data.machine_image && data.machine_image.length > 0 
        ? data.machine_image[0] 
        : undefined as any, // If no new image, send undefined
    };

    const updateParams = {
      id: machine.id,
      vendor_id: vendorId,
      data: payload,
    };

    console.log("Updating machine:", updateParams);

    updateMachine(updateParams, {
      onSuccess: (response) => {
        console.log("Machine updated successfully:", response);
        toast.success("Machine updated successfully");
        form.reset();
        onOpenChange(false);
      },
      onError: (error: any) => {
        console.error("Error updating machine:", error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update machine";
        toast.error(errorMessage);
      },
    });
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Machine"
      description="Update machine information and configuration"
      size="lg"
      icon={
        <div className="flex items-center justify-center rounded-full bg-foreground text-background p-2">
          <Pencil className="h-5 w-5" />
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          {/* Current Image Preview */}
          {/* {machine?.image_path && (
            <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
              <div className="relative w-16 h-16 rounded border overflow-hidden bg-background">
                <Image
                  src={`${machine.image_path}`}
                  alt={machine.machine_name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />  
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Current Image</p>
                <p className="text-xs text-muted-foreground truncate">
                  {machine.image_path}
                </p>
              </div>
            </div>
          )} */}

          {/* Machine Name */}
          <FormField
            control={form.control}
            name="machine_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Machine Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter machine name"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Machine Code & Type - Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="machine_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Machine Code <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., CNC-ALPHA-01"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="machine_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Machine Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., CNC, Lathe, etc."
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Status & Scan Type - Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Status <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="RETIRED">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scan_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Scan Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select scan type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="IN">IN</SelectItem>
                      <SelectItem value="OUT">OUT</SelectItem>
                      <SelectItem value="BOTH">BOTH</SelectItem>
                      <SelectItem value="PASS">PASS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Sequence No & Target per Hour - Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sequence_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sequence Number <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 1"
                      {...field}
                      disabled={isPending}
                      min="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_per_hour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Target per Hour (per Sqft) <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 75"
                      {...field}
                      disabled={isPending}
                      min="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Factory ID - Optional */}
          <FormField
            control={form.control}
            name="factory_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Factory ID (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter factory ID"
                    {...field}
                    disabled={isPending}
                    min="1"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter machine description"
                    className="resize-none"
                    rows={3}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Machine Image - Optional in Edit */}
          <FormField
            control={form.control}
            name="machine_image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Update Machine Image  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <FileUploadField
                    value={field.value || []}
                    onChange={field.onChange}
                    accept="image/*"
                    multiple={false}
                    disabled={isPending}
                    maxFiles={1}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep current image
                </p>
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Machine"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
}
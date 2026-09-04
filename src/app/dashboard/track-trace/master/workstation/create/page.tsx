"use client";

import React, { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
import { FileUploadField } from "@/components/custom/file-upload";
import MachinePicker from "@/components/machine-picker";
import {
  useCreateMachine,
  useMachinesByVendor,
  useUpdateMachine,
} from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { useMachineTypes } from "@/hooks/track-trace/useTrackTraceProjects";
import { useAppSelector } from "@/redux/store";
import { toastManager } from "@/components/ui/toast";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save } from "lucide-react";
import Image from "next/image";
import type {
  MachineStatus,
  MachineScanType,
  CreateMachinePayload,
  UpdateMachinePayload,
} from "@/types/track-trace";

const workstationSchema = z.object({
  machine_name: z.string().min(1, "Workstation name is required"),
  machine_code: z.string().min(1, "Workstation code is required"),
  machine_type_id: z.string().min(1, "Workstation type is required"),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE", "RETIRED"], {
    message: "Status is required",
  }),
  scan_type: z.enum(["IN", "OUT", "BOTH", "PASS"], {
    message: "Scan type is required",
  }),
  description: z.string().min(1, "Description is required"),
  factory_id: z.string().optional(),
  sequence_no: z
    .string()
    .min(1, "Sequence number is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Sequence number must be a positive number",
    }),
  target_per_hour: z
    .string()
    .min(1, "Target per hour is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target per hour must be a positive number",
    }),
  machine_image: z.array(z.instanceof(File)).optional(),
});

type WorkstationFormData = z.infer<typeof workstationSchema>;

const normalizeStatus = (
  val?: string,
): "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "RETIRED" => {
  if (!val) return "ACTIVE";
  const s = String(val).trim().toUpperCase();
  if (s === "MAINTENANCE") return "MAINTENANCE";
  if (s === "INACTIVE") return "INACTIVE";
  if (s === "RETIRED") return "RETIRED";
  return "ACTIVE";
};

const normalizeScanType = (val?: string): "IN" | "OUT" | "BOTH" | "PASS" => {
  if (!val) return "IN";
  const s = String(val).trim().toUpperCase();
  if (s === "OUT") return "OUT";
  if (s === "BOTH") return "BOTH";
  if (s === "PASS" || s === "PAAS") return "PASS";
  return "IN";
};

function WorkstationFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdParam = searchParams.get("id");
  const editId = editIdParam ? Number(editIdParam) : null;

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const { data: machines = [], isLoading: machinesLoading } =
    useMachinesByVendor(vendorId ?? 0);
  const { data: machineTypes, isLoading: machineTypesLoading } =
    useMachineTypes();

  const { mutate: createMachine, isPending: isCreating } = useCreateMachine();
  const { mutate: updateMachine, isPending: isUpdating } = useUpdateMachine(
    vendorId ?? 0,
  );

  const editData = useMemo(() => {
    if (!editId || !machines) return null;
    return machines.find((m) => m.id === editId) || null;
  }, [machines, editId]);

  const isEdit = !!editData;
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<WorkstationFormData>({
    resolver: zodResolver(workstationSchema),
    defaultValues: {
      machine_name: "",
      machine_code: "",
      machine_type_id: "",
      status: "ACTIVE",
      scan_type: "IN",
      description: "",
      factory_id: "",
      sequence_no: "",
      target_per_hour: "",
      machine_image: [],
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset({
        machine_name: editData.machine_name || "",
        machine_code: editData.machine_code || "",
        machine_type_id: editData.machine_type_id ? String(editData.machine_type_id) : "",
        status: normalizeStatus(editData.status),
        scan_type: normalizeScanType(editData.scan_type),
        description: editData.description || "",
        factory_id: editData.factory_id ? String(editData.factory_id) : "",
        sequence_no:
          editData.sequence_no !== undefined && editData.sequence_no !== null
            ? String(editData.sequence_no)
            : "",
        target_per_hour:
          editData.target_per_hour !== undefined && editData.target_per_hour !== null
            ? String(editData.target_per_hour)
            : "",
        machine_image: [],
      });
    }
  }, [editData, form]);

  const machineTypeOptions = useMemo(() => {
    return (
      machineTypes?.data?.map((machine: any) => ({
        id: machine.id,
        label: machine.machine_type,
      })) || []
    );
  }, [machineTypes]);

  if (editId && machinesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading workstation details...</p>
      </div>
    );
  }

  const onSubmit = (data: WorkstationFormData) => {
    if (!vendorId || !userId) {
      toastManager.add({ title: "User information not found", type: "error" });
      return;
    }

    if (!isEdit && (!data.machine_image || data.machine_image.length === 0)) {
      toastManager.add({
        title: "Please upload a workstation image",
        type: "error",
      });
      return;
    }

    if (isEdit && editData) {
      const payload: UpdateMachinePayload = {
        machine_name: data.machine_name.trim(),
        machine_code: data.machine_code.trim(),
        machine_type_id: Number(data.machine_type_id.trim()),
        status: data.status as MachineStatus,
        scan_type: data.scan_type as MachineScanType,
        description: data.description.trim(),
        factory_id: data.factory_id ? Number(data.factory_id) : null,
        sequence_no: Number(data.sequence_no),
        target_per_hour: Number(data.target_per_hour),
        updated_by: Number(userId),
        machine_image:
          data.machine_image && data.machine_image.length > 0
            ? data.machine_image[0]
            : (undefined as any),
      };

      updateMachine(
        {
          id: editData.id,
          vendor_id: vendorId,
          data: payload,
        },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Workstation updated successfully",
              type: "success",
            });
            router.push("/dashboard/track-trace/master/workstation");
          },
          onError: (error: any) => {
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              "Failed to update workstation";
            toastManager.add({ title: errorMessage, type: "error" });
          },
        },
      );
    } else {
      const payload: CreateMachinePayload = {
        vendor_id: Number(vendorId),
        machine_name: data.machine_name.trim(),
        machine_code: data.machine_code.trim(),
        machine_type_id: Number(data.machine_type_id.trim()),
        status: data.status as MachineStatus,
        scan_type: data.scan_type as MachineScanType,
        description: data.description.trim(),
        factory_id: data.factory_id ? Number(data.factory_id) : null,
        sequence_no: Number(data.sequence_no),
        target_per_hour: Number(data.target_per_hour),
        created_by: Number(userId),
        machine_image: data.machine_image![0],
      };

      createMachine(payload, {
        onSuccess: () => {
          toastManager.add({
            title: "Workstation created successfully",
            type: "success",
          });
          router.push("/dashboard/track-trace/master/workstation");
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to create workstation";
          toastManager.add({ title: errorMessage, type: "error" });
        },
      });
    }
  };

  return (
    <>
      {/* Header Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/track-trace/master/workstation">
                  Workstations
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isEdit ? "Edit Workstation" : "New Workstation"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col gap-6 p-6 w-full">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {isEdit ? "Edit Workstation" : "Create New Workstation"}
              </h1>
              {isEdit && (
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold bg-primary/10 text-primary border-primary/20"
                >
                  Edit Mode
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isEdit
                ? "Update workstation configuration, scan type, and target rate"
                : "Add a new workstation to your vendor inventory"}
            </p>
          </div>
        </div>

        {/* Form Container */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            {/* Row 1: Name, Code, Type (3 items in 1 row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="machine_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Workstation Name{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter workstation name (e.g. Cutting Machine ALPHA)"
                        {...field}
                        disabled={isSubmitting}
                        className="h-10 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="machine_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Workstation Code{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., CNC-ALPHA-01"
                        {...field}
                        disabled={isSubmitting}
                        className="h-10 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="machine_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Workstation Type{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    {machineTypesLoading ? (
                      <Skeleton className="h-10 w-full rounded-md" />
                    ) : (
                      <MachinePicker
                        data={machineTypeOptions}
                        value={field.value ? Number(field.value) : undefined}
                        onChange={(selectedId: number | null) => {
                          field.onChange(selectedId ? String(selectedId) : "");
                        }}
                        placeholder="Search workstation type..."
                        className="!h-10 text-sm"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Status, Scan Type, Sequence No, Target per Hour (4 items in 1 row) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full !h-10 text-sm">
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
                    <FormLabel className="text-sm font-semibold">
                      Scan Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full !h-10 text-sm">
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

              <FormField
                control={form.control}
                name="sequence_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Sequence Number{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 1"
                        {...field}
                        disabled={isSubmitting}
                        min="1"
                        className="h-10 text-sm"
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
                    <FormLabel className="text-sm font-semibold">
                      Target per Hour (per Sqft){" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 75"
                        {...field}
                        disabled={isSubmitting}
                        min="1"
                        className="h-10 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Description <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter workstation description and purpose..."
                      className="resize-none text-sm"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Preview & Upload */}
            <div className="flex flex-col gap-2">
              {isEdit && editData?.image_path && (
                <div className="flex items-center gap-3 p-3 border rounded-xl bg-muted/20">
                  <div className="relative w-14 h-14 rounded-lg border overflow-hidden bg-background shrink-0 flex items-center justify-center">
                    <Image
                      src={editData.image_path}
                      alt={editData.machine_name || "Workstation"}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">
                      Current Image
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Upload a new image below if you wish to update it
                    </span>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="machine_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Workstation Image
                      {!isEdit && <span className="text-destructive"> *</span>}
                    </FormLabel>
                    <FormControl>
                      <FileUploadField
                        value={field.value || []}
                        onChange={field.onChange}
                        accept="image/*"
                        multiple={false}
                        disabled={isSubmitting}
                        maxFiles={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push("/dashboard/track-trace/master/workstation")
                }
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEdit ? "Save Changes" : "Create Workstation"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}

export default function CreateWorkstationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4 max-w-5xl mx-auto">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <WorkstationFormContent />
    </Suspense>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { FileUploadField } from "../custom/file-upload";
import { useAppSelector } from "@/redux/store";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import {
  Loader2,
  FolderPlus,
  Download,
  Info,
  ArrowRight,
  Search,
  UserRound,
  CheckCircle2,
  X,
  ArrowLeft,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useCreateTrackTraceProject,
  useSearchTrackTraceLeads,
  useTrackTraceVendorConfig,
  useTrackTraceProject,
  useUpdateTrackTraceProject,
} from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";

import { TrackTraceLeadOption, PackingType } from "@/types/track-trace";

const boxInfoFieldSchema = z.object({
  id: z.number().optional(),

  field_label: z
    .string()
    .min(1, "Field name is required")
    .max(50, "Field name must not exceed 50 characters"),

  field_type: z
    .enum([
      "TEXT",
      "NUMBER",
      "DATE",
      "TEXTAREA",
    ])
    .default("TEXT"),

  is_required: z
    .boolean()
    .default(false),

  sort_order: z
    .number()
    .optional(),

  active: z
    .boolean()
    .default(true),
});

const projectFormSchema = z.object({
  projectName: z
    .string()
    .min(1, "Project name is required")
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name must not exceed 100 characters"),

  lead_id: z.number().nullable().optional(),

  order_no: z.string().optional(),
  client_name: z.string().optional(),
  client_address: z.string().optional(),
  client_contact_no: z.string().optional(),
  packing_type:
    z.enum(
      PackingType
    ),

  no_of_boxes: z.coerce
    .number()
    .int("No of boxes must be an integer")
    .min(0, "No of boxes cannot be negative")
    .default(0),

  box_info_fields: z
    .array(boxInfoFieldSchema)
    .default([]),


  file: z
    .array(z.instanceof(File))
    .max(1, "Only one file is allowed")
    .optional()
    .default([])
    .refine(
      (files) => {
        if (files.length === 0) return true;

        const file = files[0];

        return (
          file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.type === "application/vnd.ms-excel" ||
          file.name.toLowerCase().endsWith(".xlsx") ||
          file.name.toLowerCase().endsWith(".xls")
        );
      },
      {
        message: "Only Excel files (.xlsx, .xls) are allowed",
      }
    ),
});


type ProjectFormInput = z.input<typeof projectFormSchema>;
type ProjectFormData = z.output<typeof projectFormSchema>;

type TrackTraceProjectFormProps = {
  mode: "create" | "edit";
  uniqueProjectId?: string;
};

type ExtendedLeadOption = TrackTraceLeadOption & {
  lastname?: string | null;
  site_address?: string | null;
};

type BoxRemovalOption = {
  id: number;
  box_name: string;
  sequence_no: number;
  box_status?: string | null;
  item_count: number;
  can_remove: boolean;
};

function LeadSearchBox({
  vendorId,
  value,
  selectedLeadFromProject,
  onChange,
  onClear,
  disabled,
}: {
  vendorId?: number;
  value?: number | null;
  selectedLeadFromProject?: ExtendedLeadOption | null;
  onChange: (leadId: number, lead: ExtendedLeadOption) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<ExtendedLeadOption | null>(
    selectedLeadFromProject || null
  );

  const { data = [], isFetching } = useSearchTrackTraceLeads(
    vendorId,
    search,
    open
  );

  useEffect(() => {
    if (selectedLeadFromProject) {
      setSelectedLead(selectedLeadFromProject);
    }
  }, [selectedLeadFromProject]);

  useEffect(() => {
    if (!value) {
      setSelectedLead(null);
    }
  }, [value]);

  const leadLabel = useMemo(() => {
    if (!selectedLead) return "";

    const fullName = [selectedLead.firstname, selectedLead.lastname]
      .filter(Boolean)
      .join(" ");

    return [fullName, selectedLead.lead_code, selectedLead.contact_no]
      .filter(Boolean)
      .join(" · ");
  }, [selectedLead]);

  const handleClear = () => {
    setSearch("");
    setOpen(false);
    setSelectedLead(null);
    onClear();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />

        <Input
          value={open ? search : leadLabel}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          placeholder="Search lead by client, project, phone or email..."
          className="h-10 pl-9 pr-10"
        />

        {(search || selectedLead) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {selectedLead && !open && (
        <div className="mt-2 rounded-xl border bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span className="font-semibold">Selected Lead:</span>
            <span>{leadLabel}</span>
          </div>
        </div>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border bg-background p-2 shadow-xl">
          {isFetching ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 size={15} className="animate-spin" />
              Searching leads...
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <UserRound size={26} className="mb-2 opacity-30" />
              <p className="text-sm font-medium">No leads found</p>
              <p className="text-xs">Try another name, phone or project.</p>
            </div>
          ) : (
            data.map((rawLead) => {
              const lead = rawLead as ExtendedLeadOption;
              const active = Number(value) === Number(lead.id);

              const fullName = [lead.firstname, lead.lastname]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={lead.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();

                    setSelectedLead(lead);
                    setSearch("");
                    setOpen(false);

                    onChange(lead.id, lead);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40"
                      : "hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      active
                        ? "bg-indigo-600 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {active ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <UserRound size={16} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {fullName || lead.firstname || "Unnamed Client"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[lead.lead_code, lead.contact_no, lead.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    {lead.site_address && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {lead.site_address}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function TrackTraceProjectForm({
  mode,
  uniqueProjectId,
}: TrackTraceProjectFormProps) {
  const router = useRouter();

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);

  const { mutate: createProject, isPending: isCreating } =
    useCreateTrackTraceProject();

  const { mutate: updateProject, isPending: isUpdating } =
    useUpdateTrackTraceProject();

  const { data: vendorConfig, isLoading: configLoading } =
    useTrackTraceVendorConfig(vendorId);

  const {
    data: projectData,
    isLoading: projectLoading,
    isError: projectError,
  } = useTrackTraceProject(mode === "edit" ? uniqueProjectId : undefined);

  const isPending = isCreating || isUpdating;
  const isCrmEnabled = !!vendorConfig?.is_crm_enabled;

  const [selectedLeadFromProject, setSelectedLeadFromProject] =
    useState<ExtendedLeadOption | null>(null);

  const [boxRemovalDialogOpen, setBoxRemovalDialogOpen] = useState(false);
  const [boxRemovalOptions, setBoxRemovalOptions] = useState<BoxRemovalOption[]>([]);
  const [boxRemovalRequiredCount, setBoxRemovalRequiredCount] = useState(0);
  const [selectedRemoveBoxIds, setSelectedRemoveBoxIds] = useState<number[]>([]);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<any | null>(null);

  const form = useForm<ProjectFormInput, unknown, ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectName: "",
      lead_id: null,
      order_no: "",
      client_name: "",
      client_address: "",
      client_contact_no: "",
      packing_type: PackingType.DEFAULT,
      no_of_boxes: 0,
      box_info_fields: [],
      file: [],
    },
  });

  const {
    fields: boxInfoFields,
    append: appendBoxInfoField,
    remove: removeBoxInfoField,
  } = useFieldArray({
    control: form.control,
    name: "box_info_fields",
  });

  const selectedLeadId = form.watch("lead_id");
  const isLeadSelected = !!selectedLeadId;

  useEffect(() => {
    if (mode !== "edit" || !projectData) return;

    const project = projectData as any;

    form.reset({
      projectName: project.project_name || "",
      lead_id: project.lead_id || null,
      order_no: project.order_no || "",
      client_name: project.client_name || "",
      client_address: project.client_address || "",
      client_contact_no: project.client_contact_no || "",

      packing_type:
        project.packing_type ||
        PackingType.DEFAULT,

      no_of_boxes:
        Number(project.no_of_boxes || 0),

      box_info_fields:
        project.box_info_fields?.map(
          (
            item: any,
            index: number
          ) => ({
            id: Number(item.id),

            field_label:
              item.field_label ||
              "",

            field_type:
              item.field_type ||
              "TEXT",

            is_required:
              Boolean(
                item.is_required
              ),

            sort_order:
              item.sort_order ||
              index + 1,

            active:
              item.active ??
              true,
          })
        ) || [],

      file: [],
    });

    if (project.lead) {
      setSelectedLeadFromProject(project.lead as ExtendedLeadOption);
    }
  }, [mode, projectData, form]);

  const handleDownloadTemplate = () => {
    try {
      const link = document.createElement("a");
      link.href = "/track-trace-template.xlsx";
      link.download = "TrackTrace_Project_Template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastManager.add({
        title: "Template downloaded successfully",
        type: "success",
      });
    } catch {
      toastManager.add({
        title: "Failed to download template",
        type: "error",
      });
    }
  };

  const clearLeadSelection = () => {
    setSelectedLeadFromProject(null);

    form.setValue("lead_id", null);
    form.setValue("order_no", "");
    form.setValue("client_name", "");
    form.setValue("client_address", "");
    form.setValue("client_contact_no", "");
  };

  const fillLeadDetails = (leadId: number, lead: ExtendedLeadOption) => {
    const fullName = [lead.firstname, lead.lastname].filter(Boolean).join(" ");

    form.setValue("lead_id", leadId);
    form.setValue("order_no", lead.lead_code || "");
    form.setValue("client_name", fullName || lead.firstname || "");
    form.setValue("client_contact_no", lead.contact_no || "");
    form.setValue("client_address", lead.site_address || "");
  };

  const validateManualFields = (data: ProjectFormData) => {
    if (data.lead_id) return true;

    if (!data.order_no?.trim()) {
      toastManager.add({
        title: "Order number is required",
        type: "error",
      });
      return false;
    }

    if (!data.client_name?.trim()) {
      toastManager.add({
        title: "Client name is required",
        type: "error",
      });
      return false;
    }

    if (!data.client_address?.trim()) {
      toastManager.add({
        title: "Client address is required",
        type: "error",
      });
      return false;
    }

    if (!data.client_contact_no?.trim()) {
      toastManager.add({
        title: "Client contact number is required",
        type: "error",
      });
      return false;
    }

    return true;
  };


  const openBoxRemovalSelection = (
    response: any,
    attemptedPayload: any
  ) => {
    const selectionData =
      response?.data?.requires_box_removal_selection
        ? response.data
        : response?.response?.data?.data?.requires_box_removal_selection
          ? response.response.data.data
          : response?.data?.data?.requires_box_removal_selection
            ? response.data.data
            : null;

    if (!selectionData) {
      return false;
    }

    const boxes = Array.isArray(selectionData.boxes)
      ? selectionData.boxes
      : [];

    setPendingUpdatePayload(attemptedPayload);
    setBoxRemovalOptions(boxes);
    setBoxRemovalRequiredCount(Number(selectionData.remove_count || 0));
    setSelectedRemoveBoxIds([]);
    setBoxRemovalDialogOpen(true);

    toastManager.add({
      title:
        response?.message ||
        response?.response?.data?.message ||
        "Select empty boxes to remove",
      type: "error",
    });

    return true;
  };

  const submitProjectUpdate = (payload: any) => {
    if (!uniqueProjectId) {
      toastManager.add({
        title: "Project ID not found",
        type: "error",
      });

      return;
    }

    updateProject(
      {
        uniqueProjectId,
        payload,
      },
      {
        onSuccess: (response: any) => {
          if (openBoxRemovalSelection(response, payload)) {
            return;
          }

          toastManager.add({
            title: response?.message || "Project updated successfully",
            type: "success",
          });

          router.push("/dashboard/track-trace/manage-project");
        },
        onError: (error: any) => {
          if (openBoxRemovalSelection(error?.response?.data || error, payload)) {
            return;
          }

          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to update project";

          toastManager.add({
            title: errorMessage,
            type: "error",
          });
        },
      }
    );
  };

  const toggleRemoveBoxSelection = (
    boxId: number,
    canRemove: boolean
  ) => {
    if (!canRemove || isPending) {
      return;
    }

    setSelectedRemoveBoxIds((previous) => {
      if (previous.includes(boxId)) {
        return previous.filter((id) => id !== boxId);
      }

      if (previous.length >= boxRemovalRequiredCount) {
        toastManager.add({
          title: `You can select only ${boxRemovalRequiredCount} box${boxRemovalRequiredCount > 1 ? "es" : ""}`,
          type: "error",
        });

        return previous;
      }

      return [...previous, boxId];
    });
  };

  const handleConfirmBoxRemoval = () => {
    if (!pendingUpdatePayload) {
      return;
    }

    if (selectedRemoveBoxIds.length !== boxRemovalRequiredCount) {
      toastManager.add({
        title: `Please select ${boxRemovalRequiredCount} empty box${boxRemovalRequiredCount > 1 ? "es" : ""}`,
        type: "error",
      });

      return;
    }

    setBoxRemovalDialogOpen(false);

    submitProjectUpdate({
      ...pendingUpdatePayload,
      remove_box_ids: selectedRemoveBoxIds,
    });
  };

  const handleCancelBoxRemoval = () => {
    setBoxRemovalDialogOpen(false);
    setPendingUpdatePayload(null);
    setSelectedRemoveBoxIds([]);
    setBoxRemovalOptions([]);
    setBoxRemovalRequiredCount(0);
  };

  const onSubmit = (data: ProjectFormData) => {
    if (!vendorId) {
      toastManager.add({
        title: "Vendor information not found",
        type: "error",
      });
      return;
    }

    if (!validateManualFields(data)) return;

    if (mode === "create" && (!data.file || data.file.length === 0)) {
      toastManager.add({
        title: "Please upload an Excel file",
        type: "error",
      });
      return;
    }

    const payload = {
      vendorId,
      lead_id: isCrmEnabled && data.lead_id ? Number(data.lead_id) : null,
      projectName: data.projectName.trim(),

      order_no: data.order_no?.trim() || undefined,
      client_name: data.client_name?.trim() || undefined,
      client_address: data.client_address?.trim() || undefined,
      client_contact_no: data.client_contact_no?.trim() || undefined,
      packing_type: data.packing_type,
      no_of_boxes: Number(data.no_of_boxes || 0),
      box_info_fields:
        data.box_info_fields
          ?.filter(
            (
              field
            ) =>
              field.field_label
                ?.trim()
          )
          .map(
            (
              field,
              index
            ) => ({
              id:
                field.id,

              field_label:
                field.field_label.trim(),

              field_type:
                field.field_type ||
                "TEXT",

              is_required:
                Boolean(
                  field.is_required
                ),

              sort_order:
                index + 1,

              active:
                true,
            })
          ) || [],

      file: data.file?.[0] || undefined,
    };

    if (mode === "edit") {
      if (!uniqueProjectId) {
        toastManager.add({
          title: "Project ID not found",
          type: "error",
        });
        return;
      }

      submitProjectUpdate(payload);

      return;
    }

    createProject(payload as any, {
      onSuccess: (response) => {
        toastManager.add({
          title: response.message || "Project created successfully",
          type: "success",
        });

        router.push("/dashboard/track-trace/manage-project");
      },

      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to create project";

        toastManager.add({
          title: errorMessage,
          type: "error",
        });
      },
    });
  };

  if (mode === "edit" && projectLoading) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Loading project...
      </div>
    );
  }

  if (mode === "edit" && projectError) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm font-semibold text-red-600">
          Failed to load project.
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/track-trace/manage-project")}
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {mode === "edit" ? "Edit Track & Trace Project" : "Create Project"}
          </h1>

          <p className="text-sm text-muted-foreground">
            {mode === "edit"
              ? "Update project details. Excel upload is optional while editing."
              : "Create a Track & Trace project by selecting a lead or entering client details manually."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/track-trace/manage-project")}
        >
          <ArrowLeft size={15} className="mr-2" />
          Back
        </Button>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-5">
            <div className="rounded-xl border border-foreground/10 bg-muted/40 p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0" />

                <div className="flex-1 space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Quick Setup Guide</p>

                    <ol className="list-inside list-decimal space-y-1.5 text-muted-foreground">
                      {isCrmEnabled && (
                        <li>
                          Select the lead/project this cutlist belongs to, if
                          available.
                        </li>
                      )}
                      <li>
                        If lead is not available, enter order and client details
                        manually.
                      </li>
                      <li>Download and fill the Excel template.</li>
                      <li>Upload the completed file.</li>
                    </ol>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    disabled={isPending}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Project Name <span className="text-destructive">*</span>
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder="e.g., Villa A Track & Trace Project"
                        {...field}
                        disabled={isPending}
                        className="h-10"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {configLoading ? (
                <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  Checking CRM configuration...
                </div>
              ) : isCrmEnabled ? (
                <FormField
                  control={form.control}
                  name="lead_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Select Lead{" "}
                        <span className="text-xs text-muted-foreground">
                          (optional)
                        </span>
                      </FormLabel>

                      <FormControl>
                        <LeadSearchBox
                          vendorId={vendorId}
                          value={field.value ?? undefined}
                          selectedLeadFromProject={selectedLeadFromProject}
                          disabled={isPending}
                          onClear={clearLeadSelection}
                          onChange={(leadId, lead) => {
                            field.onChange(leadId);
                            fillLeadDetails(leadId, lead);
                          }}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  CRM is disabled for this vendor. Project will be created
                  without lead mapping.
                </div>
              )}

              <FormField
                control={form.control}
                name="order_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Order Number <span className="text-destructive">*</span>
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Enter order number"
                        {...field}
                        disabled={isPending || isLeadSelected}
                        className="h-10 disabled:bg-muted/60"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Client Name <span className="text-destructive">*</span>
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Enter client name"
                        {...field}
                        disabled={isPending || isLeadSelected}
                        className="h-10 disabled:bg-muted/60"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_contact_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Client Contact No{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Enter contact number"
                        {...field}
                        disabled={isPending || isLeadSelected}
                        className="h-10 disabled:bg-muted/60"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <br />

              <FormField
                control={form.control}
                name="packing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Packing Type{" "}
                      <span className="text-destructive">
                        *
                      </span>
                    </FormLabel>

                    <FormControl>
                      <select
                        value={
                          field.value ||
                          PackingType.DEFAULT
                        }
                        onChange={(event) =>
                          field.onChange(
                            event.target
                              .value as PackingType
                          )
                        }
                        disabled={isPending}
                        className="
            h-10
            w-full
            rounded-md
            border
            border-input
            bg-background
            px-3
            py-2
            text-sm
            outline-none
            transition-colors
            focus:border-indigo-500
            focus:ring-2
            focus:ring-indigo-200
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
                      >
                        <option
                          value={
                            PackingType.DEFAULT
                          }
                        >
                          Default
                        </option>

                        <option
                          value={
                            PackingType.GROUPWISE
                          }
                        >
                          Groupwise
                        </option>
                      </select>
                    </FormControl>

                    {field.value ===
                      PackingType.GROUPWISE ? (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                        Items belonging to one
                        group can be packed only
                        with items from the same
                        group. One group may be
                        packed across multiple
                        boxes.
                      </div>
                    ) : (
                      <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                        Any item can be packed in
                        any box without group
                        restrictions.
                      </div>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="no_of_boxes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      No of Boxes{" "}
                      <span className="text-xs text-muted-foreground">
                        (optional)
                      </span>
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="e.g., 10"
                        value={String(field.value ?? 0)}
                        disabled={isPending}
                        onChange={(event) => {
                          const value = event.target.value;

                          field.onChange(value === "" ? 0 : Number(value));
                        }}
                        className="h-10"
                      />
                    </FormControl>

                    <p className="text-xs leading-5 text-muted-foreground">
                      When creating a project, boxes will be generated as 1, 2,
                      3... up to this number. While editing, reducing this
                      number will require selecting empty boxes to remove.
                    </p>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Client Address <span className="text-destructive">*</span>
                    </FormLabel>

                    <FormControl>
                      <textarea
                        placeholder="Enter client address"
                        {...field}
                        disabled={isPending || isLeadSelected}
                        className="min-h-[95px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none disabled:bg-muted/60 focus:ring-2 focus:ring-indigo-300"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 rounded-2xl border bg-muted/20 p-4">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">
                      Box Information Fields
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Configure extra box fields for the mobile app. Example: Floor Name,
                      Room Name, Zone, Area, Tower, Flat No.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      appendBoxInfoField({
                        field_label: "",
                        field_type: "TEXT",
                        is_required: false,
                        active: true,
                        sort_order: boxInfoFields.length + 1,
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New
                  </Button>
                </div>

                {boxInfoFields.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-background px-4 py-6 text-center">
                    <p className="text-sm font-medium">
                      No box information fields configured
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Click Add New to create fields that will appear in the mobile app while
                      creating or editing a box.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {boxInfoFields.map((item, index) => (
                      <div
                        key={item.id}
                        className="grid gap-3 rounded-xl border bg-background p-3 md:grid-cols-[1fr_150px_120px_44px]"
                      >
                        <FormField
                          control={form.control}
                          name={`box_info_fields.${index}.field_label`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Field Name
                              </FormLabel>

                              <FormControl>
                                <Input
                                  placeholder="e.g., Floor Name"
                                  disabled={isPending}
                                  {...field}
                                  className="h-10"
                                />
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`box_info_fields.${index}.field_type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Type
                              </FormLabel>

                              <FormControl>
                                <select
                                  value={field.value || "TEXT"}
                                  disabled={isPending}
                                  onChange={(event) =>
                                    field.onChange(event.target.value)
                                  }
                                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="TEXT">
                                    Text
                                  </option>

                                  <option value="NUMBER">
                                    Number
                                  </option>

                                  <option value="DATE">
                                    Date
                                  </option>

                                  <option value="TEXTAREA">
                                    Textarea
                                  </option>
                                </select>
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`box_info_fields.${index}.is_required`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Required
                              </FormLabel>

                              <FormControl>
                                <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(field.value)}
                                    disabled={isPending}
                                    onChange={(event) =>
                                      field.onChange(event.target.checked)
                                    }
                                    className="h-4 w-4"
                                  />

                                  Yes
                                </label>
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-end justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                            onClick={() => removeBoxInfoField(index)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Upload Excel File{" "}
                      {mode === "create" && (
                        <span className="text-destructive">*</span>
                      )}
                      {mode === "edit" && (
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          (optional)
                        </span>
                      )}
                    </FormLabel>

                    <FormControl>
                      <FileUploadField
                        value={field.value || []}
                        onChange={field.onChange}
                        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        multiple={false}
                        disabled={isPending}
                        maxFiles={1}
                      />
                    </FormControl>

                    {mode === "edit" && (
                      <p className="text-xs text-muted-foreground">
                        Leave empty if you do not want to upload a new Excel
                        file.
                      </p>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-5">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => router.push("/dashboard/track-trace/manage-project")}
                className="min-w-[100px]"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isPending}
                className="min-w-[150px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "edit" ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {mode === "edit" ? "Update Project" : "Create Project"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {boxRemovalDialogOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
            <div className="border-b p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Select Empty Boxes to Remove
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    You reduced No of Boxes. Select exactly{" "}
                    <span className="font-semibold text-foreground">
                      {boxRemovalRequiredCount}
                    </span>{" "}
                    empty box{boxRemovalRequiredCount > 1 ? "es" : ""} to
                    remove. Boxes with items cannot be removed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCancelBoxRemoval}
                  disabled={isPending}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-5">
              <div className="mb-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                Selected{" "}
                <span className="font-semibold">
                  {selectedRemoveBoxIds.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold">
                  {boxRemovalRequiredCount}
                </span>
              </div>

              <div className="space-y-2">
                {boxRemovalOptions.map((box) => {
                  const selected = selectedRemoveBoxIds.includes(box.id);
                  const disabled = !box.can_remove || isPending;

                  return (
                    <button
                      key={box.id}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        toggleRemoveBoxSelection(box.id, box.can_remove)
                      }
                      className={cn(
                        "flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                          : "bg-background hover:bg-muted/60",
                        disabled && "cursor-not-allowed opacity-60"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={disabled}
                          readOnly
                          className="h-4 w-4"
                        />

                        <div className="min-w-0">
                          <p className="font-semibold">
                            Box {box.box_name || box.sequence_no}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Status: {box.box_status || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            box.item_count > 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          )}
                        >
                          {box.item_count} item{box.item_count === 1 ? "" : "s"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {box.can_remove ? "Can remove" : "Cannot remove"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t p-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelBoxRemoval}
                disabled={isPending}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmBoxRemoval}
                disabled={
                  isPending ||
                  selectedRemoveBoxIds.length !== boxRemovalRequiredCount
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Selected Boxes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
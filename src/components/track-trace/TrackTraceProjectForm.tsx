"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
} from "lucide-react";

import {
  useCreateTrackTraceProject,
  useSearchTrackTraceLeads,
  useTrackTraceVendorConfig,
  useTrackTraceProject,
  useUpdateTrackTraceProject,
} from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";

import { TrackTraceLeadOption } from "@/types/track-trace";

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

  file: z
    .array(z.instanceof(File))
    .max(1, "Only one file is allowed")
    .optional()
    .default([])
    .refine(
      (files) => {
        if (!files || files.length === 0) return true;

        const file = files[0];

        return (
          file.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.type === "application/vnd.ms-excel" ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
        );
      },
      {
        message: "Only Excel files (.xlsx, .xls) are allowed",
      }
    ),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

type TrackTraceProjectFormProps = {
  mode: "create" | "edit";
  uniqueProjectId?: string;
};

type ExtendedLeadOption = TrackTraceLeadOption & {
  lastname?: string | null;
  site_address?: string | null;
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

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectName: "",
      lead_id: null,
      order_no: "",
      client_name: "",
      client_address: "",
      client_contact_no: "",
      file: [],
    },
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

      updateProject(
        {
          uniqueProjectId,
          payload,
        },
        {
          onSuccess: (response: any) => {
            toastManager.add({
              title: response?.message || "Project updated successfully",
              type: "success",
            });

            router.push("/dashboard/track-trace/manage-project");
          },
          onError: (error: any) => {
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
    </div>
  );
}
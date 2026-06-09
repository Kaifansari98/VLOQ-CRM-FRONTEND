"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { FileUploadField } from "../custom/file-upload";
import { useAppSelector } from "@/redux/store";
import { toastManager } from "@/components/ui/toast";
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
} from "lucide-react";
import {
  useCreateTrackTraceProject,
  useSearchTrackTraceLeads,
  useTrackTraceVendorConfig,
} from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { cn } from "@/lib/utils";
import { TrackTraceLeadOption } from "@/types/track-trace";

const createProjectSchema = z.object({
  projectName: z
    .string()
    .min(1, "Project name is required")
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name must not exceed 100 characters"),

    lead_id: z.number().nullable().optional(),

  file: z
    .array(z.instanceof(File))
    .min(1, "Excel file is required")
    .max(1, "Only one file is allowed")
    .refine(
      (files) =>
        files.length === 0 ||
        files[0].type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        files[0].type === "application/vnd.ms-excel" ||
        files[0].name.endsWith(".xlsx") ||
        files[0].name.endsWith(".xls"),
      {
        message: "Only Excel files (.xlsx, .xls) are allowed",
      }
    ),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LeadSearchBox({
  vendorId,
  value,
  onChange,
  disabled,
}: {
  vendorId?: number;
  value?: number;
  onChange: (leadId: number, lead: TrackTraceLeadOption) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedLead, setSelectedLead] =
    useState<TrackTraceLeadOption | null>(null);

  const { data = [], isFetching } = useSearchTrackTraceLeads(
    vendorId,
    search,
    open
  );

  useEffect(() => {
    if (!value) {
      setSelectedLead(null);
    }
  }, [value]);

  const leadLabel = useMemo(() => {
    if (!selectedLead) return "";

    return [
      selectedLead.firstname,
      selectedLead.lead_code,
      selectedLead.contact_no,
    ]
      .filter(Boolean)
      .join(" · ");
  }, [selectedLead]);

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
            onClick={() => {
              setSearch("");
              setSelectedLead(null);
              setOpen(false);
            }}
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
            data.map((lead) => {
              const active = Number(value) === Number(lead.id);

              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => {
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
                    {active ? <CheckCircle2 size={16} /> : <UserRound size={16} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {lead.firstname || "Unnamed Client"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[
                        lead.lead_code,
                        lead.contact_no,
                        lead.email,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
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

export function CreateProjectModal({
  open,
  onOpenChange,
}: CreateProjectModalProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);

  const { mutate: createProject, isPending } = useCreateTrackTraceProject();

  const { data: vendorConfig, isLoading: configLoading } =
  useTrackTraceVendorConfig(vendorId);

const isCrmEnabled = !!vendorConfig?.is_crm_enabled;

  const form = useForm<CreateProjectFormData>({
  resolver: zodResolver(createProjectSchema),
  defaultValues: {
    projectName: "",
    lead_id: null,
    file: [],
  },
});

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
    } catch (error) {
      toastManager.add({
        title: "Failed to download template",
        type: "error",
      });
    }
  };

  const onSubmit = (data: CreateProjectFormData) => {
    
    if (!vendorId) {
      toastManager.add({
        title: "Vendor information not found",
        type: "error",
      });
      return;
    }
    
    // if (!data.lead_id || Number(data.lead_id) <= 0) {
    //   toastManager.add({
    //     title: "Please select a lead",
    //     type: "error",
    //   });
    //   return;
    // }

    if (!data.file || data.file.length === 0) {
      toastManager.add({
        title: "Please upload an Excel file",
        type: "error",
      });
      return;
    }

    const payload = {
      vendorId: vendorId,
      lead_id: isCrmEnabled && data.lead_id ? Number(data.lead_id) : null,
      projectName: data.projectName.trim(),
      file: data.file[0],
    };

    createProject(payload, {
      onSuccess: (response) => {
        toastManager.add({
          title: response.message || "Project created successfully",
          type: "success",
        });

        form.reset({
          projectName: "",
          lead_id: null,
          file: [],
        });

        onOpenChange(false);
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

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Project"
      description="Create a new Track & Trace project by uploading an Excel file"
      size="md"
      icon={
        <div className="flex items-center justify-center rounded-full bg-foreground p-2 text-background">
          <FolderPlus className="h-5 w-5" />
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-6">
          <div className="rounded-lg border border-foreground/20 bg-muted p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Quick Setup Guide</p>
                  <ol className="list-inside list-decimal space-y-1.5">
                    {isCrmEnabled && <li>Select the lead/project this cutlist belongs to, if applicable</li>}
                    <li>Download the Excel template below</li>
                    <li>Fill in your project data</li>
                    <li>Upload the completed file</li>
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
        <FormLabel className="text-sm font-medium">
          Select Lead <span className="text-xs text-muted-foreground">(optional)</span>
        </FormLabel>

        <FormControl>
          <LeadSearchBox
            vendorId={vendorId}
            value={field.value ?? undefined}
            disabled={isPending}
            onChange={(leadId) => field.onChange(leadId)}
          />
        </FormControl>

        <FormMessage />
      </FormItem>
    )}
  />
) : (
  <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
    CRM is disabled for this vendor. Project will be created without lead mapping.
  </div>
)}

          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Project Name <span className="text-destructive">*</span>
                </FormLabel>

                <FormControl>
                  <Input
                    placeholder="e.g., Q1 2024 Manufacturing Project"
                    {...field}
                    disabled={isPending}
                    className="h-10"
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
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Upload Excel File <span className="text-destructive">*</span>
                </FormLabel>

                <FormControl>
                  <FileUploadField
                    value={field.value}
                    onChange={field.onChange}
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    multiple={false}
                    disabled={isPending}
                    maxFiles={1}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset({
                  projectName: "",
                  lead_id: 0,
                  file: [],
                });
                onOpenChange(false);
              }}
              disabled={isPending}
              className="min-w-[100px]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isPending}
              className="min-w-[140px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </BaseModal>
  );
}
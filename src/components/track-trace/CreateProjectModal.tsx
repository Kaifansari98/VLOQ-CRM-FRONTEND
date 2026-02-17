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
import { FileUploadField } from "../custom/file-upload";
import { useAppSelector } from "@/redux/store";
import { toast } from "react-toastify";
import {
  Loader2,
  FolderPlus,
  Download,
  FileSpreadsheet,
  Info,
  ArrowRight,
} from "lucide-react";
import { useCreateTrackTraceProject } from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";

// Zod Schema
const createProjectSchema = z.object({
  projectName: z
    .string()
    .min(1, "Project name is required")
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name must not exceed 100 characters"),
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
      },
    ),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
}: CreateProjectModalProps) {
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const vendorToken = "7e7a9dda-cc59-4ec4-b153-cfdc0ddd6b01";

  const { mutate: createProject, isPending } = useCreateTrackTraceProject();

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      projectName: "",
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

      toast.success("Template downloaded successfully");
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const onSubmit = (data: CreateProjectFormData) => {
    if (!vendorId) {
      toast.error("Vendor information not found");
      return;
    }

    if (!vendorToken) {
      toast.error("Vendor token not found");
      return;
    }

    if (!data.file || data.file.length === 0) {
      toast.error("Please upload an Excel file");
      return;
    }

    const payload = {
      vendorToken: vendorToken,
      vendorId: vendorId,
      projectName: data.projectName.trim(),
      file: data.file[0],
    };

    console.log("Submitting project payload:", {
      ...payload,
      file: payload.file.name,
    });

    createProject(payload, {
      onSuccess: (response) => {
        console.log("Project created successfully:", response);
        toast.success(response.message || "Project created successfully");
        form.reset();
        onOpenChange(false);
      },
      onError: (error: any) => {
        console.error("Error creating project:", error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to create project";
        toast.error(errorMessage);
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
        <div className="flex items-center justify-center rounded-full bg-foreground text-background p-2">
          <FolderPlus className="h-5 w-5" />
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-6">
          {/* Instructions Card */}
          <div className="rounded-lg border border-foreground/20 bg-muted p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Quick Setup Guide</p>
                  <ol className="space-y-1.5 list-decimal list-inside">
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

          {/* Project Name */}
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

          {/* File Upload */}
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
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

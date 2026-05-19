"use client";

import AssignToPicker from "@/components/assign-to-picker";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { Button } from "@/components/ui/button";
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
import BaseModal from "@/components/utils/baseModal";
import { useAppSelector } from "@/redux/store";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { toastManager } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAssignToSiteReadiness } from "@/api/production/useReadyToDispatchLeads";
import {
  AssignToSiteReadinessPayload,
  useCurrentSitePhotosCount,
  useSiteReadinessTaskConflicts,
} from "@/api/production/useReadyToDispatchLeads";
import { useVendorSiteSupervisorUsers } from "@/hooks/useVendorSiteSupervisorUsers"; // ✅ now using supervisors
import { canAssignSR } from "@/components/utils/privileges";
import CustomeTooltip from "@/components/custom-tooltip";
import { useAssignedSiteSupervisor } from "@/api/installation/useSiteReadinessLeads";
import { useFollowUpUsers } from "@/hooks/useFollowUpUsers";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ✅ Validation schema
const formSchema = z
  .object({
    assign_lead_to: z.number().min(1, "Assign lead to is required"),
    task_type: z.enum(["Site Readiness", "Follow Up"], {
      message: "Task Type is required",
    }),
    due_date: z
      .string()
      .min(1, "Due Date is required")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }),
    remark: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.task_type === "Follow Up") {
        return data.remark && data.remark.trim().length > 0;
      }
      return true;
    },
    {
      message: "Remark is required for Follow Up",
      path: ["remark"],
    }
  );

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
  };
  onlyFollowUp?: boolean;
  userType?: string; // ✅ add this line
}

const AssignTaskSiteReadinessForm: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
  userType,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const loggedInUserType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const franchiseId = useAppSelector(
    (state) => state.auth.franchise_id ?? state.auth.user?.franchise_id
  );
  const userId = useAppSelector((state) => state.auth.user?.id);
  const router = useRouter();
  const leadId = data?.id!;
  const mutation = useAssignToSiteReadiness(leadId);
  const queryClient = useQueryClient();
  const normalizedUserType = (loggedInUserType ?? userType ?? "").toLowerCase();
  const isAllowedToAssignSR =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.ready_to_dispatch.assign_site_readiness_task.action",
        )
      : canAssignSR(userType);
  const canAssignSiteReadinessForCustomUser =
    normalizedUserType === "custom"
      ? customPrivilegeCodes.includes(
          "production.production.ready_to_dispatch.assign_site_readiness_task.action",
        )
      : true;

      console.log("canAssignSiteReadinessForCustomUser log: ", canAssignSiteReadinessForCustomUser)
  const canShowSiteReadinessTaskType =
    isAllowedToAssignSR && canAssignSiteReadinessForCustomUser;
  const dueDateMinDate = React.useMemo(() => {
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);

    if (normalizedUserType === "super-admin") {
      return formatLocalDate(minDate);
    }

    minDate.setDate(minDate.getDate() + 2);
    return formatLocalDate(minDate);
  }, [normalizedUserType]);

  const { data: assignedSiteSupervisor } = useAssignedSiteSupervisor(
    vendorId,
    leadId
  );

  const {
    data: currentSitePhotosCount,
    isLoading: isLoadingCurrentSitePhotosCount,
  } = useCurrentSitePhotosCount(vendorId, leadId);
  const {
    data: taskConflicts,
    isLoading: isLoadingSiteReadinessTaskConflicts,
  } = useSiteReadinessTaskConflicts(leadId);

  const hasCurrentSitePhotos = currentSitePhotosCount?.hasPhotos === true;
  const siteReadinessTaskConflicts =
    taskConflicts?.restrictedTaskConflicts ?? [];
  const followUpConflicts = taskConflicts?.followUpConflicts ?? [];
  const siteReadinessConflict = siteReadinessTaskConflicts.find(
    (task) => task.task_type === "Site Readiness",
  );
  const isSiteReadinessConflictLocked = !!siteReadinessConflict;

  // ✅ Fetch vendor site supervisors
  const {
    data: vendorUsers,
    isLoading: loadingUsers,
    error,
  } = useVendorSiteSupervisorUsers(vendorId!);

  const { data: followUpUsersData } = useFollowUpUsers(vendorId, leadId, franchiseId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assign_lead_to: undefined,
      task_type: canShowSiteReadinessTaskType ? "Site Readiness" : "Follow Up",
      due_date: "",
      remark: "N/A",
    },
  });

  const taskType = form.watch("task_type");

  const siteSupervisorList =
    vendorUsers?.data?.site_supervisors?.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    })) ?? [];
  const followUpTooltip =
    "A Follow Up Task is already assigned to this user, which is not yet completed.";

  const mappedData =
    normalizedUserType === "custom"
      ? (followUpUsersData?.data?.users ?? []).map((u: any) => ({
          id: u.id,
          label: u.user_name,
          disabled: false,
          tooltip: undefined,
        }))
      : taskType === "Follow Up"
        ? (followUpUsersData?.data?.users ?? []).map((u: any) => ({
            id: u.id,
            label: u.user_name,
            disabled:
              u.id !== userId &&
              followUpConflicts.some((task) => task.assignee?.id === u.id),
            tooltip:
              u.id !== userId &&
              followUpConflicts.some((task) => task.assignee?.id === u.id)
                ? followUpTooltip
                : undefined,
          }))
        : siteSupervisorList;

  const assignedSupervisorId =
    assignedSiteSupervisor?.supervisor?.id ??
    assignedSiteSupervisor?.user_id ??
    undefined;
  const matchedSupervisorId = siteSupervisorList.find(
    (user: { id: number; label: string }) => user.id === assignedSupervisorId
  )?.id;
  const isSiteReadinessTask = taskType === "Site Readiness";
  const shouldLockAssignee =
    normalizedUserType !== "custom" && isSiteReadinessTask && !!matchedSupervisorId;
  const isSiteReadinessSelectionDisabled =
    isLoadingSiteReadinessTaskConflicts ||
    isSiteReadinessConflictLocked ||
    !hasCurrentSitePhotos;
  const siteReadinessDisabledTooltip = isLoadingSiteReadinessTaskConflicts
    ? "Checking existing tasks"
    : isSiteReadinessConflictLocked
      ? "Site Readiness task already created and not completed"
      : "Please upload current site photos before moving this lead to Site Readiness.";

  // ✅ Auto-select "Follow Up" if Site Readiness is disabled
  React.useEffect(() => {
    if (isLoadingCurrentSitePhotosCount || !canShowSiteReadinessTaskType) return;

    form.setValue(
      "task_type",
      !isSiteReadinessSelectionDisabled ? "Site Readiness" : "Follow Up"
    );
  }, [
    canShowSiteReadinessTaskType,
    isLoadingCurrentSitePhotosCount,
    isSiteReadinessSelectionDisabled,
    form,
  ]);

  React.useEffect(() => {
    if (
      normalizedUserType !== "custom" &&
      isSiteReadinessTask &&
      shouldLockAssignee &&
      form.getValues("assign_lead_to") !== matchedSupervisorId
    ) {
      form.setValue("assign_lead_to", matchedSupervisorId);
    }
  }, [isSiteReadinessTask, shouldLockAssignee, matchedSupervisorId, form, normalizedUserType]);

  React.useEffect(() => {
    if (taskType !== "Follow Up") return;

    const selectedUserId = form.getValues("assign_lead_to");
    if (
      selectedUserId &&
      selectedUserId !== userId &&
      followUpConflicts.some((task) => task.assignee?.id === selectedUserId)
    ) {
      form.resetField("assign_lead_to");
    }
  }, [form, taskType, followUpConflicts, userId]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (
      values.task_type === "Site Readiness" &&
      isSiteReadinessConflictLocked
    ) {
      toastManager.add({
        title: "Site Readiness task already created and not completed",
        type: "error",
      });
      return;
    }

    if (
      values.task_type === "Follow Up" &&
      values.assign_lead_to !== userId &&
      followUpConflicts.some(
        (task) => task.assignee?.id === values.assign_lead_to,
      )
    ) {
      toastManager.add({
        title: followUpTooltip,
        type: "error",
      });
      return;
    }

    const payload: AssignToSiteReadinessPayload = {
      task_type: values.task_type,
      due_date: values.due_date,
      remark: values.remark,
      user_id: values.assign_lead_to!,
      created_by: userId!,
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        toastManager.add({ title: "Task assigned successfully!", type: "success" });
        queryClient.invalidateQueries({
          queryKey: ["leadStats"],
        });

        queryClient.invalidateQueries({
          queryKey: ["universal-stage-leads"],
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: ["vendorOverallLeads"],
        });
        onOpenChange(false);

        if (values.task_type === "Site Readiness") {
          router.push("/dashboard/installation/site-readiness");
        }
      },
      onError: (error: any) => {
        const backendMessage =
          error?.response?.data?.message ||
          error.message ||
          "Something went wrong";
        toastManager.add({ title: backendMessage, type: "error" });
      },
    });
  };

  if (loadingUsers) {
    return (
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Loading..."
        size="lg"
      >
        <div className="p-6">Loading Site Supervisors...</div>
      </BaseModal>
    );
  }

  if (error) {
    return (
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Error"
        size="lg"
      >
        <div className="p-6">Error: {error.message}</div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        form.watch("task_type") === "Follow Up" || !canShowSiteReadinessTaskType
          ? "Assign Task for Follow Up"
          : "Assign Task for Site Readiness"
      }
      description={
        form.watch("task_type") === "Follow Up" || !canShowSiteReadinessTaskType
          ? "Use this form to assign a follow up task."
          : "Use this form to assign a task to a Site Supervisor for Site Readiness."
      }
      size="smd"
    >
      <div className="px-6 py-6 space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Task Type */}
            <Controller
              control={form.control}
              name="task_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Task Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {canShowSiteReadinessTaskType ? (
                        <>
                          {/* 🔹 If API says site photos missing → disable + tooltip */}
                          {!isSiteReadinessSelectionDisabled ? (
                            <SelectItem value="Site Readiness">
                              Site Readiness
                            </SelectItem>
                          ) : (
                            <CustomeTooltip
                              value={siteReadinessDisabledTooltip}
                              truncateValue={
                                <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                                  <span>Site Readiness</span>
                                  <span className="text-xs italic text-muted-foreground ml-1">
                                    (locked)
                                  </span>
                                </div>
                              }
                            />
                          )}

                          {/* Always allow Follow Up */}
                          <SelectItem value="Follow Up">Follow Up</SelectItem>
                        </>
                      ) : (
                        <SelectItem value="Follow Up">Follow Up</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assign Lead To + Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assign_lead_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {normalizedUserType === "custom" ? "Select User" : "Select Site Supervisor"}
                    </FormLabel>
                    <FormControl>
                      <AssignToPicker
                        data={mappedData}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={shouldLockAssignee}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-sm">Due Date</FormLabel>
                    <FormControl>
                      <CustomeDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        restriction="futureOnly"
                        minDate={dueDateMinDate}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Remark */}
            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Remark</FormLabel>
                  <FormControl>
                    <TextAreaInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your remark"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
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
                {mutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default AssignTaskSiteReadinessForm;

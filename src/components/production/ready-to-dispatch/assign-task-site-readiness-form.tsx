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
import { FileUploadField } from "@/components/custom/file-upload";
import {
  useApprovalRequestAssignableUsers,
  useCreateApprovalRequest,
} from "@/hooks/useApprovalRequests";
import { useSelfAssignTaskTypes } from "@/hooks/useSelfAssignTaskTypes";

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
    task_type: z.string().min(1, "Task Type is required"),
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
  )
  .refine(
    (data) => {
      if (data.task_type === "Approval Request") {
        return (
          !!data.remark &&
          data.remark.trim().length > 0 &&
          data.remark.trim().toLowerCase() !== "n/a"
        );
      }
      return true;
    },
    {
      message: "Remark is required",
      path: ["remark"],
    },
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
  const isApprovalTaskEnabled = useAppSelector(
    (state) => state.auth.user?.vendor?.is_approval_task_enabled as
      | boolean
      | null
      | undefined,
  );
  const isSelfAssignTaskTypeMasterEnabled = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_self_assign_task_type_master_enabed !== false,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const franchiseId = useAppSelector(
    (state) => state.auth.franchise_id ?? state.auth.user?.franchise_id
  );
  const userId = useAppSelector((state) => state.auth.user?.id);
  const loggedInUserName = useAppSelector(
    (state) => state.auth.user?.user_name ?? "",
  );
  const userTypeId = useAppSelector((state) => state.auth.user?.user_type_id);
  const router = useRouter();
  const leadId = data?.id!;
  const mutation = useAssignToSiteReadiness(leadId);
  const approvalRequestMutation = useCreateApprovalRequest(leadId);
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
  const {
    data: approvalRequestAssignableUsersData,
    isLoading: loadingApprovalRequestUsers,
    error: approvalRequestUsersError,
  } = useApprovalRequestAssignableUsers(vendorId, leadId);

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
  const [approvalFiles, setApprovalFiles] = React.useState<File[]>([]);
  const isApprovalRequestTask = taskType === "Approval Request";
  const canShowApprovalRequestOption = isApprovalTaskEnabled !== false;
  const {
    data: selfAssignTaskTypes = [],
    isLoading: loadingSelfAssignTaskTypes,
    error: selfAssignTaskTypesError,
  } = useSelfAssignTaskTypes(
    vendorId,
    userTypeId,
    isSelfAssignTaskTypeMasterEnabled,
  );
  const selfAssignTaskTypeNames = React.useMemo(
    () =>
      Array.from(
        new Set(
          selfAssignTaskTypes
            .map((taskType) => taskType.type?.trim())
            .filter(
              (taskType): taskType is string =>
                !!taskType &&
                !["Site Readiness", "Follow Up", "Approval Request"].includes(
                  taskType,
                ),
            ),
        ),
      ),
    [selfAssignTaskTypes],
  );
  const isSelfAssignTask = selfAssignTaskTypeNames.includes(taskType);

  const siteSupervisorList =
    vendorUsers?.data?.site_supervisors?.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    })) ?? [];
  const followUpTooltip =
    "A Follow Up Task is already assigned to this user, which is not yet completed.";
  const approvalRequestUsers = React.useMemo(() => {
    const users = approvalRequestAssignableUsersData?.users ?? [];
    const shouldRestrictToFranchise =
      normalizedUserType === "admin" ||
      normalizedUserType === "sales-executive";

    return users.filter((user) => {
      if (user.id === userId) return false;
      if (shouldRestrictToFranchise) {
        return user.franchise_id === franchiseId;
      }
      return true;
    });
  }, [
    approvalRequestAssignableUsersData?.users,
    franchiseId,
    normalizedUserType,
    userId,
  ]);

  const mappedData =
    isApprovalRequestTask
      ? approvalRequestUsers.map((user) => ({
          id: user.id,
          label: user.user_name,
        }))
      : isSelfAssignTask
      ? [
          {
            id: userId ?? 0,
            label: loggedInUserName,
          },
        ]
      : normalizedUserType === "custom"
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
    if (!open || isLoadingCurrentSitePhotosCount) return;

    const currentTaskType = form.getValues("task_type");

    if (
      isSelfAssignTask ||
      currentTaskType === "Approval Request" ||
      currentTaskType === "Follow Up"
    ) {
      return;
    }

    const nextTaskType =
      canShowSiteReadinessTaskType && !isSiteReadinessSelectionDisabled
        ? "Site Readiness"
        : "Follow Up";

    if (currentTaskType !== nextTaskType) {
      form.setValue("task_type", nextTaskType, {
        shouldValidate: true,
      });
    }
  }, [
    canShowSiteReadinessTaskType,
    form,
    isLoadingCurrentSitePhotosCount,
    isSelfAssignTask,
    isSiteReadinessSelectionDisabled,
    open,
  ]);

  React.useEffect(() => {
    if (
      taskType === "Approval Request" &&
      form.getValues("remark")?.trim().toLowerCase() === "n/a"
    ) {
      form.setValue("remark", "");
    }
  }, [form, taskType]);

  React.useEffect(() => {
    if (
      isSelfAssignTask &&
      userId &&
      form.getValues("assign_lead_to") !== userId
    ) {
      form.setValue("assign_lead_to", userId, {
        shouldValidate: true,
      });
    }
  }, [form, isSelfAssignTask, userId]);

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

  React.useEffect(() => {
    const selectedUserId = form.getValues("assign_lead_to");
    if (!selectedUserId) return;

    const isSelectedUserStillAvailable = mappedData.some(
      (user: { id: number }) => user.id === selectedUserId,
    );

    if (!isSelectedUserStillAvailable) {
      form.resetField("assign_lead_to");
    }
  }, [form, mappedData]);

  React.useEffect(() => {
    if (
      form.getValues("task_type") === "Approval Request" &&
      !canShowApprovalRequestOption
    ) {
      form.setValue(
        "task_type",
        canShowSiteReadinessTaskType && !isSiteReadinessSelectionDisabled
          ? "Site Readiness"
          : "Follow Up",
      );
    }
  }, [
    canShowApprovalRequestOption,
    canShowSiteReadinessTaskType,
    form,
    isSiteReadinessSelectionDisabled,
  ]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.task_type === "Approval Request") {
      approvalRequestMutation.mutate(
        {
          due_date: values.due_date,
          remark: values.remark?.trim() ?? "",
          user_id: values.assign_lead_to!,
          created_by: userId!,
          files: approvalFiles,
        },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Approval request assigned successfully!",
              type: "success",
            });
            queryClient.invalidateQueries({ queryKey: ["leadStats"] });
            queryClient.invalidateQueries({
              queryKey: ["universal-stage-leads"],
              exact: false,
            });
            queryClient.invalidateQueries({
              queryKey: ["vendorOverallLeads"],
            });
            queryClient.invalidateQueries({ queryKey: ["vendorAllTasks"] });
            queryClient.invalidateQueries({ queryKey: ["vendorUserTasks"] });
            queryClient.invalidateQueries({ queryKey: ["leadLogs"] });
            setApprovalFiles([]);
            onOpenChange(false);
            form.reset({
              assign_lead_to: undefined,
              task_type: canShowSiteReadinessTaskType ? "Site Readiness" : "Follow Up",
              due_date: "",
              remark: "N/A",
            });
          },
          onError: (error: any) => {
            const backendMessage =
              error?.response?.data?.message ||
              error.message ||
              "Something went wrong";
            toastManager.add({ title: backendMessage, type: "error" });
          },
        },
      );
      return;
    }

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

    if (isSelfAssignTask && values.assign_lead_to !== userId) {
      toastManager.add({
        title: "This task type can only be assigned to yourself.",
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

  if (loadingUsers || loadingApprovalRequestUsers || loadingSelfAssignTaskTypes) {
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

  if (error || approvalRequestUsersError || selfAssignTaskTypesError) {
    const resolvedError = error || approvalRequestUsersError || selfAssignTaskTypesError;
    return (
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Error"
        size="lg"
      >
        <div className="p-6">Error: {resolvedError?.message}</div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        form.watch("task_type") === "Approval Request"
          ? "Assign Approval Request"
          : form.watch("task_type") === "Follow Up" || !canShowSiteReadinessTaskType
          ? "Assign Task for Follow Up"
          : isSelfAssignTask
          ? "Assign Task"
          : "Assign Task for Site Readiness"
      }
      description={
        form.watch("task_type") === "Approval Request"
          ? "Use this form to assign an approval request."
          : form.watch("task_type") === "Follow Up" || !canShowSiteReadinessTaskType
          ? "Use this form to assign a follow up task."
          : isSelfAssignTask
          ? "Use this form to assign a task to yourself."
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
                          {canShowApprovalRequestOption && (
                            <SelectItem value="Approval Request">
                              Approval Request
                            </SelectItem>
                          )}
                          {selfAssignTaskTypeNames.map((taskTypeName) => (
                            <SelectItem
                              key={taskTypeName}
                              value={taskTypeName}
                            >
                              {taskTypeName}
                            </SelectItem>
                          ))}
                        </>
                      ) : (
                        <>
                          <SelectItem value="Follow Up">Follow Up</SelectItem>
                          {canShowApprovalRequestOption && (
                            <SelectItem value="Approval Request">
                              Approval Request
                            </SelectItem>
                          )}
                          {selfAssignTaskTypeNames.map((taskTypeName) => (
                            <SelectItem
                              key={taskTypeName}
                              value={taskTypeName}
                            >
                              {taskTypeName}
                            </SelectItem>
                          ))}
                        </>
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
                        disabled={shouldLockAssignee || isSelfAssignTask}
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

            {isApprovalRequestTask && (
              <FormItem>
                <FormLabel className="text-sm">File Upload</FormLabel>
                <FormControl>
                  <FileUploadField
                    value={approvalFiles}
                    onChange={setApprovalFiles}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
                    multiple
                    maxFiles={10}
                  />
                </FormControl>
              </FormItem>
            )}

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

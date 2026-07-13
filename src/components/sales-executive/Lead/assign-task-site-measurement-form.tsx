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
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";
import { useAppSelector } from "@/redux/store";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import {
  useAssignToSiteMeasurement,
  useInitialSiteMeasurementTaskConflicts,
  useCheckFastProductionLimit,
  useFastProductionRequestDraft,
  useLeadById,
} from "@/hooks/useLeadsQueries";
import { AssignToSiteMeasurementPayload } from "@/api/leads";
import { toastManager } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useFollowUpUsers } from "@/hooks/useFollowUpUsers";
import CustomeTooltip from "@/components/custom-tooltip";
import { FileUploadField } from "@/components/custom/file-upload";
import {
  useApprovalRequestAssignableUsers,
  useCreateApprovalRequest,
} from "@/hooks/useApprovalRequests";
import { useSelfAssignTaskTypes } from "@/hooks/useSelfAssignTaskTypes";
import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";
import FastProductionRequestModal from "@/components/sales-executive/Lead/fast-production-request-modal";
import FastProductionTermsModal from "@/components/sales-executive/Lead/fast-production-terms-modal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
  };
  onlyFollowUp?: boolean;
  isFastProductionEnabled?: boolean;
}

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
      if (data.task_type === "Approval Request") {
        return (
          !!data.remark &&
          data.remark.trim().length > 0 &&
          data.remark.trim().toLowerCase() !== "n/a"
        );
      }

      if (data.task_type === "Follow Up") {
        return data.remark && data.remark.trim().length > 0;
      }
      return true;
    },
    {
      message: "Remark is required",
      path: ["remark"],
    },
  );

const AssignTaskSiteMeasurementForm: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
  onlyFollowUp,
  isFastProductionEnabled = false,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const vendorCustomUserTypeMode = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only as
        | boolean
        | null
        | undefined,
  );
  const isApprovalTaskEnabled = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_approval_task_enabled as
        | boolean
        | null
        | undefined,
  );
  const isSelfAssignTaskTypeMasterEnabled = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_self_assign_task_type_master_enabed !== false,
  );
  const loggedInUserName = useAppSelector(
    (state) => state.auth.user?.user_name ?? "",
  );
  const userTypeId = useAppSelector((state) => state.auth.user?.user_type_id);
  const franchiseId = useAppSelector(
    (state) => state.auth.franchise_id ?? state.auth.user?.franchise_id,
  );
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const isCustomUser = (userType || "").toLowerCase() === "custom";

  const router = useRouter();
  const leadId = data?.id!;
  const userId = useAppSelector((state) => state.auth.user?.id);
  const mutation = useAssignToSiteMeasurement(leadId);
  
  const { 
    isLoading: limitLoading, 
    isError: isLimitReachedRaw 
  } = useCheckFastProductionLimit(vendorId, userId, franchiseId ?? undefined, open);

  const { data: draftResponse } = useFastProductionRequestDraft(vendorId, leadId);
  const hasDraft = !!draftResponse?.data?.requests?.length;

  const { data: leadData } = useLeadById(leadId, vendorId, userId);
  const lead = leadData?.data?.lead;
  const isLeadFastProductionAlready = lead?.is_fast_production === true;
  const isFastProductionPending = lead?.has_pending_fast_production_request === true;

  const isLimitReached = (userType || "").toLowerCase() === "super-admin" ? false : isLimitReachedRaw;

  const approvalRequestMutation = useCreateApprovalRequest(leadId);
  const queryClient = useQueryClient();
  const {
    data: taskConflicts,
    isLoading: isLoadingInitialSiteMeasurementTaskConflicts,
  } = useInitialSiteMeasurementTaskConflicts(leadId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assign_lead_to: undefined,
      task_type: onlyFollowUp ? "Follow Up" : "Initial Site Measurement",
      due_date: "",
      remark: "N/A",
    },
  });

  const normalizedUserType = (userType || "").toLowerCase();
  const canAssignInitialSiteMeasurementForCustomUser =
    customPrivilegeCodes.includes(
      "leads.open_leads.assign_task.ism_assign_task",
    );
  const canAssignFollowUpForCustomUser = customPrivilegeCodes.includes(
    "leads.open_leads.assign_task.follow_up_task",
  );
  const canShowInitialSiteMeasurementOption =
    normalizedUserType === "custom"
      ? canAssignInitialSiteMeasurementForCustomUser
      : true;
  const canShowFollowUpOption =
    normalizedUserType === "custom" ? canAssignFollowUpForCustomUser : true;
  const canShowApprovalRequestOption = isApprovalTaskEnabled !== false;
  const allowedFastProductionRoles = ["super-admin", "admin", "sales-executive"];
  const canShowFastProductionOption = isFastProductionEnabled && allowedFastProductionRoles.includes(normalizedUserType);
  const shouldShowInitialSiteMeasurementOption = !onlyFollowUp;

  // ✅ useLeadAccessControl replaces useLeadBlockStatus + formatBlockedAt
  const { isLeadBlocked, blockedTooltip, shouldDisableBlockedActions } =
    useLeadAccessControl({
      leadId,
      userType,
    });

  React.useEffect(() => {
    if (!open) return;

    if (
      shouldDisableBlockedActions &&
      canShowFollowUpOption &&
      form.getValues("task_type") !== "Follow Up"
    ) {
      form.setValue("task_type", "Follow Up", {
        shouldValidate: true,
      });
    }
  }, [open, shouldDisableBlockedActions, canShowFollowUpOption, form]);
  const initialSiteMeasurementTaskConflicts =
    taskConflicts?.restrictedTaskConflicts ?? [];
  const followUpConflicts = taskConflicts?.followUpConflicts ?? [];
  const taskType = form.watch("task_type");
  const [approvalFiles, setApprovalFiles] = React.useState<File[]>([]);
  const isFollowUp = taskType === "Follow Up";
  const isApprovalRequestTask = taskType === "Approval Request";
  const isFastProductionTask = taskType === "Request Fast Production";

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
                ![
                  "Initial Site Measurement",
                  "Follow Up",
                  "Approval Request",
                ].includes(taskType),
            ),
        ),
      ),
    [selfAssignTaskTypes],
  );
  const isSelfAssignTask = selfAssignTaskTypeNames.includes(taskType);
  const isFollowUpOnlyRestricted =
    !!onlyFollowUp &&
    !canShowApprovalRequestOption &&
    !canShowFastProductionOption &&
    selfAssignTaskTypeNames.length === 0;
  const [fastProductionModalOpen, setFastProductionModalOpen] =
    React.useState(false);
  const [fastProductionTermsOpen, setFastProductionTermsOpen] =
    React.useState(false);

  const {
    data: salesExecutiveUsers,
    isLoading: loadingSalesExecutiveUsers,
    error: salesExecutiveUsersError,
  } = useVendorSalesExecutiveUsers(vendorId!, franchiseId!, {
    taskType: isFollowUp ? "followup" : undefined,
  });

  const {
    data: customPrivilegeUsers,
    isLoading: loadingCustomPrivilegeUsers,
    error: customPrivilegeUsersError,
  } = useVendorSalesExecutiveUsers(vendorId!, franchiseId!, {
    assigneeUserType: "custom",
    requiredPrivilegeCode: "leads.ism_leads.ism_details.upload_measurement",
    taskType: isFollowUp ? "followup" : undefined,
  });

  const initialSiteMeasurementConflict =
    initialSiteMeasurementTaskConflicts.find(
      (task) => task.task_type === "Initial Site Measurement",
    );

  const isInitialSiteMeasurementDisabled =
    isLoadingInitialSiteMeasurementTaskConflicts ||
    !!initialSiteMeasurementConflict ||
    !!onlyFollowUp ||
    !canShowInitialSiteMeasurementOption;

  const initialSiteMeasurementTooltip =
    isLoadingInitialSiteMeasurementTaskConflicts
      ? "Checking existing tasks"
      : initialSiteMeasurementConflict
        ? "Initial Site Measurement task already created and not completed"
        : !canShowInitialSiteMeasurementOption
          ? "You don't have permission to assign Initial Site Measurement."
          : "Initial Site Measurement is not available here";

  const { data: followUpUsersData } = useFollowUpUsers(
    vendorId,
    leadId,
    franchiseId,
  );
  const {
    data: approvalRequestAssignableUsersData,
    isLoading: loadingApprovalRequestUsers,
    error: approvalRequestUsersError,
  } = useApprovalRequestAssignableUsers(vendorId, leadId);
  const followUpTooltip =
    "A Follow Up Task is already assigned to this user, which is not yet completed.";

  const franchiseSalesExecutives = (
    salesExecutiveUsers?.data?.sales_executives ?? []
  ).filter(
    (user: any) =>
      String(user.user_type?.user_type ?? "").toLowerCase() !== "master-admin",
  );
  const eligibleCustomUsers = (
    customPrivilegeUsers?.data?.sales_executives ?? []
  ).filter(
    (user: any) =>
      String(user.user_type?.user_type ?? "").toLowerCase() !== "master-admin",
  );

  const initialSiteMeasurementUsers = React.useMemo(() => {
    if (vendorCustomUserTypeMode === true) {
      return eligibleCustomUsers;
    }

    if (vendorCustomUserTypeMode === false) {
      const mergedUsers = [...franchiseSalesExecutives, ...eligibleCustomUsers];

      return mergedUsers.filter(
        (user: any, index: number, array: any[]) =>
          array.findIndex((candidate: any) => candidate.id === user.id) ===
          index,
      );
    }

    return franchiseSalesExecutives;
  }, [eligibleCustomUsers, franchiseSalesExecutives, vendorCustomUserTypeMode]);

  const approvalRequestUsers = React.useMemo(() => {
    const users = approvalRequestAssignableUsersData?.users ?? [];
    const leadFranchiseId = approvalRequestAssignableUsersData?.leadFranchiseId;

    return users.filter((user) => {
      const normalizedAssignableUserType = String(
        user.user_type?.user_type ?? "",
      ).toLowerCase();

      if (user.id === userId) return false;
      if (normalizedAssignableUserType === "master-admin") return false;

      if (leadFranchiseId !== undefined && leadFranchiseId !== null) {
        if (
          user.franchise_id !== leadFranchiseId &&
          normalizedAssignableUserType === "sales-executive"
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    approvalRequestAssignableUsersData?.users,
    approvalRequestAssignableUsersData?.leadFranchiseId,
    userId,
  ]);
  const approvalRequestMappedUsers = React.useMemo(
    () =>
      approvalRequestUsers.map((user) => ({
        id: user.id,
        label: user.user_name,
      })),
    [approvalRequestUsers],
  );

  const followUpAssignableUsers = isCustomUser
    ? (() => {
        const superAdminUsers = (followUpUsersData?.data?.users ?? []).filter(
          (u: any) =>
            String(u.user_type?.user_type ?? "").toLowerCase() ===
            "super-admin",
        );

        const mergedUsers = [...eligibleCustomUsers, ...superAdminUsers];

        if (userId && loggedInUserName) {
          const hasSelf = mergedUsers.some((u: any) => u.id === userId);
          if (!hasSelf) {
            mergedUsers.push({
              id: userId,
              user_name: loggedInUserName,
              user_type: { user_type: "custom" },
            });
          }
        }

        return mergedUsers.filter(
          (user: any, index: number, array: any[]) =>
            array.findIndex((candidate: any) => candidate.id === user.id) ===
            index,
        );
      })()
    : (followUpUsersData?.data?.users ?? []).filter(
        (u: any) =>
          String(u.user_type?.user_type ?? "").toLowerCase() !== "master-admin",
      );

  const mappedData = isApprovalRequestTask
    ? approvalRequestMappedUsers
    : isSelfAssignTask
      ? normalizedUserType === "master-admin"
        ? []
        : [{ id: userId ?? 0, label: loggedInUserName }]
      : isFollowUp
        ? followUpAssignableUsers.map((u: any) => ({
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
        : initialSiteMeasurementUsers.map((user: any) => ({
            id: user.id,
            label: user.user_name,
          }));

  const loadingUsers =
    loadingSalesExecutiveUsers ||
    loadingCustomPrivilegeUsers ||
    loadingApprovalRequestUsers ||
    loadingSelfAssignTaskTypes;
  const error =
    salesExecutiveUsersError ||
    customPrivilegeUsersError ||
    approvalRequestUsersError ||
    selfAssignTaskTypesError;

  React.useEffect(() => {
    if (isFollowUpOnlyRestricted) {
      form.setValue("task_type", "Follow Up");
      return;
    }

    if (
      form.getValues("task_type") === "Initial Site Measurement" &&
      isInitialSiteMeasurementDisabled &&
      canShowFollowUpOption
    ) {
      form.setValue("task_type", "Follow Up");
    }
  }, [
    form,
    isInitialSiteMeasurementDisabled,
    canShowFollowUpOption,
    isFollowUpOnlyRestricted,
  ]);

  React.useEffect(() => {
    const currentTaskType = form.getValues("task_type");

    if (
      currentTaskType === "Initial Site Measurement" &&
      !canShowInitialSiteMeasurementOption
    ) {
      form.setValue("task_type", "Follow Up");
      return;
    }

    if (
      currentTaskType === "Approval Request" &&
      !canShowApprovalRequestOption
    ) {
      form.setValue("task_type", "Follow Up");
      return;
    }

    if (
      currentTaskType === "Request Fast Production" &&
      (!canShowFastProductionOption || isLimitReached)
    ) {
      form.setValue("task_type", "Follow Up");
      return;
    }

    if (
      currentTaskType === "Follow Up" &&
      !canShowFollowUpOption &&
      canShowInitialSiteMeasurementOption
    ) {
      form.setValue("task_type", "Initial Site Measurement");
    }
  }, [
    form,
    canShowFollowUpOption,
    canShowInitialSiteMeasurementOption,
    canShowApprovalRequestOption,
    canShowFastProductionOption,
    isLimitReached,
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
      form.setValue("assign_lead_to", userId, { shouldValidate: true });
    }
  }, [form, isSelfAssignTask, userId]);

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
      (user: any) => user.id === selectedUserId,
    );

    if (!isSelectedUserStillAvailable) {
      form.resetField("assign_lead_to");
    }
  }, [form, mappedData]);

  const resetForm = React.useCallback(() => {
    form.reset({
      assign_lead_to: undefined,
      task_type: onlyFollowUp ? "Follow Up" : "Initial Site Measurement",
      due_date: "",
      remark: "N/A",
    });
    setApprovalFiles([]);
  }, [form, onlyFollowUp]);

  const openFastProductionModal = React.useCallback(() => {
    resetForm();
    onOpenChange(false);
    if (hasDraft) {
      setFastProductionModalOpen(true);
    } else {
      setFastProductionTermsOpen(true);
    }
  }, [onOpenChange, resetForm, hasDraft]);

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
            queryClient.invalidateQueries({
              queryKey: ["universal-stage-leads"],
              exact: false,
            });
            queryClient.invalidateQueries({ queryKey: ["leadStats"] });
            queryClient.invalidateQueries({ queryKey: ["vendorAllTasks"] });
            queryClient.invalidateQueries({ queryKey: ["vendorUserTasks"] });
            queryClient.invalidateQueries({ queryKey: ["leadLogs"] });
            onOpenChange(false);
            resetForm();
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
      values.task_type === "Initial Site Measurement" &&
      initialSiteMeasurementConflict
    ) {
      toastManager.add({
        title:
          "Initial Site Measurement task already created and not completed",
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
      toastManager.add({ title: followUpTooltip, type: "error" });
      return;
    }

    if (isSelfAssignTask && values.assign_lead_to !== userId) {
      toastManager.add({
        title: "This task type can only be assigned to yourself.",
        type: "error",
      });
      return;
    }

    const payload: AssignToSiteMeasurementPayload = {
      task_type: values.task_type,
      due_date: values.due_date,
      remark: values.remark,
      user_id: values.assign_lead_to!,
      created_by: userId!,
    };

    mutation.mutate(payload, {
      onSuccess: (data) => {
        console.log("API Response:", data);
        toastManager.add({
          title: "Task assigned successfully!",
          type: "success",
        });
        queryClient.invalidateQueries({
          queryKey: ["universal-stage-leads"],
          exact: false,
        });
        queryClient.invalidateQueries({ queryKey: ["leadStats"] });
        queryClient.invalidateQueries({ queryKey: ["vendorAllTasks"] });
        queryClient.invalidateQueries({ queryKey: ["vendorUserTasks"] });
        onOpenChange(false);
        resetForm();

        if (values.task_type === "Initial Site Measurement") {
          router.push("/dashboard/leads/initial-site-measurement");
        }
      },
      onError: (error: any) => {
        console.error("API Error:", error);
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
        <div className="p-6">Loading...</div>
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
    <>
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title={
          form.watch("task_type") === "Approval Request"
            ? "Assign Approval Request"
            : isFastProductionTask
            ? "Assign Task for Request Fast Production"
            : isSelfAssignTask
              ? `Assign Task for ${form.watch("task_type")}`
              : form.watch("task_type") === "Follow Up" || onlyFollowUp
              ? "Assign Task for Follow Up"
              : "Assign Task for Initial Site Measurement"
        }
        description={
          form.watch("task_type") === "Approval Request"
            ? "Use this form to assign an approval request."
            : isFastProductionTask
            ? "Use this form to assign a fast production request task."
            : isSelfAssignTask
              ? `Use this form to assign a ${form.watch("task_type").toLowerCase()} task to yourself.`
              : form.watch("task_type") === "Follow Up" || onlyFollowUp
              ? "Use this form to assign a follow up task."
              : "Use this form to assign a site measurement task."
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
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value === "Request Fast Production") {
                          openFastProductionModal();
                          return;
                        }

                        field.onChange(value);
                      }}
                      disabled={isFollowUpOnlyRestricted}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select task type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isFollowUpOnlyRestricted ? (
                          <SelectItem value="Follow Up">Follow Up</SelectItem>
                        ) : (
                          <>
                          {/* ── Initial Site Measurement ── */}
                          {shouldShowInitialSiteMeasurementOption &&
                            (shouldDisableBlockedActions ? (
                              <CustomeTooltip
                                value={blockedTooltip}
                                truncateValue={
                                  <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                                    <span>Initial Site Measurement</span>
                                    <span className="text-xs italic">
                                      (blocked)
                                    </span>
                                  </div>
                                }
                              />
                            ) : isInitialSiteMeasurementDisabled ? (
                              <CustomeTooltip
                                value={initialSiteMeasurementTooltip}
                                truncateValue={
                                  <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                                    <span>Initial Site Measurement</span>
                                    <span className="text-xs italic">
                                      (locked)
                                    </span>
                                  </div>
                                }
                              />
                            ) : (
                              <SelectItem value="Initial Site Measurement">
                                Initial Site Measurement
                              </SelectItem>
                            ))}

                          {/* ── Follow Up — always selectable even when blocked ── */}
                          {canShowFollowUpOption && (
                            <SelectItem value="Follow Up">Follow Up</SelectItem>
                          )}

                          {/* ── Approval Request ── */}
                          {canShowApprovalRequestOption &&
                            (shouldDisableBlockedActions ? (
                              <CustomeTooltip
                                value={blockedTooltip}
                                truncateValue={
                                  <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                                    <span>Approval Request</span>
                                    <span className="text-xs italic">
                                      (blocked)
                                    </span>
                                  </div>
                                }
                              />
                            ) : (
                              <SelectItem value="Approval Request">
                                Approval Request
                              </SelectItem>
                            ))}

                          {canShowFastProductionOption &&
                            (isLeadFastProductionAlready ? (
                              <CustomeTooltip
                                value="lead is already in fast production"
                                truncateValue={
                                  <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                                    <span>Request Fast Production</span>
                                    <span className="text-xs italic">
                                      (locked)
                                    </span>
                                  </div>
                                }
                              />
                            ) : isFastProductionPending ? (
                              <CustomeTooltip
                                value="Request has been already send for approval"
                                truncateValue={
                                  <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                                    <span>Request Fast Production</span>
                                    <span className="text-xs italic">
                                      (locked)
                                    </span>
                                  </div>
                                }
                              />
                            ) : shouldDisableBlockedActions ? (
                              <CustomeTooltip
                                value={blockedTooltip}
                                truncateValue={
                                  <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                                    <span>Request Fast Production</span>
                                    <span className="text-xs italic">
                                      (blocked)
                                    </span>
                                  </div>
                                }
                              />
                            ) : limitLoading ? (
                              <CustomeTooltip
                                value="Checking fast production limit..."
                                truncateValue={
                                  <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                                    <span>Request Fast Production</span>
                                    <span className="text-xs italic">
                                      (loading)
                                    </span>
                                  </div>
                                }
                              />
                            ) : isLimitReached ? (
                              <CustomeTooltip
                                value="Fast production creation limit reached for the current month (Max 2)"
                                truncateValue={
                                  <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                                    <span>Request Fast Production</span>
                                    <span className="text-xs italic">
                                      (locked)
                                    </span>
                                  </div>
                                }
                              />
                            ) : (
                              <SelectItem value="Request Fast Production">
                                Request Fast Production
                              </SelectItem>
                            ))}

                          {/* ── Self Assign Task Types ── */}
                          {selfAssignTaskTypeNames.map((taskTypeName) =>
                            shouldDisableBlockedActions ? (
                              <CustomeTooltip
                                key={taskTypeName}
                                value={blockedTooltip}
                                truncateValue={
                                  <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                                    <span>{taskTypeName}</span>
                                    <span className="text-xs italic">
                                      (blocked)
                                    </span>
                                  </div>
                                }
                              />
                            ) : (
                              <SelectItem
                                key={taskTypeName}
                                value={taskTypeName}
                              >
                                {taskTypeName}
                              </SelectItem>
                            ),
                          )}
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
                    <FormLabel className="text-sm">Select User</FormLabel>
                    <FormControl>
                      <AssignToPicker
                        data={mappedData}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSelfAssignTask}
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

            {isApprovalRequestTask ? (
              <div className="space-y-2">
                <FormLabel className="text-sm">File Upload</FormLabel>
                <FileUploadField
                  value={approvalFiles}
                  onChange={setApprovalFiles}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip,.pyo"
                  multiple
                  maxFiles={20}
                />
              </div>
            ) : null}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="text-sm"
                onClick={resetForm}
              >
                Reset
              </Button>
              <Button
                type="submit"
                className="text-sm"
                disabled={
                  mutation.isPending || approvalRequestMutation.isPending
                }
              >
                {mutation.isPending || approvalRequestMutation.isPending
                  ? "Submitting..."
                  : "Submit"}
              </Button>
            </div>
            </form>
          </Form>
        </div>
      </BaseModal>

      <FastProductionRequestModal
        open={fastProductionModalOpen}
        onOpenChange={setFastProductionModalOpen}
        leadId={data?.id}
      />
      <FastProductionTermsModal
        open={fastProductionTermsOpen}
        onOpenChange={setFastProductionTermsOpen}
        onAgree={() => {
          setFastProductionTermsOpen(false);
          setFastProductionModalOpen(true);
        }}
      />
    </>
  );
};

export default AssignTaskSiteMeasurementForm;

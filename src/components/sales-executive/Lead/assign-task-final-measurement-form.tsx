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
import {
  useAssignToFinalMeasurement,
  useCheckSiteSupervisorAssigned,
  useLeadSuperAdminApprovalLockIns,
  useRestrictedTaskConflicts,
} from "@/hooks/useLeadsQueries";
import { AssignToFinalMeasurementPayload } from "@/api/final-measurement";
import { toastManager } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useVendorSiteSupervisorUsers } from "@/hooks/useVendorSiteSupervisorUsers";
import { useRouter } from "next/navigation";
import { FileUploadField } from "@/components/custom/file-upload";
import { useUploadCSPBooking } from "@/hooks/useUploadCSPBooking";
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { useFollowUpUsers } from "@/hooks/useFollowUpUsers";
import {
  useApprovalRequestAssignableUsers,
  useCreateApprovalRequest,
} from "@/hooks/useApprovalRequests";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSelfAssignTaskTypes } from "@/hooks/useSelfAssignTaskTypes";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
    accountId: number; // ✅ REQUIRED
  };
}

const formSchema = z
  .object({
    assign_lead_to: z.number().min(1, "Assign lead to is required"),
    task_type: z.string().min(1, "Task Type is required"),
    due_date: z.string().min(1, "Due Date is required"),
    remark: z.string().optional(),
    current_site_photos: z.array(z.instanceof(File)).optional(),
  })
  .superRefine((data, ctx) => {
    // 🔴 Final Measurements → site photos mandatory
    if (data.task_type === "Final Measurements") {
      if (!data.current_site_photos || data.current_site_photos.length === 0) {
        ctx.addIssue({
          path: ["current_site_photos"],
          message: "Current site photos are mandatory",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    // 🔴 Follow Up → remark mandatory
    if (data.task_type === "Follow Up") {
      if (!data.remark || !data.remark.trim()) {
        ctx.addIssue({
          path: ["remark"],
          message: "Remark is required for Follow Up",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    if (data.task_type === "Approval Request") {
      if (
        !data.remark ||
        !data.remark.trim() ||
        data.remark.trim().toLowerCase() === "n/a"
      ) {
        ctx.addIssue({
          path: ["remark"],
          message: "Remark is required",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });

const AssignTaskFinalMeasurementForm: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const isAccountLocInEnabled = useAppSelector(
    (state) => state.auth.user?.vendor?.IsAccountLocInEnabled ?? false,
  );
  const vendorCustomUserTypeMode = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only as
        | boolean
        | null
        | undefined,
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
  const userRole = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type
  );
  const loggedInUserName = useAppSelector(
    (state) => state.auth.user?.user_name ?? "",
  );
  const userTypeId = useAppSelector((state) => state.auth.user?.user_type_id);
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const isCustomUser = (userRole ?? "").toLowerCase() === "custom";
  const canAccessRestrictedTasks = ["super-admin", "admin", "sales-executive"].includes(userRole ?? "");
  const normalizedUserRole = (userRole ?? "").toLowerCase();
  const dueDateMinDate = React.useMemo(() => {
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);

    if (normalizedUserRole === "super-admin") {
      return formatLocalDate(minDate);
    }

    minDate.setDate(minDate.getDate() + 2);
    return formatLocalDate(minDate);
  }, [normalizedUserRole]);
  const {
    data: siteSupervisors,
    isLoading: loadingSupervisors,
    error: supervisorError,
  } = useVendorSiteSupervisorUsers(vendorId!);
  const {
    data: salesExecutives,
    isLoading: loadingSalesExecs,
    error: salesExecError,
  } = useVendorSalesExecutiveUsers(
    vendorId!,
    undefined,
    isCustomUser
      ? {
          assigneeUserType: "custom",
          requiredPrivilegeCode:
            "leads.booking_done.assign_task.final_measurement",
        }
      : undefined,
  );
  const {
    data: customFinalMeasurementUsers,
    isLoading: loadingCustomFinalMeasurementUsers,
    error: customFinalMeasurementUsersError,
  } = useVendorSalesExecutiveUsers(vendorId!, undefined, {
    assigneeUserType: "custom",
    requiredPrivilegeCode:
      "project.final_measurement.fm_action_upload_of_fm.enable_disable",
  });
  const router = useRouter();
  const leadId = data?.id!;
  const accountId = data?.accountId!;
  if (!leadId || !accountId) {
    toastManager.add({ title: "Lead or Account information is missing", type: "error" });
    return null;
  }
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: siteSupervisorCheck } = useCheckSiteSupervisorAssigned(vendorId, leadId);
  const isSiteSupervisorAssigned = siteSupervisorCheck?.isSiteSupervisorAssigned ?? false;
  const {
    data: taskConflicts,
    isLoading: restrictedTaskConflictsLoading,
  } = useRestrictedTaskConflicts(leadId);
  const { data: bookingDoneLockIns = [], isLoading: bookingDoneLockInsLoading } =
    useLeadSuperAdminApprovalLockIns(vendorId, leadId, "booking_done");
  const mutation = useAssignToFinalMeasurement(leadId);
  const approvalRequestMutation = useCreateApprovalRequest(leadId);
  const queryClient = useQueryClient();
  const uploadCSPMutation = useUploadCSPBooking();
  const { data: leadData } = useLeadById(leadId, vendorId, userId);
  const lead = leadData?.data?.lead;
  const franchiseId = useAppSelector(
    (state) => state.auth.franchise_id ?? state.auth.user?.franchise_id
  );

  const assignedSiteSupervisorFromMapping =
    leadData?.data?.lead?.assigned_site_supervisor_from_mapping ?? null;
  const assignedSiteSupervisorId =
    assignedSiteSupervisorFromMapping?.user_id ??
    leadData?.data?.lead?.siteSupervisors?.[0]?.supervisor?.id ??
    leadData?.data?.lead?.siteSupervisors?.[0]?.user_id ??
    undefined;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assign_lead_to: undefined,
      task_type: canAccessRestrictedTasks ? "Final Measurements" : "Follow Up",
      due_date: "",
      remark: "N/A",
      current_site_photos: [],
    },
  });
  const hasUserChangedTaskTypeRef = React.useRef(false);
  const [approvalFiles, setApprovalFiles] = React.useState<File[]>([]);

  const taskType = form.watch("task_type");
  const isApprovalRequestTask = taskType === "Approval Request";
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
                  "Final Measurements",
                  "Follow Up",
                  "BookingDone - ISM",
                  "Approval Request",
                ].includes(taskType),
            ),
        ),
      ),
    [selfAssignTaskTypes],
  );
  const isSelfAssignTask = selfAssignTaskTypeNames.includes(taskType);
  const restrictedTaskConflicts = taskConflicts?.restrictedTaskConflicts ?? [];
  const followUpConflicts = taskConflicts?.followUpConflicts ?? [];
  const finalMeasurementsConflict = restrictedTaskConflicts.find(
    (task) => task.task_type === "Final Measurements",
  );
  const bookingDoneConflict = restrictedTaskConflicts.find(
    (task) => task.task_type === "BookingDone - ISM",
  );
  const hasPendingBookingDoneApproval = bookingDoneLockIns.some(
    (lockIn) => !lockIn.is_approved
  );
  const requiresBookingDoneApproval = isAccountLocInEnabled;
  const finalMeasurementsConflictTooltip = finalMeasurementsConflict
    ? "Final Measurements task already created and not completed"
    : null;
  const bookingDoneConflictTooltip = bookingDoneConflict
    ? "BookingDone - ISM task already created and not completed"
    : null;
  const canUseRestrictedTaskAssignments =
    canAccessRestrictedTasks || isCustomUser;
  const shouldRequireAssignedSiteSupervisorForFinalMeasurements =
    vendorCustomUserTypeMode !== true;
  const isFinalMeasurementsDisabled =
    restrictedTaskConflictsLoading ||
    !!finalMeasurementsConflict ||
    (requiresBookingDoneApproval &&
      (bookingDoneLockInsLoading || hasPendingBookingDoneApproval)) ||
    !canUseRestrictedTaskAssignments ||
    (shouldRequireAssignedSiteSupervisorForFinalMeasurements &&
      !isSiteSupervisorAssigned);
  const finalMeasurementsTooltip =
    restrictedTaskConflictsLoading
    ? "Checking existing tasks"
    : finalMeasurementsConflictTooltip
      ? finalMeasurementsConflictTooltip
    : requiresBookingDoneApproval && bookingDoneLockInsLoading
    ? "Checking accounts approval status"
    : requiresBookingDoneApproval && hasPendingBookingDoneApproval
      ? "Accounts approval for Booking Done is pending"
      : !canUseRestrictedTaskAssignments
        ? "You don't have permission to select this"
        : shouldRequireAssignedSiteSupervisorForFinalMeasurements &&
            !isSiteSupervisorAssigned
          ? "Site supervisor is not assigned yet"
          : null;
  const isBookingDoneDisabled =
    restrictedTaskConflictsLoading ||
    !!bookingDoneConflict ||
    !canUseRestrictedTaskAssignments;
  const bookingDoneTooltip =
    restrictedTaskConflictsLoading
      ? "Checking existing tasks"
      : bookingDoneConflictTooltip
        ? bookingDoneConflictTooltip
        : !canUseRestrictedTaskAssignments
          ? "You don't have permission to select this"
          : null;
  const hasFinalMeasurementPrivilege = isCustomUser
    ? customPrivilegeCodes.includes(
        "leads.booking_done.assign_task.final_measurement",
      )
    : true;
  const hasFollowUpPrivilege = isCustomUser
    ? customPrivilegeCodes.includes("leads.booking_done.assign_task.follow_up")
    : true;
  const hasBookingDoneIsmPrivilege = isCustomUser
    ? customPrivilegeCodes.includes(
        "leads.booking_done.assign_task.bookingdone_ism",
      )
    : true;
  const canShowApprovalRequestOption = isApprovalTaskEnabled !== false;
  const availableTaskTypes = React.useMemo(() => {
    return [
      hasFinalMeasurementPrivilege ? "Final Measurements" : null,
      hasFollowUpPrivilege ? "Follow Up" : null,
      hasBookingDoneIsmPrivilege ? "BookingDone - ISM" : null,
      canShowApprovalRequestOption ? "Approval Request" : null,
      ...selfAssignTaskTypeNames,
    ].filter(Boolean) as string[];
  }, [
    canShowApprovalRequestOption,
    hasBookingDoneIsmPrivilege,
    hasFinalMeasurementPrivilege,
    hasFollowUpPrivilege,
    selfAssignTaskTypeNames,
  ]);

  const { data: followUpUsersData } = useFollowUpUsers(
    vendorId,
    leadId,
    franchiseId
  );
  const {
    data: approvalRequestAssignableUsersData,
    isLoading: loadingApprovalRequestUsers,
    error: approvalRequestUsersError,
  } = useApprovalRequestAssignableUsers(vendorId, leadId);
  const followUpTooltip =
    "A Follow Up Task is already assigned to this user, which is not yet completed.";
  const eligibleCustomUsers = (salesExecutives?.data?.sales_executives ?? []).filter(
    (user: any) =>
      String(user.user_type?.user_type ?? "").toLowerCase() !==
      "master-admin",
  );
  const eligibleFinalMeasurementCustomUsers =
    (customFinalMeasurementUsers?.data?.sales_executives ?? []).filter(
      (user: any) =>
        String(user.user_type?.user_type ?? "").toLowerCase() !==
        "master-admin",
    );

  const baseFinalMeasurementUsers = React.useMemo(() => {
    if (assignedSiteSupervisorId) {
      const assigned = (siteSupervisors?.data?.site_supervisors ?? []).find(
        (user: any) => user.id === assignedSiteSupervisorId
      );
      return assigned &&
        String(assigned.user_type?.user_type ?? "").toLowerCase() !==
          "master-admin"
        ? [assigned]
        : [];
    }

    return (siteSupervisors?.data?.site_supervisors ?? []).filter(
      (user: any) =>
        String(user.user_type?.user_type ?? "").toLowerCase() !==
        "master-admin",
    );
  }, [assignedSiteSupervisorId, siteSupervisors]);

  const finalMeasurementUsers = React.useMemo(() => {
    if (vendorCustomUserTypeMode === true) {
      return eligibleFinalMeasurementCustomUsers;
    }

    if (vendorCustomUserTypeMode === false) {
      const mergedUsers = [
        ...baseFinalMeasurementUsers,
        ...eligibleFinalMeasurementCustomUsers,
      ];

      return mergedUsers.filter(
        (user: any, index: number, array: any[]) =>
          array.findIndex((candidate: any) => candidate.id === user.id) === index,
      );
    }

    return baseFinalMeasurementUsers;
  }, [
    baseFinalMeasurementUsers,
    eligibleFinalMeasurementCustomUsers,
    vendorCustomUserTypeMode,
  ]);

  const approvalRequestUsers = React.useMemo(() => {
    const users = approvalRequestAssignableUsersData?.users ?? [];
    const shouldRestrictToFranchise =
      normalizedUserRole === "admin" ||
      normalizedUserRole === "sales-executive";

    return users.filter((user) => {
      const normalizedAssignableUserType = String(
        user.user_type?.user_type ?? "",
      ).toLowerCase();

      if (user.id === userId) return false;
      if (normalizedAssignableUserType === "master-admin") return false;
      if (shouldRestrictToFranchise) {
        return user.franchise_id === franchiseId;
      }
      return true;
    });
  }, [
    approvalRequestAssignableUsersData?.users,
    franchiseId,
    normalizedUserRole,
    userId,
  ]);

  const mappedData = React.useMemo(() => {
    if (taskType === "Approval Request") {
      return approvalRequestUsers.map((user) => ({
        id: user.id,
        label: user.user_name,
      }));
    }

    if (isSelfAssignTask) {
      return normalizedUserRole === "master-admin"
        ? []
        : [
            {
              id: userId ?? 0,
              label: loggedInUserName,
            },
          ];
    }

    if (
      vendorCustomUserTypeMode === true &&
      taskType === "Final Measurements"
    ) {
      return eligibleFinalMeasurementCustomUsers.map((user: any) => ({
        id: user.id,
        label: user.user_name,
      }));
    }

    if (isCustomUser) {
      return eligibleCustomUsers.map((user: any) => ({
        id: user.id,
        label: user.user_name,
        disabled:
          taskType === "Follow Up" &&
          user.id !== userId &&
          followUpConflicts.some((task) => task.assignee?.id === user.id),
        tooltip:
          taskType === "Follow Up" &&
          user.id !== userId &&
          followUpConflicts.some((task) => task.assignee?.id === user.id)
            ? followUpTooltip
            : undefined,
      }));
    }

    if (taskType === "Follow Up") {
      return (followUpUsersData?.data?.users ?? [])
        .filter(
          (u: any) =>
            String(u.user_type?.user_type ?? "").toLowerCase() !==
            "master-admin",
        )
        .map((u: any) => ({
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
      }));
    }

    if (taskType === "BookingDone - ISM") {
      return (
        eligibleCustomUsers.map((user: any) => ({
          id: user.id,
          label: user.user_name,
        })) ?? []
      );
    }

    // Default → Site Supervisors
    return (
      finalMeasurementUsers.map((user: any) => ({
        id: user.id,
        label: user.user_name,
      })) ?? []
    );
  }, [
    approvalRequestUsers,
    eligibleFinalMeasurementCustomUsers,
    eligibleCustomUsers,
    finalMeasurementUsers,
    followUpConflicts,
    followUpTooltip,
    followUpUsersData,
    isCustomUser,
    isSelfAssignTask,
    loggedInUserName,
    normalizedUserRole,
    taskType,
    userId,
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
      !open ||
      vendorCustomUserTypeMode !== true ||
      taskType !== "Final Measurements"
    ) {
      return;
    }

    if (mappedData.length === 1) {
      const onlyUserId = mappedData[0]?.id;
      if (onlyUserId && form.getValues("assign_lead_to") !== onlyUserId) {
        form.setValue("assign_lead_to", onlyUserId, {
          shouldValidate: true,
        });
      }
    }
  }, [form, mappedData, open, taskType, vendorCustomUserTypeMode]);

  React.useEffect(() => {
    if (isCustomUser || vendorCustomUserTypeMode !== null && vendorCustomUserTypeMode !== undefined) {
      return;
    }

    if (taskType === "Final Measurements" && assignedSiteSupervisorId) {
      form.setValue("assign_lead_to", assignedSiteSupervisorId, {
        shouldValidate: true,
      });
    }
  }, [
    taskType,
    assignedSiteSupervisorId,
    form,
    isCustomUser,
    vendorCustomUserTypeMode,
  ]);

  React.useEffect(() => {
    if (siteSupervisorCheck !== undefined && !isSiteSupervisorAssigned) {
      form.setValue("task_type", "Follow Up");
    }
  }, [siteSupervisorCheck, isSiteSupervisorAssigned, form, hasFollowUpPrivilege]);

  React.useEffect(() => {
    if (!open) {
      hasUserChangedTaskTypeRef.current = false;
      return;
    }

    const currentTaskType = form.getValues("task_type");
    if (!availableTaskTypes.includes(currentTaskType)) {
      const fallbackTaskType =
        availableTaskTypes[0] ??
        (canAccessRestrictedTasks ? "Final Measurements" : "Follow Up");
      form.setValue("task_type", fallbackTaskType, {
        shouldValidate: true,
      });
      return;
    }

    if (
      hasFinalMeasurementPrivilege &&
      isFinalMeasurementsDisabled &&
      !hasUserChangedTaskTypeRef.current &&
      form.getValues("task_type") !== "Follow Up"
    ) {
      const fallbackTaskType = hasFollowUpPrivilege
        ? "Follow Up"
        : hasBookingDoneIsmPrivilege
          ? "BookingDone - ISM"
          : currentTaskType;
      form.setValue("task_type", fallbackTaskType, {
        shouldValidate: true,
      });
      return;
    }

    if (
      hasFinalMeasurementPrivilege &&
      !isFinalMeasurementsDisabled &&
      !hasUserChangedTaskTypeRef.current &&
      form.getValues("task_type") !== "Final Measurements"
    ) {
      form.setValue("task_type", "Final Measurements", {
        shouldValidate: true,
      });
    }
  }, [
    availableTaskTypes,
    canAccessRestrictedTasks,
    form,
    hasBookingDoneIsmPrivilege,
    hasFinalMeasurementPrivilege,
    hasFollowUpPrivilege,
    isFinalMeasurementsDisabled,
    open,
  ]);

  React.useEffect(() => {
    if (
      form.getValues("task_type") === "Final Measurements" &&
      isFinalMeasurementsDisabled
    ) {
      if (hasFollowUpPrivilege) {
        form.setValue("task_type", "Follow Up");
      } else if (hasBookingDoneIsmPrivilege) {
        form.setValue("task_type", "BookingDone - ISM");
      }
    }
  }, [form, hasBookingDoneIsmPrivilege, hasFollowUpPrivilege, isFinalMeasurementsDisabled]);

  React.useEffect(() => {
    if (
      form.getValues("task_type") === "BookingDone - ISM" &&
      isBookingDoneDisabled
    ) {
      if (hasFollowUpPrivilege) {
        form.setValue("task_type", "Follow Up");
      } else if (hasFinalMeasurementPrivilege && !isFinalMeasurementsDisabled) {
        form.setValue("task_type", "Final Measurements");
      }
    }
  }, [
    form,
    hasFinalMeasurementPrivilege,
    hasFollowUpPrivilege,
    isBookingDoneDisabled,
    isFinalMeasurementsDisabled,
  ]);

  React.useEffect(() => {
    if (
      form.getValues("task_type") === "Approval Request" &&
      !canShowApprovalRequestOption
    ) {
      if (hasFollowUpPrivilege) {
        form.setValue("task_type", "Follow Up");
      } else if (hasFinalMeasurementPrivilege && !isFinalMeasurementsDisabled) {
        form.setValue("task_type", "Final Measurements");
      } else if (hasBookingDoneIsmPrivilege && !isBookingDoneDisabled) {
        form.setValue("task_type", "BookingDone - ISM");
      }
    }
  }, [
    canShowApprovalRequestOption,
    form,
    hasBookingDoneIsmPrivilege,
    hasFinalMeasurementPrivilege,
    hasFollowUpPrivilege,
    isBookingDoneDisabled,
    isFinalMeasurementsDisabled,
  ]);

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
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
              queryClient.invalidateQueries({
                queryKey: ["leadStats", vendorId, userId],
              });
              queryClient.invalidateQueries({ queryKey: ["vendorAllTasks"] });
              queryClient.invalidateQueries({ queryKey: ["vendorUserTasks"] });
              queryClient.invalidateQueries({ queryKey: ["leadLogs"] });
              setApprovalFiles([]);
              form.reset({
                assign_lead_to: undefined,
                task_type: canAccessRestrictedTasks ? "Final Measurements" : "Follow Up",
                due_date: "",
                remark: "N/A",
                current_site_photos: [],
              });
              onOpenChange(false);
            },
            onError: (error: any) => {
              toastManager.add({
                title:
                  error?.response?.data?.message ||
                  error.message ||
                  "Something went wrong",
                type: "error",
              });
            },
          },
        );
        return;
      }

      if (
        values.task_type === "Final Measurements" &&
        finalMeasurementsConflict
      ) {
        toastManager.add({
          title: "Final Measurements task already created and not completed",
          type: "error",
        });
        return;
      }

      if (
        values.task_type === "BookingDone - ISM" &&
        bookingDoneConflict
      ) {
        toastManager.add({
          title: "BookingDone - ISM task already created and not completed",
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

      if (
        values.task_type === "Final Measurements" &&
        requiresBookingDoneApproval &&
        hasPendingBookingDoneApproval
      ) {
        toastManager.add({
          title: "Accounts approval for Booking Done is pending",
          type: "error",
        });
        return;
      }

      if (
        values.task_type === "Final Measurements" &&
        !lead?.site_map_link?.trim()
      ) {
        toastManager.add({ title: "Site Map Link is compulsory before assigning lead to Final Measurement", type: "error" });
        return;
      }

      // 🔴 STEP 1: Upload CSP Photos (ONLY for Final Measurements)
      if (values.task_type === "Final Measurements") {
        await uploadCSPMutation.mutateAsync({
          lead_id: leadId,
          account_id: accountId, // ✅ guaranteed value
          vendor_id: vendorId!,
          assigned_to: values.assign_lead_to!,
          created_by: userId!,
          site_photos: values.current_site_photos!,
        });
      }

      // 🔴 STEP 2: Assign Task
      const payload: AssignToFinalMeasurementPayload = {
        task_type: values.task_type,
        due_date: values.due_date,
        remark: values.remark,
        user_id: values.assign_lead_to!,
        created_by: userId!,
      };

      mutation.mutate(payload, {
        onSuccess: () => {
          toastManager.add({ title: "Final Measurement assigned successfully!", type: "success" });

          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["universal-stage-leads"],
            exact: false,
          });

          onOpenChange(false);

          if (values.task_type === "Final Measurements") {
            router.push("/dashboard/project/final-measurement");
          }
        },
        onError: (error: any) => {
          toastManager.add({ title: error?.response?.data?.message || "Failed to assign task", type: "error" });
        },
      });
    } catch (error: any) {
      toastManager.add({ title: error?.message || "Failed to upload site photos", type: "error" });
    }
  };

  if (
    loadingSupervisors ||
    loadingSalesExecs ||
    loadingCustomFinalMeasurementUsers ||
    loadingApprovalRequestUsers ||
    loadingSelfAssignTaskTypes
  ) {
    return (
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Loading..."
        size="lg"
      >
        <div className="p-6">Loading users...</div>
      </BaseModal>
    );
  }

  if (
    supervisorError ||
    salesExecError ||
    customFinalMeasurementUsersError ||
    approvalRequestUsersError ||
    selfAssignTaskTypesError
  ) {
    return (
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Error"
        size="lg"
      >
        <div className="p-6">Error loading users</div>
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
          : isSelfAssignTask
          ? `Assign Task for ${form.watch("task_type")}`
          : form.watch("task_type") === "Follow Up"
          ? "Assign Task for Follow Up"
          : "Assign Task for Final Site Measurements"
      }
      description={
        form.watch("task_type") === "Approval Request"
          ? "Use this form to assign an approval request."
          : isSelfAssignTask
          ? `Use this form to assign a ${form.watch("task_type").toLowerCase()} task to yourself.`
          : form.watch("task_type") === "Follow Up"
          ? "Use this form to assign a follow up task."
          : "Use this form to assign a final measurement task."
      }
      size="lg"
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
                      hasUserChangedTaskTypeRef.current = true;
                      field.onChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <TooltipProvider>
                        {/* Final Measurements */}
                        {hasFinalMeasurementPrivilege && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <SelectItem
                                  value="Final Measurements"
                                  disabled={isFinalMeasurementsDisabled}
                                >
                                  Final Measurements
                                </SelectItem>
                              </span>
                            </TooltipTrigger>
                            {finalMeasurementsTooltip ? (
                              <TooltipContent>
                                {finalMeasurementsTooltip}
                              </TooltipContent>
                            ) : null}
                          </Tooltip>
                        )}

                        {/* Follow Up */}
                        {hasFollowUpPrivilege && (
                          <SelectItem value="Follow Up">Follow Up</SelectItem>
                        )}

                        {canShowApprovalRequestOption && (
                          <SelectItem value="Approval Request">
                            Approval Request
                          </SelectItem>
                        )}

                        {selfAssignTaskTypeNames.map((taskTypeName) => (
                          <SelectItem key={taskTypeName} value={taskTypeName}>
                            {taskTypeName}
                          </SelectItem>
                        ))}

                        {/* BookingDone - ISM */}
                        {hasBookingDoneIsmPrivilege && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <SelectItem
                                  value="BookingDone - ISM"
                                  disabled={isBookingDoneDisabled}
                                >
                                  BookingDone - ISM
                                </SelectItem>
                              </span>
                            </TooltipTrigger>
                            {bookingDoneTooltip && (
                              <TooltipContent>
                                {bookingDoneTooltip}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        )}
                      </TooltipProvider>
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
                        disabled={
                          isSelfAssignTask ||
                          (taskType === "Final Measurements" &&
                            !!assignedSiteSupervisorId &&
                            vendorCustomUserTypeMode == null)
                        }
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

            {form.watch("task_type") === "Final Measurements" && (
              <FormField
                control={form.control}
                name="current_site_photos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Current Site Photos{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <FileUploadField
                        value={field.value || []}
                        onChange={field.onChange}
                        accept=".png,.jpg,.jpeg,.gif"
                        multiple
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                disabled={
                  mutation.isPending ||
                  uploadCSPMutation.isPending ||
                  (form.watch("task_type") === "Final Measurements" &&
                    form.watch("current_site_photos")?.length === 0)
                }
              >
                {uploadCSPMutation.isPending || mutation.isPending
                  ? "Submitting..."
                  : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default AssignTaskFinalMeasurementForm;

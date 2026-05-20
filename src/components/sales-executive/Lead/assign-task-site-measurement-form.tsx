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
} from "@/hooks/useLeadsQueries";
import { AssignToSiteMeasurementPayload } from "@/api/leads";
import { toastManager } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useFollowUpUsers } from "@/hooks/useFollowUpUsers";
import CustomeTooltip from "@/components/custom-tooltip";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
  };
  onlyFollowUp?: boolean; // ✅ NEW
}

const formSchema = z
  .object({
    assign_lead_to: z.number().min(1, "Assign lead to is required"),
    task_type: z.enum(["Initial Site Measurement", "Follow Up"], {
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
      path: ["remark"], // Attach error to remark field
    },
  );

const AssignTaskSiteMeasurementForm: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
  onlyFollowUp,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const vendorCustomUserTypeMode = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only as
        | boolean
        | null
        | undefined,
  );
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
    customPrivilegeCodes.includes("leads.open_leads.assign_task.ism_assign_task");
  const canAssignFollowUpForCustomUser = customPrivilegeCodes.includes(
    "leads.open_leads.assign_task.follow_up_task",
  );
  const canShowInitialSiteMeasurementOption =
    normalizedUserType === "custom"
      ? canAssignInitialSiteMeasurementForCustomUser
      : true;
  const canShowFollowUpOption =
    normalizedUserType === "custom" ? canAssignFollowUpForCustomUser : true;

  const initialSiteMeasurementTaskConflicts =
    taskConflicts?.restrictedTaskConflicts ?? [];
  const followUpConflicts = taskConflicts?.followUpConflicts ?? [];
  const taskType = form.watch("task_type");
  const isFollowUp = taskType === "Follow Up" || !!onlyFollowUp;

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
  const initialSiteMeasurementConflict = initialSiteMeasurementTaskConflicts.find(
    (task) => task.task_type === "Initial Site Measurement",
  );
  const isInitialSiteMeasurementDisabled =
    isLoadingInitialSiteMeasurementTaskConflicts ||
    !!initialSiteMeasurementConflict ||
    !!onlyFollowUp ||
    !canShowInitialSiteMeasurementOption;
  const initialSiteMeasurementTooltip = isLoadingInitialSiteMeasurementTaskConflicts
    ? "Checking existing tasks"
    : initialSiteMeasurementConflict
      ? "Initial Site Measurement task already created and not completed"
      : !canShowInitialSiteMeasurementOption
        ? "You don’t have permission to assign Initial Site Measurement."
        : "Initial Site Measurement is not available here";

  const { data: followUpUsersData } = useFollowUpUsers(
    vendorId,
    leadId,
    franchiseId
  );
  const followUpTooltip =
    "A Follow Up Task is already assigned to this user, which is not yet completed.";

  const franchiseSalesExecutives =
    salesExecutiveUsers?.data?.sales_executives ?? [];
  const eligibleCustomUsers =
    customPrivilegeUsers?.data?.sales_executives ?? [];

  const initialSiteMeasurementUsers = React.useMemo(() => {
    if (vendorCustomUserTypeMode === true) {
      return eligibleCustomUsers;
    }

    if (vendorCustomUserTypeMode === false) {
      const mergedUsers = [
        ...franchiseSalesExecutives,
        ...eligibleCustomUsers,
      ];

      return mergedUsers.filter(
        (user: any, index: number, array: any[]) =>
          array.findIndex((candidate: any) => candidate.id === user.id) === index,
      );
    }

    return franchiseSalesExecutives;
  }, [
    eligibleCustomUsers,
    franchiseSalesExecutives,
    vendorCustomUserTypeMode,
  ]);

  const mappedData = isFollowUp
    ? (isCustomUser
        ? eligibleCustomUsers
        : (followUpUsersData?.data?.users ?? [])
      ).map((u: any) => ({
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
    loadingSalesExecutiveUsers || loadingCustomPrivilegeUsers;
  const error = salesExecutiveUsersError || customPrivilegeUsersError;

  React.useEffect(() => {
    if (
      form.getValues("task_type") === "Initial Site Measurement" &&
      isInitialSiteMeasurementDisabled &&
      canShowFollowUpOption
    ) {
      form.setValue("task_type", "Follow Up");
    }
  }, [form, isInitialSiteMeasurementDisabled, canShowFollowUpOption]);

  React.useEffect(() => {
    const currentTaskType = form.getValues("task_type");

    if (currentTaskType === "Initial Site Measurement" && !canShowInitialSiteMeasurementOption) {
      form.setValue("task_type", "Follow Up");
      return;
    }

    if (currentTaskType === "Follow Up" && !canShowFollowUpOption && canShowInitialSiteMeasurementOption) {
      form.setValue("task_type", "Initial Site Measurement");
    }
  }, [
    form,
    canShowFollowUpOption,
    canShowInitialSiteMeasurementOption,
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (
      values.task_type === "Initial Site Measurement" &&
      initialSiteMeasurementConflict
    ) {
      toastManager.add({
        title: "Initial Site Measurement task already created and not completed",
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
        toastManager.add({ title: "Task assigned successfully!", type: "success" });

        queryClient.invalidateQueries({
          queryKey: ["universal-stage-leads"],
          exact: false,
        });

        queryClient.invalidateQueries({ queryKey: ["leadStats"] });
        queryClient.invalidateQueries({ queryKey: ["vendorAllTasks"] });
        queryClient.invalidateQueries({ queryKey: ["vendorUserTasks"] });
        onOpenChange(false);

        // ✅ Redirect if task type is Initial Site Measurement
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
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        form.watch("task_type") === "Follow Up" || onlyFollowUp
          ? "Assign Task for Follow Up"
          : "Assign Task for Initial Site Measurement"
      }
      description={
        form.watch("task_type") === "Follow Up" || onlyFollowUp
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* ✅ Only show "Initial Site Measurement" if not restricted */}
                      {!isInitialSiteMeasurementDisabled ? (
                        <SelectItem value="Initial Site Measurement">
                          Initial Site Measurement
                        </SelectItem>
                      ) : (
                        <CustomeTooltip
                          value={initialSiteMeasurementTooltip}
                          truncateValue={
                            <div className="opacity-50 cursor-not-allowed flex items-center justify-between w-full px-2 py-1.5 text-sm">
                              <span>Initial Site Measurement</span>
                              <span className="text-xs italic text-muted-foreground ml-1">
                                (locked)
                              </span>
                            </div>
                          }
                        />
                      )}
                      {canShowFollowUpOption && (
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
                    <FormLabel className="text-sm">Select User</FormLabel>
                    <FormControl>
                      <AssignToPicker
                        data={mappedData}
                        value={field.value}
                        onChange={field.onChange}
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

export default AssignTaskSiteMeasurementForm;

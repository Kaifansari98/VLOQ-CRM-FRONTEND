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
import { useAssignToFinalMeasurement } from "@/hooks/useLeadsQueries";
import { AssignToFinalMeasurementPayload } from "@/api/final-measurement";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { useVendorSiteSupervisorUsers } from "@/hooks/useVendorSiteSupervisorUsers";
import { useRouter } from "next/navigation";
import { FileUploadField } from "@/components/custom/file-upload";
import { useUploadCSPBooking } from "@/hooks/useUploadCSPBooking";
import { useVendorSalesExecutiveUsers } from "@/hooks/useVendorSalesExecutiveUsers";

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
    task_type: z.enum(["Final Measurements", "Follow Up", "BookingDone - ISM"]),
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
  });

const AssignTaskFinalMeasurementForm: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const {
    data: siteSupervisors,
    isLoading: loadingSupervisors,
    error: supervisorError,
  } = useVendorSiteSupervisorUsers(vendorId!);
  const {
    data: salesExecutives,
    isLoading: loadingSalesExecs,
    error: salesExecError,
  } = useVendorSalesExecutiveUsers(vendorId!);
  const router = useRouter();
  const leadId = data?.id!;
  const accountId = data?.accountId!;
  if (!leadId || !accountId) {
    toast.error("Lead or Account information is missing");
    return null;
  }
  const userId = useAppSelector((state) => state.auth.user?.id);
  const mutation = useAssignToFinalMeasurement(leadId);
  const queryClient = useQueryClient();
  const uploadCSPMutation = useUploadCSPBooking();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assign_lead_to: undefined,
      task_type: "Final Measurements",
      due_date: "",
      remark: "N/A",
      current_site_photos: [],
    },
  });

  const taskType = form.watch("task_type");

  const mappedData = React.useMemo(() => {
    if (taskType === "BookingDone - ISM") {
      return (
        salesExecutives?.data?.sales_executives?.map((user: any) => ({
          id: user.id,
          label: user.user_name,
        })) ?? []
      );
    }

    // Default → Site Supervisors
    return (
      siteSupervisors?.data?.site_supervisors?.map((user: any) => ({
        id: user.id,
        label: user.user_name,
      })) ?? []
    );
  }, [taskType, siteSupervisors, salesExecutives]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
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
          toast.success("Final Measurement assigned successfully!");

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
          toast.error(
            error?.response?.data?.message || "Failed to assign task"
          );
        },
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload site photos");
    }
  };

  if (loadingSupervisors || loadingSalesExecs) {
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

  if (supervisorError || salesExecError) {
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
        form.watch("task_type") === "Follow Up"
          ? "Assign Task for Follow Up"
          : "Assign Task for Final Site Measurements"
      }
      description={
        form.watch("task_type") === "Follow Up"
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="text-sm w-full">
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Final Measurements">
                        Final Measurements
                      </SelectItem>
                      <SelectItem value="Follow Up">Follow Up</SelectItem>
                      <SelectItem value="BookingDone - ISM">
                        BookingDone - ISM
                      </SelectItem>
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

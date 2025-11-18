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
import { useAssignToFinalMeasurement } from "@/hooks/useLeadsQueries";
import { AssignToFinalMeasurementPayload } from "@/api/final-measurement";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { useVendorSiteSupervisorUsers } from "@/hooks/useVendorSiteSupervisorUsers";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
  };
}

const formSchema = z
  .object({
    assign_lead_to: z.number().min(1, "Assign lead to is required"),
    task_type: z.enum(["Final Measurements", "Follow Up"], {
      message: "Task Type is required",
    }),
    due_date: z
      .string()
      .min(1, "Due Date is required")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      }),
    remark: z.string().optional(), // ✅ Make remark optional
  })
  .refine(
    (data) => {
      // ✅ Make remark required ONLY if task type is Follow Up
      if (data.task_type === "Follow Up") {
        return data.remark && data.remark.trim().length > 0;
      }
      return true;
    },
    {
      message: "Remark is required for Follow Up",
      path: ["remark"], // ✅ Attach validation error to remark field
    }
  );

const AssignTaskFinalMeasurementForm: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const {
    data: vendorUsers,
    isLoading: loadingUsers,
    error,
  } = useVendorSiteSupervisorUsers(vendorId!);
  const router = useRouter();
  const leadId = data?.id!;
  const userId = useAppSelector((state) => state.auth.user?.id);
  const mutation = useAssignToFinalMeasurement(leadId);
  const queryClient = useQueryClient();

  const mappedData =
    vendorUsers?.data?.site_supervisors?.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    })) ?? [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assign_lead_to: undefined,
      task_type: "Final Measurements",
      due_date: "",
      remark: "N/A",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: AssignToFinalMeasurementPayload = {
      task_type: values.task_type,
      due_date: values.due_date,
      remark: values.remark,
      user_id: values.assign_lead_to!,
      created_by: userId!,
    };

    mutation.mutate(payload, {
      onSuccess: (data) => {
        console.log("API Response:", data); // Backend response
        toast.success("Task assigned successfully!");
        queryClient.invalidateQueries({
          queryKey: ["leadStats", vendorId, userId],
        });
        queryClient.invalidateQueries({
          queryKey: ["siteMeasurementLeads", vendorId],
        });
        onOpenChange(false);
        // ✅ Redirect conditionally
        if (values.task_type === "Final Measurements") {
          router.push("/dashboard/project/final-measurement");
        }
      },
      onError: (error: any) => {
        console.error("API Error:", error);
        const backendMessage =
          error?.response?.data?.message ||
          error.message ||
          "Something went wrong";
        toast.error(backendMessage);
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
        form.watch("task_type") === "Follow Up"
          ? "Assign Task for Follow Up"
          : "Assign Task for Final Site Measurements"
      }
      description={
        form.watch("task_type") === "Follow Up"
          ? "Use this form to assign a follow up task."
          : "Use this form to assign a final measurement task."
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
                      <SelectItem value="Final Measurements">
                        Final Measurements
                      </SelectItem>
                      <SelectItem value="Follow Up">Follow Up</SelectItem>
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

export default AssignTaskFinalMeasurementForm;

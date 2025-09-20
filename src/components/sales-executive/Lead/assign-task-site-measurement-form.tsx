import AssignToPicker from "@/components/assign-to-picker";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    id: number;
    name: string;
  };
}

const formSchema = z.object({
  assign_lead_to: z.number().min(1, "Assign lead to Is required"),
  task_type: z.enum(["Initial Site Measurement", "Follow Up"], {
    message: "Task Type is required",
  }),
  due_date: z
    .string()
    .min(1, "Due Date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),

  remark: z.string().min(1, "Remark is required"),
});

const AssignTaskSiteMeasurementForm: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const {
    data: vendorUsers,
    isLoading,
    error,
  } = useVendorSalesExecutiveUsers(vendorId!);

  const mappedData =
    vendorUsers?.data?.sales_executives?.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    })) ?? [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assign_lead_to: undefined,
      task_type: "Initial Site Measurement",
      due_date: "",
      remark: "",
    },
  });

  // 🚨 don’t return before useForm
  if (isLoading) {
    return (
      <BaseModal
        open={open}
        onOpenChange={onOpenChange}
        title="Loading..."
        size="md"
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
        size="md"
      >
        <div className="p-6">Error: {error.message}</div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Assign Task for Initial Site Measurement"
      description="Use this form to assign a site measurement task."
      size="md"
    >
      <div className="px-6 py-6 space-y-8">
        <Form {...form}>
          <form className="space-y-5">
            <FormField
              control={form.control}
              name="assign_lead_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Assign Lead To</FormLabel>
                  <FormControl>
                    <AssignToPicker
                      data={mappedData}
                      onChange={(selectedId) =>
                        console.log("Selected ID:", selectedId)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Task Type */}
              <Controller
                control={form.control}
                name="task_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Task Type</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select task type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Initial Site Measurement">
                          Initial Site Measurement
                        </SelectItem>
                        <SelectItem value="Follow Up">Follow Up</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Due Date */}
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
          </form>
        </Form>
      </div>
    </BaseModal>
  );
};

export default AssignTaskSiteMeasurementForm;

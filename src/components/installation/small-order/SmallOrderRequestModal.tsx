"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import TextSelectPicker from "@/components/TextSelectPicker";
import CustomeDatePicker from "@/components/date-picker";
import TextAreaInput from "@/components/origin-text-area";
import { FileUploadField } from "@/components/custom/file-upload";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { useSmallOrderRequestTypes } from "@/hooks/useTypesMaster";
import { useCreateSmallOrderRequest } from "@/hooks/useLeadsQueries";
import { useAppSelector } from "@/redux/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type SmallOrderRequestSourceContext =
  | "under_installation"
  | "final_handover";

interface SmallOrderRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: SmallOrderRequestSourceContext;
  leadId: number;
}

const FILE_REQUIRED_ORDER_TYPE_KEYS = new Set<string>([
  "additional_panel",
  "one_cabinet",
]);

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

const formSchema = z.object({
  orderType: z.string().min(1, "Type of Order is required"),
  requiredDate: z.string().min(1, "Required Date is required"),
  remarks: z
    .string()
    .trim()
    .min(1, "Remarks is required")
    .max(2000, "Remarks must be 2000 characters or less"),
  documents: z.array(z.instanceof(File)),
});

export default function SmallOrderRequestModal({
  open,
  onOpenChange,
  source,
  leadId,
}: SmallOrderRequestModalProps) {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const createSmallOrderRequestMutation = useCreateSmallOrderRequest();
  const createdOn = useMemo(() => new Date(), [open]);
  const earliestRequiredDate = useMemo(() => addDays(createdOn, 15), [createdOn]);
  const minRequiredDate = useMemo(
    () => formatYmd(earliestRequiredDate),
    [earliestRequiredDate],
  );
  const { data: smallOrderRequestTypesResponse, isLoading: loadingTypes } =
    useSmallOrderRequestTypes();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderType: "",
      requiredDate: "",
      remarks: "",
      documents: [],
    },
  });

  const selectedOrderType = form.watch("orderType");
  const smallOrderRequestTypes = smallOrderRequestTypesResponse?.data ?? [];
  const orderTypeOptions = useMemo(
    () => smallOrderRequestTypes.map((item: any) => item.type),
    [smallOrderRequestTypes],
  );
  const selectedOrderTypeMaster = useMemo(
    () =>
      smallOrderRequestTypes.find(
        (item: any) => item.type === selectedOrderType,
      ),
    [selectedOrderType, smallOrderRequestTypes],
  );
  const isDocumentsRequired = FILE_REQUIRED_ORDER_TYPE_KEYS.has(
    String(selectedOrderTypeMaster?.type_key ?? ""),
  );

  useEffect(() => {
    if (!open) return;
    form.reset({
      orderType: "",
      requiredDate: "",
      remarks: "",
      documents: [],
    });
  }, [form, open, source]);

  const sourceLabel =
    source === "under_installation" ? "Under Installation" : "Final Handover";

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isDocumentsRequired && values.documents.length === 0) {
      form.setError("documents", {
        message:
          "File Upload is mandatory for Additional Panel Order and One Cabinet Order.",
      });
      return;
    }

    if (!selectedOrderTypeMaster?.id) {
      form.setError("orderType", {
        message: "Type of Order is required",
      });
      return;
    }

    if (!vendorId || !userId) {
      toastManager.add({
        title: "User context is missing. Please refresh and try again.",
        type: "error",
      });
      return;
    }

    try {
      await createSmallOrderRequestMutation.mutateAsync({
        leadId,
        vendorId,
        createdBy: userId,
        requestSource:
          source === "final_handover" ? "final_handover" : "post_dispatch",
        requestTypeId: selectedOrderTypeMaster.id,
        requiredDate: values.requiredDate,
        remarks: values.remarks.trim(),
        documents: values.documents,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["lead", leadId, vendorId, userId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["leadLogs"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["vendorAllTasks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["vendorUserTasks"],
        }),
      ]);

      toastManager.add({
        title: "Small Order Request created successfully.",
        type: "success",
      });
      handleClose();
    } catch (error: any) {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to create Small Order Request.",
        type: "error",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-muted/30 px-6 py-4">
          <DialogTitle className="text-left text-2xl font-semibold">
            Small Order Request
          </DialogTitle>
          <DialogDescription className="text-left text-base text-muted-foreground">
            {`Raised from ${sourceLabel}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="orderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Order</FormLabel>
                    <FormControl>
                    <TextSelectPicker
                      options={orderTypeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      emptyLabel="Select order type"
                      placeholder="Search order type"
                      disabled={loadingTypes}
                    />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Date</FormLabel>
                    <FormControl>
                      <CustomeDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        restriction="futureOnly"
                        minDate={minRequiredDate}
                      />
                    </FormControl>
                    {/* <FormDescription>
                      Earliest available date: {formatDisplayDate(earliestRequiredDate)}
                    </FormDescription> */}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <TextAreaInput
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Enter remarks"
                      maxLength={2000}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    File Upload (All Documents)
                    {isDocumentsRequired ? " *" : ""}
                  </FormLabel>
                  <FormControl>
                    <FileUploadField
                      value={field.value}
                      onChange={field.onChange}
                      multiple
                    />
                  </FormControl>
                  <FormDescription>
                    {isDocumentsRequired
                      ? "Mandatory for Additional Panel Order and One Cabinet Order."
                      : "Optional for the selected order type."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2 pb-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSmallOrderRequestMutation.isPending}
              >
                {createSmallOrderRequestMutation.isPending
                  ? "Creating..."
                  : "Create Request"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

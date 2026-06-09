"use client";

import { useEffect, useMemo } from "react";
import BaseModal from "@/components/utils/baseModal";
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

export type SmallOrderRequestSourceContext =
  | "under_installation"
  | "final_handover";

interface SmallOrderRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: SmallOrderRequestSourceContext;
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
  remarks: z.string().max(2000).optional(),
  documents: z.array(z.instanceof(File)),
});

export default function SmallOrderRequestModal({
  open,
  onOpenChange,
  source,
}: SmallOrderRequestModalProps) {
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

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (isDocumentsRequired && values.documents.length === 0) {
      form.setError("documents", {
        message:
          "File Upload is mandatory for Additional Panel Order and One Cabinet Order.",
      });
      return;
    }

    toastManager.add({
      title: `Small Order Request form is ready from ${sourceLabel}. Submit wiring is next.`,
      type: "success",
    });
    console.log("small-order-request-form", {
      source,
      ...values,
    });
    handleClose();
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Small Order Request"
      description={`Raised from ${sourceLabel}. Required Date starts from ${formatDisplayDate(
        earliestRequiredDate,
      )}.`}
      size="lg"
    >
      <div className="p-6">
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

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Create Request</Button>
            </div>
          </form>
        </Form>
      </div>
    </BaseModal>
  );
}

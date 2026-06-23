"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import AssignToPicker from "@/components/assign-to-picker";
import { useBackendUsers } from "@/api/client-approval";
import { useApproveTechCheck } from "@/api/tech-check";
import CustomeDatePicker from "@/components/date-picker";
import { addDays, format } from "date-fns";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";

const DEFAULT_MIN_DAYS = 20;

const buildSchema = (minDate: string, minDays: number) =>
  z.object({
    assign_to_user_id: z.number().min(1, "Please select a Backend user"),
    client_required_order_login_complition_date: z
      .string()
      .min(1, "Please select a date")
      .refine((value) => value >= minDate, {
        message: `Client required date must be at least ${minDays} days from today`,
      }),
  });

type FormValues = {
  assign_to_user_id: number;
  client_required_order_login_complition_date: string;
};

interface MoveToOrderLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: number;
    accountId: number;
    instanceId?: number | null;
  };
}

export default function MoveToOrderLoginModal({
  open,
  onOpenChange,
  data,
}: MoveToOrderLoginModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);
  const vendorCustomUserTypeMode = useAppSelector(
    (s) =>
      s.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only as
        | boolean
        | null
        | undefined,
  );

  const { data: backendUsers, isLoading } = useBackendUsers(vendorId!);
  const { mutate: approveTechCheck, isPending } = useApproveTechCheck();
  const { data: leadStatusData } = useLeadStatus(data.id, vendorId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRequiredDate, setSelectedRequiredDate] = useState<string>("");
  const dialogTitle =
    vendorCustomUserTypeMode === true
      ? "Assign User for Order Login"
      : "Assign Backend User";
  const assignUserLabel =
    vendorCustomUserTypeMode === true
      ? "Assign Eligible User for Order Login"
      : "Assign To Backend User";
  const loadingUsersLabel =
    vendorCustomUserTypeMode === true
      ? "Loading users..."
      : "Loading backend users...";
  const confirmTitle =
    vendorCustomUserTypeMode === true
      ? "Confirm Order Login Assignment"
      : "Confirm Move to Order Login";
  const minDays =
    (leadStatusData as any)?.total_required_chs_manufacturing_days ??
    DEFAULT_MIN_DAYS;
  const minClientRequiredDate = useMemo(
    () => format(addDays(new Date(), minDays), "yyyy-MM-dd"),
    [minDays],
  );
  const schema = useMemo(
    () => buildSchema(minClientRequiredDate, minDays),
    [minClientRequiredDate, minDays],
  );

  const mappedUsers =
    backendUsers?.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    })) ?? [];
  const hasSingleBackendUser = mappedUsers.length === 1;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      assign_to_user_id: 0,
      client_required_order_login_complition_date: "",
    },
  });

  // Auto-select the only available backend user, but keep the form open
  // because the required completion date is now collected here.
  useEffect(() => {
    if (open && backendUsers && backendUsers.length === 1) {
      const single = backendUsers[0];
      form.setValue("assign_to_user_id", single.id);
      setSelectedUserId(single.id);
      setSelectedUserName(single.user_name);
    }
  }, [open, backendUsers, form]);

  useEffect(() => {
    if (!open) {
      form.reset({
        assign_to_user_id: 0,
        client_required_order_login_complition_date: "",
      });
      setSelectedUserId(null);
      setSelectedUserName(null);
      setSelectedRequiredDate("");
    }
  }, [open, form]);

  // ❇️ Final Confirm Submit
  const handleConfirmSubmit = () => {
    const assignUserId = selectedUserId ?? form.getValues("assign_to_user_id");
    const requiredDate =
      selectedRequiredDate ||
      form.getValues("client_required_order_login_complition_date");

    if (!vendorId || !userId || !assignUserId || !requiredDate) {
      toastManager.add({ title: "Missing required details!", type: "error" });
      return;
    }

    approveTechCheck(
      {
        vendorId,
        leadId: data.id,
        userId,
        assignToUserId: assignUserId,
        accountId: data.accountId,
        clientRequiredOrderLoginComplitionDate: requiredDate,
        productStructureInstanceId: data.instanceId ?? undefined,
      },
      {
        onSuccess: (response: any) => {
          const movedToOrderLogin = Boolean(
            response?.data?.moved_to_order_login ||
              response?.moved_to_order_login
          );
          toastManager.add({ title: movedToOrderLogin
              ? "All instances completed. Lead moved to Order Login successfully!"
              : data.instanceId
              ? "Tech Check marked complete for this instance."
              : "Lead moved to Order Login successfully!", type: "success" });
          router.push(
         
              "/dashboard/production/order-login"
              
          );
          queryClient.invalidateQueries({ queryKey: ["leadStats"] });
          queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] });
          setConfirmOpen(false);
          onOpenChange(false);
          form.reset();
          setSelectedRequiredDate("");
        },
      }
    );
  };

  // ❇️ Form Submit → Open Confirmation Dialog
  const onSubmit: SubmitHandler<FormValues> = (values) => {
    const selected = mappedUsers.find((u: any) => u.id === values.assign_to_user_id);
    setSelectedUserName(selected?.label || null);
    setSelectedUserId(values.assign_to_user_id);
    setSelectedRequiredDate(values.client_required_order_login_complition_date);
    setConfirmOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="pt-4 max-h-[60vh]">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">
                {loadingUsersLabel}
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="assign_to_user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          {assignUserLabel}
                        </FormLabel>
                        {hasSingleBackendUser ? (
                          <p className="text-sm font-medium text-foreground">
                            {mappedUsers[0]?.label}
                          </p>
                        ) : (
                          <FormControl>
                            <AssignToPicker
                              data={mappedUsers}
                              value={field.value}
                              onChange={(value) =>
                                field.onChange(Number(value) || 0)
                              }
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="client_required_order_login_complition_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          Client Required Completion Date
                        </FormLabel>
                        <FormControl>
                          <CustomeDatePicker
                            value={field.value}
                            onChange={field.onChange}
                            restriction="futureOnly"
                            minDate={minClientRequiredDate}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Select a date from{" "}
                          {new Date(minClientRequiredDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            },
                          )}{" "}
                          onwards.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Processing..." : "Move To Order Login"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 🔥 Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUserName
                ? vendorCustomUserTypeMode === true
                  ? `Are you sure you want to assign this lead to the eligible user ${selectedUserName}?`
                  : `Are you sure you want to assign this lead to ${selectedUserName}?`
                : `Are you sure you want to move this lead to Order Login stage?`}
            </AlertDialogDescription>
            {selectedRequiredDate ? (
              <p className="text-sm text-muted-foreground">
                Client required completion date:{" "}
                {new Date(selectedRequiredDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={isPending}
            >
              {isPending ? "Submitting..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import React, { useEffect, useState } from "react";
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
import {
  useRequestToProduction,
  useFactoryUsers,
} from "@/api/production/order-login";
import AssignToPicker from "@/components/assign-to-picker";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { createLeadChatRoom } from "@/api/lead-chats";

const schema = z.object({
  assign_to_user_id: z.number().min(1, "Please select a Factory user"),
});

type FormValues = z.infer<typeof schema>;

interface MoveToProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: number;
    accountId: number;
    instanceId?: number | null;
  };
  client_required_order_login_complition_date?: string;
}

export default function MoveToProductionModal({
  open,
  onOpenChange,
  data,
  client_required_order_login_complition_date,
}: MoveToProductionModalProps) {
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

  const { data: factoryUsers, isLoading } = useFactoryUsers(vendorId!);
  const { mutate, isPending } = useRequestToProduction();
//  const { data: leadDetails } = useLeadById(data?.id, vendorId, userId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: leadDetails } = useLeadById(data?.id, vendorId, userId);

  const mappedUsers =
    factoryUsers?.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    })) ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { assign_to_user_id: 0 },
  });

  // ✅ Auto-open confirmation if there’s only one user
  useEffect(() => {
    if (open && factoryUsers && factoryUsers.length === 1) {
      const singleUser = factoryUsers[0];
      form.setValue("assign_to_user_id", singleUser.id);
      setSelectedUserId(singleUser.id);
      setSelectedUserName(singleUser.user_name);
      onOpenChange(false);
      setConfirmOpen(true);
    }
  }, [open, factoryUsers, form, onOpenChange]);

  // ✅ Handle confirm submit
  const handleConfirmSubmit = () => {
    const assign_to_user_id =
      selectedUserId || form.getValues("assign_to_user_id");
    if (!vendorId || !userId || !assign_to_user_id) {
      toastManager.add({ title: "Missing information!", type: "error" });
      return;
    }

    const requiredDate =
      client_required_order_login_complition_date ??
      leadDetails?.data?.lead?.client_required_order_login_complition_date;

    if (!requiredDate) {
      toastManager.add({ title: "Client required completion date missing!", type: "error" });
      return;
    }

    mutate(
      {
        vendorId,
        leadId: data.id,
        accountId: data.accountId,
        assign_to_user_id,
        created_by: userId,
        client_required_order_login_complition_date: requiredDate,
        instanceId: data.instanceId ?? undefined,
      },
      {
        onSuccess: (response: any) => {
          // Add factory and pre-prod users to lead chatroom
          createLeadChatRoom(data.id, userId!).catch(() => {
            // best-effort — don't block on chat member sync failure
          });

          const movedToProduction = Boolean(
            response?.data?.moved_to_production ||
            response?.moved_to_production,
          );
          toastManager.add({ title: movedToProduction
              ? "All instances completed. Lead moved to Production successfully!"
              : data.instanceId
                ? "Order Login marked complete for this instance."
                : "Lead moved to Production stage successfully!", type: "success" });
          router.push("/dashboard/production/pre-post-prod");
          queryClient.invalidateQueries({ queryKey: ["leadStats"] });
          queryClient.invalidateQueries({ queryKey: ["leadStats"] });
          queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] });
          setConfirmOpen(false);
          onOpenChange(false);
        },
      },
    );
  };

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    const selectedUser = mappedUsers.find(
      (u: any) => u.id === values.assign_to_user_id,
    );
    setSelectedUserName(selectedUser?.label || null);
    setSelectedUserId(values.assign_to_user_id);
    setConfirmOpen(true);
  };

  return (
    <>
      {factoryUsers?.length !== 1 && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Move Lead to Production</DialogTitle>
            </DialogHeader>

            <ScrollArea className="pt-4 max-h-[60vh]">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  {vendorCustomUserTypeMode === true
                    ? "Loading users..."
                    : "Loading factory users..."}
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
                            {vendorCustomUserTypeMode === true
                              ? "Assign User for Production"
                              : "Assign To Factory User"}
                          </FormLabel>
                          <FormControl>
                            <AssignToPicker
                              data={mappedUsers}
                              value={field.value}
                              onChange={(value) =>
                                field.onChange(Number(value) || 0)
                              }
                            />
                          </FormControl>
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
                        {isPending ? "Processing..." : "Move To Production"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* ✅ Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Move To Production</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUserName
                ? `Are you sure you want to assign this lead to ${selectedUserName} for Production?`
                : `Are you sure you want to move this lead to Production stage?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
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

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
import { toast } from "react-toastify";
import { useAppSelector } from "@/redux/store";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import AssignToPicker from "@/components/assign-to-picker";
import { useBackendUsers } from "@/api/client-approval";
import { useApproveTechCheck } from "@/api/tech-check";

const schema = z.object({
  assign_to_user_id: z.number().min(1, "Please select a Backend user"),
});

type FormValues = z.infer<typeof schema>;

interface MoveToOrderLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: number;
    accountId: number;
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

  const { data: backendUsers, isLoading } = useBackendUsers(vendorId!);
  const { mutate: approveTechCheck, isPending } = useApproveTechCheck();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const mappedUsers =
    backendUsers?.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    })) ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { assign_to_user_id: 0 },
  });

  // ✅ Auto-select & directly open confirmation if only 1 backend user
  useEffect(() => {
    if (open && backendUsers && backendUsers.length === 1) {
      const single = backendUsers[0];
      form.setValue("assign_to_user_id", single.id);
      setSelectedUserId(single.id);
      setSelectedUserName(single.user_name);

      onOpenChange(false);
      setConfirmOpen(true);
    }
  }, [open, backendUsers, form, onOpenChange]);

  // ❇️ Final Confirm Submit
  const handleConfirmSubmit = () => {
    const assignUserId = selectedUserId ?? form.getValues("assign_to_user_id");

    if (!vendorId || !userId || !assignUserId) {
      toast.error("Missing required details!");
      return;
    }

    approveTechCheck(
      {
        vendorId,
        leadId: data.id,
        userId,
        assignToUserId: assignUserId,
        accountId: data.accountId,
      },
      {
        onSuccess: () => {
          toast.success("Lead moved to Order Login successfully!");
          router.push("/dashboard/production/order-login");
          queryClient.invalidateQueries({ queryKey: ["leadStats"] });
          queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] });
          setConfirmOpen(false);
          onOpenChange(false);
        },
      }
    );
  };

  // ❇️ Form Submit → Open Confirmation Dialog
  const onSubmit: SubmitHandler<FormValues> = (values) => {
    const selected = mappedUsers.find((u: any) => u.id === values.assign_to_user_id);
    setSelectedUserName(selected?.label || null);
    setSelectedUserId(values.assign_to_user_id);
    setConfirmOpen(true);
  };

  return (
    <>
      {backendUsers?.length !== 1 && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Assign Backend User</DialogTitle>
            </DialogHeader>

            <ScrollArea className="pt-4 max-h-[60vh]">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Loading backend users...
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
                            Assign To Backend User
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
                        {isPending ? "Processing..." : "Move To Order Login"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* 🔥 Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Move to Order Login</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUserName
                ? `Are you sure you want to assign this lead to ${selectedUserName}?`
                : `Are you sure you want to move this lead to Order Login stage?`}
            </AlertDialogDescription>
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

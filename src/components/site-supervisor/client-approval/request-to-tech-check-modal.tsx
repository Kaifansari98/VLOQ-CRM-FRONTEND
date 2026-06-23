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
import {
  useTechCheckUsers,
  useRequestToTechCheck,
} from "@/api/client-approval";
import AssignToPicker from "@/components/assign-to-picker";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
const schema = z.object({
  assign_to_user_id: z.number().min(1, "Please select a Tech Check user"),
});

type FormValues = {
  assign_to_user_id: number;
};

interface RequestToTechCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: number;
    accountId: number;
  };
}

const RequestToTechCheckModal: React.FC<RequestToTechCheckModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
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

  const { data: techCheckUsers, isLoading } = useTechCheckUsers(vendorId!);
  const { mutate, isPending } = useRequestToTechCheck();

  const [showSingleUserConfirm, setShowSingleUserConfirm] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const activeUsers = techCheckUsers ?? [];
  const isUsersLoading = isLoading;
  const assignUserLabel =
    vendorCustomUserTypeMode === true
      ? "Assign Eligible User for Tech Check"
      : "Assign User for Tech Check";
  const loadingUsersLabel =
    vendorCustomUserTypeMode === true
      ? "Loading users..."
      : "Loading tech check users...";
  const singleUserConfirmTitle =
    vendorCustomUserTypeMode === true
      ? "Confirm Tech Check Assignment"
      : "Confirm Tech Check Request";
  const singleUserConfirmDescription =
    vendorCustomUserTypeMode === true
      ? "Assign this lead to the eligible user"
      : "Assign this lead to";

  const mappedUsers =
    activeUsers?.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    })) ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      assign_to_user_id: 0,
    },
  });

  // Check if single user and show confirmation directly
  useEffect(() => {
    if (open && activeUsers && activeUsers.length === 1) {
      const singleUser = activeUsers[0];
      form.setValue("assign_to_user_id", singleUser.id);
      setSelectedUserName(singleUser.user_name);
      setShowSingleUserConfirm(true);
    } else if (open) {
      setShowSingleUserConfirm(false);
      form.setValue("assign_to_user_id", 0);
    }
  }, [open, activeUsers, form]);

  const handleSingleUserSubmit = () => {
    const assign_to_user_id = form.getValues("assign_to_user_id");

    if (!vendorId || !userId || !assign_to_user_id) {
      toastManager.add({ title: "Missing required information", type: "error" });
      return;
    }

    mutate(
      {
        vendorId,
        leadId: data.id,
        accountId: data.accountId,
        assign_to_user_id,
        created_by: userId,
      },
      {
        onSuccess: () => {
          toastManager.add({ title: "Lead moved to Tech Check stage successfully!", type: "success" });
          router.push("/dashboard/production/tech-check");
          queryClient.invalidateQueries({ queryKey: ["leadStats"] });
          queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] });
          form.reset();
          setShowSingleUserConfirm(false);
          onOpenChange(false);
        },
      }
    );
  };

  // Handle multiple users flow
  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!vendorId || !userId) {
      toastManager.add({ title: "Missing required information", type: "error" });
      return;
    }

    mutate(
      {
        vendorId,
        leadId: data.id,
        accountId: data.accountId,
        assign_to_user_id: values.assign_to_user_id,
        created_by: userId,
      },
      {
        onSuccess: () => {
          toastManager.add({ title: "Lead moved to Tech Check stage successfully!", type: "success" });
          router.push("/dashboard/production/tech-check");
          queryClient.invalidateQueries({ queryKey: ["leadStats"] });
          queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] });
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  // Single user confirmation dialog
  if (showSingleUserConfirm && activeUsers?.length === 1) {
    return (
      <AlertDialog
        open={showSingleUserConfirm}
        onOpenChange={(open) => {
          setShowSingleUserConfirm(open);
          if (!open) {
            onOpenChange(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{singleUserConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {singleUserConfirmDescription}{" "}
              <strong>{selectedUserName}</strong> for Tech Check.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              onClick={() => {
                setShowSingleUserConfirm(false);
                onOpenChange(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSingleUserSubmit}
              disabled={isPending}
            >
              {isPending ? "Submitting..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Multiple users - show full form
  return (
    <Dialog open={open && !showSingleUserConfirm} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Request To Tech Check</DialogTitle>
        </DialogHeader>

        <ScrollArea className="pt-4 max-h-[60vh]">
          {isUsersLoading ? (
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
                    {isPending ? "Requesting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RequestToTechCheckModal;

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import AssignToPicker from "@/components/assign-to-picker";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import {
  assignDesignerToLead,
  getVendorSalesExecutiveUsers,
} from "@/api/leads";
import { toastError } from "@/lib/utils";

const formSchema = z.object({
  assign_to_user_id: z.number().min(1, "Please select a designer"),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignDesignerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: number;
    accountId: number;
    franchiseId?: number | null;
  };
}

export default function AssignDesignerModal({
  open,
  onOpenChange,
  data,
}: AssignDesignerModalProps) {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const [showSingleUserConfirm, setShowSingleUserConfirm] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assign_to_user_id: 0,
    },
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: [
      "assignDesignerUsers",
      vendorId,
      data.franchiseId ?? null,
      "leads.designing_stage.designs.upload",
    ],
    queryFn: async () => {
      if (!vendorId) return [];

      const response = await getVendorSalesExecutiveUsers(
        vendorId,
        data.franchiseId ?? undefined,
        {
          assigneeUserType: "custom",
          requiredPrivilegeCode: "leads.designing_stage.designs.upload",
        },
      );

      const payload = response?.data;
      if (Array.isArray(payload)) {
        return payload;
      }
      return payload?.sales_executives || [];
    },
    enabled: open && !!vendorId,
    staleTime: 60_000,
  });

  const mappedUsers = useMemo(
    () =>
      users.map((user: any) => ({
        id: user.id,
        label: user.user_name,
      })),
    [users],
  );

  const mutation = useMutation({
    mutationFn: async (assign_to_user_id: number) => {
      if (!vendorId || !userId) {
        throw new Error("Missing required information");
      }

      return assignDesignerToLead(vendorId, data.id, {
        account_id: data.accountId,
        assign_to_user_id,
        created_by: userId,
      });
    },
    onSuccess: () => {
      toastManager.add({
        title: "Designer assigned successfully",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["lead", data.id] });
      form.reset({ assign_to_user_id: 0 });
      setShowSingleUserConfirm(false);
      setSelectedUserName(null);
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toastError(error);
    },
  });

  useEffect(() => {
    if (!open) return;

    if (users.length === 1) {
      form.setValue("assign_to_user_id", users[0].id);
      setSelectedUserName(users[0].user_name);
      setShowSingleUserConfirm(true);
      return;
    }

    setShowSingleUserConfirm(false);
    setSelectedUserName(null);
    form.setValue("assign_to_user_id", 0);
  }, [form, open, users]);

  const handleSingleUserSubmit = () => {
    const assignToUserId = form.getValues("assign_to_user_id");
    if (!assignToUserId) {
      toastManager.add({
        title: "No eligible designer found",
        type: "error",
      });
      return;
    }

    mutation.mutate(assignToUserId);
  };

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    mutation.mutate(values.assign_to_user_id);
  };

  if (showSingleUserConfirm && users.length === 1) {
    return (
      <AlertDialog
        open={showSingleUserConfirm}
        onOpenChange={(nextOpen) => {
          setShowSingleUserConfirm(nextOpen);
          if (!nextOpen) {
            onOpenChange(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Designer Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Assign this lead to <strong>{selectedUserName}</strong> as Designer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={mutation.isPending}
              onClick={() => {
                setShowSingleUserConfirm(false);
                onOpenChange(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSingleUserSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Assigning..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={open && !showSingleUserConfirm} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Assign Designer</DialogTitle>
        </DialogHeader>

        <ScrollArea className="pt-4 max-h-[60vh]">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading eligible designers...
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No eligible designers found.
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="assign_to_user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        Assign Eligible User for Designer
                      </FormLabel>
                      <FormControl>
                        <AssignToPicker
                          data={mappedUsers}
                          value={field.value}
                          onChange={(value) => field.onChange(Number(value) || 0)}
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
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Assigning..." : "Assign Designer"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

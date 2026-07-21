"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import AssignToPicker from "@/components/assign-to-picker";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import { assignDesignerToLead, getVendorSalesExecutiveUsers } from "@/api/leads";
import { useUpdateLeadStage } from "@/hooks/useLeadsQueries";

const schema = z.object({
  assign_to_user_id: z.number().min(1, "Please select a designer"),
});

type FormValues = z.infer<typeof schema>;

interface MoveToDesigningStageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: number;
    accountId: number;
    franchiseId?: number | null;
  };
}

export default function MoveToDesigningStageModal({
  open,
  onOpenChange,
  data,
}: MoveToDesigningStageModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const vendorCustomUserTypeMode = useAppSelector(
    (state) =>
      state.auth.user?.vendor?.is_this_vendor_is_custom_usertype_only as
        | boolean
        | null
        | undefined,
  );

  const { data: users = [], isLoading } = useQuery({
    queryKey: [
      "moveToDesigningUsers",
      vendorId,
      data.franchiseId ?? null,
      "leads.designing_stage.designs.upload",
    ],
    queryFn: async () => {
      if (!vendorId) return [];

      const response = await getVendorSalesExecutiveUsers(
        vendorId,
        data.franchiseId ?? undefined,
        vendorCustomUserTypeMode === true
          ? {
              assigneeUserType: "custom",
              requiredPrivilegeCode: "leads.designing_stage.designs.upload",
            }
          : {
              assigneeUserType: "designer",
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

  const eligibleUsers = useMemo(
    () =>
      (users || []).filter(
        (user: any) =>
          String(user.user_type?.user_type || "").trim().toLowerCase() !== "super-admin",
      ),
    [users],
  );

  const mappedUsers = useMemo(
    () =>
      eligibleUsers.map((user: any) => ({
        id: user.id,
        label: user.user_name,
        subLabel: user.user_email || user.email || "",
      })),
    [eligibleUsers],
  );

  const [showSingleUserConfirm, setShowSingleUserConfirm] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      assign_to_user_id: 0,
    },
  });

  useEffect(() => {
    if (!open) return;

    if (eligibleUsers.length === 1) {
      const singleUser = eligibleUsers[0];
      form.setValue("assign_to_user_id", singleUser.id);
      setSelectedUserName(singleUser.user_name || "Designer");
      setShowSingleUserConfirm(true);
      return;
    }

    form.setValue("assign_to_user_id", 0);
    setSelectedUserName(null);
    setShowSingleUserConfirm(false);
  }, [open, eligibleUsers, form]);

  const { mutateAsync: updateStageAsync, isPending: isUpdatingStage } =
    useUpdateLeadStage();

  const moveMutation = useMutation({
    mutationFn: async (assign_to_user_id: number) => {
      if (!vendorId || !userId) {
        throw new Error("Missing required information");
      }

      await assignDesignerToLead(vendorId, data.id, {
        account_id: data.accountId,
        assign_to_user_id,
        created_by: userId,
      });

      await updateStageAsync({
        leadId: data.id,
        payload: {
          stageTag: "Type 3",
          actionMessage: "Lead moved to Designing stage",
          vendor_id: vendorId,
          updated_by: userId,
        },
      });
    },
    onSuccess: () => {
      toastManager.add({
        title: "Lead moved to Designing stage successfully!",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["lead", data.id] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] });
      queryClient.invalidateQueries({ queryKey: ["vendorUserLeadsOpen"] });
      form.reset();
      setShowSingleUserConfirm(false);
      onOpenChange(false);
      router.push("/dashboard/leads/designing-stage");
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.message ||
          error?.response?.data?.message ||
          "Failed to move lead to Designing stage",
        type: "error",
      });
    },
  });

  const isPending = moveMutation.isPending || isUpdatingStage;

  const handleSingleUserSubmit = () => {
    const assign_to_user_id = form.getValues("assign_to_user_id");

    if (!assign_to_user_id) {
      toastManager.add({ title: "Please select a designer", type: "error" });
      return;
    }

    moveMutation.mutate(assign_to_user_id);
  };

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    moveMutation.mutate(values.assign_to_user_id);
  };

  if (showSingleUserConfirm && eligibleUsers.length === 1) {
    return (
      <AlertDialog
        open={showSingleUserConfirm}
        onOpenChange={(nextOpen) => {
          setShowSingleUserConfirm(nextOpen);
          if (!nextOpen) onOpenChange(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Designing Stage?</AlertDialogTitle>
            <AlertDialogDescription>
              Assign this lead to <strong>{selectedUserName}</strong> and move it
              to Designing stage.
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
              {isPending ? "Moving..." : "Confirm"}
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
          <DialogTitle>Move to Designing Stage</DialogTitle>
        </DialogHeader>

        <ScrollArea className="pt-4 max-h-[60vh]">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading eligible designers...
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="assign_to_user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Assign Designer</FormLabel>
                      <FormControl>
                        <AssignToPicker
                          data={mappedUsers}
                          value={field.value || undefined}
                          onChange={(value) => field.onChange(Number(value) || 0)}
                          placeholder="Search designer..."
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
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || mappedUsers.length === 0}
                  >
                    {isPending ? "Moving..." : "Move to Designing"}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {!isLoading && mappedUsers.length === 0 && (
            <div className="px-1 pb-1 pt-4 text-sm text-muted-foreground">
              No eligible designers found.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

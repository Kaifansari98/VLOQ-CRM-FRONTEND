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
import {
  useTechCheckUsers,
  useRequestToTechCheck,
} from "@/api/client-approval";
import AssignToPicker from "@/components/assign-to-picker";
import { useRouter } from "next/router";

const schema = z.object({
  assign_to_user_id: z.number().min(1, "Please select a Tech Check user"),
});

type FormValues = z.infer<typeof schema>;

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
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data: techCheckUsers, isLoading } = useTechCheckUsers(vendorId!);
  const { mutate, isPending } = useRequestToTechCheck();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const mappedUsers =
    techCheckUsers?.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    })) ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { assign_to_user_id: 0 },
  });

  // ✅ Auto-open confirmation if there’s only one user
  useEffect(() => {
    if (open && techCheckUsers && techCheckUsers.length === 1) {
      const singleUser = techCheckUsers[0];
      console.log("Auto-selected Tech Check user:", singleUser);
      form.setValue("assign_to_user_id", singleUser.id);
      setSelectedUserId(singleUser.id);
      setSelectedUserName(singleUser.user_name);
      onOpenChange(false); // close main modal
      setConfirmOpen(true); // open confirmation modal directly
    }
  }, [open, techCheckUsers, form, onOpenChange]);

  // ✅ Handle confirm submit
  const handleConfirmSubmit = () => {
    const assign_to_user_id =
      selectedUserId || form.getValues("assign_to_user_id");
    if (!vendorId || !userId || !assign_to_user_id) {
      toast.error("Missing information!");
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
          toast.success("Lead moved to Tech Check stage successfully!");
          router.push("/dashboard/production/tech-check");
          form.reset();
          setConfirmOpen(false);
          onOpenChange(false);
        },
      }
    );
  };

  // ✅ Multi-user flow: show form + confirmation
  const onSubmit: SubmitHandler<FormValues> = (values) => {
    const selectedUser = mappedUsers.find(
      (u: any) => u.id === values.assign_to_user_id
    );
    setSelectedUserName(selectedUser?.label || null);
    setSelectedUserId(values.assign_to_user_id);
    setConfirmOpen(true);
  };

  return (
    <>
      {/* Main Modal — only shows if more than one Tech-Check user */}
      {techCheckUsers?.length !== 1 && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Request To Tech Check</DialogTitle>
            </DialogHeader>
            <ScrollArea className="pt-4 max-h-[60vh]">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Loading tech check users...
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
                            Assign To Tech Check User
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
      )}

      {/* ✅ Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Tech Check Request</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUserName
                ? `Are you sure you want to assign this lead to ${selectedUserName} for Tech Check?`
                : `Are you sure you want to move this lead to Tech Check stage?`}
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
};

export default RequestToTechCheckModal;

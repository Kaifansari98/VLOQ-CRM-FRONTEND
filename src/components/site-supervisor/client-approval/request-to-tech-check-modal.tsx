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
import CustomeDatePicker from "@/components/date-picker";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  assign_to_user_id: z.number().min(1, "Please select a Tech Check user"),
  client_required_order_login_complition_date: z
    .string()
    .min(1, "Please select a date"),
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
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((s) => s.auth.user?.vendor_id);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const { data: techCheckUsers, isLoading } = useTechCheckUsers(vendorId!);
  const { mutate, isPending } = useRequestToTechCheck();

  const [showSingleUserConfirm, setShowSingleUserConfirm] = useState(false);
  const [singleUserDate, setSingleUserDate] = useState<string | undefined>("");
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);

  const mappedUsers =
    techCheckUsers?.map((user: any) => ({
      id: user.id,
      label: user.user_name,
    })) ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      assign_to_user_id: 0,
      client_required_order_login_complition_date: "",
    },
  });

  // Check if single user and show confirmation directly
  useEffect(() => {
    if (open && techCheckUsers && techCheckUsers.length === 1) {
      const singleUser = techCheckUsers[0];
      form.setValue("assign_to_user_id", singleUser.id);
      setSelectedUserName(singleUser.user_name);
      setShowSingleUserConfirm(true);
    } else if (open) {
      setShowSingleUserConfirm(false);
      setSingleUserDate("");
    }
  }, [open, techCheckUsers, form]);

  // Handle single user confirmation with date
  const handleSingleUserSubmit = () => {
    if (!singleUserDate) {
      toast.error("Please select a completion date");
      return;
    }

    const assign_to_user_id = form.getValues("assign_to_user_id");

    if (!vendorId || !userId || !assign_to_user_id) {
      toast.error("Missing required information");
      return;
    }

    mutate(
      {
        vendorId,
        leadId: data.id,
        accountId: data.accountId,
        assign_to_user_id,
        created_by: userId,
        client_required_order_login_complition_date: singleUserDate,
      },
      {
        onSuccess: () => {
          toast.success("Lead moved to Tech Check stage successfully!");
          router.push("/dashboard/production/tech-check");
          queryClient.invalidateQueries({ queryKey: ["leadStats"] });
          queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] });
          form.reset();
          setSingleUserDate("");
          setShowSingleUserConfirm(false);
          onOpenChange(false);
        },
      }
    );
  };

  // Handle multiple users flow
  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!vendorId || !userId) {
      toast.error("Missing required information");
      return;
    }

    mutate(
      {
        vendorId,
        leadId: data.id,
        accountId: data.accountId,
        assign_to_user_id: values.assign_to_user_id,
        created_by: userId,
        client_required_order_login_complition_date:
          values.client_required_order_login_complition_date,
      },
      {
        onSuccess: () => {
          toast.success("Lead moved to Tech Check stage successfully!");
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
  if (showSingleUserConfirm && techCheckUsers?.length === 1) {
    return (
      <AlertDialog
        open={showSingleUserConfirm}
        onOpenChange={(open) => {
          setShowSingleUserConfirm(open);
          if (!open) {
            onOpenChange(false);
            setSingleUserDate("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Tech Check Request</AlertDialogTitle>
            <AlertDialogDescription>
              Assign this lead to <strong>{selectedUserName}</strong> for Tech
              Check.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Client Required Completion Date
            </label>
            <CustomeDatePicker
              value={singleUserDate}
              onChange={(value) => setSingleUserDate(value || "")}
              restriction="futureOnly"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              onClick={() => {
                setSingleUserDate("");
                setShowSingleUserConfirm(false);
                onOpenChange(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSingleUserSubmit}
              disabled={isPending || !singleUserDate}
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

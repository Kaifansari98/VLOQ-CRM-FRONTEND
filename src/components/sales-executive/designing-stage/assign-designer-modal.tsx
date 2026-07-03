"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, toastError } from "@/lib/utils";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import {
  assignDesignerToLead,
  getVendorSalesExecutiveUsers,
} from "@/api/leads";

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
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

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
      setShowSingleUserConfirm(false);
      setSelectedUserName(null);
      setSelectedUserId(null);
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toastError(error);
    },
  });

  useEffect(() => {
    if (!open) return;

    if (users.length === 1) {
      setSelectedUserId(users[0].id);
      setSelectedUserName(users[0].user_name);
      setShowSingleUserConfirm(true);
      return;
    }

    setShowSingleUserConfirm(false);
    setSelectedUserName(null);
    setSelectedUserId(null);
  }, [open, users]);

  const handleSingleUserSubmit = () => {
    if (!selectedUserId) {
      toastManager.add({
        title: "No eligible designer found",
        type: "error",
      });
      return;
    }

    mutation.mutate(selectedUserId);
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

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const colors = [
    "bg-purple-500",
    "bg-cyan-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  const getAvatarColor = (name: string) => {
    if (!name) return colors[0];
    const charCodeSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  return (
    <CommandDialog open={open && !showSingleUserConfirm} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search user to assign..." />
      <CommandList>
        {isLoading && (
          <div className="p-6 text-center text-muted-foreground">
            Loading eligible designers...
          </div>
        )}
        {!isLoading && users.length === 0 && (
          <CommandEmpty>No eligible designers found.</CommandEmpty>
        )}
        {!isLoading && users.length > 0 && (
          <CommandGroup heading="Eligible Designers">
            {users.map((user: any) => (
              <CommandItem
                key={user.id}
                onSelect={() => mutation.mutate(user.id)}
                disabled={mutation.isPending}
                className="flex items-center gap-3 p-3 my-1 cursor-pointer"
              >
                <Avatar className={cn("h-10 w-10 text-white", getAvatarColor(user.user_name))}>
                  <AvatarFallback className="bg-transparent">
                    {getInitials(user.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {user.user_name} - {user.user_type?.user_type || "sales-executive"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.user_email || user.email || "No email available"}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

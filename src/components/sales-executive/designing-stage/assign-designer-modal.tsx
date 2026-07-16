"use client";

import React, { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, UserMinus, UserPlus } from "lucide-react";
import { cn, getAvatarColor, getInitials, toastError } from "@/lib/utils";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import {
  assignDesignerToLead,
  getVendorSalesExecutiveUsers,
  unassignDesignerFromLead,
} from "@/api/leads";

interface AssignDesignerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: number;
    accountId: number;
    franchiseId?: number | null;
    assignedDesigners: Array<{
      user_id: number;
      user_name: string | null;
      created_at: string;
    }>;
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

  const assignedIds = useMemo(
    () => new Set(data.assignedDesigners.map((d) => d.user_id)),
    [data.assignedDesigners],
  );

  const assignedUsers = useMemo(() => {
    const eligibleById = new Map<number, any>(
      users.map((u: any) => [u.id, u]),
    );
    return data.assignedDesigners.map((d) => ({
      id: d.user_id,
      user_name: eligibleById.get(d.user_id)?.user_name ?? d.user_name ?? "User",
      user_email: eligibleById.get(d.user_id)?.user_email,
      user_type: eligibleById.get(d.user_id)?.user_type,
    }));
  }, [data.assignedDesigners, users]);

  const availableUsers = useMemo(
    () => users.filter((u: any) => !assignedIds.has(u.id)),
    [users, assignedIds],
  );

  const assignMutation = useMutation({
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
    },
    onError: (error: unknown) => {
      toastError(error);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (user_id: number) => {
      if (!vendorId || !userId) {
        throw new Error("Missing required information");
      }

      return unassignDesignerFromLead(vendorId, data.id, {
        user_id,
        updated_by: userId,
      });
    },
    onSuccess: () => {
      toastManager.add({
        title: "Designer removed",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["lead", data.id] });
    },
    onError: (error: unknown) => {
      toastError(error);
    },
  });

  const isPending = assignMutation.isPending || unassignMutation.isPending;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Designers"
      description="Assign or remove designers for this lead."
    >
      <CommandInput placeholder="Search users..." />
      <CommandList>
        {isLoading && (
          <div className="p-6 text-center text-muted-foreground">
            Loading eligible designers...
          </div>
        )}

        {!isLoading && assignedUsers.length === 0 && availableUsers.length === 0 && (
          <CommandEmpty>No eligible designers found.</CommandEmpty>
        )}

        {!isLoading && assignedUsers.length > 0 && (
          <CommandGroup heading={`Assigned (${assignedUsers.length})`}>
            {assignedUsers.map((user) => (
              <CommandItem
                key={user.id}
                onSelect={() => unassignMutation.mutate(user.id)}
                disabled={isPending}
                className="flex items-center gap-3 p-3 my-1 cursor-pointer group"
              >
                <Avatar
                  className={cn(
                    "h-10 w-10 text-white",
                    getAvatarColor(user.user_name),
                  )}
                >
                  <AvatarFallback className="bg-transparent">
                    {getInitials(user.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-semibold text-sm truncate">
                    {user.user_name}
                    {user.user_type?.user_type
                      ? ` - ${user.user_type.user_type}`
                      : ""}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.user_email || "No email available"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 group-aria-selected:opacity-100 transition-opacity">
                  <UserMinus size={14} className="text-destructive" />
                  <span className="text-destructive">Remove</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!isLoading && availableUsers.length > 0 && (
          <CommandGroup heading="Available Designers">
            {availableUsers.map((user: any) => (
              <CommandItem
                key={user.id}
                onSelect={() => assignMutation.mutate(user.id)}
                disabled={isPending}
                className="flex items-center gap-3 p-3 my-1 cursor-pointer group"
              >
                <Avatar
                  className={cn(
                    "h-10 w-10 text-white",
                    getAvatarColor(user.user_name),
                  )}
                >
                  <AvatarFallback className="bg-transparent">
                    {getInitials(user.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-semibold text-sm truncate">
                    {user.user_name} -{" "}
                    {user.user_type?.user_type || "sales-executive"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.user_email || user.email || "No email available"}
                  </span>
                </div>
                <UserPlus
                  size={16}
                  className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 group-aria-selected:opacity-100 transition-opacity"
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

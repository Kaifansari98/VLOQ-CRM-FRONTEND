"use client";

import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import BaseModal from "@/components/utils/baseModal";
import ClearInput from "@/components/origin-input";
import { useVendorUsers } from "@/api/leads";
import {
  useAssignUsersToMachine,
  useAssignedUsersByMachine,
} from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";
import { getInitials } from "@/lib/utils";
import { Search } from "lucide-react";
interface UserMachineAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId: number | null;
  vendorId: number;
  userId: number;
}

export function UserMachineAssignModal({
  open,
  onOpenChange,
  machineId,
  vendorId,
  userId,
}: UserMachineAssignModalProps) {
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const queryClient = useQueryClient();

  const { data: vendorUsers, isLoading: isVendorUsersLoading } =
    useVendorUsers(vendorId);

  const { mutate: assignUsers, isPending: isAssigning } =
    useAssignUsersToMachine();

  const { data: assignedUsersData } = useAssignedUsersByMachine(
    machineId ?? undefined,
  );

  // Pre-select already assigned users
  useEffect(() => {
    if (!open) return;
    setSelectedUserIds(
      Array.isArray(assignedUsersData?.users) ? assignedUsersData.users : [],
    );
  }, [assignedUsersData, machineId, open]);

  const handleUserToggle = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedUserIds([]);
    setUserSearch("");
  };

  const handleSubmit = () => {
    if (!machineId) return;
    assignUsers(
      {
        machine_id: machineId,
        vendor_id: vendorId,
        user_ids: selectedUserIds,
        created_by: userId,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["assigned-users", machineId],
          });
          toast.success(
            selectedUserIds.length > 0
              ? "Users assigned successfully!"
              : "All users unassigned successfully!",
          );
          handleClose();
        },
        onError: () => {
          toast.error("Failed to assign users. Please try again.");
        },
      },
    );
  };

  const filteredUsers =
    vendorUsers?.data?.filter((user: { id: number; user_name: string }) =>
      user.user_name.toLowerCase().includes(userSearch.toLowerCase()),
    ) ?? [];

  return (
    <BaseModal
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose();
      }}
      title="Assign Users to Machine"
      description="Select operators to assign to this machine"
      size="smd"
    >
      <div className="p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <ClearInput
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users List */}
        {isVendorUsersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !vendorUsers?.data?.length ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto pr-2.5">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserToggle(user.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                  selectedUserIds.includes(user.id)
                    ? ""
                    : "hover:bg-muted border border-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background dark:bg-white dark:text-black text-xs font-semibold">
                  {getInitials(user.user_name)}
                </div>

                {/* Name + Email */}
                <label
                
                  className="flex flex-col cursor-pointer flex-1 select-none "
                >
                  <span className="text-sm font-medium leading-tight">
                    {user.user_name}
                  </span>
                  {user.user_email && (
                    <span className="text-xs text-muted-foreground leading-tight">
                      {user.user_email}
                    </span>
                  )}
                </label>

                {/* Checkbox */}
                <Checkbox
                  checked={selectedUserIds.includes(user.id)}
                  onCheckedChange={() => handleUserToggle(user.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}

            {/* No search results */}
            {userSearch && filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-1">
                <p className="text-sm font-medium">No results found</p>
                <p className="text-xs text-muted-foreground">
                  No user matched &quot;{userSearch}&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={isAssigning} onClick={handleSubmit}>
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Saving...
              </>
            ) : selectedUserIds.length > 0 ? (
              `Assign (${selectedUserIds.length})`
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}

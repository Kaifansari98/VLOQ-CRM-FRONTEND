import React, { useState } from "react";
import { Dialog, DialogContent } from "../../ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../ui/command";
import { useAppSelector } from "@/redux/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignLeadToAnotherSalesExecutive,
  AssignToPayload,
  getVendorSalesExecutiveUsers,
} from "@/api/leads";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

const avatarColors = [
  "bg-red-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-lime-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-stone-500",
  "bg-gray-500",
  "bg-zinc-500",
  "bg-neutral-500",
  "bg-slate-500",
  "bg-yellow-700",
  "bg-blue-700",
];

interface User {
  id: number;
  user_contact?: string;
  user_email?: string;
  user_name?: string;
}

interface AssignLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadData?: {
    id: number;
    assignTo?: User | null;
  };
}

interface SalesExecutiveData {
  id: number;
  user_name: string;
  user_email: string;
}

interface ApiResponse {
  data: {
    sales_executives: SalesExecutiveData[];
    count: number;
  };
}

const AssignLeadModal = ({
  open,
  onOpenChange,
  leadData,
}: AssignLeadModalProps) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [openConfirmation, setOpenConfirmation] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const currentAssignedId = leadData?.assignTo?.id ?? null;
  const [selectedId, setSelectedId] = useState<number | null>(null);

  React.useEffect(() => {
    if (open) setSelectedId(null);
  }, [open, currentAssignedId]);

  // Fetch sales executives
  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ["vendor-sales-executive", vendorId],
    queryFn: () => getVendorSalesExecutiveUsers(vendorId!),
  });

  // Helper: get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Helper: get avatar color
  const getColorForName = (name: string) => {
    if (!name) return "bg-gray-500";
    const index =
      (name.trim()[0].toUpperCase().charCodeAt(0) - 65) % avatarColors.length;
    return avatarColors[index];
  };

  // Mutation to assign lead
  const assignMutation = useMutation({
    mutationFn: (payload: AssignToPayload) =>
      assignLeadToAnotherSalesExecutive(vendorId!, leadData!.id, payload),
    onSuccess: () => {
      toast.success("Assign Lead Successfully.");
      queryClient.invalidateQueries({
        queryKey: ["vendorUserLeads", vendorId, userId],
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Failed to assign lead", error.response?.data || error);
      toast.error("Something went wrong!");
    },
  });

  // Handler function
  // 3) Confirm: use selectedId (not currentAssignedId)
  const confrimHandleAssignLead = () => {
    if (!vendorId || !leadData?.id || !userId || !selectedId) return;

    const payload: AssignToPayload = {
      assign_to: selectedId,
      assign_by: userId,
      assignment_reason: "Assigned via modal",
    };

    assignMutation.mutate(payload);
  };

  // 2) onSelect: block clicking the already-assigned user
  const handleAssignLead = (salesExecutiveId: number) => {
    if (salesExecutiveId === currentAssignedId) {
      toast.info("This lead is already assigned to this user.");
      return; // do nothing
    }
    setSelectedId(salesExecutiveId);
    setOpenConfirmation(true);
  };

  console.log(leadData?.id);
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search user to assign..." />
            <CommandList>
              <CommandGroup heading="Sales-executive">
                {isLoading && (
                  <div className="p-4 text-sm text-gray-500">Loading...</div>
                )}
                {isError && (
                  <div className="p-4 text-sm text-red-500">
                    Failed to load users.
                  </div>
                )}

                {Array.isArray(data?.data?.sales_executives) &&
                data.data.sales_executives.length > 0 ? (
                  data.data.sales_executives.map((user) => {
                    const isAssigned = user.id === currentAssignedId;
                    const isSelected = user.id === selectedId;
                  
                    return (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleAssignLead(user.id)}
                        className={cn(
                          "cursor-pointer",
                          isAssigned && "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900/40",
                          isSelected && !isAssigned && "ring-1 ring-primary/40 bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold ${getColorForName(user.user_name)}`}>
                            {getInitials(user.user_name)}
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium">{user.user_name}</span>
                            <span className="text-xs text-gray-500">{user.user_email}</span>
                          </div>
                  
                          {isAssigned && (
                            <span className="ml-auto text-xs font-semibold text-green-600">
                              Assigned
                            </span>
                          )}
                          {isSelected && !isAssigned && (
                            <span className="ml-2 text-xs font-semibold text-blue-600">
                              Selected
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })) : (
                  <div className="p-4 text-sm text-gray-500">
                    No users found.
                  </div>
                )}
              </CommandGroup>
              <CommandEmpty>No results found.</CommandEmpty>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openConfirmation} onOpenChange={setOpenConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Lead Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign this lead to the selected sales
              executive? This action will move the lead but it can be tracked
              later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel className="text-gray-700 hover:bg-gray-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confrimHandleAssignLead}>
              Assign Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AssignLeadModal;

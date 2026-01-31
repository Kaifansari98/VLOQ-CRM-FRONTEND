"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
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
  useCompanyVendors,
  useOrderLoginByLead,
  useUpdateOrderLogin,
  useDeleteOrderLogin,
  useUploadMultipleFileBreakupsByLead,
} from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { canAccessAddNewSectionButton } from "@/components/utils/privileges";
import FileBreakUpField from "./FileBreakUpField";
import AddSectionModal from "./AddSectionModal";

interface OrderLoginTabProps {
  leadId: number;
  accountId: number;
}

const OrderLoginTab: React.FC<OrderLoginTabProps> = ({ leadId, accountId }) => {
  const queryClient = useQueryClient();

  // Redux selectors
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );

  // API hooks
  const { data: companyVendors } = useCompanyVendors(vendorId);
  const { data: orderLoginData } = useOrderLoginByLead(vendorId, leadId);

  const { data: leadData } = useLeadStatus(leadId, vendorId);

  // Mutations
  const { mutateAsync: updateSingle } = useUpdateOrderLogin(vendorId);
  const { mutateAsync: deleteOrderLogin, isPending: isDeleting } =
    useDeleteOrderLogin(vendorId);
  const { mutateAsync: uploadMultiple } = useUploadMultipleFileBreakupsByLead(
    vendorId,
    leadId,
    accountId,
  );

  // Local state
  const [breakups, setBreakups] = useState<
    Record<string, { item_desc: string; company_vendor_id: number | null }>
  >({});
  const [confirmDelete, setConfirmDelete] = useState<null | {
    id: number;
    title: string;
  }>(null);
  const [confirmVendorChange, setConfirmVendorChange] = useState<null | {
    title: string;
    vendorId: number;
    existingData: any;
  }>(null);

  // Derived state
  const leadStatus = leadData?.status;
  const canAccessButtons = canAccessAddNewSectionButton(userType, leadStatus);

  const normalizedStage = (leadStatus || "").toLowerCase().replace(/_/g, "-");
  const isOrderLoginStage = normalizedStage.includes("order-login");
  const isProductionStage = normalizedStage.includes("production-stage");
  const isBackendUser =
    userType?.toLowerCase() === "backend" ||
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super-admin";
  const canManageCustomSections = isBackendUser && isOrderLoginStage;

  // Formatted users list
  const users =
    companyVendors?.map((vendor: any) => ({
      id: vendor.id,
      label: vendor.company_name,
      in_house: Boolean(vendor.in_house),
    })) || [];

  // Mandatory and default titles
  const mandatoryTitles = ["Carcass", "Shutter", "Stock Hardware"];
  const defaultTitles = [
    ...mandatoryTitles,
    "Special Hardware",
    "Profile Shutter",
    "Outsourced Shutter",
    "Glass Material",
  ];

  // Default and extra cards
  const defaultCards = useMemo(
    () =>
      defaultTitles.map((title) => ({
        title,
        existingData: orderLoginData?.find((i: any) => i.item_type === title),
      })),
    [orderLoginData, defaultTitles],
  );

  const extraFromApi = useMemo(
    () =>
      (orderLoginData || []).filter(
        (i: any) => !defaultTitles.includes(i.item_type),
      ),
    [orderLoginData, defaultTitles],
  );

  // Pre-fill breakups from API data
  useEffect(() => {
    if (orderLoginData && orderLoginData.length > 0) {
      const prefilled = orderLoginData.reduce((acc: any, item: any) => {
        acc[item.item_type] = {
          item_desc: item.item_desc || "",
          company_vendor_id: item.company_vendor_id || null,
        };
        return acc;
      }, {});
      setBreakups(prefilled);
    }
  }, [orderLoginData]);

  // Auto-save description (silent - no toast)
  const handleDescriptionSave = async (title: string, description: string) => {
    const existing = orderLoginData?.find(
      (item: any) => item.item_type === title,
    );

    // Update local state first
    setBreakups((prev) => ({
      ...prev,
      [title]: {
        ...prev[title],
        item_desc: description,
      },
    }));

    if (!existing?.id) {
      // If no existing record, create new one
      try {
        const newRecord = {
          id: null,
          item_type: title,
          item_desc: description.trim() || "N/A",
          company_vendor_id: breakups[title]?.company_vendor_id || null,
          created_by: userId,
          updated_by: userId,
        };

        await uploadMultiple([newRecord]);

        queryClient.invalidateQueries({
          queryKey: ["orderLoginByLead", vendorId, leadId],
        });
        // ✅ No toast for description save - silent
      } catch (err: any) {
        console.error("Failed to save description", err);
      }
      return;
    }

    // Update existing record silently
    try {
      await updateSingle({
        orderLoginId: existing.id,
        payload: {
          lead_id: existing.lead_id ?? leadId,
          item_type: title,
          item_desc: description.trim() || "N/A",
          company_vendor_id: existing.company_vendor_id ?? null,
          updated_by: userId,
        },
      });

      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId],
      });
      // ✅ No toast for description save - silent
    } catch (err: any) {
      console.error("Failed to save description", err);
    }
  };

  // Handle vendor selection
  const handleVendorChange = async (
    title: string,
    selectedVendorId: number,
    existingData: any,
  ) => {
    const isProduction = isProductionStage;

    // Check if vendor already assigned in production
    if (isProduction && existingData?.company_vendor_id) {
      toast.error(
        "Vendor already assigned. Cannot change in production stage.",
      );
      return;
    }

    // Production stage requires confirmation
    if (isProduction) {
      setConfirmVendorChange({
        title,
        vendorId: selectedVendorId,
        existingData,
      });
      return;
    }

    // Order login stage - save directly
    await saveVendorChange(title, selectedVendorId, existingData);
  };

  const saveVendorChange = async (
    title: string,
    selectedVendorId: number,
    existingData: any,
  ) => {
    // Update local state first
    setBreakups((prev) => ({
      ...prev,
      [title]: {
        ...prev[title],
        company_vendor_id: selectedVendorId,
      },
    }));

    if (!existingData?.id) {
      // Create new record
      try {
        const newRecord = {
          id: null,
          item_type: title,
          item_desc: breakups[title]?.item_desc?.trim() || "N/A",
          company_vendor_id: selectedVendorId,
          created_by: userId,
          updated_by: userId,
        };

        await uploadMultiple([newRecord]);

        // ✅ Show success toast
        toast.success(`Vendor assigned to ${title} successfully!`);

        queryClient.invalidateQueries({
          queryKey: ["orderLoginByLead", vendorId, leadId],
        });
        queryClient.invalidateQueries({
          queryKey: ["leadProductionReadiness", vendorId, leadId],
        });
      } catch (err: any) {
        console.error("Failed to save vendor", err);
        toast.error(
          err?.response?.data?.message || "Failed to save vendor selection",
        );
      }
      return;
    }

    // Update existing record
    try {
      await updateSingle({
        orderLoginId: existingData.id,
        payload: {
          lead_id: existingData.lead_id ?? leadId,
          item_type: title,
          item_desc: existingData.item_desc || "N/A",
          company_vendor_id: selectedVendorId,
          updated_by: userId,
        },
      });

      // ✅ Show success toast
      toast.success(`Vendor updated for ${title} successfully!`);

      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadProductionReadiness", vendorId, leadId],
      });
    } catch (err: any) {
      console.error("Failed to save vendor", err);
      toast.error(
        err?.response?.data?.message || "Failed to save vendor selection",
      );
    }
  };

  const handleTitleUpdate = async (item: any, nextTitle: string) => {
    const trimmedTitle = nextTitle.trim();

    if (!trimmedTitle) {
      toast.error("Section name cannot be empty");
      return false;
    }

    if (defaultTitles.includes(trimmedTitle)) {
      toast.error("Section name cannot match a default section");
      return false;
    }

    if (trimmedTitle === item.item_type) return true;

    if (breakups[trimmedTitle]) {
      toast.error("Section name already exists");
      return false;
    }

    if (!item?.id) {
      toast.error("Unable to update section name");
      return false;
    }

    try {
      await updateSingle({
        orderLoginId: item.id,
        payload: {
          lead_id: item.lead_id ?? leadId,
          item_type: trimmedTitle,
          item_desc: (item.item_desc || "N/A").trim() || "N/A",
          company_vendor_id: item.company_vendor_id ?? null,
          updated_by: userId,
        },
      });

      setBreakups((prev) => {
        const next = { ...prev };
        const current = next[item.item_type] || {
          item_desc: "",
          company_vendor_id: null,
        };
        delete next[item.item_type];
        next[trimmedTitle] = current;
        return next;
      });

      toast.success("Section name updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId],
      });
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update section");
      return false;
    }
  };

  const handleDeleteSection = async () => {
    if (!confirmDelete || !userId) return;
    try {
      await deleteOrderLogin({
        orderLoginId: confirmDelete.id,
        deleted_by: userId,
      });

      setBreakups((prev) => {
        const next = { ...prev };
        delete next[confirmDelete.title];
        return next;
      });

      toast.success("Section deleted successfully");
      setConfirmDelete(null);

      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadProductionReadiness", vendorId, leadId],
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete section");
    }
  };

  const getItemEditPermissions = (item: any) => {
    const role = userType?.toLowerCase();
    const stage = leadStatus?.toLowerCase();

    const isAdmin = role === "admin" || role === "super-admin";
    const isBackend = role === "backend";

    const isOrderLoginStageCheck = stage === "order-login-stage";
    const isProductionStageCheck = stage === "production-stage";

    const hasVendorAssigned = !!item?.company_vendor_id;

    // ✅ Admin override — full control always
    if (isAdmin) {
      return {
        canEditVendor: true,
        canEditDescription: true,
      };
    }

    // ✅ Backend in order-login-stage
    if (isBackend && isOrderLoginStageCheck) {
      return {
        canEditVendor: true, // Can edit vendor anytime in order-login-stage
        canEditDescription: true, // Can edit description anytime
      };
    }

    // ✅ Backend in production-stage
    if (isBackend && isProductionStageCheck) {
      return {
        canEditVendor: !hasVendorAssigned, // Can only edit if not assigned yet
        canEditDescription: true, // Can always edit description
      };
    }

    // ❌ Everything else blocked
    return {
      canEditVendor: false,
      canEditDescription: false,
    };
  };

  return (
    <div className="space-y-4 p-1 bg-[#fff] dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex flex-col md:flex-row space-y-2 items-start justify-between">
        <div className="space-y-0">
          <h2 className="text-xl font-semibold tracking-tight">Order Login</h2>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            Fill out item-level breakups and assign responsibilities before
            order login is finalized.
          </p>
        </div>
      </div>

      {/* Grid of Breakups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Default Cards */}
        {defaultCards.map(({ title, existingData }) => {
          const perms = getItemEditPermissions(existingData);
          return (
            <FileBreakUpField
              key={`default-${title}`}
              title={title}
              users={users}
              leadStage={leadStatus}
              userRole={userType}
              value={
                breakups[title] || {
                  item_desc: "",
                  company_vendor_id: null,
                }
              }
              onVendorChange={(selectedVendorId) =>
                handleVendorChange(title, selectedVendorId, existingData)
              }
              onDescriptionBlur={(description) =>
                handleDescriptionSave(title, description)
              }
              canEditVendor={perms.canEditVendor}
              canEditDescription={perms.canEditDescription}
              isMandatory={mandatoryTitles.includes(title)}
              vendorId={vendorId}
              leadId={leadId}
              orderLoginId={existingData?.id}
              userId={userId}
              showPoUpload
            />
          );
        })}

        {/* Extra Sections From API */}
        {extraFromApi.map((item: any) => {
          const perms = getItemEditPermissions(item);
          return (
            <FileBreakUpField
              key={`extra-${item.id ?? item.item_type}`}
              title={item.item_type}
              leadStage={leadStatus}
              userRole={userType}
              users={users}
              value={
                breakups[item.item_type] || {
                  item_desc: item.item_desc || "",
                  company_vendor_id: item.company_vendor_id || null,
                }
              }
              onVendorChange={(selectedVendorId) =>
                handleVendorChange(item.item_type, selectedVendorId, item)
              }
              onDescriptionBlur={(description) =>
                handleDescriptionSave(item.item_type, description)
              }
              canEditDescription={perms.canEditDescription}
              canEditVendor={perms.canEditVendor}
              isMandatory={false}
              isTitleEditable={canManageCustomSections && !!item.id}
              canDelete={canManageCustomSections && !!item.id}
              onTitleSave={(nextTitle) => handleTitleUpdate(item, nextTitle)}
              onDelete={() =>
                setConfirmDelete({
                  id: item.id,
                  title: item.item_type,
                })
              }
              vendorId={vendorId}
              leadId={leadId}
              orderLoginId={item.id}
              userId={userId}
              showPoUpload
            />
          );
        })}

        {/* Add New Section Card */}
        {canAccessButtons && (
          <div
            className="rounded-xl border-2 border-dashed border-primary/30 p-5 bg-primary/5 
                       hover:bg-primary/10 transition-all cursor-pointer group 
                       flex flex-col items-center justify-center gap-3 min-h-[190px]"
          >
            <div
              className="rounded-full bg-primary/10 p-3 
                          group-hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-6 h-6 text-primary" />
            </div>

            <div className="text-center">
              <p className="font-medium text-sm text-primary">
                Add New Section
              </p>
              <p className="text-xs text-muted-foreground">
                Create a new breakup category for this order
              </p>
            </div>

            <AddSectionModal
              users={users}
              leadId={leadId}
              accountId={accountId}
              onSectionAdded={() => {
                queryClient.invalidateQueries({
                  queryKey: ["orderLoginByLead", vendorId, leadId],
                });
              }}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the section and its data. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vendor Change Confirmation Dialog (Production Stage Only) */}
      <AlertDialog
        open={!!confirmVendorChange}
        onOpenChange={(open) => {
          if (!open) setConfirmVendorChange(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Vendor Selection</AlertDialogTitle>
            <AlertDialogDescription>
              You can select the vendor only once in production stage. Once
              confirmed, you won't be able to change it. Are you sure you want
              to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                // Reset local state on cancel
                if (confirmVendorChange) {
                  setBreakups((prev) => ({
                    ...prev,
                    [confirmVendorChange.title]: {
                      ...prev[confirmVendorChange.title],
                      company_vendor_id:
                        confirmVendorChange.existingData?.company_vendor_id ||
                        null,
                    },
                  }));
                }
                setConfirmVendorChange(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmVendorChange) {
                  await saveVendorChange(
                    confirmVendorChange.title,
                    confirmVendorChange.vendorId,
                    confirmVendorChange.existingData,
                  );
                  setConfirmVendorChange(null);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderLoginTab;

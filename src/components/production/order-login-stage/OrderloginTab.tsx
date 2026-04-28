"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, Plus, BadgeCheck } from "lucide-react";
import { toastManager } from "@/components/ui/toast";
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
import { Button } from "@/components/ui/button";
import {
  useCompanyVendors,
  useOrderLoginByLead,
  useUpdateOrderLogin,
  useDeleteOrderLogin,
  useUploadMultipleFileBreakupsByLead,
  useMarkOrderLoginFilled,
} from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";
import {
  useInstanceStage,
  useLeadStatus,
} from "@/hooks/designing-stage/designing-leads-hooks";
import { useLeadProductStructureInstances } from "@/hooks/useLeadsQueries";
import { canAccessAddNewSectionButton } from "@/components/utils/privileges";
import FileBreakUpField from "./FileBreakUpField";
import AddSectionModal from "./AddSectionModal";

interface OrderLoginTabProps {
  leadId: number;
  accountId: number;
  instanceId?: number | null;
}

const OrderLoginTab: React.FC<OrderLoginTabProps> = ({
  leadId,
  accountId,
  instanceId,
}) => {
  const queryClient = useQueryClient();

  // Redux selectors
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );

  // API hooks
  const { data: companyVendors } = useCompanyVendors(vendorId);
  const { data: orderLoginData } = useOrderLoginByLead(
    vendorId,
    leadId,
    instanceId ?? undefined,
  );
  const { data: instanceStageData } = useInstanceStage(
    vendorId,
    leadId,
    instanceId!,
  );
  const { data: leadData } = useLeadStatus(leadId, vendorId);
  const { data: instancesResponse } = useLeadProductStructureInstances(leadId, vendorId);

  const isOrderLoginFilled = useMemo(() => {
    const instances = Array.isArray(instancesResponse?.data)
      ? instancesResponse.data
      : instancesResponse?.data?.data ?? [];
    const current = instances.find((inst: any) => inst.id === instanceId);
    return current?.is_order_login_filled === true;
  }, [instancesResponse, instanceId]);
  const hasValidInstanceId = typeof instanceId === "number" && instanceId > 0;

  // Mutations
  const { mutateAsync: updateSingle } = useUpdateOrderLogin(
    vendorId,
    instanceId ?? null,
  );
  const { mutate: markFilled, isPending: isMarkingComplete } =
    useMarkOrderLoginFilled(vendorId!, leadId, instanceId!);
  const { mutateAsync: deleteOrderLogin, isPending: isDeleting } =
    useDeleteOrderLogin(vendorId);
  const { mutateAsync: uploadMultiple } = useUploadMultipleFileBreakupsByLead(
    vendorId,
    leadId,
    accountId,
    instanceId ?? undefined,
  );

  // Local state
  const [breakups, setBreakups] = useState<
    Record<string, { item_desc: string; company_vendor_id: number | null }>
  >({});
  const [confirmDelete, setConfirmDelete] = useState<null | {
    id: number;
    title: string;
  }>(null);
  // ✅ New: confirmation dialog for "Order Login Completed"
  const [confirmComplete, setConfirmComplete] = useState(false);

  // Debounce timers for description auto-save
  const descTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ─────────────────────────────────────────────────────────
  // STAGE RESOLUTION
  // ─────────────────────────────────────────────────────────
  const leadStatus: string = instanceId
    ? (instanceStageData?.derived_stage ?? leadData?.status ?? "")
    : (leadData?.status ?? "");

  // ─────────────────────────────────────────────────────────
  // ROLE HELPERS
  // ─────────────────────────────────────────────────────────
  const role = userType?.toLowerCase() ?? "";
  const isAdmin = role === "admin" || role === "super-admin";
  const isBackend = role === "backend";

  const normalizedStage = leadStatus.toLowerCase().replace(/_/g, "-");
  const isOrderLoginStage = normalizedStage.includes("order-login-stage");
  const isProductionStage = normalizedStage.includes("production-stage");

  // ─────────────────────────────────────────────────────────
  // ACCESS HELPERS
  // ─────────────────────────────────────────────────────────
  const canAccessButtons = canAccessAddNewSectionButton(userType, leadStatus);

  const canAddCustomSection: boolean =
    isAdmin || (isBackend && (isOrderLoginStage || isProductionStage));

  const canEditOrDeleteCustomSection: boolean =
    isAdmin || (isBackend && isOrderLoginStage);

  // ─────────────────────────────────────────────────────────
  // EDIT PERMISSIONS
  //
  // ORDER-LOGIN STAGE : Admin & Backend → freely editable
  // PRODUCTION STAGE  : Admin & Backend → ONE CHANCE only
  //                     (locked once vendor OR description is saved)
  // Other             → never editable
  // ─────────────────────────────────────────────────────────
  const getItemEditPermissions = (item: any) => {
    if (isOrderLoginStage && (isAdmin || isBackend)) return { canEdit: true };

    if (isProductionStage && (isAdmin || isBackend)) {
      const hasVendorAssigned = !!item?.company_vendor_id;
      const hasDescription = !!(item?.item_desc && item.item_desc);
      return { canEdit: !(hasVendorAssigned || hasDescription) };
    }

    return { canEdit: false };
  };

  // Users list
  const users =
    companyVendors?.map((vendor: any) => ({
      id: vendor.id,
      label: vendor.company_name,
      in_house: Boolean(vendor.in_house),
    })) || [];

  // Titles
  const mandatoryTitles = ["Carcass", "Shutter", "Stock Hardware"];
  const defaultTitles = [
    ...mandatoryTitles,
    "Special Hardware",
    "Profile Shutter",
    "Outsourced Shutter",
    "Glass Material",
  ];

  const defaultCards = useMemo(
    () =>
      defaultTitles.map((title) => ({
        title,
        existingData: orderLoginData?.find((i: any) => i.item_type === title),
      })),
    [orderLoginData],
  );

  const extraFromApi = useMemo(
    () =>
      (orderLoginData || []).filter(
        (i: any) => !defaultTitles.includes(i.item_type),
      ),
    [orderLoginData],
  );

  console.log("order login data: ", orderLoginData)
  // Pre-fill breakups from API
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
    } else {
      setBreakups({});
    }
  }, [orderLoginData, instanceId]);

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      Object.values(descTimers.current).forEach(clearTimeout);
    };
  }, []);

  // ─────────────────────────────────────────────────────────
  // MANDATORY VALIDATION
  // All 3 mandatory sections must have vendor + description.
  // "Order Login Completed" button is ONLY VISIBLE when isValid = true.
  // ─────────────────────────────────────────────────────────
  const mandatoryValidation = useMemo(() => {
    const missing: string[] = [];

    mandatoryTitles.forEach((title) => {
      const local = breakups[title];
      const hasVendor = !!local?.company_vendor_id;
      const hasDesc = !!(
        local?.item_desc &&
        local.item_desc.trim() !== "" &&
        local.item_desc.trim() !== ""
      );
      if (!hasVendor || !hasDesc) missing.push(title);
    });

    return {
      isValid: missing.length === 0,
      missingFields: missing,
    };
  }, [breakups]);

  // Completed button is visible only when role can access AND mandatory fields filled
  const canShowCompletedButton =
    (isAdmin || isBackend) &&
    hasValidInstanceId &&
    (isOrderLoginStage || isProductionStage) &&
    mandatoryValidation.isValid;

  // ─────────────────────────────────────────────────────────
  // CORE SAVE
  // ─────────────────────────────────────────────────────────
  const saveItem = async (
    title: string,
    values: { item_desc: string; company_vendor_id: number | null },
    existingData: any,
    successMessage?: string,
  ) => {
    try {
      if (!existingData?.id) {
        await uploadMultiple([
          {
            id: null,
            item_type: title,
            item_desc: values.item_desc?.trim() || "N/A",
            company_vendor_id: values.company_vendor_id || null,
            instance_id: instanceId ?? null,
            created_by: userId,
            updated_by: userId,
          },
        ]);
      } else {
        await updateSingle({
          orderLoginId: existingData.id,
          payload: {
            lead_id: existingData.lead_id ?? leadId,
            item_type: title,
            item_desc: values.item_desc?.trim() || "N/A",
            company_vendor_id: values.company_vendor_id ?? null,
            updated_by: userId,
            instance_id: instanceId ?? null,
          },
        });
      }

      if (successMessage) toastManager.add({ title: successMessage, type: "success" });

      queryClient.invalidateQueries({ queryKey: ["orderLoginByLead"] });
      queryClient.invalidateQueries({
        queryKey: ["leadProductionReadiness"],
      });
    } catch (err: any) {
      console.error("Auto-save failed:", err);
      toastManager.add({ title: err?.response?.data?.message || "Failed to save changes", type: "error" });
    }
  };

  // ─────────────────────────────────────────────────────────
  // VENDOR CHANGE → instant auto-save + toast
  // ─────────────────────────────────────────────────────────
  const handleVendorChange = async (
    title: string,
    selectedVendorId: number,
    existingData: any,
  ) => {
    const updatedValues = {
      ...(breakups[title] || { item_desc: "", company_vendor_id: null }),
      company_vendor_id: selectedVendorId,
    };
    setBreakups((prev) => ({ ...prev, [title]: updatedValues }));
    await saveItem(
      title,
      updatedValues,
      existingData,
      `Vendor assigned for "${title}" successfully!`,
    );
  };

  // ─────────────────────────────────────────────────────────
  // DESCRIPTION CHANGE → debounced auto-save (1 second)
  // ─────────────────────────────────────────────────────────
  const handleDescriptionChange = (
    title: string,
    description: string,
    existingData: any,
  ) => {
    const updatedValues = {
      ...(breakups[title] || { item_desc: "", company_vendor_id: null }),
      item_desc: description,
    };
    setBreakups((prev) => ({ ...prev, [title]: updatedValues }));

    if (descTimers.current[title]) clearTimeout(descTimers.current[title]);
    descTimers.current[title] = setTimeout(async () => {
      await saveItem(title, updatedValues, existingData);
    }, 1000);
  };

  // ─────────────────────────────────────────────────────────
  // ORDER LOGIN COMPLETED — confirm then call API
  // ─────────────────────────────────────────────────────────
  const handleConfirmComplete = () => {
    setConfirmComplete(false);

    if (!hasValidInstanceId) {
      toastManager.add({
        title: "instance_id is required to mark order login as completed.",
        type: "error",
      });
      return;
    }

    markFilled({ updated_by: userId! });
  };

  // ─────────────────────────────────────────────────────────
  // TITLE UPDATE
  // ─────────────────────────────────────────────────────────
  const handleTitleUpdate = async (item: any, nextTitle: string) => {
    const trimmedTitle = nextTitle.trim();

    if (!trimmedTitle) { toastManager.add({ title: "Section name cannot be empty", type: "error" }); return false; }
    if (defaultTitles.includes(trimmedTitle)) { toastManager.add({ title: "Section name cannot match a default section", type: "error" }); return false; }
    if (trimmedTitle === item.item_type) return true;
    if (breakups[trimmedTitle]) { toastManager.add({ title: "Section name already exists", type: "error" }); return false; }
    if (!item?.id) { toastManager.add({ title: "Unable to update section name", type: "error" }); return false; }

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
        const current = next[item.item_type] || { item_desc: "", company_vendor_id: null };
        delete next[item.item_type];
        next[trimmedTitle] = current;
        return next;
      });

      toastManager.add({ title: "Section name updated successfully", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["orderLoginByLead"] });
      return true;
    } catch (err: any) {
      toastManager.add({ title: err?.response?.data?.message || "Failed to update section", type: "error" });
      return false;
    }
  };

  // ─────────────────────────────────────────────────────────
  // DELETE SECTION
  // ─────────────────────────────────────────────────────────
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

      toastManager.add({ title: "Section deleted successfully", type: "success" });
      setConfirmDelete(null);

      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId, instanceId ?? "all"],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadProductionReadiness", vendorId, leadId],
      });
    } catch (err: any) {
      toastManager.add({ title: err?.response?.data?.message || "Failed to delete section", type: "error" });
    }
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

        {/* ✅ Badge when already marked complete */}
        {isOrderLoginFilled ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 shrink-0">
            <BadgeCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Order Login Completed</span>
          </div>
        ) : (
          /* ✅ Button visible ONLY when all 3 mandatory sections are filled */
          canShowCompletedButton && (
            <Button
              onClick={() => setConfirmComplete(true)}
              disabled={isMarkingComplete}
              className="flex items-center gap-2 shrink-0 text-white disabled:opacity-60"
            >
              {isMarkingComplete ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Order Login Completed
                </>
              )}
            </Button>
          )
        )}
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
              onDescriptionChange={(description) =>
                handleDescriptionChange(title, description, existingData)
              }
              disabled={!perms.canEdit}
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
              onDescriptionChange={(description) =>
                handleDescriptionChange(item.item_type, description, item)
              }
              disabled={!perms.canEdit}
              isMandatory={false}
              isTitleEditable={canEditOrDeleteCustomSection && !!item.id}
              canDelete={canEditOrDeleteCustomSection && !!item.id}
              onTitleSave={(nextTitle) => handleTitleUpdate(item, nextTitle)}
              onDelete={() =>
                setConfirmDelete({ id: item.id, title: item.item_type })
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
        {canAccessButtons && canAddCustomSection && (
          <div
            className="rounded-xl border-2 border-dashed border-primary/30 p-5 bg-primary/5 
                       hover:bg-primary/10 transition-all cursor-pointer group 
                       flex flex-col items-center justify-center gap-3 min-h-47.5"
          >
            <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm text-primary">Add New Section</p>
              <p className="text-xs text-muted-foreground">
                Create a new breakup category for this order
              </p>
            </div>
            <AddSectionModal
              users={users}
              leadId={leadId}
              accountId={accountId}
              instanceId={instanceId}
              onSectionAdded={() => {
                queryClient.invalidateQueries({
                  queryKey: [
                    "orderLoginByLead",
                    vendorId,
                    leadId,
                    instanceId ?? "all",
                  ],
                });
              }}
            />
          </div>
        )}
      </div>

      {/* ✅ Order Login Complete — Confirmation Dialog */}
   <AlertDialog open={confirmComplete} onOpenChange={setConfirmComplete}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
   
        Complete Order Login
      </AlertDialogTitle>

      <AlertDialogDescription className="pt-2 text-sm leading-relaxed">
        This will mark the order login as completed and move the lead to the next stage.
        Please confirm to proceed.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel disabled={isMarkingComplete}>
        Cancel
      </AlertDialogCancel>

      <AlertDialogAction
        onClick={handleConfirmComplete}
        disabled={isMarkingComplete}
        
      >
        {isMarkingComplete ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
            Processing...
          </span>
        ) : (
          "Mark as Completed"
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

      {/* Delete Section — Confirmation Dialog */}
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
            <AlertDialogAction onClick={handleDeleteSection} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderLoginTab;

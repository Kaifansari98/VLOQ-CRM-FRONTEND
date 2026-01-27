"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useCompanyVendors,
  useOrderLoginByLead,
  useUpdateMultipleOrderLogins,
  useUpdateOrderLogin,
  useDeleteOrderLogin,
  useUploadMultipleFileBreakupsByLead,
} from "@/api/production/order-login";
import { useAppSelector } from "@/redux/store";
import FileBreakUpField from "./FileBreakUpField";
import AddSectionModal from "./AddSectionModal";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import ProductionFilesSection from "./ProductionFilesModal";
import ApprovedDocsSection from "./ApprovedDocsModal";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import { Check, Plus, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useClientRequiredCompletionDate } from "@/api/tech-check";
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
  canAccessAddNewSectionButton,
  canAccessInputField,
  canAccessSaveOrderLoginButton,
} from "@/components/utils/privileges";
import { useLeadStatus } from "@/hooks/designing-stage/designing-leads-hooks";
import { useSearchParams } from "next/navigation";

interface OrderLoginDetailsProps {
  leadId: number;
  accountId: number;
  name?: string;
  forceDefaultTab?: string;
}

const OrderLoginDetails: React.FC<OrderLoginDetailsProps> = ({
  leadId,
  accountId,
  forceDefaultTab,
}) => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type,
  );
  const { data: companyVendors } = useCompanyVendors(vendorId);
  const { data: orderLoginData } = useOrderLoginByLead(vendorId, leadId);
  const { data: leadData } = useLeadStatus(leadId, vendorId);

  const queryClient = useQueryClient();

  // 🧩 Local state for editable breakup fields
  const [breakups, setBreakups] = useState<
    Record<string, { item_desc: string; company_vendor_id: number | null }>
  >({});
  const [confirmDelete, setConfirmDelete] = useState<null | {
    id: number;
    title: string;
  }>(null);
  const [confirmSave, setConfirmSave] = useState(false);

  // 🧩 Handlers
  const handleFieldChange = (title: string, field: string, value: any) => {
    setBreakups((prev) => ({
      ...prev,
      [title]: {
        ...prev[title],
        [field]: value,
      },
    }));
  };

  // 🧩 Mutations
  const { mutateAsync: updateMultiple } = useUpdateMultipleOrderLogins(
    vendorId,
    leadId,
  );
  const { mutateAsync: updateSingle } = useUpdateOrderLogin(vendorId);
  const { mutateAsync: deleteOrderLogin, isPending: isDeleting } =
    useDeleteOrderLogin(vendorId);
  const { mutateAsync: uploadMultiple, isPending } =
    useUploadMultipleFileBreakupsByLead(vendorId, leadId, accountId);

  const { data } = useClientRequiredCompletionDate(vendorId, leadId);

  const leadStatus = leadData?.status;

  const canAccessButtons = canAccessAddNewSectionButton(userType, leadStatus);
  const canAccessInput = canAccessInputField(userType, leadStatus);

  console.log("Can Access Input: ", canAccessInput);

  const canAccessSaveButton = canAccessSaveOrderLoginButton(
    userType,
    leadStatus,
  );
  const normalizedStage = (leadStatus || "").toLowerCase().replace(/_/g, "-");
  const isOrderLoginStage = normalizedStage.includes("order-login");
  const isBackendUser =
    userType?.toLowerCase() === "backend" ||
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super-admin";
  const canManageCustomSections = isBackendUser && isOrderLoginStage;

  const users =
    companyVendors?.map((vendor: any) => ({
      id: vendor.id,
      label: vendor.company_name,
      in_house: Boolean(vendor.in_house),
    })) || [];

  // 🧩 Mandatory + Default Titles
  const mandatoryTitles = ["Carcass", "Shutter", "Stock Hardware"];
  const defaultTitles = [
    ...mandatoryTitles,
    "Special Hardware",
    "Profile Shutter",
    "Outsourced Shutter",
    "Glass Material",
  ];

  // 🧩 Default and Extra Cards
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

  // 🧩 Pre-fill from API data
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

  const handleSubmitAll = async () => {
    try {
      const entries = Object.entries(breakups).map(([title, val]) => {
        const existing = orderLoginData?.find(
          (item: any) => item.item_type === title,
        );
        const trimmedDesc = (val.item_desc || "").trim();
        const hasVendor = val.company_vendor_id !== null;

        return {
          title,
          val,
          existing,
          trimmedDesc,
          hasVendor,
        };
      });

      const formatted = entries
        .filter((entry) => entry.hasVendor)
        .map((entry) => ({
          id: entry.existing?.id || null,
          item_type: entry.title,
          item_desc: entry.trimmedDesc || "N/A",
          company_vendor_id: entry.val.company_vendor_id,
          created_by: userId,
          updated_by: userId,
        }));

      const deletions = entries
        .filter((entry) => entry.existing?.id && !entry.hasVendor)
        .map((entry) => entry.existing.id);

      const newRecords = formatted.filter((r) => !r.id);
      const updates = formatted.filter((r) => {
        const existing = orderLoginData?.find((i: any) => i.id === r.id);
        return (
          r.id &&
          (!existing ||
            existing.item_desc !== r.item_desc ||
            existing.company_vendor_id !== r.company_vendor_id)
        );
      });

      if (!userId) {
        toast.error("User not found. Please re-login.");
        return;
      }

      if (deletions.length > 0) {
        await Promise.all(
          deletions.map((orderLoginId) =>
            deleteOrderLogin({
              orderLoginId,
              deleted_by: userId,
            }),
          ),
        );
      }
      if (updates.length > 0) await updateMultiple(updates);
      if (newRecords.length > 0) await uploadMultiple(newRecords);

      toast.success("Order login records processed successfully ✅");

      queryClient.invalidateQueries({
        queryKey: ["orderLoginByLead", vendorId, leadId],
      });
      queryClient.invalidateQueries({
        queryKey: ["leadProductionReadiness", vendorId, leadId],
      });
    } catch (err: any) {
      console.error("❌ Error processing order login:", err);
      toast.error(err?.response?.data?.message || "Something went wrong");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, staggerChildren: 0.05 },
    },
  };

  const tabMapping: Record<string, string> = {
    orderLogin: "order-login",
    approvedDocs: "approved-docs",
    productionFiles: "production-files",
  };

  const activeTab =
    tabMapping[tabParam || ""] || forceDefaultTab
      ? "order-login"
      : "approved-docs";

  const getItemEditPermissions = (item: any) => {
    const role = userType?.toLowerCase();
    const stage = leadStatus?.toLowerCase();

    const isAdmin = role === "admin" || role === "super-admin";
    const isBackend = role === "backend";

    // Backend allowed ONLY in these stages
    const isAllowedBackendStage =
      stage === "production-stage" || stage === "order-login-stage";

    const hasVendorAssigned =
      !!item?.companyVendor && !!item?.companyVendor?.id;

    const hasDescription =
      typeof item?.item_desc === "string" && item.item_desc.trim().length > 0;

    // ✅ Admin override — full control
    if (isAdmin) {
      return {
        canEditVendor: true,
        canEditDescription: true,
      };
    }

    // ✅ Backend rules
    if (isBackend && isAllowedBackendStage) {
      return {
        // Backend can CREATE only (not modify existing)
        canEditVendor: !hasVendorAssigned,
        canEditDescription: !hasDescription,
      };
    }

    // ❌ Everything else blocked
    return {
      canEditVendor: false,
      canEditDescription: false,
    };
  };

  return (
    <div className="space-y-6  bg-[#fff] dark:bg-[#0a0a0a]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full space-y-4"
      >
        {/* -------- Client Required Completion Section -------- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="
      flex items-center gap-3 
      bg-muted/50 
      dark:bg-neutral-900/50
      border border-border 
      rounded-xl 
      px-4 py-3 
      backdrop-blur-sm
    "
        >
          {/* Animated green indicator */}
          <motion.div
            className="
        w-3 h-3 rounded-full 
        bg-green-500 
        shadow-[0_0_8px_rgba(34,197,94,0.6)]
      "
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.75, 1, 0.75],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: "easeInOut",
            }}
          />

          {/* Text + Date */}
          <div className="flex flex-col">
            <p className="text-xs font-medium text-muted-foreground tracking-wide">
              Client Required Delivery Date
            </p>

            <span className="text-sm font-semibold text-foreground">
              {data?.client_required_order_login_complition_date
                ? new Date(
                    data.client_required_order_login_complition_date,
                  ).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Not specified"}
            </span>
          </div>
        </motion.div>
      </motion.div>

      <SmoothTab
        defaultTabId={activeTab}
        className="-mt-3"
        items={[
          {
            id: "approved-docs",
            title: "Approved Documents",
            color: "bg-zinc-800 hover:bg-zinc-900",
            cardContent: <ApprovedDocsSection leadId={leadId} />,
          },
          {
            id: "production-files",
            title: "Production Files",
            color: "bg-zinc-800 hover:bg-zinc-900",
            cardContent: (
              <ProductionFilesSection leadId={leadId} accountId={accountId} />
            ),
          },
          {
            id: "order-login",
            title: "Order Login",
            color: "bg-zinc-800 hover:bg-zinc-900",
            cardContent: (
              <div className=" space-y-4 p-1 bg-[#fff] dark:bg-[#0a0a0a]">
                {/* ---------------- HEADER ---------------- */}
                <div className="flex flex-col md:flex-row space-y-2 items-start justify-between">
                  <div className="space-y-0">
                    <h2 className="text-xl font-semibold tracking-tight">
                      Order Login
                    </h2>

                    {/* ⭐ Description under title */}
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      Fill out item-level breakups and assign responsibilities
                      before order login is finalized.
                    </p>
                  </div>

                  {/* Right Button */}
                  {canAccessSaveButton && (
                    <Button
                      size="sm"
                      onClick={() => setConfirmSave(true)}
                      disabled={isPending}
                      variant="default"
                      className="cursor-pointer"
                    >
                      <Save />
                      {isPending ? "Processing..." : "Save Order Login"}
                    </Button>
                  )}
                </div>

                {/* ---------------- GRID OF BREAKUPS ---------------- */}
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
                        onChange={handleFieldChange}
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

                  {/* Extra Section From API */}
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
                        canEditDescription={perms.canEditDescription}
                        canEditVendor={perms.canEditVendor}
                        onChange={handleFieldChange}
                        isMandatory={false}
                        isTitleEditable={canManageCustomSections && !!item.id}
                        canDelete={canManageCustomSections && !!item.id}
                        onTitleSave={(nextTitle) =>
                          handleTitleUpdate(item, nextTitle)
                        }
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

                  {/* ---------------- ADD NEW SECTION CARD ---------------- */}
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
              </div>
            ),
          },
        ]}
      />
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

      <AlertDialog open={confirmSave} onOpenChange={setConfirmSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Order Login?</AlertDialogTitle>
            <AlertDialogDescription>
              This will apply all changes, including removing any items where
              the vendor was cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmSave(false);
                handleSubmitAll();
              }}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Confirm Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderLoginDetails;

"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EllipsisVertical,
  SquarePen,
  Users,
  XCircle,
  Clock,
  ClipboardCheck,
  HouseIcon,
  PanelsTopLeftIcon,
  BoxIcon,
  UsersRoundIcon,
  CircleArrowOutUpRight,
  UserIcon,
  MessageSquare,
  PencilLine,
  History,
  IndianRupee,
  FolderOpen,
  LockOpen,
  Lock,
  Zap,
  Store as StoreIcon,
} from "lucide-react";

import ChangeStoreModal from "@/components/sales-executive/Lead/change-store-modal";

import FastProductionDetailsModal from "@/components/sales-executive/Lead/fast-production-details-modal";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
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
import { useDeleteLead } from "@/hooks/useDeleteLead";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import BookingModal from "@/components/sales-executive/designing-stage/booking-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  useDesigningStageCounts,
  useDesignsDoc,
  useQuotationDoc,
} from "@/hooks/designing-stage/designing-leads-hooks";
import CustomeTooltip from "@/components/custom-tooltip";
import {
  canMoveToBookingStage,
  canReassignLeadButton,
  canDeleteLeadButton,
  canEditLeadForSalesExecutiveButton,
  canAccessDessingTodoTab,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";
import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import PaymentComingSoon from "@/components/generics/PaymentComingSoon";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";
import {
  useBlockLead,
  useUnblockLead,
  useRevokeFastProductionRequest,
  useLeadProductStructureInstances,
} from "@/hooks/useLeadsQueries";
import CancelFastProductionModal from "@/components/generics/CancelFastProductionModal";
import { useB2BRequirementTypes } from "@/hooks/useTypesMaster";
import { useFranchisesByVendorId } from "@/api/franchise";
import { fetchRequirementDocumentsApi, fetchRequirementDocumentTypesApi } from "@/api/leadRequirementDocuments";
import { fetchLeadRequirementMaterialsApi } from "@/api/leadRequirementMaterial";

import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatDisplayDate = (value?: string | Date | null) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getInvalidPhoneReason = (value?: string | null) => {
  const phone = String(value ?? "").trim();

  if (!/^\d{10}$/.test(phone)) {
    return "Client phone number must contain exactly 10 digits only.";
  }

  if (!/^[6-9]/.test(phone)) {
    return "Client phone number must start with 6, 7, 8, or 9.";
  }

  if (/^(\d)\1{9}$/.test(phone)) {
    return "Client phone number cannot contain the same digit repeated 10 times.";
  }

  if (phone === "1234567890" || phone === "9876543210") {
    return "Client phone number cannot be a sequential number pattern.";
  }

  if (/^(\d)\1{4}(\d)\2{4}$/.test(phone)) {
    return "Client phone number cannot follow a repeated block pattern.";
  }

  if (/^(\d)(\d)\1\2\1\2\1\2\1\2$/.test(phone)) {
    return "Client phone number cannot follow an alternating digit pattern.";
  }

  const digitCounts = new Map<string, number>();
  for (const digit of phone) {
    digitCounts.set(digit, (digitCounts.get(digit) ?? 0) + 1);
  }
  if ([...digitCounts.values()].some((count) => count > 6)) {
    return "Client phone number contains too many repeating digits.";
  }

  if (/(\d)\1{3,}$/.test(phone)) {
    return "Client phone number cannot end with a long repeated digit sequence.";
  }

  return null;
};

export default function DesigningStageLead() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateStatusMutation = useUpdateActivityStatus();
  const deleteLeadMutation = useDeleteLead();

  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId");
  const [openBlockConfirm, setOpenBlockConfirm] = useState(false);
  const [changeStoreOpen, setChangeStoreOpen] = useState(false);
  const [openCancelFastProduction, setOpenCancelFastProduction] = useState(false);
  const [fastProductionDetailsOpen, setFastProductionDetailsOpen] = useState(false);
  const revokeFastProductionMutation = useRevokeFastProductionRequest();

  const handleCancelFastProduction = (remark: string) => {
    if (!vendorId || !userId || !leadIdNum) {
      toastManager.add({
        title: "Missing vendor, user, or lead info",
        type: "error",
      });
      return;
    }
    revokeFastProductionMutation.mutate(
      {
        leadId: leadIdNum,
        vendorId,
        userId,
        remark,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Fast production status cancelled successfully!",
            type: "success",
          });
          setOpenCancelFastProduction(false);
          queryClient.invalidateQueries({
            queryKey: ["lead", leadIdNum, vendorId, userId],
          });
        },
        onError: (err: any) => {
          toastManager.add({
            title: err?.response?.data?.message || err?.message || "Failed to cancel fast production",
            type: "error",
          });
        },
      }
    );
  };

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data: countsData } = useDesigningStageCounts(vendorId, leadIdNum);
  const blockLeadMutation = useBlockLead();
  const unblockLeadMutation = useUnblockLead();



  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const isAuditor = userType?.trim().toLowerCase() === "auditor";
  const isSuperAdmin = userType?.trim().toLowerCase() === "super-admin";
  const eligibleBookingDaysValue = useAppSelector(
    (state) => state.auth.user?.vendor?.eligible_booking_days ?? null,
  );
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const isOnlineLeadFeatureEnabled = useAppSelector(
    (state) => state.auth.user?.vendor?.is_online_lead_feature_enabled === true,
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );

  const normalizedUserType = userType?.trim().toLowerCase();
  const isCaller = normalizedUserType === "telecaller" || normalizedUserType === "telecaller-team-lead" || normalizedUserType === "telecaller team lead" || normalizedUserType === "caller";

  const canUploadQuotation =
    !isCaller &&
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.quotation.upload")
      : true);

  const canUploadMeetings =
    !isCaller &&
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.meetings.upload")
      : true);

  const canUploadDesigns =
    !isCaller &&
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.designs.upload")
      : true);

  const canAccessTodoTab =
    !isCaller &&
    (userType?.toLowerCase() === "custom"
      ? (canUploadQuotation || canUploadMeetings || canUploadDesigns)
      : canAccessDessingTodoTab(userType));

  const { data: designDocsData } = useDesignsDoc(vendorId!, leadIdNum);
  const { data: quotationDocsData } = useQuotationDoc(vendorId, leadIdNum);
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadIdNum,
    vendorId,
    handlesLargeScaleProjects,
  );

  const canViewSiteHistory =
    isAuditor ||
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.site_history.enable_disable",
      )
      : canViewSiteHistoryTab(userType));
  const canPerformMoveToBooking =
    !isCaller &&
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.designing_stage.move_to_booking.action",
      )
      : canMoveToBookingStage(userType));
  const canMarkOnHold =
    !isCaller &&
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.designing_stage.details.mark_on_hold",
      )
      : true);
  const canMarkAsLost =
    !isCaller &&
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.designing_stage.details.mark_as_lost",
      )
      : true);
  const canSeeLeadStatusMenu = canMarkOnHold || canMarkAsLost;

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);
  const lead = data?.data?.lead;

  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(vendorId, !!vendorId);
  const isB2b = useMemo(() => {
    const leadFranchise = franchisesForB2b.find(
      (franchise: any) => franchise.id === lead?.franchise_id,
    );
    return leadFranchise?.moduled_for_b2b ?? false;
  }, [franchisesForB2b, lead?.franchise_id]);

  const { data: b2bReqTypesData } = useB2BRequirementTypes(vendorId);

  const { data: docTypesData } = useQuery({
    queryKey: ["lead-requirement-document-types", vendorId],
    queryFn: () => fetchRequirementDocumentTypesApi(vendorId!),
    enabled: !!vendorId && isB2b,
  });
  const docTypesList = useMemo(() => docTypesData?.data || [], [docTypesData]);

  const { data: documentsData } = useQuery({
    queryKey: ["lead-requirement-documents", leadIdNum, vendorId],
    queryFn: () => fetchRequirementDocumentsApi(leadIdNum, vendorId!),
    enabled: !!leadIdNum && !!vendorId && isB2b,
  });
  const b2bDocuments = useMemo(() => documentsData?.data || [], [documentsData]);

  const { data: reqMaterialsData } = useQuery({
    queryKey: ["lead-requirement-materials", leadIdNum, vendorId],
    queryFn: () => fetchLeadRequirementMaterialsApi(leadIdNum, vendorId!),
    enabled: !!leadIdNum && !!vendorId && isB2b,
  });
  const b2bMaterials = useMemo(() => reqMaterialsData?.data || [], [reqMaterialsData]);

  const b2bBookingValidation = useMemo(() => {
    if (!isB2b || !lead) {
      return {
        isReady: true,
        tooltip: "",
      };
    }

    const missingItems: string[] = [];

    // Check B2B requirement types (documents & materials)
    const b2bIds = (lead as any)?.leadB2BReqMappings
      ?.map((m: any) => m.b2b_requirement_type_id || m.b2bRequirementType?.id)
      ?.filter(Boolean) || [];
    const briefTypeIds = (lead as any)?.leadProcessBriefs
      ?.map((m: any) => m.b2b_requirement_type_id || m.b2bRequirementType?.id)
      ?.filter(Boolean) || [];
    const uniqueReqTypeIds = Array.from(new Set<number>([...b2bIds, ...briefTypeIds]));

    if (uniqueReqTypeIds.length === 0) {
      missingItems.push("No mapped requirement types");
    } else {
      const typesList = b2bReqTypesData?.data || [];

      for (const typeId of uniqueReqTypeIds) {
        const typeObj = typesList.find((t: any) => t.id === typeId);
        const name = typeObj?.type || `Type #${typeId}`;

        const reqDocs = b2bDocuments.filter(
          (doc: any) => (doc.b2b_requirement_type_id || doc.product_type_id) === typeId
        );
        const hasDoc = reqDocs.length > 0;

        const hasMaterial = b2bMaterials.some(
          (mat: any) => (mat.b2b_requirement_type_id || mat.product_type_id) === typeId
        );

        if (!hasDoc || !hasMaterial) {
          const parts = [];
          if (!hasDoc) {
            parts.push("Doc");
          }
          if (!hasMaterial) {
            parts.push("Material");
          }
          missingItems.push(`${name} (${parts.join(" & ")})`);
        }
      }
    }

    const hasQuotation = countsData && countsData.QuotationDoc > 0;
    const hasDesign = countsData && countsData.DesignsDoc > 0;
    const isQuotationOrDesignMissing = !hasQuotation || !hasDesign;

    if (isQuotationOrDesignMissing || missingItems.length > 0) {
      const tooltipParts = [];
      if (isQuotationOrDesignMissing) {
        tooltipParts.push("Requires at least 1 Quotation and 1 Design");
      }
      if (missingItems.length > 0) {
        tooltipParts.push(`Missing: ${missingItems.join(", ")}`);
      }

      return {
        isReady: false,
        tooltip: tooltipParts.join(". "),
      };
    }

    return {
      isReady: true,
      tooltip: "",
    };
  }, [isB2b, lead, b2bReqTypesData, b2bDocuments, b2bMaterials, countsData, docTypesList]);
  const designDocs = designDocsData?.data?.documents || [];
  const quotationDocs = quotationDocsData?.data?.documents || [];
  const structureInstances: any[] = Array.isArray(structureInstancesData?.data)
    ? structureInstancesData.data
    : [];
  const isChatNotification = useIsChatNotification();

  const eligibleBookingDays =
    eligibleBookingDaysValue == null
      ? null
      : Number(eligibleBookingDaysValue);
  const leadCreatedAt = lead?.created_at ? new Date(lead.created_at) : null;
  const invalidPhoneReason = getInvalidPhoneReason(lead?.contact_no);
  const hasEligibleBookingWindow =
    typeof eligibleBookingDays === "number" &&
    Number.isFinite(eligibleBookingDays) &&
    eligibleBookingDays > 0;
  const bookingEligibleOn =
    leadCreatedAt &&
      !Number.isNaN(leadCreatedAt.getTime()) &&
      hasEligibleBookingWindow
      ? addDays(startOfDay(leadCreatedAt), eligibleBookingDays + 1)
      : null;
  const isBookingLockedByEligibleDays =
    !isSuperAdmin &&
    !!bookingEligibleOn &&
    startOfDay(new Date()) < bookingEligibleOn;
  const bookingLockTooltip =
    isBookingLockedByEligibleDays && bookingEligibleOn
      ? `Booking is locked for ${eligibleBookingDays} full day${eligibleBookingDays === 1 ? "" : "s"} and will unlock on ${formatDisplayDate(bookingEligibleOn)}.`
      : "";
 






  const {
    isLeadBlocked,
    blockedTooltip,
    shouldDisableBlockedActions,
    isPending: isBlockActionPending,
    isLoading: isLeadBlockStatusLoading,
  } = useLeadAccessControl({
    leadId: leadIdNum,
    userType,
    lead,
  });



  const canReassign =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.designing_stage.details.reassign_lead",
      )
      : canReassignLeadButton(userType);
  const canDelete =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.details.delete")
      : canDeleteLeadButton(userType);
  const canEdit =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes("leads.designing_stage.details.edit")
      : canEditLeadForSalesExecutiveButton(userType);
  const canViewPayment =
    isAuditor ||
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.payment_information.enable_disable",
      )
      : canViewPaymentTab(userType));
  const canViewChats =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
        "leads.open_leads.details_of_lead.chat.enable_disable",
      )
      : true;
  const canViewDocuments =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.some((code) =>
        code.startsWith(
          "leads.open_leads.details_of_lead.documents_section.",
        ),
      )
      : true;

  const largeScaleBookingDocValidation = useMemo(() => {
    if (!handlesLargeScaleProjects) {
      return {
        isReady: true,
        tooltip: "",
      };
    }

    const productTypeGroups = new Map<
      number,
      { label: string; instanceIds: number[] }
    >();

    for (const instance of structureInstances) {
      const productTypeId =
        instance.productType?.id ??
        instance.productItemCode?.productStructure?.productType?.id;
      const productTypeLabel =
        instance.productType?.type ||
        instance.productItemCode?.productStructure?.productType?.type;

      if (!productTypeId || !productTypeLabel) continue;

      const existing = productTypeGroups.get(productTypeId);
      if (existing) {
        existing.instanceIds.push(instance.id);
        continue;
      }

      productTypeGroups.set(productTypeId, {
        label: productTypeLabel,
        instanceIds: [instance.id],
      });
    }

    const missingGroups: string[] = [];

    for (const [productTypeId, group] of productTypeGroups.entries()) {
      const hasDesign = designDocs.some((doc: any) => {
        const instanceId = doc.product_structure_instance_id;
        const docProductTypeId = doc.product_type_id;

        return (
          (instanceId != null && group.instanceIds.includes(Number(instanceId))) ||
          (docProductTypeId != null && Number(docProductTypeId) === productTypeId)
        );
      });

      const hasQuotation = quotationDocs.some((doc: any) => {
        const instanceId = doc.product_structure_instance_id;
        const docProductTypeId = doc.product_type_id;

        return (
          (instanceId != null && group.instanceIds.includes(Number(instanceId))) ||
          (docProductTypeId != null && Number(docProductTypeId) === productTypeId)
        );
      });

      if (!hasDesign || !hasQuotation) {
        const missingParts = [
          !hasDesign ? "design" : null,
          !hasQuotation ? "quotation" : null,
        ]
          .filter(Boolean)
          .join(" and ");

        missingGroups.push(`${group.label}: missing ${missingParts}`);
      }
    }

    if (missingGroups.length === 0) {
      return {
        isReady: true,
        tooltip: "",
      };
    }

    return {
      isReady: false,
      tooltip: `Upload at least one design and one quotation for each Item Group before moving to booking. ${missingGroups.join("; ")}`,
    };
  }, [
    designDocs,
    handlesLargeScaleProjects,
    quotationDocs,
    structureInstances,
  ]);

  const canMoveToBooking = isB2b
    ? b2bBookingValidation.isReady
    : handlesLargeScaleProjects
      ? largeScaleBookingDocValidation.isReady
      : countsData?.QuotationDoc > 0 && countsData?.DesignsDoc > 0;

  const canOpenBookingModal =
    canMoveToBooking &&
    canPerformMoveToBooking &&
    !isBookingLockedByEligibleDays &&
    !isLeadBlocked &&
    !invalidPhoneReason;

  useEffect(() => {
    if (isLoading || isLeadBlockStatusLoading || isChatNotification) return;

    // Auto-open only when booking is actually allowed for this user.
    if (
      !isCaller &&
      canOpenBookingModal &&
      normalizedUserType !== "admin" &&
      normalizedUserType !== "super-admin"
    ) {
      setBookingOpenLead(true);
    }
  }, [
    isLoading,
    isLeadBlockStatusLoading,
    isChatNotification,
    normalizedUserType,
    canOpenBookingModal,
  ]);

  const leadCode = lead?.lead_code ?? "";
  const clientName = `${lead?.firstname ?? ""} ${lead?.lastname ?? ""}`.trim();



  const moveToBookingTooltip = isLeadBlocked
    ? blockedTooltip
    : !canMoveToBooking
      ? isB2b
        ? b2bBookingValidation.tooltip
        : handlesLargeScaleProjects
          ? largeScaleBookingDocValidation.tooltip
          : "Requires at least 1 Quotation and 1 Design"
      : isBookingLockedByEligibleDays
        ? bookingLockTooltip
        : !canPerformMoveToBooking
          ? "You don't have permission to move this lead to booking stage"
          : "";

  const [openDelete, setOpenDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [bookingOpenLead, setBookingOpenLead] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<
    "onHold" | "lostApproval" | "lost"
  >("onHold");
  const shouldDirectlyMarkLost =
    userType?.toLowerCase() === "admin" ||
    userType?.toLowerCase() === "super-admin";

  // tabs state
  const [activeTab, setActiveTab] = useState(
    userType === "sales-executive" ? "todo" : "details",
  );
  useChatTabFromUrl(setActiveTab);
  useChatTabFromUrl(setActiveTab, "meetings");

  if (isLoading && !lead) {
    return <p className="p-6">Loading lead details...</p>;
  }

  if (!lead) {
    return <p className="p-6">Lead details not found or you do not have access.</p>;
  }

  const handleDeleteLead = () => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Vendor or User information is missing!",
        type: "error",
      });
      return;
    }

    deleteLeadMutation.mutate(
      { leadId: leadIdNum, vendorId, userId },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Lead deleted successfully!",
            type: "success",
          });
          setOpenDelete(false);

          // ✅ Invalidate related queries
          queryClient.invalidateQueries({
            queryKey: ["designingStageLeads", vendorId],
          });
          queryClient.invalidateQueries({
            queryKey: ["leadStats", vendorId, userId],
          });

          // ✅ Redirect back to table
          router.push("/dashboard/leads/designing-stage");
        },
        onError: (error: any) => {
          toastManager.add({
            title: error?.message || "Failed to delete lead!",
            type: "error",
          });
        },
      },
    );
  };



  const handleToggleLeadBlock = () => {
    if (!vendorId || !userId || !leadIdNum) {
      toastManager.add({
        title: "Vendor, user, or lead information is missing!",
        type: "error",
      });
      return;
    }

    const mutation = isLeadBlocked
      ? unblockLeadMutation
      : blockLeadMutation;

    mutation.mutate(
      {
        vendorId,
        leadId: leadIdNum,
        updatedBy: userId,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: isLeadBlocked
              ? "Lead unblocked successfully!"
              : "Lead blocked successfully!",
            type: "success",
          });

          setOpenBlockConfirm(false);

          queryClient.invalidateQueries({
            queryKey: ["leadBlockStatus", vendorId, leadIdNum],
          });

          queryClient.invalidateQueries({
            queryKey: ["lead", leadIdNum, vendorId, userId],
          });
        },
      },
    );
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {/* <BreadcrumbItem> */}
              {/* <BreadcrumbLink href="/dashboard">Leads</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard/leads/designing-stage">
                    Designing Stage
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator /> */}
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <p className="font-bold">
                    {leadCode || "Loading…"}
                    {leadCode && (clientName ? ` - ${clientName}` : "")}
                  </p>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center space-x-2">
          {!isAuditor && !isCaller && (
            <div>
              {/* Move to Booking */}
              {!canMoveToBooking ||
                isBookingLockedByEligibleDays ||
                isLeadBlocked ? (
                <div className="hidden md:block">
                  <CustomeTooltip
                    truncateValue={
                      <div className="flex items-center opacity-50 cursor-not-allowed px-2">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Move To Booking
                      </div>
                    }
                    value={isLeadBlocked ? blockedTooltip : moveToBookingTooltip}
                    contentClassName="max-w-80 text-left"
                  />
                </div>
              ) : (
                <CustomeTooltip
                  truncateValue={
                    <Button
                      size="sm"
                      className="hidden md:block"
                      onClick={() => setBookingOpenLead(true)}
                    >
                      Move To Booking
                    </Button>
                  }
                  value="Move lead to booking stage"
                  contentClassName="max-w-80 text-left"
                />
              )}
            </div>
          )}
          {!isAuditor && !isCaller && (
            <Button
              size="sm"
              className="hidden lg:block"
              onClick={() => setAssignOpen(true)}
            >
              Assign Task
            </Button>
          )}

          <LeadTasksPopover vendorId={vendorId ?? 0} leadId={leadIdNum} />
          {!isAuditor && <NotificationBell />}
          <AnimatedThemeToggler />

          {/* 🔹 Dropdown for actions */}
          {!isAuditor && !isCaller && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="relative bg-accent p-1.5 rounded-sm"
              >
                <EllipsisVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="flex md:hidden"
                onClick={() => setAssignOpen(true)}
              >
                <UserIcon className="h-4 w-4" />
                Assign Task
              </DropdownMenuItem>
              {/* Move to Booking */}
              <div className="md:hidden">
                {isLeadBlocked ? (
                  // Lead block handling added for DropdownMenu action
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <ClipboardCheck className="h-4 w-4" />
                        Move To Booking
                      </DropdownMenuItem>
                    }
                    contentClassName="max-w-80 text-center"
                  />
                ) : canOpenBookingModal ? (
                  <DropdownMenuItem onClick={() => setBookingOpenLead(true)}>
                    <ClipboardCheck className="h-4 w-4" />
                    Move To Booking
                  </DropdownMenuItem>
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <div className="flex items-center opacity-50 cursor-not-allowed px-2 py-1.5 text-sm">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Move To Booking
                      </div>
                    }
                    value={moveToBookingTooltip}
                    contentClassName="max-w-80 text-left"
                  />
                )}
              </div>

              {/* Lead Status submenu */}
              {canSeeLeadStatusMenu && (
                // Lead block handling added to prevent submenu opening
                shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <CircleArrowOutUpRight className="h-4 w-4" />
                        Lead Status
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <CircleArrowOutUpRight className="mr-2 h-4 w-4" />
                      Lead Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {canMarkOnHold && (
                        <DropdownMenuItem
                          onSelect={() => {
                            setActivityType("onHold");
                            setActivityModalOpen(true);
                          }}
                        >
                          <Clock className="h-4 w-4" />
                          Mark On Hold
                        </DropdownMenuItem>
                      )}
                      {canMarkAsLost && (
                        <DropdownMenuItem
                          onSelect={() => {
                            setActivityType("lost");
                            setActivityModalOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                          Mark As Lost
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )
              )}

              {isOnlineLeadFeatureEnabled && isSuperAdmin && (
                <DropdownMenuItem
                  onSelect={() => setChangeStoreOpen(true)}
                  disabled={isLoading || !lead || isLeadBlocked}
                >
                  <StoreIcon className="h-4 w-4 mr-2" />
                  Store Transfer
                </DropdownMenuItem>
              )}




              {userType?.toLowerCase() === "super-admin" && (
                <DropdownMenuItem
                  onSelect={() => setOpenBlockConfirm(true)}
                  disabled={isBlockActionPending}
                >
                  {isLeadBlocked ? (
                    <LockOpen className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}

                  {isLeadBlocked
                    ? "Unblock Lead"
                    : "Block Lead"}
                </DropdownMenuItem>
              )}

              {isSuperAdmin && lead?.is_fast_production === true && (
                <DropdownMenuItem
                  onSelect={() => setOpenCancelFastProduction(true)}
                  disabled={revokeFastProductionMutation.isPending || isLeadBlocked}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Fast Production
                </DropdownMenuItem>
              )}

              {(lead?.is_fast_production === true || lead?.has_pending_fast_production_request === true) && (
                <DropdownMenuItem
                  onSelect={() => setFastProductionDetailsOpen(true)}
                >
                  <Zap className="h-4 w-4 mr-2 text-orange-500 fill-orange-500" />
                  Fast Production Details
                </DropdownMenuItem>
              )}
              {canReassign && (
                // Lead block handling added for DropdownMenu action
                shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <Users className="h-4 w-4" />
                        Reassign Lead
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuItem onSelect={() => setAssignOpenLead(true)}>
                    <Users className="h-4 w-4" />
                    Reassign Lead
                  </DropdownMenuItem>
                )
              )}

              {/* Edit Lead */}

              {canEdit && (
                // Lead block handling added for DropdownMenu action
                shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <SquarePen className="h-4 w-4" />
                        Edit Lead
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuItem onSelect={() => setOpenEditModal(true)}>
                    <SquarePen className="h-4 w-4" />
                    Edit Lead
                  </DropdownMenuItem>
                )
              )}

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  {/* Lead block handling added for DropdownMenu action */}
                  {shouldDisableBlockedActions ? (
                    <CustomeTooltip
                      value={blockedTooltip}
                      truncateValue={
                        <DropdownMenuItem disabled>
                          <XCircle className="h-4 w-4 text-red-500" />
                          Delete Lead
                        </DropdownMenuItem>
                      }
                    />
                  ) : (
                    <DropdownMenuItem onSelect={() => setOpenDelete(true)}>
                      <XCircle className="h-4 w-4 text-red-500" />
                      Delete Lead
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </header>

      {/* 🔹 Tabs bar above content */}

      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === "projects") {
            if (canMoveToBooking) {
              // ✅ If booking possible → open BookingModal directly
              if (canOpenBookingModal) {
                setBookingOpenLead(true);
              } else {
                setActiveTab("details");
              }
            } else {
              // ✅ Otherwise behave like Lead Details tab
              setActiveTab("details");
            }
          } else {
            setActiveTab(val);
          }
        }}
        className="w-full p-3 md:p-6"
      >
        <ScrollArea>
          <div className="w-full h-full flex justify-between items-center">
            <div>
              <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
                <TabsTrigger value="details">
                  <HouseIcon size={16} className="mr-1 opacity-60" />
                  Lead Details
                </TabsTrigger>

                {!isAuditor && canAccessTodoTab ? (
                  isLeadBlocked ? (
                    <CustomeTooltip
                      truncateValue={
                        <TabsTrigger value="todo" disabled>
                          <PencilLine size={16} className="mr-1 opacity-60" />
                          To-Do Task
                        </TabsTrigger>
                      }
                      value={blockedTooltip}
                    />
                  ) : (
                    <TabsTrigger value="todo">
                      <PencilLine size={16} className="mr-1 opacity-60" />
                      To-Do Task
                    </TabsTrigger>
                  )
                ) : (
                  !isAuditor && (
                    <CustomeTooltip
                      truncateValue={
                        <TabsTrigger value="todo" disabled>
                          <PencilLine size={16} className="mr-1 opacity-60" />
                          To-Do Task
                        </TabsTrigger>
                      }
                      value={
                        lead?.is_draft
                          ? "This action cannot be performed because the lead is still in Draft mode."
                          : "You do not have permission to access the To-Do Task tab."
                      }
                    />
                  )
                )}
                {canViewSiteHistory && (
                  <TabsTrigger value="history">
                    <History size={16} className="mr-1 opacity-60" />
                    History
                  </TabsTrigger>
                )}
                {canViewPayment && (
                  <TabsTrigger value="team">
                    <IndianRupee size={16} className="mr-1 opacity-60" />
                    Payment
                  </TabsTrigger>
                )}
                {canViewChats && (
                  <TabsTrigger value="chats">
                    <MessageSquare size={16} className="mr-1 opacity-60" />
                    Chats
                  </TabsTrigger>
                )}
                {canViewDocuments && (
                  <TabsTrigger value="documents">
                    <FolderOpen size={16} className="mr-1 opacity-60" />
                    Documents
                  </TabsTrigger>
                )}
              </TabsList>

              <ScrollBar orientation="horizontal" />
            </div>
          </div>
        </ScrollArea>

        {/* 🔹 Tab Contents */}
        <TabsContent value="details">
          <main className="flex-1 h-fit  ">
            <LeadDetailsUtil
              status="designing"
              leadId={leadIdNum}
              defaultTab="designing"
            />
          </main>
        </TabsContent>

        <TabsContent value="todo">
          <main className="flex-1 h-fit ">
            <LeadDetailsUtil
              status="designing"
              leadId={leadIdNum}
              defaultTab="designing"
            />
          </main>
        </TabsContent>

        {canViewSiteHistory && (
          <TabsContent value="history">
            <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
          </TabsContent>
        )}

        {canViewPayment && (
          <TabsContent value="team">
            <PaymentComingSoon />
          </TabsContent>
        )}

        {canViewChats && (
          <TabsContent value="chats">
            <LeadWiseChatScreen leadId={leadIdNum} />
          </TabsContent>
        )}
        {canViewDocuments && (
          <TabsContent value="documents">
            <ProjectDocumentsTimeline
              leadId={leadIdNum}
              vendorId={vendorId ?? 0}
              upToStage="ism"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* ✅ Modals */}
      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp={true}
        isFastProductionEnabled={true}
        data={{ id: leadIdNum, name: "" }}
      />

      <EditLeadModal
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        leadData={{ id: leadIdNum }}
      />

      <AssignLeadModal
        open={assignOpenLead}
        onOpenChange={setAssignOpenLead}
        leadData={{ id: leadIdNum, assignTo: lead?.assignedTo }}
      />

      <BookingModal
        open={bookingOpenLead}
        onOpenChange={setBookingOpenLead}
        data={{ id: leadIdNum, accountId: Number(accountId) }}
      />

      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType={activityType}
        vendorId={vendorId}
        franchiseId={lead?.franchise_id ?? null}
        leadId={leadIdNum}
        onSubmitRemark={(remark, dueDate, selection) => {
          if (!vendorId || !userId) {
            toastManager.add({
              title: "Vendor or User info is missing!",
              type: "error",
            });
            return;
          }
          updateStatusMutation.mutate(
            {
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId: Number(accountId),
                userId,
                status: activityType === "onHold" ? "onHold" : "lost",
                remark,
                createdBy: userId,
                ...(dueDate ? { dueDate } : {}),
                ...(selection ?? {}),
              },
            },
            {
              onSuccess: (res: any) => {
                const finalStatus = res?.data?.activity_status ?? res?.data?.lead?.activity_status;
                toastManager.add({
                  title:
                    activityType === "onHold"
                      ? "Lead marked as On Hold!"
                      : finalStatus === "lostApproval"
                        ? "Lead sent for Lost Approval!"
                        : "Lead marked as Lost!",
                  type: "success",
                });
                if (activityType === "onHold") {
                  window.location.assign("/dashboard/leads/leadstable?tab=onHold");
                  return;
                }
                setActivityModalOpen(false);
              },
            },
          );
        }}
        loading={updateStatusMutation.isPending}
      />

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lead from your system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>




      <AlertDialog
        open={openBlockConfirm}
        onOpenChange={setOpenBlockConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLeadBlocked
                ? "Unblock Lead?"
                : "Block Lead?"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {isLeadBlocked
                ? "This will unblock the lead and allow it to proceed normally."
                : "This will block the lead and mark the block time in the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isBlockActionPending}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleToggleLeadBlock}
              disabled={isBlockActionPending}
            >
              {isBlockActionPending
                ? isLeadBlocked
                  ? "Unblocking..."
                  : "Blocking..."
                : isLeadBlocked
                  ? "Unblock"
                  : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CancelFastProductionModal
        open={openCancelFastProduction}
        onOpenChange={setOpenCancelFastProduction}
        onSubmit={handleCancelFastProduction}
        loading={revokeFastProductionMutation.isPending}
      />

      <FastProductionDetailsModal
        open={fastProductionDetailsOpen}
        onOpenChange={setFastProductionDetailsOpen}
        leadId={leadIdNum}
      />

      <ChangeStoreModal
        open={changeStoreOpen}
        onOpenChange={setChangeStoreOpen}
        leadId={leadIdNum}
        currentStoreId={lead?.franchise_id}
      />
    </>
  );
}

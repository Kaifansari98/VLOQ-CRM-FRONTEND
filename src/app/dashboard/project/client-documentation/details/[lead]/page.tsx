"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import {
  useBlockLead,
  useLeadById,
  useUnblockLead,
  useRevokeFastProductionRequest,
  useLeadProductStructureInstances,
} from "@/hooks/useLeadsQueries";
import {
  useLeadSpecifications,
  useSelectionData,
} from "@/hooks/designing-stage/designing-leads-hooks";
import {
  useClientDocumentationDetails,
  useMoveLeadToClientApproval,
  useClientDocMoveEligibility,
} from "@/hooks/client-documentation/use-clientdocumentation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CancelFastProductionModal from "@/components/generics/CancelFastProductionModal";
import LeadDetailsUtil from "@/components/utils/lead-details-tabs";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  EllipsisVertical,
  SquarePen,
  Users,
  XCircle,
  HouseIcon,
  FileText,
  Clock,
  UserPlus,
  MessageSquare,
  PencilLine,
  History,
  IndianRupee,
  FolderOpen,
  LockOpen,
  Lock,
  Zap,
  CheckCircle2,
} from "lucide-react";

import FastProductionDetailsModal from "@/components/sales-executive/Lead/fast-production-details-modal";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";

import AssignLeadModal from "@/components/sales-executive/Lead/assign-lead-moda";
import { EditLeadModal } from "@/components/sales-executive/Lead/lead-edit-form-modal";
import { useDeleteLead } from "@/hooks/useDeleteLead";
import { toastManager } from "@/components/ui/toast";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import ClientDocumentationModal from "@/components/site-supervisor/final-measurement/client-documantation-modal";
import PaymentInformation from "@/components/tabScreens/PaymentInformationScreen";

import { useLeadAccessControl } from "@/hooks/useLeadAccessControl";

import {
  canUploadClientDocumentation,
  canEditLeadButton,
  canDeleteLeadButton,
  canReassignLeadButton,
  canViewPaymentTab,
  canViewSiteHistoryTab,
} from "@/components/utils/privileges";

import SiteHistoryTab from "@/components/tabScreens/SiteHistoryTab";
import CustomeTooltip from "@/components/custom-tooltip";
import AssignTaskSiteMeasurementForm from "@/components/sales-executive/Lead/assign-task-site-measurement-form";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import LeadWiseChatScreen from "@/components/tabScreens/LeadWiseChatScreen";
import {
  useChatTabFromUrl,
  useIsChatNotification,
} from "@/hooks/useChatTabFromUrl";

import ActivityStatusModal from "@/components/generics/ActivityStatusModal";
import { useUpdateActivityStatus } from "@/hooks/useActivityStatus";
import { useQueryClient } from "@tanstack/react-query";
import LeadTasksPopover from "@/components/tasks/LeadTasksPopover";
import ProjectDocumentsTimeline from "@/components/installation/final-handover/ProjectDocumentsTimeline";

export default function ClientDocumentationLeadDetails() {
  const { lead: leadId } = useParams();
  const leadIdNum = Number(leadId);

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const userType = useAppSelector(
    (state) => state.auth.user?.user_type.user_type,
  );
  const isAuditor = userType?.trim().toLowerCase() === "auditor";
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const handlesLargeScaleProjectsFromAuth = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );

  // UI STATES
  const [assignOpenLead, setAssignOpenLead] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openClientDocModal, setOpenClientDocModal] = useState(false);

  const [openBlockConfirm, setOpenBlockConfirm] = useState(false);
  const [openCancelFastProduction, setOpenCancelFastProduction] =
    useState(false);
  const [fastProductionDetailsOpen, setFastProductionDetailsOpen] =
    useState(false);
  const [openMoveConfirmModal, setOpenMoveConfirmModal] = useState(false);
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
            title:
              err?.response?.data?.message ||
              err?.message ||
              "Failed to cancel fast production",
            type: "error",
          });
        },
      },
    );
  };

  const blockLeadMutation = useBlockLead();
  const unblockLeadMutation = useUnblockLead();

  const [activeTab, setActiveTab] = useState("details");
  useChatTabFromUrl(setActiveTab);
  const isChatNotification = useIsChatNotification();
  const [previousTab, setPreviousTab] = useState("details");

  // ACTIVITY STATUS — Only On Hold
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const updateStatusMutation = useUpdateActivityStatus();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutate: moveToClientApproval, isPending: isMovingStage } =
    useMoveLeadToClientApproval();

  const { data, isLoading } = useLeadById(leadIdNum, vendorId, userId);

  const lead = data?.data?.lead;
  const accountId = Number(lead?.account_id);
  const handlesLargeScaleProjects =
    handlesLargeScaleProjectsFromAuth ||
    (lead as any)?.createdBy?.vendor?.handlesLargeScaleProjects === true ||
    (lead as any)?.assignedTo?.vendor?.handlesLargeScaleProjects === true;

  const isFastProduction = lead?.is_fast_production === true;
  const { data: docsDetails } = useClientDocumentationDetails(
    vendorId!,
    leadIdNum,
    userId,
  );
  const { data: structureInstancesData } = useLeadProductStructureInstances(
    leadIdNum,
    vendorId,
  );
  const { data: specifications = [] } = useLeadSpecifications(
    vendorId,
    leadIdNum,
  );
  const { data: selectionsData } = useSelectionData(vendorId!, leadIdNum);

  const structureInstances = React.useMemo(
    () =>
      Array.isArray(structureInstancesData?.data)
        ? structureInstancesData.data
        : [],
    [structureInstancesData?.data],
  );

  const displayGroups = React.useMemo(() => {
    if (!handlesLargeScaleProjects) {
      return structureInstances.map((instance: any) => ({
        key: `instance-${instance.id}`,
        title: instance.title,
        subtitle: instance.productStructure?.type || "Product Structure",
        instance,
      }));
    }

    const grouped = new Map<
      string,
      {
        key: string;
        title: string;
        subtitle: string;
        instance: any;
      }
    >();

    structureInstances.forEach((instance: any) => {
      const title =
        instance.productType?.type ||
        instance.productItemCode?.productStructure?.productType?.type ||
        instance.productItemCode?.item_code ||
        instance.title ||
        "Item Group";
      const subtitle =
        instance.productItemCode?.item_code ||
        instance.productStructure?.type ||
        "Product Type";
      const key = String(
        instance.productType?.id ||
          instance.productItemCode?.productStructure?.productType?.id ||
          title,
      );

      if (!grouped.has(key)) {
        grouped.set(key, { key, title, subtitle, instance });
      }
    });

    return Array.from(grouped.values());
  }, [handlesLargeScaleProjects, structureInstances]);

  const itemCodeGroupMap = React.useMemo(
    () =>
      new Map<number, string>(
        structureInstances
          .filter((instance: any) => instance.productItemCode)
          .map((instance: any) => [
            instance.productItemCode!.id,
            instance.productType?.type ||
              instance.productItemCode?.productStructure?.productType?.type ||
              "Other Specifications",
          ]),
      ),
    [structureInstances],
  );

  const latestSpecificationByGroup = React.useMemo(() => {
    const groups = new Map<string, any>();
    for (const spec of specifications) {
      const title =
        (spec.item_code_id ? itemCodeGroupMap.get(spec.item_code_id) : null) ||
        "Other Specifications";
      const key = title.trim().toLowerCase();
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, spec);
        continue;
      }

      const existingTime = new Date(existing.created_at).getTime();
      const currentTime = new Date(spec.created_at).getTime();

      if (
        currentTime > existingTime ||
        (currentTime === existingTime && spec.id > existing.id)
      ) {
        groups.set(key, spec);
      }
    }

    return groups;
  }, [itemCodeGroupMap, specifications]);

  const largeScaleSpecificationStatus = React.useMemo(() => {
    if (!handlesLargeScaleProjects) {
      return {
        allReviewed: true,
        missingGroups: [] as string[],
      };
    }

    const missingGroups = displayGroups
      .filter((group: any) => {
        const latestSpec = latestSpecificationByGroup.get(
          group.title.trim().toLowerCase(),
        );
        return latestSpec && !latestSpec.is_completed;
      })
      .map((group: any) => group.title);

    return {
      allReviewed: missingGroups.length === 0,
      missingGroups,
    };
  }, [displayGroups, handlesLargeScaleProjects, latestSpecificationByGroup]);

  const selectionsByInstance = React.useMemo(() => {
    const map = new Map<
      number | null,
      { Carcas?: boolean; Shutter?: boolean; Handles?: boolean }
    >();

    const rawSelections = Array.isArray(selectionsData?.data)
      ? selectionsData.data
      : Array.isArray((selectionsData as any)?.selections)
        ? (selectionsData as any).selections
        : [];

    rawSelections.forEach((item: any) => {
      const instId = item.product_structure_instance_id ?? null;
      const type = item.selection_type as "Carcas" | "Shutter" | "Handles";
      if (!map.has(instId)) {
        map.set(instId, {});
      }
      const current = map.get(instId)!;
      if (type) current[type] = true;
    });

    return map;
  }, [selectionsData]);

  const checkTrackerReady = (
    tracker:
      | { Carcas?: boolean; Shutter?: boolean; Handles?: boolean }
      | undefined,
  ) => {
    if (!tracker) return false;
    if (isFastProduction) {
      return Boolean(tracker.Carcas);
    }
    return Boolean(tracker.Carcas && tracker.Shutter);
  };

  const allInstancesSelectionsReady =
    structureInstances.length > 1
      ? structureInstances.every((instance: any) => {
          const tracker = selectionsByInstance.get(instance.id);
          return checkTrackerReady(tracker);
        })
      : (() => {
          const nullBucket = selectionsByInstance.get(null);
          const firstInstanceBucket = structureInstances[0]
            ? selectionsByInstance.get(structureInstances[0].id)
            : undefined;
          return Boolean(
            checkTrackerReady(firstInstanceBucket) ||
            checkTrackerReady(nullBucket),
          );
        })();

  const getCounts = (instanceId: number | null) => {
    const grouped = docsDetails?.documents_by_instance || [];
    const group = grouped.find(
      (g) => Number(g.instance_id) === Number(instanceId),
    );
    if (group) {
      return {
        ppt: group.documents?.ppt?.length || 0,
        pytha: group.documents?.pytha?.length || 0,
      };
    }
    const ppt = (docsDetails?.documents?.ppt || []).filter(
      (d: any) =>
        Number(d.product_structure_instance_id) === Number(instanceId),
    ).length;
    const pytha = (docsDetails?.documents?.pytha || []).filter(
      (d: any) =>
        Number(d.product_structure_instance_id) === Number(instanceId),
    ).length;
    return { ppt, pytha };
  };

  const allInstancesDocsReady = React.useMemo(() => {
    if (handlesLargeScaleProjects && displayGroups.length > 0) {
      return displayGroups.every((group: any) => {
        const groupInstances = structureInstances.filter((instance: any) => {
          const title =
            instance.productType?.type ||
            instance.productItemCode?.productStructure?.productType?.type ||
            instance.productItemCode?.item_code ||
            instance.title ||
            "Item Group";
          const key = String(
            instance.productType?.id ||
              instance.productItemCode?.productStructure?.productType?.id ||
              title,
          );
          return key === group.key;
        });

        let ppt = 0;
        let pytha = 0;
        groupInstances.forEach((inst: any) => {
          const counts = getCounts(inst.id);
          ppt += counts.ppt;
          pytha += counts.pytha;
        });

        return ppt > 0 && pytha > 0;
      });
    }

    return structureInstances.length > 0
      ? structureInstances.every((instance: any) => {
          const counts = getCounts(instance.id);
          return counts.ppt > 0 && counts.pytha > 0;
        })
      : (() => {
          const flatPpt = docsDetails?.documents?.ppt?.length || 0;
          const flatPytha = docsDetails?.documents?.pytha?.length || 0;
          return flatPpt > 0 && flatPytha > 0;
        })();
  }, [
    handlesLargeScaleProjects,
    displayGroups,
    structureInstances,
    docsDetails,
  ]);

  const leadCode = lead?.lead_code || "";
  const clientName = `${lead?.firstname || ""} ${lead?.lastname || ""}`.trim();

  const {
    isLeadBlocked,
    blockedTooltip,
    shouldDisableBlockedActions,
    isLoading: isLeadBlockStatusLoading,
  } = useLeadAccessControl({
    leadId: leadIdNum,
    userType,
    lead,
  });

  const isBlockActionPending =
    blockLeadMutation.isPending || unblockLeadMutation.isPending;

  // Auto-open documentation modal
  useEffect(() => {
    if (isLoading || isLeadBlockStatusLoading || !lead) return;
    if (handlesLargeScaleProjects) {
      setActiveTab("details");
      return;
    }
    if (
      userType === "sales-executive" &&
      !isChatNotification &&
      !isLeadBlocked &&
      !lead.is_draft
    ) {
      setPreviousTab("details");
      setOpenClientDocModal(true);
      setActiveTab("todo");
    }
  }, [
    isLoading,
    isLeadBlockStatusLoading,
    lead,
    isChatNotification,
    userType,
    isLeadBlocked,
    handlesLargeScaleProjects,
  ]);

  // DELETE LEAD
  const deleteLeadMutation = useDeleteLead();
  const handleDeleteLead = () => {
    if (!vendorId || !userId) {
      toastManager.add({
        title: "Missing vendor or user info!",
        type: "error",
      });
      return;
    }
    deleteLeadMutation.mutate(
      { leadId: leadIdNum, vendorId, userId },
      {
        onSuccess: () =>
          toastManager.add({
            title: "Lead deleted successfully!",
            type: "success",
          }),
        onError: (err) =>
          toastManager.add({
            title: err?.message || "Failed to delete lead",
            type: "error",
          }),
      },
    );
    setOpenDelete(false);
  };

  const { data: moveEligibilityData } = useClientDocMoveEligibility(
    vendorId,
    leadIdNum,
  );

  const missingRequirements = React.useMemo(() => {
    if (moveEligibilityData?.missing_requirements) {
      return moveEligibilityData.missing_requirements;
    }
    const missing: string[] = [];
    if (shouldDisableBlockedActions) {
      missing.push(blockedTooltip || "Lead is blocked");
    }
    if (handlesLargeScaleProjects) {
      if (largeScaleSpecificationStatus.missingGroups.length > 0) {
        const prefix =
          largeScaleSpecificationStatus.missingGroups.length === 1
            ? "Complete specification review for"
            : "Complete specification review for all item groups:";
        const suffix =
          largeScaleSpecificationStatus.missingGroups.length === 1
            ? `${largeScaleSpecificationStatus.missingGroups[0]}. Approve, amend, or delete every row and mark the specification as completed.`
            : `${largeScaleSpecificationStatus.missingGroups.join(", ")}. Approve, amend, or delete every row and mark each latest specification as completed.`;
        missing.push(`${prefix} ${suffix}`);
      }
    }
    if (!handlesLargeScaleProjects && !allInstancesSelectionsReady) {
      if (isFastProduction) {
        missing.push("Save Carcas for all instances");
      } else {
        missing.push("Save Carcas & Shutter for all instances");
      }
    }
    if (!allInstancesDocsReady) {
      if (handlesLargeScaleProjects && displayGroups.length > 0) {
        const missingGroups = displayGroups
          .filter((group: any) => {
            const groupInstances = structureInstances.filter(
              (instance: any) => {
                const title =
                  instance.productType?.type ||
                  instance.productItemCode?.productStructure?.productType
                    ?.type ||
                  instance.productItemCode?.item_code ||
                  instance.title ||
                  "Item Group";
                const key = String(
                  instance.productType?.id ||
                    instance.productItemCode?.productStructure?.productType
                      ?.id ||
                    title,
                );
                return key === group.key;
              },
            );

            let ppt = 0;
            let pytha = 0;
            groupInstances.forEach((inst: any) => {
              const counts = getCounts(inst.id);
              ppt += counts.ppt;
              pytha += counts.pytha;
            });

            return ppt === 0 || pytha === 0;
          })
          .map((group: any) => group.title);

        if (missingGroups.length > 0) {
          missing.push(
            `Please upload required files for item group(s): ${missingGroups.join(", ")}`,
          );
        } else {
          missing.push("Please upload required files for all item groups");
        }
      } else {
        const missingDocInstances = structureInstances
          .filter((instance: any) => {
            const counts = getCounts(instance.id);
            return counts.ppt === 0 || counts.pytha === 0;
          })
          .map((instance: any) => instance.title || "Item Group");

        if (missingDocInstances.length > 0) {
          missing.push(
            `Upload Project Files & Pytha Files for: ${missingDocInstances.join(", ")}`,
          );
        } else {
          missing.push("Upload Project Files & Pytha Files for all instances");
        }
      }
    }
    return missing;
  }, [
    moveEligibilityData,
    shouldDisableBlockedActions,
    blockedTooltip,
    handlesLargeScaleProjects,
    largeScaleSpecificationStatus,
    allInstancesSelectionsReady,
    isFastProduction,
    allInstancesDocsReady,
    displayGroups,
    structureInstances,
  ]);

  const canMoveStage = moveEligibilityData
    ? moveEligibilityData.can_move
    : missingRequirements.length === 0;

  if (isLoading && !lead) {
    return <p className="p-6">Loading client documentation details…</p>;
  }

  if (!lead) {
    return (
      <p className="p-6">Lead details not found or you do not have access.</p>
    );
  }

  const canReassign = canReassignLeadButton(userType);
  const canDelete = canDeleteLeadButton(userType);
  const canEdit = canEditLeadButton(userType);
  const canViewPayment =
    isAuditor ||
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.payment_information.enable_disable",
        )
      : canViewPaymentTab(userType));
  const canViewSiteHistory =
    isAuditor ||
    (userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "leads.open_leads.details_of_lead.site_history.enable_disable",
        )
      : canViewSiteHistoryTab(userType));
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
  const canAccessClientDocumentation =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.some((code) =>
          code.startsWith("project.client_documentation."),
        )
      : canUploadClientDocumentation(userType);

  const canMoveToClientApproval =
    userType?.toLowerCase() === "custom"
      ? customPrivilegeCodes.includes(
          "project.client_documentation.move_to_client_approval.action",
        )
      : true;

  const handleOpenMoveConfirm = () => {
    if (!canMoveStage) {
      toastManager.add({
        title:
          missingRequirements[0] || "Requirements incomplete for moving stage",
        type: "error",
      });
      return;
    }
    setOpenMoveConfirmModal(true);
  };

  const handleMoveToClientApproval = () => {
    if (!vendorId || !userId || !leadIdNum) return;
    if (!canMoveStage) {
      toastManager.add({
        title:
          missingRequirements[0] || "Requirements incomplete for moving stage",
        type: "error",
      });
      return;
    }
    moveToClientApproval(
      { leadId: leadIdNum, vendorId, updatedBy: userId },
      {
        onSuccess: () => {
          setOpenMoveConfirmModal(false);
          router.push("/dashboard/project/client-approval");
          queryClient.invalidateQueries({ queryKey: ["leadStats"] });
          queryClient.invalidateQueries({
            queryKey: ["universal-stage-leads"],
          });
        },
        onError: () => {
          setOpenMoveConfirmModal(false);
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

    const mutation = isLeadBlocked ? unblockLeadMutation : blockLeadMutation;

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
        },
      },
    );
  };
  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between px-4 border-b backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <p className="font-bold">
                    {leadCode}
                    {clientName ? ` - ${clientName}` : ""}
                  </p>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center space-x-2">
          {!isAuditor &&
            handlesLargeScaleProjects &&
            canMoveToClientApproval && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button
                        size="sm"
                        disabled={!canMoveStage || isMovingStage}
                        onClick={handleOpenMoveConfirm}
                        className="hidden md:flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isMovingStage
                          ? "Moving..."
                          : "Move to Client Approval"}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {missingRequirements.length > 0 && (
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium mb-1">
                        Complete the following:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {missingRequirements.map((item) => (
                          <li key={item} className="text-xs">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}

          {!isAuditor && (
            <Button
              size="sm"
              className="hidden md:block"
              onClick={() => setAssignOpen(true)}
            >
              Assign Task
            </Button>
          )}

          <LeadTasksPopover vendorId={vendorId ?? 0} leadId={leadIdNum} />
          {!isAuditor && <NotificationBell />}
          <AnimatedThemeToggler />

          {/* DROPDOWN */}
          {!isAuditor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="relative bg-accent p-1.5 rounded-sm"
                >
                  <EllipsisVertical size={25} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {!isAuditor &&
                  handlesLargeScaleProjects &&
                  canMoveToClientApproval && (
                    <DropdownMenuItem
                      className="flex md:hidden"
                      disabled={!canMoveStage || isMovingStage}
                      onClick={handleOpenMoveConfirm}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Move to Client Approval
                    </DropdownMenuItem>
                  )}
                <DropdownMenuItem
                  className="flex md:hidden"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserPlus size={20} />
                  Assign Task
                </DropdownMenuItem>
                {/* ONLY MARK ON HOLD */}
                {/* Lead block handling added for DropdownMenu action */}
                {shouldDisableBlockedActions ? (
                  <CustomeTooltip
                    value={blockedTooltip}
                    truncateValue={
                      <DropdownMenuItem disabled>
                        <Clock className="m h-4 w-4" />
                        Mark On Hold
                      </DropdownMenuItem>
                    }
                  />
                ) : (
                  <DropdownMenuItem
                    onSelect={() => {
                      setActivityModalOpen(true);
                    }}
                  >
                    <Clock className="m h-4 w-4" />
                    Mark On Hold
                  </DropdownMenuItem>
                )}

                {/* CLIENT DOCUMENTATION */}
                {canAccessClientDocumentation ? (
                  // Lead block handling added for DropdownMenu action
                  shouldDisableBlockedActions ? (
                    <CustomeTooltip
                      value={blockedTooltip}
                      truncateValue={
                        <DropdownMenuItem disabled>
                          <FileText size={20} />
                          Client Documentation
                        </DropdownMenuItem>
                      }
                    />
                  ) : (
                    <DropdownMenuItem
                      onClick={() => setOpenClientDocModal(true)}
                    >
                      <FileText size={20} />
                      Client Documentation
                    </DropdownMenuItem>
                  )
                ) : (
                  <CustomeTooltip
                    truncateValue={
                      <div className="flex opacity-50 cursor-not-allowed px-2 py-1.5">
                        <FileText size={18} className="mr-2" />
                        Client Documentation
                      </div>
                    }
                    value={
                      shouldDisableBlockedActions
                        ? blockedTooltip
                        : "You don’t have permission."
                    }
                  />
                )}

                {/* EDIT */}
                {canEdit &&
                  // Lead block handling added for DropdownMenu action
                  (shouldDisableBlockedActions ? (
                    <CustomeTooltip
                      value={blockedTooltip}
                      truncateValue={
                        <DropdownMenuItem disabled>
                          <SquarePen size={20} />
                          Edit
                        </DropdownMenuItem>
                      }
                    />
                  ) : (
                    <DropdownMenuItem onClick={() => setOpenEditModal(true)}>
                      <SquarePen size={20} />
                      Edit
                    </DropdownMenuItem>
                  ))}

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

                    {isLeadBlocked ? "Unblock Lead" : "Block Lead"}
                  </DropdownMenuItem>
                )}

                {userType?.toLowerCase() === "super-admin" &&
                  lead?.is_fast_production === true && (
                    <DropdownMenuItem
                      onSelect={() => setOpenCancelFastProduction(true)}
                      disabled={
                        revokeFastProductionMutation.isPending || isLeadBlocked
                      }
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Fast Production
                    </DropdownMenuItem>
                  )}

                {(lead?.is_fast_production === true ||
                  lead?.has_pending_fast_production_request === true) && (
                  <DropdownMenuItem
                    onSelect={() => setFastProductionDetailsOpen(true)}
                  >
                    <Zap className="h-4 w-4 mr-2 text-orange-500 fill-orange-500" />
                    Fast Production Details
                  </DropdownMenuItem>
                )}

                {/* REASSIGN */}
                {canReassign &&
                  // Lead block handling added for DropdownMenu action
                  (shouldDisableBlockedActions ? (
                    <CustomeTooltip
                      value={blockedTooltip}
                      truncateValue={
                        <DropdownMenuItem disabled>
                          <Users size={20} />
                          Reassign Lead
                        </DropdownMenuItem>
                      }
                    />
                  ) : (
                    <DropdownMenuItem onClick={() => setAssignOpenLead(true)}>
                      <Users size={20} />
                      Reassign Lead
                    </DropdownMenuItem>
                  ))}

                {/* DELETE */}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    {/* Lead block handling added for DropdownMenu action */}
                    {shouldDisableBlockedActions ? (
                      <CustomeTooltip
                        value={blockedTooltip}
                        truncateValue={
                          <DropdownMenuItem disabled>
                            <XCircle size={20} className="text-red-500" />
                            Delete
                          </DropdownMenuItem>
                        }
                      />
                    ) : (
                      <DropdownMenuItem onClick={() => setOpenDelete(true)}>
                        <XCircle size={20} className="text-red-500" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === "todo") {
            setPreviousTab(activeTab);
            setOpenClientDocModal(true);
            setActiveTab("todo");
            return;
          }
          setActiveTab(val);
        }}
        className="w-full p-3 md:p-6"
      >
        <ScrollArea>
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
            <TabsTrigger value="details">
              <HouseIcon size={16} className="mr-1 opacity-60" />
              Lead Details
            </TabsTrigger>

            {!isAuditor ? (
              <TabsTrigger value="todo">
                <PencilLine size={16} className="mr-1 opacity-60" />
                To-Do Task
              </TabsTrigger>
            ) : (
              !isAuditor && (
                <CustomeTooltip
                  truncateValue={
                    <TabsTrigger value="" disabled>
                      <PencilLine size={16} className="mr-1 opacity-60" />
                      To-Do Task
                    </TabsTrigger>
                  }
                  value="Only Sales Executive can access this tab"
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
              <TabsTrigger value="payment">
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
        </ScrollArea>

        {/* TAB SCREENS */}
        <TabsContent value="details">
          <LeadDetailsUtil
            status={
              handlesLargeScaleProjects
                ? "clientdocumentation"
                : "finalMeasurement"
            }
            leadId={leadIdNum}
            defaultTab={
              handlesLargeScaleProjects
                ? "clientdocumentation"
                : "finalMeasurement"
            }
          />
        </TabsContent>

        {handlesLargeScaleProjects && (
          <TabsContent value="todo">
            <LeadDetailsUtil
              status="clientdocumentation"
              leadId={leadIdNum}
              defaultTab="clientdocumentation"
            />
          </TabsContent>
        )}

        {canViewSiteHistory && (
          <TabsContent value="history">
            <SiteHistoryTab leadId={leadIdNum} vendorId={vendorId!} />
          </TabsContent>
        )}

        {canViewPayment && (
          <TabsContent value="payment">
            <PaymentInformation accountId={accountId} />
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
              upToStage="clientDoc"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* MODALS */}
      <AssignLeadModal
        open={assignOpenLead}
        onOpenChange={setAssignOpenLead}
        leadData={{ id: leadIdNum, assignTo: lead?.assignedTo }}
      />

      <EditLeadModal
        open={openEditModal}
        onOpenChange={setOpenEditModal}
        leadData={{ id: leadIdNum }}
      />

      {!handlesLargeScaleProjects && (
        <ClientDocumentationModal
          open={openClientDocModal}
          onOpenChange={(open) => {
            setOpenClientDocModal(open);
            if (!open) setActiveTab(previousTab);
          }}
          data={{ id: leadIdNum, ...lead, accountId }}
        />
      )}

      <AssignTaskSiteMeasurementForm
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onlyFollowUp
        isFastProductionEnabled={true}
        data={{ id: leadIdNum, name: "" }}
      />

      {/* DELETE LEAD */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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

      {/* CONFIRM MOVE TO CLIENT APPROVAL MODAL */}
      <AlertDialog
        open={openMoveConfirmModal}
        onOpenChange={setOpenMoveConfirmModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Client Approval?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move this lead{" "}
              {leadCode ? `(${leadCode})` : ""} to the Client Approval stage?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMovingStage}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMoveToClientApproval}
              disabled={isMovingStage}
            >
              {isMovingStage ? "Moving..." : "Move to Client Approval"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MARK ON HOLD MODAL */}
      <ActivityStatusModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        statusType="onHold"
        vendorId={vendorId}
        franchiseId={lead?.franchise_id ?? null}
        leadId={leadIdNum}
        onSubmitRemark={(remark, dueDate, selection) => {
          if (!vendorId || !userId) {
            toastManager.add({
              title: "Vendor or user info missing!",
              type: "error",
            });
            return;
          }

          updateStatusMutation.mutate(
            {
              leadId: leadIdNum,
              payload: {
                vendorId,
                accountId,
                userId,
                status: "onHold",
                remark,
                createdBy: userId,
                dueDate,
                ...(selection ?? {}),
              },
            },
            {
              onSuccess: () => {
                toastManager.add({
                  title: "Lead marked On Hold!",
                  type: "success",
                });
                window.location.assign(
                  "/dashboard/leads/leadstable?tab=onHold",
                );
              },
              onError: (err) => {
                toastManager.add({
                  title: err?.message || "Failed to update status",
                  type: "error",
                });
              },
            },
          );
        }}
        loading={updateStatusMutation.isPending}
      />

      <AlertDialog open={openBlockConfirm} onOpenChange={setOpenBlockConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isLeadBlocked ? "Unblock Lead?" : "Block Lead?"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {isLeadBlocked
                ? "This will unblock the lead and allow it to proceed normally."
                : "This will block the lead and mark the block time in the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlockActionPending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleToggleLeadBlock}
              disabled={isBlockActionPending}
            >
              {isBlockActionPending
                ? "Processing..."
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
    </>
  );
}

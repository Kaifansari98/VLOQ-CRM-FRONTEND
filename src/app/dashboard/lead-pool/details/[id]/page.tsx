"use client";

import React, { useEffect, useState, useMemo } from "react";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/redux/store";
import { apiClient } from "@/lib/apiClient";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PhoneCall,
  History,
  Store,
  Calendar,
  User,
  Mail,
  Phone,
  Tag,
  MapPin,
  Clock,
  ArrowLeft,
  Loader2,
  FileSpreadsheet,
  MessageSquare,
  EllipsisVertical,
  Pencil,
  PencilLine,
  Plus,
  HouseIcon,
  Trash2,
  Package,
  Magnet,
  Zap,
  Activity,
  Users,
  Search,
  X,
  FileText,
  Upload,
  Edit3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import CustomeDatePicker from "@/components/date-picker";
import { toastManager } from "@/components/ui/toast";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import BaseModal from "@/components/utils/baseModal";
import AssignToPicker from "@/components/assign-to-picker";
import { PhoneInput } from "@/components/ui/phone-input";
import MapPicker from "@/components/MapPicker";
import { Checkbox } from "@/components/ui/checkbox";
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
import { generateOnlineLeadHistoryReport } from "@/lib/reports/onlineLeadHistoryReport";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OnlineLead {
  id: number;
  vendor_id: number;
  lead_code?: string | null;
  leads_name: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  contact: string;
  alt_contact_no: string | null;
  source: string;
  source_id?: number | null;
  site_type_id?: number | null;
  lead_entry_type: "ONLINE" | "WALK_IN";
  created_at: string;
  assign_to: number | null;
  status: number | null;
  remark: string | null;
  follow_up_date: string | null;
  store_id: number | null;
  final_assigned_leads: number | null;
  priority: string | null;
  site_address: string | null;
  refered_by: string | null;
  archetech_name: string | null;
  archetech_number: string | null;
  approval_status?: string | null;
  pending_store_id?: number | null;
  pending_follow_up_date?: string | null;
  product_types: string[];
  product_structures: string[];
  sourceRelation?: { id: number; type: string } | null;
  siteTypeRelation?: { id: number; type: string } | null;
  assignedTo?: {
    id: number;
    user_name: string;
  } | null;
  finalAssignedLeads?: {
    id: number;
    user_name: string;
  } | null;
  franchise?: {
    id: number;
    franchise_name: string;
  } | null;
  followupStatus?: {
    id: number;
    status_name: string;
    followup_required: boolean;
  } | null;
  call_log: Array<{
    id: number;
    call_type: "OUTGOING" | "INCOMING";
    duration_seconds: number | null;
    remark: string | null;
    created_at: string;
    telecaller: { user_name: string };
    status: { status_name: string } | null;
  }>;
  online_lead_history: Array<{
    id: number;
    remark: string | null;
    follow_up_date: string | null;
    store_preference_option: string | null;
    created_at: string;
    createdBy: { user_name: string };
    status: { status_name: string };
    franchise: { franchise_name: string } | null;
  }>;
  store_logs: Array<{
    id: number;
    action_type: "PREFERENCE" | "ASSIGNED" | "TRANSFERRED";
    remark: string | null;
    created_at: string;
    fromFranchise: { franchise_name: string } | null;
    toFranchise: { franchise_name: string };
    selectedBy: { user_name: string };
    assignedTo: { user_name: string } | null;
  }>;
}

interface FollowupStatus {
  id: number;
  status_name: string;
  followup_required: boolean;
}

interface Franchise {
  id: number;
  franchise_name: string;
}

interface Telecaller {
  id: number;
  name: string;
}

export default function OnlineLeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id;
  const userId = user?.id;
  const userType = user?.user_type?.user_type?.toLowerCase() || "";
  const isAdmin = userType === "super-admin" || userType === "admin" || userType === "sales admin" || userType === "sales-admin";
  const isCaller = userType === "telecaller" || userType === "telecaller-team-lead" || userType === "telecaller team lead" || userType === "caller";
  const isSalesExecutive = userType === "sales-executive" || userType === "sales executive" || userType === "salesexecutive";
  const isOnlineLeadFeatureEnabled = user?.vendor?.is_online_lead_feature_enabled === true;
  const isSuperAdmin = userType === "super-admin";

  const [lead, setLead] = useState<OnlineLead | null>(null);
  const userFranchiseId = user?.franchise_id;
  const isPendingApproval = lead?.approval_status === "PENDING";
  const isAuthorizedToApprove = useMemo(() => {
    if (!lead) return false;
    if (isAdmin || userType === "sales admin" || userType === "sales-admin") return true;
    const targetStoreId = lead.pending_store_id || lead.store_id;
    return Boolean(userFranchiseId != null && targetStoreId && userFranchiseId === targetStoreId);
  }, [lead, isAdmin, userType, userFranchiseId]);

  const { isApproveDisabled, approveTooltip } = useMemo(() => {
    if (!lead) return { isApproveDisabled: true, approveTooltip: "" };

    const missingFields: string[] = [];

    const hasName = Boolean(lead.leads_name && lead.leads_name.trim());
    if (!hasName) missingFields.push("First & Last Name");

    const hasContact = Boolean(lead.contact && lead.contact.trim());
    if (!hasContact) missingFields.push("Phone Number");

    const hasSiteType = Boolean(lead.siteTypeRelation?.id || lead.site_type_id);
    if (!hasSiteType) missingFields.push("Site Type");

    const hasPriority = Boolean(lead.priority && lead.priority.trim());
    if (!hasPriority) missingFields.push("Priority");

    const hasSource = Boolean(lead.sourceRelation?.id || lead.source_id || (lead.source && lead.source.trim()));
    if (!hasSource) missingFields.push("Source");

    const hasAddress = Boolean(lead.site_address && lead.site_address.trim());
    if (!hasAddress) missingFields.push("Site Address");

    const hasProductTypes = Boolean(Array.isArray(lead.product_types) && lead.product_types.length > 0);
    if (!hasProductTypes) missingFields.push("Product Types");

    const hasProductStructures = Boolean(Array.isArray(lead.product_structures) && lead.product_structures.length > 0);
    if (!hasProductStructures) missingFields.push("Product Structures");

    const isDisabled = missingFields.length > 0;
    const tooltip = isDisabled
      ? `Please complete required details before approving: ${missingFields.join(", ")}.`
      : "";

    return { isApproveDisabled: isDisabled, approveTooltip: tooltip };
  }, [lead]);

  const queryClient = useQueryClient();
  const [actingLeadId, setActingLeadId] = useState<number | null>(null);

  async function handleApproveLead() {
    if (!lead || isApproveDisabled) {
      if (approveTooltip) {
        toastManager.add({ title: approveTooltip, type: "error" });
      }
      return;
    }
    setActingLeadId(lead.id);
    try {
      const res = await apiClient.post(`/online-leads/${lead.id}/approve`, {
        user_id: userId,
      });
      if (res.data?.success) {
        toastManager.add({ title: "Lead approved successfully", type: "success" });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["draft-lead-table-data"] }),
          queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] }),
          queryClient.invalidateQueries({ queryKey: ["vendorOverallLeads"] }),
          queryClient.invalidateQueries({ queryKey: ["leadStats"] }),
          queryClient.invalidateQueries({ queryKey: ["activity-status-counts"] }),
          queryClient.invalidateQueries({ queryKey: ["online-leads"] }),
        ]);
        fetchLeadDetails();
      }
    } catch (err: any) {
      toastManager.add({
        title: err.response?.data?.error || "Failed to approve lead.",
        type: "error",
      });
    } finally {
      setActingLeadId(null);
    }
  }

  async function handleRejectLead() {
    if (!lead) return;
    setActingLeadId(lead.id);
    try {
      const res = await apiClient.post(`/online-leads/${lead.id}/reject`, {
        user_id: userId,
      });
      if (res.data?.success) {
        toastManager.add({ title: "Lead rejected successfully", type: "success" });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["draft-lead-table-data"] }),
          queryClient.invalidateQueries({ queryKey: ["universal-stage-leads"] }),
          queryClient.invalidateQueries({ queryKey: ["vendorOverallLeads"] }),
          queryClient.invalidateQueries({ queryKey: ["leadStats"] }),
          queryClient.invalidateQueries({ queryKey: ["activity-status-counts"] }),
          queryClient.invalidateQueries({ queryKey: ["online-leads"] }),
        ]);
        fetchLeadDetails();
      }
    } catch (err: any) {
      toastManager.add({
        title: err.response?.data?.error || "Failed to reject lead.",
        type: "error",
      });
    } finally {
      setActingLeadId(null);
    }
  }

  const isProductInfoMissing = useMemo(() => false, []);

  const latestRemarkInfo = useMemo(() => {
    if (!lead) return null;
    const isQuestionnaireText = (rem: string) => {
      return rem.includes("Bulk imported:") || rem.includes("What modular solution") || rem.includes("When do you need your modular");
    };

    const isInvalidRemark = (rem: string | null | undefined) => {
      if (!rem) return true;
      const clean = rem.trim();
      return clean === "" || clean === "-" || clean === "N/A" || isQuestionnaireText(clean);
    };

    const logs = lead.call_log || [];
    if (logs.length > 0) {
      const sorted = [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latest = sorted.find((l) => !isInvalidRemark(l.remark));
      if (latest) {
        return {
          id: latest.id,
          source: "call_log" as const,
          remark: latest.remark,
          status: latest.status?.status_name,
          telecaller: latest.telecaller?.user_name,
          date: latest.created_at,
        };
      }
    }
    const histories = lead.online_lead_history || [];
    if (histories.length > 0) {
      const sortedH = [...histories].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestH = sortedH.find((h) => !isInvalidRemark(h.remark));
      if (latestH) {
        return {
          id: latestH.id,
          source: "history" as const,
          remark: latestH.remark,
          status: latestH.status?.status_name,
          telecaller: latestH.createdBy?.user_name,
          date: latestH.created_at,
        };
      }
    }
    return null;
  }, [lead]);

  const [statuses, setStatuses] = useState<FollowupStatus[]>([]);
  const [stores, setStores] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(true);

  // Call outcome logging modal state
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<"OUTGOING" | "INCOMING">("OUTGOING");
  const [callStatus, setCallStatus] = useState("");
  const [callDurationMin, setCallDurationMin] = useState("");
  const [callDurationSec, setCallDurationSec] = useState("");
  const [callRemark, setCallRemark] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [preferredStoreId, setPreferredStoreId] = useState("");
  const [submittingCall, setSubmittingCall] = useState(false);
 
  const selectedStatusName = useMemo(() => {
    if (!callStatus || !statuses.length) return "";
    const st = statuses.find((s) => s.id.toString() === callStatus);
    return st ? st.status_name.toLowerCase() : "";
  }, [callStatus, statuses]);

  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [assignStoreId, setAssignStoreId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [markStoreVisitDone, setMarkStoreVisitDone] = useState(false);

  const isTodayOrPast = useMemo(() => {
    if (!visitDate) return false;
    const selected = new Date(visitDate);
    selected.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected.getTime() <= today.getTime();
  }, [visitDate]);

  useEffect(() => {
    if (!isTodayOrPast) {
      setMarkStoreVisitDone(false);
    }
  }, [isTodayOrPast]);
  const [storeRemark, setStoreRemark] = useState("");
  const [storeCallers, setStoreCallers] = useState<Telecaller[]>([]);
  const [selectedStoreCaller, setSelectedStoreCaller] = useState("");
  const [requiresCallerSelect, setRequiresCallerSelect] = useState(false);
  const [submittingStore, setSubmittingStore] = useState(false);
  const [isMovingToDraft, setIsMovingToDraft] = useState(false);

  // Reassign modal state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [telecallers, setTelecallers] = useState<any[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [salesExecutiveId, setSalesExecutiveId] = useState("");
  const [assignRemark, setAssignRemark] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [assignedToName, setAssignedToName] = useState("");

  const canAssign = useMemo(() => {
    return userType === "super-admin" || userType === "admin" || userType === "telecaller team lead" || userType === "telecaller-team-lead" || userType === "sales admin" || userType === "sales-admin";
  }, [userType]);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editAltContact, setEditAltContact] = useState("");
  const [editSiteAddress, setEditSiteAddress] = useState("");
  const [editRemark, setEditRemark] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editSourceId, setEditSourceId] = useState("");
  const [editSiteTypeId, setEditSiteTypeId] = useState("");
  const [editArchName, setEditArchName] = useState("");
  const [editArchNumber, setEditArchNumber] = useState("");
  const [editReferedBy, setEditReferedBy] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [isRemarkEditOpen, setIsRemarkEditOpen] = useState(false);
  const [remarkOnlyText, setRemarkOnlyText] = useState("");
  const [parsedQuestionnaire, setParsedQuestionnaire] = useState<{
    prefix: string;
    items: { question: string; answer: string }[];
  } | null>(null);
  const [submittingRemark, setSubmittingRemark] = useState(false);
  const [isLatestRemarkEditOpen, setIsLatestRemarkEditOpen] = useState(false);
  const [latestRemarkText, setLatestRemarkText] = useState("");
  const [submittingLatestRemark, setSubmittingLatestRemark] = useState(false);
  const [sourceTypes, setSourceTypes] = useState<{ id: number; type: string }[]>([]);
  const [siteTypes, setSiteTypes] = useState<{ id: number; type: string }[]>([]);

  // Furniture Structure modal state
  const [isFurnitureOpen, setIsFurnitureOpen] = useState(false);
  const [furnitureTitle, setFurnitureTitle] = useState("");
  const [furnitureStructureId, setFurnitureStructureId] = useState("");
  const [furnitureDescription, setFurnitureDescription] = useState("");
  const [furnitureTitleError, setFurnitureTitleError] = useState("");
  const [furnitureStructureError, setFurnitureStructureError] = useState("");
  const [furnitureCustomTitle, setFurnitureCustomTitle] = useState("");
  const [furnitureCustomTitleError, setFurnitureCustomTitleError] = useState("");
  const [allProductTypes, setAllProductTypes] = useState<{ id: number; type: string }[]>([]);
  const [allProductStructures, setAllProductStructures] = useState<{ id: number; type: string }[]>([]);
  const [submittingFurniture, setSubmittingFurniture] = useState(false);

  const filteredProductStructures = useMemo(() => {
    const uniqueMap = new Map<string, { id: number; type: string }>();
    allProductStructures.forEach((ps) => {
      const normName = ps.type.trim().toLowerCase();
      if (!uniqueMap.has(normName)) {
        uniqueMap.set(normName, ps);
      }
    });
    const uniqueStructures = Array.from(uniqueMap.values());

    if (!furnitureTitle) return uniqueStructures;

    const normTitle = furnitureTitle.trim().toLowerCase();
    const isKitchen = normTitle.includes("kitchen");
    const isWardrobe = normTitle.includes("wardrobe");

    return uniqueStructures.filter((ps) => {
      const normType = ps.type.trim().toLowerCase();
      if (isKitchen) {
        // Only kitchen-specific structures, no Others
        return normType.includes("kitchen");
      }
      if (isWardrobe) {
        // Only wardrobe-specific structures, no Others
        return normType.includes("wardrobe");
      }
      // For all other product types (Consoles, Small Order, Office Furniture, etc.) → only Others
      return normType === "others";
    });
  }, [allProductStructures, furnitureTitle]);
  // Keep these for edit modal product type/structure arrays
  const [editProductTypes, setEditProductTypes] = useState<string[]>([]);
  const [editProductStructures, setEditProductStructures] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Product Type edit states (matching Draft Leads details exactly)
  const [editProductTypeOpen, setEditProductTypeOpen] = useState(false);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<number | null>(null);
  const [selectedProductTypeIds, setSelectedProductTypeIds] = useState<number[]>([]);
  const [confirmProductTypeSave, setConfirmProductTypeSave] = useState(false);
  const [updatingLeadType, setUpdatingLeadType] = useState(false);

  const currentProductTypeId = useMemo(() => {
    const typeLabel = lead?.product_types?.[0];
    if (!typeLabel) return null;
    return allProductTypes.find((t: any) => t.type === typeLabel)?.id || null;
  }, [lead?.product_types, allProductTypes]);

  // History search and export state
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [isExportingHistory, setIsExportingHistory] = useState(false);

  const getHistoryActionIcon = (hist: any) => {
    const remark = (hist.remark || "").toLowerCase();
    const statusName = (hist.status?.status_name || "").toLowerCase();
    if (remark.includes("created") || remark.includes("added") || statusName.includes("created") || remark.includes("generation")) {
      return Upload;
    }
    if (remark.includes("assign") || remark.includes("allocate") || remark.includes("update") || remark.includes("change")) {
      return Edit3;
    }
    return CheckCircle2;
  };

  const filteredHistory = useMemo(() => {
    if (!lead || !lead.online_lead_history) return [];
    if (!historySearchQuery.trim()) return lead.online_lead_history;
    const query = historySearchQuery.toLowerCase().trim();
    return lead.online_lead_history.filter((hist: any) => {
      const remarkMatch = (hist.remark || "").toLowerCase().includes(query);
      const statusMatch = (hist.status?.status_name || "").toLowerCase().includes(query);
      const storeMatch = (hist.franchise?.franchise_name || "").toLowerCase().includes(query);
      const userMatch = (hist.createdBy?.user_name || "").toLowerCase().includes(query);
      return remarkMatch || statusMatch || storeMatch || userMatch;
    });
  }, [lead, historySearchQuery]);

  const productItems = useMemo(() => {
    if (!lead) return [];
    const types = lead.product_types || [];
    const structures = lead.product_structures || [];
    const maxLength = Math.max(types.length, structures.length);
    const items = [];
    for (let i = 0; i < maxLength; i++) {
      const rawType = types[i] || "—";
      const hasPrefix = rawType.includes(" | ");
      const title = hasPrefix ? rawType.split(" | ")[0].trim() : rawType;
      const type = hasPrefix ? rawType.split(" | ")[1].trim() : rawType;
      items.push({
        index: i,
        title: title,
        type: type,
        structure: structures[i] || "—",
      });
    }
    return items;
  }, [lead]);

  // Check if current follow-up status requires follow-up date input
  const isFollowUpDateRequired = useMemo(() => {
    const selectedSt = statuses.find((s) => s.id === Number(callStatus));
    return selectedSt?.followup_required || false;
  }, [callStatus, statuses]);

  const renderRemarkContent = (remarkText: string | null, defaultText = "N/A") => {
    if (!remarkText || remarkText.trim() === "" || remarkText.trim() === "-" || remarkText.trim() === "N/A") {
      return <p className="text-[15px] font-medium text-foreground">{defaultText}</p>;
    }

    // Replace all underscores with spaces for clean display
    const cleanText = remarkText.replace(/_/g, " ");

    // Handle inline markdown formatted text like "Bulk imported: **• Question?** Answer **• Question 2?** Answer 2"
    if (cleanText.includes("**") && !cleanText.includes("\n")) {
      let prefix = "";
      let remaining = cleanText;
      const firstStarIdx = cleanText.indexOf("**");
      if (firstStarIdx > 0) {
        prefix = cleanText.substring(0, firstStarIdx).trim();
        remaining = cleanText.substring(firstStarIdx);
      }

      const regex = /\*\*\s*•?\s*([^*]+?)\s*\*\*\s*([^*]+)/g;
      const matches: { question: string; answer: string }[] = [];
      let match;
      while ((match = regex.exec(remaining)) !== null) {
        matches.push({
          question: match[1].trim(),
          answer: match[2].trim(),
        });
      }

      if (matches.length > 0) {
        return (
          <div className="space-y-4">
            {prefix && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {prefix}
              </p>
            )}
            {matches.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <p className="font-bold text-foreground text-[14px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground inline-block shrink-0" />
                  <span>{item.question.replace(/^•\s*/, "")}</span>
                </p>
                <p className="text-[14px] text-slate-700 dark:text-slate-300 pl-3">{item.answer || "N/A"}</p>
              </div>
            ))}
          </div>
        );
      }
    }

    // Check if text uses '|' delimiter (older single-line uploaded format)
    if (cleanText.includes(" | ") && !cleanText.includes("\n")) {
      const parts = cleanText.split(" | ");
      return (
        <div className="space-y-4">
          {parts.map((part, idx) => {
            const colonIdx = part.indexOf(":");
            if (colonIdx !== -1) {
              const label = part.substring(0, colonIdx).trim();
              const val = part.substring(colonIdx + 1).trim();
              let questionLabel = label;
              if (label === "Modular Solution Interested In") questionLabel = "What modular solution are you interested in?";
              else if (label === "Need Ready By") questionLabel = "When do you need your modular kitchen/wardrobe ready?";
              else if (label === "Preferred Showroom") questionLabel = "Which Shambhala showroom would you prefer to visit?";
              else if (label === "Project Location") questionLabel = "Where is your project located?";
              else if (!questionLabel.endsWith("?")) questionLabel = `${questionLabel}?`;

              return (
                <div key={idx} className="space-y-1">
                  <p className="font-bold text-foreground text-[14px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground inline-block shrink-0" />
                    <span>{questionLabel}</span>
                  </p>
                  <p className="text-[14px] text-slate-700 dark:text-slate-300 pl-3">{val || "N/A"}</p>
                </div>
              );
            }
            return <p key={idx} className="text-[14px] text-slate-700 dark:text-slate-300">{part}</p>;
          })}
        </div>
      );
    }

    // Handle multiline text (\n\n separated blocks)
    const blocks = cleanText.split(/\n\s*\n/);
    return (
      <div className="space-y-4">
        {blocks.map((block, bIdx) => {
          const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
          return (
            <div key={bIdx} className="space-y-1">
              {lines.map((line, lIdx) => {
                const isBoldHeader = (line.startsWith("**") && line.endsWith("**")) || line.endsWith("?");
                if (isBoldHeader) {
                  let cleanHeader = line.replace(/^\*\*|\*\*$/g, "").trim();
                  if (cleanHeader.startsWith("•")) {
                    cleanHeader = cleanHeader.replace(/^•\s*/, "").trim();
                  }
                  return (
                    <p key={lIdx} className="font-bold text-foreground text-[14px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground inline-block shrink-0" />
                      <span>{cleanHeader}</span>
                    </p>
                  );
                }
                return (
                  <p key={lIdx} className="text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed pl-3">
                    {line}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const parseQuestionnaireItems = (text: string) => {
    if (!text || !text.includes("**")) return null;
    const cleanText = text.replace(/_/g, " ");
    let prefix = "";
    let remaining = cleanText;
    const firstStarIdx = cleanText.indexOf("**");
    if (firstStarIdx > 0) {
      prefix = cleanText.substring(0, firstStarIdx).trim();
      remaining = cleanText.substring(firstStarIdx);
    }

    const regex = /\*\*\s*•?\s*([^*]+?)\s*\*\*\s*([^*]+)/g;
    const items: { question: string; answer: string }[] = [];
    let match;
    while ((match = regex.exec(remaining)) !== null) {
      items.push({
        question: match[1].trim().replace(/^•\s*/, ""),
        answer: match[2].trim(),
      });
    }
    return items.length > 0 ? { prefix, items } : null;
  };

  const renderHistoryRemark = (remarkText: string | null, statusName: string) => {
    if (!remarkText) return <p className="text-sm text-foreground font-medium">Status updated to {statusName}</p>;
    let textToRender = remarkText.replace(/_/g, " ");
    let prefix = "";
    if (textToRender.startsWith("Bulk imported:")) {
      prefix = "Bulk imported:";
      textToRender = textToRender.replace(/^Bulk imported:\s*/, "").trim();
    }
    return (
      <div className="space-y-2">
        {prefix && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{prefix}</p>}
        {renderRemarkContent(textToRender)}
      </div>
    );
  };

  // Load Lead details
  const fetchLeadDetails = async () => {
    if (isNaN(id)) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/online-leads/${id}`);
      if (res.data?.success) {
        setLead(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load lead details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  // Load setup data (statuses, stores)
  useEffect(() => {
    if (!vendorId) return;

    apiClient
      .get(`/online-leads/statuses?vendor_id=${vendorId}`)
      .then((res) => {
        if (res.data?.success) setStatuses(res.data.data);
      })
      .catch(console.error);

    apiClient
      .get(`/franchises/vendor/${vendorId}`)
      .then((res) => {
        const rawList = Array.isArray(res.data)
          ? res.data
          : res.data?.data;
        if (Array.isArray(rawList)) {
          // Deduplicate stores by name, keeping correct unique store ID (e.g. Pune ID 5, Mumbai ID 1)
          const nameToStoreMap: Record<string, any> = {};
          for (const store of rawList) {
            const displayName = store.franchise_name
              .replace(/vloq|furnix/gi, "")
              .trim();
            
            // If display name is not in map yet, add it
            if (!nameToStoreMap[displayName]) {
              nameToStoreMap[displayName] = store;
            } else {
              // If it is in the map, choose the one with the correct unique store ID (e.g. ID 5 for Pune, ID 1 for Mumbai)
              const existingStore = nameToStoreMap[displayName];
              if (displayName === "Pune" && store.id === 5) {
                nameToStoreMap[displayName] = store;
              } else if (displayName === "Mumbai" && store.id === 1) {
                nameToStoreMap[displayName] = store;
              } else if (store.id < existingStore.id) {
                // Default fallback: keep the lower ID
                nameToStoreMap[displayName] = store;
              }
            }
          }
          const deduplicatedList = Object.values(nameToStoreMap).filter((s: any) => {
            const displayName = (s.franchise_name || "").replace(/vloq|furnix/gi, "").trim().toLowerCase();
            return displayName !== "b2b";
          });
          setStores(deduplicatedList);
        }
      })
      .catch(console.error);

    apiClient
      .get(`/leads/get-all-source-types/${vendorId}`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setSourceTypes(res.data.data);
        }
      })
      .catch(console.error);

    apiClient
      .get(`/leads/get-all-site-types/${vendorId}`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setSiteTypes(res.data.data);
        }
      })
      .catch(console.error);

    apiClient
      .get(`/online-leads/telecallers?vendor_id=${vendorId}`)
      .then((res) => {
        if (res.data?.success) setTelecallers(res.data.data);
      })
      .catch(console.error);

    apiClient
      .get(`/leads/get-all-product-types/${vendorId}`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAllProductTypes(res.data.data);
        }
      })
      .catch(console.error);

    apiClient
      .get(`/leads/get-all-productStructure-types/${vendorId}`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAllProductStructures(res.data.data);
        }
      })
      .catch(console.error);
  }, [vendorId]);

  // Query store callers when target store is selected for store assignment
  useEffect(() => {
    if (!assignStoreId) {
      setStoreCallers([]);
      setRequiresCallerSelect(false);
      return;
    }

    apiClient
      .get(`/online-leads/store/${assignStoreId}/callers`)
      .then((res) => {
        if (res.data?.success) {
          setStoreCallers(res.data.data);
        }
      })
      .catch(console.error);
  }, [assignStoreId]);

  // Log call form submit
  const handleCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callStatus) {
      toastManager.add({ title: "Status is required", type: "error" });
      return;
    }



    if (!callRemark || !callRemark.trim()) {
      toastManager.add({ title: "Call log remark is required", type: "error" });
      return;
    }

    setSubmittingCall(true);
    try {
      const res = await apiClient.post(`/online-leads/${id}/call`, {
        telecaller_id: userId,
        call_type: "OUTGOING",
        online_lead_status_id: callStatus,
        remark: callRemark,
        follow_up_date: followUpDate || undefined,
      });

      if (res.data?.success) {
        setIsCallOpen(false);
        setCallStatus("");
        setCallDurationMin("");
        setCallDurationSec("");
        setCallRemark("");
        setFollowUpDate("");
        setPreferredStoreId("");
        fetchLeadDetails();
        toastManager.add({ title: "Call outcome logged successfully", type: "success" });
      }
    } catch (err: any) {
      toastManager.add({ title: err.response?.data?.error || "Failed to log call outcome.", type: "error" });
    } finally {
      setSubmittingCall(false);
    }
  };

  // Transfer lead to Store flow/status
  const handleMoveToDraft = async () => {
    setIsMovingToDraft(true);
    try {
      const res = await apiClient.post(`/online-leads/${id}/move-to-draft`, {
        user_id: userId,
      });

      if (res.data?.success) {
        toastManager.add({ title: "Lead successfully transferred to store.", type: "success" });
        window.location.href = isOnlineLeadFeatureEnabled ? "/dashboard/leads/online-lead" : "/dashboard/leads/draft-lead";
      }
    } catch (err: any) {
      console.error("Transfer to Store error:", err);
      toastManager.add({
        title: err.response?.data?.error || "Failed to transfer lead to store.",
        type: "error",
      });
    } finally {
      setIsMovingToDraft(false);
    }
  };

  // Assign store form submit
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStoreId) return;

    setSubmittingStore(true);
    try {
      const res = await apiClient.post(`/online-leads/${id}/assign-store`, {
        to_store_id: Number(assignStoreId),
        assigned_to: selectedStoreCaller ? Number(selectedStoreCaller) : undefined,
        remark: storeRemark,
        selected_by: userId,
        mark_store_visit_done: markStoreVisitDone,
        follow_up_date: visitDate || undefined,
      });

      if (res.data?.success) {
        if (res.data.requiresSelection) {
          // Store has multiple callers and no manager -> requires selector dropdown
          setRequiresCallerSelect(true);
          setStoreCallers(res.data.callers);
        } else {
          setIsStoreOpen(false);
          setAssignStoreId("");
          setStoreRemark("");
          setSelectedStoreCaller("");
          setRequiresCallerSelect(false);
          setMarkStoreVisitDone(false);
          setVisitDate("");
          fetchLeadDetails();
          toastManager.add({ title: "Store assigned successfully", type: "success" });
        }
      }
    } catch (err: any) {
      console.error("Store assignment error:", err);
      toastManager.add({ title: err.response?.data?.error || "Failed to assign store.", type: "error" });
    } finally {
      setSubmittingStore(false);
    }
  };

  const handleMarkAsActive = async () => {
    if (!lead) return;
    const pendingStatus = statuses.find(
      (s) => s.status_name.toLowerCase() === "pending"
    );
    if (!pendingStatus) {
      toastManager.add({
        title: "Initial status 'Pending' not found.",
        type: "error",
      });
      return;
    }

    try {
      const res = await apiClient.patch(`/online-leads/${id}`, {
        status: pendingStatus.id,
        updated_by: userId,
      });

      if (res.data?.success) {
        fetchLeadDetails();
        toastManager.add({
          title: "Lead marked as active successfully",
          type: "success",
        });
      }
    } catch (err: any) {
      console.error("Failed to mark lead as active:", err);
      toastManager.add({
        title: err.response?.data?.error || "Failed to mark lead as active.",
        type: "error",
      });
    }
  };

  // Edit lead form submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim() || editName.trim();
    if (!fullName || !editContact.trim()) {
      toastManager.add({ title: "Name and Contact are required.", type: "error" });
      return;
    }
    setSubmittingEdit(true);
    try {
      const cleanContact = editContact.replace(/^\+91/, "").replace(/\s+/g, "").trim();
      const cleanAltContact = editAltContact ? editAltContact.replace(/^\+91/, "").replace(/\s+/g, "").trim() : null;

      const res = await apiClient.patch(`/online-leads/${id}`, {
        leads_name: fullName,
        firstname: editFirstName.trim() || null,
        lastname: editLastName.trim() || null,
        email: editEmail.trim() || null,
        contact: cleanContact,
        alt_contact_no: cleanAltContact,
        site_address: editSiteAddress.trim() || null,
        remark: editRemark.trim() || null,
        priority: editPriority || null,
        source_id: editSourceId ? Number(editSourceId) : null,
        site_type_id: editSiteTypeId ? Number(editSiteTypeId) : null,
        archetech_name: editArchName.trim() || null,
        archetech_number: editArchNumber.trim() || null,
        refered_by: editReferedBy.trim() || null,
        updated_by: userId,
      });
      if (res.data?.success) {
        setIsEditOpen(false);
        fetchLeadDetails();
        toastManager.add({ title: "Lead updated successfully", type: "success" });
      }
    } catch (err: any) {
      toastManager.add({ title: err.response?.data?.error || "Failed to update lead.", type: "error" });
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Remark Only save
  const handleRemarkOnlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRemark(true);
    try {
      let finalRemarkToSend = remarkOnlyText;
      if (parsedQuestionnaire && parsedQuestionnaire.items.length > 0) {
        const formattedItems = parsedQuestionnaire.items
          .map((i) => `**• ${i.question}** ${i.answer}`)
          .join(" ");
        finalRemarkToSend = parsedQuestionnaire.prefix
          ? `${parsedQuestionnaire.prefix} ${formattedItems}`
          : formattedItems;
      }

      const res = await apiClient.patch(`/online-leads/${id}`, {
        remark: finalRemarkToSend,
        updated_by: userId,
      });
      if (res.data?.success) {
        setIsRemarkEditOpen(false);
        fetchLeadDetails();
        toastManager.add({ title: "Design remarks updated successfully", type: "success" });
      }
    } catch (err: any) {
      toastManager.add({ title: err.response?.data?.error || "Failed to update remarks.", type: "error" });
    } finally {
      setSubmittingRemark(false);
    }
  };

  // Latest Remark Only save
  const handleLatestRemarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latestRemarkInfo) return;
    setSubmittingLatestRemark(true);
    try {
      const endpoint = latestRemarkInfo.source === "call_log"
        ? `/online-leads/call-log/${latestRemarkInfo.id}`
        : `/online-leads/history/${latestRemarkInfo.id}`;

      const res = await apiClient.patch(endpoint, {
        remark: latestRemarkText,
        updated_by: userId,
      });

      if (res.data?.success) {
        setIsLatestRemarkEditOpen(false);
        fetchLeadDetails();
        toastManager.add({ title: "Latest remark updated successfully", type: "success" });
      }
    } catch (err: any) {
      toastManager.add({ title: err.response?.data?.error || "Failed to update latest remark.", type: "error" });
    } finally {
      setSubmittingLatestRemark(false);
    }
  };

  // Furniture Structure save
  const handleFurnitureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedStructure = allProductStructures.find(
      (s) => s.id.toString() === furnitureStructureId
    );
    const structureType = selectedStructure ? selectedStructure.type : "—";
    const typeTitleVal = furnitureTitle.trim() || furnitureCustomTitle.trim() || structureType || "General";
    const customTitleVal = furnitureCustomTitle.trim() || typeTitleVal;

    setSubmittingFurniture(true);
    try {
      const currentStructures = lead?.product_structures || [];
      const currentTypes = lead?.product_types || [];
      
      let newStructures = [];
      let newTypes = [];
      const rawTypeValue = `${customTitleVal} | ${typeTitleVal}`;
      
      if (editingIndex !== null) {
        newStructures = [...currentStructures];
        newTypes = [...currentTypes];
        newStructures[editingIndex] = structureType;
        newTypes[editingIndex] = rawTypeValue;
      } else {
        newStructures = [...currentStructures, structureType];
        newTypes = [...currentTypes, rawTypeValue];
      }

      const res = await apiClient.patch(`/online-leads/${id}`, {
        product_types: newTypes,
        product_structures: newStructures,
        updated_by: userId,
      });
      if (res.data?.success) {
        setIsFurnitureOpen(false);
        setFurnitureTitle("");
        setFurnitureStructureId("");
        setFurnitureDescription("");
        setFurnitureCustomTitle("");
        setEditingIndex(null);
        fetchLeadDetails();
        toastManager.add({ title: "Furniture structure saved successfully", type: "success" });
      }
    } catch (err: any) {
      toastManager.add({ title: err.response?.data?.error || "Failed to save furniture structure.", type: "error" });
    } finally {
      setSubmittingFurniture(false);
    }
  };

  const handleDeleteStructure = async (index: number) => {
    if (!lead) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this product structure?");
    if (!confirmDelete) return;

    const newTypes = (lead.product_types || []).filter((_, idx) => idx !== index);
    const newStructures = (lead.product_structures || []).filter((_, idx) => idx !== index);

    try {
      const res = await apiClient.patch(`/online-leads/${id}`, {
        product_types: newTypes,
        product_structures: newStructures,
        updated_by: userId,
      });
      if (res.data?.success) {
        fetchLeadDetails();
        toastManager.add({ title: "Product structure deleted successfully", type: "success" });
      }
    } catch (err) {
      console.error("Failed to delete structure:", err);
      toastManager.add({ title: "Failed to delete structure", type: "error" });
    }
  };

  const handleOpenProductTypeEdit = () => {
    if (vendorId === 1 || lead?.vendor_id === 1) {
      const ids = (lead?.product_types || []).map((label: string) => {
        return allProductTypes.find((t: any) => t.type === label)?.id;
      }).filter((val): val is number => val !== undefined);
      setSelectedProductTypeIds(ids);
    } else {
      setSelectedProductTypeId(currentProductTypeId);
    }
    setEditProductTypeOpen(true);
  };

  const handleSaveProductType = () => {
    if (vendorId === 1 || lead?.vendor_id === 1) {
      if (selectedProductTypeIds.length === 0) {
        toastManager.add({
          title: "Please select at least one product type.",
          type: "error",
        });
        return;
      }

      const currentIds = (lead?.product_types || []).map((label: string) => {
        return allProductTypes.find((t: any) => t.type === label)?.id;
      }).filter((val): val is number => val !== undefined);

      const hasChanges =
        selectedProductTypeIds.length !== currentIds.length ||
        !selectedProductTypeIds.every(id => currentIds.includes(id));

      if (!hasChanges) {
        toastManager.add({ title: "No changes to update.", type: "info" });
        setEditProductTypeOpen(false);
        return;
      }
    } else {
      if (!selectedProductTypeId) {
        toastManager.add({
          title: "Please select a product type.",
          type: "error",
        });
        return;
      }
      if (selectedProductTypeId === currentProductTypeId) {
        toastManager.add({ title: "No changes to update.", type: "info" });
        setEditProductTypeOpen(false);
        return;
      }
    }
    setConfirmProductTypeSave(true);
  };

  const handleConfirmProductTypeSave = async () => {
    setConfirmProductTypeSave(false);
    setUpdatingLeadType(true);
    try {
      let nextTypes: string[] = [];
      if (vendorId === 1 || lead?.vendor_id === 1) {
        nextTypes = selectedProductTypeIds
          .map(id => allProductTypes.find((t: any) => t.id === id)?.type)
          .filter((val): val is string => val !== undefined);
      } else {
        const nextTypeLabel = allProductTypes.find((t: any) => t.id === selectedProductTypeId)?.type;
        if (!nextTypeLabel) return;
        nextTypes = [nextTypeLabel];
      }

      const res = await apiClient.patch(`/online-leads/${id}`, {
        product_types: nextTypes,
        updated_by: userId,
      });

      if (res.data?.success) {
        setEditProductTypeOpen(false);
        fetchLeadDetails();
        toastManager.add({ title: "Product type updated successfully.", type: "success" });
      }
    } catch (error: any) {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to update product type.",
        type: "error",
      });
    } finally {
      setUpdatingLeadType(false);
    }
  };

  const handleHistoryExport = async () => {
    if (!lead || !lead.online_lead_history || lead.online_lead_history.length === 0) {
      toastManager.add({ title: "No history logs found for this lead.", type: "error" });
      return;
    }
    setIsExportingHistory(true);
    try {
      await generateOnlineLeadHistoryReport({
        leadId: lead.id,
        leadName: lead.leads_name,
        leadContact: lead.contact,
        historyLogs: lead.online_lead_history,
      });
      toastManager.add({ title: "History exported successfully", type: "success" });
    } catch (err: any) {
      toastManager.add({ title: err.message || "Failed to export history", type: "error" });
    } finally {
      setIsExportingHistory(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setAssigning(true);
    try {
      const res = await apiClient.put(`/online-leads/${id}/assign`, {
        assign_to: assigneeId && assigneeId !== "none" ? Number(assigneeId) : null,
        sales_executive_id: salesExecutiveId && salesExecutiveId !== "none" ? Number(salesExecutiveId) : null,
        remark: assignRemark,
        created_by: userId,
      });

      if (res.data?.success) {
        setIsAssignOpen(false);
        
        const assignedCaller = telecallers.find((tc) => String(tc.id) === String(assigneeId));
        const assignedSales = telecallers.find((tc) => String(tc.id) === String(salesExecutiveId));
        
        const names = [];
        if (assignedCaller) names.push(`Caller: ${assignedCaller.user_name}`);
        if (assignedSales) names.push(`Sales: ${assignedSales.user_name}`);
        
        setAssignedToName(names.join(" & ") || "Unassigned");
        setAssigneeId("");
        setSalesExecutiveId("");
        setAssignRemark("");
        fetchLeadDetails();
        setIsSuccessOpen(true);
      }
    } catch (err: any) {
      toastManager.add({ title: err.response?.data?.error || "Failed to reassign lead.", type: "error" });
    } finally {
      setAssigning(false);
    }
  };

  // Check if lead is marked as converted
  const isConverted = useMemo(() => {
    if (!lead || !lead.followupStatus) return false;
    const name = lead.followupStatus.status_name.toLowerCase();
    return name === "converted" || name === "store assigned" || lead.store_id !== null;
  }, [lead]);

  // Check if lead is marked as lost
  const isLost = useMemo(() => {
    if (!lead || !lead.followupStatus) return false;
    const name = lead.followupStatus.status_name.toLowerCase();
    return name === "lost";
  }, [lead]);

  const canMoveToDraft = useMemo(() => {
    return (isAdmin || isSalesExecutive || isSuperAdmin || userType === "telecaller") && !isLost;
  }, [isAdmin, isSalesExecutive, isSuperAdmin, isLost, userType]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-3 bg-background">
        <Loader2 className="w-10 h-10 text-slate-800 dark:text-slate-200 animate-spin" />
        <p className="text-muted-foreground font-semibold text-sm">Loading lead profile...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-background">
        <h2 className="text-xl font-bold">Lead Profile Not Found</h2>
        <p className="text-muted-foreground text-sm mt-1">
          This lead ID does not exist or you do not have permission to view it.
        </p>
        <Link href="/dashboard/online-leads" className="mt-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/lead-pool">
                  Lead Pool
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{lead.lead_code || `Lead ID #${lead.id}`}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          {!isLost && (
            <>
              {isOnlineLeadFeatureEnabled && (
                <Button
                  size="sm"
                  onClick={() => {
                    setAssignStoreId(lead?.store_id?.toString() || "");
                    setIsStoreOpen(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 h-9"
                >
                  <Store className="w-3.5 h-3.5" /> {lead?.franchise?.franchise_name ? lead.franchise.franchise_name.replace(/vloq|furnix/gi, "").trim() : "Select Store"}
                </Button>
              )}
              {true && (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsCallOpen(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 h-9"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Follow up
                </Button>
              )}
            </>
          )}

          {canMoveToDraft && (() => {
            const hasStoreAssigned = Boolean(lead?.store_id);
            const hasCallLog = Boolean(lead?.call_log && lead.call_log.length > 0);
            const isMoveDisabled = isMovingToDraft || !hasStoreAssigned || !hasCallLog;

            let tooltipText = "";
            if (!hasStoreAssigned && !hasCallLog) {
              tooltipText = "Assign a store and log a call/follow-up before transferring to store.";
            } else if (!hasStoreAssigned) {
              tooltipText = "Assign a store before transferring to store.";
            } else if (!hasCallLog) {
              tooltipText = "Log a call/follow-up before transferring to store.";
            }

            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        onClick={handleMoveToDraft}
                        disabled={isMoveDisabled}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isMovingToDraft ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Transfer to Store
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {tooltipText && (
                    <TooltipContent>
                      <p>{tooltipText}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })()}



          <NotificationBell />
          <AnimatedThemeToggler />

          {!isLost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="relative bg-accent p-1.5 rounded-sm"
                >
                  <EllipsisVertical size={22} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isLost ? (
                  <>
                    {true && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (!lead) return;
                          const parts = (lead.leads_name || "").trim().split(" ");
                          const fName = lead.firstname || parts[0] || "";
                          const lName = lead.lastname || parts.slice(1).join(" ") || "";
                          setEditFirstName(fName);
                          setEditLastName(lName);
                          setEditName(lead.leads_name || "");
                          setEditEmail(lead.email || "");
                          setEditContact(lead.contact ? (lead.contact.startsWith("+") ? lead.contact : `+91${lead.contact}`) : "");
                          setEditAltContact(lead.alt_contact_no ? (lead.alt_contact_no.startsWith("+") ? lead.alt_contact_no : `+91${lead.alt_contact_no}`) : "");
                          setEditSiteAddress(lead.site_address || "");
                          setEditRemark(lead.remark || "");
                          setEditPriority(lead.priority || "");
                          const onlineSrc = sourceTypes.find((s) => s.type?.toLowerCase() === "online");
                          setEditSourceId(lead.sourceRelation?.id?.toString() || onlineSrc?.id?.toString() || "");
                          setEditSiteTypeId(lead.siteTypeRelation?.id?.toString() || "");
                          setEditArchName(lead.archetech_name || "");
                          setEditArchNumber(lead.archetech_number || "");
                          setEditReferedBy(lead.refered_by || "");
                          setIsEditOpen(true);
                        }}
                      >
                        <PencilLine className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                    )}
                    {canAssign && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (lead) {
                            setAssigneeId(lead.assign_to ? lead.assign_to.toString() : "none");
                            setSalesExecutiveId(lead.final_assigned_leads ? lead.final_assigned_leads.toString() : "none");
                          }
                          setIsAssignOpen(true);
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" /> Reassign Lead
                      </DropdownMenuItem>
                    )}
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleMarkAsActive}>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Mark as Active
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-background">
        {/* Tabbed Layout matching Draft Leads */}
        <Tabs defaultValue="details" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <TabsList className="h-auto gap-2 px-1.5 py-1.5">
              <TabsTrigger value="details">
                <HouseIcon size={16} className="mr-1 opacity-60" />
                Lead Details
              </TabsTrigger>
              <TabsTrigger value="history">
                <History size={16} className="mr-1 opacity-60" />
                History
              </TabsTrigger>
              <TabsTrigger value="calls">
                <PhoneCall size={16} className="mr-1 opacity-60" />
                Call Logs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="mt-0 space-y-6">
            {/* Lead Identity Summary Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
              <div>
                <h2 className="text-lg font-bold text-foreground">Lead Details</h2>
                <p className="text-sm text-muted-foreground mt-0.5">All the Lead Related Details Which has been filled during onboard.</p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs text-muted-foreground">Created At</div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mt-0.5">
                  <Calendar className="w-4 h-4 text-muted-foreground/80" />
                  {new Date(lead.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                </div>
              </div>
            </div>

            {/* Product Information */}
            <Card className="shadow-sm border rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-foreground">Product Information</h3>
                  {!isLost && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setFurnitureCustomTitle("");
                        setFurnitureTitle("");
                        setFurnitureStructureId("");
                        setFurnitureDescription("");
                        setFurnitureTitleError("");
                        setFurnitureStructureError("");
                        setFurnitureCustomTitleError("");
                        setEditingIndex(null);
                        setIsFurnitureOpen(true);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Furniture Structure
                    </Button>
                  )}
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <Package className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground font-medium">Product Types</p>
                      </div>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">
                        {lead.product_types?.length > 0 ? lead.product_types.map(t => t.includes(" | ") ? t.split(" | ")[1] : t).join(", ") : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-sm text-muted-foreground font-medium">Product Structures</p>
                    </div>
                    {(!lead.product_structures || lead.product_structures.length === 0) ? (
                      <p className="text-sm font-medium text-foreground pl-7">—</p>
                    ) : (
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 pl-7">
                        {productItems.map((item) => (
                          <div
                            key={item.index}
                            className="group rounded-xl border bg-white/60 p-5 transition-all hover:border-border/80 dark:bg-[#0a0a0a] min-w-0"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="flex-1 min-w-0 line-clamp-2 text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-foreground dark:text-neutral-200 text-wrap break-words">
                                    {item.title}
                                  </p>
                                  {!isLost && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        className="text-muted-foreground/70 hover:text-foreground inline-flex size-7 items-center justify-center rounded-md border border-transparent transition-[color,box-shadow] outline-none"
                                        onClick={() => {
                                          setEditingIndex(item.index);
                                          setFurnitureCustomTitle(item.title);
                                          setFurnitureTitle(item.type || item.title);
                                          const structObj = allProductStructures.find(
                                            (s) => s.type === item.structure
                                          );
                                          setFurnitureStructureId(structObj ? structObj.id.toString() : "");
                                          setIsFurnitureOpen(true);
                                        }}
                                        aria-label="Edit"
                                      >
                                        <PencilLine className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteStructure(item.index)}
                                        className="text-muted-foreground/70 hover:text-destructive inline-flex size-7 items-center justify-center rounded-md transition-colors"
                                        aria-label="Delete"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                                  {item.structure}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-sm border rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-5">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Full Name</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">{lead.leads_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Email Address</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">{lead.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Phone Number</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">+91 {lead.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Site Address</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">{lead.site_address || "—"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card className="shadow-sm border rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-5">Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Architect Name</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">{lead.archetech_name || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Site Type</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">{lead.siteTypeRelation?.type || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Magnet className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Source</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">{lead.sourceRelation?.type || lead.source || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Priority</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">{lead.priority || "—"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="shadow-sm border rounded-2xl">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-semibold text-foreground">Additional Information</h3>
                </div>

                {/* Latest Remark (only if isOnlineLeadFeatureEnabled is true) */}
                {isOnlineLeadFeatureEnabled && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground font-medium">Latest Remark</p>
                          {latestRemarkInfo?.status && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              Status: {latestRemarkInfo.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {latestRemarkInfo?.date && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(latestRemarkInfo.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {latestRemarkInfo && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setLatestRemarkText(latestRemarkInfo.remark || "");
                                setIsLatestRemarkEditOpen(true);
                              }}
                              className="h-7 px-2.5 gap-1 text-[11px] font-medium rounded-md hover:bg-accent border-input"
                            >
                              <Pencil className="w-3 h-3 text-muted-foreground" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border bg-muted/10 min-h-[50px] space-y-3">
                        {latestRemarkInfo && latestRemarkInfo.remark && latestRemarkInfo.remark.trim() !== "N/A" && latestRemarkInfo.remark.trim() !== "-" ? (
                          <>
                            {renderRemarkContent(latestRemarkInfo.remark, "No follow up performed yet")}
                            {latestRemarkInfo.telecaller && (
                              <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                                Logged by: <span className="font-semibold text-foreground">{latestRemarkInfo.telecaller}</span>
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-[15px] font-medium text-foreground">No follow up performed yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Design Remarks */}
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground font-medium">Design Remarks</p>
                      {true && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const text = lead?.remark || "";
                            setRemarkOnlyText(text);
                            setParsedQuestionnaire(parseQuestionnaireItems(text));
                            setIsRemarkEditOpen(true);
                          }}
                          className="h-7 px-2.5 gap-1 text-[11px] font-medium rounded-md hover:bg-accent border-input"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                          Edit
                        </Button>
                      )}
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/10 min-h-[60px]">
                      {renderRemarkContent(lead?.remark ?? null)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allocation Info */}
            <Card className="shadow-sm border rounded-2xl">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-5">Assignment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Telecaller Assigned</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">
                        {lead.assignedTo?.user_name || lead.finalAssignedLeads?.user_name || "Unassigned"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Store className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Assigned Store</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">
                        {lead.franchise?.franchise_name ? lead.franchise.franchise_name.replace(/vloq|furnix/gi, "").trim() : "No Store Selected"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Activity className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Current Status</p>
                      <span className="mt-1 inline-block px-2.5 py-0.5 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {lead.followupStatus?.status_name || "New Lead"}
                      </span>
                    </div>
                  </div>
                  {isOnlineLeadFeatureEnabled ? (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Tentative Date</p>
                        <p className="text-[15px] font-semibold text-foreground mt-0.5">
                          {lead.follow_up_date || lead.pending_follow_up_date
                            ? new Date(lead.follow_up_date || lead.pending_follow_up_date!).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    lead.follow_up_date && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Next Follow-Up</p>
                          <p className="text-[15px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                            {new Date(lead.follow_up_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Site History</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Track all activities and changes for this lead
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <Input
                    placeholder="Search history..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-7 text-xs w-full sm:w-48 bg-background"
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="shrink-0 gap-2 h-8 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold"
                  disabled={isExportingHistory}
                  onClick={handleHistoryExport}
                >
                  {isExportingHistory ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="size-4" />
                  )}
                  <span className="hidden sm:inline">{isExportingHistory ? "Exporting..." : "Export"}</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>

            <div className="pt-3">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="mx-auto text-muted-foreground/30 mb-2" size={36} />
                  <p className="text-sm text-muted-foreground">{historySearchQuery ? "No matching history logs found." : "No activity history logs yet."}</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

                  {filteredHistory.map((hist: any) => {
                    const avatarInitial = hist.createdBy.user_name.charAt(0).toUpperCase() || "?";
                    return (
                      <div key={hist.id} className="relative pl-12 pb-3 last:pb-0">
                        {/* Timeline Node */}
                        {(() => {
                          const ActionIcon = getHistoryActionIcon(hist);
                          return (
                            <div className="absolute left-0 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-primary-foreground ring-4 ring-background z-10">
                              <ActionIcon size={14} />
                            </div>
                          );
                        })()}

                        {/* Card Container */}
                        <Card className="gap-2.5 border p-4 bg-transparent rounded-xl flex flex-col space-y-3">
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            {/* Timestamp */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{new Date(hist.created_at).toLocaleString("en-IN")}</span>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2">
                              {hist.franchise && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-100 dark:border-rose-800">
                                  <MapPin className="w-3 h-3" /> {hist.franchise.franchise_name.replace(/vloq|furnix/gi, "").trim()}
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50">
                                {hist.status.status_name}
                              </span>
                            </div>
                          </div>

                          {/* Main message */}
                          <div className="space-y-1.5">
                            {renderHistoryRemark(hist.remark, hist.status?.status_name || "Status")}
                            {hist.follow_up_date && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Scheduled Next Call: {new Date(hist.follow_up_date).toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {avatarInitial}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground text-xs leading-none">
                                {hist.createdBy.user_name}
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-1">
                                Logged by user
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calls" className="mt-0">
            <Card className="shadow border w-full">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-slate-800 dark:text-slate-200" /> Call Outcome Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto">
                {lead.call_log.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm italic">
                    No calls logged for this customer.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Outcome Status</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Caller</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lead.call_log.map((call) => (
                        <TableRow key={call.id} className="hover:bg-muted/5">
                          <TableCell className="px-4 py-3 text-xs font-medium">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 font-semibold">
                              {call.status?.status_name || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                            {call.telecaller.user_name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(call.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>

      {/* Log Call Modal */}
      <BaseModal
        open={isCallOpen}
        onOpenChange={setIsCallOpen}
        title="Log Call Outcome"
        description="Log conversation details, update follow-up statuses, and schedule next callbacks."
        size="md"
      >
        <form onSubmit={handleCallSubmit} className="space-y-4 px-6 pb-6 pt-4">


            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">New Status Outcome <span className="text-red-500">*</span></label>
                <Select
                  value={callStatus}
                  onValueChange={(val) => setCallStatus(val)}
                >
                  <SelectTrigger className="w-full h-10 bg-background text-sm">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {statuses
                      .filter((st) => {
                        const name = st.status_name.toLowerCase();
                        return name === "follow up done" || name === "lost";
                      })
                      .map((st) => {
                        return (
                          <SelectItem
                            key={st.id}
                            value={st.id.toString()}
                          >
                            {st.status_name}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Next Follow-up Date (optional)
                </label>
                <CustomeDatePicker
                  value={followUpDate}
                  onChange={(val) => setFollowUpDate(val || "")}
                  restriction="futureOnly"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Call Log Remark <span className="text-red-500">*</span></label>
              <Textarea
                placeholder="Log notes about what was discussed..."
                value={callRemark}
                onChange={(e) => setCallRemark(e.target.value)}
                className="h-20 resize-none text-sm bg-background"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCallOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingCall}
                className="h-9 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold"
              >
                {submittingCall && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Log Call Outcome
              </Button>
            </DialogFooter>
          </form>
      </BaseModal>

      {/* Reassign Lead Modal */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-md bg-card border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Reassign Online Lead
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Allocate this online/walk-in lead to a registered caller, sales executive, or administrator.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubmit} className="space-y-5 mt-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                   <User className="w-3.5 h-3.5 text-slate-500" /> Caller
                 </label>
                 <div className="relative">
                   <Select
                     value={assigneeId || "none"}
                     onValueChange={(val) => setAssigneeId(val)}
                   >
                     <SelectTrigger className="w-full h-10 rounded-xl border border-input bg-background/50 hover:bg-background/85 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition duration-200 cursor-pointer text-sm text-foreground focus:outline-none">
                       <SelectValue placeholder="Select Caller" />
                     </SelectTrigger>
                     <SelectContent className="bg-popover text-popover-foreground">
                       <SelectItem value="none">Unassigned</SelectItem>
                       {telecallers
                         .filter((tc) => {
                           const role = tc.user_type?.user_type?.toLowerCase() || "";
                           return role === "telecaller" || role === "telecaller-team-lead" || role === "telecaller team lead";
                         })
                         .map((tc) => (
                           <SelectItem key={tc.id} value={tc.id.toString()}>
                             {tc.user_name}
                           </SelectItem>
                         ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                   <User className="w-3.5 h-3.5 text-slate-500" /> Sales Executive
                 </label>
                 <div className="relative">
                   <Select
                     value={salesExecutiveId || "none"}
                     onValueChange={(val) => setSalesExecutiveId(val)}
                   >
                     <SelectTrigger className="w-full h-10 rounded-xl border border-input bg-background/50 hover:bg-background/85 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition duration-200 cursor-pointer text-sm text-foreground focus:outline-none">
                       <SelectValue placeholder="Select Sales Exec" />
                     </SelectTrigger>
                     <SelectContent className="bg-popover text-popover-foreground">
                       <SelectItem value="none">Unassigned</SelectItem>
                       {telecallers
                         .filter((tc) => {
                           const role = tc.user_type?.user_type?.toLowerCase() || "";
                           return role === "sales-executive" || role === "sales executive";
                         })
                         .map((tc) => (
                           <SelectItem key={tc.id} value={tc.id.toString()}>
                             {tc.user_name}
                           </SelectItem>
                         ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Assignment Remark
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  placeholder="Optional assignment note..."
                  value={assignRemark}
                  onChange={(e) => setAssignRemark(e.target.value)}
                  className="pl-9 h-10 rounded-xl border border-input bg-background/50 hover:bg-background/85 focus-visible:ring-2 focus-visible:ring-slate-500/25 focus-visible:border-slate-500 transition duration-200"
                />
              </div>
            </div>

            <DialogFooter className="mt-5 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssignOpen(false)}
                className="h-10 text-xs rounded-xl border-input/60 hover:bg-muted/70"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={assigning}
                className="h-10 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold rounded-xl hover:shadow-lg active:scale-[0.98] transition-all"
              >
                {assigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Allocation Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Animated Checkmark Wrapper */}
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 shadow-inner">
              <CheckCircle2 className="w-9 h-9 animate-[scaleUp_0.35s_ease-out]" />
              {/* Subtle pulsing background ring */}
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            
            <div className="space-y-1.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Lead Allocated Successfully!
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground font-medium max-w-[280px] mx-auto mt-1">
                The lead has been assigned to <span className="font-bold text-slate-800 dark:text-slate-200">{assignedToName}</span>.
              </DialogDescription>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="px-6 h-10 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold rounded-xl hover:shadow-lg active:scale-[0.98] transition-all"
            >
              Okay, Great!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl w-[95vw] lg:max-w-4xl bg-card border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Edit Lead
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Update the details of this lead.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">First Name <span className="text-red-500">*</span></label>
                <Input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="First name"
                  className="h-10 text-sm bg-background"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Last Name <span className="text-red-500">*</span></label>
                <Input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Last name"
                  className="h-10 text-sm bg-background"
                  required
                />
              </div>
            </div>

            {/* Phone Number & Alt. Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Phone Number <span className="text-red-500">*</span></label>
                <PhoneInput
                  defaultCountry="IN"
                  value={editContact}
                  onChange={(v) => setEditContact(v || "")}
                  placeholder="Phone number"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Alt. Phone Number</label>
                <PhoneInput
                  defaultCountry="IN"
                  value={editAltContact}
                  onChange={(v) => setEditAltContact(v || "")}
                  placeholder="Alternate phone number"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email</label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                className="h-10 text-sm bg-background"
              />
            </div>

            {/* Site Type & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Site Type <span className="text-red-500">*</span></label>
                <Select
                  value={editSiteTypeId || undefined}
                  onValueChange={(v) => setEditSiteTypeId(v)}
                >
                  <SelectTrigger className="h-10 text-sm bg-background">
                    <SelectValue placeholder="Select Site Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {siteTypes.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Priority <span className="text-red-500">*</span></label>
                <Select
                  value={editPriority || undefined}
                  onValueChange={(v) => setEditPriority(v)}
                >
                  <SelectTrigger className="h-10 text-sm bg-background">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Source <span className="text-red-500">*</span></label>
              <Select
                value={editSourceId || undefined}
                onValueChange={(v) => setEditSourceId(v)}
              >
                <SelectTrigger className="h-10 text-sm bg-background">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  {sourceTypes.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Site Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Site Address <span className="text-red-500">*</span></label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMapOpen(true)}
                  className="h-8 text-xs font-semibold flex items-center gap-1.5 rounded-lg border-slate-200 dark:border-slate-800 shadow-none hover:bg-muted"
                >
                  <MapPin className="w-3.5 h-3.5" /> Open Map
                </Button>
              </div>
              <Textarea
                value={editSiteAddress}
                onChange={(e) => setEditSiteAddress(e.target.value)}
                placeholder="Enter site address..."
                rows={3}
                className="resize-none text-sm bg-background"
              />
              <div className="text-[11px] text-right text-muted-foreground font-medium">
                {Math.max(0, 1000 - editSiteAddress.length)} characters left
              </div>
            </div>

            {/* Referred By & Architect Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Referred By</label>
                <Input
                  value={editReferedBy}
                  onChange={(e) => setEditReferedBy(e.target.value)}
                  placeholder="Reference name"
                  className="h-10 text-sm bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Architect Name</label>
                <Input
                  value={editArchName}
                  onChange={(e) => setEditArchName(e.target.value)}
                  placeholder="Architect / designer name"
                  className="h-10 text-sm bg-background"
                />
              </div>
            </div>

            {/* Architect Contact & Design Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Architect Contact</label>
                <Input
                  value={editArchNumber}
                  onChange={(e) => setEditArchNumber(e.target.value)}
                  placeholder="Architect phone"
                  className="h-10 text-sm bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Design Remarks</label>
                <Input
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                  placeholder="Design remarks"
                  className="h-10 text-sm bg-background"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="h-10 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingEdit}
                className="h-10 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold rounded-xl"
              >
                {submittingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Map Picker Modal */}
      <MapPicker
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelect={(addr) => {
          setEditSiteAddress(addr);
          setIsMapOpen(false);
        }}
      />

      {/* Edit Design Remarks Only Modal */}
      <Dialog open={isRemarkEditOpen} onOpenChange={setIsRemarkEditOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Additional Information</DialogTitle>
            <DialogDescription className="text-xs">
              Update design remarks and additional information for this lead.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRemarkOnlySubmit} className="space-y-4 py-2">
            {parsedQuestionnaire ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {parsedQuestionnaire.prefix && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {parsedQuestionnaire.prefix}
                  </p>
                )}
                {parsedQuestionnaire.items.map((item, idx) => (
                  <div key={idx} className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground inline-block shrink-0" />
                      <span>{item.question}</span>
                    </label>
                    <Input
                      value={item.answer}
                      onChange={(e) => {
                        const updated = [...parsedQuestionnaire.items];
                        updated[idx] = { ...updated[idx], answer: e.target.value };
                        setParsedQuestionnaire({ ...parsedQuestionnaire, items: updated });
                      }}
                      placeholder="Enter response..."
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Design Remarks</label>
                <Textarea
                  value={remarkOnlyText}
                  onChange={(e) => setRemarkOnlyText(e.target.value)}
                  placeholder="Enter design remarks or additional information..."
                  rows={6}
                  className="w-full text-sm bg-background resize-none p-3"
                />
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRemarkEditOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingRemark}
                className="h-9 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold"
              >
                {submittingRemark && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Latest Remark Modal */}
      <Dialog open={isLatestRemarkEditOpen} onOpenChange={setIsLatestRemarkEditOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Latest Remark</DialogTitle>
            <DialogDescription className="text-xs">
              Update the latest call log / outcome remark for this lead.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLatestRemarkSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Latest Call Log Remark</label>
              <Textarea
                value={latestRemarkText}
                onChange={(e) => setLatestRemarkText(e.target.value)}
                placeholder="Enter latest call log remark..."
                rows={5}
                className="w-full text-sm bg-background resize-none p-3"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsLatestRemarkEditOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingLatestRemark}
                className="h-9 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold"
              >
                {submittingLatestRemark && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Furniture Structure Modal — matches Draft Leads UI exactly */}
      <BaseModal
        open={isFurnitureOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFurnitureOpen(false);
            setFurnitureTitleError("");
            setFurnitureStructureError("");
            setFurnitureCustomTitleError("");
            setEditingIndex(null);
          }
        }}
        title={editingIndex !== null ? "Edit Furniture Structure" : "Add Furniture Structure"}
        description={editingIndex !== null ? "Update the product structure instance details." : "Create a new product structure instance."}
        size="md"
      >
        <form onSubmit={handleFurnitureSubmit}>
          <div className="space-y-4 px-6 pb-6 pt-4">

            {/* Title */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Title (optional)
              </label>
              <div className="mt-1">
                <Input
                  value={furnitureCustomTitle}
                  onChange={(e) => {
                    setFurnitureCustomTitle(e.target.value);
                    if (e.target.value && furnitureCustomTitleError) setFurnitureCustomTitleError("");
                  }}
                  placeholder="Enter title"
                  className="h-10 text-sm bg-background"
                />
              </div>
              {furnitureCustomTitleError && (
                <p className="mt-1 text-xs text-red-500">{furnitureCustomTitleError}</p>
              )}
            </div>

            {/* Product Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Product Type (optional)
              </label>
              <div className="mt-1">
                <Select
                  value={furnitureTitle}
                  onValueChange={(val) => {
                    setFurnitureTitle(val);
                    if (val && furnitureTitleError) setFurnitureTitleError("");

                    const normTitle = val.trim().toLowerCase();
                    const isKitchen = normTitle.includes("kitchen");
                    const isWardrobe = normTitle.includes("wardrobe");

                    const validStructures = allProductStructures.filter((ps) => {
                      const normType = ps.type.trim().toLowerCase();
                      if (isKitchen) return normType.includes("kitchen");
                      if (isWardrobe) return normType.includes("wardrobe");
                      return normType === "others";
                    });

                    const isCurrentValid = validStructures.some(
                      (ps) => ps.id.toString() === furnitureStructureId
                    );

                    if (!isCurrentValid) {
                      if (validStructures.length === 1) {
                        setFurnitureStructureId(validStructures[0].id.toString());
                      } else {
                        setFurnitureStructureId("");
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-10 bg-background text-sm">
                    <SelectValue placeholder="Select Product Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {allProductTypes.map((pt) => (
                      <SelectItem key={pt.id} value={pt.type}>
                        {pt.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {furnitureTitleError && (
                <p className="mt-1 text-xs text-red-500">{furnitureTitleError}</p>
              )}
            </div>

            {/* Product Structure */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Product Structure (optional)
              </label>
              <div className="mt-1">
                <Select
                  value={furnitureStructureId || undefined}
                  onValueChange={(v) => {
                    setFurnitureStructureId(v);
                    if (v && furnitureStructureError) setFurnitureStructureError("");
                  }}
                >
                  <SelectTrigger className="w-full h-10 bg-background text-sm">
                    <SelectValue placeholder="Select Structure Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {filteredProductStructures.map((ps) => (
                      <SelectItem key={ps.id} value={ps.id.toString()}>
                        {ps.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {furnitureStructureError && (
                <p className="mt-1 text-xs text-red-500">{furnitureStructureError}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Description (optional)
              </label>
              <textarea
                value={furnitureDescription}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) setFurnitureDescription(e.target.value);
                }}
                placeholder="Add description..."
                rows={4}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
              <p className="text-right text-xs text-muted-foreground mt-0.5">
                {1000 - furnitureDescription.length} characters left
              </p>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFurnitureOpen(false);
                  setFurnitureTitleError("");
                  setFurnitureStructureError("");
                  setFurnitureCustomTitleError("");
                  setEditingIndex(null);
                }}
                disabled={submittingFurniture}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingFurniture}>
                {submittingFurniture ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </BaseModal>

      {/* Product Type Edit Modal */}
      <BaseModal
        open={editProductTypeOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditProductTypeOpen(false);
            if (vendorId === 1 || lead?.vendor_id === 1) {
              const ids = (lead?.product_types || []).map((label: string) => {
                return allProductTypes.find((t: any) => t.type === label)?.id;
              }).filter((val): val is number => val !== undefined);
              setSelectedProductTypeIds(ids);
            } else {
              setSelectedProductTypeId(currentProductTypeId);
            }
          }
        }}
        title={
          (vendorId === 1 || lead?.vendor_id === 1)
            ? (lead?.product_types?.length ? "Edit Product Types" : "Set Product Types")
            : (currentProductTypeId ? "Edit Product Type" : "Set Product Type")
        }
        description="Select the product type for this lead."
        size="sm"
      >
        <div className="space-y-4 p-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Product Type <span className="text-red-500">*</span>
            </label>
            <div className={`mt-2 ${(vendorId === 1 || lead?.vendor_id === 1) ? "pb-44" : ""}`}>
              {vendorId === 1 || lead?.vendor_id === 1 ? (
                <MultipleSelector
                  value={
                    selectedProductTypeIds
                      .map(id => {
                        const opt = allProductTypes.find((t: any) => t.id === id);
                        return opt ? { value: String(opt.id), label: opt.type } : null;
                      })
                      .filter((val): val is Option => val !== null)
                  }
                  onChange={(options) => {
                    setSelectedProductTypeIds(options.map((opt) => Number(opt.value)));
                  }}
                  defaultOptions={
                    allProductTypes.map((t: any) => ({
                      value: String(t.id),
                      label: t.type,
                    }))
                  }
                  placeholder="Select product types..."
                  emptyIndicator={
                    <p className="text-center text-xs leading-5 text-muted-foreground">
                      No results found.
                    </p>
                  }
                  maxSelected={10}
                />
              ) : (
                <AssignToPicker
                  data={
                    allProductTypes.map((t: any) => ({
                      id: t.id,
                      label: t.type,
                    })) ?? []
                  }
                  value={selectedProductTypeId ?? undefined}
                  onChange={(id) => setSelectedProductTypeId(id)}
                  placeholder="Search product type..."
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditProductTypeOpen(false)}
              disabled={updatingLeadType}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveProductType}
              disabled={updatingLeadType}
            >
              {updatingLeadType ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Product Type Confirm Dialog */}
      <AlertDialog
        open={confirmProductTypeSave}
        onOpenChange={setConfirmProductTypeSave}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {(vendorId === 1 || lead?.vendor_id === 1)
                ? (lead?.product_types?.length ? "Confirm Product Types Change?" : "Set Product Types?")
                : (currentProductTypeId ? "Confirm Product Type Change?" : "Set Product Type?")
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(vendorId === 1 || lead?.vendor_id === 1)
                ? (lead?.product_types?.length ? "This will update the product types for this lead." : "This will set the product types for this lead.")
                : (currentProductTypeId ? "This will update the product type for this lead." : "This will set the product type for this lead.")
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingLeadType}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmProductTypeSave}
              disabled={updatingLeadType}
            >
              {updatingLeadType ? "Saving..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Store Modal */}
      <Dialog open={isStoreOpen} onOpenChange={setIsStoreOpen}>
        <DialogContent className="max-w-md bg-card border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Assign Store
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Select the store and optionally choose a caller for this lead.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStoreSubmit} className="space-y-5 mt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Store <span className="text-red-500">*</span></label>
              <Select
                value={assignStoreId || undefined}
                onValueChange={(val) => {
                  setAssignStoreId(val);
                  setRequiresCallerSelect(false);
                  setSelectedStoreCaller("");
                }}
              >
                <SelectTrigger className="w-full h-10 bg-background text-sm">
                  <SelectValue placeholder="Select Store" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  {stores.filter((s) => {
                    const name = (s.franchise_name || "").replace(/vloq|furnix/gi, "").trim().toLowerCase();
                    return name !== "b2b";
                  }).map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.franchise_name.replace(/vloq|furnix/gi, "").trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {requiresCallerSelect && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Select Store Caller <span className="text-red-500">*</span></label>
                <Select
                  value={selectedStoreCaller || "none"}
                  onValueChange={(val) => setSelectedStoreCaller(val === "none" ? "" : val)}
                >
                  <SelectTrigger className="w-full h-10 bg-background text-sm">
                    <SelectValue placeholder="Select Caller" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    <SelectItem value="none">-- Select Caller --</SelectItem>
                    {storeCallers.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {assignStoreId && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Expected Visit Date (Optional)</label>
                <CustomeDatePicker
                  value={visitDate}
                  onChange={(val) => setVisitDate(val || "")}
                  restriction="futureOnly"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Remark (Optional)</label>
              <Textarea
                placeholder="Enter assignment remark..."
                value={storeRemark}
                onChange={(e) => setStoreRemark(e.target.value)}
                className="h-20 resize-none text-sm bg-background"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1 pb-2">
              <Checkbox
                id="markStoreVisitDone"
                checked={markStoreVisitDone}
                disabled={!isTodayOrPast}
                onCheckedChange={(checked) => setMarkStoreVisitDone(!!checked)}
              />
              <label
                htmlFor="markStoreVisitDone"
                className={`text-xs font-semibold cursor-pointer select-none ${!isTodayOrPast ? "text-muted-foreground/60 cursor-not-allowed" : "text-foreground"}`}
              >
                Mark as Store Visit Done
              </label>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsStoreOpen(false);
                  setAssignStoreId("");
                  setStoreRemark("");
                  setSelectedStoreCaller("");
                  setRequiresCallerSelect(false);
                  setMarkStoreVisitDone(false);
                  setVisitDate("");
                }}
                className="h-10 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingStore || (!assignStoreId) || (requiresCallerSelect && !selectedStoreCaller)}
                className="h-10 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold rounded-xl"
              >
                {submittingStore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Assign Store
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

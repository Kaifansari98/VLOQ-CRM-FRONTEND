"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
import BaseModal from "@/components/utils/baseModal";
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
  leads_name: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  contact: string;
  alt_contact_no: string | null;
  source: string;
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

  const [lead, setLead] = useState<OnlineLead | null>(null);
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
  const [storePreference, setStorePreference] = useState("");
  const [preferredStoreId, setPreferredStoreId] = useState("");
  const [submittingCall, setSubmittingCall] = useState(false);

  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [assignStoreId, setAssignStoreId] = useState("");
  const [storeRemark, setStoreRemark] = useState("");
  const [storeCallers, setStoreCallers] = useState<Telecaller[]>([]);
  const [selectedStoreCaller, setSelectedStoreCaller] = useState("");
  const [requiresCallerSelect, setRequiresCallerSelect] = useState(false);
  const [submittingStore, setSubmittingStore] = useState(false);

  // Reassign modal state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [telecallers, setTelecallers] = useState<any[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [assignRemark, setAssignRemark] = useState("");
  const [assigning, setAssigning] = useState(false);

  const canAssign = useMemo(() => {
    return userType === "super-admin" || userType === "admin" || userType === "telecaller team lead" || userType === "telecaller-team-lead" || userType === "sales admin" || userType === "sales-admin";
  }, [userType]);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
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
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [sourceTypes, setSourceTypes] = useState<{ id: number; type: string }[]>([]);
  const [siteTypes, setSiteTypes] = useState<{ id: number; type: string }[]>([]);

  // Furniture Structure modal state
  const [isFurnitureOpen, setIsFurnitureOpen] = useState(false);
  const [furnitureTitle, setFurnitureTitle] = useState("");
  const [furnitureStructureId, setFurnitureStructureId] = useState("");
  const [furnitureDescription, setFurnitureDescription] = useState("");
  const [furnitureTitleError, setFurnitureTitleError] = useState("");
  const [furnitureStructureError, setFurnitureStructureError] = useState("");
  const [allProductTypes, setAllProductTypes] = useState<{ id: number; type: string }[]>([]);
  const [allProductStructures, setAllProductStructures] = useState<{ id: number; type: string }[]>([]);
  const [submittingFurniture, setSubmittingFurniture] = useState(false);
  // Keep these for edit modal product type/structure arrays
  const [editProductTypes, setEditProductTypes] = useState<string[]>([]);
  const [editProductStructures, setEditProductStructures] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
      items.push({
        index: i,
        title: types[i] || "—",
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
        if (Array.isArray(res.data)) {
          setStores(res.data);
        } else if (res.data?.data) {
          setStores(res.data.data);
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

    if (isFollowUpDateRequired && !followUpDate) {
      toastManager.add({ title: "Next follow-up date is required for this status.", type: "error" });
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
        store_preference_option: storePreference || undefined,
        store_id: preferredStoreId ? Number(preferredStoreId) : undefined,
      });

      if (res.data?.success) {
        setIsCallOpen(false);
        setCallStatus("");
        setCallDurationMin("");
        setCallDurationSec("");
        setCallRemark("");
        setFollowUpDate("");
        setStorePreference("");
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

  // Edit lead form submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editContact.trim()) {
      toastManager.add({ title: "Name and Contact are required.", type: "error" });
      return;
    }
    setSubmittingEdit(true);
    try {
      const res = await apiClient.patch(`/online-leads/${id}`, {
        leads_name: editName.trim(),
        email: editEmail.trim() || null,
        contact: editContact.trim(),
        alt_contact_no: editAltContact.trim() || null,
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

  // Furniture Structure save
  const handleFurnitureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!furnitureTitle.trim()) {
      setFurnitureTitleError("Title is required.");
      valid = false;
    }
    if (!furnitureStructureId) {
      setFurnitureStructureError("Please select a structure.");
      valid = false;
    }
    if (!valid) return;

    const selectedStructure = allProductStructures.find(
      (s) => s.id.toString() === furnitureStructureId
    );
    if (!selectedStructure) return;

    setSubmittingFurniture(true);
    try {
      const currentStructures = lead?.product_structures || [];
      const currentTypes = lead?.product_types || [];
      
      let newStructures = [];
      let newTypes = [];
      
      if (editingIndex !== null) {
        newStructures = [...currentStructures];
        newTypes = [...currentTypes];
        newStructures[editingIndex] = selectedStructure.type;
        newTypes[editingIndex] = furnitureTitle.trim();
      } else {
        newStructures = currentStructures.includes(selectedStructure.type)
          ? currentStructures
          : [...currentStructures, selectedStructure.type];
        newTypes = currentTypes.includes(furnitureTitle.trim())
          ? currentTypes
          : [...currentTypes, furnitureTitle.trim()];
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
    if (!assigneeId) return;

    setAssigning(true);
    try {
      const res = await apiClient.put(`/online-leads/${id}/assign`, {
        assign_to: assigneeId,
        remark: assignRemark,
        created_by: userId,
      });

      if (res.data?.success) {
        setIsAssignOpen(false);
        setAssigneeId("");
        setAssignRemark("");
        fetchLeadDetails();
        toastManager.add({ title: "Lead reassigned successfully", type: "success" });
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
                <BreadcrumbLink href="/dashboard/online-leads">Lead Pool</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Lead ID #{lead.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCallOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 h-9"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Follow up
          </Button>

          {isConverted && userType !== "sales-executive" && (
            <Button
              size="sm"
              onClick={() => setIsStoreOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 h-9"
            >
              <Store className="w-3.5 h-3.5" /> Store Assignment
            </Button>
          )}

          <NotificationBell />
          <AnimatedThemeToggler />

          {/* ⋮ Dropdown */}
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
              <DropdownMenuItem
                onClick={() => {
                  if (!lead) return;
                  setEditName(lead.leads_name || "");
                  setEditEmail(lead.email || "");
                  setEditContact(lead.contact || "");
                  setEditAltContact(lead.alt_contact_no || "");
                  setEditSiteAddress(lead.site_address || "");
                  setEditRemark(lead.remark || "");
                  setEditPriority(lead.priority || "");
                  setEditSourceId(lead.sourceRelation?.id?.toString() || "");
                  setEditSiteTypeId(lead.siteTypeRelation?.id?.toString() || "");
                  setEditArchName(lead.archetech_name || "");
                  setEditArchNumber(lead.archetech_number || "");
                  setEditReferedBy(lead.refered_by || "");
                  setIsEditOpen(true);
                }}
              >
                <PencilLine className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              {canAssign && (
                <DropdownMenuItem
                  onClick={() => {
                    if (lead) {
                      if (lead.assignedTo) {
                        setAssigneeId(lead.assignedTo.id.toString());
                      } else if (lead.finalAssignedLeads) {
                        setAssigneeId(lead.finalAssignedLeads.id.toString());
                      }
                    }
                    setIsAssignOpen(true);
                  }}
                >
                  <Users className="w-4 h-4 mr-2" /> Reassign Lead
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-background">
        {/* Tabbed Layout matching Draft Leads */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="mb-3 h-auto gap-2 px-1.5 py-1.5">
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
            <TabsTrigger value="stores">
              <Store size={16} className="mr-1 opacity-60" />
              Store Movements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0 space-y-6">
            {/* Lead Identity Summary Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Lead Details</h2>
                <p className="text-sm text-muted-foreground mt-0.5">All the Lead Related Details Which has been filled during onboard.</p>
              </div>
              <div className="flex flex-col items-start md:items-end">
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
                  <Button
                    size="sm"
                    onClick={() => {
                      setFurnitureTitle("");
                      setFurnitureStructureId("");
                      setFurnitureDescription("");
                      setFurnitureTitleError("");
                      setFurnitureStructureError("");
                      setEditingIndex(null);
                      setIsFurnitureOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Furniture Structure
                  </Button>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <Package className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Product Types</p>
                      <p className="text-[15px] font-semibold text-foreground mt-0.5">
                        {lead.product_types?.length > 0 ? lead.product_types.join(", ") : "—"}
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
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      className="text-muted-foreground/70 hover:text-foreground inline-flex size-7 items-center justify-center rounded-md border border-transparent transition-[color,box-shadow] outline-none"
                                      onClick={() => {
                                        setEditingIndex(item.index);
                                        setFurnitureTitle(item.title);
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
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-5">Additional Information</h3>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-muted-foreground font-medium">Design Remarks</p>
                    <div className="mt-2 p-4 rounded-lg border bg-muted/10 min-h-[60px]">
                      <p className="text-[15px] text-foreground">{lead.remark || "N/A"}</p>
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
                        {lead.franchise?.franchise_name || "No Store Selected"}
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
                  {lead.follow_up_date && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Next Follow-Up</p>
                        <p className="text-[15px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                          {new Date(lead.follow_up_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
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
                                  <MapPin className="w-3 h-3" /> {hist.franchise.franchise_name}
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50">
                                {hist.status.status_name}
                              </span>
                            </div>
                          </div>

                          {/* Main message */}
                          <div className="space-y-1.5">
                            <p className="text-sm text-foreground font-medium leading-relaxed">
                              {hist.remark || `Status updated to ${hist.status.status_name}`}
                            </p>
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

          <TabsContent value="stores" className="mt-0">
            <Card className="shadow border w-full">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Store className="w-5 h-5 text-slate-800 dark:text-slate-200" /> Store Movements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto">
                {lead.store_logs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm italic">
                    No store logs registered.
                  </div>
                ) : (
                  <div className="divide-y">
                    {lead.store_logs.map((log) => (
                      <div key={log.id} className="p-3 space-y-1 text-xs">
                        <div className="flex justify-between items-center flex-wrap">
                          <span className="font-bold text-foreground">
                            {log.action_type === "PREFERENCE"
                              ? "First Preference"
                              : log.action_type === "ASSIGNED"
                              ? "Assigned Store"
                              : "Transferred"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {log.fromFranchise ? `${log.fromFranchise.franchise_name} ➔ ` : ""}
                          <span className="font-semibold text-foreground">{log.toFranchise.franchise_name}</span>
                        </p>
                        {log.remark && <p className="text-[11px] text-slate-700 dark:text-slate-300 italic">Remark: {log.remark}</p>}
                        <div className="text-[10px] text-muted-foreground flex justify-between pt-0.5">
                          <span>By: {log.selectedBy.user_name}</span>
                          {log.assignedTo && <span>Assigned Caller: {log.assignedTo.user_name}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
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
              <div className={isFollowUpDateRequired ? "col-span-1 space-y-1.5" : "col-span-2 space-y-1.5"}>
                <label className="text-xs font-semibold text-foreground">New Status Outcome</label>
                <Select
                  value={callStatus}
                  onValueChange={(val) => setCallStatus(val)}
                >
                  <SelectTrigger className="w-full h-10 bg-background text-sm">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {statuses.map((st) => (
                      <SelectItem key={st.id} value={st.id.toString()}>
                        {st.status_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isFollowUpDateRequired && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Next Follow-up Date (Mandatory)
                  </label>
                  <CustomeDatePicker
                    value={followUpDate}
                    onChange={(val) => setFollowUpDate(val || "")}
                    restriction="futureOnly"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={storePreference === "Another Store" ? "col-span-1 space-y-1.5" : "col-span-2 space-y-1.5"}>
                <label className="text-xs font-semibold text-foreground">Store Preference</label>
                <Select
                  value={
                    storePreference === "" || storePreference === "No Preference"
                      ? "none"
                      : storePreference
                  }
                  onValueChange={(val) =>
                    setStorePreference(val === "none" ? "No Preference" : val)
                  }
                >
                  <SelectTrigger className="w-full h-10 bg-background text-sm">
                    <SelectValue placeholder="No preference" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    <SelectItem value="none">No preference</SelectItem>
                    <SelectItem value="Current Store">Current Store</SelectItem>
                    <SelectItem value="Another Store">Another Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {storePreference === "Another Store" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Select Store</label>
                  <Select
                    value={preferredStoreId}
                    onValueChange={(val) => setPreferredStoreId(val)}
                  >
                    <SelectTrigger className="w-full h-10 bg-background text-sm">
                      <SelectValue placeholder="Select Store" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.franchise_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Call Log Remark</label>
              <Input
                placeholder="Log notes about what was discussed..."
                value={callRemark}
                onChange={(e) => setCallRemark(e.target.value)}
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

      {/* Assign Store Modal */}
      <BaseModal
        open={isStoreOpen}
        onOpenChange={setIsStoreOpen}
        title="Assign Lead to Store"
        description="Assign or transfer this lead to a physical store location and trigger caller auto-assignment rules."
        size="md"
      >
        <form onSubmit={handleStoreSubmit} className="space-y-4 px-6 pb-6 pt-4">
            {!requiresCallerSelect ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Select Store</label>
                  <Select
                    value={assignStoreId}
                    onValueChange={(val) => setAssignStoreId(val)}
                  >
                    <SelectTrigger className="w-full h-10 bg-background text-sm">
                      <SelectValue placeholder="Choose Store" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.franchise_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Transfer / Assignment Remark</label>
                  <Input
                    placeholder="E.g., Customer ready for design meeting at store..."
                    value={storeRemark}
                    onChange={(e) => setStoreRemark(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                  There is no registered Store Admin (Manager) for this location and multiple callers exist. Please manually allocate the lead to a specific caller:
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Select Caller</label>
                  <Select
                    value={selectedStoreCaller}
                    onValueChange={(val) => setSelectedStoreCaller(val)}
                  >
                    <SelectTrigger className="w-full h-10 bg-background text-sm">
                      <SelectValue placeholder="-- Select Caller --" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground">
                      {storeCallers.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              {requiresCallerSelect && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRequiresCallerSelect(false)}
                  className="h-9 text-xs mr-auto"
                >
                  Back
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStoreOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingStore}
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submittingStore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {requiresCallerSelect ? "Assign Caller" : "Assign Store"}
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" /> Select Assignee (Sales Executive / Caller / Admin)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none z-10" />
                <Select
                  value={assigneeId}
                  onValueChange={(val) => setAssigneeId(val)}
                >
                  <SelectTrigger className="w-full h-10 pl-9 pr-10 rounded-xl border border-input bg-background/50 hover:bg-background/85 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition duration-200 cursor-pointer text-sm text-foreground focus:outline-none">
                    <SelectValue placeholder="Choose User" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {telecallers.map((tc) => (
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

      {/* Edit Lead Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Lead</DialogTitle>
            <DialogDescription className="text-xs">
              Update lead details below. Name and Contact are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-5 py-2">

            {/* Contact Info */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Full Name <span className="text-red-500">*</span></label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Customer full name" className="h-10 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Phone Number <span className="text-red-500">*</span></label>
                  <Input value={editContact} onChange={(e) => setEditContact(e.target.value)} placeholder="10-digit mobile" className="h-10 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@example.com" type="email" className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Alternate Contact</label>
                  <Input value={editAltContact} onChange={(e) => setEditAltContact(e.target.value)} placeholder="Alternate phone" className="h-10 text-sm" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Site Address</label>
                  <Input value={editSiteAddress} onChange={(e) => setEditSiteAddress(e.target.value)} placeholder="Site / project address" className="h-10 text-sm" />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Project Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Source</label>
                  <Select value={editSourceId || "none"} onValueChange={(v) => setEditSourceId(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-10 text-sm bg-background">
                      <SelectValue placeholder="-- Select Source --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Source --</SelectItem>
                      {sourceTypes.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Site Type</label>
                  <Select value={editSiteTypeId || "none"} onValueChange={(v) => setEditSiteTypeId(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-10 text-sm bg-background">
                      <SelectValue placeholder="-- Select Site Type --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Site Type --</SelectItem>
                      {siteTypes.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Priority</label>
                  <Select value={editPriority || "none"} onValueChange={(v) => setEditPriority(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-10 text-sm bg-background">
                      <SelectValue placeholder="-- Select Priority --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Priority --</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Referred By</label>
                  <Input value={editReferedBy} onChange={(e) => setEditReferedBy(e.target.value)} placeholder="Reference name" className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Architect Name</label>
                  <Input value={editArchName} onChange={(e) => setEditArchName(e.target.value)} placeholder="Architect / designer name" className="h-10 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Architect Contact</label>
                  <Input value={editArchNumber} onChange={(e) => setEditArchNumber(e.target.value)} placeholder="Architect phone" className="h-10 text-sm" />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Design Remarks</label>
              <textarea
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                placeholder="Any design or project remarks..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingEdit}
                className="h-9 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold"
              >
                {submittingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={furnitureTitle}
                onChange={(e) => {
                  setFurnitureTitle(e.target.value);
                  if (furnitureTitleError) setFurnitureTitleError("");
                }}
                placeholder="Enter title"
                className="mt-1"
              />
              {furnitureTitleError && (
                <p className="mt-1 text-xs text-red-500">{furnitureTitleError}</p>
              )}
            </div>

            {/* Product Structure */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Product Structure <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <Select
                  value={furnitureStructureId || "none"}
                  onValueChange={(v) => {
                    const val = v === "none" ? "" : v;
                    setFurnitureStructureId(val);
                    if (val && furnitureStructureError) setFurnitureStructureError("");
                  }}
                >
                  <SelectTrigger className="w-full h-10 bg-background text-sm">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    <SelectItem value="none">Select an option</SelectItem>
                    {allProductStructures.map((ps) => (
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
    </>
  );
}

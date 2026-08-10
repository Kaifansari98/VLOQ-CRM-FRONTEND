"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, UserPlus, PlusCircle, PhoneCall, Calendar, MapPin, Loader2, ChevronDown, User, Mail, Phone, MessageSquare } from "lucide-react";
import Link from "next/link";

interface OnlineLead {
  id: number;
  leads_name: string;
  email: string | null;
  contact: string;
  source: string;
  lead_entry_type: "ONLINE" | "WALK_IN";
  created_at: string;
  assign_to: number | null;
  status: number | null;
  remark: string | null;
  follow_up_date: string | null;
  store_id: number | null;
  final_assigned_leads: number | null;
  assignedTo?: {
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
}

interface FollowupStatus {
  id: number;
  status_name: string;
  followup_required: boolean;
}

interface Store {
  id: number;
  franchise_name: string;
}

interface Telecaller {
  id: number;
  user_name: string;
}

export default function OnlineLeadsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id;
  const userId = user?.id;
  const userType = user?.user_type?.user_type?.toLowerCase() || "";
  const userFranchiseId = user?.franchise_id;
  const isSuperAdminOrAdmin = userType === "super-admin" || userType === "admin" || userType === "sales admin" || userType === "sales-admin";

  const [leads, setLeads] = useState<OnlineLead[]>([]);
  const [statuses, setStatuses] = useState<FollowupStatus[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [telecallers, setTelecallers] = useState<Telecaller[]>([]);
  
  const [activeTab, setActiveTab] = useState<"pool" | "my" | "overall">("my");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [assigneeId, setAssigneeId] = useState("");
  const [assignRemark, setAssignRemark] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInEmail, setWalkInEmail] = useState("");
  const [walkInContact, setWalkInContact] = useState("");
  const [walkInRemark, setWalkInRemark] = useState("");
  const [walkInStore, setWalkInStore] = useState("");
  const [walkInCallers, setWalkInCallers] = useState<any[]>([]);
  const [selectedWalkInCaller, setSelectedWalkInCaller] = useState("");
  const [creatingWalkIn, setCreatingWalkIn] = useState(false);

  // Set default tab based on role
  useEffect(() => {
    if (userType === "telecaller") {
      setActiveTab("my");
    } else if (userType === "store-manager" || userType === "store manager") {
      setActiveTab("overall");
    } else {
      setActiveTab("pool");
    }
  }, [userType]);

  // Fetch initial setup lists (statuses, stores, telecallers)
  useEffect(() => {
    if (!vendorId) return;

    // Fetch Statuses
    apiClient
      .get(`/online-leads/statuses?vendor_id=${vendorId}`)
      .then((res) => {
        if (res.data?.success) setStatuses(res.data.data);
      })
      .catch(console.error);

    // Fetch Stores (Franchises)
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

    // Fetch Telecallers for assignment
    apiClient
      .get(`/online-leads/telecallers?vendor_id=${vendorId}`)
      .then((res) => {
        if (res.data?.success) setTelecallers(res.data.data);
      })
      .catch(console.error);
  }, [vendorId]);

  // Fetch leads based on active tab & filters
  const fetchLeadsData = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      let url = `/online-leads?vendor_id=${vendorId}&tab=${activeTab}`;
      if (userId) url += `&userId=${userId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status_id=${statusFilter}`;
      if (storeFilter) url += `&store_id=${storeFilter}`;

      const res = await apiClient.get(url);
      if (res.data?.success) {
        setLeads(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch online leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsData();
  }, [vendorId, activeTab, search, statusFilter, storeFilter]);

  // Retrieve callers list for walk-in store selection
  useEffect(() => {
    const storeToFetch = walkInStore || userFranchiseId;
    if (!storeToFetch) return;

    apiClient
      .get(`/online-leads/store/${storeToFetch}/callers`)
      .then((res) => {
        if (res.data?.success) {
          setWalkInCallers(res.data.data);
          // Auto select single caller if exists
          if (res.data.data.length === 1) {
            setSelectedWalkInCaller(res.data.data[0].id.toString());
          } else {
            setSelectedWalkInCaller("");
          }
        }
      })
      .catch(console.error);
  }, [walkInStore, userFranchiseId]);

  // Lead Assign Action
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !assigneeId) return;

    setAssigning(true);
    try {
      const res = await apiClient.put(`/online-leads/${selectedLeadId}/assign`, {
        assign_to: assigneeId,
        remark: assignRemark,
        created_by: userId,
      });

      if (res.data?.success) {
        setIsAssignOpen(false);
        setSelectedLeadId(null);
        setAssigneeId("");
        setAssignRemark("");
        fetchLeadsData();
      }
    } catch (err) {
      console.error("Assignment error:", err);
    } finally {
      setAssigning(false);
    }
  };

  // Add Walk-In Customer Action
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalStoreId = walkInStore || userFranchiseId;

    if (!walkInName || !walkInContact || !finalStoreId) {
      alert("Name, Contact and Store are required fields.");
      return;
    }

    if (walkInContact.length < 10) {
      alert("Contact number must be exactly 10 digits.");
      return;
    }

    setCreatingWalkIn(true);
    try {
      const res = await apiClient.post("/online-leads/walk-in", {
        vendor_id: vendorId,
        leads_name: walkInName,
        email: walkInEmail,
        contact: walkInContact,
        store_id: Number(finalStoreId),
        remark: walkInRemark,
        created_by: userId,
        selected_caller_id: selectedWalkInCaller || undefined,
      });

      if (res.data?.success) {
        setIsWalkInOpen(false);
        setWalkInName("");
        setWalkInEmail("");
        setWalkInContact("");
        setWalkInRemark("");
        setWalkInStore("");
        setSelectedWalkInCaller("");
        fetchLeadsData();
      }
    } catch (err) {
      console.error("Walk-in creation error:", err);
    } finally {
      setCreatingWalkIn(false);
    }
  };

  // Check privileges
  const canAssign = userType === "super-admin" || userType === "admin" || userType === "telecaller team lead" || userType === "telecaller-team-lead";
  const canAddWalkIn = userType === "store-manager" || userType === "store manager" || userType === "super-admin" || userType === "admin";

  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-card">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">CRM</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Online Leads</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Online & Walk-In Leads
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage unassigned lead pools, caller allocations, and converted store leads.
            </p>
          </div>

          {canAddWalkIn && (
            <Button
              onClick={() => setIsWalkInOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold flex items-center gap-2 transition duration-200"
            >
              <PlusCircle className="w-5 h-5" /> Add Walk-In Customer
            </Button>
          )}
        </div>

        {/* Dashboard Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-2 rounded-xl border">
          <div className="flex items-center gap-1 bg-background border p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("pool")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition ${
                activeTab === "pool" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm" : "hover:bg-muted"
              }`}
            >
              Lead Pool (Unassigned)
            </button>
            {!isSuperAdminOrAdmin && (
              <button
                onClick={() => setActiveTab("my")}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition ${
                  activeTab === "my" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm" : "hover:bg-muted"
                }`}
              >
                My Leads
              </button>
            )}
            <button
              onClick={() => setActiveTab("overall")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition ${
                activeTab === "overall" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm" : "hover:bg-muted"
              }`}
            >
              Overall Leads
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, phone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-full md:w-64 bg-background"
              />
            </div>

            <Select
              value={statusFilter || "ALL_STATUSES"}
              onValueChange={(val) => setStatusFilter(val === "ALL_STATUSES" ? "" : val)}
            >
              <SelectTrigger className="h-9 w-[150px] bg-background text-xs font-semibold rounded-lg border border-input shadow-sm hover:bg-muted/30 transition">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_STATUSES">All Statuses</SelectItem>
                {statuses.map((st) => (
                  <SelectItem key={st.id} value={st.id.toString()}>
                    {st.status_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={storeFilter || "ALL_STORES"}
              onValueChange={(val) => setStoreFilter(val === "ALL_STORES" ? "" : val)}
            >
              <SelectTrigger className="h-9 w-[150px] bg-background text-xs font-semibold rounded-lg border border-input shadow-sm hover:bg-muted/30 transition">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_STORES">All Stores</SelectItem>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.franchise_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Leads Table Card */}
        <Card className="shadow-lg border">
          <CardHeader className="border-b bg-card/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Leads ({leads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-3">
                <Loader2 className="w-8 h-8 text-slate-800 dark:text-slate-200 animate-spin" />
                <p className="text-muted-foreground text-sm font-medium">Fetching leads details...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center p-16">
                <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-4 border">
                  <PhoneCall className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No leads found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-1 text-sm">
                  There are no leads in this category matching your filters.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm border-collapse text-left">
                <thead>
                  <tr className="bg-muted/50 border-b text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <th className="p-4">Lead Info</th>
                    <th className="p-4">Contact Details</th>
                    <th className="p-4">Source & Entry</th>
                    <th className="p-4">Assigned Store</th>
                    <th className="p-4">Status & Remark</th>
                    <th className="p-4">Allocation</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-muted/20 transition cursor-pointer"
                    >
                      <td className="p-4">
                        <Link href={`/dashboard/online-leads/details/${lead.id}`}>
                          <div>
                            <span className="font-semibold text-foreground text-sm block hover:underline">
                              {lead.leads_name}
                            </span>
                            <span className="text-xs text-muted-foreground block mt-0.5">
                              ID: #{lead.id} • Recd: {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-foreground block">{lead.contact}</span>
                        {lead.email && <span className="text-xs text-muted-foreground block mt-0.5">{lead.email}</span>}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-foreground border inline-block">
                          {lead.source}
                        </span>
                        <span className="text-xs text-muted-foreground block mt-1">
                          Type: {lead.lead_entry_type}
                        </span>
                      </td>
                      <td className="p-4">
                        {lead.franchise ? (
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            {lead.franchise.franchise_name}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not Selected</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50 inline-block mb-1">
                          {lead.followupStatus?.status_name || "New Lead"}
                        </span>
                        {lead.remark && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs block" title={lead.remark}>
                            {lead.remark}
                          </p>
                        )}
                        {lead.follow_up_date && (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" /> F/Up: {new Date(lead.follow_up_date).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {lead.assignedTo ? (
                          <div>
                            <span className="font-semibold text-foreground text-xs block">
                              {lead.assignedTo.user_name}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Active Caller
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/online-leads/details/${lead.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              Manage
                            </Button>
                          </Link>

                          {canAssign && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeadId(lead.id);
                                if (lead.assign_to) {
                                  setAssigneeId(lead.assign_to.toString());
                                }
                                setIsAssignOpen(true);
                              }}
                              size="sm"
                              className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950"
                            >
                              <UserPlus className="w-3.5 h-3.5 mr-1" /> Allocate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Allocation / Assignment Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assign Online Lead
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
                    <SelectValue placeholder="-- Choose User --" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
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

      {/* Add Walk-In Customer Dialog */}
      <Dialog open={isWalkInOpen} onOpenChange={setIsWalkInOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Add Walk-In Customer
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Log a manual entry for a customer who physically visited the store.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWalkInSubmit} className="space-y-5 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Customer Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                  <Input
                    required
                    placeholder="E.g., John Doe"
                    value={walkInName}
                    onChange={(e) => {
                      const value = e.target.value;
                      const filtered = value.replace(/[^A-Za-z\s]/g, "");
                      setWalkInName(filtered);
                    }}
                    className="pl-9 h-10 rounded-xl border border-input bg-background/50 hover:bg-background/85 focus-visible:ring-2 focus-visible:ring-slate-500/25 focus-visible:border-slate-500 transition duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> Contact Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                  <Input
                    required
                    placeholder="10-digit number"
                    value={walkInContact}
                    onChange={(e) => {
                      const value = e.target.value;
                      const filtered = value.replace(/[^0-9]/g, "");
                      if (filtered.length <= 10) {
                        setWalkInContact(filtered);
                      }
                    }}
                    className="pl-9 h-10 rounded-xl border border-input bg-background/50 hover:bg-background/85 focus-visible:ring-2 focus-visible:ring-slate-500/25 focus-visible:border-slate-500 transition duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="Optional email..."
                    value={walkInEmail}
                    onChange={(e) => setWalkInEmail(e.target.value)}
                    className="pl-9 h-10 rounded-xl border border-input bg-background/50 hover:bg-background/85 focus-visible:ring-2 focus-visible:ring-slate-500/25 focus-visible:border-slate-500 transition duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> Select Store (Walk-In Location)
                </label>
                {userFranchiseId && userType !== "super-admin" && userType !== "admin" ? (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                    <Input
                      disabled
                      value={stores.find((s) => s.id === userFranchiseId)?.franchise_name || "Current Store"}
                      className="pl-9 h-10 rounded-xl border border-input bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none z-10" />
                    <Select
                      value={walkInStore}
                      onValueChange={(val) => setWalkInStore(val)}
                    >
                      <SelectTrigger className="w-full h-10 pl-9 pr-10 rounded-xl border border-input bg-background/50 hover:bg-background/85 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition duration-200 cursor-pointer text-sm text-foreground focus:outline-none">
                        <SelectValue placeholder="-- Choose Store --" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
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
            </div>

            {walkInCallers.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-slate-500" /> Store Assignment (Admins: None, Callers: {walkInCallers.length}) - Select Caller
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none z-10" />
                  <Select
                    value={selectedWalkInCaller || "system"}
                    onValueChange={(val) => setSelectedWalkInCaller(val === "system" ? "" : val)}
                  >
                    <SelectTrigger className="w-full h-10 pl-9 pr-10 rounded-xl border border-input bg-background/50 hover:bg-background/85 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition duration-200 cursor-pointer text-sm text-foreground focus:outline-none">
                      <SelectValue placeholder="-- Let system decide (or leave unassigned) --" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
                      <SelectItem value="system">-- Let system decide (or leave unassigned) --</SelectItem>
                      {walkInCallers.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Initial Remark / Customer Query
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  placeholder="Walk-in detail or product requirements..."
                  value={walkInRemark}
                  onChange={(e) => setWalkInRemark(e.target.value)}
                  className="pl-9 h-10 rounded-xl border border-input bg-background/50 hover:bg-background/85 focus-visible:ring-2 focus-visible:ring-slate-500/25 focus-visible:border-slate-500 transition duration-200"
                />
              </div>
            </div>

            <DialogFooter className="mt-5 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsWalkInOpen(false)}
                className="h-10 text-xs rounded-xl border-input/60 hover:bg-muted/70"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingWalkIn}
                className="h-10 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold rounded-xl hover:shadow-lg hover:shadow-slate-500/10 active:scale-[0.98] transition-all"
              >
                {creatingWalkIn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Register Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

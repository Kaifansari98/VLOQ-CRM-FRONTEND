"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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
import { DataTable } from "@/components/data-table/data-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
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
import { Search, UserPlus, PlusCircle, PhoneCall, Calendar, MapPin, Loader2, ChevronDown, User, Mail, Phone, MessageSquare, Zap, Magnet, Activity, Building, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { GenerateLeadFormModal } from "@/components/sales-executive/Lead/leads-generation-form-modal";

interface OnlineLead {
  id: number;
  lead_code?: string | null;
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
  priority?: string | null;
  sourceRelation?: {
    id: number;
    type: string;
  } | null;
  siteTypeRelation?: {
    id: number;
    type: string;
  } | null;
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

  const canAssign = userType === "super-admin" || userType === "admin" || userType === "telecaller team lead" || userType === "telecaller-team-lead";
  const canAddWalkIn = userType === "store-manager" || userType === "store manager" || userType === "super-admin" || userType === "admin";

  const [leads, setLeads] = useState<OnlineLead[]>([]);
  const [statuses, setStatuses] = useState<FollowupStatus[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [telecallers, setTelecallers] = useState<Telecaller[]>([]);
  
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"pool" | "my" | "overall">("my");
  const requestIdRef = useRef(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");

  const [sorting, setSorting] = useState<any>([]);
  const [columnVisibility, setColumnVisibility] = useState<any>({});
  const [rowSelection, setRowSelection] = useState<any>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });



  const columns: ColumnDef<OnlineLead>[] = useMemo(() => [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lead Code" />
      ),
      cell: ({ row }) => (
        <Link href={`/dashboard/online-leads/details/${row.original.id}`}>
          <div className="font-medium text-foreground text-sm hover:underline">
            {row.original.lead_code || `ID: #${row.original.id}`}
            <span className="text-[10px] text-muted-foreground block mt-0.5 font-normal">
              Recd: {new Date(row.original.created_at).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "leads_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground text-sm">{row.original.leads_name}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact Details" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="font-normal text-foreground block">{row.original.contact}</span>
          {row.original.email && <span className="text-[11px] text-muted-foreground block mt-0.5">{row.original.email}</span>}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source & Entry" />
      ),
      cell: ({ row }) => {
        const sourceName = row.original.sourceRelation?.type || row.original.source || "N/A";
        return (
          <div>
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-foreground border inline-flex items-center gap-1">
              <Magnet className="w-3 h-3 text-slate-500" />
              {sourceName}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-1">
              Type: {row.original.lead_entry_type}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => {
        const value = row.original.priority || "";
        if (!value) return "—";

        const config: Record<string, { dot: string; pill: string }> = {
          High: {
            dot: "bg-red-500",
            pill: "bg-red-500/10 text-red-600 border-red-200",
          },
          Medium: {
            dot: "bg-orange-500",
            pill: "bg-orange-500/10 text-orange-600 border-orange-200",
          },
          Low: {
            dot: "bg-yellow-500",
            pill: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
          },
        };

        const style = config[value] ?? {
          dot: "bg-zinc-400",
          pill: "bg-zinc-100 text-zinc-600 border-zinc-200",
        };

        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.pill}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`}
            />
            {value}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "siteTypeRelation",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Site Type" />
      ),
      cell: ({ row }) => {
        const type = row.original.siteTypeRelation?.type || "—";
        if (type === "—") return "—";
        return (
          <span className="text-sm font-normal text-foreground inline-flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            {type}
          </span>
        );
      },
    },
    {
      accessorKey: "franchise",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assigned Store" />
      ),
      cell: ({ row }) => (
        row.original.franchise ? (
          <div className="flex items-center gap-1.5 text-foreground text-sm font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            {row.original.franchise.franchise_name}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Not Selected</span>
        )
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <div>
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50 inline-flex items-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            {row.original.followupStatus?.status_name || "New Lead"}
          </span>
          {row.original.follow_up_date && (
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5" /> F/Up: {new Date(row.original.follow_up_date).toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "remark",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Remark" />
      ),
      cell: ({ row }) => (
        row.original.remark ? (
          <p className="text-sm font-normal text-foreground truncate max-w-[200px]" title={row.original.remark}>
            {row.original.remark}
          </p>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )
      ),
    },
    {
      accessorKey: "allocation",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Allocation" />
      ),
      cell: ({ row }) => (
        row.original.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <div>
              <span className="font-medium text-foreground text-sm block">
                {row.original.assignedTo.user_name}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                Active Caller
              </span>
            </div>
          </div>
        ) : row.original.finalAssignedLeads ? (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <div>
              <span className="font-medium text-foreground text-sm block">
                {row.original.finalAssignedLeads.user_name}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                Active Caller
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Unassigned</span>
        )
      ),
    },
    {
      id: "actions",
      header: () => (
        <Button variant="ghost" size="sm" className="h-8 pointer-events-none justify-center text-center w-full font-medium text-foreground">
          Actions
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <Link href={`/dashboard/online-leads/details/${row.original.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
              Manage
            </Button>
          </Link>

          {canAssign && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLeadId(row.original.id);
                if (row.original.assign_to) {
                  setAssigneeId(row.original.assign_to.toString());
                } else if (row.original.final_assigned_leads) {
                  setAssigneeId(row.original.final_assigned_leads.toString());
                }
                setIsAssignOpen(true);
              }}
              size="sm"
              className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-medium"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" /> {row.original.assign_to || row.original.final_assigned_leads ? "Reallocate" : "Allocate"}
            </Button>
          )}
        </div>
      ),
    },
  ], [canAssign]);

  const table = useReactTable({
    data: leads,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
  });
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [assigneeId, setAssigneeId] = useState("");
  const [assignRemark, setAssignRemark] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [assignedToName, setAssignedToName] = useState("");

  const [isWalkInOpen, setIsWalkInOpen] = useState(false);

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
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    try {
      let url = `/online-leads?vendor_id=${vendorId}&tab=${activeTab}`;
      if (userId) url += `&userId=${userId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status_id=${statusFilter}`;
      if (storeFilter) url += `&store_id=${storeFilter}`;

      const res = await apiClient.get(url);
      if (currentRequestId === requestIdRef.current && res.data?.success) {
        setLeads(res.data.data);
      }
    } catch (err) {
      if (currentRequestId === requestIdRef.current) {
        console.error("Failed to fetch online leads:", err);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLeadsData();
  }, [vendorId, activeTab, search, statusFilter, storeFilter]);



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
        const assignedUser = telecallers.find((tc) => String(tc.id) === String(assigneeId));
        setAssignedToName(assignedUser ? assignedUser.user_name : "the Telecaller");
        setAssigneeId("");
        setAssignRemark("");
        fetchLeadsData();
        setIsSuccessOpen(true);
      }
    } catch (err) {
      console.error("Assignment error:", err);
    } finally {
      setAssigning(false);
    }
  };



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
                <BreadcrumbPage>Lead Pool</BreadcrumbPage>
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
            <h1 className="text-lg font-semibold text-foreground">
              Lead Pool
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage unassigned lead pools, caller allocations, and converted store leads.
            </p>
          </div>

          {canAddWalkIn && (
            <Button
              onClick={() => setIsWalkInOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 font-semibold flex items-center gap-2 transition duration-200"
            >
              <PlusCircle className="w-5 h-5" /> Add Lead
            </Button>
          )}
        </div>

        {/* Dashboard Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 mt-2">
          <button
            onClick={() => {
              setActiveTab("pool");
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className={`pb-2.5 px-4 text-sm font-semibold border-b-2 -mb-px transition duration-155 ${
              activeTab === "pool"
                ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Lead Pool
          </button>
          {!isSuperAdminOrAdmin && (
            <button
              onClick={() => {
                setActiveTab("my");
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className={`pb-2.5 px-4 text-sm font-semibold border-b-2 -mb-px transition duration-155 ${
                activeTab === "my"
                  ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100 font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              My Leads
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab("overall");
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className={`pb-2.5 px-4 text-sm font-semibold border-b-2 -mb-px transition duration-155 ${
              activeTab === "overall"
                ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overall Leads
          </button>
        </div>

        {/* Data Table */}
        <DataTable
          table={table}
          className="pt-2"
          showPagination={true}
          onRowDoubleClick={(row) => {
            router.push(`/dashboard/online-leads/details/${row.id}`);
          }}
        >
          {/* Header Action controls matching Draft Leads */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Input
                placeholder="Search name, phone, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className="h-9 w-full md:w-64 bg-background"
              />

              <Select
                value={storeFilter || "ALL_STORES"}
                onValueChange={(val) => {
                  setStoreFilter(val === "ALL_STORES" ? "" : val);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="h-9 w-[160px] bg-background text-xs font-semibold rounded-lg border shadow-sm">
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

            <div className="flex items-center gap-2">
              <DataTableViewOptions table={table} />
            </div>
          </div>
        </DataTable>
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
                    <SelectValue placeholder="Choose User" />
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

      {/* Generate Lead Form Modal (exact same form as Draft Leads) */}
      <GenerateLeadFormModal open={isWalkInOpen} onOpenChange={setIsWalkInOpen} mode="lead-pool" />
    </>
  );
}

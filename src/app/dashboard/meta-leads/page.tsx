"use client";

import React, { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Trash2,
  Eye,
  Download,
  Magnet,
  Sparkles,
  CheckCircle2,
  BadgeDollarSign,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
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

interface MetaLead {
  id: number;
  meta_lead_id: string;
  name: string;
  phone: string;
  email: string | null;
  form_name: string | null;
  form_id: string | null;
  created_date: string;
  lead_source: string;
  status: string;
}

export default function MetaLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<MetaLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    closed: 0,
  });

  // Delete lead state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch leads from backend
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === "all" ? "" : statusFilter;
      const res = await apiClient.get("/meta-leads", {
        params: {
          search,
          status: statusParam,
          page,
          limit: 10,
        },
      });

      if (res.data?.success) {
        setLeads(res.data.data.leads || []);
        setStats(res.data.data.stats || {
          total: 0,
          new: 0,
          contacted: 0,
          qualified: 0,
          converted: 0,
          closed: 0,
        });
        setTotalPages(res.data.data.pagination.totalPages || 1);
        setTotalRecords(res.data.data.pagination.totalRecords || 0);
      }
    } catch (err) {
      console.error("Error fetching Meta leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, page]);

  // Handle lead deletion
  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    setDeleting(true);
    try {
      const res = await apiClient.delete(`/meta-leads/${leadToDelete}`);
      if (res.data?.success) {
        setIsDeleteOpen(false);
        setLeadToDelete(null);
        fetchLeads();
      }
    } catch (err) {
      console.error("Error deleting lead:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Export leads as CSV
  const handleExportCSV = async () => {
    try {
      const statusParam = statusFilter === "all" ? "" : statusFilter;
      const response = await apiClient.get("/meta-leads/export", {
        params: {
          search,
          status: statusParam,
        },
        responseType: "blob",
      });

      // Create a link and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `meta_leads_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export Meta leads CSV:", err);
    }
  };

  // Get status color badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Contacted":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "Qualified":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "Converted":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Closed":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">CRM</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Meta Leads</BreadcrumbPage>
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
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Magnet className="w-5 h-5 text-indigo-500" /> Meta Leads Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ingest, verify, and follow up with leads captured from paid Facebook and Instagram Lead Ads campaigns.
            </p>
          </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Total Ingested</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg">
                <Magnet className="w-4 h-4 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">New Leads</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</p>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
                <Sparkles className="w-4 h-4 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Contacted</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.contacted}</p>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Qualified</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.qualified}</p>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-card col-span-2 md:col-span-1">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Converted</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.converted}</p>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                <BadgeDollarSign className="w-4 h-4 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table Card */}
        <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-card">
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Leads Register</CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, phone, email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 text-sm rounded-lg"
                />
              </div>

              {/* Status filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-44 h-9 rounded-lg text-sm bg-background border border-input">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left text-sm text-foreground">
                <thead className="bg-slate-50 dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Lead ID</th>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Contact Details</th>
                    <th className="px-6 py-3.5">Form Name</th>
                    <th className="px-6 py-3.5">Created Date</th>
                    <th className="px-6 py-3.5">Lead Source</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-20 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                          <span>Loading Meta Leads...</span>
                        </div>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-muted-foreground font-normal">
                        No Meta leads found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/35 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block" title={lead.meta_lead_id}>
                            {lead.meta_lead_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-foreground text-sm font-semibold">
                          {lead.name}
                        </td>
                        <td className="px-6 py-4 text-xs font-normal">
                          <div className="space-y-0.5">
                            <div className="text-foreground font-medium">{lead.phone}</div>
                            {lead.email && <div className="text-muted-foreground">{lead.email}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/80 font-normal">
                          {lead.form_name || <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-normal">
                          {new Date(lead.created_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-normal">
                          {lead.lead_source}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${getStatusBadge(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/dashboard/meta-leads/details/${lead.id}`}>
                              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800">
                                <Eye className="w-4 h-4 text-slate-500" />
                              </Button>
                            </Link>
                            <Button
                              onClick={() => {
                                setLeadToDelete(lead.id);
                                setIsDeleteOpen(true);
                              }}
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-rose-100 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-950/40 dark:hover:bg-rose-950/20"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-muted-foreground font-normal">
                  Showing Page {page} of {totalPages} ({totalRecords} leads)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-lg"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-lg"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-card border border-slate-100 dark:border-slate-800 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete this Meta lead? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => {
                setIsDeleteOpen(false);
                setLeadToDelete(null);
              }}
              className="h-9 text-xs rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDeleteConfirm}
              className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg"
            >
              {deleting ? "Deleting..." : "Delete Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

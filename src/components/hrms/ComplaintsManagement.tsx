"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Flag,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  fetchEmployeeComplaints,
  updateComplaintStatus,
  getComplaintAttachmentUrl,
  type ComplaintItem,
  type ComplaintStatus,
} from "@/api/hrms-complaints";

const statusBadges: Record<
  ComplaintStatus,
  { label: string; className: string; icon: any }
> = {
  PENDING: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-900/40 dark:text-amber-300",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className:
      "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-900/40 dark:text-blue-300",
    icon: RefreshCw,
  },
  RESOLVED: {
    label: "Resolved",
    className:
      "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-900/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    className:
      "bg-rose-500/10 text-rose-700 border-rose-200 dark:border-rose-900/40 dark:text-rose-300",
    icon: XCircle,
  },
};

export default function ComplaintsManagement() {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const userType = user?.user_type?.user_type?.toLowerCase() || "";
  const isSuperAdmin = userType.includes("super-admin") || userType.includes("admin");

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | ComplaintStatus>("ALL");
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);

  // Status review state
  const [reviewStatus, setReviewStatus] = useState<ComplaintStatus>("IN_PROGRESS");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [attachmentLoading, setAttachmentLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const complaintsQuery = useQuery({
    queryKey: ["hrms-complaints", user?.vendor_id, statusTab, search, page, pageSize],
    queryFn: () =>
      fetchEmployeeComplaints({
        status: statusTab === "ALL" ? undefined : statusTab,
        search: search.trim() || undefined,
        page,
        page_size: pageSize,
      }),
    enabled: !!user?.vendor_id,
  });

  const complaints: ComplaintItem[] = complaintsQuery.data?.items || [];
  const totalCount = complaintsQuery.data?.total || 0;
  const totalPages = complaintsQuery.data?.total_pages || Math.max(1, Math.ceil(totalCount / pageSize));

  const handleOpenDetail = (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
    setReviewStatus(complaint.status);
    setAdminRemarks(complaint.admin_remarks || "");
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;
    setIsUpdatingStatus(true);
    try {
      await updateComplaintStatus(selectedComplaint.id, {
        status: reviewStatus,
        admin_remarks: adminRemarks.trim() || undefined,
      });
      toastManager.add({
        title: "Complaint status updated successfully",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["hrms-complaints"] });
      setSelectedComplaint((prev: ComplaintItem | null) =>
        prev
          ? {
              ...prev,
              status: reviewStatus,
              admin_remarks: adminRemarks.trim() || null,
            }
          : null
      );
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || "Failed to update complaint status",
        type: "error",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadAttachment = async (complaintId: number) => {
    setAttachmentLoading(true);
    try {
      const { url } = await getComplaintAttachmentUrl(complaintId);
      window.open(url, "_blank");
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || "Failed to open attachment",
        type: "error",
      });
    } finally {
      setAttachmentLoading(false);
    }
  };

  const counts = {
    all: complaints.length,
    pending: complaints.filter((c: ComplaintItem) => c.status === "PENDING").length,
    in_progress: complaints.filter((c: ComplaintItem) => c.status === "IN_PROGRESS").length,
    resolved: complaints.filter((c: ComplaintItem) => c.status === "RESOLVED").length,
    rejected: complaints.filter((c: ComplaintItem) => c.status === "REJECTED").length,
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbPage>HRMS Management</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Employee Complaints</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 bg-muted/20 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Issue Resolution & Grievance
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Employee Complaints
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Track, review, and resolve concerns reported by team members.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => complaintsQuery.refetch()}
              className="gap-2"
              disabled={complaintsQuery.isFetching}
            >
              <RefreshCw
                className={cn(
                  "size-3.5",
                  complaintsQuery.isFetching && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>

          {/* Metric Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Pending Review
                </span>
                <Clock className="size-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-bold">{counts.pending}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Awaiting initial action
              </p>
            </div>

            <div className="rounded-xl border bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  In Progress
                </span>
                <RefreshCw className="size-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold">{counts.in_progress}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Under active investigation
              </p>
            </div>

            <div className="rounded-xl border bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Resolved
                </span>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold">{counts.resolved}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Closed successfully
              </p>
            </div>

            <div className="rounded-xl border bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Rejected
                </span>
                <XCircle className="size-4 text-rose-500" />
              </div>
              <p className="mt-2 text-2xl font-bold">{counts.rejected}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Dismissed with remarks
              </p>
            </div>
          </div>

          {/* Main List Section */}
          <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
            {/* Filter controls */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Tabs
                  value={statusTab}
                  onValueChange={(val) => {
                    setStatusTab(val as any);
                    setPage(1);
                  }}
                  className="w-auto"
                >
                  <TabsList className="h-9">
                    <TabsTrigger value="ALL" className="text-xs">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="PENDING" className="text-xs">
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="IN_PROGRESS" className="text-xs">
                      In Progress
                    </TabsTrigger>
                    <TabsTrigger value="RESOLVED" className="text-xs">
                      Resolved
                    </TabsTrigger>
                    <TabsTrigger value="REJECTED" className="text-xs">
                      Rejected
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search subject, employee, category…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 pl-9 text-xs"
                />
              </div>
            </div>

            {/* Table */}
            {complaintsQuery.isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading complaints…
              </div>
            ) : complaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Flag className="size-8 text-muted-foreground/60" />
                </div>
                <p className="mt-3 text-sm font-medium">No complaints found</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  {search || statusTab !== "ALL"
                    ? "Try adjusting your search keywords or status filter."
                    : "No employee grievances or issues have been filed yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="border-b bg-muted/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Attachment</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {complaints.map((item) => {
                      const badge = statusBadges[item.status] || statusBadges.PENDING;
                      const Icon = badge.icon;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {item.user?.user_name?.slice(0, 2).toUpperCase() ||
                                  "EM"}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-foreground">
                                  {item.user?.user_name || "Unknown"}
                                </p>
                                {(item.user?.user_code || item.user?.user_email || item.user?.email) && (
                                  <p className="truncate text-[10px] text-muted-foreground">
                                    {item.user?.user_code
                                      ? `ID: ${item.user.user_code}`
                                      : item.user?.user_email || item.user?.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="max-w-xs truncate text-xs font-medium text-foreground">
                              {item.subject}
                            </p>
                            <p className="max-w-xs truncate text-[11px] text-muted-foreground">
                              {item.description}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-xs">
                            {item.attachment_key ? (
                              <button
                                onClick={() => handleDownloadAttachment(item.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                              >
                                <Paperclip className="size-3" />
                                {item.attachment_name || "File"}
                              </button>
                            ) : (
                              <span className="text-muted-foreground/60 text-[11px]">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs tabular-nums text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                                badge.className
                              )}
                            >
                              <Icon className="size-3" />
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={() => handleOpenDetail(item)}
                            >
                              <Eye className="size-3.5" />
                              Review
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div className="flex flex-col-reverse items-center justify-between gap-4 border-t pt-4 sm:flex-row sm:gap-8">
                <div className="text-xs text-muted-foreground">
                  Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{" "}
                  {Math.min(page * pageSize, totalCount)} of {totalCount} complaint(s)
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8">
                  <div className="flex items-center space-x-2">
                    <p className="whitespace-nowrap text-xs font-medium">
                      Rows per page
                    </p>
                    <Select
                      value={`${pageSize}`}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[4.5rem] text-xs">
                        <SelectValue placeholder={pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 50, 100].map((size) => (
                          <SelectItem
                            key={size}
                            value={`${size}`}
                            className="text-xs"
                          >
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-center text-xs font-medium">
                    Page {page} of {totalPages}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Button
                      aria-label="Go to first page"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage(1)}
                      disabled={page <= 1}
                    >
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                      aria-label="Go to previous page"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      aria-label="Go to next page"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() =>
                        setPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      aria-label="Go to last page"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage(totalPages)}
                      disabled={page >= totalPages}
                    >
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Review & Details Dialog */}
      <Dialog
        open={!!selectedComplaint}
        onOpenChange={(open) => !open && setSelectedComplaint(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-6">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Flag className="size-4 text-rose-500" />
                Complaint Details
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Review employee submission, inspect attachments, and update status.
            </DialogDescription>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-4 pt-2">
              {/* Employee info box */}
              <div className="rounded-xl border bg-muted/30 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Employee Information
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Employee Name:</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {selectedComplaint.user?.user_name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Employee ID:</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {selectedComplaint.user?.user_code || "—"}
                    </p>
                  </div>
                  {(selectedComplaint.user?.user_email || selectedComplaint.user?.email) ? (
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {selectedComplaint.user?.user_email || selectedComplaint.user?.email}
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <span className="text-muted-foreground">Branch / Franchise:</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {selectedComplaint.franchise?.franchise_name ||
                        selectedComplaint.vendor?.company_name ||
                        "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subject & Category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
                    Category: {selectedComplaint.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Submitted:{" "}
                    {new Date(selectedComplaint.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedComplaint.subject}
                </h3>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Complaint Description
                </Label>
                <div className="rounded-xl border bg-muted/10 p-3.5 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                  {selectedComplaint.description}
                </div>
              </div>

              {/* Attachment if any */}
              {selectedComplaint.attachment_key && (
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Paperclip className="size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        {selectedComplaint.attachment_name || "Attachment"}
                      </p>
                      {selectedComplaint.attachment_size && (
                        <p className="text-[10px] text-muted-foreground">
                          {(selectedComplaint.attachment_size / (1024 * 1024)).toFixed(
                            2
                          )}{" "}
                          MB
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    disabled={attachmentLoading}
                    onClick={() => handleDownloadAttachment(selectedComplaint.id)}
                  >
                    <Download className="size-3" />
                    {attachmentLoading ? "Loading…" : "Download"}
                  </Button>
                </div>
              )}

              {/* Super Admin Status Management */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <p className="text-xs font-semibold text-foreground">
                    Super Admin Resolution & Status
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Update Status</Label>
                    <Select
                      value={reviewStatus}
                      onValueChange={(val) => setReviewStatus(val as ComplaintStatus)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">
                      Admin Remarks / Resolution Notes
                    </Label>
                    <Textarea
                      placeholder="Add remarks or resolution explanation for the employee…"
                      rows={3}
                      className="text-xs bg-background resize-none"
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setSelectedComplaint(null)}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus}
                    className="gap-1.5 text-xs h-8"
                  >
                    {isUpdatingStatus ? "Updating…" : "Save Status & Remarks"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

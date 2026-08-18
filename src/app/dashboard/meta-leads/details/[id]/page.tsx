"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Calendar,
  Layers,
  User,
  Phone,
  Mail,
  FileSpreadsheet,
  CheckCircle2,
  Info,
} from "lucide-react";
import Link from "next/link";

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
  custom_fields: Record<string, string> | null;
}

export default function MetaLeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [lead, setLead] = useState<MetaLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Deletion Dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchLeadDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/meta-leads/${id}`);
      if (res.data?.success) {
        setLead(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch lead details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  // Handle status update
  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    setUpdating(true);
    try {
      const res = await apiClient.patch(`/meta-leads/${lead.id}/status`, {
        status: newStatus,
      });
      if (res.data?.success) {
        setLead((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Handle lead deletion
  const handleDeleteConfirm = async () => {
    if (!lead) return;
    setDeleting(true);
    try {
      const res = await apiClient.delete(`/meta-leads/${lead.id}`);
      if (res.data?.success) {
        setIsDeleteOpen(false);
        router.push("/dashboard/meta-leads");
      }
    } catch (err) {
      console.error("Error deleting lead:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <span className="text-sm text-muted-foreground font-medium">Loading details...</span>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <Info className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Lead Not Found</h2>
        <Link href="/dashboard/meta-leads">
          <Button className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
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
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">CRM</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/meta-leads">Meta Leads</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Lead Details</BreadcrumbPage>
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
      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Back Link */}
        <Link href="/dashboard/meta-leads" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Personal info & Actions */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" /> Customer Information
                </CardTitle>
                <CardDescription className="text-xs">Parsed lead profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Full Name</span>
                  <span className="text-base font-semibold text-foreground">{lead.name}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Phone Number</span>
                  <a href={`tel:${lead.phone}`} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {lead.phone}
                  </a>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Email Address</span>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {lead.email}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic font-normal">Not Provided</span>
                  )}
                </div>

                <Separator className="my-2" />

                {/* Status Update section */}
                <div className="space-y-2">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Lead Status</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={lead.status}
                      disabled={updating}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="w-full h-10 rounded-xl text-sm bg-background border border-input font-semibold">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Qualified">Qualified</SelectItem>
                        <SelectItem value="Converted">Converted</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    {updating && <Loader2 className="w-4 h-4 animate-spin text-slate-500 shrink-0" />}
                  </div>
                </div>

                {/* Delete Button */}
                <Button
                  onClick={() => setIsDeleteOpen(true)}
                  variant="outline"
                  className="w-full h-10 text-xs font-semibold border-rose-100 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-950/40 dark:hover:bg-rose-950/20 text-rose-500 rounded-xl mt-4 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete Lead
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Campaign info & Questionnaire details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meta Ad Details */}
            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" /> Campaign & Form Metadata
                </CardTitle>
                <CardDescription className="text-xs">Verification parameters synced from Meta Developers</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Lead ID (Metagen)</span>
                  <span className="font-mono text-xs text-foreground bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800 block truncate" title={lead.meta_lead_id}>
                    {lead.meta_lead_id}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Lead Source</span>
                  <span className="text-sm font-semibold text-foreground">{lead.lead_source}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Form Name</span>
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> {lead.form_name || "Meta Leads"}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Form ID</span>
                  <span className="font-mono text-xs text-foreground bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800 block truncate">
                    {lead.form_id || "—"}
                  </span>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">Submission Timestamp</span>
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    {new Date(lead.created_date).toLocaleString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      timeZoneName: "short",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Custom fields Questionnaire */}
            <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-500" /> Custom Questionnaire Responses
                </CardTitle>
                <CardDescription className="text-xs">Dynamic inputs completed by customer in the Lead Ad Form</CardDescription>
              </CardHeader>
              <CardContent>
                {lead.custom_fields && Object.keys(lead.custom_fields).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(lead.custom_fields).map(([question, answer]) => (
                      <div key={question} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-slate-500">
                          {question.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-bold text-foreground block">
                          {answer || <span className="text-muted-foreground italic font-normal">No Answer</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-muted-foreground font-normal">
                      No custom questionnaire fields were present in this lead submission.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-card border border-slate-100 dark:border-slate-800 shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete this Meta lead? This action is permanent and cannot be undone. You will be redirected back to the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setIsDeleteOpen(false)}
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

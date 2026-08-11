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
} from "lucide-react";
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
  const [callDuration, setCallDuration] = useState("");
  const [callRemark, setCallRemark] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [storePreference, setStorePreference] = useState("");
  const [preferredStoreId, setPreferredStoreId] = useState("");
  const [submittingCall, setSubmittingCall] = useState(false);

  // Store assignment modal state
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [assignStoreId, setAssignStoreId] = useState("");
  const [storeRemark, setStoreRemark] = useState("");
  const [storeCallers, setStoreCallers] = useState<Telecaller[]>([]);
  const [selectedStoreCaller, setSelectedStoreCaller] = useState("");
  const [requiresCallerSelect, setRequiresCallerSelect] = useState(false);
  const [submittingStore, setSubmittingStore] = useState(false);

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
      alert("Status is required");
      return;
    }

    if (isFollowUpDateRequired && !followUpDate) {
      alert("Next follow-up date is required for this status.");
      return;
    }

    setSubmittingCall(true);
    try {
      const res = await apiClient.post(`/online-leads/${id}/call`, {
        telecaller_id: userId,
        call_type: callType,
        online_lead_status_id: callStatus,
        duration_seconds: callDuration ? Number(callDuration) : undefined,
        remark: callRemark,
        follow_up_date: followUpDate || undefined,
        store_preference_option: storePreference || undefined,
        store_id: preferredStoreId ? Number(preferredStoreId) : undefined,
      });

      if (res.data?.success) {
        setIsCallOpen(false);
        setCallStatus("");
        setCallDuration("");
        setCallRemark("");
        setFollowUpDate("");
        setStorePreference("");
        setPreferredStoreId("");
        fetchLeadDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to log call outcome.");
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
        }
      }
    } catch (err) {
      console.error("Store assignment error:", err);
    } finally {
      setSubmittingStore(false);
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
                <BreadcrumbLink href="/dashboard/online-leads">Online Leads</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Lead ID #{lead.id}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-background">
        {/* Back Button & Actions */}
        <div className="flex justify-between items-center">
          <Link href="/dashboard/online-leads">
            <Button variant="ghost" className="hover:bg-muted font-medium flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to List
            </Button>
          </Link>

          <div className="flex gap-2">
            <Button
              onClick={() => setIsCallOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" /> Log Call & Outcome
            </Button>

            {isConverted && userType !== "sales-executive" && (
              <Button
                onClick={() => setIsStoreOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2"
              >
                <Store className="w-4 h-4" /> Store Assignment
              </Button>
            )}
          </div>
        </div>

        {/* Lead Identity Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow border">
            <CardHeader className="bg-muted/10 border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 border text-slate-700 dark:text-slate-300 inline-block mb-2">
                    {lead.lead_entry_type} Entry
                  </span>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {lead.leads_name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Lead generated on {new Date(lead.created_at).toLocaleString()} • Source: {lead.source}
                  </CardDescription>
                </div>

                <div className="text-left sm:text-right">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 border text-blue-800 inline-block whitespace-nowrap">
                    Status: {lead.followupStatus?.status_name || "New Lead"}
                  </span>
                  {lead.follow_up_date && (
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-2 flex items-center sm:justify-end gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Next Follow-Up: {new Date(lead.follow_up_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Contact Information</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-foreground font-semibold">{lead.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-foreground">{lead.email || "No Email Provided"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Allocation Information</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Telecaller Assigned:</span>
                    <span className="text-foreground font-semibold">
                      {lead.assignedTo?.user_name || lead.finalAssignedLeads?.user_name || "Unassigned"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Store className="w-4 h-4 text-slate-500" />
                    <span>Assigned Store:</span>
                    <span className="text-foreground font-semibold">
                      {lead.franchise?.franchise_name || "No Store Selected"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest remark box */}
          <Card className="shadow border bg-muted/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Latest Conversation Note</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl border bg-card text-sm min-h-[100px] flex flex-col justify-between">
                <p className="text-foreground italic">
                  "{lead.remark || "No conversion remark has been logged yet."}"
                </p>
                <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs text-muted-foreground">
                  <span>Logged by assigned caller</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Timelines and Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline / Remarks History */}
          <Card className="shadow border">
            <CardHeader className="border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-slate-800 dark:text-slate-200" /> Remark & Status History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              {lead.online_lead_history.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm italic">
                  No activity history logs yet.
                </div>
              ) : (
                <div className="p-6 relative border-l-2 border-slate-100 dark:border-slate-800 ml-6 space-y-6">
                  {lead.online_lead_history.map((hist, idx) => (
                    <div key={hist.id} className="relative pl-6">
                      <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 border-slate-800 dark:border-slate-200 bg-background" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{hist.createdBy.user_name}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50">
                            {hist.status.status_name}
                          </span>
                          {hist.franchise && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-rose-500" /> {hist.franchise.franchise_name}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{hist.remark}</p>
                        {hist.follow_up_date && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                            Scheduled Next Call: {new Date(hist.follow_up_date).toLocaleString()}
                          </p>
                        )}
                        <span className="text-[10px] text-muted-foreground block mt-1">
                          {new Date(hist.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call Logs & Store Movements */}
          <div className="space-y-6">
            {/* Call Logs */}
            <Card className="shadow border">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-slate-800 dark:text-slate-200" /> Call Outcome Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[220px] overflow-y-auto">
                {lead.call_log.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm italic">
                    No calls logged for this customer.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold">
                        <th className="p-3">Type</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Outcome Status</th>
                        <th className="p-3">Caller</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lead.call_log.map((call) => (
                        <tr key={call.id} className="hover:bg-muted/10">
                          <td className="p-3 font-semibold">
                            <span className={call.call_type === "INCOMING" ? "text-emerald-600" : "text-slate-800 dark:text-slate-250"}>
                              {call.call_type}
                            </span>
                          </td>
                          <td className="p-3 text-foreground font-medium">
                            {call.duration_seconds ? `${call.duration_seconds}s` : "N/A"}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 border font-semibold text-foreground">
                              {call.status?.status_name || "N/A"}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{call.telecaller.user_name}</td>
                          <td className="p-3 text-muted-foreground">{new Date(call.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Store Logs */}
            <Card className="shadow border">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Store className="w-5 h-5 text-slate-800 dark:text-slate-200" /> Store Movements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[220px] overflow-y-auto">
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
          </div>
        </div>
      </div>

      {/* Log Call Modal */}
      <Dialog open={isCallOpen} onOpenChange={setIsCallOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Log Call Outcome</DialogTitle>
            <DialogDescription className="text-xs">
              Log conversation details, update follow-up statuses, and schedule next callbacks.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCallSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Call Direction</label>
                <Select
                  value={callType}
                  onValueChange={(val) => setCallType(val as any)}
                >
                  <SelectTrigger className="w-full h-10 bg-background text-sm">
                    <SelectValue placeholder="Call Direction" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    <SelectItem value="OUTGOING">Outgoing</SelectItem>
                    <SelectItem value="INCOMING">Incoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Duration (Seconds)</label>
                <Input
                  type="number"
                  placeholder="Optional..."
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">New Status Outcome</label>
              <Select
                value={callStatus}
                onValueChange={(val) => setCallStatus(val)}
              >
                <SelectTrigger className="w-full h-10 bg-background text-sm">
                  <SelectValue placeholder="-- Select Status --" />
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
                  Next Follow-up Date & Time (Mandatory)
                </label>
                <Input
                  type="datetime-local"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Store Preference</label>
                <Select
                  value={storePreference || "none"}
                  onValueChange={(val) => setStorePreference(val === "none" ? "" : val)}
                >
                  <SelectTrigger className="w-full h-10 bg-background text-sm">
                    <SelectValue placeholder="-- No preference --" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    <SelectItem value="none">-- No preference --</SelectItem>
                    <SelectItem value="Current Store">Current Store</SelectItem>
                    <SelectItem value="Another Store">Another Store</SelectItem>
                    <SelectItem value="No Preference">No Preference</SelectItem>
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
                      <SelectValue placeholder="-- Select Store --" />
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
        </DialogContent>
      </Dialog>

      {/* Assign Store Modal */}
      <Dialog open={isStoreOpen} onOpenChange={setIsStoreOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Assign Lead to Store</DialogTitle>
            <DialogDescription className="text-xs">
              Assign or transfer this lead to a physical store location and trigger caller auto-assignment rules.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStoreSubmit} className="space-y-4 py-2">
            {!requiresCallerSelect ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Select Store</label>
                  <Select
                    value={assignStoreId}
                    onValueChange={(val) => setAssignStoreId(val)}
                  >
                    <SelectTrigger className="w-full h-10 bg-background text-sm">
                      <SelectValue placeholder="-- Choose Store --" />
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
        </DialogContent>
      </Dialog>
    </>
  );
}

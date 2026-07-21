//
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ModernDateTimePicker } from "@/components/broadcast/ModernDateTimePicker";
import { QuillEditor } from "@/components/broadcast/QuillEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  PenTool,
  Users,
  Calendar as CalendarIcon,
  Eye,
  Plus,
  Video,
  UploadCloud,
  FileText,
  X,
  Building2,
  UserCheck,
  Search,
} from "lucide-react";
import { BroadcastItem, BroadcastType } from "@/types/broadcast";
import { useUserTypes, useUsersForMaster } from "@/hooks/useTypesMaster";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useAppSelector } from "@/redux/store";

interface CreateBroadcastSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBroadcast: (broadcast: Partial<BroadcastItem> & { targetId?: number }) => void;
}

export const CreateBroadcastSheet: React.FC<CreateBroadcastSheetProps> = ({
  open,
  onOpenChange,
  onCreateBroadcast,
}) => {
  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id || user?.vendor?.id || 1;

  // Fetch real CRM User Roles, Franchises & Users
  const { data: userTypesResponse } = useUserTypes();
  const { data: franchisesData } = useFranchisesByVendorId(vendorId);
  const { data: usersResponse, isLoading: isLoadingUsers } = useUsersForMaster({ page: 1, limit: 1000 }, vendorId);

  const userRolesList: Array<{ id: number; user_type?: string; user_type_name?: string; name?: string }> =
    Array.isArray(userTypesResponse)
      ? userTypesResponse
      : (userTypesResponse as any)?.data || [];

  const usersList: Array<any> = useMemo(() => {
    if (!usersResponse) return [];
    if (Array.isArray((usersResponse as any).data)) return (usersResponse as any).data;
    if (Array.isArray(usersResponse)) return usersResponse as any;
    return [];
  }, [usersResponse]);

  const [activeTab, setActiveTab] = useState<string>("content");

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<BroadcastType>("circular");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [department, setDepartment] = useState("Operations");

  // Audience State (Support Multiple Roles, Franchises and Users)
  const [audienceType, setAudienceType] = useState<"ALL" | "ROLE" | "FRANCHISE" | "USER">("ALL");
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedFranchiseIds, setSelectedFranchiseIds] = useState<number[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [targetUserIdsInput, setTargetUserIdsInput] = useState<string>("");
  const [roleSearch, setRoleSearch] = useState("");
  const [franchiseSearch, setFranchiseSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Schedule & Attachments
  const [scheduleType, setScheduleType] = useState("now");
  const [publishDate, setPublishDate] = useState("");
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<
    Array<{ id: string; name: string; size: string; type: string; fileObj?: File }>
  >([]);

  // Filtered Roles list
  const filteredRoles = useMemo(() => {
    return userRolesList.filter((r) => {
      const name = (r.user_type || r.user_type_name || r.name || "").toLowerCase();
      return name.includes(roleSearch.toLowerCase()) || String(r.id).includes(roleSearch);
    });
  }, [userRolesList, roleSearch]);

  // Filtered Franchises list
  const filteredFranchises = useMemo(() => {
    return (franchisesData || []).filter((f: any) => {
      const name = (f.franchise_name || "").toLowerCase();
      const code = (f.franchise_code || "").toLowerCase();
      return name.includes(franchiseSearch.toLowerCase()) || code.includes(franchiseSearch.toLowerCase());
    });
  }, [franchisesData, franchiseSearch]);

  // Filtered Users list
  const filteredUsers = useMemo(() => {
    const query = userSearch.toLowerCase().trim();
    if (!query) return usersList;
    return usersList.filter((u: any) => {
      const name = (u.user_name || "").toLowerCase();
      const email = (u.user_email || "").toLowerCase();
      const contact = (u.user_contact || "").toLowerCase();
      const roleName = (u.user_type?.user_type || u.user_type?.user_type_name || "").toLowerCase();
      const idStr = String(u.id);
      return (
        name.includes(query) ||
        email.includes(query) ||
        contact.includes(query) ||
        roleName.includes(query) ||
        idStr.includes(query)
      );
    });
  }, [usersList, userSearch]);

  const toggleRoleSelect = (id: number) => {
    if (selectedRoleIds.includes(id)) {
      setSelectedRoleIds(selectedRoleIds.filter((rId) => rId !== id));
    } else {
      setSelectedRoleIds([...selectedRoleIds, id]);
    }
  };

  const toggleSelectAllRoles = () => {
    if (selectedRoleIds.length === filteredRoles.length) {
      setSelectedRoleIds([]);
    } else {
      setSelectedRoleIds(filteredRoles.map((r: any) => r.id));
    }
  };

  const toggleFranchiseSelect = (id: number) => {
    if (selectedFranchiseIds.includes(id)) {
      setSelectedFranchiseIds(selectedFranchiseIds.filter((fId) => fId !== id));
    } else {
      setSelectedFranchiseIds([...selectedFranchiseIds, id]);
    }
  };

  const toggleSelectAllFranchises = () => {
    if (selectedFranchiseIds.length === filteredFranchises.length) {
      setSelectedFranchiseIds([]);
    } else {
      setSelectedFranchiseIds(filteredFranchises.map((f: any) => f.id));
    }
  };

  const toggleUserSelect = (id: number) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uId) => uId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const toggleSelectAllUsers = () => {
    if (selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u: any) => u.id));
    }
  };

  const handleAddVideo = () => {
    if (videoUrlInput.trim()) {
      setVideoLinks([...videoLinks, videoUrlInput.trim()]);
      setVideoUrlInput("");
    }
  };

  const handleRemoveVideo = (index: number) => {
    setVideoLinks(videoLinks.filter((_, i) => i !== index));
  };

  const processFiles = (files: FileList | File[]) => {
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map((f, i) => ({
        id: `file-${Date.now()}-${i}`,
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        type: f.name.split(".").pop() || "doc",
        fileObj: f,
      }));
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = (status: "published" | "draft") => {
    if (!title) return;

    let audienceLabel = "All Users";

    if (audienceType === "ROLE") {
      if (selectedRoleIds.length > 0) {
        const matchedNames = userRolesList
          .filter((r) => selectedRoleIds.includes(r.id))
          .map((r) => r.user_type || r.user_type_name || r.name || `Role #${r.id}`);
        audienceLabel = matchedNames.join(", ");
      } else {
        audienceLabel = "All Roles";
      }
    } else if (audienceType === "FRANCHISE") {
      if (selectedFranchiseIds.length > 0) {
        const matchedNames = (franchisesData || [])
          .filter((f: any) => selectedFranchiseIds.includes(f.id))
          .map((f: any) => f.franchise_name);
        audienceLabel = matchedNames.join(", ");
      } else {
        audienceLabel = "All Franchises";
      }
    } else if (audienceType === "USER") {
      let userIds = [...selectedUserIds];
      if (targetUserIdsInput.trim()) {
        const manualIds = targetUserIdsInput
          .split(",")
          .map((u) => parseInt(u.trim(), 10))
          .filter((u) => !isNaN(u));
        userIds = Array.from(new Set([...userIds, ...manualIds]));
      }
      if (userIds.length > 0) {
        const matchedNames = usersList
          .filter((u: any) => userIds.includes(u.id))
          .map((u: any) => u.user_name || `User #${u.id}`);
        audienceLabel = matchedNames.length > 0 ? matchedNames.join(", ") : `Users (${userIds.join(", ")})`;
      } else {
        audienceLabel = "Specific Users";
      }
    }

    let finalPublishDate = new Date().toISOString();
    if (scheduleType === "later" && publishDate) {
      const parsed = new Date(publishDate);
      if (!isNaN(parsed.getTime())) {
        finalPublishDate = parsed.toISOString();
      }
    }

    const newBroadcast: Partial<BroadcastItem> & { targetId?: number } = {
      title,
      type,
      status: status === "published" && scheduleType === "later" ? "scheduled" : status,
      summary,
      content: content || summary || "No content body provided.",
      department,
      audience: audienceLabel,
      audienceScope: audienceType,
      targetId: audienceType === "ROLE" && selectedRoleIds.length > 0 ? selectedRoleIds[0] :
                audienceType === "FRANCHISE" && selectedFranchiseIds.length > 0 ? selectedFranchiseIds[0] :
                audienceType === "USER" && selectedUserIds.length > 0 ? selectedUserIds[0] : undefined,
      publishDate: finalPublishDate,
      updatedAt: new Date().toLocaleString(),
      updatedBy: {
        name: user?.user_name || "Super Admin",
        role: "Super Admin",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin",
      },
      version: "1.0",
      fileType: attachments.length > 0 ? (attachments[0].type as any) : "pdf",
      fileSize: attachments.length > 0 ? attachments[0].size : "1.2 MB",
      videoLinks,
      attachments,
    };

    onCreateBroadcast(newBroadcast);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle("");
    setType("circular");
    setSummary("");
    setContent("");
    setAudienceType("ALL");
    setSelectedRoleIds([]);
    setSelectedFranchiseIds([]);
    setSelectedUserIds([]);
    setTargetUserIdsInput("");
    setRoleSearch("");
    setFranchiseSearch("");
    setUserSearch("");
    setVideoLinks([]);
    setAttachments([]);
    setActiveTab("content");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 flex flex-col rounded-2xl border shadow-2xl overflow-hidden bg-card">
        {/* Modal Header */}
        <DialogHeader className="p-6 pb-4 border-b flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight">Create Broadcast</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Publish circular or document announcement to your organization.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Tab Navigation with Black Pill Active Shape Styling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 border-b bg-muted/20 flex justify-center">
            <div className="inline-flex items-center p-1 bg-muted/50 border rounded-full gap-1 h-12 max-w-xl">
              {[
                { id: "content", label: "Content", icon: PenTool },
                { id: "audience", label: "Audience", icon: Users },
                { id: "schedule", label: "Schedule", icon: CalendarIcon },
                { id: "preview", label: "Preview", icon: Eye },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-full transition-colors duration-200 select-none ${
                      isActive
                        ? "text-white dark:text-black"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill_CreateSheet"
                        className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-md"
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* CONTENT TAB */}
            <TabsContent value="content" className="m-0 space-y-5">
              {/* Broadcast Type Selection */}
              <div className="space-y-2 p-3.5 rounded-xl border bg-muted/10">
                <Label className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  Broadcast Type *
                </Label>
                <RadioGroup
                  value={type}
                  onValueChange={(val: string) => setType(val as BroadcastType)}
                  className="grid grid-cols-2 gap-3"
                >
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      type === "circular" ? "border-primary bg-primary/5 font-semibold" : "bg-card hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem value="circular" id="sheet-type-circular" />
                    <div>
                      <div className="text-sm font-bold">Circular</div>
                      <div className="text-[11px] text-muted-foreground font-normal">
                        General notices, company policy updates, announcements
                      </div>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      type === "document" ? "border-primary bg-primary/5 font-semibold" : "bg-card hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem value="document" id="sheet-type-document" />
                    <div>
                      <div className="text-sm font-bold">Document</div>
                      <div className="text-[11px] text-muted-foreground font-normal">
                        Standard Operating Procedures (SOPs), manuals, specs, decks
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Title & Department */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">Title *</Label>
                  <Input
                    placeholder="Enter broadcast title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Department Tag *</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="IT">IT & Systems</SelectItem>
                      <SelectItem value="Safety">Safety & Compliance</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                      <SelectItem value="Sales">Sales & Marketing</SelectItem>
                      <SelectItem value="Quality">Quality Control</SelectItem>
                      <SelectItem value="Engineering">Engineering & CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Summary (Optional)</Label>
                <Input
                  placeholder="Enter short summary..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Content *</Label>
                <QuillEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write your broadcast content here..."
                  minHeight="180px"
                />
              </div>

              {/* Video Links */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-muted-foreground" /> Video Links (YouTube)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste YouTube video URL..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="h-9 text-xs flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddVideo} className="h-9 text-xs gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Video
                  </Button>
                </div>
                {videoLinks.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {videoLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs">
                        <span className="truncate text-muted-foreground">{link}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => handleRemoveVideo(idx)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Attachments
                  </Label>
                  <label htmlFor="modal-file-upload-sheet" className="cursor-pointer">
                    <span className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Add Files
                    </span>
                  </label>
                </div>

                <input
                  id="modal-file-upload-sheet"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <label
                  htmlFor="modal-file-upload-sheet"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="block border border-dashed rounded-xl p-6 text-center bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs font-semibold">Drag & drop files here or click to browse</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Supports: PDF, DOC, PPT, XLS, Images, Videos (Up to 25MB)
                  </p>
                </label>

                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs">
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate font-semibold">{att.name}</span>
                          <span className="text-muted-foreground text-[11px]">({att.size})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleRemoveAttachment(att.id)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* AUDIENCE TAB: MULTIPLE ROLE & FRANCHISE SELECTION WITH HUMAN READABLE NAMES */}
            <TabsContent value="audience" className="m-0 space-y-5">
              <div className="space-y-3">
                <Label className="text-xs font-semibold">Target Audience</Label>
                <RadioGroup
                  value={audienceType}
                  onValueChange={(val: string) => setAudienceType(val as any)}
                  className="space-y-3"
                >
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${audienceType === "ALL" ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="ALL" id="sheet-aud-all" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-bold">All Organization Users</div>
                      <div className="text-xs text-muted-foreground">Broadcast will be sent to all users across all departments and franchises.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${audienceType === "ROLE" ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="ROLE" id="sheet-aud-role" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary" /> Specific User Roles (Select Multiple)
                      </div>
                      <div className="text-xs text-muted-foreground">Target specific CRM roles (e.g., Sales Executive, Site Supervisor, Factory Manager, etc.).</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${audienceType === "FRANCHISE" ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="FRANCHISE" id="sheet-aud-franchise" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" /> Specific Franchises (Select Multiple)
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">Limit broadcast to members of specific franchise units.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${audienceType === "USER" ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="USER" id="sheet-aud-user" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary" /> Specific Users (Select Multiple)
                      </div>
                      <div className="text-xs text-muted-foreground">Target specific users by searching their name, email, or role.</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Dynamic Target Selection based on audienceType */}
              {audienceType === "ROLE" && (
                <div className="p-4 border rounded-xl bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Select CRM Roles ({selectedRoleIds.length} selected)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllRoles} className="h-7 text-[11px]">
                      {selectedRoleIds.length === filteredRoles.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search roles..."
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                    {filteredRoles.map((role: any) => {
                      const roleName = role.user_type || role.user_type_name || role.name || `Role #${role.id}`;
                      const isChecked = selectedRoleIds.includes(role.id);
                      return (
                        <label
                          key={role.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                            isChecked ? "border-primary bg-primary/10 font-bold" : "bg-card hover:border-primary/40"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleRoleSelect(role.id)}
                          />
                          <span className="truncate">{roleName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {audienceType === "FRANCHISE" && (
                <div className="p-4 border rounded-xl bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Select CRM Franchises ({selectedFranchiseIds.length} selected)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllFranchises} className="h-7 text-[11px]">
                      {selectedFranchiseIds.length === filteredFranchises.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search franchises..."
                      value={franchiseSearch}
                      onChange={(e) => setFranchiseSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                    {filteredFranchises.map((fran: any) => {
                      const isChecked = selectedFranchiseIds.includes(fran.id);
                      return (
                        <label
                          key={fran.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                            isChecked ? "border-primary bg-primary/10 font-bold" : "bg-card hover:border-primary/40"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleFranchiseSelect(fran.id)}
                          />
                          <span className="truncate">{fran.franchise_name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {audienceType === "USER" && (
                <div className="p-4 border rounded-xl bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Select Users ({selectedUserIds.length} selected)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllUsers} className="h-7 text-[11px]">
                      {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? "Deselect All" : "Select All"}
                    </Button>
                  </div>

                  <div className="relative border rounded-lg bg-background flex flex-wrap items-center gap-1.5 p-1 pl-2.5 min-h-[36px]">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {selectedUserIds.map((id) => {
                      const usr = usersList.find((u: any) => u.id === id);
                      const name = usr?.user_name || `User #${id}`;
                      return (
                        <Badge key={id} variant="secondary" className="text-[10px] py-0.5 flex items-center gap-1 shrink-0">
                          {name}
                          <X className="w-3 h-3 cursor-pointer" onClick={(e) => { e.preventDefault(); toggleUserSelect(id); }} />
                        </Badge>
                      );
                    })}
                    <Input
                      placeholder={selectedUserIds.length === 0 ? "Search users..." : "Search..."}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="flex-1 border-0 h-7 shadow-none focus-visible:ring-0 px-1 text-xs min-w-[120px] bg-transparent"
                    />
                  </div>

                  {isLoadingUsers ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">Loading users...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">No users found matching "{userSearch}"</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                      {filteredUsers.map((usr: any) => {
                        const userName = usr.user_name || `User #${usr.id}`;
                        const isChecked = selectedUserIds.includes(usr.id);
                        const roleTitle = usr.user_type?.user_type || usr.user_type?.user_type_name || "";
                        return (
                          <label
                            key={usr.id}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                              isChecked ? "border-primary bg-primary/10 font-bold" : "bg-card hover:border-primary/40"
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleUserSelect(usr.id)}
                            />
                            <div className="truncate text-xs">
                              <span className="font-semibold text-foreground truncate block">{userName}</span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {roleTitle ? `${roleTitle} • ` : ""}{usr.user_email || `ID: #${usr.id}`}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ENHANCED SCHEDULE TAB */}
            <TabsContent value="schedule" className="m-0 space-y-5">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Publishing Schedule</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Select when to release this broadcast.</p>
                </div>

                <RadioGroup value={scheduleType} onValueChange={setScheduleType} className="grid grid-cols-2 gap-3">
                  <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${scheduleType === "now" ? "border-primary bg-primary/5 font-bold" : "bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="now" id="sheet-sched-now" className="mt-0.5" />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        Publish Immediately <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[9px]">NOW</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-normal mt-0.5">Broadcast will publish immediately.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${scheduleType === "later" ? "border-primary bg-primary/5 font-bold" : "bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="later" id="sheet-sched-later" className="mt-0.5" />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        Schedule for Later <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[9px]">FUTURE</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-normal mt-0.5">Automatic publish at set date & time.</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {scheduleType === "later" && (
                <div className="p-4 border rounded-xl bg-muted/10 space-y-3 w-full">
                  <Label className="text-xs font-semibold self-start">Publishing Date & Time (IST GMT+5:30) *</Label>
                  <ModernDateTimePicker
                    value={publishDate}
                    onChange={setPublishDate}
                  />
                </div>
              )}
            </TabsContent>

            {/* PREVIEW TAB */}
            <TabsContent value="preview" className="m-0 space-y-4">
              <div className="border rounded-2xl p-5 bg-card space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b">
                  <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-wider px-2.5 py-0.5">
                    {type}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground">{title || "Untitled Broadcast"}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Published by {user?.user_name || "Super Admin"} • Target: {audienceType}
                  </p>
                </div>

                {summary && (
                  <div className="p-3 bg-muted/30 rounded-xl text-xs italic text-muted-foreground border">
                    "{summary}"
                  </div>
                )}

                <div
                  className="text-xs space-y-2 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: content || "<p className='text-muted-foreground'>Broadcast body preview...</p>" }}
                />

                {attachments.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="text-xs font-semibold">Attachments ({attachments.length})</div>
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 text-xs">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold truncate flex-1">{att.name}</span>
                        <span className="text-muted-foreground text-[10px]">{att.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>

          {/* Modal Footer Actions */}
          <DialogFooter className="p-4 border-t bg-muted/10 flex flex-row items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => handleSubmit("draft")}>
                Save Draft
              </Button>
              {activeTab !== "preview" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (activeTab === "content") setActiveTab("audience");
                    else if (activeTab === "audience") setActiveTab("schedule");
                    else if (activeTab === "schedule") setActiveTab("preview");
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={() => handleSubmit("published")}>
                  Publish Broadcast
                </Button>
              )}
            </div>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

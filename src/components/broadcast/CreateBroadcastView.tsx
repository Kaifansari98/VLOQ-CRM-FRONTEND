"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
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
  ArrowLeft,
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
  Send,
} from "lucide-react";
import { BroadcastItem, BroadcastType } from "@/types/broadcast";
import { useUserTypes, useUsersForMaster } from "@/hooks/useTypesMaster";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useAppSelector } from "@/redux/store";
import { CreateBroadcastPayload } from "@/api/broadcast";

interface CreateBroadcastViewProps {
  onBack: () => void;
  onSubmitBroadcast: (data: {
    broadcast: Partial<BroadcastItem>;
    backendPayload: CreateBroadcastPayload;
    isEditing?: boolean;
    editId?: number;
  }) => void;
  editingBroadcast?: BroadcastItem | null;
}

export const CreateBroadcastView: React.FC<CreateBroadcastViewProps> = ({
  onBack,
  onSubmitBroadcast,
  editingBroadcast,
}) => {
  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id || user?.vendor?.id || 1;

  // Fetch real CRM User Roles, Franchises & Users
  const { data: userTypesResponse, isLoading: isLoadingRoles } = useUserTypes();
  const { data: franchisesData, isLoading: isLoadingFranchises } = useFranchisesByVendorId(vendorId);
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

  // Hydrate form fields when editing an existing broadcast
  useEffect(() => {
    if (editingBroadcast) {
      setTitle(editingBroadcast.title || "");
      setType(editingBroadcast.type || "circular");
      setSummary(editingBroadcast.summary || "");
      setContent(editingBroadcast.content || "");
      setDepartment(editingBroadcast.department || "Operations");
      setAudienceType((editingBroadcast.audienceScope as any) || "ALL");
      
      const isSched = editingBroadcast.status === "scheduled";
      setScheduleType(isSched ? "later" : "now");
      
      if (editingBroadcast.publishDate && editingBroadcast.publishDate !== "-") {
        setPublishDate(editingBroadcast.publishDate);
      }
      
      setVideoLinks(editingBroadcast.videoLinks || []);
      if (editingBroadcast.attachments) {
        setAttachments(
          editingBroadcast.attachments.map((att, idx) => ({
            id: att.id || `att-${idx}`,
            name: att.name || "Attachment",
            size: att.size || "1.5 MB",
            type: att.type || "pdf",
          }))
        );
      }

      if (editingBroadcast.audiences && Array.isArray(editingBroadcast.audiences)) {
        const userTargetIds = editingBroadcast.audiences
          .filter((a: any) => a.audienceType === "USER" && a.targetId)
          .map((a: any) => Number(a.targetId));
        if (userTargetIds.length > 0) {
          setSelectedUserIds(userTargetIds);
        }
      }
    }
  }, [editingBroadcast]);

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

  const handleSubmit = (status: "published" | "draft", overridePublishNow: boolean = false) => {
    if (!title) return;

    // Build backend audiences array supporting MULTIPLE selections
    let audiencePayloadList: Array<{ audienceType: "ALL" | "ROLE" | "USER" | "FRANCHISE"; targetId?: number | null }> = [];
    let audienceLabel = "All Users";

    if (audienceType === "ALL") {
      audiencePayloadList = [{ audienceType: "ALL", targetId: null }];
      audienceLabel = "All Users";
    } else if (audienceType === "ROLE") {
      if (selectedRoleIds.length > 0) {
        audiencePayloadList = selectedRoleIds.map((rId) => ({
          audienceType: "ROLE",
          targetId: rId,
        }));
        const matchedNames = userRolesList
          .filter((r) => selectedRoleIds.includes(r.id))
          .map((r) => r.user_type || r.user_type_name || r.name || `Role #${r.id}`);
        audienceLabel = matchedNames.join(", ");
      } else {
        audiencePayloadList = [{ audienceType: "ROLE", targetId: null }];
        audienceLabel = "All Roles";
      }
    } else if (audienceType === "FRANCHISE") {
      if (selectedFranchiseIds.length > 0) {
        audiencePayloadList = selectedFranchiseIds.map((fId) => ({
          audienceType: "FRANCHISE",
          targetId: fId,
        }));
        const matchedNames = (franchisesData || [])
          .filter((f: any) => selectedFranchiseIds.includes(f.id))
          .map((f: any) => f.franchise_name);
        audienceLabel = matchedNames.join(", ");
      } else {
        audiencePayloadList = [{ audienceType: "FRANCHISE", targetId: null }];
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
        audiencePayloadList = userIds.map((uId) => ({
          audienceType: "USER",
          targetId: uId,
        }));
        const matchedNames = usersList
          .filter((u: any) => userIds.includes(u.id))
          .map((u: any) => u.user_name || `User #${u.id}`);
        audienceLabel = matchedNames.length > 0 ? matchedNames.join(", ") : `Users (${userIds.join(", ")})`;
      } else {
        audiencePayloadList = [{ audienceType: "USER", targetId: null }];
        audienceLabel = "Specific Users";
      }
    }

    let finalPublishDate = new Date().toISOString();
    if (!overridePublishNow && scheduleType === "later" && publishDate) {
      const parsed = new Date(publishDate);
      if (!isNaN(parsed.getTime())) {
        finalPublishDate = parsed.toISOString();
      }
    }

    const effectiveStatus = overridePublishNow ? "published" : status;

    const backendPayload: CreateBroadcastPayload = {
      title,
      content: content || summary || "No body content",
      type: type === "document" ? "DOCUMENT" : "CIRCULAR",
      status: effectiveStatus === "draft" ? "INACTIVE" : "ACTIVE",
      publishAt: finalPublishDate,
      audiences: audiencePayloadList,
      attachments: [
        ...videoLinks.map((link) => ({
          attachmentType: "YOUTUBE" as const,
          title: "YouTube Video",
          fileUrl: link,
        })),
        ...attachments.map((att) => ({
          attachmentType: "FILE" as const,
          title: att.name,
          fileUrl: "https://example.com/file.pdf",
          fileObj: att.fileObj,
        })),
      ],
    };

    const frontendBroadcast: Partial<BroadcastItem> = {
      title,
      type,
      status: effectiveStatus === "published" && scheduleType === "later" && !overridePublishNow ? "scheduled" : effectiveStatus,
      summary,
      content: content || summary || "No content body provided.",
      department,
      audience: audienceLabel,
      audienceScope: audienceType,
      publishDate: overridePublishNow || scheduleType === "now" ? new Date().toLocaleString() : publishDate || new Date().toLocaleString(),
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

    onSubmitBroadcast({
      broadcast: frontendBroadcast,
      backendPayload,
      isEditing: !!editingBroadcast,
      editId: editingBroadcast?.numericId,
    });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Top Header Row with Back Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack} className="h-10 w-10 rounded-xl shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {editingBroadcast ? `Edit Broadcast (${editingBroadcast.id})` : "Create Broadcast"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {editingBroadcast ? "Update broadcast content, schedule date, or publish immediately" : "Publish circular or document announcement across your organization"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          <Button variant="outline" size="sm" onClick={onBack} className="flex-1 sm:flex-none rounded-xl h-10 text-xs font-semibold">
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleSubmit("draft")} className="flex-1 sm:flex-none rounded-xl h-10 text-xs font-semibold">
            Save Draft
          </Button>
          {(editingBroadcast?.status === "scheduled" || scheduleType === "later") && (
            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit("published", true)}
              className="flex-1 sm:flex-none rounded-xl h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 px-4 shadow-sm"
            >
              <Send className="w-4 h-4" /> Publish Now
            </Button>
          )}
          <Button size="sm" onClick={() => handleSubmit("published")} className="w-full sm:w-auto rounded-xl h-10 text-xs font-semibold px-5">
            {editingBroadcast ? "Save Changes" : "Publish Broadcast"}
          </Button>
        </div>
      </div>

      {/* Main Full Page Card */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {/* CRM Pill Shaped Header Tabs with Smooth Animation */}
          <div className="py-4 flex justify-start overflow-x-auto max-w-full">
            <div className="inline-flex items-center p-1 bg-muted/50 border rounded-full gap-1 h-12 shrink-0">
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
                        layoutId="activeTabPill_CreateView"
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

          {/* Tab Content Body */}
          <div className="flex-1 py-4 w-full space-y-6">
            {/* CONTENT TAB */}
            <TabsContent value="content" className="m-0 space-y-6">
              {/* Broadcast Type Selection */}
              <div className="space-y-2.5 p-4 rounded-2xl border bg-muted/10">
                <Label className="text-xs font-bold tracking-wide uppercase text-muted-foreground">
                  Broadcast Type *
                </Label>
                <RadioGroup
                  value={type}
                  onValueChange={(val: string) => setType(val as BroadcastType)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      type === "circular" ? "border-primary bg-primary/5 font-bold shadow-sm" : "bg-card hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem value="circular" id="type-circular" />
                    <div>
                      <div className="text-sm font-bold text-foreground">Circular</div>
                      <div className="text-xs text-muted-foreground font-normal mt-0.5">
                        General notices, company policy updates, organizational announcements
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      type === "document" ? "border-primary bg-primary/5 font-bold shadow-sm" : "bg-card hover:border-primary/40"
                    }`}
                  >
                    <RadioGroupItem value="document" id="type-document" />
                    <div>
                      <div className="text-sm font-bold text-foreground">Document</div>
                      <div className="text-xs text-muted-foreground font-normal mt-0.5">
                        Standard Operating Procedures (SOPs), manuals, technical specs, training decks
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">Title *</Label>
                <Input
                  placeholder="Enter broadcast title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 text-sm rounded-xl"
                />
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">Summary (Optional)</Label>
                <Input
                  placeholder="Enter short summary..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="h-11 text-sm rounded-xl"
                />
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">Content *</Label>
                <QuillEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write your broadcast content here..."
                  minHeight="220px"
                />
              </div>

              {/* Video Links */}
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-muted-foreground" /> Video Links (YouTube)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste YouTube video URL..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="h-10 text-xs flex-1 rounded-xl"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddVideo} className="h-10 text-xs gap-1 rounded-xl">
                    <Plus className="w-4 h-4" /> Add Video
                  </Button>
                </div>
                {videoLinks.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {videoLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20 text-xs">
                        <span className="truncate text-muted-foreground">{link}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => handleRemoveVideo(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-muted-foreground" /> Attachments
                  </Label>
                </div>

                <input
                  id="fullpage-file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <label
                  htmlFor="fullpage-file-upload"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="block border border-dashed rounded-2xl p-8 text-center bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs font-bold">Drag & drop files here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports: PDF, DOC, PPT, XLS, Images, Videos (Up to 50MB)
                  </p>
                </label>

                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-3 rounded-xl border bg-card text-xs">
                        <div className="flex items-center gap-3 truncate">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate font-semibold">{att.name}</span>
                          <span className="text-muted-foreground text-xs">({att.size})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleRemoveAttachment(att.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* AUDIENCE TAB: MULTIPLE ROLE & FRANCHISE SELECTION WITH HUMAN READABLE NAMES */}
            <TabsContent value="audience" className="m-0 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold">Target Audience Type</Label>
                <RadioGroup
                  value={audienceType}
                  onValueChange={(val: string) => setAudienceType(val as any)}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${audienceType === "ALL" ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="ALL" id="aud-all" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-bold">All Organization Users</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Broadcast will be sent to all active users across all departments and branches.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${audienceType === "ROLE" ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="ROLE" id="aud-role" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary" /> Specific User Roles (Select Multiple)
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Target specific CRM roles (e.g., Sales Executive, Site Supervisor, Factory Manager, etc.).</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${audienceType === "FRANCHISE" ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="FRANCHISE" id="aud-franchise" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" /> Specific Franchises (Select Multiple)
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Limit broadcast visibility to specific franchise branches.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${audienceType === "USER" ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="USER" id="aud-user" className="mt-0.5" />
                    <div>
                      <div className="text-sm font-bold flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary" /> Specific Users (Select Multiple)
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Target specific users by searching their name, email, or role.</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* MULTIPLE ROLE SELECTION CONTAINER WITH HUMAN READABLE ROLE NAMES */}
              {audienceType === "ROLE" && (
                <div className="p-5 border rounded-2xl bg-muted/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Select CRM Roles ({selectedRoleIds.length} selected)</h4>
                      <p className="text-xs text-muted-foreground">Check all user roles that should receive this broadcast</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllRoles} className="h-8 text-xs rounded-lg">
                        {selectedRoleIds.length === filteredRoles.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  </div>

                  {/* Search Roles */}
                  <div className="relative border rounded-xl bg-background flex flex-wrap items-center gap-2 p-1 pl-3 min-h-[44px]">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    
                    {selectedRoleIds.map((id) => {
                      const role = userRolesList.find((r) => r.id === id);
                      if (!role) return null;
                      const name = role.user_type || role.user_type_name || role.name || `Role #${id}`;
                      return (
                        <Badge key={id} variant="secondary" className="text-[10px] py-0.5 flex items-center gap-1 shrink-0">
                          {name}
                          <X className="w-3 h-3 cursor-pointer" onClick={(e) => { e.preventDefault(); toggleRoleSelect(id); }} />
                        </Badge>
                      );
                    })}

                    <Input
                      placeholder={selectedRoleIds.length === 0 ? "Search roles (e.g. Sales Executive...)" : "Search more..."}
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      className="flex-1 border-0 h-8 shadow-none focus-visible:ring-0 px-1 text-xs min-w-[150px] bg-transparent"
                    />
                  </div>

                  {/* Checkbox Grid for CRM User Roles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                    {filteredRoles.map((role: any) => {
                      const roleName = role.user_type || role.user_type_name || role.name || `Role #${role.id}`;
                      const isChecked = selectedRoleIds.includes(role.id);
                      return (
                        <label
                          key={role.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked ? "border-primary bg-primary/10 font-bold" : "bg-card hover:border-primary/40"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleRoleSelect(role.id)}
                          />
                          <div className="truncate text-xs">
                            <span className="font-semibold text-foreground truncate block">{roleName}</span>
                            <span className="text-[10px] text-muted-foreground">Role ID: #{role.id}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MULTIPLE FRANCHISE SELECTION CONTAINER */}
              {audienceType === "FRANCHISE" && (
                <div className="p-5 border rounded-2xl bg-muted/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Select Franchises ({selectedFranchiseIds.length} selected)</h4>
                      <p className="text-xs text-muted-foreground">Check all franchise units that should receive this broadcast</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllFranchises} className="h-8 text-xs rounded-lg">
                        {selectedFranchiseIds.length === filteredFranchises.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  </div>

                  {/* Search Franchises */}
                  <div className="relative border rounded-xl bg-background flex flex-wrap items-center gap-2 p-1 pl-3 min-h-[44px]">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    
                    {selectedFranchiseIds.map((id) => {
                      const fran = franchisesData?.find((f: any) => f.id === id);
                      if (!fran) return null;
                      const name = fran.franchise_name || `Franchise #${id}`;
                      return (
                        <Badge key={id} variant="secondary" className="text-[10px] py-0.5 flex items-center gap-1 shrink-0">
                          {name}
                          <X className="w-3 h-3 cursor-pointer" onClick={(e) => { e.preventDefault(); toggleFranchiseSelect(id); }} />
                        </Badge>
                      );
                    })}

                    <Input
                      placeholder={selectedFranchiseIds.length === 0 ? "Search franchises..." : "Search more..."}
                      value={franchiseSearch}
                      onChange={(e) => setFranchiseSearch(e.target.value)}
                      className="flex-1 border-0 h-8 shadow-none focus-visible:ring-0 px-1 text-xs min-w-[150px] bg-transparent"
                    />
                  </div>

                  {/* Checkbox Grid for Franchises */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                    {filteredFranchises.map((fran: any) => {
                      const isChecked = selectedFranchiseIds.includes(fran.id);
                      return (
                        <label
                          key={fran.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked ? "border-primary bg-primary/10 font-bold" : "bg-card hover:border-primary/40"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleFranchiseSelect(fran.id)}
                          />
                          <div className="truncate text-xs">
                            <span className="font-semibold text-foreground truncate block">{fran.franchise_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {fran.franchise_code || `ID: #${fran.id}`}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MULTIPLE USER SELECTION CONTAINER */}
              {audienceType === "USER" && (
                <div className="p-5 border rounded-2xl bg-muted/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Select Users ({selectedUserIds.length} selected)</h4>
                      <p className="text-xs text-muted-foreground">Search and check all users who should receive this broadcast</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllUsers} className="h-8 text-xs rounded-lg">
                        {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  </div>

                  {/* Search Users */}
                  <div className="relative border rounded-xl bg-background flex flex-wrap items-center gap-2 p-1.5 pl-3 min-h-[44px]">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    
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
                      placeholder={selectedUserIds.length === 0 ? "Search users by name, email, or role..." : "Search more..."}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="flex-1 border-0 h-8 shadow-none focus-visible:ring-0 px-1 text-xs min-w-[150px] bg-transparent"
                    />
                  </div>

                  {/* Checkbox Grid for CRM Users */}
                  {isLoadingUsers ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">Loading users list...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">No users found matching "{userSearch}"</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                      {filteredUsers.map((usr: any) => {
                        const userName = usr.user_name || `User #${usr.id}`;
                        const isChecked = selectedUserIds.includes(usr.id);
                        const roleTitle = usr.user_type?.user_type || usr.user_type?.user_type_name || "";
                        return (
                          <label
                            key={usr.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
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
            <TabsContent value="schedule" className="m-0 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">Publishing Timing & Schedule</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose whether to broadcast this notice immediately or schedule it for automatic future release.
                  </p>
                </div>

                <RadioGroup value={scheduleType} onValueChange={setScheduleType} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${scheduleType === "now" ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="now" id="sched-now" className="mt-1" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">Publish Immediately</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] font-bold">
                          INSTANT
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Broadcast will be published and delivered instantly to all targeted audience members upon clicking publish.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${scheduleType === "later" ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/40"}`}>
                    <RadioGroupItem value="later" id="sched-later" className="mt-1" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">Schedule for Later</span>
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px] font-bold">
                          AUTOMATED
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Specify exact future date & time. System will automatically release this broadcast at the scheduled time.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {scheduleType === "later" && (
                <div className="p-6 border rounded-2xl bg-muted/10 space-y-5 animate-in fade-in-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <Label className="text-xs font-bold text-foreground">Select Publishing Date & Time *</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Timezone: Asia/Kolkata (IST GMT+5:30)</p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono font-bold w-fit px-3 py-1">
                      {publishDate ? new Date(publishDate).toLocaleString() : "No Date Selected"}
                    </Badge>
                  </div>

                  <div className="w-full pt-2">
                    <ModernDateTimePicker
                      value={publishDate}
                      onChange={setPublishDate}
                    />
                  </div>

                  <div className="p-4 rounded-xl border bg-card text-xs space-y-2">
                    <div className="font-bold flex items-center gap-2 text-primary">
                      <CalendarIcon className="w-4 h-4" /> Scheduled Release Information
                    </div>
                    <p className="text-muted-foreground">
                      This broadcast will remain in <strong className="text-foreground">Scheduled</strong> status until the release timestamp. You can edit or cancel scheduled broadcasts at any time prior to publication.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* PREVIEW TAB */}
            <TabsContent value="preview" className="m-0 space-y-4">
              <div className="border rounded-2xl p-6 bg-card space-y-5 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b">
                  <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-wider px-3 py-1 border-primary/40 text-primary">
                    {type}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground">{title || "Untitled Broadcast"}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Published by {user?.user_name || "Super Admin"} • Target: {audienceType}
                  </p>
                </div>

                {summary && (
                  <div className="p-4 bg-muted/30 rounded-xl text-xs italic text-muted-foreground border">
                    "{summary}"
                  </div>
                )}

                <div
                  className="text-xs space-y-2 leading-relaxed p-2"
                  dangerouslySetInnerHTML={{ __html: content || "<p className='text-muted-foreground'>Broadcast body preview...</p>" }}
                />

                {attachments.length > 0 && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="text-xs font-bold">Attachments ({attachments.length})</div>
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20 text-xs">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-bold truncate flex-1">{att.name}</span>
                        <span className="text-muted-foreground text-xs">{att.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

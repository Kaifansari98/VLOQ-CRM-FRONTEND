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
  ExternalLink,
} from "lucide-react";
import { BroadcastItem, BroadcastType } from "@/types/broadcast";
import { useUserTypes, useUsersForMaster } from "@/hooks/useTypesMaster";
import { useFranchisesByVendorId } from "@/api/franchise";
import { useAppSelector } from "@/redux/store";
import { CreateBroadcastPayload, stripHtmlAndEntities, useBroadcastCategories } from "@/api/broadcast";
import { toastManager } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DocumentCard from "@/components/utils/documentCard";
import { getYouTubeEmbedUrl } from "@/lib/utils";

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

interface MultiSelectOption {
  id: number;
  label: string;
  sublabel?: string;
}

interface MultiSelectDropdownProps {
  title: string;
  placeholder: string;
  options: MultiSelectOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onSelectAll?: () => void;
  isLoading?: boolean;
  dropUp?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  title,
  placeholder,
  options,
  selectedIds,
  onToggle,
  onSelectAll,
  isLoading,
  dropUp = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  const selectedCount = selectedIds.length;

  return (
    <div className="p-4 border rounded-2xl bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-bold text-foreground block">
            {title} ({selectedCount} selected)
          </Label>
        </div>
        {onSelectAll && options.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="h-7 text-xs rounded-lg px-2.5 cursor-pointer"
          >
            {selectedCount === options.length ? "Deselect All" : "Select All"}
          </Button>
        )}
      </div>

      <div className="relative">
        <div
          onClick={() => setOpen(true)}
          className="relative min-h-[44px] w-full border rounded-xl bg-background p-1.5 pl-3 flex flex-wrap items-center gap-1.5 cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-1" />
          
          {selectedIds.map((id) => {
            const opt = options.find((o) => o.id === id);
            const label = opt ? opt.label : `#${id}`;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="text-xs font-semibold py-1 px-2.5 rounded-lg flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 shrink-0"
              >
                {label}
                <X
                  className="w-3.5 h-3.5 hover:text-destructive cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(id);
                  }}
                />
              </Badge>
            );
          })}

          <input
            type="text"
            placeholder={selectedCount === 0 ? placeholder : "Search and add more..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            className="flex-1 bg-transparent border-0 text-xs focus:outline-hidden px-1.5 min-w-[140px]"
          />
        </div>

        {open && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
            />
            <div className={`absolute ${dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"} left-0 right-0 z-40 bg-popover text-popover-foreground border shadow-xl rounded-2xl p-2 max-h-60 overflow-y-auto space-y-1`}>
              {isLoading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Loading options...</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No items match "{search}"</div>
              ) : (
                filtered.map((opt) => {
                  const isChecked = selectedIds.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => onToggle(opt.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-primary/10 border-primary/30 font-bold text-primary"
                          : "hover:bg-muted/60 border-transparent"
                      }`}
                    >
                      <Checkbox checked={isChecked} onCheckedChange={() => {}} />
                      <div className="truncate flex-1">
                        <span className="font-semibold block truncate text-foreground">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-[10px] text-muted-foreground block truncate">{opt.sublabel}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

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
  
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useBroadcastCategories(vendorId);
  const categoriesList = useMemo(() => {
    if (!categoriesResponse) return [];
    if (Array.isArray((categoriesResponse as any).data)) return (categoriesResponse as any).data;
    if (Array.isArray(categoriesResponse)) return categoriesResponse as any;
    return [];
  }, [categoriesResponse]);

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

  const franchiseOptions = useMemo(() => {
    return (franchisesData || []).map((f: any) => ({
      id: Number(f.id),
      label: f.franchise_name || `Franchise #${f.id}`,
      sublabel: f.franchise_code || `ID: #${f.id}`,
    }));
  }, [franchisesData]);

  const roleOptions = useMemo(() => {
    return userRolesList.map((r: any) => ({
      id: Number(r.id),
      label: r.user_type || r.user_type_name || r.name || `Role #${r.id}`,
      sublabel: `Role ID: #${r.id}`,
    }));
  }, [userRolesList]);

  const userOptions = useMemo(() => {
    return usersList.map((u: any) => ({
      id: Number(u.id),
      label: u.user_name || `User #${u.id}`,
      sublabel: `${u.user_type?.user_type || u.user_type?.user_type_name || "User"} • ${u.user_email || `ID: #${u.id}`}`,
    }));
  }, [usersList]);

  const [activeTab, setActiveTab] = useState<string>("content");

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<BroadcastType | "">("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [content, setContent] = useState("");
  const [department, setDepartment] = useState("Operations");

  // Audience State (Support Multiple Roles, Franchises and Users)
  const [audienceType, setAudienceType] = useState<"ALL" | "ROLE" | "FRANCHISE" | "USER" | "CUSTOM" | "">("CUSTOM");
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedFranchiseIds, setSelectedFranchiseIds] = useState<number[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [targetUserIdsInput, setTargetUserIdsInput] = useState<string>("");
  const [roleSearch, setRoleSearch] = useState("");
  const [franchiseSearch, setFranchiseSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Schedule & Attachments
  const [scheduleType, setScheduleType] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<
    Array<{ id: string; name: string; size: string; type: string; fileObj?: File; url?: string }>
  >([]);
  const [scheduleVisited, setScheduleVisited] = useState(false);

  // Validation error states
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (errors.audience && (selectedFranchiseIds.length > 0 || selectedRoleIds.length > 0 || selectedUserIds.length > 0 || audienceType === "ALL")) {
      setErrors((prev) => ({ ...prev, audience: false }));
    }
  }, [selectedFranchiseIds, selectedRoleIds, selectedUserIds, audienceType, errors.audience]);

  useEffect(() => {
    if (scheduleType) {
      setErrors((prev) => ({ ...prev, scheduleType: false }));
    }
  }, [scheduleType]);

  useEffect(() => {
    if (publishDate) {
      setErrors((prev) => ({ ...prev, publishDate: false }));
    }
  }, [publishDate]);

  // Check if each of the 3 tabs' required data has been filled
  const isContentFilled = useMemo(() => {
    if (!type) return false;
    const hasTitle = Boolean(title && title.trim() !== "");
    const cleanContent = stripHtmlAndEntities(content || "");
    const hasContent = Boolean(cleanContent && cleanContent.trim() !== "");
    const hasCategory = type !== "document" || Boolean(categoryId && categoryId.trim() !== "");
    return hasTitle && hasContent && hasCategory;
  }, [title, content, type, categoryId]);

  const isAudienceFilled = useMemo(() => {
    if (audienceType === "ALL") return true;
    return (
      selectedRoleIds.length > 0 ||
      selectedFranchiseIds.length > 0 ||
      selectedUserIds.length > 0
    );
  }, [audienceType, selectedRoleIds, selectedFranchiseIds, selectedUserIds]);

  const isScheduleFilled = useMemo(() => {
    if (scheduleType === "now") return true;
    if (scheduleType === "later") {
      return Boolean(publishDate && publishDate.trim() !== "" && new Date(publishDate) >= new Date());
    }
    return false;
  }, [scheduleType, publishDate]);

  const isAllTabsFilled = isContentFilled && isAudienceFilled && isScheduleFilled;

  // Tooltip explaining which mandatory tab fields are missing before publishing
  const missingFieldsTooltip = useMemo(() => {
    if (isAllTabsFilled) return "";
    const missing: string[] = [];
    if (!isContentFilled) {
      const contentParts: string[] = [];
      if (!type) contentParts.push("Broadcast Type");
      if (!title || !title.trim()) contentParts.push("Title");
      if (!content || !stripHtmlAndEntities(content).trim()) contentParts.push("Content");
      if (type === "document" && (!categoryId || !categoryId.trim())) contentParts.push("Category");
      missing.push(`Content Tab (${contentParts.join(", ") || "Incomplete"})`);
    }
    if (!isAudienceFilled) {
      missing.push("Audience Tab (Target Audience)");
    }
    if (!isScheduleFilled) {
      if (!scheduleType) {
        missing.push("Schedule Tab (Timing Option)");
      } else if (scheduleType === "later" && (!publishDate || new Date(publishDate) < new Date())) {
        missing.push("Schedule Tab (Valid Future Date & Time)");
      }
    }
    return `Please fill required fields in: ${missing.join(" • ")}`;
  }, [isAllTabsFilled, isContentFilled, isAudienceFilled, isScheduleFilled, title, content, type, categoryId, scheduleType, publishDate]);

  // Hydrate form fields when editing an existing broadcast
  useEffect(() => {
    if (editingBroadcast) {
      setTitle(editingBroadcast.title || "");
      setType(editingBroadcast.type?.toLowerCase() as BroadcastType || "");
      setCategoryId(String(editingBroadcast.category_id || ""));
      setContent(editingBroadcast.content || "");
      setDepartment(editingBroadcast.department || "Operations");
      setScheduleVisited(true);
      
      const scope = editingBroadcast.audienceScope;
      if (scope && scope !== "ALL") {
        setAudienceType("CUSTOM");
      } else {
        setAudienceType("ALL");
      }
      
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
            size: att.size || "-",
            type: att.type || "pdf",
            url: att.url,
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

        const roleTargetIds = editingBroadcast.audiences
          .filter((a: any) => a.audienceType === "ROLE" && a.targetId)
          .map((a: any) => Number(a.targetId));
        if (roleTargetIds.length > 0) {
          setSelectedRoleIds(roleTargetIds);
        }

        const franchiseTargetIds = editingBroadcast.audiences
          .filter((a: any) => a.audienceType === "FRANCHISE" && a.targetId)
          .map((a: any) => Number(a.targetId));
        if (franchiseTargetIds.length > 0) {
          setSelectedFranchiseIds(franchiseTargetIds);
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
    const numId = Number(id);
    console.log("[Broadcast] Selected Role ID:", numId);
    if (selectedRoleIds.includes(numId)) {
      const updated = selectedRoleIds.filter((rId) => rId !== numId);
      console.log("[Broadcast] Updated Selected Role IDs:", updated);
      setSelectedRoleIds(updated);
    } else {
      const updated = [...selectedRoleIds, numId];
      console.log("[Broadcast] Updated Selected Role IDs:", updated);
      setSelectedRoleIds(updated);
    }
  };

  const toggleSelectAllRoles = () => {
    if (selectedRoleIds.length === filteredRoles.length) {
      setSelectedRoleIds([]);
    } else {
      setSelectedRoleIds(filteredRoles.map((r: any) => Number(r.id)));
    }
  };

  const toggleFranchiseSelect = (id: number) => {
    const numId = Number(id);
    if (selectedFranchiseIds.includes(numId)) {
      setSelectedFranchiseIds(selectedFranchiseIds.filter((fId) => fId !== numId));
    } else {
      setSelectedFranchiseIds([...selectedFranchiseIds, numId]);
    }
  };

  const toggleSelectAllFranchises = () => {
    if (selectedFranchiseIds.length === filteredFranchises.length) {
      setSelectedFranchiseIds([]);
    } else {
      setSelectedFranchiseIds(filteredFranchises.map((f: any) => Number(f.id)));
    }
  };

  const toggleUserSelect = (id: number) => {
    const numId = Number(id);
    if (selectedUserIds.includes(numId)) {
      setSelectedUserIds(selectedUserIds.filter((uId) => uId !== numId));
    } else {
      setSelectedUserIds([...selectedUserIds, numId]);
    }
  };

  const toggleSelectAllUsers = () => {
    if (selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u: any) => Number(u.id)));
    }
  };

  const handleAddVideo = () => {
    const trimmed = videoUrlInput.trim();
    if (!trimmed) return;

    const embedUrl = getYouTubeEmbedUrl(trimmed);
    if (!embedUrl) {
      toastManager.add({
        title: "Please enter a valid YouTube video URL",
        type: "error",
      });
      return;
    }

    setVideoLinks([...videoLinks, trimmed]);
    setVideoUrlInput("");
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
        url: URL.createObjectURL(f),
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
    const newErrors: Record<string, boolean> = {};

    let hasContentError = false;
    if (!title || !title.trim()) {
      newErrors.title = true;
      hasContentError = true;
    }

    if (type === "document" && (!categoryId || !categoryId.trim())) {
      newErrors.categoryId = true;
      hasContentError = true;
    }

    const textContent = content.replace(/<[^>]*>/g, "").trim();
    if (!content || !textContent) {
      newErrors.content = true;
      hasContentError = true;
    }

    if (hasContentError) {
      setErrors(newErrors);
      if (newErrors.title) {
        toastManager.add({ title: "Title is required.", type: "error" });
      } else if (newErrors.categoryId) {
        toastManager.add({ title: "Category is required for Document broadcasts.", type: "error" });
      } else {
        toastManager.add({ title: "Content is required.", type: "error" });
      }
      setActiveTab("content");
      return;
    }

    if (status === "published") {
      // 2. Check Audience Tab
      if (
        audienceType !== "ALL" &&
        selectedFranchiseIds.length === 0 &&
        selectedRoleIds.length === 0 &&
        selectedUserIds.length === 0
      ) {
        newErrors.audience = true;
        setErrors(newErrors);
        toastManager.add({
          title: "Please select at least one Franchise, User Role, or Specific User.",
          type: "error",
        });
        setActiveTab("audience");
        return;
      }

      // 3. Check Schedule Tab
      let hasScheduleError = false;
      if (!scheduleType) {
        newErrors.scheduleType = true;
        hasScheduleError = true;
      } else if (scheduleType === "later" && !publishDate) {
        newErrors.publishDate = true;
        hasScheduleError = true;
      }

      if (hasScheduleError) {
        setErrors(newErrors);
        if (newErrors.scheduleType) {
          toastManager.add({ title: "Please select a Publishing Timing Option.", type: "error" });
        } else {
          toastManager.add({ title: "Please select a Publishing Date & Time.", type: "error" });
        }
        setActiveTab("schedule");
        return;
      }
    }

    setErrors({});

    if (status === "published" && !scheduleVisited) {
      toastManager.add({
        title: "Please review and select options in the Schedule tab first.",
        type: "error",
      });
      setActiveTab("schedule");
      return;
    }

    // Build backend audiences array supporting MULTIPLE selections
    let audiencePayloadList: Array<{ audienceType: "ALL" | "ROLE" | "USER" | "FRANCHISE"; targetId?: number | null }> = [];
    let audienceLabel = "All Users";

    if (audienceType === "ALL") {
      audiencePayloadList = [{ audienceType: "ALL", targetId: null }];
      audienceLabel = "All Users";
    } else {
      // Handles CUSTOM selection (combination of FRANCHISE, ROLE, and USER)
      const labelParts: string[] = [];

      if (selectedFranchiseIds.length > 0) {
        selectedFranchiseIds.forEach((fId) => {
          audiencePayloadList.push({ audienceType: "FRANCHISE", targetId: fId });
        });
        const matchedFran = (franchisesData || [])
          .filter((f: any) => selectedFranchiseIds.includes(Number(f.id)))
          .map((f: any) => f.franchise_name);
        labelParts.push(...matchedFran);
      }

      if (selectedRoleIds.length > 0) {
        selectedRoleIds.forEach((rId) => {
          audiencePayloadList.push({ audienceType: "ROLE", targetId: rId });
        });
        const matchedRoles = userRolesList
          .filter((r) => selectedRoleIds.includes(Number(r.id)))
          .map((r) => r.user_type || r.user_type_name || r.name || `Role #${r.id}`);
        labelParts.push(...matchedRoles);
      }

      if (selectedUserIds.length > 0) {
        selectedUserIds.forEach((uId) => {
          audiencePayloadList.push({ audienceType: "USER", targetId: uId });
        });
        const matchedUsers = usersList
          .filter((u: any) => selectedUserIds.includes(Number(u.id)))
          .map((u: any) => u.user_name || `User #${u.id}`);
        labelParts.push(...matchedUsers);
      }

      if (audiencePayloadList.length === 0) {
        audiencePayloadList = [{ audienceType: "ALL", targetId: null }];
        audienceLabel = "All Users";
      } else {
        audienceLabel = labelParts.join(", ");
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
    const selectedCategoryObj = categoriesList.find((cat: any) => String(cat.id) === String(categoryId));
    const selectedCategoryName = selectedCategoryObj?.category || undefined;

    const backendPayload: CreateBroadcastPayload = {
      title,
      category: type === "document" ? selectedCategoryName : undefined,
      category_id: type === "document" && categoryId ? Number(categoryId) : undefined,
      content: content || "No body content",
      type: type === "document" ? "DOCUMENT" : "CIRCULAR",
      status: effectiveStatus === "draft" ? "INACTIVE" : "ACTIVE",
      publishAt: finalPublishDate,
      vendorId: vendorId || undefined,
      userTypeId: audienceType === "ROLE" && selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
      userTypeIds: audienceType === "ROLE" && selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
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
      type: (type || "circular") as BroadcastType,
      category: type === "document" ? selectedCategoryName : undefined,
      category_id: type === "document" && categoryId ? Number(categoryId) : undefined,
      status: effectiveStatus === "published" && scheduleType === "later" && !overridePublishNow ? "scheduled" : effectiveStatus,
      summary: "",
      content: content || "No content body provided.",
      department,
      audience: audienceLabel,
      audienceScope: audienceType,
      publishDate: overridePublishNow || scheduleType === "now" ? new Date().toLocaleString() : publishDate || new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
      updatedBy: {
        name: user?.user_name || "Super Admin",
        role: "Super Admin",
      },
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

  const handleTabChange = (tabId: string) => {
    if (tabId === "schedule") {
      setScheduleVisited(true);
    }
    setActiveTab(tabId);
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
       
          {editingBroadcast && (editingBroadcast.status === "scheduled" || scheduleType === "later") && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!isAllTabsFilled}
                      onClick={() => handleSubmit("published", true)}
                      className={`flex-1 sm:flex-none rounded-xl h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 px-4 shadow-sm ${
                        !isAllTabsFilled ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      <Send className="w-4 h-4" /> Publish Now
                    </Button>
                  </span>
                </TooltipTrigger>
                {missingFieldsTooltip && (
                  <TooltipContent side="bottom" className="dark text-xs max-w-sm">
                    {missingFieldsTooltip}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    disabled={!isAllTabsFilled}
                    onClick={() => handleSubmit("published")}
                    className={`w-full sm:w-auto rounded-xl h-10 text-xs font-semibold px-5 transition-all ${
                      !isAllTabsFilled ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {editingBroadcast ? "Save Changes" : "Publish Broadcast"}
                  </Button>
                </span>
              </TooltipTrigger>
              {missingFieldsTooltip && (
                <TooltipContent side="bottom" className="dark text-xs max-w-sm">
                  {missingFieldsTooltip}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Full Page Card */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
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
                    onClick={() => handleTabChange(tab.id)}
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

              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className={`space-y-2 ${type === "document" ? "md:col-span-8" : "md:col-span-12"}`}>
                  <Label className={`text-xs font-bold transition-colors ${errors.title ? "text-red-500" : ""}`}>Title *</Label>
                  <Input
                    placeholder="Enter broadcast title..."
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) {
                        setErrors((prev) => ({ ...prev, title: false }));
                      }
                    }}
                    className={`h-11 text-sm rounded-xl transition-all duration-200 ${
                      errors.title ? "border-red-500 focus-visible:ring-red-500 bg-red-50/5" : ""
                    }`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">Title is required</p>}
                </div>

                {/* Category Dropdown (Shown when Document tab is selected) */}
                {type === "document" && (
                  <div className="md:col-span-4 space-y-2">
                    <Label className={`text-xs font-bold transition-colors ${errors.categoryId ? "text-red-500" : ""}`}>Category *</Label>
                    <Select 
                      value={categoryId} 
                      onValueChange={(val) => {
                        setCategoryId(val);
                        if (errors.categoryId) {
                          setErrors((prev) => ({ ...prev, categoryId: false }));
                        }
                      }}
                    >
                      <SelectTrigger className={`h-11 text-sm rounded-xl transition-all duration-200 ${errors.categoryId ? "border-red-500 ring-1 ring-red-500 bg-red-50/5" : ""}`}>
                        <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesList.map((cat: any) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && <p className="text-xs text-red-500 mt-1">Category is required</p>}
                  </div>
                )}
              </div>


              {/* Rich Text Editor */}
              <div className="space-y-2">
                <Label className={`text-xs font-bold transition-colors ${errors.content ? "text-red-500" : ""}`}>Content *</Label>
                <QuillEditor
                  value={content}
                  onChange={(val) => {
                    setContent(val);
                    if (errors.content) {
                      setErrors((prev) => ({ ...prev, content: false }));
                    }
                  }}
                  placeholder="Write your broadcast content here..."
                  minHeight="220px"
                  className={errors.content ? "border-red-500 ring-1 ring-red-500" : ""}
                />
                {errors.content && <p className="text-xs text-red-500 mt-1">Content is required</p>}
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
                  <div className={attachments.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3" : "grid grid-cols-1 gap-2.5 mt-3"}>
                    {attachments.map((att, idx) => (
                      <DocumentCard
                        key={att.id || idx}
                        doc={{
                          id: idx + 1,
                          originalName: att.name || "Attachment",
                          signedUrl: att.url || "",
                        }}
                        canDelete={true}
                        onDelete={() => handleRemoveAttachment(att.id)}
                        compact={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* AUDIENCE TAB: MULTIPLE ROLE & FRANCHISE SELECTION WITH HUMAN READABLE NAMES */}
            <TabsContent value="audience" className="m-0 space-y-6 pb-36">
              <div className="space-y-3">
                <div
                  onClick={() => setAudienceType(audienceType === "ALL" ? "CUSTOM" : "ALL")}
                  className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer select-none transition-all ${
                    audienceType === "ALL"
                      ? "border-primary bg-primary/5 shadow-sm font-semibold text-primary"
                      : "border-border bg-card hover:border-primary/40 text-foreground"
                  }`}
                >
                  <Checkbox
                    id="send-all-users"
                    checked={audienceType === "ALL"}
                    onCheckedChange={(checked) => setAudienceType(checked ? "ALL" : "CUSTOM")}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-bold leading-none">Send to all active organization users</div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      If checked, this broadcast will be distributed globally to all branches, departments, and roles. Custom target filters below will be disabled.
                    </p>
                  </div>
                </div>
              </div>

              {/* SEARCHABLE MULTI-SELECT DROPDOWNS */}
              <div
                className={`space-y-4 border p-4 rounded-2xl bg-muted/5 transition-all duration-300 ${
                  audienceType === "ALL" ? "opacity-35 pointer-events-none select-none filter grayscale-[40%]" : ""
                } ${errors.audience ? "border-red-500 ring-1 ring-red-500" : ""}`}
              >
                {/* 1. Franchises Multi-Select Dropdown */}
                <MultiSelectDropdown
                  title="Target Franchises / Branches"
                  placeholder="Select or search franchise branches..."
                  options={franchiseOptions}
                  selectedIds={selectedFranchiseIds}
                  onToggle={toggleFranchiseSelect}
                  onSelectAll={toggleSelectAllFranchises}
                  isLoading={isLoadingFranchises}
                />

                {/* 2. User Roles Multi-Select Dropdown */}
                <MultiSelectDropdown
                  title="Target User Roles"
                  placeholder="Select or search user roles (e.g. Sales Executive)..."
                  options={roleOptions}
                  selectedIds={selectedRoleIds}
                  onToggle={toggleRoleSelect}
                  onSelectAll={toggleSelectAllRoles}
                  isLoading={isLoadingRoles}
                />

                {/* 3. Specific Users Multi-Select Dropdown */}
                <MultiSelectDropdown
                  title="Target Specific Users"
                  placeholder="Select or search specific users by name or email..."
                  options={userOptions}
                  selectedIds={selectedUserIds}
                  onToggle={toggleUserSelect}
                  onSelectAll={toggleSelectAllUsers}
                  isLoading={isLoadingUsers}
                  dropUp={true}
                />
              </div>
              {errors.audience && <p className="text-xs text-red-500 mt-1">Please select at least one Franchise, User Role, or Specific User</p>}
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

                {/* Publish Immediately Checkbox Card */}
                <div
                  onClick={() => setScheduleType(scheduleType === "now" ? "later" : "now")}
                  className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer select-none transition-all ${
                    scheduleType === "now"
                      ? "border-primary bg-primary/5 shadow-sm font-semibold text-primary"
                      : "border-border bg-card hover:border-primary/40 text-foreground"
                  } ${errors.scheduleType ? "border-red-500 ring-1 ring-red-500" : ""}`}
                >
                  <Checkbox
                    id="sched-now-checkbox"
                    checked={scheduleType === "now"}
                    onCheckedChange={(checked) => setScheduleType(checked ? "now" : "later")}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold leading-none">Publish Immediately</span>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px] font-bold py-0.5">
                        INSTANT
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      Broadcast will be published and delivered instantly to all targeted audience members upon clicking publish.
                    </p>
                  </div>
                </div>
                {errors.scheduleType && <p className="text-xs text-red-500 mt-1">Please select a Publishing Timing Option</p>}
              </div>

              {/* Schedule for Later Date Time Picker (Faded/disabled if checked) */}
              <div
                className={`p-6 border rounded-2xl bg-muted/10 space-y-5 transition-all duration-300 ${
                  scheduleType === "now" ? "opacity-35 pointer-events-none select-none filter grayscale-[40%]" : ""
                } ${errors.publishDate ? "border-red-500 ring-1 ring-red-500" : ""}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <Label className={`text-xs font-bold transition-colors ${errors.publishDate ? "text-red-500" : "text-foreground"}`}>Select Publishing Date & Time *</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Timezone: Asia/Kolkata (IST GMT+5:30)</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono font-bold w-fit px-3 py-1">
                    {publishDate ? new Date(publishDate).toLocaleString() : "No Date Selected"}
                  </Badge>
                </div>

                <div className="w-full pt-2" onClick={() => { if (scheduleType !== "later") setScheduleType("later"); }}>
                  <ModernDateTimePicker
                    value={publishDate}
                    onChange={(val) => {
                      setPublishDate(val);
                      if (scheduleType !== "later") {
                        setScheduleType("later");
                      }
                    }}
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
              {errors.publishDate && <p className="text-xs text-red-500 mt-1">Please select a Publishing Date & Time</p>}
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


                <div className="text-xs space-y-3 leading-relaxed p-4 rounded-xl border bg-muted/10 rich-text-container break-words w-full max-h-[280px] overflow-y-auto min-h-[100px]">
                  <div dangerouslySetInnerHTML={{ __html: content || "<p className='text-muted-foreground'>Broadcast body preview...</p>" }} />
                  <style dangerouslySetInnerHTML={{ __html: `
                    .rich-text-container * {
                      max-width: 100% !important;
                      word-break: break-word !important;
                    }
                    .rich-text-container p {
                      margin-bottom: 0.75rem;
                    }
                    .rich-text-container p:last-child {
                      margin-bottom: 0;
                    }
                    .rich-text-container u {
                      text-decoration: underline;
                    }
                    .rich-text-container s, .rich-text-container strike {
                      text-decoration: line-through;
                    }
                    .rich-text-container strong, .rich-text-container b {
                      font-weight: 700;
                    }
                    .rich-text-container em, .rich-text-container i {
                      font-style: italic;
                    }
                    .rich-text-container ol {
                      list-style-type: decimal;
                      padding-left: 1.25rem;
                    }
                    .rich-text-container ul {
                      list-style-type: disc;
                      padding-left: 1.25rem;
                    }
                  `}} />
                </div>

                {videoLinks && videoLinks.length > 0 && (
                  <div className="pt-4 border-t space-y-3">
                    <div className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                      <Video className="w-4 h-4 text-primary" /> Video Attachments ({videoLinks.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                      {videoLinks.map((url, idx) => {
                        const embedUrl = getYouTubeEmbedUrl(url);
                        return (
                          <div key={idx} className="border rounded-xl overflow-hidden bg-card p-2 space-y-2 shadow-xs">
                            {embedUrl ? (
                              <div className="relative w-full aspect-video max-h-[200px] rounded-lg overflow-hidden bg-black">
                                <iframe
                                  src={embedUrl}
                                  title={`Video ${idx + 1}`}
                                  className="w-full h-full rounded-lg border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <a
                                href={url.startsWith("http") ? url : `https://${url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-xs text-primary underline p-1"
                              >
                                <ExternalLink className="w-4 h-4" /> Watch Video Tutorial ({url})
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}



                {attachments.length > 0 && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="text-xs font-bold">Attachments ({attachments.length})</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {attachments.map((att, idx) => (
                        <DocumentCard
                          key={att.id || idx}
                          doc={{
                            id: typeof att.id === "number" ? att.id : idx + 1,
                            originalName: att.name || "Attachment",
                            signedUrl: att.url || "",
                          }}
                          compact={true}
                        />
                      ))}
                    </div>
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

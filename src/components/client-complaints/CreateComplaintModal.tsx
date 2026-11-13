"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomeDatePicker from "@/components/date-picker";
import {
  AlertTriangle,
  BadgeCheck,
  Film,
  ImagePlus,
  Link2,
  Loader2,
  MessageSquareWarning,
  Search,
  UserRound,
  X,
} from "lucide-react";
import {
  ComplaintMeta,
  getComplaintDuplicates,
  lookupComplaintLead,
  useCreateComplaint,
} from "@/api/client-complaints";
import {
  ComplaintComponent,
  ComplaintLeadLookup,
  ComplaintPossibleDuplicates,
  CreateClientComplaintInput,
} from "@/types/client-complaints";
import { COMPONENT_LABELS, STATUS_META } from "./complaint-meta";
import { useAppSelector } from "@/redux/store";
import { useVendorBrandStyle } from "@/hooks/use-vendor-theme-color";
import { ComplaintLeadPicker } from "./ComplaintLeadPicker";
import AssignToPicker from "@/components/assign-to-picker";

interface CreateComplaintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: number;
  meta?: ComplaintMeta;
  onCreated: (result: { complaint_code: string; possible_duplicate: boolean }) => void;
}

type ClientMode = "CRM_LEAD" | "EXTERNAL";

const MAX_PHOTOS = 10;
const MAX_VIDEOS = 3;
const MAX_PHOTO_MB = 15;
const MAX_VIDEO_MB = 50;

const emptyExternal = {
  client_name: "",
  client_mobile: "",
  client_alternate_mobile: "",
  client_email: "",
  site_address: "",
  city: "",
  product_type: "",
  installation_date: "",
};

const emptyLeadForm = {
  instance_id: "",
  usable_handover_date: "",
  final_handover_date: "",
  site_address: "",
  site_supervisor_id: "",
  head_site_supervisor_id: "",
};

const emptyDetails = {
  component: "" as ComplaintComponent | "",
  category_id: "",
  description: "",
  additional_remarks: "",
  preferred_visit_date: "",
};

type Errors = Record<string, string | undefined>;

const digitCount = (value: string) => value.replace(/\D/g, "").length;

const formatDate = (value: string | null) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : null;

const apiMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
  (error as Error)?.message ??
  fallback;

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-[11px] font-medium text-destructive">{message}</p> : null;

const ReadOnlyField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="min-w-0">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-xs font-medium text-foreground break-words">{value || "—"}</div>
  </div>
);

interface MediaPickerProps {
  kind: "photo" | "video";
  files: { file: File; url: string }[];
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  error?: string;
}

function MediaPicker({ kind, files, onAdd, onRemove, error }: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const isPhoto = kind === "photo";
  const max = isPhoto ? MAX_PHOTOS : MAX_VIDEOS;
  const Icon = isPhoto ? ImagePlus : Film;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">
          {isPhoto ? "Photos" : "Videos"}{" "}
          {!isPhoto && <span className="text-muted-foreground font-normal">(optional)</span>}
        </Label>
        <span className="text-[11px] text-muted-foreground">
          {files.length}/{max}
          {isPhoto && " · at least 1 required"}
        </span>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onAdd(e.dataTransfer.files);
        }}
        disabled={files.length >= max}
        className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          dragging
            ? "border-primary bg-primary/5"
            : error
              ? "border-destructive/50 bg-destructive/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">
          {isPhoto ? "Upload or drop photos" : "Upload or drop videos"}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {isPhoto ? `JPG, PNG, WEBP, HEIC · ${MAX_PHOTO_MB} MB` : `MP4, MOV, WEBM · ${MAX_VIDEO_MB} MB`}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={isPhoto ? "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif" : "video/mp4,video/quicktime,video/webm"}
        multiple
        hidden
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = "";
        }}
      />
      <FieldError message={error} />
      {files.length > 0 && (
        <div className="grid grid-cols-5 gap-2 pt-1">
          {files.map((p, i) => (
            <div key={p.url} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
              {isPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
              ) : (
                <video src={p.url} className="h-full w-full object-cover" muted />
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                title={`Remove ${kind}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const CreateComplaintModal: React.FC<CreateComplaintModalProps> = ({
  open,
  onOpenChange,
  vendorId,
  meta,
  onCreated,
}) => {
  const isSuperAdmin = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type?.toLowerCase() === "super-admin",
  );
  const brandStyle = useVendorBrandStyle();
  const leadRequestRef = useRef<AbortController | null>(null);
  const createMutation = useCreateComplaint(vendorId);
  const isSubmitting = createMutation.isPending;

  const [mode, setMode] = useState<ClientMode>("CRM_LEAD");
  const [leadCode, setLeadCode] = useState("");
  const [lead, setLead] = useState<ComplaintLeadLookup | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState(emptyLeadForm);
  const [external, setExternal] = useState(emptyExternal);
  const [linkedClient, setLinkedClient] = useState<ComplaintPossibleDuplicates["external_clients"][number] | null>(null);
  const [duplicates, setDuplicates] = useState<ComplaintPossibleDuplicates | null>(null);
  const [details, setDetails] = useState(emptyDetails);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [videos, setVideos] = useState<{ file: File; url: string }[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Release previews and reset everything whenever the modal closes.
  useEffect(() => {
    if (open) return;
    leadRequestRef.current?.abort();
    setLeadLoading(false);
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    setVideos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
    setMode("CRM_LEAD");
    setLeadCode("");
    setLead(null);
    setLeadError(null);
    setLeadForm(emptyLeadForm);
    setExternal(emptyExternal);
    setLinkedClient(null);
    setDuplicates(null);
    setDetails(emptyDetails);
    setErrors({});
    setSubmitError(null);
  }, [open]);

  useEffect(() => () => leadRequestRef.current?.abort(), []);

  // Spec 3.2: warn HO about possible matches; never block or merge.
  useEffect(() => {
    if (!open || mode !== "EXTERNAL" || linkedClient) {
      setDuplicates(null);
      return;
    }
    const hasMobile = digitCount(external.client_mobile) >= 10;
    const hasNameAddress = external.client_name.trim().length > 2 && external.site_address.trim().length > 5;
    if (!hasMobile && !hasNameAddress) {
      setDuplicates(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      getComplaintDuplicates(
        vendorId,
        {
          mobile: hasMobile ? external.client_mobile : undefined,
          name: external.client_name || undefined,
          address: external.site_address || undefined,
        },
        controller.signal,
      )
        .then(setDuplicates)
        .catch(() => undefined);
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, mode, linkedClient, vendorId, external.client_mobile, external.client_name, external.site_address]);

  const clearError = (...keys: string[]) =>
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const fetchLead = async (code = leadCode) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setLeadError("Enter a lead code.");
      return;
    }
    leadRequestRef.current?.abort();
    const request = new AbortController();
    leadRequestRef.current = request;
    setLeadLoading(true);
    setLeadError(null);
    setLead(null);
    try {
      const result = await lookupComplaintLead(vendorId, trimmed, request.signal);
      if (request.signal.aborted) return;
      setLead(result);
      setLeadCode(result.lead_code);
      // Prefill the lead's current SS when it is one of the franchise candidates.
      const defaultSs = result.site_supervisors.find((s) => s.id === result.default_site_supervisor_id);
      setLeadForm({
        ...emptyLeadForm,
        instance_id: result.products.length === 1 ? String(result.products[0].instance_id) : "",
        site_supervisor_id: defaultSs ? String(defaultSs.id) : "",
      });
      clearError(
        "lead_code",
        "instance_id",
        "usable_handover_date",
        "final_handover_date",
        "lead_site_address",
        "site_supervisor_id",
        "head_site_supervisor_id",
      );
    } catch (error) {
      if (!request.signal.aborted) setLeadError(apiMessage(error, "Unable to verify this lead code."));
    } finally {
      if (leadRequestRef.current === request) setLeadLoading(false);
    }
  };

  const clearSelectedLead = () => {
    leadRequestRef.current?.abort();
    setLeadLoading(false);
    setLead(null);
    setLeadCode("");
    setLeadError(null);
  };

  const switchToLead = (code: string) => {
    setMode("CRM_LEAD");
    setLeadCode(code);
    void fetchLead(code);
  };

  const addFiles = (kind: "photo" | "video", list: FileList | null) => {
    if (!list) return;
    const isPhoto = kind === "photo";
    const accepted = Array.from(list).filter((f) => f.type.startsWith(isPhoto ? "image/" : "video/"));
    const maxBytes = (isPhoto ? MAX_PHOTO_MB : MAX_VIDEO_MB) * 1024 * 1024;
    const tooLarge = accepted.filter((f) => f.size > maxBytes);
    const setter = isPhoto ? setPhotos : setVideos;
    setter((prev) => [
      ...prev,
      ...accepted
        .filter((f) => f.size <= maxBytes)
        .slice(0, (isPhoto ? MAX_PHOTOS : MAX_VIDEOS) - prev.length)
        .map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
    setErrors((prev) => ({
      ...prev,
      [isPhoto ? "photos" : "videos"]: tooLarge.length
        ? `${tooLarge.map((f) => f.name).join(", ")} exceeds ${isPhoto ? MAX_PHOTO_MB : MAX_VIDEO_MB} MB.`
        : undefined,
    }));
  };

  const removeFile = (kind: "photo" | "video", index: number) => {
    const setter = kind === "photo" ? setPhotos : setVideos;
    setter((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (mode === "CRM_LEAD") {
      if (!lead) next.lead_code = isSuperAdmin ? "Select a CRM lead first." : "Fetch and verify the lead code first.";
      else {
        if (lead.products.length > 0 && !leadForm.instance_id) next.instance_id = "Select the affected product.";
        if (!lead.usable_handover_date && !leadForm.usable_handover_date)
          next.usable_handover_date = "Usable handover date is required.";
        if (!lead.final_handover_date && !leadForm.final_handover_date)
          next.final_handover_date = "Final handover date is required.";
        if (!lead.site_address && !leadForm.site_address.trim()) next.lead_site_address = "Site address is required.";
        if (lead.site_supervisors.length > 1 && !leadForm.site_supervisor_id)
          next.site_supervisor_id = "Select the site supervisor.";
        if (lead.head_site_supervisors.length > 1 && !leadForm.head_site_supervisor_id)
          next.head_site_supervisor_id = "Select the head site supervisor.";
      }
    } else {
      if (!external.client_name.trim()) next.client_name = "Client name is required.";
      const mobileDigits = digitCount(external.client_mobile);
      if (mobileDigits < 10 || mobileDigits > 15) next.client_mobile = "Enter a valid mobile number.";
      if (external.client_alternate_mobile.trim()) {
        const altDigits = digitCount(external.client_alternate_mobile);
        if (altDigits < 10 || altDigits > 15) next.client_alternate_mobile = "Enter a valid mobile number.";
      }
      if (external.client_email.trim() && !/^\S+@\S+\.\S+$/.test(external.client_email.trim()))
        next.client_email = "Enter a valid email.";
      if (!external.site_address.trim()) next.site_address = "Site address is required.";
      if (!external.city.trim()) next.city = "City is required.";
      if (!external.product_type) next.product_type = "Select the product type.";
    }
    if (!details.component) next.component = "Select the affected component.";
    if (!details.category_id) next.category_id = "Select a complaint category.";
    if (!details.description.trim()) next.description = "Describe the issue.";
    if (photos.length === 0) next.photos = "Add at least one photo of the issue.";
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const common = {
      component: details.component as ComplaintComponent,
      category_id: Number(details.category_id),
      description: details.description.trim(),
      additional_remarks: details.additional_remarks.trim() || undefined,
      preferred_visit_date: details.preferred_visit_date || undefined,
      photos: photos.map((p) => p.file),
      videos: videos.map((v) => v.file),
    };
    const input: CreateClientComplaintInput =
      mode === "CRM_LEAD"
        ? {
            ...common,
            client_mode: "CRM_LEAD",
            lead_code: lead!.lead_code,
            instance_id: leadForm.instance_id ? Number(leadForm.instance_id) : undefined,
            usable_handover_date: lead!.usable_handover_date ? undefined : leadForm.usable_handover_date,
            final_handover_date: lead!.final_handover_date ? undefined : leadForm.final_handover_date,
            site_address: lead!.site_address ? undefined : leadForm.site_address.trim(),
            site_supervisor_id: leadForm.site_supervisor_id ? Number(leadForm.site_supervisor_id) : undefined,
            head_site_supervisor_id: leadForm.head_site_supervisor_id
              ? Number(leadForm.head_site_supervisor_id)
              : undefined,
          }
        : {
            ...common,
            client_mode: "EXTERNAL",
            external_client_id: linkedClient?.id,
            client_name: external.client_name.trim(),
            client_mobile: external.client_mobile.trim(),
            client_alternate_mobile: external.client_alternate_mobile.trim() || undefined,
            client_email: external.client_email.trim() || undefined,
            site_address: external.site_address.trim(),
            city: external.city.trim(),
            product_type: external.product_type,
            installation_date: external.installation_date || undefined,
          };

    try {
      const result = await createMutation.mutateAsync(input);
      onCreated(result);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(apiMessage(error, "Unable to register the complaint."));
    }
  };

  const setExternalField = (key: keyof typeof emptyExternal, value: string) => {
    setExternal((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const linkClient = (client: ComplaintPossibleDuplicates["external_clients"][number]) => {
    setLinkedClient(client);
    setExternal((prev) => ({
      ...prev,
      client_name: client.client_name,
      client_mobile: client.mobile,
      client_email: client.email ?? prev.client_email,
      site_address: client.address,
      city: client.city,
    }));
    clearError("client_name", "client_mobile", "site_address", "city");
  };

  const openLeadComplaints = lead?.existing_complaints.filter(
    (c) => !["CLOSED", "REJECTED", "CANCELLED"].includes(c.status),
  );
  const hasDuplicates = !!duplicates && (duplicates.external_clients.length > 0 || duplicates.leads.length > 0);

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent
        className="sm:max-w-5xl p-0 gap-0 flex flex-col max-h-[92vh] overflow-hidden rounded-2xl"
        // Outside clicks would silently discard a half-filled form and its media.
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-5 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <MessageSquareWarning className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Register Complaint</DialogTitle>
              <DialogDescription className="text-xs mt-1">
                A Complaint ID is generated once the complaint is submitted.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="create-complaint-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 items-stretch"
        >
          {/* Client */}
          <div className={isSuperAdmin && mode === "CRM_LEAD" && !lead ? "flex min-h-0 flex-col gap-5" : "space-y-5"}>
            <div className="grid grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1">
              {(
                [
                  ["CRM_LEAD", "Existing CRM Client", "Has a lead code"],
                  ["EXTERNAL", "Client without Lead Code", "Older or external client"],
                ] as const
              ).map(([value, title, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMode(value);
                    setErrors({});
                    setSubmitError(null);
                  }}
                  className={`rounded-lg px-3 py-2 text-left transition-colors ${
                    mode === value ? "bg-background shadow-sm border" : "hover:bg-background/60"
                  }`}
                >
                  <div className={`text-xs font-semibold ${mode === value ? "text-foreground" : "text-muted-foreground"}`}>
                    {title}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{hint}</div>
                </button>
              ))}
            </div>

            {mode === "CRM_LEAD" ? (
              <section className={isSuperAdmin && !lead ? "flex min-h-0 flex-1 flex-col gap-4" : "space-y-4"}>
                {isSuperAdmin ? (
                  <ComplaintLeadPicker
                    vendorId={vendorId}
                    selectedLead={lead}
                    selecting={leadLoading}
                    onSelect={(code) => void fetchLead(code)}
                    onClear={clearSelectedLead}
                    error={leadError ?? errors.lead_code}
                  />
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Lead Code</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={leadCode}
                          onChange={(e) => {
                            leadRequestRef.current?.abort();
                            setLeadLoading(false);
                            setLeadCode(e.target.value);
                            if (lead) setLead(null);
                            setLeadError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void fetchLead();
                            }
                          }}
                          placeholder="e.g. SHHO-136"
                          className="pl-9 h-9 text-xs rounded-xl"
                          aria-invalid={!!errors.lead_code || !!leadError}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void fetchLead()}
                        disabled={leadLoading}
                        className="h-9 text-xs rounded-xl gap-1.5"
                      >
                        {leadLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        Fetch
                      </Button>
                    </div>
                    <FieldError message={leadError ?? errors.lead_code} />
                  </div>
                )}

                {lead && (
                  <>
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <BadgeCheck className="w-4 h-4" /> Lead verified · details fetched from CRM
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <ReadOnlyField label="Client Name" value={lead.client_name} />
                        <ReadOnlyField label="Mobile Number" value={lead.mobile} />
                        <ReadOnlyField label="Email" value={lead.email} />
                        {lead.site_supervisors.length <= 1 && (
                          <ReadOnlyField label="Site Supervisor" value={lead.site_supervisors[0]?.name ?? "Not assigned"} />
                        )}
                        {lead.head_site_supervisors.length <= 1 && (
                          <ReadOnlyField
                            label="Head Site Supervisor"
                            value={lead.head_site_supervisors[0]?.name ?? "Not assigned"}
                          />
                        )}
                        {lead.site_address && (
                          <div className="col-span-2">
                            <ReadOnlyField label="Site Address" value={lead.site_address} />
                          </div>
                        )}
                        {lead.usable_handover_date && (
                          <ReadOnlyField label="Usable Handover" value={formatDate(lead.usable_handover_date)} />
                        )}
                        {lead.final_handover_date && (
                          <ReadOnlyField label="Final Handover" value={formatDate(lead.final_handover_date)} />
                        )}
                      </div>
                    </div>

                    {openLeadComplaints && openLeadComplaints.length > 0 && (
                      <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-500/10 px-3 py-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" /> This lead already has open complaints
                        </div>
                        {openLeadComplaints.map((c) => (
                          <div key={c.complaint_code} className="text-[11px] text-amber-800 dark:text-amber-300">
                            <span className="font-mono font-semibold">{c.complaint_code}</span> ·{" "}
                            {STATUS_META[c.status].label}
                          </div>
                        ))}
                      </div>
                    )}

                    {!lead.site_address && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Site Address</Label>
                        <Textarea
                          value={leadForm.site_address}
                          onChange={(e) => {
                            setLeadForm((p) => ({ ...p, site_address: e.target.value }));
                            clearError("lead_site_address");
                          }}
                          placeholder="This lead has no site address in the CRM"
                          rows={2}
                          className="text-xs rounded-xl resize-none"
                          aria-invalid={!!errors.lead_site_address}
                        />
                        <FieldError message={errors.lead_site_address} />
                      </div>
                    )}

                    {lead.products.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Product</Label>
                        <Select
                          value={leadForm.instance_id}
                          onValueChange={(v) => {
                            setLeadForm((p) => ({ ...p, instance_id: v }));
                            clearError("instance_id");
                          }}
                        >
                          <SelectTrigger className="w-full h-9 text-xs rounded-xl" aria-invalid={!!errors.instance_id}>
                            <SelectValue placeholder="Select the affected product" />
                          </SelectTrigger>
                          <SelectContent>
                            {lead.products.map((p) => (
                              <SelectItem key={p.instance_id} value={String(p.instance_id)}>
                                {p.product_type} – {p.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError message={errors.instance_id} />
                      </div>
                    )}

                    {(!lead.usable_handover_date || !lead.final_handover_date) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {!lead.usable_handover_date && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">Usable Handover Date</Label>
                            <CustomeDatePicker
                              value={leadForm.usable_handover_date}
                              onChange={(v) => {
                                setLeadForm((p) => ({ ...p, usable_handover_date: v ?? "" }));
                                clearError("usable_handover_date");
                              }}
                              restriction="pastOnly"
                            />
                            <FieldError message={errors.usable_handover_date} />
                          </div>
                        )}
                        {!lead.final_handover_date && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">Final Handover Date</Label>
                            <CustomeDatePicker
                              value={leadForm.final_handover_date}
                              onChange={(v) => {
                                setLeadForm((p) => ({ ...p, final_handover_date: v ?? "" }));
                                clearError("final_handover_date");
                              }}
                              restriction="pastOnly"
                            />
                            <FieldError message={errors.final_handover_date} />
                          </div>
                        )}
                      </div>
                    )}

                    {(lead.site_supervisors.length > 1 || lead.head_site_supervisors.length > 1) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(
                          [
                            ["site_supervisor_id", "Site Supervisor", lead.site_supervisors],
                            ["head_site_supervisor_id", "Head Site Supervisor", lead.head_site_supervisors],
                          ] as const
                        ).map(
                          ([key, label, options]) =>
                            options.length > 1 && (
                              <div key={key} className="space-y-1.5">
                                <Label className="text-xs">{label}</Label>
                                <Select
                                  value={leadForm[key]}
                                  onValueChange={(v) => {
                                    setLeadForm((p) => ({ ...p, [key]: v }));
                                    clearError(key);
                                  }}
                                >
                                  <SelectTrigger className="w-full h-9 text-xs rounded-xl" aria-invalid={!!errors[key]}>
                                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {options.map((u) => (
                                      <SelectItem key={u.id} value={String(u.id)}>
                                        {u.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FieldError message={errors[key]} />
                              </div>
                            ),
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            ) : (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  {linkedClient && (
                    <button
                      type="button"
                      onClick={() => setLinkedClient(null)}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Unlink {linkedClient.external_client_code}
                    </button>
                  )}
                </div>

                {linkedClient && (
                  <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                    <UserRound className="w-3.5 h-3.5 text-primary" />
                    Linked to existing client{" "}
                    <span className="font-mono font-semibold">{linkedClient.external_client_code}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Client Name</Label>
                  <Input
                    value={external.client_name}
                    onChange={(e) => setExternalField("client_name", e.target.value)}
                    disabled={!!linkedClient}
                    placeholder="Full name"
                    className="h-9 text-xs rounded-xl"
                    aria-invalid={!!errors.client_name}
                  />
                  <FieldError message={errors.client_name} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mobile Number</Label>
                    <Input
                      value={external.client_mobile}
                      onChange={(e) => setExternalField("client_mobile", e.target.value)}
                      disabled={!!linkedClient}
                      inputMode="tel"
                      placeholder="+91 98xxx xxxxx"
                      className="h-9 text-xs rounded-xl"
                      aria-invalid={!!errors.client_mobile}
                    />
                    <FieldError message={errors.client_mobile} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Alternate Number <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      value={external.client_alternate_mobile}
                      onChange={(e) => setExternalField("client_alternate_mobile", e.target.value)}
                      inputMode="tel"
                      className="h-9 text-xs rounded-xl"
                      aria-invalid={!!errors.client_alternate_mobile}
                    />
                    <FieldError message={errors.client_alternate_mobile} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Email Address <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    type="email"
                    value={external.client_email}
                    onChange={(e) => setExternalField("client_email", e.target.value)}
                    placeholder="client@example.com"
                    className="h-9 text-xs rounded-xl"
                    aria-invalid={!!errors.client_email}
                  />
                  <FieldError message={errors.client_email} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Complete Site Address</Label>
                  <Textarea
                    value={external.site_address}
                    onChange={(e) => setExternalField("site_address", e.target.value)}
                    disabled={!!linkedClient}
                    placeholder="Flat / building, area"
                    rows={2}
                    className="text-xs rounded-xl resize-none"
                    aria-invalid={!!errors.site_address}
                  />
                  <FieldError message={errors.site_address} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">City</Label>
                    <Input
                      value={external.city}
                      onChange={(e) => setExternalField("city", e.target.value)}
                      disabled={!!linkedClient}
                      className="h-9 text-xs rounded-xl"
                      aria-invalid={!!errors.city}
                    />
                    <FieldError message={errors.city} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Product Type</Label>
                    <Select value={external.product_type} onValueChange={(v) => setExternalField("product_type", v)}>
                      <SelectTrigger className="w-full h-9 text-xs rounded-xl" aria-invalid={!!errors.product_type}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {meta?.product_types.map((p) => (
                          <SelectItem key={p.id} value={p.type}>
                            {p.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.product_type} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Installation Date <span className="text-muted-foreground font-normal">(if known)</span>
                  </Label>
                  <CustomeDatePicker
                    value={external.installation_date}
                    onChange={(v) => setExternalField("installation_date", v ?? "")}
                    restriction="pastOnly"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground bg-muted/40 border rounded-lg px-3 py-2">
                  No CRM lead is created. Usable and final handover dates are added by the Site Supervisor later.
                </p>

                {hasDuplicates && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-500/10 px-3 py-2.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" /> Possible existing client
                    </div>
                    {duplicates!.leads.map((l) => (
                      <div key={l.lead_id} className="flex items-center justify-between gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                        <span className="min-w-0 truncate">
                          CRM lead <span className="font-mono font-semibold">{l.lead_code}</span> · {l.client_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => switchToLead(l.lead_code)}
                          className="shrink-0 font-semibold text-primary hover:underline"
                        >
                          Use lead code
                        </button>
                      </div>
                    ))}
                    {duplicates!.external_clients.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                        <span className="min-w-0 truncate">
                          <span className="font-mono font-semibold">{c.external_client_code}</span> · {c.client_name} ·{" "}
                          {c.complaints.length} complaint{c.complaints.length === 1 ? "" : "s"}
                        </span>
                        <button
                          type="button"
                          onClick={() => linkClient(c)}
                          className="shrink-0 font-semibold text-primary hover:underline"
                        >
                          Same client
                        </button>
                      </div>
                    ))}
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                      You can still register this as a new client; HO will review the match.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Complaint */}
          <section className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Affected Component</Label>
              <div className="grid grid-cols-4 gap-2">
                {(meta?.components ?? (Object.keys(COMPONENT_LABELS) as ComplaintComponent[])).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setDetails((p) => ({ ...p, component: c }));
                      clearError("component");
                    }}
                    className={`h-9 rounded-xl border text-xs font-semibold transition-colors ${
                      details.component === c
                        ? "border-primary bg-primary/10 text-primary"
                        : errors.component
                          ? "border-destructive/50 text-muted-foreground"
                          : "text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {COMPONENT_LABELS[c]}
                  </button>
                ))}
              </div>
              <FieldError message={errors.component} />
            </div>
            <div className="space-y-1.5" role="group" aria-label="Complaint category">
              <Label className="text-xs">Complaint Category</Label>
              <AssignToPicker
                data={(meta?.categories ?? []).map(category => ({ id: category.id, label: category.name }))}
                value={details.category_id ? Number(details.category_id) : undefined}
                onChange={(id) => {
                  setDetails((p) => ({ ...p, category_id: id ? String(id) : "" }));
                  clearError("category_id");
                }}
                placeholder="Search complaint categories…"
                emptyLabel={meta ? "Select a category" : "Loading categories…"}
                disabled={!meta}
                className={`h-9 rounded-xl text-xs ${errors.category_id ? "border-destructive" : ""}`}
                textClassName="text-xs"
              />
              <FieldError message={errors.category_id} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Issue Description</Label>
              <Textarea
                value={details.description}
                onChange={(e) => {
                  setDetails((p) => ({ ...p, description: e.target.value }));
                  clearError("description");
                }}
                placeholder="What happened, where, and since when"
                rows={4}
                className="text-xs rounded-xl resize-none"
                aria-invalid={!!errors.description}
              />
              <FieldError message={errors.description} />
            </div>

            <MediaPicker
              kind="photo"
              files={photos}
              onAdd={(f) => addFiles("photo", f)}
              onRemove={(i) => removeFile("photo", i)}
              error={errors.photos}
            />
            <MediaPicker
              kind="video"
              files={videos}
              onAdd={(f) => addFiles("video", f)}
              onRemove={(i) => removeFile("video", i)}
              error={errors.videos}
            />

            <div className="space-y-1.5">
              <Label className="text-xs">
                Preferred Visit Date <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <CustomeDatePicker
                value={details.preferred_visit_date}
                onChange={(v) => setDetails((p) => ({ ...p, preferred_visit_date: v ?? "" }))}
                restriction="futureOnly"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Additional Remarks <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                value={details.additional_remarks}
                onChange={(e) => setDetails((p) => ({ ...p, additional_remarks: e.target.value }))}
                rows={2}
                className="text-xs rounded-xl resize-none"
              />
            </div>
          </section>
        </form>

        <DialogFooter className="border-t px-6 py-4 flex-row items-center justify-end gap-2 bg-muted/20">
          {submitError && (
            <p className="mr-auto text-xs font-medium text-destructive flex items-center gap-1.5 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{submitError}</span>
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="h-9 text-xs rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-complaint-form"
            style={brandStyle}
            className="h-9 text-xs font-semibold rounded-xl gap-2 bg-[var(--brand-bg,var(--color-zinc-900))] text-[var(--brand-text,var(--color-white))] hover:bg-[var(--brand-bg,var(--color-zinc-900))] hover:opacity-90 dark:bg-[var(--brand-bg,var(--color-zinc-800))] dark:hover:bg-[var(--brand-bg,var(--color-zinc-800))]"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Submit Complaint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

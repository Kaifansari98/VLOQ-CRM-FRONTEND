"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import VendorsTable from "@/components/custom/VendorsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import BaseModal from "@/components/utils/baseModal";
import { FileUploadField } from "@/components/custom/file-upload";
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
import { useCreateVendorLoginLaunch } from "@/api/auth";
import { useOnboardVendor, useUpdateVendor, useStates } from "@/api/vendors";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { z } from "zod";

const gstRegex =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const websiteRegex =
  /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;

const subdomainHostRegex =
  /^(?=.{4,253}$)(?!.*\.\.)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

const createVendorSchema = z.object({
  vendor_name: z.string().trim().min(1, "Vendor name is required"),
  vendor_code: z.string().trim().min(1, "Vendor code is required"),
  subdomain_url: z
    .string()
    .trim()
    .min(1, "Domain is required")
    .max(253, "Domain is too long")
    .refine((value) => value === value.toLowerCase(), {
      message: "Domain must be in lowercase",
    })
    .refine((value) => !/^https?:\/\//.test(value), {
      message: "Enter domain only, without http:// or https://",
    })
    .refine((value) => !/[/?#:]/.test(value), {
      message: "Domain cannot contain paths, ports, query strings, or fragments",
    })
    .refine((value) => subdomainHostRegex.test(value), {
      message: "Enter a valid subdomain like durian.shambhala.com",
    }),
  primary_contact_name: z
    .string()
    .trim()
    .min(1, "Primary contact name is required"),
  primary_contact_number: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Primary contact number must be 10 digits"),
  primary_contact_email: z.email("Enter a valid primary contact email"),
  handlesLargeScaleProjects: z.boolean(),
  is_crm_enabled: z.boolean(),
  is_inventory_enabled: z.boolean(),
  is_tracktrace_enabled: z.boolean(),
  is_scanpack_enabled: z.boolean(),
  push_lead_to_cadbid: z.boolean(),
  status: z.enum(["active", "inactive"]),
  gst_no: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || gstRegex.test(value.toUpperCase()), {
      message: "Enter a valid GST number",
    }),

  toll_free_no: z.string().trim().optional().or(z.literal("")),

  website_link: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || websiteRegex.test(value), {
      message: "Enter a valid website link",
    }),

  tag_line: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),

  pincode: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^\d{6}$/.test(value), {
      message: "Pincode must be 6 digits",
    }),

  city: z.string().trim().optional().or(z.literal("")),

  state_id: z.number().nullable().optional(),
});

type CreateVendorForm = z.infer<typeof createVendorSchema>;
type CreateVendorFieldErrors = Partial<Record<keyof CreateVendorForm, string>>;

export default function VendorsPage() {

  const statesQuery = useStates();
  const states = statesQuery.data?.data || [];
  const [openCreateVendor, setOpenCreateVendor] = React.useState(false);
  const [editingVendorId, setEditingVendorId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<CreateVendorForm>({
    vendor_name: "",
    vendor_code: "",
    subdomain_url: "",
    primary_contact_name: "",
    primary_contact_number: "",
    primary_contact_email: "",
    handlesLargeScaleProjects: false,
    is_crm_enabled: true,
    is_inventory_enabled: false,
    is_tracktrace_enabled: false,
    is_scanpack_enabled: false,
    push_lead_to_cadbid: false,
    status: "active",
    gst_no: "",
    toll_free_no: "",
    website_link: "",
    tag_line: "",
    address: "",
    pincode: "",
    city: "",
  });
  const [fieldErrors, setFieldErrors] = React.useState<CreateVendorFieldErrors>({});
  const [logoFile, setLogoFile] = React.useState<File[]>([]);
  const [iconFile, setIconFile] = React.useState<File[]>([]);
  const [loginImageFile, setLoginImageFile] = React.useState<File[]>([]);

  const onboardVendorMutation = useOnboardVendor();
  const updateVendorMutation = useUpdateVendor();
  const createVendorLoginLaunchMutation = useCreateVendorLoginLaunch();
  const handleLoginToVendor = React.useCallback(
    async (row: { id: number; vendor_name: string }) => {
      try {
        const response = await createVendorLoginLaunchMutation.mutateAsync(row.id);
        const launchUrl = response?.data?.launch_url;

        if (!launchUrl) {
          throw new Error("Vendor launch URL not found");
        }

        window.open(launchUrl, "_blank", "noopener,noreferrer");
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            `Failed to login to ${row.vendor_name}`,
          type: "error",
        });
      }
    },
    [createVendorLoginLaunchMutation],
  );

  const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    setForm((prev) => ({
      ...prev,
      state_id: value ? Number(value) : null,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      state_id: undefined,
    }));
  };

  const handleFieldChange =
    (field: keyof typeof form) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue =
          field === "primary_contact_number"
            ? event.target.value.replace(/\D/g, "").slice(0, 10)
            : field === "pincode"
              ? event.target.value.replace(/\D/g, "").slice(0, 6)
              : field === "toll_free_no"
                ? event.target.value.replace(/\D/g, "").slice(0, 15)
                : field === "gst_no"
                  ? event.target.value.toUpperCase().slice(0, 15)
                  : field === "subdomain_url"
                    ? event.target.value.trim().toLowerCase()
                    : event.target.value;

        setForm((prev) => ({
          ...prev,
          [field]: field === "vendor_code" ? nextValue.toUpperCase() : nextValue,
        }));

        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      };

  const handleBooleanFieldChange =
    (
      field:
        | "handlesLargeScaleProjects"
        | "is_crm_enabled"
        | "is_inventory_enabled"
        | "is_tracktrace_enabled"
        | "is_scanpack_enabled"
        | "push_lead_to_cadbid",
      value: boolean,
    ) =>
      () => {
        setForm((prev) => ({
          ...prev,
          [field]: value,
        }));
      };

  const resetForm = () => {
    setForm({
      vendor_name: "",
      vendor_code: "",
      subdomain_url: "",
      primary_contact_name: "",
      primary_contact_number: "",
      primary_contact_email: "",
      handlesLargeScaleProjects: false,
      is_crm_enabled: true,
      is_inventory_enabled: false,
      is_tracktrace_enabled: false,
      is_scanpack_enabled: false,
      push_lead_to_cadbid: false,
      status: "active",
      gst_no: "",
      toll_free_no: "",
      website_link: "",
      tag_line: "",
      address: "",
      pincode: "",
      city: "",
      state_id: null,
    });
    setLogoFile([]);
    setIconFile([]);
    setLoginImageFile([]);
    setFieldErrors({});
    setEditingVendorId(null);
  };

  const handleOpenCreateVendor = () => {
    resetForm();
    setOpenCreateVendor(true);
  };



  const handleOpenConfigureVendor = React.useCallback(
    (row: {
      id: number;
      vendor_name: string;
      vendor_code: string;
      subdomain_url: string;
      primary_contact_name: string;
      primary_contact_number: string;
      primary_contact_email: string;
      handlesLargeScaleProjects?: boolean | null;
      is_crm_enabled: boolean;
      is_inventory_enabled: boolean;
      is_tracktrace_enabled: boolean;
      is_scanpack_enabled: boolean;
      push_lead_to_cadbid: boolean;
      status?: string | null;
      gst_no?: string | null;
      toll_free_no?: string | null;
      website_link?: string | null;
      tag_line?: string | null;
      address?: string | null;
      pincode?: string | null;
      city?: string | null;
    }) => {
      setEditingVendorId(row.id);
      console.log("EDIT VENDOR ROW:", row);
      setForm({
        vendor_name: row.vendor_name,
        vendor_code: row.vendor_code,
        subdomain_url: row.subdomain_url,
        primary_contact_name: row.primary_contact_name,
        primary_contact_number: row.primary_contact_number,
        primary_contact_email: row.primary_contact_email,
        handlesLargeScaleProjects: row.handlesLargeScaleProjects === true,
        is_crm_enabled: row.is_crm_enabled,
        is_inventory_enabled: row.is_inventory_enabled,
        is_tracktrace_enabled: row.is_tracktrace_enabled,
        is_scanpack_enabled: row.is_scanpack_enabled,
        push_lead_to_cadbid: row.push_lead_to_cadbid === true,
        status: (row.status || "active").toLowerCase() as "active" | "inactive",
        gst_no: row.gst_no || "",
        toll_free_no: row.toll_free_no || "",
        website_link: row.website_link || "",
        tag_line: row.tag_line || "",
        address: row.address || "",
        pincode: row.pincode || "",
        city: row.city || "",
      });
      setLogoFile([]);
      setIconFile([]);
      setFieldErrors({});
      setOpenCreateVendor(true);
    },
    [],
  );

  const handleSubmitVendor = async (event: React.FormEvent) => {
    event.preventDefault();

    const validatedForm = createVendorSchema.safeParse(form);
    if (!validatedForm.success) {
      const nextFieldErrors = validatedForm.error.flatten().fieldErrors;
      setFieldErrors({
        vendor_name: nextFieldErrors.vendor_name?.[0],
        vendor_code: nextFieldErrors.vendor_code?.[0],
        subdomain_url: nextFieldErrors.subdomain_url?.[0],
        primary_contact_name: nextFieldErrors.primary_contact_name?.[0],
        primary_contact_number: nextFieldErrors.primary_contact_number?.[0],
        primary_contact_email: nextFieldErrors.primary_contact_email?.[0],
        gst_no: nextFieldErrors.gst_no?.[0],
        website_link: nextFieldErrors.website_link?.[0],
        pincode: nextFieldErrors.pincode?.[0],
        state_id: nextFieldErrors.state_id?.[0],
      });
      toastManager.add({
        title: nextFieldErrors.subdomain_url?.[0] || "Please fix the form errors",
        type: "error",
      });
      return;
    }

    try {
      if (editingVendorId) {
        const formData = new FormData();
        formData.append("vendor_name", validatedForm.data.vendor_name);
        formData.append("vendor_code", validatedForm.data.vendor_code.toUpperCase());
        formData.append("subdomain_url", validatedForm.data.subdomain_url);
        formData.append("primary_contact_name", validatedForm.data.primary_contact_name);
        formData.append("primary_contact_number", validatedForm.data.primary_contact_number);
        formData.append("primary_contact_email", validatedForm.data.primary_contact_email);
        formData.append("country_code", "+91");
        formData.append("head_office_id", "");
        formData.append("status", validatedForm.data.status);
        formData.append("time_zone", "Asia/Kolkata");
        formData.append("handlesLargeScaleProjects", String(validatedForm.data.handlesLargeScaleProjects));
        formData.append("is_crm_enabled", String(validatedForm.data.is_crm_enabled));
        formData.append("is_inventory_enabled", String(validatedForm.data.is_inventory_enabled));
        formData.append("is_tracktrace_enabled", String(validatedForm.data.is_tracktrace_enabled));
        formData.append("is_scanpack_enabled", String(validatedForm.data.is_scanpack_enabled));
        formData.append("push_lead_to_cadbid", String(validatedForm.data.push_lead_to_cadbid));
        formData.append("gst_no", validatedForm.data.gst_no || "");
        formData.append("toll_free_no", validatedForm.data.toll_free_no || "");
        formData.append("website_link", validatedForm.data.website_link || "");
        formData.append("tag_line", validatedForm.data.tag_line || "");
        formData.append("address", validatedForm.data.address || "");
        formData.append("pincode", validatedForm.data.pincode || "");
        formData.append("city", validatedForm.data.city || "");
        formData.append(
          "state_id",
          validatedForm.data.state_id ? String(validatedForm.data.state_id) : ""
        );

        if (logoFile[0]) {
          formData.append("logo", logoFile[0]);
        }
        if (iconFile[0]) {
          formData.append("icon", iconFile[0]);
        }
        if (loginImageFile[0]) {
          formData.append("login_image", loginImageFile[0]);
        }

        await updateVendorMutation.mutateAsync({
          vendorId: editingVendorId,
          payload: formData,
        });
      } else {
        const formData = new FormData();
        formData.append("vendor_name", validatedForm.data.vendor_name);
        formData.append("vendor_code", validatedForm.data.vendor_code.toUpperCase());
        formData.append("subdomain_url", validatedForm.data.subdomain_url);
        formData.append("primary_contact_name", validatedForm.data.primary_contact_name);
        formData.append("primary_contact_number", validatedForm.data.primary_contact_number);
        formData.append("primary_contact_email", validatedForm.data.primary_contact_email);
        formData.append("country_code", "+91");
        formData.append("head_office_id", "");
        formData.append("status", validatedForm.data.status);
        formData.append("time_zone", "Asia/Kolkata");
        formData.append("handlesLargeScaleProjects", String(validatedForm.data.handlesLargeScaleProjects));
        formData.append("is_crm_enabled", String(validatedForm.data.is_crm_enabled));
        formData.append("is_inventory_enabled", String(validatedForm.data.is_inventory_enabled));
        formData.append("is_tracktrace_enabled", String(validatedForm.data.is_tracktrace_enabled));
        formData.append("is_scanpack_enabled", String(validatedForm.data.is_scanpack_enabled));
        formData.append("push_lead_to_cadbid", String(validatedForm.data.push_lead_to_cadbid));
        formData.append("gst_no", validatedForm.data.gst_no || "");
        formData.append("toll_free_no", validatedForm.data.toll_free_no || "");
        formData.append("website_link", validatedForm.data.website_link || "");
        formData.append("tag_line", validatedForm.data.tag_line || "");
        formData.append("address", validatedForm.data.address || "");
        formData.append("pincode", validatedForm.data.pincode || "");
        formData.append("city", validatedForm.data.city || "");
        formData.append(
          "state_id",
          validatedForm.data.state_id ? String(validatedForm.data.state_id) : ""
        );

        if (logoFile[0]) {
          formData.append("logo", logoFile[0]);
        }
        if (iconFile[0]) {
          formData.append("icon", iconFile[0]);
        }
        if (loginImageFile[0]) {
          formData.append("login_image", loginImageFile[0]);
        }

        await onboardVendorMutation.mutateAsync(formData);
      }

      toastManager.add({
        title: editingVendorId ? "Vendor updated successfully" : "Vendor created successfully",
        type: "success",
      });
      setOpenCreateVendor(false);
      resetForm();
    } catch (error: any) {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          (editingVendorId ? "Failed to update vendor" : "Failed to create vendor"),
        type: "error",
      });
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Vendors</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleOpenCreateVendor}>Create Vendor</Button>
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            Manage and oversee all vendors on the Furnix CRM platform.
          </p>
        </div>

        <VendorsTable
          onLoginToVendor={handleLoginToVendor}
          onConfigureVendor={handleOpenConfigureVendor}
        />
      </div>

      <BaseModal
        open={openCreateVendor}
        onOpenChange={(open: boolean) => {
          setOpenCreateVendor(open);
          if (!open) {
            resetForm();
          }
        }}
        title={editingVendorId ? "Configure Vendor" : "Create Vendor"}
        description={
          editingVendorId
            ? "Update the basic vendor details."
            : "Add the basic vendor details to onboard a new vendor."
        }
        size="lg"
      >
        <form className="space-y-4 p-6" onSubmit={handleSubmitVendor}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="vendor_name">Vendor Name</Label>
              <Input
                id="vendor_name"
                value={form.vendor_name}
                onChange={handleFieldChange("vendor_name")}
                placeholder="Enter vendor name"
                required
              />
              {fieldErrors.vendor_name ? (
                <p className="text-xs text-destructive">{fieldErrors.vendor_name}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vendor_code">Vendor Code</Label>
              <Input
                id="vendor_code"
                value={form.vendor_code}
                onChange={handleFieldChange("vendor_code")}
                placeholder="Enter vendor code"
                required
              />
              {fieldErrors.vendor_code ? (
                <p className="text-xs text-destructive">{fieldErrors.vendor_code}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subdomain_url">Domain</Label>
            <Input
              id="subdomain_url"
              value={form.subdomain_url}
              onChange={handleFieldChange("subdomain_url")}
              placeholder="durian.shambhala.com"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter domain only. Do not include protocol, path, or query string.
            </p>
            {fieldErrors.subdomain_url ? (
              <p className="text-xs text-destructive">{fieldErrors.subdomain_url}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="primary_contact_name">Primary Contact Name</Label>
              <Input
                id="primary_contact_name"
                value={form.primary_contact_name}
                onChange={handleFieldChange("primary_contact_name")}
                placeholder="Enter primary contact name"
                required
              />
              {fieldErrors.primary_contact_name ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.primary_contact_name}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="primary_contact_number">Primary Contact Number</Label>
              <Input
                id="primary_contact_number"
                inputMode="numeric"
                value={form.primary_contact_number}
                onChange={handleFieldChange("primary_contact_number")}
                placeholder="Enter 10 digit number"
                required
              />
              {fieldErrors.primary_contact_number ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.primary_contact_number}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="primary_contact_email">Primary Contact Email</Label>
            <Input
              id="primary_contact_email"
              type="email"
              value={form.primary_contact_email}
              onChange={handleFieldChange("primary_contact_email")}
              placeholder="Enter primary contact email"
              required
            />
            {fieldErrors.primary_contact_email ? (
              <p className="text-xs text-destructive">
                {fieldErrors.primary_contact_email}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gst_no">GST No</Label>
              <Input
                id="gst_no"
                value={form.gst_no}
                onChange={handleFieldChange("gst_no")}
                placeholder="27AAZFA7533R1ZC"
                maxLength={15}
              />
              {fieldErrors.gst_no && (
                <p className="text-xs text-destructive">{fieldErrors.gst_no}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="toll_free_no">Toll Free</Label>
              <Input
                id="toll_free_no"
                value={form.toll_free_no}
                onChange={handleFieldChange("toll_free_no")}
                placeholder="18002674949"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_link">Website Link</Label>
              <Input
                id="website_link"
                value={form.website_link}
                onChange={handleFieldChange("website_link")}
                placeholder="www.adarshindia.in"
              />
              {fieldErrors.website_link && (
                <p className="text-xs text-destructive">{fieldErrors.website_link}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag_line">Tag Line</Label>
              <Input
                id="tag_line"
                value={form.tag_line}
                onChange={handleFieldChange("tag_line")}
                placeholder="Design. Build. Deliver"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={handleFieldChange("address")}
              placeholder="280 & 283, Bilavali"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={form.pincode}
                onChange={handleFieldChange("pincode")}
                placeholder="421312"
                maxLength={6}
              />
              {fieldErrors.pincode && (
                <p className="text-xs text-destructive">{fieldErrors.pincode}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={handleFieldChange("city")}
                placeholder="Palghar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state_id">State</Label>
              <select
                id="state_id"
                value={form.state_id || ""}
                onChange={handleStateChange}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select State</option>

                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>

              {fieldErrors.state_id && (
                <p className="text-xs text-destructive">{fieldErrors.state_id}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Handles Large Scale Projects</Label>
              <div className="flex items-center gap-6 pt-1">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((option) => (
                  <label
                    key={`large-scale-${String(option.value)}`}
                    className="flex cursor-pointer items-center gap-2"
                    htmlFor={`large-scale-${String(option.value)}`}
                  >
                    <Checkbox
                      id={`large-scale-${String(option.value)}`}
                      checked={form.handlesLargeScaleProjects === option.value}
                      onCheckedChange={handleBooleanFieldChange(
                        "handlesLargeScaleProjects",
                        option.value,
                      )}
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>CRM Enabled</Label>
              <div className="flex items-center gap-6 pt-1">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((option) => (
                  <label
                    key={`crm-${String(option.value)}`}
                    className="flex items-center gap-2 cursor-pointer"
                    htmlFor={`crm-${String(option.value)}`}
                  >
                    <Checkbox
                      id={`crm-${String(option.value)}`}
                      checked={form.is_crm_enabled === option.value}
                      onCheckedChange={handleBooleanFieldChange(
                        "is_crm_enabled",
                        option.value,
                      )}
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Inventory Enabled</Label>
              <div className="flex items-center gap-6 pt-1">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((option) => (
                  <label
                    key={`inventory-${String(option.value)}`}
                    className="flex items-center gap-2 cursor-pointer"
                    htmlFor={`inventory-${String(option.value)}`}
                  >
                    <Checkbox
                      id={`inventory-${String(option.value)}`}
                      checked={form.is_inventory_enabled === option.value}
                      onCheckedChange={handleBooleanFieldChange(
                        "is_inventory_enabled",
                        option.value,
                      )}
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Track Trace Enabled</Label>
              <div className="flex items-center gap-6 pt-1">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((option) => (
                  <label
                    key={`tracktrace-${String(option.value)}`}
                    className="flex items-center gap-2 cursor-pointer"
                    htmlFor={`tracktrace-${String(option.value)}`}
                  >
                    <Checkbox
                      id={`tracktrace-${String(option.value)}`}
                      checked={form.is_tracktrace_enabled === option.value}
                      onCheckedChange={handleBooleanFieldChange(
                        "is_tracktrace_enabled",
                        option.value,
                      )}
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Scan Pack Enabled</Label>
              <div className="flex items-center gap-6 pt-1">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((option) => (
                  <label
                    key={`scanpack-${String(option.value)}`}
                    className="flex items-center gap-2 cursor-pointer"
                    htmlFor={`scanpack-${String(option.value)}`}
                  >
                    <Checkbox
                      id={`scanpack-${String(option.value)}`}
                      checked={form.is_scanpack_enabled === option.value}
                      onCheckedChange={handleBooleanFieldChange(
                        "is_scanpack_enabled",
                        option.value,
                      )}
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Push Lead to Cadbid</Label>

              <div className="flex items-center gap-6 pt-1">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((option) => (
                  <label
                    key={`push-lead-to-cadbid-${String(option.value)}`}
                    className="flex items-center gap-2 cursor-pointer"
                    htmlFor={`push-lead-to-cadbid-${String(option.value)}`}
                  >
                    <Checkbox
                      id={`push-lead-to-cadbid-${String(option.value)}`}
                      checked={form.push_lead_to_cadbid === option.value}
                      onCheckedChange={handleBooleanFieldChange(
                        "push_lead_to_cadbid",
                        option.value,
                      )}
                    />

                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value: "active" | "inactive") =>
                setForm((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger id="status" className="w-full bg-background border-border">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Upload Logo</Label>
              <FileUploadField
                value={logoFile}
                onChange={setLogoFile}
                accept="image/*"
                multiple={false}
                maxFiles={1}
              />
            </div>
            <div className="grid gap-2">
              <Label>Upload Icon</Label>
              <FileUploadField
                value={iconFile}
                onChange={setIconFile}
                accept="image/*"
                multiple={false}
                maxFiles={1}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Upload Login Image</Label>
            <FileUploadField
              value={loginImageFile}
              onChange={setLoginImageFile}
              accept="image/*"
              multiple={false}
              maxFiles={1}
            />
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenCreateVendor(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={onboardVendorMutation.isPending || updateVendorMutation.isPending}
            >
              {editingVendorId
                ? updateVendorMutation.isPending
                  ? "Updating..."
                  : "Update"
                : onboardVendorMutation.isPending
                  ? "Creating..."
                  : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </BaseModal>
    </>
  );
}

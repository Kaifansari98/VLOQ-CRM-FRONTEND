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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateVendorLoginLaunch } from "@/api/auth";
import { useOnboardVendor, useUpdateVendor } from "@/api/vendors";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { z } from "zod";

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
});

type CreateVendorForm = z.infer<typeof createVendorSchema>;
type CreateVendorFieldErrors = Partial<Record<keyof CreateVendorForm, string>>;

export default function VendorsPage() {
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
  });
  const [fieldErrors, setFieldErrors] = React.useState<CreateVendorFieldErrors>({});

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

  const handleFieldChange =
    (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        field === "primary_contact_number"
          ? event.target.value.replace(/\D/g, "").slice(0, 10)
          : field === "subdomain_url"
            ? event.target.value.trim().toLowerCase()
          : event.target.value;

      setForm((prev) => ({
        ...prev,
        [field]:
          field === "vendor_code" ? nextValue.toUpperCase() : nextValue,
      }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleBooleanFieldChange =
    (
      field:
        | "handlesLargeScaleProjects"
        | "is_crm_enabled"
        | "is_inventory_enabled"
        | "is_tracktrace_enabled",
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
    });
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
    }) => {
      setEditingVendorId(row.id);
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
      });
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
      });
      toastManager.add({
        title: nextFieldErrors.subdomain_url?.[0] || "Please fix the form errors",
        type: "error",
      });
      return;
    }

    try {
      if (editingVendorId) {
        await updateVendorMutation.mutateAsync({
          vendorId: editingVendorId,
          payload: {
            vendor_name: validatedForm.data.vendor_name,
            vendor_code: validatedForm.data.vendor_code.toUpperCase(),
            subdomain_url: validatedForm.data.subdomain_url,
            primary_contact_name: validatedForm.data.primary_contact_name,
            primary_contact_number: validatedForm.data.primary_contact_number,
            primary_contact_email: validatedForm.data.primary_contact_email,
            status: "active",
            time_zone: "Asia/Kolkata",
            handlesLargeScaleProjects:
              validatedForm.data.handlesLargeScaleProjects,
            is_crm_enabled: validatedForm.data.is_crm_enabled,
            is_inventory_enabled: validatedForm.data.is_inventory_enabled,
            is_tracktrace_enabled: validatedForm.data.is_tracktrace_enabled,
          },
        });
      } else {
        await onboardVendorMutation.mutateAsync({
          vendor_name: validatedForm.data.vendor_name,
          vendor_code: validatedForm.data.vendor_code.toUpperCase(),
          subdomain_url: validatedForm.data.subdomain_url,
          primary_contact_name: validatedForm.data.primary_contact_name,
          primary_contact_number: validatedForm.data.primary_contact_number,
          primary_contact_email: validatedForm.data.primary_contact_email,
          country_code: "+91",
          head_office_id: null,
          status: "active",
          logo: "https://example.com/logo.png",
          time_zone: "Asia/Kolkata",
          handlesLargeScaleProjects: validatedForm.data.handlesLargeScaleProjects,
          is_crm_enabled: validatedForm.data.is_crm_enabled,
          is_inventory_enabled: validatedForm.data.is_inventory_enabled,
          is_tracktrace_enabled: validatedForm.data.is_tracktrace_enabled,
        });
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

      <Dialog
        open={openCreateVendor}
        onOpenChange={(open) => {
          setOpenCreateVendor(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-base">
              {editingVendorId ? "Configure Vendor" : "Create Vendor"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingVendorId
                ? "Update the basic vendor details."
                : "Add the basic vendor details to onboard a new vendor."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmitVendor}>
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
        </DialogContent>
      </Dialog>
    </>
  );
}

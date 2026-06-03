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
import { useOnboardVendor } from "@/api/vendors";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function VendorsPage() {
  const [openCreateVendor, setOpenCreateVendor] = React.useState(false);
  const [form, setForm] = React.useState({
    vendor_name: "",
    vendor_code: "",
    primary_contact_name: "",
    primary_contact_number: "",
    primary_contact_email: "",
    is_inventory_enabled: false,
    is_tracktrace_enabled: false,
  });

  const onboardVendorMutation = useOnboardVendor();

  const handleFieldChange =
    (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        field === "primary_contact_number"
          ? event.target.value.replace(/\D/g, "").slice(0, 10)
          : event.target.value;

      setForm((prev) => ({
        ...prev,
        [field]:
          field === "vendor_code" ? nextValue.toUpperCase() : nextValue,
      }));
    };

  const resetForm = () => {
    setForm({
      vendor_name: "",
      vendor_code: "",
      primary_contact_name: "",
      primary_contact_number: "",
      primary_contact_email: "",
      is_inventory_enabled: false,
      is_tracktrace_enabled: false,
    });
  };

  const handleCreateVendor = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !form.vendor_name.trim() ||
      !form.vendor_code.trim() ||
      !form.primary_contact_name.trim() ||
      !form.primary_contact_number.trim() ||
      !form.primary_contact_email.trim()
    ) {
      toastManager.add({ title: "Please fill all required fields", type: "error" });
      return;
    }

    if (form.primary_contact_number.trim().length !== 10) {
      toastManager.add({
        title: "Primary contact number must be 10 digits",
        type: "error",
      });
      return;
    }

    try {
      await onboardVendorMutation.mutateAsync({
        vendor_name: form.vendor_name.trim(),
        vendor_code: form.vendor_code.trim().toUpperCase(),
        primary_contact_name: form.primary_contact_name.trim(),
        primary_contact_number: form.primary_contact_number.trim(),
        primary_contact_email: form.primary_contact_email.trim(),
        country_code: "+91",
        head_office_id: null,
        status: "active",
        logo: "https://example.com/logo.png",
        time_zone: "Asia/Kolkata",
        is_inventory_enabled: form.is_inventory_enabled,
        is_tracktrace_enabled: form.is_tracktrace_enabled,
      });

      toastManager.add({ title: "Vendor created successfully", type: "success" });
      setOpenCreateVendor(false);
      resetForm();
    } catch (error: any) {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to create vendor",
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
          <Button onClick={() => setOpenCreateVendor(true)}>Create Vendor</Button>
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

        <VendorsTable />
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
          <div className="flex flex-col border-b pb-4">
            <p className="text-base font-semibold">Create Vendor</p>
            <p className="text-xs text-muted-foreground">
              Add the basic vendor details to onboard a new vendor.
            </p>
          </div>

          <form className="space-y-4 mt-2" onSubmit={handleCreateVendor}>
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
              </div>
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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          is_inventory_enabled: option.value,
                        }))
                      }
                    >
                      <Checkbox checked={form.is_inventory_enabled === option.value} />
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
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          is_tracktrace_enabled: option.value,
                        }))
                      }
                    >
                      <Checkbox
                        checked={form.is_tracktrace_enabled === option.value}
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
              <Button type="submit" disabled={onboardVendorMutation.isPending}>
                {onboardVendorMutation.isPending ? "Creating..." : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

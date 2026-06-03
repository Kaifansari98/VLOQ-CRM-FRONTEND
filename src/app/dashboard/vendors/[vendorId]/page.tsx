"use client";

import * as React from "react";
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
import { useParams } from "next/navigation";
import FranchisesTable from "@/components/custom/FranchisesTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateFranchise } from "@/api/franchises";
import { toastManager } from "@/components/ui/toast";

const EMPTY_FORM = {
  franchise_name: "",
  franchise_code: "",
  contact_person: "",
  contact_number: "",
  contact_email: "",
  address: "",
};

export default function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const vendorIdNum = Number(vendorId);

  const [openCreate, setOpenCreate] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const createFranchiseMutation = useCreateFranchise(vendorIdNum);

  const handleFieldChange =
    (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value;
      if (field === "contact_number") value = value.replace(/\D/g, "").slice(0, 10);
      if (field === "franchise_code") value = value.toUpperCase();
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const resetForm = () => setForm(EMPTY_FORM);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.franchise_name.trim() ||
      !form.franchise_code.trim() ||
      !form.contact_person.trim() ||
      !form.contact_number.trim() ||
      !form.contact_email.trim() ||
      !form.address.trim()
    ) {
      toastManager.add({ title: "Please fill all required fields", type: "error" });
      return;
    }

    if (form.contact_number.length !== 10) {
      toastManager.add({ title: "Contact number must be 10 digits", type: "error" });
      return;
    }

    try {
      await createFranchiseMutation.mutateAsync({
        vendor_id: vendorIdNum,
        franchise_name: form.franchise_name.trim(),
        franchise_code: form.franchise_code.trim(),
        contact_person: form.contact_person.trim(),
        contact_number: form.contact_number.trim(),
        contact_email: form.contact_email.trim(),
        address: form.address.trim(),
        is_head_office: false,
      });

      toastManager.add({ title: "Franchise created successfully", type: "success" });
      setOpenCreate(false);
      resetForm();
    } catch (error: any) {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to create franchise",
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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/vendors">
                  Vendors
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Vendor #{vendorId}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCreate(true)}>Create Franchise</Button>
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Vendor Details
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage details for vendor #{vendorId}.
          </p>
        </div>

        <FranchisesTable vendorId={vendorIdNum} />
      </div>

      <Dialog
        open={openCreate}
        onOpenChange={(open) => {
          setOpenCreate(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <div className="flex flex-col border-b pb-4">
            <p className="text-base font-semibold">Create Franchise</p>
            <p className="text-xs text-muted-foreground">
              Add the basic franchise details to onboard a new franchise.
            </p>
          </div>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="franchise_name">Franchise Name</Label>
                <Input
                  id="franchise_name"
                  value={form.franchise_name}
                  onChange={handleFieldChange("franchise_name")}
                  placeholder="Enter franchise name"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="franchise_code">Franchise Code</Label>
                <Input
                  id="franchise_code"
                  value={form.franchise_code}
                  onChange={handleFieldChange("franchise_code")}
                  placeholder="Enter franchise code"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={form.contact_person}
                  onChange={handleFieldChange("contact_person")}
                  placeholder="Enter contact person"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  inputMode="numeric"
                  value={form.contact_number}
                  onChange={handleFieldChange("contact_number")}
                  placeholder="Enter 10 digit number"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleFieldChange("contact_email")}
                placeholder="Enter contact email"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={handleFieldChange("address")}
                placeholder="Enter address"
                required
              />
            </div>

            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenCreate(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createFranchiseMutation.isPending}>
                {createFranchiseMutation.isPending ? "Creating..." : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

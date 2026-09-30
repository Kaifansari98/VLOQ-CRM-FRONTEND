"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import {
  Award, Building2, ImageIcon, Pencil, Plus, Search, ToggleLeft, ToggleRight, Trash2, Upload, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useBrandMasters, useCreateBrandMaster, useDeleteBrandMaster,
  useToggleBrandStatus, useUpdateBrandMaster,
} from "@/hooks/track-trace/useBrandMasters";
import { BrandMaster } from "@/api/track-trace/brand.api";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { apiClient } from "@/lib/apiClient";



interface BrandFormDialogProps {
  open: boolean;
  onClose: () => void;
  editData?: BrandMaster | null;
  vendorId: number;
  userId: number;
}

function BrandFormDialog({ open, onClose, editData, vendorId, userId }: BrandFormDialogProps) {
  const createMutation = useCreateBrandMaster(vendorId);
  const updateMutation = useUpdateBrandMaster(vendorId);

  const [brandName, setBrandName] = useState("");
  const [brandShortName, setBrandShortName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");        // S3 key stored in DB
  const [logoPreview, setLogoPreview] = useState(""); // local blob URL for preview
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editData;
  const isPending = createMutation.isPending || updateMutation.isPending || uploading;

  useEffect(() => {
    if (editData) {
      setBrandName(editData.brand_name);
      setBrandShortName(editData.brand_short_name || "");
      setLogoUrl(editData.logo || "");
      setLogoPreview("");
      setLogoFile(null);
    } else {
      setBrandName("");
      setBrandShortName("");
      setLogoUrl("");
      setLogoPreview("");
      setLogoFile(null);
    }
    setError("");
  }, [editData, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setLogoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!brandName.trim()) {
      setError("Brand name is required");
      return;
    }

    let finalLogoKey = logoUrl;

    // Upload new file to Wasabi via backend
    if (logoFile) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append("logo", logoFile);
        formData.append("vendor_id", String(vendorId));
        const { data } = await apiClient.post("/track-trace/brands/upload-logo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalLogoKey = data?.data?.key ?? data?.key ?? "";
      } catch {
        setError("Logo upload failed. Please try again.");
        return;
      } finally {
        setUploading(false);
      }
    }

    if (isEdit && editData) {
      await updateMutation.mutateAsync({
        id: editData.id,
        vendor_id: vendorId,
        brand_name: brandName.trim(),
        brand_short_name: brandShortName.trim() || null,
        logo: finalLogoKey || null,
        is_active: editData.is_active,
        updated_by: userId,
      });
    } else {
      await createMutation.mutateAsync({
        vendor_id: vendorId,
        brand_name: brandName.trim(),
        brand_short_name: brandShortName.trim() || null,
        logo: finalLogoKey || null,
        created_by: userId,
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            {isEdit ? "Edit Brand" : "New Brand"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand_name">Brand Name *</Label>
            <Input
              id="brand_name"
              placeholder="e.g. E3, Hettich, Hafele"
              value={brandName}
              onChange={(e) => {
                setBrandName(e.target.value);
                if (error) setError("");
              }}
              className={cn(error && "border-destructive")}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brand_short_name">Brand Short Code / Abbreviation</Label>
            <Input
              id="brand_short_name"
              placeholder="e.g. E3, HET, HAF"
              value={brandShortName}
              onChange={(e) => setBrandShortName(e.target.value)}
            />
          </div>

          {/* ── Logo Upload ── */}
          <div className="flex flex-col gap-2">
            <Label>Brand Logo (Optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="logo_file_input"
            />
            {(logoPreview || logoUrl) ? (
              <div className="relative w-full rounded-xl border bg-muted/30 p-3 flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg border overflow-hidden bg-white flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview || logoUrl}
                    alt="Brand logo preview"
                    className="h-full w-full object-contain"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{logoFile ? logoFile.name : "Current logo"}</p>
                  <p className="text-xs text-muted-foreground">{logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : "Stored on server"}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"
                    onClick={() => fileInputRef.current?.click()}>
                    <Upload className="size-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive/60 hover:text-destructive"
                    onClick={clearLogo}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="logo_file_input"
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 px-4 py-6 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <div className="rounded-full bg-muted p-3">
                  <ImageIcon className="size-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload logo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, SVG up to 2MB</p>
                </div>
              </label>
            )}
            {error && error.includes("logo") && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Brand"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BrandMasterPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { data: brands = [], isLoading, isError } = useBrandMasters(vendorId);
  const toggleStatus = useToggleBrandStatus(vendorId ?? 0);
  const deleteMutation = useDeleteBrandMaster(vendorId ?? 0);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<BrandMaster | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return brands.filter(
      (b: BrandMaster) =>
        b.brand_name.toLowerCase().includes(q) ||
        (b.brand_short_name && b.brand_short_name.toLowerCase().includes(q))
    );
  }, [brands, search]);

  const handleEdit = (brand: BrandMaster) => {
    setEditBrand(brand);
    setDialogOpen(true);
  };

  const handleToggle = (brand: BrandMaster) => {
    toggleStatus.mutate({ id: brand.id, is_active: !brand.is_active });
  };

  const handleDelete = (brand: BrandMaster) => {
    if (confirm(`Are you sure you want to delete brand "${brand.brand_name}"?`)) {
      deleteMutation.mutate(brand.id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditBrand(null);
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard/track-trace/master/category">
                  Track Trace Master
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Brand Master</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-1 rounded-full bg-primary" />
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Brand Master
              </h1>
            </div>
            <p className="text-sm text-muted-foreground pl-3">
              Manage product brands and short codes for inventory & track trace
            </p>
          </div>

          <Button
            onClick={() => {
              setEditBrand(null);
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="size-4" />
            New Brand
          </Button>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Award className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Total Brands
                </p>
                <p className="text-xl font-black tabular-nums">{brands.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ToggleRight className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Active
                </p>
                <p className="text-xl font-black tabular-nums">
                  {brands.filter((b: BrandMaster) => b.is_active).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg p-2 bg-muted text-muted-foreground">
                <ToggleLeft className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Inactive
                </p>
                <p className="text-xl font-black tabular-nums">
                  {brands.filter((b: BrandMaster) => !b.is_active).length}
                </p>
              </div>
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            ⚠ Failed to load brands. Please refresh and try again.
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search brands by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-10 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  #
                </TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Brand Name
                </TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Short Code
                </TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-6" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="rounded-2xl bg-muted p-5">
                        <Award className="size-10 text-muted-foreground/50" />
                      </div>
                      <p className="font-semibold text-foreground">
                        {search ? "No brands match your search" : "No brands yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {search
                          ? "Try a different search term"
                          : "Click 'New Brand' to add your first brand"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((brand: BrandMaster, idx: number) => (
                  <TableRow
                    key={brand.id}
                    className={cn(
                      "group transition-colors hover:bg-primary/5",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {idx + 1}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {brand.brand_name}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {brand.brand_short_name ? (
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] uppercase px-2 py-0.5"
                        >
                          {brand.brand_short_name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          None
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
                          brand.is_active
                            ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {brand.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(brand)}
                          className="h-8 w-8 p-0"
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggle(brand)}
                          disabled={toggleStatus.isPending}
                          className={cn(
                            "h-8 w-8 p-0",
                            brand.is_active
                              ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          title={brand.is_active ? "Deactivate" : "Activate"}
                        >
                          {brand.is_active ? (
                            <ToggleRight className="size-4" />
                          ) : (
                            <ToggleLeft className="size-4" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(brand)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <BrandFormDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          editData={editBrand}
          vendorId={vendorId ?? 0}
          userId={userId ?? 0}
        />
      </div>
    </>
  );
}

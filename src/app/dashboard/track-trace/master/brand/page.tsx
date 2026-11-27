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
  Award, Building2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ImageIcon, Pencil, Plus, Search, ToggleLeft, ToggleRight, Trash2, Upload, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
            <Award className="size-5 text-foreground" />
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
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 px-4 py-6 cursor-pointer hover:border-foreground/50 hover:bg-muted/30 transition-colors"
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
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<BrandMaster | null>(null);
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState<BrandMaster | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const getBrandMonogram = (name: string) => {
    if (!name) return "—";
    const cleaned = name.trim().replace(/^[^a-zA-Z0-9]+/, "");
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (cleaned.slice(0, 2) || "BR").toUpperCase();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return brands.filter((b: BrandMaster) => {
      const matchesSearch =
        !q ||
        b.brand_name.toLowerCase().includes(q) ||
        (b.brand_short_name && b.brand_short_name.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? b.is_active
          : !b.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [brands, search, statusFilter]);

  const activeCount = useMemo(
    () => brands.filter((b: BrandMaster) => b.is_active).length,
    [brands]
  );
  const inactiveCount = useMemo(
    () => brands.filter((b: BrandMaster) => !b.is_active).length,
    [brands]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // Adjust page if it exceeds total pages
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedBrands = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleEdit = (brand: BrandMaster) => {
    setEditBrand(brand);
    setDialogOpen(true);
  };

  const handleToggle = (brand: BrandMaster) => {
    toggleStatus.mutate({ id: brand.id, is_active: !brand.is_active });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmBrand) {
      await deleteMutation.mutateAsync(deleteConfirmBrand.id);
      setDeleteConfirmBrand(null);
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

      <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6">
        <div className="flex w-full flex-col gap-5">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Brand Master
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage product brands, logos, and short codes for inventory & track trace
              </p>
            </div>

            <Button
              onClick={() => {
                setEditBrand(null);
                setDialogOpen(true);
              }}
              size="sm"
              className="gap-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium"
            >
              <Plus className="size-4" />
              New Brand
            </Button>
          </div>

          {/* Interactive Stat Cards */}
          {!isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "rounded-xl border p-4 text-left shadow-2xs transition-all cursor-pointer",
                  statusFilter === "all"
                    ? "bg-card border-foreground/30 ring-1 ring-foreground/20"
                    : "bg-card/60 hover:bg-card border-border/80"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Total Brands
                  </p>
                  <Award className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                  {brands.length}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={cn(
                  "rounded-xl border p-4 text-left shadow-2xs transition-all cursor-pointer",
                  statusFilter === "active"
                    ? "bg-card border-foreground/30 ring-1 ring-foreground/20"
                    : "bg-card/60 hover:bg-card border-border/80"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Active
                  </p>
                  <span className="size-2 rounded-full bg-foreground" />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                  {activeCount}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={cn(
                  "rounded-xl border p-4 text-left shadow-2xs transition-all cursor-pointer col-span-2 sm:col-span-1",
                  statusFilter === "inactive"
                    ? "bg-card border-foreground/30 ring-1 ring-foreground/20"
                    : "bg-card/60 hover:bg-card border-border/80"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Inactive
                  </p>
                  <span className="size-2 rounded-full bg-muted-foreground/40" />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                  {inactiveCount}
                </p>
              </button>
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
              ⚠ Failed to load brands. Please refresh and try again.
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search brands by name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs bg-background"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Select
                value={statusFilter}
                onValueChange={(val: "all" | "active" | "inactive") => {
                  setStatusFilter(val);
                }}
              >
                <SelectTrigger className="h-9 w-[130px] text-xs bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>

              {(search || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset Filters
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-medium self-end sm:self-auto">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "brand" : "brands"}
            </div>
          </div>

          {/* Table Card */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                  <TableHead className="w-14 text-center text-xs font-bold text-foreground">
                    #
                  </TableHead>
                  <TableHead className="text-xs font-bold text-foreground min-w-[260px]">
                    Brand Name
                  </TableHead>
                  <TableHead className="w-40 text-xs font-bold text-foreground">
                    Short Code
                  </TableHead>
                  <TableHead className="w-32 text-xs font-bold text-foreground">
                    Status
                  </TableHead>
                  <TableHead className="w-52 text-xs font-bold text-foreground text-right pr-4">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center">
                        <Skeleton className="h-4 w-6 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-9 rounded-lg" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-24 ml-auto" />
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
                          {search || statusFilter !== "all"
                            ? "No brands match your filters"
                            : "No brands yet"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {search || statusFilter !== "all"
                            ? "Try adjusting your search query or status filter"
                            : "Click 'New Brand' to add your first brand"}
                        </p>
                        {(search || statusFilter !== "all") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearch("");
                              setStatusFilter("all");
                            }}
                            className="mt-2 text-xs"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBrands.map((brand: BrandMaster, idx: number) => {
                    const rowNumber = (page - 1) * pageSize + idx + 1;
                    return (
                      <TableRow
                        key={brand.id}
                        className={cn(
                          "group transition-colors hover:bg-muted/40",
                          idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                        )}
                      >
                        <TableCell className="text-xs text-muted-foreground font-mono text-center">
                          {rowNumber}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            {brand.logo ? (
                              <div className="size-9 rounded-lg border bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={brand.logo}
                                  alt={brand.brand_name}
                                  className="size-full object-contain"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="size-9 rounded-lg border bg-muted/60 text-foreground font-mono text-xs font-bold flex items-center justify-center shrink-0 tracking-wider shadow-2xs">
                                {getBrandMonogram(brand.brand_name)}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {brand.brand_name}
                              </span>
                              {brand.brand_short_name && (
                                <span className="text-[11px] text-muted-foreground font-mono sm:hidden">
                                  Code: {brand.brand_short_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {brand.brand_short_name ? (
                            <Badge
                              variant="outline"
                              className="font-mono text-xs uppercase px-2.5 py-0.5 font-semibold bg-muted/30"
                            >
                              {brand.brand_short_name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs font-mono">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all select-none shadow-2xs",
                              brand.is_active
                                ? "bg-foreground/10 text-foreground border-foreground/25 ring-1 ring-foreground/10"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full shrink-0",
                                brand.is_active
                                  ? "bg-foreground"
                                  : "bg-zinc-400 dark:bg-zinc-500"
                              )}
                            />
                            {brand.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(brand)}
                              className="h-8 px-2.5 text-xs font-medium gap-1.5 rounded-md hover:bg-muted text-foreground"
                              title="Edit Brand"
                            >
                              <Pencil className="size-3.5" />
                              <span>Edit</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggle(brand)}
                              disabled={toggleStatus.isPending}
                              className={cn(
                                "h-8 px-2.5 text-xs font-medium gap-1.5 rounded-md hover:bg-muted",
                                brand.is_active
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                              title={
                                brand.is_active
                                  ? "Click to Deactivate"
                                  : "Click to Activate"
                              }
                            >
                              {brand.is_active ? (
                                <>
                                  <ToggleRight className="size-4" />
                                  <span className="hidden xl:inline">Active</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="size-4" />
                                  <span className="hidden xl:inline">Inactive</span>
                                </>
                              )}
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteConfirmBrand(brand)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                              title="Delete Brand"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination matching online-lead style */}
            <div className="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto border-t bg-background px-4 py-3 sm:flex-row sm:gap-8">
              <div className="flex-1 whitespace-nowrap text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {filtered.length}
                </span>{" "}
                brands
              </div>
              <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                <div className="flex items-center space-x-2">
                  <p className="whitespace-nowrap text-sm font-medium">
                    Rows per page
                  </p>
                  <Select
                    value={`${pageSize}`}
                    onValueChange={(val) => {
                      setPageSize(Number(val));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[4.5rem] [&[data-size]]:h-8">
                      <SelectValue placeholder={`${pageSize}`} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-center text-sm font-medium">
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    aria-label="Go to first page"
                    variant="outline"
                    size="icon"
                    className="hidden size-8 lg:flex"
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                  >
                    <ChevronsLeft className="size-4" />
                  </Button>
                  <Button
                    aria-label="Go to previous page"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    aria-label="Go to next page"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button
                    aria-label="Go to last page"
                    variant="outline"
                    size="icon"
                    className="hidden size-8 lg:flex"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                  >
                    <ChevronsRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit / Create Form Dialog */}
        <BrandFormDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          editData={editBrand}
          vendorId={vendorId ?? 0}
          userId={userId ?? 0}
        />

        {/* Delete Confirmation Modal */}
        <Dialog
          open={!!deleteConfirmBrand}
          onOpenChange={(open) => !open && setDeleteConfirmBrand(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Trash2 className="size-4 text-destructive" />
                Delete Brand
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Are you sure you want to delete brand{" "}
              <span className="font-semibold text-foreground">
                &quot;{deleteConfirmBrand?.brand_name}&quot;
              </span>
              ? This action cannot be undone.
            </p>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmBrand(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Brand"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

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
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  FolderOpen, Layers, Pencil, Plus, Search, ToggleLeft, ToggleRight, Trash2, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { LucideIcon } from "lucide-react";

interface SimpleMasterItem {
  id: number;
  is_active: boolean;
  vendor_id: number;
  created_at: string;
  [key: string]: any;
}

interface SimpleMasterPageProps {
  title: string;
  description: string;
  nameKey: string;           // e.g. "grade_name"
  namePlaceholder: string;   // e.g. "e.g. MDF 18mm"
  icon: LucideIcon;
  items: SimpleMasterItem[];
  isLoading: boolean;
  isError: boolean;
  createMutation: UseMutationResult<any, Error, any, any>;
  updateMutation: UseMutationResult<any, Error, any, any>;
  toggleMutation: UseMutationResult<any, Error, any, any>;
  deleteMutation: UseMutationResult<any, Error, any, any>;
  vendorId: number;
  userId: number;
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────
function ItemFormDialog({
  open, onClose, editData, nameKey, namePlaceholder, title, icon: Icon,
  createMutation, updateMutation,
  vendorId, userId,
}: {
  open: boolean;
  onClose: () => void;
  editData?: SimpleMasterItem | null;
  nameKey: string;
  namePlaceholder: string;
  title: string;
  icon: LucideIcon;
  createMutation: UseMutationResult<any, Error, any, any>;
  updateMutation: UseMutationResult<any, Error, any, any>;
  vendorId: number;
  userId: number;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const isEdit = !!editData;
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    setName(editData ? (editData[nameKey] ?? "") : "");
    setError("");
  }, [editData, open]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError(`${title} name is required`); return; }
    if (isEdit && editData) {
      await updateMutation.mutateAsync({ id: editData.id, [nameKey]: name.trim(), updated_by: userId });
    } else {
      await createMutation.mutateAsync({ vendor_id: vendorId, [nameKey]: name.trim(), created_by: userId });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5 text-foreground" />
            {isEdit ? `Edit ${title}` : `New ${title}`}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item_name">{title} Name *</Label>
            <Input
              id="item_name"
              placeholder={namePlaceholder}
              value={name}
              onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
              className={cn(error && "border-destructive")}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            {isPending ? "Saving..." : isEdit ? "Save Changes" : `Create ${title}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const isItemActive = (item: any): boolean => {
  if (!item) return false;
  return (
    item.is_active === true ||
    item.is_active === 1 ||
    item.is_active === "1" ||
    item.is_active === "true" ||
    item.active === "Yes" ||
    item.active === "yes" ||
    item.active === true
  );
};

const getItemMonogram = (name: string) => {
  if (!name) return "—";
  const cleaned = name.trim().replace(/^[^a-zA-Z0-9]+/, "");
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (cleaned.slice(0, 2) || "IT").toUpperCase();
};

// ─── Main Master Page ─────────────────────────────────────────────────────────
export function SimpleMasterPage({
  title, description, nameKey, namePlaceholder, icon: Icon,
  items, isLoading, isError,
  createMutation, updateMutation, toggleMutation, deleteMutation,
  vendorId, userId,
}: SimpleMasterPageProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SimpleMasterItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<SimpleMasterItem | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const name = String(item[nameKey] ?? "").toLowerCase();
      const matchesSearch = !q || name.includes(q);
      const active = isItemActive(item);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? active
          : !active;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, nameKey, statusFilter]);

  const activeCount = useMemo(
    () => items.filter((i) => isItemActive(i)).length,
    [items]
  );
  const inactiveCount = useMemo(
    () => items.filter((i) => !isItemActive(i)).length,
    [items]
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

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleEdit = (item: SimpleMasterItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditItem(null);
  };

  const handleToggle = (item: SimpleMasterItem) => {
    const currentActive = isItemActive(item);
    toggleMutation.mutate({ id: item.id, is_active: !currentActive });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmItem) {
      await deleteMutation.mutateAsync(deleteConfirmItem.id);
      setDeleteConfirmItem(null);
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </div>
            <Button
              onClick={() => { setEditItem(null); setDialogOpen(true); }}
              size="sm"
              className="gap-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium"
            >
              <Plus className="size-4" /> New {title}
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
                    Total {title}s
                  </p>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                  {items.length}
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
              ⚠ Failed to load {title.toLowerCase()}s. Please refresh and try again.
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${title.toLowerCase()}s...`}
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
              {filtered.length === 1 ? title.toLowerCase() : `${title.toLowerCase()}s`}
            </div>
          </div>

          {/* Table Card */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                  <TableHead className="w-14 text-center text-xs font-bold text-foreground">#</TableHead>
                  <TableHead className="text-xs font-bold text-foreground min-w-[260px]">Name</TableHead>
                  <TableHead className="w-36 text-xs font-bold text-foreground">Status</TableHead>
                  <TableHead className="w-52 text-xs font-bold text-foreground text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-9 rounded-lg" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="rounded-2xl bg-muted p-5"><FolderOpen className="size-10 text-muted-foreground/50" /></div>
                        <p className="font-semibold text-foreground">
                          {search || statusFilter !== "all"
                            ? `No ${title.toLowerCase()}s match your filters`
                            : `No ${title.toLowerCase()}s yet`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {search || statusFilter !== "all"
                            ? "Try adjusting your search query or status filter"
                            : `Click 'New ${title}' to get started`}
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
                  paginatedItems.map((item, idx) => {
                    const rowNumber = (page - 1) * pageSize + idx + 1;
                    const active = isItemActive(item);

                    return (
                      <TableRow
                        key={item.id}
                        className={cn("group transition-colors hover:bg-muted/40", idx % 2 === 0 ? "bg-background" : "bg-muted/10")}
                      >
                        <TableCell className="text-xs text-muted-foreground font-mono text-center">{rowNumber}</TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg border bg-muted/60 text-foreground font-mono text-xs font-bold flex items-center justify-center shrink-0 tracking-wider shadow-2xs">
                              {getItemMonogram(String(item[nameKey] ?? ""))}
                            </div>
                            <span className="font-semibold text-sm text-foreground">{item[nameKey]}</span>
                          </div>
                        </TableCell>

                        {/* Status Badge with crisp visible pill, border and dot indicator */}
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all select-none shadow-2xs",
                              active
                                ? "bg-foreground/10 text-foreground border-foreground/25 ring-1 ring-foreground/10"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full shrink-0",
                                active ? "bg-foreground" : "bg-zinc-400 dark:bg-zinc-500"
                              )}
                            />
                            {active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                              className="h-8 px-2.5 text-xs font-medium gap-1.5 rounded-md hover:bg-muted text-foreground"
                              title={`Edit ${title}`}
                            >
                              <Pencil className="size-3.5" />
                              <span>Edit</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggle(item)}
                              disabled={toggleMutation.isPending}
                              className={cn(
                                "h-8 px-2.5 text-xs font-medium gap-1.5 rounded-md hover:bg-muted",
                                active ? "text-foreground" : "text-muted-foreground"
                              )}
                              title={active ? "Click to Deactivate" : "Click to Activate"}
                            >
                              {active ? (
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
                              onClick={() => setDeleteConfirmItem(item)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                              title={`Delete ${title}`}
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
                  {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                {title.toLowerCase()}s
              </div>
              <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
                <div className="flex items-center space-x-2">
                  <p className="whitespace-nowrap text-sm font-medium">Rows per page</p>
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
        <ItemFormDialog
          open={dialogOpen}
          onClose={handleClose}
          editData={editItem}
          nameKey={nameKey}
          namePlaceholder={namePlaceholder}
          title={title}
          icon={Icon}
          createMutation={createMutation}
          updateMutation={updateMutation}
          vendorId={vendorId}
          userId={userId}
        />

        {/* Delete Confirmation Modal */}
        <Dialog
          open={!!deleteConfirmItem}
          onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <Trash2 className="size-4 text-destructive" />
                Delete {title}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Are you sure you want to delete {title.toLowerCase()}{" "}
              <span className="font-semibold text-foreground">
                &quot;{deleteConfirmItem ? String(deleteConfirmItem[nameKey]) : ""}&quot;
              </span>
              ? This action cannot be undone.
            </p>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : `Delete ${title}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

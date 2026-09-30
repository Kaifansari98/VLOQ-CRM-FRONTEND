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
  FolderOpen, Layers, Pencil, Plus, Search, ToggleLeft, ToggleRight, Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
            <Icon className="size-5 text-primary" />
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
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save Changes" : `Create ${title}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Master Page ─────────────────────────────────────────────────────────
export function SimpleMasterPage({
  title, description, nameKey, namePlaceholder, icon: Icon,
  items, isLoading, isError,
  createMutation, updateMutation, toggleMutation, deleteMutation,
  vendorId, userId,
}: SimpleMasterPageProps) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SimpleMasterItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => (item[nameKey] ?? "").toLowerCase().includes(q));
  }, [items, search, nameKey]);

  const handleEdit = (item: SimpleMasterItem) => { setEditItem(item); setDialogOpen(true); };
  const handleClose = () => { setDialogOpen(false); setEditItem(null); };
  const handleToggle = (item: SimpleMasterItem) => {
    toggleMutation.mutate({ id: item.id, is_active: !item.is_active });
  };
  const handleDelete = (item: SimpleMasterItem) => {
    if (confirm(`Delete "${item[nameKey]}"? This cannot be undone.`)) {
      deleteMutation.mutate(item.id);
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

      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-1 rounded-full bg-primary" />
              <h1 className="text-2xl font-black tracking-tight text-foreground">{title}</h1>
            </div>
            <p className="text-sm text-muted-foreground pl-3">{description}</p>
          </div>
          <Button onClick={() => { setEditItem(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="size-4" /> New {title}
          </Button>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400"><Layers className="size-4" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total</p>
                <p className="text-xl font-black tabular-nums">{items.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><ToggleRight className="size-4" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Active</p>
                <p className="text-xl font-black tabular-nums">{items.filter((i) => i.is_active).length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg p-2 bg-muted text-muted-foreground"><ToggleLeft className="size-4" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Inactive</p>
                <p className="text-xl font-black tabular-nums">{items.filter((i) => !i.is_active).length}</p>
              </div>
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            ⚠ Failed to load {title.toLowerCase()}s. Please refresh and try again.
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${title.toLowerCase()}s...`}
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
                <TableHead className="w-10 text-xs font-black uppercase tracking-widest text-muted-foreground">#</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="rounded-2xl bg-muted p-5"><FolderOpen className="size-10 text-muted-foreground/50" /></div>
                      <p className="font-semibold text-foreground">{search ? `No ${title.toLowerCase()}s match your search` : `No ${title.toLowerCase()}s yet`}</p>
                      <p className="text-sm text-muted-foreground">{search ? "Try a different search term" : `Click 'New ${title}' to get started`}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    className={cn("group transition-colors hover:bg-primary/5", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm text-foreground">{item[nameKey]}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
                        item.is_active
                          ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} className="h-8 w-8 p-0" title="Edit">
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => handleToggle(item)}
                          disabled={toggleMutation.isPending}
                          className={cn("h-8 w-8 p-0", item.is_active ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-muted-foreground hover:text-foreground")}
                          title={item.is_active ? "Deactivate" : "Activate"}
                        >
                          {item.is_active ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => handleDelete(item)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
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
      </div>

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
    </>
  );
}

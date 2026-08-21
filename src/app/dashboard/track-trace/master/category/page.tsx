"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import ClearInput from "@/components/origin-input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import {
  FolderOpen,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  GitBranch,
  PackageCheck,
  Package,
  Boxes,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCheckExternalToken,
  useProjectCategories,
  useSyncCategories,
  useToggleCategoryStatus,
  useUpdateProjectCategory,
} from "@/hooks/track-trace/useProjectCategories";
import { ProjectCategory } from "@/api/track-trace/project-categories.api";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

function IOSSwitch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange(!checked);
      }}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-emerald-500" : "bg-muted-foreground/30"
      )}
      title={checked ? "Deactivate Category" : "Activate Category"}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function ProjectCategoriesPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isScanPackEnabled = user?.vendor?.is_scanpack_enabled === true;
  const vendorId = user?.vendor_id;
  const userId = user?.id;

  const {
    data: categories = [],
    isLoading,
    isError,
  } = useProjectCategories(vendorId);
  const toggleStatus = useToggleCategoryStatus(vendorId ?? 0);
  const updateCategoryMutation = useUpdateProjectCategory(vendorId ?? 0);
  const { data: hasToken } = useCheckExternalToken(vendorId);
  const syncMutation = useSyncCategories(vendorId ?? 0);

  const [globalFilter, setGlobalFilter] = useState("");
  const [subCategoryToEdit, setSubCategoryToEdit] = useState<ProjectCategory | null>(null);
  const [editSubCategoryName, setEditSubCategoryName] = useState("");
  const [editSubCategoryError, setEditSubCategoryError] = useState("");

  const handleEdit = (category: ProjectCategory) => {
    if (category.parent_id) {
      setSubCategoryToEdit(category);
      setEditSubCategoryName(category.category_name);
      setEditSubCategoryError("");
    } else {
      router.push(
        `/dashboard/track-trace/master/category/create?id=${category.id}`
      );
    }
  };

  const handleSaveSubCategory = async () => {
    if (!subCategoryToEdit || !vendorId || !userId) return;
    if (!editSubCategoryName.trim()) {
      setEditSubCategoryError("Sub-category name is required");
      return;
    }
    try {
      await updateCategoryMutation.mutateAsync({
        id: subCategoryToEdit.id,
        vendor_id: vendorId,
        category_name: editSubCategoryName.trim(),
        status: subCategoryToEdit.status,
        type_ids: [],
        created_by: userId,
        updated_by: userId,
        parent_id: subCategoryToEdit.parent_id,
      });
      setSubCategoryToEdit(null);
    } catch (err) {
      console.error("Failed to update sub-category", err);
    }
  };

  const handleToggle = (category: ProjectCategory) => {
    toggleStatus.mutate({
      id: category.id,
      status: category.status === "Yes" ? "No" : "Yes",
    });
  };

  const columns = useMemo<ColumnDef<ProjectCategory>[]>(
    () => {
      const cols: ColumnDef<ProjectCategory>[] = [
      {
        id: "index",
        header: "#",
        size: 50,
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return (
            <span className="text-xs text-muted-foreground font-mono">
              {pageIndex * pageSize + row.index + 1}
            </span>
          );
        },
      },
      {
        accessorKey: "category_name",
        header: "Category Name",
        size: 240,
        cell: ({ row }) => {
          const category = row.original;
          const isSubCategory = !!category.parent_id;
          return (
            <div>
              <div className="flex items-center gap-2">
                {isSubCategory && (
                  <GitBranch className="size-3.5 text-indigo-500/70 shrink-0" />
                )}
                <span className="font-semibold text-sm text-foreground">
                  {category.category_name}
                </span>
                {isSubCategory && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 px-2 py-0"
                  >
                    Sub
                  </Badge>
                )}
                {(category as any).external_category_id && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono px-1.5 py-0 text-muted-foreground border-muted-foreground/30"
                  >
                    CadBid
                  </Badge>
                )}
              </div>
              {category.parent && (
                <p className="text-[11px] text-muted-foreground mt-0.5 pl-5">
                  Under:{" "}
                  <span className="font-medium text-foreground">
                    {category.parent.category_name}
                  </span>
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "prefix",
        header: "Prefix / Code Group",
        size: 150,
        cell: ({ row }) => {
          const prefix = row.original.prefix;
          return (
            <span className="font-mono font-semibold text-xs text-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border">
              {prefix || "-"}
            </span>
          );
        },
      },
      {
        id: "assigned_modules",
        header: "Assigned Modules",
        size: 200,
        cell: ({ row }) => {
          const assignedModules =
            row.original.projectCategoriesMasterVendorMapping || [];
          if (assignedModules.length === 0) {
            return (
              <span className="text-xs text-muted-foreground italic">
                No modules assigned
              </span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1.5">
              {assignedModules.map((m) => (
                <Badge
                  key={m.id}
                  variant="secondary"
                  className="text-[10px] font-semibold px-2 py-0.5"
                >
                  {m.projectCategoriesTypeMaster?.module_name || "Module"}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "packing_options",
        header: "Packing & Scan Validation",
        size: 240,
        cell: ({ row }) => {
          const category = row.original;
          const isSubCategory = !!category.parent_id;
          const includeInPacking = category.include_in_packing ?? false;
          const scanPackValidate = category.scan_pack_validate ?? false;
          const useInAssembledPacking = category.use_in_assembled_packing ?? false;

          if (isSubCategory) {
            return (
              <span className="text-xs text-muted-foreground italic">
                Inherited from parent
              </span>
            );
          }

          if (!includeInPacking && !scanPackValidate && !useInAssembledPacking) {
            return (
              <span className="text-xs text-muted-foreground italic">
                Not applicable
              </span>
            );
          }

          return (
            <div className="flex flex-wrap gap-1.5 items-center">
              {includeInPacking && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 gap-1 px-2 py-0.5"
                >
                  <Package className="size-3" /> Include in Packing
                </Badge>
              )}
              {scanPackValidate && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1 px-2 py-0.5"
                >
                  <PackageCheck className="size-3" /> Scan & Pack Validate
                </Badge>
              )}
              {useInAssembledPacking && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 gap-1 px-2 py-0.5"
                >
                  <Boxes className="size-3" /> Assembled Packing
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 90,
        cell: ({ row }) => {
          const isActive = row.original.status === "Yes";
          return (
            <div className="w-20 shrink-0">
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[62px] text-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground ring-1 ring-muted-foreground/20"
                )}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-right font-bold text-xs uppercase tracking-wider pr-2">
            Actions
          </div>
        ),
        size: 140,
        cell: ({ row }) => {
          const category = row.original;
          const isActive = category.status === "Yes";
          return (
            <div className="flex items-center justify-end gap-2 pr-1 w-32 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(category);
                }}
                className="h-8 px-2.5 gap-1.5 text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all shrink-0"
                title="Edit Category"
              >
                <Pencil className="size-3.5" />
                <span>Edit</span>
              </Button>
              <IOSSwitch
                checked={isActive}
                onCheckedChange={() => handleToggle(category)}
                disabled={toggleStatus.isPending}
              />
            </div>
          );
        },
      },
    ];
    return isScanPackEnabled
      ? cols
      : cols.filter((col) => col.id !== "packing_options");
  },
  [handleEdit, handleToggle, toggleStatus.isPending, isScanPackEnabled]
);

  const table = useReactTable({
    data: categories,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Project Categories</BreadcrumbPage>
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
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold">Project Categories</h1>
            <p className="text-sm text-muted-foreground hidden md:block">
              Manage categories and assign them to modules
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasToken && (
              <Button
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="gap-2"
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    syncMutation.isPending && "animate-spin"
                  )}
                />
                {syncMutation.isPending ? "Syncing..." : "Sync Categories"}
              </Button>
            )}
            <Button
              onClick={() =>
                router.push("/dashboard/track-trace/master/category/create")
              }
              className="gap-2"
            >
              <Plus className="size-4" />
              New Category
            </Button>
          </div>
        </div>

        {/* ── No token notice ── */}
        {hasToken === false && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-3 text-sm text-amber-700 dark:text-amber-400">
            ⚡ Connect your CadBid account to enable category sync.
          </div>
        )}

        {/* ── Stats ── */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs transition-all hover:border-primary/40">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Layers className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground/90">
                    Total Categories
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    All main & sub-categories
                  </span>
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground tabular-nums">
                {categories.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs transition-all hover:border-emerald-500/40">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground/90">
                    Active Categories
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Currently operational
                  </span>
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground tabular-nums">
                {categories.filter((c) => c.status === "Yes").length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs transition-all hover:border-muted-foreground/40">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border shrink-0">
                  <XCircle className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground/90">
                    Inactive Categories
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Disabled from system
                  </span>
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground tabular-nums">
                {categories.filter((c) => c.status === "No").length}
              </span>
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            ⚠ Failed to load categories. Please refresh and try again.
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <ClearInput
              placeholder="Search categories..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <DataTableViewOptions table={table} />
          </div>
        </div>

        {/* ── Table Container ── */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <DataTable table={table} />
        )}

        {/* ── Edit Sub Category Dialog Modal ── */}
        <Dialog
          open={!!subCategoryToEdit}
          onOpenChange={(open) => {
            if (!open) setSubCategoryToEdit(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <GitBranch className="size-5 text-emerald-500" />
                Edit Sub Category
              </DialogTitle>
              {subCategoryToEdit?.parent && (
                <DialogDescription className="text-xs">
                  Under parent category:{" "}
                  <span className="font-semibold text-foreground">
                    {subCategoryToEdit.parent.category_name}
                  </span>
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="flex flex-col gap-2 py-2">
              <Label htmlFor="sub_category_name" className="text-xs font-semibold">
                Sub Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sub_category_name"
                value={editSubCategoryName}
                onChange={(e) => {
                  setEditSubCategoryName(e.target.value);
                  if (editSubCategoryError) setEditSubCategoryError("");
                }}
                placeholder="Sub category name..."
                className="h-10 text-sm"
                autoFocus
              />
              {editSubCategoryError && (
                <p className="text-xs text-destructive font-medium">
                  {editSubCategoryError}
                </p>
              )}
            </div>

            <DialogFooter className="flex flex-row justify-end items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubCategoryToEdit(null)}
                disabled={updateCategoryMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveSubCategory}
                disabled={updateCategoryMutation.isPending}
                className="gap-2"
              >
                {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

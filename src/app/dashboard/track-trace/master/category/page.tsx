"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
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
import {
  Layers,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  GitBranch,
  Loader2,
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
import type {
  ProjectCategory,
  ProjectCategoryFilters,
} from "@/api/track-trace/project-categories.api";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import TrackTraceCategoryTable from "@/components/custom/track-trace-category-table";

function StatCard({
  label,
  value,
  sub,
  Icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: React.ElementType;
  iconColor?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 px-3.5 space-y-1.5 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground truncate">
          {label}
        </p>
        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-muted/70 border border-border/70 text-foreground">
          <Icon size={15} className={iconColor} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-foreground tabular-nums tracking-tight">
          {value}
        </p>
      </div>
      {sub && (
        <p className="text-[11px] text-muted-foreground font-medium truncate">
          {sub}
        </p>
      )}
    </div>
  );
}

const DEFAULT_FILTERS: ProjectCategoryFilters = {
  page: 1,
  limit: 10,
  search: "",
  status: "all",
  type: "all",
  sort_by: "category_name",
  sort_order: "asc",
};

export default function ProjectCategoriesPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isScanPackEnabled = user?.vendor?.is_scanpack_enabled === true;
  const vendorId = user?.vendor_id;
  const userId = user?.id;

  const [filters, setFilters] = useState<ProjectCategoryFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const {
    data,
    isLoading,
    isError,
    isFetching,
  } = useProjectCategories(vendorId, filters);

  const categories: ProjectCategory[] = data?.categories ?? [];
  const pagination = data?.pagination;

  // Unfiltered count query for top KPI cards
  const { data: allData } = useProjectCategories(vendorId);
  const allCategories: ProjectCategory[] = allData?.categories ?? [];

  const toggleStatus = useToggleCategoryStatus(vendorId ?? 0);
  const updateCategoryMutation = useUpdateProjectCategory(vendorId ?? 0);
  const { data: hasToken } = useCheckExternalToken(vendorId);
  const syncMutation = useSyncCategories(vendorId ?? 0);

  const [subCategoryToEdit, setSubCategoryToEdit] =
    useState<ProjectCategory | null>(null);
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

  const handleSort = (field: string) => {
    setFilters((prev) => {
      const sameColumn = prev.sort_by === field;
      return {
        ...prev,
        page: 1,
        sort_by: field,
        sort_order: sameColumn
          ? prev.sort_order === "asc"
            ? "desc"
            : "asc"
          : "asc",
      };
    });
  };

  const resetFilters = () => {
    setSearchInput("");
    setFilters({ ...DEFAULT_FILTERS });
  };

  const activeCount = useMemo(
    () => allCategories.filter((c) => c.status === "Yes").length,
    [allCategories]
  );
  const inactiveCount = useMemo(
    () => allCategories.filter((c) => c.status === "No").length,
    [allCategories]
  );
  const subCount = useMemo(
    () => allCategories.filter((c) => !!c.parent_id).length,
    [allCategories]
  );

  return (
    <>
      {/* ── Header ── */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/track-trace">
                  Track & Trace
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
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

      <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6">
        <div className="flex w-full flex-col gap-5">
          {/* Header Title & Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Project Categories
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Search, filter, and configure project categories, prefixes, and module mappings.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasToken && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="gap-2 text-xs h-8"
                >
                  <RefreshCw
                    className={
                      syncMutation.isPending ? "size-3.5 animate-spin" : "size-3.5"
                    }
                  />
                  <span>
                    {syncMutation.isPending ? "Syncing..." : "Sync Categories"}
                  </span>
                </Button>
              )}
              <Button
                size="sm"
                onClick={() =>
                  router.push("/dashboard/track-trace/master/category/create")
                }
                className="gap-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium text-xs h-8"
              >
                <Plus size={15} />
                <span>New Category</span>
              </Button>
            </div>
          </div>

          {/* Connect account notice */}
          {hasToken === false && (
            <div className="rounded-xl border border-border/50 bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
              ⚡ Connect your CadBid account to enable automatic category sync.
            </div>
          )}

          {/* KPI Stat Cards */}
          {!isLoading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border bg-background px-4 py-3 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Categories</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{allCategories.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">All main &amp; sub categories</p>
              </div>
              <div className="rounded-xl border bg-background px-4 py-3 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Categories</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{activeCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Currently operational</p>
              </div>
              <div className="rounded-xl border bg-background px-4 py-3 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inactive Categories</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{inactiveCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Disabled from system</p>
              </div>
              <div className="rounded-xl border bg-background px-4 py-3 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sub Categories</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{subCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Under parent categories</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading categories...
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
              ⚠ Failed to load categories. Please refresh and try again.
            </div>
          )}

          {/* Table Container */}
          {!isLoading && !isError && (
            <div>


              <TrackTraceCategoryTable
                data={categories}
                page={filters.page ?? 1}
                limit={filters.limit ?? 10}
                totalCount={pagination?.total}
                totalPages={pagination?.totalPages}
                onPageChange={(p) =>
                  setFilters((prev) => ({ ...prev, page: p }))
                }
                onLimitChange={(l) =>
                  setFilters((prev) => ({ ...prev, page: 1, limit: l }))
                }
                searchQuery={searchInput}
                onSearchChange={(q) => {
                  setSearchInput(q);
                  setFilters((prev) => ({ ...prev, page: 1, search: q.trim() }));
                }}
                statusFilter={filters.status ?? "all"}
                onStatusChange={(status) =>
                  setFilters((prev) => ({ ...prev, page: 1, status }))
                }
                typeFilter={filters.type ?? "all"}
                onTypeChange={(type) =>
                  setFilters((prev) => ({ ...prev, page: 1, type }))
                }
                onResetFilters={resetFilters}
                sortBy={filters.sort_by}
                sortOrder={filters.sort_order}
                onSort={handleSort}
                isScanPackEnabled={isScanPackEnabled}
                onEditClick={handleEdit}
                onToggleStatusClick={handleToggle}
                isToggling={toggleStatus.isPending}
                className="px-0"
              />
            </div>
          )}
        </div>
      </main>

      {/* Edit Sub Category Dialog Modal */}
      <Dialog
        open={!!subCategoryToEdit}
        onOpenChange={(open) => {
          if (!open) setSubCategoryToEdit(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <GitBranch className="size-5 text-foreground" />
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
              placeholder="Enter sub-category name"
              className="h-9 text-xs"
            />
            {editSubCategoryError && (
              <p className="text-[11px] text-destructive font-medium">
                {editSubCategoryError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSubCategoryToEdit(null)}
              disabled={updateCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveSubCategory}
              disabled={updateCategoryMutation.isPending}
              className="gap-1.5"
            >
              {updateCategoryMutation.isPending && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
              <span>
                {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

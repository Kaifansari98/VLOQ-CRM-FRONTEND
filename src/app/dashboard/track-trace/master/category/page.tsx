"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
import {
  FolderOpen,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  GitBranch,
  List,
  ChevronDown,
  Check,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  useCheckExternalToken,
  useCreateProjectCategory,
  useProjectCategories,
  useProjectCategoryTypes,
  useSyncCategories,
  useToggleCategoryStatus,
  useUpdateProjectCategory,
} from "@/hooks/track-trace/useProjectCategories";
import { ProjectCategory } from "@/api/track-trace/project-categories.api";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

// ─── Sub Category Entry ───────────────────────────────────────────────────────

interface SubCategoryEntry {
  id?: number;
  name: string;
  status?: "Yes" | "No";
  type_ids: number[];
}

// ─── Category Form Dialog ─────────────────────────────────────────────────────

interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  editData?: ProjectCategory | null;
  allCategories: ProjectCategory[];
  vendorId: number;
  userId: number;
}

function CategoryFormDialog({ open, onClose, editData, allCategories, vendorId, userId }: CategoryFormDialogProps) {
  const { data: types = [], isLoading: typesLoading } = useProjectCategoryTypes();
  const createMutation = useCreateProjectCategory(vendorId);
  const updateMutation = useUpdateProjectCategory(vendorId);

  const [categoryName, setCategoryName] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | null>(null);

  // Sub-categories
  const [subCategories, setSubCategories] = useState<SubCategoryEntry[]>([]);

  const isEdit = !!editData;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const mainCategoryOptions = useMemo(() => {
    return allCategories
      .filter((c) => !c.parent_id)
      .map((c) => ({
        id: c.id,
        name: c.category_name,
      }));
  }, [allCategories]);

  useEffect(() => {
    setIsNewCategory(false);
    setPopoverOpen(false);
    const targetCategory = editData || null;
    setActiveCategory(targetCategory);

    if (targetCategory) {
      setCategoryName(targetCategory.category_name);
      setSelectedTypeIds(
        targetCategory.projectCategoriesMasterVendorMapping.map((m) => m.project_categories_type_master_id)
      );

      // Load existing sub-categories of this parent category
      const existingSubs = allCategories
        .filter((c) => c.parent_id === targetCategory.id)
        .map((c) => ({
          id: c.id,
          name: c.category_name,
          status: c.status,
          type_ids: c.projectCategoriesMasterVendorMapping.map((m) => m.project_categories_type_master_id),
        }));
      setSubCategories(existingSubs);
    } else {
      setCategoryName("");
      setSelectedTypeIds([]);
      setSubCategories([]);
    }
    setError("");
  }, [editData, open, allCategories]);

  const toggleType = (id: number) => {
    setSelectedTypeIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const handleCategorySelect = (val: number | string) => {
    const selected = allCategories.find((c) => c.id === Number(val));
    if (selected) {
      setActiveCategory(selected);
      setCategoryName(selected.category_name);
      setSelectedTypeIds(
        selected.projectCategoriesMasterVendorMapping.map((m) => m.project_categories_type_master_id)
      );
      // Load existing sub-categories of this selected parent category
      const existingSubs = allCategories
        .filter((c) => c.parent_id === selected.id)
        .map((c) => ({
          id: c.id,
          name: c.category_name,
          status: c.status,
          type_ids: c.projectCategoriesMasterVendorMapping.map((m) => m.project_categories_type_master_id),
        }));
      setSubCategories(existingSubs);
    }
  };

  // ── Sub-category helpers ──
  const addSubCategory = () => {
    setSubCategories((prev) => [...prev, { name: "", type_ids: [], status: "Yes" }]);
  };

  const removeSubCategory = (index: number) => {
    setSubCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSubCategoryName = (index: number, name: string) => {
    setSubCategories((prev) => prev.map((s, i) => i === index ? { ...s, name } : s));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!categoryName.trim()) { setError("Category name is required"); return; }

    // Validate sub-categories
    for (let i = 0; i < subCategories.length; i++) {
      if (subCategories[i].status !== "No" && !subCategories[i].name.trim()) {
        setError(`Sub-category #${i + 1} name is required`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const isEditMode = !!activeCategory;
      if (isEditMode && activeCategory) {
        // 1. Update parent category
        await updateMutation.mutateAsync({
          id: activeCategory.id,
          vendor_id: vendorId,
          category_name: categoryName.trim(),
          status: activeCategory.status,
          type_ids: selectedTypeIds,
          created_by: userId,
          updated_by: userId,
          parent_id: activeCategory.parent_id,
        });

        // 2. Manage sub-categories: update existing, create new, or deactivate removed ones
        const originalSubs = allCategories.filter((c) => c.parent_id === activeCategory.id);

        // Deactivate removed sub-categories
        for (const original of originalSubs) {
          const stillExists = subCategories.find((s) => s.id === original.id);
          if ((!stillExists || stillExists.status === "No") && original.status === "Yes") {
            await updateMutation.mutateAsync({
              id: original.id,
              vendor_id: vendorId,
              category_name: original.category_name,
              status: "No", // Deactivate it
              type_ids: [],
              created_by: userId,
              updated_by: userId,
              parent_id: activeCategory.id,
            });
          }
        }

        // Update existing or create new sub-categories
        for (const sub of subCategories) {
          if (sub.id) {
            const original = originalSubs.find((c) => c.id === sub.id);
            if (original?.category_name !== sub.name.trim() || original?.status !== sub.status) {
              await updateMutation.mutateAsync({
                id: sub.id,
                vendor_id: vendorId,
                category_name: sub.name.trim(),
                status: sub.status || "Yes",
                type_ids: [],
                created_by: userId,
                updated_by: userId,
                parent_id: activeCategory.id,
              });
            }
          } else {
            if (sub.name.trim() && sub.status !== "No") {
              await createMutation.mutateAsync({
                vendor_id: vendorId,
                category_name: sub.name.trim(),
                parent_id: activeCategory.id,
                type_ids: [],
                created_by: userId,
              });
            }
          }
        }
      } else {
        // Create main category first
        const result = await createMutation.mutateAsync({
          vendor_id: vendorId,
          category_name: categoryName.trim(),
          type_ids: selectedTypeIds,
          created_by: userId,
        });

        // Create sub-categories sequentially under the new parent
        const parentId = result?.data?.category?.id ?? result?.data?.id ?? result?.category?.id ?? result?.id;
        if (parentId && subCategories.length > 0) {
          for (const sub of subCategories) {
            if (sub.name.trim()) {
              await createMutation.mutateAsync({
                vendor_id: vendorId,
                category_name: sub.name.trim(),
                parent_id: parentId,
                type_ids: [],
                created_by: userId,
              });
            }
          }
        }
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="size-5 text-primary" />
            {activeCategory ? "Edit Category" : "New Category"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">

          {/* ── Category Name ── */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category_name">Category Name *</Label>
            {isEdit ? (
              <Input
                id="category_name"
                placeholder="e.g. Shutter Finish"
                value={categoryName}
                onChange={(e) => { setCategoryName(e.target.value); if (error) setError(""); }}
                className={cn(error && !error.startsWith("Sub") && "border-destructive")}
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  {isNewCategory ? (
                    <Input
                      id="category_name"
                      placeholder="Type new category name..."
                      value={categoryName}
                      onChange={(e) => { setCategoryName(e.target.value); if (error) setError(""); }}
                      className={cn(error && !error.startsWith("Sub") && "border-destructive")}
                    />
                  ) : (
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={popoverOpen}
                          className={cn(
                            "w-full justify-between h-9 px-3 border border-input bg-background font-normal text-muted-foreground",
                            categoryName && "text-foreground"
                          )}
                        >
                          {categoryName || "Select existing category..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search categories..." />
                          <CommandList>
                            <CommandEmpty>No categories found.</CommandEmpty>
                            <CommandGroup>
                              {mainCategoryOptions.map((option) => (
                                <CommandItem
                                  key={option.id}
                                  value={option.name}
                                  onSelect={() => {
                                    handleCategorySelect(option.id);
                                    setPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      categoryName === option.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {option.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => {
                    setIsNewCategory(!isNewCategory);
                    setActiveCategory(null);
                    setCategoryName("");
                    setSelectedTypeIds([]);
                    setSubCategories([]);
                    if (error) setError("");
                  }}
                  title={isNewCategory ? "Select existing category" : "Type new category"}
                >
                  {isNewCategory ? <List className="size-4" /> : <Plus className="size-4" />}
                </Button>
              </div>
            )}
            {error && !error.startsWith("Sub") && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* ── Modules ── */}
          {(!activeCategory || !activeCategory.parent_id) && (
            <div className="flex flex-col gap-2">
              <Label>Assign to Modules</Label>
              {typesLoading ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : types.length === 0 ? (
                <p className="text-sm text-muted-foreground">No modules configured</p>
              ) : (
                <div className="flex flex-col gap-1 rounded-lg border p-3 max-h-40 overflow-y-auto">
                  {types.map((type) => (
                    <label key={type.id} className="flex items-center gap-3 rounded-md px-2 py-2 cursor-pointer hover:bg-muted/60 transition-colors">
                      <Checkbox checked={selectedTypeIds.includes(type.id)} onCheckedChange={() => toggleType(type.id)} />
                      <span className="text-sm font-medium">{type.module_name}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedTypeIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedTypeIds.length} module{selectedTypeIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* ── Sub Categories ── */}
          {!isEdit && (!activeCategory || !activeCategory.parent_id) && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="size-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">Sub Categories</Label>
                  {subCategories.filter(s => s.status !== "No").length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{subCategories.filter(s => s.status !== "No").length}</Badge>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addSubCategory} className="h-7 gap-1 text-xs">
                  <Plus className="size-3" /> Add Sub Category
                </Button>
              </div>

              {subCategories.filter(s => s.status !== "No").length === 0 ? (
                <div
                  onClick={addSubCategory}
                  className="rounded-lg border border-dashed border-muted-foreground/30 px-4 py-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <p className="text-xs text-muted-foreground">Click <span className="font-semibold text-foreground">Add Sub Category</span> to create sub categories under this category</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {subCategories.map((sub, index) => {
                    if (sub.status === "No") return null;
                    return (
                      <div key={index} className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Sub Category {index + 1}</span>
                          <Button
                            type="button" variant="ghost" size="sm"
                            onClick={() => {
                              if (sub.id) {
                                setSubCategories((prev) => prev.map((s, i) => i === index ? { ...s, status: "No" } : s));
                              } else {
                                removeSubCategory(index);
                              }
                            }}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <Input
                            placeholder="e.g. PVC Edgeband Tape"
                            value={sub.name}
                            onChange={(e) => { updateSubCategoryName(index, e.target.value); if (error) setError(""); }}
                            className={cn("h-8 text-sm", error.startsWith("Sub") && !sub.name.trim() && "border-destructive")}
                          />
                          {error.startsWith("Sub") && !sub.name.trim() && index === Number(error.match(/\d+/)?.[0] ?? -1) - 1 && (
                            <p className="text-xs text-destructive">{error}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending || isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || isSubmitting}>
            {isPending || isSubmitting
              ? "Saving..."
              : activeCategory
                ? "Save Changes"
                : subCategories.length > 0
                  ? `Create Category + ${subCategories.length} Sub${subCategories.length > 1 ? "s" : ""}`
                  : "Create Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectCategoriesPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId   = useAppSelector((state) => state.auth.user?.id);

  const { data: categories = [], isLoading, isError } = useProjectCategories(vendorId);
  const toggleStatus  = useToggleCategoryStatus(vendorId ?? 0);
  const { data: hasToken } = useCheckExternalToken(vendorId);
  const syncMutation  = useSyncCategories(vendorId ?? 0);

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ProjectCategory | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return categories.filter((c) => c.category_name.toLowerCase().includes(q));
  }, [categories, search]);

  const handleEdit = (category: ProjectCategory) => {
    setEditCategory(category);
    setDialogOpen(true);
  };
  const handleToggle      = (category: ProjectCategory) => { toggleStatus.mutate({ id: category.id, status: category.status === "Yes" ? "No" : "Yes" }); };
  const handleDialogClose = () => { setDialogOpen(false); setEditCategory(null); };

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
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-1 rounded-full bg-primary" />
              <h1 className="text-2xl font-black tracking-tight text-foreground">Project Categories</h1>
            </div>
            <p className="text-sm text-muted-foreground pl-3">Manage categories and assign them to modules</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasToken && (
              <Button
                variant="outline"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className={cn("size-4", syncMutation.isPending && "animate-spin")} />
                {syncMutation.isPending ? "Syncing..." : "Sync Categories"}
              </Button>
            )}
            <Button onClick={() => { setEditCategory(null); setDialogOpen(true); }} className="gap-2">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400"><Layers className="size-4" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total</p>
                <p className="text-xl font-black tabular-nums">{categories.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><ToggleRight className="size-4" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Active</p>
                <p className="text-xl font-black tabular-nums">{categories.filter((c) => c.status === "Yes").length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
              <div className="rounded-lg p-2 bg-muted text-muted-foreground"><ToggleLeft className="size-4" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Inactive</p>
                <p className="text-xl font-black tabular-nums">{categories.filter((c) => c.status === "No").length}</p>
              </div>
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            ⚠ Failed to load categories. Please refresh and try again.
          </div>
        )}

        {/* ── Search ── */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-10 text-xs font-black uppercase tracking-widest text-muted-foreground">#</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Assigned Modules</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-56" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="rounded-2xl bg-muted p-5"><FolderOpen className="size-10 text-muted-foreground/50" /></div>
                      <p className="font-semibold text-foreground">{search ? "No categories match your search" : "No categories yet"}</p>
                      <p className="text-sm text-muted-foreground">{search ? "Try a different search term" : "Click 'New Category' to get started"}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((category, idx) => {
                  const isActive = category.status === "Yes";
                  const assignedModules = category.projectCategoriesMasterVendorMapping;
                  const isSubCategory = !!category.parent_id;

                  return (
                    <TableRow
                      key={category.id}
                      className={cn(
                        "group transition-colors hover:bg-primary/5",
                        idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                        isSubCategory && "border-l-2 border-l-indigo-500/30"
                      )}
                    >
                      <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isSubCategory && <GitBranch className="size-3 text-indigo-500/60 shrink-0" />}
                          <span className="font-semibold text-sm text-foreground">{category.category_name}</span>
                          {isSubCategory && (
                            <Badge variant="secondary" className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 px-2 py-0">
                              Sub
                            </Badge>
                          )}
                          {(category as any).external_category_id && (
                            <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 text-muted-foreground border-muted-foreground/30">
                              CadBid
                            </Badge>
                          )}
                        </div>
                        {category.parent && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 pl-5">
                            Under: <span className="font-medium text-foreground">{category.parent.category_name}</span>
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        {assignedModules.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">No modules assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedModules.map((m) => (
                              <Badge key={m.id} variant="secondary" className="text-[10px] font-semibold px-2 py-0.5">
                                {m.projectCategoriesTypeMaster.module_name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(category)} className="h-8 w-8 p-0" title="Edit">
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => handleToggle(category)}
                            disabled={toggleStatus.isPending}
                            className={cn("h-8 w-8 p-0", isActive ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-muted-foreground hover:text-foreground")}
                            title={isActive ? "Deactivate" : "Activate"}
                          >
                            {isActive ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <CategoryFormDialog open={dialogOpen} onClose={handleDialogClose} editData={editCategory} allCategories={categories} vendorId={vendorId ?? 0} userId={userId ?? 0} />
      </div>
    </>
  );
}
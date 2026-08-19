"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
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
import {
  FolderOpen,
  GitBranch,
  Plus,
  Trash2,
  List,
  ChevronDown,
  Check,
  Save,
} from "lucide-react";
import {
  useCreateProjectCategory,
  useProjectCategories,
  useProjectCategoryTypes,
  useUpdateProjectCategory,
} from "@/hooks/track-trace/useProjectCategories";
import { ProjectCategory } from "@/api/track-trace/project-categories.api";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

interface SubCategoryEntry {
  id?: number;
  name: string;
  status?: "Yes" | "No";
  type_ids: number[];
}

function CategoryFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdParam = searchParams.get("id");
  const editId = editIdParam ? Number(editIdParam) : null;

  const user = useAppSelector((state) => state.auth.user);
  const isScanPackEnabled = user?.vendor?.is_scanpack_enabled === true;
  const vendorId = user?.vendor_id;
  const userId = user?.id;

  const { data: allCategories = [], isLoading: categoriesLoading } =
    useProjectCategories(vendorId);
  const { data: types = [], isLoading: typesLoading } =
    useProjectCategoryTypes();

  const createMutation = useCreateProjectCategory(vendorId ?? 0);
  const updateMutation = useUpdateProjectCategory(vendorId ?? 0);

  // Form States
  const [categoryName, setCategoryName] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryEntry[]>([]);
  const [includeInPacking, setIncludeInPacking] = useState(false);
  const [scanPackValidate, setScanPackValidate] = useState(false);
  const [useInAssembledPacking, setUseInAssembledPacking] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | null>(
    null
  );

  const editData = useMemo(() => {
    if (!editId) return null;
    return allCategories.find((c) => c.id === editId) || null;
  }, [allCategories, editId]);

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

  // MultipleSelector module options
  const moduleOptions: Option[] = useMemo(() => {
    return types.map((t) => ({
      value: String(t.id),
      label: t.module_name,
    }));
  }, [types]);

  // Selected module options for MultipleSelector
  const selectedModuleOptions: Option[] = useMemo(() => {
    return selectedTypeIds.map((id) => {
      const found = types.find((t) => t.id === id);
      return {
        value: String(id),
        label: found?.module_name || `Module ${id}`,
      };
    });
  }, [selectedTypeIds, types]);

  useEffect(() => {
    if (editData) {
      setActiveCategory(editData);
      setCategoryName(editData.category_name);
      setIncludeInPacking(editData.include_in_packing ?? false);
      setScanPackValidate(editData.scan_pack_validate ?? false);
      setUseInAssembledPacking(editData.use_in_assembled_packing ?? false);
      setSelectedTypeIds(
        editData.projectCategoriesMasterVendorMapping.map(
          (m) => m.project_categories_type_master_id
        )
      );

      const existingSubs = allCategories
        .filter((c) => c.parent_id === editData.id)
        .map((c) => ({
          id: c.id,
          name: c.category_name,
          status: c.status,
          type_ids: c.projectCategoriesMasterVendorMapping.map(
            (m) => m.project_categories_type_master_id
          ),
        }));
      setSubCategories(existingSubs);
    }
  }, [editData, allCategories]);

  const handleCategorySelect = (val: number | string) => {
    const selected = allCategories.find((c) => c.id === Number(val));
    if (selected) {
      setActiveCategory(selected);
      setCategoryName(selected.category_name);
      setIncludeInPacking(selected.include_in_packing ?? false);
      setScanPackValidate(selected.scan_pack_validate ?? false);
      setUseInAssembledPacking(selected.use_in_assembled_packing ?? false);
      setSelectedTypeIds(
        selected.projectCategoriesMasterVendorMapping.map(
          (m) => m.project_categories_type_master_id
        )
      );
      const existingSubs = allCategories
        .filter((c) => c.parent_id === selected.id)
        .map((c) => ({
          id: c.id,
          name: c.category_name,
          status: c.status,
          type_ids: c.projectCategoriesMasterVendorMapping.map(
            (m) => m.project_categories_type_master_id
          ),
        }));
      setSubCategories(existingSubs);
    }
  };

  const addSubCategory = () => {
    setSubCategories((prev) => [
      ...prev,
      { name: "", type_ids: [], status: "Yes" },
    ]);
  };

  const removeSubCategory = (index: number) => {
    setSubCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSubCategoryName = (index: number, name: string) => {
    setSubCategories((prev) =>
      prev.map((s, i) => (i === index ? { ...s, name } : s))
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!categoryName.trim()) {
      setError("Category name is required");
      return;
    }

    for (let i = 0; i < subCategories.length; i++) {
      if (subCategories[i].status !== "No" && !subCategories[i].name.trim()) {
        setError(`Sub-category #${i + 1} name is required`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const isEditMode = isEdit;
      const targetCategory = editData || activeCategory;
      if (isEditMode && targetCategory && vendorId && userId) {
        await updateMutation.mutateAsync({
          id: targetCategory.id,
          vendor_id: vendorId,
          category_name: categoryName.trim(),
          status: targetCategory.status,
          type_ids: selectedTypeIds,
          created_by: userId,
          updated_by: userId,
          parent_id: targetCategory.parent_id,
          include_in_packing: includeInPacking,
          scan_pack_validate: scanPackValidate,
          use_in_assembled_packing: useInAssembledPacking,
        });

        const originalSubs = allCategories.filter(
          (c) => c.parent_id === targetCategory.id
        );

        for (const original of originalSubs) {
          const stillExists = subCategories.find((s) => s.id === original.id);
          if (
            (!stillExists || stillExists.status === "No") &&
            original.status === "Yes"
          ) {
            await updateMutation.mutateAsync({
              id: original.id,
              vendor_id: vendorId,
              category_name: original.category_name,
              status: "No",
              type_ids: [],
              created_by: userId,
              updated_by: userId,
              parent_id: targetCategory.id,
            });
          }
        }

        for (const sub of subCategories) {
          if (sub.id) {
            const original = originalSubs.find((c) => c.id === sub.id);
            if (
              original?.category_name !== sub.name.trim() ||
              original?.status !== sub.status
            ) {
              await updateMutation.mutateAsync({
                id: sub.id,
                vendor_id: vendorId,
                category_name: sub.name.trim(),
                status: sub.status || "Yes",
                type_ids: [],
                created_by: userId,
                updated_by: userId,
                parent_id: targetCategory.id,
              });
            }
          } else {
            if (sub.name.trim() && sub.status !== "No") {
              await createMutation.mutateAsync({
                vendor_id: vendorId,
                category_name: sub.name.trim(),
                parent_id: targetCategory.id,
                type_ids: [],
                created_by: userId,
              });
            }
          }
        }
      } else if (vendorId && userId) {
        const result = await createMutation.mutateAsync({
          vendor_id: vendorId,
          category_name: categoryName.trim(),
          type_ids: selectedTypeIds,
          created_by: userId,
          include_in_packing: includeInPacking,
          scan_pack_validate: scanPackValidate,
          use_in_assembled_packing: useInAssembledPacking,
        });

        const parentId =
          result?.data?.category?.id ??
          result?.data?.id ??
          result?.category?.id ??
          result?.id;

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

      router.push("/dashboard/track-trace/master/category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Header Bar ── */}
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
                <BreadcrumbLink href="/dashboard/track-trace/master/category">
                  Project Categories
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isEdit ? "Edit Category" : "New Category"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <div className="flex flex-col gap-6 p-6 w-full">
        {/* Clean Header Row */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">
              {isEdit ? "Edit Category" : "Create New Category"}
            </h1>
            {isEdit && (
              <Badge
                variant="secondary"
                className="text-xs font-semibold bg-primary/10 text-primary border-primary/20"
              >
                Edit Mode
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update category details, module assignments, and sub-categories"
              : "Define a new category, assign modules, and add sub-categories"}
          </p>
        </div>

        {/* ── Direct Form Inputs (No outer Card wrappers) ── */}
        <div className="flex flex-col gap-6">
          {/* Row 1: Category Name & Assign Modules (Side by side in 1 row) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left Col: Category Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="category_name" className="text-sm font-semibold">
                Category Name <span className="text-destructive">*</span>
              </Label>
              {isEdit ? (
                <Input
                  id="category_name"
                  placeholder="e.g. Hardware"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    if (error) setError("");
                  }}
                  className={cn(
                    "h-10 text-sm",
                    error && !error.startsWith("Sub") && "border-destructive ring-1 ring-destructive"
                  )}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    {isNewCategory ? (
                      <Input
                        id="category_name"
                        placeholder="Type new category name..."
                        value={categoryName}
                        onChange={(e) => {
                          setCategoryName(e.target.value);
                          if (error) setError("");
                        }}
                        className={cn(
                          "h-10 text-sm",
                          error && !error.startsWith("Sub") && "border-destructive ring-1 ring-destructive"
                        )}
                      />
                    ) : (
                      <Popover
                        open={popoverOpen}
                        onOpenChange={setPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={popoverOpen}
                            className={cn(
                              "w-full justify-between h-10 px-3 border border-input bg-background font-normal text-muted-foreground",
                              categoryName && "text-foreground font-medium",
                              error && !error.startsWith("Sub") && "border-destructive"
                            )}
                          >
                            {categoryName || "Select existing category or type new..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[var(--radix-popover-trigger-width)] p-0"
                          align="start"
                        >
                          <Command>
                            <CommandInput placeholder="Search category..." />
                            <CommandList>
                              <CommandEmpty>No category found.</CommandEmpty>
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
                                        categoryName === option.name
                                          ? "opacity-100"
                                          : "opacity-0"
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
                    className="h-10 w-10 shrink-0"
                    onClick={() => {
                      setIsNewCategory(!isNewCategory);
                      setActiveCategory(null);
                      setCategoryName("");
                      setIncludeInPacking(false);
                      setScanPackValidate(false);
                      setSelectedTypeIds([]);
                      setSubCategories([]);
                      if (error) setError("");
                    }}
                    title={
                      isNewCategory
                        ? "Select existing category"
                        : "Type new category name"
                    }
                  >
                    {isNewCategory ? (
                      <List className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </Button>
                </div>
              )}
              {error && !error.startsWith("Sub") && (
                <p className="text-xs text-destructive mt-1 font-medium">
                  {error}
                </p>
              )}
            </div>

            {/* Right Col: Assign Modules (MultipleSelector dropdown) */}
            {(!activeCategory || !activeCategory.parent_id) && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">
                    Assign Modules
                  </Label>
                  {selectedTypeIds.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold"
                    >
                      {selectedTypeIds.length} Selected
                    </Badge>
                  )}
                </div>
                {typesLoading ? (
                  <Skeleton className="h-10 w-full rounded-md" />
                ) : (
                  <MultipleSelector
                    value={selectedModuleOptions}
                    onChange={(options) => {
                      const ids = options.map((opt) => Number(opt.value));
                      setSelectedTypeIds(ids);
                    }}
                    options={moduleOptions}
                    placeholder="Select modules..."
                    emptyIndicator={
                      <p className="text-center text-xs text-muted-foreground py-2">
                        No modules found.
                      </p>
                    }
                    hidePlaceholderWhenSelected
                  />
                )}
              </div>
            )}
          </div>

          {/* Row 2: Packing & Scan Validation Options */}
          {isScanPackEnabled && (!activeCategory || !activeCategory.parent_id) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all hover:border-primary/50",
                  includeInPacking
                    ? "bg-amber-500/5 border-amber-500/50 ring-1 ring-amber-500/20"
                    : "bg-card hover:bg-muted/40"
                )}
              >
                <Checkbox
                  checked={includeInPacking}
                  onCheckedChange={(checked) => {
                    const val = !!checked;
                    setIncludeInPacking(val);
                    if (!val && scanPackValidate) {
                      setScanPackValidate(false);
                    }
                  }}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      Include in Packing
                    </span>
                    {scanPackValidate && (
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Required
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Check if any item under this category is applicable for packing
                  </span>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all hover:border-primary/50",
                  scanPackValidate
                    ? "bg-blue-500/5 border-blue-500/50 ring-1 ring-blue-500/20"
                    : "bg-card hover:bg-muted/40"
                )}
              >
                <Checkbox
                  checked={scanPackValidate}
                  onCheckedChange={(checked) => {
                    const val = !!checked;
                    setScanPackValidate(val);
                    if (val) {
                      setIncludeInPacking(true);
                    }
                  }}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    Scan & Pack Validate
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Check if items under this category must be scanned before packing
                  </span>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all hover:border-primary/50",
                  useInAssembledPacking
                    ? "bg-purple-500/5 border-purple-500/50 ring-1 ring-purple-500/20"
                    : "bg-card hover:bg-muted/40"
                )}
              >
                <Checkbox
                  checked={useInAssembledPacking}
                  onCheckedChange={(checked) => setUseInAssembledPacking(!!checked)}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    Use in Assembled Packing
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Check if items under this category are used in assembled packing
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Row 3: Sub Categories */}
          {(!activeCategory || !activeCategory.parent_id) && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Sub Categories
                  </Label>
                  {subCategories.filter((s) => s.status !== "No").length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    >
                      {subCategories.filter((s) => s.status !== "No").length}
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubCategory}
                  className="gap-1.5 h-8 text-xs font-semibold"
                >
                  <Plus className="size-3.5" /> Add Sub Category
                </Button>
              </div>

              {subCategories.filter((s) => s.status !== "No").length === 0 ? (
                <div
                  onClick={addSubCategory}
                  className="rounded-xl border border-dashed border-muted-foreground/30 p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                    <GitBranch className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    No sub-categories added yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click{" "}
                    <span className="font-semibold text-primary">
                      Add Sub Category
                    </span>{" "}
                    to define sub-items under this category
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {subCategories.map((sub, index) => {
                    if (sub.status === "No") return null;
                    const hasError =
                      error.startsWith("Sub") &&
                      !sub.name.trim() &&
                      index === Number(error.match(/\d+/)?.[0] ?? -1) - 1;

                    return (
                      <div
                        key={index}
                        className="rounded-xl border bg-muted/20 p-4 flex flex-col gap-3 transition-all hover:bg-muted/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            Sub Category {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (sub.id) {
                                setSubCategories((prev) =>
                                  prev.map((s, i) =>
                                    i === index ? { ...s, status: "No" } : s
                                  )
                                );
                              } else {
                                removeSubCategory(index);
                              }
                            }}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md"
                            title="Remove sub-category"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <Input
                            placeholder="Sub-category name..."
                            value={sub.name}
                            onChange={(e) =>
                              updateSubCategoryName(index, e.target.value)
                            }
                            className={cn(
                              "h-9 text-xs bg-background",
                              hasError && "border-destructive ring-1 ring-destructive"
                            )}
                          />
                          {hasError && (
                            <p className="text-xs text-destructive font-medium">
                              Sub-category name is required
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/track-trace/master/category")}
              disabled={isPending || isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || isSubmitting}
              className="gap-2 px-6"
            >

              <Save className="size-4" />
              {isPending || isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Save Category"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CreateCategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <CategoryFormContent />
    </Suspense>
  );
}

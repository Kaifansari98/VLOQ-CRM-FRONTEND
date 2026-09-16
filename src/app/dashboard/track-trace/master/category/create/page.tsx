"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  GripVertical,
  SlidersHorizontal,
  Copy,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";
import {
  useCreateProjectCategory,
  useProjectCategories,
  useProjectCategoryTypes,
  useUpdateProjectCategory,
} from "@/hooks/track-trace/useProjectCategories";
import { ProjectCategory } from "@/api/track-trace/project-categories.api";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const STRUCTURE_ATTRIBUTES = [
  { key: "article_code", label: "Item Code", sample: "TAPE001" },
  { key: "barcode", label: "Barcode", sample: "890123456" },
  { key: "brand_short_name", label: "Brand Short Name", sample: "E3" },
  { key: "brand_name", label: "Brand Full Name", sample: "Euro Edge" },
  { key: "core_product", label: "Core Product", sample: "EB_TAPE" },
  { key: "type", label: "Type", sample: "PVC" },
  { key: "finish", label: "Finish", sample: "MATT" },
  { key: "p_code", label: "Product Code", sample: "1000SR" },
  { key: "color_name", label: "Color Name", sample: "WHITE" },
  { key: "grade", label: "Grade", sample: "PREMIUM" },
  { key: "thickness", label: "Thickness", sample: "0.8" },
  { key: "size", label: "Size", sample: "22X0.8" },
  { key: "length", label: "Length", sample: "50M" },
  { key: "height", label: "Height", sample: "2400" },
  { key: "hsn_code", label: "HSN Code", sample: "39269099" },
  { key: "unit", label: "Primary Unit", sample: "ROLL" },
];

const DEFAULT_STRUCTURE_FIELDS = [
  "article_code",
  "brand_short_name",
  "core_product",
  "finish",
  "p_code",
  "thickness",
];

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

  const { data: categoryData, isLoading: categoriesLoading } =
    useProjectCategories(vendorId);
  const allCategories: ProjectCategory[] = categoryData?.categories ?? [];
  const { data: types = [], isLoading: typesLoading } =
    useProjectCategoryTypes();

  const createMutation = useCreateProjectCategory(vendorId ?? 0);
  const updateMutation = useUpdateProjectCategory(vendorId ?? 0);

  // Form States
  const [categoryName, setCategoryName] = useState("");
  const [prefix, setPrefix] = useState("");
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
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "article_code",
    "brand_short_name",
    "core_product",
    "finish",
    "p_code",
    "thickness",
  ]);
  const [delimiter, setDelimiter] = useState<string>("_");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    const sourceIndex = sourceIndexStr !== "" ? Number(sourceIndexStr) : draggedIndex;
    if (sourceIndex === null || sourceIndex === undefined || sourceIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }
    const updated = [...selectedFields];
    const [movedItem] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, movedItem);
    setSelectedFields(updated);
    setDraggedIndex(null);
  };

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
      setPrefix(editData.prefix ?? "");
      setIncludeInPacking(editData.include_in_packing ?? false);
      setScanPackValidate(editData.scan_pack_validate ?? false);
      setUseInAssembledPacking(editData.use_in_assembled_packing ?? false);
      setSelectedTypeIds(
        editData.projectCategoriesMasterVendorMapping.map(
          (m) => m.project_categories_type_master_id
        )
      );

      if (editData.namingStructure?.fields_json && Array.isArray(editData.namingStructure.fields_json)) {
        setSelectedFields(editData.namingStructure.fields_json);
        if (editData.namingStructure.delimiter) {
          setDelimiter(editData.namingStructure.delimiter);
        }
      }

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
      setPrefix(selected.prefix ?? "");
      setIncludeInPacking(selected.include_in_packing ?? false);
      setScanPackValidate(selected.scan_pack_validate ?? false);
      setUseInAssembledPacking(selected.use_in_assembled_packing ?? false);
      setSelectedTypeIds(
        selected.projectCategoriesMasterVendorMapping.map(
          (m) => m.project_categories_type_master_id
        )
      );
      if (selected.namingStructure?.fields_json && Array.isArray(selected.namingStructure.fields_json)) {
        setSelectedFields(selected.namingStructure.fields_json);
        if (selected.namingStructure.delimiter) {
          setDelimiter(selected.namingStructure.delimiter);
        }
      }
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
        const categoryNameUnchanged = categoryName.trim() === targetCategory.category_name;
        const prefixUnchanged = (prefix ? prefix.trim().toUpperCase() : null) === (targetCategory.prefix ?? null);
        const includeInPackingUnchanged = includeInPacking === (targetCategory.include_in_packing ?? false);
        const scanPackValidateUnchanged = scanPackValidate === (targetCategory.scan_pack_validate ?? false);
        const useInAssembledPackingUnchanged = useInAssembledPacking === (targetCategory.use_in_assembled_packing ?? false);

        const originalTypeIds = targetCategory.projectCategoriesMasterVendorMapping.map(
          (m: any) => m.project_categories_type_master_id
        );
        const typeIdsUnchanged =
          selectedTypeIds.length === originalTypeIds.length &&
          selectedTypeIds.every((id) => originalTypeIds.includes(id));

        const originalSubs = allCategories.filter((c) => c.parent_id === targetCategory.id);
        const subCategoriesUnchanged =
          subCategories.length === originalSubs.length &&
          subCategories.every((sub) => {
            if (!sub.id) return false;
            const orig = originalSubs.find((o) => o.id === sub.id);
            return orig && orig.category_name === sub.name.trim() && orig.status === sub.status;
          });

        const origFields = targetCategory.namingStructure?.fields_json || [];
        const origDelimiter = targetCategory.namingStructure?.delimiter || "_";
        const structureChanged =
          delimiter !== origDelimiter ||
          selectedFields.length !== origFields.length ||
          selectedFields.some((f, idx) => f !== origFields[idx]);

        const onlyStructureUpdated =
          categoryNameUnchanged &&
          prefixUnchanged &&
          includeInPackingUnchanged &&
          scanPackValidateUnchanged &&
          useInAssembledPackingUnchanged &&
          typeIdsUnchanged &&
          subCategoriesUnchanged &&
          structureChanged;

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
          prefix: prefix ? prefix.trim().toUpperCase() : null,
          naming_structure: selectedFields.length > 0 ? {
            delimiter,
            fields: selectedFields,
          } : null,
          only_naming_structure_updated: onlyStructureUpdated,
        });



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
          parent_id: null,
          include_in_packing: includeInPacking,
          scan_pack_validate: scanPackValidate,
          use_in_assembled_packing: useInAssembledPacking,
          prefix: prefix ? prefix.trim().toUpperCase() : null,
          naming_structure: selectedFields.length > 0 ? {
            delimiter,
            fields: selectedFields,
          } : null,
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

      await new Promise((resolve) => setTimeout(resolve, 1200));
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
          {/* Row 1: Category Name, Prefix, & Assign Modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
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
                      setPrefix("");
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

            {/* Middle Col: Prefix */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="prefix" className="text-sm font-semibold">
                Prefix / Item Code Group <span className="text-muted-foreground">(e.g. PNT)</span>
              </Label>
              <Input
                id="prefix"
                placeholder="Auto-derived if empty"
                maxLength={5}
                value={prefix}
                onChange={(e) => {
                  setPrefix(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""));
                }}
                className="h-10 text-sm"
              />
            </div>

            {/* Right Col: Assign Modules (MultipleSelector dropdown) */}
            {(!editData?.parent_id) && (
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

          {/* Product Name Structure Builder */}
          {!editData?.parent_id && (
            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
              {/* Header with Icon, Title, and Delimiter Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
                    <SlidersHorizontal className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground tracking-tight">
                      Product Name Structure (Material Code Format)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select and sequence attributes to auto-compose standard item material codes (e.g. TAPE001_E3_EB_TAPE_MATT_1000SR_0.8).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Delimiter:
                  </Label>
                  <Select
                    value={delimiter}
                    onValueChange={(val) => setDelimiter(val)}
                  >
                    <SelectTrigger className="h-8 text-xs w-40 bg-background">
                      <SelectValue placeholder="Select Delimiter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_">Underscore ( _ )</SelectItem>
                      <SelectItem value="-">Hyphen ( - )</SelectItem>
                      <SelectItem value="/">Slash ( / )</SelectItem>
                      <SelectItem value=".">Dot ( . )</SelectItem>
                      <SelectItem value=" ">Space ( &nbsp; )</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Live Format Preview
                    </span>
                  </div>
                  {selectedFields.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selectedFields.map((fieldKey, idx) => {
                        const attr = STRUCTURE_ATTRIBUTES.find(
                          (a) => a.key === fieldKey
                        );
                        const sample = attr?.sample || fieldKey.toUpperCase();
                        return (
                          <React.Fragment key={fieldKey}>
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-background border border-border/80 text-foreground shadow-2xs">
                              {sample}
                            </span>
                            {idx < selectedFields.length - 1 && (
                              <span className="font-mono text-xs font-extrabold text-primary px-0.5">
                                {delimiter === " " ? "␣" : delimiter}
                              </span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      No attributes selected yet. Click attributes below to construct material code.
                    </span>
                  )}
                </div>

                {selectedFields.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const sampleStr = selectedFields
                        .map((k) => {
                          const found = STRUCTURE_ATTRIBUTES.find(
                            (a) => a.key === k
                          );
                          return found?.sample || k.toUpperCase();
                        })
                        .join(delimiter);
                      navigator.clipboard?.writeText(sampleStr);
                      toastManager.add({
                        title: "Copied sample material code to clipboard",
                        type: "success",
                      });
                    }}
                    className="h-7.5 px-2.5 text-xs gap-1.5 shrink-0 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  >
                    <Copy className="size-3.5" />
                    <span>Copy Sample</span>
                  </Button>
                )}
              </div>

              {/* Toggle Attributes Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Toggle Attributes
                  </Label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFields(STRUCTURE_ATTRIBUTES.map((a) => a.key))
                      }
                      className="text-[11px] text-muted-foreground hover:text-primary font-medium transition-colors"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground/40">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFields([...DEFAULT_STRUCTURE_FIELDS])
                      }
                      className="text-[11px] text-muted-foreground hover:text-primary font-medium transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="size-3" />
                      Reset Defaults
                    </button>
                    <span className="text-muted-foreground/40">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFields([])}
                      className="text-[11px] text-muted-foreground hover:text-destructive font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {STRUCTURE_ATTRIBUTES.map((attr) => {
                    const isSelected = selectedFields.includes(attr.key);
                    return (
                      <button
                        key={attr.key}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedFields(
                              selectedFields.filter((f) => f !== attr.key)
                            );
                          } else {
                            setSelectedFields([...selectedFields, attr.key]);
                          }
                        }}
                        className={cn(
                          "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer select-none",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs hover:bg-primary/90"
                            : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground hover:border-border"
                        )}
                      >
                        {isSelected ? (
                          <Check className="size-3.5 stroke-[2.5]" />
                        ) : (
                          <Plus className="size-3.5 opacity-60 group-hover:opacity-100" />
                        )}
                        <span>{attr.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Sequence Order Bar */}
              {selectedFields.length > 0 && (
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="size-3.5 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Active Field Sequence
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground italic">
                      Drag chips or use arrows to rearrange sequence order
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {selectedFields.map((fieldKey, idx) => {
                      const label =
                        STRUCTURE_ATTRIBUTES.find((a) => a.key === fieldKey)
                          ?.label || fieldKey;

                      return (
                        <React.Fragment key={fieldKey}>
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={() => setDraggedIndex(null)}
                            className={cn(
                              "flex items-center gap-1.5 bg-background border border-border/80 rounded-lg pl-2 pr-1.5 py-1 text-xs font-semibold shadow-2xs transition-all select-none hover:border-primary/50 group",
                              draggedIndex === idx &&
                                "opacity-40 border-dashed border-primary scale-95"
                            )}
                          >
                            <span className="size-4 rounded-full bg-muted text-muted-foreground font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <GripVertical className="size-3 text-muted-foreground/60 cursor-grab active:cursor-grabbing shrink-0" />
                            <span className="text-foreground">{label}</span>

                            <div className="flex items-center gap-0.5 ml-1 text-muted-foreground">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  title="Move Left"
                                  className="p-0.5 rounded hover:bg-muted hover:text-primary transition-colors"
                                  onClick={() => {
                                    const arr = [...selectedFields];
                                    const temp = arr[idx - 1];
                                    arr[idx - 1] = arr[idx];
                                    arr[idx] = temp;
                                    setSelectedFields(arr);
                                  }}
                                >
                                  <ChevronLeft className="size-3.5" />
                                </button>
                              )}
                              {idx < selectedFields.length - 1 && (
                                <button
                                  type="button"
                                  title="Move Right"
                                  className="p-0.5 rounded hover:bg-muted hover:text-primary transition-colors"
                                  onClick={() => {
                                    const arr = [...selectedFields];
                                    const temp = arr[idx + 1];
                                    arr[idx + 1] = arr[idx];
                                    arr[idx] = temp;
                                    setSelectedFields(arr);
                                  }}
                                >
                                  <ChevronRight className="size-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                title="Remove Attribute"
                                className="p-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground/70 transition-colors ml-0.5"
                                onClick={() => {
                                  setSelectedFields(
                                    selectedFields.filter((f) => f !== fieldKey)
                                  );
                                }}
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          {idx < selectedFields.length - 1 && (
                            <div className="size-5 rounded-full bg-muted/60 border border-border/80 flex items-center justify-center text-[10px] font-mono font-bold text-muted-foreground shrink-0">
                              {delimiter === " " ? "␣" : delimiter}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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

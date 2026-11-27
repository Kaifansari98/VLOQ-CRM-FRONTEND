"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import SmoothTab from "@/components/kokonutui/smooth-tab";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClearInput from "@/components/origin-input";
import { DataTable } from "@/components/data-table/data-table";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSaveBoqMaster, useDeleteBoqMaster, type BoqMasterKind } from "@/hooks/useSaveBoqMaster";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useProductItemCodes,
  useProductSubStructures,
  useProductStructureTypes,
  useProductTypes,
  useUpdateProductTypeStatus,
  useUpdateProductStructureStatus,
  useUpdateProductSubStructureStatus,
  useUpdateProductItemCodeStatus,
} from "@/hooks/useTypesMaster";
import { useAppSelector } from "@/redux/store";

type MasterRow = {
  srNo: number;
  id: number;
  name: string;
  parent?: string | null;
  subStructureId?: number;
  description?: string | null;
  specification?: string | null;
  status: string;
  _parentIsActive?: boolean;
};

function DeleteConfirmDialog({
  item,
  onClose,
  onConfirm,
  isPending,
}: {
  item: { name: string; label: string } | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
}) {
  return (
    <AlertDialog open={item !== null} onOpenChange={(open) => { if (!open && !isPending) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {item?.label}?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{item?.name}&rdquo;? This will remove it from active listings and options without affecting existing records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MasterListingTable({
  title,
  description,
  searchPlaceholder,
  actionLabel,
  rows,
  showParent = false,
  showDescription = false,
  showSpecification = false,
  isLoading,
  isError,
  errorMessage,
  onAction,
  onEdit,
  onDelete,
  onToggleStatus,
  isTogglingStatus = false,
  togglingId = null,
}: {
  title: string;
  description: string;
  searchPlaceholder: string;
  actionLabel: string;
  rows: MasterRow[];
  showParent?: boolean;
  showDescription?: boolean;
  showSpecification?: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onAction?: () => void;
  onEdit: (row: MasterRow) => void;
  onDelete?: (row: MasterRow) => void;
  onToggleStatus?: (row: MasterRow, nextChecked: boolean) => void;
  isTogglingStatus?: boolean;
  togglingId?: number | null;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const columns = React.useMemo<ColumnDef<MasterRow>[]>(
    () => [
      {
        accessorKey: "srNo",
        header: "Sr. No.",
        cell: ({ row }) => row.original.srNo,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
      },
      ...(showParent
        ? [
            {
              accessorKey: "parent",
              header: "Parent",
              cell: ({ row }: { row: { original: MasterRow } }) =>
                row.original.parent || "—",
            } satisfies ColumnDef<MasterRow>,
          ]
        : []),
      ...(showDescription
        ? [
            {
              accessorKey: "description",
              header: "Description",
              cell: ({ row }: { row: { original: MasterRow } }) =>
                row.original.description || "—",
            } satisfies ColumnDef<MasterRow>,
          ]
        : []),
      ...(showSpecification
        ? [
            {
              accessorKey: "specification",
              header: "Specification",
              cell: ({ row }: { row: { original: MasterRow } }) =>
                row.original.specification || "—",
            } satisfies ColumnDef<MasterRow>,
          ]
        : []),
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = (row.original.status || "active").toLowerCase();
          const isActive = status === "active";
          const isRowToggling = isTogglingStatus && togglingId === row.original.id;

          return (
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-colors",
                  isActive
                    ? "border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-800/40 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    isActive ? "bg-emerald-500" : "bg-zinc-400",
                  )}
                />
                {status}
              </span>
              {onToggleStatus && (
                <Switch
                  checked={isActive}
                  disabled={isRowToggling || row.original._parentIsActive === false}
                  onCheckedChange={(checked) => onToggleStatus(row.original, checked)}
                  className={cn(
                    "transition-colors",
                    row.original._parentIsActive === false
                      ? "opacity-40 cursor-not-allowed"
                      : "",
                    isActive
                      ? "bg-emerald-600 hover:bg-emerald-600"
                      : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400",
                  )}
                  aria-label={`Toggle status for ${row.original.name}`}
                />
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Edit entry"
              title="Edit entry"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(row.original);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete entry"
                title="Delete entry"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(row.original);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [showDescription, showParent, showSpecification, onEdit, onDelete, onToggleStatus, isTogglingStatus, togglingId],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      const search = String(value ?? "").trim().toLowerCase();
      if (!search) return true;
      return String(row.getValue(columnId) ?? "")
        .toLowerCase()
        .includes(search);
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Button type="button" className="sm:self-start gap-2" onClick={onAction}>
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-10 text-sm text-muted-foreground">
            Loading {title.toLowerCase()}...
          </div>
        ) : isError ? (
          <div className="py-10 text-sm text-red-500">
            {errorMessage || `Failed to load ${title.toLowerCase()}.`}
          </div>
        ) : (
          <DataTable table={table} className="px-0 pt-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <ClearInput
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full md:w-72"
              />
            </div>
          </DataTable>
        )}
      </CardContent>
    </Card>
  );
}

export default function BoqItemsMasterPage() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const createProductItemCodeMutation = useSaveBoqMaster("product-item-code", editingId);
  const createProductTypeMutation = useSaveBoqMaster("product-type", editingId);
  const createProductStructureMutation = useSaveBoqMaster("product-structure", editingId);
  const createProductSubStructureMutation = useSaveBoqMaster("product-sub-structure", editingId);

  const updateProductTypeStatusMutation = useUpdateProductTypeStatus();
  const updateProductStructureStatusMutation = useUpdateProductStructureStatus();
  const updateProductSubStructureStatusMutation = useUpdateProductSubStructureStatus();
  const updateProductItemCodeStatusMutation = useUpdateProductItemCodeStatus();

  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: number;
    name: string;
    kind: BoqMasterKind;
    label: string;
  } | null>(null);
  const deleteProductItemCodeMutation = useDeleteBoqMaster("product-item-code");
  const deleteProductSubStructureMutation = useDeleteBoqMaster("product-sub-structure");
  const deleteProductStructureMutation = useDeleteBoqMaster("product-structure");
  const deleteProductTypeMutation = useDeleteBoqMaster("product-type");

  const getDeleteMutation = (kind?: BoqMasterKind) => {
    switch (kind) {
      case "product-item-code":
        return deleteProductItemCodeMutation;
      case "product-sub-structure":
        return deleteProductSubStructureMutation;
      case "product-structure":
        return deleteProductStructureMutation;
      case "product-type":
        return deleteProductTypeMutation;
      default:
        return null;
    }
  };

  const activeDeleteMutation = getDeleteMutation(deleteTarget?.kind);
  const isDeleting = activeDeleteMutation?.isPending ?? false;

  const handleDeleteConfirm = () => {
    if (!deleteTarget || !activeDeleteMutation) return;
    activeDeleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };


  const [togglingItemGroupId, setTogglingItemGroupId] = React.useState<number | null>(null);
  const [togglingItemCategoryId, setTogglingItemCategoryId] = React.useState<number | null>(null);
  const [togglingSubItemCategoryId, setTogglingSubItemCategoryId] = React.useState<number | null>(null);
  const [togglingItemCodeId, setTogglingItemCodeId] = React.useState<number | null>(null);

  const {
    data: productItemCodes,
    isLoading: isProductItemCodesLoading,
    isError: isProductItemCodesError,
    error: productItemCodesError,
  } = useProductItemCodes();
  const {
    data: productTypes,
    isLoading: isProductTypesLoading,
    isError: isProductTypesError,
    error: productTypesError,
  } = useProductTypes();
  const {
    data: productStructures,
    isLoading: isProductStructuresLoading,
    isError: isProductStructuresError,
    error: productStructuresError,
  } = useProductStructureTypes();
  const {
    data: productSubStructures,
    isLoading: isProductSubStructuresLoading,
    isError: isProductSubStructuresError,
    error: productSubStructuresError,
  } = useProductSubStructures();

  // 1. Item Group Rows (All Item Groups are displayed)
  const productTypeRows = React.useMemo<MasterRow[]>(
    () =>
      (productTypes?.data ?? []).map((item: any, index: number) => ({
        srNo: index + 1,
        id: item.id,
        name: item.type,
        parent: item.parent ?? null,
        status: item.status ?? "active",
      })),
    [productTypes?.data],
  );

  // Set of Active Item Group IDs
  const activeProductTypeIds = React.useMemo(() => {
    return new Set(
      (productTypes?.data ?? [])
        .filter((item: any) => (item.status ?? "active").toLowerCase() === "active")
        .map((item: any) => item.id),
    );
  }, [productTypes?.data]);

  // 2. Item Category Rows: ALL shown, but effective status is "inactive" if parent Item Group is inactive
  const productStructureRows = React.useMemo<MasterRow[]>(
    () =>
      (productStructures?.data ?? []).map((item: any, index: number) => {
        const parentTypeId = item.product_type_id ?? item.productType?.id;
        const parentIsActive =
          parentTypeId === undefined || parentTypeId === null
            ? true
            : activeProductTypeIds.has(parentTypeId);
        const selfStatus = (item.status ?? "active").toLowerCase();
        const effectiveStatus = parentIsActive ? selfStatus : "inactive";
        return {
          srNo: index + 1,
          id: item.id,
          name: item.type,
          parent: item.productType?.type ?? item.parent ?? null,
          status: effectiveStatus,
          // Store whether the parent is active so we can disable the toggle
          _parentIsActive: parentIsActive,
        } as MasterRow & { _parentIsActive: boolean };
      }),
    [productStructures?.data, activeProductTypeIds],
  );

  // Set of Active Item Category IDs (self is active AND parent Item Group is active)
  const activeProductStructureIds = React.useMemo(() => {
    return new Set(
      (productStructures?.data ?? [])
        .filter((item: any) => {
          const parentTypeId = item.product_type_id ?? item.productType?.id;
          const parentIsActive =
            parentTypeId === undefined || parentTypeId === null
              ? true
              : activeProductTypeIds.has(parentTypeId);
          return parentIsActive && (item.status ?? "active").toLowerCase() === "active";
        })
        .map((item: any) => item.id),
    );
  }, [productStructures?.data, activeProductTypeIds]);

  // 3. Sub-Item Category Rows: ALL shown, but effective status is "inactive" if any ancestor is inactive
  const productSubStructureRows = React.useMemo<MasterRow[]>(
    () =>
      (productSubStructures?.data ?? []).map((item: any, index: number) => {
        const parentStructureId =
          item.product_structure_id ?? item.productStructure?.id;
        const parentIsActive =
          parentStructureId === undefined || parentStructureId === null
            ? true
            : activeProductStructureIds.has(parentStructureId);
        const selfStatus = (item.status ?? "active").toLowerCase();
        const effectiveStatus = parentIsActive ? selfStatus : "inactive";
        return {
          srNo: index + 1,
          id: item.id,
          name: item.type,
          parent: item.productStructure?.type ?? null,
          status: effectiveStatus,
          _parentIsActive: parentIsActive,
        } as MasterRow & { _parentIsActive: boolean };
      }),
    [productSubStructures?.data, activeProductStructureIds],
  );

  // Set of Active Sub-Item Category IDs (self is active AND ancestors are active)
  const activeProductSubStructureIds = React.useMemo(() => {
    return new Set(
      (productSubStructures?.data ?? [])
        .filter((item: any) => {
          const parentStructureId =
            item.product_structure_id ?? item.productStructure?.id;
          const parentIsActive =
            parentStructureId === undefined || parentStructureId === null
              ? true
              : activeProductStructureIds.has(parentStructureId);
          return parentIsActive && (item.status ?? "active").toLowerCase() === "active";
        })
        .map((item: any) => item.id),
    );
  }, [productSubStructures?.data, activeProductStructureIds]);

  // 4. Item Code Rows: ALL shown, but effective status is "inactive" if any ancestor is inactive
  const productItemCodeRows = React.useMemo<MasterRow[]>(
    () =>
      (productItemCodes?.data ?? []).map((item: any, index: number) => {
        const subStructureId =
          item.sub_product_structure_id ?? item.subProductStructure?.id;
        const structureId =
          item.product_structure_id ?? item.productStructure?.id;
        let parentIsActive = true;
        if (subStructureId !== undefined && subStructureId !== null) {
          parentIsActive = activeProductSubStructureIds.has(subStructureId);
        } else if (structureId !== undefined && structureId !== null) {
          parentIsActive = activeProductStructureIds.has(structureId);
        }
        const selfStatus = (item.status ?? "active").toLowerCase();
        const effectiveStatus = parentIsActive ? selfStatus : "inactive";
        return {
          srNo: index + 1,
          id: item.id,
          name: item.item_code,
          subStructureId,
          parent: item.subProductStructure?.type ?? null,
          description: item.description ?? null,
          specification: item.specification ?? null,
          status: effectiveStatus,
          _parentIsActive: parentIsActive,
        } as MasterRow & { _parentIsActive: boolean };
      }),
    [productItemCodes?.data, activeProductSubStructureIds, activeProductStructureIds],
  );

  // Toggle Status Handlers
  const handleToggleItemGroupStatus = (row: MasterRow, checked: boolean) => {
    setTogglingItemGroupId(row.id);
    updateProductTypeStatusMutation.mutate(
      { id: row.id, status: checked ? "active" : "inactive" },
      {
        onSettled: () => setTogglingItemGroupId(null),
      },
    );
  };

  const handleToggleItemCategoryStatus = (row: MasterRow, checked: boolean) => {
    setTogglingItemCategoryId(row.id);
    updateProductStructureStatusMutation.mutate(
      { id: row.id, status: checked ? "active" : "inactive" },
      {
        onSettled: () => setTogglingItemCategoryId(null),
      },
    );
  };

  const handleToggleSubItemCategoryStatus = (row: MasterRow, checked: boolean) => {
    setTogglingSubItemCategoryId(row.id);
    updateProductSubStructureStatusMutation.mutate(
      { id: row.id, status: checked ? "active" : "inactive" },
      {
        onSettled: () => setTogglingSubItemCategoryId(null),
      },
    );
  };

  const handleToggleItemCodeStatus = (row: MasterRow, checked: boolean) => {
    setTogglingItemCodeId(row.id);
    updateProductItemCodeStatusMutation.mutate(
      { id: row.id, status: checked ? "active" : "inactive" },
      {
        onSettled: () => setTogglingItemCodeId(null),
      },
    );
  };
  const [openCreateItemGroupModal, setOpenCreateItemGroupModal] =
    React.useState(false);
  const [openCreateItemCodeModal, setOpenCreateItemCodeModal] =
    React.useState(false);
  const [openCreateItemCategoryModal, setOpenCreateItemCategoryModal] =
    React.useState(false);
  const [openCreateSubItemCategoryModal, setOpenCreateSubItemCategoryModal] =
    React.useState(false);
  const [itemGroupTypeValue, setItemGroupTypeValue] = React.useState("");
  const isSavingItemCode = createProductItemCodeMutation.isPending;
  const [itemCodeValue, setItemCodeValue] = React.useState("");
  const [itemCodeSubStructureId, setItemCodeSubStructureId] = React.useState("");
  const [itemCodeDescription, setItemCodeDescription] = React.useState("");
  const [itemCodeSpecification, setItemCodeSpecification] = React.useState("");
  const [itemCategoryName, setItemCategoryName] = React.useState("");
  const [itemCategoryProductTypeId, setItemCategoryProductTypeId] =
    React.useState("");
  const [subItemCategoryName, setSubItemCategoryName] = React.useState("");
  const [subItemCategoryProductStructureId, setSubItemCategoryProductStructureId] =
    React.useState("");

  const handleCreateItemGroup = () => {
    const type = itemGroupTypeValue.trim();

    if (!type || !vendorId) return;

    createProductTypeMutation.mutate(
      {
        vendor_id: vendorId,
        type,
      },
      {
        onSuccess: () => {
          setOpenCreateItemGroupModal(false);
          setItemGroupTypeValue("");
        },
      },
    );
  };

  const resetItemCodeForm = () => {
    setItemCodeValue("");
    setItemCodeSubStructureId("");
    setItemCodeDescription("");
    setItemCodeSpecification("");
  };

  const handleItemCodeModalChange = (open: boolean) => {
    if (isSavingItemCode) return;
    setOpenCreateItemCodeModal(open);
    if (!open) resetItemCodeForm();
  };

  const handleSaveItemCode = () => {
    if (isSavingItemCode) return;
    const itemCode = itemCodeValue.trim();
    const description = itemCodeDescription.trim();
    const specification = itemCodeSpecification.trim();
    const subStructureId = Number(itemCodeSubStructureId);
    const selectedSubStructure = (productSubStructures?.data ?? []).find(
      (item: any) => item.id === subStructureId,
    );
    const productStructureId = Number(
      selectedSubStructure?.product_structure_id ?? 0,
    );

    if (
      !itemCode ||
      !vendorId ||
      !subStructureId ||
      !productStructureId
    ) {
      return;
    }

    const payload = {
      vendor_id: vendorId,
      item_code: itemCode,
      product_structure_id: productStructureId,
      sub_product_structure_id: subStructureId,
      description,
      specification,
    };
    const options = {
      onSuccess: () => {
        setOpenCreateItemCodeModal(false);
        resetItemCodeForm();
      },
    };

    createProductItemCodeMutation.mutate(payload, options);
  };

  const handleCreateItemCategory = () => {
    const type = itemCategoryName.trim();
    const productTypeId = Number(itemCategoryProductTypeId);

    if (!type || !vendorId || !productTypeId) return;

    createProductStructureMutation.mutate(
      {
        vendor_id: vendorId,
        type,
        product_type_id: productTypeId,
      },
      {
        onSuccess: () => {
          setOpenCreateItemCategoryModal(false);
          setItemCategoryName("");
          setItemCategoryProductTypeId("");
        },
      },
    );
  };

  const handleCreateSubItemCategory = () => {
    const type = subItemCategoryName.trim();
    const productStructureId = Number(subItemCategoryProductStructureId);

    if (!type || !vendorId || !productStructureId) return;

    createProductSubStructureMutation.mutate(
      {
        vendor_id: vendorId,
        type,
        product_structure_id: productStructureId,
      },
      {
        onSuccess: () => {
          setOpenCreateSubItemCategoryModal(false);
          setSubItemCategoryName("");
          setSubItemCategoryProductStructureId("");
        },
      },
    );
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
                <BreadcrumbPage>Masters Management</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>BOQ Master</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            BOQ Master
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage bill of quantity reference masters for large-scale project
            leads from one place.
          </p>
        </div>

        <SmoothTab
          defaultTabId="item-code"
          items={[
            {
              id: "item-code",
              title: "Item Code",
              color: "bg-black hover:bg-black",
              cardContent: (
                <MasterListingTable
                  title="Item Code"
                  description="Product item code master entries for the current vendor."
                  searchPlaceholder="Search item code..."
                  actionLabel="Add Item Code"
                  rows={productItemCodeRows}
                  showParent
                  showDescription
                  showSpecification
                  isLoading={isProductItemCodesLoading}
                  isError={isProductItemCodesError}
                  errorMessage={
                    (productItemCodesError as any)?.response?.data?.error
                  }
                  onAction={() => {
                    setEditingId(null);
                    resetItemCodeForm();
                    setOpenCreateItemCodeModal(true);
                  }}
                  onEdit={(row) => {
                    const item = productItemCodes?.data?.find((item: any) => item.id === row.id);
                    if (!item) return;
                    setEditingId(row.id);
                    setItemCodeValue(item.item_code ?? "");
                    setItemCodeSubStructureId(item.sub_product_structure_id ? String(item.sub_product_structure_id) : "");
                    setItemCodeDescription(item.description ?? "");
                    setItemCodeSpecification(item.specification ?? "");
                    setOpenCreateItemCodeModal(true);
                  }}
                  onDelete={(row) => setDeleteTarget({ id: row.id, name: row.name, kind: "product-item-code", label: "Item Code" })}
                  onToggleStatus={handleToggleItemCodeStatus}
                  isTogglingStatus={updateProductItemCodeStatusMutation.isPending}
                  togglingId={togglingItemCodeId}
                />
              ),
            },
            {
              id: "sub-item-category",
              title: "Sub-Item Category",
              color: "bg-black hover:bg-black",
              cardContent: (
                <MasterListingTable
                  title="Sub-Item Category"
                  description="Product sub structure master entries for the current vendor."
                  searchPlaceholder="Search product sub structure..."
                  actionLabel="Add Sub-Item Category"
                  rows={productSubStructureRows}
                  showParent
                  isLoading={isProductSubStructuresLoading}
                  isError={isProductSubStructuresError}
                  errorMessage={
                    (productSubStructuresError as any)?.response?.data?.error
                  }
                  onAction={() => {
                    setEditingId(null);
                    setSubItemCategoryName("");
                    setSubItemCategoryProductStructureId("");
                    setOpenCreateSubItemCategoryModal(true);
                  }}
                  onEdit={(row) => {
                    const item = productSubStructures?.data?.find((item: any) => item.id === row.id);
                    if (!item) return;
                    setEditingId(row.id);
                    setSubItemCategoryName(item.type ?? "");
                    setSubItemCategoryProductStructureId(String(item.product_structure_id ?? ""));
                    setOpenCreateSubItemCategoryModal(true);
                  }}
                  onDelete={(row) => setDeleteTarget({ id: row.id, name: row.name, kind: "product-sub-structure", label: "Sub-Item Category" })}
                  onToggleStatus={handleToggleSubItemCategoryStatus}
                  isTogglingStatus={updateProductSubStructureStatusMutation.isPending}
                  togglingId={togglingSubItemCategoryId}
                />
              ),
            },
            {
              id: "item-category",
              title: "Item Category",
              color: "bg-black hover:bg-black",
              cardContent: (
                <MasterListingTable
                  title="Item Category"
                  description="Product structure master entries for the current vendor."
                  searchPlaceholder="Search product structure..."
                  actionLabel="Add Item Category"
                  rows={productStructureRows}
                  showParent
                  isLoading={isProductStructuresLoading}
                  isError={isProductStructuresError}
                  errorMessage={
                    (productStructuresError as any)?.response?.data?.error
                  }
                  onAction={() => {
                    setEditingId(null);
                    setItemCategoryName("");
                    setItemCategoryProductTypeId("");
                    setOpenCreateItemCategoryModal(true);
                  }}
                  onEdit={(row) => {
                    const item = productStructures?.data?.find((item: any) => item.id === row.id);
                    if (!item) return;
                    setEditingId(row.id);
                    setItemCategoryName(item.type ?? "");
                    setItemCategoryProductTypeId(item.product_type_id ? String(item.product_type_id) : "");
                    setOpenCreateItemCategoryModal(true);
                  }}
                  onDelete={(row) => setDeleteTarget({ id: row.id, name: row.name, kind: "product-structure", label: "Item Category" })}
                  onToggleStatus={handleToggleItemCategoryStatus}
                  isTogglingStatus={updateProductStructureStatusMutation.isPending}
                  togglingId={togglingItemCategoryId}
                />
              ),
            },
            {
              id: "item-group",
              title: "Item Group",
              color: "bg-black hover:bg-black",
              cardContent: (
                <MasterListingTable
                  title="Item Group"
                  description="Product type master entries for the current vendor."
                  searchPlaceholder="Search product type..."
                  actionLabel="Add Item Group"
                  rows={productTypeRows}
                  isLoading={isProductTypesLoading}
                  isError={isProductTypesError}
                  errorMessage={(productTypesError as any)?.response?.data?.error}
                  onAction={() => {
                    setEditingId(null);
                    setItemGroupTypeValue("");
                    setOpenCreateItemGroupModal(true);
                  }}
                  onEdit={(row) => {
                    setEditingId(row.id);
                    setItemGroupTypeValue(row.name ?? "");
                    setOpenCreateItemGroupModal(true);
                  }}
                  onDelete={(row) => setDeleteTarget({ id: row.id, name: row.name, kind: "product-type", label: "Item Group" })}
                  onToggleStatus={handleToggleItemGroupStatus}
                  isTogglingStatus={updateProductTypeStatusMutation.isPending}
                  togglingId={togglingItemGroupId}
                />
              ),
            },
          ]}
          contentHeightClass="min-h-[240px]"
          pinTabsToBottom={false}
        />
      </div>

      <Dialog
        open={openCreateItemCodeModal}
        onOpenChange={handleItemCodeModalChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Item Code</DialogTitle>
            <DialogDescription>
              {editingId ? "Edit the selected" : "Create a new"} item code and link it to a sub-item category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Row: Item Code + Sub-Item Category side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-code-name">
                  Item Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="item-code-name"
                  value={itemCodeValue}
                  onChange={(e) => setItemCodeValue(e.target.value)}
                  placeholder="Enter item code"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Sub-Item Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={itemCodeSubStructureId}
                  onValueChange={setItemCodeSubStructureId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-item category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(productSubStructures?.data ?? [])
                      .filter((item: any) => activeProductSubStructureIds.has(item.id) || String(item.id) === itemCodeSubStructureId)
                      .map((item: any) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.type}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-code-description">
                Description{" "}
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="item-code-description"
                value={itemCodeDescription}
                onChange={(e) => setItemCodeDescription(e.target.value)}
                placeholder="Enter description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-code-specification">
                Specification{" "}
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="item-code-specification"
                value={itemCodeSpecification}
                onChange={(e) => setItemCodeSpecification(e.target.value)}
                placeholder="Enter specification"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isSavingItemCode}
              onClick={() => handleItemCodeModalChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveItemCode}
              disabled={
                isSavingItemCode ||
                !itemCodeValue.trim() ||
                !itemCodeSubStructureId ||
                !vendorId
              }
            >
              {isSavingItemCode ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Edit" : "Create")}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      <Dialog
        open={openCreateSubItemCategoryModal}
        onOpenChange={setOpenCreateSubItemCategoryModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Sub-Item Category</DialogTitle>
            <DialogDescription>
              {editingId ? "Edit the selected" : "Create a new"} product sub structure and link it to an item category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sub-item-category-name">Sub-Item Category Name</Label>
              <Input
                id="sub-item-category-name"
                value={subItemCategoryName}
                onChange={(e) => setSubItemCategoryName(e.target.value)}
                placeholder="Enter sub-item category name"
              />
            </div>

            <div className="space-y-2">
              <Label>Item Category</Label>
              <Select
                value={subItemCategoryProductStructureId}
                onValueChange={setSubItemCategoryProductStructureId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item category" />
                </SelectTrigger>
                <SelectContent>
                  {(productStructures?.data ?? [])
                    .filter((item: any) => activeProductStructureIds.has(item.id) || String(item.id) === subItemCategoryProductStructureId)
                    .map((item: any) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateSubItemCategoryModal(false);
                setSubItemCategoryName("");
                setSubItemCategoryProductStructureId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubItemCategory}
              disabled={
                createProductSubStructureMutation.isPending ||
                !subItemCategoryName.trim() ||
                !subItemCategoryProductStructureId ||
                !vendorId
              }
            >
              {createProductSubStructureMutation.isPending
                ? (editingId ? "Saving..." : "Creating...")
                : (editingId ? "Edit" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openCreateItemCategoryModal}
        onOpenChange={setOpenCreateItemCategoryModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Item Category</DialogTitle>
            <DialogDescription>
              {editingId ? "Edit the selected" : "Create a new"} product structure and link it to a product type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-category-name">Item Category Name</Label>
              <Input
                id="item-category-name"
                value={itemCategoryName}
                onChange={(e) => setItemCategoryName(e.target.value)}
                placeholder="Enter item category name"
              />
            </div>

            <div className="space-y-2">
              <Label>Product Type</Label>
              <Select
                value={itemCategoryProductTypeId}
                onValueChange={setItemCategoryProductTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  {(productTypes?.data ?? [])
                    .filter((item: any) => (item.status ?? "active").toLowerCase() === "active" || String(item.id) === itemCategoryProductTypeId)
                    .map((item: any) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateItemCategoryModal(false);
                setItemCategoryName("");
                setItemCategoryProductTypeId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateItemCategory}
              disabled={
                createProductStructureMutation.isPending ||
                !itemCategoryName.trim() ||
                !itemCategoryProductTypeId ||
                !vendorId
              }
            >
              {createProductStructureMutation.isPending
                ? (editingId ? "Saving..." : "Creating...")
                : (editingId ? "Edit" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openCreateItemGroupModal}
        onOpenChange={setOpenCreateItemGroupModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Item Group</DialogTitle>
            <DialogDescription>
              {editingId ? "Edit the selected" : "Create a new"} product type for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-group-type">Product Type</Label>
              <Input
                id="item-group-type"
                value={itemGroupTypeValue}
                onChange={(e) => setItemGroupTypeValue(e.target.value)}
                placeholder="Enter product type"
              />
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateItemGroupModal(false);
                setItemGroupTypeValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateItemGroup}
              disabled={
                createProductTypeMutation.isPending ||
                !itemGroupTypeValue.trim() ||
                !vendorId
              }
            >
              {createProductTypeMutation.isPending ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Edit" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
      />
    </>
  );
}

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
import { Plus } from "lucide-react";
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
import {
  useCreateProductItemCode,
  useCreateProductSubStructure,
  useCreateProductType,
  useCreateProductStructure,
  useProductItemCodes,
  useProductSubStructures,
  useProductStructureTypes,
  useProductTypes,
} from "@/hooks/useTypesMaster";
import { useAppSelector } from "@/redux/store";

type MasterRow = {
  srNo: number;
  id: number;
  name: string;
  parent?: string | null;
  description?: string | null;
  specification?: string | null;
  status: string;
};

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
          const status = row.original.status || "—";
          return (
            <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium">
              {status}
            </span>
          );
        },
      },
    ],
    [showDescription, showParent, showSpecification],
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
  const createProductItemCodeMutation = useCreateProductItemCode();
  const createProductTypeMutation = useCreateProductType();
  const createProductStructureMutation = useCreateProductStructure();
  const createProductSubStructureMutation = useCreateProductSubStructure();
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

  const productItemCodeRows = React.useMemo<MasterRow[]>(
    () =>
      (productItemCodes?.data ?? []).map((item: any, index: number) => ({
        srNo: index + 1,
        id: item.id,
        name: item.item_code,
        parent: item.subProductStructure?.type ?? null,
        description: item.description ?? null,
        specification: item.specification ?? null,
        status: item.status ?? "active",
      })),
    [productItemCodes?.data],
  );

  const productStructureRows = React.useMemo<MasterRow[]>(
    () =>
      (productStructures?.data ?? []).map((item: any, index: number) => ({
        srNo: index + 1,
        id: item.id,
        name: item.type,
        parent: item.productType?.type ?? item.parent ?? null,
        status: item.status ?? "active",
      })),
    [productStructures?.data],
  );

  const productSubStructureRows = React.useMemo<MasterRow[]>(
    () =>
      (productSubStructures?.data ?? []).map((item: any, index: number) => ({
        srNo: index + 1,
        id: item.id,
        name: item.type,
        parent: item.productStructure?.type ?? null,
        status: item.status ?? "active",
      })),
    [productSubStructures?.data],
  );
  const [openCreateItemGroupModal, setOpenCreateItemGroupModal] =
    React.useState(false);
  const [openCreateItemCodeModal, setOpenCreateItemCodeModal] =
    React.useState(false);
  const [openCreateItemCategoryModal, setOpenCreateItemCategoryModal] =
    React.useState(false);
  const [openCreateSubItemCategoryModal, setOpenCreateSubItemCategoryModal] =
    React.useState(false);
  const [itemGroupTypeValue, setItemGroupTypeValue] = React.useState("");
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

  const handleCreateItemCode = () => {
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
      !description ||
      !specification ||
      !vendorId ||
      !subStructureId ||
      !productStructureId
    ) {
      return;
    }

    createProductItemCodeMutation.mutate(
      {
        vendor_id: vendorId,
        item_code: itemCode,
        product_structure_id: productStructureId,
        sub_product_structure_id: subStructureId,
        description,
        specification,
      },
      {
        onSuccess: () => {
          setOpenCreateItemCodeModal(false);
          setItemCodeValue("");
          setItemCodeSubStructureId("");
          setItemCodeDescription("");
          setItemCodeSpecification("");
        },
      },
    );
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
                <BreadcrumbPage>BOQ Items Master</BreadcrumbPage>
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
            BOQ Items Master
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
                  onAction={() => setOpenCreateItemCodeModal(true)}
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
                  onAction={() => setOpenCreateSubItemCategoryModal(true)}
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
                  onAction={() => setOpenCreateItemCategoryModal(true)}
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
                  onAction={() => setOpenCreateItemGroupModal(true)}
                />
              ),
            },
          ]}
          contentHeightClass="min-h-[240px]"
        />
      </div>

      <Dialog
        open={openCreateItemCodeModal}
        onOpenChange={setOpenCreateItemCodeModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item Code</DialogTitle>
            <DialogDescription>
              Create a new item code and link it to a sub-item category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-code-name">Item Code</Label>
              <Input
                id="item-code-name"
                value={itemCodeValue}
                onChange={(e) => setItemCodeValue(e.target.value)}
                placeholder="Enter item code"
              />
            </div>

            <div className="space-y-2">
              <Label>Sub-Item Category</Label>
              <Select
                value={itemCodeSubStructureId}
                onValueChange={setItemCodeSubStructureId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-item category" />
                </SelectTrigger>
                <SelectContent>
                  {(productSubStructures?.data ?? []).map((item: any) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-code-description">Description</Label>
              <Textarea
                id="item-code-description"
                value={itemCodeDescription}
                onChange={(e) => setItemCodeDescription(e.target.value)}
                placeholder="Enter description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-code-specification">Specification</Label>
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
              onClick={() => {
                setOpenCreateItemCodeModal(false);
                setItemCodeValue("");
                setItemCodeSubStructureId("");
                setItemCodeDescription("");
                setItemCodeSpecification("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateItemCode}
              disabled={
                createProductItemCodeMutation.isPending ||
                !itemCodeValue.trim() ||
                !itemCodeSubStructureId ||
                !itemCodeDescription.trim() ||
                !itemCodeSpecification.trim() ||
                !vendorId
              }
            >
              {createProductItemCodeMutation.isPending
                ? "Creating..."
                : "Create"}
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
            <DialogTitle>Add Sub-Item Category</DialogTitle>
            <DialogDescription>
              Create a new product sub structure and link it to an item category.
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
                  {(productStructures?.data ?? []).map((item: any) => (
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
                ? "Creating..."
                : "Create"}
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
            <DialogTitle>Add Item Category</DialogTitle>
            <DialogDescription>
              Create a new product structure and link it to a product type.
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
                  {(productTypes?.data ?? []).map((item: any) => (
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
                ? "Creating..."
                : "Create"}
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
            <DialogTitle>Add Item Group</DialogTitle>
            <DialogDescription>
              Create a new product type for the current vendor.
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
              {createProductTypeMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

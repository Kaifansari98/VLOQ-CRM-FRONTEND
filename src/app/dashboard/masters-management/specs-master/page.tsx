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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAppSelector } from "@/redux/store";
import {
  useCarcassTypes,
  useCarcasMaterials,
  useAllCarcassMaterialFinishes,
  useCreateCarcassType,
  useCreateCarcasMaterial,
  useCreateCarcassMaterialFinish,
  useShutterTypes,
  useShutterMaterials,
  useAllShutterMaterialFinishes,
  useCreateShutterType,
  useCreateShutterMaterial,
  useCreateShutterMaterialFinish,
  useCarcassLegs,
  useAllSkirtingCarcassLegs,
  useAllSkirtingCarcassLegsColors,
  useCreateCarcassLegs,
  useCreateSkirtingCarcassLegs,
  useCreateSkirtingCarcassLegsColor,
  useLightCarcasTypes,
  useAllLightCarcasUnits,
  useCreateLightCarcasType,
  useCreateLightCarcasUnit,
  useOtherAppliances,
  useCreateOtherAppliances,
} from "@/hooks/useTypesMaster";

type MasterRow = {
  srNo: number;
  id: number;
  name: string;
  parent?: string | null;
  status: string;
};

function MasterListingTable({
  title,
  description,
  searchPlaceholder,
  actionLabel,
  rows,
  showParent = false,
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
    [showParent],
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

function CarcassMastersSection() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const {
    data: carcassTypes,
    isLoading: isCarcassTypesLoading,
    isError: isCarcassTypesError,
    error: carcassTypesError,
  } = useCarcassTypes();
  const {
    data: carcasMaterials,
    isLoading: isCarcasMaterialsLoading,
    isError: isCarcasMaterialsError,
    error: carcasMaterialsError,
  } = useCarcasMaterials();
  const {
    data: carcassMaterialFinishes,
    isLoading: isCarcassMaterialFinishesLoading,
    isError: isCarcassMaterialFinishesError,
    error: carcassMaterialFinishesError,
  } = useAllCarcassMaterialFinishes();

  const createCarcassType = useCreateCarcassType();
  const createCarcasMaterial = useCreateCarcasMaterial();
  const createCarcassMaterialFinish = useCreateCarcassMaterialFinish();

  const carcassTypeRows = React.useMemo<MasterRow[]>(
    () =>
      (carcassTypes?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        status: "active",
      })),
    [carcassTypes?.data],
  );

  const carcasMaterialRows = React.useMemo<MasterRow[]>(
    () =>
      (carcasMaterials?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        status: "active",
      })),
    [carcasMaterials?.data],
  );

  const carcassMaterialFinishRows = React.useMemo<MasterRow[]>(
    () =>
      (carcassMaterialFinishes?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        parent: item.material?.name ?? null,
        status: "active",
      })),
    [carcassMaterialFinishes?.data],
  );

  const [openTypeModal, setOpenTypeModal] = React.useState(false);
  const [typeName, setTypeName] = React.useState("");
  const [openMaterialModal, setOpenMaterialModal] = React.useState(false);
  const [materialName, setMaterialName] = React.useState("");
  const [openFinishModal, setOpenFinishModal] = React.useState(false);
  const [finishName, setFinishName] = React.useState("");
  const [finishMaterialId, setFinishMaterialId] = React.useState("");

  const handleCreateType = () => {
    const name = typeName.trim();
    if (!name || !vendorId) return;

    createCarcassType.mutate(
      { vendor_id: vendorId, name },
      {
        onSuccess: () => {
          setOpenTypeModal(false);
          setTypeName("");
        },
      },
    );
  };

  const handleCreateMaterial = () => {
    const name = materialName.trim();
    if (!name || !vendorId) return;

    createCarcasMaterial.mutate(
      { vendor_id: vendorId, name },
      {
        onSuccess: () => {
          setOpenMaterialModal(false);
          setMaterialName("");
        },
      },
    );
  };

  const handleCreateFinish = () => {
    const name = finishName.trim();
    const carcasMaterialId = Number(finishMaterialId);
    if (!name || !carcasMaterialId) return;

    createCarcassMaterialFinish.mutate(
      { carcas_material_id: carcasMaterialId, name },
      {
        onSuccess: () => {
          setOpenFinishModal(false);
          setFinishName("");
          setFinishMaterialId("");
        },
      },
    );
  };

  return (
    <>
      <Tabs defaultValue="finish" className="w-full">
        <TabsList>
          <TabsTrigger value="finish">Carcass Material Finish</TabsTrigger>
          <TabsTrigger value="material">Carcass Material</TabsTrigger>
          <TabsTrigger value="type">Carcass Type</TabsTrigger>
        </TabsList>

        <TabsContent value="finish" className="mt-4">
          <MasterListingTable
            title="Carcass Material Finish"
            description="Carcass material finish master entries for the current vendor."
            searchPlaceholder="Search carcass material finish..."
            actionLabel="Add Carcass Material Finish"
            rows={carcassMaterialFinishRows}
            showParent
            isLoading={isCarcassMaterialFinishesLoading}
            isError={isCarcassMaterialFinishesError}
            errorMessage={
              (carcassMaterialFinishesError as any)?.response?.data?.error
            }
            onAction={() => setOpenFinishModal(true)}
          />
        </TabsContent>

        <TabsContent value="material" className="mt-4">
          <MasterListingTable
            title="Carcass Material"
            description="Carcass material master entries for the current vendor."
            searchPlaceholder="Search carcass material..."
            actionLabel="Add Carcass Material"
            rows={carcasMaterialRows}
            isLoading={isCarcasMaterialsLoading}
            isError={isCarcasMaterialsError}
            errorMessage={(carcasMaterialsError as any)?.response?.data?.error}
            onAction={() => setOpenMaterialModal(true)}
          />
        </TabsContent>

        <TabsContent value="type" className="mt-4">
          <MasterListingTable
            title="Carcass Type"
            description="Carcass type master entries for the current vendor."
            searchPlaceholder="Search carcass type..."
            actionLabel="Add Carcass Type"
            rows={carcassTypeRows}
            isLoading={isCarcassTypesLoading}
            isError={isCarcassTypesError}
            errorMessage={(carcassTypesError as any)?.response?.data?.error}
            onAction={() => setOpenTypeModal(true)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={openTypeModal} onOpenChange={setOpenTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Carcass Type</DialogTitle>
            <DialogDescription>
              Create a new carcass type for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carcass-type-name">Carcass Type</Label>
              <Input
                id="carcass-type-name"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="Enter carcass type"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenTypeModal(false);
                setTypeName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateType}
              disabled={
                createCarcassType.isPending || !typeName.trim() || !vendorId
              }
            >
              {createCarcassType.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openMaterialModal} onOpenChange={setOpenMaterialModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Carcass Material</DialogTitle>
            <DialogDescription>
              Create a new carcass material for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carcass-material-name">Carcass Material</Label>
              <Input
                id="carcass-material-name"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Enter carcass material"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenMaterialModal(false);
                setMaterialName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMaterial}
              disabled={
                createCarcasMaterial.isPending ||
                !materialName.trim() ||
                !vendorId
              }
            >
              {createCarcasMaterial.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openFinishModal} onOpenChange={setOpenFinishModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Carcass Material Finish</DialogTitle>
            <DialogDescription>
              Create a new carcass material finish and link it to a carcass
              material.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Carcass Material</Label>
              <Select value={finishMaterialId} onValueChange={setFinishMaterialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carcass material" />
                </SelectTrigger>
                <SelectContent>
                  {(carcasMaterials?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carcass-material-finish-name">
                Carcass Material Finish
              </Label>
              <Input
                id="carcass-material-finish-name"
                value={finishName}
                onChange={(e) => setFinishName(e.target.value)}
                placeholder="Enter carcass material finish"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenFinishModal(false);
                setFinishName("");
                setFinishMaterialId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFinish}
              disabled={
                createCarcassMaterialFinish.isPending ||
                !finishName.trim() ||
                !finishMaterialId
              }
            >
              {createCarcassMaterialFinish.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShutterMastersSection() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const {
    data: shutterTypes,
    isLoading: isShutterTypesLoading,
    isError: isShutterTypesError,
    error: shutterTypesError,
  } = useShutterTypes();
  const {
    data: shutterMaterials,
    isLoading: isShutterMaterialsLoading,
    isError: isShutterMaterialsError,
    error: shutterMaterialsError,
  } = useShutterMaterials();
  const {
    data: shutterMaterialFinishes,
    isLoading: isShutterMaterialFinishesLoading,
    isError: isShutterMaterialFinishesError,
    error: shutterMaterialFinishesError,
  } = useAllShutterMaterialFinishes();

  const createShutterType = useCreateShutterType();
  const createShutterMaterial = useCreateShutterMaterial();
  const createShutterMaterialFinish = useCreateShutterMaterialFinish();

  const shutterTypeRows = React.useMemo<MasterRow[]>(
    () =>
      (shutterTypes?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        status: "active",
      })),
    [shutterTypes?.data],
  );

  const shutterMaterialRows = React.useMemo<MasterRow[]>(
    () =>
      (shutterMaterials?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        status: "active",
      })),
    [shutterMaterials?.data],
  );

  const shutterMaterialFinishRows = React.useMemo<MasterRow[]>(
    () =>
      (shutterMaterialFinishes?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        parent: item.material?.name ?? null,
        status: "active",
      })),
    [shutterMaterialFinishes?.data],
  );

  const [openTypeModal, setOpenTypeModal] = React.useState(false);
  const [typeName, setTypeName] = React.useState("");
  const [openMaterialModal, setOpenMaterialModal] = React.useState(false);
  const [materialName, setMaterialName] = React.useState("");
  const [openFinishModal, setOpenFinishModal] = React.useState(false);
  const [finishName, setFinishName] = React.useState("");
  const [finishMaterialId, setFinishMaterialId] = React.useState("");

  const handleCreateType = () => {
    const name = typeName.trim();
    if (!name || !vendorId) return;

    createShutterType.mutate(
      { vendor_id: vendorId, name },
      {
        onSuccess: () => {
          setOpenTypeModal(false);
          setTypeName("");
        },
      },
    );
  };

  const handleCreateMaterial = () => {
    const name = materialName.trim();
    if (!name || !vendorId) return;

    createShutterMaterial.mutate(
      { vendor_id: vendorId, name },
      {
        onSuccess: () => {
          setOpenMaterialModal(false);
          setMaterialName("");
        },
      },
    );
  };

  const handleCreateFinish = () => {
    const name = finishName.trim();
    const shutterMaterialId = Number(finishMaterialId);
    if (!name || !shutterMaterialId) return;

    createShutterMaterialFinish.mutate(
      { shutter_material_id: shutterMaterialId, name },
      {
        onSuccess: () => {
          setOpenFinishModal(false);
          setFinishName("");
          setFinishMaterialId("");
        },
      },
    );
  };

  return (
    <>
      <Tabs defaultValue="finish" className="w-full">
        <TabsList>
          <TabsTrigger value="finish">Shutter Material Finish</TabsTrigger>
          <TabsTrigger value="material">Shutter Material</TabsTrigger>
          <TabsTrigger value="type">Shutter Type</TabsTrigger>
        </TabsList>

        <TabsContent value="finish" className="mt-4">
          <MasterListingTable
            title="Shutter Material Finish"
            description="Shutter material finish master entries for the current vendor."
            searchPlaceholder="Search shutter material finish..."
            actionLabel="Add Shutter Material Finish"
            rows={shutterMaterialFinishRows}
            showParent
            isLoading={isShutterMaterialFinishesLoading}
            isError={isShutterMaterialFinishesError}
            errorMessage={
              (shutterMaterialFinishesError as any)?.response?.data?.error
            }
            onAction={() => setOpenFinishModal(true)}
          />
        </TabsContent>

        <TabsContent value="material" className="mt-4">
          <MasterListingTable
            title="Shutter Material"
            description="Shutter material master entries for the current vendor."
            searchPlaceholder="Search shutter material..."
            actionLabel="Add Shutter Material"
            rows={shutterMaterialRows}
            isLoading={isShutterMaterialsLoading}
            isError={isShutterMaterialsError}
            errorMessage={(shutterMaterialsError as any)?.response?.data?.error}
            onAction={() => setOpenMaterialModal(true)}
          />
        </TabsContent>

        <TabsContent value="type" className="mt-4">
          <MasterListingTable
            title="Shutter Type"
            description="Shutter type master entries for the current vendor."
            searchPlaceholder="Search shutter type..."
            actionLabel="Add Shutter Type"
            rows={shutterTypeRows}
            isLoading={isShutterTypesLoading}
            isError={isShutterTypesError}
            errorMessage={(shutterTypesError as any)?.response?.data?.error}
            onAction={() => setOpenTypeModal(true)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={openTypeModal} onOpenChange={setOpenTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shutter Type</DialogTitle>
            <DialogDescription>
              Create a new shutter type for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shutter-type-name">Shutter Type</Label>
              <Input
                id="shutter-type-name"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="Enter shutter type"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenTypeModal(false);
                setTypeName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateType}
              disabled={
                createShutterType.isPending || !typeName.trim() || !vendorId
              }
            >
              {createShutterType.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openMaterialModal} onOpenChange={setOpenMaterialModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shutter Material</DialogTitle>
            <DialogDescription>
              Create a new shutter material for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shutter-material-name">Shutter Material</Label>
              <Input
                id="shutter-material-name"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Enter shutter material"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenMaterialModal(false);
                setMaterialName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMaterial}
              disabled={
                createShutterMaterial.isPending ||
                !materialName.trim() ||
                !vendorId
              }
            >
              {createShutterMaterial.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openFinishModal} onOpenChange={setOpenFinishModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shutter Material Finish</DialogTitle>
            <DialogDescription>
              Create a new shutter material finish and link it to a shutter
              material.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shutter Material</Label>
              <Select value={finishMaterialId} onValueChange={setFinishMaterialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shutter material" />
                </SelectTrigger>
                <SelectContent>
                  {(shutterMaterials?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shutter-material-finish-name">
                Shutter Material Finish
              </Label>
              <Input
                id="shutter-material-finish-name"
                value={finishName}
                onChange={(e) => setFinishName(e.target.value)}
                placeholder="Enter shutter material finish"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenFinishModal(false);
                setFinishName("");
                setFinishMaterialId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFinish}
              disabled={
                createShutterMaterialFinish.isPending ||
                !finishName.trim() ||
                !finishMaterialId
              }
            >
              {createShutterMaterialFinish.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function HardwareMastersSection() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const {
    data: carcassLegs,
    isLoading: isCarcassLegsLoading,
    isError: isCarcassLegsError,
    error: carcassLegsError,
  } = useCarcassLegs();
  const {
    data: skirtings,
    isLoading: isSkirtingsLoading,
    isError: isSkirtingsError,
    error: skirtingsError,
  } = useAllSkirtingCarcassLegs();
  const {
    data: skirtingColors,
    isLoading: isSkirtingColorsLoading,
    isError: isSkirtingColorsError,
    error: skirtingColorsError,
  } = useAllSkirtingCarcassLegsColors();

  const createCarcassLegs = useCreateCarcassLegs();
  const createSkirtingCarcassLegs = useCreateSkirtingCarcassLegs();
  const createSkirtingCarcassLegsColor = useCreateSkirtingCarcassLegsColor();

  const carcassLegsRows = React.useMemo<MasterRow[]>(
    () =>
      (carcassLegs?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        status: "active",
      })),
    [carcassLegs?.data],
  );

  const skirtingRows = React.useMemo<MasterRow[]>(
    () =>
      (skirtings?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.name,
        parent: item.carcassLegs?.name ?? null,
        status: item.inScope ? "in scope" : "not in scope",
      })),
    [skirtings?.data],
  );

  const skirtingColorRows = React.useMemo<MasterRow[]>(
    () =>
      (skirtingColors?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.color,
        parent: item.skirtingCarcassLegs?.name ?? null,
        status: "active",
      })),
    [skirtingColors?.data],
  );

  const [openLegsModal, setOpenLegsModal] = React.useState(false);
  const [legsName, setLegsName] = React.useState("");
  const [openSkirtingModal, setOpenSkirtingModal] = React.useState(false);
  const [skirtingName, setSkirtingName] = React.useState("");
  const [skirtingLegsId, setSkirtingLegsId] = React.useState("");
  const [skirtingInScope, setSkirtingInScope] = React.useState("true");
  const [openColorModal, setOpenColorModal] = React.useState(false);
  const [colorValue, setColorValue] = React.useState("");
  const [colorLegsId, setColorLegsId] = React.useState("");
  const [colorSkirtingId, setColorSkirtingId] = React.useState("");

  const colorSkirtingOptions = React.useMemo(
    () =>
      (skirtings?.data ?? []).filter(
        (item) => String(item.carcass_legs_id) === colorLegsId,
      ),
    [skirtings?.data, colorLegsId],
  );

  const handleCreateLegs = () => {
    const name = legsName.trim();
    if (!name || !vendorId) return;

    createCarcassLegs.mutate(
      { vendor_id: vendorId, name },
      {
        onSuccess: () => {
          setOpenLegsModal(false);
          setLegsName("");
        },
      },
    );
  };

  const handleCreateSkirting = () => {
    const name = skirtingName.trim();
    const carcassLegsId = Number(skirtingLegsId);
    if (!name || !carcassLegsId) return;

    createSkirtingCarcassLegs.mutate(
      {
        carcass_legs_id: carcassLegsId,
        name,
        inScope: skirtingInScope === "true",
      },
      {
        onSuccess: () => {
          setOpenSkirtingModal(false);
          setSkirtingName("");
          setSkirtingLegsId("");
          setSkirtingInScope("true");
        },
      },
    );
  };

  const handleCreateColor = () => {
    const color = colorValue.trim();
    const carcassLegsId = Number(colorLegsId);
    const skirtingCarcassLegsId = Number(colorSkirtingId);
    if (!color || !carcassLegsId || !skirtingCarcassLegsId) return;

    createSkirtingCarcassLegsColor.mutate(
      {
        carcass_legs_id: carcassLegsId,
        skirting_carcass_legs_id: skirtingCarcassLegsId,
        color,
      },
      {
        onSuccess: () => {
          setOpenColorModal(false);
          setColorValue("");
          setColorLegsId("");
          setColorSkirtingId("");
        },
      },
    );
  };

  return (
    <>
      <Tabs defaultValue="color" className="w-full">
        <TabsList>
          <TabsTrigger value="color">Skirting Color</TabsTrigger>
          <TabsTrigger value="skirting">Skirting</TabsTrigger>
          <TabsTrigger value="legs">Carcass Legs</TabsTrigger>
        </TabsList>

        <TabsContent value="color" className="mt-4">
          <MasterListingTable
            title="Skirting Color"
            description="Skirting color master entries for the current vendor."
            searchPlaceholder="Search skirting color..."
            actionLabel="Add Skirting Color"
            rows={skirtingColorRows}
            showParent
            isLoading={isSkirtingColorsLoading}
            isError={isSkirtingColorsError}
            errorMessage={(skirtingColorsError as any)?.response?.data?.error}
            onAction={() => setOpenColorModal(true)}
          />
        </TabsContent>

        <TabsContent value="skirting" className="mt-4">
          <MasterListingTable
            title="Skirting"
            description="Skirting master entries for the current vendor."
            searchPlaceholder="Search skirting..."
            actionLabel="Add Skirting"
            rows={skirtingRows}
            showParent
            isLoading={isSkirtingsLoading}
            isError={isSkirtingsError}
            errorMessage={(skirtingsError as any)?.response?.data?.error}
            onAction={() => setOpenSkirtingModal(true)}
          />
        </TabsContent>

        <TabsContent value="legs" className="mt-4">
          <MasterListingTable
            title="Carcass Legs"
            description="Carcass legs master entries for the current vendor."
            searchPlaceholder="Search carcass legs..."
            actionLabel="Add Carcass Legs"
            rows={carcassLegsRows}
            isLoading={isCarcassLegsLoading}
            isError={isCarcassLegsError}
            errorMessage={(carcassLegsError as any)?.response?.data?.error}
            onAction={() => setOpenLegsModal(true)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={openLegsModal} onOpenChange={setOpenLegsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Carcass Legs</DialogTitle>
            <DialogDescription>
              Create a new carcass legs entry for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carcass-legs-name">Carcass Legs</Label>
              <Input
                id="carcass-legs-name"
                value={legsName}
                onChange={(e) => setLegsName(e.target.value)}
                placeholder="Enter carcass legs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenLegsModal(false);
                setLegsName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateLegs}
              disabled={
                createCarcassLegs.isPending || !legsName.trim() || !vendorId
              }
            >
              {createCarcassLegs.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openSkirtingModal} onOpenChange={setOpenSkirtingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skirting</DialogTitle>
            <DialogDescription>
              Create a new skirting entry and link it to a carcass legs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Carcass Legs</Label>
              <Select value={skirtingLegsId} onValueChange={setSkirtingLegsId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carcass legs" />
                </SelectTrigger>
                <SelectContent>
                  {(carcassLegs?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skirting-name">Skirting</Label>
              <Input
                id="skirting-name"
                value={skirtingName}
                onChange={(e) => setSkirtingName(e.target.value)}
                placeholder="Enter skirting"
              />
            </div>

            <div className="space-y-2">
              <Label>In Scope</Label>
              <Select value={skirtingInScope} onValueChange={setSkirtingInScope}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">In Scope</SelectItem>
                  <SelectItem value="false">Not in Scope</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenSkirtingModal(false);
                setSkirtingName("");
                setSkirtingLegsId("");
                setSkirtingInScope("true");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSkirting}
              disabled={
                createSkirtingCarcassLegs.isPending ||
                !skirtingName.trim() ||
                !skirtingLegsId
              }
            >
              {createSkirtingCarcassLegs.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openColorModal} onOpenChange={setOpenColorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skirting Color</DialogTitle>
            <DialogDescription>
              Create a new skirting color and link it to a carcass legs and
              skirting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Carcass Legs</Label>
              <Select
                value={colorLegsId}
                onValueChange={(value) => {
                  setColorLegsId(value);
                  setColorSkirtingId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carcass legs" />
                </SelectTrigger>
                <SelectContent>
                  {(carcassLegs?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Skirting</Label>
              <Select
                value={colorSkirtingId}
                onValueChange={setColorSkirtingId}
                disabled={!colorLegsId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      colorLegsId
                        ? "Select skirting"
                        : "Select carcass legs first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {colorSkirtingOptions.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skirting-color-value">Color</Label>
              <Input
                id="skirting-color-value"
                value={colorValue}
                onChange={(e) => setColorValue(e.target.value)}
                placeholder="Enter color"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenColorModal(false);
                setColorValue("");
                setColorLegsId("");
                setColorSkirtingId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateColor}
              disabled={
                createSkirtingCarcassLegsColor.isPending ||
                !colorValue.trim() ||
                !colorLegsId ||
                !colorSkirtingId
              }
            >
              {createSkirtingCarcassLegsColor.isPending
                ? "Creating..."
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LightMastersSection() {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const {
    data: lightCarcasTypes,
    isLoading: isLightCarcasTypesLoading,
    isError: isLightCarcasTypesError,
    error: lightCarcasTypesError,
  } = useLightCarcasTypes();
  const {
    data: lightCarcasUnits,
    isLoading: isLightCarcasUnitsLoading,
    isError: isLightCarcasUnitsError,
    error: lightCarcasUnitsError,
  } = useAllLightCarcasUnits();

  const createLightCarcasType = useCreateLightCarcasType();
  const createLightCarcasUnit = useCreateLightCarcasUnit();

  const lightCarcasTypeRows = React.useMemo<MasterRow[]>(
    () =>
      (lightCarcasTypes?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.type,
        status: "active",
      })),
    [lightCarcasTypes?.data],
  );

  const lightCarcasUnitRows = React.useMemo<MasterRow[]>(
    () =>
      (lightCarcasUnits?.data ?? []).map((item, index) => ({
        srNo: index + 1,
        id: item.id,
        name: item.type,
        parent: item.lightCarcasType?.type ?? null,
        status: "active",
      })),
    [lightCarcasUnits?.data],
  );

  const [openTypeModal, setOpenTypeModal] = React.useState(false);
  const [typeName, setTypeName] = React.useState("");
  const [openUnitModal, setOpenUnitModal] = React.useState(false);
  const [unitName, setUnitName] = React.useState("");
  const [unitTypeId, setUnitTypeId] = React.useState("");

  const handleCreateType = () => {
    const type = typeName.trim();
    if (!type || !vendorId) return;

    createLightCarcasType.mutate(
      { vendor_id: vendorId, type },
      {
        onSuccess: () => {
          setOpenTypeModal(false);
          setTypeName("");
        },
      },
    );
  };

  const handleCreateUnit = () => {
    const type = unitName.trim();
    const lightCarcasTypeId = Number(unitTypeId);
    if (!type || !lightCarcasTypeId || !vendorId) return;

    createLightCarcasUnit.mutate(
      {
        vendor_id: vendorId,
        type,
        light_carcas_type_id: lightCarcasTypeId,
      },
      {
        onSuccess: () => {
          setOpenUnitModal(false);
          setUnitName("");
          setUnitTypeId("");
        },
      },
    );
  };

  return (
    <>
      <Tabs defaultValue="unit" className="w-full">
        <TabsList>
          <TabsTrigger value="unit">Light Unit</TabsTrigger>
          <TabsTrigger value="type">Light Carcas Type</TabsTrigger>
        </TabsList>

        <TabsContent value="unit" className="mt-4">
          <MasterListingTable
            title="Light Unit"
            description="Light carcas unit master entries for the current vendor."
            searchPlaceholder="Search light unit..."
            actionLabel="Add Light Unit"
            rows={lightCarcasUnitRows}
            showParent
            isLoading={isLightCarcasUnitsLoading}
            isError={isLightCarcasUnitsError}
            errorMessage={(lightCarcasUnitsError as any)?.response?.data?.error}
            onAction={() => setOpenUnitModal(true)}
          />
        </TabsContent>

        <TabsContent value="type" className="mt-4">
          <MasterListingTable
            title="Light Carcas Type"
            description="Light carcas type master entries for the current vendor."
            searchPlaceholder="Search light carcas type..."
            actionLabel="Add Light Carcas Type"
            rows={lightCarcasTypeRows}
            isLoading={isLightCarcasTypesLoading}
            isError={isLightCarcasTypesError}
            errorMessage={(lightCarcasTypesError as any)?.response?.data?.error}
            onAction={() => setOpenTypeModal(true)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={openTypeModal} onOpenChange={setOpenTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Light Carcas Type</DialogTitle>
            <DialogDescription>
              Create a new light carcas type for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="light-carcas-type-name">Light Carcas Type</Label>
              <Input
                id="light-carcas-type-name"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="Enter light carcas type"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenTypeModal(false);
                setTypeName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateType}
              disabled={
                createLightCarcasType.isPending || !typeName.trim() || !vendorId
              }
            >
              {createLightCarcasType.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openUnitModal} onOpenChange={setOpenUnitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Light Unit</DialogTitle>
            <DialogDescription>
              Create a new light unit and link it to a light carcas type.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Light Carcas Type</Label>
              <Select value={unitTypeId} onValueChange={setUnitTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select light carcas type" />
                </SelectTrigger>
                <SelectContent>
                  {(lightCarcasTypes?.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="light-unit-name">Light Unit</Label>
              <Input
                id="light-unit-name"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="Enter light unit"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenUnitModal(false);
                setUnitName("");
                setUnitTypeId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUnit}
              disabled={
                createLightCarcasUnit.isPending ||
                !unitName.trim() ||
                !unitTypeId
              }
            >
              {createLightCarcasUnit.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type OtherApplianceMasterRow = {
  srNo: number;
  id: number;
  article_number: string;
  description: string;
};

function OtherAppliancesListingTable({
  type,
  rows,
  isLoading,
  isError,
  errorMessage,
  onAction,
}: {
  type: string;
  rows: OtherApplianceMasterRow[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onAction: () => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const columns = React.useMemo<ColumnDef<OtherApplianceMasterRow>[]>(
    () => [
      {
        accessorKey: "srNo",
        header: "Sr. No.",
        cell: ({ row }) => row.original.srNo,
      },
      {
        accessorKey: "article_number",
        header: "Article Number",
        cell: ({ row }) => row.original.article_number,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => row.original.description,
      },
    ],
    [],
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
          <CardTitle>{type}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {type} master entries for the current vendor.
          </p>
        </div>

        <Button type="button" className="sm:self-start gap-2" onClick={onAction}>
          <Plus className="h-4 w-4" />
          Add {type}
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-10 text-sm text-muted-foreground">
            Loading {type.toLowerCase()}...
          </div>
        ) : isError ? (
          <div className="py-10 text-sm text-red-500">
            {errorMessage || `Failed to load ${type.toLowerCase()}.`}
          </div>
        ) : (
          <DataTable table={table} className="px-0 pt-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <ClearInput
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={`Search ${type.toLowerCase()}...`}
                className="h-9 w-full md:w-72"
              />
            </div>
          </DataTable>
        )}
      </CardContent>
    </Card>
  );
}

function OtherAppliancesTab({ type }: { type: string }) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const {
    data: otherAppliances,
    isLoading,
    isError,
    error,
  } = useOtherAppliances();
  const createOtherAppliances = useCreateOtherAppliances();

  const rows = React.useMemo<OtherApplianceMasterRow[]>(
    () =>
      (otherAppliances?.data ?? [])
        .filter((item) => item.type === type)
        .map((item, index) => ({
          srNo: index + 1,
          id: item.id,
          article_number: item.article_number,
          description: item.description,
        })),
    [otherAppliances?.data, type],
  );

  const [openModal, setOpenModal] = React.useState(false);
  const [articleNumber, setArticleNumber] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleCreate = () => {
    const article = articleNumber.trim();
    const desc = description.trim();
    if (!article || !desc || !vendorId) return;

    createOtherAppliances.mutate(
      {
        vendor_id: vendorId,
        type,
        article_number: article,
        description: desc,
      },
      {
        onSuccess: () => {
          setOpenModal(false);
          setArticleNumber("");
          setDescription("");
        },
      },
    );
  };

  return (
    <>
      <OtherAppliancesListingTable
        type={type}
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.response?.data?.error}
        onAction={() => setOpenModal(true)}
      />

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {type}</DialogTitle>
            <DialogDescription>
              Create a new {type.toLowerCase()} entry for the current vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="other-appliance-article-number">
                Article Number
              </Label>
              <Input
                id="other-appliance-article-number"
                value={articleNumber}
                onChange={(e) => setArticleNumber(e.target.value)}
                placeholder="Enter article number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="other-appliance-description">Description</Label>
              <Input
                id="other-appliance-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenModal(false);
                setArticleNumber("");
                setDescription("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createOtherAppliances.isPending ||
                !articleNumber.trim() ||
                !description.trim() ||
                !vendorId
              }
            >
              {createOtherAppliances.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OthersMastersSection() {
  const { data: otherAppliances } = useOtherAppliances();

  const applianceTypes = React.useMemo(() => {
    const seen = new Set<string>();
    const types: string[] = [];
    (otherAppliances?.data ?? []).forEach((item) => {
      if (!seen.has(item.type)) {
        seen.add(item.type);
        types.push(item.type);
      }
    });
    return types;
  }, [otherAppliances?.data]);

  return (
    <Tabs defaultValue="lights" className="w-full">
      <TabsList>
        <TabsTrigger value="lights">Lights</TabsTrigger>
        {applianceTypes.map((type) => (
          <TabsTrigger key={type} value={type}>
            {type}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="lights" className="mt-4">
        <LightMastersSection />
      </TabsContent>

      {applianceTypes.map((type) => (
        <TabsContent key={type} value={type} className="mt-4">
          <OtherAppliancesTab type={type} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default function SpecsMasterPage() {
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
                <BreadcrumbPage>Specs Master</BreadcrumbPage>
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
            Specs Master
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage carcass, shutter, hardware and other specification masters
            for large-scale project leads from one place.
          </p>
        </div>

        <SmoothTab
          defaultTabId="carcass"
          items={[
            {
              id: "carcass",
              title: "Carcass",
              color: "bg-black hover:bg-black",
              cardContent: <CarcassMastersSection />,
            },
            {
              id: "shutter",
              title: "Shutter",
              color: "bg-black hover:bg-black",
              cardContent: <ShutterMastersSection />,
            },
            {
              id: "hardware",
              title: "Hardware",
              color: "bg-black hover:bg-black",
              cardContent: <HardwareMastersSection />,
            },
            {
              id: "others",
              title: "Others",
              color: "bg-black hover:bg-black",
              cardContent: <OthersMastersSection />,
            },
          ]}
          contentHeightClass="min-h-[240px]"
          pinTabsToBottom={false}
        />
      </div>
    </>
  );
}

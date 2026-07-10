"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Box, PanelsTopLeft, Sparkles, Wrench } from "lucide-react";
import ComingSoon from "@/components/generics/ComingSoon";
import { formatDate } from "@/lib/format";
import type { LeadSpecificationEntry } from "@/api/designingStageQueries";
import AssignToPicker from "@/components/assign-to-picker";
import { useAppSelector } from "@/redux/store";
import {
  useCarcassTypes,
  useCarcasMaterials,
  useShutterMaterials,
  useShutterTypes,
} from "@/hooks/useTypesMaster";
import {
  useLeadCarcassMaterialMappings,
  useLeadShutterMaterialMappings,
  useUpsertLeadCarcassMaterialMapping,
  useUpsertLeadShutterMaterialMapping,
} from "@/hooks/designing-stage/designing-leads-hooks";
import {
  fetchCarcassMaterialFinishes,
  fetchShutterMaterialFinishes,
} from "@/api/typesMasterApi";
import { useQueries } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";

interface ViewSpecsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specification: LeadSpecificationEntry | null;
}

type CarcassRow = {
  localId: string;
  id?: number;
  carcass_type_id: string;
  carcas_material_id: string;
  carcass_material_finish_id: string;
};

type ShutterRow = {
  localId: string;
  id?: number;
  shutter_type_id: string;
  shutter_material_id: string;
  shutter_material_finish_id: string;
};

const makeBlankCarcassRow = (): CarcassRow => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  carcass_type_id: "",
  carcas_material_id: "",
  carcass_material_finish_id: "",
});

const makeBlankShutterRow = (): ShutterRow => ({
  localId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  shutter_type_id: "",
  shutter_material_id: "",
  shutter_material_finish_id: "",
});

const pickerClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-sm";

const ViewSpecsModal: React.FC<ViewSpecsModalProps> = ({
  open,
  onOpenChange,
  specification,
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: carcassTypesData } = useCarcassTypes();
  const { data: carcasMaterialsData } = useCarcasMaterials();
  const { data: shutterTypesData } = useShutterTypes();
  const { data: shutterMaterialsData } = useShutterMaterials();
  const { data: carcassMappingsData } = useLeadCarcassMaterialMappings(
    vendorId,
    specification?.lead_id,
  );
  const { data: shutterMappingsData } = useLeadShutterMaterialMappings(
    vendorId,
    specification?.lead_id,
  );
  const upsertCarcassMapping = useUpsertLeadCarcassMaterialMapping();
  const upsertShutterMapping = useUpsertLeadShutterMaterialMapping();
  const [carcassRows, setCarcassRows] = React.useState<CarcassRow[]>([]);
  const [shutterRows, setShutterRows] = React.useState<ShutterRow[]>([]);

  const carcassTypes = carcassTypesData?.data ?? [];
  const carcasMaterials = carcasMaterialsData?.data ?? [];
  const shutterTypes = shutterTypesData?.data ?? [];
  const shutterMaterials = shutterMaterialsData?.data ?? [];
  const carcassMappings = React.useMemo(
    () => carcassMappingsData ?? [],
    [carcassMappingsData],
  );
  const shutterMappings = React.useMemo(
    () => shutterMappingsData ?? [],
    [shutterMappingsData],
  );

  React.useEffect(() => {
    if (!specification) {
      setCarcassRows([]);
      setShutterRows([]);
      return;
    }

    const persistedRows: CarcassRow[] = carcassMappings.map((item) => ({
      localId: `saved-${item.id}`,
      id: item.id,
      carcass_type_id: item.carcass_type_id ? String(item.carcass_type_id) : "",
      carcas_material_id: item.carcas_material_id
        ? String(item.carcas_material_id)
        : "",
      carcass_material_finish_id: item.carcass_material_finish_id
        ? String(item.carcass_material_finish_id)
        : "",
    }));

    setCarcassRows([...persistedRows, makeBlankCarcassRow()]);
  }, [carcassMappings, specification?.id]);

  React.useEffect(() => {
    if (!specification) {
      setShutterRows([]);
      return;
    }

    const persistedRows: ShutterRow[] = shutterMappings.map((item) => ({
      localId: `saved-${item.id}`,
      id: item.id,
      shutter_type_id: item.shutter_type_id ? String(item.shutter_type_id) : "",
      shutter_material_id: item.shutter_material_id
        ? String(item.shutter_material_id)
        : "",
      shutter_material_finish_id: item.shutter_material_finish_id
        ? String(item.shutter_material_finish_id)
        : "",
    }));

    setShutterRows([...persistedRows, makeBlankShutterRow()]);
  }, [shutterMappings, specification?.id]);

  const finishQueries = useQueries({
    queries: carcassRows.map((row) => {
      const materialId = Number(row.carcas_material_id);
      return {
        queryKey: ["carcassMaterialFinishes", materialId],
        queryFn: () => fetchCarcassMaterialFinishes(materialId),
        enabled: materialId > 0,
      };
    }),
  });

  const shutterFinishQueries = useQueries({
    queries: shutterRows.map((row) => {
      const materialId = Number(row.shutter_material_id);
      return {
        queryKey: ["shutterMaterialFinishes", materialId],
        queryFn: () => fetchShutterMaterialFinishes(materialId),
        enabled: materialId > 0,
      };
    }),
  });

  const saveCarcassRowIfComplete = React.useCallback(
    async (row: CarcassRow) => {
      if (
        !vendorId ||
        !userId ||
        !specification?.lead_id ||
        !row.carcass_type_id ||
        !row.carcas_material_id ||
        !row.carcass_material_finish_id
      ) {
        return;
      }

      try {
        await upsertCarcassMapping.mutateAsync({
          id: row.id,
          vendor_id: vendorId,
          lead_id: specification.lead_id,
          carcass_type_id: Number(row.carcass_type_id),
          carcas_material_id: Number(row.carcas_material_id),
          carcass_material_finish_id: Number(row.carcass_material_finish_id),
          created_by: userId,
        });
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to save carcass mapping.",
          type: "error",
        });
      }
    },
    [specification?.lead_id, upsertCarcassMapping, userId, vendorId],
  );

  const updateCarcassRow = React.useCallback(
    (
      localId: string,
      field: keyof Omit<CarcassRow, "localId" | "id">,
      value: string,
    ) => {
      let nextRow: CarcassRow | null = null;
      let duplicateMessage = "";

      setCarcassRows((prev) =>
        prev.map((row) => {
          if (row.localId !== localId) return row;

          const updatedRow: CarcassRow = { ...row, [field]: value };
          if (field === "carcas_material_id") {
            updatedRow.carcass_material_finish_id = "";
          }

          const isComplete =
            !!updatedRow.carcass_type_id &&
            !!updatedRow.carcas_material_id &&
            !!updatedRow.carcass_material_finish_id;

          if (isComplete) {
            const isDuplicate = prev.some(
              (otherRow) =>
                otherRow.localId !== localId &&
                otherRow.carcass_type_id === updatedRow.carcass_type_id &&
                otherRow.carcas_material_id === updatedRow.carcas_material_id &&
                otherRow.carcass_material_finish_id ===
                  updatedRow.carcass_material_finish_id,
            );

            if (isDuplicate) {
              duplicateMessage =
                "This carcass type, material, and finish combination has already been added.";
              return row;
            }
          }

          nextRow = updatedRow;
          return updatedRow;
        }),
      );

      if (duplicateMessage) {
        toastManager.add({
          title: duplicateMessage,
          type: "error",
        });
        return;
      }

      if (nextRow) {
        void saveCarcassRowIfComplete(nextRow);
      }
    },
    [saveCarcassRowIfComplete],
  );

  const saveShutterRowIfComplete = React.useCallback(
    async (row: ShutterRow) => {
      if (
        !vendorId ||
        !userId ||
        !specification?.lead_id ||
        !row.shutter_type_id ||
        !row.shutter_material_id ||
        !row.shutter_material_finish_id
      ) {
        return;
      }

      try {
        await upsertShutterMapping.mutateAsync({
          id: row.id,
          vendor_id: vendorId,
          lead_id: specification.lead_id,
          shutter_type_id: Number(row.shutter_type_id),
          shutter_material_id: Number(row.shutter_material_id),
          shutter_material_finish_id: Number(row.shutter_material_finish_id),
          created_by: userId,
        });
      } catch (error: any) {
        toastManager.add({
          title:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to save shutter mapping.",
          type: "error",
        });
      }
    },
    [specification?.lead_id, upsertShutterMapping, userId, vendorId],
  );

  const updateShutterRow = React.useCallback(
    (
      localId: string,
      field: keyof Omit<ShutterRow, "localId" | "id">,
      value: string,
    ) => {
      let nextRow: ShutterRow | null = null;
      let duplicateMessage = "";

      setShutterRows((prev) =>
        prev.map((row) => {
          if (row.localId !== localId) return row;

          const updatedRow: ShutterRow = { ...row, [field]: value };
          if (field === "shutter_material_id") {
            updatedRow.shutter_material_finish_id = "";
          }

          const isComplete =
            !!updatedRow.shutter_type_id &&
            !!updatedRow.shutter_material_id &&
            !!updatedRow.shutter_material_finish_id;

          if (isComplete) {
            const isDuplicate = prev.some(
              (otherRow) =>
                otherRow.localId !== localId &&
                otherRow.shutter_type_id === updatedRow.shutter_type_id &&
                otherRow.shutter_material_id ===
                  updatedRow.shutter_material_id &&
                otherRow.shutter_material_finish_id ===
                  updatedRow.shutter_material_finish_id,
            );

            if (isDuplicate) {
              duplicateMessage =
                "This shutter type, material, and finish combination has already been added.";
              return row;
            }
          }

          nextRow = updatedRow;
          return updatedRow;
        }),
      );

      if (duplicateMessage) {
        toastManager.add({
          title: duplicateMessage,
          type: "error",
        });
        return;
      }

      if (nextRow) {
        void saveShutterRowIfComplete(nextRow);
      }
    },
    [saveShutterRowIfComplete],
  );

  if (!specification) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="">
          <h2 className="text-lg font-semibold tracking-tight">
            {specification.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            Created on {formatDate(specification.created_at)}
          </p>
        </DialogHeader>

        <Tabs defaultValue="carcass" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="h-auto gap-2 px-1.5 py-1.5">
            <TabsTrigger value="carcass">
              <Box size={16} className="mr-1 opacity-60" />
              Carcass
            </TabsTrigger>
            <TabsTrigger value="shutter">
              <PanelsTopLeft size={16} className="mr-1 opacity-60" />
              Shutter
            </TabsTrigger>
            <TabsTrigger value="hardware">
              <Wrench size={16} className="mr-1 opacity-60" />
              Hardware
            </TabsTrigger>
            <TabsTrigger value="others">
              <Sparkles size={16} className="mr-1 opacity-60" />
              Others
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carcass" className="flex-1 overflow-y-auto">
            <div className="rounded-xl border border-border overflow-hidden mt-3">
              {/* <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <h3 className="text-sm font-semibold">Carcass Specifications</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCarcassRows((prev) => [...prev, makeBlankCarcassRow()])
                  }
                >
                  Add Row
                </Button>
              </div> */}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-700">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-center font-bold text-white">
                        Carcass Type
                      </th>
                      <th className="px-4 py-3 text-center font-bold text-white">
                        Carcass Material
                      </th>
                      <th className="px-4 py-3 text-center font-bold text-white">
                        Carcass Material Finish
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {carcassRows.map((row, index) => {
                      const finishOptions = finishQueries[index]?.data?.data ?? [];

	                      return (
	                        <tr key={row.localId} className="border-b last:border-b-0">
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={carcassTypes.map((type) => ({
	                                id: type.id,
	                                label: type.name,
	                              }))}
	                              value={row.carcass_type_id ? Number(row.carcass_type_id) : undefined}
	                              onChange={(value) =>
	                                updateCarcassRow(
	                                  row.localId,
	                                  "carcass_type_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              placeholder="Search carcass type..."
	                              emptyLabel="Select carcass type"
	                              className={pickerClassName}
	                            />
	                          </td>
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={carcasMaterials.map((material) => ({
	                                id: material.id,
	                                label: material.name,
	                              }))}
	                              value={
	                                row.carcas_material_id
	                                  ? Number(row.carcas_material_id)
	                                  : undefined
	                              }
	                              onChange={(value) =>
	                                updateCarcassRow(
	                                  row.localId,
	                                  "carcas_material_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              placeholder="Search carcass material..."
	                              emptyLabel="Select carcass material"
	                              className={pickerClassName}
	                            />
	                          </td>
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={finishOptions.map((finish) => ({
	                                id: finish.id,
	                                label: finish.name,
	                              }))}
	                              value={
	                                row.carcass_material_finish_id
	                                  ? Number(row.carcass_material_finish_id)
	                                  : undefined
	                              }
	                              onChange={(value) =>
	                                updateCarcassRow(
	                                  row.localId,
	                                  "carcass_material_finish_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              disabled={!row.carcas_material_id}
	                              placeholder={
	                                row.carcas_material_id
	                                  ? "Search carcass material finish..."
	                                  : "Select material first"
	                              }
	                              emptyLabel={
	                                row.carcas_material_id
	                                  ? "Select carcass material finish"
	                                  : "Select material first"
	                              }
	                              className={pickerClassName}
	                            />
	                          </td>
	                        </tr>
	                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="shutter" className="flex-1 overflow-y-auto">
            <div className="rounded-xl border border-border overflow-hidden mt-3">
              {/* <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <h3 className="text-sm font-semibold">Shutter Specifications</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setShutterRows((prev) => [...prev, makeBlankShutterRow()])
                  }
                >
                  Add Row
                </Button>
              </div> */}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-700">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Shutter Type
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Shutter Material
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-white">
                        Shutter Material Finish
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shutterRows.map((row, index) => {
                      const finishOptions =
                        shutterFinishQueries[index]?.data?.data ?? [];

	                      return (
	                        <tr key={row.localId} className="border-b last:border-b-0">
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={shutterTypes.map((type) => ({
	                                id: type.id,
	                                label: type.name,
	                              }))}
	                              value={row.shutter_type_id ? Number(row.shutter_type_id) : undefined}
	                              onChange={(value) =>
	                                updateShutterRow(
	                                  row.localId,
	                                  "shutter_type_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              placeholder="Search shutter type..."
	                              emptyLabel="Select shutter type"
	                              className={pickerClassName}
	                            />
	                          </td>
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={shutterMaterials.map((material) => ({
	                                id: material.id,
	                                label: material.name,
	                              }))}
	                              value={
	                                row.shutter_material_id
	                                  ? Number(row.shutter_material_id)
	                                  : undefined
	                              }
	                              onChange={(value) =>
	                                updateShutterRow(
	                                  row.localId,
	                                  "shutter_material_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              placeholder="Search shutter material..."
	                              emptyLabel="Select shutter material"
	                              className={pickerClassName}
	                            />
	                          </td>
	                          <td className="px-4 py-3 align-top">
	                            <AssignToPicker
	                              data={finishOptions.map((finish) => ({
	                                id: finish.id,
	                                label: finish.name,
	                              }))}
	                              value={
	                                row.shutter_material_finish_id
	                                  ? Number(row.shutter_material_finish_id)
	                                  : undefined
	                              }
	                              onChange={(value) =>
	                                updateShutterRow(
	                                  row.localId,
	                                  "shutter_material_finish_id",
	                                  value ? String(value) : "",
	                                )
	                              }
	                              disabled={!row.shutter_material_id}
	                              placeholder={
	                                row.shutter_material_id
	                                  ? "Search shutter material finish..."
	                                  : "Select material first"
	                              }
	                              emptyLabel={
	                                row.shutter_material_id
	                                  ? "Select shutter material finish"
	                                  : "Select material first"
	                              }
	                              className={pickerClassName}
	                            />
	                          </td>
	                        </tr>
	                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="hardware" className="flex-1 overflow-y-auto">
            <ComingSoon
              heading="No Hardware Specifications"
              description="Hardware specifications for this entry will show up here once added."
            />
          </TabsContent>
          <TabsContent value="others" className="flex-1 overflow-y-auto">
            <ComingSoon
              heading="No Other Specifications"
              description="Other specifications for this entry will show up here once added."
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ViewSpecsModal;

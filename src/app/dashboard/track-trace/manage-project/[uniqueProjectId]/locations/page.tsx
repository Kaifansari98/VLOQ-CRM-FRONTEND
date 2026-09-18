"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toastManager } from "@/components/ui/toast";
import { useAppSelector } from "@/redux/store";
import {
  useDownloadMultiLocationTemplate,
  useImportProjectLocationsExcel,
  useProjectLocations,
  useSaveProjectLocations,
} from "@/hooks/track-trace-hooks/useTrackTraceMasterHooks";

type EditableLocationRow = {
  rowKey: string;
  location_name: string;
  quantities: Record<string, number | "">;
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

export default function ProjectLocationsPage() {
  const router = useRouter();
  const params = useParams<{ uniqueProjectId: string }>();
  const uniqueProjectId = params.uniqueProjectId;
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const rowSequence = useRef(0);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useProjectLocations(uniqueProjectId, vendorId);
  const {
    mutate: saveLocations,
    isPending: isSaving,
  } = useSaveProjectLocations();
  const {
    mutate: importLocationExcel,
    isPending: isImporting,
  } = useImportProjectLocationsExcel();
  const {
    mutate: downloadTemplate,
    isPending: isDownloading,
  } = useDownloadMultiLocationTemplate();

  const [rows, setRows] = useState<EditableLocationRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const enteredQuantities = useMemo(() => {
    if (!data) return {} as Record<string, number>;

    return Object.fromEntries(
      data.group_names.map((groupName) => {
        const total = rows.reduce((sum, row) => {
          const value = row.quantities[groupName];
          const quantity = value === "" ? 0 : Number(value);

          return sum + (Number.isFinite(quantity) ? quantity : 0);
        }, 0);

        return [groupName, total];
      })
    ) as Record<string, number>;
  }, [data, rows]);

  const createRowKey = useCallback(() => {
    rowSequence.current += 1;
    return `location-row-${rowSequence.current}`;
  }, []);

  useEffect(() => {
    if (!data) return;

    setRows(
      data.locations.map((location) => ({
        rowKey: createRowKey(),
        location_name: location.location_name,
        quantities: Object.fromEntries(
          data.group_names.map((groupName) => [
            groupName,
            location.quantities[groupName] ?? 0,
          ])
        ),
      }))
    );
  }, [createRowKey, data]);

  const addLocation = () => {
    if (!data) return;

    setRows((currentRows) => [
      ...currentRows,
      {
        rowKey: createRowKey(),
        location_name: "",
        quantities: Object.fromEntries(
          data.group_names.map((groupName) => [groupName, 0])
        ),
      },
    ]);
  };

  const updateLocationName = (rowKey: string, value: string) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.rowKey === rowKey ? { ...row, location_name: value } : row
      )
    );
  };

  const updateQuantity = (
    rowKey: string,
    groupName: string,
    value: string
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.rowKey === rowKey
          ? {
              ...row,
              quantities: {
                ...row.quantities,
                [groupName]: value === "" ? "" : Number(value),
              },
            }
          : row
      )
    );
  };

  const removeLocation = (rowKey: string) => {
    setRows((currentRows) =>
      currentRows.filter((row) => row.rowKey !== rowKey)
    );
  };

  const validateRows = () => {
    if (!data) return null;

    const seenLocations = new Set<string>();
    const allocatedQuantities = Object.fromEntries(
      data.group_names.map((groupName) => [groupName, 0])
    ) as Record<string, number>;

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const locationName = row.location_name.trim();
      const normalizedLocation = locationName.toLocaleLowerCase();

      if (!locationName) {
        toastManager.add({
          title: `Location Name is required in row ${index + 1}`,
          type: "error",
        });
        return null;
      }

      if (locationName.length > 200) {
        toastManager.add({
          title: `Location Name must not exceed 200 characters in row ${index + 1}`,
          type: "error",
        });
        return null;
      }

      if (seenLocations.has(normalizedLocation)) {
        toastManager.add({
          title: `Duplicate Location Name: ${locationName}`,
          type: "error",
        });
        return null;
      }
      seenLocations.add(normalizedLocation);

      for (const groupName of data.group_names) {
        const quantity = row.quantities[groupName];
        const normalizedQuantity = quantity === "" ? 0 : Number(quantity);

        if (
          !Number.isInteger(normalizedQuantity) ||
          normalizedQuantity < 0 ||
          normalizedQuantity > 2147483647
        ) {
          toastManager.add({
            title: `${groupName} quantity must be an integer between 0 and 2147483647 in row ${index + 1}`,
            type: "error",
          });
          return null;
        }

        allocatedQuantities[groupName] += normalizedQuantity;

        if (
          allocatedQuantities[groupName] >
          data.group_quantity_limits[groupName]
        ) {
          toastManager.add({
            title: `${groupName} total cannot exceed CutList quantity ${data.group_quantity_limits[groupName]}. Entered total is ${allocatedQuantities[groupName]}`,
            type: "error",
          });
          return null;
        }
      }
    }

    return rows.map((row) => ({
      location_name: row.location_name.trim(),
      quantities: Object.fromEntries(
        data.group_names.map((groupName) => [
          groupName,
          row.quantities[groupName] === ""
            ? 0
            : Number(row.quantities[groupName]),
        ])
      ),
    }));
  };

  const handleSave = () => {
    if (!vendorId) return;

    const locations = validateRows();
    if (!locations) return;

    saveLocations(
      {
        uniqueProjectId,
        payload: {
          vendorId,
          locations,
        },
      },
      {
        onSuccess: (response: any) => {
          toastManager.add({
            title: response?.message || "Locations saved successfully",
            type: "success",
          });
        },
        onError: (saveError: any) => {
          toastManager.add({
            title: getErrorMessage(saveError, "Failed to save locations"),
            type: "error",
          });
        },
      }
    );
  };

  const handleImport = () => {
    if (!vendorId || !selectedFile) return;

    importLocationExcel(
      {
        uniqueProjectId,
        vendorId,
        file: selectedFile,
      },
      {
        onSuccess: (response: any) => {
          toastManager.add({
            title: response?.message || "Location Excel imported successfully",
            type: "success",
          });
          setSelectedFile(null);
          setFileInputKey((value) => value + 1);
        },
        onError: (importError: any) => {
          toastManager.add({
            title: getErrorMessage(
              importError,
              "Failed to import Location Excel"
            ),
            type: "error",
          });
        },
      }
    );
  };

  const handleDownload = () => {
    if (!vendorId) return;

    downloadTemplate(
      { uniqueProjectId, vendorId },
      {
        onSuccess: ({ blob, fileName }) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");

          link.href = downloadUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);
        },
        onError: (downloadError: any) => {
          toastManager.add({
            title: getErrorMessage(
              downloadError,
              "Failed to download Location Excel"
            ),
            type: "error",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <main className="space-y-4 p-4 md:p-6">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <Info />
          <AlertTitle>Unable to load locations</AlertTitle>
          <AlertDescription>
            {getErrorMessage(error, "Multi Location data could not be loaded")}
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Back to edit project"
            onClick={() =>
              router.push(
                `/dashboard/track-trace/manage-project/${uniqueProjectId}/edit`
              )
            }
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-indigo-600" />
              <h1 className="text-xl font-bold">Multi Location Setup</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.project_name}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isDownloading}
          onClick={handleDownload}
        >
          {isDownloading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Download Excel Template
        </Button>
      </div>

      <Alert>
        <Info />
        <AlertTitle>How quantities are entered</AlertTitle>
        <AlertDescription>
          Each row is a location. Enter a whole number for each product group;
          blank quantity cells are saved as zero. The total allocated across
          all locations cannot exceed the group quantity in this project&apos;s
          CutList.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="size-5 text-emerald-600" />
            Import Location Excel
          </CardTitle>
          <CardDescription>
            Upload the completed template. A successful import replaces the
            current location quantity table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              key={fileInputKey}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={isImporting}
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
              className="max-w-xl"
            />
            <Button
              type="button"
              disabled={!selectedFile || isImporting}
              onClick={handleImport}
            >
              {isImporting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              Import Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Manual Entry</CardTitle>
              <CardDescription className="mt-1">
                Add locations and edit product quantities directly in the table.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={data.group_names.length === 0 || isSaving}
              onClick={addLocation}
            >
              <Plus className="mr-2 size-4" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.group_names.length === 0 ? (
            <Alert>
              <Info />
              <AlertTitle>No CutList groups found</AlertTitle>
              <AlertDescription>
                Add group names to the project CutList before configuring
                locations.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="sticky left-0 z-20 w-16 min-w-16 bg-muted/95 text-center">
                      Sr. No.
                    </TableHead>
                    <TableHead className="sticky left-16 z-10 min-w-[220px] bg-muted/95">
                      Location Name
                    </TableHead>
                    {data.group_names.map((groupName) => (
                      <TableHead
                        key={groupName}
                        className="min-w-[150px] text-center"
                      >
                        <span className="block">{groupName}</span>
                        <span className="block text-xs font-normal text-muted-foreground">
                          Maximum: {data.group_quantity_limits[groupName]}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="w-[72px] text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={data.group_names.length + 3}
                        className="h-28 text-center text-muted-foreground"
                      >
                        No locations added. Select Add Location to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, rowIndex) => (
                      <TableRow key={row.rowKey}>
                        <TableCell className="sticky left-0 z-20 bg-card text-center font-medium text-muted-foreground">
                          {rowIndex + 1}
                        </TableCell>
                        <TableCell className="sticky left-16 z-10 bg-card">
                          <Input
                            value={row.location_name}
                            placeholder="e.g., Ground Floor"
                            maxLength={200}
                            disabled={isSaving || isImporting}
                            onChange={(event) =>
                              updateLocationName(row.rowKey, event.target.value)
                            }
                            className="min-w-[200px]"
                          />
                        </TableCell>
                        {data.group_names.map((groupName) => (
                          <TableCell key={groupName}>
                            <Input
                              type="number"
                              min={0}
                              max={2147483647}
                              step={1}
                              inputMode="numeric"
                              value={row.quantities[groupName] ?? ""}
                              disabled={isSaving || isImporting}
                              onChange={(event) =>
                                updateQuantity(
                                  row.rowKey,
                                  groupName,
                                  event.target.value
                                )
                              }
                              className="min-w-[120px] text-center"
                              aria-label={`${groupName} quantity for ${row.location_name || "location"}`}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isSaving || isImporting}
                            aria-label="Remove location"
                            onClick={() => removeLocation(row.rowKey)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="sticky left-0 z-20 bg-muted text-center">
                      —
                    </TableCell>
                    <TableCell className="sticky left-16 z-10 bg-muted font-semibold">
                      Product Totals
                    </TableCell>
                    {data.group_names.map((groupName) => {
                      const enteredQuantity = enteredQuantities[groupName] ?? 0;
                      const pendingQuantity =
                        data.group_quantity_limits[groupName] - enteredQuantity;

                      return (
                        <TableCell key={groupName} className="text-center">
                          <div className="font-semibold">
                            Entered: {enteredQuantity}
                          </div>
                          <div
                            className={
                              pendingQuantity < 0
                                ? "text-xs font-semibold text-destructive"
                                : "text-xs text-muted-foreground"
                            }
                          >
                            Pending: {pendingQuantity}
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={
                isSaving ||
                isImporting ||
                data.group_names.length === 0
              }
              onClick={handleSave}
            >
              {isSaving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Save Locations
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

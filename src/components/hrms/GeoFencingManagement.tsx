"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  HardHat,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  fetchAttendanceLocations,
  createAttendanceLocation,
  updateAttendanceLocation,
  deleteAttendanceLocation,
  assignLocationsToEmployees,
  fetchAssignableEmployees,
  type AttendanceLocationItem,
  type CreateAttendanceLocationPayload,
} from "@/api/hrms-geo-locations";
import { LocationMapPicker } from "./LocationMapPicker";

export default function GeoFencingManagement() {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);

  const [search, setSearch] = useState("");
  const [typeTab, setTypeTab] = useState<"ALL" | "OFFICE" | "SITE">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal states
  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AttendanceLocationItem | null>(null);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningLocation, setAssigningLocation] = useState<AttendanceLocationItem | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [locationType, setLocationType] = useState<"OFFICE" | "SITE">("OFFICE");
  const [franchiseId, setFranchiseId] = useState<string>("none");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number>(19.076);
  const [longitude, setLongitude] = useState<number>(72.8777);
  const [radiusMeters, setRadiusMeters] = useState<number>(100);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Assign employee state
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const locationsQuery = useQuery({
    queryKey: ["attendance-locations", user?.vendor_id, typeTab, search],
    queryFn: () =>
      fetchAttendanceLocations({
        location_type: typeTab === "ALL" ? undefined : typeTab,
        search: search.trim() || undefined,
      }),
    enabled: !!user?.vendor_id,
  });

  const locations = locationsQuery.data || [];

  // Fetch employees for assignment
  const employeesQuery = useQuery({
    queryKey: ["vendor-active-employees", user?.vendor_id],
    queryFn: () => fetchAssignableEmployees(),
    enabled: assignModalOpen && !!user?.vendor_id,
  });

  const resetForm = () => {
    setEditingLocation(null);
    setName("");
    setLocationType("OFFICE");
    setFranchiseId("none");
    setAddress("");
    setLatitude(19.076);
    setLongitude(72.8777);
    setRadiusMeters(100);
    setIsActive(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setLocationFormOpen(true);
  };

  const handleOpenEdit = (loc: AttendanceLocationItem) => {
    setEditingLocation(loc);
    setName(loc.name);
    setLocationType(loc.location_type);
    setFranchiseId(loc.franchise_id ? String(loc.franchise_id) : "none");
    setAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setRadiusMeters(loc.radius_meters);
    setIsActive(loc.is_active);
    setLocationFormOpen(true);
  };

  const handleOpenAssign = (loc: AttendanceLocationItem) => {
    setAssigningLocation(loc);
    const existingIds = (loc.userAssignments || []).map((a) => a.user_id);
    setSelectedUserIds(existingIds);
    setEmployeeSearch("");
    setAssignModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastManager.add({ title: "Please enter location name", type: "error" });
      return;
    }
    if (!address.trim()) {
      toastManager.add({ title: "Please enter address", type: "error" });
      return;
    }

    try {
      if (editingLocation) {
        await updateAttendanceLocation(editingLocation.id, {
          name: name.trim(),
          location_type: locationType,
          franchise_id: franchiseId === "none" ? null : Number(franchiseId),
          address: address.trim(),
          latitude,
          longitude,
          radius_meters: radiusMeters,
          is_active: isActive,
        });
        toastManager.add({ title: "Location updated successfully", type: "success" });
      } else {
        await createAttendanceLocation({
          name: name.trim(),
          location_type: locationType,
          franchise_id: franchiseId === "none" ? null : Number(franchiseId),
          address: address.trim(),
          latitude,
          longitude,
          radius_meters: radiusMeters,
          is_active: isActive,
        });
        toastManager.add({ title: "Location created successfully", type: "success" });
      }
      queryClient.invalidateQueries({ queryKey: ["attendance-locations"] });
      setLocationFormOpen(false);
      resetForm();
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || "Failed to save location",
        type: "error",
      });
    }
  };

  const handleSaveAssignments = async () => {
    if (!assigningLocation) return;
    try {
      await assignLocationsToEmployees({
        location_id: assigningLocation.id,
        user_ids: selectedUserIds,
      });
      toastManager.add({
        title: `Assigned ${selectedUserIds.length} employee(s) to ${assigningLocation.name}`,
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["attendance-locations"] });
      setAssignModalOpen(false);
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || "Failed to assign employees",
        type: "error",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this geo-fence location?")) return;
    try {
      await deleteAttendanceLocation(id);
      toastManager.add({ title: "Location removed successfully", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["attendance-locations"] });
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || "Could not delete location",
        type: "error",
      });
    }
  };

  // Pagination calculations
  const totalCount = locations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const visible = locations.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbPage>HRMS Management</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Attendance Geo-Fencing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <AnimatedThemeToggler />
        </div>
      </header>

      <main className="flex-1 bg-muted/20 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Location Security & Geo-Perimeter
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Attendance Geo-Fencing
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Define authorized office and project site perimeters for GPS-verified employee attendance.
              </p>
            </div>
            <Button
              onClick={handleOpenCreate}
              className="gap-2 bg-white text-black hover:bg-neutral-100 border border-border shadow-xs dark:bg-white dark:text-black dark:hover:bg-neutral-100"
            >
              <Plus className="size-4" />
              Add Location
            </Button>
          </div>

          {/* Metric Cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Locations</span>
                <MapPin className="size-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold">{locations.length}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Configured attendance zones</p>
            </div>

            <div className="rounded-xl border bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Offices & Branches</span>
                <Building2 className="size-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-bold">
                {locations.filter((l) => l.location_type === "OFFICE").length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Head office & franchise sites</p>
            </div>

            <div className="rounded-xl border bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Project / Client Sites</span>
                <HardHat className="size-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold">
                {locations.filter((l) => l.location_type === "SITE").length}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Field & client installation sites</p>
            </div>
          </div>

          {/* Table Container */}
          <section className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6">
            {/* Filter controls */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <Tabs value={typeTab} onValueChange={(val) => { setTypeTab(val as any); setPage(1); }}>
                <TabsList className="h-9">
                  <TabsTrigger value="ALL" className="text-xs">All Locations</TabsTrigger>
                  <TabsTrigger value="OFFICE" className="text-xs">Office / Branch</TabsTrigger>
                  <TabsTrigger value="SITE" className="text-xs">Project Sites</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search location name or address…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-9 pl-9 text-xs"
                />
              </div>
            </div>

            {/* Table */}
            {locationsQuery.isLoading ? (
              <div className="py-14 text-center text-sm text-muted-foreground">Loading locations…</div>
            ) : locations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="rounded-full bg-muted p-4">
                  <MapPin className="size-8 text-muted-foreground/60" />
                </div>
                <p className="mt-3 text-sm font-medium">No geo-fence locations yet</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Add an office or site location to start verifying employee attendance via GPS coordinates.
                </p>
                <Button
                  size="sm"
                  onClick={handleOpenCreate}
                  className="mt-4 gap-1.5 bg-white text-black hover:bg-neutral-100 border border-border shadow-xs dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs"
                >
                  <Plus className="size-3.5" />
                  Add First Location
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="border-b bg-muted/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Location Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Address & Coordinates</th>
                      <th className="px-4 py-3">Allowed Radius</th>
                      <th className="px-4 py-3">Assigned Team</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {visible.map((loc) => (
                      <tr key={loc.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5 font-medium">
                          <p className="text-xs font-semibold text-foreground">{loc.name}</p>
                          {loc.franchise?.franchise_name && (
                            <p className="text-[10px] text-muted-foreground">
                              Branch: {loc.franchise.franchise_name}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium",
                              loc.location_type === "SITE"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40"
                            )}
                          >
                            {loc.location_type === "SITE" ? <HardHat className="size-3" /> : <Building2 className="size-3" />}
                            {loc.location_type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <p className="max-w-xs truncate text-xs text-foreground">{loc.address}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono">
                          <span className="font-semibold">{loc.radius_meters}m</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <button
                            onClick={() => handleOpenAssign(loc)}
                            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                          >
                            <Users className="size-3.5" />
                            {loc._count?.userAssignments ?? (loc.userAssignments?.length || 0)} employee(s)
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium border",
                              loc.is_active
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-900/40 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {loc.is_active ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                            {loc.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleOpenAssign(loc)}
                              title="Assign employees"
                            >
                              <UserCheck className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleOpenEdit(loc)}
                              title="Edit location"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(loc.id)}
                              title="Delete location"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div className="flex flex-col-reverse items-center justify-between gap-4 border-t pt-4 sm:flex-row sm:gap-8">
                <div className="text-xs text-muted-foreground">
                  Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{" "}
                  {Math.min(page * pageSize, totalCount)} of {totalCount} location(s)
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8">
                  <div className="flex items-center space-x-2">
                    <p className="whitespace-nowrap text-xs font-medium">Rows per page</p>
                    <Select
                      value={`${pageSize}`}
                      onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}
                    >
                      <SelectTrigger className="h-8 w-[4.5rem] text-xs">
                        <SelectValue placeholder={pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 50, 100].map((size) => (
                          <SelectItem key={size} value={`${size}`} className="text-xs">
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-center text-xs font-medium">
                    Page {page} of {totalPages}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage(1)}
                      disabled={page <= 1}
                    >
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage(totalPages)}
                      disabled={page >= totalPages}
                    >
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Create / Edit Location Modal */}
      <Dialog open={locationFormOpen} onOpenChange={setLocationFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <MapPin className="size-4 text-emerald-600" />
              {editingLocation ? "Edit Attendance Location" : "Create Geo-Fence Location"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define the coordinates and allowed check-in radius for this office or site.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Location Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Mumbai Head Office or Pune Site Alpha"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Location Type</Label>
                <Select value={locationType} onValueChange={(val: any) => setLocationType(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICE" className="text-xs">Office / Branch</SelectItem>
                    <SelectItem value="SITE" className="text-xs">Project Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Allowed Radius (meters)</Label>
                <Select
                  value={String(radiusMeters)}
                  onValueChange={(val) => setRadiusMeters(Number(val))}
                >
                  <SelectTrigger className="h-9 text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50" className="text-xs">50 meters</SelectItem>
                    <SelectItem value="100" className="text-xs">100 meters (Standard)</SelectItem>
                    <SelectItem value="200" className="text-xs">200 meters</SelectItem>
                    <SelectItem value="300" className="text-xs">300 meters</SelectItem>
                    <SelectItem value="500" className="text-xs">500 meters (Wide)</SelectItem>
                    <SelectItem value="1000" className="text-xs">1000 meters (1 km)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Complete Address <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary gap-1"
                  onClick={() => setMapPickerOpen(true)}
                >
                  <MapPin className="size-3" />
                  Pick on Map
                </Button>
              </div>
              <Input
                placeholder="Building name, street, locality, city"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-xs font-medium">Active Status</p>
                <p className="text-[11px] text-muted-foreground">
                  Inactive locations cannot be used by employees to mark attendance.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setLocationFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {editingLocation ? "Save Changes" : "Create Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Map Picker Modal */}
      <LocationMapPicker
        open={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        latitude={latitude}
        longitude={longitude}
        radiusMeters={radiusMeters}
        address={address}
        onSelect={(res) => {
          setLatitude(res.latitude);
          setLongitude(res.longitude);
          if (res.address) setAddress(res.address);
        }}
      />

      {/* Assign Employees Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-base flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              Assign Employees to {assigningLocation?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Employees selected here will be permitted to mark attendance from this geo-fence.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 border-b bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search employee name or email…"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[220px] max-h-[360px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Quick Select All */}
            <div className="flex items-center justify-between pb-2 border-b px-1 text-xs">
              <span className="text-muted-foreground font-medium">
                {selectedUserIds.length} selected
              </span>
              <button
                type="button"
                className="text-primary hover:underline text-[11px] font-medium"
                onClick={() => {
                  const all = (employeesQuery.data || []).map((e: any) => e.id);
                  setSelectedUserIds(selectedUserIds.length === all.length ? [] : all);
                }}
              >
                {selectedUserIds.length === (employeesQuery.data || []).length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {employeesQuery.isLoading && (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                <p className="text-xs">Loading employees…</p>
              </div>
            )}

            {!employeesQuery.isLoading && (employeesQuery.data || []).length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-xs">
                No active employees found for this vendor.
              </div>
            )}

            {((employeesQuery.data || []) as any[])
              .filter((emp) =>
                !employeeSearch.trim() ||
                `${emp.user_name} ${emp.user_email || ""}`
                  .toLowerCase()
                  .includes(employeeSearch.toLowerCase().trim())
              )
              .map((emp) => {
                const isChecked = selectedUserIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer text-xs",
                      isChecked ? "bg-primary/5 border-primary/40" : "hover:bg-muted/30 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(val) => {
                          if (val) setSelectedUserIds([...selectedUserIds, emp.id]);
                          else setSelectedUserIds(selectedUserIds.filter((id) => id !== emp.id));
                        }}
                      />
                      <div>
                        <p className="font-semibold text-foreground">{emp.user_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {[emp.designation, emp.franchise?.franchise_name, emp.user_email].filter(Boolean).join(" · ") || "Employee"}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
          </div>

          <DialogFooter className="p-3 border-t bg-background">
            <Button variant="outline" size="sm" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveAssignments} className="bg-primary text-primary-foreground text-xs">
              Save Assignments ({selectedUserIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


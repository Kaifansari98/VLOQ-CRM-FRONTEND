"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AssignToPicker from "@/components/assign-to-picker";
import TextAreaInput from "@/components/origin-text-area";
import MapPicker from "@/components/MapPicker";
import { toastManager } from "@/components/ui/toast";
import {
  useCreateFranchise,
  useStoreCities,
  useUpdateFranchise,
  type FranchiseListItem,
} from "@/api/franchises";

const EMPTY_FORM = {
  shift_hours: "8",
  franchise_name: "",
  franchise_code: "",
  contact_person: "",
  contact_number: "",
  contact_email: "",
  address: "",
  store_city_id: "",
  status: "active" as "active" | "inactive",
};

type Form = typeof EMPTY_FORM;

const formFrom = (f: FranchiseListItem): Form => ({
  shift_hours: String((f.shift_minutes ?? 480) / 60),
  franchise_name: f.franchise_name ?? "",
  franchise_code: f.franchise_code ?? "",
  contact_person: f.contact_person ?? "",
  contact_number: f.contact_number ?? "",
  contact_email: f.contact_email ?? "",
  address: f.address ?? "",
  store_city_id: f.store_city_id ? String(f.store_city_id) : "",
  status: f.status?.toLowerCase() === "inactive" ? "inactive" : "active",
});

const Required = () => <span className="text-xs text-muted-foreground">(Required)</span>;

interface FranchiseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: number;
  /** Set to edit this franchise; leave out to create a new one. */
  franchise?: FranchiseListItem | null;
}

// Create or edit a franchise, including the city it belongs to (from the
// vendor's city master).
export default function FranchiseFormDialog({ open, onOpenChange, vendorId, franchise }: FranchiseFormDialogProps) {
  const editing = !!franchise;
  const [form, setForm] = React.useState<Form>(EMPTY_FORM);
  const [codeError, setCodeError] = React.useState("");
  const [cityError, setCityError] = React.useState("");
  const [mapOpen, setMapOpen] = React.useState(false);
  const [savedMapLocation, setSavedMapLocation] = React.useState<{ lat: number; lng: number; address: string } | null>(
    null,
  );

  const createMutation = useCreateFranchise(vendorId);
  const updateMutation = useUpdateFranchise(vendorId);
  const saving = createMutation.isPending || updateMutation.isPending;
  const { data: cities, isLoading: citiesLoading } = useStoreCities(vendorId, open);
  const hasCities = (cities?.length ?? 0) > 0;

  // Load the franchise (or a blank form) each time the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    setForm(franchise ? formFrom(franchise) : EMPTY_FORM);
    setCodeError("");
    setCityError("");
    setSavedMapLocation(null);
  }, [open, franchise]);

  const handleFieldChange = (field: keyof Form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    if (field === "contact_number") value = value.replace(/\D/g, "").slice(0, 10);
    if (field === "franchise_code") {
      value = value.toUpperCase();
      setCodeError("");
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // A city that was tagged earlier but is no longer active still shows by name.
  const cityOptions = React.useMemo(() => {
    const list = (cities ?? []).map((c) => ({ id: c.id, label: c.name }));
    if (franchise?.store_city_id && franchise.storeCity && !list.some((c) => c.id === franchise.store_city_id))
      list.push({ id: franchise.store_city_id, label: `${franchise.storeCity.name} (inactive)` });
    return list;
  }, [cities, franchise]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.franchise_name.trim() ||
      !form.franchise_code.trim() ||
      !form.contact_person.trim() ||
      !form.contact_number.trim() ||
      !form.contact_email.trim() ||
      !form.address.trim()
    ) {
      toastManager.add({ title: "Please fill all required fields", type: "error" });
      return;
    }
    if (hasCities && !form.store_city_id) {
      setCityError("Select the city.");
      toastManager.add({ title: "Please select the city", type: "error" });
      return;
    }
    if (form.contact_number.length !== 10) {
      toastManager.add({ title: "Contact number must be 10 digits", type: "error" });
      return;
    }
    const shiftMinutes = Number(form.shift_hours) * 60;
    if (
      !form.shift_hours ||
      !Number.isInteger(shiftMinutes) ||
      shiftMinutes < 15 ||
      shiftMinutes > 1440 ||
      shiftMinutes % 15 !== 0
    ) {
      toastManager.add({ title: "Enter a shift of 0.25–24 hours in 15-minute increments", type: "error" });
      return;
    }

    const fields = {
      shift_minutes: shiftMinutes,
      franchise_name: form.franchise_name.trim(),
      franchise_code: form.franchise_code.trim(),
      contact_person: form.contact_person.trim(),
      contact_number: form.contact_number.trim(),
      contact_email: form.contact_email.trim(),
      address: form.address.trim(),
      store_city_id: form.store_city_id ? Number(form.store_city_id) : null,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: franchise!.id, ...fields, status: form.status });
        toastManager.add({ title: "Franchise updated successfully", type: "success" });
      } else {
        await createMutation.mutateAsync({ vendor_id: vendorId, ...fields, is_head_office: false });
        toastManager.add({ title: "Franchise created successfully", type: "success" });
      }
      onOpenChange(false);
    } catch (error: any) {
      if (error?.response?.data?.code === "FRANCHISE_CODE_EXISTS") setCodeError(error.response.data.message);
      toastManager.add({
        title: error?.response?.data?.message || (editing ? "Failed to update franchise" : "Failed to create franchise"),
        type: "error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-base">{editing ? "Edit Franchise" : "Create Franchise"}</DialogTitle>
          <DialogDescription className="text-xs">
            {editing
              ? `Update the details of ${franchise!.franchise_name}.`
              : "Add the basic franchise details to onboard a new franchise."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
          <p className="text-xs text-muted-foreground">
            The basic details are required. Daily shift defaults to 8 hours; choosing an address from the map is
            optional.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="shift_hours">Daily shift (hours)</Label>
            <Input
              id="shift_hours"
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              value={form.shift_hours}
              onChange={handleFieldChange("shift_hours")}
              required
            />
            <p className="text-xs text-muted-foreground">Default 8 hours. Half-day attendance starts at 50% of the shift.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="franchise_name">
                Franchise Name <Required />
              </Label>
              <Input
                id="franchise_name"
                value={form.franchise_name}
                onChange={handleFieldChange("franchise_name")}
                placeholder="Enter franchise name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="franchise_code">
                Franchise Code <Required />
              </Label>
              <Input
                id="franchise_code"
                value={form.franchise_code}
                onChange={handleFieldChange("franchise_code")}
                placeholder="Enter franchise code"
                aria-invalid={!!codeError}
                aria-describedby={codeError ? "franchise-code-error" : "franchise-code-hint"}
                required
              />
              {codeError ? (
                <p id="franchise-code-error" role="alert" className="text-xs text-destructive">
                  {codeError}
                </p>
              ) : (
                <p id="franchise-code-hint" className="text-xs text-muted-foreground">
                  Must be unique within this vendor.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contact_person">
                Contact Person <Required />
              </Label>
              <Input
                id="contact_person"
                value={form.contact_person}
                onChange={handleFieldChange("contact_person")}
                placeholder="Enter contact person"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_number">
                Contact Number <Required />
              </Label>
              <Input
                id="contact_number"
                inputMode="numeric"
                value={form.contact_number}
                onChange={handleFieldChange("contact_number")}
                placeholder="Enter 10 digit number"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contact_email">
                Contact Email <Required />
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleFieldChange("contact_email")}
                placeholder="Enter contact email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>City {hasCities ? <Required /> : null}</Label>
              <AssignToPicker
                data={cityOptions}
                value={form.store_city_id ? Number(form.store_city_id) : undefined}
                onChange={(id) => {
                  setForm((prev) => ({ ...prev, store_city_id: id ? String(id) : "" }));
                  setCityError("");
                }}
                placeholder="Search cities…"
                emptyLabel={citiesLoading ? "Loading cities…" : hasCities ? "Select a city" : "No cities in city master"}
                disabled={citiesLoading || cityOptions.length === 0}
                className={cityError ? "border-destructive" : undefined}
              />
              {cityError ? (
                <p role="alert" className="text-xs text-destructive">
                  {cityError}
                </p>
              ) : (
                !citiesLoading &&
                !hasCities && (
                  <p className="text-xs text-muted-foreground">Add cities to this vendor&apos;s city master to tag one.</p>
                )
              )}
            </div>
          </div>

          {editing && (
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as Form["status"] }))}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>
                Address <Required />
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setMapOpen(true)} className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {savedMapLocation ? "Update Map" : "Open Map"}
              </Button>
            </div>
            <TextAreaInput
              value={form.address}
              onChange={(value) => {
                setForm((prev) => ({ ...prev, address: value }));
                if (savedMapLocation) setSavedMapLocation((prev) => (prev ? { ...prev, address: value } : prev));
              }}
              placeholder="Enter address or use map"
            />
            <MapPicker
              open={mapOpen}
              onClose={() => setMapOpen(false)}
              savedLocation={savedMapLocation}
              onSelect={(address, link) => {
                setForm((prev) => ({ ...prev, address }));
                const coords = link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                if (coords)
                  setSavedMapLocation({ lat: parseFloat(coords[1]), lng: parseFloat(coords[2]), address });
              }}
            />
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (editing ? "Saving..." : "Creating...") : editing ? "Save Changes" : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

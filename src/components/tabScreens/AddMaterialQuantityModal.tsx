"use client";

import React, { useState, useEffect, useMemo } from "react";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastManager } from "@/components/ui/toast";
import {
  createLeadRequirementMaterialApi,
  updateLeadRequirementMaterialApi,
  MaterialSupplyType,
  LeadRequirementMaterialItem,
} from "@/api/leadRequirementMaterial";
import { fetchProductMasters } from "@/api/inventory/product-master";
import { Package, Percent, Scale, Search, ChevronDown, X, Check } from "lucide-react";

interface AddMaterialQuantityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: number;
  leadId: number;
  productTypeId: number;
  productTypeName: string;
  userId: number;
  editingItem?: LeadRequirementMaterialItem | null;
  onSuccess: () => void;
}

export const AddMaterialQuantityModal: React.FC<AddMaterialQuantityModalProps> = ({
  open,
  onOpenChange,
  vendorId,
  leadId,
  productTypeId,
  productTypeName,
  userId,
  editingItem,
  onSuccess,
}) => {
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [masterUnits, setMasterUnits] = useState<{ id: number; unit_name: string; short_name?: string }[]>([]);
  
  const [productsList, setProductsList] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [materialSearch, setMaterialSearch] = useState<string>("");
  
  const [quantity, setQuantity] = useState<string>("");
  const [unitName, setUnitName] = useState<string>("");
  const [unitId, setUnitId] = useState<number | null>(null);
  
  const [suppliedBy, setSuppliedBy] = useState<MaterialSupplyType | "">("");
  const [clientPercentage, setClientPercentage] = useState<number>(40);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openUnitDropdown, setOpenUnitDropdown] = useState(false);

  const availableUnits = useMemo(() => {
    const list = [...masterUnits];
    if (unitName && !list.some((u) => u.unit_name === unitName || u.short_name === unitName)) {
      list.unshift({ id: 0, unit_name: unitName, short_name: unitName });
    }
    return list;
  }, [masterUnits, unitName]);

  // Fetch product items & units from Product Master API
  useEffect(() => {
    if (!open || !vendorId) return;

    let isMounted = true;
    setLoadingMasters(true);

    fetchProductMasters(vendorId)
      .then((res: any) => {
        if (!isMounted) return;
        if (res?.units) {
          setMasterUnits(res.units);
        }
      })
      .catch((err) => {
        console.error("Failed to load product masters units", err);
      })
      .finally(() => {
        if (isMounted) setLoadingMasters(false);
      });

    // Also fetch product list for this vendor
    import("@/lib/apiClient").then(({ apiClient }) => {
      apiClient
        .get(`/inventory/products/${vendorId}?page_size=1000`)
        .then((res: any) => {
          if (!isMounted) return;
          const raw = res?.data?.data?.products || res?.data?.products || res?.data?.data || res?.data || [];
          const items = Array.isArray(raw) ? raw : [];
          setProductsList(items);
        })
        .catch((err) => {
          console.error("Failed to load inventory products", err);
        });
    });

    return () => {
      isMounted = false;
    };
  }, [open, vendorId]);

  // Reset / Populate form when modal opens
  useEffect(() => {
    if (open) {
      if (editingItem) {
        setSelectedProductIds([editingItem.product_id]);
        setIsDropdownOpen(false);
        setMaterialSearch("");
        setQuantity(String(editingItem.quantity));
        setUnitName(editingItem.unit_name || editingItem.product?.unit_of_measure || "");
        setUnitId(editingItem.unit_id || null);
        setSuppliedBy(editingItem.supplied_by || "");
        setClientPercentage(editingItem.client_percentage ?? 40);
      } else {
        setSelectedProductIds([]);
        setIsDropdownOpen(false);
        setMaterialSearch("");
        setQuantity("");
        setUnitName("");
        setUnitId(null);
        setSuppliedBy("");
        setClientPercentage(40);
      }
    }
  }, [open, editingItem]);

  // Filtered products list for search
  const filteredProducts = useMemo(() => {
    if (!materialSearch.trim()) return productsList;
    const query = materialSearch.trim().toLowerCase();
    return productsList.filter((p: any) => {
      const name = String(p.product_name || p.item_name || "").toLowerCase();
      const code = String(p.item_code || "").toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [productsList, materialSearch]);

  // Toggle material selection
  const toggleMaterialSelect = (pId: number) => {
    const isSelected = selectedProductIds.includes(pId);
    const next = isSelected
      ? selectedProductIds.filter((id) => id !== pId)
      : [...selectedProductIds, pId];

    setSelectedProductIds(next);

    // Auto-set UOM unit when selecting first material
    if (!isSelected && next.length === 1) {
      const selectedProd = productsList.find((p: any) => p.id === pId);
      if (selectedProd) {
        const uom =
          selectedProd.unit_of_measure ||
          selectedProd.primaryUnit?.unit_name ||
          selectedProd.unit_name ||
          "";
        setUnitName(uom);
        if (selectedProd.primary_unit_id) {
          setUnitId(selectedProd.primary_unit_id);
        }
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      const allFilteredIds = filteredProducts.map((p: any) => p.id);
      setSelectedProductIds(allFilteredIds);
    }
  };

  const frankvinPercentage = useMemo(() => {
    if (suppliedBy === "Frankvin") return 100;
    if (suppliedBy === "Client") return 0;
    return Math.max(0, Math.min(100, 100 - clientPercentage));
  }, [suppliedBy, clientPercentage]);

  const clientPctEffective = useMemo(() => {
    if (suppliedBy === "Frankvin") return 0;
    if (suppliedBy === "Client") return 100;
    return Math.max(0, Math.min(100, clientPercentage));
  }, [suppliedBy, clientPercentage]);

  const calculatedQuantities = useMemo(() => {
    const qtyNum = parseFloat(quantity) || 0;
    return {
      clientQty: ((qtyNum * clientPctEffective) / 100).toFixed(2),
      frankvinQty: ((qtyNum * frankvinPercentage) / 100).toFixed(2),
    };
  }, [quantity, clientPctEffective, frankvinPercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProductIds.length === 0) {
      toastManager.add({ title: "Please select at least one material", type: "error" });
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toastManager.add({ title: "Please enter a valid quantity greater than 0", type: "error" });
      return;
    }

    if (!suppliedBy) {
      toastManager.add({ title: "Please select who supplies the material", type: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingItem) {
        await updateLeadRequirementMaterialApi(editingItem.id, {
          vendor_id: vendorId,
          quantity: qtyNum,
          unit_id: unitId,
          unit_name: unitName,
          supplied_by: suppliedBy,
          client_percentage: clientPctEffective,
          frankvin_percentage: frankvinPercentage,
        });

        toastManager.add({
          title: "Material & Quantity updated successfully",
          type: "success",
        });
      } else {
        await createLeadRequirementMaterialApi({
          lead_id: leadId,
          vendor_id: vendorId,
          product_type_id: productTypeId,
          product_ids: selectedProductIds,
          quantity: qtyNum,
          unit_id: unitId,
          unit_name: unitName,
          supplied_by: suppliedBy,
          client_percentage: clientPctEffective,
          frankvin_percentage: frankvinPercentage,
          created_by: userId,
        });

        toastManager.add({
          title: `${selectedProductIds.length} Material(s) & Quantity added successfully`,
          type: "success",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || "Failed to save material and quantity",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={editingItem ? `Edit Material & Quantity (${productTypeName})` : `Add Material & Quantity (${productTypeName})`}
      description={editingItem ? "Update quantity, UOM, or material supply breakdown." : "Select inventory materials and specify quantity, UOM, and supply breakdown."}
      size="md"
      icon={<Package className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {/* Multi-Select Material Section */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground">
              Materials (Multi-Select) <span className="text-red-500">*</span>
            </Label>
            <span className="text-[11px] text-muted-foreground font-normal">
              {selectedProductIds.length} selected
            </span>
          </div>

          {/* Trigger Dropdown Button / Active Search Field */}
          {!isDropdownOpen ? (
            <button
              type="button"
              onClick={() => setIsDropdownOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs border rounded-lg bg-background text-foreground hover:bg-muted/40 transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary"
            >
              <span className="truncate text-left">
                {selectedProductIds.length === 0
                  ? "Select materials..."
                  : `${selectedProductIds.length} Material${selectedProductIds.length > 1 ? "s" : ""} selected`}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ) : (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search materials..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                autoFocus
                className="pl-8 text-xs h-9"
              />
            </div>
          )}

          {/* Selected Materials Badges Preview */}
          {selectedProductIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-y-auto p-1.5 border rounded-md bg-muted/20">
              {selectedProductIds.map((pId) => {
                const prod = productsList.find((p: any) => p.id === pId);
                if (!prod) return null;
                return (
                  <span
                    key={pId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    <span className="truncate max-w-[140px]">
                      {prod.product_name || prod.item_name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMaterialSelect(pId);
                      }}
                      className="hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Expandable Options List Panel */}
          {isDropdownOpen && (
            <div className="absolute w-full p-2 border rounded-lg bg-background shadow-lg space-y-2 mt-1 z-50">
              {/* Header with Select All */}
              <div className="flex items-center justify-between border-b pb-1.5 text-xs text-muted-foreground">
                <span>Materials</span>
                {filteredProducts.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {selectedProductIds.length === filteredProducts.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </div>

              {/* Options List */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {filteredProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-3 text-center">
                    {productsList.length === 0 ? "Loading materials..." : "No matching materials found."}
                  </p>
                ) : (
                  filteredProducts.map((p: any) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs cursor-pointer select-none transition-colors ${
                          isSelected
                            ? "bg-primary/10 text-foreground font-medium"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMaterialSelect(p.id)}
                          className="h-3.5 w-3.5 rounded border-muted-foreground text-primary focus:ring-primary shrink-0"
                        />
                        <span className="truncate flex-1">
                          {p.product_name || p.item_name} {p.item_code ? `(${p.item_code})` : ""}
                        </span>
                        {p.unit_of_measure && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            [{p.unit_of_measure}]
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {/* Close Dropdown Button */}
              <div className="pt-1.5 border-t flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDropdownOpen(false)}
                  className="h-7 text-xs px-3"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Quantity & Unit Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-semibold text-foreground">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              step="any"
              min="0.0001"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 text-xs"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-foreground">Unit</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenUnitDropdown((prev) => !prev)}
                className="w-full mt-1 inline-flex items-center justify-between px-3 py-2 text-xs font-semibold border rounded-lg bg-background text-foreground shadow-2xs hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{unitName || "Select Unit..."}</span>
                  {unitName && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold shrink-0">
                      {unitName}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
              </button>

              {openUnitDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenUnitDropdown(false)} />
                  <div className="absolute right-0 mt-1 w-full p-1 rounded-xl border bg-background text-foreground shadow-lg z-50 space-y-0.5 border-border max-h-52 overflow-y-auto">
                    {availableUnits.map((u) => {
                      const val = u.short_name || u.unit_name;
                      const isActive = unitName === val || unitName === u.unit_name;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setUnitName(val);
                            if (u.id > 0) setUnitId(u.id);
                            setOpenUnitDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            isActive
                              ? "bg-muted text-foreground font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{u.unit_name}</span>
                            {u.short_name && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono font-semibold">
                                {u.short_name}
                              </span>
                            )}
                          </div>
                          {isActive && <Check className="h-3.5 w-3.5 text-foreground shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Supplied By Section */}
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-primary" />
            Supplied By <span className="text-red-500">*</span>
          </Label>

          <div className="grid grid-cols-3 gap-2">
            {(["Frankvin", "Client", "Shared"] as MaterialSupplyType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSuppliedBy(option)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all select-none ${
                  suppliedBy === option
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {option === "Frankvin" ? "Frankvin (100%)" : option === "Client" ? "Client (100%)" : "Shared"}
              </button>
            ))}
          </div>

          {/* Shared % Breakdown Inputs */}
          {suppliedBy === "Shared" && (
            <div className="p-3 border rounded-lg bg-muted/20 space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                    <Percent className="h-3 w-3 text-emerald-600" />
                    Client %
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={clientPercentage}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setClientPercentage(val);
                    }}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                    <Percent className="h-3 w-3 text-blue-600" />
                    Frankvin % (Auto)
                  </Label>
                  <Input
                    type="number"
                    value={frankvinPercentage}
                    disabled
                    className="mt-1 text-xs bg-muted cursor-not-allowed"
                  />
                </div>
              </div>

              {quantity && parseFloat(quantity) > 0 && (
                <div className="p-2 rounded-md bg-background border text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Supply Breakdown per material:</span> Client ({calculatedQuantities.clientQty} {unitName}), Frankvin ({calculatedQuantities.frankvinQty} {unitName})
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || selectedProductIds.length === 0}>
            {isSubmitting ? "Saving..." : `Save ${selectedProductIds.length > 0 ? selectedProductIds.length : ""} Material(s)`}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default AddMaterialQuantityModal;

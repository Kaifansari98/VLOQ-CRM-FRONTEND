"use client";

import React, { useState, useEffect, useMemo } from "react";
import BaseModal from "@/components/utils/baseModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  
  // New materials bulk configuration dictionary state
  const [materialsDetails, setMaterialsDetails] = useState<
    Record<
      number,
      {
        quantity: string;
        unit_id: number | null;
        unit_name: string;
        supplied_by: MaterialSupplyType | "";
        client_percentage: number | "";
      }
    >
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setMaterialsDetails({
          [editingItem.product_id]: {
            quantity: String(editingItem.quantity),
            unit_id: editingItem.unit_id || null,
            unit_name: editingItem.unit_name || editingItem.product?.unit_of_measure || "",
            supplied_by: editingItem.supplied_by || "",
            client_percentage: editingItem.client_percentage ?? 40,
          }
        });
      } else {
        setSelectedProductIds([]);
        setIsDropdownOpen(false);
        setMaterialSearch("");
        setMaterialsDetails({});
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

    if (!isSelected) {
      const selectedProd = productsList.find((p: any) => p.id === pId);
      const uom =
        selectedProd?.unit_of_measure ||
        selectedProd?.primaryUnit?.unit_name ||
        selectedProd?.unit_name ||
        "";
      const uomId = selectedProd?.primary_unit_id || null;
      setMaterialsDetails((prev) => ({
        ...prev,
        [pId]: {
          quantity: "",
          unit_id: uomId,
          unit_name: uom,
          supplied_by: "",
          client_percentage: 40,
        },
      }));
    } else {
      setMaterialsDetails((prev) => {
        const copy = { ...prev };
        delete copy[pId];
        return copy;
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
      setMaterialsDetails({});
    } else {
      const allFilteredIds = filteredProducts.map((p: any) => p.id);
      setSelectedProductIds(allFilteredIds);

      const newDetails = { ...materialsDetails };
      allFilteredIds.forEach((pId) => {
        if (!newDetails[pId]) {
          const selectedProd = productsList.find((p: any) => p.id === pId);
          const uom =
            selectedProd?.unit_of_measure ||
            selectedProd?.primaryUnit?.unit_name ||
            selectedProd?.unit_name ||
            "";
          const uomId = selectedProd?.primary_unit_id || null;
          newDetails[pId] = {
            quantity: "",
            unit_id: uomId,
            unit_name: uom,
            supplied_by: "",
            client_percentage: 40,
          };
        }
      });
      setMaterialsDetails(newDetails);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProductIds.length === 0) {
      toastManager.add({ title: "Please select at least one material", type: "error" });
      return;
    }

    // 1. Handling edit mode
    if (editingItem) {
      const pId = editingItem.product_id;
      const detail = materialsDetails[pId];
      if (!detail) return;

      const qtyNum = parseFloat(detail.quantity);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        toastManager.add({ title: "Please enter a valid quantity greater than 0", type: "error" });
        return;
      }

      if (!detail.supplied_by) {
        toastManager.add({ title: "Please select who supplies the material", type: "error" });
        return;
      }

      const rawCp = detail.client_percentage === "" ? 0 : detail.client_percentage;
      const cPct = detail.supplied_by === "Frankvin" ? 0 : detail.supplied_by === "Client" ? 100 : rawCp;
      const fPct = 100 - cPct;

      try {
        setIsSubmitting(true);
        await updateLeadRequirementMaterialApi(editingItem.id, {
          vendor_id: vendorId,
          quantity: qtyNum,
          unit_id: detail.unit_id,
          unit_name: detail.unit_name,
          supplied_by: detail.supplied_by,
          client_percentage: cPct,
          frankvin_percentage: fPct,
        });

        toastManager.add({
          title: "Material & Quantity updated successfully",
          type: "success",
        });
        onSuccess();
        onOpenChange(false);
      } catch (err: any) {
        toastManager.add({
          title: err?.response?.data?.message || "Failed to save material",
          type: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 2. Handling creation mode (new bulk materials with distinct values logic)
    const payloadMaterials = [];
    for (const pId of selectedProductIds) {
      const detail = materialsDetails[pId];
      if (!detail) {
        toastManager.add({ title: "Internal state mismatch for selected products", type: "error" });
        return;
      }

      const qtyNum = parseFloat(detail.quantity);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        const prod = productsList.find((p) => p.id === pId);
        const name = prod ? prod.product_name || prod.item_name : `ID: ${pId}`;
        toastManager.add({ title: `Please enter a valid quantity greater than 0 for "${name}"`, type: "error" });
        return;
      }

      if (!detail.supplied_by) {
        const prod = productsList.find((p) => p.id === pId);
        const name = prod ? prod.product_name || prod.item_name : `ID: ${pId}`;
        toastManager.add({ title: `Please select who supplies "${name}"`, type: "error" });
        return;
      }

      const rawCp = detail.client_percentage === "" ? 0 : detail.client_percentage;
      const cPct = detail.supplied_by === "Frankvin" ? 0 : detail.supplied_by === "Client" ? 100 : rawCp;
      const fPct = 100 - cPct;

      payloadMaterials.push({
        product_id: pId,
        quantity: qtyNum,
        unit_id: detail.unit_id,
        unit_name: detail.unit_name,
        supplied_by: detail.supplied_by,
        client_percentage: cPct,
        frankvin_percentage: fPct,
      });
    }

    try {
      setIsSubmitting(true);
      await createLeadRequirementMaterialApi({
        lead_id: leadId,
        vendor_id: vendorId,
        product_type_id: productTypeId,
        materials: payloadMaterials,
        created_by: userId,
      });

      toastManager.add({
        title: `${selectedProductIds.length} Material(s) configured & added successfully`,
        type: "success",
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || "Failed to save materials",
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
      description={editingItem ? "Update quantity, UOM, or material supply breakdown." : "Select inventory materials and configure separate quantity, UOM, and supply parameters for each."}
      size="xl"
      icon={<Package className="h-5 w-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {/* Multi-Select Material Section */}
        {!editingItem && (
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-slate-500" />
              Select Materials <span className="text-red-500">*</span>
            </Label>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {selectedProductIds.length} selected
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={selectedProductIds.length === 0 ? "Search and select materials..." : `${selectedProductIds.length} material(s) selected - click to toggle`}
              value={materialSearch}
              onChange={(e) => {
                setMaterialSearch(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="pl-9 pr-8 text-xs h-9 bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-slate-950 focus-visible:ring-1 hover:border-slate-300 dark:hover:border-slate-700 transition-all rounded-lg cursor-pointer"
            />
            <ChevronDown
              className={`absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Selected Materials Badges Preview */}
          {selectedProductIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/20">
              {selectedProductIds.map((pId) => {
                const prod = productsList.find((p: any) => p.id === pId);
                if (!prod) return null;
                return (
                  <span
                    key={pId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <span className="truncate max-w-[150px]">
                      {prod.product_name || prod.item_name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMaterialSelect(pId);
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Expandable Options List Panel (Inline to prevent clipping) */}
          {isDropdownOpen && (
            <div className="w-full p-2.5 border rounded-xl bg-slate-50/50 dark:bg-slate-900/10 space-y-2 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150 border-slate-200 dark:border-slate-800">
              {/* Header with Select All */}
              <div className="flex items-center justify-between border-b pb-1.5 px-1.5 text-xs text-muted-foreground">
                <span>Materials List</span>
                {filteredProducts.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground shrink-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {selectedProductIds.length === filteredProducts.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </div>

              {/* Options List */}
              <div className="max-h-[160px] overflow-y-auto space-y-0.5 pr-1">
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
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-all ${
                          isSelected
                            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-semibold"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMaterialSelect(p.id)}
                          className="h-3.5 w-3.5 rounded border-muted-foreground text-slate-900 focus:ring-slate-900 dark:text-slate-100 shrink-0"
                        />
                        <span className="truncate flex-1">
                          {p.product_name || p.item_name} {p.item_code ? `(${p.item_code})` : ""}
                        </span>
                        {p.unit_of_measure && (
                          <span className={`text-[10px] shrink-0 font-medium ${isSelected ? "text-slate-400 dark:text-slate-500" : "text-muted-foreground"}`}>
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
                  className="h-7 text-xs px-3 rounded-lg"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Quantity, Unit, SuppliedBy Forms */}
        {selectedProductIds.length > 0 && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <Label className="text-xs font-semibold text-foreground block border-b pb-1">
                Configure Selected Materials
              </Label>
              
              {/* Table Header Labels */}
              <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_32px] gap-3 px-3 pb-1 text-[11px] font-semibold text-muted-foreground select-none">
                <span className="truncate">Material Name</span>
                <span className="truncate">Quantity <span className="text-red-500">*</span></span>
                <span className="truncate">Unit</span>
                <span className="truncate">Supplied By</span>
                <span className="text-center truncate">C% / F%</span>
         
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {selectedProductIds.map((pId) => {
                  const prod = productsList.find((p) => p.id === pId);
                  if (!prod) return null;
                  const detail = materialsDetails[pId];
                  if (!detail) return null;

                  const qtyNum = parseFloat(detail.quantity) || 0;
                  const cPct = detail.supplied_by === "Frankvin" ? 0 : detail.supplied_by === "Client" ? 100 : (detail.client_percentage === "" ? 0 : detail.client_percentage);
                  const fPct = 100 - cPct;
                  const clientQty = ((qtyNum * cPct) / 100).toFixed(2);
                  const frankvinQty = ((qtyNum * fPct) / 100).toFixed(2);

                  return (
                    <div
                      key={pId}
                      className="space-y-1.5 p-2.5 border rounded-xl bg-muted/20 hover:border-slate-300 dark:hover:border-slate-800 transition-all animate-in fade-in slide-in-from-top-1 duration-200"
                    >
                      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_32px] gap-3 items-center">
                        {/* Product Name */}
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-semibold text-foreground truncate" title={`${prod.product_name || prod.item_name} ${prod.item_code ? `(${prod.item_code})` : ""}`}>
                            {prod.product_name || prod.item_name}
                          </span>
                        </div>

                        {/* Quantity */}
                        <div>
                          <Input
                            type="number"
                            step="any"
                            min="0.0001"
                            placeholder="Qty"
                            value={detail.quantity}
                            onChange={(e) => {
                              setMaterialsDetails((prev) => ({
                                ...prev,
                                [pId]: { ...prev[pId], quantity: e.target.value },
                              }));
                            }}
                            className="h-8 text-xs w-full hover:border-slate-300 dark:hover:border-slate-700 transition-colors focus-visible:ring-slate-950"
                            required
                          />
                        </div>

                        {/* Unit Selection */}
                        <div>
                          <Select
                            value={detail.unit_name || ""}
                            onValueChange={(val) => {
                              const selectedUnit = masterUnits.find((u) => u.unit_name === val);
                              const uId = selectedUnit ? selectedUnit.id : null;
                              setMaterialsDetails((prev) => ({
                                ...prev,
                                [pId]: { ...prev[pId], unit_name: val, unit_id: uId },
                              }));
                            }}
                          >
                            <SelectTrigger size="sm" className="w-full h-8 text-xs bg-background hover:bg-muted/40 transition-colors">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {masterUnits.map((u) => (
                                <SelectItem key={u.id} value={u.unit_name}>
                                  {u.unit_name}
                                </SelectItem>
                              ))}
                              {prod.unit_of_measure && !masterUnits.some((u) => u.unit_name === prod.unit_of_measure) && (
                                <SelectItem value={prod.unit_of_measure}>
                                  {prod.unit_of_measure}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Supplied By */}
                        <div>
                          <Select
                            value={detail.supplied_by || undefined}
                            onValueChange={(val) => {
                              setMaterialsDetails((prev) => ({
                                ...prev,
                                [pId]: { ...prev[pId], supplied_by: val as MaterialSupplyType },
                              }));
                            }}
                          >
                            <SelectTrigger size="sm" className="w-full h-8 text-xs bg-background hover:bg-muted/40 transition-colors">
                              <SelectValue placeholder="Supplied By" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Frankvin">Frankvin</SelectItem>
                              <SelectItem value="Client">Client</SelectItem>
                              <SelectItem value="Shared">Shared</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Client % and Frankvin % (if Shared) */}
                        <div className="flex justify-center">
                          {detail.supplied_by === "Shared" ? (
                            <div className="flex items-center gap-1 min-w-full">
                              <div className="relative flex-1 flex items-center">
                                <Input
                                  type="number"
                                  min="1"
                                  max="99"
                                  placeholder="Client"
                                  value={detail.client_percentage}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    let val: number | "" = "";
                                    if (valStr !== "") {
                                      const num = Number(valStr);
                                      val = Math.max(1, Math.min(99, isNaN(num) ? 1 : num));
                                    }
                                    setMaterialsDetails((prev) => ({
                                      ...prev,
                                      [pId]: { ...prev[pId], client_percentage: val },
                                    }));
                                  }}
                                  className="h-8 text-xs pl-2 pr-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors focus-visible:ring-slate-950"
                                />
                                <span className="absolute right-2 text-[9px] text-muted-foreground font-semibold">C%</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">/</span>
                              <div className="relative flex-1 flex items-center">
                                <Input
                                  type="number"
                                  min="1"
                                  max="99"
                                  placeholder="Frankvin"
                                  value={detail.client_percentage === "" ? "" : 100 - detail.client_percentage}
                                  onChange={(e) => {
                                    const valStr = e.target.value;
                                    let cPct: number | "" = "";
                                    if (valStr !== "") {
                                      const num = Number(valStr);
                                      const val = Math.max(1, Math.min(99, isNaN(num) ? 1 : num));
                                      cPct = 100 - val;
                                    }
                                    setMaterialsDetails((prev) => ({
                                      ...prev,
                                      [pId]: { ...prev[pId], client_percentage: cPct },
                                    }));
                                  }}
                                  className="h-8 text-xs pl-2 pr-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors focus-visible:ring-slate-950"
                                />
                                <span className="absolute right-2 text-[9px] text-muted-foreground font-semibold">F%</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-8 w-full py-1.5 text-xs text-muted-foreground bg-muted/30 border border-transparent rounded-lg select-none text-center">
                              —
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => toggleMaterialSelect(pId)}
                            className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-muted/40 transition-colors"
                            title="Remove material"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Supply Breakdown Summary with visual split progress bar */}
                      {qtyNum > 0 && (
                        <div className="space-y-1.5 text-[9px] text-muted-foreground bg-background dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 transition-all animate-in fade-in duration-300">
                          <div className="flex items-center justify-between">
                            <span>Supply Breakdown:</span>
                            <span className="font-semibold text-foreground">
                              {detail.supplied_by === "Frankvin"
                                ? `Frankvin (100%): ${qtyNum} ${detail.unit_name}`
                                : detail.supplied_by === "Client"
                                ? `Client (100%): ${qtyNum} ${detail.unit_name}`
                                : `Client: ${clientQty} ${detail.unit_name} | Frankvin: ${frankvinQty} ${detail.unit_name}`}
                            </span>
                          </div>
                          
                          {/* Visual Split Progress Bar */}
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full transition-all duration-300"
                              style={{ width: `${cPct}%` }}
                              title={`Client: ${cPct}%`}
                            />
                            <div
                              className="bg-blue-500 h-full transition-all duration-300"
                              style={{ width: `${fPct}%` }}
                              title={`Frankvin: ${fPct}%`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

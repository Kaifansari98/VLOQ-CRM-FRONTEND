"use client";

import React, { useMemo, useState } from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { useQuery } from "@tanstack/react-query";
import { useB2BRequirementTypes, useProductTypes } from "@/hooks/useTypesMaster";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { useFranchisesByVendorId } from "@/api/franchise";
import {
  fetchLeadRequirementMaterialsApi,
  deleteLeadRequirementMaterialApi,
  LeadRequirementMaterialItem,
} from "@/api/leadRequirementMaterial";
import { AddMaterialQuantityModal } from "@/components/tabScreens/AddMaterialQuantityModal";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { Sliders, Plus, Pencil, Trash2, Package } from "lucide-react";
import Loader from "@/components/utils/loader";

export default function MaterialConfigurationTab() {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  // States for Add/Edit Material Modal
  const [materialModalTypeId, setMaterialModalTypeId] = useState<number | null>(null);
  const [editingMaterialItem, setEditingMaterialItem] = useState<LeadRequirementMaterialItem | null>(null);

  // Queries
  const { data: b2bReqTypesData, isLoading: isB2bTypesLoading } = useB2BRequirementTypes(vendorId);
  const { data: productTypes, isLoading: isProductTypesLoading } = useProductTypes();
  
  const { data: leadData, isLoading: isLeadLoading } = useLeadById(leadId, vendorId, userId);
  const lead = leadData?.data?.lead;

  const { data: franchisesForB2b = [] } = useFranchisesByVendorId(vendorId, !!vendorId);
  const isB2b = useMemo(() => {
    const leadFranchise = franchisesForB2b.find(
      (franchise: any) => franchise.id === lead?.franchise_id,
    );
    return leadFranchise?.moduled_for_b2b ?? false;
  }, [franchisesForB2b, lead?.franchise_id]);

  const { data: reqMaterialsData, refetch: refetchReqMaterials, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ["lead-requirement-materials", leadId, vendorId],
    queryFn: () => fetchLeadRequirementMaterialsApi(leadId, vendorId!),
    enabled: !!leadId && !!vendorId,
  });
  const reqMaterials = useMemo(() => reqMaterialsData?.data || [], [reqMaterialsData]);

  // Selected requirement/product types mapped for this lead
  const selectedProductTypeIds = useMemo(() => {
    if (!lead) return [];
    if (isB2b) {
      const b2bIds = (lead as any)?.leadB2BReqMappings
        ?.map((m: any) => m.b2b_requirement_type_id || m.b2bRequirementType?.id)
        ?.filter(Boolean) || [];
      const briefTypeIds = (lead as any)?.leadProcessBriefs
        ?.map((m: any) => m.b2b_requirement_type_id || m.b2bRequirementType?.id)
        ?.filter(Boolean) || [];
      return Array.from(new Set<number>([...b2bIds, ...briefTypeIds]));
    } else {
      return lead?.productMappings
        ?.map((pm: any) => pm.product_type_id || pm.productType?.id)
        ?.filter(Boolean) || [];
    }
  }, [lead, isB2b]);

  // Merge selected type IDs with any type IDs that already have materials saved (fallback for edge cases)
  const allTypeIds = useMemo(() => {
    const idsFromMaterials = reqMaterials
      .map((m: any) => m.b2b_requirement_type_id || m.product_type_id)
      .filter(Boolean);
    return Array.from(new Set<number>([...selectedProductTypeIds, ...idsFromMaterials]));
  }, [selectedProductTypeIds, reqMaterials]);

  // Group materials and resolve type names
  const typesWithDetails = useMemo(() => {
    const typesList = b2bReqTypesData?.data || productTypes?.data || [];
    return allTypeIds.map((typeId) => {
      const typeObj = typesList.find((t: any) => t.id === typeId);
      const name = typeObj?.type || `Type ${typeId}`;
      const materials = reqMaterials.filter(
        (m: any) => (m.b2b_requirement_type_id || m.product_type_id) === typeId
      );
      return {
        id: typeId,
        name,
        materials,
      };
    });
  }, [allTypeIds, b2bReqTypesData, productTypes, reqMaterials]);

  // Delete Material Handler
  const handleDeleteMaterial = async (id: number) => {
    if (!vendorId) return;
    try {
      await deleteLeadRequirementMaterialApi(id, vendorId);
      toastManager.add({
        title: "Material deleted successfully",
        type: "success",
      });
      refetchReqMaterials();
    } catch (err: any) {
      toastManager.add({
        title: err?.response?.data?.message || "Failed to delete material",
        type: "error",
      });
    }
  };

  const isLoading = isB2bTypesLoading || isProductTypesLoading || isLeadLoading || isMaterialsLoading;

  if (isLoading) {
    return <Loader size={200} message="Loading Material Configurations..." />;
  }

  return (
    <div className="space-y-6">
      {allTypeIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-2xl bg-muted/5 border-border/70 text-center">
          <Package className="h-12 w-12 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No requirement types configured</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Please select requirement types or process briefs in Lead Details to enable material mapping.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {typesWithDetails.map((type) => (
            <div
              key={type.id}
              className="p-5 rounded-2xl border bg-card text-card-foreground shadow-xs border-border/70 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                    <h3 className="font-semibold text-sm md:text-base text-foreground">
                      {type.name}
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingMaterialItem(null);
                      setMaterialModalTypeId(type.id);
                    }}
                    className="text-xs gap-1.5 bg-background shadow-3xs hover:bg-muted text-emerald-700 dark:text-emerald-400 border-emerald-600/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Material
                  </Button>
                </div>

                {type.materials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Package className="h-8 w-8 opacity-40 mb-2" />
                    <p className="text-xs">No materials added to this requirement type yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-1">
                    {type.materials.map((mat: any) => (
                      <div
                        key={mat.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors border-border/50 text-xs"
                      >
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <span className="font-semibold text-foreground break-words leading-tight">
                            {mat.product?.product_name || "Material"}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="text-muted-foreground shrink-0">
                              Qty: <strong className="text-foreground font-semibold">{mat.quantity}</strong> {mat.unit_name || mat.product?.unit_of_measure || ""}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-background border shadow-3xs text-muted-foreground shrink-0">
                              {mat.supplied_by === "Frankvin"
                                ? "Frankvin"
                                : mat.supplied_by === "Client"
                                ? "Client"
                                : `Shared (${mat.client_percentage}% / ${mat.frankvin_percentage}%)`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingMaterialItem(mat);
                              setMaterialModalTypeId(type.id);
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Edit Material & Quantity"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMaterial(mat.id)}
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            title="Delete Material"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {materialModalTypeId && vendorId && (
        <AddMaterialQuantityModal
          open={!!materialModalTypeId}
          onOpenChange={(open) => {
            if (!open) {
              setMaterialModalTypeId(null);
              setEditingMaterialItem(null);
            }
          }}
          vendorId={vendorId}
          leadId={leadId}
          productTypeId={materialModalTypeId}
          productTypeName={
            (b2bReqTypesData?.data || productTypes?.data)?.find((t: any) => t.id === materialModalTypeId)?.type || "Requirement"
          }
          userId={userId || 0}
          editingItem={editingMaterialItem}
          onSuccess={() => {
            refetchReqMaterials();
          }}
        />
      )}
    </div>
  );
}

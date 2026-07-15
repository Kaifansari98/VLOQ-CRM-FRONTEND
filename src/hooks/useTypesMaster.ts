// src/hooks/useTypesMaster.ts
import { useQuery } from "@tanstack/react-query"
import {
  createCompanyVendor,
  createProductItemCode,
  createProductSubStructure,
  createProductStructure,
  createProductType,
  createInstallerUser,
  createIssueLogType,
  fetchInstallerUsersForMaster,
  fetchUsersForMaster,
  fetchPrivilegeMasters,
  fetchCompanyVendorsForMaster,
  fetchCarcassTypes,
  fetchCarcasMaterials,
  fetchCarcassMaterialFinishes,
  fetchFastProductionTimelineRules,
  fetchShutterTypes,
  fetchShutterMaterials,
  fetchShutterMaterialFinishes,
  fetchCarcassLegs,
  fetchSkirtingCarcassLegs,
  fetchSkirtingCarcassLegsColors,
  fetchLightCarcasTypes,
  fetchLightCarcasUnits,
  fetchOtherAppliances,
  fetchHandleTypes,
  createMiscellaneousTeam,
  createMiscellaneousType,
  createSourceType,
  createSiteType,
  fetchIssueLogTypes,
  fetchMiscellaneousTeams,
  fetchMiscellaneousTypes,
  fetchSourceTypes,
  fetchProductStructureTypes,
  fetchProductSubStructures,
  fetchProductItemCodes,
  fetchSiteTypes,
  fetchSiteTypesForMaster,
  fetchProductTypes,
  fetchSmallOrderRequestTypes,
  updateCompanyVendor,
  updateCompanyVendorStatus,
  updateInstallerUser,
  updateInstallerUserStatus,
  updateIssueLogType,
  updateIssueLogTypeStatus,
  updateMiscellaneousTeam,
  updateMiscellaneousTeamStatus,
  updateMiscellaneousType,
  updateMiscellaneousTypeStatus,
  updateSourceType,
  updateSourceTypeStatus,
  updateSiteType,
  updateSiteTypeStatus,
  fetchUserTypes,
  createUser,
  updateUser,
  updateUserPrivileges,
  type UpdateUserMasterPayload,
} from "@/api/typesMasterApi"
import { useAppSelector } from "@/redux/store" // assuming you have typed hooks
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";

const getSiteTypesQueryKey = (vendorId?: number) => ["siteTypes", vendorId];
const getSiteTypesMasterQueryKey = (vendorId?: number) => ["siteTypesMaster", vendorId];
const getSourceTypesQueryKey = (vendorId?: number) => ["sourceTypes", vendorId];
const getMiscellaneousTypesQueryKey = (vendorId?: number) => ["miscellaneousTypes", vendorId];
const getIssueLogTypesQueryKey = (vendorId?: number) => ["issueLogTypes", vendorId];
const getMiscellaneousTeamsQueryKey = (vendorId?: number) => ["miscellaneousTeams", vendorId];
const getInstallerUsersMasterQueryKey = (vendorId?: number) => ["installerUsersMaster", vendorId];
const getCompanyVendorsMasterQueryKey = (vendorId?: number) => ["companyVendorsMaster", vendorId];
const getUsersMasterQueryKey = (vendorId?: number) => ["usersMaster", vendorId];
const getPrivilegeMastersQueryKey = (
  vendorId?: number,
  search?: string,
  userId?: number | null,
) => [
  "privilegeMasters",
  vendorId,
  search ?? "",
  userId ?? null,
];
const getCarcassTypesQueryKey = (vendorId?: number) => ["carcassTypes", vendorId];
const getCarcasMaterialsQueryKey = (vendorId?: number) => ["carcasMaterials", vendorId];
const getCarcassMaterialFinishesQueryKey = (carcasMaterialId?: number) => ["carcassMaterialFinishes", carcasMaterialId];
const getShutterTypesQueryKey = (vendorId?: number) => ["shutterTypes", vendorId];
const getShutterMaterialsQueryKey = (vendorId?: number) => ["shutterMaterials", vendorId];
const getShutterMaterialFinishesQueryKey = (shutterMaterialId?: number) => ["shutterMaterialFinishes", shutterMaterialId];
const getCarcassLegsQueryKey = (vendorId?: number) => ["carcassLegs", vendorId];
const getSkirtingCarcassLegsQueryKey = (carcassLegsId?: number) => ["skirtingCarcassLegs", carcassLegsId];
const getSkirtingCarcassLegsColorsQueryKey = (skirtingCarcassLegsId?: number) => ["skirtingCarcassLegsColors", skirtingCarcassLegsId];
const getLightCarcasTypesQueryKey = (vendorId?: number) => ["lightCarcasTypes", vendorId];
const getLightCarcasUnitsQueryKey = (lightCarcasTypeId?: number) => ["lightCarcasUnits", lightCarcasTypeId];
const getOtherAppliancesQueryKey = (vendorId?: number) => ["otherAppliances", vendorId];
const getHandleTypesQueryKey = (vendorId?: number) => ["handleTypes", vendorId];
const getFastProductionTimelineRulesQueryKey = (vendorId?: number) => ["fastProductionTimelineRules", vendorId];
const getSmallOrderRequestTypesQueryKey = (vendorId?: number) => ["smallOrderRequestTypes", vendorId];

const useResolvedVendorId = (vendorIdOverride?: number) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return vendorIdOverride ?? vendorId;
};

export const useCompanyVendorsForMaster = (vendorIdOverride?: number) => {
  const vendorId = useResolvedVendorId(vendorIdOverride);
  return useQuery({
    queryKey: getCompanyVendorsMasterQueryKey(vendorId),
    queryFn: () => fetchCompanyVendorsForMaster(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useUsersForMaster = (params: {
  page: number;
  limit: number;
  search?: string;
  franchise_id?: number;
}, vendorIdOverride?: number) => {
  const vendorId = useResolvedVendorId(vendorIdOverride);
  return useQuery({
    queryKey: getUsersMasterQueryKey(vendorId).concat([
      params.page,
      params.limit,
      params.search ?? "",
      params.franchise_id ?? 0,
    ]),
    queryFn: () => fetchUsersForMaster(vendorId!, params),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const usePrivilegeMasters = ({
  enabled = true,
  search = "",
  userId,
  vendorIdOverride,
}: {
  enabled?: boolean;
  search?: string;
  userId?: number | null;
  vendorIdOverride?: number;
} = {}) => {
  const vendorId = useResolvedVendorId(vendorIdOverride);
  return useQuery({
    queryKey: getPrivilegeMastersQueryKey(vendorId, search, userId),
    queryFn: () => fetchPrivilegeMasters(vendorId!, search, userId),
    enabled: !!vendorId && enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useCreateCompanyVendor = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: (payload: Parameters<typeof createCompanyVendor>[1]) =>
      createCompanyVendor(vendorId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getCompanyVendorsMasterQueryKey(vendorId) });
      toastManager.add({
        title: "Company vendor created successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to create company vendor.",
        type: "error",
      });
    },
  });
}

export const useInstallerUsersForMaster = (vendorIdOverride?: number) => {
  const vendorId = useResolvedVendorId(vendorIdOverride);
  return useQuery({
    queryKey: getInstallerUsersMasterQueryKey(vendorId),
    queryFn: () => fetchInstallerUsersForMaster(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateInstallerUser = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createInstallerUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getInstallerUsersMasterQueryKey(vendorId) });
      toastManager.add({
        title: "Installer created successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to create installer.",
        type: "error",
      });
    },
  });
}

export const useMiscellaneousTeams = (vendorIdOverride?: number) => {
  const vendorId = useResolvedVendorId(vendorIdOverride);
  return useQuery({
    queryKey: getMiscellaneousTeamsQueryKey(vendorId),
    queryFn: () => fetchMiscellaneousTeams(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateMiscellaneousTeam = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createMiscellaneousTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getMiscellaneousTeamsQueryKey(vendorId) });
      toastManager.add({
        title: "Miscellaneous team created successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to create miscellaneous team.",
        type: "error",
      });
    },
  });
}

export const useIssueLogTypes = (vendorIdOverride?: number) => {
  const vendorId = useResolvedVendorId(vendorIdOverride);
  return useQuery({
    queryKey: getIssueLogTypesQueryKey(vendorId),
    queryFn: () => fetchIssueLogTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateIssueLogType = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createIssueLogType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getIssueLogTypesQueryKey(vendorId) });
      toastManager.add({
        title: "Issue log type created successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to create issue log type.",
        type: "error",
      });
    },
  });
}

export const useMiscellaneousTypes = (vendorIdOverride?: number) => {
  const vendorId = useResolvedVendorId(vendorIdOverride);
  return useQuery({
    queryKey: getMiscellaneousTypesQueryKey(vendorId),
    queryFn: () => fetchMiscellaneousTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateMiscellaneousType = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createMiscellaneousType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getMiscellaneousTypesQueryKey(vendorId) });
      toastManager.add({
        title: "Miscellaneous type created successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to create miscellaneous type.",
        type: "error",
      });
    },
  });
}

export const useSourceTypes = (vendorIdOverride?: number) => {
  const vendorId = useResolvedVendorId(vendorIdOverride);
  return useQuery({
    queryKey: getSourceTypesQueryKey(vendorId),
    queryFn: () => fetchSourceTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateSourceType = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createSourceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getSourceTypesQueryKey(vendorId) });
      toastManager.add({ title: "Source type created successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to create source type.",
        type: "error",
      });
    },
  });
}

export const useCreateProductType = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createProductType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTypes", vendorId] });
      toastManager.add({
        title: "Product type created successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to create product type.",
        type: "error",
      });
    },
  });
}

export const useCreateProductStructure = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createProductStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productStructureTypes", vendorId] });
      toastManager.add({
        title: "Product structure created successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to create product structure.",
        type: "error",
      });
    },
  });
}

export const useCreateProductSubStructure = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createProductSubStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productSubStructures", vendorId] });
      toastManager.add({
        title: "Product sub structure created successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.data?.error ||
          "Failed to create product sub structure.",
        type: "error",
      });
    },
  });
}

export const useCreateProductItemCode = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createProductItemCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productItemCodes", vendorId] });
      toastManager.add({
        title: "Product item code created successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.data?.error || "Failed to create product item code.",
        type: "error",
      });
    },
  });
}

export const useProductStructureTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)
  return useQuery({
    queryKey: ["productStructureTypes", vendorId],
    queryFn: () => fetchProductStructureTypes(vendorId!),
    enabled: !!vendorId,
  })
}

export const useProductSubStructures = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)
  return useQuery({
    queryKey: ["productSubStructures", vendorId],
    queryFn: () => fetchProductSubStructures(vendorId!),
    enabled: !!vendorId,
  })
}

export const useProductItemCodes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)
  return useQuery({
    queryKey: ["productItemCodes", vendorId],
    queryFn: () => fetchProductItemCodes(vendorId!),
    enabled: !!vendorId,
  })
}

export const useCarcassTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getCarcassTypesQueryKey(vendorId),
    queryFn: () => fetchCarcassTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useCarcasMaterials = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getCarcasMaterialsQueryKey(vendorId),
    queryFn: () => fetchCarcasMaterials(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useCarcassMaterialFinishes = (carcasMaterialId?: number) => {
  return useQuery({
    queryKey: getCarcassMaterialFinishesQueryKey(carcasMaterialId),
    queryFn: () => fetchCarcassMaterialFinishes(carcasMaterialId!),
    enabled: !!carcasMaterialId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useShutterTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getShutterTypesQueryKey(vendorId),
    queryFn: () => fetchShutterTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useShutterMaterials = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getShutterMaterialsQueryKey(vendorId),
    queryFn: () => fetchShutterMaterials(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useShutterMaterialFinishes = (shutterMaterialId?: number) => {
  return useQuery({
    queryKey: getShutterMaterialFinishesQueryKey(shutterMaterialId),
    queryFn: () => fetchShutterMaterialFinishes(shutterMaterialId!),
    enabled: !!shutterMaterialId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useCarcassLegs = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getCarcassLegsQueryKey(vendorId),
    queryFn: () => fetchCarcassLegs(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useSkirtingCarcassLegs = (carcassLegsId?: number) => {
  return useQuery({
    queryKey: getSkirtingCarcassLegsQueryKey(carcassLegsId),
    queryFn: () => fetchSkirtingCarcassLegs(carcassLegsId!),
    enabled: !!carcassLegsId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useLightCarcasTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getLightCarcasTypesQueryKey(vendorId),
    queryFn: () => fetchLightCarcasTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useLightCarcasUnits = (lightCarcasTypeId?: number) => {
  return useQuery({
    queryKey: getLightCarcasUnitsQueryKey(lightCarcasTypeId),
    queryFn: () => fetchLightCarcasUnits(lightCarcasTypeId!),
    enabled: !!lightCarcasTypeId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useOtherAppliances = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getOtherAppliancesQueryKey(vendorId),
    queryFn: () => fetchOtherAppliances(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useSkirtingCarcassLegsColors = (skirtingCarcassLegsId?: number) => {
  return useQuery({
    queryKey: getSkirtingCarcassLegsColorsQueryKey(skirtingCarcassLegsId),
    queryFn: () => fetchSkirtingCarcassLegsColors(skirtingCarcassLegsId!),
    enabled: !!skirtingCarcassLegsId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useHandleTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getHandleTypesQueryKey(vendorId),
    queryFn: () => fetchHandleTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useFastProductionTimelineRules = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getFastProductionTimelineRulesQueryKey(vendorId),
    queryFn: () => fetchFastProductionTimelineRules(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useSiteTypes = (vendorIdOverride?: number) => {
  const vendorId = useResolvedVendorId(vendorIdOverride)
  return useQuery({
    queryKey: getSiteTypesQueryKey(vendorId),
    queryFn: () => fetchSiteTypes(vendorId!),
    enabled: !!vendorId,
  })
}

export const useCreateSiteType = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createSiteType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getSiteTypesQueryKey(vendorId) });
      queryClient.invalidateQueries({ queryKey: getSiteTypesMasterQueryKey(vendorId) });
      toastManager.add({ title: "Site type created successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to create site type.",
        type: "error",
      });
    },
  });
}

export const useSiteTypesForMaster = (vendorIdOverride?: number) => {
  const vendorId = useResolvedVendorId(vendorIdOverride)
  return useQuery({
    queryKey: getSiteTypesMasterQueryKey(vendorId),
    queryFn: () => fetchSiteTypesForMaster(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useUpdateSiteType = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: string }) =>
      updateSiteType(id, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getSiteTypesQueryKey(vendorId) });
      queryClient.invalidateQueries({ queryKey: getSiteTypesMasterQueryKey(vendorId) });
      toastManager.add({ title: "Site type updated successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.status === 404
            ? "Edit API is not live on the backend yet. Restart/deploy the backend."
            : error?.response?.data?.error || "Failed to update site type.",
        type: "error",
      });
    },
  });
}

export const useUpdateSiteTypeStatus = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "inactive" }) =>
      updateSiteTypeStatus(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: getSiteTypesQueryKey(vendorId) });
      queryClient.invalidateQueries({ queryKey: getSiteTypesMasterQueryKey(vendorId) });
      toastManager.add({
        title: `Site type marked ${variables.status}.`,
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to update site type status.",
        type: "error",
      });
    },
  });
}

export const useUpdateSourceType = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: string }) =>
      updateSourceType(id, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getSourceTypesQueryKey(vendorId) });
      toastManager.add({ title: "Source type updated successfully.", type: "success" });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.status === 404
            ? "Edit API is not live on the backend yet. Restart/deploy the backend."
            : error?.response?.data?.error || "Failed to update source type.",
        type: "error",
      });
    },
  });
}

export const useUpdateSourceTypeStatus = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "inactive" }) =>
      updateSourceTypeStatus(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: getSourceTypesQueryKey(vendorId) });
      toastManager.add({
        title: `Source type marked ${variables.status}.`,
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to update source type status.",
        type: "error",
      });
    },
  });
}

export const useUpdateMiscellaneousType = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateMiscellaneousType(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getMiscellaneousTypesQueryKey(vendorId) });
      toastManager.add({
        title: "Miscellaneous type updated successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.status === 404
            ? "Edit API is not live on the backend yet. Restart/deploy the backend."
            : error?.response?.data?.error || "Failed to update miscellaneous type.",
        type: "error",
      });
    },
  });
}

export const useUpdateMiscellaneousTypeStatus = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "inactive" }) =>
      updateMiscellaneousTypeStatus(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: getMiscellaneousTypesQueryKey(vendorId) });
      toastManager.add({
        title: `Miscellaneous type marked ${variables.status}.`,
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.data?.error || "Failed to update miscellaneous type status.",
        type: "error",
      });
    },
  });
}

export const useUpdateIssueLogType = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateIssueLogType(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getIssueLogTypesQueryKey(vendorId) });
      toastManager.add({
        title: "Issue log type updated successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.status === 404
            ? "Edit API is not live on the backend yet. Restart/deploy the backend."
            : error?.response?.data?.error || "Failed to update issue log type.",
        type: "error",
      });
    },
  });
}

export const useUpdateIssueLogTypeStatus = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "inactive" }) =>
      updateIssueLogTypeStatus(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: getIssueLogTypesQueryKey(vendorId) });
      toastManager.add({
        title: `Issue log type marked ${variables.status}.`,
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.data?.error || "Failed to update issue log type status.",
        type: "error",
      });
    },
  });
}

export const useUpdateMiscellaneousTeam = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateMiscellaneousTeam(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getMiscellaneousTeamsQueryKey(vendorId) });
      toastManager.add({
        title: "Miscellaneous team updated successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.status === 404
            ? "Edit API is not live on the backend yet. Restart/deploy the backend."
            : error?.response?.data?.error || "Failed to update miscellaneous team.",
        type: "error",
      });
    },
  });
}

export const useUpdateMiscellaneousTeamStatus = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "inactive" }) =>
      updateMiscellaneousTeamStatus(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: getMiscellaneousTeamsQueryKey(vendorId) });
      toastManager.add({
        title: `Miscellaneous team marked ${variables.status}.`,
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.data?.error || "Failed to update miscellaneous team status.",
        type: "error",
      });
    },
  });
}

export const useUpdateInstallerUser = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({
      id,
      installer_name,
      contact_number,
    }: {
      id: number;
      installer_name: string;
      contact_number?: string;
    }) => updateInstallerUser(id, { installer_name, contact_number }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getInstallerUsersMasterQueryKey(vendorId) });
      toastManager.add({
        title: "Installer updated successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.status === 404
            ? "Edit API is not live on the backend yet. Restart/deploy the backend."
            : error?.response?.data?.error || "Failed to update installer.",
        type: "error",
      });
    },
  });
}

export const useUpdateInstallerUserStatus = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "inactive" }) =>
      updateInstallerUserStatus(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: getInstallerUsersMasterQueryKey(vendorId) });
      toastManager.add({
        title: `Installer marked ${variables.status}.`,
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.error || "Failed to update installer status.",
        type: "error",
      });
    },
  });
}

export const useUpdateCompanyVendor = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({
      companyVendorId,
      payload,
    }: {
      companyVendorId: number;
      payload: Parameters<typeof updateCompanyVendor>[2];
    }) => updateCompanyVendor(vendorId!, companyVendorId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getCompanyVendorsMasterQueryKey(vendorId) });
      toastManager.add({
        title: "Company vendor updated successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to update company vendor.",
        type: "error",
      });
    },
  });
}

export const useUpdateCompanyVendorStatus = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({
      companyVendorId,
      payload,
    }: {
      companyVendorId: number;
      payload: Parameters<typeof updateCompanyVendorStatus>[2];
    }) => updateCompanyVendorStatus(vendorId!, companyVendorId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: getCompanyVendorsMasterQueryKey(vendorId) });
      toastManager.add({
        title: `Company vendor marked ${variables.payload.is_deleted ? "inactive" : "active"}.`,
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.data?.message || "Failed to update company vendor status.",
        type: "error",
      });
    },
  });
}

export const useProductTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)
  return useQuery({
    queryKey: ["productTypes", vendorId],
    queryFn: () => fetchProductTypes(vendorId!),
    enabled: !!vendorId,
  })
}

export const useSmallOrderRequestTypes = (vendorIdOverride?: number) => {
  const vendorId = useResolvedVendorId(vendorIdOverride);
  return useQuery({
    queryKey: getSmallOrderRequestTypesQueryKey(vendorId),
    queryFn: () => fetchSmallOrderRequestTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useUserTypes = () => {
  return useQuery({
    queryKey: ["userTypes"],
    queryFn: fetchUserTypes,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useCreateUser = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsersMasterQueryKey(vendorId) });
      toastManager.add({
        title: "User created successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to create user.",
        type: "error",
      });
    },
  });
}

export const useUpdateUser = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UpdateUserMasterPayload }) =>
      updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsersMasterQueryKey(vendorId) });
      toastManager.add({
        title: "User updated successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title: error?.response?.data?.message || "Failed to update user.",
        type: "error",
      });
    },
  });
}

export const useUpdateUserPrivileges = (vendorIdOverride?: number) => {
  const queryClient = useQueryClient();
  const vendorId = useResolvedVendorId(vendorIdOverride);

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: { vendor_id: number; privilege_ids: number[] };
    }) => updateUserPrivileges(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["privilegeMasters", vendorId],
      });
      toastManager.add({
        title: "User privileges updated successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      toastManager.add({
        title:
          error?.response?.data?.message ||
          "Failed to update user privileges.",
        type: "error",
      });
    },
  });
}

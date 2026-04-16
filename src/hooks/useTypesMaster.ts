// src/hooks/useTypesMaster.ts
import { useQuery } from "@tanstack/react-query"
import {
  createCompanyVendor,
  createInstallerUser,
  createIssueLogType,
  fetchInstallerUsersForMaster,
  fetchUsersForMaster,
  fetchCompanyVendorsForMaster,
  createMiscellaneousTeam,
  createMiscellaneousType,
  createSourceType,
  createSiteType,
  fetchIssueLogTypes,
  fetchMiscellaneousTeams,
  fetchMiscellaneousTypes,
  fetchSourceTypes,
  fetchProductStructureTypes,
  fetchSiteTypes,
  fetchSiteTypesForMaster,
  fetchProductTypes,
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

export const useCompanyVendorsForMaster = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
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
}) => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getUsersMasterQueryKey(vendorId).concat([
      params.page,
      params.limit,
      params.search ?? "",
    ]),
    queryFn: () => fetchUsersForMaster(vendorId!, params),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateCompanyVendor = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useInstallerUsersForMaster = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getInstallerUsersMasterQueryKey(vendorId),
    queryFn: () => fetchInstallerUsersForMaster(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateInstallerUser = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useMiscellaneousTeams = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getMiscellaneousTeamsQueryKey(vendorId),
    queryFn: () => fetchMiscellaneousTeams(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateMiscellaneousTeam = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useIssueLogTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getIssueLogTypesQueryKey(vendorId),
    queryFn: () => fetchIssueLogTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateIssueLogType = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useMiscellaneousTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getMiscellaneousTypesQueryKey(vendorId),
    queryFn: () => fetchMiscellaneousTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateMiscellaneousType = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useSourceTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  return useQuery({
    queryKey: getSourceTypesQueryKey(vendorId),
    queryFn: () => fetchSourceTypes(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useCreateSourceType = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useProductStructureTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)
  return useQuery({
    queryKey: ["productStructureTypes", vendorId],
    queryFn: () => fetchProductStructureTypes(vendorId!),
    enabled: !!vendorId,
  })
}

export const useSiteTypes = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)
  return useQuery({
    queryKey: getSiteTypesQueryKey(vendorId),
    queryFn: () => fetchSiteTypes(vendorId!),
    enabled: !!vendorId,
  })
}

export const useCreateSiteType = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useSiteTypesForMaster = () => {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id)
  return useQuery({
    queryKey: getSiteTypesMasterQueryKey(vendorId),
    queryFn: () => fetchSiteTypesForMaster(vendorId!),
    enabled: !!vendorId,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export const useUpdateSiteType = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateSiteTypeStatus = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateSourceType = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateSourceTypeStatus = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateMiscellaneousType = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateMiscellaneousTypeStatus = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateIssueLogType = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateIssueLogTypeStatus = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateMiscellaneousTeam = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateMiscellaneousTeamStatus = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateInstallerUser = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateInstallerUserStatus = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateCompanyVendor = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUpdateCompanyVendorStatus = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

export const useUserTypes = () => {
  return useQuery({
    queryKey: ["userTypes"],
    queryFn: fetchUserTypes,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

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

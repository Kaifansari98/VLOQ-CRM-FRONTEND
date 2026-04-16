import { apiClient } from "@/lib/apiClient"

export interface SiteTypeMasterEntry {
  id: number;
  type: string;
  status: string;
  vendor_id: number;
}

export interface SiteTypeMasterResponse {
  success: boolean;
  data: SiteTypeMasterEntry[];
}

export interface SourceTypeMasterEntry {
  id: number;
  type: string;
  status: string;
  vendor_id: number;
}

export interface SourceTypeMasterResponse {
  success: boolean;
  data: SourceTypeMasterEntry[];
}

export interface MiscellaneousTypeMasterEntry {
  id: number;
  name: string;
  status: string;
  vendor_id: number;
}

export interface MiscellaneousTypeMasterResponse {
  success: boolean;
  data: MiscellaneousTypeMasterEntry[];
}

export interface IssueLogTypeMasterEntry {
  id: number;
  name: string;
  status: string;
  vendor_id: number;
}

export interface IssueLogTypeMasterResponse {
  success: boolean;
  data: IssueLogTypeMasterEntry[];
}

export interface MiscellaneousTeamMasterEntry {
  id: number;
  name: string;
  status: string;
  vendor_id: number;
}

export interface MiscellaneousTeamMasterResponse {
  success: boolean;
  data: MiscellaneousTeamMasterEntry[];
}

export interface InstallerUserMasterEntry {
  id: number;
  installer_name: string;
  contact_number?: string | null;
  status: string;
  vendor_id: number;
}

export interface InstallerUserMasterResponse {
  success: boolean;
  data: InstallerUserMasterEntry[];
}

export interface CompanyVendorMasterEntry {
  id: number;
  vendor_code: string;
  company_name: string;
  point_of_contact: string;
  contact_no: string;
  email?: string | null;
  address?: string | null;
  in_house: boolean;
  is_deleted: boolean;
  vendor_id: number;
}

export interface CompanyVendorMasterResponse {
  success: boolean;
  data: CompanyVendorMasterEntry[];
}

export interface UserMasterEntry {
  id: number;
  vendor_id: number;
  franchise_id?: number | null;
  user_name: string;
  user_contact: string;
  user_email: string;
  user_timezone: string;
  status: string;
  created_at: string;
  user_type?: {
    user_type: string;
  } | null;
  franchise?: {
    franchise_name: string;
  } | null;
}

export interface UserMasterResponse {
  success: boolean;
  count: number;
  data: UserMasterEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecoards: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateSiteTypeMasterPayload {
  vendor_id: number;
  type: string;
}

export interface UpdateSiteTypeMasterPayload {
  type: string;
}

export interface UpdateSiteTypeStatusPayload {
  status: "active" | "inactive";
}

export interface CreateSourceTypeMasterPayload {
  vendor_id: number;
  type: string;
}

export interface UpdateSourceTypeMasterPayload {
  type: string;
}

export interface UpdateSourceTypeStatusPayload {
  status: "active" | "inactive";
}

export interface CreateMiscellaneousTypeMasterPayload {
  vendor_id: number;
  name: string;
  created_by: number;
}

export interface UpdateMiscellaneousTypeMasterPayload {
  name: string;
}

export interface UpdateMiscellaneousTypeStatusPayload {
  status: "active" | "inactive";
}

export interface CreateIssueLogTypeMasterPayload {
  vendor_id: number;
  name: string;
  created_by: number;
}

export interface UpdateIssueLogTypeMasterPayload {
  name: string;
}

export interface UpdateIssueLogTypeStatusPayload {
  status: "active" | "inactive";
}

export interface CreateMiscellaneousTeamMasterPayload {
  vendor_id: number;
  name: string;
  created_by: number;
}

export interface UpdateMiscellaneousTeamMasterPayload {
  name: string;
}

export interface UpdateMiscellaneousTeamStatusPayload {
  status: "active" | "inactive";
}

export interface CreateInstallerUserMasterPayload {
  vendor_id: number;
  installer_name: string;
  contact_number?: string;
  created_by: number;
}

export interface UpdateInstallerUserMasterPayload {
  installer_name: string;
  contact_number?: string;
}

export interface UpdateInstallerUserStatusPayload {
  status: "active" | "inactive";
}

export interface CreateCompanyVendorMasterPayload {
  vendor_code: string;
  company_name: string;
  point_of_contact: string;
  contact_no: string;
  email?: string;
  address?: string;
  created_by: number;
}

export interface UpdateCompanyVendorMasterPayload {
  vendor_code?: string;
  company_name?: string;
  point_of_contact?: string;
  contact_no?: string;
  email?: string;
  address?: string;
  updated_by: number;
}

export interface UpdateCompanyVendorStatusPayload {
  updated_by: number;
  is_deleted: boolean;
}

export const fetchSourceTypes = async (vendorId: number) => {
  const res = await apiClient.get<SourceTypeMasterResponse>(
    `/leads/get-all-source-types/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchProductStructureTypes = async (vendorId: number) => {
  const res = await apiClient.get(`/leads/get-all-productStructure-types/${vendorId}`)
  return res.data
}

export const fetchSiteTypes = async (vendorId: number) => {
  const res = await apiClient.get<SiteTypeMasterResponse>(`/leads/get-all-site-types/${vendorId}`)
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  }
}

export const fetchSiteTypesForMaster = async (vendorId: number) => {
  const res = await apiClient.get<SiteTypeMasterResponse>(
    `/leads/get-all-site-types-master/${vendorId}`,
  );

  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createSiteType = async (payload: CreateSiteTypeMasterPayload) => {
  const res = await apiClient.post(`/leads/create-site-type`, payload)
  return res.data
}

export const updateSiteType = async (id: number, payload: UpdateSiteTypeMasterPayload) => {
  const res = await apiClient.patch(`/leads/update-site-type/${id}`, payload)
  return res.data
}

export const updateSiteTypeStatus = async (
  id: number,
  payload: UpdateSiteTypeStatusPayload,
) => {
  const res = await apiClient.patch(`/leads/update-site-type-status/${id}`, payload)
  return res.data
}

export const createSourceType = async (payload: CreateSourceTypeMasterPayload) => {
  const res = await apiClient.post(`/leads/create-source-type`, payload)
  return res.data
}

export const updateSourceType = async (
  id: number,
  payload: UpdateSourceTypeMasterPayload,
) => {
  const res = await apiClient.patch(`/leads/update-source-type/${id}`, payload)
  return res.data
}

export const updateSourceTypeStatus = async (
  id: number,
  payload: UpdateSourceTypeStatusPayload,
) => {
  const res = await apiClient.patch(`/leads/update-source-type-status/${id}`, payload)
  return res.data
}

export const fetchMiscellaneousTypes = async (vendorId: number) => {
  const res = await apiClient.get<MiscellaneousTypeMasterResponse>(
    `/miscellaneous-master/type/vendor/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createMiscellaneousType = async (
  payload: CreateMiscellaneousTypeMasterPayload,
) => {
  const res = await apiClient.post(`/miscellaneous-master/type/create`, payload)
  return res.data
}

export const updateMiscellaneousType = async (
  id: number,
  payload: UpdateMiscellaneousTypeMasterPayload,
) => {
  const res = await apiClient.patch(`/miscellaneous-master/type/${id}`, payload)
  return res.data
}

export const updateMiscellaneousTypeStatus = async (
  id: number,
  payload: UpdateMiscellaneousTypeStatusPayload,
) => {
  const res = await apiClient.patch(`/miscellaneous-master/type/${id}/status`, payload)
  return res.data
}

export const fetchIssueLogTypes = async (vendorId: number) => {
  const res = await apiClient.get<IssueLogTypeMasterResponse>(
    `/issue-logs/issue-type/vendor/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createIssueLogType = async (
  payload: CreateIssueLogTypeMasterPayload,
) => {
  const res = await apiClient.post(`/issue-logs/issue-type/create`, payload)
  return res.data
}

export const updateIssueLogType = async (
  id: number,
  payload: UpdateIssueLogTypeMasterPayload,
) => {
  const res = await apiClient.patch(`/issue-logs/issue-type/${id}`, payload)
  return res.data
}

export const updateIssueLogTypeStatus = async (
  id: number,
  payload: UpdateIssueLogTypeStatusPayload,
) => {
  const res = await apiClient.patch(`/issue-logs/issue-type/${id}/status`, payload)
  return res.data
}

export const fetchMiscellaneousTeams = async (vendorId: number) => {
  const res = await apiClient.get<MiscellaneousTeamMasterResponse>(
    `/miscellaneous-master/team/vendor/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createMiscellaneousTeam = async (
  payload: CreateMiscellaneousTeamMasterPayload,
) => {
  const res = await apiClient.post(`/miscellaneous-master/team/create`, payload)
  return res.data
}

export const updateMiscellaneousTeam = async (
  id: number,
  payload: UpdateMiscellaneousTeamMasterPayload,
) => {
  const res = await apiClient.patch(`/miscellaneous-master/team/${id}`, payload)
  return res.data
}

export const updateMiscellaneousTeamStatus = async (
  id: number,
  payload: UpdateMiscellaneousTeamStatusPayload,
) => {
  const res = await apiClient.patch(`/miscellaneous-master/team/${id}/status`, payload)
  return res.data
}

export const fetchInstallerUsersForMaster = async (vendorId: number) => {
  const res = await apiClient.get<InstallerUserMasterResponse>(
    `/installer-users/vendorId/${vendorId}/get-all-installers-master`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchCompanyVendorsForMaster = async (vendorId: number) => {
  const res = await apiClient.get<CompanyVendorMasterResponse>(
    `/vendor/company-vendors/vendorId/${vendorId}/master`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchUsersForMaster = async (
  vendorId: number,
  params: { page: number; limit: number; search?: string; franchise_id?: number },
) => {
  const res = await apiClient.get<UserMasterResponse>(`/users/vendor/${vendorId}`, {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search ?? "",
      ...(params.franchise_id ? { franchise_id: params.franchise_id } : {}),
    },
  });
  return {
    success: Boolean(res.data?.success),
    count: Number(res.data?.count ?? 0),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
    pagination: res.data?.pagination ?? {
      currentPage: 1,
      totalPages: 1,
      totalRecoards: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

export const createInstallerUser = async (payload: CreateInstallerUserMasterPayload) => {
  const res = await apiClient.post(`/installer-users/create-installer-user`, payload)
  return res.data
}

export const createCompanyVendor = async (
  vendorId: number,
  payload: CreateCompanyVendorMasterPayload,
) => {
  const res = await apiClient.post(
    `/vendor/company-vendors/vendorId/${vendorId}/create`,
    payload,
  )
  return res.data
}

export const updateInstallerUser = async (
  id: number,
  payload: UpdateInstallerUserMasterPayload,
) => {
  const res = await apiClient.patch(
    `/installer-users/installerId/${id}/update-installer`,
    payload,
  )
  return res.data
}

export const updateCompanyVendor = async (
  vendorId: number,
  companyVendorId: number,
  payload: UpdateCompanyVendorMasterPayload,
) => {
  const res = await apiClient.put(
    `/vendor/company-vendors/vendorId/${vendorId}/companyVendorId/${companyVendorId}/update`,
    payload,
  )
  return res.data
}

export const updateInstallerUserStatus = async (
  id: number,
  payload: UpdateInstallerUserStatusPayload,
) => {
  const res = await apiClient.patch(
    `/installer-users/installerId/${id}/update-installer-status`,
    payload,
  )
  return res.data
}

export const updateCompanyVendorStatus = async (
  vendorId: number,
  companyVendorId: number,
  payload: UpdateCompanyVendorStatusPayload,
) => {
  const res = await apiClient.patch(
    `/vendor/company-vendors/vendorId/${vendorId}/companyVendorId/${companyVendorId}/status`,
    payload,
  )
  return res.data
}

export const fetchProductTypes = async (vendorId: number) => {
  const res = await apiClient.get(`/leads/get-all-product-types/${vendorId}`)
  return res.data
}

export interface FranchiseMasterEntry {
  id: number;
  franchise_name: string;
  vendor_id: number;
}

export interface FranchiseMasterResponse {
  success: boolean;
  data: FranchiseMasterEntry[];
}

export interface UserTypeMasterEntry {
  id: number;
  user_type: string;
}

export interface UserTypeMasterResponse {
  success: boolean;
  data: UserTypeMasterEntry[];
}

export interface CreateUserMasterPayload {
  vendor_id: number;
  franchise_id: number;
  user_name: string;
  user_contact: string;
  user_email: string;
  user_timezone: string;
  password: string;
  user_type_id: number;
  status?: string;
}

export const fetchFranchisesForVendor = async (vendorId: number) => {
  const res = await apiClient.get<FranchiseMasterResponse>(
    `/franchises/vendor/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchUserTypes = async () => {
  const res = await apiClient.get<UserTypeMasterResponse>(`/user-types`);
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createUser = async (payload: CreateUserMasterPayload) => {
  const res = await apiClient.post(`/users/create-user`, payload);
  return res.data;
}

export interface UpdateUserMasterPayload {
  user_name?: string;
  user_contact?: string;
  user_email?: string;
  user_timezone?: string;
  password?: string;
  user_type_id?: number;
  franchise_id?: number | null;
  status?: string;
}

export const updateUser = async (userId: number, payload: UpdateUserMasterPayload) => {
  const res = await apiClient.patch(`/users/update-user/${userId}`, payload);
  return res.data;
}

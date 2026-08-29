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
  is_active?: boolean | null;
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

export interface PrivilegeMasterEntry {
  id: number;
  vendor_id: number;
  code: string;
  parent_module: string;
  child_module: string;
  action: string;
  label: string;
  description?: string | null;
  is_active: boolean;
  is_selected: boolean;
}

export interface PrivilegeMasterChildSection {
  id: string;
  title: string;
  privileges: PrivilegeMasterEntry[];
}

export interface PrivilegeMasterGroup {
  id: string;
  title: string;
  privileges: PrivilegeMasterEntry[];
}

export interface PrivilegeMasterTab {
  id: string;
  title: string;
  groups: PrivilegeMasterGroup[];
}

export interface PrivilegeMasterSection {
  id: string;
  title: string;
  description: string;
  children?: PrivilegeMasterChildSection[];
  tabs?: PrivilegeMasterTab[];
}

export interface PrivilegeMasterResponse {
  success: boolean;
  data: PrivilegeMasterSection[];
}

export interface CarcassTypeMasterEntry {
  id: number;
  name: string;
  vendor_id: number;
  can_do_fast_production?: boolean;
}

export interface CarcassTypeMasterResponse {
  success: boolean;
  data: CarcassTypeMasterEntry[];
}

export interface ShutterSubTypeMasterEntry {
  id: number;
  name: string;
  shutter_type_id: number;
}

export interface ShutterTypeMasterEntry {
  id: number;
  name: string;
  vendor_id: number;
  subTypes?: ShutterSubTypeMasterEntry[];
}

export interface ShutterTypeMasterResponse {
  success: boolean;
  data: ShutterTypeMasterEntry[];
}

export interface CarcasMaterialFinishMasterEntry {
  id: number;
  name: string;
  carcas_material_id: number;
  material?: { id: number; name: string };
}

export interface CarcasMaterialFinishMasterResponse {
  success: boolean;
  data: CarcasMaterialFinishMasterEntry[];
}

export interface CarcasMaterialMasterEntry {
  id: number;
  name: string;
  vendor_id: number;
}

export interface CarcasMaterialMasterResponse {
  success: boolean;
  data: CarcasMaterialMasterEntry[];
}

export interface ShutterMaterialFinishMasterEntry {
  id: number;
  name: string;
  shutter_material_id: number;
  material?: { id: number; name: string };
}

export interface ShutterMaterialFinishMasterResponse {
  success: boolean;
  data: ShutterMaterialFinishMasterEntry[];
}

export interface ShutterMaterialMasterEntry {
  id: number;
  name: string;
  vendor_id: number;
}

export interface ShutterMaterialMasterResponse {
  success: boolean;
  data: ShutterMaterialMasterEntry[];
}

export interface SkirtingCarcassLegsColorMasterEntry {
  id: number;
  carcass_legs_id: number;
  skirting_carcass_legs_id: number;
  color: string;
  skirtingCarcassLegs?: { id: number; name: string };
}

export interface SkirtingCarcassLegsColorMasterResponse {
  success: boolean;
  data: SkirtingCarcassLegsColorMasterEntry[];
}

export interface SkirtingCarcassLegsMasterEntry {
  id: number;
  name: string;
  carcass_legs_id: number;
  inScope: boolean;
  carcassLegs?: { id: number; name: string };
}

export interface SkirtingCarcassLegsMasterResponse {
  success: boolean;
  data: SkirtingCarcassLegsMasterEntry[];
}

export interface CarcassLegsMasterEntry {
  id: number;
  name: string;
  vendor_id: number;
}

export interface CarcassLegsMasterResponse {
  success: boolean;
  data: CarcassLegsMasterEntry[];
}

export interface HandleTypeMasterEntry {
  id: number;
  name: string;
  vendor_id: number;
}

export interface HandleTypeMasterResponse {
  success: boolean;
  data: HandleTypeMasterEntry[];
}

export interface LightCarcasTypeMasterEntry {
  id: number;
  type: string;
  vendor_id: number;
}

export interface LightCarcasTypeMasterResponse {
  success: boolean;
  data: LightCarcasTypeMasterEntry[];
}

export interface LightCarcasUnitMasterEntry {
  id: number;
  type: string;
  vendor_id: number;
  light_carcas_type_id: number;
  lightCarcasType?: { id: number; type: string };
}

export interface LightCarcasUnitMasterResponse {
  success: boolean;
  data: LightCarcasUnitMasterEntry[];
}

export const OTHER_APPLIANCE_TYPES = ["Appliances", "Stone", "Sinks", "Faucets"] as const;

export interface OtherAppliancesMasterEntry {
  id: number;
  vendor_id: number;
  type: string;
  article_number: string;
  description: string;
}

export interface OtherAppliancesMasterResponse {
  success: boolean;
  data: OtherAppliancesMasterEntry[];
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

export interface CreateProductTypeMasterPayload {
  vendor_id: number;
  type: string;
}

export interface CreateCarcassTypePayload {
  vendor_id: number;
  name: string;
}

export interface CreateCarcasMaterialPayload {
  vendor_id: number;
  name: string;
}

export interface CreateCarcassMaterialFinishPayload {
  carcas_material_id: number;
  name: string;
}

export interface BulkUploadCarcassMaterialFinishesResponse {
  success: boolean;
  data: {
    typesCreated: number;
    materialsCreated: number;
    finishesCreated: number;
    successCount: number;
    skippedCount: number;
    skippedRows: Array<{
      row: Record<string, string>;
      reason: string;
    }>;
  };
}

export interface CreateShutterTypePayload {
  vendor_id: number;
  name: string;
}

export interface CreateHandleTypePayload {
  vendor_id: number;
  name: string;
}

export interface CreateShutterSubTypePayload {
  shutter_type_id: number;
  name: string;
}

export interface CreateTimelineRulePayload {
  vendor_id: number;
  carcass_id: number;
  shutter_id: number | null;
  kitchen_manufacturing_days: number;
  other_manufacturing_days: number;
  kitchen_manufacturing_days_for_fast_production?: number | null;
  other_manufacturing_days_for_fast_production?: number | null;
}

export interface UpdateTimelineRulePayload extends CreateTimelineRulePayload {
  id: number;
}

export interface CreateShutterMaterialPayload {
  vendor_id: number;
  name: string;
}

export interface CreateShutterMaterialFinishPayload {
  shutter_material_id: number;
  name: string;
}

export interface BulkUploadShutterMaterialFinishesResponse {
  success: boolean;
  data: {
    typesCreated: number;
    materialsCreated: number;
    finishesCreated: number;
    successCount: number;
    skippedCount: number;
    skippedRows: Array<{
      row: Record<string, string>;
      reason: string;
    }>;
  };
}

export interface CreateCarcassLegsPayload {
  vendor_id: number;
  name: string;
}

export interface CreateSkirtingCarcassLegsPayload {
  carcass_legs_id: number;
  name: string;
  inScope: boolean;
}

export interface CreateSkirtingCarcassLegsColorPayload {
  carcass_legs_id: number;
  skirting_carcass_legs_id: number;
  color: string;
}

export interface BulkUploadSkirtingCarcassLegsColorsResponse {
  success: boolean;
  data: {
    typesCreated: number;
    materialsCreated: number;
    finishesCreated: number;
    successCount: number;
    skippedCount: number;
    skippedRows: Array<{
      row: Record<string, string>;
      reason: string;
    }>;
  };
}

export interface CreateLightCarcasTypePayload {
  vendor_id: number;
  type: string;
}

export interface CreateLightCarcasUnitPayload {
  vendor_id: number;
  type: string;
  light_carcas_type_id: number;
}

export interface BulkUploadLightCarcasUnitsResponse {
  success: boolean;
  data: {
    typesCreated: number;
    unitsCreated: number;
    successCount: number;
    skippedCount: number;
    skippedRows: Array<{
      row: Record<string, string>;
      reason: string;
    }>;
  };
}

export interface BulkUploadOtherAppliancesResponse {
  success: boolean;
  data: {
    createdCount: number;
    updatedCount: number;
    successCount: number;
    skippedCount: number;
    skippedRows: Array<{
      row: number;
      sheet: string;
      reason: string;
    }>;
  };
}

export interface CreateOtherAppliancesPayload {
  vendor_id: number;
  type: string;
  article_number: string;
  description: string;
}

export interface CreateProductStructureMasterPayload {
  vendor_id: number;
  type: string;
  product_type_id: number;
}

export interface CreateProductSubStructureMasterPayload {
  vendor_id: number;
  type: string;
  product_structure_id: number;
}

export interface CreateProductItemCodeMasterPayload {
  vendor_id: number;
  item_code: string;
  product_structure_id: number;
  sub_product_structure_id: number;
  description: string;
  specification: string;
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
  in_house?: boolean;
  created_by: number;
}

export interface UpdateCompanyVendorMasterPayload {
  vendor_code?: string;
  company_name?: string;
  point_of_contact?: string;
  contact_no?: string;
  email?: string;
  address?: string;
  in_house?: boolean;
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

export const fetchProductSubStructures = async (vendorId: number) => {
  const res = await apiClient.get(
    `/leads/get-all-product-sub-structures/${vendorId}`,
  );
  return res.data;
}

export const fetchProductItemCodes = async (vendorId: number) => {
  const res = await apiClient.get(
    `/leads/get-all-product-item-codes/${vendorId}`,
  );
  return res.data;
}

export const fetchCarcassTypes = async (
  vendorId: number,
  onlyFastProduction: boolean = false,
) => {
  const res = await apiClient.get<CarcassTypeMasterResponse>(
    `/leads/get-all-carcass-types/${vendorId}`,
    {
      params: onlyFastProduction ? { only_fast_production: true } : undefined,
    },
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchShutterTypes = async (vendorId: number) => {
  const res = await apiClient.get<ShutterTypeMasterResponse>(
    `/leads/get-all-shutter-types/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data)
      ? res.data.data.map((item) => ({
          ...item,
          subTypes: Array.isArray(item.subTypes) ? item.subTypes : [],
        }))
      : [],
  };
}

export const createCarcassType = async (payload: CreateCarcassTypePayload) => {
  const res = await apiClient.post("/leads/create-carcass-type", payload);
  return res.data;
}

export const fetchCarcasMaterials = async (vendorId: number) => {
  const res = await apiClient.get<CarcasMaterialMasterResponse>(
    `/leads/get-all-carcas-materials/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createCarcasMaterial = async (
  payload: CreateCarcasMaterialPayload,
) => {
  const res = await apiClient.post("/leads/create-carcas-material", payload);
  return res.data;
}

export const fetchCarcassMaterialFinishes = async (carcasMaterialId: number) => {
  const res = await apiClient.get<CarcasMaterialFinishMasterResponse>(
    `/leads/get-carcass-material-finishes/${carcasMaterialId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchAllCarcassMaterialFinishes = async (vendorId: number) => {
  const res = await apiClient.get<CarcasMaterialFinishMasterResponse>(
    `/leads/get-all-carcass-material-finishes/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createCarcassMaterialFinish = async (
  payload: CreateCarcassMaterialFinishPayload,
) => {
  const res = await apiClient.post(
    "/leads/create-carcass-material-finish",
    payload,
  );
  return res.data;
}

export const uploadCarcassMaterialFinishes = async (formData: FormData) => {
  const res = await apiClient.post<BulkUploadCarcassMaterialFinishesResponse>(
    "/leads/upload-carcass-material-finish",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
}

export const createShutterType = async (payload: CreateShutterTypePayload) => {
  const res = await apiClient.post("/leads/create-shutter-type", payload);
  return res.data;
}

export const createShutterSubType = async (
  payload: CreateShutterSubTypePayload,
) => {
  const res = await apiClient.post("/leads/create-shutter-sub-type", payload);
  return res.data;
}

export const createHandleType = async (payload: CreateHandleTypePayload) => {
  const res = await apiClient.post("/leads/create-handle-type", payload);
  return res.data;
}

export const createTimelineRule = async (payload: CreateTimelineRulePayload) => {
  const res = await apiClient.post("/leads/create-timeline-rule", payload);
  return res.data;
}

export const updateTimelineRule = async (payload: UpdateTimelineRulePayload) => {
  const { id, ...body } = payload;
  const res = await apiClient.patch(`/leads/update-timeline-rule/${id}`, body);
  return res.data;
}

export const fetchShutterMaterials = async (vendorId: number) => {
  const res = await apiClient.get<ShutterMaterialMasterResponse>(
    `/leads/get-all-shutter-materials/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createShutterMaterial = async (
  payload: CreateShutterMaterialPayload,
) => {
  const res = await apiClient.post("/leads/create-shutter-material", payload);
  return res.data;
}

export const fetchShutterMaterialFinishes = async (shutterMaterialId: number) => {
  const res = await apiClient.get<ShutterMaterialFinishMasterResponse>(
    `/leads/get-shutter-material-finishes/${shutterMaterialId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchAllShutterMaterialFinishes = async (vendorId: number) => {
  const res = await apiClient.get<ShutterMaterialFinishMasterResponse>(
    `/leads/get-all-shutter-material-finishes/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createShutterMaterialFinish = async (
  payload: CreateShutterMaterialFinishPayload,
) => {
  const res = await apiClient.post(
    "/leads/create-shutter-material-finish",
    payload,
  );
  return res.data;
}

export const uploadShutterMaterialFinishes = async (formData: FormData) => {
  const res = await apiClient.post<BulkUploadShutterMaterialFinishesResponse>(
    "/leads/upload-shutter-material-finish",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
}

export const fetchCarcassLegs = async (vendorId: number) => {
  const res = await apiClient.get<CarcassLegsMasterResponse>(
    `/leads/get-all-carcass-legs/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createCarcassLegs = async (payload: CreateCarcassLegsPayload) => {
  const res = await apiClient.post("/leads/create-carcass-legs", payload);
  return res.data;
}

export const fetchSkirtingCarcassLegs = async (carcassLegsId: number) => {
  const res = await apiClient.get<SkirtingCarcassLegsMasterResponse>(
    `/leads/get-skirting-carcass-legs/${carcassLegsId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchAllSkirtingCarcassLegs = async (vendorId: number) => {
  const res = await apiClient.get<SkirtingCarcassLegsMasterResponse>(
    `/leads/get-all-skirting-carcass-legs/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createSkirtingCarcassLegs = async (
  payload: CreateSkirtingCarcassLegsPayload,
) => {
  const res = await apiClient.post(
    "/leads/create-skirting-carcass-legs",
    payload,
  );
  return res.data;
}

export const fetchSkirtingCarcassLegsColors = async (
  skirtingCarcassLegsId: number,
) => {
  const res = await apiClient.get<SkirtingCarcassLegsColorMasterResponse>(
    `/leads/get-skirting-carcass-legs-colors/${skirtingCarcassLegsId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchAllSkirtingCarcassLegsColors = async (vendorId: number) => {
  const res = await apiClient.get<SkirtingCarcassLegsColorMasterResponse>(
    `/leads/get-all-skirting-carcass-legs-colors/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createSkirtingCarcassLegsColor = async (
  payload: CreateSkirtingCarcassLegsColorPayload,
) => {
  const res = await apiClient.post(
    "/leads/create-skirting-carcass-legs-color",
    payload,
  );
  return res.data;
}

export const uploadSkirtingCarcassLegsColors = async (formData: FormData) => {
  const res = await apiClient.post<BulkUploadSkirtingCarcassLegsColorsResponse>(
    "/leads/upload-skirting-carcass-legs-color",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
}

export const fetchLightCarcasTypes = async (vendorId: number) => {
  const res = await apiClient.get<LightCarcasTypeMasterResponse>(
    `/leads/get-all-light-carcas-types/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createLightCarcasType = async (
  payload: CreateLightCarcasTypePayload,
) => {
  const res = await apiClient.post("/leads/create-light-carcas-type", payload);
  return res.data;
}

export const fetchLightCarcasUnits = async (lightCarcasTypeId: number) => {
  const res = await apiClient.get<LightCarcasUnitMasterResponse>(
    `/leads/get-light-carcas-units/${lightCarcasTypeId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchAllLightCarcasUnits = async (vendorId: number) => {
  const res = await apiClient.get<LightCarcasUnitMasterResponse>(
    `/leads/get-all-light-carcas-units/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createLightCarcasUnit = async (
  payload: CreateLightCarcasUnitPayload,
) => {
  const res = await apiClient.post("/leads/create-light-carcas-unit", payload);
  return res.data;
}

export const uploadLightCarcasUnits = async (formData: FormData) => {
  const res = await apiClient.post<BulkUploadLightCarcasUnitsResponse>(
    "/leads/upload-light-carcas-unit",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
}

export const fetchOtherAppliances = async (vendorId: number) => {
  const res = await apiClient.get<OtherAppliancesMasterResponse>(
    `/leads/get-all-other-appliances/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const createOtherAppliances = async (
  payload: CreateOtherAppliancesPayload,
) => {
  const res = await apiClient.post("/leads/create-other-appliances", payload);
  return res.data;
}

export const uploadOtherAppliances = async (
  formData: FormData,
): Promise<BulkUploadOtherAppliancesResponse> => {
  const res = await apiClient.post<BulkUploadOtherAppliancesResponse>(
    "/leads/upload-other-appliances",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
};

export const downloadOtherAppliancesReport = async (
  vendorId: number,
): Promise<void> => {
  const res = await apiClient.get(
    `/leads/download-other-appliances/${vendorId}`,
    { responseType: "blob" }
  );
  const url = URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  const date = new Date().toISOString().split("T")[0];
  link.download = `other_appliances_${vendorId}_${date}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

export const fetchHandleTypes = async (vendorId: number) => {
  const res = await apiClient.get<HandleTypeMasterResponse>(
    `/leads/get-all-handle-types/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
}

export const fetchFastProductionTimelineRules = async (vendorId: number) => {
  const res = await apiClient.get(
    `/leads/get-fast-production-timeline-rules/${vendorId}`,
  );
  return {
    success: Boolean(res.data?.success),
    data: Array.isArray(res.data?.data) ? res.data.data : [],
  };
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

export const fetchB2BRequirementTypes = async (vendorId: number) => {
  const res = await apiClient.get(`/leads/get-all-b2b-requirement-types/${vendorId}`)
  return res.data
}

export const createB2BRequirementTypeApi = async (payload: { vendor_id: number; type: string }) => {
  const res = await apiClient.post("/leads/create-b2b-requirement-type", payload)
  return res.data
}

export const saveLeadB2BRequirementMappingsApi = async (payload: {
  lead_id: number;
  vendor_id: number;
  b2b_requirement_type_ids: number[];
  approximate_budget?: number;
  project_status?: string;
}) => {
  const res = await apiClient.post("/leads/save-lead-b2b-requirement-mappings", payload);
  return res.data;
};

export const fetchLeadB2BRequirementMappingsApi = async (leadId: number, vendorId: number) => {
  const res = await apiClient.get(`/leads/get-lead-b2b-requirement-mappings/${leadId}?vendor_id=${vendorId}`);
  return res.data;
};

export const fetchProcessBriefs = async (vendorId: number) => {
  const res = await apiClient.get(`/leads/get-all-process-briefs/${vendorId}`)
  return res.data
}

export const saveLeadProcessBriefsApi = async (payload: {
  lead_id: number;
  vendor_id: number;
  mappings?: { product_type_id?: number; b2b_requirement_type_id?: number; process_brief_id: number }[];
  process_brief_ids?: number[];
  created_by?: number;
}) => {
  const res = await apiClient.post("/leads/save-lead-process-briefs", payload);
  return res.data;
};

export const fetchLeadProcessBriefsApi = async (leadId: number, vendorId: number) => {
  const res = await apiClient.get(`/leads/get-lead-process-briefs/${leadId}?vendor_id=${vendorId}`);
  return res.data;
};

export const createProductType = async (
  payload: CreateProductTypeMasterPayload,
) => {
  const res = await apiClient.post("/leads/create-product-type", payload);
  return res.data;
}

export const createProductStructure = async (
  payload: CreateProductStructureMasterPayload,
) => {
  const res = await apiClient.post("/leads/create-product-structure", payload);
  return res.data;
}

export const createProductSubStructure = async (
  payload: CreateProductSubStructureMasterPayload,
) => {
  const res = await apiClient.post(
    "/leads/create-product-sub-structure",
    payload,
  );
  return res.data;
}

export const createProductItemCode = async (
  payload: CreateProductItemCodeMasterPayload,
) => {
  const res = await apiClient.post("/leads/create-product-item-code", payload);
  return res.data;
}

export const fetchSmallOrderRequestTypes = async (vendorId: number) => {
  const res = await apiClient.get(
    `/leads/get-all-small-order-request-types/${vendorId}`,
  );
  return res.data;
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

export const fetchPrivilegeMasters = async (
  vendorId: number,
  search?: string,
  userId?: number | null,
) => {
  const res = await apiClient.get<PrivilegeMasterResponse>(
    `/users/vendor/${vendorId}/privilege-masters`,
    {
      params: {
        search: search ?? "",
        ...(userId ? { userId } : {}),
      },
    },
  );
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

export interface UpdateUserPrivilegesPayload {
  vendor_id: number;
  privilege_ids: number[];
}

export const updateUserPrivileges = async (
  userId: number,
  payload: UpdateUserPrivilegesPayload,
) => {
  const res = await apiClient.patch(
    `/users/update-user/${userId}/privileges`,
    payload,
  );
  return res.data;
}

// -------------------------------------------------------------
// Detailed Company Vendor API Definitions & Clients
// -------------------------------------------------------------

export interface CompanyVendorAddressEntry {
  id?: number;
  address_line_1: string;
  address_line_2?: string | null;
  landmark?: string | null;
  pincode: string;
  state_id: number;
  city_id: number;
  is_primary: boolean;
  state?: { id: number; name: string };
  city?: { id: number; name: string };
}

export interface CompanyVendorContactEntry {
  id?: number;
  name: string;
  department?: string | null;
  phone: string;
  designation?: string | null;
  email?: string | null;
  is_primary: boolean;
}

export interface CompanyVendorBankEntry {
  id?: number;
  holder_name: string;
  account_no: string;
  ifsc: string;
  swift?: string | null;
  branch: string;
  cancelled_cheque_path?: string | null;
  cancelled_cheque_url?: string | null;
  is_default: boolean;
}

export interface CompanyVendorDocMappingEntry {
  id?: number;
  document_type_id: number;
  file_path?: string;
  document_url?: string;
  documentType?: { id: number; document_name: string };
}

export interface DetailedCompanyVendorEntry {
  id: number;
  vendor_code: string;
  company_name: string;
  vendor_name: string;
  point_of_contact: string;
  contact_no: string;
  email?: string | null;
  address?: string | null;
  alternate_mobile_no?: string | null;
  alternate_email?: string | null;
  gst_no?: string | null;
  pan_no?: string | null;
  is_active?: boolean | null;
  default_payment_term_id?: number | null;
  in_house: boolean;
  is_deleted: boolean;
  vendor_id: number;
  addresses: CompanyVendorAddressEntry[];
  contactPersons: CompanyVendorContactEntry[];
  bankAccounts: CompanyVendorBankEntry[];
  documents: CompanyVendorDocMappingEntry[];
  vendorTypes: { id: number; vendor_type_id: number; vendorType?: { id: number; vendor_type_name: string } }[];
  defaultPaymentTerm?: { id: number; term_name: string };
  paymentTerms?: { id?: number; term_name: string; description?: string | null; is_active?: boolean }[];
}

export interface DetailedCompanyVendorResponse {
  success: boolean;
  data: DetailedCompanyVendorEntry;
}

export interface CompanyVendorMetaData {
  vendorTypes: { id: number; vendor_type_name: string }[];
  documentTypes: { id: number; document_name: string }[];
  states: { id: number; name: string }[];
  cities: { id: number; name: string; state_id: number }[];
  paymentTerms: { id: number; term_name: string }[];
}

export interface CompanyVendorMetaDataResponse {
  success: boolean;
  data: CompanyVendorMetaData;
}

export const fetchCompanyVendorMetaData = async (vendorId: number) => {
  const res = await apiClient.get<CompanyVendorMetaDataResponse>(
    `/vendor/company-vendors/meta?vendor_id=${vendorId}`
  );
  return res.data;
};

export const fetchDetailedCompanyVendor = async (id: number) => {
  const res = await apiClient.get<DetailedCompanyVendorResponse>(
    `/vendor/company-vendors/${id}`
  );
  return res.data;
};

export const createDetailedCompanyVendor = async (formData: FormData, vendorId: number, userId: number) => {
  const res = await apiClient.post(
    `/vendor/company-vendors`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        "x-vendor-id": vendorId.toString(),
        "x-user-id": userId.toString(),
      },
    }
  );
  return res.data;
};

export const updateDetailedCompanyVendor = async (id: number, formData: FormData, vendorId: number, userId: number) => {
  const res = await apiClient.put(
    `/vendor/company-vendors/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        "x-vendor-id": vendorId.toString(),
        "x-user-id": userId.toString(),
      },
    }
  );
  return res.data;
};

export const deleteDetailedCompanyVendor = async (id: number, vendorId: number, userId: number) => {
  const res = await apiClient.delete(
    `/vendor/company-vendors/${id}`,
    {
      headers: {
        "x-vendor-id": vendorId.toString(),
        "x-user-id": userId.toString(),
      },
    }
  );
  return res.data;
};

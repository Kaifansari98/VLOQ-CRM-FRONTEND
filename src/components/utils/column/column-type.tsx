export type LeadColumn = {
  srNo: number; // n
  id: number; //n
  lead_code: string; // R
  name: string; // R
  contact: string; // R
  productTypes: string; // R
  status: string; // R
  siteType: string; // R
  assign_to?: string; // R
  siteAddress: string; // R
  architechName: string;
  source: string;
  createdAt: string | number;
  altContact?: string;
  email: string; // R
  // site_supervisor?: string;
  productStructures: string;
  designerRemark: string;
  accountId: number; // n
  updatedAt: string; //n
  site_map_link?: string;
};


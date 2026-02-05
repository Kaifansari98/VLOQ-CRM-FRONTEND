export type LeadColumn = {
  rowKey?: string;
  instanceId?: number;
  srNo: number; // n
  id: number; //n
  lead_code: string; // R
  name: string; // R
  contact: string; // R
  furnitureType: string; // R
  status: string; // R
  siteType: string; // R
  sales_executive?: string; // R
  assignedToId?: number;
  siteAddress: string; // R
  architechName: string;
  source: string;
  createdAt: string | number;
  altContact?: string;
  email: string; // R
  // site_supervisor?: string;
  furnitueStructures: string;
  designerRemark: string;
  accountId: number; // n
  updatedAt: string; //n
  site_map_link?: string;
  statusTag?: string;
};

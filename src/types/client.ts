export interface ClientType {
  id: number;
  vendor_id: number;
  type: string;
  is_active: boolean;
  created_at: string;
}

export interface Client {
  id: number;
  vendor_id: number;
  name: string;
  contact: string;
  alt_contact?: string | null;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  clientCode: string;
  gst_number?: string | null;
  company_name?: string | null;
  client_type_id?: number | null;
  clientType?: ClientType | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientDTO {
  vendor_id: number;
  name: string;
  contact: string;
  alt_contact?: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  clientCode: string;
  gst_number?: string;
  company_name?: string;
  client_type_id?: number;
  is_active?: boolean;
}

export interface UpdateClientDTO extends Partial<Omit<CreateClientDTO, "vendor_id">> {}

export interface ClientListResponse {
  success: boolean;
  message: string;
  data: {
    data: Client[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ClientResponse {
  success: boolean;
  message: string;
  data: Client;
}

export interface ClientTypeListResponse {
  success: boolean;
  message: string;
  data: ClientType[];
}

export interface ClientTypeResponse {
  success: boolean;
  message: string;
  data: ClientType;
}

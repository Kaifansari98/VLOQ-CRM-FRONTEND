export interface ArchitectureMaster {
  id: number;
  vendorId: number;
  name: string;
  email: string;
  mobile: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  is_deleted: boolean;
  deleted_at: string | null;
}

export interface CreateArchitectureMasterDTO {
  vendorId: number;
  name: string;
  email: string;
  mobile: string;
  is_active?: boolean;
}

export interface UpdateArchitectureMasterDTO extends Partial<CreateArchitectureMasterDTO> {}

export interface UpdateArchitectureMasterStatusDTO {
  is_active: boolean;
}

export interface ArchitectureMasterListResponse {
  success: boolean;
  message: string;
  data: {
    data: ArchitectureMaster[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ArchitectureMasterResponse {
  success: boolean;
  message: string;
  data: ArchitectureMaster;
}

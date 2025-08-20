import { apiClient } from "@/lib/apiClient"

export interface CreateLeadPayload {
    firstname: string
    lastname: string
    country_code: string
    contact_no: string
    alt_contact_no?: string
    email: string
    site_address?: string
    site_type_id: number
    priority: string
    billing_name?: string
    source_id: number
    archetech_name?: string
    designer_remark?: string
    vendor_id: number
    created_by: number
    product_types?: string[]
    product_structures?: string[]
  }
  
  export const createLead = async (payload: CreateLeadPayload, files: File[] = []) => {
    const formData = new FormData()
    
    console.log('[DEBUG] Frontend payload:', payload)
    
    // Append all form fields
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            formData.append(key, item.toString())
          })
        } else {
          formData.append(key, value.toString())
        }
      }
    })
    
    // Append files
    files.forEach((file) => {
      formData.append('documents', file)
    })
    
    // Debug FormData contents
    console.log('[DEBUG] FormData entries:')
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1])
    }
    
    try {
      const response = await apiClient.post('leads/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      return response.data
    } catch (error: any) {
      console.error('[DEBUG] API Error:', error.response?.data)
      throw error
    }
  }
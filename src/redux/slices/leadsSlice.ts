// slices/leadsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Lead } from '@/api/leads'

interface LeadsState {
  vendorLeads: Lead[]
  vendorUserLeads: Lead[]
  selectedVendorId: number | null
  selectedUserId: number | null
  isLoading: boolean
  error: string | null
}

const initialState: LeadsState = {
  vendorLeads: [],
  vendorUserLeads: [],
  selectedVendorId: null,
  selectedUserId: null,
  isLoading: false,
  error: null,
}

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setVendorLeads: (state, action: PayloadAction<Lead[]>) => {
      state.vendorLeads = action.payload
    },
    setVendorUserLeads: (state, action: PayloadAction<Lead[]>) => {
      state.vendorUserLeads = action.payload
    },
    setSelectedVendorId: (state, action: PayloadAction<number>) => {
      state.selectedVendorId = action.payload
    },
    setSelectedUserId: (state, action: PayloadAction<number>) => {
      state.selectedUserId = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearLeads: (state) => {
      state.vendorLeads = []
      state.vendorUserLeads = []
    },
  },
})

export const {
  setVendorLeads,
  setVendorUserLeads,
  setSelectedVendorId,
  setSelectedUserId,
  setLoading,
  setError,
  clearLeads,
} = leadsSlice.actions

export default leadsSlice.reducer
// src/redux/slices/TypesMasterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface TypesState {
  sourceTypes: unknown[]
  productStructureTypes: any[]
  siteTypes: any[]
  productTypes: any[]
  isLoading: boolean
  error: string | null
}

const initialState: TypesState = {
  sourceTypes: [],
  productStructureTypes: [],
  siteTypes: [],
  productTypes: [],
  isLoading: false,
  error: null,
}

const typesMasterSlice = createSlice({
  name: "typesMaster",
  initialState,
  reducers: {
    setSourceTypes: (state, action: PayloadAction<any[]>) => {
      state.sourceTypes = action.payload
    },
    setProductStructureTypes: (state, action: PayloadAction<any[]>) => {
      state.productStructureTypes = action.payload
    },
    setSiteTypes: (state, action: PayloadAction<any[]>) => {
      state.siteTypes = action.payload
    },
    setProductTypes: (state, action: PayloadAction<any[]>) => {
      state.productTypes = action.payload
    },
  },
})

export const {
  setSourceTypes,
  setProductStructureTypes,
  setSiteTypes,
  setProductTypes,
} = typesMasterSlice.actions

export default typesMasterSlice.reducer
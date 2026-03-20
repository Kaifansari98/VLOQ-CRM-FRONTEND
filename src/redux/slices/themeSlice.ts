import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ThemeMapping {
  id: number;
  theme_id: number;
  key: string;
  light: string;
  dark: string;
}

export interface Theme {
  id: number;
  vendor_id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  mappings: ThemeMapping[];
}

interface ThemeState {
  activeTheme: Theme | null;
}

const initialState: ThemeState = {
  activeTheme: null,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setActiveTheme: (state, action: PayloadAction<Theme | null>) => {
      state.activeTheme = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) {
          localStorage.setItem("activeTheme", JSON.stringify(action.payload));
        } else {
          localStorage.removeItem("activeTheme");
        }
      }
    },
    loadThemeFromStorage: (state) => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("activeTheme");
        if (stored) {
          try {
            state.activeTheme = JSON.parse(stored);
          } catch {
            state.activeTheme = null;
          }
        }
      }
    },
    clearTheme: (state) => {
      state.activeTheme = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("activeTheme");
      }
    },
  },
});

export const { setActiveTheme, loadThemeFromStorage, clearTheme } = themeSlice.actions;
export default themeSlice.reducer;

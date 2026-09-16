import { createContext, useContext } from "react";

interface DetailsContextProps {
  leadId: number;
  accountId: number;
  canBook?: boolean;
}

const DetailsContext = createContext<DetailsContextProps | null>(null);

export const useDetails = () => {
  const context = useContext(DetailsContext);
  if (!context)
    throw new Error("useDetails must be used inside DetailsProvider");
  return context;
};

export const DetailsProvider = DetailsContext.Provider;

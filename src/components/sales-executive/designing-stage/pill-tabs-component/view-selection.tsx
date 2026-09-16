import React from "react";
import { useDetails } from "./details-context";
import { useAppSelector } from "@/redux/store";
import { useSelectionData } from "@/hooks/designing-stage/designing-leads-hooks";

const ViewSelection = () => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data, isLoading, isError } = useSelectionData(vendorId!, leadId!);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p className="text-red-500">Failed to load selections</p>;

  // ✅ helper function to find desc by type
  const getDesc = (type: string) =>
    data?.data?.find((item) => item.type.toLowerCase() === type.toLowerCase())
      ?.desc || "No description available";

  return (
    <div>
      {/* Carcas */}
      <div className="flex flex-col gap-1 mt-4">
        <p className="text-sm font-medium">Carcas</p>
        <div className="bg-muted border rounded-sm h-20 py-1 px-2 text-sm max-h-200 overflow-y-auto">
          {getDesc("Carcas")}
        </div>
      </div>

      {/* Handles */}
      <div className="flex flex-col gap-1 mt-4">
        <p className="text-sm font-medium">Handles</p>
        <div className="bg-muted border rounded-sm h-20 py-1 px-2 text-sm max-h-200 overflow-y-auto">
          {getDesc("Handles")}
        </div>
      </div>

      {/* Shutter */}
      <div className="flex flex-col gap-1 mt-4">
        <p className="text-sm font-medium">Shutter</p>
        <div className="bg-muted border rounded-sm h-20 py-1 px-2 text-sm max-h-200 overflow-y-auto">
          {getDesc("Shutter")}
        </div>
      </div>
    </div>
  );
};

export default ViewSelection;

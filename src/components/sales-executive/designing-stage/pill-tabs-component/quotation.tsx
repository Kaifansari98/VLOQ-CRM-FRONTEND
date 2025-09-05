import React from "react";
import { useDetails } from "./details-context";

const QuotationTab = () => {
  const { leadId, accountId } = useDetails();
  return (
    <div className="w-full bg-red-500">
      <h1>LeadId: {leadId}</h1>
    </div>
  );
};

export default QuotationTab;

import React from "react";

interface QuotationProps {
  leadId: number | null;
}

const QuotationTab = ({ leadId }: QuotationProps) => {
  return (
    <div className="w-full h-full bg-red-500">
      Lead ID: {leadId}
    </div>
  );
};

export default QuotationTab;

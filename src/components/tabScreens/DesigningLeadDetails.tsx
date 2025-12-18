"use client";

import { motion } from "framer-motion";
import { DetailsProvider } from "../sales-executive/designing-stage/pill-tabs-component/details-context";
import PillTabs from "../sales-executive/designing-stage/pill-tabs";
import QuotationTab from "../sales-executive/designing-stage/pill-tabs-component/quotation";
import MeetingsTab from "../sales-executive/designing-stage/pill-tabs-component/meetings";
import DesigningTab from "../sales-executive/designing-stage/pill-tabs-component/designs";
import SelectionsTab from "../sales-executive/designing-stage/pill-tabs-component/selection";

type props = {
  leadId: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
};

export default function DesigningLeadsDetails({ leadId }: props) {
  const accountId = leadId;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg w-full h-full py-4 bg-[#fff] dark:bg-[#0a0a0a]"
    >
      <DetailsProvider value={{ leadId, accountId }}>
        <PillTabs
          bookingBtn={false}
          tabs={[
            {
              id: "quotation",
              label: "Quotation",
              content: <QuotationTab />,
            },
            { id: "meetings", label: "Meetings", content: <MeetingsTab /> },
            {
              id: "designs",
              label: "Designs",
              content: <DesigningTab />,
            },
            {
              id: "selections",
              label: "Selections",
              content: <SelectionsTab />,
            },
          ]}
        />
      </DetailsProvider>
    </motion.div>
  );
}

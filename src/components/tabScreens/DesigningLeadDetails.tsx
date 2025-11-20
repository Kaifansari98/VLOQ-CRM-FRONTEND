"use client";

import { motion } from "framer-motion";
import { useAppSelector } from "@/redux/store";
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

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

export default function DesigningLeadsDetails({ leadId }: props) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const accountId = leadId;

  const InfoField = ({ label, value, icon: Icon }: any) => (
    <motion.div variants={itemVariants} className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <label className="text-sm font-medium ">{label}</label>
      </div>
      <p className="pl-6">{value || "—"}</p>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg w-full h-full py-4 overflow-y-scroll bg-[#fff] dark:bg-[#0a0a0a]"
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
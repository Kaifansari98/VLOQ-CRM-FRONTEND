"use client";

import { motion } from "framer-motion";
import { useLeadById } from "@/hooks/useLeadsQueries";
import { useAppSelector } from "@/redux/store";
import PillTabs from "./pill-tabs";
import { DetailsProvider } from "./pill-tabs-component/details-context";
import QuotationTab from "./pill-tabs-component/quotation";
import MeetingsTab from "./pill-tabs-component/meetings";
import DesigningStageTable from "@/app/_components/designing-stage-table";
import SelectionsTab from "./pill-tabs-component/selection";
import DesigningTab from "./pill-tabs-component/designs";
interface leadInfo {
  leadId: number;
  accountId: number;
}
type props = {
  leadInfo: leadInfo;
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

export default function DesigningLeadsDetails({ leadInfo }: props) {
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const leadId = leadInfo.leadId;
  const accountId = leadInfo.accountId;

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
      className="border rounded-lg w-full h-full"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="border rounded-lg w-full h-full p-4"
      >
        <DetailsProvider value={{ leadId, accountId }}>
          <PillTabs
            addButtons={false}
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
    </motion.div>
  );
}

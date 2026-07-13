"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { DetailsProvider } from "../sales-executive/designing-stage/pill-tabs-component/details-context";
import PillTabs from "../sales-executive/designing-stage/pill-tabs";
import QuotationTab from "../sales-executive/designing-stage/pill-tabs-component/quotation";
import MeetingsTab from "../sales-executive/designing-stage/pill-tabs-component/meetings";
import DesigningTab from "../sales-executive/designing-stage/pill-tabs-component/designs";
import SpecificationsTab from "../sales-executive/designing-stage/pill-tabs-component/specifications";
import CostingFileTab from "../sales-executive/designing-stage/pill-tabs-component/costing-file";
import ElectricalPlumbingTab from "../sales-executive/designing-stage/pill-tabs-component/electrical-plumbing";
import FinalIsmUploadTab from "../sales-executive/designing-stage/pill-tabs-component/final-ism-upload";
import { useAppSelector } from "@/redux/store";
import { useLeadById } from "@/hooks/useLeadsQueries";
import {
  FileText,
  Calendar,
  Palette,
  ClipboardList,
  Receipt,
  Zap,
  Upload,
} from "lucide-react";

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
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const userType = useAppSelector(
    (state) => state.auth.user?.user_type?.user_type?.toLowerCase(),
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const handlesLargeScaleProjects = useAppSelector(
    (state) => state.auth.user?.vendor?.handlesLargeScaleProjects === true,
  );
  const { data: leadData } = useLeadById(leadId, vendorId, userId);
  const accountId = leadData?.data?.lead?.account_id ?? leadId;

  const tabs = React.useMemo(() => {
    const baseTabs = [
      {
        id: "quotation",
        label: "Quotation",
        icon: FileText,
        content: <QuotationTab />,
        customPrivilegeCode: "leads.designing_stage.quotation.view",
      },
      {
        id: "meetings",
        label: "Meetings",
        icon: Calendar,
        content: <MeetingsTab />,
        customPrivilegeCode: "leads.designing_stage.meetings.view",
      },
      {
        id: "designs",
        label: "Designs",
        icon: Palette,
        content: <DesigningTab />,
        customPrivilegeCode: "leads.designing_stage.designs.view",
      },
    ];

    const gatedTabs =
      userType !== "custom"
        ? baseTabs.map(({ customPrivilegeCode, ...tab }) => tab)
        : baseTabs
            .filter((tab) => customPrivilegeCodes.includes(tab.customPrivilegeCode))
            .map(({ customPrivilegeCode, ...tab }) => tab);

    if (!handlesLargeScaleProjects) return gatedTabs;

    return [
      ...gatedTabs,
      {
        id: "specifications",
        label: "Specifications",
        icon: ClipboardList,
        content: <SpecificationsTab />,
      },
      {
        id: "costing-file",
        label: "Costing File",
        icon: Receipt,
        content: <CostingFileTab />,
      },
      {
        id: "electrical-plumbing",
        label: "Electrical & Plumbing",
        icon: Zap,
        content: <ElectricalPlumbingTab />,
      },
      {
        id: "final-ism-upload",
        label: "Revised ISM",
        icon: Upload,
        content: <FinalIsmUploadTab />,
      },
    ];
  }, [customPrivilegeCodes, userType, handlesLargeScaleProjects]);

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
          tabs={tabs}
        />
      </DetailsProvider>
    </motion.div>
  );
}

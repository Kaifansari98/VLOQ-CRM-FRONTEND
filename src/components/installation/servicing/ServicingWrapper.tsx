"use client";

import SmoothTab from "@/components/kokonutui/smooth-tab";
import { Settings2, ShieldCheck } from "lucide-react";
import ServicingDetails from "./ServicingDetails";
import AmcServicingDetails from "./AmcServicingDetails";

export default function ServicingWrapper() {
  const TAB_ITEMS = [
    {
      id: "servicing",
      title: (
        <div className="flex items-center gap-1">
          <Settings2 className="w-3 h-3" />
          Servicing
        </div>
      ),
      color: "bg-zinc-900 hover:bg-zinc-900",
      cardContent: (
        <div className="p-2 bg-[#fff] dark:bg-[#0a0a0a]">
          <ServicingDetails />
        </div>
      ),
    },
    {
      id: "amcServicing",
      title: (
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          AMC Servicing
        </div>
      ),
      color: "bg-zinc-900 hover:bg-zinc-900",
      cardContent: (
        <div className="p-2 bg-[#fff] dark:bg-[#0a0a0a]">
          <AmcServicingDetails />
        </div>
      ),
    },
  ];

  return (
    <SmoothTab items={TAB_ITEMS} defaultTabId="servicing" className="w-fit" />
  );
}

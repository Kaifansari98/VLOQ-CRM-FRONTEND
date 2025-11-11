"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { StageId } from "@/types/lead-stage-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  canViewToOrderLoginDetails,
  canViewToProductionDetails,
} from "./privileges";
import { useAppSelector } from "@/redux/store";
import CustomeTooltip from "../cutome-tooltip";

type GroupKey = "leads" | "project" | "production" | "installation";

interface GroupedSmoothTabProps {
  groups: Partial<
    Record<
      GroupKey,
      ReadonlyArray<{ id: StageId; title: string; component: React.ReactNode }>
    >
  >;
  defaultTabId: StageId;
  onChange?: (tabId: StageId) => void;
}

const groupLabels: Record<GroupKey, string> = {
  leads: "Leads",
  project: "Project",
  production: "Production",
  installation: "Installation",
};

export default function GroupedSmoothTab({
  groups,
  defaultTabId,
  onChange,
}: GroupedSmoothTabProps) {
  const [activeTab, setActiveTab] = React.useState<StageId>(defaultTabId);
  const [hoveredGroup, setHoveredGroup] = React.useState<GroupKey | null>(null);
  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type as string | undefined
  );

  // Determine the active group based on the current tab
  const [activeGroup, setActiveGroup] = React.useState<GroupKey>(() => {
    const found = (Object.keys(groups) as GroupKey[]).find((g) =>
      groups[g]?.some((i) => i.id === defaultTabId)
    );
    return (found as GroupKey) ?? "leads";
  });

  // Flatten all items for rendering content
  const allItems = React.useMemo(
    () =>
      (Object.keys(groups) as GroupKey[]).flatMap((key) => groups[key] || []),
    [groups]
  );

  const activeComponent = React.useMemo(
    () => allItems.find((i) => i.id === activeTab)?.component,
    [allItems, activeTab]
  );

  const handleSelect = (g: GroupKey, id: StageId) => {
    setActiveGroup(g);
    setActiveTab(id);
    setHoveredGroup(null);
    onChange?.(id);
  };

  const getActiveTabTitle = () =>
    allItems.find((i) => i.id === activeTab)?.title || "";

  return (
    <div className="flex flex-col h-full">
      {/* Top-level grouped tab header */}
      <div className="flex items-center gap-2 border-b px-1">
        {(Object.keys(groups) as GroupKey[]).map((g) => {
          const isActive = activeGroup === g;
          const isHovered = hoveredGroup === g;
          const items = groups[g];

          return (
            <div
              key={g}
              className="relative"
              onMouseEnter={() => setHoveredGroup(g)}
              onMouseLeave={() => setHoveredGroup(null)}
            >
              <Button
                variant="ghost"
                className={cn(
                  "relative px-4 h-10 rounded-none border-b transition-all duration-200",
                  isActive
                    ? "border-primary text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-primary after:rounded-full"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {groupLabels[g]}
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      isHovered && "rotate-180"
                    )}
                  />
                </span>
              </Button>

              {/* Dropdown menu on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-56 bg-popover rounded-md border shadow-md z-50"
                  >
                    <div className="p-1">
                      <TooltipProvider>
                        {items?.map((item) => {
                          const canViewOrderLogin =
                            canViewToOrderLoginDetails(userType);
                          const canViewProduction =
                            canViewToProductionDetails(userType);

                          const isDisabled =
                            (item.id === "orderLogin" && !canViewOrderLogin) ||
                            (item.id === "production" && !canViewProduction);

                          const tooltipText = isDisabled
                            ? item.id === "orderLogin"
                              ? "No permission to access Order Login"
                              : "No permission to access Production Stage"
                            : null;

                          const button = (
                            <button
                              onClick={() =>
                                !isDisabled && handleSelect(g, item.id)
                              }
                              disabled={isDisabled}
                              className={cn(
                                "relative w-full px-2 py-1.5 text-sm rounded-sm text-left transition-colors",
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-accent hover:text-accent-foreground",
                                activeTab === item.id &&
                                  "bg-primary/10 text-primary font-medium"
                              )}
                            >
                              {item.title}
                            </button>
                          );

                          return (
                            <div key={item.id}>
                              {tooltipText ? (
                                <CustomeTooltip
                                  value={tooltipText}
                                  truncateValue={button}
                                />
                              ) : (
                                button
                              )}
                            </div>
                          );
                        })}
                      </TooltipProvider>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Current tab title */}
        <div className="ml-auto py-1 px-3 rounded-2xl flex items-center gap-2 bg-muted text-xs text-muted-foreground">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <p className="font-medium text-foreground">{getActiveTabTitle()}</p>
        </div>
      </div>

      {/* Active content */}
      <div className="relative flex-1 mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeComponent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

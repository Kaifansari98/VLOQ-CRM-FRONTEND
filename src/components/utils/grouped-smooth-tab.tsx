"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { StageId } from "@/types/lead-stage-types";
import {
  TooltipProvider,
} from "../ui/tooltip";
import {
  canViewToOrderLoginDetails,
  canViewAndWorkProductionDetails,
} from "./privileges";
import { useAppSelector } from "@/redux/store";
import CustomeTooltip from "../custom-tooltip";

type GroupKey = "leads" | "project" | "production" | "installation";

interface GroupedSmoothTabProps {
  groups: Record<
    GroupKey,
    ReadonlyArray<{ id: StageId; title: string; component: React.ReactNode }>
  >;
  defaultTabId: StageId;
  onChange?: (tabId: StageId) => void;
  maxVisibleStage?: StageId;
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
  maxVisibleStage,
}: GroupedSmoothTabProps) {
  const [activeTab, setActiveTab] = React.useState<StageId>(defaultTabId);

  const [hoveredGroup, setHoveredGroup] = React.useState<GroupKey | null>(null);

  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type as string | undefined
  );

  // ✅ Limit visible items by maxVisibleStage
  const visibleGroups = React.useMemo(() => {
    if (!maxVisibleStage) return groups;

    const allStageOrder: StageId[] = [
      "details",
      "measurement",
      "designing",
      "booking",
      "finalMeasurement",
      "clientdocumentation",
      "clientApproval",
      "techcheck",
      "orderLogin",
      "production",
      "readyToDispatch",
      "siteReadiness",
      "dispatchPlanning", 
      "dispatch",
      "underInstallation",
    ];

    const maxIndex = allStageOrder.indexOf(maxVisibleStage);
    const visibleSet = new Set(allStageOrder.slice(0, maxIndex + 1));

    const filteredGroups = {} as typeof groups;
    (Object.keys(groups) as GroupKey[]).forEach((key) => {
      filteredGroups[key] = groups[key].filter((i) => visibleSet.has(i.id));
    });

    return filteredGroups;
  }, [groups, maxVisibleStage]);

  const [activeGroup, setActiveGroup] = React.useState<GroupKey>(() => {
    const foundGroup = (Object.keys(groups) as GroupKey[]).find((g) =>
      groups[g].some((i) => i.id === defaultTabId)
    );
    return foundGroup && visibleGroups[foundGroup].length > 0
      ? (foundGroup as GroupKey)
      : "leads";
  });

  const allItems = React.useMemo(
  () => [
    ...(visibleGroups.leads || []),
    ...(visibleGroups.project || []),
    ...(visibleGroups.production || []),
    ...(visibleGroups.installation || []),
  ],
  [visibleGroups]
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

  const getActiveTabTitle = () => {
    return allItems.find((i) => i.id === activeTab)?.title || "";
  };

  return (
    <div className="flex flex-col h-full">
      {/* ShadCN-style tabs with hover dropdowns */}
      <div className="flex items-center gap-2 border-b px-1 -mt-2">
        {(Object.keys(visibleGroups) as GroupKey[]).map((g) => {
          const isActive = activeGroup === g;
          const isHovered = hoveredGroup === g;
          const items = visibleGroups[g];

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
                  "relative px-4 h-10 rounded-none border-b-0.5 transition-all duration-200",
                  isActive
                    ? "border-primary text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-primary after:rounded-full after:transition-all after:duration-300"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {groupLabels[g]}
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
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
                        {items.map((item) => {
                          // 🔍 Role-based permission checks
                          const canViewOrderLogin =
                            canViewToOrderLoginDetails(userType);
                          const canViewProduction =
                            canViewAndWorkProductionDetails(userType);

                          // 👇 Compute disabled state and tooltip dynamically
                          const isDisabled =
                            (item.id === "orderLogin" && !canViewOrderLogin) ||
                            (item.id === "production" && !canViewProduction);

                          const tooltipText = isDisabled
                            ? item.id === "orderLogin"
                              ? "You don’t have permission to access Order Login"
                              : "You don’t have permission to access Production Stage"
                            : null;

                          return (
                            <div key={item.id}>
                              {tooltipText ? (
                                <CustomeTooltip
                                  truncateValue={
                                    <button
                                      onClick={() =>
                                        !isDisabled && handleSelect(g, item.id)
                                      }
                                      disabled={isDisabled}
                                      className={cn(
                                        "relative w-full px-2 py-1.5 text-sm rounded-sm text-left transition-colors",
                                        isDisabled
                                          ? "opacity-50 cursor-not-allowed"
                                          : "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none",
                                        activeTab === item.id &&
                                          "bg-primary/10 text-primary font-medium rounded-sm"
                                      )}
                                    >
                                      {item.title}
                                      {activeTab === item.id && !isDisabled && (
                                        <motion.div
                                          layoutId="active-indicator"
                                          className="absolute inset-0 bg-accent rounded-sm -z-10"
                                          transition={{
                                            type: "spring",
                                            stiffness: 380,
                                            damping: 30,
                                          }}
                                        />
                                      )}
                                    </button>
                                  }
                                  value={tooltipText}
                                />
                              ) : (
                                <button
                                  onClick={() =>
                                    !isDisabled && handleSelect(g, item.id)
                                  }
                                  disabled={isDisabled}
                                  className={cn(
                                    "relative w-full px-2 py-1.5 text-sm rounded-sm text-left transition-colors",
                                    isDisabled
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none",
                                    activeTab === item.id &&
                                      "bg-primary/10 text-primary font-medium rounded-sm"
                                  )}
                                >
                                  {item.title}
                                  {activeTab === item.id && !isDisabled && (
                                    <motion.div
                                      layoutId="active-indicator"
                                      className="absolute inset-0 bg-accent rounded-sm -z-10"
                                      transition={{
                                        type: "spring",
                                        stiffness: 380,
                                        damping: 30,
                                      }}
                                    />
                                  )}
                                </button>
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

        {/* Active tab indicator badge */}
        <div className="ml-auto py-1 px-3 rounded-2xl flex items-center justify-center gap-2 bg-muted text-xs text-muted-foreground">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <p className="rounded-md text-foreground font-medium">
            {getActiveTabTitle()}
          </p>
        </div>
      </div>

      {/* Active content with smooth transitions */}
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

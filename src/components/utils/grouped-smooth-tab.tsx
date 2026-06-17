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

type GroupKey =
  | "leads"
  | "project"
  | "production"
  | "installation"
  | "servicing";

interface GroupedSmoothTabProps {
  groups: Record<
    GroupKey,
    ReadonlyArray<{ id: StageId; title: string; component: React.ReactNode }>
  >;
  defaultTabId: StageId;
  onChange?: (tabId: StageId) => void;
  maxVisibleStage?: StageId;
}

interface StageRenderBoundaryProps {
  activeGroup: GroupKey;
  activeTab: StageId;
  children: React.ReactNode;
}

interface StageRenderBoundaryState {
  hasError: boolean;
  retryKey: number;
  isRetrying: boolean;
}

class StageRenderBoundary extends React.Component<
  StageRenderBoundaryProps,
  StageRenderBoundaryState
> {
  retryTimer: ReturnType<typeof setTimeout> | null = null;

  state: StageRenderBoundaryState = {
    hasError: false,
    retryKey: 0,
    isRetrying: false,
  };

  static getDerivedStateFromError(): Partial<StageRenderBoundaryState> {
    return { hasError: true, isRetrying: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[GroupedSmoothTab] Stage render failed", {
      activeGroup: this.props.activeGroup,
      activeTab: this.props.activeTab,
      error,
      componentStack: errorInfo.componentStack,
    });

    this.clearRetryTimer();
    this.retryTimer = setTimeout(() => {
      this.setState((prev) => ({
        hasError: false,
        isRetrying: false,
        retryKey: prev.retryKey + 1,
      }));
    }, 250);
  }

  componentDidUpdate(prevProps: StageRenderBoundaryProps) {
    if (
      prevProps.activeTab !== this.props.activeTab &&
      (this.state.hasError || this.state.isRetrying)
    ) {
      this.clearRetryTimer();
      this.setState({ hasError: false, isRetrying: false });
    }
  }

  componentWillUnmount() {
    this.clearRetryTimer();
  }

  clearRetryTimer = () => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  };

  handleRetry = () => {
    this.clearRetryTimer();
    this.setState((prev) => ({
      hasError: false,
      isRetrying: false,
      retryKey: prev.retryKey + 1,
    }));
  };

  render() {
    if (this.state.isRetrying) {
      return (
        <div className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          Loading...
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive flex flex-col items-start gap-3">
          <p>Failed to load this section. Check the browser console for stage logs.</p>
          <button
            onClick={this.handleRetry}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.retryKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const groupLabels: Record<GroupKey, string> = {
  leads: "Leads",
  project: "Project",
  production: "Production",
  installation: "Installation",
  servicing: "Servicing",
};

export default function GroupedSmoothTab({
  groups,
  defaultTabId,
  onChange,
  maxVisibleStage,
}: GroupedSmoothTabProps) {
  const [activeTab, setActiveTab] = React.useState<StageId>(defaultTabId);

  const [hoveredGroup, setHoveredGroup] = React.useState<GroupKey | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setHoveredGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const userType = useAppSelector(
    (state) => state.auth?.user?.user_type.user_type as string | undefined
  );
  const customPrivilegeCodes = useAppSelector(
    (state) => state.customPrivileges.codes,
  );
  const effectiveUserType =
    userType === "admin" ? "sales-executive" : userType;

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
      "finalHandover",
      "servicing",
    ];

    const maxIndex = allStageOrder.indexOf(maxVisibleStage);
    const visibleSet = new Set(allStageOrder.slice(0, maxIndex + 1));

    const filteredGroups = {} as typeof groups;
    (Object.keys(groups) as GroupKey[]).forEach((key) => {
      filteredGroups[key] = groups[key].filter((i) => visibleSet.has(i.id));
    });

    return filteredGroups;
  }, [groups, maxVisibleStage]);

  const nonEmptyGroupKeys = React.useMemo(
    () =>
      (Object.keys(visibleGroups) as GroupKey[]).filter(
        (key) => visibleGroups[key].length > 0,
      ),
    [visibleGroups],
  );

  const [activeGroup, setActiveGroup] = React.useState<GroupKey>(() => {
    const foundGroup = (Object.keys(visibleGroups) as GroupKey[]).find((g) =>
      visibleGroups[g].some((i) => i.id === defaultTabId)
    );
    return (
      foundGroup ??
      nonEmptyGroupKeys[0] ??
      "leads"
    );
  });

  const allItems = React.useMemo(
    () => [
      ...(visibleGroups.leads || []),
      ...(visibleGroups.project || []),
      ...(visibleGroups.production || []),
      ...(visibleGroups.installation || []),
      ...(visibleGroups.servicing || []),
    ],
    [visibleGroups]
  );

  const activeComponent = React.useMemo(
    () => allItems.find((i) => i.id === activeTab)?.component,
    [allItems, activeTab]
  );

  React.useEffect(() => {
    const activeItemExists = allItems.some((item) => item.id === activeTab);
    if (!activeItemExists && allItems.length > 0) {
      const fallbackItem = allItems[0];
      const fallbackGroup = (Object.keys(visibleGroups) as GroupKey[]).find(
        (group) => visibleGroups[group].some((item) => item.id === fallbackItem.id)
      );

      console.warn("[GroupedSmoothTab] Active tab missing from visible groups", {
        activeTab,
        defaultTabId,
        availableTabs: allItems.map((item) => item.id),
        fallbackTab: fallbackItem.id,
      });

      if (fallbackGroup) {
        setActiveGroup(fallbackGroup);
      }
      setActiveTab(fallbackItem.id);
      onChange?.(fallbackItem.id);
    }
  }, [activeTab, allItems, defaultTabId, onChange, visibleGroups]);

  React.useEffect(() => {
    if (
      nonEmptyGroupKeys.length > 0 &&
      !nonEmptyGroupKeys.includes(activeGroup)
    ) {
      setActiveGroup(nonEmptyGroupKeys[0]);
    }
  }, [activeGroup, nonEmptyGroupKeys]);

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
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* ShadCN-style tabs with hover dropdowns */}
      <div className="flex flex-wrap items-center gap-2 border-b px-1 -mt-2">
        {nonEmptyGroupKeys.map((g) => {
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
                onClick={() => setHoveredGroup(hoveredGroup === g ? null : g)}
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
                          const isAuditor = userType?.toLowerCase() === "auditor";
                          const canViewOrderLogin =
                            isAuditor ||
                            (userType === "custom"
                              ? customPrivilegeCodes.some((code) =>
                                code.startsWith("production.order_login."),
                              )
                              : canViewToOrderLoginDetails(
                                effectiveUserType ?? "",
                              ));
                          const canViewProduction =
                            isAuditor ||
                            (userType === "custom"
                              ? customPrivilegeCodes.some((code) =>
                                code.startsWith("production.production."),
                              )
                              : canViewAndWorkProductionDetails(
                                effectiveUserType ?? "",
                              ));
                          const canViewReadyToDispatch =
                            userType === "custom"
                              ? customPrivilegeCodes.includes(
                                "production.production.ready_to_dispatch.enable_disable",
                              )
                              : true;
                          const canViewTechCheckForCustomUser =
                            userType === "custom"
                              ? customPrivilegeCodes.includes(
                                "production.tech_check.tech_check_details.view",
                              )
                              : true;

                          // 👇 Compute disabled state and tooltip dynamically
                          const isDisabled =
                            (item.id === "techcheck" &&
                              !canViewTechCheckForCustomUser) ||
                            (item.id === "orderLogin" && !canViewOrderLogin) ||
                            (item.id === "production" && !canViewProduction) ||
                            (item.id === "readyToDispatch" &&
                              !canViewReadyToDispatch);

                          const tooltipText = isDisabled
                            ? item.id === "techcheck"
                              ? "You don’t have permission to access Tech Check"
                              : item.id === "orderLogin"
                                ? "You don’t have permission to access Order Login"
                                : item.id === "readyToDispatch"
                                  ? "You don’t have permission to access Ready To Dispatch"
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
          <StageRenderBoundary
            key={activeTab}
            activeGroup={activeGroup}
            activeTab={activeTab}
          >
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeComponent ?? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  No content is available for tab <strong>{activeTab}</strong>.
                </div>
              )}
            </motion.div>
          </StageRenderBoundary>
        </AnimatePresence>
      </div>
    </div>
  );
}

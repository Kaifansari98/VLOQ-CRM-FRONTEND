"use client";
import { apiClient } from "@/lib/apiClient";
import { useAppSelector } from "@/redux/store";
import { ClipboardList, Monitor, Users } from "lucide-react";
import Header from "../track-trace/Header";
import Filters from "../track-trace/Filters";
import KPICard from "../ui/KPICard";
import RealTimeTracking from "../track-trace/RealTimeTracking";
import MachineStatus from "../track-trace/MachineStatus";
import ProductionChart from "../track-trace/ProductionChart";
import TopOperators from "../track-trace/TopOperators";
import ProjectProgress from "../track-trace/ProjectProgress";
import BottleneckAnalysis from "../track-trace/BottleneckAnalysis";
import { FilterOptions } from "@/types/track-trace";
import KPICardSQFT from "../ui/KPICardSQFT";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import MachineUtilizationChart from "./MachineUtilizationChart";
import HourlyProductionChart from "./HourlyProductionChart";



export default function TraceTraceDashboard() {
  const [filters, setFilters] = useState<FilterOptions>({
    project: "all",
    machine: "all",
    operator: "all",
    status: "all",
    dateRange: "today",
    startDate: undefined,
    endDate: undefined,
  });

  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);

  const fetchTrackTraceData = async () => {
    if (!vendorId) return null;

    const projectMachineOperator = new URLSearchParams();
    if (filters.project !== "all")
      projectMachineOperator.append("project_id", filters.project);
    if (filters.machine !== "all")
      projectMachineOperator.append("machine_id", filters.machine);
    if (filters.operator !== "all")
      projectMachineOperator.append("created_by", filters.operator);

    const machineOnly = new URLSearchParams();
    if (filters.machine !== "all")
      machineOnly.append("machine_id", filters.machine);

    const dateParams = new URLSearchParams();
    if (filters.dateRange) dateParams.append("date_range", filters.dateRange);
    if (
      filters.dateRange === "custom" &&
      filters.startDate &&
      filters.endDate
    ) {
      dateParams.append("start_date", filters.startDate);
      dateParams.append("end_date", filters.endDate);
    }

    const machineOperatorDate = new URLSearchParams([
      ...machineOnly.entries(),
      ...(filters.operator !== "all" ? [["created_by", filters.operator]] : []),
      ...dateParams.entries(),
    ]);

    const machineDate = new URLSearchParams([
      ...machineOnly.entries(),
      ...dateParams.entries(),
    ]);

    const projectOperatorDate = new URLSearchParams([
      ...(filters.project !== "all" ? [["project_id", filters.project]] : []),
      ...(filters.operator !== "all" ? [["created_by", filters.operator]] : []),
      ...dateParams.entries(),
    ]);

    const [
      kpisRes,
      itemsRes,
      machinesRes,
      hourlyProductionRes,
      machineUtilizationRes,
      operatorsRes,
      projectsRes,
      bottlenecksRes,
    ] = await Promise.all([
      apiClient.get(`/track-trace/kpis/${vendorId}`, { params: dateParams }),
      apiClient.get(`/track-trace/items/${vendorId}`, {
        params: projectMachineOperator,
      }),
      apiClient.get(`/track-trace/machine-status/${vendorId}`, {
        params: machineOperatorDate,
      }),
      apiClient.get(`/track-trace/hourly-production/${vendorId}`, {
        params: projectMachineOperator,
      }),
      apiClient.get(`/track-trace/machine-utilization/${vendorId}`, {
        params: machineDate,
      }),
      apiClient.get(`/track-trace/top-performer/${vendorId}`, {
        params: machineDate,
      }),
      apiClient.get(`/track-trace/project-progress/${vendorId}`, {
        params: projectOperatorDate,
      }),
      apiClient.get(`/track-trace/bottle-neck/${vendorId}`, {
        params: machineOnly,
      }),
    ]);

    return {
      kpis: kpisRes.data.data,
      items: itemsRes.data.data,
      machines: machinesRes.data.data,
      hourlyProductionData: hourlyProductionRes.data.data,
      machineUtilizationData: machineUtilizationRes.data.data,
      operators: operatorsRes.data.data,
      projects: projectsRes.data.data,
      bottlenecks: bottlenecksRes.data.data,
    };
  };

  const { data, isLoading } = useQuery({
    queryKey: ["track-trace", vendorId, filters],
    queryFn: fetchTrackTraceData,
    enabled: !!vendorId,
    refetchInterval: 500000,
    placeholderData: (previousData) => previousData,
  });

  const {
    kpis,
    items,
    machines,
    hourlyProductionData,
    machineUtilizationData,
    operators,
    projects,
    bottlenecks,
  } = data ?? {};

  useEffect(() => {
    console.log("Current Filters:", filters);
  }, [filters]);

  return (
    <div className="min-h-screen">
      <Header />
      <Filters onFilterChange={setFilters} />

      <main className="w-full max-w-400 px-5">
        {/* ── KPI Cards ─────────────────────────────────────────────── */}
        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            <KPICardSQFT
              title="Total Items Processed"
              value={kpis.totalItemsProcessed.value}
              change={kpis.totalItemsProcessed.change}
              subtitle={kpis.totalItemsProcessed.subtitle}
              trend={kpis.totalItemsProcessed.trend}
              icon={<ClipboardList className="w-6 h-6" />}
              sqft={kpis.totalItemsProcessed.sqft}
            />
            <KPICard
              title="Active Machines"
              value={kpis.activeMachines.value}
              change={kpis.activeMachines.change}
              subtitle={kpis.activeMachines.subtitle}
              trend={kpis.activeMachines.trend}
              icon={<Monitor className="w-6 h-6 text-muted-foreground" />}
            />
            <KPICard
              title="Active Operators"
              value={kpis.activeOperators.value}
              change={kpis.activeOperators.change}
              subtitle={kpis.activeOperators.subtitle}
              trend={kpis.activeOperators.trend}
              icon={<Users className="w-6 h-6 text-muted-foreground" />}
            />
          </div>
        )}

        {/* ── Real-Time Tracking + Machine Status ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 mb-5">
          {!isLoading && items && <RealTimeTracking items={items} />}
          {!isLoading && machines && <MachineStatus machines={machines} />}
        </div>

        {/* ── Top Operators + Project Progress ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 mb-5">
          {!isLoading && operators && <TopOperators operators={operators} />}
          {!isLoading && projects && <ProjectProgress projects={projects} />}
        </div>

        {/* ── Bottleneck Analysis ───────────────────────────────────── */}
        {!isLoading && bottlenecks && (
          <div className="mb-5">
            <BottleneckAnalysis bottlenecks={bottlenecks} />
          </div>
        )}

        {/* ── Charts ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {!isLoading && hourlyProductionData && (
            <HourlyProductionChart data={hourlyProductionData} />
          )}
          {!isLoading && machineUtilizationData && (
            <MachineUtilizationChart data={machineUtilizationData} />
          )}
        </div>
      </main>
    </div>
  );
}

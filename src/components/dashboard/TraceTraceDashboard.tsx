"use client";
import { apiClient } from "@/lib/apiClient";
import { useCallback, useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    useAdminProjectsOverview,
    useAdminStageCounts,
    useAdminTotalRevenue,
} from "@/api/dashboard/useDashboard";
import { useAppSelector } from "@/redux/store";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, ArrowUpRight, ClipboardList, Clock, Monitor, Users } from "lucide-react";
import Header from "../track-trace/Header";
import Filters from "../track-trace/Filters";
import KPICard from "../ui/KPICard";
import RealTimeTracking from "../track-trace/RealTimeTracking";
import MachineStatus from "../track-trace/MachineStatus";
import ProductionChart from "../track-trace/ProductionChart";
import TopOperators from "../track-trace/TopOperators";
import ProjectProgress from "../track-trace/ProjectProgress";
import BottleneckAnalysis from "../track-trace/BottleneckAnalysis";
import Alerts from "../track-trace/Alerts";
import ActivityLogTable from "../track-trace/ActivityLogTable";
import { Footer } from "react-day-picker";



import { FilterOptions } from "@/types/track-trace";
import KPICardSQFT from "../ui/KPICardSQFT";
import { useQuery } from "@tanstack/react-query";





export default function TraceTraceDashboard() {


    // const [kpis, setKpis] = useState<any>(null);
    // const [items, setItems] = useState<any[]>([]);
    // const [machines, setMachines] = useState<any[]>([]);

    // const [hourlyProductionData, setHourlyProductionData] = useState<any>(null);
    // const [machineUtilizationData, setMachineUtilizationData] = useState<any>(null);
    // const [operators, setOperators] = useState<any[]>([]);
    // const [projects, setProjects] = useState<any[]>([]);
    // const [bottlenecks, setBottlenecks] = useState<any[]>([]);

    // const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FilterOptions>({
        project: 'all',
        machine: 'all',
        operator: 'all',
        dateRange: 'today',
        status: 'all',
    });
    const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);



    const fetchTrackTraceData = async () => {
        if (!vendorId) return null;
        
        const params = new URLSearchParams();
        if (filters.project !== "all") params.append("project_id", filters.project);
        if (filters.machine !== "all") params.append("machine_id", filters.machine);
        if (filters.operator !== "all") params.append("operator_id", filters.operator);
        if (filters.status !== "all") params.append("status", filters.status);

        const [
            kpisRes,
            itemsRes,
            machinesRes,
            hourlyProductionDataRes,
            machineUtilizationDataRes,
            operatorsRes,
            projectsRes,
            bottlenecksRes,
        ] = await Promise.all([
            apiClient.get(`/track-trace/kpis/${vendorId}`, { params }),
            apiClient.get(`/track-trace/items/${vendorId}`, { params }),
            apiClient.get(`/track-trace/machine-status/${vendorId}`, { params }),
            apiClient.get(`/track-trace/hourly-production/${vendorId}`, { params }),
            apiClient.get(`/track-trace/machine-utilization/${vendorId}`, { params }),
            apiClient.get(`/track-trace/top-performer/${vendorId}`, { params }),
            apiClient.get(`/track-trace/project-progress/${vendorId}`, { params }),
            apiClient.get(`/track-trace/bottle-neck/${vendorId}`, { params }),
        ]);

        return {
            kpis: kpisRes.data.data,
            items: itemsRes.data.data,
            machines: machinesRes.data.data,
            hourlyProductionData: hourlyProductionDataRes.data.data,
            machineUtilizationData: machineUtilizationDataRes.data.data,
            operators: operatorsRes.data.data,
            projects: projectsRes.data.data,
            bottlenecks: bottlenecksRes.data.data,
        };
    };

    const {
        data,
        isLoading,
        isFetching,
        isError,
    } = useQuery({
        queryKey: ["track-trace", vendorId, filters],
        queryFn: fetchTrackTraceData,
        enabled: !!vendorId,
        refetchInterval: 5000,
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




    // const fetchData = useCallback(async () => {
    //     if (!vendorId) return;

    //     try {
    //         // setLoading(true);

    //         const params = new URLSearchParams();
    //         if (filters.project !== "all") params.append("project", filters.project);
    //         if (filters.machine !== "all") params.append("machine", filters.machine);
    //         if (filters.operator !== "all") params.append("operator", filters.operator);
    //         if (filters.status !== "all") params.append("status", filters.status);

    //         const [kpisRes, itemsRes, machinesRes, hourlyProductionDataRes, machineUtilizationDataRes, operatorsRes, projectsRes, bottlenecksRes] = await Promise.all([
    //             apiClient.get(`/track-trace/kpis/${vendorId}`, { params }),
    //             apiClient.get(`/track-trace/items/${vendorId}`, { params }),
    //             apiClient.get(`/track-trace/machine-status/${vendorId}`, { params }),
    //             apiClient.get(`/track-trace/hourly-production/${vendorId}`, { params }),
    //             apiClient.get(`/track-trace/machine-utilization/${vendorId}`, { params }),
    //             apiClient.get(`/track-trace/top-performer/${vendorId}`, { params }),
    //             apiClient.get(`/track-trace/project-progress/${vendorId}`, { params }),
    //             apiClient.get(`/track-trace/bottle-neck/${vendorId}`, { params }),

    //         ]);


    //         setKpis(kpisRes.data.data);
    //         setItems(itemsRes.data.data);
    //         setMachines(machinesRes.data.data);
    //         setHourlyProductionData(hourlyProductionDataRes.data.data);
    //         setMachineUtilizationData(machineUtilizationDataRes.data.data);
    //         setOperators(operatorsRes.data.data);
    //         setProjects(projectsRes.data.data);
    //         setBottlenecks(bottlenecksRes.data.data);
    //         // alert(bottlenecksRes.data.data)


    //     } catch (err) {
    //         console.error("Fetch error:", err);
    //     } finally {
    //         //setLoading(false);
    //     }
    // }, [vendorId, filters]);


    // useEffect(() => {
    //     fetchData();

    //     const interval = setInterval(fetchData, 5000);
    //     return () => clearInterval(interval);
    // }, [fetchData]);



    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <Filters onFilterChange={setFilters} />

            <main className="max-w-[1600px] mx-auto px-6 py-6">
                {/* KPI Metrics */}

                { kpis && (

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KPICardSQFT
                            title="Total Items Processed"
                            value={kpis.totalItemsProcessed.value}
                            change={kpis.totalItemsProcessed.change}
                            subtitle={kpis.totalItemsProcessed.subtitle}
                            trend={kpis.totalItemsProcessed.trend}
                            icon={<ClipboardList className="w-6 h-6 text-gray-700" />}
                            sqft={kpis.totalItemsProcessed.sqft}
                        />
                        <KPICard
                            title="Active Machines"
                            value={kpis.activeMachines.value}
                            change={kpis.activeMachines.change}
                            subtitle={kpis.activeMachines.subtitle}
                            trend={kpis.activeMachines.trend}
                            icon={<Monitor className="w-6 h-6 text-gray-700" />}
                        />
                        <KPICard
                            title="Active Operators"
                            value={kpis.activeOperators.value}
                            change={kpis.activeOperators.change}
                            subtitle={kpis.activeOperators.subtitle}
                            trend={kpis.activeOperators.trend}
                            icon={<Users className="w-6 h-6 text-gray-700" />}
                        />
                        {/* <KPICard
                            title="Avg Processing Time"
                            value="8.2m"
                            change="-5% vs target"
                            subtitle="↓ 0.4m"
                            trend="down"
                            icon={<Clock className="w-6 h-6 text-gray-700" />}
                        /> */}

                    </div>
                )}

                {/* Real-Time Tracking & Machine Status */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2">
                        {!isLoading && items && (
                            <RealTimeTracking items={items} />
                        )}
                    </div>
                    <div>
                        <div className="lg:col-span-2">
                            {!isLoading && machines && (
                                <MachineStatus machines={machines} />
                            )}
                        </div>
                    </div>
                </div>


                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {!isLoading && hourlyProductionData && (
                        <ProductionChart
                            data={hourlyProductionData}
                            type="line"
                            title="Hourly Production Rate"
                            subtitle="Items processed per hour"
                        />
                    )}
                    {!isLoading && machineUtilizationData && (
                        <ProductionChart
                            data={machineUtilizationData}
                            type="bar"
                            title="Machine Utilization Rate"
                            subtitle="Average utilization by machine type"
                        />
                    )}
                </div>

                {/* Performance Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {!isLoading && operators && (
                        <TopOperators operators={operators} />
                    )}
                    {!isLoading && projects && (

                        <ProjectProgress projects={projects} />
                    )}
                </div>

                {/* Bottleneck & Alerts */}
                {!isLoading && bottlenecks && (

                    <div className="grid grid-cols-1  gap-6 mb-6">
                        <div className="lg:col-span-2">
                            <BottleneckAnalysis bottlenecks={bottlenecks} />
                        </div>
                        {/* <div>
                        <Alerts alerts={mockAlerts} />
                    </div> */}
                    </div>
                )}

                {/* Activity Log */}
                {/* <ActivityLogTable logs={mockActivityLog} /> */}
            </main>

            <Footer />
        </div>
    );
}

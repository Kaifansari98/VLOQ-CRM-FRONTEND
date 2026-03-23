import { useAppSelector } from '@/redux/store';
import { 
  Machine, 
  Item, 
  Operator, 
  Project, 
  BottleneckData, 
  Alert, 
  ActivityLog, 
  FilterOptions
} from '@/types/track-trace';
import { useEffect, useState } from 'react';


 const [kpis, setKpis] = useState<any>(null);

   const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    project: 'all',
    machine: 'all',
    operator: 'all',
    dateRange: 'today',
    status: 'all',
  });


  const fetchData = async () => {
    try {
        const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
      setLoading(true);

      // Build query string for items
      const itemsQuery = new URLSearchParams();
      if (filters.project && filters.project !== 'all') itemsQuery.append('project', filters.project);
      if (filters.machine && filters.machine !== 'all') itemsQuery.append('machine', filters.machine);
      if (filters.operator && filters.operator !== 'all') itemsQuery.append('operator', filters.operator);
      if (filters.status && filters.status !== 'all') itemsQuery.append('status', filters.status);

      const [
        kpisRes,
        // machinesRes,
        // itemsRes,
        // operatorsRes,
        // projectsRes,
        // bottlenecksRes,
        // alertsRes,
        // activityLogRes,
        // hourlyProductionRes,
        // machineUtilizationRes,
      ] = await Promise.all([
        fetch('/track-trace/kpis/'+vendorId),
        // fetch('/api/machines'),
        // fetch(`/api/items?${itemsQuery.toString()}`),
        // fetch('/api/operators'),
        // fetch('/api/projects'),
        // fetch('/api/analytics/bottlenecks'),
        // fetch('/api/alerts'),
        // fetch('/api/analytics/activity-log?page=1&limit=5'),
        // fetch('/api/analytics/hourly-production'),
        // fetch('/api/analytics/machine-utilization'),
      ]);

      const [
        kpisData,
        // machinesData,
        // itemsData,
        // operatorsData,
        // projectsData,
        // bottlenecksData,
        // alertsData,
        // activityLogData,
        // hourlyProductionDataRes,
        // machineUtilizationDataRes,
      ] = await Promise.all([
        kpisRes.json(),
        // machinesRes.json(),
        // itemsRes.json(),
        // operatorsRes.json(),
        // projectsRes.json(),
        // bottlenecksRes.json(),
        // alertsRes.json(),
        // activityLogRes.json(),
        // hourlyProductionRes.json(),
        // machineUtilizationRes.json(),
      ]);

      setKpis(kpisData);
    //   setMachines(machinesData);
    //   setItems(itemsData);
    //   setOperators(operatorsData);
    //   setProjects(projectsData);
    //   setBottlenecks(bottlenecksData);
    //   setAlerts(alertsData);
    //   setActivityLog(activityLogData.logs || []);
    //   setHourlyProductionData(hourlyProductionDataRes);
    //   setMachineUtilizationData(machineUtilizationDataRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


   useEffect(() => {
    fetchData();

    // Refresh data every 5 seconds
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [filters]);
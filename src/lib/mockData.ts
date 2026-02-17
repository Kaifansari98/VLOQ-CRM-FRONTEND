import { 
  Machine, 
  Item, 
  Operator, 
  Project, 
  BottleneckData, 
  Alert, 
  ActivityLog 
} from '@/types/track-trace';

export const mockMachines: Machine[] = [
  { id: '1', name: 'CNC Router #1', status: 'ACTIVE', operator: 'John Smith', utilization: 95 },
  { id: '2', name: 'Edge Bander #1', status: 'ACTIVE', operator: 'Sarah Johnson', utilization: 88 },
  { id: '3', name: 'Panel Saw #3', status: 'IDLE', utilization: 62 },
  { id: '4', name: 'Drilling Machine #2', status: 'ACTIVE', operator: 'Mike Chen', utilization: 92 },
  { id: '5', name: 'Laser Cutter #2', status: 'ACTIVE', operator: 'Lisa Brown', utilization: 78 },
  { id: '6', name: 'CNC Router #2', status: 'MAINTENANCE', utilization: 0 },
  { id: '7', name: 'Paint Booth #1', status: 'IDLE', utilization: 45 },
];

export const mockItems: Item[] = [
  {
    id: '1',
    itemNumber: '#2024-0234',
    project: 'Project Alpha',
    description: 'Cabinet Door Panel',
    machine: 'CNC Router #1',
    operator: 'John Smith',
    status: 'in_process',
    duration: '00:12:34',
    timestamp: new Date(),
  },
  {
    id: '2',
    itemNumber: '#2024-0235',
    project: 'Project Beta',
    description: 'Drawer Front',
    machine: 'Edge Bander #1',
    operator: 'Sarah Johnson',
    status: 'in_process',
    duration: '00:08:15',
    timestamp: new Date(),
  },
  {
    id: '3',
    itemNumber: '#2024-0236',
    project: 'Project Gamma',
    description: 'Side Panel',
    machine: 'Panel Saw #3',
    status: 'queued',
    timestamp: new Date(),
  },
  {
    id: '4',
    itemNumber: '#2024-0237',
    project: 'Project Alpha',
    description: 'Top Panel',
    machine: 'Drilling Machine #2',
    operator: 'Mike Chen',
    status: 'completed',
    duration: '00:06:42',
    timestamp: new Date(),
  },
  {
    id: '5',
    itemNumber: '#2024-0238',
    project: 'Custom Furniture',
    description: 'Shelf Unit',
    machine: 'Laser Cutter #2',
    operator: 'Lisa Brown',
    status: 'in_process',
    duration: '00:15:22',
    timestamp: new Date(),
  },
];

export const mockOperators: Operator[] = [
  { id: '1', name: 'John Smith', machine: 'CNC Router #', itemsProcessed: 127, avgTime: '6.8m', efficiency: 98 },
  { id: '2', name: 'Sarah Johnson', machine: 'Edge Bander #1', itemsProcessed: 115, avgTime: '7.2m', efficiency: 95 },
  { id: '3', name: 'Mike Chen', machine: 'Drilling Machine #2', itemsProcessed: 108, avgTime: '7.5m', efficiency: 93 },
  { id: '4', name: 'Lisa Brown', machine: 'Laser Cutter #2', itemsProcessed: 95, avgTime: '8.1m', efficiency: 88 },
  { id: '5', name: 'David Lee', machine: 'Panel Saw #3', itemsProcessed: 89, avgTime: '8.9m', efficiency: 84 },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Project Alpha',
    description: 'Kitchen Cabinets',
    total: 450,
    completed: 387,
    inProgress: 43,
    progress: 86,
  },
  {
    id: '2',
    name: 'Project Beta',
    description: 'Office Furniture',
    total: 320,
    completed: 224,
    inProgress: 68,
    progress: 70,
  },
  {
    id: '3',
    name: 'Project Gamma',
    description: 'Retail Display',
    total: 280,
    completed: 154,
    inProgress: 92,
    progress: 55,
  },
  {
    id: '4',
    name: 'Custom Furniture',
    description: 'Q1 Orders',
    total: 197,
    completed: 145,
    inProgress: 38,
    progress: 74,
  },
];

export const mockBottlenecks: BottleneckData[] = [
  { machine: 'CNC Router #1', operator: 'John Smith', queueCount: 23, avgWait: '42m', severity: 'high', percentage: 92 },
  { machine: 'Edge Bander #1', operator: 'Sarah Johnson', queueCount: 18, avgWait: '28m', severity: 'medium', percentage: 72 },
  { machine: 'Drilling Machine #2', operator: 'Mike Chen', queueCount: 12, avgWait: '18m', severity: 'medium', percentage: 48 },
  { machine: 'Laser Cutter #2', operator: 'Lisa Brown', queueCount: 7, avgWait: '11m', severity: 'low', percentage: 28 },
  { machine: 'Panel Saw #3', queueCount: 3, avgWait: '5m', severity: 'low', percentage: 12 },
];

export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'error',
    title: 'Machine Maintenance Due',
    message: 'CNC Router #2 scheduled for maintenance in 2 hours',
  },
  {
    id: '2',
    type: 'warning',
    title: 'High Queue Alert',
    message: 'CNC Router #1 has 23 items waiting (42m avg)',
  },
  {
    id: '3',
    type: 'success',
    title: 'Target Exceeded',
    message: 'Project Alpha 12% ahead of schedule',
  },
  {
    id: '4',
    type: 'info',
    title: 'Efficiency Improvement',
    message: 'Overall processing time down 5% from yesterday',
  },
  {
    id: '5',
    type: 'info',
    title: 'Shift Change',
    message: 'Evening shift starts in 45 minutes',
  },
];

export const mockActivityLog: ActivityLog[] = [
  {
    id: '1',
    time: '14:23:15',
    itemId: '#2024-0238',
    project: 'Custom Furniture',
    machine: 'Laser Cutter #2',
    operator: 'Lisa Brown',
    action: 'Scan IN',
    duration: '00:15:22',
    status: 'in_process',
  },
  {
    id: '2',
    time: '14:16:43',
    itemId: '#2024-0237',
    project: 'Project Alpha',
    machine: 'Drilling Machine #2',
    operator: 'Mike Chen',
    action: 'Scan OUT',
    duration: '00:11:28',
    status: 'completed',
  },
  {
    id: '3',
    time: '14:11:08',
    itemId: '#2024-0236',
    project: 'Project Gamma',
    machine: 'Panel Saw #3',
    action: 'Queued',
    status: 'queued',
  },
  {
    id: '4',
    time: '14:06:52',
    itemId: '#2024-0235',
    project: 'Project Beta',
    machine: 'Edge Bander #1',
    operator: 'Sarah Johnson',
    action: 'Scan IN',
    duration: '00:08:15',
    status: 'in_process',
  },
  {
    id: '5',
    time: '14:02:19',
    itemId: '#2024-0234',
    project: 'Project Alpha',
    machine: 'CNC Router #1',
    operator: 'John Smith',
    action: 'Scan IN',
    duration: '00:12:34',
    status: 'in_process',
  },
];

export const hourlyProductionData = {
  labels: ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM'],
  datasets: [
    {
      label: 'Items Processed',
      data: [45, 52, 68, 72, 58, 81, 73],
      borderColor: '#111827',
      backgroundColor: 'rgba(17, 24, 39, 0.1)',
    },
    {
      label: 'Target',
      data: [60, 60, 60, 60, 60, 60, 60],
      borderColor: '#9CA3AF',
      backgroundColor: 'transparent',
    },
  ],
};

export const machineUtilizationData = {
  labels: ['CNC Router', 'Edge Bander', 'Panel Saw', 'Drilling', 'Laser Cutter', 'Paint Booth'],
  datasets: [
    {
      label: 'Utilization %',
      data: [95, 88, 62, 92, 78, 45],
      backgroundColor: ['#111827', '#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF'],
    },
  ],
};

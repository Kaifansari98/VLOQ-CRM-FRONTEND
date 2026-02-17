'use client';

import { useCallback, useEffect, useState } from 'react';
import { FilterOptions } from '@/types/track-trace';
import { useAppSelector } from '@/redux/store';
import { apiClient } from '@/lib/apiClient';

interface FiltersProps {
  onFilterChange?: (filters: FilterOptions) => void;
}

export default function Filters({ onFilterChange }: FiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    project: 'all',
    machine: 'all',
    operator: 'all',
    dateRange: 'today',
    status: 'all',
  });

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {

    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const [projectFilterData, setProjectFilterData] = useState<any>(null);
  const [machineFilterData, setMachineFilterData] = useState<any>(null);
  const [userFilterData, setUserFilterData] = useState<any>(null);

  const clearFilter = (key: keyof FilterOptions) => {
    handleFilterChange(key, 'all');
  };
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  useEffect(() => {
    fetchFilter();
  }, []);

  const fetchFilter = useCallback(async () => {
    if (!vendorId) return;
    const [filterResp] = await Promise.all([
      apiClient.get(`/track-trace/get-filter-track-trace/${vendorId}`),

    ]);
    // alert(filterResp.data)
    setProjectFilterData(filterResp.data.data.project);
    setMachineFilterData(filterResp.data.data.machine);
    setUserFilterData(filterResp.data.data.user);

  }, []);

  return (
    <section className="bg-white border-b border-gray-200 no-print">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Project Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">PROJECT</label>




            {projectFilterData && (

              
              <select
                value={filters.project}
                onChange={(e) => handleFilterChange('project', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="all">All Projects</option>
                {projectFilterData.map((project) => (
                  <option key={project.id} value={String(project.id)}>
                    {project.project_name}
                  </option>
                ))}
               
              </select>
            )}
          </div>

          {/* Machine Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">MACHINE</label>

            {machineFilterData && (
              <select
                value={filters.machine}
                onChange={(e) => handleFilterChange('machine', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="all">All Machines</option>
                {machineFilterData.map((machine) => (
                  <option key={machine.id} value={String(machine.id)}>
                    {machine.machine_name}
                  </option>
                ))}                

              </select>
            )}
          </div>

          {/* Operator Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">OPERATOR</label>
            {userFilterData && (
              <select
                value={filters.operator}
                onChange={(e) => handleFilterChange('operator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="all">All Operators</option>

                 {userFilterData.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.user_name}
                  </option>
                ))}               
              </select>
            )}
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">DATE RANGE</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Status Filter */}
          {/* <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">STATUS</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="pending">Pending</option>
            </select>
          </div> */}
        </div>

        {/* Active Filters Display */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">ACTIVE FILTERS:</span>
          {Object.entries(filters).map(
            ([key, value]) =>
              value !== 'all' && (
                <span
                  key={key}
                  className="filter-badge px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center gap-2"
                >
                  {value}
                  <button
                    onClick={() => clearFilter(key as keyof FilterOptions)}
                    className="hover:text-gray-900"
                  >
                    ×
                  </button>
                </span>
              )
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { useAppSelector } from "@/redux/store";
import {
  useAttendanceHistory,
  useAttendanceLogs,
  AttendanceRecord,
  AttendanceLogItem,
} from "@/api/attendance";
import { useFranchisesByVendorId } from "@/api/franchise";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CalendarCheck,
  Clock,
  Search,
  RefreshCw,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCheck,
  Briefcase,
  FilterX,
  LogIn,
  LogOut,
} from "lucide-react";
import CustomeDatePicker from "@/components/date-picker";
import { sanitize } from "@/components/utils/sanitizeCapitalize";

export default function HrmsAttendanceDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const vendorId = user?.vendor_id;
  const vendorName = user?.vendor?.vendor_name || "Company";

  // Active Timezone
  const activeTimeZone =
    user?.vendor?.time_zone_master?.time_zone_name ||
    user?.vendor?.time_zone_master?.time_zone_code ||
    user?.vendor?.time_zone ||
    (user as any)?.user_timezone ||
    "Asia/Kolkata";



  // Filter States (Default: "Pick a date" / all dates)
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CHECKED_IN" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  // Franchises Query
  const { data: rawFranchises = [] } = useFranchisesByVendorId(
    vendorId ?? 0,
    !!vendorId
  );

  // Filter out Vloq B2B from dropdown for HRMS Admin
  const franchises = useMemo(() => {
    return rawFranchises.filter((f) => {
      const name = (f.franchise_name || "").toLowerCase().trim();
      const code = (f.franchise_code || "").toLowerCase().trim();
      const isB2b =
        f.moduled_for_b2b === true ||
        name === "vloq b2b" ||
        name.includes("b2b") ||
        code === "b2b" ||
        code.includes("b2b");
      return !isB2b;
    });
  }, [rawFranchises]);

  // Attendance List Query
  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
  } = useAttendanceHistory({
    vendor_id: vendorId,
    franchise_id: selectedFranchiseId !== "ALL" ? Number(selectedFranchiseId) : undefined,
    attendance_date: selectedDate || undefined,
    page,
    limit,
  });

  const records = attendanceData?.data || [];
  const pagination = attendanceData?.pagination;

  // Filter in-memory by status and search query
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Status filter
      if (statusFilter !== "ALL") {
        const recordStatus = rec.status || (rec.check_out ? "COMPLETED" : "CHECKED_IN");
        if (recordStatus !== statusFilter) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = (rec.user?.user_name || "").toLowerCase();
        const empEmail = (rec.user?.user_email || "").toLowerCase();
        const empDesignation = (rec.user?.designation || "").toLowerCase();
        const empPhone = (rec.user?.user_contact || "").toLowerCase();
        const franchiseName = (rec.franchise?.franchise_name || "").toLowerCase();

        return (
          empName.includes(q) ||
          empEmail.includes(q) ||
          empDesignation.includes(q) ||
          empPhone.includes(q) ||
          franchiseName.includes(q)
        );
      }

      return true;
    });
  }, [records, statusFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = pagination?.totalCount ?? records.length;
    let checkedIn = 0;
    let completed = 0;

    records.forEach((r) => {
      if (r.check_out || r.status === "COMPLETED") {
        completed += 1;
      } else if (r.check_in) {
        checkedIn += 1;
      }
    });

    const uniqueEmployees = new Set(records.map((r) => r.user_id)).size;

    return {
      totalRecords: totalCount,
      checkedIn,
      completed,
      uniqueEmployees,
    };
  }, [records, pagination]);

  // Selected Record for viewing audit logs
  const [selectedRecordForLogs, setSelectedRecordForLogs] = useState<AttendanceRecord | null>(null);
  const isLogsDialogOpen = !!selectedRecordForLogs;

  const {
    data: auditLogs = [],
    isLoading: isLoadingAuditLogs,
  } = useAttendanceLogs(selectedRecordForLogs?.id);

  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedFranchiseId("ALL");
    setStatusFilter("ALL");
    setSearchQuery("");
    setPage(1);
  };

  const getInitials = (name?: string) => {
    if (!name) return "EM";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg border bg-muted/30 text-foreground">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Employee Attendance</h1>
              <p className="text-sm text-muted-foreground">
                All employee attendance records, daily punches, durations, and logs for {vendorName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Logged
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.totalRecords}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedDate ? `Records on ${selectedDate}` : "Across all dates"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Checked In (Working)
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.checkedIn}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Punched in, shift active</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Shift Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.completed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Both IN & OUT recorded</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Employees
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.uniqueEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique staff in this view</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee, email, designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Date Picker Filter */}
            <div className="w-[210px] sm:w-[220px]">
              <CustomeDatePicker
                value={selectedDate}
                onChange={(val) => {
                  setSelectedDate(val);
                  setPage(1);
                }}
                className="h-9 text-xs"
              />
            </div>

            {/* Franchise / Store Dropdown */}
            {franchises.length > 0 && (
              <div className="w-[180px]">
                <Select
                  value={selectedFranchiseId}
                  onValueChange={(val) => {
                    setSelectedFranchiseId(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <Building2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Stores / HO</SelectItem>
                    {franchises.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.franchise_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status Dropdown */}
            <div className="w-[150px]">
              <Select
                value={statusFilter}
                onValueChange={(val: any) => setStatusFilter(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(!!selectedDate ||
              selectedFranchiseId !== "ALL" ||
              statusFilter !== "ALL" ||
              searchQuery !== "") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <FilterX className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Role & Designation</TableHead>
                <TableHead>Store / Branch</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check IN</TableHead>
                <TableHead>Check OUT</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAttendance ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span>Loading attendance records...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-36 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
                      <div className="font-medium text-foreground">No attendance records found</div>
                      <p className="text-xs">
                        {selectedDate
                          ? `No employees marked attendance for ${selectedDate}.`
                          : "Try adjusting your filters or date range."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record, idx) => {
                  const emp = record.user;
                  const isCompleted = record.status === "COMPLETED" || !!record.check_out;
                  const checkInTime = record.check_in_local || "--:--";
                  const checkOutTime = record.check_out_local || (isCompleted ? "--:--" : "In Progress");

                  return (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>

                      {/* Employee Info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                              {getInitials(emp?.user_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm leading-tight">
                              {emp?.user_name || "Employee #" + record.user_id}
                            </span>
                            <span className="text-xs text-muted-foreground leading-tight">
                              {emp?.user_email || "No email"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role & Designation */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium">
                            {emp?.designation || "Staff"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {sanitize(emp?.user_type?.user_type || "employee")}
                          </span>
                        </div>
                      </TableCell>

                      {/* Store / Branch */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{record.franchise?.franchise_name || "Head Office"}</span>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs font-medium whitespace-nowrap">
                        {record.attendance_date_local || record.attendance_date}
                      </TableCell>

                      {/* Punch IN */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <LogIn className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs font-medium">{checkInTime}</span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0 uppercase">
                            {record.source || "MANUAL"}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Punch OUT */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <LogOut className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs font-medium">
                            {checkOutTime}
                          </span>
                        </div>
                      </TableCell>

                      {/* Duration */}
                      <TableCell>
                        {record.duration_formatted ? (
                          <Badge variant="outline" className="font-mono text-xs font-medium">
                            {record.duration_formatted}
                          </Badge>
                        ) : isCompleted ? (
                          <span className="text-xs text-muted-foreground font-mono">--</span>
                        ) : (
                          <Badge variant="outline" className="text-[11px] font-medium">
                            Active
                          </Badge>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isCompleted ? (
                          <Badge variant="outline" className="gap-1 font-medium text-xs">
                            <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1.5 font-medium text-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-foreground"></span>
                            Checked In
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecordForLogs(record)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <div className="text-xs text-muted-foreground">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, pagination.totalCount)} of {pagination.totalCount} records
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoadingAttendance}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || isLoadingAttendance}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Audit Logs Dialog */}
      <Dialog
        open={isLogsDialogOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedRecordForLogs(null);
        }}
      >
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-foreground" />
              Punch Audit Logs
            </DialogTitle>
            <DialogDescription className="text-xs">
              Audit log history for {selectedRecordForLogs?.user?.user_name || "Employee"} on{" "}
              {selectedRecordForLogs?.attendance_date_local || selectedRecordForLogs?.attendance_date}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            {isLoadingAuditLogs ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No individual punch logs recorded.
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {auditLogs.map((log, index) => {
                  const isPunchIn = log.action === "IN";
                  return (
                    <div
                      key={log.id || index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full border bg-muted text-foreground">
                          {isPunchIn ? (
                            <LogIn className="h-4 w-4" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">
                            Punch {log.action}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Source: <span className="font-mono">{log.source || "MANUAL"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-sm font-medium">
                          {log.action_time_local || new Date(log.action_time).toLocaleTimeString()}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {new Date(log.action_time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

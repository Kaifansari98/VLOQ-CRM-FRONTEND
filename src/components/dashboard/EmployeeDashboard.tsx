"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppSelector } from "@/redux/store";
import {
  useTodayAttendance,
  useAttendanceHistory,
  useMarkAttendance,
} from "@/api/attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toastManager } from "@/components/ui/toast";
import {
  LogIn,
  LogOut,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  History,
  Globe,
  Loader2,
  CalendarCheck,
  ListFilter,
  RefreshCw,
} from "lucide-react";
import { sanitize } from "@/components/utils/sanitizeCapitalize";
import CustomeDatePicker from "@/components/date-picker";

export default function EmployeeDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id;
  const username = user?.user_name || "Employee";
  const userRole = sanitize(user?.user_type?.user_type || user?.user_role || "Employee");
  const vendorName = user?.vendor?.vendor_name || "Company";

  // Queries
  const {
    data: todayData,
    isLoading: isLoadingToday,
    isRefetching: isRefetchingToday,
    refetch: refetchToday,
  } = useTodayAttendance(userId);

  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useAttendanceHistory({
    user_id: userId,
    page,
    limit: 10,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
  });

  const markMutation = useMarkAttendance();

  // Active Timezone from today's attendance API, attendance record, or authenticated user/vendor session
  const activeTimeZone =
    todayData?.vendor_time_zone ||
    todayData?.attendance?.vendor_time_zone ||
    user?.vendor?.time_zone_master?.time_zone_code ||
    user?.vendor?.time_zone ||
    (user as any)?.user_timezone ||
    "UTC";

  // Live Digital Clock formatted in active timezone
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");
  // Freeze Punch OUT button after punch out action until page/dashboard is refreshed
  const [isPunchOutFrozen, setIsPunchOutFrozen] = useState(false);

  // Helper to format timestamps without date
  const formatTimeOnly = (timeStr?: string | null): string => {
    if (!timeStr || timeStr === "-" || timeStr === "--:--") return "-";
    const trimmed = String(timeStr).trim();
    if (trimmed.includes(",")) {
      return trimmed.split(",")[1].trim();
    }
    if (/^\d{1,2}:\d{2}(:\d{2})?(\s*[AaPp][Mm])?$/.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.includes("T")) {
      try {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          return new Intl.DateTimeFormat("en-GB", {
            timeZone: activeTimeZone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(d);
        }
      } catch {}
    }
    return trimmed;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        setCurrentTimeStr(
          new Intl.DateTimeFormat("en-IN", {
            timeZone: activeTimeZone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }).format(now)
        );
        setCurrentDateStr(
          new Intl.DateTimeFormat("en-IN", {
            timeZone: activeTimeZone,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(now)
        );
      } catch {
        setCurrentTimeStr(now.toLocaleTimeString());
        setCurrentDateStr(now.toLocaleDateString());
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [activeTimeZone]);

  // Mark Punch Action Handler
  const handlePunch = async (action: "IN" | "OUT") => {
    if (!userId) {
      toastManager.add({
        title: "User session invalid. Please log in again.",
        type: "error",
      });
      return;
    }

    try {
      const response = await markMutation.mutateAsync({
        user_id: userId,
        action,
        source: "MANUAL",
      });

      if (action === "OUT") {
        setIsPunchOutFrozen(true);
      }

      toastManager.add({
        title: response.message || `${action === "IN" ? "Check-in" : "Check-out"} marked successfully!`,
        type: "success",
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        `Failed to mark ${action.toLowerCase()}`;
      toastManager.add({
        title: message,
        type: "error",
      });
    }
  };

  const hasMarkedIn = todayData?.has_marked_in ?? false;
  const attendance = todayData?.attendance;

  // Determine current status
  const statusConfig = useMemo(() => {
    if (!hasMarkedIn) {
      return {
        label: "Not Checked In",
        badgeVariant: "secondary" as const,
        bgClass: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
        icon: AlertCircle,
        description: "You have not marked your attendance for today yet.",
      };
    }

    if (attendance?.check_out) {
      return {
        label: "Checked Out",
        badgeVariant: "outline" as const,
        bgClass: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
        icon: LogOut,
        description: isPunchOutFrozen
          ? `Checked out at ${formatTimeOnly(attendance.check_out_local || attendance.check_out)}. Punch OUT button is frozen for this session (refresh page to punch OUT again).`
          : `Checked out at ${formatTimeOnly(attendance.check_out_local || attendance.check_out)}. You can punch OUT again if needed.`,
      };
    }

    return {
      label: "Checked In",
      badgeVariant: "default" as const,
      bgClass: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
      icon: CheckCircle2,
      description: `Checked in at ${formatTimeOnly(attendance?.check_in_local || attendance?.check_in)}. Your attendance is active.`,
    };
  }, [hasMarkedIn, attendance, activeTimeZone, isPunchOutFrozen]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border bg-card text-card-foreground shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome, {username}
            </h1>
            <Badge variant="outline" className="text-xs">
              {userRole}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{vendorName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              Time Zone: <strong className="text-foreground">{activeTimeZone}</strong>
            </span>
          </p>
        </div>

        {/* Live Clock Card */}
        <div className="flex items-center gap-4 bg-muted/50 p-3 px-4 rounded-lg border">
          <Clock className="h-6 w-6 text-primary shrink-0" />
          <div className="text-right sm:text-left">
            <div className="text-xl font-mono font-bold tracking-tight text-foreground">
              {currentTimeStr || "--:--:--"}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentDateStr || "Loading date..."}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsPunchOutFrozen(false);
              refetchToday();
              refetchHistory();
            }}
            disabled={isRefetchingToday}
            title="Refresh Attendance"
            className="h-8 w-8 ml-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetchingToday ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* 2. Today's Attendance Punch Section */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Today&apos;s Attendance
              </CardTitle>
              <CardDescription>
                Mark your IN and OUT punches according to {activeTimeZone} time.
              </CardDescription>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusConfig.bgClass}`}
            >
              <statusConfig.icon className="h-3.5 w-3.5" />
              <span>{statusConfig.label}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {statusConfig.description}
          </p>

          {/* Action Punch Buttons & Quick Metrics Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
            {/* Action Punch Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Punch IN Button */}
              <Button
                size="default"
                variant={hasMarkedIn ? "outline" : "default"}
                onClick={() => handlePunch("IN")}
                disabled={hasMarkedIn || markMutation.isPending || isLoadingToday}
                className={`h-10 px-5 min-w-[180px] text-sm font-medium transition-all ${
                  !hasMarkedIn
                    ? "bg-[#000000] text-[#FFFFFF] hover:bg-neutral-800 hover:text-[#FFFFFF] dark:bg-[#000000] dark:text-[#FFFFFF] dark:hover:bg-neutral-800 dark:hover:text-[#FFFFFF] focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white shadow-sm"
                    : "opacity-60 cursor-not-allowed bg-muted text-muted-foreground border border-border"
                }`}
              >
                {markMutation.isPending && markMutation.variables?.action === "IN" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#FFFFFF]" />
                    Marking Check-In...
                  </>
                ) : (
                  <>
                    <LogIn className={`mr-2 h-4 w-4 ${!hasMarkedIn ? "text-[#FFFFFF]" : "text-muted-foreground"}`} />
                    <span>
                      {hasMarkedIn ? "Checked IN (Completed)" : "Punch IN"}
                    </span>
                  </>
                )}
              </Button>

              {/* Punch OUT Button */}
              <Button
                size="default"
                variant={hasMarkedIn && !isPunchOutFrozen ? "default" : "outline"}
                onClick={() => handlePunch("OUT")}
                disabled={!hasMarkedIn || isPunchOutFrozen || markMutation.isPending || isLoadingToday}
                className={`h-10 px-5 min-w-[180px] text-sm font-medium transition-all ${
                  !hasMarkedIn
                    ? "opacity-40 cursor-not-allowed bg-muted/40 text-muted-foreground border border-border"
                    : isPunchOutFrozen
                    ? "opacity-60 cursor-not-allowed bg-muted text-muted-foreground border border-border"
                    : "bg-[#000000] text-[#FFFFFF] hover:bg-neutral-800 hover:text-[#FFFFFF] dark:bg-[#000000] dark:text-[#FFFFFF] dark:hover:bg-neutral-800 dark:hover:text-[#FFFFFF] focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white shadow-sm border-transparent"
                }`}
              >
                {markMutation.isPending && markMutation.variables?.action === "OUT" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#FFFFFF]" />
                    Marking Check-Out...
                  </>
                ) : (
                  <>
                    <LogOut className={`mr-2 h-4 w-4 ${hasMarkedIn && !isPunchOutFrozen ? "text-[#FFFFFF]" : "text-muted-foreground"}`} />
                    <span>
                      {!hasMarkedIn
                        ? "Punch OUT (Punch IN First)"
                        : isPunchOutFrozen
                        ? "Checked OUT (Completed)"
                        : "Punch OUT"}
                    </span>
                  </>
                )}
              </Button>
            </div>

            {/* Quick Metrics (First IN Time & Latest OUT Time) */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[170px] p-2.5 px-3.5 rounded-lg bg-muted/40 border space-y-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <LogIn className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  IN
                </span>
                <p className="text-sm font-semibold font-mono text-foreground">
                  {formatTimeOnly(attendance?.check_in_local)}
                </p>
              </div>

              <div className="min-w-[170px] p-2.5 px-3.5 rounded-lg bg-muted/40 border space-y-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <LogOut className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  OUT
                </span>
                <p className="text-sm font-semibold font-mono text-foreground">
                  {formatTimeOnly(attendance?.check_out_local)}
                </p>
              </div>
            </div>
          </div>

          {hasMarkedIn && (
            <p className="text-xs text-muted-foreground italic">
              * Note: Only one IN punch is permitted per calendar date. You can punch OUT multiple times if your day involves breaks or shift departure.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 3. Attendance History Section */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                My Attendance History
              </CardTitle>
              <CardDescription>
                View all your verified past attendance records and timestamps.
              </CardDescription>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ListFilter className="h-3.5 w-3.5 shrink-0" />
                <span>From:</span>
                <div className="w-[170px]">
                  <CustomeDatePicker
                    value={fromDate}
                    onChange={(val) => setFromDate(val || "")}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>To:</span>
                <div className="w-[170px]">
                  <CustomeDatePicker
                    value={toDate}
                    onChange={(val) => setToDate(val || "")}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="h-8 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Loading attendance history...</p>
            </div>
          ) : !historyData?.data || historyData.data.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground gap-2 border rounded-md bg-muted/10">
              <Calendar className="h-8 w-8 text-muted/50" />
              <p className="text-sm font-medium">No past attendance records found</p>
              <p className="text-xs text-muted-foreground">
                {fromDate || toDate
                  ? "Try clearing the date filters to view records."
                  : "Your recorded punches will be listed here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">IN</th>
                    <th className="py-3 px-4">OUT</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historyData.data.map((record) => {
                    const isCompleted = !!record.check_out;
                    return (
                      <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {record.attendance_date_local || record.attendance_date}
                        </td>
                        <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                          {formatTimeOnly(record.check_in_local || record.check_in)}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {record.check_out_local ? (
                            <span className="text-amber-700 dark:text-amber-400">
                              {formatTimeOnly(record.check_out_local)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={isCompleted ? "outline" : "default"}
                            className={
                              isCompleted
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300"
                                : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300"
                            }
                          >
                            {isCompleted ? "Completed" : "Checked IN"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {record.source}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {historyData?.pagination && historyData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
              <span>
                Page {historyData.pagination.page} of {historyData.pagination.totalPages} (Total: {historyData.pagination.totalCount})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(historyData.pagination.totalPages, p + 1)
                    )
                  }
                  disabled={page >= historyData.pagination.totalPages}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

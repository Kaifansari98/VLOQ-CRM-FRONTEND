"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Megaphone,
  Calendar,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Volume2,
  FileText,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BroadcastItem, BroadcastStatus } from "@/types/broadcast";

interface SuperAdminBroadcastViewProps {
  broadcasts: BroadcastItem[];
  onCreateOpen: () => void;
  onEditItem?: (item: BroadcastItem) => void;
  onViewItem: (item: BroadcastItem) => void;
  onDeleteItem: (id: string) => void;
}

export const SuperAdminBroadcastView: React.FC<SuperAdminBroadcastViewProps> = ({
  broadcasts,
  onCreateOpen,
  onEditItem,
  onViewItem,
  onDeleteItem,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Filtered dataset
  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        (item.summary && item.summary.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesAudience =
        audienceFilter === "all" ||
        item.audience.toLowerCase().includes(audienceFilter.toLowerCase());

      const matchesDate =
        !dateFilter ||
        (item.publishDate && item.publishDate.includes(dateFilter)) ||
        (item.updatedAt && item.updatedAt.includes(dateFilter));

      return matchesSearch && matchesStatus && matchesAudience && matchesDate;
    });
  }, [broadcasts, search, statusFilter, audienceFilter, dateFilter]);

  const getStatusBadge = (status: BroadcastStatus) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Published
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Scheduled
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Draft
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Expired
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "document" ? (
      <BookOpen className="w-4 h-4 text-amber-600" />
    ) : (
      <Megaphone className="w-4 h-4 text-blue-600" />
    );
  };

  const renderAudienceCell = (audience: string, audienceScope?: string) => {
    if (!audience || audience === "-" || audience.toLowerCase() === "all users") {
      return (
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-muted/60 border text-foreground">
            All Users
          </span>
          <div className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">ALL</div>
        </div>
      );
    }

    if (audience.toLowerCase() === "all franchises") {
      return (
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-muted/60 border text-foreground">
            All Franchises
          </span>
          <div className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">FRANCHISE</div>
        </div>
      );
    }

    const items = audience.split(",").map((s) => s.trim()).filter(Boolean);

    if (items.length === 0) {
      return (
        <div>
          <span className="text-xs text-muted-foreground font-medium">-</span>
        </div>
      );
    }

    const maxVisible = 2;
    const visibleItems = items.slice(0, maxVisible);
    const hiddenCount = items.length - maxVisible;

    return (
      <div className="space-y-0.5">
        <div className="flex flex-wrap items-center gap-1">
          {visibleItems.map((name, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted/50 border text-foreground max-w-[150px] truncate"
              title={name}
            >
              {name}
            </span>
          ))}
          {hiddenCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors">
                  +{hiddenCount}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs space-y-1.5 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Selected Audience ({items.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {items.map((name, i) => (
                    <span key={i} className="px-2 py-0.5 bg-background text-foreground rounded-md text-xs font-semibold border shadow-xs">
                      {name}
                    </span>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground uppercase font-mono">{audienceScope || "ALL"}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Broadcasts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create, manage and send announcements to your audience
          </p>
        </div>
        <Button onClick={onCreateOpen} className="w-full sm:w-auto gap-2 text-xs font-semibold h-10 px-4 shadow-sm rounded-xl">
          <Plus className="w-4 h-4" /> Create Broadcast
        </Button>
      </div>

      {/* Filter and Search Action Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search broadcast..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        {/* Status Select */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status: All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        {/* Audience Select */}
        <Select value={audienceFilter} onValueChange={setAudienceFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs rounded-xl">
            <SelectValue placeholder="Audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Audience: All</SelectItem>
            <SelectItem value="all users">All Users</SelectItem>
            <SelectItem value="role">Target Role</SelectItem>
            <SelectItem value="franchise">Target Franchise</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full sm:w-[170px] h-9 text-xs rounded-xl shadow-sm justify-start text-left font-normal px-3 bg-card border-input hover:bg-accent hover:text-accent-foreground ${
                !dateFilter && "text-muted-foreground"
              }`}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dateFilter ? new Date(dateFilter).toLocaleDateString() : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarUI
              mode="single"
              selected={dateFilter ? new Date(dateFilter) : undefined}
              onSelect={(date) => {
                if (date) {
                  setDateFilter(date.toISOString().split("T")[0]);
                } else {
                  setDateFilter("");
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button */}
        {(search || statusFilter !== "all" || audienceFilter !== "all" || dateFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setAudienceFilter("all");
              setDateFilter("");
            }}
            className="h-9 text-xs text-muted-foreground w-full sm:w-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Main Table Container */}
      <div className="border rounded-2xl bg-card overflow-x-auto shadow-sm">
        <Table className="min-w-[700px]">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wider uppercase pl-6">TITLE</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">AUDIENCE</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">STATUS</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">PUBLISH DATE</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">READ / SENT</TableHead>
              <TableHead className="text-right text-xs font-semibold tracking-wider uppercase pr-6">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredBroadcasts.length > 0 ? (
              filteredBroadcasts.map((item) => {
                const readPercentage = item.totalSent > 0 ? Math.round((item.readCount / item.totalSent) * 100) : 0;
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    {/* Title & Icon & ID */}
                    <TableCell className="py-3.5 pl-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted/40 border shrink-0 mt-0.5">
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <div
                            onClick={() => onViewItem(item)}
                            className="font-bold text-xs text-foreground hover:text-primary cursor-pointer transition-colors"
                          >
                            {item.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            ID: {item.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Audience */}
                    <TableCell className="text-xs">
                      {renderAudienceCell(item.audience, item.audienceScope)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(item.status)}</TableCell>

                    {/* Publish Date */}
                    <TableCell className="text-xs">
                      <div className="font-medium text-foreground">{item.publishDate !== "-" ? item.publishDate : "-"}</div>
                    </TableCell>

                    {/* Read / Sent */}
                    <TableCell className="w-[140px]">
                      {item.status === "published" || item.status === "expired" ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>
                              {item.readCount} / {item.totalSent}
                            </span>
                            <span className="text-[11px] text-emerald-600 font-bold">{readPercentage}%</span>
                          </div>
                          <Progress value={readPercentage} className="h-1.5 bg-muted" />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">- / -</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => onViewItem(item)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Broadcast"
                          onClick={() => (onEditItem ? onEditItem(item) : onViewItem(item))}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete Broadcast"
                          onClick={() => onDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  No broadcasts found matching your filter criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t bg-muted/20 text-xs text-center sm:text-left">
          <div className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">1</span> to{" "}
            <span className="font-semibold text-foreground">{filteredBroadcasts.length}</span> of{" "}
            <span className="font-semibold text-foreground">{broadcasts.length}</span> results
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="default" size="sm" className="h-8 w-8 text-xs font-bold rounded-lg">
              1
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 text-xs font-bold rounded-lg">
              2
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 text-xs font-bold rounded-lg">
              3
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

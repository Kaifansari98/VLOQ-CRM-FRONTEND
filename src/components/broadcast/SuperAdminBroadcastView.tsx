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
  ChevronDown,
  X,
  Users,
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
  const [typeFilter, setTypeFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [audienceSearch, setAudienceSearch] = useState("");
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic unique audiences from data (each segment split by ", ")
  const uniqueAudiences = useMemo(() => {
    const set = new Set<string>();
    broadcasts.forEach((b) => {
      b.audience.split(", ").forEach((a) => {
        const trimmed = a.trim();
        if (trimmed) set.add(trimmed);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [broadcasts]);

  // Filtered dataset
  const filteredBroadcasts = useMemo(() => {
    const result = broadcasts.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        (item.summary && item.summary.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesType = typeFilter === "all" || item.type === typeFilter;

      // Exact-segment audience match: check each comma-separated audience label
      const matchesAudience =
        audienceFilter === "all" ||
        item.audience
          .split(", ")
          .some((a) => a.trim().toLowerCase() === audienceFilter.toLowerCase());

      const matchesDate =
        !dateFilter ||
        (item.rawPublishAt && item.rawPublishAt.startsWith(dateFilter)) ||
        (item.publishDate && item.publishDate.includes(dateFilter));

      return matchesSearch && matchesStatus && matchesType && matchesAudience && matchesDate;
    });

    result.sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b.rawPublishAt || b.updatedAt || 0).getTime() - new Date(a.rawPublishAt || a.updatedAt || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.rawPublishAt || a.updatedAt || 0).getTime() - new Date(b.rawPublishAt || b.updatedAt || 0).getTime();
      }
      if (sortBy === "title_asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title_desc") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return result;
  }, [broadcasts, search, statusFilter, typeFilter, audienceFilter, dateFilter, sortBy]);


  const pageSize = Number(rowsPerPage) || 10;
  const totalItems = filteredBroadcasts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter, audienceFilter, dateFilter, sortBy, rowsPerPage]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedBroadcasts = useMemo(() => {
    return filteredBroadcasts.slice(startIndex, endIndex);
  }, [filteredBroadcasts, startIndex, endIndex]);

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
        </div>
      );
    }

    if (audience.toLowerCase() === "all franchises") {
      return (
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-muted/60 border text-foreground">
            All Franchises
          </span>
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
      <div className="flex flex-wrap items-center gap-1">
        {visibleItems.map((name, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted/50 border text-foreground max-w-[260px] truncate cursor-default"
              >
                {name}
              </span>
            </TooltipTrigger>
            <TooltipContent className="px-2.5 py-1 text-xs font-medium">
              {name}
            </TooltipContent>
          </Tooltip>
        ))}
        {hiddenCount > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                +{hiddenCount}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-64 p-3 space-y-2 shadow-md border rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-1.5 border-b text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Users className="w-3.5 h-3.5 text-foreground" />
                  Target Audience ({items.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
                {items.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-muted/80 text-foreground border border-border"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
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
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status: All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Select */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs rounded-xl">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Type: All</SelectItem>
            <SelectItem value="circular">Circular</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>

        {/* Audience — searchable Popover */}
        <Popover open={audienceOpen} onOpenChange={setAudienceOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full sm:w-[160px] h-9 text-xs rounded-xl justify-between font-normal px-3 ${
                audienceFilter !== "all"
                  ? "border-primary text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <span className="truncate">
                {audienceFilter === "all" ? "Audience: All" : audienceFilter}
              </span>
              <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[220px] p-0 shadow-xl border rounded-xl overflow-hidden"
            align="start"
            sideOffset={6}
          >
            {/* Search input */}
            <div className="flex items-center border-b px-3 py-2 gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                placeholder="Search source..."
                value={audienceSearch}
                onChange={(e) => setAudienceSearch(e.target.value)}
                autoFocus
              />
              {audienceSearch && (
                <button onClick={() => setAudienceSearch("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {/* Scrollable list */}
            <div className="max-h-52 overflow-y-auto py-1">
              {/* All option */}
              <button
                className={`w-full text-left px-4 py-2 text-xs hover:bg-muted/60 transition-colors ${
                  audienceFilter === "all" ? "bg-muted font-semibold" : ""
                }`}
                onClick={() => { setAudienceFilter("all"); setAudienceOpen(false); setAudienceSearch(""); }}
              >
                All
              </button>
              {uniqueAudiences
                .filter((a) => a.toLowerCase().includes(audienceSearch.toLowerCase()))
                .map((aud) => (
                  <button
                    key={aud}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-muted/60 transition-colors ${
                      audienceFilter === aud ? "bg-muted font-semibold" : ""
                    }`}
                    onClick={() => { setAudienceFilter(aud); setAudienceOpen(false); setAudienceSearch(""); }}
                  >
                    {aud}
                  </button>
                ))}
              {uniqueAudiences.filter((a) => a.toLowerCase().includes(audienceSearch.toLowerCase())).length === 0 && (
                <p className="px-4 py-3 text-xs text-muted-foreground text-center">No results</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full sm:w-[160px] h-9 text-xs rounded-xl shadow-sm justify-start text-left font-normal px-3 bg-card border-input hover:bg-accent hover:text-accent-foreground ${
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

        {/* Sort Select */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs rounded-xl shadow-sm bg-card border-input">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="title_asc">Title (A-Z)</SelectItem>
            <SelectItem value="title_desc">Title (Z-A)</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {(search || statusFilter !== "all" || typeFilter !== "all" || audienceFilter !== "all" || dateFilter || sortBy !== "latest") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setTypeFilter("all");
              setAudienceFilter("all");
              setAudienceSearch("");
              setDateFilter("");
              setSortBy("latest");
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
              <TableHead className="text-xs font-semibold tracking-wider uppercase">CREATED BY</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">STATUS</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">PUBLISH DATE</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">READ / SENT</TableHead>
              <TableHead className="text-right text-xs font-semibold tracking-wider uppercase pr-6">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedBroadcasts.length > 0 ? (
              paginatedBroadcasts.map((item) => {
                const rawPercentage = item.totalSent > 0 ? Math.round((item.readCount / item.totalSent) * 100) : 0;
                const readPercentage = Math.min(100, rawPercentage);
                const displayReadCount = item.totalSent > 0 ? Math.min(item.readCount, item.totalSent) : item.readCount;
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    {/* Title & Icon & ID */}
                    <TableCell className="py-3.5 pl-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted/40 border shrink-0 mt-0.5">
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                onClick={() => onViewItem(item)}
                                className="font-bold text-xs text-foreground hover:text-primary cursor-pointer transition-colors truncate max-w-[250px] sm:max-w-[300px]"
                              >
                                {item.title}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-[300px] text-xs break-words whitespace-pre-wrap">{item.title}</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ID: {item.id}
                            </span>
                            {item.type === "document" && item.category && (
                              <Badge variant="outline" className="text-[10px] font-semibold px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40 rounded-md">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Audience */}
                    <TableCell className="text-xs">
                      {renderAudienceCell(item.audience, item.audienceScope)}
                    </TableCell>

                    {/* Created By */}
                    <TableCell className="text-xs font-medium text-foreground">
                      {item.updatedBy?.name || "Super Admin"}
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
                              {displayReadCount} / {item.totalSent}
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
                          className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                          title={item.status === "published" ? "Published broadcasts cannot be edited" : "Edit Broadcast"}
                          disabled={item.status === "published"}
                          onClick={() => {
                            if (item.status !== "published" && onEditItem) {
                              onEditItem(item);
                            }
                          }}
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t bg-muted/20 text-xs">
          <div className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{totalItems === 0 ? 0 : startIndex + 1}</span> to{" "}
            <span className="font-semibold text-foreground">{endIndex}</span> of{" "}
            <span className="font-semibold text-foreground">{totalItems}</span> results
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rows per page</span>
              <Select value={rowsPerPage} onValueChange={(val) => setRowsPerPage(val)}>
                <SelectTrigger className="w-[65px] h-8 text-xs bg-muted/30 rounded-lg">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 text-xs font-bold rounded-lg"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

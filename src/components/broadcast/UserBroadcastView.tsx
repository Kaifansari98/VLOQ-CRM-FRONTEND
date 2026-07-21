"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Search,
  Download,
  Eye,
  Megaphone,
  FileText,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { BroadcastItem } from "@/types/broadcast";
import { stripHtmlAndEntities, markBroadcastAsReadLocal } from "@/api/broadcast";

interface UserBroadcastViewProps {
  broadcasts: BroadcastItem[];
  onViewItem: (item: BroadcastItem) => void;
  onToggleBookmark: (id: string) => void;
}

export const UserBroadcastView: React.FC<UserBroadcastViewProps> = ({
  broadcasts,
  onViewItem,
  onToggleBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<"circulars" | "documents">("circulars");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [updatedByFilter, setUpdatedByFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  // Separate counts
  const circularsCount = useMemo(() => broadcasts.filter((b) => b.type === "circular").length, [broadcasts]);
  const documentsCount = useMemo(() => broadcasts.filter((b) => b.type === "document").length, [broadcasts]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return broadcasts
      .filter((item) => {
        // Tab type filter
        if (activeTab === "circulars" && item.type !== "circular") return false;
        if (activeTab === "documents" && item.type !== "document") return false;

        // Search text
        const matchesSearch =
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          (item.summary && item.summary.toLowerCase().includes(search.toLowerCase()));

        // Date Filter
        const matchesDate =
          !dateFilter ||
          (item.publishDate && item.publishDate.includes(dateFilter)) ||
          (item.updatedAt && item.updatedAt.includes(dateFilter));

        // Select Filters
        const matchesUpdatedBy = updatedByFilter === "all" || item.updatedBy.name.toLowerCase().includes(updatedByFilter.toLowerCase());

        return matchesSearch && matchesDate && matchesUpdatedBy;
      })
      .sort((a, b) => {
        if (sortBy === "latest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (sortBy === "oldest") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        if (sortBy === "title") return a.title.localeCompare(b.title);
        return 0;
      });
  }, [broadcasts, activeTab, search, dateFilter, updatedByFilter, sortBy]);

  const pageSize = Number(rowsPerPage) || 10;
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, dateFilter, updatedByFilter, sortBy, rowsPerPage]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, startIndex, endIndex]);

  return (
    <div className="space-y-6">
      {/* Top Title & Left-Aligned Pill Tabs and Search Bar */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Broadcast</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage circulars and documents for your organization
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === "circulars" ? "circulars" : "documents"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl shadow-sm"
            />
          </div>

          {/* CRM Pill Shaped Tabs with Smooth Animation */}
          <div className="inline-flex items-center p-1 bg-muted/50 border rounded-full gap-1 shrink-0 w-fit">
            {[
              { id: "circulars", label: "Circulars", icon: Megaphone, count: circularsCount },
              { id: "documents", label: "Documents", icon: FileText, count: documentsCount },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as "circulars" | "documents")}
                  className={`relative flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-full transition-colors duration-200 select-none ${
                    isActive
                      ? "text-white dark:text-black"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill_UserView"
                      className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-md"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 font-bold rounded-full transition-colors ${
                        isActive ? "bg-white/20 text-white dark:bg-black/20 dark:text-black" : ""
                      }`}
                    >
                      {tab.count}
                    </Badge>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full sm:w-[190px] h-10 text-xs rounded-xl shadow-sm justify-start text-left font-normal px-3 bg-card border-input hover:bg-accent hover:text-accent-foreground ${
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
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Created By */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Created By</span>
            <Select value={updatedByFilter} onValueChange={setUpdatedByFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/20 rounded-lg">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="super admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-medium">Sort By</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-muted/20 rounded-lg">
                <SelectValue placeholder="Latest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Action */}
        {(updatedByFilter !== "all" || search || dateFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setDateFilter("");
              setUpdatedByFilter("all");
              setSortBy("latest");
            }}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Main Table View */}
      <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wider uppercase pl-4">
                {activeTab === "circulars" ? "CIRCULAR" : "DOCUMENT"}
              </TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase flex items-center gap-1">
                PUBLISHED DATE <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
              </TableHead>
              <TableHead className="text-xs font-semibold tracking-wider uppercase">CREATED BY</TableHead>
              <TableHead className="text-right text-xs font-semibold tracking-wider uppercase pr-6">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => {
                    markBroadcastAsReadLocal(item.numericId || item.id);
                    onViewItem(item);
                  }}
                >
                  {/* Document Column */}
                  <TableCell className="py-3.5 pl-4">
                    <div className="font-bold text-xs text-foreground hover:text-primary transition-colors">
                      {item.title}
                    </div>
                  </TableCell>

                  {/* Published Date Column */}
                  <TableCell className="text-xs font-medium text-foreground">{item.publishDate || item.updatedAt}</TableCell>

                  {/* Created By Column */}
                  <TableCell className="text-xs">
                    <span className="font-semibold text-foreground">{item.updatedBy.name}</span>
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* Download */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Download Document"
                        onClick={() => {
                          if (item.attachments && item.attachments.length > 0 && item.attachments[0].url) {
                            window.open(item.attachments[0].url, "_blank");
                          } else {
                            alert("No file attached to this broadcast.");
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      {/* Details Eye */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="View Details"
                        onClick={() => onViewItem(item)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  No {activeTab} found matching your filters.
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

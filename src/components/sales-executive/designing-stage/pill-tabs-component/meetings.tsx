"use client";

import React, { useState } from "react";
import { useGetMeetings } from "@/hooks/designing-stage/use-meetings";
import { useDetails } from "./details-context";
import { toast } from "react-toastify";
import { useAppSelector } from "@/redux/store";
import { Meeting } from "@/types/designing-stage-types";
import {
  File,
  FileText,
  Calendar,
  Eye,
  ChevronRight,
  Search,
  SortAsc,
  X,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MeetingDetailsModal from "./modals/meetings-details-modal";

const MeetingsTab = () => {
  const { leadId } = useDetails();
  const vendorId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data, isLoading, isError, refetch } = useGetMeetings(
    vendorId!,
    leadId
  );

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");

  const formatReadableDate = (dateString: string): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString: string): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTimeOnly = (dateString: string): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
  };

  // Filter & sort
  const filteredAndSortedMeetings = React.useMemo(() => {
    if (!data?.meetings) return [];

    let filtered = data.meetings.filter(
      (meeting: Meeting) =>
        meeting.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatReadableDate(meeting.date)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a: Meeting, b: Meeting) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "docs":
          return (
            b.designMeetingDocsMapping.length -
            a.designMeetingDocsMapping.length
          );
        default:
          return 0;
      }
    });
  }, [data?.meetings, searchQuery, sortBy]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="p-0 overflow-hidden">
          <div className="h-28 bg-muted">
            <div className="flex justify-center items-center h-full">
              <Skeleton className="h-12 w-12 rounded" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );

  // Error state
  if (isError) {
    toast.error("Failed to load meetings");
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <X size={32} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-xl mb-2">
            Failed to load meetings
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-4">
            Something went wrong while loading your meetings. Please try again.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // Empty state
  if (!data?.meetings || data.meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <Calendar size={40} className="text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-xl mb-3">No meetings found</h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            You don't have any meetings scheduled yet. Meetings will appear here
            once they are created.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Meetings</h2>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedMeetings.length} meeting
            {filteredAndSortedMeetings.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40">
              <SortAsc size={16} className="mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="docs">Sort by Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Meetings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAndSortedMeetings.map((meeting: Meeting) => (
          <Card
            key={meeting.id}
            className="group p-0 flex flex-col cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] overflow-hidden h-full"
            onClick={() => handleViewMeeting(meeting)}
          >
            {/* Header Section */}
            <div className="relative h-28 bg-muted group-hover:bg-accent transition-colors">
              <div className="flex justify-center items-center h-full">
                <File size={36} className="text-foreground" />
              </div>

              <Badge className="absolute top-3 right-3 shadow-sm">
                <FileText size={12} className="mr-1" />
                {meeting.designMeetingDocsMapping.length}
              </Badge>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-between flex-1 p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Calendar size={12} />
                  {formatDateOnly(meeting.date)}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={12} />
                  {formatTimeOnly(meeting.date)}
                </div>

                <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
                  {meeting.desc || "No description available for this meeting"}
                </p>
              </div>

              <div className="mt-4">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewMeeting(meeting);
                  }}
                >
                  <Eye size={14} className="mr-2" />
                  View Details
                  <ChevronRight
                    size={14}
                    className="ml-auto group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <MeetingDetailsModal
          open={!!selectedMeeting}
          onOpenChange={(open) => !open && setSelectedMeeting(null)}
          meeting={selectedMeeting}
        />
      )}
    </div>
  );
};

export default MeetingsTab;

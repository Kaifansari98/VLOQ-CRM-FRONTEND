"use client";
import React from "react";
import { useGetMeetings } from "@/hooks/designing-stage/use-meetings";
import { useDetails } from "./details-context";
import { toast } from "react-toastify";
import { useAppSelector } from "@/redux/store";
import {
  DesignMeetingDocsMapping,
  Meeting,
} from "@/types/designing-stage-types";
import { File, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MeetingsTab = () => {
  const { leadId } = useDetails();
  const venodrId = useAppSelector((state) => state.auth.user?.vendor_id);
  const { data, isLoading, isError, refetch } = useGetMeetings(
    venodrId!,
    leadId
  );

  if (isLoading) return <p>Loading meetings...</p>;
  if (isError) {
    toast.error("Failed to load meetings!");
    return <p className="text-red-500">Error loading meetings.</p>;
  }

  const formatReadableDate = (dateString: string): string => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.meetings.map((meeting: Meeting, index: number) => (
          <div
            key={index}
            className="relative border overflow-hidden rounded-md"
          >
            <div className="flex justify-center items-center bg-gray-100 h-36">
              <File size={100} color="black" />
            </div>
            <div className="absolute top-3 right-3">
              <Badge className="min-w-5 px-1">
                <FileText size={20} />
                {meeting.designMeetingDocsMapping.length}
              </Badge>
            </div>

            <div className=" p-2 ">
              <span className=" text-xs sm:text-sm font-medium">
                {formatReadableDate(meeting.date)}
              </span>
              <h1 className="text-xs sm:text-sm capitalize text-gray-400 line-clamp-2">
                {meeting.desc} Lorem ipsum dolor sit amet consectetur
                adipisicing elit. Ipsum labore vero amet aliquam, in, explicabo
                delectus asperiores voluptate, provident minima saepe! Nobis,
                quod dolor quasi vel sint harum? Expedita, reiciendis.
              </h1>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingsTab;

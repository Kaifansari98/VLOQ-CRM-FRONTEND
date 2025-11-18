"use client";

import { Trash2, SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

interface DocumentCardProps {
  doc: {
    id: number | string;
    doc_og_name: string;
    signedUrl: string;
    created_at?: string;
  };
  index?: number;
  canDelete?: boolean;
  onView?: (index: number) => void;
  onDelete?: (id: number | string) => void;
  status?: "APPROVED" | "REJECTED" | "PENDING" | string;
  isLoading?: boolean;
}

// Skeleton Loading Component
export const DocumentCardSkeleton: React.FC<{
  canDelete?: boolean;
  status?: boolean;
}> = ({ canDelete = false, status }) => {
  return (
    <div className="group relative flex items-center justify-between gap-4 rounded-xl p-3 border border-border shadow-sm overflow-hidden bg-card">
      {/* Delete Button Skeleton */}
      {canDelete && (
        <div className="absolute top-3 right-1.5 p-1 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse">
          <div className="w-4 h-4" />
        </div>
      )}

      {/* Thumbnail Skeleton */}
      <div className="flex-shrink-0">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* Details Skeleton */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          {/* Title Skeleton */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mb-2" />

          {/* Date Skeleton */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2 mt-0.5" />
        </div>

        {/* Actions + Status Skeleton */}
        <div className="flex items-center justify-between gap-2 mt-3">
          {/* View Button Skeleton */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse w-20 h-7" />

          {/* Status Skeleton */}
          {status && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
export const ImageComponent: React.FC<DocumentCardProps> = ({
  doc,
  index = 0,
  canDelete = false,
  onView,
  onDelete,
  status,
  isLoading = false,
}) => {
  // Show skeleton if loading
  if (isLoading) {
    return <DocumentCardSkeleton canDelete={canDelete} status={!!status} />;
  }

  // Card style based on status
  const getCardStyle = () => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "";
      case "REJECTED":
        return "";
      case "PENDING":
        return "";
      default:
        return "bg-card border-border hover:border-muted-foreground/20";
    }
  };

  const getStatusLabel = () => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "PENDING":
        return "Pending";
      default:
        return null;
    }
  };

  const getDotColor = () => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]";
      case "REJECTED":
        return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]";
      case "PENDING":
        return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
      default:
        return "bg-gray-400 shadow-[0_0_6px_rgba(156,163,175,0.6)]";
    }
  };

  return (
    <div
      className={`group relative flex items-center justify-between gap-4 rounded-xl p-3 border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${getCardStyle()}`}
    >
      {/* Delete Button */}
      {canDelete && (
        <button
          onClick={() => onDelete?.(doc.id)}
          className="absolute top-3 right-1.5 p-1 rounded-full dark:bg-red-950 border dark:border-red-800 
                      dark:hover:bg-red-900 hover:bg-red-50 transition-all z-10"
          title="Delete Document"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      )}

      {/* Thumbnail */}
      <div className="flex-shrink-0">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
          <img
            src={doc.signedUrl}
            alt={doc.doc_og_name}
            className="w-full h-full object-cover object-center transition-transform duration-300 ease-in-out hover:scale-110"
          />
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="text-sm font-semibold text-foreground truncate pr-6">
            {doc.doc_og_name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Uploaded on{" "}
            {new Date(doc.created_at!).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Actions + Status */}
        <div className="flex items-center justify-between gap-2 mt-3">
          {/* View Button */}
          <button
            onClick={() => onView?.(index)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 
                        bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-xs transition-all
                        dark:border-blue-800 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-300"
            title="View Document"
          >
            <SquareArrowOutUpRight className="w-4 h-4" />
            <span>View</span>
          </button>

          {/* Status */}
          {getStatusLabel() && (
            <div className="flex items-center gap-2">
              {/* Animated glowing dot */}
              <motion.div
                className={`w-2 h-2 rounded-full ${getDotColor()}`}
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.6,
                  ease: "easeInOut",
                }}
              />

              {/* Status Text */}
              <span
                className={`text-[12px] font-semibold ${
                  status === "APPROVED"
                    ? "text-green-700 dark:text-green-400"
                    : status === "REJECTED"
                    ? "text-red-700 dark:text-red-400"
                    : "text-blue-700 dark:text-blue-400"
                }`}
              >
                {getStatusLabel()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

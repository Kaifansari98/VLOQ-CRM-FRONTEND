// @/components/utils/VideoCard.tsx
"use client";

import React, { useState } from "react";
import { Play, Trash2 } from "lucide-react";
import VideoViewerModal from "./VideoViewerModal";

interface VideoCardProps {
  doc: {
    id: number;
    originalName: string;
    signedUrl: string;
    created_at?: string;
  };
  canDelete?: boolean;
  onDelete?: (id: number) => void;
}

export default function VideoCard({
  doc,
  canDelete,
  onDelete,
}: VideoCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <div
        className="
          group relative flex items-center gap-4 rounded-xl p-4
          border border-border bg-card text-card-foreground
          transition-all duration-200 hover:bg-muted/40
        "
      >
        {/* Delete Button */}
        {canDelete && (
          <button
            onClick={() => onDelete?.(doc.id)}
            className="
              absolute top-3 right-3 p-1 rounded-full
              border border-border bg-card
              hover:bg-muted
              transition-colors
            "
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Thumbnail */}
        <div className="shrink-0">
          <div
            className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-foreground/10 cursor-pointer"
            onClick={() => setViewerOpen(true)}
          >
            <video
              src={doc.signedUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h3 className="text-sm font-semibold text-foreground truncate pr-6">
              {doc.originalName}
            </h3>
            {doc.created_at && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Uploaded on{" "}
                {new Date(doc.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          {/* Play Button */}
          <div className="flex items-end justify-between mt-3">
            <button
              onClick={() => setViewerOpen(true)}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-md
                border border-border bg-muted/30
                text-foreground text-xs font-medium
                hover:bg-muted transition
              "
            >
              <Play className="w-4 h-4" />
              Play
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Video Modal */}
      <VideoViewerModal
        open={viewerOpen}
        videoUrl={doc.signedUrl}
        title={doc.originalName}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

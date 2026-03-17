// @/components/utils/VideoCard.tsx
"use client";

import React, { useState } from "react";
import { Play, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <div className="relative rounded-xl border bg-muted/30 dark:bg-neutral-900 overflow-hidden group">
        {/* Video Player */}
        <div className="relative w-full aspect-video bg-black">
          {playing ? (
            <video
              src={doc.signedUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
              onEnded={() => setPlaying(false)}
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer"
              onClick={() => setPlaying(true)}
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <p className="text-xs text-white/70">Click to play</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <Video className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
              {doc.originalName}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {/* Download */}
            <a
              href={doc.signedUrl}
              download={doc.originalName}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-muted-foreground" />
            </a>
            {/* Delete */}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete?.(doc.id)} // Added optional chaining
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

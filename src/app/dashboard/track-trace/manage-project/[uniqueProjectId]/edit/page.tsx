"use client";

import { useParams } from "next/navigation";
import TrackTraceProjectForm from "@/components/track-trace/TrackTraceProjectForm";

export default function EditTrackTraceProjectPage() {
  const params = useParams<{ uniqueProjectId: string }>();

  return (
    <main className="p-4 md:p-6">
      <TrackTraceProjectForm
        mode="edit"
        uniqueProjectId={params.uniqueProjectId}
      />
    </main>
  );
}
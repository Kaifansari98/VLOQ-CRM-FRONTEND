"use client";

import TrackTraceProjectForm from "@/components/track-trace/TrackTraceProjectForm";

export default function EditTrackTraceProjectPage({
  params,
}: {
  params: {
    uniqueProjectId: string;
  };
}) {
  return (
    <main className="p-4 md:p-6">
      <TrackTraceProjectForm
        mode="edit"
        uniqueProjectId={params.uniqueProjectId}
      />
    </main>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import TrackTraceProjectTable from "@/components/custom/track-trace-project-table";

import {
  useDeleteTrackTraceProject,
  useTrackTraceProjects,
} from "@/hooks/track-trace/useTrackTraceProjects";

import {
  ProjectDeletedFilter,
  ProjectSortBy,
  TrackTraceProjectFilters,
  TrackTraceProjectListRow,
} from "@/api/track-trace/track-trace.api";

import { useAppSelector } from "@/redux/store";

const DEFAULT_FILTERS: TrackTraceProjectFilters = {
  page: 1,
  limit: 10,

  search: "",

  track_trace_status: "all",

  deleted: "active",

  date_from: "",
  date_to: "",

  sort_by: "created_at",
  sort_order: "desc",
};

export default function TrackTraceProjectsPage() {
  const router = useRouter();

  const authUser = useAppSelector((state) => state.auth.user);

  const vendorId = authUser?.vendor_id;

  const userId = Number(
    (authUser as { id?: number; user_id?: number } | undefined)?.id ??
      (authUser as { id?: number; user_id?: number } | undefined)?.user_id
  );

  const [filters, setFilters] = useState<TrackTraceProjectFilters>(DEFAULT_FILTERS);

  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError, isFetching } = useTrackTraceProjects(
    vendorId,
    filters
  );

  const { mutateAsync: deleteProject, isPending: isDeleting } =
    useDeleteTrackTraceProject();

  const projects = data?.projects ?? [];
  const pagination = data?.pagination;

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleCutList = (row: TrackTraceProjectListRow) => {
    if (row.isDeleted) return;
    router.push(`/dashboard/track-trace/manage-project/${row.unique_project_id}`);
  };

  const handleProjectDetail = (row: TrackTraceProjectListRow) => {
    if (row.isDeleted) return;
    router.push(`/dashboard/track-trace/manage-project/${row.unique_project_id}/details`);
  };

  const handleEditProject = (row: TrackTraceProjectListRow) => {
    if (row.isDeleted) return;
    router.push(`/dashboard/track-trace/manage-project/${row.unique_project_id}/edit`);
  };

  const navigateTrackTraceProject = (row: TrackTraceProjectListRow) => {
    handleCutList(row);
  };

  /*
  |--------------------------------------------------------------------------
  | Sorting
  |--------------------------------------------------------------------------
  */

  const handleSort = (field: ProjectSortBy) => {
    setFilters((previous) => {
      const sameColumn = previous.sort_by === field;
      return {
        ...previous,
        page: 1,
        sort_by: field,
        sort_order: sameColumn
          ? previous.sort_order === "asc"
            ? "desc"
            : "asc"
          : "asc",
      };
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const handleDeleteProject = async (row: TrackTraceProjectListRow) => {
    if (row.isDeleted || !vendorId || !userId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${row.project_name}"?\n\nDeleted projects will be deleted permanently.`
    );

    if (!confirmed) return;

    try {
      await deleteProject({
        vendorId,
        projectId: row.id,
        userId,
      });
    } catch (error) {
      console.error("Failed to delete project:", error);
      window.alert("Failed to delete project. Please try again.");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

  const resetFilters = () => {
    setSearchInput("");
    setFilters({ ...DEFAULT_FILTERS });
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="h-4" />

          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Master</BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>Track & Trace Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden py-4">
        {/* Header */}
        <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between mb-2">
          <div>
            <h1 className="text-lg font-semibold">Manage Track & Trace Projects</h1>

            <p className="text-xs text-muted-foreground mt-0.5">
              Search, filter and manage track & trace projects.
            </p>
          </div>

          <Button
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => router.push("/dashboard/track-trace/manage-project/create")}
          >
            <Plus size={15} />
            Create New Project
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="px-4 pt-6 text-sm text-muted-foreground">
            Loading projects...
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="px-4 pt-6 text-sm text-red-500">
            Failed to load projects.
          </div>
        )}

        {/* Universal Style Table & Toolbar */}
        {!isLoading && !isError && (
          <div>
            {isFetching && (
              <div className="px-4 mb-2 text-xs text-muted-foreground">
                Updating projects...
              </div>
            )}

            <TrackTraceProjectTable
              table={projects}
              page={filters.page}
              limit={filters.limit}
              totalCount={pagination?.total}
              totalPages={pagination?.totalPages}
              onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
              onLimitChange={(l) => setFilters((prev) => ({ ...prev, page: 1, limit: l }))}
              searchQuery={searchInput}
              onSearchChange={(q) => {
                setSearchInput(q);
                setFilters((prev) => ({ ...prev, page: 1, search: q.trim() }));
              }}
              ttStatusFilter={filters.track_trace_status ?? "all"}
              onTTStatusChange={(status) =>
                setFilters((prev) => ({ ...prev, page: 1, track_trace_status: status }))
              }
              deletedFilter={filters.deleted ?? "active"}
              onDeletedChange={(deleted) =>
                setFilters((prev) => ({ ...prev, page: 1, deleted: deleted as ProjectDeletedFilter }))
              }
              onResetFilters={resetFilters}
              sortBy={filters.sort_by}
              sortOrder={filters.sort_order}
              onSort={handleSort}
              onRowDoubleClick={navigateTrackTraceProject}
              onCutListClick={handleCutList}
              onProjectDetailClick={handleProjectDetail}
              onEditClick={handleEditProject}
              onDeleteClick={handleDeleteProject}
              isDeleting={isDeleting}
            />
          </div>
        )}
      </main>
    </>
  );
}

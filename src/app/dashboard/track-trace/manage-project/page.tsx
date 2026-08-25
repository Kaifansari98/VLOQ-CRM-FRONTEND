"use client";

import {
  FormEvent,
  useState,
} from "react";

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
import { Input } from "@/components/ui/input";

import {
  FilterX,
  Plus,
  Search,
} from "lucide-react";

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

  track_trace_status:
    "all",

  deleted: "active",

  date_from: "",
  date_to: "",

  sort_by: "created_at",
  sort_order: "desc",
};

export default function TrackTraceProjectsPage() {
  const router = useRouter();

  const authUser =
    useAppSelector(
      (state) => state.auth.user
    );

  const vendorId =
    authUser?.vendor_id;

  /*
   * Supports either:
   * user.id
   * OR
   * user.user_id
   *
   * depending on your auth response.
   */
  const userId = Number(
    (
      authUser as
        | {
            id?: number;
            user_id?: number;
          }
        | undefined
    )?.id ??
      (
        authUser as
          | {
              id?: number;
              user_id?: number;
            }
          | undefined
      )?.user_id
  );

  const [
    filters,
    setFilters,
  ] =
    useState<TrackTraceProjectFilters>(
      DEFAULT_FILTERS
    );

  /*
   * Separate input value means typing does not
   * make an API request on every keystroke.
   */
  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const {
    data,
    isLoading,
    isError,
    isFetching,
  } =
    useTrackTraceProjects(
      vendorId,
      filters
    );

  const {
    mutateAsync:
      deleteProject,
    isPending:
      isDeleting,
  } =
    useDeleteTrackTraceProject();

  const projects =
    data?.projects ?? [];

  const pagination =
    data?.pagination;

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleCutList = (
    row: TrackTraceProjectListRow
  ) => {
    if (row.isDeleted) return;

    router.push(
      `/dashboard/track-trace/manage-project/${row.unique_project_id}`
    );
  };

  const handleProjectDetail = (
    row: TrackTraceProjectListRow
  ) => {
    if (row.isDeleted) return;

    router.push(
      `/dashboard/track-trace/manage-project/${row.unique_project_id}/details`
    );
  };

  const handleEditProject = (
    row: TrackTraceProjectListRow
  ) => {
    if (row.isDeleted) return;

    router.push(
      `/dashboard/track-trace/manage-project/${row.unique_project_id}/edit`
    );
  };

  const navigateTrackTraceProject = (
    row: TrackTraceProjectListRow
  ) => {
    handleCutList(row);
  };

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearch = (
    event: FormEvent
  ) => {
    event.preventDefault();

    setFilters(
      (previous) => ({
        ...previous,

        page: 1,

        search:
          searchInput.trim(),
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Sorting
  |--------------------------------------------------------------------------
  */

  const handleSort = (
    field: ProjectSortBy
  ) => {
    setFilters(
      (previous) => {
        const sameColumn =
          previous.sort_by ===
          field;

        return {
          ...previous,

          page: 1,

          sort_by: field,

          sort_order:
            sameColumn
              ? previous.sort_order ===
                "asc"
                ? "desc"
                : "asc"
              : "asc",
        };
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const handleDeleteProject =
    async (
      row: TrackTraceProjectListRow
    ) => {
      if (row.isDeleted) {
        return;
      }

      if (!vendorId) {
        window.alert(
          "Vendor information is missing."
        );
        return;
      }

      if (!userId) {
        window.alert(
          "Logged-in user information is missing."
        );

        return;
      }

      const resolvedVendorId: number =
        vendorId;

      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${row.project_name}"?\n\n Deleted projects will be deleted permenantly .`
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteProject({
          vendorId:
            resolvedVendorId,
          projectId:
            row.id,
          userId,
        });
      } catch (error) {
        console.error(
          "Failed to delete project:",
          error
        );

        window.alert(
          "Failed to delete project. Please try again."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

  const resetFilters = () => {
    setSearchInput("");

    setFilters({
      ...DEFAULT_FILTERS,
    });
  };

  const startRecord =
    pagination &&
    pagination.total >
      0
      ? (pagination.page -
          1) *
          pagination.limit +
        1
      : 0;

  const endRecord =
    pagination
      ? Math.min(
          pagination.page *
            pagination.limit,
          pagination.total
        )
      : 0;

  return (
    <>
      <header className="flex h-16 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="h-4"
          />

          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  Master
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>
                  Track & Trace
                  Projects
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden py-4">
        {/* Header */}

        <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              Manage Track &
              Trace Projects
            </h1>

            <p className="text-xs text-muted-foreground mt-1">
              Search, filter and
              manage track &
              trace projects.
            </p>
          </div>

          <Button
            size="sm"
            className="gap-2"
            onClick={() =>
              router.push(
                "/dashboard/track-trace/manage-project/create"
              )
            }
          >
            <Plus size={15} />

            Create New Project
          </Button>
        </div>

        {/* Filters */}

        <div className="px-4 mt-4">
          <div className="rounded-lg border bg-card p-3">
            <div className="flex flex-col xl:flex-row gap-3">
              {/* Search */}

              <form
                onSubmit={
                  handleSearch
                }
                className="flex flex-1 gap-2 min-w-[280px]"
              >
                <Input
                  value={
                    searchInput
                  }
                  onChange={(e) =>
                    setSearchInput(
                      e.target.value
                    )
                  }
                  placeholder="Search project, order no., client, lead..."
                  className="h-9"
                />

                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="h-9 gap-1.5"
                >
                  <Search
                    size={14}
                  />

                  Search
                </Button>
              </form>

              {/* Track Trace Status */}

              <select
                value={
                  filters.track_trace_status ??
                  "all"
                }
                onChange={(e) =>
                  setFilters(
                    (
                      previous
                    ) => ({
                      ...previous,

                      page: 1,

                      track_trace_status:
                        e.target
                          .value,
                    })
                  )
                }
                className="
                  h-9
                  rounded-md
                  border
                  border-input
                  bg-background
                  px-3
                  text-sm
                  min-w-[170px]
                "
              >
                <option value="all">
                  All T&T Status
                </option>

                <option value="Not Started">
                  Not Started
                </option>

                <option value="Started">
                  Started
                </option>

                <option value="Completed">
                  Completed
                </option>
              </select>

              {/* Deleted Status */}

              <select
                value={
                  filters.deleted ??
                  "active"
                }
                onChange={(e) =>
                  setFilters(
                    (
                      previous
                    ) => ({
                      ...previous,

                      page: 1,

                      deleted:
                        e.target
                          .value as ProjectDeletedFilter,
                    })
                  )
                }
                className="
                  h-9
                  rounded-md
                  border
                  border-input
                  bg-background
                  px-3
                  text-sm
                  min-w-[150px]
                "
              >
                <option value="active">
                  Active Projects
                </option>

                <option value="deleted">
                  Deleted Projects
                </option>

                <option value="all">
                  All Projects
                </option>
              </select>

              {/* Date From */}

              <Input
                type="date"
                title="Created from"
                value={
                  filters.date_from ??
                  ""
                }
                onChange={(e) =>
                  setFilters(
                    (
                      previous
                    ) => ({
                      ...previous,

                      page: 1,

                      date_from:
                        e.target
                          .value,
                    })
                  )
                }
                className="h-9 w-auto"
              />

              {/* Date To */}

              <Input
                type="date"
                title="Created to"
                value={
                  filters.date_to ??
                  ""
                }
                onChange={(e) =>
                  setFilters(
                    (
                      previous
                    ) => ({
                      ...previous,

                      page: 1,

                      date_to:
                        e.target
                          .value,
                    })
                  )
                }
                className="h-9 w-auto"
              />

              {/* Page Size */}

              <select
                value={
                  filters.limit
                }
                onChange={(e) =>
                  setFilters(
                    (
                      previous
                    ) => ({
                      ...previous,

                      page: 1,

                      limit:
                        Number(
                          e.target
                            .value
                        ),
                    })
                  )
                }
                className="
                  h-9
                  rounded-md
                  border
                  border-input
                  bg-background
                  px-3
                  text-sm
                  min-w-[100px]
                "
              >
                <option value={10}>
                  10 / page
                </option>

                <option value={20}>
                  20 / page
                </option>

                <option value={50}>
                  50 / page
                </option>

                <option value={100}>
                  100 / page
                </option>
              </select>

              {/* Reset */}

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 gap-1.5"
                onClick={
                  resetFilters
                }
              >
                <FilterX
                  size={14}
                />

                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}

        {isLoading && (
          <div className="px-4 pt-6 text-sm text-muted-foreground">
            Loading
            projects...
          </div>
        )}

        {/* Error */}

        {isError && (
          <div className="px-4 pt-6 text-sm text-red-500">
            Failed to load
            projects.
          </div>
        )}

        {/* Table */}

        {!isLoading &&
          !isError && (
            <div className="px-4 pt-3">
              {/* Fetch indicator */}

              {isFetching && (
                <div className="mb-2 text-xs text-muted-foreground">
                  Updating
                  projects...
                </div>
              )}

              <TrackTraceProjectTable
                table={
                  projects
                }
                page={
                  filters.page
                }
                limit={
                  filters.limit
                }
                sortBy={
                  filters.sort_by
                }
                sortOrder={
                  filters.sort_order
                }
                onSort={
                  handleSort
                }
                onRowDoubleClick={
                  navigateTrackTraceProject
                }
                onCutListClick={
                  handleCutList
                }
                onProjectDetailClick={
                  handleProjectDetail
                }
                onEditClick={
                  handleEditProject
                }
                onDeleteClick={
                  handleDeleteProject
                }
                isDeleting={
                  isDeleting
                }
              />

              {/* Pagination */}

              {pagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
                  <p className="text-xs text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {
                        startRecord
                      }
                    </span>
                    {" - "}
                    <span className="font-medium text-foreground">
                      {
                        endRecord
                      }
                    </span>
                    {" of "}
                    <span className="font-medium text-foreground">
                      {
                        pagination.total
                      }
                    </span>{" "}
                    projects
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        !pagination.hasPreviousPage ||
                        isFetching
                      }
                      onClick={() =>
                        setFilters(
                          (
                            previous
                          ) => ({
                            ...previous,

                            page:
                              Math.max(
                                1,
                                previous.page -
                                  1
                              ),
                          })
                        )
                      }
                    >
                      Previous
                    </Button>

                    <div className="min-w-[100px] text-center text-xs">
                      Page{" "}
                      <span className="font-semibold">
                        {
                          pagination.page
                        }
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold">
                        {Math.max(
                          pagination.totalPages,
                          1
                        )}
                      </span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        !pagination.hasNextPage ||
                        isFetching
                      }
                      onClick={() =>
                        setFilters(
                          (
                            previous
                          ) => ({
                            ...previous,

                            page:
                              previous.page +
                              1,
                          })
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
      </main>
    </>
  );
}

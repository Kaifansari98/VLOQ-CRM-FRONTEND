"use client";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

interface TableLoaderProps {
  isLoading: boolean;
  children?: React.ReactNode;
}

export const TableLoader = ({ isLoading, children }: TableLoaderProps) => {
  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={10}
        // filterCount={2}
        // cellWidths={["10rem", "20rem", "10rem", "10rem", "8rem", "8rem"]}
      />
    );
  }
  return <>{children}</>;
};

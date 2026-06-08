import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type * as React from "react";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { getCommonPinningStyles } from "@/lib/data-table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  onRowDoubleClick?: (row: TData) => void;
  renderRowContextMenu?: (row: TData) => React.ReactNode;
  rowClassName?: (row: TData) => string | undefined;
  showPagination?: boolean; // ✅ Add this prop
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  className,
  onRowDoubleClick,
  renderRowContextMenu,
  rowClassName,
  showPagination = true, // ✅ Default to true for backward compatibility
  ...props
}: DataTableProps<TData>) {
  return (
    <div
      className={cn("flex w-full flex-col gap-2.5", className)}
      {...props}
    >
      {children}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className="!font-extrabold !text-foreground cursor-pointer select-none"
                    style={{
                      ...getCommonPinningStyles({ column: header.column }),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const rowNode = (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onDoubleClick={(event) => {
                      if (
                        event.target instanceof HTMLElement &&
                        (event.target.closest('[data-slot="action-button"]') ||
                          event.target.closest("button") ||
                          event.target.closest('[role="button"]') ||
                          event.target.closest("[data-radix-menu-content]"))
                      ) {
                        return;
                      }
                      onRowDoubleClick?.(row.original);
                    }}
                    className={cn(
                      onRowDoubleClick || renderRowContextMenu
                        ? "cursor-pointer"
                        : undefined,
                      rowClassName?.(row.original),
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          ...getCommonPinningStyles({ column: cell.column }),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );

                if (!renderRowContextMenu) {
                  return rowNode;
                }

                return (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>{rowNode}</ContextMenuTrigger>
                    <ContextMenuContent>
                      {renderRowContextMenu(row.original)}
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* ✅ Conditionally render pagination and action bar */}
      {(showPagination || (actionBar && table.getFilteredSelectedRowModel().rows.length > 0)) && (
        <div className="flex flex-col gap-2.5">
          {showPagination && <DataTablePagination table={table} />}
          {actionBar &&
            table.getFilteredSelectedRowModel().rows.length > 0 &&
            actionBar}
        </div>
      )}
    </div>
  );
}

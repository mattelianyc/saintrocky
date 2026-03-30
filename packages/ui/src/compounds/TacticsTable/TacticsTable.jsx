"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";

import { Button } from "../../primitives/Button/Button.jsx";
import { Input } from "../../primitives/Input/Input.jsx";
import { cx } from "../../primitives/_utils/cx.js";

export function TacticsTable({
  columns,
  data,
  className = "",
  emptyMessage = "No results.",
  enableSorting = true,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50],
  filterPlaceholder = "Filter by title\u2026"
}) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const resolvedColumns = useMemo(() => columns || [], [columns]);
  const resolvedData = useMemo(() => data || [], [data]);

  const table = useReactTable({
    data: resolvedData,
    columns: resolvedColumns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString"
  });

  const rows = table.getRowModel().rows;

  return (
    <div className={cx("c-TacticsTable", className)}>
      <div className="c-TacticsTable__toolbar">
        <Input
          className="c-TacticsTable__filterInput"
          placeholder={filterPlaceholder}
          value={globalFilter}
          onChange={(event) => {
            setGlobalFilter(event.target.value);
            setPagination((previous) => ({ ...previous, pageIndex: 0 }));
          }}
        />
        <span className="c-TacticsTable__count">
          {table.getFilteredRowModel().rows.length} rule{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="c-TacticsTable__tableWrap">
        <table className="c-TacticsTable__table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortable = enableSorting && header.column.getCanSort?.();
                  return (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={cx("c-TacticsTable__headerButton", sortable && "is-sortable")}
                          onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                          disabled={!sortable}
                        >
                          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                          {sortable ? (
                            <span className="c-TacticsTable__sort">
                              {header.column.getIsSorted() === "asc" ? "\u2191" : null}
                              {header.column.getIsSorted() === "desc" ? "\u2193" : null}
                            </span>
                          ) : null}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={resolvedColumns.length || 1} className="c-TacticsTable__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="c-TacticsTable__footer">
        <div className="c-TacticsTable__summary">
          Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <div className="c-TacticsTable__controls">
          <Button variant="secondary" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="secondary" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
          <select
            className="c-TacticsTable__pageSize"
            value={pagination.pageSize}
            onChange={(event) =>
              setPagination((previous) => ({ ...previous, pageIndex: 0, pageSize: Number(event.target.value) }))
            }
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

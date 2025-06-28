"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export interface GroupBet {
  id: string;
  title: string;
  status: string;
  amount: number;
  created: string;
}

interface GroupBetsTableProps {
  bets: (GroupBet & { onView?: () => void })[];
}

const PAGE_SIZE = 3;

const columns: ColumnDef<GroupBet & { onView?: () => void }>[] = [
  { accessorKey: "status", header: "Status", cell: info => {
      const value = info.getValue() as string;
      let color = "";
      if (value === "Open") color = "bg-green-100 text-green-700 border-green-200";
      else if (value === "Closed") color = "bg-red-100 text-red-400 border-red-200";
      else if (value === "Pending") color = "bg-yellow-100 text-yellow-700 border-yellow-200";
      return <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>{value}</span>;
    }
  },
  { accessorKey: "title", header: "Bet Name", cell: info => info.getValue() },
  { accessorKey: "amount", header: "Amount", cell: info => `$${info.getValue()}` },
  { accessorKey: "created", header: "Created", cell: info => info.getValue() },
  { id: "actions", header: "Actions", cell: info => (
      <Button asChild={!!info.row.original.onView} size="sm" variant="outline" onClick={info.row.original.onView}>
        {info.row.original.onView ? (
          <span>View</span>
        ) : (
          <a href={`/bets/${info.row.original.id}`}>View</a>
        )}
      </Button>
    )
  },
];

export function GroupBetsTable({ bets }: GroupBetsTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: PAGE_SIZE });

  const table = useReactTable({
    data: bets,
    columns,
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      // Filter by bet name or status
      const v = String(row.getValue("title")).toLowerCase() + String(row.getValue("status")).toLowerCase();
      return v.includes(filterValue.toLowerCase());
    },
    manualPagination: false,
    manualFiltering: false,
    pageCount: Math.ceil(
      bets.filter(row =>
        row.title.toLowerCase().includes(globalFilter.toLowerCase()) ||
        row.status.toLowerCase().includes(globalFilter.toLowerCase())
      ).length / PAGE_SIZE
    ),
  });

  React.useEffect(() => {
    setPagination(p => ({ ...p, pageIndex: 0 }));
  }, [globalFilter]);

  return (
    <>
      <div className="flex items-center justify-between gap-2 pb-2">
        <Input
          placeholder="Filter by bet name or status..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="h-4" />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end gap-1 pt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-2">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}

export interface GroupMember {
  id: string;
  name: string;
  winnings: number;
  role?: string;
}

interface GroupMembersTableProps {
  members: GroupMember[];
}

const memberColumns = [
  { key: "name", header: "Name" },
  { key: "role", header: "Role" },
  { key: "winnings", header: "Winnings" },
];

export function GroupMembersTable({ members }: GroupMembersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {memberColumns.map(col => (
            <TableHead key={col.key}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map(member => (
          <TableRow key={member.id}>
            <TableCell>{member.name}</TableCell>
            <TableCell>{member.role || "Member"}</TableCell>
            <TableCell>${member.winnings}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

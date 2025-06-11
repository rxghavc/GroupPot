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

// Sample data for demonstration
const rows = [
	{ date: "2025-06-01", group: "NBA Finals", bet: "Lakers vs Celtics", wager: 50, payout: 0, status: "Open" },
	{ date: "2025-05-20", group: "Euro Cup", bet: "France vs Spain", wager: 30, payout: 60, status: "Won" },
	{ date: "2025-05-10", group: "Cricket World Cup", bet: "India vs Australia", wager: 40, payout: 0, status: "Lost" },
	{ date: "2025-04-15", group: "Super Bowl", bet: "Chiefs vs 49ers", wager: 100, payout: 200, status: "Won" },
	{ date: "2025-03-10", group: "March Madness", bet: "Duke vs UNC", wager: 25, payout: 0, status: "Lost" },
	{ date: "2025-02-28", group: "Premier League", bet: "Man Utd vs Liverpool", wager: 60, payout: 120, status: "Won" },
	{ date: "2025-01-15", group: "World Series", bet: "Yankees vs Dodgers", wager: 80, payout: 0, status: "Open" },
	{ date: "2024-12-01", group: "UFC", bet: "McGregor vs Poirier", wager: 45, payout: 0, status: "Lost" },
]

const columns: ColumnDef<typeof rows[0]>[] = [
	{ accessorKey: "date", header: "Date", cell: info => info.getValue() },
	{ accessorKey: "group", header: "Group", cell: info => info.getValue() },
	{ accessorKey: "bet", header: "Bet", cell: info => info.getValue() },
	{ accessorKey: "wager", header: "Wager", cell: info => `$${info.getValue()}` },
	{ accessorKey: "payout", header: "Payout", cell: info => info.row.original.payout ? `$${info.row.original.payout}` : "-" },
	{
		accessorKey: "status",
		header: "Status",
		cell: info => {
			const value = info.getValue() as string
			let color = ""
			if (value === "Won") color = "text-green-600 font-semibold"
			else if (value === "Lost") color = "text-red-600 font-semibold"
			else if (value === "Open") color = "text-yellow-600 font-semibold"
			return <span className={color}>{value}</span>
		},
	},
]

const PAGE_SIZE = 4

export function DashboardTable() {
	const [globalFilter, setGlobalFilter] = React.useState("")
	const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: PAGE_SIZE })

	const table = useReactTable({
		data: rows,
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
			// Filter by group, bet, or status
			const v = String(row.getValue("group")).toLowerCase() +
				String(row.getValue("bet")).toLowerCase() +
				String(row.getValue("status")).toLowerCase()
			return v.includes(filterValue.toLowerCase())
		},
		manualPagination: false,
		manualFiltering: false,
		pageCount: Math.ceil(
			rows.filter(row =>
				row.group.toLowerCase().includes(globalFilter.toLowerCase()) ||
				row.bet.toLowerCase().includes(globalFilter.toLowerCase()) ||
				row.status.toLowerCase().includes(globalFilter.toLowerCase())
			).length / PAGE_SIZE
		),
	})

	React.useEffect(() => {
		setPagination(p => ({ ...p, pageIndex: 0 }))
	}, [globalFilter])

	return (
		<>
			<div className="flex items-center justify-between gap-2 pb-2">
				<Input
					placeholder="Filter by group, bet, or status..."
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
	)
}
// Note: Now using @tanstack/react-table for advanced features and improved pagination controls.

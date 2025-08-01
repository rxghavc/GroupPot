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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, TrendingUp, Users } from "lucide-react"

interface BetRow {
  date: string;
  group: string;
  bet: string;
  wager: number;
  payout: number;
  status: string;
}

interface DashboardTableProps {
  data?: BetRow[];
  loading?: boolean;
}

const columns: ColumnDef<BetRow>[] = [
	{ accessorKey: "date", header: "Date", cell: info => info.getValue() },
	{ accessorKey: "group", header: "Group", cell: info => info.getValue() },
	{ accessorKey: "bet", header: "Bet", cell: info => info.getValue() },
	{ accessorKey: "wager", header: "Wager", cell: info => `£${info.getValue()}` },
	{ accessorKey: "payout", header: "Payout", cell: info => info.row.original.payout ? `£${info.row.original.payout}` : "-" },
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

export function DashboardTable({ data = [], loading = false }: DashboardTableProps) {
	const [globalFilter, setGlobalFilter] = React.useState("")
	const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: PAGE_SIZE })

	const table = useReactTable({
		data,
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
			data.filter((row: BetRow) =>
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
					{loading ? (
						<TableRow>
							<TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                Loading your recent bets...
              </TableCell>
						</TableRow>
					) : table.getRowModel().rows.length === 0 ? (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-32">
								{data.length === 0 ? (
									<div className="flex flex-col items-center justify-center text-center py-8 px-4">
										<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-4">
											<TrendingUp className="h-8 w-8 text-green-600" />
										</div>
										<h3 className="text-lg font-semibold mb-2">No bets yet</h3>
										<p className="text-muted-foreground mb-6 max-w-sm">
											Start your betting journey by joining a group and placing your first bet!
										</p>
										<div className="flex flex-col sm:flex-row gap-2">
											<Button asChild size="sm">
												<a href="/groups">
													<Users className="h-4 w-4 mr-2" />
													Browse Groups
												</a>
											</Button>
											<Button asChild variant="outline" size="sm">
												<a href="/bets">View All Bets</a>
											</Button>
										</div>
									</div>
								) : (
									<div className="flex flex-col items-center justify-center text-center py-8 px-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 mb-3">
											<TrendingUp className="h-6 w-6 text-green-600" />
										</div>
										<p className="text-muted-foreground">No results found for your search.</p>
									</div>
								)}
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

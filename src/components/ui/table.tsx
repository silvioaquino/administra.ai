import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      className={cn("w-full caption-bottom border-collapse text-sm", className)}
      ref={ref}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className }, ref) => (
  <thead
    className={cn("bg-gray-50 border-b border-gray-200", className)}
    ref={ref}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className }, ref) => (
  <tbody
    className={cn("[&_tr:last-child]:border-0", className)}
    ref={ref}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className }, ref) => (
  <tfoot
    className={cn(
      "border-t bg-gray-50/50 font-semibold [&_tr]:last:border-0",
      className
    )}
    ref={ref}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className }, ref) => (
  <tr
    className={cn(
      "border-b border-gray-100 transition-colors hover:bg-gray-50/50",
      className
    )}
    ref={ref}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.HTMLAttributes<HTMLTableCellElement>
>(({ className }, ref) => (
  <th
    className={cn(
      "h-10 px-2 py-3 text-left align-middle text-xs font-medium text-gray-500 uppercase tracking-wider",
      className
    )}
    ref={ref}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.HTMLAttributes<HTMLTableCellElement>
>(({ className }, ref) => (
  <td
    className={cn("p-2 align-middle text-sm text-gray-700", className)}
    ref={ref}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className }, ref) => (
  <caption
    className={cn("text-sm text-gray-500 font-medium", className)}
    ref={ref}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
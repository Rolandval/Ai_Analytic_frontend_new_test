import * as React from "react";

import { cn } from "@/lib/utils";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

const Table = React.forwardRef<
  HTMLTableElement,
  TableProps
>(({ className, containerClassName, ...props }, ref) => (
  <div className={cn("w-full overflow-auto rounded-md relative scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent", containerClassName)}>
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm border-collapse", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn(
    "[&_tr]:border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm", 
    className
  )} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted focus-within:bg-muted/70",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

// Helper to extract text from React children for title attribute
function childrenToText(children: React.ReactNode): string {
  if (children == null || children === false) return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join("");
  if (React.isValidElement(children)) return childrenToText(children.props?.children);
  return "";
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  noClamp?: boolean;
  autoHeight?: boolean;
}

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  TableHeadProps
>(({ className, children, title, noClamp, autoHeight, ...props }, ref) => {
  const computedTitle = title ?? childrenToText(children);
  const baseHeader = autoHeight
    ? "px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
    : "h-10 sm:h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0";
  const innerClass = noClamp
    ? "leading-5 break-words"
    : "line-clamp-2 leading-5 max-h-[2.5rem] overflow-hidden break-words";
  return (
    <th
      ref={ref}
      className={cn(baseHeader, className)}
      title={computedTitle || undefined}
      {...props}
    >
      <div className={innerClass}>
        {children}
      </div>
    </th>
  );
});
TableHead.displayName = "TableHead";

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  noWrap?: boolean;
}

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  TableCellProps
>(({ className, noWrap, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "py-3 px-2 sm:p-4 align-middle [&:has([role=checkbox])]:pr-0", 
      noWrap ? "truncate max-w-[250px] whitespace-nowrap" : "break-words",
      className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
}

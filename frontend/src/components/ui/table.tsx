import * as React from 'react';
import { cn } from '../../lib/utils';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerClassName = '', ...props }, ref) => (
    <div className={cn('w-full overflow-hidden bg-surface border border-border rounded-xl shadow-sm', containerClassName)}>
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={cn('w-full text-xs text-left', className)}
          {...props}
        />
      </div>
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'bg-surface-soft text-ink-secondary uppercase text-[10px] tracking-wider border-b border-border font-semibold',
      className
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('divide-y divide-border text-ink-secondary', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('hover:bg-surface-soft/50 transition', className)}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = 'left', ...props }, ref) => {
    const alignmentClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };
    return (
      <td
        ref={ref}
        className={cn('p-4', alignmentClass[align], className)}
        {...props}
      />
    );
  }
);
TableCell.displayName = 'TableCell';

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, align = 'left', ...props }, ref) => {
    const alignmentClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };
    return (
      <th
        ref={ref}
        className={cn('p-4', alignmentClass[align], className)}
        {...props}
      />
    );
  }
);
TableHead.displayName = 'TableHead';

export { Table, TableHeader, TableBody, TableRow, TableCell, TableHead };

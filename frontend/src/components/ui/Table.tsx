import React from 'react';
import { cn } from '@/utils/cn';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}

interface TableHeadCellProps extends TableCellProps {
  sortable?: boolean;
  onSort?: () => void;
  sortDirection?: 'asc' | 'desc' | null;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className={cn('min-w-full divide-y divide-gray-300', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cn('bg-gray-50', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn('divide-y divide-gray-200 bg-white', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr 
      className={cn(
        'hover:bg-gray-50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className, colSpan }: TableCellProps) {
  return (
    <td 
      className={cn(
        'whitespace-nowrap px-6 py-4 text-sm text-gray-900',
        className
      )}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}

export function TableHeadCell({ 
  children, 
  className, 
  colSpan, 
  sortable = false, 
  onSort, 
  sortDirection 
}: TableHeadCellProps) {
  return (
    <th 
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        sortable && 'cursor-pointer hover:bg-gray-100',
        className
      )}
      colSpan={colSpan}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <div className="flex flex-col">
            <svg 
              className={cn(
                'w-3 h-3',
                sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-400'
              )} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
            </svg>
            <svg 
              className={cn(
                'w-3 h-3 -mt-1',
                sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-400'
              )} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        )}
      </div>
    </th>
  );
}

// Empty state component for tables
interface EmptyTableStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyTableState({ title, description, action, icon }: EmptyTableStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={100} className="text-center py-12">
        <div className="flex flex-col items-center">
          {icon && (
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              {icon}
            </div>
          )}
          <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
          {action && <div className="mt-6">{action}</div>}
        </div>
      </TableCell>
    </TableRow>
  );
}
import React from 'react';
import { cn } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { LucideIcon, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import ColorfulIconBox from './ColorfulIconBox';

type ColorVariant = 'primary' | 'success' | 'warning' | 'info' | 'secondary' | 'error';

interface Column<T> {
  key: keyof T | string;
  header: string;
  icon?: LucideIcon;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  description?: string;
  icon?: LucideIcon;
  color?: ColorVariant;
  showRowNumbers?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  getRowColor?: (row: T) => ColorVariant | undefined;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
  maxHeight?: string;
}

const colorBorderClasses: Record<ColorVariant, string> = {
  primary: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
  info: 'border-l-info',
  secondary: 'border-l-secondary',
  error: 'border-l-destructive',
};

const headerGradients: Record<ColorVariant, string> = {
  primary: 'bg-gradient-to-r from-primary/15 via-primary/10 to-transparent',
  success: 'bg-gradient-to-r from-success/15 via-success/10 to-transparent',
  warning: 'bg-gradient-to-r from-warning/15 via-warning/10 to-transparent',
  info: 'bg-gradient-to-r from-info/15 via-info/10 to-transparent',
  secondary: 'bg-gradient-to-r from-secondary/20 via-secondary/10 to-transparent',
  error: 'bg-gradient-to-r from-destructive/15 via-destructive/10 to-transparent',
};

export default function EnhancedTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  description,
  icon,
  color = 'primary',
  showRowNumbers = false,
  striped = true,
  hoverable = true,
  stickyHeader = false,
  emptyMessage = 'No data available',
  onRowClick,
  getRowColor,
  sortColumn,
  sortDirection,
  onSort,
  className,
  maxHeight,
}: EnhancedTableProps<T>) {
  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    
    const isActive = sortColumn === column.key;
    
    if (!isActive) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3 w-3 ml-1" />
      : <ChevronDown className="h-3 w-3 ml-1" />;
  };

  const getValue = (row: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((obj, k) => obj?.[k], row as any);
    }
    return row[key as keyof T];
  };

  return (
    <div className={cn(
      'rounded-xl border border-border/50 overflow-hidden',
      'bg-card/50 backdrop-blur-sm',
      'shadow-sm hover:shadow-md transition-shadow duration-300',
      className
    )}>
      {/* Header section */}
      {(title || description || icon) && (
        <div className={cn(
          'px-6 py-4 border-b border-border/50',
          headerGradients[color]
        )}>
          <div className="flex items-center gap-3">
            {icon && (
              <ColorfulIconBox
                icon={icon}
                color={color}
                size="md"
                variant="gradient"
              />
            )}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table container */}
      <div 
        className={cn(
          'overflow-x-auto',
          maxHeight && 'overflow-y-auto'
        )}
        style={{ maxHeight }}
      >
        <Table>
          <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <TableRow className={cn(
              'bg-muted/50 backdrop-blur-sm',
              'border-b border-border/50'
            )}>
              {showRowNumbers && (
                <TableHead className="w-12 text-center font-semibold">#</TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={cn(
                    'font-semibold text-foreground/90',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer hover:text-primary transition-colors',
                    column.width
                  )}
                  onClick={() => column.sortable && onSort?.(String(column.key))}
                >
                  <span className="flex items-center gap-1">
                    {column.icon && (
                      <column.icon className="h-4 w-4 text-muted-foreground" />
                    )}
                    {column.header}
                    {renderSortIcon(column)}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (showRowNumbers ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <span className="text-2xl">📋</span>
                    </div>
                    {emptyMessage}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const rowColor = getRowColor?.(row);
                
                return (
                  <TableRow
                    key={index}
                    onClick={() => onRowClick?.(row, index)}
                    className={cn(
                      'transition-all duration-200',
                      striped && index % 2 === 1 && 'bg-muted/20',
                      hoverable && 'hover:bg-primary/5 hover:shadow-sm',
                      onRowClick && 'cursor-pointer',
                      rowColor && `border-l-4 ${colorBorderClasses[rowColor]}`,
                      'group'
                    )}
                  >
                    {showRowNumbers && (
                      <TableCell className="w-12 text-center font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.key)}
                        className={cn(
                          'transition-colors',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          'group-hover:text-foreground'
                        )}
                      >
                        {column.render 
                          ? column.render(row, index)
                          : getValue(row, column.key)
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with count */}
      {data.length > 0 && (
        <div className="px-4 py-2 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground">
          Showing {data.length} {data.length === 1 ? 'item' : 'items'}
        </div>
      )}
    </div>
  );
}

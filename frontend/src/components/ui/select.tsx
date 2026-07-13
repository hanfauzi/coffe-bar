import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {label}
          </label>
        )}
        <select
          className={cn(
            'flex w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus transition disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-error focus:ring-error focus:border-error' : '',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-[10px] text-error mt-0.5">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };

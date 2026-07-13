import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-ink placeholder-ink-muted focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus transition file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-error focus:ring-error focus:border-error' : '',
            className
          )}
          ref={ref}
          onWheel={(e) => {
            if (type === 'number') {
              e.currentTarget.blur();
            }
            props.onWheel?.(e);
          }}
          {...props}
        />
        {error && <p className="text-[10px] text-error mt-0.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'flex w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-ink placeholder-ink-muted focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus transition disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-error focus:ring-error focus:border-error' : '',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-[10px] text-error mt-0.5">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface RupiahInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  label?: string;
  error?: string;
}

const RupiahInput = React.forwardRef<HTMLInputElement, RupiahInputProps>(
  ({ className, value, onChange, label, error, ...props }, ref) => {
    const displayValue = value !== null && value !== undefined
      ? 'Rp ' + value.toLocaleString('id-ID', { maximumFractionDigits: 0 })
      : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const digits = rawValue.replace(/\D/g, '');
      const parsedValue = digits ? parseInt(digits, 10) : null;
      onChange(parsedValue);
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            {label}
          </label>
        )}
        <input
          type="text"
          className={cn(
            'flex w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-ink placeholder-ink-muted focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus transition disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-error focus:ring-error focus:border-error' : '',
            className
          )}
          value={displayValue}
          onChange={handleChange}
          ref={ref}
          placeholder="Rp 0"
          {...props}
        />
        {error && <p className="text-[10px] text-error mt-0.5">{error}</p>}
      </div>
    );
  }
);
RupiahInput.displayName = 'RupiahInput';

export { Input, Textarea, RupiahInput };


import { format, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface DatePickerProps {
  date?: string; // YYYY-MM-DD
  setDate: (date: string) => void;
  label?: string;
}

export function DatePicker({ date, setDate, label }: DatePickerProps) {
  const selectedDate = date ? parseISO(date) : undefined

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className={cn(
              "w-full justify-start text-left font-normal text-xs px-3 py-2 h-auto rounded-lg border border-border bg-surface text-ink hover:bg-surface-soft active:scale-100",
              !date && "text-ink-muted"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-ink-secondary" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pilih tanggal</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(day) => {
              if (day) {
                const year = day.getFullYear();
                const month = String(day.getMonth() + 1).padStart(2, '0');
                const dateStr = String(day.getDate()).padStart(2, '0');
                setDate(`${year}-${month}-${dateStr}`);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

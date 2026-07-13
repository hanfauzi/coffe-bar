import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

import { cn } from "../../lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-surface text-ink", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-between pt-1 items-center relative",
        caption_label: "text-sm font-semibold text-ink",
        nav: "flex items-center gap-1",
        button_previous: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition rounded-md border border-border flex items-center justify-center cursor-pointer text-ink hover:bg-surface-soft absolute left-1",
        button_next: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition rounded-md border border-border flex items-center justify-center cursor-pointer text-ink hover:bg-surface-soft absolute right-1",
        weeks: "w-full border-collapse space-y-1",
        week: "flex w-full mt-2",
        weekday: "text-ink-muted rounded-md w-9 font-normal text-[0.8rem] text-center",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-surface-soft rounded-md transition flex items-center justify-center cursor-pointer text-ink",
        selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
        today: "bg-surface-soft font-bold text-primary",
        outside: "text-ink-muted opacity-50",
        disabled: "text-ink-muted opacity-50 cursor-not-allowed",
        range_middle: "aria-selected:bg-surface-soft aria-selected:text-ink",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => orientation === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

import "react-day-picker/dist/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 border rounded-md bg-white shadow-md", className)}
      modifiersClassNames={{
        selected: "rdp-day_selected",
        today: "rdp-day_today"
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar }; 
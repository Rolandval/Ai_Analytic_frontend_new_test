import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { uk } from 'date-fns/locale';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";

interface DatePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  className?: string;
}

export function DatePicker({ date, setDate, className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP', { locale: uk }) : <span>Виберіть дату</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
          initialFocus
          locale={uk}
        />
      </PopoverContent>
    </Popover>
  );
}

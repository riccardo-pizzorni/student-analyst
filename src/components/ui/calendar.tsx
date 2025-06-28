import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker, useNavigation } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/buttonVariants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { addMonths, getMonth, getYear, setMonth, setYear } from 'date-fns';

import type { CaptionProps } from 'react-day-picker';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function CustomCaption({ displayMonth }: CaptionProps) {
  const navigation = useNavigation();
  const goToMonth = navigation?.goToMonth;
  const fromYear = 2000;
  const toYear = 2030;
  const year = getYear(displayMonth);
  const month = getMonth(displayMonth);
  const years = [];
  for (let y = fromYear; y <= toYear; y++) years.push(y);

  return (
    <div className="flex items-center gap-2 w-full justify-center">
      <button
        type="button"
        aria-label="Previous month"
        className="mr-2"
        onClick={() => goToMonth && goToMonth(addMonths(displayMonth, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <Select
        value={String(month)}
        onValueChange={val =>
          goToMonth && goToMonth(setMonth(displayMonth, Number(val)))
        }
      >
        <SelectTrigger className="w-28">
          <SelectValue>{MONTHS[month]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m, idx) => (
            <SelectItem key={m} value={String(idx)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(year)}
        onValueChange={val =>
          goToMonth && goToMonth(setYear(displayMonth, Number(val)))
        }
      >
        <SelectTrigger className="w-20">
          <SelectValue>{year}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        type="button"
        aria-label="Next month"
        className="ml-2"
        onClick={() => goToMonth && goToMonth(addMonths(displayMonth, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Caption: CustomCaption,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };

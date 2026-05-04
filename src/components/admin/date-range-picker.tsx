import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export type DateRange = { from: Date; to: Date };

type Preset = { label: string; days: number };

const PRESETS: Preset[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 365 days', days: 365 },
];

function presetRange(days: number): DateRange {
  const to = new Date();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { from, to };
}

export function rangeForDays(days: number): DateRange {
  return presetRange(days);
}

export function DateRangePicker({
  value,
  onChange,
  align = 'end',
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  align?: 'start' | 'center' | 'end';
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span className="text-sm">
            {format(value.from, 'MMM d, yyyy')} – {format(value.to, 'MMM d, yyyy')}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="p-3 border-b">
          <div className="text-sm font-medium mb-2">Select date range</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.days}
                variant="outline"
                size="sm"
                onClick={() => onChange(presetRange(preset.days))}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Or select custom dates below
          </div>
        </div>
        <Calendar
          mode="range"
          defaultMonth={value.from}
          selected={{ from: value.from, to: value.to }}
          onSelect={(range) => {
            if (range?.from) {
              onChange({
                from: range.from,
                to: range.to ?? range.from,
              });
            }
          }}
          numberOfMonths={2}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

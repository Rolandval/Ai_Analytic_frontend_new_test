'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Badge } from '@/components/ui/Badge';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelect({ options, onValueChange, placeholder, disabled }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    setSelected(newSelected);
    onValueChange(newSelected);
  };

  const handleRemove = (value: string) => {
    const newSelected = selected.filter(item => item !== value);
    setSelected(newSelected);
    onValueChange(newSelected);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto bg-white dark:bg-secondary/20"
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length === 0 && placeholder}
            {selected.length>2 && <Badge variant="secondary">+{selected.length-2}</Badge>}
            {selected.slice(0,2).map(value => options.find(option => option.value === value))
              .map(option => (
                option && (
                  <Badge
                    variant="secondary"
                    key={option.value}
                    className="mr-1 mb-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(option.value);
                    }}
                  >
                    {option.label}
                    <X className="ml-auto h-4 w-4 text-primary" />
                  </Badge>
                )
              ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50 bg-white dark:bg-secondary">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandGroup>
            <CommandList className="max-h-56 overflow-y-auto">
            {options.map(option => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                onClick={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    'ml-auto h-4 w-4 text-primary',
                    selected.includes(option.value) ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

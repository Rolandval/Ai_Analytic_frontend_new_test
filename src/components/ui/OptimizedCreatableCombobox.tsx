import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { FixedSizeList as List } from 'react-window';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/Command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";

interface CreatableComboboxProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  maxHeight?: number;
  itemHeight?: number;
}

// Мемоізований компонент для опції
const OptionItem = React.memo(({ 
  option, 
  isSelected, 
  onSelect,
  style 
}: { 
  option: { label: string; value: string };
  isSelected: boolean;
  onSelect: (value: string) => void;
  style?: React.CSSProperties;
}) => (
  <div
    style={style}
    className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
    onClick={() => onSelect(option.value)}
  >
    <Check
      className={cn(
        "mr-2 h-4 w-4",
        isSelected ? "opacity-100" : "opacity-0"
      )}
    />
    <span className="truncate">{option.label}</span>
  </div>
));

OptionItem.displayName = 'OptionItem';

export const OptimizedCreatableCombobox = React.memo(({
  options,
  value,
  onChange,
  placeholder = "Select or create...",
  searchPlaceholder = "Search or type to create...",
  emptyMessage = "No results found.",
  className,
  disabled = false,
  maxHeight = 200,
  itemHeight = 35,
}: CreatableComboboxProps) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = React.useCallback((selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setInputValue("");
  }, [onChange]);

  // Мемоізація вибраної опції
  const selectedOptionLabel = React.useMemo(() =>
    options.find((option) => option.value === value)?.label || value,
    [options, value]
  );

  // Мемоізація відфільтрованих опцій
  const filteredOptions = React.useMemo(() => 
    options
      .filter(Boolean)
      .filter(
        (option) =>
          option.label &&
          option.label.toLowerCase().includes(inputValue.toLowerCase())
      ),
    [options, inputValue]
  );

  // Мемоізація показу опції створення
  const showCreateOption = React.useMemo(() =>
    inputValue &&
    !options.filter(Boolean).some(
      (o) => o.label && o.label.toLowerCase() === inputValue.toLowerCase()
    ),
    [inputValue, options]
  );

  // Віртуалізований рендер опцій
  const VirtualizedOptions = React.useCallback(({ height }: { height: number }) => {
    const allOptions = showCreateOption 
      ? [{ label: `Create "${inputValue}"`, value: inputValue }, ...filteredOptions]
      : filteredOptions;

    if (allOptions.length === 0) {
      return (
        <div className="py-6 text-center text-sm">{emptyMessage}</div>
      );
    }

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const option = allOptions[index];
      const isSelected = value === option.value;
      const isCreateOption = index === 0 && showCreateOption;
      
      return (
        <div style={style}>
          <OptionItem
            option={option}
            isSelected={isSelected}
            onSelect={handleSelect}
          />
        </div>
      );
    };

    return (
      <List
        height={Math.min(height, allOptions.length * itemHeight)}
        itemCount={allOptions.length}
        itemSize={itemHeight}
        className="scrollbar-thin scrollbar-thumb-gray-300"
      >
        {Row}
      </List>
    );
  }, [filteredOptions, showCreateOption, inputValue, value, handleSelect, emptyMessage, itemHeight]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
        >
          <span className="truncate">{selectedOptionLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" 
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-sm">{emptyMessage}</div>
            </CommandEmpty>
            <CommandGroup>
              <VirtualizedOptions height={maxHeight} />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

OptimizedCreatableCombobox.displayName = 'OptimizedCreatableCombobox';

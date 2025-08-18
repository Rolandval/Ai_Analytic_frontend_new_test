"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
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
}

export function CreatableCombobox({
  options,
  value,
  onChange,
  placeholder = "Select or create...",
  searchPlaceholder = "Search or type to create...",
  emptyMessage = "No results found.",
  className,
  disabled = false,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setInputValue("");
  };

  const selectedOptionLabel =
    options.find((option) => option.value === value)?.label || value;

  const filteredOptions = options
    .filter(Boolean)
    .filter(
      (option) =>
        option.label &&
        option.label.toLowerCase().includes(inputValue.toLowerCase())
    );

  const showCreateOption =
    inputValue &&
    !options.filter(Boolean).some(
      (o) => o.label && o.label.toLowerCase() === inputValue.toLowerCase()
    );

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
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onPointerDownOutside={(e) => e.preventDefault()}>
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
              {showCreateOption && (
                <CommandItem
                  key={inputValue}
                  value={inputValue}
                  onSelect={() => handleSelect(inputValue)}
                >
                  <span className="mr-2 h-4 w-4" />
                  Create "{inputValue}"
                </CommandItem>
              )}
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(val) => handleSelect(val) }
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

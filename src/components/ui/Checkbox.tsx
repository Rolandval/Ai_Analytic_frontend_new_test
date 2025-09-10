import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

type Size = 'xs' | 'sm' | 'md' | 'lg';
type Shape = 'square' | 'circle';

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  size?: Size;
  shape?: Shape;
}

const sizeClass: Record<Size, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const iconSizeClass: Record<Size, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, size = 'sm', shape = 'square', ...props }, ref) => {
  const isIndeterminate = props.checked === 'indeterminate';
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        // base (idle)
        "peer shrink-0 border border-gray-400 dark:border-neutral-600 bg-white dark:bg-neutral-900/60 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 hover:shadow",
        // ACTIVE states per theme
        // Light theme: active = black bg, white icon, black border + ring
        "data-[state=checked]:bg-black data-[state=checked]:text-white data-[state=checked]:border-black data-[state=checked]:ring-2 data-[state=checked]:ring-black/40",
        "data-[state=indeterminate]:bg-black data-[state=indeterminate]:text-white data-[state=indeterminate]:border-black data-[state=indeterminate]:ring-2 data-[state=indeterminate]:ring-black/40",
        // Dark theme: active = white bg, black icon, white border + ring
        "dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black dark:data-[state=checked]:border-white dark:data-[state=checked]:ring-2 dark:data-[state=checked]:ring-white/40",
        "dark:data-[state=indeterminate]:bg-white dark:data-[state=indeterminate]:text-black dark:data-[state=indeterminate]:border-white dark:data-[state=indeterminate]:ring-2 dark:data-[state=indeterminate]:ring-white/40",
        // size & shape
        sizeClass[size],
        shape === 'circle' ? 'rounded-full' : 'rounded-sm',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center")}
      >
        {isIndeterminate ? (
          <Minus className={cn(iconSizeClass[size])} />
        ) : (
          <Check className={cn(iconSizeClass[size])} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };

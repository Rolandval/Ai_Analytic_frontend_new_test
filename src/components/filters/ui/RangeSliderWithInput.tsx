import { useState, useRef } from "react";
import { Slider } from "@/components/ui/Slider";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

interface Props {
  min: number;
  max: number;
  step: number;
  values: [number | undefined, number | undefined];
  onChange: (vals: [number | undefined, number | undefined]) => void;
  format?: (v: number) => string;
  formatInput?: (v: number) => string;
  suffix?: string;
  className?: string;
}

export function RangeSliderWithInput({
  min,
  max,
  step,
  values: [vmin, vmax],
  onChange,
  format = (v) => String(v),
  formatInput = (v) => String(v),
  suffix = "",
  className,
}: Props) {
  const [internal, setInternal] = useState<[number, number]>([
    vmin ?? min,
    vmax ?? max,
  ]);
  
  const [minInputValue, setMinInputValue] = useState<string>(
    vmin !== undefined ? formatInput(vmin) : ""
  );
  
  const [maxInputValue, setMaxInputValue] = useState<string>(
    vmax !== undefined ? formatInput(vmax) : ""
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<[number, number]>([
    ((vmin ?? min) - min) / (max - min),
    ((vmax ?? max) - min) / (max - min),
  ]);

  const handleChange = (vals: number[]) => {
    const [newMin, newMax] = vals as [number, number];
    setInternal([newMin, newMax]);
    setMinInputValue(formatInput(newMin));
    setMaxInputValue(formatInput(newMax));
    setPositions([ (newMin-min)/(max-min), (newMax-min)/(max-min) ] as [number, number]);
  };
  
  const commit = (vals: number[]) => {
    const [a, b] = vals;
    onChange([
      a === min && b === max ? undefined : a,
      a === min && b === max ? undefined : b,
    ] as [number | undefined, number | undefined]);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinInputValue(value);
    
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= min && numericValue <= internal[1]) {
      const newValues: [number, number] = [numericValue, internal[1]];
      setInternal(newValues);
      setPositions([ (numericValue-min)/(max-min), positions[1] ] as [number, number]);
      onChange([
        numericValue === min && internal[1] === max ? undefined : numericValue,
        internal[1] === max ? undefined : internal[1],
      ] as [number | undefined, number | undefined]);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxInputValue(value);
    
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue <= max && numericValue >= internal[0]) {
      const newValues: [number, number] = [internal[0], numericValue];
      setInternal(newValues);
      setPositions([ positions[0], (numericValue-min)/(max-min) ] as [number, number]);
      onChange([
        internal[0] === min ? undefined : internal[0],
        numericValue === max ? undefined : numericValue,
      ] as [number | undefined, number | undefined]);
    }
  };

  const handleMinInputBlur = () => {
    const numericValue = parseFloat(minInputValue);
    if (isNaN(numericValue) || numericValue < min) {
      setMinInputValue(formatInput(internal[0]));
    } else if (numericValue > internal[1]) {
      const newValue = internal[1];
      setMinInputValue(formatInput(newValue));
      setInternal([newValue, internal[1]]);
      setPositions([ (newValue-min)/(max-min), positions[1] ] as [number, number]);
    }
  };

  const handleMaxInputBlur = () => {
    const numericValue = parseFloat(maxInputValue);
    if (isNaN(numericValue) || numericValue > max) {
      setMaxInputValue(formatInput(internal[1]));
    } else if (numericValue < internal[0]) {
      const newValue = internal[0];
      setMaxInputValue(formatInput(newValue));
      setInternal([internal[0], newValue]);
      setPositions([ positions[0], (newValue-min)/(max-min) ] as [number, number]);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-between">
        <Input 
          className="w-20 h-8 text-xs"
          value={minInputValue}
          onChange={handleMinInputChange}
          onBlur={handleMinInputBlur}
        />
        <Input 
          className="w-20 h-8 text-xs"
          value={maxInputValue}
          onChange={handleMaxInputChange}
          onBlur={handleMaxInputBlur}
        />
      </div>
      {/* bubbles */}
      <div className="relative h-6 mb-1">
        <span
          className="absolute -translate-x-1/2 -top-1 text-[10px] rounded bg-background px-1 border border-border shadow"
          style={{ left: `${positions[0] * 100}%` }}
        >
          {format(internal[0])}
        </span>
        <span
          className="absolute -translate-x-1/2 -top-1 text-[10px] rounded bg-background px-1 border border-border shadow"
          style={{ left: `${positions[1] * 100}%` }}
        >
          {format(internal[1])}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        defaultValue={internal}
        value={internal}
        onValueChange={handleChange}
        onValueCommit={commit}
        className="w-full"
      />
    </div>
  );
}

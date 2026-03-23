import { useState } from "react";
import { Slider } from "@/components/ui/Slider";
import { cn } from "@/lib/utils";

interface Props {
  min: number;
  max: number;
  step: number;
  values: [number | undefined, number | undefined];
  onChange: (vals: [number | undefined, number | undefined]) => void;
  format?: (v: number) => string;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  step,
  values: [vmin, vmax],
  onChange,
  format = (v) => String(v),
  className,
}: Props) {
  const [internal, setInternal] = useState<[number, number]>([
    vmin ?? min,
    vmax ?? max,
  ]);

  const [positions, setPositions] = useState<[number, number]>([
    ((vmin ?? min) - min) / (max - min),
    ((vmax ?? max) - min) / (max - min),
  ]);

  const handleChange = (vals: number[]) => {
    setInternal([vals[0], vals[1]] as [number, number]);
    setPositions([ (vals[0]-min)/(max-min), (vals[1]-min)/(max-min) ] as [number, number]);
  };
  const commit = (vals: number[]) => {
    const [a, b] = vals;
    onChange([
      a === min && b === max ? undefined : a,
      a === min && b === max ? undefined : b,
    ] as [number | undefined, number | undefined]);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
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

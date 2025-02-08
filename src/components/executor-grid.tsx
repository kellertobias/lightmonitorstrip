"use client";

import clsx from "clsx";

interface ExecutorGridProps {
  startNumber: number;
}

export function ExecutorGrid({ startNumber }: ExecutorGridProps) {
  return (
    <div className="grid grid-cols-5 grid-rows-4 gap-2 w-full h-full">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className={clsx(
            "border-2 border-orange-500 rounded-md",
            "flex flex-col items-center justify-center text-center",
            "font-mono text-sm p-2 pt-5 relative"
          )}
        >
          <div className="text-xs opacity-25 absolute top-1 left-1 right-1">
            Exec. {startNumber + i}
          </div>
          <div className="">Washers RED</div>
        </div>
      ))}
    </div>
  );
}

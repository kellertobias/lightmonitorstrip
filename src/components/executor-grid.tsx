"use client";

interface ExecutorGridProps {
  startNumber: number;
}

export function ExecutorGrid({ startNumber }: ExecutorGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2 w-full">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="aspect-square border-2 border-orange-500 rounded-md flex items-center justify-center text-orange-500 font-mono"
        >
          Exec. {startNumber + i}
        </div>
      ))}
    </div>
  );
}

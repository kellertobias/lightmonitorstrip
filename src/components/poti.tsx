"use client";

interface PotentiometerDisplayProps {
  label: string;
  value?: number;
}

export function PotentiometerDisplay({
  label,
  value = 0,
}: PotentiometerDisplayProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-orange-500 text-sm mb-1">{label}</div>
      <div className="w-4 h-20 bg-gray-800 rounded-full relative overflow-hidden">
        {/* Gap at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black" />

        {/* Value indicator */}
        <div
          className="absolute bottom-2 left-0 right-0 bg-orange-500"
          style={{
            height: `${value}%`,
            transition: "height 0.2s ease-out",
            boxShadow: "0 0 5px #f97316",
          }}
        />
      </div>
    </div>
  );
}

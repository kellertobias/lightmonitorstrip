"use client";

import { MeasurementDisplay } from "@/components/spl-meter";
import { ExecutorGrid } from "@/components/executor-grid";
import { ConnectionStatus } from "@/components/status";
import { PotentiometerDisplay } from "@/components/poti";

export default function Home() {
  return (
    <main className="bg-black w-[1480px] h-[380px] overflow-hidden relative">
      {/* Left Section - 1/5 width */}
      <div className="absolute left-0 top-0 w-[296px] h-full border-r border-orange-500">
        <MeasurementDisplay />
      </div>

      {/* Right Section - 4/5 width */}
      <div className="absolute left-[296px] top-0 w-[1184px] h-full">
        {/* Top Bar with Potentiometers */}
        <div className="h-12 relative">
          <div className="absolute right-4 top-2 flex gap-4">
            <PotentiometerDisplay label="Pot 1" />
            <PotentiometerDisplay label="Pot 2" />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <ConnectionStatus />
          </div>
        </div>

        {/* Executor Grids */}
        <div className="flex gap-4 px-4">
          <ExecutorGrid startNumber={1} />
          <ExecutorGrid startNumber={21} />
        </div>
      </div>
    </main>
  );
}

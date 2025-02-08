"use client";

import React from "react";

import { SPLMeter } from "@/components/spl-meter";
import { ExecutorGrid } from "@/components/executor-grid";
import { ConnectionStatus } from "@/components/status";
import { PotentiometerDisplay } from "@/components/poti";
import clsx from "clsx";
import { Clock } from "@/components/clock";

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen">
      <main
        className={clsx(
          "w-[1480px] h-[380px]",
          "outline outline-gray-900",
          "bg-black  overflow-hidden relative",
          "grid grid-cols-7"
        )}
      >
        <div className="col-span-2 grid grid-rows-12 h-full">
          <div className="row-span-1"></div>
          <div className="row-span-3">
            <Clock />
          </div>
          <div className="row-span-8">
            <SPLMeter />
          </div>
        </div>

        {/* Right Section - 4/5 width */}
        <div className="col-span-5 h-full">
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
    </div>
  );
}

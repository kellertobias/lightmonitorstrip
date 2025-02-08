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
          "w-[1480px] h-[340px]",
          "outline outline-gray-900",
          "bg-black  overflow-hidden relative",
          "grid grid-cols-7"
        )}
      >
        <div className="col-span-2 grid grid-rows-13 h-[380px]">
          <div className="row-span-2 flex justify-center items-center pt-3">
            <ConnectionStatus />
          </div>
          <div className="row-span-3">
            <Clock />
          </div>
          <div className="row-span-7">
            <SPLMeter />
          </div>
        </div>

        {/* Right Section - 4/5 width */}
        <div className="col-span-5 h-[380px]">
          {/* Executor Grids */}
          <div className="grid grid-cols-2 grid-rows-1 h-full py-6 gap-6 px-4">
            <ExecutorGrid startNumber={1} />
            <ExecutorGrid startNumber={21} />
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import clsx from "clsx";
import { useCallback, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface WSMessage {
  type: string;
  data: {
    names?: string[];
    active?: number[];
  };
}

interface ExecutorGridProps {
  startNumber: number;
}

export function ExecutorGrid({ startNumber }: ExecutorGridProps) {
  const [active, setActive] = useState<boolean[]>(
    Array.from({ length: 20 }, () => false)
  );

  const [names, setNames] = useState<string[]>([]);

  const handleMessage = useCallback((message: WSMessage) => {
    if (message.type === "exec") {
      if (message.data.active) {
        const newActive = Array.from({ length: 20 }, () => false);
        for (const active of message.data.active) {
          newActive[active - startNumber] = true;
        }
        setActive(newActive);
      }
      if (message.data.names) {
        setNames(message.data.names);
      }
    }
  }, []);
  useWebSocket(handleMessage, []);

  return (
    <div className="grid grid-cols-5 grid-rows-4 gap-2 w-full h-full">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className={clsx(
            "border-2  rounded-md",
            "flex flex-col items-center justify-center text-center",
            "font-mono font-semibold text-sm p-2 pt-4 relative",
            {
              "bg-[#0000FF]/50 border-[#0000FF]": active[i],
              "bg-[#0000FF]/15 border-[#0000FF]/70": !active[i],
            }
          )}
        >
          <div className="text-xs text-gray-500 absolute top-0.5 left-1">
            {startNumber + i}
          </div>
          {names[i] ? (
            <div className="text-white">{names[i]}</div>
          ) : (
            <div className="text-gray-500">
              {startNumber + i}
              <br />
              <span className="text-[0.7rem]">(Empty)</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Executor {
  number: number;
  name: string;
  type: "toggle" | "flash" | "fader" | "other";
  color: string | null;
  dotColor: string | null;
}

interface WSMessage {
  type: string;
  data: {
    executors?: Record<number, Executor>;
    showName?: string;
  };
}

const btnBaseClasses =
  "border-2 rounded-md flex flex-col items-center justify-center text-center font-mono font-semibold text-sm p-2 px-4 relative transition-colors duration-200";

const darkenColor = (color: string, amount: number) => {
  // Handle both 3 and 6 digit hex codes
  const fullColor =
    color.length === 3
      ? color
          .split("")
          .map((c) => c + c)
          .join("")
      : color;

  return fullColor.replace(/(.{2})/g, (hex) => {
    const value = Math.floor(parseInt(hex, 16) * amount);
    return value.toString(16).padStart(2, "0");
  });
};

function ExecutorButton({
  execNumber,
  executor,
  value,
}: {
  execNumber: number;
  executor: Executor;
  value: number;
}) {
  const isActive = value > 0;

  const bgActive = executor?.color
    ? `#${darkenColor(executor.color, 0.4)}`
    : executor
    ? "#333333"
    : "#030303";
  const bgDefault = executor?.color
    ? `#${darkenColor(executor.color, 0.25)}`
    : executor
    ? "#111111"
    : "#000000";
  const borderActive = executor?.color
    ? `#${executor.color}`
    : executor
    ? "#888888"
    : "#222222";
  const borderDefault = executor?.color
    ? `#${darkenColor(executor.color, 0.8)}`
    : executor
    ? "#383838"
    : "#111111";

  return (
    <div
      className={clsx(btnBaseClasses, "pt-4")}
      style={{
        backgroundColor: isActive ? bgActive : bgDefault,
        borderColor: isActive ? borderActive : borderDefault,
      }}
    >
      <div className="text-[0.6rem] text-gray-500 absolute top-0 left-1">
        {execNumber}
      </div>
      <div
        className="text-[0.6rem] text-white absolute top-1 left-1 right-1 bottom-1 flex items-center justify-center"
        style={{ lineHeight: 1.1 }}
      >
        {executor?.name}
      </div>
      {executor?.dotColor && (
        <div
          className="h-1 rounded-full absolute bottom-1 right-6 left-6"
          style={{ backgroundColor: `#${executor.dotColor}` }}
        ></div>
      )}
    </div>
  );
}

function ExecutorPoti({
  execNumber,
  executor,
  value,
}: {
  execNumber: number;
  executor: Executor;
  value: number;
}) {
  return (
    <div className={clsx("h-full relative flex flex-row gap-4 items-center")}>
      <div className="text-[0.6rem] font-semibold text-white">
        {executor?.name}
      </div>
      {/* Circular progress indicator with bottom opening */}
      <div className="relative w-8 h-8">
        {/* Background circle (gray stroke, open at bottom) */}
        <svg className="absolute inset-0" viewBox="0 0 36 36">
          <path
            d="M18 2
              a 16 16 0 0 1 0 32
              a 16 16 0 0 1 0 -32"
            fill="none"
            stroke="#666666"
            strokeWidth="4"
            strokeDasharray="85 15" // Creates gap at bottom
            strokeLinecap="round"
          />
          {/* Progress arc that fills based on value */}
          <path
            d="M18 2
              a 16 16 0 0 1 0 32
              a 16 16 0 0 1 0 -32"
            fill="none"
            stroke="#ffffff"
            strokeWidth="4"
            strokeDasharray={`${value * 85} 100`} // Scales fill with value
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

export function ExecutorGrid() {
  const [active, setActive] = useState<Record<number, number>>({});
  const [executors, setExecutors] = useState<Record<number, Executor>>([]);
  const [showName, setShowName] = useState("<Unknown Show>");
  const [reloading, setReloading] = useState(false);

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case "show-setup":
        console.log(message.data);
        setShowName(message.data.showName || "<Unknown Show>");
        setExecutors(message.data.executors || []);
        setReloading(false);
        break;
    }
  }, []);

  const { sendMessage } = useWebSocket(handleMessage, []);

  return (
    <div className="flex flex-col gap-4 h-full px-4 py-6">
      <div className="flex flex-row justify-between items-center h-[40px]">
        <div className="flex flex-row gap-4 items-center justify-start">
          <button
            className={clsx(btnBaseClasses, "border-gray-600 text-gray-300")}
            onClick={() => {
              setReloading(true);
              sendMessage({ type: "reload-executors" });
            }}
          >
            {reloading ? "Reloading..." : "Reload"}
          </button>
          <span className="text-gray-300 font-mono text-sm">
            Current Show: {showName}
          </span>
        </div>
        <div className="flex flex-row gap-4 items-center justify-end h-full">
          <ExecutorPoti
            execNumber={41}
            executor={executors[41]}
            value={active[41] || 0}
          />
          <ExecutorPoti
            execNumber={42}
            executor={executors[42]}
            value={active[42] || 0}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 grid-rows-1 grow gap-6">
        {[0, 5].map((offset) => (
          <div
            key={`column-${offset}`}
            className="grid grid-cols-5 grid-rows-4 gap-2 w-full h-full"
          >
            {Array.from({ length: 20 }, (_, i) => {
              const execNumber = i + offset + Math.floor(i / 5) * 5 + 1;
              const value = active[execNumber] || 0;
              const executor = executors[execNumber];

              return (
                <ExecutorButton
                  key={`executor-${execNumber}`}
                  execNumber={execNumber}
                  executor={executor}
                  value={value}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

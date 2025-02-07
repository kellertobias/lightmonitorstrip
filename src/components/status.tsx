"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";

export function ConnectionStatus() {
  const { status, disconnectedSince } = useWebSocket();
  const [disconnectionTime, setDisconnectionTime] = useState<string>("");

  useEffect(() => {
    if (status === "disconnected" && disconnectedSince) {
      const updateTimer = () => {
        const seconds = Math.floor((Date.now() - disconnectedSince) / 1000);
        if (seconds >= 3) {
          setDisconnectionTime(`${seconds}s`);
        } else {
          setDisconnectionTime("");
        }
      };

      const timer = setInterval(updateTimer, 1000);
      updateTimer(); // Initial update
      return () => clearInterval(timer);
    } else {
      setDisconnectionTime("");
    }
  }, [status, disconnectedSince]);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          status === "connected"
            ? "bg-green-500 shadow-[0_0_5px_#22c55e]"
            : "bg-red-500 shadow-[0_0_5px_#ef4444]"
        }`}
      />
      <span className="text-white text-sm">
        {status === "connected" ? "Connected" : "Disconnected"}
        {disconnectionTime && ` (${disconnectionTime})`}
      </span>
    </div>
  );
}

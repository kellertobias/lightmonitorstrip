"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-white font-mono">
      {/* Time Display */}
      <svg
        viewBox="0 0 400 100"
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Time Display */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          className="font-bold tracking-wider"
          fontSize="48"
          fill="currentColor"
        >
          {formatTime(time)}
        </text>

        {/* Date Display */}
        <text
          x="50%"
          y="80%"
          textAnchor="middle"
          className="text-gray-400"
          fontSize="16"
          fill="currentColor"
        >
          {formatDate(time)}
        </text>
      </svg>
    </div>
  );
}

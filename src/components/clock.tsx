"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", {
      //   weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="px-6 w-full h-full flex flex-row items-center justify-center text-white font-mono">
      <div className="grow">
        <svg
          viewBox="0 0 260 38"
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Time Display */}
          <text
            x="50%"
            y="95%"
            textAnchor="middle"
            className="font-bold tracking-wider"
            fontSize="48"
            fill="currentColor"
          >
            {formatTime(time)}
          </text>
        </svg>
      </div>
      <div className="pl-2 text-gray-500">
        {time.toLocaleDateString("en-US", {
          weekday: "long",
        })}
        <br />
        {time.toLocaleDateString("de-DE", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface MeasurementData {
  measured: number;
  timestamp: string;
  mode: string;
  freqMode: string;
  range: string;
}

interface WSMessage {
  type: string;
  data: MeasurementData;
}

export function MeasurementDisplay() {
  const [time, setTime] = useState(new Date());
  const [measurements, setMeasurements] = useState<number[]>([]);
  const [averageMeasurement, setAverageMeasurement] = useState<number>(0);

  const handleMessage = useCallback((message: WSMessage) => {
    if (message.type === "childProcess") {
      const measurement = message.data.measured;
      setMeasurements((prev) => {
        const newMeasurements = [...prev, measurement].slice(-100); // Keep last 100 measurements

        // Calculate 5-second average (100 measurements = 5 seconds at 20Hz)
        const average =
          newMeasurements.reduce((a, b) => a + b, 0) / newMeasurements.length;
        setAverageMeasurement(Number(average.toFixed(1)));

        return newMeasurements;
      });
    }
  }, []);

  useWebSocket(handleMessage, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get color based on dBA value
  const getColor = useCallback((value: number) => {
    if (value < 60) return "text-green-500";
    if (value < 85) return "text-yellow-500";
    return "text-red-500";
  }, []);

  // Calculate bar height percentage
  const getBarHeight = useCallback((value: number) => {
    const min = 30;
    const max = 130;
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }, []);

  return (
    <div className="p-4 text-white">
      {/* Clock */}
      <div className="text-4xl font-mono mb-8 text-center">
        {time.toLocaleTimeString()}
      </div>

      {/* Measurement Display */}
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-6xl font-bold mb-2">
            <span className={getColor(averageMeasurement)}>
              {averageMeasurement}
            </span>
            <span className="text-2xl ml-2">dBA</span>
          </div>
          <div className="text-gray-400">5s Average</div>
        </div>

        {/* Bar Graph */}
        <div className="h-32 bg-gray-900 rounded-lg relative overflow-hidden">
          {measurements.slice(-50).map((value, index) => (
            <div
              key={index}
              className="absolute bottom-0 bg-orange-500 w-1.5 opacity-50"
              style={{
                height: `${getBarHeight(value)}%`,
                left: `${index * 3}px`,
                transition: "height 150ms ease-out",
              }}
            />
          ))}
          {/* Current value bar */}
          <div
            className="absolute bottom-0 right-0 w-2 bg-orange-500"
            style={{
              height: `${getBarHeight(
                measurements[measurements.length - 1] || 0
              )}%`,
              transition: "height 150ms ease-out",
            }}
          />
        </div>

        {/* Range Display */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>30 dBA</span>
          <span>130 dBA</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { SPLGraph } from "./spl-graph";

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

// Get color based on dBA value
const getColor = (value: number) => {
  if (value < 80) return "text-green-500";
  if (value < 93) return "text-yellow-500";
  return "text-red-500";
};

const amountMeasurements = 200;

export function SPLMeter() {
  const measurementRef = useRef<number>(0);
  const measurementAverageArrayRef = useRef<number[]>([]);

  const [measurements, setMeasurements] = useState<number[]>([]);
  const [peak, setPeak] = useState<number>(0);

  const handleMessage = useCallback((message: WSMessage) => {
    if (message.type === "childProcess") {
      const measurement = message.data.measured;
      measurementRef.current = measurement;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      measurementAverageArrayRef.current = [
        ...measurementAverageArrayRef.current,
        measurementRef.current,
      ].slice(-amountMeasurements);

      setMeasurements([...measurementAverageArrayRef.current]);
    }, 50);

    const peakInterval = setInterval(() => {
      setPeak(Math.max(...measurementAverageArrayRef.current));
    }, 250);

    return () => {
      clearInterval(interval);
      clearInterval(peakInterval);
    };
  }, []);

  useWebSocket(handleMessage, []);

  return (
    <div className="p-4 text-white">
      {/* Measurement Display */}
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-6xl font-bold mb-2 font-mono">
            <span className={getColor(peak)}>{Number(peak).toFixed(1)}</span>
            <span className="text-2xl ml-2">dBA</span>
          </div>
          <div className="text-gray-400">5s Average</div>
        </div>

        {/* Graph */}
        <div className="h-24">
          <SPLGraph data={measurements} maxPoints={amountMeasurements} />
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

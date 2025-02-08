"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getColor, SPLBar, SPLGraph } from "./spl-graph";

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

const amountMeasurements = 200;

export function SPLMeter() {
  const measurementRef = useRef<number>(0);
  const measurementAverageArrayRef = useRef<number[]>([]);

  const [measurements, setMeasurements] = useState<number[]>([]);
  const [peak, setPeak] = useState<number>(0);
  const [current, setCurrent] = useState<number>(0);

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
      setCurrent(measurementRef.current);
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
          <div className="h-2 w-full px-10">
            <div className="h-2 bg-gray-700 rounded-full">
              <SPLBar value={current} />
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="flex justify-stretch gap-2 pt-4">
          <div className="h-24 grow relative">
            <SPLGraph data={measurements} maxPoints={amountMeasurements} />
            <div
              className="absolute 
            top-0 bottom-0 right-0
            p-1.5
            flex flex-col justify-between text-xs text-gray-400"
            >
              <span>130 dBA</span>
              <span>30 dBA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

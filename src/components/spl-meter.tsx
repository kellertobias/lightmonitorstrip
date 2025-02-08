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
    }, 100);

    const currentInterval = setInterval(() => {
      setCurrent(measurementRef.current);
    }, 50);

    const peakInterval = setInterval(() => {
      setPeak(Math.max(...measurementAverageArrayRef.current));
    }, 250);

    return () => {
      clearInterval(interval);
      clearInterval(peakInterval);
      clearInterval(currentInterval);
    };
  }, []);

  useWebSocket(handleMessage, []);

  return (
    <div className="p-6 pt-0 text-white">
      {/* Measurement Display */}
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-5xl font-bold mb-2 font-mono flex flex-row items-center justify-center px-10">
            <span className={getColor(peak)}>{Number(peak).toFixed(1)}</span>
            <div className="flex flex-col items-start justify-start px-4">
              <span className="text-xl mb-1">dBA</span>
              <div className="h-1 w-full">
                <div className="h-1 bg-gray-700 rounded-full">
                  <SPLBar value={current} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="flex justify-stretch gap-2 pt-0">
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

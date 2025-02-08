"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getColor, SPLBar, SPLGraph } from "./spl-graph";
import clsx from "clsx";

const range = [55, 110];

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

const amountMeasurements = 400;

export function SPLMeter() {
  const measurementRef = useRef<number>(0);
  const measurementAverageArrayRef = useRef<number[]>([]);

  const [measurements, setMeasurements] = useState<number[]>([]);
  const [peak, setPeak] = useState<number>(0);
  const [current, setCurrent] = useState<number>(0);
  const [freqMode, setFreqMode] = useState<string>("dBA");

  const handleMessage = useCallback((message: WSMessage) => {
    if (message.type === "spl") {
      const measurement = message.data.measured;
      measurementRef.current = measurement;
      setFreqMode(message.data.freqMode);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      measurementAverageArrayRef.current = [
        ...measurementAverageArrayRef.current,
        measurementRef.current,
      ].slice(-amountMeasurements);

      setMeasurements([...measurementAverageArrayRef.current]);
    }, 60);

    const currentInterval = setInterval(() => {
      const average =
        measurementAverageArrayRef.current.reduce((sum, val) => sum + val, 0) /
        measurementAverageArrayRef.current.length;
      setCurrent(average);
    }, 300);

    const peakInterval = setInterval(() => {
      // Calculate peak over last 1 second (20 measurements)
      const recentMeasurements = measurementAverageArrayRef.current.slice(-20);
      setPeak(Math.max(...recentMeasurements));
    }, 50);

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
          <div className="text-5xl font-bold mb-2 font-mono flex flex-row items-center justify-center px-4">
            <div className={clsx(getColor(current), "text-5xl w-40")}>
              {Number(current).toFixed(1)}
            </div>
            <div className="flex flex-col items-start justify-start pl-4 -mt-5 w-40 font-sans">
              <div>
                <span className="text-lg mb-1">{freqMode}</span>{" "}
                <span className="font-light font-sans text-gray-400 text-xs mb-1">
                  (Avg / Peak)
                </span>
              </div>
              <div className="h-1 w-full">
                <div className="h-1 bg-gray-700 rounded-full">
                  <SPLBar
                    value={peak}
                    minValue={range[0]}
                    maxValue={range[1]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graph */}
        <div className="flex justify-stretch gap-2 pt-0">
          <div className="h-24 grow relative">
            <SPLGraph
              data={measurements}
              maxPoints={amountMeasurements}
              minValue={range[0]}
              maxValue={range[1]}
            />
            <div
              className="absolute 
            top-0 bottom-0 right-0
            p-1.5
            flex flex-col justify-between text-xs text-gray-400"
            >
              <span>
                {range[1]} {freqMode}
              </span>
              <span>
                {range[0]} {freqMode}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

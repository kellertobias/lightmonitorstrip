/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * Main page component that handles WebSocket communication and data display
 */
import { useEffect, useState } from "react";

interface Message {
  type: "childProcess" | "polling" | "connection";
  data?: any;
  status?: string;
}

export default function Home() {
  const [childProcessData, setChildProcessData] = useState<any>(null);
  const [pollingData, setPollingData] = useState<any>(null);
  const [wsStatus, setWsStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setWsStatus("connected");
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setWsStatus("disconnected");
      // Attempt to reconnect after 1 second
      setTimeout(() => {
        setWsStatus("connecting");
      }, 1000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);
        switch (message.type) {
          case "connection":
            console.log("Connection status:", message.status);
            break;
          case "childProcess":
            setChildProcessData(message.data);
            break;
          case "polling":
            setPollingData(message.data);
            break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">WebSocket Status</h2>
          <div
            className={`
                        inline-block px-3 py-1 rounded-full
                        ${
                          wsStatus === "connected"
                            ? "bg-green-500 text-white"
                            : wsStatus === "connecting"
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                        }
                    `}
          >
            {wsStatus}
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Child Process Data</h2>
          <pre className="bg-white p-4 rounded overflow-auto max-h-60">
            {childProcessData
              ? JSON.stringify(childProcessData, null, 2)
              : "No data"}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Polling Data</h2>
          <pre className="bg-white p-4 rounded overflow-auto max-h-60">
            {pollingData ? JSON.stringify(pollingData, null, 2) : "No data"}
          </pre>
        </div>
      </div>
    </main>
  );
}

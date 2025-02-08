import { WebSocketServer, WebSocket } from "ws";
import { ChildProcess } from "./services/child-process";
import { Polling } from "./services/polling";
import { existsSync } from "fs";

const WS_PORT = Number(process.env.WS_PORT || 3001);

class WebSocketService {
  private wss: WebSocketServer;
  private childProcess: ChildProcess;
  private polling: Polling;

  constructor() {
    // Initialize WebSocket server on its own port
    this.wss = new WebSocketServer({ port: WS_PORT });

    // Initialize services
    this.childProcess = new ChildProcess();
    this.polling = new Polling();

    // Setup WebSocket connection handling
    this.wss.on("connection", (ws) => {
      console.log("Client connected to WebSocket");

      // Send initial connection success message
      ws.send(JSON.stringify({ type: "connection", status: "connected" }));

      // Handle client disconnection
      ws.on("close", () => {
        console.log("Client disconnected from WebSocket");
      });

      // Handle connection errors
      ws.on("error", (error) => {
        console.error("WebSocket connection error:", error);
      });
    });

    // Broadcast child process data
    this.childProcess.on("data", (data) => {
      this.broadcast({ type: "childProcess", data });
    });

    // Broadcast polling data
    this.polling.on("change", (data) => {
      this.broadcast({ type: "polling", data });
    });

    // Start services
    // check if the executable /home/keller/repos/gm1356/splread exists.
    // if so, start the child process. Otherwise start the mock process.
    if (existsSync("/home/keller/repos/gm1356/splread")) {
      this.childProcess.start("npx", ["tsx", "src/mock/mockMeasurement.ts"]);
    } else {
      this.childProcess.start("npx", ["tsx", "src/mock/mockMeasurement.ts"]);
    }
    // this.polling.start();

    console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
  }

  private broadcast(data: any): void {
    const message = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error("Error sending message to client:", error);
        }
      }
    });
  }

  public stop(): void {
    this.childProcess.stop();
    this.polling.stop();
    this.wss.close();
  }
}

// Handle process termination
const wsService = new WebSocketService();
process.on("SIGINT", () => wsService.stop());
process.on("SIGTERM", () => wsService.stop());

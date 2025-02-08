import { WebSocketServer, WebSocket } from "ws";
import { ChildProcess } from "./services/child-process";
import { Polling } from "./services/polling";
import { existsSync } from "fs";

const WS_PORT = Number(process.env.WS_PORT || 3001);

class WebSocketService {
  private wss: WebSocketServer;
  private childProcess: ChildProcess;
  private polling: Polling;
  private isShuttingDown = false;

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
      if (!this.isShuttingDown) {
        this.broadcast({ type: "spl", data });
      }
    });

    // Broadcast polling data
    this.polling.on("change", (data) => {
      if (!this.isShuttingDown) {
        this.broadcast({ type: "polling", data });
      }
    });

    // Start services
    // check if the executable /home/keller/repos/gm1356/splread exists.
    // if so, start the child process. Otherwise start the mock process.
    if (existsSync("/home/keller/repos/gm1356/splread")) {
      this.childProcess.start("/home/keller/repos/gm1356/splread", [
        "-i 50",
        "-f",
      ]);
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

  public async stop(): Promise<void> {
    console.log("Shutting down WebSocket service...");
    this.isShuttingDown = true;

    // Close all client connections first
    for (const client of this.wss.clients) {
      try {
        client.close();
      } catch (error) {
        console.error("Error closing client connection:", error);
      }
    }

    // Stop child process and polling
    await Promise.all([this.childProcess.stop(), this.polling.stop()]);

    // Close the WebSocket server
    await new Promise<void>((resolve, reject) => {
      this.wss.close((err) => {
        if (err) {
          console.error("Error closing WebSocket server:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log("WebSocket service shutdown complete");
  }
}

// Handle process termination
const wsService = new WebSocketService();

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  try {
    await wsService.stop();
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

// Handle different termination signals
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGQUIT", () => shutdown("SIGQUIT"));

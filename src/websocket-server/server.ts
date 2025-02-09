import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { ChildProcess } from "./services/child-process";
import { MagicQHttpService } from "./services/magicq-http";
import { MagicQOscService } from "./services/magicq-osc";
import { OSCMidiService } from "./services/osc-midi";
import { existsSync } from "fs";

dotenv.config();

const WS_PORT = Number(process.env.WS_PORT || 3001);
const MAGICQ_IP = process.env.MAGICQ_IP || "localhost";
const MAGICQ_HTTP_PORT = Number(process.env.MAGICQ_HTTP_PORT || 8080);
const MAGICQ_OSC_RECEIVE_PORT = Number(
  process.env.MAGICQ_OSC_RECEIVE_PORT || 8000
);
const MAGICQ_OSC_SEND_PORT = Number(process.env.MAGICQ_OSC_SEND_PORT || 9000);

class WebSocketService {
  private wss: WebSocketServer;
  private childProcess: ChildProcess;
  private magicq: MagicQHttpService;
  private magicqOsc: MagicQOscService;
  private isShuttingDown = false;

  constructor() {
    // Initialize WebSocket server on its own port
    this.wss = new WebSocketServer({ port: WS_PORT });

    // Initialize services
    this.childProcess = new ChildProcess();
    this.magicq = new MagicQHttpService(
      `http://${MAGICQ_IP}:${MAGICQ_HTTP_PORT}`
    );
    this.magicqOsc = new MagicQOscService({
      receivePort: MAGICQ_OSC_RECEIVE_PORT,
      sendPort: MAGICQ_OSC_SEND_PORT,
      address: MAGICQ_IP,
    });

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

      // Handle incoming messages
      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString());

          switch (message.type) {
            case "reload-executors":
              // Fetch names from MagicQ and broadcast to clients
              const magicqData = await this.magicq.fetchData();
              this.broadcast({
                type: "show-setup",
                data: magicqData,
              });

              break;

            case "exec":
              // Forward OSC messages to MagicQ
              try {
                if (message.address && message.value !== undefined) {
                  await this.magicqOsc.sendExecutorCommand(
                    message.address,
                    message.value
                  );
                }
              } catch (error) {
                console.error("Error sending OSC message:", error);
                ws.send(
                  JSON.stringify({
                    type: "error",
                    error: "Failed to send OSC message",
                  })
                );
              }
              break;

            default:
              console.warn("Unknown message type:", message.type);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });
    });

    // Broadcast child process data
    this.childProcess.on("data", (data) => {
      if (!this.isShuttingDown) {
        this.broadcast({ type: "spl", data });
      }
    });

    // Start services
    if (existsSync("/home/keller/repos/gm1356/splread")) {
      this.childProcess.start("/home/keller/repos/gm1356/splread", [
        "-i 50",
        "-f",
      ]);
    } else {
      // this.childProcess.start("npx", ["tsx", "src/mock/mockMeasurement.ts"]);
    }

    this.magicqOsc.start();

    console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
  }

  private handleExecutorUpdate(executors: Record<number, number>): void {
    if (!this.isShuttingDown) {
      this.broadcast({
        type: "executor-update",
        data: executors,
      });
    }
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

    // Stop all services
    await Promise.all([this.childProcess.stop(), this.magicqOsc.stop()]);

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

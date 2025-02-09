import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { ChildProcess } from "./services/child-process";
import { MagicQHttpService } from "./services/magicq-http";
import { MagicQOscService } from "./services/magicq-osc";
import { MidiService } from "./services/midi";
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
  private midi: MidiService;

  private isShuttingDown = false;

  private state: Record<
    number,
    { type: "toggle" | "flash" | "fader" | "other"; value: number }
  > = {};

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
    this.midi = new MidiService();

    this.magicqOsc.on("osc", (data) => {
      this.state[data.exec] = {
        type: data.type,
        value: data.value,
      };

      this.broadcast({
        type: "val",
        data: {
          number: data.exec,
          value: data.value,
        },
      });
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
              if ("executors" in magicqData) {
                for (const exec of Object.values(magicqData.executors)) {
                  this.state[exec.number] = {
                    type: exec.number > 40 ? "fader" : exec.type,
                    value: this.state[exec.number]?.value || 0,
                  };
                }

                console.log("State", this.state);
              }

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

    this.midi.start();
    this.midi.on("midi", (data) => {
      const exec = data.exec;
      const type = this.state[exec]?.type || exec > 40 ? "fader" : "toggle";
      this.state[exec] = this.state[exec] || {
        type,
        value: 0,
      };
      const lastValue = this.state[exec].value;
      let value = 0;
      if (type === "fader") {
        value = Math.min(data.value / 127, 0.9999);
      } else if (type === "toggle" && data.value > 0) {
        value = lastValue === 0 ? 1 : 0;
      } else if (type === "toggle") {
        return; // ignore note off for toggle
      } else if (type === "flash" || type === "other") {
        value = data.value > 0 ? 1 : 0;
      }

      this.state[exec].value = value;
      this.magicqOsc.sendExecutorCommand(exec, value);
      this.broadcast({
        type: "val",
        data: {
          number: exec,
          value,
        },
      });
    });

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

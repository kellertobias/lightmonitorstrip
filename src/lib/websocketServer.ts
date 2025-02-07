/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * WebSocket server module for handling real-time communication
 */
import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";

class WSServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;

  constructor(server: Server) {
    this.clients = new Set();
    this.wss = new WebSocketServer({
      server,
      path: "/ws", // Explicit WebSocket endpoint
    });

    // Handle connection
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("New WebSocket connection established");
      this.clients.add(ws);

      // Handle client disconnection
      ws.on("close", () => {
        console.log("Client disconnected");
        this.clients.delete(ws);
      });

      // Handle connection errors
      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(ws);
      });

      // Send initial connection success message
      ws.send(JSON.stringify({ type: "connection", status: "connected" }));
    });

    // Handle server errors
    this.wss.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });
  }

  /**
   * Broadcasts a message to all connected clients
   * @param data - The data to broadcast
   */
  broadcast(data: any): void {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error("Error sending message to client:", error);
          this.clients.delete(client);
        }
      }
    });
  }
}

export default WSServer;

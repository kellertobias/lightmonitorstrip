/**
 * Custom Next.js server with integrated WebSocket support
 */
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import WSServer from "./lib/websocketServer";
import ChildProcessService from "./lib/childProcessService";
import PollingService from "./lib/pollingService";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // Initialize WebSocket server
  const wsServer = new WSServer(server);

  // Initialize child process service
  const childProcess = new ChildProcessService();
  childProcess.on("data", (data) => {
    wsServer.broadcast({ type: "childProcess", data });
  });
  childProcess.on("error", (error) => {
    console.error("Child process error:", error);
  });

  // Initialize polling service (100ms interval for 10 times per second)
  const pollingService = new PollingService({
    url: process.env.POLLING_URL || "http://localhost:3001/api/data",
    interval: 100,
  });
  pollingService.on("change", (data) => {
    wsServer.broadcast({ type: "polling", data });
  });
  pollingService.on("error", (error) => {
    console.error("Polling error:", error);
  });

  // Start the services
  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);

    // Start the child process with our mock measurement process using npx
    childProcess.start("npx", ["tsx", "src/mock/mockMeasurement.ts"]);

    // Start polling
    pollingService.start();
  });

  // Handle server shutdown
  const cleanup = () => {
    childProcess.stop();
    pollingService.stop();
    server.close();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
});

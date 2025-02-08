import { spawn, ChildProcess as CP } from "child_process";
import { EventEmitter } from "events";

export class ChildProcess extends EventEmitter {
  private process: CP | null = null;
  private buffer: string = "";
  private command: string = "";
  private args: string[] = [];

  // Restart tracking
  private restartAttempts: number[] = [];
  private readonly maxRestarts = 5;
  private readonly restartWindow = 60 * 1000; // 1 minute in ms
  private readonly backoffTime = 5 * 60 * 1000; // 5 minutes in ms
  private backoffTimeout: NodeJS.Timeout | null = null;

  start(command: string, args: string[] = []): void {
    this.command = command;
    this.args = args;
    this.startProcess();
  }

  private startProcess(): void {
    // Check if we're in backoff period
    if (this.backoffTimeout) {
      return;
    }

    // Clean up old restart attempts outside the window
    const now = Date.now();
    this.restartAttempts = this.restartAttempts.filter(
      (time) => now - time < this.restartWindow
    );

    // Check if we've hit the restart limit
    if (this.restartAttempts.length >= this.maxRestarts) {
      console.warn("Too many restart attempts, backing off for 5 minutes");
      this.backoffTimeout = setTimeout(() => {
        this.backoffTimeout = null;
        this.restartAttempts = [];
        this.startProcess();
      }, this.backoffTime);
      return;
    }

    // Start the process
    this.process = spawn(this.command, this.args);

    // Track restart attempt
    this.restartAttempts.push(now);

    this.process.stdout?.on("data", (data: Buffer) => {
      this.handleData(data.toString());
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      console.log("child process stderr", data.toString());
    });

    this.process.on("error", (error: Error) => {
      this.handleProcessExit();
    });

    this.process.on("exit", (code: number | null) => {
      console.warn(`Child process exited with code ${code}`);
      this.handleProcessExit();
    });
  }

  private handleProcessExit(): void {
    this.process = null;
    // Attempt restart with a small delay to prevent rapid cycling
    setTimeout(() => this.startProcess(), 10000);
  }

  private handleData(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split("\n");

    // Keep the last incomplete line in the buffer
    this.buffer = lines.pop() || "";

    // Process complete lines
    for (const line of lines) {
      if (line.trim()) {
        try {
          const jsonData = JSON.parse(line);
          this.emit("data", jsonData);
        } catch (error) {
          console.error("Invalid JSON:", error, line);
        }
      }
    }
  }

  stop(): void {
    if (this.backoffTimeout) {
      clearTimeout(this.backoffTimeout);
      this.backoffTimeout = null;
    }
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.restartAttempts = [];
  }
}

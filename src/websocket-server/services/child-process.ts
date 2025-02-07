import { spawn, ChildProcess as CP } from "child_process";
import { EventEmitter } from "events";

export class ChildProcess extends EventEmitter {
  private process: CP | null = null;
  private buffer: string = "";

  start(command: string, args: string[] = []): void {
    this.process = spawn(command, args);

    this.process.stdout?.on("data", (data: Buffer) => {
      this.handleData(data.toString());
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      this.emit("error", new Error(data.toString()));
    });

    this.process.on("error", (error: Error) => {
      this.emit("error", error);
    });
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
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

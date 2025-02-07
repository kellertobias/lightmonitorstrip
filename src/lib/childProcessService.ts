/**
 * Service for managing child process execution and JSON line processing
 */
import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";

class ChildProcessService extends EventEmitter {
  private process: ChildProcess | null = null;
  private buffer: string = "";

  /**
   * Starts the child process with the given command and arguments
   * @param command - The command to execute
   * @param args - Arguments for the command
   */
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

  /**
   * Handles incoming data from the child process
   * @param chunk - Raw data chunk from the process
   */
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
        } catch {
          this.emit("error", new Error(`Invalid JSON: ${line}`));
        }
      }
    }
  }

  /**
   * Stops the child process
   */
  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

export default ChildProcessService;

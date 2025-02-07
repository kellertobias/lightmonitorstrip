import { EventEmitter } from "events";

interface PollingOptions {
  url: string;
  interval: number;
  compareFunction?: (oldData: unknown, newData: unknown) => boolean;
}

export class Polling extends EventEmitter {
  private url: string;
  private interval: number;
  private intervalId: NodeJS.Timeout | null = null;
  private lastData: unknown = null;
  private compareFunction: (oldData: unknown, newData: unknown) => boolean;

  constructor(
    options: PollingOptions = {
      url: process.env.POLLING_URL || "http://localhost:3001/api/data",
      interval: 100,
    }
  ) {
    super();
    this.url = options.url;
    this.interval = options.interval;
    this.compareFunction = options.compareFunction || this.defaultCompare;
  }

  private defaultCompare(oldData: unknown, newData: unknown): boolean {
    return JSON.stringify(oldData) !== JSON.stringify(newData);
  }

  start(): void {
    this.poll(); // Initial poll
    this.intervalId = setInterval(() => this.poll(), this.interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const response = await fetch(this.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (this.lastData === null || this.compareFunction(this.lastData, data)) {
        this.emit("change", data);
      }
      this.lastData = data;
    } catch (error) {
      this.emit(
        "error",
        error instanceof Error ? error : new Error("Unknown error occurred")
      );
    }
  }
}

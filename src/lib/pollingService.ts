/**
 * Service for polling HTTP endpoints and detecting changes
 */
import { EventEmitter } from "events";

interface PollingServiceOptions {
  url: string;
  interval: number;
  compareFunction?: (oldData: unknown, newData: unknown) => boolean;
}

class PollingService extends EventEmitter {
  private url: string;
  private interval: number;
  private intervalId: NodeJS.Timeout | null = null;
  private lastData: unknown = null;
  private compareFunction: (oldData: unknown, newData: unknown) => boolean;

  /**
   * Creates a new polling service instance
   * @param options - Configuration options for the polling service
   */
  constructor(options: PollingServiceOptions) {
    super();
    this.url = options.url;
    this.interval = options.interval;
    this.compareFunction = options.compareFunction || this.defaultCompare;
  }

  /**
   * Default comparison function for detecting changes
   */
  private defaultCompare(oldData: unknown, newData: unknown): boolean {
    return JSON.stringify(oldData) !== JSON.stringify(newData);
  }

  /**
   * Starts polling the configured endpoint
   */
  start(): void {
    this.poll(); // Initial poll
    this.intervalId = setInterval(() => this.poll(), this.interval);
  }

  /**
   * Stops the polling process
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Performs a single poll operation
   */
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
    } catch {
      // this.emit(
      //   "error",
      //   error instanceof Error ? error : new Error("Unknown error occurred")
      // );
    }
  }
}

export default PollingService;

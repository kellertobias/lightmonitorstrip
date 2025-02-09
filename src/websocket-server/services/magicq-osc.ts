import { EventEmitter } from "events";
import OSC from "osc-js";

/**
 * Service for handling OSC and MIDI communications
 * Includes special handling for MagicQ executor commands
 */
export class MagicQOscService extends EventEmitter {
  private feedbackInterval: NodeJS.Timeout | null = null;
  private currentExecutors: Record<number, number> = {};
  private onExecutorUpdate?: (executors: Record<number, number>) => void;

  private osc: OSC;

  constructor(
    private connection: {
      receivePort: number;
      sendPort: number;
      address: string;
    }
  ) {
    super();

    this.osc = new OSC({
      plugin: new OSC.DatagramPlugin({
        type: "udp4",
      }),
    });

    this.osc.on("message", this.handleOSCMessage.bind(this));
  }

  /**
   * Starts the OSC server and feedback interval
   */
  public start(): void {
    // Start OSC server
    this.osc.open({
      host: "0.0.0.0",
      port: this.connection.receivePort,
    });
    console.log(`OSC server started on ${this.connection.receivePort}`);

    // Start feedback interval
    this.startFeedbackInterval();
  }

  /**
   * Stops the OSC server and cleans up resources
   */
  public stop(): void {
    // Stop feedback interval
    if (this.feedbackInterval) {
      clearInterval(this.feedbackInterval);
      this.feedbackInterval = null;
    }

    // Close OSC connection
    this.osc.close();
  }

  public sendOSC(path: string, value: number | string): void {
    const message = new OSC.Message(path, value);
    this.osc.send(message, {
      host: this.connection.address,
      port: this.connection.sendPort,
    });
  }

  /**
   * Sends an executor command to MagicQ
   * @param address OSC address (e.g., "/exec/1/5")
   * @param value Float value between 0 and 1
   */
  public async sendExecutorCommand(
    address: string,
    value: number
  ): Promise<void> {
    try {
      console.log("Sending executor command:", address, value);
      // Validate value range
      const normalizedValue = Math.max(0, Math.min(1, value));

      // Send OSC message
      const message = new OSC.Message(address, normalizedValue);
      await this.osc.send(message);

      // Update internal state if it's an executor command
      const match = address.match(/^\/exec\/1\/(\d+)$/);
      if (match) {
        const executorNumber = parseInt(match[1], 10);
        this.updateExecutorState(executorNumber, normalizedValue);
      }
    } catch (error) {
      console.error("Error sending executor command:", error);
      throw new Error("Failed to send executor command");
    }
  }

  /**
   * Starts the interval to send feedback requests to MagicQ
   */
  private startFeedbackInterval(): void {
    // Clear any existing interval
    if (this.feedbackInterval) {
      clearInterval(this.feedbackInterval);
    }

    // Send feedback request every minute
    this.feedbackInterval = setInterval(() => {
      try {
        const message = new OSC.Message("/feedback/exec");
        this.osc.send(message);
      } catch (error) {
        console.error("Error sending feedback request:", error);
      }
    }, 60000); // 1 minute

    const message = new OSC.Message("/feedback/exec");
    this.osc.send(message);
  }

  /**
   * Handles incoming OSC messages
   */
  private handleOSCMessage(message: OSC.Message): void {
    try {
      console.log("Received OSC message:", message.args);
      // Check if it's an executor update
      const match = message.address.match(/^\/exec\/1\/(\d+)$/);
      if (match && message.args.length > 0) {
        const executorNumber = parseInt(match[1], 10);
        const value = message.args[0] as number;
        this.updateExecutorState(executorNumber, value);
      }

      // Emit the OSC message for other handlers
      this.emit("osc", {
        address: message.address,
        args: message.args,
      });
    } catch (error) {
      console.error("Error handling OSC message:", error);
    }
  }

  /**
   * Updates the internal state of executors and notifies listeners
   */
  private updateExecutorState(executorNumber: number, value: number): void {
    // Update internal state
    this.currentExecutors[executorNumber] = value;

    // Notify listeners
    if (this.onExecutorUpdate) {
      this.onExecutorUpdate(this.currentExecutors);
    }
  }
}

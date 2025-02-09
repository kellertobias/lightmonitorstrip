import { EventEmitter } from "events";
import OSC from "osc-js";
import { getExecutorNumber, makeExecutorNumber } from "./helpers";

/**
 * Service for handling OSC and MIDI communications
 * Includes special handling for MagicQ executor commands
 */
export class MagicQOscService extends EventEmitter {
  private feedbackInterval: NodeJS.Timeout | null = null;
  private osc: OSC;

  constructor(
    private connection: {
      receivePort: number;
      receiveAddress: string;
      sendPort: number;
      sendAddress: string;
    }
  ) {
    super();

    this.osc = new OSC({
      plugin: new OSC.DatagramPlugin({
        type: "udp4",
      }),
    });

    this.osc.on("open", () => {
      console.log(
        `(open) OSC server started on ${this.connection.receivePort}`
      );
    });
  }

  /**
   * Starts the OSC server and feedback interval
   */
  public start(): void {
    // Start OSC server
    this.osc.open({
      host: this.connection.receiveAddress,
      port: this.connection.receivePort,
    });
    console.log(`OSC server started on ${this.connection.receivePort}`);
    this.osc.on("*", this.handleOSCMessage.bind(this));

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
    const message = new OSC.Message(path, Number(value) * 1.0);
    message.types = "f";
    console.log("Sending OSC message:", message);
    this.osc.send(message, {
      host: this.connection.sendAddress,
      port: this.connection.sendPort,
    });
  }

  /**
   * Sends an executor command to MagicQ
   * @param address OSC address (e.g., "/exec/1/5")
   * @param value Float value between 0 and 1
   */
  public async sendExecutorCommand(
    exec: number,
    value: number
  ): Promise<number> {
    const execNumber = makeExecutorNumber(exec);
    try {
      // Validate value range
      const normalizedValue = Math.max(0, Math.min(1, value));
      const address = `/exec/1/${execNumber}`;

      this.sendOSC(address, normalizedValue);
    } catch (error) {
      console.error("Error sending executor command:", error);
    }
    return execNumber;
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
        console.log("Sending feedback request");
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
      console.log("Received OSC message:", message);

      // Check if it's an executor update
      const match = message.address.match(/^\/exec\/1\/(\d+)$/);
      if (match && message.args.length > 0) {
        const executorNumber = getExecutorNumber(parseInt(match[1], 10));
        const value = message.args[0] as number;

        this.emit("osc", {
          exec: executorNumber,
          value,
        });
      }

      // Emit the OSC message for other handlers
    } catch (error) {
      console.error("Error handling OSC message:", error);
    }
  }
}

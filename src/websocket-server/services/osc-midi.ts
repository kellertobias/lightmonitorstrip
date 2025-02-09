import { EventEmitter } from "events";
import OSC from "osc-js";
import midi from "midi";

// Type declaration for MIDI message handler
type MIDIMessageHandler = (deltaTime: number, message: number[]) => void;

interface OSCMidiOptions {
  oscPort?: number;
  oscHost?: string;
  midiInput?: string;
  onExecutorUpdate?: (executors: Record<number, number>) => void;
}

interface MIDIMessage {
  deltaTime: number;
  message: number[];
}

interface OSCMessage {
  address: string;
  args: any[];
}

/**
 * Service for handling OSC and MIDI communications
 * Includes special handling for MagicQ executor commands
 */
export class OSCMidiService extends EventEmitter {
  private osc: OSC;
  private midiInput: any;
  private isConnected: boolean = false;
  private feedbackInterval: NodeJS.Timeout | null = null;
  private currentExecutors: Record<number, number> = {};
  private onExecutorUpdate?: (executors: Record<number, number>) => void;

  constructor(options: OSCMidiOptions = {}) {
    super();

    // Store callback
    this.onExecutorUpdate = options.onExecutorUpdate;

    // Initialize OSC
    this.osc = new OSC({
      plugin: new OSC.WebsocketServerPlugin({
        port: options.oscPort || 8000,
      }),
    });

    // Initialize MIDI input
    this.midiInput = new midi.Input();
    if (options.midiInput) {
      this.setupMIDI(options.midiInput);
    }

    // Set up OSC message handling
    this.osc.on("*", this.handleOSCMessage.bind(this));
  }

  /**
   * Starts the OSC server and feedback interval
   */
  public start(): void {
    // Start OSC server
    this.osc.open();
    console.log("OSC server started");

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

    // Close MIDI input
    if (this.isConnected) {
      this.midiInput.closePort();
      this.isConnected = false;
    }
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
  }

  /**
   * Handles incoming OSC messages
   */
  private handleOSCMessage(message: OSC.Message): void {
    try {
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

  private setupMIDI(inputName: string): void {
    // List available MIDI inputs
    const portCount = this.midiInput.getPortCount();
    let selectedPort = -1;

    console.log("Available MIDI inputs:");
    for (let i = 0; i < portCount; i++) {
      const portName = this.midiInput.getPortName(i);
      console.log(`[${i}] ${portName}`);
      if (portName.includes(inputName)) {
        selectedPort = i;
      }
    }

    if (selectedPort === -1) {
      console.warn(`MIDI input "${inputName}" not found`);
      return;
    }

    // Setup MIDI message handling
    this.midiInput.on("message", (deltaTime: number, message: number[]) => {
      this.handleMIDIMessage(deltaTime, message);
    });

    // Open the selected port
    try {
      this.midiInput.openPort(selectedPort);
      console.log(`Connected to MIDI input: ${inputName}`);
      this.isConnected = true;
    } catch (error) {
      console.error("Failed to open MIDI port:", error);
    }
  }

  private handleMIDIMessage(deltaTime: number, message: number[]): void {
    // Extract MIDI message components
    const [status, data1, data2] = message;
    const command = status >> 4;
    const channel = status & 0xf;

    // Convert MIDI message to OSC
    switch (command) {
      case 0x9: // Note On
        this.sendOSC("/midi/noteon", [channel, data1, data2]);
        break;
      case 0x8: // Note Off
        this.sendOSC("/midi/noteoff", [channel, data1, data2]);
        break;
      case 0xb: // Control Change
        this.sendOSC("/midi/cc", [channel, data1, data2]);
        break;
    }

    // Emit the MIDI message for other parts of the application
    this.emit("midi", { deltaTime, message });
  }

  private sendOSC(address: string, args: any[]): void {
    try {
      const message = new OSC.Message(address, ...args);
      this.osc.send(message);
    } catch (error) {
      console.error("Failed to send OSC message:", error);
    }
  }
}

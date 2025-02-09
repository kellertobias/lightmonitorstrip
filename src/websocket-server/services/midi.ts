import { EventEmitter } from "events";
import midi from "midi";

/**
 * Service for handling OSC and MIDI communications
 * Includes special handling for MagicQ executor commands
 */
export class MidiService extends EventEmitter {
  private midiInput: any;
  private isConnected: boolean = false;

  constructor() {
    super();

    // Initialize MIDI input
    this.midiInput = new midi.Input();
    this.setupMIDI("Arduino Leonardo");
  }

  /**
   * Starts the OSC server and feedback interval
   */
  public start(): void {}

  /**
   * Stops the OSC server and cleans up resources
   */
  public stop(): void {
    // Close MIDI input
    if (this.isConnected) {
      this.midiInput.closePort();
      this.isConnected = false;
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

    let exec = data1 - 48;
    if (exec < 20) {
      exec = (exec % 5) + Math.floor(exec / 5) * 10 + 1;
    } else if (exec < 40) {
      exec = (exec % 5) + Math.floor((exec - 20) / 5) * 10 + 6;
    } else {
      exec = exec + 1;
    }

    // Convert MIDI message to OSC
    switch (command) {
      case 0x9: // Note On
        this.emit("midi", { exec, value: data2 });
        break;
      case 0x8: // Note Off
        this.emit("midi", { exec, value: 0 });
        break;
      case 0xb: // Control Change
        break;
    }

    // Emit the MIDI message for other parts of the application
    this.emit("midi", { deltaTime, message });
  }
}

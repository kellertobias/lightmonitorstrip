declare module "midi" {
  class Input {
    getPortCount(): number;
    getPortName(port: number): string;
    openPort(port: number): void;
    closePort(): void;
    on(
      event: "message",
      callback: (deltaTime: number, message: number[]) => void
    ): void;
  }

  class Output {
    getPortCount(): number;
    getPortName(port: number): string;
    openPort(port: number): void;
    closePort(): void;
    sendMessage(message: number[]): void;
  }

  export = {
    Input,
    Output,
  };
}

import { JSDOM } from "jsdom";

interface MagicQData {
  showName: string | null;
  executors: Record<
    number,
    {
      number: number;
      name: string;
      type: "toggle" | "flash" | "fader" | "other";
      color: string | null;
      dotColor: string | null;
    }
  >;
}

/**
 * Service for interacting with MagicQ's web interface
 */
export class MagicQHttpService {
  constructor(private baseUrl: string = "http://localhost:8080") {}

  /**
   * Fetches show name and executor data from MagicQ
   */
  public async fetchData(): Promise<MagicQData | { error: string }> {
    try {
      // Fetch both pages in parallel
      const [showName, executors] = await Promise.all([
        this.fetchShowName(),
        this.fetchExecutors(),
      ]);

      return {
        showName,
        executors,
      };
    } catch (error) {
      console.error("Error fetching MagicQ data:", error);
      return { error: "Failed to fetch MagicQ data" };
    }
  }

  /**
   * Fetches the current show name from MagicQ's main page
   */
  private async fetchShowName(): Promise<string | null> {
    try {
      console.log(`Fetching show name from ${this.baseUrl}`);
      const response = await fetch(`${this.baseUrl}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html);

      // Find show name in tables
      const tables = dom.window.document.querySelectorAll("table");
      for (const table of tables) {
        const rows = table.querySelectorAll("tr");
        for (const row of rows) {
          const cells = row.querySelectorAll("td");
          for (let i = 0; i < cells.length - 1; i++) {
            if (cells[i].textContent?.trim() === "Show" && cells[i + 1]) {
              const showNameCell = cells[i + 1].textContent?.trim() || null;
              const showName =
                showNameCell?.split("MagicQ/show/").pop() ||
                showNameCell?.split("/home/keller/").pop() ||
                showNameCell;
              return showName;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching show name:", error);
      return null;
    }
  }

  /**
   * Fetches executor information from MagicQ's execute page
   */
  private async fetchExecutors(): Promise<
    Record<
      number,
      {
        number: number;
        name: string;
        type: "toggle" | "flash" | "fader" | "other";
        color: string | null;
        dotColor: string | null;
      }
    >
  > {
    console.log(`Fetching executors from ${this.baseUrl}`);
    try {
      const response = await fetch(`${this.baseUrl}/exec.html`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html);

      const executors: Record<
        number,
        {
          number: number;
          name: string;
          type: "toggle" | "flash" | "fader" | "other";
          color: string | null;
          dotColor: string | null;
        }
      > = {};
      const items = dom.window.document.querySelectorAll("input");

      items.forEach((row) => {
        const index = Number(row.name);
        const value = row.value;

        // the executor buttons each take two rows.
        // so executor 1 has the index 1 and 11, 2 and 12, 21 and 31, etc.
        const execColNumber = index % 20 > 10 ? (index % 20) - 10 : index % 20;
        const execRowNumber = Math.floor(index / 20);
        const execNumber = execColNumber + execRowNumber * 10;

        if (isNaN(execNumber)) {
          console.log(`Invalid executor number: ${execNumber}`);
          return;
        }

        executors[execNumber] = executors[execNumber] || {};

        // the first row is the name, the second row has configuration options
        if (index % 20 < 10) {
          executors[execNumber].name = value;
          executors[execNumber].number = execNumber;
        } else {
          const parts = value.split(",");
          executors[execNumber].color = parts[0];
          executors[execNumber].dotColor =
            parts[2]?.toLowerCase() === "x" ? null : parts[2] || null;
          switch (parts[1]) {
            case "T":
              executors[execNumber].type = "toggle";
              break;
            case "F":
              executors[execNumber].type = "flash";
              break;
            case "V":
              executors[execNumber].type = "fader";
              break;
            default:
              executors[execNumber].type = "other";
              break;
          }
        }
      });
      return executors;
    } catch (error) {
      console.error("Error fetching executors:", error);
      return {};
    }
  }
}

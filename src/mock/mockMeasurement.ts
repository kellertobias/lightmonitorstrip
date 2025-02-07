/**
 * Mock measurement process that generates sample JSON lines
 * This simulates a measurement device outputting data every 50ms (1/20 second)
 */

function getRandomFloat(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function getCurrentTimestamp(): string {
  return new Date()
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, " UTC");
}

function generateMeasurement(): string {
  const data = {
    measured: getRandomFloat(30, 120),
    timestamp: getCurrentTimestamp(),
    mode: "fast",
    freqMode: "dBA",
    range: "30-130",
  };

  return JSON.stringify(data);
}

// Main process
const interval = 50; // 50ms = 1/20 second

setInterval(() => {
  console.log(generateMeasurement());
}, interval);

// Keep the process running
process.stdin.resume();

// Handle process termination
process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

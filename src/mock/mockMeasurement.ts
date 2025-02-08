/**
 * Mock measurement process that generates sample JSON lines
 * This simulates a measurement device outputting data every 50ms (1/20 second)
 */

function getCurrentTimestamp(): string {
  return new Date()
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, " UTC");
}

// State for smooth transitions
let currentValue = 85; // Start in the middle of our preferred range
let targetValue = 85;
let spikeTimeout: NodeJS.Timeout | null = null;
let microPhase = 0; // For micro-oscillations

function getNextValue(): number {
  // 5% chance to set a new random target
  if (Math.random() < 0.05) {
    // Weighted random target: more likely to be in 80-97 range
    const rand = Math.random();
    if (rand < 0.7) {
      // 70% chance for preferred range
      targetValue = 80 + Math.random() * 17; // 80-97
    } else if (rand < 0.85) {
      // 15% chance for lower range
      targetValue = 60 + Math.random() * 20; // 60-80
    } else {
      // 15% chance for higher range
      targetValue = 97 + Math.random() * 23; // 97-120
    }
  }

  // 1% chance for a random spike
  if (!spikeTimeout && Math.random() < 0.01) {
    const originalTarget = targetValue;
    targetValue = 60 + Math.random() * 60; // Random spike between 60-120
    spikeTimeout = setTimeout(() => {
      targetValue = originalTarget;
      spikeTimeout = null;
    }, 100); // Spike lasts for 100ms
  }

  // Smooth transition towards target
  const maxStep = 0.5; // Maximum change per step
  const diff = targetValue - currentValue;
  const step = Math.min(Math.abs(diff), maxStep) * Math.sign(diff);
  currentValue += step;

  // Add micro-oscillations (small sine wave)
  microPhase += 0.1;
  const microOscillation = Math.sin(microPhase) * 0.6;

  // Add layered random noise
  const fastNoise = (Math.random() - 0.5) * 3; // Fast, small changes
  const slowNoise = (Math.random() - 0.5) * 0.3; // Slower, medium changes

  // Combine all variations
  currentValue += microOscillation + fastNoise + slowNoise;

  // Ensure we stay within bounds
  return Math.min(130, Math.max(30, currentValue));
}

function generateMeasurement(): string {
  const data = {
    measured: Number(getNextValue().toFixed(1)),
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

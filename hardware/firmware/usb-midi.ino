/**
 * Light Assistant - MIDI/DMX Controller Firmware
 *
 * This firmware implements a 40-button MIDI/DMX controller with 2 potentiometers.
 * Features:
 * - 40 RGB LED backlit buttons in a matrix layout (software: 8x5, hardware 2x 5 columns x 4 rows next to each other)
 * - 2 potentiometers for continuous control
 * - MIDI over USB output
 * - DMX output
 * - Setup mode for LED color configuration
 * - EEPROM storage for settings
 */

#define DMX_USE_PORT1

#include <Adafruit_NeoPixel.h>
#include "MIDIUSB.h"
#include <EEPROM.h>
#include <DMXSerial.h>

// Hardware Configuration
#define LED_PIN 2               // Pin for WS2812b LEDs
#define NUM_LEDS 40             // Number of LEDs
#define NUM_BTNS 40             // Number of buttons
#define DEBOUNCE_DELAY 10       // Debounce delay in milliseconds
#define BOOTUP_WIPE_INTERVAL 20 // LED wipe animation time in milliseconds
#define DMX_CHANNELS 43         // Number of DMX channels (40 buttons + 2 pots + 1)

// Matrix Configuration
// Pins for the button matrix (8 columns x 5 rows)
const uint8_t colPins[8] = {10, 16, 14, 15, A0, A1, 8, 9}; // Column pins
const uint8_t rowPins[5] = {3, 4, 5, 6, 7};                // Row pins

// LED Mapping
// Maps button positions to LED positions on the WS2812B strip
const uint8_t ledMap[40] = {
    39, 38, 37, 36, 35, // First row
    34, 33, 32, 31, 30, // Second row
    29, 28, 27, 26, 25, // Third row
    24, 23, 22, 21, 20, // Fourth row
    4, 3, 2, 1, 0,      // Fifth row
    9, 8, 7, 6, 5,      // Sixth row
    14, 13, 12, 11, 10, // Seventh row
    19, 18, 17, 16, 15  // Eighth row
};

// Button Matrix Mapping
// Maps physical button positions in the matrix to logical button numbers
const uint8_t btnMap[8][5] = {
    {0, 1, 2, 3, 4},      // Row 1
    {5, 6, 7, 8, 9},      // Row 2
    {10, 11, 12, 13, 14}, // Row 3
    {15, 16, 17, 18, 19}, // Row 4
    {39, 38, 37, 36, 35}, // Row 5
    {34, 33, 32, 31, 30}, // Row 6
    {29, 28, 27, 26, 25}, // Row 7
    {24, 23, 22, 21, 20}  // Row 8
};

// Potentiometer Configuration
#define POT1_PIN A2  // First potentiometer
#define POT2_PIN A3  // Second potentiometer
#define DMX_TX_PIN 1 // DMX output pin

// Color Indices for LED Configuration
#define iRED 0
#define iORANGE 1
#define iYELLOW 2
#define iGREEN 3
#define iTEAL 4
#define iBLUE 5
#define iPINK 6
#define iWHITE 7
#define iBLACK 8

// Global Objects and Variables
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
bool buttonStates[40] = {false};    // Current state of each button
uint16_t lastPotValues[2] = {0, 0}; // Last read potentiometer values

// LED Configuration
uint16_t brightnessNormal = 25;      // Normal LED brightness
uint16_t brightnessPressed = 40;     // Brightness when button is pressed
uint8_t colorNormalIndex = iBLUE;    // Default color index for normal state
uint8_t colorPressedIndex = iWHITE;  // Default color index for pressed state
uint8_t colorEnabledIndex = iORANGE; // Default color index for enabled state

#define AMOUNT_COLORS 9

// Available Colors (RGB Values)
const uint32_t colors[AMOUNT_COLORS] = {
    strip.Color(255, 0, 0),     // Red
    strip.Color(255, 128, 0),   // Orange
    strip.Color(255, 255, 0),   // Yellow
    strip.Color(0, 255, 0),     // Green
    strip.Color(0, 255, 255),   // Teal
    strip.Color(0, 0, 255),     // Blue
    strip.Color(255, 0, 255),   // Pink
    strip.Color(255, 255, 255), // White
    strip.Color(0, 0, 0)        // Black
};

// Setup mode flag
bool setupMode = false;

// Function prototypes
void sendDMXPacket();
void scanButtons();
void renderSetupModeLeds();
void handleSetupMode();
uint32_t scaleColor(uint32_t color, uint8_t brightness);

// Current LED colors based on configuration
uint32_t colorNormal = scaleColor(colors[colorNormalIndex], brightnessNormal);
uint32_t colorPressed = scaleColor(colors[colorPressedIndex], brightnessPressed);
uint32_t colorEnabled = scaleColor(colors[colorEnabledIndex], brightnessNormal);

/* SETUP ========= */
/**
 * Initial setup of the controller
 * - Initializes LED strip
 * - Configures pin modes for button matrix
 * - Loads settings from EEPROM
 * - Checks for setup mode
 * - Initializes MIDI and DMX interfaces
 */
void setup()
{
    // Setup LEDs:
    strip.begin();
    strip.setBrightness(255);
    strip.show(); // Initialize all LEDs to 'off'

    // SETUP PINS =============
    // Set row pins as outputs and columns as inputs
    for (uint8_t i = 0; i < 5; i++)
    {
        pinMode(rowPins[i], OUTPUT);
        digitalWrite(rowPins[i], LOW); // Default to LOW
    }
    for (uint8_t i = 0; i < 8; i++)
    {
        pinMode(colPins[i], INPUT); // Columns are inputs
    }

    pinMode(POT1_PIN, INPUT);
    pinMode(POT2_PIN, INPUT);

    // ENABLE once POTs work
    brightnessNormal = EEPROM.read(0);
    brightnessPressed = EEPROM.read(4);
    brightnessNormal = 20;
    brightnessPressed = 40;
    colorNormalIndex = EEPROM.read(8);
    colorPressedIndex = EEPROM.read(12);
    colorEnabledIndex = EEPROM.read(16);

    colorNormal = scaleColor(colors[colorNormalIndex], brightnessNormal);
    colorPressed = scaleColor(colors[colorPressedIndex], brightnessPressed);
    colorEnabled = scaleColor(colors[colorEnabledIndex], brightnessNormal);

    scanButtons();
    Serial.begin(115200);

    if (buttonStates[0])
    {
        // Enter Setup Mode
        setupMode = true;
        wipeColor(0, 0);
        delay(100);
        wipeColor(colorPressed, 5);
        delay(100);
        wipeColor(colorNormal, 5);
        renderSetupModeLeds();
        Serial.println("Entering Setup Mode");
    }
    else
    {
        setupMode = false;
        // COLOR WIPE indicates that time for setup mode is over
        wipeColor(colorNormal, BOOTUP_WIPE_INTERVAL);
        DMXSerial.init(DMXController, DMX_CHANNELS);
        DMXSerial.write(DMX_CHANNELS - 1, 0);
        MidiUSB.flush();
        Serial.println("Initialization complete!");
    }
}

/* LOOP =========== */
/**
 * Main program loop
 * - Scans button matrix for changes
 * - Reads potentiometer values
 * - Updates LED states
 * - Sends MIDI/DMX messages
 * - Handles setup mode if active
 */
void loop()
{
    // SCAN BUTTONS =======================
    scanButtons();
    // SCAN POTIS =========================
    scanPotentiometers();

    if (setupMode)
    {
        renderSetupModeLeds();
        handleSetupMode();
    }
    else
    {
        // UPDATE OUTPUTS =====================
        MidiUSB.flush();
        // DMX Out happens with a timer
    }

    // UPDATE OUTPUTS =====================
    strip.show();

    // WAIT ===============================
    delay(DEBOUNCE_DELAY); // Small delay to reduce noise
}

/**
 * Scans the button matrix for state changes
 * Uses a row-column scanning technique to detect button presses
 * When a button state changes:
 * - Updates the LED color
 * - Sends MIDI note messages
 * - Sends DMX values
 */
void scanButtons()
{
    for (uint8_t row = 0; row < 5; row++)
    {
        digitalWrite(rowPins[row], HIGH); // Enable row
        delay(2);                         // Wait for Row to become high

        for (uint8_t col = 0; col < 8; col++)
        {
            bool currentState = digitalRead(colPins[col]);
            int currBtn = btnMap[col][row];

            if (currentState != buttonStates[currBtn])
            { // Check if state has changed
                buttonStates[currBtn] = currentState;
                if (Serial.dtr())
                {
                    Serial.print("Button ");
                    Serial.print(currBtn);
                    Serial.println(currentState ? " PRESSED" : " RELEASED");
                }
                if (currentState)
                {
                    strip.setPixelColor(ledMap[currBtn], colorPressed);
                    noteOn(0, 48 + currBtn, 64);
                    DMXSerial.write(currBtn + 1, 255);
                }
                else
                {
                    strip.setPixelColor(ledMap[currBtn], colorNormal);
                    noteOff(0, 48 + currBtn, 64);
                    DMXSerial.write(currBtn + 1, 0);
                }
            }
        }
        digitalWrite(rowPins[row], LOW); // Disable row
    }
}

/**
 * Reads and processes potentiometer values
 * - Implements value smoothing and deadzone
 * - Sends MIDI CC messages for changes
 * - Updates DMX channels
 * - Provides debug output over serial
 */
void scanPotentiometers()
{
    uint16_t potValues[2] = {analogRead(POT1_PIN), analogRead(POT2_PIN)};
    for (uint8_t i = 0; i < 2; i++)
    {
        if (
            potValues[i] != lastPotValues[i] && (abs(potValues[i] - lastPotValues[i]) > 5 || potValues[i] == 0 || potValues[i] == 1024))
        { // Only print if there's a significant change
            lastPotValues[i] = potValues[i];

            // Send CC Midi Message
            uint8_t value = potValues[i] > 1015 ? 255 : potValues[i] < 3 ? 0
                                                                         : map(potValues[i], 3, 1015, 0, 255);
            DMXSerial.write(i + 41, value);
            noteOn(0, 48 + 40 + i, map(value, 0, 255, 0, 127));
            if (Serial.dtr())
            {
                Serial.print("Poti ");
                Serial.print(i);
                Serial.print(" = ");
                Serial.println(map(value, 0, 255, 0, 127));
            }
        }
    }
}

/* HELPERS ============= */
/**
 * Sets all LEDs to a specified color with optional animation
 * @param color The color to set (32-bit RGB value)
 * @param delayMS Delay between each LED for animation (0 for instant)
 */
void wipeColor(uint32_t color, int delayMS)
{
    if (delayMS > 0)
    {
        for (int i = 0; i < NUM_LEDS; i++)
        {
            strip.setPixelColor(i, color);
            strip.show();
            delay(delayMS);
        }
    }
    else
    {
        for (int i = 0; i < NUM_LEDS; i++)
        {
            strip.setPixelColor(i, color);
        }
        strip.show();
    }
}

/**
 * Adjusts a color's brightness
 * @param color The original color (32-bit RGB value)
 * @param brightness Brightness level (0-255)
 * @return The adjusted color value
 */
uint32_t scaleColor(uint32_t color, uint8_t brightness)
{
    // Extract the original RGB components from the 32-bit color
    uint8_t red = (color >> 16) & 0xFF;
    uint8_t green = (color >> 8) & 0xFF;
    uint8_t blue = color & 0xFF;

    // Scale the RGB components by the brightness factor (0-255)
    red = (red * brightness) / 255;
    green = (green * brightness) / 255;
    blue = (blue * brightness) / 255;

    // Set the adjusted color to the specified pixel
    return ((uint32_t)red << 16) | ((uint32_t)green << 8) | blue;
}

/**
 * Updates LED colors for setup mode
 * - Shows mode indicators
 * - Displays color palette
 * - Shows current selection states
 */
void renderSetupModeLeds()
{
    // Indicator for Setup Mode
    strip.setPixelColor(39, strip.Color(20, 20, 20));
    strip.setPixelColor(38, strip.Color(0, 0, 0));
    strip.setPixelColor(37, strip.Color(0, 0, 0));
    strip.setPixelColor(36, strip.Color(20, 0, 0));
    // Save Button
    strip.setPixelColor(35, strip.Color(0, 20, 0));
    for (uint8_t i = 0; i < AMOUNT_COLORS; i++)
    {
        // Re-Enable once MIDI in works
        // strip.setPixelColor(ledMap[i + 10], scaleColor(colors[i], brightnessNormal));
        strip.setPixelColor(ledMap[i + 10], 0);
        strip.setPixelColor(ledMap[i + 20], scaleColor(colors[i], brightnessNormal));
        strip.setPixelColor(ledMap[i + 30], scaleColor(colors[i], brightnessPressed));
    }
    for (uint8_t i = 0; i < 5; i++)
    {
        strip.setPixelColor(ledMap[i + 5], buttonStates[i + 5] ? colorPressed : colorNormal);
    }
    strip.setPixelColor(ledMap[19], 0);
    strip.setPixelColor(ledMap[29], 0);
    strip.setPixelColor(ledMap[39], 0);
}

/**
 * Handles button interactions in setup mode
 * - Processes color selection
 * - Handles brightness adjustment
 * - Manages save/reset operations
 */
void handleSetupMode()
{
    if (buttonStates[3])
    {
        wipeColor(strip.Color(30, 0, 0), 0);
        // Reset without saving
        asm volatile("  jmp 0");
    }

    brightnessNormal = map(lastPotValues[0], 0, 1024, 0, 100);
    brightnessPressed = map(lastPotValues[0], 0, 1024, 0, 100);

    if (buttonStates[4])
    {
        wipeColor(strip.Color(0, 30, 0), 0);
        // Reset with saving
        EEPROM.write(0, brightnessNormal);
        EEPROM.write(4, brightnessPressed);
        EEPROM.write(8, colorNormalIndex);
        EEPROM.write(12, colorPressedIndex);
        EEPROM.write(16, colorEnabledIndex);
        asm volatile("  jmp 0");
    }
    for (uint8_t i = 0; i < AMOUNT_COLORS; i++)
    {
        // Re-Enable once Midi In Works
        // if(buttonStates[i + 10]) {
        //   colorNormalIndex = i;
        //   colorNormal = scaleColor(colors[i], brightnessNormal);
        // }
        if (buttonStates[i + 20])
        {
            colorNormalIndex = i;
            colorNormal = scaleColor(colors[i], brightnessNormal);
        }
        if (buttonStates[i + 30])
        {
            colorPressedIndex = i;
            colorPressed = scaleColor(colors[i], brightnessPressed);
        }
    }
}

/**
 * Scales a 16-bit value to 8-bit
 * @param value Input value (0-1023)
 * @return Scaled value (0-255)
 */
uint8_t scaleValue(uint16_t value)
{
    return value << 2;
}

/**
 * Sends a MIDI Control Change message
 * @param channel MIDI channel (1-16)
 * @param ccNumber CC parameter number
 * @param value CC value (0-127)
 */
void midiCC(uint8_t channel, uint8_t ccNumber, uint8_t value)
{
    if (!MidiUSB.availableForWrite())
        return;
    // MIDI control change message format: [status byte, ccNumber, value]
    midiEventPacket_t event = {0xB0 | (channel - 1), ccNumber, value}; // Channel is 1-16, so we subtract 1
    MidiUSB.sendMIDI(event);                                           // Send the MIDI event
}

/**
 * Sends a MIDI Note On message
 * @param channel MIDI channel (0-15)
 * @param pitch Note number (0-127)
 * @param velocity Note velocity (0-127)
 */
void noteOn(byte channel, byte pitch, byte velocity)
{
    if (!MidiUSB.availableForWrite())
        return;
    midiEventPacket_t noteOn = {0x09, 0x90 | channel, pitch, velocity};
    MidiUSB.sendMIDI(noteOn);
}

/**
 * Sends a MIDI Note Off message
 * @param channel MIDI channel (0-15)
 * @param pitch Note number (0-127)
 * @param velocity Release velocity (0-127)
 */
void noteOff(byte channel, byte pitch, byte velocity)
{
    if (!MidiUSB.availableForWrite())
        return;
    midiEventPacket_t noteOff = {0x08, 0x80 | channel, pitch, velocity};
    MidiUSB.sendMIDI(noteOff);
}
# Light Assistant

This tool is used in combination with a MagicQ light control desk to extend the amount of physical buttons on the desk.

It communicates via OSC to MagicQ and uses its HTTP API to update the available executors. It also interfaces with a gm1356 based SPL meter to display a little graph of how much the current DJ destroys your ears.

! This project is written by AI in large parts (as an experiment how far you can push it). That's why the code might not be super clean. The project however is fully functional and has been used to control lights for a few events.

## Project Layout:

```
light-assistant/
├── hardware/ # Hardware specific code and PCB schematics
├── src/
│ ├── app/ # NextJS frontend code
│ ├── components/ # React components
│ ├── contexts/ # React contexts
│ ├── hooks/ # React hooks
│ ├── mocks/ # Mock implementations of the interfacing systems to test against
│ ├── websocket-server/ # The Server to interface with the external systems
```

## Setup and running the project:

### Setup of Webserver & GUI:

- Run `npm install` to install the dependencies
- If you want to add the SPL meter, you need to install splread from here: https://github.com/pvachon/gm1356/tree/master
- Run `npm run dev` to start the development server(s)

You might want to run this on a raspberry PI and set it up so that it automatically starts when the pi starts and then opens the browser to the local webserver.

### MagicQ Setup

- Enable OSC (tx & rx) in the setup
- Enable the http server in the setup
- Create a grid of 10x10 executors on the MagicQ executor window (! only page 1 is supported)
- Each first line is the actual executor that will be controlled (contains the name of the executor)
- Each second line contains the color of the button in the grid, the type (Flash/ Toggle) and the color of the icon (e.g. `AAA,T,FF0` for a gray toggle button with a yellow icon)

### Setup of the Hardware:

- compile the arduino file (either the USB MIDI file or the USB Custom file)
- buy the PCB and solder it together
- upload the compiled arduino file to the microcontroller
- connect it via USB to this project

Alternatively the PCB also supports Hardware MIDI out (not tested yet) or DMX out (tested and works)

when you have flashed the USB Midi version and press the top left button while powering it up, you can select the
colors and brightness of the buttons' backlight. In the USB Custom version, the buttons' backlights are controlled by the server application and the DMX out of the board is disabled. In this mode it only interfaces with this project.

## AI Experiment

This project was an experiment to see how far you could push an AI to write an entire application. It started from an empty folder and the following prompt:

## Debugging

### Sending OSC Messages:

Install https://github.com/yoggy/sendosc

and then

```
sendosc 192.168.42.147 8000 /exec/1/12 f 0.6
```

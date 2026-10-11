# reMarkable Focus Timer

A clean, minimal Pomodoro timer for the **reMarkable Paper Pure**, built as an [AppLoad](https://github.com/asivery/rm-appload) (xovi) QML app. Black on white, designed for e-ink.

The app can be windowed and sit on top of notes and documents (swipe down from the top centre of the reMarkable tablet).

**[Live web demo](https://GlitchToGlory.github.io/remarkable-focus-timer/)** (same timer logic as the tablet app)

**[Focus Timer running on a reMarkable Paper Pure](docs/photo.jpg)**

## Features
- Three tabs: **Pomodoro** (25 min), **Short Break** (5 min) and **Long Break** (15 min)
- START, PAUSE and RESUME, plus a small Reset
- **Silent reminders**: no sound. When a timer ends, a bar across the top of the app flashes black and white (one second each) and the button changes to **END**. Press END to stop the flashing; the app has already switched to the suggested next tab and waits for you to press START
- A long break is suggested after every 4th Pomodoro
- The timer uses the system clock, so it stays accurate even if the screen is slow to redraw
- Timer logic lives in one file (`src/qml/focus.js`), shared by the tablet app and the web demo, with unit tests

## Install on the tablet
Requires developer mode with xovi + AppLoad already installed.

1. Download `focus-timer.zip` from the Releases page and unzip it (or build it, see below).
2. With the tablet connected by USB (password: Settings > Help > About):
   ```sh
   scp -O -r focus-timer root@10.11.99.1:/home/root/xovi/exthome/appload/
   ```
3. In AppLoad, tap **Reload**. "Focus Timer" appears in the launcher.

## Build from source (macOS)
```sh
brew install qt node
./build.sh
```
This runs the tests, compiles the QML into `resources.rcc`, and produces `dist/focus-timer/` and `dist/focus-timer.zip`.

## Layout
```
src/qml/main.qml      UI
src/qml/focus.js      timer state machine (shared with the web demo)
src/resources.qrc     Qt resource manifest
package/              manifest.json + icon.png for AppLoad
docs/                 GitHub Pages demo
tests/test.js         node tests/test.js
```

## Notes
- The clock counts in seconds, so the screen refreshes once a second while the timer runs. Nothing is drawn while it is paused or idle.
- The flashing bar is drawn inside the app's own window, so it shows when the app is open or windowed. It cannot restyle AppLoad's window title bar, and a fully hidden or minimised app may not be able to draw at all.
- Closing the app stops the timer.
- Not affiliated with reMarkable AS.

## License
MIT

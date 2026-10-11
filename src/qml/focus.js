.pragma library
// Pomodoro timer logic shared by the reMarkable QML app and the web demo.
// All functions are pure: they take a state and return a new one.

var MODES = ["focus", "short", "long"];
var LABELS = { focus: "Pomodoro", short: "Short Break", long: "Long Break" };
var MIN = 60000;
var DEFAULTS = { focus: 25, short: 5, long: 15, longEvery: 4 };   // minutes; long break after every 4th pomodoro

function duration(cfg, mode) { return cfg[mode] * MIN; }

function initial(cfg) {
    return { mode: "focus", running: false, endsAt: 0, remaining: duration(cfg, "focus"), cycle: 0, message: "", alarm: false };
}
function copy(st) {
    return { mode: st.mode, running: st.running, endsAt: st.endsAt, remaining: st.remaining, cycle: st.cycle, message: st.message, alarm: st.alarm };
}

// Switch tab (also acts as a reset for that tab)
function selectMode(st, mode, cfg) {
    var c = copy(st);
    c.mode = mode; c.running = false; c.endsAt = 0; c.remaining = duration(cfg, mode); c.message = ""; c.alarm = false;
    return c;
}
function start(st, now) {
    if (st.running || st.remaining <= 0) return st;
    var c = copy(st);
    c.running = true; c.endsAt = now + st.remaining; c.message = "";
    return c;
}
function pause(st, now) {
    if (!st.running) return st;
    var c = copy(st);
    c.remaining = Math.max(0, st.endsAt - now); c.running = false; c.endsAt = 0;
    return c;
}
// END: stops the "timer finished" alarm
function dismiss(st) { if (!st.alarm) return st; var c = copy(st); c.alarm = false; return c; }
// One button does it all: END while the alarm is on, otherwise START / PAUSE / RESUME
function toggle(st, now) { return st.alarm ? dismiss(st) : (st.running ? pause(st, now) : start(st, now)); }

function remainingMs(st, now) { return st.running ? Math.max(0, st.endsAt - now) : st.remaining; }

// Call about once a second while running. event: "" | "focusDone" | "breakDone"
// When a timer ends, the app moves to the suggested next tab, raises the alarm (flashing bar)
// and waits: press END to stop the alarm, then START for the next timer.
function tick(st, cfg, now) {
    if (!st.running || now < st.endsAt) return { st: st, event: "" };
    var c = copy(st), wasFocus = st.mode === "focus";
    if (wasFocus) {
        c.cycle++;
        c.mode = (c.cycle % cfg.longEvery === 0) ? "long" : "short";
        c.message = "Time for a break.";
    } else {
        c.mode = "focus";
        c.message = "Break over. Ready to focus?";
    }
    c.running = false; c.endsAt = 0; c.remaining = duration(cfg, c.mode); c.alarm = true;
    return { st: c, event: wasFocus ? "focusDone" : "breakDone" };
}

// ---- display ---------------------------------------------------------------

function pad2(n) { return n < 10 ? "0" + n : String(n); }
function clockText(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return pad2(Math.floor(s / 60)) + ":" + pad2(s % 60);
}
function started(st, cfg) { return st.remaining < duration(cfg, st.mode); }
function buttonLabel(st, cfg) { return st.alarm ? "END" : (st.running ? "PAUSE" : (started(st, cfg) ? "RESUME" : "START")); }
function canReset(st, cfg) { return !st.alarm && !st.running && started(st, cfg); }

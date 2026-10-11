// Run with: node tests/test.js
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/../src/qml/focus.js", "utf8").replace(/^\.pragma library.*$/m, "");
const F = new Function(src + "; return { MODES, LABELS, DEFAULTS, initial, selectMode, start, pause, toggle, dismiss, remainingMs, tick, clockText, buttonLabel, canReset };")();
let failed = 0;
function eq(a, b, name) { if (JSON.stringify(a) !== JSON.stringify(b)) { failed++; console.log("FAIL", name, "got", JSON.stringify(a), "expected", JSON.stringify(b)); } }
const cfg = F.DEFAULTS, M = 60000;

// Defaults and display
eq(cfg, { focus: 25, short: 5, long: 15, longEvery: 4 }, "default lengths");
let st = F.initial(cfg);
eq([st.mode, F.clockText(F.remainingMs(st, 0)), F.buttonLabel(st, cfg)], ["focus", "25:00", "START"], "initial state");
eq([F.clockText(0), F.clockText(1), F.clockText(59999), F.clockText(61000), F.clockText(5 * M)], ["00:00", "00:01", "01:00", "01:01", "05:00"], "clock text rounds up to the next second");
eq(F.MODES.map(m => F.LABELS[m]), ["Pomodoro", "Short Break", "Long Break"], "tab labels");

// Tabs
eq(F.clockText(F.selectMode(st, "short", cfg).remaining), "05:00", "short break tab is 5 min");
eq(F.clockText(F.selectMode(st, "long", cfg).remaining), "15:00", "long break tab is 15 min");

// Start, pause, resume
let t0 = 1000000;
let run = F.start(st, t0);
eq([run.running, F.clockText(F.remainingMs(run, t0 + 10000)), F.buttonLabel(run, cfg)], [true, "24:50", "PAUSE"], "running countdown");
let paused = F.pause(run, t0 + 60000);
eq([paused.running, F.clockText(F.remainingMs(paused, t0 + 999999)), F.buttonLabel(paused, cfg), F.canReset(paused, cfg)], [false, "24:00", "RESUME", true], "pause freezes the time");
let resumed = F.toggle(paused, t0 + 120000);
eq(F.clockText(F.remainingMs(resumed, t0 + 120000 + 30000)), "23:30", "resume continues from where it paused");
eq(F.clockText(F.selectMode(paused, "focus", cfg).remaining), "25:00", "selecting the tab again resets it");
eq(F.canReset(st, cfg), false, "no reset before starting");

// Finishing a pomodoro: moves to a short break, waits for START
eq(F.tick(run, cfg, t0 + 25 * M - 1).event, "", "not finished yet");
let done = F.tick(run, cfg, t0 + 25 * M);
eq([done.event, done.st.mode, done.st.running, done.st.cycle, F.clockText(done.st.remaining), done.st.message], ["focusDone", "short", false, 1, "05:00", "Time for a break."], "pomodoro ends -> short break ready");

// Finishing a break: back to Pomodoro
let br = F.start(done.st, t0 + 30 * M);
let brDone = F.tick(br, cfg, t0 + 35 * M);
eq([brDone.event, brDone.st.mode, F.clockText(brDone.st.remaining), brDone.st.message], ["breakDone", "focus", "25:00", "Break over. Ready to focus?"], "break ends -> Pomodoro ready");

// Every 4th pomodoro earns a long break
let s = F.initial(cfg), now = 0, modes = [];
for (let i = 0; i < 4; i++) {
  s = F.selectMode(s, "focus", cfg); s = F.start(s, now); now += 25 * M;
  const r = F.tick(s, cfg, now); s = r.st; modes.push(s.mode);
  s = F.start(s, now); now += (s.mode === "long" ? 15 : 5) * M; s = F.tick(s, cfg, now).st;
}
eq(modes, ["short", "short", "short", "long"], "long break after the 4th pomodoro");

// A late tick (app was asleep) still finishes cleanly; ticks while idle do nothing
eq(F.tick(run, cfg, t0 + 90 * M).st.mode, "short", "late tick finishes");
eq(F.tick(st, cfg, 99999999).event, "", "idle ticks do nothing");
eq(F.start(F.pause(F.start(st, 0), 25 * M), 0).running, false, "cannot start with nothing left");

// Alarm: raised when a timer ends, cleared by END
eq(done.st.alarm, true, "alarm raised when a pomodoro ends");
eq(brDone.st.alarm, true, "alarm raised when a break ends");
eq([F.buttonLabel(done.st, cfg), F.canReset(done.st, cfg)], ["END", false], "button reads END during the alarm");
let quiet = F.toggle(done.st, t0 + 26 * M);
eq([quiet.alarm, quiet.running, quiet.mode, F.buttonLabel(quiet, cfg)], [false, false, "short", "START"], "END stops the alarm and does not start the next timer");
eq(F.selectMode(done.st, "long", cfg).alarm, false, "choosing a tab also clears the alarm");
eq(F.initial(cfg).alarm, false, "no alarm at the start");
eq(F.start(F.start(st, 0), 5).alarm, false, "starting a timer has no alarm");

console.log(failed ? failed + " test(s) failed" : "All tests passed");
process.exit(failed ? 1 : 0);

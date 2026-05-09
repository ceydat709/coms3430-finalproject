(() => {
  "use strict";

  // ---- CONFIG ----
  const ROWS_CONFIG = [
    {
      id: "bd",
      abbr: "bd",
      full: "kick",
      type: "drum",
      color: "#579fbd",
      glow: "rgba(87,159,189,.35)",
    },
    {
      id: "sd",
      abbr: "sd",
      full: "snare",
      type: "drum",
      color: "#4a9d82",
      glow: "rgba(74,157,130,.35)",
    },
    {
      id: "hh",
      abbr: "hh",
      full: "hi-hat",
      type: "drum",
      color: "#d99a5f",
      glow: "rgba(217,154,95,.35)",
    },
    {
      id: "cp",
      abbr: "cp",
      full: "clap",
      type: "drum",
      color: "#d87590",
      glow: "rgba(216,117,144,.35)",
    },
    {
      id: "m1",
      abbr: "hi",
      full: "melody hi",
      type: "pitched",
      register: "hi",
      color: "#8f8fbc",
      glow: "rgba(143,143,188,.35)",
    },
    {
      id: "m2",
      abbr: "lo",
      full: "melody lo",
      type: "pitched",
      register: "lo",
      color: "#6f8f63",
      glow: "rgba(111,143,99,.35)",
    },
  ];
  const NROWS = ROWS_CONFIG.length,
    COLS_A = 16;
  let COLS_B = 13;
  const PROB_LEVELS = [0, 0.33, 0.66, 1];

  const ZONES = [
    { name: "kick", rowIdx: 0, xStart: 0, xEnd: 0.17, color: "#579fbd" },
    { name: "snare", rowIdx: 1, xStart: 0.17, xEnd: 0.33, color: "#4a9d82" },
    { name: "hi-hat", rowIdx: 2, xStart: 0.33, xEnd: 0.5, color: "#d99a5f" },
    { name: "clap", rowIdx: 3, xStart: 0.5, xEnd: 0.67, color: "#d87590" },
    { name: "melody↑", rowIdx: 4, xStart: 0.67, xEnd: 0.83, color: "#8f8fbc" },
    { name: "melody↓", rowIdx: 5, xStart: 0.83, xEnd: 1.0, color: "#6f8f63" },
  ];

  // ---- CHORD DATA ----
  const CHORDS = [
    {
      name: "Cmaj",
      pad: ["C3", "E3", "G3"],
      hiScale: ["E4", "G4", "A4", "C5", "E5"],
      loScale: ["C3", "D3", "E3", "G3", "A3"],
    },
    {
      name: "Amin",
      pad: ["A2", "C3", "E3"],
      hiScale: ["A4", "C5", "D5", "E5", "G5"],
      loScale: ["A2", "C3", "E3", "G3", "A3"],
    },
    {
      name: "Fmaj",
      pad: ["F2", "A2", "C3"],
      hiScale: ["C5", "D5", "F5", "G5", "A5"],
      loScale: ["F2", "G2", "A2", "C3", "D3"],
    },
    {
      name: "Gmaj",
      pad: ["G2", "B2", "D3"],
      hiScale: ["G4", "A4", "B4", "D5", "G5"],
      loScale: ["G2", "A2", "B2", "D3", "G3"],
    },
    {
      name: "Dmin",
      pad: ["D3", "F3", "A3"],
      hiScale: ["D4", "F4", "A4", "C5", "D5"],
      loScale: ["D3", "F3", "A3", "C4", "D4"],
    },
    {
      name: "Emin",
      pad: ["E3", "G3", "B3"],
      hiScale: ["E4", "G4", "A4", "B4", "E5"],
      loScale: ["E2", "G2", "B2", "D3", "E3"],
    },
    {
      name: "Bdim",
      pad: ["B2", "D3", "F3"],
      hiScale: ["B4", "D5", "F5", "A5", "B5"],
      loScale: ["B2", "D3", "F3", "A3", "B3"],
    },
    {
      name: "Csus4",
      pad: ["C3", "F3", "G3"],
      hiScale: ["C5", "F5", "G5", "A5", "C6"],
      loScale: ["C3", "F3", "G3", "A3", "C4"],
    },
  ];
  const CHORD_TRANS = [
    [0.05, 0.25, 0.15, 0.25, 0.1, 0.1, 0.05, 0.05],
    [0.3, 0.05, 0.1, 0.1, 0.05, 0.2, 0.1, 0.1],
    [0.2, 0.1, 0.05, 0.3, 0.15, 0.1, 0.05, 0.05],
    [0.35, 0.15, 0.1, 0.05, 0.1, 0.1, 0.1, 0.05],
    [0.1, 0.15, 0.1, 0.2, 0.05, 0.25, 0.1, 0.05],
    [0.15, 0.2, 0.05, 0.15, 0.15, 0.05, 0.15, 0.1],
    [0.1, 0.1, 0.1, 0.1, 0.1, 0.15, 0.05, 0.3],
    [0.3, 0.1, 0.15, 0.15, 0.1, 0.1, 0.05, 0.05],
  ];
  function markovNextChord(i) {
    const w = CHORD_TRANS[i];
    let r = Math.random();
    for (let j = 0; j < w.length; j++) {
      r -= w[j];
      if (r <= 0) return j;
    }
    return 0;
  }

  // ---- DRUM KITS ----
  const DRUM_KITS = {
    analog: {
      bd: {
        wave: "sine",
        start: 132,
        end: 43,
        dur: 0.27,
        gain: 0.9,
        click: 0.16,
        drive: 0,
      },
      sd: { tone: 185, noiseFreq: 1900, dur: 0.18, gain: 0.44, body: 0.23 },
      hh: { freq: 7200, dur: 0.055, gain: 0.28, metal: 0 },
      cp: { freq: 2400, dur: 0.13, gain: 0.36, spread: 0.022 },
      bass: { wave: "sine", dur: 0.34, gain: 0.58, drop: 0.54, drive: 0.04 },
    },
    808: {
      bd: {
        wave: "sine",
        start: 96,
        end: 34,
        dur: 0.52,
        gain: 0.94,
        click: 0.08,
        drive: 0.12,
      },
      sd: { tone: 170, noiseFreq: 1500, dur: 0.22, gain: 0.4, body: 0.3 },
      hh: { freq: 8500, dur: 0.075, gain: 0.24, metal: 0.2 },
      cp: { freq: 2050, dur: 0.16, gain: 0.32, spread: 0.028 },
      bass: { wave: "sine", dur: 0.46, gain: 0.72, drop: 0.48, drive: 0.18 },
    },
    dust: {
      bd: {
        wave: "triangle",
        start: 118,
        end: 48,
        dur: 0.24,
        gain: 0.76,
        click: 0.28,
        drive: 0.28,
      },
      sd: { tone: 155, noiseFreq: 1200, dur: 0.2, gain: 0.38, body: 0.18 },
      hh: { freq: 5200, dur: 0.07, gain: 0.2, metal: 0 },
      cp: { freq: 1700, dur: 0.15, gain: 0.28, spread: 0.032 },
      bass: {
        wave: "triangle",
        dur: 0.28,
        gain: 0.52,
        drop: 0.66,
        drive: 0.25,
      },
    },
    metal: {
      bd: {
        wave: "sine",
        start: 140,
        end: 52,
        dur: 0.2,
        gain: 0.75,
        click: 0.24,
        drive: 0,
      },
      sd: { tone: 245, noiseFreq: 2600, dur: 0.16, gain: 0.38, body: 0.18 },
      hh: { freq: 9000, dur: 0.09, gain: 0.26, metal: 1 },
      cp: { freq: 3200, dur: 0.12, gain: 0.32, spread: 0.018 },
      bass: { wave: "sawtooth", dur: 0.24, gain: 0.5, drop: 0.72, drive: 0.1 },
    },
    bit: {
      bd: {
        wave: "square",
        start: 110,
        end: 39,
        dur: 0.18,
        gain: 0.68,
        click: 0.32,
        drive: 0.7,
      },
      sd: {
        tone: 210,
        noiseFreq: 2300,
        dur: 0.13,
        gain: 0.34,
        body: 0.16,
        drive: 0.75,
      },
      hh: { freq: 7600, dur: 0.045, gain: 0.22, metal: 0.35, drive: 0.75 },
      cp: { freq: 2800, dur: 0.09, gain: 0.28, spread: 0.016, drive: 0.75 },
      bass: { wave: "square", dur: 0.18, gain: 0.42, drop: 0.58, drive: 0.65 },
    },
  };
  const drumKit = "analog";
  let baseBpm = 108;

  // ---- TIME OF DAY CONFIGS ----
  const TOD_CONFIGS = {
    dawn: {
      skyTop: "#1a2a4a",
      skyBot: "#c97a4a",
      ground: "#7a9c6e",
      groundDark: "#5a7a52",
      sunColor: "#f59c42",
      fogColor: "rgba(255,200,140,.18)",
      starAlpha: 0.3,
      moonAlpha: 0,
      sunAlpha: 1,
      sunY: 0.78,
      ambientLight: "rgba(255,180,100,.08)",
      bpmMult: 0.75,
      chaosAdd: -0.08,
      densityAdd: -0.1,
      label: "dawn",
    },
    day: {
      skyTop: "#5ba3d4",
      skyBot: "#b8dff0",
      ground: "#88c270",
      groundDark: "#6aaa52",
      sunColor: "#ffe066",
      fogColor: "rgba(220,240,255,0)",
      starAlpha: 0,
      moonAlpha: 0,
      sunAlpha: 1,
      sunY: 0.18,
      ambientLight: "rgba(255,255,200,.04)",
      bpmMult: 1.0,
      chaosAdd: 0,
      densityAdd: 0,
      label: "day",
    },
    sunset: {
      skyTop: "#1a2040",
      skyBot: "#e06030",
      ground: "#8a7050",
      groundDark: "#6a5038",
      sunColor: "#ff7030",
      fogColor: "rgba(255,100,60,.12)",
      starAlpha: 0.15,
      moonAlpha: 0,
      sunAlpha: 1,
      sunY: 0.7,
      ambientLight: "rgba(255,80,30,.1)",
      bpmMult: 0.88,
      chaosAdd: 0.05,
      densityAdd: 0.05,
      label: "sunset",
    },
    dusk: {
      skyTop: "#0d1228",
      skyBot: "#5a3060",
      ground: "#4a5a3a",
      groundDark: "#384828",
      sunColor: "#c040a0",
      fogColor: "rgba(100,40,120,.18)",
      starAlpha: 0.6,
      moonAlpha: 0.4,
      sunAlpha: 0.3,
      sunY: 0.88,
      ambientLight: "rgba(100,40,150,.12)",
      bpmMult: 0.82,
      chaosAdd: 0.08,
      densityAdd: -0.05,
      label: "dusk",
    },
    night: {
      skyTop: "#060810",
      skyBot: "#121830",
      ground: "#2a3428",
      groundDark: "#1e2820",
      sunColor: "#e0e8ff",
      fogColor: "rgba(40,50,100,.2)",
      starAlpha: 1,
      moonAlpha: 1,
      sunAlpha: 0,
      sunY: 0.35,
      ambientLight: "rgba(60,80,160,.1)",
      bpmMult: 0.65,
      chaosAdd: -0.05,
      densityAdd: -0.15,
      label: "night",
    },
  };
  let currentTOD = "day";
  let todTransition = { from: "day", to: "day", t: 1 };
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function lerpColor(c1, c2, t) {
    const p1 = parseHex(c1),
      p2 = parseHex(c2);
    return `rgb(${Math.round(lerp(p1[0], p2[0], t))},${Math.round(lerp(p1[1], p2[1], t))},${Math.round(lerp(p1[2], p2[2], t))})`;
  }
  function parseHex(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }
  function getTODBlend() {
    const { from, to, t } = todTransition;
    if (t >= 1) return TOD_CONFIGS[to];
    const a = TOD_CONFIGS[from],
      b = TOD_CONFIGS[to];
    return {
      skyTop: lerpColor(a.skyTop, b.skyTop, t),
      skyBot: lerpColor(a.skyBot, b.skyBot, t),
      ground: lerpColor(a.ground, b.ground, t),
      groundDark: lerpColor(a.groundDark, b.groundDark, t),
      sunColor: lerpColor(a.sunColor, b.sunColor, t),
      sunY: lerp(a.sunY, b.sunY, t),
      starAlpha: lerp(a.starAlpha, b.starAlpha, t),
      moonAlpha: lerp(a.moonAlpha, b.moonAlpha, t),
      sunAlpha: lerp(a.sunAlpha, b.sunAlpha, t),
      fogColor: a.fogColor,
      ambientLight: a.ambientLight,
      bpmMult: lerp(a.bpmMult, b.bpmMult, t),
      chaosAdd: lerp(a.chaosAdd, b.chaosAdd, t),
      densityAdd: lerp(a.densityAdd, b.densityAdd, t),
    };
  }

  // ---- STATE ----
  let playing = false,
    frozen = false;
  let chordIdx = 0,
    nextChordIdx = 0,
    barCount = 0;
  let params = { chaos: 0.1, density: 0.22, rep: 0.62, smooth: 0.55 };
  let rowPull = new Array(NROWS).fill(0);
  let coupling = 0;
  let orbBoost = 0;
  let remixDropTicks = 0;
  let masterTick = 0,
    nextBTick = 0;
  let iv = null;
  let collisionCount = 0;
  const INT_HISTORY = 200;
  let interferenceHistory = new Array(INT_HISTORY).fill(0);
  let ripples = [],
    particles2 = [],
    lastFlash = 0;

  function effectiveBpm() {
    const t = getTODBlend();
    return Math.max(40, Math.round(baseBpm * t.bpmMult));
  }
  function updateCouplingBadge() {
    const el = document.getElementById("coupling-badge");
    if (!el) return;
    const eff = Math.min(1, coupling + orbBoost * 0.55);
    el.textContent = `coupling ${eff.toFixed(2)}`;
  }
  function refreshChordHud() {
    const a = CHORDS[chordIdx].name,
      b = CHORDS[nextChordIdx].name;
    [
      ["sb-chord", a],
      ["sb-next", b],
    ].forEach(([id, t]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = t;
    });
  }
  function rowIndexForOrbColor(color) {
    const i = ROWS_CONFIG.findIndex((rc) => rc.color === color);
    return i >= 0 ? i : Math.floor(Math.random() * NROWS);
  }
  function applyOrbMusicalImpact(orb) {
    if (frozen) return;
    const focusRow = rowIndexForOrbColor(orb.color);
    chordIdx = markovNextChord(chordIdx);
    nextChordIdx = markovNextChord(chordIdx);
    reassignAllPitches(gA);
    reassignAllPitches(gB);
    currentPadSrcs.forEach((s) => {
      try {
        s.stop();
      } catch (e) {}
    });
    currentPadSrcs = [];
    remixDropTicks = 3;
    playRemixSting(focusRow);
    if (loaded) setTimeout(() => playPad(chordIdx), 220);
    orbBoost = Math.min(1, orbBoost + 0.64);
    const ph = gA.ph;
    const supportRows = [focusRow];
    if (ROWS_CONFIG[focusRow].type === "drum") supportRows.push(4);
    for (let dc = -3; dc <= 3; dc++) {
      const c = (ph + dc + COLS_A) % COLS_A;
      const falloff = Math.max(0.2, 1 - Math.abs(dc) * 0.25);
      supportRows.forEach((r, i) => {
        const amount =
          i === 0 ? (dc % 2 === 0 ? 1 : PROB_LEVELS[2]) : PROB_LEVELS[1];
        if (i > 0 && Math.random() > falloff * 0.55) return;
        gA.grid[r][c] = Math.max(gA.grid[r][c] || 0, amount);
        if (gA.grid[r][c] && ROWS_CONFIG[r].type === "pitched")
          assignPitch(gA, r, c);
        gA.velGrid[r][c] = Math.min(
          1.25,
          (gA.velGrid[r][c] || 0.7) + 0.2 * falloff,
        );
      });
      const cB = Math.round((c / COLS_A) * gB.cols) % gB.cols;
      if (Math.random() < falloff * 0.65) {
        gB.grid[focusRow][cB] = 1;
        if (ROWS_CONFIG[focusRow].type === "pitched")
          assignPitch(gB, focusRow, cB);
        gB.velGrid[focusRow][cB] = Math.min(
          1.2,
          (gB.velGrid[focusRow][cB] || 0.7) + 0.16 * falloff,
        );
      }
    }
    zonePulse[focusRow] = 1;
    refreshChordHud();
    render();
  }

  function makeGrid(cols) {
    return {
      grid: Array.from({ length: NROWS }, () => new Array(cols).fill(0)),
      biasGrid: Array.from({ length: NROWS }, () =>
        new Array(cols).fill(false),
      ),
      pitchGrid: Array.from({ length: NROWS }, () =>
        new Array(cols).fill(null),
      ),
      velGrid: Array.from({ length: NROWS }, () =>
        Array.from({ length: cols }, () => 0.7 + Math.random() * 0.5),
      ),
      ph: 0,
      cols,
    };
  }
  let gA = makeGrid(COLS_A);
  let gB = makeGrid(COLS_B);
  (function seedA() {
    const p = [
      [1, 0, 0, 0.33, 1, 0, 0, 0.33, 1, 0, 0.33, 0, 1, 0, 0, 0.66],
      [0, 0, 0.66, 0, 0, 0, 1, 0, 0, 0, 0.66, 0, 0, 0.33, 1, 0],
      [
        0.66, 0, 0.66, 0, 0.66, 0.33, 0.66, 0, 0.66, 0, 0.66, 0.33, 0.66, 0, 1,
        0,
      ],
      [0, 0, 0, 0, 0, 0.33, 0, 0, 0, 0, 0, 0.66, 0, 0, 0.33, 0],
      [0, 0.33, 0, 0, 0, 0.66, 0, 0.33, 0, 0.33, 0, 0, 0, 0.66, 0, 0.33],
      [0.66, 0, 0, 0, 0.33, 0, 0, 0, 0.66, 0, 0, 0.33, 0, 0, 0, 0.66],
    ];
    for (let r = 0; r < NROWS; r++)
      for (let c = 0; c < COLS_A; c++) gA.grid[r][c] = p[r][c];
  })();

  // ---- AUDIO ----
  let AC = null,
    masterGain = null,
    limiter = null;
  let underwaterFilter = null,
    underwaterLfo = null,
    underwaterLfoGain = null;
  let underwaterActive = false,
    underwaterDepth01 = 0;
  let melBufs = {},
    padBufs = {},
    loaded = false;
  let currentPadSrcs = [];
  function ac() {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    return AC;
  }
  function output() {
    if (!masterGain) {
      masterGain = ac().createGain();
      masterGain.gain.value = 0.72;
      limiter = ac().createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 8;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.18;
      underwaterFilter = ac().createBiquadFilter();
      underwaterFilter.type = "lowpass";
      underwaterFilter.frequency.value = 20000;
      underwaterFilter.Q.value = 0.7;
      masterGain.connect(underwaterFilter);
      underwaterFilter.connect(limiter);
      limiter.connect(ac().destination);
      underwaterLfo = ac().createOscillator();
      underwaterLfo.type = "sine";
      underwaterLfo.frequency.value = 0.85;
      underwaterLfoGain = ac().createGain();
      underwaterLfoGain.gain.value = 0;
      underwaterLfo.connect(underwaterLfoGain);
      underwaterLfoGain.connect(underwaterFilter.frequency);
      underwaterLfo.start();
      setUnderwater(underwaterActive, underwaterDepth01);
    }
    return masterGain;
  }
  function setUnderwater(active, depth01 = 1) {
    underwaterActive = !!active;
    underwaterDepth01 = depth01;
    if (!underwaterFilter || !AC) return;
    const t = ac().currentTime,
      d = Math.max(0, Math.min(1, depth01)),
      wet = underwaterActive ? Math.max(0.35, d) : 0;
    const cutoff = underwaterActive ? 6800 - wet * 2200 : 20000;
    const lfoDepth = underwaterActive ? 900 + wet * 2200 : 0;
    underwaterFilter.frequency.setTargetAtTime(cutoff, t, 0.08);
    underwaterFilter.Q.setTargetAtTime(
      underwaterActive ? 2.6 + wet * 1.2 : 0.7,
      t,
      0.08,
    );
    if (underwaterLfo)
      underwaterLfo.frequency.setTargetAtTime(
        underwaterActive ? 0.8 + wet * 0.35 : 0.85,
        t,
        0.08,
      );
    if (underwaterLfoGain)
      underwaterLfoGain.gain.setTargetAtTime(lfoDepth, t, 0.08);
  }
  function master() {
    const g = ac().createGain();
    g.gain.value = 0;
    g.connect(output());
    return g;
  }
  async function unlockAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return false;
    output();
    if (ac().state === "suspended") await ac().resume();
    const s = ac().createBufferSource();
    s.buffer = ac().createBuffer(1, 1, ac().sampleRate);
    const g = ac().createGain();
    g.gain.value = 0;
    s.connect(g);
    g.connect(output());
    s.start();
    s.stop(ac().currentTime + 0.01);
    return ac().state === "running";
  }
  function makeNoise(dur) {
    const a = ac(),
      len = Math.max(1, Math.floor(a.sampleRate * dur)),
      buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource();
    s.buffer = buf;
    return s;
  }
  function makeDrive(amt) {
    const ws = ac().createWaveShaper(),
      curve = new Float32Array(256),
      k = 1 + amt * 90;
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 255 - 1;
      curve[i] = ((Math.PI + k) * x) / (Math.PI + k * Math.abs(x));
    }
    ws.curve = curve;
    ws.oversample = "2x";
    return ws;
  }
  function withDrive(src, dst, amt) {
    if (!amt) {
      src.connect(dst);
      return;
    }
    const d = makeDrive(amt);
    src.connect(d);
    d.connect(dst);
  }
  function filtNoise({ type, freq, q, t, dur, gain, drive = 0 }) {
    const a = ac(),
      s = makeNoise(dur),
      f = a.createBiquadFilter(),
      g = master();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f);
    withDrive(f, g, drive);
    s.start(t);
    s.stop(t + dur);
  }
  function playDrum(rowId, gainMult = 1) {
    const a = ac(),
      t = a.currentTime,
      kit = DRUM_KITS[drumKit];
    if (rowId === "bd") {
      const k = kit.bd,
        o = a.createOscillator(),
        g = master();
      o.type = k.wave;
      o.frequency.setValueAtTime(k.start, t);
      o.frequency.exponentialRampToValueAtTime(k.end, t + k.dur * 0.7);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(k.gain * gainMult, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, t + k.dur);
      withDrive(o, g, k.drive);
      o.start(t);
      o.stop(t + k.dur + 0.02);
      if (k.click)
        filtNoise({
          type: "highpass",
          freq: 3600,
          q: 0.3,
          t,
          dur: 0.018,
          gain: k.click * gainMult,
          drive: k.drive,
        });
    } else if (rowId === "sd") {
      const k = kit.sd;
      filtNoise({
        type: "bandpass",
        freq: k.noiseFreq,
        q: 0.9,
        t,
        dur: k.dur,
        gain: k.gain * gainMult,
        drive: k.drive || 0,
      });
      const o = a.createOscillator(),
        b = master();
      o.type = "triangle";
      o.frequency.setValueAtTime(k.tone, t);
      o.frequency.exponentialRampToValueAtTime(k.tone * 0.82, t + k.dur);
      b.gain.setValueAtTime(0.0001, t);
      b.gain.linearRampToValueAtTime(k.body * gainMult, t + 0.005);
      b.gain.exponentialRampToValueAtTime(0.001, t + k.dur * 0.75);
      withDrive(o, b, k.drive || 0);
      o.start(t);
      o.stop(t + k.dur);
    } else if (rowId === "hh") {
      const k = kit.hh;
      filtNoise({
        type: "highpass",
        freq: k.freq,
        q: 0.5,
        t,
        dur: k.dur,
        gain: k.gain * gainMult,
        drive: k.drive || 0,
      });
      if (k.metal)
        [1, 1.37, 1.82].forEach((ratio, i) => {
          const o = a.createOscillator(),
            g = master();
          o.type = "square";
          o.frequency.value = k.freq * 0.38 * ratio;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(
            (0.06 * k.metal * gainMult) / (i + 1),
            t + 0.003,
          );
          g.gain.exponentialRampToValueAtTime(0.001, t + k.dur * 0.9);
          withDrive(o, g, k.drive || 0);
          o.start(t);
          o.stop(t + k.dur);
        });
    } else if (rowId === "cp") {
      const k = kit.cp;
      [0, k.spread, k.spread * 1.9].forEach((off, i) =>
        filtNoise({
          type: "bandpass",
          freq: k.freq + i * 180,
          q: 1.25,
          t: t + off,
          dur: k.dur,
          gain: (k.gain * gainMult) / (1 + i * 0.22),
          drive: k.drive || 0,
        }),
      );
    }
  }
  function noteToMidi(note) {
    const map = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const m = note.match(/^([A-G])(#|b)?(-?\d+)$/);
    if (!m) return 60;
    return (
      (parseInt(m[3]) + 1) * 12 +
      map[m[1]] +
      (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0)
    );
  }
  function midiName(midi) {
    return (
      ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"][
        midi % 12
      ] +
      (Math.floor(midi / 12) - 1)
    );
  }
  async function fetchBuf(inst, note) {
    const url = `https://gleitz.github.io/midi-js-soundfonts/MusyngKite/${inst}-mp3/${midiName(noteToMidi(note))}.mp3`;
    const ab = await (await fetch(url)).arrayBuffer();
    return ac().decodeAudioData(ab);
  }
  async function initAudio() {
    const ls = document.getElementById("loading-status");
    if (ls) ls.textContent = "loading piano & pad samples…";
    const mel = new Set(),
      pad = new Set();
    CHORDS.forEach((c) => {
      c.hiScale.forEach((n) => mel.add(n));
      c.loScale.forEach((n) => mel.add(n));
      c.pad.forEach((n) => pad.add(n));
    });
    try {
      await Promise.all([
        ...[...mel].map(async (n) => {
          melBufs[n] = await fetchBuf("electric_piano_1", n);
        }),
        ...[...pad].map(async (n) => {
          padBufs[n] = await fetchBuf("string_ensemble_1", n);
        }),
      ]);
      loaded = true;
      if (ls)
        ls.textContent =
          "samples ready — you should hear pads & melody when the grid plays";
    } catch (e) {
      if (ls)
        ls.textContent = "sample load failed — check network: " + e.message;
    }
  }
  function playSample(buf, gain = 1, dur = null) {
    if (!buf || !AC) return null;
    const src = AC.createBufferSource(),
      g = AC.createGain();
    src.buffer = buf;
    src.connect(g);
    g.connect(output());
    g.gain.setValueAtTime(gain, AC.currentTime);
    if (dur) {
      g.gain.setValueAtTime(gain, AC.currentTime + dur * 0.85);
      g.gain.linearRampToValueAtTime(0, AC.currentTime + dur);
    }
    src.start();
    if (dur) src.stop(AC.currentTime + dur + 0.05);
    return src;
  }
  function playPad(ci) {
    currentPadSrcs.forEach((s) => {
      try {
        s.stop();
      } catch (e) {}
    });
    currentPadSrcs = [];
    const barDur = (60 / effectiveBpm()) * 4;
    CHORDS[ci].pad.forEach((n) => {
      const s = playSample(padBufs[n], 0.26, barDur);
      if (s) currentPadSrcs.push(s);
    });
  }
  function assignPitch(g, r, c) {
    const rc = ROWS_CONFIG[r];
    if (rc.type !== "pitched") return;
    const chord = CHORDS[chordIdx],
      scale = rc.register === "hi" ? chord.hiScale : chord.loScale;
    g.pitchGrid[r][c] = scale[Math.floor(Math.random() * scale.length)];
    g.velGrid[r][c] = 0.5 + Math.random() * 0.8;
  }
  function reassignAllPitches(g) {
    for (let r = 0; r < NROWS; r++) {
      if (ROWS_CONFIG[r].type !== "pitched") continue;
      const chord = CHORDS[chordIdx],
        scale =
          ROWS_CONFIG[r].register === "hi" ? chord.hiScale : chord.loScale;
      for (let c = 0; c < g.cols; c++) {
        if (!g.grid[r][c]) continue;
        const cur = g.pitchGrid[r][c]
          ? noteToMidi(g.pitchGrid[r][c])
          : noteToMidi(scale[0]);
        let best = scale[0],
          bestD = 999;
        scale.forEach((n) => {
          const d = Math.abs(noteToMidi(n) - cur);
          if (d < bestD) {
            bestD = d;
            best = n;
          }
        });
        g.pitchGrid[r][c] =
          Math.random() < 0.4
            ? scale[Math.floor(Math.random() * scale.length)]
            : best;
      }
    }
  }
  function triggerPitched(g, r, c, gainMult = 1) {
    if (!loaded || !AC) return;
    const note = g.pitchGrid[r][c];
    if (!note || !melBufs[note]) return;
    setTimeout(
      () => playSample(melBufs[note], g.velGrid[r][c] * gainMult * 0.72, 0.28),
      Math.random() * 12,
    );
  }
  function playRemixSting(focusRow = 4) {
    if (!AC) return;
    const a = ac(),
      t = a.currentTime,
      chord = CHORDS[chordIdx];
    const scale = focusRow === 5 ? chord.loScale : chord.hiScale;
    scale.slice(0, 4).forEach((note, i) => {
      const o = a.createOscillator(),
        f = a.createBiquadFilter(),
        g = master();
      o.type = i % 2 ? "triangle" : "square";
      o.frequency.setValueAtTime(
        440 * Math.pow(2, (noteToMidi(note) - 69) / 12),
        t + i * 0.055,
      );
      f.type = "bandpass";
      f.frequency.setValueAtTime(900 + i * 450, t + i * 0.055);
      f.Q.value = 5;
      g.gain.setValueAtTime(0.0001, t + i * 0.055);
      g.gain.linearRampToValueAtTime(0.11 / (i + 1), t + i * 0.055 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.055 + 0.22);
      o.connect(f);
      f.connect(g);
      o.start(t + i * 0.055);
      o.stop(t + i * 0.055 + 0.24);
    });
    filtNoise({
      type: "highpass",
      freq: 5200,
      q: 0.7,
      t,
      dur: 0.1,
      gain: 0.12,
      drive: 0.16,
    });
  }

  // ---- GRID RENDERER (Win95 / retro pixel style) ----
  const caEl = document.getElementById("ca");
  const cbEl = document.getElementById("cb");
  const ctxA = caEl.getContext("2d");
  const ctxB = cbEl.getContext("2d");
  const LABEL_W = 58,
    TOP_H = 20,
    CELL_H = 28,
    CELL_PAD = 2;
  const COL_COLORS = [
    "#4488cc",
    "#44aa66",
    "#cc8822",
    "#cc3355",
    "#8855cc",
    "#336622",
  ];
  const COL_DARK = [
    "#224488",
    "#227744",
    "#885510",
    "#881133",
    "#552299",
    "#1a4411",
  ];
  const COL_LIGHT = [
    "#88bbee",
    "#88ddaa",
    "#eecc77",
    "#ee7799",
    "#bb99ee",
    "#77aa55",
  ];

  function bevelRect(ctx, x, y, w, h, raised = true) {
    const lt = raised ? "#ffffff" : "#404040",
      rb = raised ? "#404040" : "#ffffff";
    const lt2 = raised ? "#c0c0c0" : "#808080",
      rb2 = raised ? "#808080" : "#c0c0c0";
    ctx.fillStyle = lt;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillStyle = rb;
    ctx.fillRect(x + w - 1, y, 1, h);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillStyle = lt2;
    ctx.fillRect(x + 1, y + 1, w - 2, 1);
    ctx.fillRect(x + 1, y + 1, 1, h - 2);
    ctx.fillStyle = rb2;
    ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
    ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
  }
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }
  function gridHeight() {
    return TOP_H + NROWS * CELL_H;
  }
  function resizeGridCanvas(el) {
    const rect = el.getBoundingClientRect();
    const W = Math.round(rect.width * devicePixelRatio),
      H = gridHeight() * devicePixelRatio;
    if (el.width !== W || el.height !== H) {
      el.width = W;
      el.height = H;
      el.style.height = gridHeight() + "px";
    }
  }
  function drawGrid(el, ctx, g, isA) {
    resizeGridCanvas(el);
    const dpr = devicePixelRatio,
      W = el.getBoundingClientRect().width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#c8c8c8";
    ctx.fillRect(0, 0, W, gridHeight());
    const cols = g.cols,
      cellW = (W - LABEL_W) / cols;
    // Header row
    ctx.fillStyle = "#a0a0a0";
    ctx.fillRect(LABEL_W, 0, W - LABEL_W, TOP_H);
    ctx.font = `bold 7px 'Press Start 2P',monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let c = 0; c < cols; c++) {
      const cx = LABEL_W + c * cellW + cellW / 2;
      ctx.fillStyle = c === g.ph ? "#e8540a" : "#404040";
      ctx.fillText(String(c + 1).padStart(2, "0"), cx, TOP_H * 0.5);
    }
    // Playhead column
    if (g.ph >= 0) {
      ctx.fillStyle = "rgba(232,84,10,0.12)";
      ctx.fillRect(LABEL_W + g.ph * cellW, TOP_H, cellW, NROWS * CELL_H);
      ctx.fillStyle = "#e8540a";
      ctx.fillRect(LABEL_W + g.ph * cellW, TOP_H, cellW, 2);
    }
    // Row separator lines
    for (let r = 0; r <= NROWS; r++) {
      ctx.fillStyle = r === 0 || r === NROWS ? "#404040" : "#b0b0b0";
      ctx.fillRect(0, TOP_H + r * CELL_H, W, 1);
    }
    ctx.fillStyle = "#404040";
    ctx.fillRect(LABEL_W - 1, 0, 1, gridHeight());
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(LABEL_W - 2, 0, 1, gridHeight());

    for (let r = 0; r < NROWS; r++) {
      const rc = ROWS_CONFIG[r],
        rowY = TOP_H + r * CELL_H;
      const col = COL_COLORS[r],
        colDk = COL_DARK[r],
        colLt = COL_LIGHT[r];
      // Label area
      ctx.fillStyle = "#b8b8b8";
      ctx.fillRect(0, rowY, LABEL_W - 1, CELL_H);
      ctx.font = `bold 8px 'Press Start 2P',monospace`;
      ctx.textAlign = "right";
      ctx.fillStyle = col;
      ctx.fillText(rc.abbr.toUpperCase(), LABEL_W - 8, rowY + CELL_H * 0.38);
      ctx.font = `12px 'VT323',monospace`;
      ctx.fillStyle = "#606060";
      ctx.fillText(rc.full, LABEL_W - 8, rowY + CELL_H * 0.72);
      ctx.textAlign = "center";

      for (let c = 0; c < cols; c++) {
        const val = g.grid[r][c],
          isBias = g.biasGrid[r][c];
        const cx = Math.round(LABEL_W + c * cellW) + CELL_PAD,
          cw = Math.round(cellW) - CELL_PAD * 2;
        const cy2 = rowY + CELL_PAD,
          ch = CELL_H - CELL_PAD * 2,
          isActive = c === g.ph;
        if (val === 0 && !isBias) {
          ctx.fillStyle = "#aaaaaa";
          ctx.fillRect(cx, cy2, cw, ch);
          bevelRect(ctx, cx, cy2, cw, ch, false);
        } else {
          ctx.fillStyle =
            val >= 1
              ? col
              : val >= 0.66
                ? colDk
                : `rgba(${hexToRgb(col)},${val >= 0.33 ? 0.55 : 0.28})`;
          ctx.fillRect(cx, cy2, cw, ch);
          // Dither stripes for Grid A probability
          if (isA && val > 0 && val < 1) {
            ctx.fillStyle = col;
            ctx.globalAlpha = 0.35;
            for (let sy = cy2 + 2; sy < cy2 + ch - 2; sy += 3)
              ctx.fillRect(cx + 2, sy, Math.round((cw - 4) * val), 1);
            ctx.globalAlpha = 1;
          }
          if (isBias) {
            ctx.fillStyle = "#ff8800";
            ctx.fillRect(cx, cy2, cw, 1);
            ctx.fillRect(cx, cy2, 1, ch);
            ctx.fillStyle = "#884400";
            ctx.fillRect(cx + cw - 1, cy2, 1, ch);
            ctx.fillRect(cx, cy2 + ch - 1, cw, 1);
          } else if (isActive) {
            ctx.fillStyle = "#ff4400";
            ctx.fillRect(cx, cy2, cw, 1);
            ctx.fillRect(cx, cy2, 1, ch);
            ctx.fillStyle = "#882200";
            ctx.fillRect(cx + cw - 1, cy2, 1, ch);
            ctx.fillRect(cx, cy2 + ch - 1, cw, 1);
          } else {
            bevelRect(ctx, cx, cy2, cw, ch, true);
            if (val >= 0.66) {
              ctx.fillStyle = colLt;
              ctx.globalAlpha = 0.5;
              ctx.fillRect(cx + 2, cy2 + 2, cw - 4, 1);
              ctx.fillRect(cx + 2, cy2 + 2, 1, ch - 4);
              ctx.globalAlpha = 1;
            }
          }
          if (val && ROWS_CONFIG[r].type === "pitched" && g.pitchGrid[r][c]) {
            ctx.font = `11px 'VT323',monospace`;
            ctx.fillStyle = val >= 0.66 ? "#ffffff" : "#eeeeee";
            ctx.globalAlpha = 0.9;
            ctx.fillText(g.pitchGrid[r][c], cx + cw / 2, cy2 + ch / 2 + 1);
            ctx.globalAlpha = 1;
          }
        }
      }
    }
    bevelRect(ctx, 0, 0, W, gridHeight(), true);
  }
  function render() {
    drawGrid(caEl, ctxA, gA, true);
    drawGrid(cbEl, ctxB, gB, false);
    updateChordPills();
    updateStrudel();
    drawInterference();
    updateCouplingBadge();
  }

  // Grids are now read-only visual feedback for the automatic sequencer.

  // ---- INTERFERENCE (retro CRT oscilloscope) ----
  const intCanvas = document.getElementById("int-canvas");
  const intCtx = intCanvas.getContext("2d");
  function drawInterference() {
    const W = intCanvas.offsetWidth,
      H = intCanvas.offsetHeight || 80;
    if (intCanvas.width !== W || intCanvas.height !== H) {
      intCanvas.width = W;
      intCanvas.height = H;
    }
    const phFracA = gA.ph / COLS_A,
      phFracB = gB.ph / gB.cols;
    const phaseOffset = Math.abs(phFracA - phFracB);
    const convergence = Math.max(0, 1 - phaseOffset / 0.15);
    // Dark CRT background
    intCtx.fillStyle = "#0a100a";
    intCtx.fillRect(0, 0, W, H);
    // Scanlines
    intCtx.fillStyle = "rgba(0,0,0,0.28)";
    for (let sy = 0; sy < H; sy += 2) intCtx.fillRect(0, sy, W, 1);
    // CRT grid
    intCtx.strokeStyle = "rgba(0,80,0,0.35)";
    intCtx.lineWidth = 1;
    for (let i = 1; i < 16; i++) {
      intCtx.beginPath();
      intCtx.moveTo((i / 16) * W, 0);
      intCtx.lineTo((i / 16) * W, H);
      intCtx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      intCtx.beginPath();
      intCtx.moveTo(0, (i / 4) * H);
      intCtx.lineTo(W, (i / 4) * H);
      intCtx.stroke();
    }
    const laneH = Math.floor(H * 0.58),
      midY = laneH / 2,
      step = W / INT_HISTORY;
    // Waveform fill
    intCtx.fillStyle =
      convergence > 0.5
        ? `rgba(232,84,10,${0.12 + convergence * 0.18})`
        : "rgba(0,200,60,0.10)";
    intCtx.beginPath();
    intCtx.moveTo(0, midY);
    for (let i = 0; i < INT_HISTORY; i++) {
      const amp = interferenceHistory[i] * (midY - 3);
      intCtx.lineTo(i * step, midY - amp);
    }
    for (let i = INT_HISTORY - 1; i >= 0; i--) {
      const amp = interferenceHistory[i] * (midY - 3);
      intCtx.lineTo(i * step, midY + amp);
    }
    intCtx.closePath();
    intCtx.fill();
    // Pixel waveform line
    for (let i = 0; i < INT_HISTORY - 1; i++) {
      const amp = interferenceHistory[i] * (midY - 3),
        x = Math.round(i * step),
        y = Math.round(midY - amp);
      intCtx.fillStyle =
        convergence > 0.5
          ? `rgba(255,${Math.round(140 + convergence * 115)},0,${0.7 + convergence * 0.3})`
          : `rgba(0,${Math.round(180 + interferenceHistory[i] * 75)},30,0.85)`;
      intCtx.fillRect(x, y, Math.max(1, Math.round(step)), 2);
    }
    // Phosphor afterglow
    intCtx.globalAlpha = 0.25;
    for (let i = 0; i < INT_HISTORY - 1; i++) {
      const amp = interferenceHistory[i] * (midY - 3),
        x = Math.round(i * step),
        y = Math.round(midY - amp);
      intCtx.fillStyle = "#00ff44";
      intCtx.fillRect(x, y - 1, Math.max(1, Math.round(step)), 1);
    }
    intCtx.globalAlpha = 1;
    // Playhead beams
    const xA = Math.round(phFracA * W),
      xB = Math.round(phFracB * W);
    intCtx.fillStyle = "#e8540a";
    intCtx.fillRect(xA, 0, 2, laneH);
    intCtx.fillStyle = "#e8540a";
    intCtx.fillRect(xA + 3, 2, 14, 10);
    intCtx.fillStyle = "#000";
    intCtx.font = `bold 7px 'Press Start 2P',monospace`;
    intCtx.textAlign = "left";
    intCtx.textBaseline = "top";
    intCtx.fillText("A", xA + 5, 3);
    intCtx.fillStyle = "#4488cc";
    intCtx.fillRect(xB, 0, 2, laneH);
    intCtx.fillStyle = "#4488cc";
    intCtx.fillRect(xB + 3, 2, 14, 10);
    intCtx.fillStyle = "#fff";
    intCtx.fillText("B", xB + 5, 3);
    // Convergence burst
    if (convergence > 0.85) {
      const midX = Math.round((xA + xB) / 2),
        fa = (convergence - 0.85) / 0.15;
      intCtx.fillStyle = `rgba(255,${Math.round(80 + fa * 175)},0,${fa * 0.6})`;
      for (let bx = midX - 40; bx < midX + 40; bx += 4) {
        const bh = Math.round(fa * (laneH * 0.8) * Math.random());
        intCtx.fillRect(bx, laneH / 2 - bh / 2, 3, bh);
      }
      const now = Date.now();
      if (now - lastFlash > 180) {
        lastFlash = now;
        ripples.push({
          x: midX,
          y: laneH / 2,
          age: 0,
          maxAge: 28,
          intensity: fa,
        });
        for (let i = 0; i < 6 + Math.round(fa * 6); i++) {
          const a = Math.random() * Math.PI * 2,
            sp = 1 + Math.random() * 3;
          particles2.push({
            x: midX,
            y: laneH / 2,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 1,
          });
        }
      }
    }
    // Ripples (pixel squares)
    ripples = ripples.filter((rp) => rp.age < rp.maxAge);
    ripples.forEach((rp) => {
      const t = rp.age / rp.maxAge,
        sz = Math.round(t * 24 * rp.intensity);
      intCtx.fillStyle = `rgba(232,84,10,${(1 - t) * 0.7})`;
      intCtx.fillRect(rp.x - sz, rp.y - sz, sz * 2, 2);
      intCtx.fillRect(rp.x - sz, rp.y + sz, sz * 2, 2);
      intCtx.fillRect(rp.x - sz, rp.y - sz, 2, sz * 2);
      intCtx.fillRect(rp.x + sz, rp.y - sz, 2, sz * 2);
      rp.age++;
    });
    // Particles (pixel squares)
    particles2 = particles2.filter((p) => p.life > 0.05);
    particles2.forEach((p) => {
      const sz = Math.max(1, Math.round(p.life * 3));
      intCtx.fillStyle = p.life > 0.5 ? "#ff8800" : "#cc4400";
      intCtx.globalAlpha = p.life;
      intCtx.fillRect(Math.round(p.x), Math.round(p.y), sz, sz);
      intCtx.globalAlpha = 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life *= 0.86;
    });
    // Lane 2: phase sine waves (pixel dots)
    const l2Y = laneH + 2,
      l2H = H - l2Y,
      midY2 = l2Y + l2H / 2;
    intCtx.fillStyle = "#060c06";
    intCtx.fillRect(0, l2Y, W, l2H);
    intCtx.fillStyle = "#004400";
    intCtx.fillRect(0, l2Y, W, 1);
    [
      { col: "#e8540a", freq: COLS_A, phase: phFracA },
      { col: "#4488cc", freq: gB.cols, phase: phFracB },
    ].forEach(({ col, freq, phase }) => {
      const amp2 = l2H / 2 - 2;
      for (let px = 0; px < W; px += 2) {
        const t = px / W,
          y2 = Math.round(
            midY2 +
              Math.sin(
                (t * Math.PI * 2 * freq) / COLS_A + phase * Math.PI * 2,
              ) *
                amp2,
          );
        intCtx.fillStyle = col;
        intCtx.fillRect(px, y2, 2, 2);
      }
    });
    // Outer bevel
    intCtx.fillStyle = "#ffffff";
    intCtx.fillRect(0, 0, W, 1);
    intCtx.fillRect(0, 0, 1, H);
    intCtx.fillStyle = "#404040";
    intCtx.fillRect(0, H - 1, W, 1);
    intCtx.fillRect(W - 1, 0, 1, H);
    document.getElementById("phase-display").textContent =
      `ALIGN ${(convergence * 100).toFixed(0)}% · OFFSET ${phaseOffset.toFixed(3)}`;
  }

  // ---- CHORD PILLS ----
  const chordRow = document.getElementById("chord-row");
  const chordPills = [];
  if (chordRow) {
    CHORDS.forEach((ch, i) => {
      const p = document.createElement("div");
      p.className = "chord-pill" + (i === 0 ? " active" : "");
      p.textContent = ch.name;
      chordRow.appendChild(p);
      chordPills.push(p);
    });
  }
  function updateChordPills() {
    chordPills.forEach((p, i) => p.classList.toggle("active", i === chordIdx));
  }
  function updateStrudel() {
    const box = document.getElementById("strudel-box");
    if (!box) return;
    const steps = [];
    for (let c = 0; c < COLS_A; c++)
      steps.push(
        gA.grid[4][c] && gA.pitchGrid[4][c]
          ? gA.pitchGrid[4][c].toLowerCase()
          : "~",
      );
    box.textContent = `note("${steps.join(" ")}")`;
  }

  // ---- EVOLVE ----
  function evolveGrid(g) {
    const { chaos, density, rep, smooth } = params,
      tod = getTODBlend();
    const effChaos = Math.max(
        0,
        Math.min(1, chaos + tod.chaosAdd + orbBoost * 0.16),
      ),
      effDensity = Math.max(
        0,
        Math.min(1, density + tod.densityAdd + orbBoost * 0.12),
      );
    g.grid = g.grid.map((row, r) =>
      row.map((cell, c) => {
        const isPitched = ROWS_CONFIG[r].type === "pitched";
        let bias = 0;
        for (
          let br = Math.max(0, r - 1);
          br <= Math.min(NROWS - 1, r + 1);
          br++
        )
          for (
            let bc = Math.max(0, c - 1);
            bc <= Math.min(g.cols - 1, c + 1);
            bc++
          )
            if (g.biasGrid[br][bc]) bias += 0.12;
        bias = Math.min(bias, 0.4);
        const pull = rowPull[r] * 0.3;
        let p = cell
          ? isPitched
            ? 0.6 + rep * 0.2
            : 0.55 + rep * 0.15
          : isPitched
            ? effDensity * 0.25
            : effDensity * 0.4;
        p += bias + pull;
        const prev = (c - 1 + g.cols) % g.cols,
          next = (c + 1) % g.cols,
          nb = (g.grid[r][prev] + g.grid[r][next]) / 2;
        if (cell)
          p = p * (1 - smooth * 0.15) + smooth * 0.15 * (nb > 0.5 ? 0.9 : 0.1);
        p += (Math.random() - 0.5) * effChaos;
        const nxt = Math.random() < Math.max(0.02, Math.min(0.97, p)) ? 1 : 0;
        if (nxt && !cell && isPitched) assignPitch(g, r, c);
        if (nxt && cell && isPitched && Math.random() < 0.15)
          assignPitch(g, r, c);
        return nxt;
      }),
    );
  }
  function applyCoupling() {
    const effC = Math.min(1, coupling + orbBoost * 0.32);
    if (effC < 0.01) return;
    for (let r = 0; r < NROWS; r++)
      for (let c = 0; c < COLS_A; c++) {
        const cB = Math.round((c / COLS_A) * gB.cols) % gB.cols;
        if (gA.grid[r][c] && !gB.grid[r][cB] && Math.random() < effC * 0.14) {
          gB.grid[r][cB] = 1;
          assignPitch(gB, r, cB);
        }
        if (gB.grid[r][cB] && !gA.grid[r][c] && Math.random() < effC * 0.08) {
          gA.grid[r][c] = PROB_LEVELS[1];
          assignPitch(gA, r, c);
        }
      }
  }
  function recordInterference() {
    const phFracA = gA.ph / COLS_A,
      phFracB = gB.ph / gB.cols,
      inPhase = Math.abs(phFracA - phFracB) < 1 / Math.max(COLS_A, gB.cols);
    let hits = 0;
    if (inPhase)
      for (let r = 0; r < NROWS; r++)
        if (gA.grid[r][gA.ph] && gB.grid[r][gB.ph]) hits++;
    const score = inPhase ? hits / NROWS : 0;
    interferenceHistory.push(score);
    if (interferenceHistory.length > INT_HISTORY) interferenceHistory.shift();
    if (score > 0) {
      collisionCount++;
      document.getElementById("sb-coll").textContent = collisionCount;
    }
  }

  // ---- MASTER STEP ----
  function masterStep() {
    gA.ph = (gA.ph + 1) % COLS_A;
    if (gA.ph === 0) {
      chordIdx = nextChordIdx;
      nextChordIdx = markovNextChord(chordIdx);
      reassignAllPitches(gA);
      reassignAllPitches(gB);
      if (loaded) playPad(chordIdx);
      barCount++;
      document.getElementById("sb-bar").textContent = barCount;
      refreshChordHud();
      todTransition.t = Math.min(1, todTransition.t + 0.15);
    }
    const inRemixDrop = remixDropTicks > 0;
    if (inRemixDrop) remixDropTicks--;
    if (!inRemixDrop)
      for (let r = 0; r < NROWS; r++) {
        if (!gA.grid[r][gA.ph]) continue;
        if (ROWS_CONFIG[r].type === "drum") playDrum(ROWS_CONFIG[r].id, 1.0);
        else triggerPitched(gA, r, gA.ph, 1.0);
      }
    masterTick++;
    if (masterTick >= nextBTick) {
      nextBTick = masterTick + COLS_A / gB.cols;
      gB.ph = (gB.ph + 1) % gB.cols;
      if (!inRemixDrop)
        for (let r = 0; r < NROWS; r++) {
          if (!gB.grid[r][gB.ph]) continue;
          if (ROWS_CONFIG[r].type === "drum") playDrum(ROWS_CONFIG[r].id, 0.25);
          else triggerPitched(gB, r, gB.ph, 0.25);
        }
      if (!frozen && gB.ph === 0) evolveGrid(gB);
    }
    if (!frozen) {
      evolveGrid(gA);
      applyCoupling();
    }
    recordInterference();
    orbBoost *= 0.93;
    if (orbBoost < 0.018) orbBoost = 0;
    render();
    document.getElementById("sb-a").textContent = String(gA.ph + 1).padStart(
      2,
      "0",
    );
    document.getElementById("sb-b").textContent = String(gB.ph + 1).padStart(
      2,
      "0",
    );
  }

  // ---- ROW PULL UI ----
  const rpWrap = document.getElementById("row-pull-wrap");
  if (rpWrap) {
    ROWS_CONFIG.forEach((rc, r) => {
      const div = document.createElement("div");
      div.className = "pull-item";
      const nm = document.createElement("div");
      nm.className = "rp-name";
      nm.style.color = COL_COLORS[r];
      nm.textContent = rc.abbr.toUpperCase();
      const sub = document.createElement("div");
      sub.className = "rp-sub";
      sub.textContent = rc.full;
      const sl = document.createElement("input");
      sl.type = "range";
      sl.min = -50;
      sl.max = 50;
      sl.value = 0;
      const val = document.createElement("div");
      val.className = "rp-val";
      val.textContent = "0.00";
      sl.oninput = () => {
        rowPull[r] = parseInt(sl.value) / 50;
        val.textContent = rowPull[r].toFixed(2);
      };
      div.append(nm, sub, sl, val);
      rpWrap.appendChild(div);
    });
  }

  function randomizeGrid(g) {
    for (let r = 0; r < NROWS; r++) {
      const isPitched = ROWS_CONFIG[r].type === "pitched";
      const threshold = isPitched ? 0.22 : 0.34;
      for (let c = 0; c < g.cols; c++) {
        const on = Math.random() < threshold;
        g.grid[r][c] = on
          ? isPitched
            ? Math.random() < 0.55
              ? PROB_LEVELS[1]
              : 1
            : Math.random() < 0.3
              ? PROB_LEVELS[2]
              : 1
          : 0;
        g.biasGrid[r][c] = false;
        g.pitchGrid[r][c] = null;
        g.velGrid[r][c] = 0.7 + Math.random() * 0.5;
        if (g.grid[r][c] && isPitched) assignPitch(g, r, c);
      }
    }
    g.ph = 0;
  }

  function randomizeBothGrids() {
    randomizeGrid(gA);
    randomizeGrid(gB);
    collisionCount = 0;
    document.getElementById("sb-coll").textContent = collisionCount;
    masterTick = 0;
    nextBTick = COLS_A / gB.cols;
    refreshChordHud();
    render();
  }

  function retimePlayback() {
    if (!playing) return;
    clearInterval(iv);
    iv = setInterval(masterStep, (60 / effectiveBpm() / 4) * 1000);
  }
  function updateGridBRatioLabel() {
    const tag = document.getElementById("b-tag");
    if (tag)
      tag.textContent = `${gB.cols} steps · ${(gB.cols / COLS_A).toFixed(3)}×`;
    const out = document.getElementById("grid-b-ratio-val");
    if (out) out.textContent = `${gB.cols}/16`;
  }
  function setGridBCols(cols) {
    cols = Math.max(8, Math.min(16, cols | 0));
    if (cols === gB.cols) return;
    COLS_B = cols;
    gB = makeGrid(COLS_B);
    gB.ph = 0;
    for (let r = 0; r < NROWS; r++)
      for (let c = 0; c < COLS_B; c++)
        if (Math.random() < 0.22) {
          gB.grid[r][c] = 1;
          if (ROWS_CONFIG[r].type === "pitched") assignPitch(gB, r, c);
        }
    masterTick = 0;
    nextBTick = COLS_A / gB.cols;
    updateGridBRatioLabel();
    render();
  }
  function setTOD(tod) {
    if (!TOD_CONFIGS[tod] || tod === currentTOD) return;
    todTransition = { from: currentTOD, to: tod, t: 0 };
    currentTOD = tod;
    document
      .querySelectorAll(".tod-btn")
      .forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.tod === tod),
      );
    retimePlayback();
  }

  // ---- SIDEBAR CONTROL PANELS ----
  const desktopPanels = document.getElementById("desktop-panels");
  const controlWindow = document.getElementById("control-window");
  const controlWindowTitle = document.getElementById("control-window-title");
  const controlWindowClose = document.getElementById("control-window-close");
  const randomizeGridBtn = document.getElementById("randomize-grid-btn");
  const paneTitles = { tempo: "tempo", rowpull: "row pull" };
  function openControlPane(name) {
    if (!desktopPanels || !controlWindow) return;
    desktopPanels.classList.add("is-hidden");
    controlWindow.classList.remove("is-hidden");
    controlWindowTitle.textContent = paneTitles[name] || "controls";
    document
      .querySelectorAll(".control-pane")
      .forEach((pane) =>
        pane.classList.toggle("is-active", pane.dataset.pane === name),
      );
  }
  function closeControlPane() {
    if (!desktopPanels || !controlWindow) return;
    controlWindow.classList.add("is-hidden");
    desktopPanels.classList.remove("is-hidden");
    document
      .querySelectorAll(".control-pane")
      .forEach((pane) => pane.classList.remove("is-active"));
  }
  if (desktopPanels)
    desktopPanels
      .querySelectorAll("[data-panel]")
      .forEach((btn) =>
        btn.addEventListener("click", () => openControlPane(btn.dataset.panel)),
      );
  if (controlWindowClose)
    controlWindowClose.addEventListener("click", closeControlPane);
  if (randomizeGridBtn)
    randomizeGridBtn.addEventListener("click", randomizeBothGrids);

  function makeSliderRow({
    parent,
    id,
    label,
    min,
    max,
    step,
    value,
    format,
    onInput,
  }) {
    const row = document.createElement("div");
    row.className = "panel-slider";
    const lbl = document.createElement("label");
    lbl.htmlFor = id;
    lbl.textContent = label;
    const input = document.createElement("input");
    input.id = id;
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    const out = document.createElement("output");
    out.htmlFor = id;
    out.textContent = format(value);
    input.addEventListener("input", () => {
      const raw =
        input.step && input.step !== "1"
          ? parseFloat(input.value)
          : parseInt(input.value, 10);
      onInput(raw);
      out.textContent = format(raw);
    });
    row.append(lbl, input, out);
    parent.appendChild(row);
    return input;
  }

  const tempoControls = document.getElementById("tempo-controls");
  if (tempoControls) {
    makeSliderRow({
      parent: tempoControls,
      id: "tempo-slider",
      label: "tempo",
      min: 72,
      max: 144,
      step: 1,
      value: baseBpm,
      format: (v) => String(v),
      onInput: (v) => {
        baseBpm = v;
        retimePlayback();
      },
    });
    makeSliderRow({
      parent: tempoControls,
      id: "chaos-slider",
      label: "chaos",
      min: 0,
      max: 100,
      step: 1,
      value: Math.round(params.chaos * 100),
      format: (v) => (v / 100).toFixed(2),
      onInput: (v) => {
        params.chaos = v / 100;
      },
    });
    makeSliderRow({
      parent: tempoControls,
      id: "density-slider",
      label: "density",
      min: 0,
      max: 100,
      step: 1,
      value: Math.round(params.density * 100),
      format: (v) => (v / 100).toFixed(2),
      onInput: (v) => {
        params.density = v / 100;
      },
    });
    makeSliderRow({
      parent: tempoControls,
      id: "repeat-slider",
      label: "repeat",
      min: 0,
      max: 100,
      step: 1,
      value: Math.round(params.rep * 100),
      format: (v) => (v / 100).toFixed(2),
      onInput: (v) => {
        params.rep = v / 100;
      },
    });
    makeSliderRow({
      parent: tempoControls,
      id: "smooth-slider",
      label: "smooth",
      min: 0,
      max: 100,
      step: 1,
      value: Math.round(params.smooth * 100),
      format: (v) => (v / 100).toFixed(2),
      onInput: (v) => {
        params.smooth = v / 100;
      },
    });
  }
  const interferenceControls = document.getElementById("interference-controls");
  if (interferenceControls) {
    makeSliderRow({
      parent: interferenceControls,
      id: "gridb-ratio-mini",
      label: "b ratio",
      min: 8,
      max: 16,
      step: 1,
      value: COLS_B,
      format: (v) => `${v}/16`,
      onInput: (v) => {
        setGridBCols(v);
      },
    });
    makeSliderRow({
      parent: interferenceControls,
      id: "coupling-slider",
      label: "coupling",
      min: 0,
      max: 100,
      step: 1,
      value: Math.round(coupling * 100),
      format: (v) => (v / 100).toFixed(2),
      onInput: (v) => {
        coupling = v / 100;
        updateCouplingBadge();
      },
    });
  }
  updateGridBRatioLabel();

  // ---- CONTROLS ----
  document.getElementById("play").addEventListener("click", async function () {
    const ready = await unlockAudio();
    if (!ready) return;
    if (!AC) return;
    if (playing) {
      clearInterval(iv);
      playing = false;
      this.classList.remove("playing");
      this.setAttribute("aria-label", "Play");
      currentPadSrcs.forEach((s) => {
        try {
          s.stop();
        } catch (e) {}
      });
      if (!loaded) initAudio();
    } else {
      if (!loaded) await initAudio();
      nextChordIdx = markovNextChord(chordIdx);
      if (loaded) playPad(chordIdx);
      masterTick = 0;
      nextBTick = COLS_A / gB.cols;
      const effBpm = effectiveBpm();
      iv = setInterval(masterStep, (60 / effBpm / 4) * 1000);
      playing = true;
      this.classList.add("playing");
      this.setAttribute("aria-label", "Pause");
      refreshChordHud();
    }
  });
  document
    .getElementById("intro-start")
    .addEventListener("click", () =>
      document.getElementById("intro-overlay").classList.add("is-hidden"),
    );
  document
    .getElementById("intro-open")
    .addEventListener("click", () =>
      document.getElementById("intro-overlay").classList.remove("is-hidden"),
    );
  document.getElementById("intro-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget)
      e.currentTarget.classList.add("is-hidden");
  });

  const game = window.createGameModule({
    rowsConfig: ROWS_CONFIG,
    zones: ZONES,
    colColors: COL_COLORS,
    nrows: NROWS,
    getTODBlend,
    getTODTransition: () => todTransition,
    setTOD,
    setUnderwater,
    getUnderwaterState: () => ({
      active: underwaterActive,
      depth01: underwaterDepth01,
    }),
    applyOrbMusicalImpact,
    renderSequencer: render,
  });
  game.init();

  // Animation loop
  function animLoop() {
    if (ripples.length || particles2.length) drawInterference();
    requestAnimationFrame(animLoop);
  }
  requestAnimationFrame(animLoop);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => render(), 120);
  });
  for (let r = 0; r < NROWS; r++)
    for (let c = 0; c < COLS_B; c++)
      if (Math.random() < 0.22) {
        gB.grid[r][c] = 1;
        if (ROWS_CONFIG[r].type === "pitched") assignPitch(gB, r, c);
      }
  refreshChordHud();
  render();
})();

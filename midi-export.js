(function () {
  "use strict";

  function writeVarLen(value, out) {
    let buffer = value & 0x7f;
    while ((value >>= 7)) {
      buffer <<= 8;
      buffer |= (value & 0x7f) | 0x80;
    }
    while (true) {
      out.push(buffer & 0xff);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
  }

  function push16(out, value) {
    out.push((value >> 8) & 0xff, value & 0xff);
  }

  function push32(out, value) {
    out.push(
      (value >> 24) & 0xff,
      (value >> 16) & 0xff,
      (value >> 8) & 0xff,
      value & 0xff,
    );
  }

  function pushText(out, text) {
    for (let i = 0; i < text.length; i++) out.push(text.charCodeAt(i));
  }

  function makeTrackChunk(events, tpqn, tempoBpm, trackName) {
    const bytes = [];
    events.sort((a, b) => a.tick - b.tick || a.sort - b.sort);
    let lastTick = 0;

    writeVarLen(0, bytes);
    bytes.push(0xff, 0x03, trackName.length);
    pushText(bytes, trackName);

    const tempo = Math.round(60000000 / tempoBpm);
    writeVarLen(0, bytes);
    bytes.push(0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff);

    writeVarLen(0, bytes);
    bytes.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

    events.forEach((event) => {
      writeVarLen(event.tick - lastTick, bytes);
      lastTick = event.tick;
      bytes.push(event.status, event.data1, event.data2);
    });

    writeVarLen(0, bytes);
    bytes.push(0xff, 0x2f, 0x00);

    const chunk = [];
    pushText(chunk, "MTrk");
    push32(chunk, bytes.length);
    chunk.push(...bytes);
    return chunk;
  }

  function downloadBytes(bytes, filename) {
    const blob = new Blob([new Uint8Array(bytes)], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.createMidiExporter = function createMidiExporter({
    rowsConfig,
    noteToMidi,
    getState,
    getTempo,
    setStatus,
  }) {
    const TPQN = 624;
    const UNITS_PER_CYCLE = 208;
    const TICKS_PER_UNIT = 12;
    const A_UNIT_STEP = 13;
    const B_UNIT_STEP = 16;
    const DRUM_NOTES = { bd: 36, sd: 38, hh: 42, cp: 39 };

    function clampVelocity(value) {
      return Math.max(24, Math.min(127, Math.round(value)));
    }

    function velocityFromCell(cell, vel, isPitched) {
      const level = typeof cell === "number" ? cell : cell ? 1 : 0;
      if (level <= 0) return 0;
      const base = isPitched ? 58 : 72;
      const mult = vel || 1;
      return clampVelocity(base + level * mult * 48);
    }

    function pushGridEvents(events, grid, unitStep, channel, durationTicks) {
      for (let unit = 0; unit < UNITS_PER_CYCLE; unit += unitStep) {
        const step = Math.floor(unit / unitStep) % grid.cols;
        const tick = unit * TICKS_PER_UNIT;
        for (let r = 0; r < rowsConfig.length; r++) {
          const cell = grid.grid[r][step];
          if (!cell) continue;
          const row = rowsConfig[r];
          const isPitched = row.type === "pitched";
          const velocity = velocityFromCell(cell, grid.velGrid[r][step], isPitched);
          if (!velocity) continue;

          let midi;
          if (isPitched) {
            const note = grid.pitchGrid[r][step];
            if (!note) continue;
            midi = noteToMidi(note);
          } else {
            midi = DRUM_NOTES[row.id];
            if (!midi) continue;
          }

          events.push({
            tick,
            status: 0x90 | channel,
            data1: midi,
            data2: velocity,
            sort: 1,
          });
          events.push({
            tick: tick + durationTicks,
            status: 0x80 | channel,
            data1: midi,
            data2: 0,
            sort: 0,
          });
        }
      }
    }

    function exportCurrentLoop() {
      const { gA, gB, chordName } = getState();
      const tempo = getTempo();
      const events = [];

      pushGridEvents(events, gA, A_UNIT_STEP, 0, 72);
      pushGridEvents(events, gB, B_UNIT_STEP, 0, 72);
      pushGridEvents(events, gA, A_UNIT_STEP, 9, 36);
      pushGridEvents(events, gB, B_UNIT_STEP, 9, 36);

      const header = [];
      pushText(header, "MThd");
      push32(header, 6);
      push16(header, 0);
      push16(header, 1);
      push16(header, TPQN);

      const safeChord = (chordName || "grid")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const track = makeTrackChunk(events, TPQN, tempo, "Miffy Grid Export");

      downloadBytes([...header, ...track], `miffy-sound-world-${safeChord || "loop"}.mid`);
      if (setStatus) setStatus("midi exported");
    }

    return { exportCurrentLoop };
  };
})();

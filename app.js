(() => {
  'use strict';
  
  // ---- CONFIG ----
  const ROWS_CONFIG = [
    { id:'bd',   abbr:'bd',   full:'kick',      type:'drum',    color:'#579fbd', glow:'rgba(87,159,189,.35)'  },
    { id:'sd',   abbr:'sd',   full:'snare',     type:'drum',    color:'#4a9d82', glow:'rgba(74,157,130,.35)'  },
    { id:'hh',   abbr:'hh',   full:'hi-hat',    type:'drum',    color:'#d99a5f', glow:'rgba(217,154,95,.35)'  },
    { id:'cp',   abbr:'cp',   full:'clap',      type:'drum',    color:'#d87590', glow:'rgba(216,117,144,.35)' },
    { id:'m1',   abbr:'hi',   full:'melody hi', type:'pitched', register:'hi', color:'#8f8fbc', glow:'rgba(143,143,188,.35)' },
    { id:'m2',   abbr:'lo',   full:'melody lo', type:'pitched', register:'lo', color:'#6f8f63', glow:'rgba(111,143,99,.35)'  },
  ];
  const NROWS = ROWS_CONFIG.length;
  const COLS_A = 16;
  let COLS_B = 13;
  
  const PROB_LEVELS = [0, .33, .66, 1]; // grid A uses probability levels; grid B is binary
  
  // ---- CHORD DATA ----
  const CHORDS = [
    { name:'Cmaj',  pad:['C3','E3','G3'],  hiScale:['E4','G4','A4','C5','E5'],    loScale:['C3','D3','E3','G3','A3'] },
    { name:'Amin',  pad:['A2','C3','E3'],  hiScale:['A4','C5','D5','E5','G5'],    loScale:['A2','C3','E3','G3','A3'] },
    { name:'Fmaj',  pad:['F2','A2','C3'],  hiScale:['C5','D5','F5','G5','A5'],    loScale:['F2','G2','A2','C3','D3'] },
    { name:'Gmaj',  pad:['G2','B2','D3'],  hiScale:['G4','A4','B4','D5','G5'],    loScale:['G2','A2','B2','D3','G3'] },
    { name:'Dmin',  pad:['D3','F3','A3'],  hiScale:['D4','F4','A4','C5','D5'],    loScale:['D3','F3','A3','C4','D4'] },
    { name:'Emin',  pad:['E3','G3','B3'],  hiScale:['E4','G4','A4','B4','E5'],    loScale:['E2','G2','B2','D3','E3'] },
    { name:'Bdim',  pad:['B2','D3','F3'],  hiScale:['B4','D5','F5','A5','B5'],    loScale:['B2','D3','F3','A3','B3'] },
    { name:'Csus4', pad:['C3','F3','G3'],  hiScale:['C5','F5','G5','A5','C6'],    loScale:['C3','F3','G3','A3','C4'] },
  ];
  const CHORD_TRANS = [
    [0.05,0.25,0.15,0.25,0.10,0.10,0.05,0.05],
    [0.30,0.05,0.10,0.10,0.05,0.20,0.10,0.10],
    [0.20,0.10,0.05,0.30,0.15,0.10,0.05,0.05],
    [0.35,0.15,0.10,0.05,0.10,0.10,0.10,0.05],
    [0.10,0.15,0.10,0.20,0.05,0.25,0.10,0.05],
    [0.15,0.20,0.05,0.15,0.15,0.05,0.15,0.10],
    [0.10,0.10,0.10,0.10,0.10,0.15,0.05,0.30],
    [0.30,0.10,0.15,0.15,0.10,0.10,0.05,0.05],
  ];
  function markovNextChord(i) {
    const w = CHORD_TRANS[i]; let r = Math.random();
    for (let j = 0; j < w.length; j++) { r -= w[j]; if (r <= 0) return j; }
    return 0;
  }
  
  // ---- DRUM KITS ----
  const DRUM_KITS = {
    analog:{ bd:{wave:'sine',start:132,end:43,dur:.27,gain:.9,click:.16,drive:0},    sd:{tone:185,noiseFreq:1900,dur:.18,gain:.44,body:.23},       hh:{freq:7200,dur:.055,gain:.28,metal:0},      cp:{freq:2400,dur:.13,gain:.36,spread:.022}, bass:{wave:'sine',dur:.34,gain:.58,drop:.54,drive:.04} },
    '808': { bd:{wave:'sine',start:96,end:34,dur:.52,gain:.94,click:.08,drive:.12},  sd:{tone:170,noiseFreq:1500,dur:.22,gain:.4,body:.3},        hh:{freq:8500,dur:.075,gain:.24,metal:.2},    cp:{freq:2050,dur:.16,gain:.32,spread:.028}, bass:{wave:'sine',dur:.46,gain:.72,drop:.48,drive:.18} },
    dust:  { bd:{wave:'triangle',start:118,end:48,dur:.24,gain:.76,click:.28,drive:.28}, sd:{tone:155,noiseFreq:1200,dur:.2,gain:.38,body:.18},   hh:{freq:5200,dur:.07,gain:.2,metal:0},       cp:{freq:1700,dur:.15,gain:.28,spread:.032}, bass:{wave:'triangle',dur:.28,gain:.52,drop:.66,drive:.25} },
    metal: { bd:{wave:'sine',start:140,end:52,dur:.2,gain:.75,click:.24,drive:0},    sd:{tone:245,noiseFreq:2600,dur:.16,gain:.38,body:.18},       hh:{freq:9000,dur:.09,gain:.26,metal:1},      cp:{freq:3200,dur:.12,gain:.32,spread:.018}, bass:{wave:'sawtooth',dur:.24,gain:.5,drop:.72,drive:.1} },
    bit:   { bd:{wave:'square',start:110,end:39,dur:.18,gain:.68,click:.32,drive:.7}, sd:{tone:210,noiseFreq:2300,dur:.13,gain:.34,body:.16,drive:.75}, hh:{freq:7600,dur:.045,gain:.22,metal:.35,drive:.75}, cp:{freq:2800,dur:.09,gain:.28,spread:.016,drive:.75}, bass:{wave:'square',dur:.18,gain:.42,drop:.58,drive:.65} },
  };
  const KIT_DESCS = { analog:'analog drum voices','808':'deep 808 drum machine',dust:'dusty sampled drums',metal:'metallic synthetic percussion',bit:'bitcrushed digital drums' };
  let drumKit = 'analog';
  
  // ---- STATE ----
  let playing = false, frozen = false, paintMode = 'draw';
  let chordIdx = 0, nextChordIdx = 0, barCount = 0;
  let params = { chaos:.18, density:.30, rep:.55, smooth:.45 };
  let rowPull = new Array(NROWS).fill(0);
  let coupling = 0;
  let masterTick = 0, nextBTick = 0;
  let iv = null;
  let collisionCount = 0;
  const INT_HISTORY = 200;
  let interferenceHistory = new Array(INT_HISTORY).fill(0);
  let ripples = [], particles2 = [], lastFlash = 0;
  
  function makeGrid(cols) {
    return {
      grid:     Array.from({length:NROWS}, () => new Array(cols).fill(0)),
      biasGrid: Array.from({length:NROWS}, () => new Array(cols).fill(false)),
      pitchGrid:Array.from({length:NROWS}, () => new Array(cols).fill(null)),
      velGrid:  Array.from({length:NROWS}, () => Array.from({length:cols}, () => .7+Math.random()*.5)),
      ph: 0, cols,
    };
  }
  let gA = makeGrid(COLS_A);
  let gB = makeGrid(COLS_B);
  
  // Seed A with a nice default pattern
  (function seedA(){
    const p=[[1,0,0,.33,1,0,0,.33,1,0,.33,0,1,0,0,.66],[0,0,.66,0,0,0,1,0,0,0,.66,0,0,.33,1,0],[.66,0,.66,0,.66,.33,.66,0,.66,0,.66,.33,.66,0,1,0],[0,0,0,0,0,.33,0,0,0,0,0,.66,0,0,.33,0],[0,.33,0,0,0,.66,0,.33,0,.33,0,0,0,.66,0,.33],[.66,0,0,0,.33,0,0,0,.66,0,0,.33,0,0,0,.66]];
    for(let r=0;r<NROWS;r++) for(let c=0;c<COLS_A;c++) gA.grid[r][c]=p[r][c];
  })();
  
  // ---- AUDIO ----
  let AC=null, masterGain=null, limiter=null;
  let melBufs={}, padBufs={}, loaded=false;
  let currentPadSrcs=[];
  
  function ac() { if(!AC) AC=new(window.AudioContext||window.webkitAudioContext)(); return AC; }
  function output() {
    if(!masterGain){
      masterGain=ac().createGain(); masterGain.gain.value=.78;
      limiter=ac().createDynamicsCompressor();
      limiter.threshold.value=-12; limiter.knee.value=8; limiter.ratio.value=8;
      limiter.attack.value=.003; limiter.release.value=.18;
      masterGain.connect(limiter); limiter.connect(ac().destination);
    }
    return masterGain;
  }
  function master() { const g=ac().createGain(); g.gain.value=0; g.connect(output()); return g; }
  async function unlockAudio() {
    if(!window.AudioContext&&!window.webkitAudioContext) return false;
    output(); if(ac().state==='suspended') await ac().resume();
    const s=ac().createBufferSource(); s.buffer=ac().createBuffer(1,1,ac().sampleRate);
    const g=ac().createGain(); g.gain.value=0; s.connect(g); g.connect(output()); s.start(); s.stop(ac().currentTime+.01);
    return ac().state==='running';
  }
  
  function makeNoise(dur) {
    const a=ac(), len=Math.max(1,Math.floor(a.sampleRate*dur)), buf=a.createBuffer(1,len,a.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    const s=a.createBufferSource(); s.buffer=buf; return s;
  }
  function makeDrive(amt) {
    const ws=ac().createWaveShaper(), curve=new Float32Array(256), k=1+amt*90;
    for(let i=0;i<256;i++){const x=(i*2)/255-1; curve[i]=(Math.PI+k)*x/(Math.PI+k*Math.abs(x));}
    ws.curve=curve; ws.oversample='2x'; return ws;
  }
  function withDrive(src,dst,amt) { if(!amt){src.connect(dst);return;} const d=makeDrive(amt); src.connect(d); d.connect(dst); }
  function filtNoise({type,freq,q,t,dur,gain,drive=0}) {
    const a=ac(),s=makeNoise(dur),f=a.createBiquadFilter(),g=master();
    f.type=type; f.frequency.value=freq; f.Q.value=q;
    g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(gain,t+.004); g.gain.exponentialRampToValueAtTime(.001,t+dur);
    s.connect(f); withDrive(f,g,drive); s.start(t); s.stop(t+dur);
  }
  
  function playDrum(rowId, gainMult=1) {
    const a=ac(), t=a.currentTime;
    const kit = DRUM_KITS[drumKit];
    if(rowId==='bd') {
      const k=kit.bd, o=a.createOscillator(), g=master();
      o.type=k.wave; o.frequency.setValueAtTime(k.start,t); o.frequency.exponentialRampToValueAtTime(k.end,t+k.dur*.7);
      g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(k.gain*gainMult,t+.006); g.gain.exponentialRampToValueAtTime(.001,t+k.dur);
      withDrive(o,g,k.drive); o.start(t); o.stop(t+k.dur+.02);
      if(k.click) filtNoise({type:'highpass',freq:3600,q:.3,t,dur:.018,gain:k.click*gainMult,drive:k.drive});
    } else if(rowId==='sd') {
      const k=kit.sd;
      filtNoise({type:'bandpass',freq:k.noiseFreq,q:.9,t,dur:k.dur,gain:k.gain*gainMult,drive:k.drive||0});
      const o=a.createOscillator(), b=master();
      o.type='triangle'; o.frequency.setValueAtTime(k.tone,t); o.frequency.exponentialRampToValueAtTime(k.tone*.82,t+k.dur);
      b.gain.setValueAtTime(.0001,t); b.gain.linearRampToValueAtTime(k.body*gainMult,t+.005); b.gain.exponentialRampToValueAtTime(.001,t+k.dur*.75);
      withDrive(o,b,k.drive||0); o.start(t); o.stop(t+k.dur);
    } else if(rowId==='hh') {
      const k=kit.hh;
      filtNoise({type:'highpass',freq:k.freq,q:.5,t,dur:k.dur,gain:k.gain*gainMult,drive:k.drive||0});
      if(k.metal) [1,1.37,1.82].forEach((ratio,i) => {
        const o=a.createOscillator(), g=master(); o.type='square'; o.frequency.value=k.freq*.38*ratio;
        g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime((.06*k.metal*gainMult)/(i+1),t+.003); g.gain.exponentialRampToValueAtTime(.001,t+k.dur*.9);
        withDrive(o,g,k.drive||0); o.start(t); o.stop(t+k.dur);
      });
    } else if(rowId==='cp') {
      const k=kit.cp;
      [0,k.spread,k.spread*1.9].forEach((off,i) => filtNoise({type:'bandpass',freq:k.freq+i*180,q:1.25,t:t+off,dur:k.dur,gain:k.gain*gainMult/(1+i*.22),drive:k.drive||0}));
    }
  }
  
  // ---- PITCHED AUDIO ----
  function noteToMidi(note) {
    const map={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
    const m=note.match(/^([A-G])(#|b)?(-?\d+)$/); if(!m) return 60;
    return (parseInt(m[3])+1)*12+map[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);
  }
  function midiName(midi) {
    return ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'][midi%12]+(Math.floor(midi/12)-1);
  }
  async function fetchBuf(inst,note) {
    const url=`https://gleitz.github.io/midi-js-soundfonts/MusyngKite/${inst}-mp3/${midiName(noteToMidi(note))}.mp3`;
    const ab=await(await fetch(url)).arrayBuffer(); return ac().decodeAudioData(ab);
  }
  async function initAudio() {
    document.getElementById('loading-status').textContent='loading samples…';
    const mel=new Set(), pad=new Set();
    CHORDS.forEach(c=>{c.hiScale.forEach(n=>mel.add(n));c.loScale.forEach(n=>mel.add(n));c.pad.forEach(n=>pad.add(n));});
    try {
      await Promise.all([
        ...[...mel].map(async n=>{melBufs[n]=await fetchBuf('electric_piano_1',n);}),
        ...[...pad].map(async n=>{padBufs[n]=await fetchBuf('string_ensemble_1',n);}),
      ]);
      loaded=true;
      document.getElementById('loading-status').textContent='samples ready';
    } catch(e) { document.getElementById('loading-status').textContent='load failed: '+e.message; }
  }
  function playSample(buf, gain=1, dur=null) {
    if(!buf||!AC) return null;
    const src=AC.createBufferSource(), g=AC.createGain();
    src.buffer=buf; src.connect(g); g.connect(AC.destination);
    g.gain.setValueAtTime(gain,AC.currentTime);
    if(dur){g.gain.setValueAtTime(gain,AC.currentTime+dur*.85);g.gain.linearRampToValueAtTime(0,AC.currentTime+dur);}
    src.start(); if(dur) src.stop(AC.currentTime+dur+.05);
    return src;
  }
  function playPad(ci) {
    currentPadSrcs.forEach(s=>{try{s.stop();}catch(e){}});
    currentPadSrcs=[];
    const bpm=parseInt(document.getElementById('sl-bpm').value), barDur=(60/bpm)*4;
    CHORDS[ci].pad.forEach(n=>{const s=playSample(padBufs[n],.4,barDur);if(s)currentPadSrcs.push(s);});
  }
  
  // ---- PITCH HELPERS ----
  function assignPitch(g,r,c) {
    const rc=ROWS_CONFIG[r]; if(rc.type!=='pitched') return;
    const chord=CHORDS[chordIdx], scale=rc.register==='hi'?chord.hiScale:chord.loScale;
    g.pitchGrid[r][c]=scale[Math.floor(Math.random()*scale.length)];
    g.velGrid[r][c]=.5+Math.random()*.8;
  }
  function reassignAllPitches(g) {
    for(let r=0;r<NROWS;r++){
      if(ROWS_CONFIG[r].type!=='pitched') continue;
      const chord=CHORDS[chordIdx], scale=ROWS_CONFIG[r].register==='hi'?chord.hiScale:chord.loScale;
      for(let c=0;c<g.cols;c++){
        if(!g.grid[r][c]) continue;
        const cur=g.pitchGrid[r][c]?noteToMidi(g.pitchGrid[r][c]):noteToMidi(scale[0]);
        let best=scale[0], bestD=999;
        scale.forEach(n=>{const d=Math.abs(noteToMidi(n)-cur);if(d<bestD){bestD=d;best=n;}});
        g.pitchGrid[r][c]=Math.random()<.4?scale[Math.floor(Math.random()*scale.length)]:best;
      }
    }
  }
  function triggerPitched(g,r,c,gainMult=1) {
    if(!loaded||!AC) return;
    const note=g.pitchGrid[r][c]; if(!note||!melBufs[note]) return;
    const dur={short:.18,mid:.38,long:.75}.mid;
    setTimeout(()=>playSample(melBufs[note],g.velGrid[r][c]*gainMult,dur),Math.random()*15);
  }
  
  // ---- CANVAS GRID RENDERER ----
  const caEl=document.getElementById('ca');
  const cbEl=document.getElementById('cb');
  const ctxA=caEl.getContext('2d');
  const ctxB=cbEl.getContext('2d');
  
  const LABEL_W=56, TOP_H=22, CELL_H=30, CELL_PAD=3;
  const COL_COLORS=['#579fbd','#4a9d82','#d99a5f','#d87590','#8f8fbc','#6f8f63'];
  const COL_GLOWS=['rgba(87,159,189,.35)','rgba(74,157,130,.35)','rgba(217,154,95,.35)','rgba(216,117,144,.35)','rgba(143,143,188,.35)','rgba(111,143,99,.35)'];
  
  function gridHeight() { return TOP_H + NROWS * CELL_H; }
  
  function resizeGridCanvas(el) {
    const W = el.offsetWidth * devicePixelRatio;
    const H = gridHeight() * devicePixelRatio;
    if(el.width!==W||el.height!==H){el.width=W;el.height=H;el.style.height=gridHeight()+'px';}
  }
  
  function drawGrid(el, ctx, g, isA) {
    resizeGridCanvas(el);
    const dpr=devicePixelRatio;
    const W=el.offsetWidth, H=gridHeight();
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
  
    const cols=g.cols;
    const cellW=(W-LABEL_W)/cols;
  
    // column header numbers
    ctx.font=`700 8px 'Space Mono',monospace`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(let c=0;c<cols;c++){
      const cx=LABEL_W+c*cellW+cellW/2;
      ctx.fillStyle=c===g.ph?'#ad5f74':'rgba(36,66,80,.45)';
      ctx.fillText(String(c+1).padStart(2,'0'),cx,TOP_H*.5);
    }
  
    // playhead column highlight
    if(g.ph>=0){
      ctx.fillStyle='rgba(216,117,144,.1)';
      ctx.fillRect(LABEL_W+g.ph*cellW,TOP_H,cellW,NROWS*CELL_H);
    }
  
    for(let r=0;r<NROWS;r++){
      const rc=ROWS_CONFIG[r];
      const cy=TOP_H+r*CELL_H;
  
      // row label
      ctx.textAlign='right'; ctx.fillStyle=COL_COLORS[r];
      ctx.font=`700 11px 'Space Mono',monospace`;
      ctx.fillText(rc.abbr,LABEL_W-10,cy+CELL_H/2-3);
      ctx.fillStyle='rgba(36,66,80,.4)'; ctx.font=`7px 'Space Mono',monospace`;
      ctx.fillText(rc.full,LABEL_W-10,cy+CELL_H/2+8);
      ctx.textAlign='center';
  
      for(let c=0;c<cols;c++){
        const val=g.grid[r][c];
        const isBias=g.biasGrid[r][c];
        const cx=LABEL_W+c*cellW+CELL_PAD;
        const cw=cellW-CELL_PAD*2, ch=CELL_H-CELL_PAD*2;
        const cy2=cy+CELL_PAD;
        const active=c===g.ph;
  
        ctx.save();
        // glow for bright cells
        if(val>=1){ctx.shadowColor=COL_GLOWS[r];ctx.shadowBlur=14;}
        else if(val>=.66){ctx.shadowColor=COL_GLOWS[r];ctx.shadowBlur=6;}
  
        // fill
        const alpha = isA ? (.04+val*.44) : (val?.42:.04);
        ctx.fillStyle=`rgba(${hexToRgb(COL_COLORS[r])},${alpha})`;
        // bias outline
        if(isBias){ctx.strokeStyle='rgba(217,154,95,.85)';ctx.lineWidth=2;}
        else{ctx.strokeStyle=active?COL_COLORS[r]:`rgba(36,66,80,${.1+val*.18})`;ctx.lineWidth=active?1.8:1;}
  
        rr(ctx,cx,cy2,cw,ch,4); ctx.fill(); ctx.stroke();
  
        // probability bar for grid A
        if(isA&&val>0){
          ctx.fillStyle=COL_COLORS[r];ctx.globalAlpha=.15+val*.4;
          ctx.fillRect(cx+4,cy2+ch-4,Math.max(2,(cw-8)*val),2);
        }
  
        // pitch label for melody rows
        if(val&&ROWS_CONFIG[r].type==='pitched'&&g.pitchGrid[r][c]){
          ctx.globalAlpha=.7; ctx.font=`6px 'Space Mono',monospace`;
          ctx.fillStyle='#fff'; ctx.fillText(g.pitchGrid[r][c],cx+cw/2,cy2+ch-5);
        }
  
        ctx.restore();
      }
    }
  }
  
  function hexToRgb(hex) {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }
  function rr(ctx,x,y,w,h,r2) {
    if(w<=0||h<=0){ctx.beginPath();ctx.rect(x,y,Math.max(0,w),Math.max(0,h));return;}
    const r3=Math.min(r2,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+r3,y);ctx.arcTo(x+w,y,x+w,y+h,r3);ctx.arcTo(x+w,y+h,x,y+h,r3);ctx.arcTo(x,y+h,x,y,r3);ctx.arcTo(x,y,x+w,y,r3);ctx.closePath();
  }
  
  function render() {
    drawGrid(caEl,ctxA,gA,true);
    drawGrid(cbEl,ctxB,gB,false);
    updateChordPills();
    updateStrudel();
    drawInterference();
  }
  
  // ---- PAINT (canvas hit test) ----
  let painting=false, paintVal=0, paintedSet=new Set(), paintingGrid=null;
  
  function cellAt(el,g,ex,ey) {
    const rect=el.getBoundingClientRect();
    const x=(ex-rect.left), y=(ey-rect.top);
    const cols=g.cols, cellW=(el.offsetWidth-LABEL_W)/cols;
    const gx=x-LABEL_W, gy=y-TOP_H;
    if(gx<0||gy<0||gx>=cellW*cols||gy>=NROWS*CELL_H) return null;
    return {r:Math.floor(gy/CELL_H), c:Math.floor(gx/cellW)};
  }
  
  function applyPaint(g,r,c) {
    if(frozen) return;
    if(paintMode==='erase'){
      g.grid[r][c]=0; g.biasGrid[r][c]=false; g.pitchGrid[r][c]=null;
    } else if(paintMode==='bias'){
      g.biasGrid[r][c]=!g.biasGrid[r][c];
    } else {
      // draw: grid A cycles probability; grid B is binary toggle
      if(g===gA){
        const idx=PROB_LEVELS.indexOf(g.grid[r][c]);
        g.grid[r][c]=PROB_LEVELS[(idx+1)%PROB_LEVELS.length];
      } else {
        g.grid[r][c]=g.grid[r][c]?0:1;
      }
      if(g.grid[r][c]&&ROWS_CONFIG[r].type==='pitched') assignPitch(g,r,c);
    }
  }
  
  function setupGridPaint(el,g) {
    el.addEventListener('pointerdown',e=>{
      const hit=cellAt(el,g,e.clientX,e.clientY); if(!hit) return;
      e.preventDefault(); painting=true; paintingGrid=g; paintedSet.clear();
      paintedSet.add(hit.r+':'+hit.c); applyPaint(g,hit.r,hit.c); render();
      if(el.setPointerCapture) el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove',e=>{
      if(!painting||paintingGrid!==g) return;
      const hit=cellAt(el,g,e.clientX,e.clientY); if(!hit) return;
      const key=hit.r+':'+hit.c; if(paintedSet.has(key)) return;
      paintedSet.add(key); applyPaint(g,hit.r,hit.c); render();
    });
    const stop=e=>{painting=false;paintingGrid=null;paintedSet.clear();if(el.releasePointerCapture)try{el.releasePointerCapture(e.pointerId);}catch(e2){}};
    el.addEventListener('pointerup',stop); el.addEventListener('pointercancel',stop);
  }
  setupGridPaint(caEl,gA);
  setupGridPaint(cbEl,gB);
  
  // ---- INTERFERENCE CANVAS ----
  const intCanvas=document.getElementById('int-canvas');
  const intCtx=intCanvas.getContext('2d');
  
  function drawInterference() {
    const W=intCanvas.offsetWidth, H=intCanvas.offsetHeight||90;
    if(intCanvas.width!==W||intCanvas.height!==H){intCanvas.width=W;intCanvas.height=H;}
  
    intCtx.fillStyle='rgba(219,233,238,.55)'; intCtx.fillRect(0,0,W,H);
  
    const phFracA=gA.ph/COLS_A, phFracB=gB.ph/gB.cols;
    const phaseOffset=Math.abs(phFracA-phFracB);
    const convergence=Math.max(0,1-phaseOffset/.15);
  
    // Lane 1: waveform history
    const laneH=Math.floor(H*.55), step=W/INT_HISTORY;
    intCtx.strokeStyle='rgba(36,66,80,.1)'; intCtx.lineWidth=.5;
    for(let i=1;i<4;i++){const y=laneH*i/4;intCtx.beginPath();intCtx.moveTo(0,y);intCtx.lineTo(W,y);intCtx.stroke();}
  
    intCtx.beginPath(); intCtx.moveTo(0,laneH/2);
    for(let i=0;i<INT_HISTORY;i++){const amp=interferenceHistory[i]*(laneH/2-2);intCtx.lineTo(i*step,laneH/2-amp);}
    for(let i=INT_HISTORY-1;i>=0;i--){const amp=interferenceHistory[i]*(laneH/2-2);intCtx.lineTo(i*step,laneH/2+amp);}
    intCtx.closePath();
    const r1=Math.round(87+convergence*168), g1=Math.round(159+convergence*96), b1=Math.round(189+convergence*66);
    intCtx.fillStyle=`rgba(${r1},${g1},${b1},${.15+convergence*.25})`; intCtx.fill();
    intCtx.beginPath(); intCtx.moveTo(0,laneH/2);
    for(let i=0;i<INT_HISTORY;i++){const amp=interferenceHistory[i]*(laneH/2-2);intCtx.lineTo(i*step,laneH/2-amp);}
    intCtx.strokeStyle=`rgba(${r1},${g1},${b1},${.55+convergence*.45})`; intCtx.lineWidth=1.5; intCtx.stroke();
  
    // Playhead beams
    const xA=phFracA*W, xB=phFracB*W;
    [[xA,'rgba(87,159,189,.9)'],[xB,'rgba(143,143,188,.9)']].forEach(([x,col])=>{
      intCtx.strokeStyle=col; intCtx.lineWidth=1.5;
      intCtx.beginPath();intCtx.moveTo(x,0);intCtx.lineTo(x,laneH);intCtx.stroke();
    });
    intCtx.font=`bold 8px 'Space Mono',monospace`;
    intCtx.fillStyle='rgba(87,159,189,.8)'; intCtx.fillText('A',xA+3,10);
    intCtx.fillStyle='rgba(143,143,188,.8)'; intCtx.fillText('B',xB+3,10);
  
    // Collision flash
    if(convergence>.85){
      const midX=(xA+xB)/2, fa=(convergence-.85)/.15;
      const flash=intCtx.createLinearGradient(midX-60,0,midX+60,0);
      flash.addColorStop(0,'rgba(255,255,255,0)');flash.addColorStop(.5,`rgba(255,255,255,${fa*.45})`);flash.addColorStop(1,'rgba(255,255,255,0)');
      intCtx.fillStyle=flash; intCtx.fillRect(midX-60,0,120,laneH);
      const now=Date.now();
      if(now-lastFlash>180){lastFlash=now;
        ripples.push({x:midX,y:laneH/2,age:0,maxAge:38,intensity:fa});
        for(let i=0;i<8+Math.round(fa*8);i++){const a=Math.random()*Math.PI*2,sp=.5+Math.random()*2.5;particles2.push({x:midX,y:laneH/2,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,color:'rgba(87,159,189,0.9)'});}
      }
    }
  
    // Lane 2: phase sine waves
    const l2Y=laneH+3, l2H=H-l2Y-2, cx2=l2Y+l2H/2, amp2=l2H/2-2;
    intCtx.fillStyle='rgba(210,225,230,.5)'; intCtx.fillRect(0,l2Y,W,l2H);
    [['rgba(87,159,189,.55)',t=>t*Math.PI*4,phFracA],['rgba(143,143,188,.55)',t=>t*Math.PI*4*(gB.cols/COLS_A),phFracB]].forEach(([col,tf,ph])=>{
      intCtx.beginPath();
      for(let x=0;x<W;x++){const y=cx2+Math.sin(tf(x/W)+ph*Math.PI*2)*amp2;x===0?intCtx.moveTo(x,y):intCtx.lineTo(x,y);}
      intCtx.strokeStyle=col; intCtx.lineWidth=1.2; intCtx.stroke();
    });
  
    // Ripples + particles
    ripples=ripples.filter(rp=>rp.age<rp.maxAge);
    ripples.forEach(rp=>{const t=rp.age/rp.maxAge;intCtx.beginPath();intCtx.arc(rp.x,rp.y,t*40*rp.intensity,0,Math.PI*2);intCtx.strokeStyle=`rgba(87,159,189,${(1-t)*.7*rp.intensity})`;intCtx.lineWidth=1.5*(1-t);intCtx.stroke();rp.age++;});
    particles2=particles2.filter(p=>p.life>.02);
    particles2.forEach(p=>{intCtx.beginPath();intCtx.arc(p.x,p.y,1.5*p.life,0,Math.PI*2);intCtx.fillStyle=p.color.replace('0.9)',`${p.life*.9})`);intCtx.fill();p.x+=p.vx;p.y+=p.vy;p.vx*=.94;p.vy*=.94;p.life*=.88;});
  
    const pctStr=(convergence*100).toFixed(0);
    document.getElementById('phase-display').textContent=`align ${pctStr}% · offset ${phaseOffset.toFixed(3)}`;
  }
  
  // ---- CHORD PILLS ----
  const chordRow=document.getElementById('chord-row');
  const chordPills=[];
  CHORDS.forEach((ch,i)=>{
    const p=document.createElement('div');p.className='chord-pill'+(i===0?' active':'');p.textContent=ch.name;
    chordRow.appendChild(p);chordPills.push(p);
  });
  function updateChordPills(){chordPills.forEach((p,i)=>p.classList.toggle('active',i===chordIdx));}
  
  // ---- STRUDEL ----
  function updateStrudel(){
    const steps=[];
    for(let c=0;c<COLS_A;c++) steps.push(gA.grid[4][c]&&gA.pitchGrid[4][c]?gA.pitchGrid[4][c].toLowerCase():'~');
    document.getElementById('strudel-box').textContent=`note("${steps.join(' ')}")`;
  }
  
  // ---- EVOLVE ----
  function evolveGrid(g){
    const {chaos,density,rep,smooth}=params;
    g.grid=g.grid.map((row,r)=>row.map((cell,c)=>{
      const isPitched=ROWS_CONFIG[r].type==='pitched';
      let bias=0;
      for(let br=Math.max(0,r-1);br<=Math.min(NROWS-1,r+1);br++) for(let bc=Math.max(0,c-1);bc<=Math.min(g.cols-1,c+1);bc++) if(g.biasGrid[br][bc]) bias+=.12;
      bias=Math.min(bias,.4);
      const pull=rowPull[r]*.3;
      let p=cell?(isPitched?.6+rep*.2:.55+rep*.15):(isPitched?density*.25:density*.4);
      p+=bias+pull;
      const prev=(c-1+g.cols)%g.cols, next=(c+1)%g.cols;
      const nb=(g.grid[r][prev]+g.grid[r][next])/2;
      if(cell) p=p*(1-smooth*.15)+smooth*.15*(nb>.5?.9:.1);
      p+=(Math.random()-.5)*chaos;
      const nxt=Math.random()<Math.max(.02,Math.min(.97,p))?1:0;
      if(nxt&&!cell&&isPitched) assignPitch(g,r,c);
      if(nxt&&cell&&isPitched&&Math.random()<.15) assignPitch(g,r,c);
      return nxt;
    }));
  }
  
  function applyCoupling(){
    if(coupling<.01) return;
    for(let r=0;r<NROWS;r++) for(let c=0;c<COLS_A;c++){
      const cB=Math.round((c/COLS_A)*gB.cols)%gB.cols;
      if(gA.grid[r][c]&&!gB.grid[r][cB]&&Math.random()<coupling*.3){gB.grid[r][cB]=1;assignPitch(gB,r,cB);}
      if(gB.grid[r][cB]&&!gA.grid[r][c]&&Math.random()<coupling*.3){gA.grid[r][c]=gA===gA?PROB_LEVELS[1]:1;assignPitch(gA,r,c);}
    }
  }
  
  function recordInterference(){
    const phFracA=gA.ph/COLS_A, phFracB=gB.ph/gB.cols;
    const inPhase=Math.abs(phFracA-phFracB)<1/Math.max(COLS_A,gB.cols);
    let hits=0;
    if(inPhase) for(let r=0;r<NROWS;r++) if(gA.grid[r][gA.ph]&&gB.grid[r][gB.ph]) hits++;
    const score=inPhase?hits/NROWS:0;
    interferenceHistory.push(score); if(interferenceHistory.length>INT_HISTORY) interferenceHistory.shift();
    if(score>0){collisionCount++;document.getElementById('sb-coll').textContent=collisionCount;}
  }
  
  // ---- MASTER STEP ----
  function masterStep(){
    gA.ph=(gA.ph+1)%COLS_A;
    if(gA.ph===0){
      chordIdx=nextChordIdx; nextChordIdx=markovNextChord(chordIdx);
      reassignAllPitches(gA); reassignAllPitches(gB);
      if(loaded) playPad(chordIdx);
      barCount++;
      document.getElementById('sb-bar').textContent=barCount;
      document.getElementById('cur-chord').textContent=CHORDS[chordIdx].name;
      document.getElementById('next-chord').textContent=CHORDS[nextChordIdx].name;
      document.getElementById('sb-chord').textContent=CHORDS[chordIdx].name;
      document.getElementById('sb-next').textContent=CHORDS[nextChordIdx].name;
    }
  
    // Fire grid A sounds
    for(let r=0;r<NROWS;r++){
      if(!gA.grid[r][gA.ph]) continue;
      if(ROWS_CONFIG[r].type==='drum') playDrum(ROWS_CONFIG[r].id,1.0);
      else triggerPitched(gA,r,gA.ph,1.0);
    }
  
    // Grid B at its own rate
    masterTick++;
    if(masterTick>=nextBTick){
      nextBTick=masterTick+COLS_A/gB.cols;
      gB.ph=(gB.ph+1)%gB.cols;
      for(let r=0;r<NROWS;r++){
        if(!gB.grid[r][gB.ph]) continue;
        if(ROWS_CONFIG[r].type==='drum') playDrum(ROWS_CONFIG[r].id,.65);
        else triggerPitched(gB,r,gB.ph,.65);
      }
      if(!frozen) evolveGrid(gB);
    }
  
    if(!frozen){evolveGrid(gA);applyCoupling();}
    recordInterference();
    render();
  
    document.getElementById('sb-a').textContent=String(gA.ph+1).padStart(2,'0');
    document.getElementById('sb-b').textContent=String(gB.ph+1).padStart(2,'0');
  }
  
  // ---- RATIO ----
  const RATIO_STEPS=[7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
  function sliderToSteps(v){const idx=Math.round((v-50)/(100/(RATIO_STEPS.length-1)));return RATIO_STEPS[Math.max(0,Math.min(RATIO_STEPS.length-1,idx))];}
  function gcd(a,b){return b===0?a:gcd(b,a%b);}
  function rebuildGridB(cols){
    COLS_B=cols;
    const old=gB.grid, oldBias=gB.biasGrid;
    gB=makeGrid(cols);
    for(let r=0;r<NROWS;r++) for(let c=0;c<cols;c++){
      const oc=Math.round(c/cols*old[r].length)%old[r].length;
      gB.grid[r][c]=old[r][oc]; gB.biasGrid[r][c]=oldBias[r][oc];
      if(gB.grid[r][c]) assignPitch(gB,r,c);
    }
    nextBTick=masterTick+COLS_A/cols;
    const g2=gcd(cols,COLS_A);
    document.getElementById('val-ratio').textContent=`${cols/g2}/${COLS_A/g2}`;
    document.getElementById('b-tag').textContent=`${cols} steps · ${(cols/COLS_A).toFixed(3)}×`;
    render();
  }
  
  // ---- ROW PULL UI ----
  const rpWrap=document.getElementById('row-pull-wrap');
  ROWS_CONFIG.forEach((rc,r)=>{
    const div=document.createElement('div'); div.className='pull-item';
    const nm=document.createElement('div');nm.className='rp-name';nm.style.color=COL_COLORS[r];nm.textContent=rc.abbr.toUpperCase();
    const sub=document.createElement('div');sub.className='rp-sub';sub.textContent=rc.full;
    const sl=document.createElement('input');sl.type='range';sl.min=-50;sl.max=50;sl.value=0;
    const val=document.createElement('div');val.className='rp-val';val.textContent='0.00';
    sl.oninput=()=>{rowPull[r]=parseInt(sl.value)/50;val.textContent=rowPull[r].toFixed(2);};
    div.append(nm,sub,sl,val);rpWrap.appendChild(div);
  });
  
  // ---- CONTROLS ----
  document.getElementById('play').addEventListener('click',async function(){
    const ready=await unlockAudio(); if(!ready) return;
    if(!AC) return;
    if(playing){
      clearInterval(iv);playing=false;
      this.classList.remove('playing');this.setAttribute('aria-label','Play');
      currentPadSrcs.forEach(s=>{try{s.stop();}catch(e){}});
      if(!loaded) initAudio();
    } else {
      if(!loaded) await initAudio();
      nextChordIdx=markovNextChord(chordIdx);
      if(loaded) playPad(chordIdx);
      masterTick=0; nextBTick=COLS_A/gB.cols;
      const bpm=parseInt(document.getElementById('sl-bpm').value);
      iv=setInterval(masterStep,60/bpm/4*1000);
      playing=true;
      this.classList.add('playing');this.setAttribute('aria-label','Pause');
      document.getElementById('cur-chord').textContent=CHORDS[chordIdx].name;
      document.getElementById('next-chord').textContent=CHORDS[nextChordIdx].name;
    }
  });
  
  document.getElementById('randomize').addEventListener('click',()=>{
    if(frozen) return;
    [gA,gB].forEach((g,gi)=>{
      for(let r=0;r<NROWS;r++) for(let c=0;c<g.cols;c++){
        const v=gi===0?PROB_LEVELS[Math.floor(Math.random()*4)]:Math.random()<.28?1:0;
        g.grid[r][c]=v;
        if(v&&ROWS_CONFIG[r].type==='pitched') assignPitch(g,r,c);
      }
    });
    render();
  });
  document.getElementById('mutate').addEventListener('click',()=>{
    if(frozen) return;
    [gA,gB].forEach(g=>{
      const changes=5+Math.floor(Math.random()*10);
      for(let i=0;i<changes;i++){
        const r=Math.floor(Math.random()*NROWS),c=Math.floor(Math.random()*g.cols);
        if(g===gA){const idx=PROB_LEVELS.indexOf(g.grid[r][c]);g.grid[r][c]=PROB_LEVELS[Math.max(0,Math.min(3,idx+(Math.random()>.5?1:-1)))];}
        else{g.grid[r][c]=g.grid[r][c]?0:1;}
        if(g.grid[r][c]&&ROWS_CONFIG[r].type==='pitched') assignPitch(g,r,c);
      }
    });
    render();
  });
  document.getElementById('clear').addEventListener('click',()=>{
    if(frozen) return;
    [gA,gB].forEach(g=>{g.grid=Array.from({length:NROWS},()=>new Array(g.cols).fill(0));g.biasGrid=Array.from({length:NROWS},()=>new Array(g.cols).fill(false));g.pitchGrid=Array.from({length:NROWS},()=>new Array(g.cols).fill(null));});
    render();
  });
  document.getElementById('freeze').addEventListener('click',function(){
    frozen=!frozen;this.classList.toggle('on',frozen);
    document.getElementById('freeze-lbl').textContent=frozen?'frozen grid':'live grid';
  });
  document.querySelectorAll('[data-kit]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      drumKit=btn.dataset.kit;
      document.querySelectorAll('[data-kit]').forEach(b=>b.classList.remove('on'));
      btn.classList.add('on');
      document.getElementById('kit-lbl').textContent=KIT_DESCS[drumKit];
    });
  });
  document.querySelectorAll('[data-mode]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      paintMode=btn.dataset.mode;
      document.querySelectorAll('[data-mode]').forEach(b=>b.classList.remove('on'));
      btn.classList.add('on');
    });
  });
  
  // Sliders
  [['sl-bpm','val-bpm',v=>v,'bpm'],['sl-chaos','val-chaos',v=>(v/100).toFixed(2),'chaos'],['sl-density','val-density',v=>(v/100).toFixed(2),'density'],['sl-rep','val-rep',v=>(v/100).toFixed(2),'rep'],['sl-smooth','val-smooth',v=>(v/100).toFixed(2),'smooth']].forEach(([id,vid,fmt,key])=>{
    document.getElementById(id).oninput=function(){
      const v=parseInt(this.value); document.getElementById(vid).textContent=fmt(v);
      if(key==='bpm'){if(playing){clearInterval(iv);iv=setInterval(masterStep,60/v/4*1000);}}
      else params[key]=v/100;
    };
  });
  document.getElementById('sl-ratio').oninput=function(){rebuildGridB(sliderToSteps(parseInt(this.value)));};
  document.getElementById('sl-coupling').oninput=function(){
    coupling=parseInt(this.value)/100;
    document.getElementById('val-coupling').textContent=coupling.toFixed(2);
    document.getElementById('coupling-badge').textContent=`coupling ${coupling.toFixed(2)}`;
  };
  
  // Intro
  document.getElementById('intro-start').addEventListener('click',()=>document.getElementById('intro-overlay').classList.add('is-hidden'));
  document.getElementById('intro-open').addEventListener('click',()=>document.getElementById('intro-overlay').classList.remove('is-hidden'));
  document.getElementById('intro-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.classList.add('is-hidden');});
  
  // ---- ANIMATION LOOP (particles + constant redraw) ----
  function animLoop(){
    if(ripples.length||particles2.length) drawInterference();
    requestAnimationFrame(animLoop);
  }
  requestAnimationFrame(animLoop);
  
  // ---- RESIZE ----
  let resizeTimer;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>render(),120);
  });
  
  // Seed B randomly and render initial state
  for(let r=0;r<NROWS;r++) for(let c=0;c<COLS_B;c++) if(Math.random()<.22){gB.grid[r][c]=1;if(ROWS_CONFIG[r].type==='pitched') assignPitch(gB,r,c);}
  render();
  
  })();
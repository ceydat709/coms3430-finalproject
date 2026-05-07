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
  
  
  // =====================================================
  // ---- WORLD GAME ----
  // =====================================================
  
  const GC = document.getElementById('game-canvas');
  const GX = GC.getContext('2d');
  
  // ---- HELPERS ----
  function grr(ctx, x, y, w, h, r) {
    // safe roundRect without object-form radii
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r, y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x, y+r); ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
  }
  
  function parseColor(s) {
    if (!s) return [128,128,128];
    const m = s.match(/\d+/g);
    if (m && m.length >= 3) return [+m[0],+m[1],+m[2]];
    const h = s.replace('#','');
    if (h.length === 6) return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    return [128,128,128];
  }
  function lerpC(a, b, t) {
    const [ar,ag,ab2] = parseColor(a), [br,bg,bb] = parseColor(b);
    return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab2+(bb-ab2)*t)})`;
  }
  function gl(a,b,t){return a+(b-a)*t;}
  
  // ---- TIME OF DAY CONFIG ----
  const TOD = {
    dawn: {
      sky0:'#1a0a2e', sky1:'#7b3f6e', sky2:'#e8784a', sky3:'#fde8c8',
      ground:'#c4a882', groundD:'#9a7a58', groundH:'#d4c09a',
      mtnF:'#8a5a7a', mtnM:'#6a4455', treeD:'#4a3345', treeL:'#6a4a5a',
      fogA:.18, sun:{x:.1,y:.13,r:18,color:'#ff9944',rays:true}, moon:false, stars:false,
      firefly:false, birds:true, birdC:'rgba(90,50,60,.65)',
      cloudA:.7, cloudC:'rgba(255,220,180,.7)',
      music:{ bpm:80, chaos:.12, density:.28, rep:.68, smooth:.65 },
      label:'dawn — slow and dreamy'
    },
    day: {
      sky0:'#1a7ac8', sky1:'#4fc3f7', sky2:'#b3e5fc', sky3:'#e8f5ff',
      ground:'#7ab648', groundD:'#4a8a28', groundH:'#a8d878',
      mtnF:'#8ab8d4', mtnM:'#5a8a4a', treeD:'#2a5a1a', treeL:'#4a8a2a',
      fogA:.04, sun:{x:.52,y:.1,r:22,color:'#fff176',rays:true}, moon:false, stars:false,
      firefly:false, birds:true, birdC:'rgba(40,70,50,.55)',
      cloudA:.85, cloudC:'rgba(255,255,255,.82)',
      music:{ bpm:120, chaos:.22, density:.52, rep:.38, smooth:.35 },
      label:'day — bright and rhythmic'
    },
    sunset: {
      sky0:'#0a0530', sky1:'#c0392b', sky2:'#e8662a', sky3:'#ffd580',
      ground:'#b8704a', groundD:'#8a4a28', groundH:'#d49060',
      mtnF:'#7a2a3a', mtnM:'#5a1a28', treeD:'#2a1218', treeL:'#4a2228',
      fogA:.2, sun:{x:.88,y:.15,r:28,color:'#ff5500',rays:false}, moon:false, stars:false,
      firefly:false, birds:true, birdC:'rgba(80,20,20,.6)',
      cloudA:.6, cloudC:'rgba(255,180,100,.6)',
      music:{ bpm:95, chaos:.16, density:.38, rep:.55, smooth:.55 },
      label:'sunset — warm and melancholic'
    },
    night: {
      sky0:'#020408', sky1:'#05080f', sky2:'#0d1528', sky3:'#131d38',
      ground:'#1a2030', groundD:'#0e141e', groundH:'#252d42',
      mtnF:'#1a2035', mtnM:'#141828', treeD:'#0a0e18', treeL:'#151c2a',
      fogA:.25, sun:null, moon:true, stars:true,
      firefly:true, birds:false, birdC:'rgba(40,50,90,.4)',
      cloudA:.25, cloudC:'rgba(40,50,80,.5)',
      music:{ bpm:68, chaos:.08, density:.20, rep:.78, smooth:.75 },
      label:'night — sparse and hypnotic'
    },
  };
  
  let todKey = 'dawn';
  let todT = 1; // 1=fully arrived at todKey
  let todFrom = null; // snapshot of previous TOD colors for blending
  
  function todSnap(k) {
    const t = TOD[k];
    return {sky0:t.sky0,sky1:t.sky1,sky2:t.sky2,sky3:t.sky3,
      ground:t.ground,groundD:t.groundD,groundH:t.groundH,
      mtnF:t.mtnF,mtnM:t.mtnM,treeD:t.treeD,treeL:t.treeL};
  }
  function blendColors(t) {
    if(todT>=1||!todFrom) return todSnap(todKey);
    const A=todFrom, B=todSnap(todKey);
    const r={};
    for(const k in A) r[k]=lerpC(A[k],B[k],t);
    return r;
  }
  
  // ---- WORLD GEOMETRY (stable) ----
  const STARS = Array.from({length:100},()=>({
    x:Math.random(), y:Math.random()*.78,
    r:.3+Math.random()*1.5, tw:Math.random()*Math.PI*2, sp:.4+Math.random()*1.6
  }));
  const CLOUDS = Array.from({length:6},()=>({
    x:Math.random(), y:.04+Math.random()*.24,
    w:.08+Math.random()*.12, sp:.00004+Math.random()*.00004, op:.6+Math.random()*.3
  }));
  let BIRDS = Array.from({length:5},()=>({
    x:Math.random(), y:.06+Math.random()*.18,
    vx:.0005+Math.random()*.0006, ft:Math.random()*Math.PI*2, sz:2+Math.random()*2.5
  }));
  let FLIES = Array.from({length:18},()=>({
    x:Math.random(), y:.38+Math.random()*.32,
    vx:(Math.random()-.5)*.0006, vy:(Math.random()-.5)*.0005, p:Math.random()*Math.PI*2
  }));
  const MTN_F = Array.from({length:11},(_,i)=>({x:i/10*.94+.03, h:.18+Math.random()*.2, w:.08+Math.random()*.07}));
  const MTN_M = Array.from({length:17},(_,i)=>({x:i/16*.97+.015, h:.1+Math.random()*.15, w:.06+Math.random()*.05}));
  const TREES  = Array.from({length:26},()=>({x:Math.random(), th:7+Math.random()*9, cr:13+Math.random()*14})).sort((a,b)=>a.x-b.x);
  
  // ---- PLATFORMS (each maps to a drum row) ----
  // rows: 0=bd,1=sd,2=hh,3=cp,4=m1,5=m2
  const PLATS = [
    {xf:.13,yf:.60,wf:.10,row:2},
    {xf:.29,yf:.51,wf:.09,row:4},
    {xf:.45,yf:.43,wf:.11,row:5},
    {xf:.61,yf:.53,wf:.09,row:3},
    {xf:.75,yf:.45,wf:.10,row:1},
    {xf:.87,yf:.58,wf:.08,row:2},
  ];
  const GY_FRAC = .74;
  function gY(H){return H*GY_FRAC;}
  function platR(pd,W,H){return{x:pd.xf*W,y:pd.yf*H,w:pd.wf*W,h:8};}
  
  function groundRow(xf){
    if(xf<.2) return 5;
    if(xf<.4) return 0;
    if(xf<.6) return 1;
    if(xf<.8) return 2;
    return 3;
  }
  
  // ---- PLAYER ----
  const P={xf:.3,y:300,vy:0,onGround:false,onPlat:false,platRow:-1,
    facing:1,walkT:0,moving:false,jc:0,stillF:0,landFlash:0};
  const SPD=.0025, JVY=-8.5, GRAV=.42, MFALL=13;
  
  function pRow(){return P.onPlat&&P.platRow>=0?P.platRow:groundRow(P.xf);}
  function pCol(){return Math.floor(P.xf*COLS_A)%COLS_A;}
  
  // ---- PAINT EFFECTS ----
  let strokes=[]; // {x,y,row,life,sz,prob}
  let splatters=[]; // {x,y,row,parts:[{dx,dy,vx,vy,r,life,dec}]}
  let dustMotes=[]; // {x,y,life}
  let rowGlow=new Array(NROWS).fill(0); // per-row flash 0..1
  let paintCD=0;
  
  function doPaint(W) {
    if(frozen) return;
    const row=pRow(), col=pCol();
    const px=P.xf*W, py=P.y;
    paintCD--;
    if(P.moving && paintCD<=0) {
      const pi=Math.min(3,Math.floor(Math.random()*3)+1);
      gA.grid[row][col]=PROB_LEVELS[pi];
      if(ROWS_CONFIG[row].type==='pitched') assignPitch(gA,row,col);
      strokes.push({x:px,y:py,row,life:1,sz:3+Math.random()*3,prob:PROB_LEVELS[pi]});
      paintCD=8;
      render();
    }
    if(!P.moving) {
      P.stillF++;
      if(P.stillF>90 && P.stillF%20===0) {
        const spread=Math.min(2,Math.floor((P.stillF-90)/60));
        for(let dc=-spread;dc<=spread;dc++){
          const c2=(col+dc+COLS_A)%COLS_A;
          if(gA.grid[row][c2]>0){
            const idx=PROB_LEVELS.indexOf(gA.grid[row][c2]);
            gA.grid[row][c2]=PROB_LEVELS[Math.max(0,idx-1)];
            dustMotes.push({x:px+dc*20+(Math.random()-.5)*10,y:py-Math.random()*14,life:1});
          }
        }
        render();
      }
    } else { P.stillF=0; }
  }
  
  function doLand(W) {
    if(frozen) return;
    const row=pRow(), col=pCol();
    const px=P.xf*W, py=P.y;
    gA.grid[row][col]=1;
    if(ROWS_CONFIG[row].type==='pitched') assignPitch(gA,row,col);
    [-1,1].forEach(dc=>{
      const c2=(col+dc+COLS_A)%COLS_A;
      if(Math.random()>.35){gA.grid[row][c2]=PROB_LEVELS[2];if(ROWS_CONFIG[row].type==='pitched')assignPitch(gA,row,c2);}
    });
    const sp={x:px,y:py,row,parts:[]};
    for(let i=0;i<20;i++){
      const a=-Math.PI+Math.random()*Math.PI;
      const s=2+Math.random()*5;
      sp.parts.push({dx:0,dy:0,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.7-1,r:2+Math.random()*4,life:1,dec:.02+Math.random()*.02});
    }
    splatters.push(sp);
    rowGlow[row]=1;
    P.landFlash=1;
    render();
  }
  
  // ---- KEYS ----
  const KEYS={};
  window.addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)&&
       (GC.matches(':hover')||KEYS._on)){e.preventDefault();KEYS._on=true;}
    KEYS[e.key]=true;
  });
  window.addEventListener('keyup',e=>{KEYS[e.key]=false;if(!KEYS.ArrowLeft&&!KEYS.ArrowRight)KEYS._on=false;});
  GC.addEventListener('mouseenter',()=>{KEYS._on=true;});
  GC.addEventListener('mouseleave',()=>{if(!KEYS.ArrowLeft&&!KEYS.ArrowRight)KEYS._on=false;});
  
  // ---- MUSIC PARAMS ----
  let gPT={...TOD.dawn.music};
  let gPC={...TOD.dawn.music};
  
  function applyTodToSequencer(k){gPT={...TOD[k].music};}
  
  function tickMusic(){
    const s=.006;
    gPC.bpm=gl(gPC.bpm,gPT.bpm,.03);
    ['chaos','density','rep','smooth'].forEach(k=>gPC[k]=gl(gPC[k],gPT[k],s));
    const xb=(P.xf-.5)*.12;
    params.chaos=Math.max(0,Math.min(1,gPC.chaos+(P.moving?.05:0)));
    params.density=Math.max(0,Math.min(1,gPC.density+xb));
    params.rep=Math.max(0,Math.min(1,gPC.rep));
    params.smooth=Math.max(0,Math.min(1,gPC.smooth));
    if(playing){
      const nb=Math.round(gPC.bpm);
      const cur=parseInt(document.getElementById('sl-bpm').value);
      if(Math.abs(nb-cur)>2){
        document.getElementById('sl-bpm').value=nb;
        document.getElementById('val-bpm').textContent=nb;
        clearInterval(iv);iv=setInterval(masterStep,60/nb/4*1000);
      }
    }
  }
  
  // ---- GAME RESIZE ----
  let GW=0,GH=0;
  function gameResize(){
    const W=GC.offsetWidth,H=GC.offsetHeight||300;
    const dpr=devicePixelRatio;
    if(GC.width!==Math.round(W*dpr)||GC.height!==Math.round(H*dpr)){
      GC.width=Math.round(W*dpr);GC.height=Math.round(H*dpr);
    }
    GW=W;GH=H;
  }
  
  // ---- DRAW FUNCTIONS ----
  let GT=0; // frame counter
  
  function drawGameSky(C,b){
    const grad=GX.createLinearGradient(0,0,0,GH);
    grad.addColorStop(0,b.sky0); grad.addColorStop(.35,b.sky1);
    grad.addColorStop(.7,b.sky2); grad.addColorStop(1,b.sky3);
    GX.fillStyle=grad; GX.fillRect(0,0,GW,GH);
  }
  
  function drawGameStars(alpha){
    if(alpha<=0)return;
    STARS.forEach(s=>{
      const tw=Math.sin(GT*s.sp*.03+s.tw);
      const a=alpha*Math.max(0,.3+tw*.7);
      GX.beginPath();GX.arc(s.x*GW,s.y*GH*.9,s.r,0,Math.PI*2);
      GX.fillStyle=`rgba(255,252,215,${a})`;GX.fill();
      if(s.r>1.2&&a>.5){
        GX.strokeStyle=`rgba(255,252,215,${a*.35})`;GX.lineWidth=.5;
        GX.beginPath();GX.moveTo(s.x*GW-s.r*2.5,s.y*GH*.9);GX.lineTo(s.x*GW+s.r*2.5,s.y*GH*.9);GX.stroke();
        GX.beginPath();GX.moveTo(s.x*GW,s.y*GH*.9-s.r*2.5);GX.lineTo(s.x*GW,s.y*GH*.9+s.r*2.5);GX.stroke();
      }
    });
  }
  
  function drawSun(sunCfg,alpha){
    if(!sunCfg||alpha<=0)return;
    const sx=sunCfg.x*GW, sy=sunCfg.y*GH;
    GX.globalAlpha=alpha;
    if(sunCfg.rays){
      for(let i=0;i<8;i++){
        const a=i/8*Math.PI*2+GT*.002;
        const len=sunCfg.r*1.9+Math.sin(GT*.04+i)*4;
        GX.strokeStyle=sunCfg.color;GX.lineWidth=1.5;GX.lineCap='round';GX.globalAlpha=alpha*.15;
        GX.beginPath();GX.moveTo(sx+Math.cos(a)*sunCfg.r*1.15,sy+Math.sin(a)*sunCfg.r*1.15);
        GX.lineTo(sx+Math.cos(a)*len,sy+Math.sin(a)*len);GX.stroke();
      }
    }
    GX.globalAlpha=alpha;
    const g=GX.createRadialGradient(sx,sy,0,sx,sy,sunCfg.r*2.5);
    g.addColorStop(0,sunCfg.color);g.addColorStop(.4,sunCfg.color.slice(0,7)+'88');g.addColorStop(1,sunCfg.color.slice(0,7)+'00');
    GX.fillStyle=g;GX.beginPath();GX.arc(sx,sy,sunCfg.r*2.5,0,Math.PI*2);GX.fill();
    GX.fillStyle=sunCfg.color;GX.beginPath();GX.arc(sx,sy,sunCfg.r,0,Math.PI*2);GX.fill();
    GX.globalAlpha=1;
  }
  
  function drawMoon(alpha){
    if(alpha<=0)return;
    const mx=GW*.82,my=GH*.1;
    GX.globalAlpha=alpha;
    const mg=GX.createRadialGradient(mx,my,6,mx,my,36);
    mg.addColorStop(0,'rgba(200,210,255,.2)');mg.addColorStop(1,'rgba(200,210,255,0)');
    GX.fillStyle=mg;GX.beginPath();GX.arc(mx,my,36,0,Math.PI*2);GX.fill();
    GX.fillStyle='#ddeaf5';GX.beginPath();GX.arc(mx,my,18,0,Math.PI*2);GX.fill();
    // craters
    [[4,3,3],[-4,-2,2],[6,-5,1.5]].forEach(([cx,cy,cr])=>{
      GX.fillStyle='rgba(160,180,200,.3)';GX.beginPath();GX.arc(mx+cx,my+cy,cr,0,Math.PI*2);GX.fill();
    });
    // crescent shadow
    GX.fillStyle='rgba(2,4,8,.82)';GX.beginPath();GX.arc(mx+8,my,16,0,Math.PI*2);GX.fill();
    GX.globalAlpha=1;
  }
  
  function drawClouds(alpha,cloudC){
    if(alpha<=0)return;
    CLOUDS.forEach(cl=>{
      const cx=cl.x*GW,cy=cl.y*GH,cw=cl.w*GW;
      GX.globalAlpha=alpha*cl.op;
      GX.fillStyle=cloudC;
      [[0,0,cw*.52],[-.26*cw,.06*cw,cw*.38],[.3*cw,.05*cw,cw*.33],[.1*cw,-.08*cw,cw*.25]].forEach(([dx,dy,r])=>{
        GX.beginPath();GX.arc(cx+dx,cy+dy,r,0,Math.PI*2);GX.fill();
      });
    });
    GX.globalAlpha=1;
  }
  
  function drawMountains(b){
    const gy=gY(GH);
    GX.fillStyle=b.mtnF;
    GX.beginPath();GX.moveTo(0,gy);
    MTN_F.forEach(m=>{const mx=m.x*GW,mh=m.h*gy,mw=m.w*GW;GX.lineTo(mx-mw/2,gy);GX.lineTo(mx,gy-mh);GX.lineTo(mx+mw/2,gy);});
    GX.lineTo(GW,gy);GX.closePath();GX.fill();
    GX.fillStyle=b.mtnM;
    GX.beginPath();GX.moveTo(0,gy);
    MTN_M.forEach(m=>{const mx=m.x*GW,mh=m.h*gy,mw=m.w*GW;GX.lineTo(mx-mw/2,gy);GX.lineTo(mx,gy-mh);GX.lineTo(mx+mw/2,gy);});
    GX.lineTo(GW,gy);GX.closePath();GX.fill();
  }
  
  function drawTrees(b){
    const gy=gY(GH);
    TREES.forEach(t=>{
      const tx=t.x*GW;
      GX.fillStyle=b.treeD;GX.fillRect(tx-2,gy-t.th,4,t.th);
      [[0,-t.th,t.cr],[-.3*t.cr,-t.th*.65,t.cr*.7],[.28*t.cr,-t.th*.6,t.cr*.62]].forEach(([dx,dy,r])=>{
        GX.beginPath();GX.arc(tx+dx,gy+dy,r,0,Math.PI*2);
        GX.fillStyle=b.treeL;GX.fill();
        GX.globalAlpha=.3;GX.fillStyle=b.treeD;GX.beginPath();GX.arc(tx+dx+r*.2,gy+dy+r*.15,r*.65,0,Math.PI*2);GX.fill();
        GX.globalAlpha=1;
      });
    });
  }
  
  function drawGround(b){
    const gy=gY(GH);
    const gg=GX.createLinearGradient(0,gy,0,GH);
    gg.addColorStop(0,b.groundH);gg.addColorStop(.12,b.ground);gg.addColorStop(1,b.groundD);
    GX.fillStyle=gg;GX.fillRect(0,gy,GW,GH-gy);
    GX.strokeStyle=b.groundH;GX.lineWidth=2;
    GX.beginPath();GX.moveTo(0,gy);GX.lineTo(GW,gy);GX.stroke();
  
    // Zone tints
    const zones=[5,0,1,2,3];
    zones.forEach((row,zi)=>{
      GX.fillStyle=COL_COLORS[row];
      GX.globalAlpha=.04+rowGlow[row]*.1;
      GX.fillRect(zi*.2*GW,gy,.2*GW,GH-gy);
      GX.globalAlpha=1;
    });
    // Zone labels
    const labels=['bass','kick','snare','hi-hat','clap'];
    zones.forEach((row,zi)=>{
      GX.font=`700 7px 'Space Mono',monospace`;
      GX.fillStyle=COL_COLORS[row];GX.globalAlpha=.3+rowGlow[row]*.5;
      GX.textAlign='center';GX.textBaseline='top';
      GX.fillText(labels[zi].toUpperCase(),(zi+.5)*.2*GW,gy+5);
      GX.globalAlpha=1;
    });
    // Grass tufts
    GX.strokeStyle=b.groundH;GX.lineWidth=1;
    for(let x=8;x<GW;x+=20){
      const sw=1.5+Math.sin(x*.5+GT*.012)*1.2;
      GX.globalAlpha=.45;
      GX.beginPath();GX.moveTo(x,gy);GX.lineTo(x-sw,gy-sw-2);GX.stroke();
      GX.beginPath();GX.moveTo(x+5,gy);GX.lineTo(x+5+sw*.6,gy-sw-1);GX.stroke();
      GX.globalAlpha=1;
    }
    // Dashed zone dividers
    GX.setLineDash([3,6]);GX.lineWidth=1;
    [.2,.4,.6,.8].forEach(xf=>{
      GX.strokeStyle=b.groundH;GX.globalAlpha=.2;
      GX.beginPath();GX.moveTo(xf*GW,gy);GX.lineTo(xf*GW,GH);GX.stroke();
    });
    GX.setLineDash([]);GX.globalAlpha=1;
  }
  
  function drawPlats(b){
    PLATS.forEach(pd=>{
      const {x,y,w,h}=platR(pd,GW,GH);
      const row=pd.row, glow=rowGlow[row], col=COL_COLORS[row];
      if(glow>.05){GX.shadowColor=col;GX.shadowBlur=glow*18;}
      const pg=GX.createLinearGradient(x,y,x,y+h+6);
      pg.addColorStop(0,b.groundH);pg.addColorStop(1,b.groundD);
      GX.fillStyle=pg;grr(GX,x,y,w,h+6,4);GX.fill();
      GX.fillStyle=col;GX.globalAlpha=.4+glow*.5;
      GX.fillRect(x,y,w,4);
      GX.globalAlpha=1;GX.shadowBlur=0;
      // Label
      GX.font=`700 7px 'Space Mono',monospace`;
      GX.fillStyle=col;GX.globalAlpha=.55+glow*.4;
      GX.textAlign='right';GX.textBaseline='middle';
      GX.fillText(ROWS_CONFIG[row].abbr,x-4,y+h/2+3);
      GX.textAlign='center';GX.globalAlpha=1;
    });
  }
  
  function drawBirds(alpha,col){
    if(alpha<=0)return;
    BIRDS.forEach(b=>{
      const bx=b.x*GW,by=b.y*GH,f=Math.sin(b.ft)*.5;
      GX.strokeStyle=col;GX.lineWidth=1.4;GX.lineCap='round';GX.globalAlpha=alpha;
      GX.beginPath();
      GX.moveTo(bx-b.sz,by+f*b.sz*.5);
      GX.quadraticCurveTo(bx-b.sz*.3,by+f*b.sz,bx,by+f*b.sz*.12);
      GX.quadraticCurveTo(bx+b.sz*.3,by+f*b.sz,bx+b.sz,by+f*b.sz*.5);
      GX.stroke();GX.globalAlpha=1;
    });
  }
  
  function drawFireflies(alpha){
    if(alpha<=0)return;
    FLIES.forEach(f=>{
      const glow=Math.sin(f.p+GT*.055)*.5+.5;
      const a=alpha*glow*.88;
      const fx=f.x*GW,fy=f.y*GH;
      const gr=GX.createRadialGradient(fx,fy,0,fx,fy,7);
      gr.addColorStop(0,`rgba(160,255,100,${a})`);gr.addColorStop(1,'rgba(160,255,100,0)');
      GX.fillStyle=gr;GX.beginPath();GX.arc(fx,fy,7,0,Math.PI*2);GX.fill();
      GX.fillStyle=`rgba(200,255,140,${a})`;GX.beginPath();GX.arc(fx,fy,1.8,0,Math.PI*2);GX.fill();
    });
  }
  
  function drawFog(fogA){
    const fg=GX.createLinearGradient(0,0,0,GH);
    fg.addColorStop(0,'rgba(0,0,0,0)');fg.addColorStop(.55,'rgba(0,0,0,0)');
    const tod=TOD[todKey];
    const alpha=todT>=1?fogA:fogA*todT;
    const [r,g,b]=parseColor(tod.sky3);
    fg.addColorStop(1,`rgba(${r},${g},${b},${alpha})`);
    GX.fillStyle=fg;GX.fillRect(0,0,GW,GH);
  }
  
  function drawPaintFX(){
    // Footstep strokes
    strokes=strokes.filter(s=>s.life>0.02);
    strokes.forEach(s=>{
      const col=COL_COLORS[s.row];
      GX.globalAlpha=s.life*.72;
      GX.fillStyle=col;
      GX.beginPath();GX.ellipse(s.x,s.y-2,s.sz*(1+s.prob*.5),s.sz*.5,0,0,Math.PI*2);GX.fill();
      GX.strokeStyle=col;GX.lineWidth=1;GX.globalAlpha=s.life*s.prob*.4;
      GX.beginPath();GX.arc(s.x,s.y-2,s.sz*1.5,0,Math.PI*2);GX.stroke();
      GX.globalAlpha=1;s.life-=.013;
    });
    // Ink splatters
    splatters=splatters.filter(sp=>sp.parts.some(p=>p.life>.02));
    splatters.forEach(sp=>{
      const col=COL_COLORS[sp.row];
      sp.parts.forEach(p=>{
        if(p.life<=.02)return;
        p.dx+=p.vx;p.dy+=p.vy;p.vy+=.22;p.vx*=.92;p.life-=p.dec;
        GX.globalAlpha=p.life*.82;
        GX.fillStyle=col;
        GX.beginPath();GX.ellipse(sp.x+p.dx,sp.y+p.dy,p.r*p.life,p.r*p.life*.55,Math.atan2(p.vy,p.vx),0,Math.PI*2);GX.fill();
        if(p.dy>6&&p.life>.25){
          GX.globalAlpha=p.life*.25;GX.strokeStyle=col;GX.lineWidth=p.r*.4;
          GX.beginPath();GX.moveTo(sp.x+p.dx,sp.y+p.dy);GX.lineTo(sp.x+p.dx,sp.y+p.dy+p.r*1.4);GX.stroke();
        }
        GX.globalAlpha=1;
      });
    });
    // Erosion dust
    dustMotes=dustMotes.filter(d=>d.life>.02);
    dustMotes.forEach(d=>{
      d.y-=.35;d.life-=.018;
      GX.globalAlpha=d.life*.45;GX.fillStyle='rgba(190,180,160,.9)';
      GX.beginPath();GX.arc(d.x,d.y,2*d.life,0,Math.PI*2);GX.fill();GX.globalAlpha=1;
    });
  }
  
  function drawPlayer(){
    const px=P.xf*GW, py=P.y;
    const isNight=todKey==='night', isSunset=todKey==='sunset';
    const bCol=COL_COLORS[pRow()];
  
    // Ground shadow
    const shadowY=gY(GH);
    const dist=Math.max(0,shadowY-py);
    GX.globalAlpha=Math.max(0,.22-.0004*dist);
    GX.fillStyle='rgba(0,0,0,.5)';
    GX.beginPath();GX.ellipse(px,shadowY+1,Math.max(3,11-dist*.06),3,0,0,Math.PI*2);GX.fill();
    GX.globalAlpha=1;
  
    // Landing shockwave
    if(P.landFlash>0){
      GX.strokeStyle=bCol;GX.globalAlpha=P.landFlash*.65;GX.lineWidth=2;
      GX.beginPath();GX.ellipse(px,py,(1-P.landFlash)*28,5,0,0,Math.PI*2);GX.stroke();
      GX.globalAlpha=1;P.landFlash=Math.max(0,P.landFlash-.055);
    }
  
    GX.save();GX.translate(px,py);
  
    const air=!P.onGround&&!P.onPlat;
    const tilt=air?(P.vy>0?.08:-.08):0;
    GX.rotate(tilt);
  
    const lSw=P.moving&&!air?Math.sin(P.walkT*.2)*6:0;
    const aSw=P.moving?Math.sin(P.walkT*.2+Math.PI)*5:0;
    const sc=P.facing;
  
    const skin=isNight?'#d4b4f0':isSunset?'#f0c090':'#f5c9a0';
    const hair=isNight?'#7c3aed':isSunset?'#7a3a18':'#5a2a18';
    const shirt=isNight?'#4c1d95':isSunset?'#b03020':'#7c3aed';
    const pants=isNight?'#1e1b4b':isSunset?'#3a2818':'#2d2060';
    const shoe='#1a1a2a';
  
    // Legs
    GX.fillStyle=pants;
    GX.fillRect(sc*(-6)-1,-8+lSw*sc,5,11);
    GX.fillRect(sc*(1)+1,-8-lSw*sc*.5,5,11);
    GX.fillStyle=shoe;
    GX.fillRect(sc*(-7)+1,-8+lSw*sc+11,7,4);
    GX.fillRect(sc*(1)+1,-8-lSw*sc*.5+11,7,4);
  
    // Body
    GX.fillStyle=shirt;
    GX.fillRect(-7,-22,14,15);
    GX.fillStyle='rgba(255,255,255,.14)';
    GX.fillRect(-5,-21,5,6);
  
    // Brush (held out to side)
    const bx=sc*9+aSw*.18, by=-15+Math.abs(aSw)*.12;
    GX.strokeStyle=bCol;GX.lineWidth=2;GX.lineCap='round';
    GX.beginPath();GX.moveTo(sc*4,by);GX.lineTo(bx,by+13);GX.stroke();
    GX.fillStyle=bCol;GX.globalAlpha=.9;
    GX.beginPath();GX.arc(bx,by+13,3,0,Math.PI*2);GX.fill();
    GX.globalAlpha=1;
  
    // Arms
    GX.fillStyle=skin;
    GX.fillRect(sc*(-9),-20+aSw*.3,4,9);
    GX.fillRect(sc*(5),-20-aSw*.3,4,9);
  
    // Head
    GX.fillStyle=skin;GX.fillRect(-7,-34,14,13);
  
    // Hair
    GX.fillStyle=hair;GX.fillRect(-7,-34,14,5);
    GX.fillRect(sc*(-7),-34,3,8);
  
    // Eyes
    GX.fillStyle='#1a1020';
    GX.fillRect(sc*(1),-28,3,2);
    GX.fillRect(sc*(-5),-28,3,2);
    GX.fillStyle='rgba(255,255,255,.75)';
    GX.beginPath();GX.arc(sc*(2.2),-28,.8,0,Math.PI*2);GX.fill();
    GX.beginPath();GX.arc(sc*(-3.8),-28,.8,0,Math.PI*2);GX.fill();
  
    // Mouth
    const happy=rowGlow[pRow()]>.2;
    GX.strokeStyle='#5a2a18';GX.lineWidth=1.2;GX.lineCap='round';
    GX.beginPath();
    if(happy){GX.arc(0,-22,3,Math.PI*.05,Math.PI*.95);}
    else{GX.moveTo(-2.5,-22);GX.lineTo(2.5,-22);}
    GX.stroke();
  
    // Air motion lines
    if(air&&Math.abs(P.vy)>4){
      GX.strokeStyle=bCol;GX.lineWidth=.8;GX.globalAlpha=.2;
      for(let i=1;i<=4;i++){GX.beginPath();GX.moveTo(-5,i*4);GX.lineTo(5,i*4);GX.stroke();}
      GX.globalAlpha=1;
    }
  
    GX.restore();
  
    // Zone tag above head
    GX.font=`700 7px 'Space Mono',monospace`;
    GX.fillStyle=bCol;GX.globalAlpha=.75;
    GX.textAlign='center';GX.textBaseline='bottom';
    GX.fillText(ROWS_CONFIG[pRow()].abbr+' zone',px,py-37);
    GX.globalAlpha=1;
  
    // Erosion indicator
    if(P.stillF>70&&(P.onGround||P.onPlat)){
      const prog=Math.min(1,(P.stillF-70)/120);
      GX.strokeStyle='rgba(180,160,140,.55)';GX.lineWidth=1.4;
      GX.setLineDash([3,5]);
      GX.beginPath();GX.arc(px,py-12,16+prog*12,0,Math.PI*2);GX.stroke();
      GX.setLineDash([]);
      GX.font=`600 7px 'Space Mono',monospace`;
      GX.fillStyle='rgba(160,140,120,.7)';GX.textAlign='center';
      GX.fillText('eroding…',px,py-32);
    }
  }
  
  // ---- PHYSICS ----
  function updatePlayer(){
    const gy=gY(GH);
    const wasAir=!P.onGround&&!P.onPlat;
    P.moving=false;
    if(KEYS['ArrowLeft']||KEYS['a']){P.xf=Math.max(.01,P.xf-SPD);P.facing=-1;P.moving=true;}
    if(KEYS['ArrowRight']||KEYS['d']){P.xf=Math.min(.99,P.xf+SPD);P.facing=1;P.moving=true;}
    if(P.moving) P.walkT++;
  
    const jk=KEYS['ArrowUp']||KEYS['w']||KEYS[' '];
    if(jk&&(P.onGround||P.onPlat||P.jc<2)&&!KEYS._jh){
      P.vy=JVY;P.onGround=false;P.onPlat=false;P.jc++;KEYS._jh=true;
    }
    if(!jk)KEYS._jh=false;
  
    P.vy=Math.min(P.vy+GRAV,MFALL);
    P.y+=P.vy;
  
    P.onPlat=false;P.platRow=-1;
    if(P.vy>=0){
      PLATS.forEach(pd=>{
        const {x,y,w}=platR(pd,GW,GH);
        const px=P.xf*GW;
        if(px>x-8&&px<x+w+8&&P.y>=y-2&&P.y<=y+10){
          P.y=y;P.vy=0;P.onPlat=true;P.platRow=pd.row;P.jc=0;
        }
      });
    }
    if(P.y>=gy){P.y=gy;P.vy=0;P.onGround=true;P.jc=0;}
    else if(!P.onPlat){P.onGround=false;}
  
    const nowOn=P.onGround||P.onPlat;
    if(wasAir&&nowOn) doLand(GW);
    if(nowOn) doPaint(GW);
  }
  
  function updateWorld(){
    GT++;
    CLOUDS.forEach(cl=>{cl.x=(cl.x+cl.sp)%1.15;if(cl.x>1.15)cl.x=-.12;});
    BIRDS.forEach(b=>{b.x=(b.x+b.vx)%1.2;b.ft+=.13;if(b.x>1.2)b.x=-.06;});
    FLIES.forEach(f=>{
      f.x=Math.max(.01,Math.min(.99,f.x+f.vx+(Math.random()-.5)*.0003));
      f.y=Math.max(.38,Math.min(.70,f.y+f.vy+(Math.random()-.5)*.0002));
      f.p+=.03+Math.random()*.015;
    });
    rowGlow=rowGlow.map(v=>Math.max(0,v-.035));
    if(todT<1)todT=Math.min(1,todT+.011);
  }
  
  function drawGame(){
    gameResize();
    if(!GW||!GH)return;
  
    const tod=TOD[todKey];
    const blend=todT>=1?todSnap(todKey):blendColors(todT);
  
    const t=todT;
    const stA=todKey==='night'?t:0;
    const sA=tod.sun?t:0;
    const mA=tod.moon?t:0;
    const ffA=todKey==='night'?t:0;
    const bA=tod.birds?t*.85:0;
    const cA=todKey!=='night'?t*.8:(1-t)*.3;
  
    GX.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    drawGameSky(null,blend);
    drawGameStars(stA);
    drawSun(tod.sun,sA);
    drawMoon(mA);
    drawClouds(cA,tod.cloudC);
    drawMountains(blend);
    drawTrees(blend);
    drawBirds(bA,tod.birdC);
    drawFireflies(ffA);
    drawGround(blend);
    drawPlats(blend);
    drawFog(tod.fogA);
    drawPaintFX();
    drawPlayer();
  
    if(todT<.82){
      const f=todT<.2?todT/.2:1-(todT-.2)/.62;
      GX.globalAlpha=f*.65;
      GX.font=`700 10px 'Space Mono',monospace`;
      GX.fillStyle=todKey==='night'?'#a0b8e8':'#2a4040';
      GX.textAlign='center';GX.textBaseline='top';
      GX.fillText(tod.label,GW/2,8);
      GX.globalAlpha=1;
    }
  }
  
  // ---- TOD BUTTONS ----
  document.querySelectorAll('.tod-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const k=btn.dataset.tod; if(k===todKey)return;
      todFrom=todSnap(todKey);
      todKey=k; todT=0;
      document.querySelectorAll('.tod-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      applyTodToSequencer(k);
    });
  });
  
  // Flash row glow when sequencer fires
  function onGameRowFire(row){rowGlow[row]=Math.min(1,rowGlow[row]+.55);}
  
  // ---- INIT + LOOP ----
  applyTodToSequencer(todKey);
  // Set initial player Y after layout
  function initPlayerY(){
    gameResize();
    if(GH>0){P.y=gY(GH);}
    else{requestAnimationFrame(initPlayerY);}
  }
  requestAnimationFrame(initPlayerY);
  
  function animLoop(){
    updateWorld();
    updatePlayer();
    tickMusic();
    // Flash glow for currently-playing grid rows
    if(playing){
      for(let r=0;r<NROWS;r++){if(gA.grid[r][gA.ph])rowGlow[r]=Math.min(1,rowGlow[r]+.4);}
    }
    drawGame();
    if(ripples.length||particles2.length)drawInterference();
    requestAnimationFrame(animLoop);
  }
  requestAnimationFrame(animLoop);
  
  // ---- RESIZE ----
  let resizeTimer;
  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>render(),120);
  });
  
  // Seed B and initial render
  for(let r=0;r<NROWS;r++) for(let c=0;c<COLS_B;c++) if(Math.random()<.22){gB.grid[r][c]=1;if(ROWS_CONFIG[r].type==='pitched')assignPitch(gB,r,c);}
  render();
  
  })();
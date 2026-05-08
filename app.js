(() => {
  'use strict';
  
  // ---- CONFIG ----
  const ROWS_CONFIG = [
    { id:'bd',abbr:'bd',full:'kick',     type:'drum',   color:'#579fbd',glow:'rgba(87,159,189,.35)'  },
    { id:'sd',abbr:'sd',full:'snare',    type:'drum',   color:'#4a9d82',glow:'rgba(74,157,130,.35)'  },
    { id:'hh',abbr:'hh',full:'hi-hat',  type:'drum',   color:'#d99a5f',glow:'rgba(217,154,95,.35)'  },
    { id:'cp',abbr:'cp',full:'clap',     type:'drum',   color:'#d87590',glow:'rgba(216,117,144,.35)' },
    { id:'m1',abbr:'hi',full:'melody hi',type:'pitched',register:'hi',color:'#8f8fbc',glow:'rgba(143,143,188,.35)'},
    { id:'m2',abbr:'lo',full:'melody lo',type:'pitched',register:'lo',color:'#6f8f63',glow:'rgba(111,143,99,.35)' },
  ];
  const NROWS=ROWS_CONFIG.length, COLS_A=16;
  let COLS_B=13;
  const PROB_LEVELS=[0,.33,.66,1];
  
  // ZONES: map horizontal position (0..1) to row index
  const ZONES=[
    {name:'kick',    rowIdx:0, xStart:0,    xEnd:.17, color:'#579fbd'},
    {name:'snare',   rowIdx:1, xStart:.17,  xEnd:.33, color:'#4a9d82'},
    {name:'hi-hat',  rowIdx:2, xStart:.33,  xEnd:.50, color:'#d99a5f'},
    {name:'clap',    rowIdx:3, xStart:.50,  xEnd:.67, color:'#d87590'},
    {name:'melody↑', rowIdx:4, xStart:.67,  xEnd:.83, color:'#8f8fbc'},
    {name:'melody↓', rowIdx:5, xStart:.83,  xEnd:1.0, color:'#6f8f63'},
  ];
  
  // ---- CHORD DATA ----
  const CHORDS=[
    {name:'Cmaj',pad:['C3','E3','G3'], hiScale:['E4','G4','A4','C5','E5'],   loScale:['C3','D3','E3','G3','A3']},
    {name:'Amin',pad:['A2','C3','E3'], hiScale:['A4','C5','D5','E5','G5'],   loScale:['A2','C3','E3','G3','A3']},
    {name:'Fmaj',pad:['F2','A2','C3'], hiScale:['C5','D5','F5','G5','A5'],   loScale:['F2','G2','A2','C3','D3']},
    {name:'Gmaj',pad:['G2','B2','D3'], hiScale:['G4','A4','B4','D5','G5'],   loScale:['G2','A2','B2','D3','G3']},
    {name:'Dmin',pad:['D3','F3','A3'], hiScale:['D4','F4','A4','C5','D5'],   loScale:['D3','F3','A3','C4','D4']},
    {name:'Emin',pad:['E3','G3','B3'], hiScale:['E4','G4','A4','B4','E5'],   loScale:['E2','G2','B2','D3','E3']},
    {name:'Bdim',pad:['B2','D3','F3'], hiScale:['B4','D5','F5','A5','B5'],   loScale:['B2','D3','F3','A3','B3']},
    {name:'Csus4',pad:['C3','F3','G3'],hiScale:['C5','F5','G5','A5','C6'],   loScale:['C3','F3','G3','A3','C4']},
  ];
  const CHORD_TRANS=[
    [0.05,0.25,0.15,0.25,0.10,0.10,0.05,0.05],
    [0.30,0.05,0.10,0.10,0.05,0.20,0.10,0.10],
    [0.20,0.10,0.05,0.30,0.15,0.10,0.05,0.05],
    [0.35,0.15,0.10,0.05,0.10,0.10,0.10,0.05],
    [0.10,0.15,0.10,0.20,0.05,0.25,0.10,0.05],
    [0.15,0.20,0.05,0.15,0.15,0.05,0.15,0.10],
    [0.10,0.10,0.10,0.10,0.10,0.15,0.05,0.30],
    [0.30,0.10,0.15,0.15,0.10,0.10,0.05,0.05],
  ];
  function markovNextChord(i){const w=CHORD_TRANS[i];let r=Math.random();for(let j=0;j<w.length;j++){r-=w[j];if(r<=0)return j;}return 0;}
  
  // ---- DRUM KITS ----
  const DRUM_KITS={
    analog:{bd:{wave:'sine',start:132,end:43,dur:.27,gain:.9,click:.16,drive:0},sd:{tone:185,noiseFreq:1900,dur:.18,gain:.44,body:.23},hh:{freq:7200,dur:.055,gain:.28,metal:0},cp:{freq:2400,dur:.13,gain:.36,spread:.022},bass:{wave:'sine',dur:.34,gain:.58,drop:.54,drive:.04}},
    '808':{bd:{wave:'sine',start:96,end:34,dur:.52,gain:.94,click:.08,drive:.12},sd:{tone:170,noiseFreq:1500,dur:.22,gain:.4,body:.3},hh:{freq:8500,dur:.075,gain:.24,metal:.2},cp:{freq:2050,dur:.16,gain:.32,spread:.028},bass:{wave:'sine',dur:.46,gain:.72,drop:.48,drive:.18}},
    dust:{bd:{wave:'triangle',start:118,end:48,dur:.24,gain:.76,click:.28,drive:.28},sd:{tone:155,noiseFreq:1200,dur:.2,gain:.38,body:.18},hh:{freq:5200,dur:.07,gain:.2,metal:0},cp:{freq:1700,dur:.15,gain:.28,spread:.032},bass:{wave:'triangle',dur:.28,gain:.52,drop:.66,drive:.25}},
    metal:{bd:{wave:'sine',start:140,end:52,dur:.2,gain:.75,click:.24,drive:0},sd:{tone:245,noiseFreq:2600,dur:.16,gain:.38,body:.18},hh:{freq:9000,dur:.09,gain:.26,metal:1},cp:{freq:3200,dur:.12,gain:.32,spread:.018},bass:{wave:'sawtooth',dur:.24,gain:.5,drop:.72,drive:.1}},
    bit:{bd:{wave:'square',start:110,end:39,dur:.18,gain:.68,click:.32,drive:.7},sd:{tone:210,noiseFreq:2300,dur:.13,gain:.34,body:.16,drive:.75},hh:{freq:7600,dur:.045,gain:.22,metal:.35,drive:.75},cp:{freq:2800,dur:.09,gain:.28,spread:.016,drive:.75},bass:{wave:'square',dur:.18,gain:.42,drop:.58,drive:.65}},
  };
  const KIT_DESCS={analog:'analog drum voices','808':'deep 808 drum machine',dust:'dusty sampled drums',metal:'metallic synthetic percussion',bit:'bitcrushed digital drums'};
  let drumKit='analog';
  
  // ---- TIME OF DAY CONFIGS ----
  const TOD_CONFIGS={
    dawn:{
      skyTop:'#1a2a4a',skyBot:'#c97a4a',ground:'#7a9c6e',groundDark:'#5a7a52',
      sunColor:'#f59c42',fogColor:'rgba(255,200,140,.18)',
      starAlpha:0.3,moonAlpha:0,sunAlpha:1,sunY:0.78,
      ambientLight:'rgba(255,180,100,.08)',
      bpmMult:0.75, chaosAdd:-0.08, densityAdd:-0.1,
      label:'dawn',desc:'calm, sparse, waking up'
    },
    day:{
      skyTop:'#5ba3d4',skyBot:'#b8dff0',ground:'#88c270',groundDark:'#6aaa52',
      sunColor:'#ffe066',fogColor:'rgba(220,240,255,0)',
      starAlpha:0,moonAlpha:0,sunAlpha:1,sunY:0.18,
      ambientLight:'rgba(255,255,200,.04)',
      bpmMult:1.0, chaosAdd:0, densityAdd:0,
      label:'day',desc:'balanced, energetic'
    },
    sunset:{
      skyTop:'#1a2040',skyBot:'#e06030',ground:'#8a7050',groundDark:'#6a5038',
      sunColor:'#ff7030',fogColor:'rgba(255,100,60,.12)',
      starAlpha:0.15,moonAlpha:0,sunAlpha:1,sunY:0.7,
      ambientLight:'rgba(255,80,30,.1)',
      bpmMult:0.88, chaosAdd:0.05, densityAdd:0.05,
      label:'sunset',desc:'warm, slightly busier'
    },
    dusk:{
      skyTop:'#0d1228',skyBot:'#5a3060',ground:'#4a5a3a',groundDark:'#384828',
      sunColor:'#c040a0',fogColor:'rgba(100,40,120,.18)',
      starAlpha:0.6,moonAlpha:0.4,sunAlpha:0.3,sunY:0.88,
      ambientLight:'rgba(100,40,150,.12)',
      bpmMult:0.82, chaosAdd:0.08, densityAdd:-0.05,
      label:'dusk',desc:'moody, slower, sparse'
    },
    night:{
      skyTop:'#060810',skyBot:'#121830',ground:'#2a3428',groundDark:'#1e2820',
      sunColor:'#e0e8ff',fogColor:'rgba(40,50,100,.2)',
      starAlpha:1,moonAlpha:1,sunAlpha:0,sunY:0.35,
      ambientLight:'rgba(60,80,160,.1)',
      bpmMult:0.65, chaosAdd:-0.05, densityAdd:-0.15,
      label:'night',desc:'slow, ambient, minimal'
    },
  };
  let currentTOD='day';
  let todTransition={from:'day',to:'day',t:1};
  
  function lerp(a,b,t){return a+(b-a)*t;}
  function lerpColor(c1,c2,t){
    const p1=parseHex(c1),p2=parseHex(c2);
    return `rgb(${Math.round(lerp(p1[0],p2[0],t))},${Math.round(lerp(p1[1],p2[1],t))},${Math.round(lerp(p1[2],p2[2],t))})`;
  }
  function parseHex(hex){
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return[r,g,b];
  }
  function getTODBlend(){
    const {from,to,t}=todTransition;
    if(t>=1)return TOD_CONFIGS[to];
    const a=TOD_CONFIGS[from],b=TOD_CONFIGS[to];
    return{
      skyTop:lerpColor(a.skyTop,b.skyTop,t),
      skyBot:lerpColor(a.skyBot,b.skyBot,t),
      ground:lerpColor(a.ground,b.ground,t),
      groundDark:lerpColor(a.groundDark,b.groundDark,t),
      sunColor:lerpColor(a.sunColor,b.sunColor,t),
      sunY:lerp(a.sunY,b.sunY,t),
      starAlpha:lerp(a.starAlpha,b.starAlpha,t),
      moonAlpha:lerp(a.moonAlpha,b.moonAlpha,t),
      sunAlpha:lerp(a.sunAlpha,b.sunAlpha,t),
      fogColor:a.fogColor,
      ambientLight:a.ambientLight,
      bpmMult:lerp(a.bpmMult,b.bpmMult,t),
      chaosAdd:lerp(a.chaosAdd,b.chaosAdd,t),
      densityAdd:lerp(a.densityAdd,b.densityAdd,t),
    };
  }
  
  // ---- STATE ----
  let playing=false,frozen=false,paintMode='draw';
  let chordIdx=0,nextChordIdx=0,barCount=0;
  let params={chaos:.18,density:.30,rep:.55,smooth:.45};
  let rowPull=new Array(NROWS).fill(0);
  let coupling=0;
  let masterTick=0,nextBTick=0;
  let iv=null;
  let collisionCount=0;
  const INT_HISTORY=200;
  let interferenceHistory=new Array(INT_HISTORY).fill(0);
  let ripples=[],particles2=[],lastFlash=0;
  
  function makeGrid(cols){
    return{
      grid:Array.from({length:NROWS},()=>new Array(cols).fill(0)),
      biasGrid:Array.from({length:NROWS},()=>new Array(cols).fill(false)),
      pitchGrid:Array.from({length:NROWS},()=>new Array(cols).fill(null)),
      velGrid:Array.from({length:NROWS},()=>Array.from({length:cols},()=>.7+Math.random()*.5)),
      ph:0,cols,
    };
  }
  let gA=makeGrid(COLS_A);
  let gB=makeGrid(COLS_B);
  
  (function seedA(){
    const p=[[1,0,0,.33,1,0,0,.33,1,0,.33,0,1,0,0,.66],[0,0,.66,0,0,0,1,0,0,0,.66,0,0,.33,1,0],[.66,0,.66,0,.66,.33,.66,0,.66,0,.66,.33,.66,0,1,0],[0,0,0,0,0,.33,0,0,0,0,0,.66,0,0,.33,0],[0,.33,0,0,0,.66,0,.33,0,.33,0,0,0,.66,0,.33],[.66,0,0,0,.33,0,0,0,.66,0,0,.33,0,0,0,.66]];
    for(let r=0;r<NROWS;r++)for(let c=0;c<COLS_A;c++)gA.grid[r][c]=p[r][c];
  })();
  
  // ---- AUDIO ----
  let AC=null,masterGain=null,limiter=null;
  let underwaterFilter=null, underwaterLfo=null, underwaterLfoGain=null;
  let underwaterActive=false;
  let underwaterDepth01=0;
  let melBufs={},padBufs={},loaded=false;
  let currentPadSrcs=[];
  function ac(){if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();return AC;}
  function output(){
    if(!masterGain){
      masterGain=ac().createGain();masterGain.gain.value=.78;
      limiter=ac().createDynamicsCompressor();
      limiter.threshold.value=-12;limiter.knee.value=8;limiter.ratio.value=8;
      limiter.attack.value=.003;limiter.release.value=.18;

      // Underwater effect chain: master -> lowpass + LFO -> limiter -> destination
      underwaterFilter=ac().createBiquadFilter();
      underwaterFilter.type='lowpass';
      underwaterFilter.frequency.value=20000;
      underwaterFilter.Q.value=0.7;

      masterGain.connect(underwaterFilter);
      underwaterFilter.connect(limiter);
      limiter.connect(ac().destination);

      // LFO (started once audio context exists)
      underwaterLfo=ac().createOscillator();
      underwaterLfo.type='sine';
      underwaterLfo.frequency.value=0.55; // subtle wobble
      underwaterLfoGain=ac().createGain();
      underwaterLfoGain.gain.value=0; // depth is enabled when underwater
      underwaterLfo.connect(underwaterLfoGain);
      underwaterLfoGain.connect(underwaterFilter.frequency);
      underwaterLfo.start();

      setUnderwater(underwaterActive, underwaterDepth01);
    }
    return masterGain;
  }

  function setUnderwater(active, depth01=1){
    underwaterActive = !!active;
    underwaterDepth01 = depth01;
    if(!underwaterFilter || !AC) return;
    const t = ac().currentTime;
    const d = Math.max(0, Math.min(1, depth01));
    // When underwater: lowpass cutoff lowers + LFO depth increases
    const cutoff = 20000 - d*(18000);
    const depth = 0 + d*(1200);
    underwaterFilter.frequency.setTargetAtTime(cutoff, t, 0.05);
    if(underwaterLfoGain) underwaterLfoGain.gain.setTargetAtTime(depth, t, 0.05);
  }
  function master(){const g=ac().createGain();g.gain.value=0;g.connect(output());return g;}
  async function unlockAudio(){
    if(!window.AudioContext&&!window.webkitAudioContext)return false;
    output();if(ac().state==='suspended')await ac().resume();
    const s=ac().createBufferSource();s.buffer=ac().createBuffer(1,1,ac().sampleRate);
    const g=ac().createGain();g.gain.value=0;s.connect(g);g.connect(output());s.start();s.stop(ac().currentTime+.01);
    return ac().state==='running';
  }
  function makeNoise(dur){
    const a=ac(),len=Math.max(1,Math.floor(a.sampleRate*dur)),buf=a.createBuffer(1,len,a.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    const s=a.createBufferSource();s.buffer=buf;return s;
  }
  function makeDrive(amt){
    const ws=ac().createWaveShaper(),curve=new Float32Array(256),k=1+amt*90;
    for(let i=0;i<256;i++){const x=(i*2)/255-1;curve[i]=(Math.PI+k)*x/(Math.PI+k*Math.abs(x));}
    ws.curve=curve;ws.oversample='2x';return ws;
  }
  function withDrive(src,dst,amt){if(!amt){src.connect(dst);return;}const d=makeDrive(amt);src.connect(d);d.connect(dst);}
  function filtNoise({type,freq,q,t,dur,gain,drive=0}){
    const a=ac(),s=makeNoise(dur),f=a.createBiquadFilter(),g=master();
    f.type=type;f.frequency.value=freq;f.Q.value=q;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(gain,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+dur);
    s.connect(f);withDrive(f,g,drive);s.start(t);s.stop(t+dur);
  }
  function playDrum(rowId,gainMult=1){
    const a=ac(),t=a.currentTime,kit=DRUM_KITS[drumKit];
    if(rowId==='bd'){
      const k=kit.bd,o=a.createOscillator(),g=master();
      o.type=k.wave;o.frequency.setValueAtTime(k.start,t);o.frequency.exponentialRampToValueAtTime(k.end,t+k.dur*.7);
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(k.gain*gainMult,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+k.dur);
      withDrive(o,g,k.drive);o.start(t);o.stop(t+k.dur+.02);
      if(k.click)filtNoise({type:'highpass',freq:3600,q:.3,t,dur:.018,gain:k.click*gainMult,drive:k.drive});
    }else if(rowId==='sd'){
      const k=kit.sd;
      filtNoise({type:'bandpass',freq:k.noiseFreq,q:.9,t,dur:k.dur,gain:k.gain*gainMult,drive:k.drive||0});
      const o=a.createOscillator(),b=master();
      o.type='triangle';o.frequency.setValueAtTime(k.tone,t);o.frequency.exponentialRampToValueAtTime(k.tone*.82,t+k.dur);
      b.gain.setValueAtTime(.0001,t);b.gain.linearRampToValueAtTime(k.body*gainMult,t+.005);b.gain.exponentialRampToValueAtTime(.001,t+k.dur*.75);
      withDrive(o,b,k.drive||0);o.start(t);o.stop(t+k.dur);
    }else if(rowId==='hh'){
      const k=kit.hh;
      filtNoise({type:'highpass',freq:k.freq,q:.5,t,dur:k.dur,gain:k.gain*gainMult,drive:k.drive||0});
      if(k.metal)[1,1.37,1.82].forEach((ratio,i)=>{
        const o=a.createOscillator(),g=master();o.type='square';o.frequency.value=k.freq*.38*ratio;
        g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime((.06*k.metal*gainMult)/(i+1),t+.003);g.gain.exponentialRampToValueAtTime(.001,t+k.dur*.9);
        withDrive(o,g,k.drive||0);o.start(t);o.stop(t+k.dur);
      });
    }else if(rowId==='cp'){
      const k=kit.cp;
      [0,k.spread,k.spread*1.9].forEach((off,i)=>filtNoise({type:'bandpass',freq:k.freq+i*180,q:1.25,t:t+off,dur:k.dur,gain:k.gain*gainMult/(1+i*.22),drive:k.drive||0}));
    }
  }
  function noteToMidi(note){
    const map={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
    const m=note.match(/^([A-G])(#|b)?(-?\d+)$/);if(!m)return 60;
    return(parseInt(m[3])+1)*12+map[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);
  }
  function midiName(midi){return['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'][midi%12]+(Math.floor(midi/12)-1);}
  async function fetchBuf(inst,note){
    const url=`https://gleitz.github.io/midi-js-soundfonts/MusyngKite/${inst}-mp3/${midiName(noteToMidi(note))}.mp3`;
    const ab=await(await fetch(url)).arrayBuffer();return ac().decodeAudioData(ab);
  }
  async function initAudio(){
    document.getElementById('loading-status').textContent='loading samples…';
    const mel=new Set(),pad=new Set();
    CHORDS.forEach(c=>{c.hiScale.forEach(n=>mel.add(n));c.loScale.forEach(n=>mel.add(n));c.pad.forEach(n=>pad.add(n));});
    try{
      await Promise.all([
        ...[...mel].map(async n=>{melBufs[n]=await fetchBuf('electric_piano_1',n);}),
        ...[...pad].map(async n=>{padBufs[n]=await fetchBuf('string_ensemble_1',n);}),
      ]);
      loaded=true;
      document.getElementById('loading-status').textContent='samples ready';
    }catch(e){document.getElementById('loading-status').textContent='load failed: '+e.message;}
  }
  function playSample(buf,gain=1,dur=null){
    if(!buf||!AC)return null;
    const src=AC.createBufferSource(),g=AC.createGain();
    src.buffer=buf;src.connect(g);g.connect(output());
    g.gain.setValueAtTime(gain,AC.currentTime);
    if(dur){g.gain.setValueAtTime(gain,AC.currentTime+dur*.85);g.gain.linearRampToValueAtTime(0,AC.currentTime+dur);}
    src.start();if(dur)src.stop(AC.currentTime+dur+.05);
    return src;
  }
  function playPad(ci){
    currentPadSrcs.forEach(s=>{try{s.stop();}catch(e){}});
    currentPadSrcs=[];
    const bpm=parseInt(document.getElementById('sl-bpm').value),barDur=(60/bpm)*4;
    CHORDS[ci].pad.forEach(n=>{const s=playSample(padBufs[n],.4,barDur);if(s)currentPadSrcs.push(s);});
  }
  function assignPitch(g,r,c){
    const rc=ROWS_CONFIG[r];if(rc.type!=='pitched')return;
    const chord=CHORDS[chordIdx],scale=rc.register==='hi'?chord.hiScale:chord.loScale;
    g.pitchGrid[r][c]=scale[Math.floor(Math.random()*scale.length)];
    g.velGrid[r][c]=.5+Math.random()*.8;
  }
  function reassignAllPitches(g){
    for(let r=0;r<NROWS;r++){
      if(ROWS_CONFIG[r].type!=='pitched')continue;
      const chord=CHORDS[chordIdx],scale=ROWS_CONFIG[r].register==='hi'?chord.hiScale:chord.loScale;
      for(let c=0;c<g.cols;c++){
        if(!g.grid[r][c])continue;
        const cur=g.pitchGrid[r][c]?noteToMidi(g.pitchGrid[r][c]):noteToMidi(scale[0]);
        let best=scale[0],bestD=999;
        scale.forEach(n=>{const d=Math.abs(noteToMidi(n)-cur);if(d<bestD){bestD=d;best=n;}});
        g.pitchGrid[r][c]=Math.random()<.4?scale[Math.floor(Math.random()*scale.length)]:best;
      }
    }
  }
  function triggerPitched(g,r,c,gainMult=1){
    if(!loaded||!AC)return;
    const note=g.pitchGrid[r][c];if(!note||!melBufs[note])return;
    setTimeout(()=>playSample(melBufs[note],g.velGrid[r][c]*gainMult,.38),Math.random()*15);
  }
  
  // ---- GRID RENDERER ----
  const caEl=document.getElementById('ca');
  const cbEl=document.getElementById('cb');
  const ctxA=caEl.getContext('2d');
  const ctxB=cbEl.getContext('2d');
  const LABEL_W=56,TOP_H=22,CELL_H=30,CELL_PAD=3;
  const COL_COLORS=['#579fbd','#4a9d82','#d99a5f','#d87590','#8f8fbc','#6f8f63'];
  const COL_GLOWS=['rgba(87,159,189,.35)','rgba(74,157,130,.35)','rgba(217,154,95,.35)','rgba(216,117,144,.35)','rgba(143,143,188,.35)','rgba(111,143,99,.35)'];
  function gridHeight(){return TOP_H+NROWS*CELL_H;}
  function resizeGridCanvas(el){
    const W=el.offsetWidth*devicePixelRatio,H=gridHeight()*devicePixelRatio;
    if(el.width!==W||el.height!==H){el.width=W;el.height=H;el.style.height=gridHeight()+'px';}
  }
  function drawGrid(el,ctx,g,isA){
    resizeGridCanvas(el);
    const dpr=devicePixelRatio,W=el.offsetWidth,H=gridHeight();
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    const cols=g.cols,cellW=(W-LABEL_W)/cols;
    ctx.font=`700 8px 'Space Mono',monospace`;ctx.textAlign='center';ctx.textBaseline='middle';
    for(let c=0;c<cols;c++){
      const cx=LABEL_W+c*cellW+cellW/2;
      ctx.fillStyle=c===g.ph?'#ad5f74':'rgba(36,66,80,.45)';
      ctx.fillText(String(c+1).padStart(2,'0'),cx,TOP_H*.5);
    }
    if(g.ph>=0){ctx.fillStyle='rgba(216,117,144,.1)';ctx.fillRect(LABEL_W+g.ph*cellW,TOP_H,cellW,NROWS*CELL_H);}
    for(let r=0;r<NROWS;r++){
      const rc=ROWS_CONFIG[r],cy=TOP_H+r*CELL_H;
      ctx.textAlign='right';ctx.fillStyle=COL_COLORS[r];
      ctx.font=`700 11px 'Space Mono',monospace`;ctx.fillText(rc.abbr,LABEL_W-10,cy+CELL_H/2-3);
      ctx.fillStyle='rgba(36,66,80,.4)';ctx.font=`7px 'Space Mono',monospace`;
      ctx.fillText(rc.full,LABEL_W-10,cy+CELL_H/2+8);ctx.textAlign='center';
      for(let c=0;c<cols;c++){
        const val=g.grid[r][c],isBias=g.biasGrid[r][c];
        const cx=LABEL_W+c*cellW+CELL_PAD,cw=cellW-CELL_PAD*2,ch=CELL_H-CELL_PAD*2;
        const cy2=cy+CELL_PAD,active=c===g.ph;
        ctx.save();
        if(val>=1){ctx.shadowColor=COL_GLOWS[r];ctx.shadowBlur=14;}
        else if(val>=.66){ctx.shadowColor=COL_GLOWS[r];ctx.shadowBlur=6;}
        const alpha=isA?(.04+val*.44):(val?.42:.04);
        ctx.fillStyle=`rgba(${hexToRgb(COL_COLORS[r])},${alpha})`;
        if(isBias){ctx.strokeStyle='rgba(217,154,95,.85)';ctx.lineWidth=2;}
        else{ctx.strokeStyle=active?COL_COLORS[r]:`rgba(36,66,80,${.1+val*.18})`;ctx.lineWidth=active?1.8:1;}
        rr(ctx,cx,cy2,cw,ch,4);ctx.fill();ctx.stroke();
        if(isA&&val>0){ctx.fillStyle=COL_COLORS[r];ctx.globalAlpha=.15+val*.4;ctx.fillRect(cx+4,cy2+ch-4,Math.max(2,(cw-8)*val),2);}
        if(val&&ROWS_CONFIG[r].type==='pitched'&&g.pitchGrid[r][c]){ctx.globalAlpha=.7;ctx.font=`6px 'Space Mono',monospace`;ctx.fillStyle='#fff';ctx.fillText(g.pitchGrid[r][c],cx+cw/2,cy2+ch-5);}
        ctx.restore();
      }
    }
  }
  function hexToRgb(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`${r},${g},${b}`;}
  function rr(ctx,x,y,w,h,r2){
    if(w<=0||h<=0){ctx.beginPath();ctx.rect(x,y,Math.max(0,w),Math.max(0,h));return;}
    const r3=Math.min(r2,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+r3,y);ctx.arcTo(x+w,y,x+w,y+h,r3);ctx.arcTo(x+w,y+h,x,y+h,r3);ctx.arcTo(x,y+h,x,y,r3);ctx.arcTo(x,y,x+w,y,r3);ctx.closePath();
  }
  function render(){
    drawGrid(caEl,ctxA,gA,true);
    drawGrid(cbEl,ctxB,gB,false);
    updateChordPills();
    updateStrudel();
    drawInterference();
  }
  
  // ---- PAINT ----
  let painting=false,paintVal=0,paintedSet=new Set(),paintingGrid=null;
  function cellAt(el,g,ex,ey){
    const rect=el.getBoundingClientRect(),x=(ex-rect.left),y=(ey-rect.top);
    const cols=g.cols,cellW=(el.offsetWidth-LABEL_W)/cols;
    const gx=x-LABEL_W,gy=y-TOP_H;
    if(gx<0||gy<0||gx>=cellW*cols||gy>=NROWS*CELL_H)return null;
    return{r:Math.floor(gy/CELL_H),c:Math.floor(gx/cellW)};
  }
  function applyPaint(g,r,c){
    if(frozen)return;
    if(paintMode==='erase'){g.grid[r][c]=0;g.biasGrid[r][c]=false;g.pitchGrid[r][c]=null;}
    else if(paintMode==='bias'){g.biasGrid[r][c]=!g.biasGrid[r][c];}
    else{
      if(g===gA){const idx=PROB_LEVELS.indexOf(g.grid[r][c]);g.grid[r][c]=PROB_LEVELS[(idx+1)%PROB_LEVELS.length];}
      else{g.grid[r][c]=g.grid[r][c]?0:1;}
      if(g.grid[r][c]&&ROWS_CONFIG[r].type==='pitched')assignPitch(g,r,c);
    }
  }
  function setupGridPaint(el,g){
    el.addEventListener('pointerdown',e=>{
      const hit=cellAt(el,g,e.clientX,e.clientY);if(!hit)return;
      e.preventDefault();painting=true;paintingGrid=g;paintedSet.clear();
      paintedSet.add(hit.r+':'+hit.c);applyPaint(g,hit.r,hit.c);render();
      if(el.setPointerCapture)el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove',e=>{
      if(!painting||paintingGrid!==g)return;
      const hit=cellAt(el,g,e.clientX,e.clientY);if(!hit)return;
      const key=hit.r+':'+hit.c;if(paintedSet.has(key))return;
      paintedSet.add(key);applyPaint(g,hit.r,hit.c);render();
    });
    const stop=e=>{painting=false;paintingGrid=null;paintedSet.clear();if(el.releasePointerCapture)try{el.releasePointerCapture(e.pointerId);}catch(e2){}};
    el.addEventListener('pointerup',stop);el.addEventListener('pointercancel',stop);
  }
  setupGridPaint(caEl,gA);
  setupGridPaint(cbEl,gB);
  
  // ---- INTERFERENCE ----
  const intCanvas=document.getElementById('int-canvas');
  const intCtx=intCanvas.getContext('2d');
  function drawInterference(){
    const W=intCanvas.offsetWidth,H=intCanvas.offsetHeight||90;
    if(intCanvas.width!==W||intCanvas.height!==H){intCanvas.width=W;intCanvas.height=H;}
    intCtx.fillStyle='rgba(219,233,238,.55)';intCtx.fillRect(0,0,W,H);
    const phFracA=gA.ph/COLS_A,phFracB=gB.ph/gB.cols;
    const phaseOffset=Math.abs(phFracA-phFracB);
    const convergence=Math.max(0,1-phaseOffset/.15);
    const laneH=Math.floor(H*.55),step=W/INT_HISTORY;
    intCtx.strokeStyle='rgba(36,66,80,.1)';intCtx.lineWidth=.5;
    for(let i=1;i<4;i++){const y=laneH*i/4;intCtx.beginPath();intCtx.moveTo(0,y);intCtx.lineTo(W,y);intCtx.stroke();}
    intCtx.beginPath();intCtx.moveTo(0,laneH/2);
    for(let i=0;i<INT_HISTORY;i++){const amp=interferenceHistory[i]*(laneH/2-2);intCtx.lineTo(i*step,laneH/2-amp);}
    for(let i=INT_HISTORY-1;i>=0;i--){const amp=interferenceHistory[i]*(laneH/2-2);intCtx.lineTo(i*step,laneH/2+amp);}
    intCtx.closePath();
    const r1=Math.round(87+convergence*168),g1=Math.round(159+convergence*96),b1=Math.round(189+convergence*66);
    intCtx.fillStyle=`rgba(${r1},${g1},${b1},${.15+convergence*.25})`;intCtx.fill();
    intCtx.beginPath();intCtx.moveTo(0,laneH/2);
    for(let i=0;i<INT_HISTORY;i++){const amp=interferenceHistory[i]*(laneH/2-2);intCtx.lineTo(i*step,laneH/2-amp);}
    intCtx.strokeStyle=`rgba(${r1},${g1},${b1},${.55+convergence*.45})`;intCtx.lineWidth=1.5;intCtx.stroke();
    const xA=phFracA*W,xB=phFracB*W;
    [[xA,'rgba(87,159,189,.9)'],[xB,'rgba(143,143,188,.9)']].forEach(([x,col])=>{
      intCtx.strokeStyle=col;intCtx.lineWidth=1.5;intCtx.beginPath();intCtx.moveTo(x,0);intCtx.lineTo(x,laneH);intCtx.stroke();
    });
    intCtx.font=`bold 8px 'Space Mono',monospace`;
    intCtx.fillStyle='rgba(87,159,189,.8)';intCtx.fillText('A',xA+3,10);
    intCtx.fillStyle='rgba(143,143,188,.8)';intCtx.fillText('B',xB+3,10);
    if(convergence>.85){
      const midX=(xA+xB)/2,fa=(convergence-.85)/.15;
      const flash=intCtx.createLinearGradient(midX-60,0,midX+60,0);
      flash.addColorStop(0,'rgba(255,255,255,0)');flash.addColorStop(.5,`rgba(255,255,255,${fa*.45})`);flash.addColorStop(1,'rgba(255,255,255,0)');
      intCtx.fillStyle=flash;intCtx.fillRect(midX-60,0,120,laneH);
      const now=Date.now();
      if(now-lastFlash>180){lastFlash=now;
        ripples.push({x:midX,y:laneH/2,age:0,maxAge:38,intensity:fa});
        for(let i=0;i<8+Math.round(fa*8);i++){const a=Math.random()*Math.PI*2,sp=.5+Math.random()*2.5;particles2.push({x:midX,y:laneH/2,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,color:'rgba(87,159,189,0.9)'});}
      }
    }
    const l2Y=laneH+3,l2H=H-l2Y-2,cx2=l2Y+l2H/2,amp2=l2H/2-2;
    intCtx.fillStyle='rgba(210,225,230,.5)';intCtx.fillRect(0,l2Y,W,l2H);
    [['rgba(87,159,189,.55)',t=>t*Math.PI*4,phFracA],['rgba(143,143,188,.55)',t=>t*Math.PI*4*(gB.cols/COLS_A),phFracB]].forEach(([col,tf,ph])=>{
      intCtx.beginPath();
      for(let x=0;x<W;x++){const y=cx2+Math.sin(tf(x/W)+ph*Math.PI*2)*amp2;x===0?intCtx.moveTo(x,y):intCtx.lineTo(x,y);}
      intCtx.strokeStyle=col;intCtx.lineWidth=1.2;intCtx.stroke();
    });
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
  
  function updateStrudel(){
    const steps=[];
    for(let c=0;c<COLS_A;c++)steps.push(gA.grid[4][c]&&gA.pitchGrid[4][c]?gA.pitchGrid[4][c].toLowerCase():'~');
    document.getElementById('strudel-box').textContent=`note("${steps.join(' ')}")`;
  }
  
  // ---- EVOLVE ----
  function evolveGrid(g){
    const{chaos,density,rep,smooth}=params;
    const tod=getTODBlend();
    const effChaos=Math.max(0,Math.min(1,chaos+tod.chaosAdd));
    const effDensity=Math.max(0,Math.min(1,density+tod.densityAdd));
    g.grid=g.grid.map((row,r)=>row.map((cell,c)=>{
      const isPitched=ROWS_CONFIG[r].type==='pitched';
      let bias=0;
      for(let br=Math.max(0,r-1);br<=Math.min(NROWS-1,r+1);br++)for(let bc=Math.max(0,c-1);bc<=Math.min(g.cols-1,c+1);bc++)if(g.biasGrid[br][bc])bias+=.12;
      bias=Math.min(bias,.4);
      const pull=rowPull[r]*.3;
      let p=cell?(isPitched?.6+rep*.2:.55+rep*.15):(isPitched?effDensity*.25:effDensity*.4);
      p+=bias+pull;
      const prev=(c-1+g.cols)%g.cols,next=(c+1)%g.cols;
      const nb=(g.grid[r][prev]+g.grid[r][next])/2;
      if(cell)p=p*(1-smooth*.15)+smooth*.15*(nb>.5?.9:.1);
      p+=(Math.random()-.5)*effChaos;
      const nxt=Math.random()<Math.max(.02,Math.min(.97,p))?1:0;
      if(nxt&&!cell&&isPitched)assignPitch(g,r,c);
      if(nxt&&cell&&isPitched&&Math.random()<.15)assignPitch(g,r,c);
      return nxt;
    }));
  }
  function applyCoupling(){
    if(coupling<.01)return;
    for(let r=0;r<NROWS;r++)for(let c=0;c<COLS_A;c++){
      const cB=Math.round((c/COLS_A)*gB.cols)%gB.cols;
      if(gA.grid[r][c]&&!gB.grid[r][cB]&&Math.random()<coupling*.3){gB.grid[r][cB]=1;assignPitch(gB,r,cB);}
      if(gB.grid[r][cB]&&!gA.grid[r][c]&&Math.random()<coupling*.3){gA.grid[r][c]=PROB_LEVELS[1];assignPitch(gA,r,c);}
    }
  }
  function recordInterference(){
    const phFracA=gA.ph/COLS_A,phFracB=gB.ph/gB.cols;
    const inPhase=Math.abs(phFracA-phFracB)<1/Math.max(COLS_A,gB.cols);
    let hits=0;
    if(inPhase)for(let r=0;r<NROWS;r++)if(gA.grid[r][gA.ph]&&gB.grid[r][gB.ph])hits++;
    const score=inPhase?hits/NROWS:0;
    interferenceHistory.push(score);if(interferenceHistory.length>INT_HISTORY)interferenceHistory.shift();
    if(score>0){collisionCount++;document.getElementById('sb-coll').textContent=collisionCount;}
  }
  
  // ---- MASTER STEP ----
  function masterStep(){
    gA.ph=(gA.ph+1)%COLS_A;
    if(gA.ph===0){
      chordIdx=nextChordIdx;nextChordIdx=markovNextChord(chordIdx);
      reassignAllPitches(gA);reassignAllPitches(gB);
      if(loaded)playPad(chordIdx);
      barCount++;
      document.getElementById('sb-bar').textContent=barCount;
      document.getElementById('cur-chord').textContent=CHORDS[chordIdx].name;
      document.getElementById('next-chord').textContent=CHORDS[nextChordIdx].name;
      document.getElementById('sb-chord').textContent=CHORDS[chordIdx].name;
      document.getElementById('sb-next').textContent=CHORDS[nextChordIdx].name;
      // TOD blend transition
      todTransition.t=Math.min(1,todTransition.t+.15);
    }
    for(let r=0;r<NROWS;r++){
      if(!gA.grid[r][gA.ph])continue;
      if(ROWS_CONFIG[r].type==='drum')playDrum(ROWS_CONFIG[r].id,1.0);
      else triggerPitched(gA,r,gA.ph,1.0);
    }
    masterTick++;
    if(masterTick>=nextBTick){
      nextBTick=masterTick+COLS_A/gB.cols;
      gB.ph=(gB.ph+1)%gB.cols;
      for(let r=0;r<NROWS;r++){
        if(!gB.grid[r][gB.ph])continue;
        if(ROWS_CONFIG[r].type==='drum')playDrum(ROWS_CONFIG[r].id,.65);
        else triggerPitched(gB,r,gB.ph,.65);
      }
      if(!frozen)evolveGrid(gB);
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
    const old=gB.grid,oldBias=gB.biasGrid;
    gB=makeGrid(cols);
    for(let r=0;r<NROWS;r++)for(let c=0;c<cols;c++){
      const oc=Math.round(c/cols*old[r].length)%old[r].length;
      gB.grid[r][c]=old[r][oc];gB.biasGrid[r][c]=oldBias[r][oc];
      if(gB.grid[r][c])assignPitch(gB,r,c);
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
    const div=document.createElement('div');div.className='pull-item';
    const nm=document.createElement('div');nm.className='rp-name';nm.style.color=COL_COLORS[r];nm.textContent=rc.abbr.toUpperCase();
    const sub=document.createElement('div');sub.className='rp-sub';sub.textContent=rc.full;
    const sl=document.createElement('input');sl.type='range';sl.min=-50;sl.max=50;sl.value=0;
    const val=document.createElement('div');val.className='rp-val';val.textContent='0.00';
    sl.oninput=()=>{rowPull[r]=parseInt(sl.value)/50;val.textContent=rowPull[r].toFixed(2);};
    div.append(nm,sub,sl,val);rpWrap.appendChild(div);
  });
  
  // ---- CONTROLS ----
  document.getElementById('play').addEventListener('click',async function(){
    const ready=await unlockAudio();if(!ready)return;if(!AC)return;
    if(playing){
      clearInterval(iv);playing=false;
      this.classList.remove('playing');this.setAttribute('aria-label','Play');
      currentPadSrcs.forEach(s=>{try{s.stop();}catch(e){}});
      if(!loaded)initAudio();
    }else{
      if(!loaded)await initAudio();
      nextChordIdx=markovNextChord(chordIdx);
      if(loaded)playPad(chordIdx);
      masterTick=0;nextBTick=COLS_A/gB.cols;
      const bpm=parseInt(document.getElementById('sl-bpm').value);
      const tod=getTODBlend();
      const effBpm=Math.round(bpm*tod.bpmMult);
      iv=setInterval(masterStep,60/effBpm/4*1000);
      playing=true;
      this.classList.add('playing');this.setAttribute('aria-label','Pause');
      document.getElementById('cur-chord').textContent=CHORDS[chordIdx].name;
      document.getElementById('next-chord').textContent=CHORDS[nextChordIdx].name;
    }
  });
  document.getElementById('randomize').addEventListener('click',()=>{
    if(frozen)return;
    [gA,gB].forEach((g,gi)=>{
      for(let r=0;r<NROWS;r++)for(let c=0;c<g.cols;c++){
        const v=gi===0?PROB_LEVELS[Math.floor(Math.random()*4)]:Math.random()<.28?1:0;
        g.grid[r][c]=v;if(v&&ROWS_CONFIG[r].type==='pitched')assignPitch(g,r,c);
      }
    });render();
  });
  document.getElementById('mutate').addEventListener('click',()=>{
    if(frozen)return;
    [gA,gB].forEach(g=>{
      const changes=5+Math.floor(Math.random()*10);
      for(let i=0;i<changes;i++){
        const r=Math.floor(Math.random()*NROWS),c=Math.floor(Math.random()*g.cols);
        if(g===gA){const idx=PROB_LEVELS.indexOf(g.grid[r][c]);g.grid[r][c]=PROB_LEVELS[Math.max(0,Math.min(3,idx+(Math.random()>.5?1:-1)))];}
        else{g.grid[r][c]=g.grid[r][c]?0:1;}
        if(g.grid[r][c]&&ROWS_CONFIG[r].type==='pitched')assignPitch(g,r,c);
      }
    });render();
  });
  document.getElementById('clear').addEventListener('click',()=>{
    if(frozen)return;
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
      document.getElementById('brush-mode-lbl').textContent=btn.dataset.mode;
    });
  });
  [['sl-bpm','val-bpm',v=>v,'bpm'],['sl-chaos','val-chaos',v=>(v/100).toFixed(2),'chaos'],['sl-density','val-density',v=>(v/100).toFixed(2),'density'],['sl-rep','val-rep',v=>(v/100).toFixed(2),'rep'],['sl-smooth','val-smooth',v=>(v/100).toFixed(2),'smooth']].forEach(([id,vid,fmt,key])=>{
    document.getElementById(id).oninput=function(){
      const v=parseInt(this.value);document.getElementById(vid).textContent=fmt(v);
      if(key==='bpm'){if(playing){clearInterval(iv);const tod=getTODBlend();const effBpm=Math.round(v*tod.bpmMult);iv=setInterval(masterStep,60/effBpm/4*1000);}}
      else params[key]=v/100;
    };
  });
  document.getElementById('sl-ratio').oninput=function(){rebuildGridB(sliderToSteps(parseInt(this.value)));};
  document.getElementById('sl-coupling').oninput=function(){
    coupling=parseInt(this.value)/100;
    document.getElementById('val-coupling').textContent=coupling.toFixed(2);
    document.getElementById('coupling-badge').textContent=`coupling ${coupling.toFixed(2)}`;
  };
  document.getElementById('intro-start').addEventListener('click',()=>document.getElementById('intro-overlay').classList.add('is-hidden'));
  document.getElementById('intro-open').addEventListener('click',()=>document.getElementById('intro-overlay').classList.remove('is-hidden'));
  document.getElementById('intro-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.classList.add('is-hidden');});
  
  // ==========================================
  // ====== THE GAME ======
  // ==========================================
  const gameCanvas = document.getElementById('game-canvas');
  const gctx = gameCanvas.getContext('2d');
  
  // ---- GAME STATE ----
  let gW = 0, gH = 0; // set on resize
  
  const GRAVITY = 0.45;
  const JUMP_FORCE = -10.5;
  const MOVE_SPEED = 3.2;
  const GROUND_FRAC = 0.72; // ground Y as fraction of canvas height
  const WATERLINE_FRAC = 0.58; // below this point: underwater mode (LFO)

  // Platforms define which Grid A row you paint.
  // tier -> row index in ROWS_CONFIG
  const PLATFORM_SEGMENTS = [
    { xStart: 0.00, xEnd: 0.18, yTopFrac: 0.52, tier: 0 }, // kick (dry)
    { xStart: 0.18, xEnd: 0.33, yTopFrac: 0.49, tier: 1 }, // snare (dry)
    { xStart: 0.33, xEnd: 0.50, yTopFrac: 0.53, tier: 2 }, // hi-hat (dry)
    { xStart: 0.50, xEnd: 0.65, yTopFrac: 0.55, tier: 3 }, // clap (dry)
    { xStart: 0.65, xEnd: 0.82, yTopFrac: 0.66, tier: 4 }, // melody hi (underwater)
    { xStart: 0.82, xEnd: 1.00, yTopFrac: 0.72, tier: 5 }, // melody lo (underwater)
  ];
  const BASE_FLOOR = { xStart: 0, xEnd: 1, yTopFrac: GROUND_FRAC, tier: 0 };

  function getPlatformAtX(x){
    const xFrac = x / gW;
    for(const p of PLATFORM_SEGMENTS){
      if(xFrac >= p.xStart && xFrac < p.xEnd) return p;
    }
    return BASE_FLOOR;
  }

  function waterY(){ return gH * WATERLINE_FRAC; }

  const CHAR_W = 28, CHAR_H = 36;

  // Better-looking Miffy: draw a sprite when available.
  // If the sprite hasn't loaded yet, fall back to the existing vector drawing.
  let miffySpriteImg = null;
  let miffySpriteReady = false;
  const miffySpriteLoader = new Image();
  miffySpriteLoader.src = 'assets/miffy.png';
  miffySpriteLoader.onload = () => {
    miffySpriteImg = miffySpriteLoader;
    miffySpriteReady = true;
  };
  
  let miffy = {
    x: 120, y: 0, vx: 0, vy: 0,
    onGround: false, tier: 0, facing: 1,
    walkFrame: 0, walkTick: 0,
    isJumping: false, wasOnGround: false,
    stillTimer: 0,
    justLanded: false, landedTimer: 0,
    earWiggle: 0,
  };
  
  const keys = {};
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    // prevent page scroll on arrows
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  });
  document.addEventListener('keyup', e => { keys[e.code] = false; });
  
  // ---- TRAIL SYSTEM ----
  let trails = []; // {x, y, color, alpha, r}
  let splats = []; // {x, y, color, particles: [{dx,dy,life}]}
  let footstepCooldown = 0;
  
  // ---- CLOUDS ----
  let clouds = [];
  for(let i = 0; i < 6; i++) {
    clouds.push({ x: Math.random(), y: 0.05 + Math.random()*0.28, w: 60+Math.random()*90, speed: 0.00006+Math.random()*0.00008, alpha: 0.5+Math.random()*0.4 });
  }
  
  // ---- STARS ----
  let stars = [];
  for(let i = 0; i < 80; i++) {
    stars.push({ x: Math.random(), y: Math.random()*0.7, size: 0.5+Math.random()*2, twinkle: Math.random()*Math.PI*2 });
  }
  
  // ---- GRASS TUFTS (decorative) ----
  let grassTufts = [];
  for(let i = 0; i < 22; i++) {
    grassTufts.push({ x: Math.random(), h: 4+Math.random()*8, sway: Math.random()*Math.PI*2 });
  }
  
  // ---- FLOATING ORBS (chord changers) ----
  let orbs = [];
  function spawnOrbs() {
    orbs = [];
    for(let i = 0; i < 4; i++) {
      orbs.push({
        x: 0.12 + Math.random()*0.76,
        yBase: 0.45 + Math.random()*0.18,
        phase: Math.random()*Math.PI*2,
        collected: false,
        color: ROWS_CONFIG[Math.floor(Math.random()*NROWS)].color,
        respawn: 0,
      });
    }
  }
  spawnOrbs();
  
  // ---- ZONE GROUND PULSE ----
  let zonePulse = new Array(ZONES.length).fill(0); // 0..1
  
  // ---- GAME UTILITY ----
  function getZoneAt(xFrac) {
    for(let i = 0; i < ZONES.length; i++) {
      if(xFrac >= ZONES[i].xStart && xFrac < ZONES[i].xEnd) return i;
    }
    return ZONES.length-1;
  }
  
  function groundY() { return gH * GROUND_FRAC; }
  
  function paintGridFromGame(rowIdx, probVal) {
    if(frozen) return;
    // paint at current grid A playhead position
    const col = gA.ph;
    const cur = gA.grid[rowIdx][col];
    if(paintMode === 'erase') {
      gA.grid[rowIdx][col] = Math.max(0, cur - 0.33);
      if(gA.grid[rowIdx][col] < 0.1) { gA.grid[rowIdx][col]=0; gA.pitchGrid[rowIdx][col]=null; }
    } else {
      // raise probability level
      const idx = PROB_LEVELS.indexOf(cur);
      const newIdx = Math.min(3, idx+1);
      gA.grid[rowIdx][col] = PROB_LEVELS[newIdx];
      if(gA.grid[rowIdx][col] && ROWS_CONFIG[rowIdx].type==='pitched') assignPitch(gA, rowIdx, col);
    }
    render();
  }
  
  function erodeAroundGame(rowIdx, xFrac) {
    if(frozen) return;
    // erode a range of cells around current step
    const col = gA.ph;
    for(let dc = -1; dc <= 1; dc++) {
      const c = (col+dc+COLS_A)%COLS_A;
      if(gA.grid[rowIdx][c] > 0) {
        gA.grid[rowIdx][c] = Math.max(0, gA.grid[rowIdx][c] - 0.01);
        if(gA.grid[rowIdx][c] < 0.05) { gA.grid[rowIdx][c]=0; gA.pitchGrid[rowIdx][c]=null; }
      }
    }
  }
  
  // ---- DRAW MIFFY ----
  function drawMiffy(ctx, x, y, facing, walkFrame, landed, earWiggle, todBlend) {
    ctx.save();
    ctx.translate(x, y);
    if(facing < 0) { ctx.scale(-1, 1); }
  
    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#1a3040';
    ctx.beginPath();
    ctx.ellipse(0, 2, CHAR_W*0.55, 5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Sprite branch (primary)
    if(miffySpriteReady && miffySpriteImg) {
      // Keep the sprite's natural aspect ratio (avoid "compressed" look).
      const naturalW = miffySpriteImg.naturalWidth || miffySpriteImg.width || CHAR_W;
      const naturalH = miffySpriteImg.naturalHeight || miffySpriteImg.height || CHAR_H;
      const sprH = CHAR_H * 1.45; // taller than the old vector proportions
      const sprW = sprH * (naturalW / naturalH);
      // Anchor the sprite's bottom near the same ground contact as the vector legs.
      const footOffset = 11;
      const walkBob = Math.sin(walkFrame * 0.35) * 1.4;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(miffySpriteImg, -sprW/2, -sprH + footOffset + walkBob, sprW, sprH);

      // Remove scarf recoloring overlay: the sprite already contains the scarf.
      ctx.restore();
      return;
    }
  
    // Legs (walking animation)
    const legSwing = Math.sin(walkFrame * 0.35) * 7;
    const legColors = ['#e8d5c0','#dcc8b0'];
    // left leg
    ctx.save();
    ctx.fillStyle = legColors[0];
    ctx.beginPath();
    ctx.roundRect(-6, -8 + legSwing, 7, 16, 3);
    ctx.fill();
    // foot
    ctx.fillStyle = '#c4a882';
    ctx.beginPath();
    ctx.ellipse(-3, 8+legSwing, 5, 3, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    // right leg
    ctx.save();
    ctx.fillStyle = legColors[1];
    ctx.beginPath();
    ctx.roundRect(0, -8 - legSwing, 7, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#c4a882';
    ctx.beginPath();
    ctx.ellipse(4, 8-legSwing, 5, 3, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  
    // Body
    ctx.save();
    ctx.fillStyle = '#f5f0ea';
    ctx.beginPath();
    ctx.roundRect(-10, -26, 20, 20, [5,5,8,8]);
    ctx.fill();
    // Body outline
    ctx.strokeStyle = 'rgba(180,155,130,.5)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Scarf (color changes by zone)
    ctx.restore();
  
    const rowIdx = miffy.tier ?? 0;
    const scarfColor = ROWS_CONFIG[rowIdx].color;
    ctx.save();
    ctx.fillStyle = scarfColor;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.roundRect(-11, -17, 22, 6, 3);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#fff';
    // scarf stripe
    for(let i = -8; i < 10; i+=5) {
      ctx.fillRect(i, -17, 2, 6);
    }
    ctx.restore();
  
    // Arms (subtle sway)
    const armSway = Math.sin(walkFrame * 0.35) * 3;
    ctx.save();
    ctx.fillStyle = '#f0e8dc';
    // left arm
    ctx.save();
    ctx.translate(-10, -22);
    ctx.rotate((armSway-2)*0.06);
    ctx.beginPath();
    ctx.roundRect(-4, 0, 6, 12, 3);
    ctx.fill();
    ctx.restore();
    // right arm (holds brush)
    ctx.save();
    ctx.translate(9, -22);
    ctx.rotate((-armSway+2)*0.06);
    ctx.beginPath();
    ctx.roundRect(-2, 0, 6, 12, 3);
    ctx.fill();
    // Brush in right hand
    if(paintMode === 'draw') {
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(-1, 10, 3, 10);
      ctx.fillStyle = scarfColor;
      ctx.beginPath();
      ctx.ellipse(0.5, 22, 3, 5, 0.2, 0, Math.PI*2);
      ctx.fill();
    } else if(paintMode === 'erase') {
      ctx.fillStyle = '#d4c4b0';
      ctx.fillRect(-2, 10, 6, 4);
      ctx.fillStyle = '#e8d8c8';
      ctx.fillRect(-2, 10, 6, 8);
    } else {
      // bias — glowing orb
      ctx.fillStyle = scarfColor;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0.5, 16, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(0.5, 16, 6, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  
    // Head
    ctx.save();
    ctx.fillStyle = '#f8f3ee';
    ctx.beginPath();
    ctx.ellipse(0, -36, 13, 13, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,155,130,.4)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.restore();
  
    // Ears
    const earBob = Math.sin(earWiggle) * 2.5;
    ctx.save();
    ctx.fillStyle = '#f5f0ea';
    // left ear
    ctx.save();
    ctx.translate(-6, -47);
    ctx.rotate(-0.08 + earBob*0.02);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 10, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,155,130,.35)';
    ctx.lineWidth=0.6;
    ctx.stroke();
    // inner ear
    ctx.fillStyle = '#f0d8d0';
    ctx.beginPath();
    ctx.ellipse(0, 1, 2.5, 7, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    // right ear
    ctx.save();
    ctx.translate(6, -47);
    ctx.rotate(0.08 - earBob*0.02);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 10, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,155,130,.35)';
    ctx.lineWidth=0.6;
    ctx.stroke();
    ctx.fillStyle = '#f0d8d0';
    ctx.beginPath();
    ctx.ellipse(0, 1, 2.5, 7, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  
    // Face
    ctx.save();
    // Eyes — classic Miffy X eyes
    ctx.strokeStyle = '#2a1a10';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    const eyeY = -38;
    // left eye X
    ctx.beginPath(); ctx.moveTo(-5,-eyeY+2); ctx.lineTo(-2.5,-eyeY-1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5,-eyeY-1); ctx.lineTo(-2.5,-eyeY+2); ctx.stroke();
    // right eye X
    ctx.beginPath(); ctx.moveTo(2.5,-eyeY+2); ctx.lineTo(5,-eyeY-1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2.5,-eyeY-1); ctx.lineTo(5,-eyeY+2); ctx.stroke();
    // Tiny nose dot
    ctx.fillStyle = '#c8908a';
    ctx.beginPath();
    ctx.arc(0, -eyeY+5, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  
    // Landing squish
    if(landed > 0) {
      // squish effect is handled in the y offset outside
    }
  
    ctx.restore();
  }
  
  // ---- DRAW ZONE BANDS ----
  function drawZoneBands(ctx, W, H, groundY, todBlend) {
    const gY = groundY;
    ZONES.forEach((z, i) => {
      const xS = z.xStart * W;
      const xE = z.xEnd * W;
      const pulse = zonePulse[i];
      const col = hexToRgbArr(z.color);
      // Subtle column tint
      const grad = ctx.createLinearGradient(xS, 0, xS, gY);
      grad.addColorStop(0, `rgba(${col},0)`);
      grad.addColorStop(1, `rgba(${col},${0.06 + pulse*0.12})`);
      ctx.fillStyle = grad;
      ctx.fillRect(xS, 0, xE-xS, gY);
      // Zone divider line
      if(i > 0) {
        ctx.strokeStyle = `rgba(${col},${0.12+pulse*0.2})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4,6]);
        ctx.beginPath();
        ctx.moveTo(xS, gY*0.3);
        ctx.lineTo(xS, gY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Zone label (floats up)
      const midX = (xS+xE)/2;
      ctx.save();
      ctx.globalAlpha = 0.3 + pulse*0.5;
      ctx.font = `bold 8px 'Space Mono', monospace`;
      ctx.fillStyle = z.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(z.name.toUpperCase(), midX, gY - 6);
      ctx.restore();
      // Ground pulse glow strip
      if(pulse > 0.05) {
        const gGrad = ctx.createLinearGradient(xS, gY-2, xS, gY+10);
        gGrad.addColorStop(0, `rgba(${col},${pulse*0.6})`);
        gGrad.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gGrad;
        ctx.fillRect(xS, gY-2, xE-xS, 12);
      }
      zonePulse[i] *= 0.88;
    });
  }

  // ---- WATER + PLATFORMS ----
  function drawWaterAndPlatforms(ctx, W, H, todBlend, time) {
    const wy = H * WATERLINE_FRAC;

    // Water overlay
    const waterGrad = ctx.createLinearGradient(0, wy, 0, H);
    waterGrad.addColorStop(0, 'rgba(30,120,190,.10)');
    waterGrad.addColorStop(0.45, 'rgba(30,120,190,.20)');
    waterGrad.addColorStop(1, 'rgba(10,25,60,.34)');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, wy, W, H - wy);

    // Surface shimmer line
    ctx.save();
    const waveAmp = Math.max(2, H * 0.01);
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12) {
      const yy = wy + Math.sin(time * 0.002 + x * 0.02) * waveAmp;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    ctx.restore();

    // Platform tops (collision surfaces live in updateGame)
    const thickness = Math.max(10, Math.floor(H * 0.02));
    PLATFORM_SEGMENTS.forEach(p => {
      const xS = p.xStart * W;
      const xE = p.xEnd * W;
      const yTop = p.yTopFrac * H;
      const rowCol = ROWS_CONFIG[p.tier].color;
      const submerged = yTop > wy;

      ctx.save();
      ctx.fillStyle = submerged ? 'rgba(18,60,90,.55)' : todBlend.groundDark;
      ctx.fillRect(xS, yTop, xE - xS, thickness);

      // Row-colored top edge
      ctx.globalAlpha = submerged ? 0.28 : 0.55;
      ctx.fillStyle = rowCol;
      ctx.fillRect(xS, yTop - 1, xE - xS, 2);
      ctx.restore();
    });
  }
  
  function hexToRgbArr(hex) {
    return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
  }
  
  // ---- DRAW SKY / WORLD ----
  function drawWorld(ctx, W, H, todBlend, time) {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H*GROUND_FRAC);
    sky.addColorStop(0, todBlend.skyTop);
    sky.addColorStop(1, todBlend.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
  
    // Stars
    if(todBlend.starAlpha > 0.01) {
      stars.forEach(s => {
        const tw = 0.6 + 0.4*Math.sin(time*0.002 + s.twinkle);
        ctx.globalAlpha = todBlend.starAlpha * tw;
        ctx.fillStyle = '#e8eeff';
        ctx.beginPath();
        ctx.arc(s.x*W, s.y*H*GROUND_FRAC, s.size, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
  
    // Moon
    if(todBlend.moonAlpha > 0.01) {
      const moonX = W*0.82, moonY = H*0.14;
      ctx.save();
      ctx.globalAlpha = todBlend.moonAlpha;
      ctx.fillStyle = '#d8e4f8';
      ctx.beginPath(); ctx.arc(moonX, moonY, 22, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = todBlend.skyTop;
      ctx.beginPath(); ctx.arc(moonX+10, moonY-4, 18, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  
    // Sun / glow
    if(todBlend.sunAlpha > 0.01) {
      const sunX = W*0.78, sunY = H*GROUND_FRAC*todBlend.sunY;
      ctx.save();
      ctx.globalAlpha = todBlend.sunAlpha * 0.18;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120);
      sunGlow.addColorStop(0, todBlend.sunColor);
      sunGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(sunX-120, sunY-120, 240, 240);
      ctx.globalAlpha = todBlend.sunAlpha;
      ctx.fillStyle = todBlend.sunColor;
      ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = todBlend.sunAlpha*0.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(sunX, sunY, 14, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  
    // Clouds
    clouds.forEach(cl => {
      cl.x = (cl.x + cl.speed) % 1.15;
      const cx = cl.x*W - 60, cy = cl.y*H;
      ctx.save();
      ctx.globalAlpha = cl.alpha * 0.55;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(cx, cy, cl.w*.6, cl.w*.22, 0, 0, Math.PI*2);
      ctx.ellipse(cx+cl.w*.2, cy-cl.w*.1, cl.w*.4, cl.w*.18, 0, 0, Math.PI*2);
      ctx.ellipse(cx-cl.w*.2, cy-cl.w*.08, cl.w*.35, cl.w*.15, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
  
    // Fog / ambient overlay
    const fogGrad = ctx.createLinearGradient(0, H*GROUND_FRAC*0.6, 0, H*GROUND_FRAC);
    fogGrad.addColorStop(0, 'transparent');
    fogGrad.addColorStop(1, todBlend.fogColor||'transparent');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, H*GROUND_FRAC*0.6, W, H*GROUND_FRAC*0.4);
  
    // Ground
    const gY = groundY();
    // Main ground
    const groundGrad = ctx.createLinearGradient(0, gY, 0, H);
    groundGrad.addColorStop(0, todBlend.ground);
    groundGrad.addColorStop(0.3, todBlend.groundDark);
    groundGrad.addColorStop(1, todBlend.groundDark);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, gY, W, H-gY);
  
    // Ground top highlight line
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, gY); ctx.lineTo(W, gY);
    ctx.stroke();
  
    // Grass tufts
    grassTufts.forEach(g => {
      const tx = g.x*W;
      const sway = Math.sin(time*0.001 + g.sway)*2;
      ctx.save();
      ctx.strokeStyle = todBlend.ground;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      // 3 blades
      for(let b=-1;b<=1;b++) {
        ctx.beginPath();
        ctx.moveTo(tx+b*3, gY);
        ctx.quadraticCurveTo(tx+b*3+sway+b*2, gY-g.h*0.6, tx+b*3+sway*1.5+b*3, gY-g.h);
        ctx.stroke();
      }
      ctx.restore();
    });
  
    // Distant hills
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = todBlend.groundDark;
    ctx.beginPath();
    ctx.moveTo(0, gY);
    for(let x=0;x<=W;x+=40) {
      const hillH = Math.sin(x*0.018)*24 + Math.cos(x*0.011)*16;
      ctx.lineTo(x, gY - 20 - hillH);
    }
    ctx.lineTo(W, gY); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  
  // ---- GAME UPDATE ----
  let gameTime = 0;
  let hudActionTimer = 0;
  function showHudAction(msg) {
    document.getElementById('hud-action').textContent = msg;
    hudActionTimer = 80;
  }
  
  function updateGame() {
    gameTime++;
  
    // Move miffy
    const wasOnGround = miffy.onGround;
    miffy.vx = 0;
  
    if(keys['ArrowLeft']) { miffy.vx = -MOVE_SPEED; miffy.facing = -1; }
    if(keys['ArrowRight']) { miffy.vx = MOVE_SPEED; miffy.facing = 1; }
    if((keys['ArrowUp'] || keys['Space']) && miffy.onGround) {
      miffy.vy = JUMP_FORCE;
      miffy.onGround = false;
      miffy.isJumping = true;
      miffy.earWiggle = 0;
      showHudAction('jump!');
    }
  
    miffy.vy += GRAVITY;
    miffy.x += miffy.vx;
    miffy.y += miffy.vy;
  
    // Clamp X
    miffy.x = Math.max(CHAR_W/2, Math.min(gW - CHAR_W/2, miffy.x));
  
    // Platform collision (including submerged platforms).
    // We set onGround based on where the player "stands" at the current x position.
    const gY = groundY();
    miffy.onGround = false;
    const platform = getPlatformAtX(miffy.x);
    const platformY = platform.yTopFrac * gH;

    if(miffy.y >= platformY) {
      // landed from above -> accent!
      if(miffy.vy > 2 && !wasOnGround) {
        miffy.justLanded = true;
        miffy.landedTimer = 12;
        miffy.tier = platform.tier;
        spawnJumpSplat(platformY, miffy.tier);
        // stamp full probability at current step
        const col = gA.ph;
        gA.grid[miffy.tier][col] = 1.0;
        if(ROWS_CONFIG[miffy.tier].type==='pitched') assignPitch(gA, miffy.tier, col);
        render();
        document.getElementById('hud-zone').textContent = ROWS_CONFIG[miffy.tier].full;
        document.getElementById('hud-zone').style.color = ROWS_CONFIG[miffy.tier].color;
        showHudAction('accent! ✦');
      }

      miffy.y = platformY;
      miffy.vy = 0;
      miffy.onGround = true;
      miffy.tier = platform.tier;
      miffy.isJumping = false;
      miffy.earWiggle = (miffy.justLanded ? Math.PI*0.5 : miffy.earWiggle);
    }

    // Underwater mode (LFO): based on contact line vs waterline.
    const wy = waterY();
    const underwaterNow = miffy.y > wy + 0.5;
    const depth01 = Math.max(0, Math.min(1, (miffy.y - wy) / (gH * 0.25)));
    if(underwaterNow !== underwaterActive || Math.abs(depth01 - underwaterDepth01) > 0.06) {
      setUnderwater(underwaterNow, depth01);
    }
  
    // ear wiggle decay
    miffy.earWiggle += 0.18;
  
    // Landing timer
    if(miffy.landedTimer > 0) miffy.landedTimer--;
    else miffy.justLanded = false;
  
    // Walk animation
    if(Math.abs(miffy.vx) > 0.1 && miffy.onGround) {
      miffy.walkTick++;
      if(miffy.walkTick > 6) { miffy.walkFrame++; miffy.walkTick = 0; }
    }
  
    // Still timer / erosion
    const isMoving = Math.abs(miffy.vx) > 0.1 || !miffy.onGround;
    if(!isMoving) {
      miffy.stillTimer++;
      if(miffy.stillTimer > 50 && paintMode !== 'bias') {
        erodeAroundGame(miffy.tier, miffy.x / gW);
        if(miffy.stillTimer % 30 === 0) showHudAction('erode…');
      }
    } else {
      miffy.stillTimer = 0;
    }
  
    // Footstep painting
    footstepCooldown--;
    if(Math.abs(miffy.vx) > 0.5 && miffy.onGround && footstepCooldown <= 0) {
      footstepCooldown = 10;
      const rowIdx = miffy.tier;
  
      // Add trail
      trails.push({
        x: miffy.x + (Math.random()-0.5)*8,
        y: gY - 1 + (Math.random()-0.5)*4,
        color: ROWS_CONFIG[rowIdx].color,
        alpha: 0.7,
        r: 5 + Math.random()*5,
      });
  
      // Paint grid
      if(!frozen) {
        paintGridFromGame(rowIdx, paintMode==='erase'?0:PROB_LEVELS[1+Math.floor(Math.random()*2)]);
      }
  
      document.getElementById('hud-zone').textContent = ROWS_CONFIG[rowIdx].full;
      document.getElementById('hud-zone').style.color = ROWS_CONFIG[rowIdx].color;
    }
  
    // Fade trails
    trails = trails.filter(t => t.alpha > 0.01);
    trails.forEach(t => { t.alpha *= 0.978; });
  
    // Update splats
    splats.forEach(s => {
      s.particles = s.particles.filter(p => p.life > 0.01);
      s.particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.vy+=0.18; p.vx*=0.92; p.life*=0.88; });
    });
    splats = splats.filter(s => s.particles.length > 0 || s.age < 80);
    splats.forEach(s => s.age++);
  
    // Orbs
    const now = Date.now();
    orbs.forEach(orb => {
      if(orb.collected) {
        if(now > orb.respawn) orb.collected = false;
        return;
      }
      const orbX = orb.x * gW;
      const orbY = gY * (orb.yBase) - Math.sin(gameTime*0.04 + orb.phase)*12;
      const dx = miffy.x - orbX, dy = miffy.y - CHAR_H*0.5 - orbY;
      if(Math.sqrt(dx*dx+dy*dy) < 24) {
        orb.collected = true;
        orb.respawn = now + 8000;
        // chord change!
        chordIdx = markovNextChord(chordIdx);
        nextChordIdx = markovNextChord(chordIdx);
        reassignAllPitches(gA); reassignAllPitches(gB);
        document.getElementById('cur-chord').textContent = CHORDS[chordIdx].name;
        document.getElementById('next-chord').textContent = CHORDS[nextChordIdx].name;
        showHudAction('chord: '+CHORDS[chordIdx].name+' ♪');
        // burst
        for(let i=0;i<16;i++) {
          const a=Math.random()*Math.PI*2, sp=2+Math.random()*4;
          splats.push({x:orbX,y:orbY,age:0,particles:[{x:0,y:0,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1}]});
        }
      }
    });
  
    // HUD action timer
    if(hudActionTimer > 0) hudActionTimer--;
    else document.getElementById('hud-action').textContent='';
  
    // TOD transition
    todTransition.t = Math.min(1, todTransition.t + 0.008);
  }
  
  function spawnJumpSplat(platY, rowIdx) {
    const gY = platY ?? groundY();
    const ridx = (rowIdx ?? miffy.tier ?? 0);
    const col = ROWS_CONFIG[ridx].color;
    const count = 18 + Math.floor(Math.random()*12);
    const particles = [];
    for(let i=0;i<count;i++) {
      const a = Math.random()*Math.PI*2;
      const sp = 1.5 + Math.random()*5;
      particles.push({x:miffy.x, y:gY, vx:Math.cos(a)*sp, vy:-Math.abs(Math.sin(a)*sp)-1, life:1});
    }
    splats.push({x:miffy.x, y:gY, color:col, age:0, particles});
  
    // Paint adjacent cells too
    const adjRow = ridx;
    for(let dc=-1;dc<=1;dc++) {
      const c=(gA.ph+dc+COLS_A)%COLS_A;
      if(gA.grid[adjRow][c] < 1) gA.grid[adjRow][c] = Math.min(1, gA.grid[adjRow][c]+0.33);
    }
    render();
  }
  
  // ---- GAME RENDER ----
  function renderGame() {
    const W = gW, H = gH;
    if(!W || !H) return;
  
    const todBlend = getTODBlend();
    const gY = groundY();
  
    drawWorld(gctx, W, H, todBlend, gameTime);
    drawWaterAndPlatforms(gctx, W, H, todBlend, gameTime);
  
    // Trails (paint strokes on ground)
    trails.forEach(t => {
      gctx.save();
      gctx.globalAlpha = t.alpha;
      gctx.fillStyle = t.color;
      gctx.beginPath();
      gctx.ellipse(t.x, t.y, t.r, t.r*0.45, Math.random()*0.3, 0, Math.PI*2);
      gctx.fill();
      gctx.restore();
    });
  
    // Splat particles
    splats.forEach(s => {
      s.particles.forEach(p => {
        gctx.save();
        gctx.globalAlpha = p.life * 0.85;
        gctx.fillStyle = s.color || ROWS_CONFIG[getPlatformAtX(s.x).tier].color;
        gctx.beginPath();
        gctx.arc(s.x + p.x, s.y + p.y, 3*p.life, 0, Math.PI*2);
        gctx.fill();
        gctx.restore();
      });
    });
  
    // Orbs
    orbs.forEach(orb => {
      if(orb.collected) return;
      const orbX = orb.x * gW;
      const orbY = gY * orb.yBase - Math.sin(gameTime*0.04 + orb.phase)*12;
      gctx.save();
      // glow
      const col = hexToRgbArr(orb.color);
      const glowGrad = gctx.createRadialGradient(orbX,orbY,0, orbX,orbY,24);
      glowGrad.addColorStop(0, `rgba(${col},0.4)`);
      glowGrad.addColorStop(1, 'transparent');
      gctx.fillStyle = glowGrad;
      gctx.beginPath(); gctx.arc(orbX,orbY,24,0,Math.PI*2); gctx.fill();
      // orb
      gctx.fillStyle = orb.color;
      gctx.globalAlpha = 0.9;
      gctx.beginPath(); gctx.arc(orbX,orbY,7,0,Math.PI*2); gctx.fill();
      gctx.globalAlpha=0.5; gctx.fillStyle='#fff';
      gctx.beginPath(); gctx.arc(orbX-2,orbY-2,3,0,Math.PI*2); gctx.fill();
      // note symbol
      gctx.globalAlpha=0.8; gctx.fillStyle='#fff';
      gctx.font=`bold 9px serif`; gctx.textAlign='center'; gctx.textBaseline='middle';
      gctx.fillText('♪',orbX,orbY);
      gctx.restore();
    });
  
    // Miffy squish on land
    const squish = miffy.justLanded ? Math.max(0, (miffy.landedTimer/12)) : 0;
    const miffyRenderX = miffy.x;
    const miffyRenderY = miffy.y + squish*4;
  
    gctx.save();
    if(squish > 0) {
      gctx.translate(miffyRenderX, miffyRenderY);
      gctx.scale(1+squish*0.2, 1-squish*0.15);
      gctx.translate(-miffyRenderX, -miffyRenderY);
    }
    drawMiffy(gctx, miffyRenderX, miffyRenderY, miffy.facing, miffy.walkFrame, squish, miffy.earWiggle, todBlend);
    gctx.restore();
  
    // Ambient overlay
    if(todBlend.ambientLight) {
      gctx.fillStyle = todBlend.ambientLight;
      gctx.fillRect(0,0,W,H);
    }
  }
  
  // ---- GAME LOOP ----
  function resizeGame() {
    const sect = document.getElementById('game-section');
    gW = sect.offsetWidth;
    gH = gameCanvas.offsetHeight;
    gameCanvas.width = gW * devicePixelRatio;
    gameCanvas.height = gH * devicePixelRatio;
    gctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    // Snap to whatever platform exists at the current x position.
    miffy.x = Math.max(CHAR_W/2, Math.min(gW - CHAR_W/2, miffy.x));
    const platform = getPlatformAtX(miffy.x);
    miffy.y = platform.yTopFrac * gH;
    miffy.vy = 0;
    miffy.onGround = true;
    miffy.tier = platform.tier;
  }
  
  let lastGameTime = 0;
  function gameLoop(ts) {
    if(ts - lastGameTime >= 16) { // ~60fps
      lastGameTime = ts;
      updateGame();
      renderGame();
    }
    requestAnimationFrame(gameLoop);
  }
  resizeGame();
  window.addEventListener('resize', () => { resizeGame(); render(); });
  miffy.y = groundY();
  requestAnimationFrame(gameLoop);
  
  // ---- TOD BUTTONS ----
  document.querySelectorAll('.tod-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tod = btn.dataset.tod;
      if(tod === currentTOD) return;
      todTransition = { from: currentTOD, to: tod, t: 0 };
      currentTOD = tod;
      document.querySelectorAll('.tod-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
  
      // Update sequencer to match TOD
      const cfg = TOD_CONFIGS[tod];
      const bpmEl = document.getElementById('sl-bpm');
      const baseBpm = parseInt(bpmEl.value);
      if(playing) {
        clearInterval(iv);
        const effBpm = Math.round(baseBpm * cfg.bpmMult);
        iv = setInterval(masterStep, 60/effBpm/4*1000);
      }
    });
  });
  
  // ---- ANIMATION LOOP ----
  function animLoop(){
    if(ripples.length||particles2.length)drawInterference();
    requestAnimationFrame(animLoop);
  }
  requestAnimationFrame(animLoop);
  
  // ---- RESIZE GRIDS ----
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>render(),120);});
  
  // Seed B
  for(let r=0;r<NROWS;r++)for(let c=0;c<COLS_B;c++)if(Math.random()<.22){gB.grid[r][c]=1;if(ROWS_CONFIG[r].type==='pitched')assignPitch(gB,r,c);}
  render();
  
  })();
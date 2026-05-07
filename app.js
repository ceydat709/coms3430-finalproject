(()=>{
'use strict';

const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
const wrap=document.getElementById('wrap');
const playBtn=document.getElementById('play');
const stepLbl=document.getElementById('step-lbl');
const stateLbl=document.getElementById('state-lbl');
const transitionLbl=document.getElementById('transition-lbl');
const freezeLbl=document.getElementById('freeze-lbl');
const kitLbl=document.getElementById('kit-lbl');
const panel=document.querySelector('.panel');
const moodReadout=document.getElementById('mood-readout');
const introOverlay=document.getElementById('intro-overlay');
const introStart=document.getElementById('intro-start');
const introOpen=document.getElementById('intro-open');
const tempoDial=document.getElementById('tempo-dial');

let W=0,H=0;
let isPlaying=false;
let frozen=false;
let painting=false;
let paintValue=0;
let stepTimer=0;
let currentStep=-1;
let stepCount=0;
let currentSound='silence';
let nextSound='silence';
let drumKit='analog';
let currentMood='steady';
let lastTime=0;
let gridRect={x:0,y:0,w:0,h:0,cellW:0,cellH:0,labelW:64,topH:34};

const ROWS=['bd','sd','hh','cp','perc','bass'];
const STATES=['bd','sd','hh','cp','perc','bass','silence'];
const PROB_LEVELS=[0,.33,.66,1];
const PULL_LABELS={'0':'off','0.33':'light','0.66':'strong','1':'max'};
const particles=[];
const pulses=[];
const history=[];
const transitions=[];
const paintedCells=new Set();

// The grid is the score. Each cell is the user's painted probability that a row
// should be allowed to win on that column: 0 is off, 1 is the strongest vote.
const grid=ROWS.map(()=>new Array(16).fill(0));

const ROW_COLORS={
  bd:{fill:'rgba(87,159,189,.16)',stroke:'#579fbd',text:'#397f99',glow:'rgba(87,159,189,.32)'},
  sd:{fill:'rgba(74,157,130,.15)', stroke:'#4a9d82',text:'#3f8d74',glow:'rgba(74,157,130,.3)'},
  hh:{fill:'rgba(217,154,95,.16)', stroke:'#d99a5f',text:'#a66d35',glow:'rgba(217,154,95,.3)'},
  cp:{fill:'rgba(216,117,144,.15)', stroke:'#d87590',text:'#ad5f74',glow:'rgba(216,117,144,.3)'},
  perc:{fill:'rgba(143,143,188,.15)',stroke:'#8f8fbc',text:'#7474a8',glow:'rgba(143,143,188,.3)'},
  bass:{fill:'rgba(111,143,99,.15)',stroke:'#6f8f63',text:'#617d57',glow:'rgba(111,143,99,.3)'},
  silence:{fill:'rgba(66,89,99,.08)',stroke:'rgba(66,89,99,.32)',text:'#6d8188',glow:'rgba(66,89,99,.14)'}
};

// This matrix is the musical memory of the system. The current sound chooses a
// row from here before the grid and controls push the distribution around.
const TRANSITIONS={
  bd:{bd:.08,sd:.22,hh:.34,cp:.04,perc:.10,bass:.16,silence:.06},
  sd:{bd:.38,sd:.04,hh:.24,cp:.08,perc:.12,bass:.08,silence:.06},
  hh:{bd:.18,sd:.18,hh:.28,cp:.05,perc:.14,bass:.06,silence:.11},
  cp:{bd:.28,sd:.18,hh:.24,cp:.04,perc:.14,bass:.06,silence:.06},
  perc:{bd:.26,sd:.12,hh:.30,cp:.08,perc:.08,bass:.08,silence:.08},
  bass:{bd:.34,sd:.10,hh:.16,cp:.04,perc:.08,bass:.18,silence:.10},
  silence:{bd:.34,sd:.08,hh:.20,cp:.04,perc:.10,bass:.12,silence:.12}
};

const KIT_DESCS={
  analog:'analog drum voices',
  '808':'deep 808-style drum machine',
  dust:'dusty sampled drum machine',
  metal:'metallic synthetic percussion',
  bit:'bitcrushed digital drums',
};

const MOOD_PRESETS={
  steady:{chaos:.18,density:.72,repetition:.22,smoothness:.45},
  sparse:{chaos:.12,density:.38,repetition:.18,smoothness:.58},
  loop:{chaos:.07,density:.74,repetition:.78,smoothness:.62},
  wild:{chaos:.62,density:.82,repetition:.08,smoothness:.24}
};

const targets={
  tempo:108,chaos:.18,density:.72,repetition:.22,smoothness:.45,
  pulls:{bd:0,sd:0,hh:0,cp:0,perc:0,bass:0}
};
const smooth={
  tempo:108,chaos:.18,density:.72,repetition:.22,smoothness:.45,
  pulls:{bd:0,sd:0,hh:0,cp:0,perc:0,bass:0}
};

// ---- Audio ----
let AC=null;
let masterGain=null;
let limiter=null;
function ac(){
  if(!AC){
    AC=new(window.AudioContext||window.webkitAudioContext)();
  }
  return AC;
}
function output(){
  const a=ac();
  if(!masterGain){
    masterGain=a.createGain();
    masterGain.gain.value=.78;
    limiter=a.createDynamicsCompressor();
    limiter.threshold.value=-12;
    limiter.knee.value=8;
    limiter.ratio.value=8;
    limiter.attack.value=.003;
    limiter.release.value=.18;
    masterGain.connect(limiter);
    limiter.connect(a.destination);
  }
  return masterGain;
}
function master(){
  const g=ac().createGain();
  g.gain.value=0;
  g.connect(output());
  return g;
}
async function unlockAudio(){
  if(!window.AudioContext&&!window.webkitAudioContext){
    console.warn('Web Audio is not supported in this browser.');
    return false;
  }
  const a=ac();
  output();
  if(a.state==='suspended')await a.resume();

  // A zero-gain one-frame source nudges strict browsers into opening the audio
  // output route during the user's Play click before sequenced notes begin.
  const silent=a.createBufferSource();
  silent.buffer=a.createBuffer(1,1,a.sampleRate);
  const g=a.createGain();
  g.gain.value=0;
  silent.connect(g);
  g.connect(output());
  silent.start();
  silent.stop(a.currentTime+.01);

  return a.state==='running';
}
const DRUM_KITS={
  analog:{
    bd:{wave:'sine',start:132,end:43,dur:.27,gain:.9,click:.16,drive:0},
    sd:{tone:185,noiseFreq:1900,dur:.18,gain:.44,body:.23},
    hh:{freq:7200,dur:.055,gain:.28,metal:0},
    cp:{freq:2400,dur:.13,gain:.36,spread:.022},
    perc:{tone:520,noiseFreq:2800,dur:.12,gain:.32,body:.12,drive:0},
    bass:{wave:'sine',dur:.34,gain:.58,drop:.54,drive:.04}
  },
  '808':{
    bd:{wave:'sine',start:96,end:34,dur:.52,gain:.94,click:.08,drive:.12},
    sd:{tone:170,noiseFreq:1500,dur:.22,gain:.4,body:.3},
    hh:{freq:8500,dur:.075,gain:.24,metal:.2},
    cp:{freq:2050,dur:.16,gain:.32,spread:.028},
    perc:{tone:430,noiseFreq:2200,dur:.15,gain:.3,body:.16,drive:.12},
    bass:{wave:'sine',dur:.46,gain:.72,drop:.48,drive:.18}
  },
  dust:{
    bd:{wave:'triangle',start:118,end:48,dur:.24,gain:.76,click:.28,drive:.28},
    sd:{tone:155,noiseFreq:1200,dur:.2,gain:.38,body:.18},
    hh:{freq:5200,dur:.07,gain:.2,metal:0},
    cp:{freq:1700,dur:.15,gain:.28,spread:.032},
    perc:{tone:370,noiseFreq:1600,dur:.13,gain:.28,body:.1,drive:.32},
    bass:{wave:'triangle',dur:.28,gain:.52,drop:.66,drive:.25}
  },
  metal:{
    bd:{wave:'sine',start:140,end:52,dur:.2,gain:.75,click:.24,drive:0},
    sd:{tone:245,noiseFreq:2600,dur:.16,gain:.38,body:.18},
    hh:{freq:9000,dur:.09,gain:.26,metal:1},
    cp:{freq:3200,dur:.12,gain:.32,spread:.018},
    perc:{tone:720,noiseFreq:3600,dur:.1,gain:.3,body:.09,drive:.08},
    bass:{wave:'sawtooth',dur:.24,gain:.5,drop:.72,drive:.1}
  },
  bit:{
    bd:{wave:'square',start:110,end:39,dur:.18,gain:.68,click:.32,drive:.7},
    sd:{tone:210,noiseFreq:2300,dur:.13,gain:.34,body:.16,drive:.75},
    hh:{freq:7600,dur:.045,gain:.22,metal:.35,drive:.75},
    cp:{freq:2800,dur:.09,gain:.28,spread:.016,drive:.75},
    perc:{tone:620,noiseFreq:3100,dur:.08,gain:.24,body:.08,drive:.75},
    bass:{wave:'square',dur:.18,gain:.42,drop:.58,drive:.65}
  }
};

const BASS_NOTES=[55,65.41,73.42,82.41,98];

function makeNoiseSource(seconds){
  const a=ac();
  const length=Math.max(1,Math.floor(a.sampleRate*seconds));
  const buffer=a.createBuffer(1,length,a.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
  const source=a.createBufferSource();
  source.buffer=buffer;
  return source;
}

function makeDrive(amount){
  const a=ac();
  const curve=new Float32Array(256);
  const drive=1+amount*90;
  for(let i=0;i<256;i++){
    const x=(i*2)/255-1;
    curve[i]=(Math.PI+drive)*x/(Math.PI+drive*Math.abs(x));
  }
  const ws=a.createWaveShaper();
  ws.curve=curve;
  ws.oversample='2x';
  return ws;
}

function connectWithDrive(source,destination,amount){
  if(!amount){
    source.connect(destination);
    return;
  }
  const drive=makeDrive(amount);
  source.connect(drive);
  drive.connect(destination);
}

function playKick(){
  const kit=DRUM_KITS[drumKit].bd;
  const a=ac(),t=a.currentTime,g=master();
  const osc=a.createOscillator();
  osc.type=kit.wave;
  osc.frequency.setValueAtTime(kit.start,t);
  osc.frequency.exponentialRampToValueAtTime(kit.end,t+kit.dur*.7);
  g.gain.setValueAtTime(.0001,t);
  g.gain.linearRampToValueAtTime(kit.gain,t+.006);
  g.gain.exponentialRampToValueAtTime(.001,t+kit.dur);
  connectWithDrive(osc,g,kit.drive);
  osc.start(t);
  osc.stop(t+kit.dur+.02);

  if(kit.click){
    playFilteredNoise({type:'highpass',freq:3600,q:.3,start:t,dur:.018,gain:kit.click,drive:kit.drive});
  }
}

function playFilteredNoise({type,freq,q,start,dur,gain,drive=0}){
  const a=ac();
  const src=makeNoiseSource(dur);
  const flt=a.createBiquadFilter();
  const g=master();
  flt.type=type;
  flt.frequency.value=freq;
  flt.Q.value=q;
  g.gain.setValueAtTime(.0001,start);
  g.gain.linearRampToValueAtTime(gain,start+.004);
  g.gain.exponentialRampToValueAtTime(.001,start+dur);
  src.connect(flt);
  connectWithDrive(flt,g,drive);
  src.start(start);
  src.stop(start+dur);
}

function playSnare(){
  const kit=DRUM_KITS[drumKit].sd;
  const a=ac(),t=a.currentTime;
  playFilteredNoise({
    type:'bandpass',freq:kit.noiseFreq,q:kit.drive?1.7:.9,
    start:t,dur:kit.dur,gain:kit.gain,drive:kit.drive||0
  });

  const osc=a.createOscillator();
  const body=master();
  osc.type=drumKit==='bit'?'square':'triangle';
  osc.frequency.setValueAtTime(kit.tone,t);
  osc.frequency.exponentialRampToValueAtTime(kit.tone*.82,t+kit.dur);
  body.gain.setValueAtTime(.0001,t);
  body.gain.linearRampToValueAtTime(kit.body,t+.005);
  body.gain.exponentialRampToValueAtTime(.001,t+kit.dur*.75);
  connectWithDrive(osc,body,kit.drive||0);
  osc.start(t);
  osc.stop(t+kit.dur);
}

function playHat(){
  const kit=DRUM_KITS[drumKit].hh;
  const a=ac(),t=a.currentTime;
  playFilteredNoise({
    type:'highpass',freq:kit.freq,q:.5,start:t,dur:kit.dur,gain:kit.gain,drive:kit.drive||0
  });

  if(kit.metal){
    [1,1.37,1.82].forEach((ratio,i)=>{
      const osc=a.createOscillator();
      const g=master();
      osc.type='square';
      osc.frequency.value=kit.freq*.38*ratio;
      g.gain.setValueAtTime(.0001,t);
      g.gain.linearRampToValueAtTime((.06*kit.metal)/(i+1),t+.003);
      g.gain.exponentialRampToValueAtTime(.001,t+kit.dur*.9);
      connectWithDrive(osc,g,kit.drive||0);
      osc.start(t);
      osc.stop(t+kit.dur);
    });
  }
}

function playClap(){
  const kit=DRUM_KITS[drumKit].cp;
  const a=ac(),t=a.currentTime;
  [0,kit.spread,kit.spread*1.9].forEach((offset,i)=>{
    playFilteredNoise({
      type:'bandpass',freq:kit.freq+(i*180),q:1.25,start:t+offset,
      dur:kit.dur,gain:kit.gain/(1+i*.22),drive:kit.drive||0
    });
  });
}

function playPerc(){
  const kit=DRUM_KITS[drumKit].perc;
  const a=ac(),t=a.currentTime;

  // Percussion is a short pitched tick plus filtered noise, so it reads as a
  // new row without becoming another snare or hi-hat.
  playFilteredNoise({
    type:'bandpass',freq:kit.noiseFreq,q:1.8,start:t,dur:kit.dur,
    gain:kit.gain*.72,drive:kit.drive||0
  });

  const osc=a.createOscillator();
  const g=master();
  osc.type=drumKit==='metal'?'square':drumKit==='dust'?'triangle':'sine';
  osc.frequency.setValueAtTime(kit.tone,t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40,kit.tone*.55),t+kit.dur);
  g.gain.setValueAtTime(.0001,t);
  g.gain.linearRampToValueAtTime(kit.body,t+.004);
  g.gain.exponentialRampToValueAtTime(.001,t+kit.dur);
  connectWithDrive(osc,g,kit.drive||0);
  osc.start(t);
  osc.stop(t+kit.dur+.02);
}

function playBass(){
  const kit=DRUM_KITS[drumKit].bass;
  const a=ac(),t=a.currentTime;
  const note=BASS_NOTES[Math.abs(stepCount+currentStep)%BASS_NOTES.length];
  const osc=a.createOscillator();
  const g=master();
  osc.type=kit.wave;
  osc.frequency.setValueAtTime(note*1.22,t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(28,note*kit.drop),t+kit.dur*.72);
  g.gain.setValueAtTime(.0001,t);
  g.gain.linearRampToValueAtTime(kit.gain,t+.01);
  g.gain.exponentialRampToValueAtTime(.001,t+kit.dur);
  connectWithDrive(osc,g,kit.drive||0);
  osc.start(t);
  osc.stop(t+kit.dur+.03);
}

const DRUM_VOICES={bd:playKick,sd:playSnare,hh:playHat,cp:playClap,perc:playPerc,bass:playBass};

function playRowSound(row){
  if(row==='silence')return;
  try{
    DRUM_VOICES[row]();
  }catch(e){console.warn('drum voice error',e);}
}

function lerp(current,target,amount){
  return current+(target-current)*amount;
}
function clamp(v,min,max){
  return Math.max(min,Math.min(max,v));
}
function updateSmoothedControls(){
  // Smoothness controls how slowly target UI values reach the values used
  // by the Markov logic. High smoothness means slower interpolation.
  const amount=.04+(1-targets.smoothness)*.32;
  smooth.smoothness=lerp(smooth.smoothness,targets.smoothness,.12);
  smooth.tempo=lerp(smooth.tempo,targets.tempo,amount);
  smooth.chaos=lerp(smooth.chaos,targets.chaos,amount);
  smooth.density=lerp(smooth.density,targets.density,amount);
  smooth.repetition=lerp(smooth.repetition,targets.repetition,amount);
  for(const row of ROWS)smooth.pulls[row]=lerp(smooth.pulls[row],targets.pulls[row],amount);
}

function normalize(dist){
  let total=0;
  for(const state of STATES)total+=Math.max(0,dist[state]||0);
  if(total<=0){
    const even=1/STATES.length;
    for(const state of STATES)dist[state]=even;
    return dist;
  }
  for(const state of STATES)dist[state]=Math.max(0,dist[state]||0)/total;
  return dist;
}
function sampleDistribution(dist){
  let r=Math.random();
  for(const state of STATES){
    r-=dist[state];
    if(r<=0)return state;
  }
  return STATES[STATES.length-1];
}

function chooseNextSound(col){
  const base=TRANSITIONS[currentSound]||TRANSITIONS.silence;
  const dist={};
  const columnHasPaint=ROWS.some((row,rowIndex)=>grid[rowIndex][col]>0);
  const hasPull=ROWS.some(row=>smooth.pulls[row]>.001);

  for(const state of STATES){
    dist[state]=base[state];
  }

  // Grid values gate the non-silent states. If a whole column is empty and no
  // row pulls are active, keep the matrix intact so the machine does not stall.
  if(columnHasPaint||hasPull){
    for(const row of ROWS){
      const rowIndex=ROWS.indexOf(row);
      dist[row]*=grid[rowIndex][col];
    }
  }

  // Row pull adds a direct bias for a sound, independent of the painted cell.
  for(const row of ROWS){
    dist[row]+=smooth.pulls[row]*.38;
  }

  // Repetition rewards the current state, making loops and stutters possible.
  if(currentSound!=='silence')dist[currentSound]+=smooth.repetition*.7;

  // Density is the musical "how much sound?" control. Low density increases
  // silence; high density makes silence less likely.
  dist.silence*=.25+(1-smooth.density)*3.2;
  for(const row of ROWS)dist[row]*=.55+smooth.density*.9;

  normalize(dist);

  // Chaos blends the carefully calculated probabilities with a uniform random
  // distribution, turning the machine from stable to more surprising.
  const uniform=1/STATES.length;
  for(const state of STATES){
    dist[state]=dist[state]*(1-smooth.chaos)+uniform*smooth.chaos;
  }

  normalize(dist);
  return sampleDistribution(dist);
}

function cellCenter(rowIndex,col){
  return {
    x:gridRect.x+gridRect.labelW+col*gridRect.cellW+gridRect.cellW/2,
    y:gridRect.y+gridRect.topH+rowIndex*gridRect.cellH+gridRect.cellH/2
  };
}
function triggerVisuals(row,col){
  if(row==='silence')return;
  const rowIndex=ROWS.indexOf(row);
  const pos=cellCenter(rowIndex,col);
  const colObj=ROW_COLORS[row];
  pulses.push({x:pos.x,y:pos.y,row,col,life:1,r:2,colr:colObj.stroke});
  history.push({row,col,life:1});
  for(let i=0;i<12;i++){
    const a=Math.random()*Math.PI*2;
    const sp=1.1+Math.random()*3.8;
    particles.push({
      x:pos.x,y:pos.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      life:1,r:1.5+Math.random()*3.3,col:colObj.stroke,
      type:Math.random()>.55?'ring':'dot'
    });
  }
}

function markTransition(from,to,fromStep,toStep){
  transitions.push({
    from,to,
    fromStep:fromStep<0?toStep:fromStep,
    toStep,
    life:1,
  });
  if(transitions.length>10)transitions.shift();
  transitionLbl.textContent=`${from} -> ${to}`;
}

function runStep(){
  const fromSound=currentSound;
  const fromStep=currentStep;
  currentStep=(currentStep+1)%16;
  nextSound=chooseNextSound(currentStep);
  markTransition(fromSound,nextSound,fromStep,currentStep);
  if(nextSound!=='silence'){
    playRowSound(nextSound);
    triggerVisuals(nextSound,currentStep);
  }
  currentSound=nextSound;
  stepCount++;
  stepLbl.textContent=String(currentStep+1).padStart(2,'0');
  stateLbl.textContent=currentSound;
}

function randomLevel(){
  const r=Math.random();
  if(r<.46)return 0;
  if(r<.71)return .33;
  if(r<.9)return .66;
  return 1;
}
function randomizeGrid(){
  if(frozen)return;
  for(let r=0;r<ROWS.length;r++){
    for(let c=0;c<16;c++){
      grid[r][c]=randomLevel();
    }
  }
}
function mutateGrid(){
  if(frozen)return;
  const changes=6+Math.floor(Math.random()*10);
  for(let i=0;i<changes;i++){
    const r=Math.floor(Math.random()*ROWS.length);
    const c=Math.floor(Math.random()*16);
    const idx=PROB_LEVELS.indexOf(grid[r][c]);
    const dir=Math.random()>.5?1:-1;
    grid[r][c]=PROB_LEVELS[clamp(idx+dir,0,PROB_LEVELS.length-1)];
  }
}
function clearGrid(){
  if(frozen)return;
  for(let r=0;r<ROWS.length;r++)for(let c=0;c<16;c++)grid[r][c]=0;
}
function seedGrid(){
  const pattern=[
    [1,0,0,.33,1,0,0,.33,1,0,.33,0,1,0,0,.66],
    [0,0,.66,0,0,0,1,0,0,0,.66,0,0,.33,1,0],
    [.66,0,.66,0,.66,.33,.66,0,.66,0,.66,.33,.66,0,1,0],
    [0,0,0,0,0,.33,0,0,0,0,0,.66,0,0,.33,0],
    [0,.33,0,0,0,.66,0,.33,0,.33,0,0,0,.66,0,.33],
    [.66,0,0,0,.33,0,0,0,.66,0,0,.33,0,0,0,.66],
  ];
  for(let r=0;r<ROWS.length;r++)for(let c=0;c<16;c++)grid[r][c]=pattern[r][c];
}

function getCellAt(x,y){
  const gx=x-gridRect.x-gridRect.labelW;
  const gy=y-gridRect.y-gridRect.topH;
  if(gx<0||gy<0||gx>=gridRect.cellW*16||gy>=gridRect.cellH*ROWS.length)return null;
  return {
    col:Math.floor(gx/gridRect.cellW),
    row:Math.floor(gy/gridRect.cellH)
  };
}
function cycleCell(row,col){
  if(frozen)return;
  const value=grid[row][col];
  const idx=PROB_LEVELS.indexOf(value);
  grid[row][col]=PROB_LEVELS[(idx+1)%PROB_LEVELS.length];
  return grid[row][col];
}
function setCell(row,col,value){
  if(frozen)return;
  grid[row][col]=value;
}
function pulseCell(row,col,life=.7){
  const rowName=ROWS[row];
  const pos=cellCenter(row,col);
  pulses.push({x:pos.x,y:pos.y,row:rowName,col,life,r:1,colr:ROW_COLORS[rowName].stroke});
}
function canvasPoint(e){
  const rect=canvas.getBoundingClientRect();
  return {
    x:(e.clientX-rect.left)*(W/rect.width),
    y:(e.clientY-rect.top)*(H/rect.height)
  };
}
function paintDraggedCell(hit){
  if(!hit||frozen)return;
  const key=`${hit.row}:${hit.col}`;
  if(paintedCells.has(key))return;
  paintedCells.add(key);
  setCell(hit.row,hit.col,paintValue);
  pulseCell(hit.row,hit.col,.45);
}

function resize(){
  W=wrap.clientWidth;H=wrap.clientHeight;
  canvas.width=W*devicePixelRatio;canvas.height=H*devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  layoutGrid();
}
function layoutGrid(){
  const panelReserve=Math.min((panel?.offsetHeight||220)+54,H*.64);
  const maxW=Math.min(Math.max(320,W-48),1180);
  const maxH=Math.max(190,H-panelReserve-54);
  const cellW=clamp(Math.floor((maxW-76)/16),18,70);
  const cellH=clamp(Math.floor((maxH-42)/ROWS.length),28,56);
  const gridW=76+cellW*16;
  const gridH=42+cellH*ROWS.length;
  gridRect={
    x:(W-gridW)/2,
    y:Math.max(20,(H-panelReserve-gridH)/2),
    w:gridW,h:gridH,cellW,cellH,labelW:76,topH:42
  };
}

function drawBackground(){
  ctx.clearRect(0,0,W,H);
  const grd=ctx.createRadialGradient(W*.5,H*.28,20,W*.5,H*.38,Math.max(W,H)*.8);
  grd.addColorStop(0,'rgba(235,244,246,.96)');
  grd.addColorStop(.45,'rgba(218,234,239,.94)');
  grd.addColorStop(1,'#dbe9ee');
  ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);

  ctx.fillStyle='rgba(45,91,107,.08)';
  for(let x=0;x<W;x+=40){
    for(let y=0;y<H;y+=40){
      ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();
    }
  }
}
function drawGrid(){
  const {x,y,cellW,cellH,labelW,topH}=gridRect;
  ctx.save();
  ctx.font="10px 'Space Mono',monospace";
  ctx.textAlign='center';ctx.textBaseline='middle';

  ctx.fillStyle='rgba(237,247,249,.64)';
  ctx.strokeStyle='rgba(36,66,80,.18)';
  ctx.lineWidth=1;
  roundRect(ctx,x,y,gridRect.w,gridRect.h,8);
  ctx.fill();ctx.stroke();

  if(isPlaying&&currentStep>=0){
    const cx=x+labelW+currentStep*cellW;
    ctx.save();
    ctx.fillStyle='rgba(216,117,144,.13)';
    ctx.shadowColor='rgba(126,74,88,.2)';
    ctx.shadowBlur=10;
    roundRect(ctx,cx,y+topH,cellW,cellH*ROWS.length,4);
    ctx.fill();
    ctx.restore();
  }

  for(let c=0;c<16;c++){
    const cx=x+labelW+c*cellW+cellW/2;
    ctx.fillStyle=c===currentStep?'#ad5f74':'rgba(36,66,80,.56)';
    ctx.fillText(String(c+1).padStart(2,'0'),cx,y+topH*.45);
  }

  for(let r=0;r<ROWS.length;r++){
    const row=ROWS[r];
    const cy=y+topH+r*cellH+cellH/2;
    const color=ROW_COLORS[row];
    ctx.textAlign='right';
    ctx.fillStyle=color.text;
    ctx.font="700 12px 'Space Mono',monospace";
    ctx.fillText(row,x+labelW-18,cy-3);
    ctx.font="9px 'Space Mono',monospace";
    ctx.fillStyle='rgba(36,66,80,.5)';
    ctx.fillText(rowName(row),x+labelW-18,cy+11);
    ctx.textAlign='center';

    for(let c=0;c<16;c++){
      const val=grid[r][c];
      const cellX=x+labelW+c*cellW+4;
      const cellY=y+topH+r*cellH+4;
      const w=cellW-8,h=cellH-8;
      const active=c===currentStep&&isPlaying;
      const alpha=.035+val*.46;

      ctx.save();
      if(val>=1){
        ctx.shadowColor=color.glow;
        ctx.shadowBlur=18;
      }else if(val>=.66){
        ctx.shadowColor=color.glow;
        ctx.shadowBlur=8;
      }
      ctx.fillStyle=color.fill.replace(/[\d.]+\)$/,(alpha).toFixed(3)+')');
      ctx.strokeStyle=active?color.stroke:`rgba(36,66,80,${.12+val*.16})`;
      ctx.lineWidth=active?1.7:1;
      roundRect(ctx,cellX,cellY,w,h,5);
      ctx.fill();ctx.stroke();
      if(val>0){
        ctx.fillStyle=color.stroke;
        ctx.globalAlpha=.18+val*.45;
        ctx.fillRect(cellX+5,cellY+h-5,Math.max(2,(w-10)*val),2);
      }
      ctx.restore();
    }
  }
  ctx.restore();
}
function rowName(row){
  return {bd:'kick',sd:'snare',hh:'hi-hat',cp:'clap',perc:'percussion',bass:'bass'}[row];
}
function drawHistory(){
  if(gridRect.cellW<=8||gridRect.cellH<=8)return;
  for(let i=history.length-1;i>=0;i--){
    const h=history[i];
    h.life-=.012;
    if(h.life<=0){history.splice(i,1);continue;}
    const rowIndex=ROWS.indexOf(h.row);
    const color=ROW_COLORS[h.row];
    const cellX=gridRect.x+gridRect.labelW+h.col*gridRect.cellW+4;
    const cellY=gridRect.y+gridRect.topH+rowIndex*gridRect.cellH+4;
    ctx.save();
    ctx.globalAlpha=h.life*.32;
    ctx.fillStyle=color.stroke;
    roundRect(ctx,cellX,cellY,gridRect.cellW-8,gridRect.cellH-8,5);
    ctx.fill();
    ctx.restore();
  }
}
function transitionPoint(sound,col){
  const safeCol=clamp(col,0,15);
  const x=gridRect.x+gridRect.labelW+safeCol*gridRect.cellW+gridRect.cellW/2;
  const rowIndex=ROWS.indexOf(sound);
  if(rowIndex>=0)return cellCenter(rowIndex,safeCol);
  return {x,y:gridRect.y+gridRect.topH-13};
}
function drawArrowHead(x1,y1,x2,y2,color,alpha){
  const angle=Math.atan2(y2-y1,x2-x1);
  const size=7;
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(x2,y2);
  ctx.lineTo(x2-size*Math.cos(angle-.45),y2-size*Math.sin(angle-.45));
  ctx.lineTo(x2-size*Math.cos(angle+.45),y2-size*Math.sin(angle+.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function drawTransitions(){
  for(let i=transitions.length-1;i>=0;i--){
    const tr=transitions[i];
    tr.life-=.014;
    if(tr.life<=0){transitions.splice(i,1);continue;}

    const fromCol=tr.fromStep>tr.toStep?tr.toStep:tr.fromStep;
    const from=transitionPoint(tr.from,fromCol);
    const to=transitionPoint(tr.to,tr.toStep);
    const toColor=ROW_COLORS[tr.to]?.stroke||'rgba(66,89,99,.72)';
    const fromColor=ROW_COLORS[tr.from]?.stroke||'rgba(66,89,99,.48)';
    const alpha=tr.life*.82;
    const midX=(from.x+to.x)/2;
    const controlY=Math.min(from.y,to.y)-26;
    const gradient=ctx.createLinearGradient(from.x,from.y,to.x,to.y);
    gradient.addColorStop(0,fromColor);
    gradient.addColorStop(1,toColor);

    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.strokeStyle=gradient;
    ctx.lineWidth=2;
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    ctx.moveTo(from.x,from.y);
    ctx.quadraticCurveTo(midX,controlY,to.x,to.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if(tr.life>.72){
      ctx.fillStyle='rgba(239,247,249,.92)';
      ctx.strokeStyle='rgba(36,66,80,.16)';
      ctx.lineWidth=1;
      const label=`${tr.from} -> ${tr.to}`;
      ctx.font="9px 'Space Mono',monospace";
      const textW=ctx.measureText(label).width+12;
      const labelX=clamp(midX-textW/2,gridRect.x+8,gridRect.x+gridRect.w-textW-8);
      const labelY=Math.max(gridRect.y+6,controlY-18);
      roundRect(ctx,labelX,labelY,textW,17,4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle=toColor;
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillText(label,labelX+textW/2,labelY+8.5);
    }
    ctx.restore();
    drawArrowHead(midX,controlY,to.x,to.y,toColor,alpha);
  }
}
function drawPulses(){
  for(let i=pulses.length-1;i>=0;i--){
    const p=pulses[i];
    p.r+=3.2;p.life-=.04;
    if(p.life<=0){pulses.splice(i,1);continue;}
    ctx.save();
    ctx.globalAlpha=p.life*.55;
    ctx.strokeStyle=p.colr;
    ctx.lineWidth=1.4*p.life;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }
}
function drawParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx;p.y+=p.vy;p.vy+=.045;p.vx*=.975;p.life-=.032;
    if(p.life<=0){particles.splice(i,1);continue;}
    ctx.save();
    ctx.globalAlpha=p.life*p.life;
    ctx.beginPath();
    if(p.type==='ring'){
      ctx.arc(p.x,p.y,p.r*(2-p.life),0,Math.PI*2);
      ctx.strokeStyle=p.col;ctx.lineWidth=1;ctx.stroke();
    }else{
      ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);
      ctx.fillStyle=p.col;ctx.fill();
    }
    ctx.restore();
  }
}
function drawReadout(){
  const x=gridRect.x;
  const y=gridRect.y+gridRect.h+18;
  if(y>H-210)return;
  ctx.save();
  ctx.font="10px 'Space Mono',monospace";
  ctx.textAlign='left';ctx.textBaseline='top';
  ctx.fillStyle='rgba(221,216,240,.42)';
  ctx.fillText('current sound',x,y);
  ctx.fillStyle=ROW_COLORS[currentSound]?.text||'#6d8188';
  ctx.font="700 18px 'Space Mono',monospace";
  ctx.fillText(currentSound,x,y+16);
  ctx.fillStyle='rgba(221,216,240,.42)';
  ctx.font="10px 'Space Mono',monospace";
  ctx.fillText('selected next',x+180,y);
  ctx.fillStyle=ROW_COLORS[nextSound]?.text||'#6d8188';
  ctx.font="700 18px 'Space Mono',monospace";
  ctx.fillText(nextSound,x+180,y+16);
  ctx.restore();
}
function roundRect(c,x,y,w,h,r){
  if(w<=0||h<=0){
    c.beginPath();
    c.rect(x,y,Math.max(0,w),Math.max(0,h));
    return;
  }
  const rr=Math.min(r,w/2,h/2);
  c.beginPath();
  c.moveTo(x+rr,y);
  c.arcTo(x+w,y,x+w,y+h,rr);
  c.arcTo(x+w,y+h,x,y+h,rr);
  c.arcTo(x,y+h,x,y,rr);
  c.arcTo(x,y,x+w,y,rr);
  c.closePath();
}

function draw(ts){
  const dt=Math.min((ts-lastTime)/1000,.05)||0;
  lastTime=ts;
  updateSmoothedControls();

  if(isPlaying){
    stepTimer+=dt*1000;
    const interval=60000/Math.max(1,smooth.tempo)/4;
    while(stepTimer>=interval){
      stepTimer-=interval;
      runStep();
    }
  }

  drawBackground();
  drawHistory();
  drawGrid();
  drawTransitions();
  drawPulses();
  drawParticles();
  requestAnimationFrame(draw);
}

function updateSliderLabels(){
  const tempoValue=Math.round(targets.tempo);
  document.getElementById('tempo-val').textContent=String(tempoValue);
  const tempoAngle=((tempoValue-60)/120)*270;
  tempoDial.style.setProperty('--dial-angle',`${tempoAngle}deg`);
  tempoDial.setAttribute('aria-valuenow',String(tempoValue));
  tempoDial.setAttribute('aria-valuetext',`${tempoValue} BPM`);
  moodReadout.textContent=`chaos ${targets.chaos.toFixed(2)} / density ${targets.density.toFixed(2)} / repeat ${targets.repetition.toFixed(2)}`;
  for(const row of ROWS){
    const value=targets.pulls[row];
    const btn=document.querySelector(`.pull-pad[data-row="${row}"]`);
    document.getElementById(`pull-${row}-val`).textContent=PULL_LABELS[String(value)];
    btn.classList.toggle('active',value>0);
    btn.querySelector('.pull-dial').style.setProperty('--pull-angle',`${value*270}deg`);
  }
}
function setTempo(value){
  targets.tempo=clamp(Math.round(value),60,180);
  updateSliderLabels();
}
function setTempoFromPoint(e){
  const rect=tempoDial.getBoundingClientRect();
  const cx=rect.left+rect.width/2;
  const cy=rect.top+rect.height/2;
  let rotation=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI+90;
  if(rotation>180)rotation-=360;
  const angle=clamp(rotation+135,0,270);
  setTempo(60+(angle/270)*120);
}
function applyMood(name){
  const preset=MOOD_PRESETS[name];
  if(!preset)return;
  currentMood=name;
  Object.assign(targets,preset);
  document.querySelectorAll('[data-mood]').forEach(btn=>{
    btn.classList.toggle('on',btn.dataset.mood===name);
  });
  updateSliderLabels();
}
function cyclePull(row){
  const idx=PROB_LEVELS.indexOf(targets.pulls[row]);
  targets.pulls[row]=PROB_LEVELS[(idx+1)%PROB_LEVELS.length];
  updateSliderLabels();
}

canvas.addEventListener('pointerdown',e=>{
  const point=canvasPoint(e);
  const hit=getCellAt(point.x,point.y);
  if(!hit||frozen)return;
  e.preventDefault();
  painting=true;
  paintedCells.clear();
  paintValue=cycleCell(hit.row,hit.col);
  paintedCells.add(`${hit.row}:${hit.col}`);
  pulseCell(hit.row,hit.col,.7);
  if(canvas.setPointerCapture)canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove',e=>{
  if(!painting)return;
  e.preventDefault();
  const point=canvasPoint(e);
  paintDraggedCell(getCellAt(point.x,point.y));
});

function stopPainting(e){
  if(!painting)return;
  painting=false;
  paintedCells.clear();
  if(e&&canvas.releasePointerCapture){
    try{canvas.releasePointerCapture(e.pointerId);}catch(err){}
  }
}

canvas.addEventListener('pointerup',stopPainting);
canvas.addEventListener('pointercancel',stopPainting);
canvas.addEventListener('pointerleave',stopPainting);

canvas.addEventListener('contextmenu',e=>{
  const point=canvasPoint(e);
  if(getCellAt(point.x,point.y))e.preventDefault();
});

document.getElementById('kit-btns').addEventListener('click',e=>{
  const btn=e.target.closest('[data-kit]');if(!btn)return;
  document.querySelectorAll('[data-kit]').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  drumKit=btn.dataset.kit;
  kitLbl.textContent=KIT_DESCS[drumKit];
});
document.getElementById('mood-btns').addEventListener('click',e=>{
  const btn=e.target.closest('[data-mood]');if(!btn)return;
  applyMood(btn.dataset.mood);
});
document.querySelector('.pulls').addEventListener('click',e=>{
  const btn=e.target.closest('[data-row]');if(!btn)return;
  cyclePull(btn.dataset.row);
});
tempoDial.addEventListener('pointerdown',e=>{
  e.preventDefault();
  setTempoFromPoint(e);
  if(tempoDial.setPointerCapture)tempoDial.setPointerCapture(e.pointerId);
});
tempoDial.addEventListener('pointermove',e=>{
  if(e.buttons!==1)return;
  e.preventDefault();
  setTempoFromPoint(e);
});
tempoDial.addEventListener('keydown',e=>{
  if(e.key==='ArrowUp'||e.key==='ArrowRight'){
    e.preventDefault();
    setTempo(targets.tempo+1);
  }
  if(e.key==='ArrowDown'||e.key==='ArrowLeft'){
    e.preventDefault();
    setTempo(targets.tempo-1);
  }
});
playBtn.addEventListener('click',async()=>{
  const ready=await unlockAudio();
  if(!ready){
    console.warn('Audio context did not start.');
    return;
  }
  isPlaying=!isPlaying;
  playBtn.classList.toggle('playing',isPlaying);
  playBtn.setAttribute('aria-label',isPlaying?'Pause':'Play');
  playBtn.setAttribute('title',isPlaying?'Pause':'Play');
  stepTimer=0;
  if(isPlaying&&currentStep<0)runStep();
});
document.getElementById('randomize').addEventListener('click',randomizeGrid);
document.getElementById('mutate').addEventListener('click',mutateGrid);
document.getElementById('clear').addEventListener('click',clearGrid);
document.getElementById('freeze').addEventListener('click',e=>{
  frozen=!frozen;
  e.currentTarget.classList.toggle('on',frozen);
  freezeLbl.textContent=frozen?'frozen grid':'live grid';
});
function closeIntro(){
  introOverlay?.classList.add('is-hidden');
}
introStart?.addEventListener('click',closeIntro);
introOpen?.addEventListener('click',()=>{
  introOverlay?.classList.remove('is-hidden');
});
introOverlay?.addEventListener('click',e=>{
  if(e.target===introOverlay)closeIntro();
});

seedGrid();
applyMood(currentMood);
updateSliderLabels();
resize();
requestAnimationFrame(draw);
window.addEventListener('resize',resize);
})();

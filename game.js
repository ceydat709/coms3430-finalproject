(function () {
  window.createGameModule = function createGameModule({
    rowsConfig,
    zones,
    colColors,
    nrows,
    getTODBlend,
    getTODTransition,
    setTOD,
    setUnderwater,
    getUnderwaterState,
    applyOrbMusicalImpact,
    renderSequencer,
  }) {
    const gameCanvas = document.getElementById("game-canvas");
    const gameSection = document.getElementById("game-section");
    const hudAction = document.getElementById("hud-action");
    const hudZone = document.getElementById("hud-zone");
    const gctx = gameCanvas.getContext("2d");

    let gW = 0;
    let gH = 0;

    const GRAVITY = 0.45;
    const JUMP_FORCE = -10.5;
    const MOVE_SPEED = 3.2;
    const GROUND_FRAC = 0.72;
    const WATERLINE_FRAC = 0.58;
    const CHAR_W = 28;
    const CHAR_H = 36;
    const PX = 4;

    const PLATFORM_SEGMENTS = [
      { xStart: 0.0, xEnd: 0.18, yTopFrac: 0.52, tier: 0 },
      { xStart: 0.18, xEnd: 0.33, yTopFrac: 0.49, tier: 1 },
      { xStart: 0.33, xEnd: 0.5, yTopFrac: 0.53, tier: 2 },
      { xStart: 0.5, xEnd: 0.65, yTopFrac: 0.55, tier: 3 },
      { xStart: 0.65, xEnd: 0.82, yTopFrac: 0.66, tier: 4 },
      { xStart: 0.82, xEnd: 1.0, yTopFrac: 0.72, tier: 5 },
    ];
    const BASE_FLOOR = { xStart: 0, xEnd: 1, yTopFrac: GROUND_FRAC, tier: 0 };
    const TOD_SKY_ROWS = {
      day: ["#4a90c4", "#5ba3d4", "#6eb8e8", "#84c8f0", "#a0d8f4", "#b8e4f8"],
      dawn: ["#1a1a3a", "#2a2440", "#4a3850", "#8a5848", "#c07848", "#e09858"],
      sunset: [
        "#181828",
        "#281828",
        "#481838",
        "#882838",
        "#c84828",
        "#e86828",
      ],
      dusk: ["#080818", "#100820", "#200828", "#3a1040", "#601860", "#802888"],
      night: ["#040408", "#080810", "#0c0c18", "#101020", "#141428", "#181830"],
    };

    let miffySpriteImg = null;
    let miffySpriteReady = false;
    const miffySpriteLoader = new Image();
    miffySpriteLoader.src = "assets/miffy.png";
    miffySpriteLoader.onload = () => {
      miffySpriteImg = miffySpriteLoader;
      miffySpriteReady = true;
    };

    let miffy = {
      x: 120,
      y: 0,
      vx: 0,
      vy: 0,
      onGround: false,
      tier: 0,
      facing: 1,
      walkFrame: 0,
      walkTick: 0,
      isJumping: false,
      stillTimer: 0,
      justLanded: false,
      landedTimer: 0,
      earWiggle: 0,
    };
    const keys = {};

    let trails = [];
    let splats = [];
    let footstepCooldown = 0;
    let gameTime = 0;
    let hudActionTimer = 0;
    let lastGameTime = 0;

    const clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({
        x: Math.random(),
        y: 0.05 + Math.random() * 0.28,
        w: 60 + Math.random() * 90,
        speed: 0.00006 + Math.random() * 0.00008,
        alpha: 0.5 + Math.random() * 0.4,
      });
    }

    const stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.7,
        size: 0.5 + Math.random() * 2,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    const grassTufts = [];
    for (let i = 0; i < 22; i++) {
      grassTufts.push({
        x: Math.random(),
        h: 4 + Math.random() * 8,
        sway: Math.random() * Math.PI * 2,
      });
    }

    let orbs = [];
    let zonePulse = new Array(zones.length).fill(0);

    function getPlatformAtX(x) {
      const xFrac = x / gW;
      for (const p of PLATFORM_SEGMENTS) {
        if (xFrac >= p.xStart && xFrac < p.xEnd) return p;
      }
      return BASE_FLOOR;
    }

    function waterY() {
      return gH * WATERLINE_FRAC;
    }

    function groundY() {
      return gH * GROUND_FRAC;
    }

    function hexToRgbArr(hex) {
      return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
    }

    function snapPX(v) {
      return Math.round(v / PX) * PX;
    }

    function spawnOrbs() {
      orbs = [];
      for (let i = 0; i < 4; i++) {
        orbs.push({
          x: 0.12 + Math.random() * 0.76,
          yBase: 0.45 + Math.random() * 0.18,
          phase: Math.random() * Math.PI * 2,
          collected: false,
          color: rowsConfig[Math.floor(Math.random() * nrows)].color,
          respawn: 0,
        });
      }
    }

    function getTODKey() {
      const { from, to, t } = getTODTransition();
      return t >= 0.5 ? to : from;
    }

    function drawMiffy(ctx, x, y, facing, walkFrame, landed, earWiggle) {
      const S = 3;
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#000";
      ctx.fillRect(x - 10, y - 2, 20, 4);
      ctx.restore();

      if (miffySpriteReady && miffySpriteImg) {
        const nW = miffySpriteImg.naturalWidth || miffySpriteImg.width || CHAR_W;
        const nH = miffySpriteImg.naturalHeight || miffySpriteImg.height || CHAR_H;
        const sprH = CHAR_H * 1.45;
        const sprW = sprH * (nW / nH);
        const walkBob = Math.sin(walkFrame * 0.35) * 1.4;
        ctx.save();
        if (facing < 0) {
          ctx.translate(x, 0);
          ctx.scale(-1, 1);
          ctx.translate(-x, 0);
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          miffySpriteImg,
          x - sprW / 2,
          y - sprH + 11 + walkBob,
          sprW,
          sprH,
        );
        ctx.restore();
        return;
      }

      function px(px2, py, color) {
        ctx.fillStyle = color;
        const sx = Math.round(x + (facing < 0 ? -px2 - 1 : px2) * S);
        const sy = Math.round(y + py * S);
        ctx.fillRect(sx, sy, S, S);
      }

      function prect(px1, py1, pw, ph, color) {
        for (let rx = 0; rx < pw; rx++) {
          for (let ry = 0; ry < ph; ry++) px(px1 + rx, py1 + ry, color);
        }
      }

      const legStep = Math.floor(walkFrame / 3) % 4;
      const lOff = [0, 1, 0, -1][legStep];
      const rOff = [0, -1, 0, 1][legStep];
      prect(-4, lOff - 3, 3, 4, "#f0ece6");
      prect(-5, lOff + 1, 5, 2, "#e0dbd2");
      prect(1, rOff - 3, 3, 4, "#e8e4de");
      prect(0, rOff + 1, 5, 2, "#d8d3ca");
      prect(-6, -13, 12, 10, "#e8540a");
      for (let i = -6; i < 6; i++) px(i, -13, "#000");
      for (let j = -13; j < -3; j++) {
        px(-6, j, "#000");
        px(5, j, "#000");
      }
      prect(-4, -22, 1, 5, "#f0ece6");
      prect(6, -22, 1, 5, "#f0ece6");
      for (let hy = -22; hy <= -15; hy++) prect(-4, hy, 9, 1, "#f8f5f0");
      for (let hy = -24; hy <= -23; hy++) prect(-3, hy, 7, 1, "#f8f5f0");
      prect(-5, -21, 10, 4, "#f8f5f0");
      for (let hy = -22; hy <= -16; hy++) {
        px(-5, hy, "#000");
        px(4, hy, "#000");
      }
      for (let hx = -3; hx <= 3; hx++) px(hx, -14, "#000");
      const earW = Math.floor(Math.sin(earWiggle) * 1.5);
      prect(-4, -34 + earW, 3, 10, "#f8f5f0");
      prect(-3, -34 + earW, 1, 8, "#f0c8c0");
      prect(1, -34 + earW, 3, 10, "#f8f5f0");
      prect(2, -34 + earW, 1, 8, "#f0c8c0");
      px(-3, -21, "#000");
      px(-1, -19, "#000");
      px(-3, -19, "#000");
      px(-1, -21, "#000");
      px(1, -21, "#000");
      px(3, -19, "#000");
      px(1, -19, "#000");
      px(3, -21, "#000");
      px(0, -17, "#cc8880");
      px(-1, -17, "#cc8880");
    }

    function drawZoneBands(ctx, W, H, gY) {
      zones.forEach((z, i) => {
        const xS = snapPX(z.xStart * W);
        const xE = snapPX(z.xEnd * W);
        const pulse = zonePulse[i];
        const col = hexToRgbArr(z.color);
        ctx.fillStyle = `rgba(${col},${0.04 + pulse * 0.12})`;
        ctx.fillRect(xS, 0, xE - xS, gY);
        if (i > 0) {
          ctx.fillStyle = `rgba(${col},${0.3 + pulse * 0.5})`;
          for (let dy = snapPX(gY * 0.2); dy < gY; dy += PX * 3) {
            ctx.fillRect(xS, dy, 2, PX * 2);
          }
        }
        ctx.save();
        ctx.globalAlpha = 0.28 + pulse * 0.55;
        ctx.font = "bold 7px 'Press Start 2P',monospace";
        ctx.fillStyle = z.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(z.name.toUpperCase(), (xS + xE) / 2, gY - 12);
        ctx.restore();
        if (pulse > 0.08) {
          for (let px2 = xS; px2 < xE; px2 += PX * 2) {
            ctx.fillStyle = `rgba(${col},${pulse * 0.8})`;
            ctx.fillRect(px2, snapPX(gY) - PX, PX, PX * 2);
            ctx.fillRect(px2 + PX, snapPX(gY), PX, PX);
          }
        }
        zonePulse[i] *= 0.88;
      });
    }

    function drawWaterAndPlatforms(ctx, W, H, todBlend) {
      const wy = snapPX(H * WATERLINE_FRAC);
      const todKey = getTODKey();
      const waterCols =
        todKey === "night"
          ? ["#080c18", "#0c1020", "#101828"]
          : todKey === "dusk"
            ? ["#180828", "#200c30", "#281040"]
            : ["#1a6090", "#1e78b0", "#2288c8"];
      const bandH = Math.ceil((H - wy) / 3);
      waterCols.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, wy + i * bandH, W, bandH + 2);
      });
      const wavePhase = Math.floor(gameTime / 8) % 2;
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      for (let wx = wavePhase * PX * 2; wx < W; wx += PX * 4) {
        ctx.fillRect(wx, wy, PX * 2, PX);
      }
      const thickness = Math.max(PX * 3, snapPX(H * 0.025));
      PLATFORM_SEGMENTS.forEach((p) => {
        const xS = snapPX(p.xStart * W);
        const xE = snapPX(p.xEnd * W);
        const yTop = snapPX(p.yTopFrac * H);
        const rowCol = colColors[p.tier];
        const submerged = yTop > wy;
        const baseCol = submerged ? "#0c2840" : todBlend.groundDark;
        ctx.fillStyle = baseCol;
        ctx.fillRect(xS, yTop, xE - xS, thickness);
        ctx.fillStyle = rowCol;
        ctx.globalAlpha = submerged ? 0.25 : 0.7;
        ctx.fillRect(xS, yTop, xE - xS, PX);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(xS, yTop, xE - xS, 1);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(xS, yTop + thickness - 1, xE - xS, 1);
        if (!submerged) {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.font = "bold 5px 'Press Start 2P',monospace";
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(rowsConfig[p.tier].abbr.toUpperCase(), (xS + xE) / 2, yTop + PX + 1);
          ctx.restore();
        }
      });
    }

    function drawWorld(ctx, W, H, todBlend) {
      const todKey = getTODKey();
      const skyRows = TOD_SKY_ROWS[todKey] || TOD_SKY_ROWS.day;
      const skyH = H * GROUND_FRAC;
      const bandH = Math.ceil(skyH / skyRows.length);
      skyRows.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, i * bandH, W, bandH + 1);
      });
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let bi = 1; bi < skyRows.length; bi++) {
        const by = Math.round(bi * bandH);
        for (let dx = 0; dx < W; dx += PX * 2) ctx.fillRect(dx, by, PX, 1);
      }
      if (todBlend.starAlpha > 0.05) {
        stars.forEach((s) => {
          if (Math.sin(gameTime * 0.04 + s.twinkle) > 0.2) {
            ctx.globalAlpha = todBlend.starAlpha;
            ctx.fillStyle = "#ffffff";
            const sz = s.size > 1.5 ? PX : PX / 2;
            ctx.fillRect(snapPX(s.x * W), snapPX(s.y * H * GROUND_FRAC), sz, sz);
          }
        });
        ctx.globalAlpha = 1;
      }
      if (todBlend.moonAlpha > 0.05) {
        const mx = snapPX(W * 0.82);
        const my = snapPX(H * 0.13);
        ctx.globalAlpha = todBlend.moonAlpha;
        for (let dy = -5; dy <= 5; dy++) {
          for (let dx = -5; dx <= 5; dx++) {
            if (dx * dx + dy * dy <= 25) {
              ctx.fillStyle = dx < -1 && dy < 0 ? "#b8c8e0" : "#e0ecff";
              ctx.fillRect(mx + dx * PX, my + dy * PX, PX, PX);
            }
          }
        }
        ctx.globalAlpha = 1;
      }
      if (todBlend.sunAlpha > 0.05) {
        const sx = snapPX(W * 0.78);
        const sy = snapPX(H * GROUND_FRAC * todBlend.sunY);
        ctx.globalAlpha = todBlend.sunAlpha * 0.15;
        for (let dy = -8; dy <= 8; dy++) {
          for (let dx = -8; dx <= 8; dx++) {
            const d = dx * dx + dy * dy;
            if (d > 25 && d <= 64) {
              ctx.fillStyle = todBlend.sunColor;
              ctx.fillRect(sx + dx * PX, sy + dy * PX, PX, PX);
            }
          }
        }
        ctx.globalAlpha = todBlend.sunAlpha;
        for (let dy = -5; dy <= 5; dy++) {
          for (let dx = -5; dx <= 5; dx++) {
            if (dx * dx + dy * dy <= 25) {
              ctx.fillStyle = dx === 0 && dy === 0 ? "#ffffff" : todBlend.sunColor;
              ctx.fillRect(sx + dx * PX, sy + dy * PX, PX, PX);
            }
          }
        }
        ctx.globalAlpha = 1;
      }
      clouds.forEach((cl) => {
        cl.x = (cl.x + cl.speed) % 1.12;
        const cx = snapPX(cl.x * W - 40);
        const cy = snapPX(cl.y * H);
        const cw = snapPX(cl.w);
        const ch = snapPX(cl.w * 0.2);
        const cloudCol =
          todKey === "night" ? "#181828" : todKey === "dusk" ? "#382848" : "#ffffff";
        ctx.globalAlpha = cl.alpha * 0.65;
        ctx.fillStyle = cloudCol;
        ctx.fillRect(cx, cy, cw, ch);
        ctx.fillRect(cx + snapPX(cw * 0.15), cy - PX * 2, snapPX(cw * 0.5), PX * 2);
        ctx.fillRect(cx - PX, cy, PX * 2, ch - PX);
        ctx.globalAlpha = 1;
      });
      const gY = snapPX(groundY());
      ctx.fillStyle = todBlend.groundDark;
      ctx.globalAlpha = 0.4;
      let hx = 0;
      while (hx < W) {
        const hillH = snapPX(Math.sin(hx * 0.012) * 20 + Math.cos(hx * 0.008) * 14 + 18);
        ctx.fillRect(hx, gY - hillH, PX * 2, hillH);
        hx += PX * 2;
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = todBlend.ground;
      ctx.fillRect(0, gY, W, PX * 3);
      ctx.fillStyle = todBlend.groundDark;
      ctx.fillRect(0, gY + PX * 3, W, H - (gY + PX * 3));
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(0, gY, W, 1);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, gY + PX * 3, W, 1);
      ctx.fillStyle = todBlend.ground;
      grassTufts.forEach((g) => {
        const tx = snapPX(g.x * W);
        const gy2 = gY;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(tx, gy2 - PX * 2, PX, PX * 2);
        ctx.fillRect(tx - PX, gy2 - PX, PX, PX);
        ctx.fillRect(tx + PX, gy2 - PX, PX, PX);
      });
      ctx.globalAlpha = 1;
      if (todBlend.starAlpha > 0.3) {
        ctx.fillStyle = todBlend.sunColor;
        ctx.globalAlpha = 0.06;
        for (let fx = 0; fx < W; fx += PX * 3) ctx.fillRect(fx, gY - PX * 3, PX, PX * 2);
        ctx.globalAlpha = 1;
      }
    }

    function showHudAction(msg) {
      hudAction.textContent = msg;
      hudActionTimer = 80;
    }

    function spawnJumpSplat(platY, rowIdx) {
      const gY = platY ?? groundY();
      const col = rowsConfig[rowIdx ?? miffy.tier ?? 0].color;
      const particles = [];
      for (let i = 0; i < 18 + Math.floor(Math.random() * 12); i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.5 + Math.random() * 5;
        particles.push({
          x: miffy.x,
          y: gY,
          vx: Math.cos(a) * sp,
          vy: -Math.abs(Math.sin(a) * sp) - 1,
          life: 1,
        });
      }
      splats.push({ x: miffy.x, y: gY, color: col, age: 0, particles });
      zonePulse[rowIdx ?? miffy.tier ?? 0] = 1;
      renderSequencer();
    }

    function updateGame() {
      gameTime++;
      const wasOnGround = miffy.onGround;
      miffy.vx = 0;
      if (keys.ArrowLeft) {
        miffy.vx = -MOVE_SPEED;
        miffy.facing = -1;
      }
      if (keys.ArrowRight) {
        miffy.vx = MOVE_SPEED;
        miffy.facing = 1;
      }
      if ((keys.ArrowUp || keys.Space) && miffy.onGround) {
        miffy.vy = JUMP_FORCE;
        miffy.onGround = false;
        miffy.isJumping = true;
        miffy.earWiggle = 0;
        showHudAction("jump!");
      }
      miffy.vy += GRAVITY;
      miffy.x += miffy.vx;
      miffy.y += miffy.vy;
      miffy.x = Math.max(CHAR_W / 2, Math.min(gW - CHAR_W / 2, miffy.x));
      miffy.onGround = false;
      const platform = getPlatformAtX(miffy.x);
      const platformY = platform.yTopFrac * gH;
      if (miffy.y >= platformY) {
        if (miffy.vy > 2 && !wasOnGround) {
          miffy.justLanded = true;
          miffy.landedTimer = 12;
          miffy.tier = platform.tier;
          spawnJumpSplat(platformY, miffy.tier);
          hudZone.textContent = rowsConfig[miffy.tier].full;
          hudZone.style.color = rowsConfig[miffy.tier].color;
          showHudAction("landed");
        }
        miffy.y = platformY;
        miffy.vy = 0;
        miffy.onGround = true;
        miffy.tier = platform.tier;
        miffy.isJumping = false;
      }
      const wy = waterY();
      const underwaterNow = miffy.y > wy + 0.5;
      const depth01 = Math.max(0, Math.min(1, (miffy.y - wy) / (gH * 0.25)));
      const underwaterState = getUnderwaterState();
      if (underwaterNow !== underwaterState.active) {
        setUnderwater(underwaterNow, depth01);
        showHudAction(underwaterNow ? "underwater lfo" : "surface");
      } else if (Math.abs(depth01 - underwaterState.depth01) > 0.06) {
        setUnderwater(underwaterNow, depth01);
      }
      miffy.earWiggle += 0.18;
      if (miffy.landedTimer > 0) miffy.landedTimer--;
      else miffy.justLanded = false;
      if (Math.abs(miffy.vx) > 0.1 && miffy.onGround) {
        miffy.walkTick++;
        if (miffy.walkTick > 6) {
          miffy.walkFrame++;
          miffy.walkTick = 0;
        }
      }
      const isMoving = Math.abs(miffy.vx) > 0.1 || !miffy.onGround;
      if (!isMoving) {
        miffy.stillTimer++;
        if (miffy.stillTimer === 70) showHudAction("listening");
      } else {
        miffy.stillTimer = 0;
      }
      footstepCooldown--;
      if (Math.abs(miffy.vx) > 0.5 && miffy.onGround && footstepCooldown <= 0) {
        footstepCooldown = 14;
        const rowIdx = miffy.tier;
        trails.push({
          x: miffy.x + (Math.random() - 0.5) * 8,
          y: groundY() - 1 + (Math.random() - 0.5) * 4,
          color: rowsConfig[rowIdx].color,
          alpha: 0.7,
          r: 5 + Math.random() * 5,
        });
        zonePulse[rowIdx] = Math.min(1, zonePulse[rowIdx] + 0.3);
        hudZone.textContent = rowsConfig[rowIdx].full;
        hudZone.style.color = rowsConfig[rowIdx].color;
      }
      trails = trails.filter((t) => t.alpha > 0.01);
      trails.forEach((t) => {
        t.alpha *= 0.978;
      });
      splats.forEach((s) => {
        s.particles = s.particles.filter((p) => p.life > 0.01);
        s.particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.18;
          p.vx *= 0.92;
          p.life *= 0.88;
        });
      });
      splats = splats.filter((s) => s.particles.length > 0 || s.age < 80);
      splats.forEach((s) => s.age++);
      const now = Date.now();
      orbs.forEach((orb) => {
        if (orb.collected) {
          if (now > orb.respawn) orb.collected = false;
          return;
        }
        const orbX = orb.x * gW;
        const orbY = groundY() * orb.yBase - Math.sin(gameTime * 0.04 + orb.phase) * 12;
        const dx = miffy.x - orbX;
        const dy = miffy.y - CHAR_H * 0.5 - orbY;
        if (Math.sqrt(dx * dx + dy * dy) < 24) {
          orb.collected = true;
          orb.respawn = now + 8000;
          applyOrbMusicalImpact(orb);
          showHudAction("remix!");
          for (let i = 0; i < 16; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 2 + Math.random() * 4;
            splats.push({
              x: orbX,
              y: orbY,
              color: orb.color,
              age: 0,
              particles: [
                {
                  x: 0,
                  y: 0,
                  vx: Math.cos(a) * sp,
                  vy: Math.sin(a) * sp - 2,
                  life: 1,
                },
              ],
            });
          }
        }
      });
      if (hudActionTimer > 0) hudActionTimer--;
      else hudAction.textContent = "";
      getTODTransition().t = Math.min(1, getTODTransition().t + 0.008);
    }

    function renderGame() {
      const W = gW;
      const H = gH;
      if (!W || !H) return;
      const todBlend = getTODBlend();
      const gY = groundY();
      drawWorld(gctx, W, H, todBlend);
      drawZoneBands(gctx, W, H, gY);
      drawWaterAndPlatforms(gctx, W, H, todBlend);
      trails.forEach((t) => {
        const ts = Math.max(PX, Math.round(t.r / 2) * 2);
        gctx.save();
        gctx.globalAlpha = t.alpha;
        gctx.fillStyle = t.color;
        gctx.fillRect(snapPX(t.x) - ts / 2, snapPX(t.y) - ts / 4, ts, ts / 2);
        gctx.restore();
      });
      splats.forEach((s) => {
        s.particles.forEach((p) => {
          const sz = Math.max(2, Math.round(p.life * PX));
          gctx.save();
          gctx.globalAlpha = p.life * 0.85;
          gctx.fillStyle = s.color || rowsConfig[getPlatformAtX(s.x).tier].color;
          gctx.fillRect(snapPX(s.x + p.x), snapPX(s.y + p.y), sz, sz);
          gctx.restore();
        });
      });
      orbs.forEach((orb) => {
        if (orb.collected) return;
        const orbX = snapPX(orb.x * gW);
        const orbY = snapPX(groundY() * orb.yBase - Math.sin(gameTime * 0.04 + orb.phase) * 12);
        const col = hexToRgbArr(orb.color);
        gctx.fillStyle = `rgba(${col},0.25)`;
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            if (dx * dx + dy * dy <= 9 && dx * dx + dy * dy > 1) {
              gctx.fillRect(orbX + dx * PX, orbY + dy * PX, PX, PX);
            }
          }
        }
        gctx.fillStyle = orb.color;
        gctx.fillRect(orbX - PX, orbY - PX, PX * 2, PX * 2);
        gctx.fillStyle = "#ffffff";
        gctx.globalAlpha = 0.7;
        gctx.fillRect(orbX - PX / 2, orbY - PX / 2, PX, PX);
        gctx.globalAlpha = 1;
        gctx.font = "bold 6px 'Press Start 2P',monospace";
        gctx.fillStyle = "#fff";
        gctx.textAlign = "center";
        gctx.textBaseline = "bottom";
        gctx.fillText("♪", orbX, orbY - PX * 2);
      });
      const squish = miffy.justLanded ? Math.max(0, miffy.landedTimer / 12) : 0;
      gctx.save();
      if (squish > 0) {
        gctx.translate(miffy.x, miffy.y);
        gctx.scale(1 + squish * 0.2, 1 - squish * 0.15);
        gctx.translate(-miffy.x, -miffy.y);
      }
      drawMiffy(gctx, miffy.x, miffy.y, miffy.facing, miffy.walkFrame, squish, miffy.earWiggle);
      gctx.restore();
      if (todBlend.ambientLight) {
        gctx.fillStyle = todBlend.ambientLight;
        gctx.fillRect(0, 0, W, H);
      }
    }

    function resizeGame() {
      gW = gameSection.offsetWidth;
      gH = gameCanvas.offsetHeight;
      gameCanvas.width = gW * devicePixelRatio;
      gameCanvas.height = gH * devicePixelRatio;
      gctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      miffy.x = Math.max(CHAR_W / 2, Math.min(gW - CHAR_W / 2, miffy.x));
      const platform = getPlatformAtX(miffy.x);
      miffy.y = platform.yTopFrac * gH;
      miffy.vy = 0;
      miffy.onGround = true;
      miffy.tier = platform.tier;
    }

    function gameLoop(ts) {
      if (ts - lastGameTime >= 16) {
        lastGameTime = ts;
        updateGame();
        renderGame();
      }
      requestAnimationFrame(gameLoop);
    }

    function init() {
      document.addEventListener("keydown", (e) => {
        keys[e.code] = true;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
          e.preventDefault();
        }
      });
      document.addEventListener("keyup", (e) => {
        keys[e.code] = false;
      });
      document.querySelectorAll(".tod-btn").forEach((btn) => {
        btn.addEventListener("click", () => setTOD(btn.dataset.tod));
      });
      spawnOrbs();
      resizeGame();
      window.addEventListener("resize", () => {
        resizeGame();
        renderSequencer();
      });
      requestAnimationFrame(gameLoop);
    }

    return { init, resizeGame, renderGame };
  };
})();



let dataset = null;
let current = null;

let stars = [];
let plantLayer;
let bgLayer;

// Multiple plants (one per topic click)
let plants = [];

// ASCII set (dotty -> dense). Tweak if you want a different feel.
const ASCII_SET = ["·", ":", "*", "+", "x", "%", "#", "@"];

// ---------- Setup ----------
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // Persistent plant layer
  plantLayer = createGraphics(width, height);
  plantLayer.clear();

  // ASCII rendering settings for plantLayer
  plantLayer.textFont("monospace");
  plantLayer.textAlign(CENTER, CENTER);
  plantLayer.textSize(14);

  // Watercolor background layer (static)
  bgLayer = createGraphics(width, height);
  generateWatercolorBackground(bgLayer);

  initStars();

  fetch("/api/dataset")
    .then((res) => res.json())
    .then((data) => {
      dataset = data.items || [];
      setupDropdown();
      current = dataset[0] || null;

      // Start with the first topic
      if (current) addPlantForTopic(current);
    })
    .catch((e) => console.error("dataset fetch error:", e));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Recreate background for new size
  bgLayer = createGraphics(width, height);
  generateWatercolorBackground(bgLayer);

  // Keep existing plant drawing by copying old layer into a new one
  const old = plantLayer;
  plantLayer = createGraphics(width, height);
  plantLayer.clear();
  plantLayer.image(old, 0, 0);

  // Re-apply ASCII settings after recreating plantLayer
  plantLayer.textFont("monospace");
  plantLayer.textAlign(CENTER, CENTER);
  plantLayer.textSize(14);

  initStars();
}

// ---------- UI ----------
function setupDropdown() {
  const select = document.getElementById("seed");
  if (!select) return;

  select.innerHTML = "";

  dataset.forEach((item, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = item.title;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    current = dataset[Number(select.value)];
    if (current) addPlantForTopic(current); // IMPORTANT: do NOT clear old plants
  });
}

// ---------- Draw ----------
function draw() {
  // Draw watercolor background (static image)
  image(bgLayer, 0, 0);

  // Stars
  drawStars();

  if (!current) return;

  // Grow each plant a bit per frame
  for (const p of plants) {
    p.stepGrowth();
  }

  // Render plants
  image(plantLayer, 0, 0);

  drawStats();
}

// ---------- Stars ----------
function initStars() {
  stars = [];
  for (let i = 0; i < 160; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      r: random(0.8, 2.6),
      v: random(0.04, 0.28),
      tw: random(0.6, 1.4),
    });
  }
}

function drawStars() {
  push();
  noStroke();

  drawingContext.shadowBlur = 14;
  drawingContext.shadowColor = "rgba(220,220,255,0.35)";

  for (const s of stars) {
    const tw = 0.7 + 0.3 * sin(frameCount * 0.02 * s.tw + s.x * 0.01);
    fill(240, 240, 255, 120);
    circle(s.x, s.y, s.r * 2.2 * tw);

    s.y += s.v;
    if (s.y > height + 10) {
      s.y = -10;
      s.x = random(width);
    }
  }

  drawingContext.shadowBlur = 0;
  pop();
}

// ---------- Stats ----------
function drawStats() {
  const stats = document.getElementById("stats");
  if (!stats || !current) return;

  stats.innerHTML =
    `Gossip Index: ${current.gossipIndex}<br>` +
    `Pageviews (30d): ${current.pageviews30d}<br>` +
    `Lex Hits: ${current.lexHits}<br>` +
    `Links: ${current.linksCount} · Sections: ${current.sectionsCount}<br>` +
    `<span style="opacity:.7">Plants on canvas: ${plants.length}</span>`;
}

// ---------- Add new plant without clearing ----------
function addPlantForTopic(topic) {
  const seed = hash01(topic.title || "topic");
  const style = makeStyleFromSeed(seed);

  // Slightly different spawn positions per topic (still central-ish)
  const baseX = width * (0.35 + 0.3 * hash01((topic.title || "") + "_x"));
  const baseY = height * (0.80 + 0.03 * (hash01((topic.title || "") + "_y") - 0.5));

  plants.push(new PlantSystem(topic, style, baseX, baseY));
}

// ---------- Plant System ----------
class PlantSystem {
  constructor(topic, style, x, y) {
    this.topic = topic;
    this.style = style;

    this.branches = [];
    this.maxActiveBranches = 220; // reduced (less busy)
    this.maxDepth = 10;           // reduced

    // Growth speed by pageviews
    this.growthSpeed = constrain(
      map(topic.pageviews30d || 0, 0, 500000, 2, 6),
      2,
      6
    );

    // Lower split chance (fewer branches/leaves)
    this.baseSplitChance = 0.006 + (topic.lexHits || 0) * 0.002;

    // Direction bias per topic
    this.directionBias = style.directionBias;

    this.branches.push(new Branch(x, y, -PI / 2 + this.directionBias, 0, style, topic));
  }

  stepGrowth() {
    for (let i = 0; i < this.growthSpeed; i++) {
      this.growOnce();
    }
  }

  growOnce() {
    const next = [];

    for (const b of this.branches) {
      if (!b.finished) {
        b.grow(); // draws onto plantLayer
        next.push(b);

        const splitChance = this.baseSplitChance;

        if (random() < splitChance) next.push(b.split(false, this.directionBias));
        if (random() < splitChance * 0.25) next.push(b.split(true, this.directionBias));
      }
    }

    this.branches = next.slice(0, this.maxActiveBranches);
  }
}

// ---------- Branch (ASCII stamping) ----------
class Branch {
  constructor(x, y, angle, depth, style, topic) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;

    this.angle = angle;
    this.depth = depth;

    this.style = style;
    this.topic = topic;

    this.len = 0;
    this.maxLen = random(40, 300) * (1 - depth * 0.07);
    this.finished = false;

    this.noiseOff = random(1000);
  }

  grow() {
    if (this.finished) return;

    if (
      this.len > this.maxLen ||
      this.depth > this.style.maxDepth ||
      this.y < height * 0.10
    ) {
      this.finished = true;

      // Occasionally place an ASCII "flower" cluster at branch end
      if (random() < this.style.flowerChance) {
        drawFlowerBlob(plantLayer, this.x, this.y, this.style, this.topic);
      }
      return;
    }

    const step = 1.8 + (this.topic.lexHits || 0) * 0.15;
    const jitter = map(this.topic.gossipIndex || 0, 0, 2500, 0.02, 0.10);

    this.px = this.x;
    this.py = this.y;

    this.x += cos(this.angle) * step;
    this.y += sin(this.angle) * step;
    this.len += step;

    // Organic flow
    const n = noise(this.x * 0.002, this.y * 0.002, frameCount * 0.008 + this.noiseOff);
    this.angle += (n - 0.5) * jitter;

    // Gentle pull toward topic bias
    this.angle += this.style.pull * this.style.directionBias * 0.02;

    // ASCII "stroke" along the segment
    drawLeafStroke(plantLayer, this.px, this.py, this.x, this.y, this.depth, this.style, this.topic);

    // Occasional ASCII "leaf/petal" cluster
    if (random() < this.style.leafChance) {
      drawLeafPetal(plantLayer, this.x, this.y, this.angle, this.depth, this.style, this.topic);
    }
  }

  split(sharper, directionBias) {
    const spread = sharper ? this.style.spreadSharp : this.style.spreadSoft;
    const bias = directionBias * (0.30 + random() * 0.25);

    return new Branch(
      this.x,
      this.y,
      this.angle + random(-spread, spread) + bias,
      this.depth + 1,
      this.style,
      this.topic
    );
  }
}

// ---------- ASCII drawing helpers ----------
function pickAsciiChar(depth, style) {
  // Deeper -> denser
  const t = constrain(map(depth, 0, style.maxDepth, 0, 1), 0, 1);
  const idx = floor(t * (ASCII_SET.length - 1));
  return ASCII_SET[idx];
}

function stampAscii(g, x, y, depth, style, sizePx) {
  const ch = pickAsciiChar(depth, style);

  g.push();
  g.textSize(sizePx);

  // White glow outline first
  g.drawingContext.shadowBlur = style.glowBlur + 6;
  g.drawingContext.shadowColor = `rgba(255,255,255,${style.outlineAlpha / 25})`;
  g.fill(255, 255, 255, style.outlineAlpha);
  g.text(ch, x, y);

  // Gray core on top
  g.drawingContext.shadowBlur = 0;
  g.fill(style.grayFill, style.grayFill, style.grayFill, style.fillAlpha);
  g.text(ch, x, y);

  g.pop();
}

function drawLeafStroke(g, x1, y1, x2, y2, depth, style, topic) {
  const t = constrain(map(depth, 0, style.maxDepth, 1.0, 0.55), 0.55, 1.0);
  const sizePx = (36 * t) + random(-2, 2);

  const stamps = 3;
  for (let i = 0; i <= stamps; i++) {
    const u = i / stamps;
    const xx = lerp(x1, x2, u);
    const yy = lerp(y1, y2, u);

    const jx = (noise(xx * 0.02, yy * 0.02, frameCount * 0.01) - 0.5) * 2.0;
    const jy = (noise(xx * 0.02 + 20, yy * 0.02 + 20, frameCount * 0.01) - 0.5) * 2.0;

    stampAscii(g, xx + jx, yy + jy, depth, style, sizePx);
  }
}

function drawLeafPetal(g, x, y, angle, depth, style, topic) {
  const t = constrain(map(depth, 0, style.maxDepth, 1.0, 0.6), 0.6, 1.0);
  const sizePx = (14 * t) + random(-2, 2);

  const count = 3 + floor(random(3));
  for (let i = 0; i < count; i++) {
    const a = angle + random(-0.9, 0.9);
    const r = 6 + random(10) * style.petalScale;
    const xx = x + cos(a) * r;
    const yy = y + sin(a) * r;
    stampAscii(g, xx, yy, depth, style, sizePx);
  }
}

function drawFlowerBlob(g, x, y, style, topic) {
  const base = 18 + style.flowerScale * 14;
  const petals = 7 + floor(hash01((topic.title || "") + "_pet") * 5);

  // Core cluster
  for (let i = 0; i < 10; i++) {
    const a = random(TWO_PI);
    const r = random(base * 0.35);
    stampAscii(g, x + cos(a) * r, y + sin(a) * r, 0, style, 16);
  }

  // Petal ring
  for (let i = 0; i < petals; i++) {
    const a = (TWO_PI / petals) * i + random(-0.15, 0.15);
    const r = base * (0.85 + random() * 0.35);
    stampAscii(g, x + cos(a) * r, y + sin(a) * r, style.maxDepth, style, 18);
  }
}

// ---------- Style per topic (all grayscale, slightly different) ----------
function makeStyleFromSeed(seed) {
  const grayFill = floor(120 + seed * 90);  // 120..210
  const grayCore = floor(80 + seed * 70);   // 80..150
  const directionBias = (seed - 0.5) * 1.1; // -0.55..0.55

  return {
    grayFill,
    grayCore,

    outlineAlpha: 80 + floor(seed * 55), // 80..135
    glowBlur: 14 + floor(seed * 10),     // 14..24

    fillAlpha: 70 + floor(seed * 40),    // a bit stronger for ASCII readability
    petalAlpha: 55 + floor(seed * 45),

    // Fewer leaves so the ASCII doesn't become a solid block
    leafChance: 0.010 + seed * 0.008,
    flowerChance: 0.10 + seed * 0.10,

    petalScale: 0.8 + seed * 0.8,
    flowerScale: 0.6 + seed * 0.8,

    spreadSoft: 0.55,
    spreadSharp: 0.75,

    pull: 1.0,
    maxDepth: 10,

    directionBias
  };
}

// ---------- Deterministic hash to 0..1 ----------
function hash01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000000) / 1000000;
}

/* =========================
   Watercolor background
   (Your palette + diffusion + grain)
   ========================= */

function generateWatercolorBackground(g) {
  const palette = [
    "#b7a7aa",
    "#e4d4df",
    "#dfddea",
    "#c9d3e0",
    "#d4fdeb"
  ];

  g.clear();
  g.noStroke();

  // Base
  g.background(10, 10, 16);

  // Smaller blobs, more of them
  for (let layer = 0; layer < 7; layer++) {
    const blobs = 34;
    for (let i = 0; i < blobs; i++) {
      const hex = palette[Math.floor(Math.random() * palette.length)];
      const boosted = boostSaturationHex(hex, 1.38, 6);
      const c = color(boosted[0], boosted[1], boosted[2]);

      // Background intensity control
      c.setAlpha(28 + layer * 9);

      const cx = Math.random() * g.width;
      const cy = Math.random() * g.height;

      const w = (0.18 + Math.random() * 0.42) * g.width;
      const h = (0.14 + Math.random() * 0.36) * g.height;

      drawSoftBlob(g, cx, cy, w, h, c);
    }

    // Diffusion control
    g.filter(BLUR, 3);
  }

  // Subtle wash to unify
  g.push();
  g.noStroke();
  for (let k = 0; k < 8; k++) {
    const hex = palette[k % palette.length];
    const boosted = boostSaturationHex(hex, 1.25, 4);
    g.fill(boosted[0], boosted[1], boosted[2], 10);
    g.translate(g.width * 0.012, g.height * 0.02);
    g.rotate(-0.07);
    g.rect(-g.width * 0.2, (k / 8) * g.height, g.width * 1.6, g.height * 0.14);
  }
  g.pop();
  g.filter(BLUR, 1);

  // Grain
  addPaperGrain(g, 52000);
  addPaperFibers(g, 1200);
}

function drawSoftBlob(g, cx, cy, w, h, col) {
  g.push();
  g.translate(cx, cy);

  const steps = 64;
  const noiseScale = 0.9 + Math.random() * 1.5;
  const edgeJitter = 0.28 + Math.random() * 0.26;

  // Main body
  g.fill(col);
  g.beginShape();
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const nx = Math.cos(t) * 0.5 + 0.5;
    const ny = Math.sin(t) * 0.5 + 0.5;

    const n = noise(nx * noiseScale * 3, ny * noiseScale * 3, (cx + cy) * 0.0005);
    const rW = (w * 0.5) * (1 - edgeJitter + n * edgeJitter * 2);
    const rH = (h * 0.5) * (1 - edgeJitter + n * edgeJitter * 2);

    g.vertex(Math.cos(t) * rW, Math.sin(t) * rH);
  }
  g.endShape(CLOSE);

  // Outer bleed
  const bleed = color(red(col), green(col), blue(col), alpha(col) * 0.55);
  g.fill(bleed);
  g.beginShape();
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const n = noise(Math.cos(t) * 2 + 10, Math.sin(t) * 2 + 10, (cx + cy) * 0.0007);
    g.vertex(
      Math.cos(t) * (w * 0.58) * (0.9 + n * 0.28),
      Math.sin(t) * (h * 0.58) * (0.9 + n * 0.28)
    );
  }
  g.endShape(CLOSE);

  g.pop();
}

function addPaperGrain(g, count) {
  g.push();
  g.noStroke();
  for (let i = 0; i < count; i++) {
    const x = Math.random() * g.width;
    const y = Math.random() * g.height;

    const isDark = Math.random() < 0.35;
    const a = isDark ? (4 + Math.random() * 14) : (6 + Math.random() * 18);

    if (isDark) g.fill(0, a);
    else g.fill(255, a);

    const s = Math.random() < 0.08 ? 2 : 1;
    g.rect(x, y, s, s);
  }
  g.pop();
}

function addPaperFibers(g, strokes) {
  g.push();
  g.noFill();
  g.stroke(255, 8);
  g.strokeWeight(1);

  for (let i = 0; i < strokes; i++) {
    const x = Math.random() * g.width;
    const y = Math.random() * g.height;
    const len = 12 + Math.random() * 38;

    const ang = -0.15 + (noise(x * 0.002, y * 0.002) - 0.5) * 0.6;
    g.line(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
  }

  g.pop();
}

function boostSaturationHex(hex, factor, add) {
  const rgb = hexToRgb(hex);
  const r = rgb[0], gg = rgb[1], b = rgb[2];
  const mean = (r + gg + b) / 3;
  const rr = clamp(mean + (r - mean) * factor + add, 0, 255);
  const g2 = clamp(mean + (gg - mean) * factor + add, 0, 255);
  const bb = clamp(mean + (b - mean) * factor + add, 0, 255);
  return [rr, g2, bb];
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

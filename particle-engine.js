// ── Particle Engine ─────────────────────────────────────────────────
// Shared core: shape generators, 3D projection, renderer.
// Pure logic — no DOM dependencies except offscreen canvas for SVG hit-testing.

// ── Shape Generators ───────────────────────────────────────────────
// Each returns an array of {x, y, z} points in normalized [-1, 1] space.
// Generators that need extra config receive it as a second `config` parameter.

function generateSphere(n) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push({
      x: Math.cos(theta) * radiusAtY,
      y,
      z: Math.sin(theta) * radiusAtY,
    });
  }
  return points;
}

function generateCube(n) {
  const points = [];
  const perFace = Math.ceil(n / 6);
  const gridSize = Math.ceil(Math.sqrt(perFace));
  const faces = [
    { axis: 'x', value:  1 },
    { axis: 'x', value: -1 },
    { axis: 'y', value:  1 },
    { axis: 'y', value: -1 },
    { axis: 'z', value:  1 },
    { axis: 'z', value: -1 },
  ];
  for (const face of faces) {
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const u = (i / (gridSize - 1)) * 2 - 1;
        const v = (j / (gridSize - 1)) * 2 - 1;
        const p = { x: 0, y: 0, z: 0 };
        if (face.axis === 'x') { p.x = face.value; p.y = u; p.z = v; }
        if (face.axis === 'y') { p.y = face.value; p.x = u; p.z = v; }
        if (face.axis === 'z') { p.z = face.value; p.x = u; p.y = v; }
        points.push(p);
      }
    }
  }
  return points.slice(0, n);
}

function generateGalaxy(n) {
  const points = [];
  const arms = 3;
  const turns = 2.5;
  const armSpread = 0.3;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const armIndex = i % arms;
    const armOffset = (armIndex / arms) * Math.PI * 2;
    const radius = t;
    const angle = armOffset + t * turns * Math.PI * 2;
    const angleNoise = (Math.random() - 0.5) * armSpread * (1 - t * 0.5);
    const radiusNoise = (Math.random() - 0.5) * 0.1;
    const r = radius + radiusNoise;
    const theta = angle + angleNoise;
    points.push({
      x: r * Math.cos(theta),
      y: (Math.random() - 0.5) * 0.08 * (1 + (1 - t) * 2),
      z: r * Math.sin(theta),
    });
  }
  return points;
}

function generateSpiralGalaxy(n, config) {
  const points = [];
  const arms = (config && config.spiralArms) || 4;
  const bulgeCount = Math.floor(n * 0.15);
  const armCount = Math.floor(n * 0.65);
  const diskCount = n - bulgeCount - armCount;

  for (let i = 0; i < bulgeCount; i++) {
    const u = Math.random(), v = Math.random(), w = Math.random();
    const r = 0.12 * Math.cbrt(u);
    const theta = v * Math.PI * 2;
    const phi = Math.acos(2 * w - 1);
    points.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * 0.4 * Math.cos(phi),
      z: r * Math.sin(phi) * Math.sin(theta),
    });
  }

  for (let i = 0; i < armCount; i++) {
    const armIndex = i % arms;
    const armOffset = (armIndex / arms) * Math.PI * 2;
    const t = Math.random();
    const logR = 0.08 + t * 0.92;
    const windAngle = armOffset + Math.log(1 + logR * 10) * 1.8;
    const spread = 0.06 + t * 0.15;
    const angleJitter = (Math.random() - 0.5) * spread;
    const radialJitter = (Math.random() - 0.5) * 0.06;
    const r = logR + radialJitter;
    const angle = windAngle + angleJitter;
    const ySpread = 0.03 * (1 - t * 0.7);
    points.push({
      x: r * Math.cos(angle),
      y: (Math.random() - 0.5) * ySpread,
      z: r * Math.sin(angle),
    });
  }

  for (let i = 0; i < diskCount; i++) {
    const r = Math.sqrt(Math.random()) * 1.0;
    const angle = Math.random() * Math.PI * 2;
    const ySpread = 0.04 * (1 - r * 0.5);
    points.push({
      x: r * Math.cos(angle),
      y: (Math.random() - 0.5) * ySpread,
      z: r * Math.sin(angle),
    });
  }

  return points;
}

function generateTorus(n) {
  const points = [];
  const R = 0.7, r = 0.3;
  const cols = Math.ceil(Math.sqrt(n * R / r));
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < cols; i++) {
    const theta = (i / cols) * Math.PI * 2;
    for (let j = 0; j < rows; j++) {
      const phi = (j / rows) * Math.PI * 2;
      points.push({
        x: (R + r * Math.cos(theta)) * Math.cos(phi),
        z: (R + r * Math.cos(theta)) * Math.sin(phi),
        y: r * Math.sin(theta),
      });
      if (points.length >= n) return points;
    }
  }
  return points;
}

function generateCylinder(n) {
  const points = [];
  const lateral = Math.ceil(n * 0.7);
  const perCap = Math.ceil((n - lateral) / 2);
  const cols = Math.ceil(Math.sqrt(lateral * 2));
  const rows = Math.ceil(lateral / cols);
  for (let i = 0; i < cols && points.length < lateral; i++) {
    const theta = (i / cols) * Math.PI * 2;
    for (let j = 0; j < rows && points.length < lateral; j++) {
      const y = (j / (rows - 1)) * 2 - 1;
      points.push({ x: Math.cos(theta), y, z: Math.sin(theta) });
    }
  }
  for (let cap = -1; cap <= 1; cap += 2) {
    for (let i = 0; i < perCap; i++) {
      const r = Math.sqrt(i / perCap);
      const theta = (i / perCap) * Math.PI * 2 * 10;
      points.push({ x: r * Math.cos(theta), y: cap, z: r * Math.sin(theta) });
    }
  }
  return points.slice(0, n);
}

function generateHelix(n) {
  const points = [];
  const perStrand = Math.ceil(n / 2);
  const turns = 4;
  for (let s = 0; s < 2; s++) {
    const offset = s * Math.PI;
    for (let i = 0; i < perStrand; i++) {
      const t = i / perStrand;
      const theta = t * turns * Math.PI * 2 + offset;
      points.push({
        x: 0.4 * Math.cos(theta),
        y: t * 2 - 1,
        z: 0.4 * Math.sin(theta),
      });
    }
  }
  return points.slice(0, n);
}

// ── SVG Parsing ────────────────────────────────────────────────────

export function parseSVGFile(svgText) {
  const container = document.createElement('div');
  container.innerHTML = svgText;
  const svgEl = container.querySelector('svg');
  if (!svgEl) return null;

  const tempSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  tempSVG.style.position = 'absolute';
  tempSVG.style.left = '-9999px';
  tempSVG.style.width = '0';
  tempSVG.style.height = '0';
  document.body.appendChild(tempSVG);

  const geoTags = ['path', 'polygon', 'polyline', 'rect', 'circle', 'ellipse', 'line'];
  const elements = [];
  for (const tag of geoTags) {
    elements.push(...svgEl.querySelectorAll(tag));
  }

  if (elements.length === 0) {
    document.body.removeChild(tempSVG);
    return null;
  }

  const rawPoints = [];
  const pathDatas = [];

  for (const el of elements) {
    const clone = el.cloneNode(true);
    tempSVG.appendChild(clone);

    if (typeof clone.getTotalLength === 'function') {
      const len = clone.getTotalLength();
      const sampleCount = Math.max(50, Math.ceil(len / 2));
      for (let i = 0; i < sampleCount; i++) {
        const pt = clone.getPointAtLength((i / sampleCount) * len);
        rawPoints.push({ x: pt.x, y: pt.y });
      }
    }

    if (el.tagName === 'path' && el.getAttribute('d')) {
      pathDatas.push(el.getAttribute('d'));
    } else if (el.tagName === 'rect') {
      const rx = parseFloat(el.getAttribute('x') || 0);
      const ry = parseFloat(el.getAttribute('y') || 0);
      const rw = parseFloat(el.getAttribute('width') || 0);
      const rh = parseFloat(el.getAttribute('height') || 0);
      pathDatas.push(`M${rx},${ry} L${rx+rw},${ry} L${rx+rw},${ry+rh} L${rx},${ry+rh} Z`);
    } else if (el.tagName === 'circle') {
      const ccx = parseFloat(el.getAttribute('cx') || 0);
      const ccy = parseFloat(el.getAttribute('cy') || 0);
      const cr = parseFloat(el.getAttribute('r') || 0);
      pathDatas.push(`M${ccx-cr},${ccy} A${cr},${cr} 0 1,0 ${ccx+cr},${ccy} A${cr},${cr} 0 1,0 ${ccx-cr},${ccy} Z`);
    } else if (el.tagName === 'ellipse') {
      const ecx = parseFloat(el.getAttribute('cx') || 0);
      const ecy = parseFloat(el.getAttribute('cy') || 0);
      const erx = parseFloat(el.getAttribute('rx') || 0);
      const ery = parseFloat(el.getAttribute('ry') || 0);
      pathDatas.push(`M${ecx-erx},${ecy} A${erx},${ery} 0 1,0 ${ecx+erx},${ecy} A${erx},${ery} 0 1,0 ${ecx-erx},${ecy} Z`);
    } else if (el.tagName === 'polygon') {
      const pts = el.getAttribute('points');
      if (pts) pathDatas.push(`M${pts} Z`);
    }

    tempSVG.removeChild(clone);
  }

  document.body.removeChild(tempSVG);

  if (rawPoints.length === 0) return null;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of rawPoints) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const maxRange = Math.max(rangeX, rangeY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const outline = rawPoints.map(p => ({
    x: ((p.x - centerX) / maxRange) * 2,
    y: ((p.y - centerY) / maxRange) * 2,
  }));

  let svgPath2D = null;
  let svgNorm = null;
  if (pathDatas.length > 0) {
    svgPath2D = new Path2D(pathDatas.join(' '));
    svgNorm = { centerX, centerY, maxRange };
  }

  return { outline, svgPath2D, svgNorm };
}

// ── SVG Extrude Generator ──────────────────────────────────────────

function generateSVGExtrude(n, config) {
  const outline = (config && config.svgOutline) || [];
  if (outline.length === 0) return [{ x: 0, y: 0, z: 0 }];

  const depth = (config && config.extrudeDepth) || 0.5;
  const useGrid = (config && config.snapToGrid) || false;
  const svgPath2D = (config && config.svgPath2D) || null;
  const svgNorm = (config && config._svgNorm) || null;
  const points = [];

  const hasPath = svgPath2D && svgNorm;
  let offCtx = null;
  if (hasPath) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 200;
    offCanvas.height = 200;
    offCtx = offCanvas.getContext('2d');
  }

  function isInsideSVG(nx, ny) {
    if (!hasPath || !offCtx) return true;
    const svgX = (nx / 2) * svgNorm.maxRange + svgNorm.centerX;
    const svgY = (ny / 2) * svgNorm.maxRange + svgNorm.centerY;
    return offCtx.isPointInPath(svgPath2D, svgX, svgY);
  }

  let bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;
  for (const p of outline) {
    if (p.x < bMinX) bMinX = p.x;
    if (p.x > bMaxX) bMaxX = p.x;
    if (p.y < bMinY) bMinY = p.y;
    if (p.y > bMaxY) bMaxY = p.y;
  }

  if (useGrid) {
    const bW = bMaxX - bMinX;
    const bH = bMaxY - bMinY;
    const gridRes = Math.max(4, Math.ceil(Math.sqrt(n / (2 + depth * 4))));
    const stepX = bW / gridRes;
    const stepY = bH / gridRes;
    const zLayers = Math.max(2, Math.ceil(gridRes * (depth / Math.max(bW, bH))));
    const stepZ = depth / (zLayers - 1);

    for (let ix = 0; ix <= gridRes; ix++) {
      for (let iy = 0; iy <= gridRes; iy++) {
        const px = bMinX + ix * stepX;
        const py = bMinY + iy * stepY;
        if (isInsideSVG(px, py)) {
          points.push({ x: px, y: py, z: -depth / 2 });
          points.push({ x: px, y: py, z: depth / 2 });
        }
      }
    }

    const outlineStep = Math.max(1, Math.floor(outline.length / (gridRes * 4)));
    for (let i = 0; i < outline.length; i += outlineStep) {
      const op = outline[i];
      const sx = Math.round((op.x - bMinX) / stepX) * stepX + bMinX;
      const sy = Math.round((op.y - bMinY) / stepY) * stepY + bMinY;
      for (let zl = 0; zl < zLayers; zl++) {
        const zPos = -depth / 2 + zl * stepZ;
        points.push({ x: sx, y: sy, z: zPos });
      }
    }
  } else {
    const faceCount = Math.floor(n * 0.3);
    const sideCount = Math.floor(n * 0.4);
    const layers = Math.max(3, Math.ceil(Math.sqrt(sideCount / outline.length) * 5));
    const pointsPerLayer = Math.ceil(sideCount / layers);

    for (let layer = 0; layer < layers; layer++) {
      const zPos = -depth / 2 + (layer / (layers - 1)) * depth;
      for (let i = 0; i < pointsPerLayer; i++) {
        const t = i / pointsPerLayer;
        const idx = Math.floor(t * outline.length) % outline.length;
        const op = outline[idx];
        points.push({ x: op.x, y: op.y, z: zPos });
      }
    }

    const maxAttempts = faceCount * 20;
    let filled = 0;
    let attempts = 0;
    while (filled < faceCount && attempts < maxAttempts) {
      const rx = bMinX + Math.random() * (bMaxX - bMinX);
      const ry = bMinY + Math.random() * (bMaxY - bMinY);
      attempts++;
      if (isInsideSVG(rx, ry)) {
        points.push({ x: rx, y: ry, z: -depth / 2 });
        filled++;
      }
    }

    filled = 0;
    attempts = 0;
    while (filled < faceCount && attempts < maxAttempts) {
      const rx = bMinX + Math.random() * (bMaxX - bMinX);
      const ry = bMinY + Math.random() * (bMaxY - bMinY);
      attempts++;
      if (isInsideSVG(rx, ry)) {
        points.push({ x: rx, y: ry, z: depth / 2 });
        filled++;
      }
    }
  }

  return points;
}

// ── Generators Map ─────────────────────────────────────────────────

export const generators = {
  sphere: generateSphere,
  cube: generateCube,
  galaxy: generateGalaxy,
  spiralGalaxy: generateSpiralGalaxy,
  torus: generateTorus,
  cylinder: generateCylinder,
  helix: generateHelix,
  svgExtrude: generateSVGExtrude,
};

// ── Helpers ────────────────────────────────────────────────────────

export function applyRandomness(points, amount) {
  const scale = amount * 0.2;
  return points.map(p => ({
    x: p.x + (Math.random() - 0.5) * scale,
    y: p.y + (Math.random() - 0.5) * scale,
    z: p.z + (Math.random() - 0.5) * scale,
  }));
}

export function hexToRGB(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

// ── Connections ───────────────────────────────────────────────────

function generateHubPosition(points, placement, index) {
  if (placement === 'inside' || (placement === 'mixed' && index % 2 === 0)) {
    // Pick a random existing particle and offset toward center
    const baseIdx = Math.floor(Math.random() * points.length);
    const base = points[baseIdx];
    return {
      x: base.x * 0.5 + (Math.random() - 0.5) * 0.3,
      y: base.y * 0.5 + (Math.random() - 0.5) * 0.3,
      z: base.z * 0.5 + (Math.random() - 0.5) * 0.3,
    };
  }
  // 'outside' or mixed odd index
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = 1.5 + Math.random();
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  };
}

function selectParticlesForHub(hub, points, count, distribution, spread, focus) {
  // Compute distances from hub to every particle
  const distances = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const dx = p.x - hub.x, dy = p.y - hub.y, dz = p.z - hub.z;
    distances.push({ idx: i, dist: Math.sqrt(dx * dx + dy * dy + dz * dz) });
  }
  distances.sort((a, b) => a.dist - b.dist);

  // Determine max reach based on spread (0→10% of range, 1→100% of range)
  const maxDist = distances.length > 0 ? distances[distances.length - 1].dist : 1;
  const reach = maxDist * (0.1 + spread * 0.9);

  // Filter to particles within reach
  const candidates = distances.filter(d => d.dist <= reach);
  if (candidates.length === 0) {
    // Fallback: take nearest N if nothing in reach
    return distances.slice(0, count).map(d => d.idx);
  }

  const n = Math.min(count, candidates.length);

  if (distribution === 'nearest') {
    // Simple: take the N closest within reach
    return candidates.slice(0, n).map(d => d.idx);
  }

  if (distribution === 'random') {
    // Shuffle candidates, take first N
    const shuffled = candidates.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, n).map(d => d.idx);
  }

  if (distribution === 'weighted') {
    // Probability weighted by inverse distance, focus controls falloff
    // focus 0 → flat probability, focus 1 → steep inverse-distance falloff
    const exponent = 0.5 + focus * 4.5; // range 0.5–5.0
    const selected = new Set();
    const weights = candidates.map(d => {
      const normDist = d.dist / (reach || 1);
      return Math.pow(1 - normDist + 0.01, exponent);
    });
    const totalWeight = weights.reduce((s, w) => s + w, 0);

    let attempts = 0;
    while (selected.size < n && attempts < n * 20) {
      let r = Math.random() * totalWeight;
      for (let i = 0; i < candidates.length; i++) {
        r -= weights[i];
        if (r <= 0) {
          selected.add(candidates[i].idx);
          break;
        }
      }
      attempts++;
    }
    // If we didn't get enough (unlikely), fill with nearest
    if (selected.size < n) {
      for (let i = 0; i < candidates.length && selected.size < n; i++) {
        selected.add(candidates[i].idx);
      }
    }
    return Array.from(selected);
  }

  if (distribution === 'stratified') {
    // Divide reach into equal bands, pick evenly from each band
    const bandCount = Math.min(n, 5);
    const perBand = Math.ceil(n / bandCount);
    const bandWidth = reach / bandCount;
    const selected = [];

    for (let b = 0; b < bandCount; b++) {
      const lo = b * bandWidth;
      const hi = (b + 1) * bandWidth;
      const inBand = candidates.filter(d => d.dist >= lo && d.dist < hi);
      // Shuffle and take perBand from this band
      for (let i = inBand.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [inBand[i], inBand[j]] = [inBand[j], inBand[i]];
      }
      const take = Math.min(perBand, inBand.length);
      for (let i = 0; i < take; i++) {
        selected.push(inBand[i].idx);
      }
    }

    // Apply focus: trim or pad. High focus → favor inner bands (already first)
    if (selected.length > n) {
      return selected.slice(0, n);
    }
    // If not enough, supplement from nearest unused
    if (selected.length < n) {
      const set = new Set(selected);
      for (let i = 0; i < candidates.length && selected.length < n; i++) {
        if (!set.has(candidates[i].idx)) {
          selected.push(candidates[i].idx);
          set.add(candidates[i].idx);
        }
      }
    }
    return selected.slice(0, n);
  }

  // Fallback: nearest
  return candidates.slice(0, n).map(d => d.idx);
}

export function generateConnections(points, config) {
  if (!config.connectionsEnabled || !points.length) {
    return { hubs: [], connections: [] };
  }

  const hubCount = config.hubCount || 3;
  const connectionsPerHub = config.connectionsPerHub || 15;
  const placement = config.hubPlacement || 'mixed';
  const distribution = config.connectionDistribution || 'nearest';
  const spread = config.connectionSpread != null ? config.connectionSpread : 0.5;
  const focus = config.connectionFocus != null ? config.connectionFocus : 0.5;

  // Generate hub positions
  const hubs = [];
  for (let i = 0; i < hubCount; i++) {
    hubs.push(generateHubPosition(points, placement, i));
  }

  // Select particles for each hub based on distribution strategy
  const connections = [];
  for (let h = 0; h < hubs.length; h++) {
    const selected = selectParticlesForHub(
      hubs[h], points, connectionsPerHub, distribution, spread, focus
    );
    for (const idx of selected) {
      connections.push({ particleIdx: idx, hubIdx: h });
    }
  }

  return { hubs, connections };
}

// ── High-level API ─────────────────────────────────────────────────

export function generatePoints(config) {
  const gen = generators[config.shapeType];
  if (!gen) return [];
  let points = gen(config.density, config);
  if (config.randomness > 0) {
    points = applyRandomness(points, config.randomness);
  }
  return points;
}

// Map focal length (mm) to perspective distance for more dramatic visible range
export function focalLengthToPerspD(focalMm) {
  const min = 12;   // 24mm -> strong wide-angle distortion
  const max = 500;  // 200mm -> flat telephoto
  const t = (Math.max(24, Math.min(200, focalMm)) - 24) / 176;
  return min + t * (max - min);
}

export function projectPoints(points, rotX, rotY, rotZ, perspD, cx, cy, spacing, worldScale) {
  const cosA = Math.cos(rotX), sinA = Math.sin(rotX);
  const cosB = Math.cos(rotY), sinB = Math.sin(rotY);
  const cosC = Math.cos(rotZ), sinC = Math.sin(rotZ);
  const result = new Array(points.length);

  for (let i = 0; i < points.length; i++) {
    let x = points[i].x * spacing;
    let y = points[i].y * spacing;
    let z = points[i].z * spacing;

    let x1 = x * cosB + z * sinB;
    let z1 = -x * sinB + z * cosB;
    let y1 = y * cosA - z1 * sinA;
    let z2 = y * sinA + z1 * cosA;
    let x2 = x1 * cosC - y1 * sinC;
    let y2 = x1 * sinC + y1 * cosC;

    const scale = Number.isFinite(perspD) ? perspD / (perspD + z2) : 1;
    result[i] = {
      sx: cx + x2 * scale * worldScale,
      sy: cy + y2 * scale * worldScale,
      scale,
      depth: z2,
      origIdx: i,
    };
  }
  return result;
}

export function renderFrame(ctx, w, h, points, config) {
  ctx.fillStyle = config.bgColor || '#0a0a0a';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const zoom = config.zoom || 1.0;
  const worldScale = Math.min(w, h) * 0.35 * zoom;

  const rotX = config.rotX || 0;
  const rotY = config.rotY || 0;
  const rotZ = config.rotZ || 0;
  const useOrthographic = config.lensType === 'orthographic';
  const perspD = useOrthographic ? Infinity : focalLengthToPerspD(config.focalLength ?? 50);
  const spacing = config.spacing || 1.0;

  const projected = projectPoints(
    points, rotX, rotY, rotZ, perspD, cx, cy, spacing, worldScale
  );

  const [cr, cg, cb] = hexToRGB(config.color || '#ffffff');
  const squareSize = config.squareSize || 3;
  const depthSizing = config.depthSizing !== false;
  const depthOpacity = config.depthOpacity !== false;

  // ── Build connected-particle set for highlight mode
  const connData = config.connectionData;
  const highlightConnected = config.highlightConnected === true;
  let connectedSet = null;
  if (highlightConnected && connData && connData.connections.length > 0) {
    connectedSet = new Set();
    for (let i = 0; i < connData.connections.length; i++) {
      connectedSet.add(connData.connections[i].particleIdx);
    }
  }

  // Color for unconnected particles when highlighting (user-configurable)
  const [ncr, ncg, ncb] = hexToRGB(config.nonConnectedColor || '#404040');

  // ── Draw connections (before sort, so indices are intact and lines are behind squares)
  if (connData && connData.hubs.length > 0 && connData.connections.length > 0) {
    const projectedHubs = projectPoints(
      connData.hubs, rotX, rotY, rotZ, perspD, cx, cy, spacing, worldScale
    );

    const lineThickness = config.connectionThickness || 1;
    const baseOpacity = config.connectionOpacity != null ? config.connectionOpacity : 0.3;
    const useDepthOpacity = config.connectionDepthOpacity !== false;

    ctx.lineCap = 'round';

    for (let i = 0; i < connData.connections.length; i++) {
      const conn = connData.connections[i];
      const pFrom = projected[conn.particleIdx];
      const pTo = projectedHubs[conn.hubIdx];
      if (!pFrom || !pTo || pFrom.scale <= 0 || pTo.scale <= 0) continue;

      const avgScale = (pFrom.scale + pTo.scale) / 2;
      const alpha = useDepthOpacity
        ? Math.max(0.02, Math.min(1.0, baseOpacity * (0.3 + avgScale * 0.7)))
        : baseOpacity;
      const dynThickness = depthSizing ? lineThickness * avgScale : lineThickness;

      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
      ctx.lineWidth = dynThickness;
      ctx.beginPath();
      ctx.moveTo(pFrom.sx, pFrom.sy);
      ctx.lineTo(pTo.sx, pTo.sy);
      ctx.stroke();
    }

    // Draw hub squares
    if (config.hubVisible !== false) {
      const hubSize = config.hubSize || 6;
      for (let i = 0; i < projectedHubs.length; i++) {
        const pH = projectedHubs[i];
        if (pH.scale <= 0) continue;
        const size = depthSizing ? hubSize * pH.scale : hubSize;
        const alpha = depthOpacity
          ? Math.max(0.1, Math.min(1.0, 0.3 + pH.scale * 0.7))
          : 0.85;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.fillRect(pH.sx - size / 2, pH.sy - size / 2, size, size);
      }
    }
  }

  // ── Sort by depth and draw particle squares
  projected.sort((a, b) => b.depth - a.depth);

  for (let i = 0; i < projected.length; i++) {
    const p = projected[i];
    if (p.scale <= 0) continue;

    const size = depthSizing ? squareSize * p.scale : squareSize;

    const alpha = depthOpacity
      ? Math.max(0.05, Math.min(1.0, 0.3 + p.scale * 0.7))
      : 0.85;

    // Use non-connected color when highlight mode is on
    if (connectedSet && !connectedSet.has(p.origIdx)) {
      const opacityMult = config.nonConnectedOpacity != null ? config.nonConnectedOpacity : 0.4;
      const dimAlpha = alpha * opacityMult;
      ctx.fillStyle = `rgba(${ncr},${ncg},${ncb},${dimAlpha})`;
    } else {
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
    }
    ctx.fillRect(p.sx - size / 2, p.sy - size / 2, size, size);
  }
}

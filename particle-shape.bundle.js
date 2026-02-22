// ── <particle-shape> Standalone Bundle ──────────────────────────────
// Self-contained web component — no external dependencies.
//
// Usage:
//   <script src="particle-shape.bundle.js"></script>
//   <particle-shape shape="sphere" density="2000" auto-rotate></particle-shape>
//
// Attributes:
//   shape       — sphere | cube | galaxy | spiralGalaxy | torus | cylinder | helix
//   density     — number of particles (default: 1500)
//   spacing     — spread multiplier (default: 1.0)
//   randomness  — jitter amount 0–1 (default: 0)
//   size        — square pixel size (default: 3)
//   color       — hex colour (default: #ffffff)
//   bg          — background hex colour (default: #0a0a0a)
//   perspective — camera distance (default: 600)
//   speed       — auto-rotation speed (default: 0.003)
//   depth-opacity — enable/disable (default: true)
//   depth-sizing  — enable/disable (default: true)
//   auto-rotate   — enable/disable (default: true)
//   spiral-arms   — number of spiral arms (default: 4)
//   rotate-x      — initial X rotation in radians
//   rotate-y      — initial Y rotation in radians

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // PARTICLE ENGINE (inlined)
  // ═══════════════════════════════════════════════════════════════════

  // ── Shape Generators ─────────────────────────────────────────────

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

  const generators = {
    sphere: generateSphere,
    cube: generateCube,
    galaxy: generateGalaxy,
    spiralGalaxy: generateSpiralGalaxy,
    torus: generateTorus,
    cylinder: generateCylinder,
    helix: generateHelix,
  };

  // ── Helpers ──────────────────────────────────────────────────────

  function applyRandomness(points, amount) {
    const scale = amount * 0.2;
    return points.map(p => ({
      x: p.x + (Math.random() - 0.5) * scale,
      y: p.y + (Math.random() - 0.5) * scale,
      z: p.z + (Math.random() - 0.5) * scale,
    }));
  }

  function hexToRGB(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  // ── High-level API ──────────────────────────────────────────────

  function generatePoints(config) {
    const gen = generators[config.shapeType];
    if (!gen) return [];
    let points = gen(config.density, config);
    if (config.randomness > 0) {
      points = applyRandomness(points, config.randomness);
    }
    return points;
  }

  // ── Connections ─────────────────────────────────────────────────

  function generateHubPosition(points, placement, index) {
    if (placement === 'inside' || (placement === 'mixed' && index % 2 === 0)) {
      const baseIdx = Math.floor(Math.random() * points.length);
      const base = points[baseIdx];
      return {
        x: base.x * 0.5 + (Math.random() - 0.5) * 0.3,
        y: base.y * 0.5 + (Math.random() - 0.5) * 0.3,
        z: base.z * 0.5 + (Math.random() - 0.5) * 0.3,
      };
    }
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
    const distances = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dx = p.x - hub.x, dy = p.y - hub.y, dz = p.z - hub.z;
      distances.push({ idx: i, dist: Math.sqrt(dx * dx + dy * dy + dz * dz) });
    }
    distances.sort((a, b) => a.dist - b.dist);

    const maxDist = distances.length > 0 ? distances[distances.length - 1].dist : 1;
    const reach = maxDist * (0.1 + spread * 0.9);
    const candidates = distances.filter(d => d.dist <= reach);
    if (candidates.length === 0) {
      return distances.slice(0, count).map(d => d.idx);
    }

    const n = Math.min(count, candidates.length);

    if (distribution === 'nearest') {
      return candidates.slice(0, n).map(d => d.idx);
    }

    if (distribution === 'random') {
      const shuffled = candidates.slice();
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.slice(0, n).map(d => d.idx);
    }

    if (distribution === 'weighted') {
      const exponent = 0.5 + focus * 4.5;
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
      if (selected.size < n) {
        for (let i = 0; i < candidates.length && selected.size < n; i++) {
          selected.add(candidates[i].idx);
        }
      }
      return Array.from(selected);
    }

    if (distribution === 'stratified') {
      const bandCount = Math.min(n, 5);
      const perBand = Math.ceil(n / bandCount);
      const bandWidth = reach / bandCount;
      const selected = [];

      for (let b = 0; b < bandCount; b++) {
        const lo = b * bandWidth;
        const hi = (b + 1) * bandWidth;
        const inBand = candidates.filter(d => d.dist >= lo && d.dist < hi);
        for (let i = inBand.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [inBand[i], inBand[j]] = [inBand[j], inBand[i]];
        }
        const take = Math.min(perBand, inBand.length);
        for (let i = 0; i < take; i++) {
          selected.push(inBand[i].idx);
        }
      }

      if (selected.length > n) return selected.slice(0, n);
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

    return candidates.slice(0, n).map(d => d.idx);
  }

  function generateConnections(points, config) {
    if (!config.connectionsEnabled || !points.length) {
      return { hubs: [], connections: [] };
    }
    const hubCount = config.hubCount || 3;
    const connectionsPerHub = config.connectionsPerHub || 15;
    const placement = config.hubPlacement || 'mixed';
    const distribution = config.connectionDistribution || 'nearest';
    const spread = config.connectionSpread != null ? config.connectionSpread : 0.5;
    const focus = config.connectionFocus != null ? config.connectionFocus : 0.5;

    const hubs = [];
    for (let i = 0; i < hubCount; i++) {
      hubs.push(generateHubPosition(points, placement, i));
    }

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

  function projectPoints(points, rotX, rotY, rotZ, perspD, cx, cy, spacing, worldScale) {
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

      const scale = perspD / (perspD + z2);
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

  function focalLengthToPerspD(focalMm) {
    const t = (Math.max(24, Math.min(200, focalMm)) - 24) / 176;
    return 12 + t * 488;
  }

  function renderFrame(ctx, w, h, points, config) {
    ctx.fillStyle = config.bgColor || '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const zoom = config.zoom || 1.0;
    const worldScale = Math.min(w, h) * 0.35 * zoom;

    const rotX = config.rotX || 0;
    const rotY = config.rotY || 0;
    const rotZ = config.rotZ || 0;
    const perspD = config.lensType === 'orthographic'
      ? Infinity
      : focalLengthToPerspD(config.focalLength ?? 50);
    const spacing = config.spacing || 1.0;

    const projected = projectPoints(
      points, rotX, rotY, rotZ, perspD, cx, cy, spacing, worldScale
    );

    const [cr, cg, cb] = hexToRGB(config.color || '#ffffff');
    const squareSize = config.squareSize || 3;
    const depthSizing = config.depthSizing !== false;
    const depthOpacity = config.depthOpacity !== false;

    // Build connected-particle set for highlight mode
    const connData = config.connectionData;
    const highlightConnected = config.highlightConnected === true;
    let connectedSet = null;
    if (highlightConnected && connData && connData.connections.length > 0) {
      connectedSet = new Set();
      for (let i = 0; i < connData.connections.length; i++) {
        connectedSet.add(connData.connections[i].particleIdx);
      }
    }

    const dimR = Math.round(cr * 0.25);
    const dimG = Math.round(cg * 0.25);
    const dimB = Math.round(cb * 0.25);

    // Draw connections (before sort so indices are intact, lines behind squares)
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

    // Sort by depth and draw particle squares
    projected.sort((a, b) => b.depth - a.depth);

    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      if (p.scale <= 0) continue;

      const size = depthSizing ? squareSize * p.scale : squareSize;

      const alpha = depthOpacity
        ? Math.max(0.05, Math.min(1.0, 0.3 + p.scale * 0.7))
        : 0.85;

      if (connectedSet && !connectedSet.has(p.origIdx)) {
        const dimAlpha = alpha * 0.4;
        ctx.fillStyle = `rgba(${dimR},${dimG},${dimB},${dimAlpha})`;
      } else {
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
      }
      ctx.fillRect(p.sx - size / 2, p.sy - size / 2, size, size);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // WEB COMPONENT
  // ═══════════════════════════════════════════════════════════════════

  class ParticleShape extends HTMLElement {

    static get observedAttributes() {
      return [
        'shape', 'density', 'spacing', 'randomness',
        'size', 'color', 'bg',
        'perspective', 'speed',
        'depth-opacity', 'depth-sizing', 'auto-rotate',
        'spiral-arms', 'extrude-depth', 'snap-to-grid',
        'rotate-x', 'rotate-y', 'rotate-z',
        'focal-length', 'lens',
        'connections', 'hubs', 'connections-per-hub',
        'connection-opacity', 'connection-thickness',
        'hub-placement', 'hub-visible', 'hub-size',
        'connection-depth-opacity',
        'connection-distribution', 'connection-spread', 'connection-focus',
        'highlight-connected', 'zoom',
      ];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      this._config = {
        shapeType: 'sphere',
        density: 1500,
        spacing: 1.0,
        randomness: 0,
        squareSize: 3,
        color: '#ffffff',
        bgColor: '#0a0a0a',
        focalLength: 50,
        lensType: 'perspective',
        zoom: 1.0,
        depthOpacity: true,
        depthSizing: true,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
        autoRotate: true,
        rotSpeed: 0.003,
        spiralArms: 4,
        extrudeDepth: 0.5,
        snapToGrid: false,
        svgOutline: [],
        svgPath2D: null,
        _svgNorm: null,
        connectionsEnabled: false,
        hubCount: 3,
        connectionsPerHub: 15,
        connectionOpacity: 0.3,
        connectionThickness: 1,
        hubPlacement: 'mixed',
        connectionDistribution: 'weighted',
        connectionSpread: 0.5,
        connectionFocus: 0.5,
        highlightConnected: false,
        hubVisible: true,
        hubSize: 6,
        connectionDepthOpacity: true,
        connectionData: { hubs: [], connections: [] },
      };
      this._points = [];
      this._animId = null;
      this._isDragging = false;
      this._lastMouseX = 0;
      this._lastMouseY = 0;
      this._canvas = null;
      this._ctx = null;
      this._resizeObserver = null;
    }

    connectedCallback() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          canvas {
            display: block;
            width: 100%;
            height: 100%;
            cursor: grab;
          }
          canvas:active {
            cursor: grabbing;
          }
        </style>
        <canvas></canvas>
      `;

      this._canvas = this.shadowRoot.querySelector('canvas');
      this._ctx = this._canvas.getContext('2d');

      this._syncAllAttributes();

      this._resizeObserver = new ResizeObserver(() => this._resize());
      this._resizeObserver.observe(this);
      this._resize();

      this._canvas.addEventListener('pointerdown', (e) => this._onPointerDown(e));
      this._onPointerMoveBound = (e) => this._onPointerMove(e);
      this._onPointerUpBound = () => this._onPointerUp();
      window.addEventListener('pointermove', this._onPointerMoveBound);
      window.addEventListener('pointerup', this._onPointerUpBound);

      // Scroll-wheel zoom
      this._canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        this._config.zoom = Math.max(0.2, Math.min(5, (this._config.zoom || 1) + delta));
      }, { passive: false });

      this._regenerate();
      this._startAnimation();
    }

    disconnectedCallback() {
      this._stopAnimation();
      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
      window.removeEventListener('pointermove', this._onPointerMoveBound);
      window.removeEventListener('pointerup', this._onPointerUpBound);
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal) return;
      this._applyAttribute(name, newVal);

      const regenerateAttrs = ['shape', 'density', 'randomness', 'spiral-arms', 'extrude-depth', 'snap-to-grid', 'connections', 'hubs', 'connections-per-hub', 'hub-placement', 'connection-distribution', 'connection-spread', 'connection-focus'];
      if (regenerateAttrs.includes(name)) {
        this._regenerate();
      }
    }

    // ── Attribute Mapping ───────────────────────────────────────────

    _syncAllAttributes() {
      for (const attr of ParticleShape.observedAttributes) {
        if (this.hasAttribute(attr)) {
          this._applyAttribute(attr, this.getAttribute(attr));
        }
      }
    }

    _applyAttribute(name, value) {
      const c = this._config;
      switch (name) {
        case 'shape':       c.shapeType = value; break;
        case 'density':     c.density = parseInt(value, 10) || 1500; break;
        case 'spacing':     c.spacing = parseFloat(value) || 1.0; break;
        case 'randomness':  c.randomness = parseFloat(value) || 0; break;
        case 'size':        c.squareSize = parseFloat(value) || 3; break;
        case 'color':       c.color = value || '#ffffff'; break;
        case 'bg':          c.bgColor = value || '#0a0a0a'; break;
        case 'perspective':   c.focalLength = parseInt(value, 10) || 50; break;
        case 'focal-length':  c.focalLength = parseFloat(value) || 50; break;
        case 'lens':          c.lensType = value || 'perspective'; break;
        case 'speed':       c.rotSpeed = parseFloat(value) || 0.003; break;
        case 'depth-opacity': c.depthOpacity = value !== 'false' && value !== null; break;
        case 'depth-sizing':  c.depthSizing = value !== 'false' && value !== null; break;
        case 'auto-rotate':   c.autoRotate = value !== 'false' && value !== null; break;
        case 'spiral-arms':  c.spiralArms = parseInt(value, 10) || 4; break;
        case 'extrude-depth': c.extrudeDepth = parseFloat(value) || 0.5; break;
        case 'snap-to-grid':  c.snapToGrid = value !== 'false' && value !== null; break;
        case 'rotate-x':     c.rotX = parseFloat(value) || 0; break;
        case 'rotate-y':     c.rotY = parseFloat(value) || 0; break;
        case 'rotate-z':     c.rotZ = parseFloat(value) || 0; break;
        case 'connections':           c.connectionsEnabled = value !== 'false' && value !== null; break;
        case 'hubs':                  c.hubCount = parseInt(value, 10) || 3; break;
        case 'connections-per-hub':   c.connectionsPerHub = parseInt(value, 10) || 15; break;
        case 'connection-opacity':    c.connectionOpacity = parseFloat(value) || 0.3; break;
        case 'connection-thickness':  c.connectionThickness = parseFloat(value) || 1; break;
        case 'hub-placement':         c.hubPlacement = value || 'mixed'; break;
        case 'hub-visible':           c.hubVisible = value !== 'false' && value !== null; break;
        case 'hub-size':              c.hubSize = parseFloat(value) || 6; break;
        case 'connection-depth-opacity': c.connectionDepthOpacity = value !== 'false' && value !== null; break;
        case 'connection-distribution':  c.connectionDistribution = value || 'weighted'; break;
        case 'connection-spread':        c.connectionSpread = parseFloat(value) ?? 0.5; break;
        case 'connection-focus':         c.connectionFocus = parseFloat(value) ?? 0.5; break;
        case 'highlight-connected':      c.highlightConnected = value !== 'false' && value !== null; break;
        case 'zoom':                     c.zoom = parseFloat(value) || 1.0; break;
      }
    }

    // ── Resize ──────────────────────────────────────────────────────

    _resize() {
      if (!this._canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = this.getBoundingClientRect();
      this._canvas.width = rect.width * dpr;
      this._canvas.height = rect.height * dpr;
      this._canvas.style.width = rect.width + 'px';
      this._canvas.style.height = rect.height + 'px';
      this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._logicalW = rect.width;
      this._logicalH = rect.height;
    }

    // ── Interaction ─────────────────────────────────────────────────

    _onPointerDown(e) {
      this._isDragging = true;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
    }

    _onPointerMove(e) {
      if (!this._isDragging) return;
      const dx = e.clientX - this._lastMouseX;
      const dy = e.clientY - this._lastMouseY;
      this._config.rotY += dx * 0.005;
      this._config.rotX += dy * 0.005;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
    }

    _onPointerUp() {
      this._isDragging = false;
    }

    // ── Animation ───────────────────────────────────────────────────

    _regenerate() {
      this._points = generatePoints(this._config);
      this._config.connectionData = generateConnections(this._points, this._config);
    }

    _startAnimation() {
      const tick = () => {
        if (this._config.autoRotate && !this._isDragging) {
          this._config.rotY += this._config.rotSpeed;
        }
        if (this._ctx && this._logicalW > 0) {
          renderFrame(this._ctx, this._logicalW, this._logicalH, this._points, this._config);
        }
        this._animId = requestAnimationFrame(tick);
      };
      tick();
    }

    _stopAnimation() {
      if (this._animId) {
        cancelAnimationFrame(this._animId);
        this._animId = null;
      }
    }
  }

  customElements.define('particle-shape', ParticleShape);

})();

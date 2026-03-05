// ── <particle-shape> Web Component ──────────────────────────────────
// Drop-in embeddable particle animation.
//
// Usage:
//   <script type="module" src="particle-shape.js"></script>
//   <particle-shape shape="sphere" density="2000" auto-rotate></particle-shape>

import { generatePoints, generateConnections, renderFrame, initVoronoiSamples, generateVoronoiPoints, initFloatPhases, applyFloat, parseSVGFile } from './particle-engine.js';

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
      'highlight-connected', 'non-connected-color', 'non-connected-opacity',
      'zoom', 'pixelate',
      'float', 'float-radius', 'float-speed', 'float-variability',
      'voronoi-cells', 'voronoi-membrane-width', 'voronoi-speed', 'voronoi-variability',
      'svg-src', 'svg-data',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Internal state
    this._config = {
      shapeType: 'sphere',
      density: 1500,
      spacing: 1.0,
      randomness: 0,
      squareSize: 3,
      color: '#ffffff',
      bgColor: '#0a0a0a',
      perspectiveD: 600,
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
      // Connections
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
      nonConnectedColor: '#404040',
      nonConnectedOpacity: 0.4,
      connectionData: { hubs: [], connections: [] },
      pixelate: 0,
      float: false,
      floatRadius: 0.1,
      floatSpeed: 1.0,
      floatVariability: 0.5,
      voronoiCells: 12,
      voronoiMembraneWidth: 0.05,
      voronoiSpeed: 0.5,
      voronoiVariability: 0.5,
    };
    this._points = [];
    this._voronoiSamples = [];
    this._floatPhases = [];
    this._animId = null;
    this._isDragging = false;
    this._lastMouseX = 0;
    this._lastMouseY = 0;
    this._canvas = null;
    this._ctx = null;
    this._resizeObserver = null;
  }

  connectedCallback() {
    // Shadow DOM structure
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
          touch-action: pan-y;
        }
      </style>
      <canvas></canvas>
    `;

    this._canvas = this.shadowRoot.querySelector('canvas');
    this._ctx = this._canvas.getContext('2d');

    // Sync attributes to config
    this._syncAllAttributes();

    // Resize handling
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this);
    this._resize();

    // Pointer interaction
    this._canvas.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    this._onPointerMoveBound = (e) => this._onPointerMove(e);
    this._onPointerUpBound = () => this._onPointerUp();
    window.addEventListener('pointermove', this._onPointerMoveBound);
    window.addEventListener('pointerup', this._onPointerUpBound);

    // Generate and start
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

    // Regenerate points for shape-affecting attributes
    const regenerateAttrs = ['shape', 'density', 'randomness', 'spiral-arms', 'extrude-depth', 'snap-to-grid', 'connections', 'hubs', 'connections-per-hub', 'hub-placement', 'connection-distribution', 'connection-spread', 'connection-focus', 'voronoi-cells', 'float'];
    if (regenerateAttrs.includes(name)) {
      this._regenerate();
    }
  }

  // ── Attribute Mapping ─────────────────────────────────────────────

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
      case 'perspective':  c.perspectiveD = parseInt(value, 10) || 600; break;
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
      case 'focal-length': c.focalLength = parseFloat(value) || 50; break;
      case 'lens':         c.lensType = value || 'perspective'; break;
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
      case 'non-connected-color':      c.nonConnectedColor = value || '#404040'; break;
      case 'non-connected-opacity':    c.nonConnectedOpacity = parseFloat(value) ?? 0.4; break;
      case 'zoom':                     c.zoom = parseFloat(value) || 1.0; break;
      case 'pixelate':                 c.pixelate = parseInt(value, 10) || 0; break;
      case 'float':                    c.float = value !== 'false' && value !== null; break;
      case 'float-radius':             c.floatRadius = parseFloat(value) || 0.1; break;
      case 'float-speed':              c.floatSpeed = parseFloat(value) || 1.0; break;
      case 'float-variability':        c.floatVariability = parseFloat(value) ?? 0.5; break;
      case 'voronoi-cells':            c.voronoiCells = parseInt(value, 10) || 12; break;
      case 'voronoi-membrane-width':   c.voronoiMembraneWidth = parseFloat(value) || 0.05; break;
      case 'voronoi-speed':            c.voronoiSpeed = parseFloat(value) ?? 0.5; break;
      case 'voronoi-variability':      c.voronoiVariability = parseFloat(value) ?? 0.5; break;
      case 'svg-data': {
        const svgText = atob(value);
        this._loadSVGText(svgText);
        break;
      }
      case 'svg-src': {
        fetch(value).then(r => r.text()).then(svgText => this._loadSVGText(svgText)).catch(() => {});
        break;
      }
    }
  }

  _loadSVGText(svgText) {
    const result = parseSVGFile(svgText);
    if (!result) return;
    this._config.svgOutline = result.outline;
    this._config.svgPath2D = result.svgPath2D;
    this._config._svgNorm = result.svgNorm;
    if (this._config.shapeType === 'svgExtrude') this._regenerate();
  }

  // ── Resize ────────────────────────────────────────────────────────

  _resize() {
    if (!this._canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.getBoundingClientRect();
    this._canvas.width = rect.width * dpr;
    this._canvas.height = rect.height * dpr;
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._logicalW = rect.width;
    this._logicalH = rect.height;
  }

  // ── Interaction ───────────────────────────────────────────────────

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

  // ── Animation ─────────────────────────────────────────────────────

  _regenerate() {
    if (this._config.shapeType === 'voronoi') {
      this._voronoiSamples = initVoronoiSamples(this._config.density);
      this._points = generateVoronoiPoints(this._voronoiSamples, this._config, 0);
    } else {
      this._points = generatePoints(this._config);
    }
    this._config.connectionData = generateConnections(this._points, this._config);
    this._floatPhases = initFloatPhases(this._points.length);
  }

  _startAnimation() {
    let _lastTs = 0;
    const tick = (ts) => {
      const dt = _lastTs ? Math.min((ts - _lastTs) / (1000 / 60), 4) : 1;
      _lastTs = ts;
      if (this._config.autoRotate && !this._isDragging) {
        this._config.rotY += this._config.rotSpeed * dt;
      }
      if (this._ctx && this._logicalW > 0) {
        const t = performance.now() * 0.001;
        let points;
        if (this._config.shapeType === 'voronoi') {
          points = generateVoronoiPoints(this._voronoiSamples, this._config, t);
        } else if (this._config.float && this._floatPhases.length > 0) {
          points = applyFloat(this._points, this._floatPhases, this._config, t);
        } else {
          points = this._points;
        }

        const blockSize = this._config.pixelate;
        if (blockSize > 1) {
          if (!this._pixelCanvas) this._pixelCanvas = document.createElement('canvas');
          const pw = Math.max(1, Math.round(this._logicalW / blockSize));
          const ph = Math.max(1, Math.round(this._logicalH / blockSize));
          this._pixelCanvas.width = pw;
          this._pixelCanvas.height = ph;
          renderFrame(this._pixelCanvas.getContext('2d'), pw, ph, points, this._config);
          this._ctx.imageSmoothingEnabled = false;
          this._ctx.drawImage(this._pixelCanvas, 0, 0, this._logicalW, this._logicalH);
        } else {
          this._ctx.imageSmoothingEnabled = true;
          renderFrame(this._ctx, this._logicalW, this._logicalH, points, this._config);
        }
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

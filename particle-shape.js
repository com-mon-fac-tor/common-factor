// ── <particle-shape> Web Component ──────────────────────────────────
// Drop-in embeddable particle animation.
//
// Usage:
//   <script type="module" src="particle-shape.js"></script>
//   <particle-shape shape="sphere" density="2000" auto-rotate></particle-shape>

import { generators, generatePoints, generateConnections, renderFrame } from './particle-engine.js';

class ParticleShape extends HTMLElement {

  static get observedAttributes() {
    return [
      'shape', 'density', 'spacing', 'randomness',
      'size', 'color', 'bg',
      'perspective', 'speed',
      'depth-opacity', 'depth-sizing', 'auto-rotate',
      'spiral-arms', 'extrude-depth', 'snap-to-grid',
      'rotate-x', 'rotate-y',
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

    // Scroll-wheel zoom
    this._canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      this._config.zoom = Math.max(0.2, Math.min(5, (this._config.zoom || 1) + delta));
    }, { passive: false });

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
    const regenerateAttrs = ['shape', 'density', 'randomness', 'spiral-arms', 'extrude-depth', 'snap-to-grid', 'connections', 'hubs', 'connections-per-hub', 'hub-placement', 'connection-distribution', 'connection-spread', 'connection-focus'];
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
      case 'rotate-x':    c.rotX = parseFloat(value) || 0; break;
      case 'rotate-y':    c.rotY = parseFloat(value) || 0; break;
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

  // ── Resize ────────────────────────────────────────────────────────

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

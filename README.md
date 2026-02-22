# CF Particle Generator

A 3D particle generator that renders interactive point-cloud sculptures in the browser. Configure shape, density, appearance, connections, and camera — then export as PNG or SVG, or embed directly in any webpage with a single `<script>` tag.

## Demo

Open `index.html` in any modern browser to use the interactive editor.

## Embed

Drop this into any HTML page to render a particle shape:

```html
<script src="https://cdn.jsdelivr.net/gh/com-mon-fac-tor/cf-particle-generator/particle-shape.bundle.js"></script>
<particle-shape
  shape="sphere"
  density="1500"
  color="#ffffff"
  bg="#0a0a0a"
  auto-rotate
  style="width:100%;height:100%">
</particle-shape>
```

Use the **Copy Embed Code** button in the editor to generate a pre-configured snippet from your current settings.

## Attributes

### Shape

| Attribute | Values | Default | Description |
|---|---|---|---|
| `shape` | `sphere` `cube` `galaxy` `spiralGalaxy` `torus` `cylinder` `helix` `svgExtrude` | `sphere` | Particle shape |
| `density` | `50`–`10000` | `1500` | Number of particles |
| `spacing` | `0.2`–`3.0` | `1.0` | Scale of the shape |
| `randomness` | `0`–`1` | `0` | Random positional noise |
| `spiral-arms` | `1`–`8` | `4` | Arm count (spiralGalaxy only) |
| `extrude-depth` | `0.1`–`2.0` | `0.5` | Depth (svgExtrude only) |
| `snap-to-grid` | boolean | — | Snap SVG extrude to grid |

### Appearance

| Attribute | Values | Default | Description |
|---|---|---|---|
| `color` | hex | `#ffffff` | Particle color |
| `bg` | hex | `#0a0a0a` | Background color |
| `size` | `1`–`12` | `3` | Particle square size (px) |
| `depth-opacity` | boolean | — | Fade particles by depth |
| `depth-sizing` | boolean | — | Scale particles by depth |

### Camera

| Attribute | Values | Default | Description |
|---|---|---|---|
| `lens` | `perspective` `orthographic` | `perspective` | Camera lens type |
| `focal-length` | `24`–`200` | `50` | Focal length in mm (perspective only) |
| `zoom` | `0.2`–`5.0` | `1.0` | Camera zoom |
| `speed` | `0`–`0.02` | `0.003` | Auto-rotation speed |
| `auto-rotate` | boolean | — | Enable auto-rotation |

### Connections

| Attribute | Values | Default | Description |
|---|---|---|---|
| `connections` | boolean | — | Enable connection lines |
| `hubs` | `1`–`10` | `3` | Number of hub points |
| `connections-per-hub` | `1`–`100` | `15` | Lines per hub |
| `hub-placement` | `mixed` `inside` `outside` | `mixed` | Hub position placement |
| `connection-distribution` | `nearest` `random` `weighted` `stratified` | `weighted` | How particles are selected per hub |
| `connection-spread` | `0`–`1` | `0.5` | Reach of connections |
| `connection-focus` | `0`–`1` | `0.5` | Bias toward nearest particles |
| `connection-opacity` | `0.05`–`1.0` | `0.3` | Line opacity |
| `connection-thickness` | `0.5`–`4` | `1` | Line thickness |
| `hub-visible` | `true` `false` | `true` | Show hub squares |
| `hub-size` | `2`–`16` | `6` | Hub square size |
| `connection-depth-opacity` | `true` `false` | `true` | Depth fade on lines |
| `highlight-connected` | boolean | — | Dim unconnected particles |
| `non-connected-color` | hex | `#404040` | Color for unconnected particles |
| `non-connected-opacity` | `0`–`1` | `0.4` | Opacity for unconnected particles |

## Running Locally

No build step required. Just open `index.html` in a browser:

```bash
# Using Python
python3 -m http.server

# Using Node
npx serve .
```

Then visit `http://localhost:8000`.

> **Note:** `index.html` uses ES module imports, so it must be served over HTTP — opening the file directly (`file://`) will not work.

## File Structure

```
cf-particle-generator/
├── index.html              # Interactive editor UI
├── styles.css              # Editor styles
├── particle-engine.js      # Core 3D engine (shape generators, renderer, projection)
├── particle-shape.js       # Web component source
├── particle-shape.bundle.js # Compiled web component (used by the CDN embed)
└── embed-test.html         # Minimal embed test page
```

## Notes for Contributors

The following assets are proprietary and not included in this repository:

- **`fonts/`** — The UI uses licensed typefaces (Saans, SerrifMonoCompressed). Without them, the editor falls back to system fonts.
- **`icons/`** — Section label icons in the editor panel are proprietary. Without them, icon slots will appear empty.

Everything else — the particle engine, web component, and editor logic — is fully open source and functional without these assets.

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

## License

MIT License — see [LICENSE](LICENSE) for details.

---

© 2026 Common Factor. All rights reserved.

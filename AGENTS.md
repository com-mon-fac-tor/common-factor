# CF Particle Generator

## Cursor Cloud specific instructions

This is a zero-dependency static website (vanilla HTML/CSS/JS). There is no package manager, no build step, no backend, no database, and no automated test suite.

### Running the application

Serve static files over HTTP (ES modules require it — `file://` will not work):

```bash
python3 -m http.server 8000
```

- **Editor:** http://localhost:8000/ (`index.html`)
- **Embed test:** http://localhost:8000/embed-test.html

### Key files

| File | Role |
|---|---|
| `particle-engine.js` | Core 3D engine (shapes, projection, renderer) |
| `particle-shape.js` | `<particle-shape>` Web Component source (ES module) |
| `particle-shape.bundle.js` | Pre-compiled standalone bundle of the web component |
| `index.html` | Interactive editor UI |
| `embed-test.html` | Embed component test page |

### Lint / Test / Build

- **No linter configured.** No ESLint, Prettier, or similar tooling.
- **No automated tests.** Manual testing in-browser is the only verification method.
- **No build step.** `particle-shape.bundle.js` is pre-compiled and committed. If you modify `particle-engine.js` or `particle-shape.js`, the bundle must be regenerated (the bundling process is not documented in the repo).

### Gotchas

- The `fonts/` directory is empty — proprietary fonts are not included. The UI falls back to system fonts gracefully.
- All changes to the engine or web component source should be manually tested in both `index.html` and `embed-test.html`.

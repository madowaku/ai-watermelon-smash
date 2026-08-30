# AI Watermelon Smash 🍉🤖

A WebMCP Challenge 2026 browser game about **playing with an AI instead of merely asking one for answers**.

The human can see the beach, obstacles, and watermelon. The AI character is blindfolded but has the controls. The intended Challenge experience is a tiny asymmetric co-op game where the human gives natural-language guidance and the AI physically turns, walks, and swings through WebMCP tools.

> Human: vision without control.  
> AI: control without vision.  
> Goal: smash the watermelon together.

## Current milestone: Day 2 WebMCP

The playable Day 1 loop now exposes four WebMCP site tools through a thin adapter around the same `Game` API used by debug controls. In a supported browser, a human supplies visual guidance while the blindfolded AI turns, walks, and swings. Unsupported browsers keep the full game playable and show `WebMCP · UNAVAILABLE` without throwing.

### Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints with `?debug=1`, for example:

```text
http://localhost:5173/?debug=1
```

Debug controls:

- `←` / `→`: turn 15°
- `↑`: walk 0.5 m
- `Space`: swing
- `R`: restart

Production check:

```bash
npm run build
npm run preview
```

## Architecture

The simulation state is deliberately independent from Three.js.

```text
Human debug input             WebMCP site tools
             \                  /
              \                /
                   Game API
                      |
                 GameState
                      |
                 SceneView
                      |
                  Three.js
```

`GameState` contains serializable gameplay data only. Three.js meshes are views, never the source of truth. WebMCP tools call the same `Game` methods used by debug controls.

## Day 2 scope

Implemented:

- deterministic 20 m × 20 m beach scene
- fixed readable camera
- primitive blindfolded character + stick
- watermelon + break effect
- rock / bucket / palm obstacles
- relative turning
- bounded forward walking
- simple circle collision
- swing cone / hit test
- shared-success result screen
- keyboard-only debug controls behind `?debug=1`
- responsive DOM HUD
- WebMCP feature detection and status HUD
- exactly four WebMCP site tools
- blindfold-safe tool outputs
- Cloudflare Workers static-assets deployment config

WebMCP exposes exactly four tools:

- `turn(degrees)`
- `walk(distance)`
- `swing()`
- `get_self_status()`

The AI must not receive the watermelon position, target direction, obstacle map, or shortest path through tool results. The intended rule is simple: **the human sees; the AI acts**.

The HUD reports `CONNECTING`, `READY`, `UNAVAILABLE`, or `ERROR`. Registration uses the imperative `document.modelContext.registerTool()` API and is guarded so page reloads and development hot updates do not duplicate tools.

### Human + AI playtest

1. Open the game as a top-level page in the ChatGPT desktop built-in browser.
2. Confirm **Enable site tools** is on and the HUD reads `WebMCP · READY`.
3. Open **Site tools → Available site tools** and verify the four tools above.
4. Tell the AI where to turn and how far to walk; the AI should rely on that guidance rather than infer the target position.
5. Ask it to swing when aligned, then use **PLAY AGAIN** to verify restart.

During development, actual Site-tool invocation succeeded with GPT-5.5 in the tested ChatGPT Desktop environment. Tool discovery succeeded in another tested model configuration but invocation did not; model availability and Site-tool support may vary by environment.

For ordinary browser regression testing, append `?debug=1` and use the keyboard controls documented above.

## Interaction design

The current design rule is **physical clarity, social ambiguity**: facing direction, movement, and swing direction should be obvious; difficulty should come from interpreting human guidance rather than fighting unclear controls.

See [`docs/design/social-guidance-principles.md`](docs/design/social-guidance-principles.md) for the multiplayer/social direction.

## Handoff rule

Do not add a second gameplay implementation for WebMCP. Register tools as adapters around the existing `Game` API. Keep the renderer ignorant of agent/tool logic.

## License

MIT

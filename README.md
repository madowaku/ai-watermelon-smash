# AI Watermelon Smash 🍉🤖

A WebMCP Challenge 2026 browser game about **playing with an AI instead of merely asking one for answers**.

The human can see the beach, obstacles, and watermelon. The AI character is blindfolded but has the controls. The intended Challenge experience is a tiny asymmetric co-op game where the human gives natural-language guidance and the AI physically turns, walks, and swings through WebMCP tools.

> Human: vision without control.  
> AI: control without vision.  
> Goal: smash the watermelon together.

## Current milestone: Day 1 playable

This branch intentionally implements the game loop **before WebMCP**. Open the debug build, guide the character with the keyboard, and prove that movement, collision, swinging, success, restart, rendering, and responsive HUD all work independently of the agent layer.

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
Human debug input (Day 1)     WebMCP tools (Day 2)
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

`GameState` contains serializable gameplay data only. Three.js meshes are views, never the source of truth. Day 2 WebMCP tools must call the same `Game` methods used by debug controls.

## Day 1 scope

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

Not implemented yet:

- WebMCP registration
- ChatGPT/browser-agent control
- action locking/async animation contract
- SFX
- automated browser tests
- package lock (generate with local `npm install`)
- production deployment

## Day 2 WebMCP target

Expose only four tools:

- `turn(degrees)`
- `walk(distance)`
- `swing()`
- `get_self_status()`

The AI must not receive the watermelon position, target direction, obstacle map, or shortest path through tool results. The intended rule is simple: **the human sees; the AI acts**.

## Handoff rule

Do not add a second gameplay implementation for WebMCP. Register tools as adapters around the existing `Game` API. Keep the renderer ignorant of agent/tool logic.

## License

MIT

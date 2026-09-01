# Day 4 — Codex Implementation Plan

Implement the visual polish spec in `docs/day4-visual-polish-spec.md` on branch `feat/day4-visual-polish`.

## 0. Hard rule

Gameplay is frozen.

Before editing, read:

- `docs/day4-visual-polish-spec.md`
- `docs/design/social-guidance-principles.md`
- `src/game/Game.ts`
- `src/game/GameState.ts`
- `src/render/SceneView.ts`
- `src/main.ts`
- `src/style.css`
- `src/webmcp/WebMcpAdapter.ts`
- `src/guides/GuideStore.ts`

Do not alter simulation results or WebMCP behavior.

## 1. Git setup

```bash
cd C:\Dev\Projects\ai-watermelon-smash
git status
git fetch origin
git checkout feat/day4-visual-polish
git pull --ff-only origin feat/day4-visual-polish
```

If there are user changes, preserve them and stop before overwriting.

## 2. Establish a visual baseline

Run the current build before editing and capture repo-external baseline screenshots at:

- 1440×900
- 390×844
- initial scene
- swing
- success

Example evidence folder:

`C:\Dev\ai-watermelon-smash-day4-evidence\before\`

## 3. Refactor SceneView only as much as needed

Keep `SceneView` as a view adapter over GameState.

Recommended render-only fields/groups:

- outer `player` transform for world position/heading
- inner `characterVisual` group for bob/recoil/pose
- visual position target/current state
- visual heading target/current state
- movement animation timestamps
- collision animation timestamp
- swing phase timestamp
- success/break animation timestamp
- camera base pose + temporary punch offsets

Do not store game truth in meshes.

Reset visual state cleanly when GameState round counters decrease / restart occurs.

## 4. Smooth turn and walk rendering

Replace direct visible snapping with deterministic render interpolation.

Requirements:

- final visual pose converges exactly to GameState
- shortest-angle heading interpolation
- ordinary 15° turns visibly animate but remain quick
- long turns remain under roughly 350 ms where practical
- walk duration scales with actual traveled distance
- collision partial movement stops at the GameState result position
- rapid debug inputs do not create runaway queues

Prefer target-based interpolation / short render tween state over a complex action queue.

Add subtle character bob while visual position is moving.

## 5. Character visual rebuild

Keep procedural geometry and low draw-call complexity.

Upgrade the character from mannequin to small toy-like blindfolded AI player.

Minimum:

- clear rounded head/body silhouette
- unmistakable face/front on local `-Z`
- dark blindfold visibly wraps the front
- small robot/AI cue such as antenna or head detail
- two-hand grip / hands near the stick
- stick visually belongs to the body
- simple legs/feet

Re-run heading screenshots after this change. Never sacrifice the Day 2 facing fix.

## 6. Collision response

Detect `collisionCount` increments in render state.

Add a tiny non-simulation recoil:

- body lean/squash
- optional sand puff using a small pooled particle group
- settle rapidly

Do not change the outer player final world transform.

## 7. Swing rebuild

Preserve the forward direction.

Implement three-phase swing:

- anticipation
- fast strike
- recovery

Hands and stick should read as one action.

Validate at 0°, +90°, -90°, and 180°.

If success occurs on this swing, synchronize the visual watermelon break close to the strike contact moment while keeping GameState success immediate.

## 8. Watermelon smash polish

Improve watermelon appearance with:

- clearer stripes
- stem
- subtle ground mat / straw disc
- better contact shadow

On success:

- halves separate and rotate
- fruit particles
- a few seed particles
- small radial impact cue
- tiny camera punch

Pool/reuse meshes rather than allocating every frame.

## 9. Diorama environment

Without moving gameplay objects or collider coordinates:

- give sand playfield visible thickness/base
- place ocean lower than sand
- improve shoreline using simple foam strips
- add sparse non-colliding decorative shells/pebbles/footprints/sand tufts
- make bucket/palm/rock silhouettes slightly richer while preserving positions and gameplay readability

Decorations must be obviously decorative and must not imply collisions.

## 10. Lighting / renderer

Use standard Three.js features only.

Consider:

```ts
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = ...;
```

Tune existing hemisphere/directional light and shadow softness.

Do not add EffectComposer/bloom/custom shader stack.

## 11. Camera

Keep overview readability.

Allowed:

- improved static framing
- tiny action response
- collision nudge
- success punch

Not allowed:

- chase camera
- camera rotation that hides board information
- large continuous camera motion

## 12. Result timing

The current result overlay appears as soon as GameState success is observed.

Add presentation-only reveal delay so the successful smash remains visible for roughly 650–900 ms before the result card fully occupies attention.

This must reset on PLAY AGAIN and debug restart.

Do not delay or mutate GameState success.

## 13. HUD / Guide Chorus

Keep all functionality.

Restyle toward compact game UI:

- introduce CSS variables for theme
- reduce cards-inside-cards feeling
- keep A/B/C speaker identity strong
- make panel feel like guide comms / beach radio
- keep center/lower-middle playfield clear
- WebMCP status secondary but visible
- action prompt readable
- mobile default collapsed
- keyboard/focus/accessibility behavior preserved

Do not turn this into a dashboard redesign.

## 14. Reduced motion

Respect `prefers-reduced-motion` for nonessential CSS transitions where practical.

Do not disable essential physical direction feedback.

## 15. Regression suite

Run:

```bash
npm run build
npm audit --omit=dev
git diff --check
```

Browser/game regression:

- turn
- walk
- collision
- miss
- hit
- restart
- Guide Chorus A/B/C submission
- restart clears guides
- exact five WebMCP tools
- direct execution of all five
- no blindfold data leakage
- console errors 0

## 16. Visual QA evidence

Store outside repo under:

`C:\Dev\ai-watermelon-smash-day4-evidence\after\`

Capture at minimum:

- `desktop-initial.png`
- `desktop-guides.png`
- `heading-0.png`
- `heading-plus90.png`
- `heading-minus90.png`
- `heading-180.png`
- `walk-motion.png` or video evidence
- `collision-recoil.png`
- `swing-forward.png`
- `smash-impact.png`
- `result.png`
- `mobile-collapsed.png`
- `mobile-expanded.png`

Use real WebGL screenshots/video. Do not pass visual QA from DOM assertions alone.

## 17. Before/after judgment

Compare the baseline and final screenshots and explicitly answer:

- Does this read as a game before reading UI text?
- Is the character now the visual focal point?
- Is its front unmistakable?
- Does movement look physical instead of teleporting?
- Does Guide Chorus protect the playfield?
- Is the watermelon smash the strongest visual event?
- Did anything become less legible on mobile?

If visual complexity reduced clarity, revert the decorative complexity rather than changing gameplay.

## 18. Commit / push

Suggested commit:

`feat: polish embodied beach presentation`

Push to:

`origin/feat/day4-visual-polish`

Do not merge.

## Final report format

```text
DAY 4 VISUAL POLISH: PASS / PARTIAL / FAIL

Character:
front clarity:
blindfold clarity:
stick grip:

Motion:
turn interpolation:
walk interpolation:
collision recoil:
swing forward:

Smash:
impact readability:
result reveal timing:

Environment:
diorama read:
lighting/shadows:

UI:
desktop:
mobile:
Guide Chorus:

Regression:
build:
audit:
5 WebMCP tools:
blindfold audit:
restart clear:
console errors:

Evidence:
...

GAMEPLAY CHANGED: YES / NO
READY FOR LIVE PREVIEW QA: YES / NO
```

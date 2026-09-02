# Day 4 — Visual Polish / “1991 → 2026”

## Goal

Make AI Watermelon Smash read as a deliberate modern browser game without changing the frozen gameplay.

The target is **not realism** and not high-poly spectacle.

The target is:

> **A sunlit toy-diorama beach where a blindfolded AI visibly turns, walks, bumps, swings, and finally explodes a watermelon.**

The visual upgrade must make the existing Human + AI idea easier to understand in a 3-minute Challenge demo.

## Frozen gameplay contract

Day 3 established `GAMEPLAY FREEZE: YES`.

Do not change:

- `Game.ts` rules
- GameState semantics
- starting positions
- movement distances
- collision radii / collision behavior
- swing hit cone / hit distance
- watermelon hit logic
- restart semantics
- GuideStore semantics
- WebMCP schemas or tool names
- tool count (must remain exactly 5)
- blindfold data-leakage rules

The five Site tools remain:

1. `turn(degrees)`
2. `walk(distance)`
3. `swing()`
4. `get_self_status()`
5. `listen_to_guides()`

Day 4 changes are render/UI/presentation only, except for small presentation-timing state that never affects simulation outcomes.

## Core design rule

> **Physical clarity, social ambiguity.**

Visual polish must improve physical clarity. Do not reintroduce ambiguity about which way the character faces, which way it will walk, or where the stick swings.

The uncertainty belongs in the Guide Chorus and the AI’s trust decisions.

## Visual direction

### Mood

- bright summer afternoon
- playful, tactile, compact
- toy diorama rather than flat debug scene
- cheerful without becoming childish clip-art
- strong silhouettes that survive video compression

### Material language

Prefer:

- rounded procedural forms
- matte / lightly rough standard materials
- soft contact shadows
- warm sand
- clean blue water / sky
- watermelon green + red as the strongest reward colors
- dark blindfold as the clearest character landmark

Avoid:

- photorealism
- noisy textures
- heavy post-processing
- neon cyberpunk styling
- generic SaaS glass-dashboard look
- tiny decorative detail that disappears in the demo recording

## Priority 1 — Character must feel embodied

The character is the star of the concept. It should immediately read as **the blindfolded AI player**, not a cylinder mannequin.

Keep the model procedural in Three.js for Day 4 unless an asset swap is clearly lower-risk.

Recommended direction: a small friendly toy-like AI/robot beach character.

Requirements:

- unmistakable front at all headings
- blindfold clearly on the face/front
- clean silhouette at 1440×900 and 390×844
- hands / grip visually connect to the stick
- stick no longer appears to float independently
- front remains local `-Z`, matching the verified Day 2 facing convention

Optional character cues:

- rounded cream/white head or body
- compact antenna or small AI cue behind/above the blindfold
- simple beach-accent garment / body color
- subtle feet / sandals

Do not add readable eyes outside the blindfold that undermine the blindfold fantasy.

## Priority 2 — Render-only body motion

Current simulation positions update discretely. Add **render-only interpolation** so WebMCP actions look like physical actions.

The renderer may maintain visual pose state separate from GameState, but GameState remains authoritative.

### Turn

- visually rotate toward the new heading over roughly 180–320 ms depending on angle
- shortest-angle interpolation
- small body lean is allowed
- final visible heading must exactly match GameState

### Walk

- visually travel from previous rendered position to the GameState position over roughly 250–650 ms depending on distance
- add subtle step/bob motion while moving
- legs/feet may alternate visually if low-risk
- no visual motion may cross through a collider farther than the final GameState position
- a partial collision move should visibly stop at the actual partial distance

### Collision

When `collisionCount` increases:

- small recoil / squash / body jolt
- very short, readable feedback, around 120–220 ms
- optional tiny sand puff or impact cue
- do not move simulation state

Collision should look funny and tactile, not painful.

### Idle

Very subtle breathing/weight shift is acceptable.

Do not use constant large idle motion that makes heading unclear.

## Priority 3 — Swing needs anticipation and follow-through

Keep the verified forward swing direction.

Replace the current simple sine swing with a readable three-phase animation:

1. **Anticipation** — brief lift/back preparation without sending the stick into the rear play space
2. **Strike** — fast forward/downward arc through the front play space
3. **Recovery** — settle back to ready pose

Target total duration: roughly 500–700 ms.

Requirements:

- forward play space remains obvious at 0°, ±90°, 180°
- hands/stick move as one readable action
- miss still looks satisfying
- hit timing should visually coincide with the watermelon break as closely as possible without changing the simulation result

## Priority 4 — Make the watermelon the visual reward

The watermelon is visible to humans, so clarity is desirable.

Improve it without materially changing the hitbox/readability contract:

- clearer rind striping
- small stem
- subtle straw mat / beach cloth / target mat underneath
- stronger contact shadow
- visual scale may increase only slightly; avoid obvious mismatch with the hit radius

### Successful hit

The smash should be the strongest motion in the entire game.

Use a combination of:

- rind/flesh halves separating and rotating
- red fruit particles
- a few dark seed particles
- short radial impact ring / squash flash
- tiny camera punch or shake
- optional sand puff
- brief hit-stop-like visual beat if it can be implemented render-only

Do not add bloom or expensive post-processing just for this.

The success card should not cover the actual smash immediately. Delay its full reveal by roughly 650–900 ms using presentation-only timing so the player sees the hit first.

## Priority 5 — Turn the beach into a toy diorama

The current large flat planes read as an old debug scene.

Keep the same gameplay coordinates, but improve spatial presentation.

Suggested low-risk additions:

- shallow sand slab/base so the play area has visible thickness
- ocean lower than the sand level
- thin animated-looking shoreline/foam strips using simple meshes and opacity/position animation
- a few shells, pebbles, grass tufts, footprints, or sand patches as non-colliding decoration
- subtle tonal variation rather than textures
- improve palm, bucket, and rock silhouettes while preserving collider locations

Decorations must never be mistaken for gameplay obstacles. Keep them small, low, and clearly decorative.

Do not introduce new colliders.

## Priority 6 — Lighting and camera polish

Stay with standard Three.js materials and lighting.

Recommended renderer improvements:

- `ACESFilmicToneMapping`
- modest exposure tuning
- soft shadows
- tuned hemisphere + directional light
- fog only if it helps depth, not if it washes out the scene

Camera remains fundamentally a readable overview camera because the human must see the watermelon and obstacles.

Allowed camera polish:

- better initial framing
- subtle render-only easing
- tiny collision/swing camera response
- short success punch-in

Do not turn this into a chase camera. Do not hide the target from the human.

## Priority 7 — HUD / Guide Chorus should feel like game UI

Keep UI in DOM.

### Playfield protection

On desktop, persistent UI should remain edge-aligned and should not cover the central play area.

On mobile, Guide Chorus stays collapsible and should default collapsed.

### Guide Chorus direction

Keep A/B/C functionally identical, but visually shift from “form dashboard” toward a compact **beach-radio / guide comms** panel.

Ideas:

- colored A/B/C speaker chips
- latest message as a small speech strip
- reduced border/card nesting
- one clear panel instead of cards-inside-cards
- stronger SEND feedback
- always-visible collapse toggle if useful

Do not remove accessibility labels, keyboard submission, validation feedback, or mobile behavior.

### Status / prompt

- keep WebMCP READY visible but secondary
- keep the blindfolded partner action feedback readable
- avoid multiple equal-weight floating white boxes
- result card should feel celebratory, not administrative

Use CSS variables for theme values.

## Presentation timing

Small local presentation state is allowed for:

- success-card delayed reveal
- camera shake timers
- visual movement interpolation
- body bob / recoil
- particle animation

It must not affect:

- GameState
- action results
- WebMCP return values
- collision / hit decisions
- GuideStore

## Scope exclusions

Do NOT add:

- new gameplay mechanics
- new Site tools
- multiplayer/networking
- Firebase / backend
- physics engine
- GLB pipeline unless absolutely necessary
- custom shaders unless a blocker cannot be solved with standard materials
- EffectComposer / bloom stack
- audio system in this pass
- new level
- scoring/economy
- traitor system
- trust meter
- target markers visible to the AI through DOM/tool output

## Required QA

### Functional regression

- build PASS
- audit 0 vulnerabilities
- Site tools exactly 5
- `turn` PASS
- `walk` PASS
- collision PASS
- `swing` miss PASS
- watermelon hit PASS
- `get_self_status` PASS
- `listen_to_guides` PASS
- restart clears guides PASS
- no blindfold leakage
- console errors 0

### Physical clarity

Verify real screenshots/video at:

- heading 0°
- +90°
- -90°
- 180°
- forward swing
- collision recoil
- successful smash

At all headings:

`visible front == next walk direction == forward swing play space`

### Responsive QA

At minimum:

- 1440×900
- 720×1280
- 390×844

Check that Guide Chorus does not obscure the character/watermelon during normal play.

### Motion QA

Record or inspect actual rendered motion. DOM assertions are insufficient for WebGL presentation.

Verify:

- no snapping on ordinary turns/walks
- no visual overshoot past collision stop
- no backward swing regression
- success overlay waits long enough to show the smash
- restart returns presentation state cleanly

## Acceptance bar

Day 4 passes if a 5–10 second muted clip communicates all of the following without explanation:

1. this is a beach game
2. the blindfolded character has a clear front/body
3. it physically moves rather than teleports
4. the stick swings forward
5. smashing the watermelon feels rewarding

And a full screenshot should read as **a game scene first, UI second**.

## Final principle

> Do not spend the remaining Challenge time making the world larger.
> Make one watermelon extraordinarily satisfying to smash.

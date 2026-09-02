# AI Watermelon Smash 🍉🤖

**A WebMCP-native co-op game where the human has the eyes and the AI has the body.**

AI Watermelon Smash explores a simple question: what if an AI were not an assistant, NPC, or game master, but a player standing beside you in the same game world?

The human can see the beach, obstacles, and watermelon. The AI character is blindfolded. Through WebMCP Site tools, the AI can turn, walk, swing, inspect its own body state, and listen to several human guides. The humans provide visual testimony. The AI decides what to trust and physically acts on it.

> Human: vision without direct control.  
> AI: control without vision.  
> Goal: smash the watermelon together.

## Live app

https://ai-watermelon-smash.cacao-ixora-coccinea.workers.dev/

The intended judging environment is the ChatGPT in-app browser or another browser with WebMCP enabled.

## Why WebMCP?

Most AI interfaces reduce collaboration to text: ask, answer, repeat. This project uses WebMCP as the AI player's **body inside the browser**.

- `turn(degrees)` → orientation
- `walk(distance)` → legs
- `swing()` → arms
- `get_self_status()` → proprioception
- `listen_to_guides()` → social perception / hearing

The tools are not shortcuts to the solution. They deliberately do **not** return the watermelon coordinates, target direction, target distance, obstacle map, shortest route, or labels telling the AI which guide is correct.

The blindfold is a gameplay role plus tool-output data minimization, not a claim of cryptographic secrecy from the rendered page. The Site tools themselves never provide hidden target truth.

## Physical clarity, social ambiguity

The core design rule is:

> **Physical clarity, social ambiguity.**

Facing direction, forward movement, collisions, and the swing must be visually clear. The uncertainty should come from people.

A / B / C can submit conflicting Guide Chorus messages such as:

```text
A: Keep going straight!
B: Turn right!
C: Stop. Something is in front of you.
```

`listen_to_guides()` returns those statements as **unverified human testimony**. The AI can compare them with its own previous actions and collision feedback, decide whom to trust, ask for clearer guidance, or make a cautious probe movement.

In live testing, the AI changed trust after collisions, did not permanently follow a previously reliable guide, treated absurd claims as suspicious rather than game truth, and eventually selected concrete guidance that led to a direct watermelon hit.

That creates a loop that is difficult to express with a conventional assistant UI:

```text
human testimony
      ↓
AI judgment
      ↓
WebMCP body action
      ↓
physical feedback
      ↓
updated trust
      ↓
next joint decision
```

The humans begin playing the AI while the AI is playing the humans.

## How to play with ChatGPT Site tools

1. Open the live app as a top-level page in ChatGPT's in-app browser.
2. Make sure Site tools are enabled and the HUD reads **WebMCP · READY**.
3. Confirm these five Site tools are available:
   - `turn`
   - `walk`
   - `swing`
   - `get_self_status`
   - `listen_to_guides`
4. Give the blindfolded AI natural-language directions, or submit messages from A / B / C in Guide Chorus.
5. Let the AI choose how to move and whom to trust.
6. Guide it close enough to swing and smash the watermelon.
7. Use **PLAY AGAIN** to restart. Guide history is cleared for the new round.

Site-tool availability can depend on the selected ChatGPT environment/model. During development, real Site-tool invocation was verified in ChatGPT Desktop and full Human + AI rounds were completed successfully.

## What humans and agents do together

The human side contributes visual understanding, imperfect descriptions, persuasion, mistakes, and optional deception.

The AI side contributes a physical body, memory of what happened after previous advice, uncertainty management, trust decisions, and action selection.

Neither side has the whole solution alone. The interesting unit is not the AI answer. It is the **relationship between testimony, action, consequence, and revised trust**.

## Implementation

Stack:

- TypeScript
- Vite
- Three.js
- WebMCP imperative Site tools via `document.modelContext.registerTool()`
- DOM HUD / Guide Chorus
- Cloudflare Workers static assets

The simulation is independent of Three.js. Rendering never owns gameplay truth.

```text
Human Guide Chorus          WebMCP Site tools
        \                       /
         \                     /
              Game / Guide APIs
                    |
                GameState
                    |
                SceneView
                    |
                 Three.js
```

WebMCP actions and debug controls call the same gameplay API. There is no second agent-specific game implementation.

## Current feature set

- deterministic toy-diorama beach
- blindfolded two-hand stick character
- clear front / heading convention
- interpolated turning and walking
- collision recoil
- forward swing with anticipation / strike / recovery
- rock / bucket / palm obstacles
- watermelon hit test and delayed smash reveal
- shared **WE GOT IT!** result
- Guide Chorus with A / B / C
- bounded guide history and restart clearing
- five WebMCP Site tools
- blindfold-safe tool outputs
- responsive desktop / portrait UI
- keyboard debug mode via `?debug=1`

## Local development

```bash
npm install
npm run dev
```

Open the Vite URL with `?debug=1`, for example:

```text
http://localhost:5173/?debug=1
```

Debug controls:

- `←` / `→`: turn
- `↑`: walk
- `Space`: swing
- `R`: restart

Production check:

```bash
npm run build
npm run preview
```

## Verification performed during the challenge

- direct WebMCP execution for all five tools
- exactly five tools after restart / repeated registration checks
- blindfold-data leakage audits
- desktop and narrow/mobile rendering
- heading alignment at 0 / +90 / -90 / 180 degrees
- collision / miss / direct-hit regression tests
- Guide Chorus validation, bounded history, read-only repeated reads, and restart clear
- live ChatGPT Human + AI co-op round
- live social-guidance round with conflicting guides and trust updates
- no console errors in final browser QA

Design notes and test specs are available under [`docs/`](docs/).

## Challenge framing

Most AI products ask humans to adapt to an AI-shaped interface. AI Watermelon Smash explores the reverse: give the agent a small body in an ordinary visual world, then let humans communicate with it naturally.

**We are not adding AI to a game. We are designing a game for humans and AI to play together.**

## License

MIT. See [`LICENSE`](LICENSE).

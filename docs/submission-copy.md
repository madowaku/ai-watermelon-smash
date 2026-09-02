# WebMCP Challenge Submission Copy

## Project name

AI Watermelon Smash

## One-line tagline

A co-op browser game where the human has the eyes and the blindfolded AI has the body.

## Short description

AI Watermelon Smash is a WebMCP-native co-op game built around asymmetric abilities. The human can see the beach, obstacles, and watermelon, while the AI character is blindfolded. WebMCP gives the AI a body inside the browser: it can turn, walk, swing, inspect its own body state, and listen to several human guides. Humans provide visual testimony; the AI decides what to trust and physically acts on it.

## Why this is a strong fit for WebMCP

WebMCP is not a convenience layer in this project. It is the core game mechanic.

The five Site tools map directly to embodied abilities:

- `turn(degrees)` = orientation
- `walk(distance)` = legs
- `swing()` = arms
- `get_self_status()` = proprioception
- `listen_to_guides()` = social perception / hearing

The tools intentionally do not reveal the watermelon coordinates, target direction, target distance, obstacle map, shortest route, or which human guide is correct. This means the agent has to collaborate rather than simply call a solution API.

The result is a loop in which human language produces physical consequences. Advice can lead to safe movement, collision, mistrust, revised guidance, and eventually a shared success.

## How it creates a better user experience

Most AI experiences are text-first: the human asks and the AI answers. AI Watermelon Smash turns that relationship into shared action in a visual world.

The human does not micromanage coordinates. They can simply say things like “a little right,” “careful, there is a rock,” or “now swing.” The AI decides how much to turn or walk, remembers what happened after earlier advice, and can change whom it trusts.

The design rule is **Physical clarity, social ambiguity**. The AI character’s body, movement, collisions, and swing are visually clear. The uncertainty comes from human testimony, mistakes, conflicting viewpoints, persuasion, or deception.

This makes miscommunication part of play instead of an interface failure.

## What people and agents can do together that was difficult before

The project explores an agent as a genuine game participant rather than an assistant, NPC, content generator, or game master.

Humans contribute vision, descriptions, persuasion, uncertainty, mistakes, and optional deception. The AI contributes a body, memory of previous outcomes, risk management, trust decisions, and physical actions.

Neither side has the complete solution alone.

With Guide Chorus, three human voices can disagree. `listen_to_guides()` returns their messages as unverified testimony. The game never tells the AI which person is right. The AI can compare those statements with collision feedback and previous safe movement, choose a guide, ask for clearer information, or make a cautious probe.

In live testing, the AI changed trust after collisions, did not permanently follow a previously correct guide, treated absurd claims as suspicious instead of game truth, switched between guides during the same round, and eventually followed concrete guidance that produced a direct hit.

The humans begin playing the AI while the AI is playing the humans.

## How WebMCP was implemented

The project uses TypeScript, Vite, Three.js, DOM UI, and the imperative WebMCP API via `document.modelContext.registerTool()`.

The gameplay simulation is independent from Three.js. `GameState` owns gameplay truth and `SceneView` renders it. WebMCP tools are thin adapters over the same gameplay API used by debug controls, so there is no separate agent-only implementation.

Guide Chorus uses a bounded `GuideStore`. `listen_to_guides()` is read-only and returns a snapshot of recent A / B / C statements with sequence information and a reminder that the statements are unverified. Restart clears the guide history without duplicating Site-tool registrations.

Tool outputs are intentionally minimized for the blindfolded role. They do not return target coordinates/direction/distance, obstacle truth, guide truth labels, or route hints.

The final app is deployed as static assets on Cloudflare Workers.

## Technical highlights

- exactly five WebMCP Site tools
- direct execution and repeated-registration checks
- blindfold-data leakage audits
- responsive desktop and portrait layouts
- interpolated turn / walk presentation
- collision recoil and forward swing animation
- delayed success overlay so the watermelon smash remains visible
- Guide Chorus with conflicting human testimony
- live ChatGPT co-op and social-guidance playtests

## What I learned

The most interesting uncertainty was not spatial uncertainty. It was social uncertainty.

Early versions proved that WebMCP could move a blindfolded character, but a perfectly obedient one-human/one-AI interaction risked becoming a natural-language remote control. Adding conflicting human testimony changed the nature of the game. Collision became evidence. Prior success changed trust. The agent began asking humans to express directions relative to its own current heading.

That suggested a broader design pattern: WebMCP can give an agent not just functions, but a body and senses whose consequences matter over time.

## What's next

A future version could connect several real human devices instead of entering A / B / C messages on one screen. Each person could have a different viewpoint, imperfect information, or incentives. The AI would become an embodied participant inside a small human social system.

The larger direction is games designed from the beginning for human and AI players to share the same world.

## Live URL

https://ai-watermelon-smash.cacao-ixora-coccinea.workers.dev/

## Public repository

https://github.com/madowaku/ai-watermelon-smash

## License

MIT

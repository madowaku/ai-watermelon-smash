# AI Watermelon Smash 🍉🤖

A WebMCP Challenge 2026 browser-game experiment: the human can see the watermelon, while the AI controls a blindfolded character.

The goal is not for the AI to solve the game alone. The goal is for a human and an AI to share one visual play space, misunderstand each other, recover, and smash the watermelon together.

## Challenge build

- Runtime: browser
- Stack: TypeScript + Vite + Three.js
- AI control: WebMCP (Day 2)
- Backend: none
- Hosting target: Cloudflare Pages
- License: MIT

Development starts with a deterministic, keyboard-debuggable Day 1 playable. WebMCP control is layered on top only after the game loop works independently.

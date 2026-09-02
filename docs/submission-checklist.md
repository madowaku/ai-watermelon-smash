# Final Submission Checklist

Official deadline: Sep 3, 2026 1:00 PM PDT / Sep 4, 2026 05:00 JST.

## 1. Repository

- [ ] Repository is public: `https://github.com/madowaku/ai-watermelon-smash`
- [ ] `LICENSE` is present and detected as an open-source license
- [ ] README describes the final five-tool build, not an earlier milestone
- [ ] README contains local run instructions
- [ ] README contains the production live URL
- [ ] All source code and required assets are in the repository
- [ ] No private credentials, local paths, or private evidence files are committed
- [ ] `npm install && npm run build` succeeds from a clean checkout
- [ ] `npm audit --omit=dev` has no blocking findings

## 2. Production live app

Production URL:

`https://ai-watermelon-smash.cacao-ixora-coccinea.workers.dev/`

- [ ] Main branch deployment includes Day 4 visual polish
- [ ] App loads without authentication
- [ ] App is free to access for judges through the judging period
- [ ] Desktop presentation is correct
- [ ] Portrait / narrow presentation is usable
- [ ] No console errors
- [ ] ChatGPT in-app browser reports `WebMCP · READY`
- [ ] Exactly five Site tools are visible
- [ ] `turn()` works live
- [ ] `walk()` works live
- [ ] `swing()` works live
- [ ] `get_self_status()` works live
- [ ] `listen_to_guides()` works live
- [ ] Tool outputs do not expose target coordinates, direction, distance, obstacle truth, route hints, or guide truth labels
- [ ] One direct-hit round completes live
- [ ] Smash effect is visible before the success overlay
- [ ] `PLAY AGAIN` clears Guide Chorus history

## 3. Demo video

Official requirement: public YouTube video, audio included, under 3 minutes.

- [ ] Script follows `docs/demo-video-script.md`
- [ ] Final runtime is preferably 2:10–2:30 and definitely under 3:00
- [ ] Video clearly shows the project functioning
- [ ] Video clearly shows real WebMCP / Site-tool use
- [ ] Audio explains what was built
- [ ] Audio explains how WebMCP is used
- [ ] At least one turn / walk action is visibly driven by Site tools
- [ ] `listen_to_guides()` is shown or clearly demonstrated
- [ ] One conflicting-guidance decision is understandable
- [ ] One collision / consequence / trust-update moment is shown if possible
- [ ] Final real `swing()` and watermelon smash are clearly visible
- [ ] `WE GOT IT!` appears after the smash reveal
- [ ] No copyrighted music or unauthorized third-party media
- [ ] No private account information or unrelated tabs are visible
- [ ] Uploaded to YouTube as Public
- [ ] YouTube URL opens while signed out / in a private window

## 4. Devpost text

Use `docs/submission-copy.md` as the source of truth.

- [ ] Project name: AI Watermelon Smash
- [ ] One-line tagline entered
- [ ] Description explains why the use case fits WebMCP
- [ ] Description explains the UX improvement
- [ ] Description explains what humans + agents can do together
- [ ] Description briefly explains implementation
- [ ] Production live URL entered
- [ ] Public GitHub URL entered
- [ ] Public YouTube URL entered
- [ ] All submission materials are in English, or English translation is supplied
- [ ] No claim that the blindfold is cryptographic / technically prevents all page inspection
- [ ] No permanent model-compatibility claim based on development observations

## 5. Final judging smoke test

Run this only after all submission-facing changes are merged to `main` and production finishes deploying.

1. Open production URL in ChatGPT in-app browser.
2. Confirm `WebMCP · READY`.
3. Inspect available Site tools: exactly five.
4. Submit three Guide Chorus messages.
5. Ask ChatGPT to read the guides with Site tools.
6. Invoke at least one `turn` and one `walk`.
7. Finish a round with a real `swing()`.
8. Confirm smash reveal timing and result UI.
9. Press `PLAY AGAIN`.
10. Invoke `listen_to_guides()` and confirm `latestSequence: 0` / empty messages.
11. Refresh once and confirm no tool duplication or console errors.

## 6. Submission safety margin

Do not wait for the last hour.

Recommended order:

1. Merge submission documentation PR.
2. Confirm production deployment.
3. Record the final demo.
4. Upload YouTube video and wait until public processing finishes.
5. Fill Devpost completely.
6. Submit once.
7. Re-open the submitted project page and verify all three external links.
8. Keep the live app unchanged unless a blocking defect is found.

## Definition of DONE

The project is done when a judge can open the Devpost entry, understand the idea without prior context, watch a sub-3-minute public video with audio, open the public repository with an obvious license and run instructions, and open the production URL to test the same five WebMCP tools shown in the video.

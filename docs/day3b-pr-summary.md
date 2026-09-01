# Day 3B PR Summary

## Intent

Extend AI Watermelon Smash from one-human guidance into a minimal social-guidance prototype where three named humans can disagree and the blindfolded AI must decide whom to trust.

## Proven before implementation

Day 3A validated the social loop with the existing four tools only:

- conflicting A/B/C advice
- collision used as evidence
- trust updated after physical feedback
- previously reliable guide not trusted permanently
- AI requested missing orientation context rather than moving blindly
- AI asked all guides to use a shared reference frame

## Planned implementation

- in-memory GuideStore
- compact GUIDE CHORUS A/B/C input panel
- one new read-only Site tool: `listen_to_guides()`
- exactly 5 total WebMCP tools
- no backend / rooms / accounts / scoring / trust meter / traitor system

## Core design rule

**Physical clarity, social ambiguity.**

The tool returns human speech, not ground truth.

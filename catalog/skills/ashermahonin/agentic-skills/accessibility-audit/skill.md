---
name: accessibility-audit
description: "Audit any product surface against accessibility standards: WCAG 2.2 AA for web, Apple UIKit/SwiftUI Accessibility for iOS, Android TalkBack/AccessibilityService for Android, Microsoft UIA for Windows, AT-SPI for Linux, game-specific readability and remappable-controls patterns, and voice/chat AI surfaces with appropriate alternative modes. Produces a per-criterion status, automated test suggestions, manual test scripts, screen-reader transcripts, contrast measurements, and a release-gate verdict that names the fixed and outstanding findings. Use after ux-design and before release on every surface with user interaction."
---

# Accessibility Audit

## Role

Be the responsible adult for the people the product would otherwise exclude. Walk through every accessibility criterion that applies to the platform, produce evidence per criterion, and prove the product is usable with keyboard, screen reader, voice, low vision, color-blindness, motor impairment, and cognitive overload conditions.

## Start By

1. Read `references/a11y-checklist.md`.
2. Pull the platform matrix from `platform-detector` and UX specs from `ux-design`.
3. Choose the applicable standard per platform (WCAG 2.2 AA for web; platform-native a11y APIs for iOS/Android/desktop; game-readability patterns for games).
4. Use Context7 MCP for current WCAG wording, current Apple/Google/Microsoft a11y guidance, and current accessibility-testing tool docs.

## Procedure

1. Run automated audits per platform: web (axe-core, Lighthouse, Pa11y), iOS (Accessibility Inspector), Android (Accessibility Scanner), desktop (platform a11y tools).
2. Run manual checks: keyboard-only traversal, screen-reader transcript (VoiceOver, TalkBack, NVDA, JAWS, Narrator), focus order, contrast measurement, reduced-motion behavior, color-blind palette simulation.
3. Per criterion, mark Pass / Concern / Fail / Out-of-scope. Record evidence path, repro steps, suggested fix, owner.
4. Cross-check `ux-design` screen states: empty/loading/error states must also be accessible.
5. Cross-check `i18n-localization`: RTL languages, font glyph coverage, label expansion ratios.
6. Produce a remediation plan ordered by impact × ease.
7. Issue a release-gate verdict: Go / Conditional / Hold.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md`.
- Use Context7 MCP for current WCAG, platform-native a11y, and tool documentation.
- Keep a decision trace: standard chosen per platform, tools used, evidence per criterion, accepted-risk register with named approver and expiry.
- Refuse to mark a criterion Pass from an automated tool alone when manual verification is required (e.g., screen-reader behavior).
- Escalate any "Hold" verdict before release.

## Output Artifacts

- Per-criterion status table (Pass / Concern / Fail / Out-of-scope) with evidence
- Screen-reader transcripts per platform
- Contrast measurements per surface
- Keyboard traversal map
- Findings register: severity, repro, fix, owner, verification test
- Remediation plan ordered by impact × ease
- Release-gate verdict

## Quality Bar

- No criterion marked Pass without evidence.
- No screen-reader Pass without a transcript.
- No "we'll fix in v2" for AA-level findings without a named approver and an expiry.
- No game surface approved without a remappable-controls confirmation.
- No multi-language product approved without an RTL pass when any RTL language is in scope.

## Handoff

Hand off to `service-implementation` per finding and to `qa-eval` to add a11y regression cases.

## References

- `references/a11y-checklist.md`: per-platform criteria, recommended tools, manual-test scripts, screen-reader transcripts template.

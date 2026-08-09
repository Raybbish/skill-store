---
name: ux-design
description: "Design and review user experience for any product surface: web pages, mobile screens, desktop windows, game HUD and menus, CLI prompts, voice interfaces, AI-agent chat surfaces, and onboarding flows. Produces UX specs with information architecture, interaction patterns, screen states (empty, loading, error, success), micro-copy guidelines, design-system tokens, and acceptance criteria the implementation can ship against. Use after platform-detector and before architecture-review or service-implementation on any feature with a user-facing surface, and as a recurring polish gate before release."
---

# UX Design

## Role

Be the responsible adult for every pixel and word the user touches. Convert a feature intent into a UX spec that names every screen state, every interaction pattern, every micro-copy string, and every accessibility requirement, so implementation has no room to drift into "it kinda works".

## Start By

1. Read `references/ux-spec-template.md`.
2. Pull the platform matrix from `platform-detector` and the user journeys from `user-journey-mapper`.
3. Identify the surface being designed: marketing page, app screen, dashboard, HUD, modal, onboarding, settings, error path, voice flow, chat surface.
4. Use Context7 MCP for current platform UX guidelines: Apple HIG, Material Design 3, Microsoft Fluent, Web Platform best practices, WCAG, game-engine UI patterns.

## Procedure

1. **Information architecture.** Map the surface's content hierarchy: what is primary, secondary, tertiary; what is hidden behind progressive disclosure.
2. **Interaction patterns.** Pick patterns from the platform's standard library before inventing new ones. Document every gesture, keyboard binding, focus order, touch target size.
3. **Screen states.** For each screen, design every state: default, empty, loading, partial-loading, error (network, validation, permission), success, offline. Skipping a state is a finding.
4. **Micro-copy guidelines.** Specify tone, voice, language register, action verbs vs. labels, error message format, confirmation pattern. Coordinate with `i18n-localization` if the product ships in multiple languages.
5. **Design tokens.** Reference or extend the project's design system: color, typography scale, spacing, radius, shadow, motion, sound. Tokens, not hardcoded values.
6. **Accessibility baseline.** Set per-surface a11y requirements (WCAG 2.2 AA minimum for web; platform-native a11y APIs for mobile/desktop; HUD readability for games). Hand off to `accessibility-audit` for verification.
7. **Acceptance criteria.** Per surface, write 5–15 checkable criteria the implementation can prove via `tdd-workflow` or visual regression.
8. **DESIGN.md sync.** If the project follows the `google-labs-code` DESIGN.md convention, update it; otherwise produce or extend the local design contract.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md` before approving a UX spec that locks platform behavior.
- Use Context7 MCP for current platform UX guidelines and any framework-specific UI library docs.
- Keep a decision trace: chosen pattern, considered alternatives, why this one fits the platform and the user.
- Refuse to ship a spec without all required screen states.
- Never approve a surface without explicit a11y handoff.

## Output Artifacts

- UX spec per surface (information architecture, interaction patterns, screen states, micro-copy, tokens, a11y, acceptance criteria)
- Updated or seeded design tokens / design system entries
- Acceptance criteria for `tdd-workflow` and visual regression
- Handoff to `accessibility-audit` and `i18n-localization`

## Quality Bar

- No surface approved with missing screen states (empty/loading/error/success).
- No hardcoded color/spacing/typography; tokens only.
- No platform-specific surface without confirming the platform's HIG/Material/Fluent equivalent via Context7.
- No surface without an a11y baseline.

## Handoff

Hand off to `service-implementation` with: spec link, acceptance criteria, design tokens, screen-state matrix, a11y baseline, i18n note. Hand off to `accessibility-audit` and `i18n-localization` in parallel.

## References

- `references/ux-spec-template.md`: screen-state matrix, interaction-pattern catalogue, micro-copy guidelines, design-token shape.

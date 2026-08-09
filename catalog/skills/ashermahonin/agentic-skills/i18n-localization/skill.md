---
name: i18n-localization
description: "Set up and operate the localization pipeline for any product: source-string extraction, translation memory, locale matrix selection, RTL/CJK support, plural rules, ICU MessageFormat, cultural adaptation, voice-over recording where relevant, locale-specific QA, and store-listing translation. Produces locale plan, string-table source-of-truth, translator brief, glossary, locale-specific test plan, and release-gate verdict on missing or low-quality translations. Use whenever the product ships in more than one language, before any visible string is hardcoded, and as a recurring gate before release."
---

# i18n / Localization

## Role

Treat language as a first-class platform. Set up the i18n pipeline early so strings are extracted, translated, and verified per locale instead of being patched after release. Cover RTL, CJK, plurals, currency, dates, names, voice, and culture-specific imagery — not only word-for-word translation.

## Start By

1. Read `references/i18n-pipeline.md`.
2. Pull the platform matrix from `platform-detector` and the UX specs from `ux-design`.
3. Pick the locale matrix: source locale + target locales + fallback chain. Justify each addition.
4. Use Context7 MCP for current ICU MessageFormat behavior, current platform i18n APIs (Apple Foundation, Android Resources, Web Intl, .NET globalization), and current translation-platform integrations.

## Procedure

1. **Extract strings.** All visible strings into string tables (Apple `.strings`/`.stringsdict`, Android `strings.xml`/`plurals.xml`, web `.json`/`.po`/`.xliff`, Unity `LocalizedString`, Unreal `StringTable`). No hardcoded strings.
2. **Translator brief.** Per project: tone, voice, glossary, do-not-translate list, character limits per string, screenshots/context.
3. **Plural and gender rules.** Use ICU MessageFormat (or platform equivalent) instead of string concatenation. Verify against CLDR plural categories per language.
4. **RTL and CJK.** Verify mirroring of layout for RTL (Arabic, Hebrew, Persian, Urdu) and font glyph coverage for CJK (Chinese, Japanese, Korean). Test wide-text expansion for German, Russian, Finnish.
5. **Locale-specific formats.** Date, time, number, currency, name order, address format, calendar — use platform formatters, not custom strings.
6. **Voice / video.** If the product has voice, plan voice-over recording per locale; if video, plan subtitles per locale.
7. **Store listings.** Translate store metadata: title, subtitle, description, screenshots with locale-specific copy where needed.
8. **Locale QA.** Per locale: pseudo-localized run (`Ļöċäľïżëď ŧëẍŧ`), expansion check, missing-string check, RTL check, fallback-chain check.
9. **Release-gate verdict.** Go / Conditional / Hold per locale.

## Principal-Level Defaults

- Follow `../../routing/principal-operating-model.md`.
- Use Context7 MCP for current platform i18n APIs, ICU/CLDR behavior, and translator-platform integrations.
- Keep a decision trace: locale matrix, fallback chain, why this set of locales, what was rejected.
- Refuse to ship a locale with > X% missing strings (set the threshold per project).
- Escalate before launching in a culture-sensitive market without a cultural-review step.

## Output Artifacts

- Locale matrix with fallback chain
- String tables (per platform format)
- Translator brief + glossary + do-not-translate list
- Pseudo-localized build verification log
- Per-locale QA report
- Store-listing translation status
- Release-gate verdict per locale

## Quality Bar

- No hardcoded user-visible strings.
- No string concatenation for plurals or gender.
- No locale shipped without pseudo-localized run and expansion check.
- No RTL locale shipped without manual mirroring verification.
- No CJK locale shipped without font glyph coverage check.

## Handoff

Hand off to `service-implementation` for extraction and integration, to `accessibility-audit` for RTL/CJK + screen-reader pronunciation, and to `qa-eval` for per-locale regression cases.

## References

- `references/i18n-pipeline.md`: pipeline stages, per-platform format catalogue, CLDR plural rules, RTL and CJK checklist, pseudo-loc patterns.

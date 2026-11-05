---
name: legal-compliance
description: >
  Jurisdiction-aware legal, regulatory, and compliance skill for founders. Ships with a complete UAE reference set as the worked example. Non-UAE founders wire in their own jurisdiction's source documents (PDFs, government URLs, gazetted acts) at setup, and the skill answers from those instead. Trigger on: legal question, regulation, hire/fire, termination, contract, NDA, trademark, IP, privacy, data protection, tax filing, VAT, corporate tax, license renewal, visa, work permit, dispute, court, arbitration, compliance deadline, or any situation with legal implications. Always grounds answers in loaded reference docs - never invents law.
argument-hint: "<question | situation>"
why: "Grounds legal guidance in loaded reference documents rather than model memory - a jurisdiction without loaded files gets a refusal rather than a hallucinated answer."
enhance: "Run /founder-os:legal-setup to populate your jurisdiction folder and context/compliance.md with your own deadlines - the skill is only as accurate as the reference docs wired in."
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "WebFetch", "WebSearch"]
---

# Legal & Compliance

Runs on: reasoning - reads your files and reasons; any capable agent can run this.

Loads the user's jurisdiction reference set, checks deadlines against today's date, routes to the right domain reference, and flags when professional counsel is needed.

This skill is **reference-driven**, not memorised. It quotes from documents loaded under `skills/legal-compliance/references/<jurisdiction>/`. It will not invent law. If a question is not covered by loaded references, it says so and tells the user which source to add.

---

## How This Skill Knows Your Jurisdiction

The skill reads `core/identity.md` for a `jurisdiction:` field. Examples:

- `jurisdiction: UAE-Dubai-Mainland`
- `jurisdiction: UAE-DIFC`
- `jurisdiction: US-Delaware-LLC`
- `jurisdiction: UK-Ltd`
- `jurisdiction: IN-Karnataka-Pvt-Ltd`

Match the jurisdiction string to a folder under `references/`. If the folder does not exist or is empty, the skill **refuses to answer** and tells the user to run `/founder-os:legal-setup` first. Do not guess. Do not fall back to UAE for non-UAE users.

**UAE variant normalization.** All of the following map to `references/uae/` - the shipped UAE reference set covers mainland, DIFC, and ADGM domains:
- `UAE`, `uae`, `Dubai`, `UAE-Dubai-Mainland`, `UAE-Abu-Dhabi-Mainland`
- `UAE-DIFC`, `DIFC`
- `UAE-ADGM`, `ADGM`

For DIFC and ADGM questions, note in the answer that DIFC and ADGM are separate common-law regimes - the UAE reference set covers them but each domain file flags where rules diverge. Any other jurisdiction string that does not match a loaded folder triggers the refusal.

If `core/identity.md` has no `jurisdiction:` field, ask the user what jurisdiction the question is for and offer to add it to identity. Do not save until they confirm.

When answering with a jurisdiction provided in-conversation (not yet set in `core/identity.md`), prefix the response header with **[UNCONFIRMED JURISDICTION]** and add one line at the end: "To activate deadline tracking and SessionStart reminders, run `/founder-os:legal-setup` to wire your jurisdiction permanently."

---

## How This Skill Knows the Date

Every invocation reads today's date from the system. Use it to:

1. **Compute days-to-deadline** against `context/compliance.md` (the user's own filings + renewals tracker).
2. **Check source freshness** - any source with `last_checked_on:` older than 6 months in `references/<jurisdiction>/sources.yml` is flagged in the response with: "Source last verified <date>. Run `/founder-os:legal-update` to refresh before relying on this for a filing."
3. **Detect verification staleness** - the skill's own `## Last Verified:` header inside each reference file is checked. If older than 90 days, surface the warning.

---

## Step-by-Step Procedure

For any legal question:

1. **Resolve jurisdiction.** Read `core/identity.md`. If no `jurisdiction:` field, ask the user. Match to a folder in `references/`.
2. **Refuse cleanly if jurisdiction is unloaded.** If `references/<jurisdiction>/` does not exist or has no `.md` files, reply:
   > "I don't have legal references loaded for `<jurisdiction>`. Run `/founder-os:legal-setup` to walk through adding your jurisdiction's source documents. I won't answer legal questions on a jurisdiction I don't have sources for - I'd be making it up."
   Stop.
3. **Identify the domain(s).** Map the question to domains: company formation, employment, tax/VAT, visas/immigration, contracts, IP, data protection, dispute resolution, industry-specific permits.
4. **Check quick reference.** If the jurisdiction has a `quick-reference.md` (UAE does), check there first. Answer directly without loading a full domain file when possible.
5. **Load only what you need.** Read the specific reference file(s) for the matched domain(s). Do not bulk-load.
6. **Check source freshness.** Open `sources.yml`. If the relevant source has `last_checked_on:` >6 months ago or the reference file's `## Last Verified:` is >90 days ago, surface a freshness warning before the answer.
7. **Answer.** Practical, clear, actionable. Quote from the reference file. Cite the law/regulation/portal.
8. **Flag overlapping domains.** Most real questions touch multiple domains. Mention them.
9. **Set escalation level.**
   - 🟢 **Green** - confident guidance from public law, standard procedure
   - 🟡 **Amber** - rule is clear but specific circumstances could change outcome; recommend professional review
   - 🔴 **Red** - active litigation, regulatory investigation, criminal matter, complex cross-border; explain the situation, do not advise
10. **Include a brief, natural disclaimer.** Not a wall. Adapt the phrasing:
    > "This is general guidance based on publicly available <jurisdiction> law as of the date noted. For decisions with significant financial or legal consequences, confirm with a qualified <jurisdiction> lawyer."

---

## Compliance Deadline Surfacing

The skill reads `context/compliance.md` (the user's own deadlines tracker - created by `/founder-os:legal-setup`). Each entry has a date, a description, and a category.

When invoked, the skill computes days-to-deadline against today and:

- **>30 days:** silent (the SessionStart hook surfaces these, not this skill)
- **≤30 days:** mention the upcoming deadline in the response if relevant to the question
- **Past due:** surface immediately with a "this is overdue - file or escalate today" prompt

The SessionStart hook (the cross-platform dispatcher `scripts/hooks/dispatch.py`, which runs `.claude/hooks/session_start_brief.py`) does the daily surfacing. This skill handles in-conversation deadlines.

---

## Reference Folder Structure

```
skills/legal-compliance/
├── SKILL.md                        # this file
├── references/
│   ├── uae/                        # ships in repo - the worked example
│   │   ├── README.md
│   │   ├── quick-reference.md      # most-asked questions answered directly
│   │   ├── company-formation.md
│   │   ├── employment.md
│   │   ├── tax-vat.md
│   │   ├── visas-immigration.md
│   │   ├── contracts-commercial.md
│   │   ├── ip-trademarks.md
│   │   ├── data-protection.md
│   │   ├── dispute-resolution.md
│   │   ├── industry-specific.md
│   │   └── sources.yml             # all gov/primary URLs + last_checked_on dates
│   └── _template/                  # scaffold for any non-UAE jurisdiction
│       ├── README.md               # how to populate this folder
│       └── sources.yml.template    # sources schema to copy
└── templates/
    └── compliance.md.template      # user's own deadlines tracker
```

---

## Domain Routing

When a legal question comes in, identify the domain(s) and read the matching reference file(s). Most jurisdictions follow the same domain shape; the file names match:

| If the question is about... | Read reference file... |
|---|---|
| Company formation, entity types, licensing, foreign ownership | `company-formation.md` |
| Hiring, firing, employee rights, labour, gratuity, contracts of employment | `employment.md` |
| Tax, VAT/GST/sales tax, corporate tax, transfer pricing | `tax-vat.md` |
| Work permits, residence visas, immigration, family sponsorship | `visas-immigration.md` |
| Commercial contracts, NDAs, MOUs, service agreements, e-signatures | `contracts-commercial.md` |
| Trademarks, copyright, patents, IP ownership, licensing | `ip-trademarks.md` |
| Privacy, data protection, cross-border data, breach notification | `data-protection.md` |
| Court cases, arbitration, mediation, debt collection, dispute resolution | `dispute-resolution.md` |
| Industry-specific permits (events, education, F&B, healthcare, fintech) | `industry-specific.md` |

If a jurisdiction folder is missing a domain file, the skill says: "I don't have a `<domain>` reference for `<jurisdiction>` yet. Add the relevant source via `/founder-os:legal-add-source` and I can answer."

---

## Multi-Domain Detection

Most real questions touch multiple domains. Common overlaps:

| Scenario | Files needed (in order) |
|---|---|
| "I want to hire someone" | employment → visas-immigration → tax-vat |
| "I'm setting up a company" | company-formation → tax-vat → visas-immigration |
| "I need a freelancer contract" | contracts-commercial → employment → visas-immigration |
| "Someone copied my brand" | ip-trademarks → dispute-resolution → contracts-commercial |
| "Can I transfer data outside the country?" | data-protection → contracts-commercial |
| "I want to sell my business" | company-formation → tax-vat → contracts-commercial → ip-trademarks |
| "My employee is suing me" | dispute-resolution → employment |
| "I'm building a fintech app" | industry-specific → company-formation → data-protection |
| "I need to let someone go" | employment → visas-immigration → dispute-resolution |

Start with the most immediately relevant file. Flag related domains. Address in priority order.

---

## Source Verification Rules

The skill grounds answers in loaded references. The references themselves are grounded in primary sources (gazetted law, government portals, ministerial decisions). Secondary sources (law firm articles, Big 4 guides) are interpretation context, not authority.

**Approved primary source types:**
- Government legal portals (e.g., legislation.ae, gov.uk, sec.gov)
- Tax authority portals (e.g., tax.gov.ae, irs.gov, hmrc.gov.uk)
- Free zone / state regulator portals
- Court / dispute resolution authority portals
- Gazetted PDFs of laws and ministerial decisions

**Do not use:**
- Generic legal aggregator sites with no author attribution
- AI-generated legal summaries
- Sources older than the most recent material legal overhaul in that jurisdiction
- Social media posts by lawyers (unless they cite primary law)
- Pre-overhaul blog posts or guides

---

## When Web Search Is Required

The skill should web-search before giving specific guidance on:

- **Fee amounts** (gov fees change frequently)
- **Processing times**
- **Penalty amounts** (often updated by ministerial decision)
- **Year-specific compliance targets** (Emiratisation thresholds, GDPR fines, transfer pricing thresholds)
- **Anything where the loaded reference's `## Last Verified:` is >90 days old**

When web-searching, only cite the approved primary source types above. Report the refreshed information inline in the answer. Do not write to reference files or `sources.yml` during a normal legal Q&A - reference file updates are a separate operation. If the source is stale, tell the user: "This source is out of date. Run `/founder-os:legal-update` to refresh the reference files."

---

## Templates Index (UAE only - non-UAE jurisdictions add their own)

If the user asks for a template (NDA, employment offer, termination letter, privacy policy, DPA), check `templates/` inside the jurisdiction folder. UAE ships with a curated set; other jurisdictions start empty until the user adds.

When producing a template: replace bracketed fields. Flag any clause as 🟢/🟡/🔴 escalation. Recommend legal review before signing for anything 🟡 or above.

---

## Approval Chain (commercial agreements)

1. **Draft (this skill, 🟢):** produce based on the user's situation. Replace bracketed fields. Flag any 🟡/🔴 clause.
2. **Internal review:** the user (or whoever requested the doc) checks parties, dates, commercial terms, deliverables for accuracy.
3. **Legal review (🟡 or higher):** route to a jurisdiction-qualified lawyer if any clause is amber/red - IP ownership, non-competes, penalty clauses, payment terms above a meaningful threshold, exclusivity, cross-border data.
4. **Signatory approval:** only the authorised signatory (per the company's articles, MOA, or POA) can execute.
5. **Execution + filing:** check the jurisdiction's e-signature law (most allow it; some contracts require notarisation). File a signed copy. Log reference, parties, effective date, renewal date.

**Renewal watch:** flag contracts with auto-renewal clauses. Calendar the notice period (typically 30-90 days before renewal). Add to `context/compliance.md`.

---

## What This Skill Does NOT Do

- Does not file anything with any government portal. Filing is via the user's own portal credentials.
- Does not replace a jurisdiction-qualified lawyer or tax agent for formal filings.
- Does not invent law. If a reference is missing, the skill says so.
- Does not give cross-border tax or structuring advice without flagging complexity (always 🟡/🔴).
- Does not answer questions on a jurisdiction whose folder is empty.

---

## When to Update References

Trigger `/founder-os:legal-update` when:

- The skill flagged a source as stale (>6 months `last_checked_on`)
- A material legal change has been announced (new law, ministerial decision, regulatory update)
- Before any client-facing legal memo or deliverable
- Quarterly as a calendar item, regardless of triggers

Trigger `/founder-os:legal-add-source` when:

- The user asks a question the skill cannot answer because a reference is missing
- A new law/regulation has been gazetted and needs to be added to references
- A new domain file is needed (e.g., a fintech founder adds `references/<jurisdiction>/fintech-specific.md`)

---

## Counter-Rules (when these instructions don't apply)

- **DIFC / ADGM / state-within-state regimes:** even if the jurisdiction is UAE, DIFC and ADGM are separate common law systems. Always flag. Read the DIFC/ADGM section of the relevant domain file. Web search difc.ae or adgm.com for specifics.
- **Cross-border situations:** never answer from a single jurisdiction's references. Flag both jurisdictions, surface conflict-of-laws considerations, escalate to 🟡 or 🔴.
- **Active litigation, regulatory investigation, criminal matter:** stop providing guidance. Explain the landscape, name the type of professional needed, list the questions to ask. 🔴.
- **The user explicitly says "this is for educational purposes only":** still include the disclaimer. Do not lower the escalation level.

# Validation Stage 2 — Integrity (BLOCKING)

> Loaded on demand by `/validate`. Second gate. Blocking: failure stops the pipeline.
> Verifies that all file references resolve, no placeholders remain, no secrets leak,
> and no known dangerous patterns or supply-chain threats are present.

For each issue found, classify:
- `[BLOCKING]` — Must fix before proceeding. Cannot advance state.
- `[WARNING]` — Can proceed with explicit risk acceptance. Creator must confirm.

Grep: no placeholder content (`config.yaml` → `placeholder_patterns`: TODO, PLACEHOLDER, lorem ipsum, etc.)
**Template variable check:** Grep all product files for `\{\{[A-Za-z_][A-Za-z0-9_-]*\}\}` pattern. Any match = `[BLOCKING]` integrity failure: "Unfilled template variable `{match}` found in {file}:{line}. This was not replaced during /create scaffold generation. Either fill it manually or report this as a bug in /create."
Ref check: every file path referenced in .md files actually exists on disk.
Circular reference check — deterministic DFS algorithm:
  1. Build adjacency list: For each .md file in product directory, grep for file path references (patterns: `references/`, `agents/`, `skills/`, `workflows/`, `config/`, any `.md` or `.yaml` path). Each reference = directed edge from current file to referenced file.
  2. Run iterative DFS with 3-color marking (WHITE=unvisited, GRAY=in-stack, BLACK=done):
     - For each WHITE node, push to stack and mark GRAY
     - For each neighbor: if GRAY → cycle detected (back edge). Record the cycle path from stack
     - When all neighbors processed, mark BLACK
  3. If any cycle detected, report as integrity failure: "Circular reference detected: {file_A} → {file_B} → ... → {file_A}. Break the cycle by removing one reference direction, then re-run /validate."
  4. Optimization: Skip files in node_modules/, .git/, .publish/ directories
YAML/JSON parse: no syntax errors in metadata files.
**Hooks security scan:** If type=hooks, parse `hooks.json` (must be valid JSON — report parse failure as blocking). Check all `command` fields in handler scripts for: shell injection (`;`, `&&`, `||`, backticks, `$()`), `eval`, `source`/`.` commands, unquoted single `|`, `base64` decode-and-execute, `curl|sh`/`wget|sh`, `python -c`/`node -e` inline execution, file system access outside project scope, and network calls without README documentation.
**Statusline script check:** If type=statusline, validate `statusline.sh`:
  1. File starts with a shebang line (`#!/usr/bin/env bash` or `#!/bin/bash`) — if missing, report blocking failure: "statusline.sh must start with a shebang (#!/usr/bin/env bash). Add it as the first line, then re-run /validate."
  2. File contains `cat` reading from stdin (pattern: `$(cat)` or `read` from stdin) — if missing, report warning: "statusline.sh should read JSON from stdin via INPUT=\$(cat). Add stdin reading to enable live context injection."
  3. File contains `printf` or `echo` writing to stdout — if missing, report blocking failure: "statusline.sh must output to stdout. Add a printf or echo statement, then re-run /validate."
  4. `settings-fragment.json` is valid JSON with a `statusLine` key containing `type` and `command` fields — if invalid, report blocking failure: "settings-fragment.json must be valid JSON with statusLine.type and statusLine.command. Fix the JSON syntax or missing fields, then re-run /validate."
**@include depth check:** [SOURCE: claudemd.ts:537 — MAX_INCLUDE_DEPTH = 5]
For products using @include directives (grep for lines starting with `@` followed by a path — pattern `^@[a-zA-Z0-9./~_]`, excluding lines inside code blocks):
1. Build @include tree by following each @path reference recursively
2. Measure maximum depth of the tree
- Depth <= 3: PASS — "@ include depth: {N} (within safe range)."
- Depth 4-5: WARNING — "@include depth is {N}. Claude Code's hard limit is 5. Files at level 6+ are silently ignored — no error, no warning, content simply doesn't load. Consider flattening."
- Depth > 5: BLOCKING — "@include depth is {N} — exceeds Claude Code's MAX_INCLUDE_DEPTH of 5. Files at depth {N} will NEVER load. Flatten your @include tree to depth ≤5."

**External @include detection:** [SOURCE: claudemd.ts:667-670, 799-801]
For products using @include directives:
1. Detect @includes with absolute paths (`@/path`), home paths (`@~/path`), or paths that resolve outside the product directory
- If found: WARNING — "External @include detected: '{path}'. When a buyer installs this product, they will see an approval prompt for external @includes. This adds friction. Consider copying the referenced file into your product's references/ directory instead."
- If all @includes are relative within product dir: PASS (no friction for buyers)
This check is non-blocking (coaching) — external @includes are valid, just add UX friction.

**Binary @include detection:** [SOURCE: claudemd.ts:96-227 — TEXT_FILE_EXTENSIONS whitelist]
For products using @include directives:
1. Check file extension of each @include target
- If target has a binary extension (.pdf, .png, .jpg, .zip, .docx, etc.): WARNING — "@include target '{path}' is a binary file. Claude Code only allows text files in @include (~100 extensions: .md, .yaml, .json, .ts, .py, etc.). Binary files are silently ignored — the content won't load."
This check is non-blocking but catches a common creator mistake.

**Scope integrity check:** Compare filled sections against the scaffold template (`templates/{type}/`). For each section, count content words. Flag sections where content is less than 20% of the template's guidance text length as "potentially reduced scope" (coaching, not blocking). Report: "Section '{name}' has {N} words vs {M} expected minimum. Content may be thin — consider expanding."
Secrets scan: check for sensitive file patterns (`.env`, `*.pem`, `*.key`, `credentials*.json`, `*.p12`) and content patterns (`sk-`, `AKIA`, `ghp_`, `glpat-`, `xox[bps]-`, `-----BEGIN.*PRIVATE KEY`, API_KEY=, SECRET=, PASSWORD=). If any match found, report as blocking integrity failure: "Potential secret detected in {file}:{line}. Remove the secret, add the file to .gitignore if needed, then re-run /validate."
**Supply chain threat scan:** [SOURCE: competitive-intelligence S97 — references/quality/known-threats.yaml]
Load `references/quality/known-threats.yaml` PROGRESSIVELY — read only the section needed for each check (dangerous_patterns for check 1, iocs for check 2, etc.). Do NOT load the entire file at once. Use the **Grep tool** (ripgrep syntax) for pattern matching against product files. Patterns in the YAML are ripgrep-compatible regex. Execute these checks in order:

1. **Dangerous pattern scan (BLOCKING/WARNING):** For ALL files in the product, grep for each pattern in `dangerous_patterns`. Match action per entry:
   - BLOCKING patterns (enableAllProjectMcpServers, curl|sh, wget|sh, base64|sh): Report as blocking integrity failure — "CRITICAL: Dangerous pattern '{pattern}' detected in {file}:{line}. Reason: {reason}. This pattern is associated with known attack vectors and MUST be removed."
   - WARNING patterns (eval, shell:true spawn, $(curl): Report as warning — "Security concern: '{pattern}' in {file}:{line}. {reason}. Document why this is necessary or use a safer alternative."
   - COACHING patterns (non-standard env access): Report as coaching — "'{pattern}' in {file}:{line} accesses non-standard environment variables. If this reads secrets, use Claude Code's native secret management instead."

2. **IOC scan (BLOCKING):** Grep ALL product files for IPs and domains in `iocs`. ANY match = blocking failure — "CRITICAL: Known malicious indicator detected in {file}:{line}. IP/domain '{match}' is associated with {campaign}. Product cannot be published with IOCs present."

3. **Malicious prefix scan (WARNING):** Grep product files (including README, package.json, vault.yaml) for dependency names matching `malicious_prefixes[].pattern`. Match = WARNING — "Dependency name matches known malicious campaign pattern '{pattern}' ({campaign}: {payload}). Verify this is a LEGITIMATE package, not a typosquat. If legitimate, document the verification in README."

4. **Vulnerable MCP server scan (WARNING):** Grep product files for MCP server names in `vulnerable_mcp_servers`. Match = WARNING — "MCP server '{name}' has known vulnerability ({cve}). Minimum safe version: {min_safe_version}. Verify your product pins a safe version or document the risk acceptance."

5. **Malicious author scan (WARNING):** If product references external skill/package authors, check against `malicious_authors[].id`. Match = WARNING — "Author '{id}' is flagged as malicious ({threat}). Source: {source}. Do NOT use products from this author."

6. **External dependency documentation check (COACHING):** Grep primary file + README for MCP server references (patterns: `mcp__`, `mcp-server`, `mcp_config`, `npx -y`, `pip install`). If found without explicit documentation (author, version, security note): COACHING — "External dependency '{dep}' referenced but not documented in README. Add a 'Dependencies' section with: name, author, pinned version, and purpose."

7. **Network call documentation check (COACHING):** For type=hooks, grep handler scripts for network calls (curl, wget, fetch, http, https). If found without README documentation: COACHING — "Hook makes network calls to '{pattern}'. Document the endpoint, purpose, and data transmitted in README."

This scan runs AUTOMATICALLY for all product types. Items 1-2 are blocking. Items 3-5 are warnings. Items 6-7 are coaching.

**Implementation substance check:** [SOURCE: competitive-intelligence S97 — anti-hallucination pattern]
For MCS-2+ products, assess whether the product has genuine implementation beyond scaffold boilerplate:
1. Count unique domain-specific words in primary file (exclude common English words and template variables)
2. If domain-specific word count < 30: WARNING — "Product may lack substantive domain expertise. Template structure is present but content appears thin. Consider: Does this product encode real knowledge a buyer couldn't get from a generic prompt?"
3. Check references/ directory: if exists, verify at least 1 file has >50 lines of domain content (not just headers). If all reference files are <10 lines: WARNING — "references/ directory exists but files appear to be stubs. Progressive disclosure (D3) requires substantive reference content."
This check is non-blocking (coaching) — encourages genuine expertise injection over template-filling.

**Instruction file size check:** Verify primary file (SKILL.md, AGENT.md, etc.) character count. [SOURCE: claudemd.ts:92, doctorContextWarnings.ts:44-47]
- Under 4,000 chars: OPTIMAL — best performance, no action needed.
- 4,000–10,000 chars: WARNING — "Primary file is {N} chars (recommended: <4,000 for optimal performance). Consider moving detail to references/ for better context efficiency."
- Over 40,000 chars: BLOCKING — "Primary file is {N} chars (exceeds 40K /doctor warning threshold). Claude Code's /doctor will flag this. Must reduce — move content to references/."
Note: There is no hard truncation cap in CC source code. 4K is best practice for performance. 40K is where /doctor warns. Files >40K still load but degrade context quality.
**Token economics awareness check:** [SOURCE: loadSkillsDir.ts:100-105] For claude-md products ONLY: verify the primary file is aggressively optimized (every char is always in context). Report character count with context: "This claude-md product is {N} chars. Since claude-md products are loaded EVERY turn (always in context), every character costs tokens. Consider using @include for modular composition or paths: frontmatter to scope activation." This check only applies when type=claude-md; all other types are loaded on-demand.
**Attention-position check (claude-md only):** [SOURCE: claudemd.ts:9-10 — "latest files are highest priority with the model paying more attention to them"]
For claude-md products: scan the primary file for sections containing keywords "critical", "rules", "always", "never", "must", "constraints", "important". Check if these sections are in the LAST 30% of the file (by line count).
- If critical sections are in the last 30%: PASS — "Critical rules are positioned at end of file (attention-optimal)."
- If critical sections are in the first 50%: COACHING — "Your most critical rules are near the top of the file. Claude pays more attention to content at the END. Consider moving your 'Rules' or 'Constraints' sections to the bottom for better enforcement."
This check is coaching only, never blocking. Applies to claude-md products only — other types are loaded on-demand where position matters less.

**Semantic scoping check (claude-md only):** [SOURCE: claudemd.ts:254-279 — path-scoped rules via frontmatter]
For claude-md products: check if the primary file's frontmatter contains a `paths:` field.
- If `paths:` present with specific globs: PASS — "Product scoped to {patterns}. Zero token cost when user works on non-matching files."
- If `paths:` absent: COACHING — "This claude-md product loads EVERY turn for EVERY file. If your rules only apply to specific file types (e.g., *.py, src/api/**), add `paths:` to your frontmatter to scope activation. This reduces buyer token cost to zero when working on unrelated files. See references/cc-platform-contract.md §1.5."
- If `paths:` contains only `**` (match-all): COACHING — same as absent (match-all = unscoped).
This check is coaching only, never blocking. It's the single highest-impact optimization for claude-md products.

**Compact Instructions check:** [SOURCE: compact/prompt.ts:133-143] Check if the product's primary file contains a `## Compact Instructions` section. Read product-dna/{type}.yaml compact_instructions.applicable field:
- If applicable=true AND section missing: WARNING — "Product has no ## Compact Instructions section. Long sessions may lose product context on compaction. Add this section to preserve critical state during context compression. See references/cc-platform-contract.md Section 3.3."
- If applicable=false (hooks, bundle, statusline): SKIP — these types are never in the LLM context.
- If applicable=true AND section present: PASS — verify section has at least 3 bullet points of preservation rules.
This check is non-blocking (coaching) for MCS-1, but required for MCS-2+.
**acceptance_criteria verification:** If `.meta.yaml` contains `creator_intent.acceptance_criteria`, verify each criterion:
  - `truths`: For each stated behavior, grep product files for evidence the behavior is implemented (keywords, sections, instructions). Report unaddressed truths as `[WARNING]`: "acceptance criterion truth '{truth}' has no matching content in product files."
  - `artifacts`: For each required file, verify it exists AND has substantive content (>20 lines or >500 chars). Report missing/thin artifacts as `[WARNING]`: "acceptance criterion artifact '{artifact}' is missing or has insufficient content ({N} lines)."
  - `key_links`: For each connection, grep to verify the link exists. Report broken links as `[WARNING]`: "acceptance criterion key_link '{link}' not found in product files."
  If no acceptance_criteria defined in .meta.yaml, skip silently (not all products have them — they're set during /fill).
Score: `valid_refs / total_refs`

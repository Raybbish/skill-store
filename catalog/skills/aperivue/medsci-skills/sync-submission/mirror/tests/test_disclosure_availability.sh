#!/usr/bin/env bash
# Regression/challenge test for check_disclosure_availability.py — deterministic,
# network-free, synthetic fixtures built at runtime.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/../scripts/check_disclosure_availability.py"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0
fail=0
ck() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    printf '  PASS  %-52s exit=%s\n' "$label" "$actual"
    pass=$((pass + 1))
  else
    printf '  FAIL  %-52s expected=%s actual=%s\n' "$label" "$expected" "$actual"
    fail=$((fail + 1))
  fi
}
run() { python3 "$SCRIPT" --out "$TMP/r.json" "$@" > /dev/null 2>&1; echo $?; }

# A complete, conformant manuscript tail.
cat > "$TMP/good.md" <<'EOF'
## AI use disclosure
During preparation the authors used Claude 3.5 (Anthropic) via the API in 2026 for
language editing; all output was reviewed by the authors.

## Data Availability
The dataset is available at https://doi.org/10.5281/zenodo.123456.

## Code Availability
Analysis code is at https://github.com/example/repo.

## Funding
Supported by a institutional grant.

## Competing Interests
The authors declare no competing interests.
EOF
ck "complete statements (ai-study) -> clean" 0 "$(run --manuscript "$TMP/good.md" --journal radiology --ai-study --strict)"

# AI disclosure missing the date + responsible-party tokens -> BLOCKER
cat > "$TMP/ai_bad.md" <<'EOF'
## AI use disclosure
The authors used ChatGPT via the web interface.

## Data Availability
Available at https://github.com/example/repo.

## Code Availability
https://github.com/example/repo

## Funding
None.

## Competing Interests
None.
EOF
ck "AI disclosure missing tokens -> blocker" 1 "$(run --manuscript "$TMP/ai_bad.md" --journal radiology --ai-study --strict)"

# AI disclosure with a placeholder -> BLOCKER
cat > "$TMP/ai_ph.md" <<'EOF'
## AI use disclosure
The authors used Claude [version] via the API in 2026; reviewed by the authors.

## Data Availability
https://doi.org/10.5281/zenodo.1

## Funding
None.

## Competing Interests
None.
EOF
ck "AI disclosure placeholder -> blocker" 1 "$(run --manuscript "$TMP/ai_ph.md" --journal npj-digital-medicine --strict)"

# Missing Data Availability on a journal that requires it -> BLOCKER
cat > "$TMP/no_data.md" <<'EOF'
## Funding
None.

## Competing Interests
None.
EOF
ck "missing Data Availability (required journal) -> blocker" 1 "$(run --manuscript "$TMP/no_data.md" --journal radiology)"

# Hollow 'on reasonable request' where a repository is expected -> advisory (exit 0 w/o --strict)
cat > "$TMP/hollow.md" <<'EOF'
## Data Availability
The data are available from the corresponding author on reasonable request.

## Funding
None.

## Competing Interests
None.
EOF
ck "hollow data statement -> advisory (no --strict)" 0 "$(run --manuscript "$TMP/hollow.md" --journal radiology)"
ck "hollow data statement -> blocker under --strict" 1 "$(run --manuscript "$TMP/hollow.md" --journal radiology --strict)"

# No AI tool mentioned at all -> AI disclosure not required (clean if others present)
ck "no AI mention -> no ai-disclosure finding" 0 "$(run --manuscript "$TMP/good.md" --journal lancet-digital-health --strict)"

echo "----"
echo "test_disclosure_availability: $pass passed, $fail failed"
[ "$fail" -eq 0 ]

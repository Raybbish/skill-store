---
name: doc-implement
description: Transforms documentation based on review suggestions. Rewrites for different audience levels (adjusts tone/vocabulary/complexity), validates Zensical formatting, syncs Python docstrings, validates internal links/assets, applies structural improvements. Includes diff preview and validation. Works on individual files or entire documentation trees. USE FOR: rewrite docs for target audience, update Zensical metadata, sync docstrings with code, fix internal links/assets, improve documentation structure. DO NOT USE FOR: major documentation rewrites, writing new docs from scratch, external link fixes.
license: MIT
compatibility: opencode
metadata:
  target_agent: documentation-reviewer
  content_types: markdown, python-docstrings, pyside6-ui
  docstring_format: google
  version_source: uv.lock
---

# Documentation Transformation and Implementation

This skill transforms documentation based on review suggestions into clear, accurate, and audience-appropriate content. It includes comprehensive validation to ensure quality before changes are applied.

## Capabilities

### Audience-Targeted Rewriting

- Rewrite sections for different audience levels (technical → general, beginner → API reference, etc.)
- Adjust tone, vocabulary, and example complexity for target audience
- Apply style guide rules from skill collection README
- Maintain terminology consistency throughout transformed docs
- Preserve technical accuracy while adjusting presentation

### Zensical Integration Updates

- Fix YAML frontmatter format and missing required fields
- Validate structure compliance with Zensical conventions
- Update/fix broken internal link references
- Verify asset paths and correct references
- Ensure SEO metadata is complete and correct

### Python Docstring Sync

- Auto-extract and update Python docstrings (Google style)
- Sync changes bidirectionally (code ↔ documentation)
- Validate docstring format consistency
- Ensure parameter descriptions match function signatures
- Keep return types and exceptions properly documented

### PySide6 UI Documentation Updates

- Update widget names in documentation to match current code
- Add missing UI component documentation
- Validate against current code inspection
- Keep signal/slot documentation in sync with code changes

### Validation Pipeline

1. **Diff Preview** — Shows proposed changes for user approval
   - Clear visualization of what will change
   - User can review before applying

2. **Static Validation** — Validates transformed artifacts:
   - YAML frontmatter compliance
   - Internal link validity
   - Asset path verification
   - Docstring format consistency

3. **Build Validation** — If applicable:
   - Zensical doc build test
   - Link integrity check
   - Asset availability verification

4. **Format Enforcement** — Ensures consistency:
   - Google-style docstring format
   - Zensical metadata requirements
   - Markdown syntax

## Input & Output

**Input**: File path(s) or directory with documentation, optionally with refactoring analysis

**Output**:
- Diff/preview of proposed changes (requires user approval)
- Transformed documentation (replaces original)
- Validation report showing test results and static analysis
- Implementation summary with notes on changes applied

## Automatic Configuration

Reads from `uv.lock`:
- Zensical version for structure compliance
- Python version for docstring extraction and syntax
- Dependencies referenced in documentation

## Safety & Reliability

- **Diff preview** allows user approval before changes applied
- **Validation pipeline** catches formatting issues and broken references
- **Build verification** ensures documentation remains valid
- **Docstring sync** maintains code/documentation consistency
- **No destructive surprises** — all changes reviewed before application
